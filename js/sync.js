// Syncs the store with one secret Gist through the GitHub API. No backend.
//   token: a classic GitHub token with only the `gist` scope, kept in this browser's storage
//   gist:  a secret gist holding neetcode-roadmap-progress.json = { v:1, items:{ id:{d,dt,n,nt} } }
// Everything the outside world touches (fetch, storage, timers) is injectable, so tests use fakes.

import { mergeItems, sameItems, sanitize } from './merge.js';
import { browserStorage } from './store.js';

export const FILE = 'neetcode-roadmap-progress.json';
const API = 'https://api.github.com';
const KEYS = { token: 'neetcode-roadmap:token', gist: 'neetcode-roadmap:gist' };
const DEBOUNCE_MS = 1500;
const RETRY_MS = 30000;

class SyncError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind; // 'offline' | 'rejected' | 'error'
  }
}

export function createSync({
  store,
  storage = browserStorage(),
  fetchImpl = (...args) => globalThis.fetch(...args),
  now = Date.now,
  setTimer = (fn, ms) => setTimeout(fn, ms),
  clearTimer = (id) => clearTimeout(id),
} = {}) {
  const listeners = new Set();
  let status = { state: 'local' };
  let running = false;
  let again = false;
  let debounceTimer = null;
  let retryTimer = null;

  const token = () => storage.getItem(KEYS.token) || '';

  function setStatus(next) {
    status = next;
    for (const fn of listeners) fn(status);
  }

  async function api(path, { method = 'GET', body } = {}) {
    let res;
    try {
      res = await fetchImpl(API + path, {
        method,
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          Authorization: `Bearer ${token()}`,
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        keepalive: method !== 'GET', // lets a last write finish while the tab is closing
      });
    } catch {
      throw new SyncError('offline', 'Can’t reach GitHub.');
    }
    if (res.status === 401) throw new SyncError('rejected', 'GitHub rejected the token. Create a new one and reconnect.');
    if (res.status === 403 || res.status === 429) {
      const limited = res.headers?.get?.('x-ratelimit-remaining') === '0' || res.status === 429;
      throw new SyncError('error', limited ? 'GitHub rate limit reached. It will retry later.' : 'GitHub refused the request. Check the token has the gist scope.');
    }
    return res;
  }

  function httpError(res) {
    return new SyncError('error', `GitHub returned ${res.status}.`);
  }

  const content = (items) => JSON.stringify({ v: 1, items });

  async function findGist() {
    for (let page = 1; page <= 10; page++) {
      const res = await api(`/gists?per_page=100&page=${page}`);
      if (!res.ok) throw httpError(res);
      const list = await res.json();
      const hit = list.find((g) => g.files && g.files[FILE]);
      if (hit) return hit.id;
      if (list.length < 100) return null;
    }
    return null;
  }

  async function createGist(items) {
    const res = await api('/gists', {
      method: 'POST',
      body: { description: 'NeetCode roadmap progress (ticks and notes)', public: false, files: { [FILE]: { content: content(items) } } },
    });
    if (res.status === 404) throw new SyncError('rejected', 'This token can’t create gists. Create a classic token with the gist scope.');
    if (!res.ok) throw httpError(res);
    return (await res.json()).id;
  }

  // Returns null when the gist no longer exists, otherwise { items, exists }.
  async function readGist(id) {
    const res = await api(`/gists/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw httpError(res);
    const file = (await res.json()).files?.[FILE];
    if (!file) return { items: {}, exists: false };
    if (file.truncated) throw new SyncError('error', 'The progress file in the gist is too large to read.');
    try {
      return { items: sanitize(JSON.parse(file.content).items), exists: true };
    } catch {
      throw new SyncError('error', 'The progress file in the gist is not valid JSON. It was left untouched.');
    }
  }

  async function writeGist(id, items) {
    const res = await api(`/gists/${id}`, { method: 'PATCH', body: { files: { [FILE]: { content: content(items) } } } });
    if (!res.ok) throw httpError(res);
  }

  // One round: find/create the gist, read it, merge, apply locally, and write back if it changed.
  async function cycle() {
    let id = storage.getItem(KEYS.gist);
    for (let attempt = 0; attempt < 2; attempt++) {
      if (!id) id = await findGist();
      if (!id) {
        id = await createGist(store.snapshot());
        storage.setItem(KEYS.gist, id);
        return;
      }
      storage.setItem(KEYS.gist, id);
      const remote = await readGist(id);
      if (remote === null) {
        storage.removeItem(KEYS.gist); // the gist was deleted: look again, or create a new one
        id = null;
        continue;
      }
      // snapshot -> merge -> replaceAll has no await in between, so a local edit can't slip through.
      const local = store.snapshot();
      const merged = mergeItems(local, remote.items);
      if (!sameItems(merged, local)) store.replaceAll(merged);
      if (!remote.exists || !sameItems(merged, remote.items)) await writeGist(id, merged);
      return;
    }
    throw new SyncError('error', 'Could not find or create the gist.');
  }

  async function syncNow() {
    if (!token()) {
      setStatus({ state: 'local' });
      return { ok: false, state: 'local', message: 'Not connected.' };
    }
    if (running) {
      again = true;
      return { ok: true, state: 'syncing' };
    }
    running = true;
    clearTimer(debounceTimer);
    clearTimer(retryTimer);
    debounceTimer = null;
    setStatus({ state: 'syncing' });
    try {
      do {
        again = false;
        await cycle();
      } while (again);
      setStatus({ state: 'synced', at: now() });
      return { ok: true, state: 'synced' };
    } catch (e) {
      const kind = e instanceof SyncError ? e.kind : 'error';
      const message = e instanceof SyncError ? e.message : 'Unexpected sync error.';
      setStatus({ state: kind, message });
      if (kind === 'offline') retryTimer = setTimer(syncNow, RETRY_MS);
      return { ok: false, state: kind, message };
    } finally {
      running = false;
    }
  }

  function schedule() {
    if (!token()) return;
    clearTimer(debounceTimer);
    debounceTimer = setTimer(syncNow, DEBOUNCE_MS);
  }

  return {
    syncNow,
    hasToken: () => !!token(),
    status: () => status,

    subscribe(fn) {
      listeners.add(fn);
      fn(status);
      return () => listeners.delete(fn);
    },

    start() {
      store.subscribe((source) => {
        if (source === 'local') schedule();
      });
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' || debounceTimer) syncNow();
        });
        addEventListener('online', syncNow);
      }
      if (token()) syncNow();
    },

    async connect(value) {
      const t = String(value || '').trim();
      if (!t) return { ok: false, state: 'error', message: 'Paste a token first.' };
      storage.setItem(KEYS.token, t);
      storage.removeItem(KEYS.gist);
      const result = await syncNow();
      if (result.state === 'rejected') storage.removeItem(KEYS.token);
      return result;
    },

    disconnect() {
      clearTimer(debounceTimer);
      clearTimer(retryTimer);
      storage.removeItem(KEYS.token);
      storage.removeItem(KEYS.gist);
      setStatus({ state: 'local' });
    },
  };
}
