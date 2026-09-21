export default {
  id: 'bs',
  slug: 'binary-search',
  title: 'Binary Search',
  group: 'found',
  time: '≈30 min theory',

  theory: [
    '<strong>You can binary search any monotonic yes/no.</strong> Sorted arrays are just the obvious case. Ask: if <code>x</code> works, does everything bigger also work?',
    '<strong>Pick one loop shape and stick to it.</strong> <code>while (lo &lt;= hi)</code> with <code>mid ± 1</code> finds an exact match. <code>while (lo &lt; hi)</code> with <code>hi = mid</code> finds the first index where a condition becomes true.',
    '<strong>Compute the middle as</strong> <code>lo + Math.floor((hi - lo) / 2)</code>. JS numbers won’t overflow like 32-bit ints, but the habit is free.',
    '<strong>Search the answer, not the array</strong> (Koko Eating Bananas). Binary search the speed and test each guess with a helper.',
    '<strong>Rotated arrays:</strong> at every step one half is still sorted. Decide whether the target lies inside it.',
  ],

  snippets: [
    {
      id: 'bs-search',
      title: 'Exact match · lo <= hi',
      code: `
function search(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
`,
    },
    {
      id: 'bs-koko',
      title: 'Search the answer · first value that works',
      code: `
function minEatingSpeed(piles, h) {
  let lo = 1, hi = Math.max(...piles);        // the answer lies in [1, biggest pile]
  while (lo < hi) {                            // find the FIRST speed that works
    const mid = lo + Math.floor((hi - lo) / 2);
    const hours = piles.reduce((sum, p) => sum + Math.ceil(p / mid), 0);
    if (hours <= h) hi = mid;                  // works: try slower (keep mid)
    else lo = mid + 1;                         // too slow
  }
  return lo;
}
`,
    },
  ],

  watch: [
    'Infinite loops from <code>lo = mid</code> when <code>mid</code> rounds down to <code>lo</code>. Use <code>mid + 1</code> or <code>hi = mid</code> deliberately.',
    'Mixing loop shapes. Pair <code>&lt;=</code> with <code>mid ± 1</code>, and <code>&lt;</code> with <code>hi = mid</code>.',
    'Off-by-one on the range for an answer search. Is the upper bound itself a valid answer?',
    '<code>Math.max(...hugeArray)</code> can overflow the call stack for very large arrays. Use a loop.',
  ],

  groups: [
    {
      items: [
        ['Binary Search', 'E', 'The exact-match template above. Write it from memory.'],
        ['Search a 2D Matrix', 'M', 'Treat the matrix as one sorted array: index `i` maps to `[Math.floor(i / cols), i % cols]`.'],
        ['Koko Eating Bananas', 'M', 'Binary search the speed from 1 to the biggest pile. Check each guess with `ceil(pile / speed)`.', 'search the answer'],
        ['Find Minimum In Rotated Sorted Array', 'M', 'Compare `mid` with `hi`. If `nums[mid] > nums[hi]` the minimum is to the right.'],
        ['Search In Rotated Sorted Array', 'M', 'One half is always sorted. Check whether the target lies in it, otherwise go the other way.'],
        ['Time Based Key Value Store', 'M', 'Per key, keep `[timestamp, value]` in increasing order and binary search for the last timestamp `<= t`.'],
        ['Median of Two Sorted Arrays', 'H', 'Binary search the partition of the smaller array so the left halves hold half the elements and `maxLeft <= minRight`.', 'partition search'],
      ],
    },
  ],
};
