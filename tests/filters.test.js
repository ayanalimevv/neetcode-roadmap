import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyFilters } from '../js/filters.js';

// Minimal stand-ins for the DOM nodes the filter touches.
const row = (diff, q, done = false) => ({ dataset: { diff, q }, classList: { contains: (c) => c === 'done' && done }, hidden: false });
const block = (topic, rows) => ({ dataset: { topic }, hidden: false, querySelectorAll: () => rows });

function fixture() {
  const rows = {
    twoSum: row('E', 'two sum hash map complement arrays & hashing', true),
    groupAna: row('M', 'group anagrams canonical key arrays & hashing'),
    islands: row('M', 'number of islands grid dfs graphs'),
    ladder: row('H', 'word ladder bfs graphs', true),
  };
  const blocks = [block('arr', [rows.twoSum, rows.groupAna]), block('gr', [rows.islands, rows.ladder])];
  const visible = () => Object.entries(rows).filter(([, r]) => !r.hidden).map(([k]) => k);
  return { rows, blocks, visible };
}

test('no filters shows everything', () => {
  const { blocks, visible } = fixture();
  assert.equal(applyFilters(blocks, {}), 4);
  assert.equal(visible().length, 4);
});

test('search matches name, pattern and topic text, ignoring case and spaces at the ends', () => {
  const { blocks, visible } = fixture();
  assert.equal(applyFilters(blocks, { text: '  DFS ' }), 1);
  assert.deepEqual(visible(), ['islands']);
  assert.equal(applyFilters(blocks, { text: 'graphs' }), 2);
});

test('topic and difficulty filters combine', () => {
  const { blocks, visible } = fixture();
  assert.equal(applyFilters(blocks, { topic: 'gr' }), 2);
  assert.equal(applyFilters(blocks, { topic: 'gr', diff: 'H' }), 1);
  assert.deepEqual(visible(), ['ladder']);
  assert.equal(applyFilters(blocks, { diff: 'M' }), 2);
});

test('status filter separates done from to do', () => {
  const { blocks, visible } = fixture();
  assert.equal(applyFilters(blocks, { status: 'done' }), 2);
  assert.deepEqual(visible(), ['twoSum', 'ladder']);
  assert.equal(applyFilters(blocks, { status: 'todo' }), 2);
  assert.deepEqual(visible(), ['groupAna', 'islands']);
});

test('a topic block with no visible rows is hidden, and comes back when the filter clears', () => {
  const { blocks } = fixture();
  applyFilters(blocks, { text: 'word ladder' });
  assert.equal(blocks[0].hidden, true);
  assert.equal(blocks[1].hidden, false);
  applyFilters(blocks, {});
  assert.equal(blocks[0].hidden, false);
});

test('no matches returns 0', () => {
  const { blocks } = fixture();
  assert.equal(applyFilters(blocks, { text: 'zzz' }), 0);
});
