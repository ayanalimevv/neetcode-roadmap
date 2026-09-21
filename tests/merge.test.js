import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeItems, sameItems, sanitize } from '../js/merge.js';

const rec = (d, dt, n = '', nt = 0, r = 0, rt = 0) => ({ d, dt, n, nt, r, rt });

test('two devices editing different problems keep both edits', () => {
  const a = { 'arr-two-sum': rec(1, 100) };
  const b = { 'bt-subsets': rec(1, 200, 'include/exclude') };
  const merged = mergeItems(a, b);
  assert.equal(merged['arr-two-sum'].d, 1);
  assert.deepEqual(merged['bt-subsets'], rec(1, 200, 'include/exclude', 0));
});

test('an untick with a newer time beats an older tick, so it propagates', () => {
  const ticked = { p: rec(1, 100) };
  const unticked = { p: rec(0, 200) };
  assert.equal(mergeItems(ticked, unticked).p.d, 0);
  assert.equal(mergeItems(unticked, ticked).p.d, 0);
});

test('an older edit never overwrites a newer one', () => {
  const merged = mergeItems({ p: rec(1, 500) }, { p: rec(0, 100) });
  assert.equal(merged.p.d, 1);
});

test('tick and note are merged separately for the same problem', () => {
  const deviceA = { p: rec(1, 300, '', 0) };                 // ticked on A
  const deviceB = { p: rec(0, 0, 'use a Map', 400) };        // note written on B
  const merged = mergeItems(deviceA, deviceB);
  assert.deepEqual(merged.p, rec(1, 300, 'use a Map', 400));
});

test('the revisit star merges on its own, without disturbing the tick or the note', () => {
  const deviceA = { p: rec(1, 300, 'a note', 310) };                  // ticked and noted on A
  const deviceB = { p: rec(0, 0, '', 0, 1, 400) };                     // starred on B
  assert.deepEqual(mergeItems(deviceA, deviceB).p, rec(1, 300, 'a note', 310, 1, 400));
  assert.deepEqual(mergeItems(deviceB, deviceA).p, rec(1, 300, 'a note', 310, 1, 400));
});

test('un-starring with a newer time beats an older star', () => {
  const starred = { p: rec(0, 0, '', 0, 1, 100) };
  const cleared = { p: rec(0, 0, '', 0, 0, 200) };
  assert.equal(mergeItems(starred, cleared).p.r, 0);
  assert.equal(mergeItems(cleared, starred).p.r, 0);
});

test('records saved before the star existed read as not starred', () => {
  const old = { p: { d: 1, dt: 50, n: 'x', nt: 60 } };                 // no r / rt
  assert.deepEqual(sanitize(old).p, rec(1, 50, 'x', 60, 0, 0));
  assert.deepEqual(mergeItems(old, {}).p, rec(1, 50, 'x', 60, 0, 0));
});

test('merge is symmetric, including on exact timestamp ties', () => {
  const x = { p: rec(1, 100, 'a', 100) };
  const y = { p: rec(0, 100, 'b', 100) };
  assert.deepEqual(mergeItems(x, y), mergeItems(y, x));
});

test('merging is idempotent', () => {
  const x = { p: rec(1, 100, 'a', 90), q: rec(0, 50) };
  const once = mergeItems(x, {});
  assert.ok(sameItems(mergeItems(once, x), once));
});

test('sanitize drops bad ids and coerces bad values', () => {
  const dirty = JSON.parse('{"__proto__": {"d": 1}, "Bad Id": {"d": 1}, "ok-id": {"d": "yes", "dt": "x", "n": 5, "nt": -3}, "nul": null}');
  const clean = sanitize(dirty);
  assert.deepEqual(Object.keys(clean), ['ok-id']);
  assert.deepEqual(clean['ok-id'], rec(1, 0, '', 0));
  assert.equal(Object.getPrototypeOf(clean), Object.prototype);
});

test('sanitize truncates very long notes', () => {
  assert.equal(sanitize({ p: { d: 0, dt: 1, n: 'x'.repeat(2000), nt: 1 } }).p.n.length, 500);
});

test('sameItems compares every field', () => {
  assert.ok(sameItems({ p: rec(1, 1, 'a', 1) }, { p: rec(1, 1, 'a', 1) }));
  assert.ok(!sameItems({ p: rec(1, 1, 'a', 1) }, { p: rec(1, 1, 'b', 1) }));
  assert.ok(!sameItems({ p: rec(1, 1) }, {}));
  assert.ok(!sameItems({ p: rec(0, 0, '', 0, 1, 5) }, { p: rec(0, 0, '', 0, 0, 5) }));
});
