import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreItem, search } from '../js/search.js';

const item = (title, sub = '', keywords = '') => ({ title, sub, keywords });

test('no match scores 0, and an empty query scores 0', () => {
  assert.equal(scoreItem('zzz', item('Two Sum')), 0);
  assert.equal(scoreItem('', item('Two Sum')), 0);
  assert.equal(scoreItem('  ', item('Two Sum')), 0);
});

test('a title prefix beats a word start, which beats a substring, which beats extra text', () => {
  const prefix = scoreItem('two', item('Two Sum'));
  const wordStart = scoreItem('sum', item('Two Sum'));
  const inside = scoreItem('wo', item('Two Sum'));
  const extra = scoreItem('hash', item('Two Sum', 'Arrays & Hashing', 'hash map'));
  assert.ok(prefix > wordStart && wordStart > inside && inside > extra && extra > 0, [prefix, wordStart, inside, extra].join(' '));
});

test('every word must match, in any order', () => {
  assert.ok(scoreItem('sum two', item('Two Sum')) > 0);
  assert.equal(scoreItem('two banana', item('Two Sum')), 0);
});

test('matching ignores case and punctuation', () => {
  assert.ok(scoreItem('N-QUEENS', item('N-Queens')) > 0);
  assert.ok(scoreItem('pow x n', item('Pow(x, n)')) > 0);
});

test('an exact title match gets a bonus', () => {
  assert.ok(scoreItem('stack', item('Stack')) > scoreItem('stack', item('Stack overflow tricks')));
});

test('search ranks, keeps ties in original order, and respects the limit', () => {
  const items = [item('Binary Search'), item('Search a 2D Matrix'), item('Word Search'), item('Word Search II'), item('Stack')];
  assert.deepEqual(search(items, 'search').map((i) => i.title), ['Search a 2D Matrix', 'Binary Search', 'Word Search', 'Word Search II']);
  assert.equal(search(items, 'search', 2).length, 2);
  assert.deepEqual(search(items, 'nothing here'), []);
});

test('the pattern tag and hint text can be found, but rank below the title', () => {
  const items = [item('Rotting Oranges', 'Graphs', 'multi-source BFS level-by-level'), item('Word Ladder', 'Graphs', 'BFS')];
  const found = search(items, 'bfs').map((i) => i.title);
  assert.deepEqual(found, ['Rotting Oranges', 'Word Ladder']);
  assert.deepEqual(search([item('BFS basics'), ...items], 'bfs')[0].title, 'BFS basics');
});
