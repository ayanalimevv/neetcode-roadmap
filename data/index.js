// The ordered registry of topics (NeetCode's own order). Each topic file lives in ./topics.
// A problem is written as [name, difficulty, hint, learnTag?] and gets its id here, so ids stay
// stable as long as a problem's name does: that id is the key for saved ticks and notes.

import arrays from './topics/01-arrays-hashing.js';
import twoPointers from './topics/02-two-pointers.js';
import stack from './topics/03-stack.js';
import binarySearch from './topics/04-binary-search.js';
import slidingWindow from './topics/05-sliding-window.js';
import linkedList from './topics/06-linked-list.js';
import trees from './topics/07-trees.js';
import tries from './topics/08-tries.js';
import heap from './topics/09-heap-priority-queue.js';
import backtracking from './topics/10-backtracking.js';
import graphs from './topics/11-graphs.js';
import advancedGraphs from './topics/12-advanced-graphs.js';
import dp1 from './topics/13-1d-dp.js';
import dp2 from './topics/14-2d-dp.js';
import greedy from './topics/15-greedy.js';
import intervals from './topics/16-intervals.js';
import math from './topics/17-math-geometry.js';
import bits from './topics/18-bit-manipulation.js';

export const GROUPS = {
  found: 'Foundations',
  struct: 'Data structures',
  search: 'Search and graphs',
  dp: 'DP and greedy',
  misc: 'The rest',
};

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const problemId = (topicId, name) => `${topicId}-${slugify(name)}`;

const RAW = [arrays, twoPointers, stack, binarySearch, slidingWindow, linkedList, trees, tries, heap,
  backtracking, graphs, advancedGraphs, dp1, dp2, greedy, intervals, math, bits];

export const TOPICS = RAW.map((t) => {
  const groups = t.groups.map((g) => ({
    ...g,
    items: g.items.map(([name, diff, hint, learn]) => ({ id: problemId(t.id, name), name, diff, hint, learn })),
  }));
  return { ...t, groups, problems: groups.flatMap((g) => g.items) };
});

export const TOTAL = TOPICS.reduce((n, t) => n + t.problems.length, 0);
