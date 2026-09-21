// Runs every code snippet shown on the site, on tiny inputs, so nothing wrong gets published.
// A snippet is loaded with `new Function` together with the snippets it `needs`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOPICS } from '../data/index.js';

const SNIPPETS = new Map(TOPICS.flatMap((t) => t.snippets).map((s) => [s.id, s]));

function load(id, names) {
  const seen = new Set();
  const parts = [];
  (function collect(sid) {
    if (seen.has(sid)) return;
    seen.add(sid);
    const s = SNIPPETS.get(sid);
    for (const n of s.needs ?? []) collect(n);
    parts.push(s.code);
  })(id);
  return new Function(`${parts.join('\n')}\nreturn { ${names.join(', ')} };`)();
}

// tree helpers: build from LeetCode's level-order array
function buildTree(arr, TreeNode) {
  if (!arr.length || arr[0] === null) return null;
  const root = new TreeNode(arr[0]);
  const queue = [root];
  let i = 1;
  for (let head = 0; head < queue.length && i < arr.length; head++) {
    const node = queue[head];
    if (arr[i] !== null && arr[i] !== undefined) queue.push((node.left = new TreeNode(arr[i])));
    i++;
    if (i < arr.length && arr[i] !== null) queue.push((node.right = new TreeNode(arr[i])));
    i++;
  }
  return root;
}
const fromArray = (vals, ListNode) => vals.reduceRight((next, v) => new ListNode(v, next), null);
const toArray = (head) => { const out = []; for (; head; head = head.next) out.push(head.val); return out; };

const CASES = {
  'arr-two-sum': { names: ['twoSum'], run({ twoSum }) {
    assert.deepEqual(twoSum([2, 7, 11, 15], 9), [0, 1]);
    assert.deepEqual(twoSum([3, 2, 4], 6), [1, 2]);
    assert.deepEqual(twoSum([3, 3], 6), [0, 1]);
    assert.deepEqual(twoSum([1, 2], 10), []);
  } },
  'arr-group-anagrams': { names: ['groupAnagrams'], run({ groupAnagrams }) {
    const norm = (g) => g.map((x) => [...x].sort()).sort();
    assert.deepEqual(norm(groupAnagrams(['eat', 'tea', 'tan', 'ate', 'nat', 'bat'])), norm([['bat'], ['nat', 'tan'], ['ate', 'eat', 'tea']]));
  } },
  'tp-three-sum': { names: ['threeSum'], run({ threeSum }) {
    assert.deepEqual(threeSum([-1, 0, 1, 2, -1, -4]), [[-1, -1, 2], [-1, 0, 1]]);
    assert.deepEqual(threeSum([0, 0, 0, 0]), [[0, 0, 0]]);
    assert.deepEqual(threeSum([1, 2, 3]), []);
  } },
  'tp-max-area': { names: ['maxArea'], run({ maxArea }) {
    assert.equal(maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7]), 49);
    assert.equal(maxArea([1, 1]), 1);
  } },
  'stk-valid-parens': { names: ['isValid'], run({ isValid }) {
    assert.equal(isValid('()[]{}'), true);
    assert.equal(isValid('{[]}'), true);
    assert.equal(isValid('(]'), false);
    assert.equal(isValid('('), false);
    assert.equal(isValid(')'), false);
  } },
  'stk-daily-temps': { names: ['dailyTemperatures'], run({ dailyTemperatures }) {
    assert.deepEqual(dailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73]), [1, 1, 4, 2, 1, 1, 0, 0]);
  } },
  'bs-search': { names: ['search'], run({ search }) {
    assert.equal(search([-1, 0, 3, 5, 9, 12], 9), 4);
    assert.equal(search([-1, 0, 3, 5, 9, 12], 2), -1);
    assert.equal(search([5], 5), 0);
  } },
  'bs-koko': { names: ['minEatingSpeed'], run({ minEatingSpeed }) {
    assert.equal(minEatingSpeed([3, 6, 7, 11], 8), 4);
    assert.equal(minEatingSpeed([30, 11, 23, 4, 20], 5), 30);
    assert.equal(minEatingSpeed([30, 11, 23, 4, 20], 6), 23);
  } },
  'sw-longest-substring': { names: ['lengthOfLongestSubstring'], run({ lengthOfLongestSubstring: f }) {
    assert.equal(f('abcabcbb'), 3);
    assert.equal(f('bbbbb'), 1);
    assert.equal(f('pwwkew'), 3);
    assert.equal(f(''), 0);
  } },
  'sw-max-window': { names: ['maxSlidingWindow'], run({ maxSlidingWindow }) {
    assert.deepEqual(maxSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3), [3, 3, 5, 5, 6, 7]);
    assert.deepEqual(maxSlidingWindow([1], 1), [1]);
    assert.deepEqual(maxSlidingWindow([9, 8, 7, 6], 2), [9, 8, 7]);
  } },
  'll-basics': { names: ['ListNode', 'reverseList', 'hasCycle'], run({ ListNode, reverseList, hasCycle }) {
    assert.deepEqual(toArray(reverseList(fromArray([1, 2, 3, 4], ListNode))), [4, 3, 2, 1]);
    assert.equal(reverseList(null), null);
    assert.equal(hasCycle(fromArray([1, 2, 3], ListNode)), false);
    const head = fromArray([1, 2, 3, 4], ListNode);
    head.next.next.next.next = head.next;     // 4 -> 2
    assert.equal(hasCycle(head), true);
  } },
  'll-merge': { names: ['ListNode', 'mergeTwoLists'], run({ ListNode, mergeTwoLists }) {
    assert.deepEqual(toArray(mergeTwoLists(fromArray([1, 2, 4], ListNode), fromArray([1, 3, 4], ListNode))), [1, 1, 2, 3, 4, 4]);
    assert.deepEqual(toArray(mergeTwoLists(null, fromArray([0], ListNode))), [0]);
    assert.equal(mergeTwoLists(null, null), null);
  } },
  'tree-basics': { names: ['TreeNode', 'maxDepth', 'levelOrder'], run({ TreeNode, maxDepth, levelOrder }) {
    const t = buildTree([3, 9, 20, null, null, 15, 7], TreeNode);
    assert.equal(maxDepth(t), 3);
    assert.deepEqual(levelOrder(t), [[3], [9, 20], [15, 7]]);
    assert.equal(maxDepth(null), 0);
    assert.deepEqual(levelOrder(null), []);
  } },
  'tree-valid-bst': { names: ['isValidBST'], run({ isValidBST }) {
    const { TreeNode } = load('tree-basics', ['TreeNode']);
    assert.equal(isValidBST(buildTree([2, 1, 3], TreeNode)), true);
    assert.equal(isValidBST(buildTree([5, 1, 4, null, null, 3, 6], TreeNode)), false);
    assert.equal(isValidBST(buildTree([5, 4, 6, null, null, 3, 7], TreeNode)), false); // 3 breaks the root's bound
    assert.equal(isValidBST(null), true);
  } },
  'trie-class': { names: ['Trie'], run({ Trie }) {
    const t = new Trie();
    t.insert('apple');
    assert.equal(t.search('apple'), true);
    assert.equal(t.search('app'), false);
    assert.equal(t.startsWith('app'), true);
    assert.equal(t.startsWith('b'), false);
    t.insert('app');
    assert.equal(t.search('app'), true);
  } },
  'heap-minheap': { names: ['MinHeap'], run({ MinHeap }) {
    const vals = [5, 3, 8, 1, 9, 2, 7, 2, 0, 6];
    const h = new MinHeap();
    vals.forEach((v) => h.push(v));
    const out = [];
    while (h.size) out.push(h.pop());
    assert.deepEqual(out, [...vals].sort((a, b) => a - b));
    assert.equal(new MinHeap().pop(), undefined);

    const max = new MinHeap((a, b) => b - a);           // max-heap
    vals.forEach((v) => max.push(v));
    assert.equal(max.pop(), 9);

    const pairs = new MinHeap((a, b) => a[0] - b[0]);    // [priority, value]
    pairs.push([3, 'c']); pairs.push([1, 'a']); pairs.push([2, 'b']);
    assert.deepEqual(pairs.pop(), [1, 'a']);
  } },
  'heap-kth-largest': { names: ['KthLargest'], run({ KthLargest }) {
    const k = new KthLargest(3, [4, 5, 8, 2]);
    assert.deepEqual([3, 5, 10, 9, 4].map((v) => k.add(v)), [4, 5, 5, 8, 8]);
  } },
  'bt-loop': { names: ['subsets'], run({ subsets }) {
    const out = subsets([1, 2, 3]).map((s) => s.join('')).sort();
    assert.deepEqual(out, ['', '1', '12', '123', '13', '2', '23', '3']);
  } },
  'bt-include-exclude': { names: ['subsetsIncludeExclude'], run({ subsetsIncludeExclude }) {
    const out = subsetsIncludeExclude([1, 2, 3]).map((s) => s.join('')).sort();
    assert.deepEqual(out, ['', '1', '12', '123', '13', '2', '23', '3']);
  } },
  'gr-bfs': { names: ['buildGraph', 'bfs'], run({ buildGraph, bfs }) {
    const g = buildGraph([[1, 2], [2, 3], [4, 5]]);
    assert.deepEqual([...bfs(g, 1)].sort(), [1, 2, 3]);
    assert.deepEqual([...bfs(g, 4)].sort(), [4, 5]);
  } },
  'gr-grid': { names: ['countIslands'], run({ countIslands }) {
    assert.equal(countIslands([['1', '1', '0', '0'], ['1', '0', '0', '1'], ['0', '0', '1', '1']]), 2);
    assert.equal(countIslands([['1', '0', '1'], ['0', '0', '0'], ['1', '0', '1']]), 4);
    assert.equal(countIslands([['1', '1', '1'], ['0', '1', '0'], ['1', '1', '1']]), 1);
  } },
  'gr-topo': { names: ['canFinish'], run({ canFinish }) {
    assert.equal(canFinish(2, [[1, 0]]), true);
    assert.equal(canFinish(2, [[1, 0], [0, 1]]), false);
    assert.equal(canFinish(4, [[1, 0], [2, 1], [3, 2]]), true);
  } },
  'gr-union-find': { names: ['UnionFind'], run({ UnionFind }) {
    const uf = new UnionFind(5);
    assert.equal(uf.union(0, 1), true);
    assert.equal(uf.union(1, 2), true);
    assert.equal(uf.union(0, 2), false);          // already connected
    assert.equal(uf.count, 3);
    assert.equal(uf.find(2), uf.find(0));
    assert.notEqual(uf.find(3), uf.find(0));
  } },
  'agr-dijkstra': { names: ['networkDelayTime'], run({ networkDelayTime }) {
    assert.equal(networkDelayTime([[2, 1, 1], [2, 3, 1], [3, 4, 1]], 4, 2), 2);
    assert.equal(networkDelayTime([[1, 2, 1]], 2, 1), 1);
    assert.equal(networkDelayTime([[1, 2, 1]], 2, 2), -1);
  } },
  'agr-bellman-ford': { names: ['findCheapestPrice'], run({ findCheapestPrice }) {
    const flights = [[0, 1, 100], [1, 2, 100], [2, 0, 100], [1, 3, 600], [2, 3, 200]];
    assert.equal(findCheapestPrice(4, flights, 0, 3, 1), 700);
    assert.equal(findCheapestPrice(4, flights, 0, 3, 2), 400);
    assert.equal(findCheapestPrice(3, [[0, 1, 100]], 0, 2, 1), -1);
  } },
  'dp1-climb': { names: ['climb', 'climbBottomUp'], run({ climb, climbBottomUp }) {
    for (const [n, want] of [[1, 1], [2, 2], [3, 3], [5, 8], [10, 89]]) {
      assert.equal(climb(n), want);
      assert.equal(climbBottomUp(n), want);
    }
  } },
  'dp1-coin-change': { names: ['coinChange'], run({ coinChange }) {
    assert.equal(coinChange([1, 2, 5], 11), 3);
    assert.equal(coinChange([2], 3), -1);
    assert.equal(coinChange([1], 0), 0);
  } },
  'dp2-lcs': { names: ['lcs'], run({ lcs }) {
    assert.equal(lcs('abcde', 'ace'), 3);
    assert.equal(lcs('abc', 'def'), 0);
    assert.equal(lcs('', 'a'), 0);
  } },
  'dp2-edit-distance': { names: ['minDistance'], run({ minDistance }) {
    assert.equal(minDistance('horse', 'ros'), 3);
    assert.equal(minDistance('intention', 'execution'), 5);
    assert.equal(minDistance('', 'abc'), 3);
  } },
  'dp2-coin-change-2': { names: ['change'], run({ change }) {
    assert.equal(change(5, [1, 2, 5]), 4);
    assert.equal(change(3, [2]), 0);
    assert.equal(change(0, [7]), 1);
  } },
  'gd-kadane-jump': { names: ['maxSubArray', 'canJump'], run({ maxSubArray, canJump }) {
    assert.equal(maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4]), 6);
    assert.equal(maxSubArray([-3, -1, -2]), -1);
    assert.equal(canJump([2, 3, 1, 1, 4]), true);
    assert.equal(canJump([3, 2, 1, 0, 4]), false);
  } },
  'int-merge': { names: ['merge'], run({ merge }) {
    assert.deepEqual(merge([[1, 3], [8, 10], [2, 6], [15, 18]]), [[1, 6], [8, 10], [15, 18]]);
    assert.deepEqual(merge([[1, 4], [4, 5]]), [[1, 5]]);
    assert.deepEqual(merge([[10, 11], [2, 3]]), [[2, 3], [10, 11]]);   // numeric sort, not string sort
  } },
  'int-meeting-rooms': { names: ['minMeetingRooms'], run({ minMeetingRooms }) {
    assert.equal(minMeetingRooms([[0, 30], [5, 10], [15, 20]]), 2);
    assert.equal(minMeetingRooms([[7, 10], [2, 4]]), 1);
    assert.equal(minMeetingRooms([]), 0);
  } },
  'math-rotate': { names: ['rotate'], run({ rotate }) {
    const m = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
    rotate(m);
    assert.deepEqual(m, [[7, 4, 1], [8, 5, 2], [9, 6, 3]]);
  } },
  'math-pow': { names: ['myPow'], run({ myPow }) {
    assert.equal(myPow(2, 10), 1024);
    assert.equal(myPow(2, -2), 0.25);
    assert.equal(myPow(2.1, 3).toFixed(5), '9.26100');
    assert.equal(myPow(5, 0), 1);
  } },
  'bit-single-and-count': { names: ['singleNumber', 'hammingWeight'], run({ singleNumber, hammingWeight }) {
    assert.equal(singleNumber([4, 1, 2, 1, 2]), 4);
    assert.equal(hammingWeight(11), 3);
    assert.equal(hammingWeight(128), 1);
    assert.equal(hammingWeight(4294967293), 31);   // unsigned 32-bit input
  } },
  'bit-reverse-and-sum': { names: ['reverseBits', 'getSum'], run({ reverseBits, getSum }) {
    assert.equal(reverseBits(43261596), 964176192);
    assert.equal(reverseBits(4294967293), 3221225471);
    assert.equal(getSum(1, 2), 3);
    assert.equal(getSum(-2, 3), 1);
    assert.equal(getSum(-1, 1), 0);
  } },
};

test('every snippet on the site has a test case, and no case is orphaned', () => {
  assert.deepEqual([...SNIPPETS.keys()].sort(), Object.keys(CASES).sort());
});

for (const [id, c] of Object.entries(CASES)) {
  test(`snippet ${id} runs correctly`, () => {
    c.run(load(id, c.names));
  });
}
