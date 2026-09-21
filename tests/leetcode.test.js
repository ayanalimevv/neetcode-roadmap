// Offline checks on data/leetcode.js, which scripts/leetcode-links.mjs generated from LeetCode's own API.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROBLEMS, TOTAL } from '../data/index.js';
import { LEETCODE, leetcodeUrl } from '../data/leetcode.js';

// The problems LeetCode puts behind Premium, verified on 2026-09-21.
const PREMIUM = [
  'Encode and Decode Strings', 'Walls And Gates', 'Number of Connected Components In An Undirected Graph',
  'Graph Valid Tree', 'Alien Dictionary', 'Meeting Rooms', 'Meeting Rooms II',
];

test('every problem has LeetCode details, and nothing extra is listed', () => {
  assert.equal(TOTAL, 150);
  for (const p of PROBLEMS) assert.ok(p.lc, `no LeetCode entry for ${p.id}`);
  assert.deepEqual(Object.keys(LEETCODE).sort(), PROBLEMS.map((p) => p.id).sort());
});

test('slugs, numbers and URLs are well-formed and unique', () => {
  const slugs = new Set();
  for (const p of PROBLEMS) {
    assert.match(p.lc.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, p.id);
    assert.ok(Number.isInteger(p.lc.n) && p.lc.n > 0, `${p.id} number`);
    assert.equal(p.lc.url, `https://leetcode.com/problems/${p.lc.slug}/`);
    assert.ok(!slugs.has(p.lc.slug), `duplicate slug ${p.lc.slug}`);
    slugs.add(p.lc.slug);
  }
});

test('exactly the seven known Premium problems are flagged', () => {
  const flagged = PROBLEMS.filter((p) => p.lc.premium).map((p) => p.name).sort();
  assert.deepEqual(flagged, [...PREMIUM].sort());
});

test('a few well-known numbers are right', () => {
  const byName = Object.fromEntries(PROBLEMS.map((p) => [p.name, p.lc.n]));
  assert.equal(byName['Two Sum'], 1);
  assert.equal(byName['Valid Parentheses'], 20);
  assert.equal(byName['Number of Islands'], 200);
  assert.equal(byName['LRU Cache'], 146);
  assert.equal(byName['Edit Distance'], 72);
});

test('leetcodeUrl builds the problem page URL', () => {
  assert.equal(leetcodeUrl('two-sum'), 'https://leetcode.com/problems/two-sum/');
});
