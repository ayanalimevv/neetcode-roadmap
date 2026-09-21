// Tests the Gist sync engine against a fake GitHub API, so no network or token is needed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, memoryStorage } from '../js/store.js';
import { createSync, FILE } from '../js/sync.js';

function fakeGitHub(goodToken = 'good') {
  const gists = new Map();
  let nextId = 1;
  const server = { online: true, gists, calls: [] };
  const reply = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body, headers: { get: () => null } });

  server.fetch = async (url, opts = {}) => {
    if (!server.online) throw new TypeError('network down');
    const path = url.replace('https://api.github.com', '');
    const method = opts.method || 'GET';
    server.calls.push(`${method} ${path.split('?')[0]}`);
    if (opts.headers.Authorization !== `Bearer ${goodToken}`) return reply(401, { message: 'Bad credentials' });

    if (method === 'GET' && path.startsWith('/gists?')) {
      const page = Number(/[?&]page=(\d+)/.exec(path)[1]);   // not "per_page="
      const list = [...gists].map(([id, g]) => ({ id, files: Object.fromEntries(Object.keys(g.files).map((f) => [f, { filename: f }])) }));
      return reply(200, list.slice((page - 1) * 100, page * 100));
    }
    if (method === 'POST' && path === '/gists') {
      const body = JSON.parse(opts.body);
      const id = `g${nextId++}`;
      gists.set(id, { public: body.public, description: body.description, files: structuredClone(body.files) });
      return reply(201, { id });
    }
    const m = /^\/gists\/(\w+)$/.exec(path);
    if (m) {
      const g = gists.get(m[1]);
      if (!g) return reply(404, { message: 'Not Found' });
      if (method === 'GET') {
        const files = Object.fromEntries(Object.entries(g.files).map(([n, f]) => [n, { content: f.content, truncated: false }]));
        return reply(200, { id: m[1], files });
      }
      if (method === 'PATCH') {
        Object.assign(g.files, JSON.parse(opts.body).files);
        return reply(200, { id: m[1] });
      }
    }
    return reply(404, { message: 'Not Found' });
  };
  return server;
}

function device(server, token = 'good') {
  const storage = memoryStorage();
  const store = createStore({ storage });
  const timers = new Map();
  let nextTimer = 1;
  const sync = createSync({
    store,
    storage,
    fetchImpl: server.fetch,
    now: () => 12345,
    setTimer: (fn, ms) => { timers.set(nextTimer, { fn, ms }); return nextTimer++; },
    clearTimer: (id) => timers.delete(id),
  });
  return { store, storage, sync, timers, connect: () => sync.connect(token) };
}

const gistItems = (server) => JSON.parse([...server.gists.values()][0].files[FILE].content).items;
const settle = async (sync) => { for (let i = 0; i < 1000 && sync.status().state === 'syncing'; i++) await new Promise((r) => setImmediate(r)); };

test('connecting creates one secret gist holding local progress', async () => {
  const server = fakeGitHub();
  const a = device(server);
  a.store.setDone('arr-two-sum', true);
  a.store.setNote('arr-two-sum', 'complement');
  const result = await a.connect();

  assert.equal(result.ok, true);
  assert.equal(server.gists.size, 1);
  assert.equal([...server.gists.values()][0].public, false);
  assert.equal(gistItems(server)['arr-two-sum'].d, 1);
  assert.equal(gistItems(server)['arr-two-sum'].n, 'complement');
  assert.equal(a.sync.status().state, 'synced');
  assert.equal(a.sync.hasToken(), true);
});

test('a second device finds the gist and receives ticks and notes', async () => {
  const server = fakeGitHub();
  const a = device(server);
  a.store.setDone('bt-subsets', true);
  a.store.setNote('bt-subsets', 'draw the tree');
  await a.connect();

  const b = device(server);
  await b.connect();
  assert.equal(server.gists.size, 1, 'B must reuse the gist, not create another');
  assert.equal(b.store.isDone('bt-subsets'), true);
  assert.equal(b.store.note('bt-subsets'), 'draw the tree');
});

test('edits to different problems on two devices both survive', async () => {
  const server = fakeGitHub();
  const a = device(server);
  const b = device(server);
  await a.connect();
  await b.connect();

  a.store.setDone('gr-clone-graph', true);
  b.store.setDone('dp1-house-robber', true);
  await a.sync.syncNow();
  await b.sync.syncNow();
  await a.sync.syncNow();

  for (const d of [a, b]) {
    assert.equal(d.store.isDone('gr-clone-graph'), true);
    assert.equal(d.store.isDone('dp1-house-robber'), true);
  }
});

test('unticking on one device unticks on the other', async () => {
  const server = fakeGitHub();
  const a = device(server);
  a.store.setDone('gd-jump-game', true);
  await a.connect();
  const b = device(server);
  await b.connect();
  assert.equal(b.store.isDone('gd-jump-game'), true);

  b.store.setDone('gd-jump-game', false);
  await b.sync.syncNow();
  await a.sync.syncNow();
  assert.equal(a.store.isDone('gd-jump-game'), false);
});

test('a rejected token is removed, and local progress is left alone', async () => {
  const server = fakeGitHub('good');
  const a = device(server, 'wrong');
  a.store.setDone('arr-two-sum', true);
  const result = await a.connect();

  assert.equal(result.state, 'rejected');
  assert.equal(a.sync.hasToken(), false);
  assert.equal(a.store.isDone('arr-two-sum'), true);
  assert.equal(server.gists.size, 0);
});

test('offline: shows offline, schedules a retry, and catches up when the network returns', async () => {
  const server = fakeGitHub();
  const a = device(server);
  await a.connect();

  server.online = false;
  a.store.setDone('int-merge-intervals', true);
  const offline = await a.sync.syncNow();
  assert.equal(offline.state, 'offline');
  assert.equal(a.sync.status().state, 'offline');
  assert.equal([...a.timers.values()].some((t) => t.ms === 30000), true, 'a retry is scheduled');
  assert.equal(a.store.isDone('int-merge-intervals'), true, 'local data is untouched');

  server.online = true;
  const retry = [...a.timers.values()].find((t) => t.ms === 30000);
  await retry.fn();
  assert.equal(a.sync.status().state, 'synced');
  assert.equal(gistItems(server)['int-merge-intervals'].d, 1);
});

test('if the gist was deleted, sync recreates it from local progress', async () => {
  const server = fakeGitHub();
  const a = device(server);
  a.store.setDone('trie-implement-trie-prefix-tree', true);
  await a.connect();
  server.gists.clear();

  const result = await a.sync.syncNow();
  assert.equal(result.ok, true);
  assert.equal(server.gists.size, 1);
  assert.equal(gistItems(server)['trie-implement-trie-prefix-tree'].d, 1);
});

test('a corrupt progress file is reported and never overwritten', async () => {
  const server = fakeGitHub();
  const a = device(server);
  await a.connect();
  const gist = [...server.gists.values()][0];
  gist.files[FILE].content = '{not json';

  a.store.setDone('arr-two-sum', true);
  const result = await a.sync.syncNow();
  assert.equal(result.state, 'error');
  assert.equal(gist.files[FILE].content, '{not json');
  assert.equal(a.store.isDone('arr-two-sum'), true);
});

test('edits are debounced, then pushed', async () => {
  const server = fakeGitHub();
  const a = device(server);
  await a.connect();
  a.sync.start();
  await settle(a.sync);

  a.store.setDone('heap-last-stone-weight', true);
  a.store.setNote('heap-last-stone-weight', 'max-heap');
  const pending = [...a.timers.values()].filter((t) => t.ms === 1500);
  assert.equal(pending.length, 1, 'rapid edits share one pending sync');

  await pending[0].fn();
  assert.equal(gistItems(server)['heap-last-stone-weight'].d, 1);
  assert.equal(gistItems(server)['heap-last-stone-weight'].n, 'max-heap');
});

test('an edit made while a sync is in flight is not lost', async () => {
  const server = fakeGitHub();
  const a = device(server);
  await a.connect();

  const realFetch = server.fetch;
  let injected = false;
  server.fetch = async (url, opts = {}) => {
    const res = await realFetch(url, opts);
    if (!injected && (opts.method || 'GET') === 'GET' && /^https:\/\/api\.github\.com\/gists\/\w+$/.test(url)) {
      injected = true;
      a.store.setDone('late-edit', true);    // the user ticks something mid-sync
    }
    return res;
  };
  // rebuild the sync so it uses the wrapped fetch
  const sync = createSync({ store: a.store, storage: a.storage, fetchImpl: server.fetch, setTimer: () => 0, clearTimer: () => {} });
  await sync.syncNow();

  assert.equal(a.store.isDone('late-edit'), true);
  assert.equal(gistItems(server)['late-edit'].d, 1);
});

test('disconnect forgets the token and returns to local only', async () => {
  const server = fakeGitHub();
  const a = device(server);
  await a.connect();
  a.sync.disconnect();
  assert.equal(a.sync.hasToken(), false);
  assert.equal(a.sync.status().state, 'local');
  assert.equal((await a.sync.syncNow()).state, 'local');
});

test('connecting with an empty token asks for one', async () => {
  const a = device(fakeGitHub());
  const result = await a.sync.connect('   ');
  assert.equal(result.ok, false);
  assert.match(result.message, /token/i);
});
