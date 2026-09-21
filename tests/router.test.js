import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHash } from '../js/router.js';

const slugs = ['graphs', 'backtracking', '1d-dp'];

test('empty hash and "#/" are home', () => {
  assert.deepEqual(parseHash('', slugs), { name: 'home' });
  assert.deepEqual(parseHash('#/', slugs), { name: 'home' });
});

test('a known slug opens that topic, with or without a trailing slash', () => {
  assert.deepEqual(parseHash('#/graphs', slugs), { name: 'topic', slug: 'graphs' });
  assert.deepEqual(parseHash('#/1d-dp/', slugs), { name: 'topic', slug: '1d-dp' });
});

test('"#/all" is the all-problems page', () => {
  assert.deepEqual(parseHash('#/all', slugs), { name: 'all' });
  assert.deepEqual(parseHash('#/all/', slugs), { name: 'all' });
});

test('"#/all/revisit" is the all-problems page pre-filtered to starred problems', () => {
  assert.deepEqual(parseHash('#/all/revisit', slugs), { name: 'all', filter: 'revisit' });
  assert.deepEqual(parseHash('#/all/revisit/', slugs), { name: 'all', filter: 'revisit' });
  assert.deepEqual(parseHash('#/all/other', slugs), { name: 'home' });
});

test('unknown or odd hashes fall back to home', () => {
  assert.deepEqual(parseHash('#/nope', slugs), { name: 'home' });
  assert.deepEqual(parseHash('#graphs', slugs), { name: 'home' });
  assert.deepEqual(parseHash('#/graphs/extra', slugs), { name: 'home' });
  assert.deepEqual(parseHash('#/<script>', slugs), { name: 'home' });
});
