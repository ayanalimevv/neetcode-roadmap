import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, memoryStorage } from '../js/store.js';

test('ticks and notes survive a reload (a new store on the same storage)', () => {
  const storage = memoryStorage();
  const a = createStore({ storage });
  a.setDone('arr-two-sum', true);
  a.setNote('arr-two-sum', 'store the complement');
  const b = createStore({ storage });
  assert.equal(b.isDone('arr-two-sum'), true);
  assert.equal(b.note('arr-two-sum'), 'store the complement');
});

test('timestamps strictly increase even when the clock does not move', () => {
  const s = createStore({ storage: memoryStorage(), now: () => 1000 });
  s.setDone('p', true);
  const t1 = s.snapshot().p.dt;
  s.setDone('p', false);
  const t2 = s.snapshot().p.dt;
  assert.ok(t2 > t1);
});

test('a device whose clock is behind never issues a timestamp older than one it has seen', () => {
  const s = createStore({ storage: memoryStorage(), now: () => 1000 });       // this clock is slow
  s.replaceAll({ p: { d: 1, dt: 9_000, n: '', nt: 0 } });                     // the other device ticked at 9000
  s.setDone('p', false);
  assert.ok(s.snapshot().p.dt > 9_000, 'the untick must sort after the tick it saw');
});

test('after a reload the clock floor is restored from saved records', () => {
  const storage = memoryStorage();
  createStore({ storage, now: () => 5_000 }).setDone('p', true);
  const reloaded = createStore({ storage, now: () => 1_000 });                // clock jumped backwards
  reloaded.setDone('p', false);
  assert.ok(reloaded.snapshot().p.dt > 5_000);
});

test('an empty note on an untouched problem creates no record', () => {
  const s = createStore({ storage: memoryStorage() });
  s.setNote('p', '');
  assert.deepEqual(s.snapshot(), {});
});

test('unticking keeps a record, so the untick can reach other devices', () => {
  const s = createStore({ storage: memoryStorage() });
  s.setDone('p', true);
  s.setDone('p', false);
  assert.equal(s.snapshot().p.d, 0);
  assert.ok(s.snapshot().p.dt > 0);
});

test('local edits emit "local" and replaceAll emits "remote"', () => {
  const s = createStore({ storage: memoryStorage() });
  const seen = [];
  s.subscribe((src) => seen.push(src));
  s.setDone('p', true);
  s.replaceAll({ q: { d: 1, dt: 5, n: '', nt: 0 } });
  assert.deepEqual(seen, ['local', 'remote']);
  assert.equal(s.isDone('q'), true);
  assert.equal(s.isDone('p'), false);
});

test('doneCount counts only the given ids', () => {
  const s = createStore({ storage: memoryStorage() });
  s.setDone('a', true);
  s.setDone('b', true);
  s.setDone('c', false);
  assert.equal(s.doneCount(['a', 'c', 'zzz']), 1);
});

test('corrupt saved data is ignored instead of crashing', () => {
  const storage = memoryStorage();
  storage.setItem('neetcode-roadmap:v1', '{not json');
  assert.deepEqual(createStore({ storage }).snapshot(), {});
});

test('a storage that throws still works in memory', () => {
  const broken = { getItem: () => null, setItem: () => { throw new Error('quota'); }, removeItem: () => {} };
  const s = createStore({ storage: broken });
  s.setDone('p', true);
  assert.equal(s.isDone('p'), true);
});
