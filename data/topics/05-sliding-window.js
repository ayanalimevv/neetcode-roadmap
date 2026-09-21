export default {
  id: 'sw',
  slug: 'sliding-window',
  title: 'Sliding Window',
  group: 'found',
  time: '≈30 min theory',

  theory: [
    '<strong>A window is <code>[l, r]</code>.</strong> Move <code>r</code> forward to add an element and <code>l</code> forward to remove one. Never restart the scan.',
    '<strong>Variable window:</strong> expand <code>r</code> every step, and <em>while</em> the window is invalid, shrink from <code>l</code>. Record the answer once it is valid again.',
    '<strong>Track only what you need to test validity:</strong> a <code>Set</code> for “no repeats”, a count Map for “at most k different”, a running sum for “at least s”.',
    '<strong>Fixed window:</strong> slide by adding one element on the right and removing one on the left.',
    '<strong>A monotonic deque</strong> keeps the window maximum in O(1): store indices in decreasing order of value.',
  ],

  snippets: [
    {
      id: 'sw-longest-substring',
      title: 'Variable window · longest without repeats',
      code: `
function lengthOfLongestSubstring(s) {
  const inWindow = new Set();
  let l = 0, best = 0;
  for (let r = 0; r < s.length; r++) {
    while (inWindow.has(s[r])) inWindow.delete(s[l++]);   // shrink until valid
    inWindow.add(s[r]);
    best = Math.max(best, r - l + 1);
  }
  return best;
}
`,
    },
    {
      id: 'sw-max-window',
      title: 'Sliding Window Maximum · monotonic deque',
      code: `
function maxSlidingWindow(nums, k) {
  const res = [];
  const dq = [];                                // indices; values decrease from front to back
  let head = 0;                                 // head index instead of shift(), which is O(n)
  for (let i = 0; i < nums.length; i++) {
    while (dq.length > head && nums[dq[dq.length - 1]] <= nums[i]) dq.pop();
    dq.push(i);
    if (dq[head] <= i - k) head++;              // the front fell out of the window
    if (i >= k - 1) res.push(nums[dq[head]]);
  }
  return res;
}
`,
    },
  ],

  watch: [
    'Shrinking with <code>if</code> instead of <code>while</code>. One removal may not make the window valid again.',
    'Window size is <code>r - l + 1</code>. Forgetting the <code>+ 1</code> is the classic off-by-one.',
    'Not deleting a count when it reaches zero, so <code>map.size</code> overcounts distinct keys.',
    'Using <code>array.shift()</code> as a queue in Sliding Window Maximum. Use a head index.',
  ],

  groups: [
    {
      items: [
        ['Best Time to Buy And Sell Stock', 'E', 'One pass tracking the lowest price so far. The answer is the best `price - lowest`.'],
        ['Longest Substring Without Repeating Characters', 'M', 'The variable-window template above.', 'variable window'],
        ['Longest Repeating Character Replacement', 'M', 'The window is valid while `size - maxCount <= k`. `maxCount` never needs to decrease.', 'valid-window formula'],
        ['Permutation In String', 'M', 'A fixed window the size of `s1`. Compare letter counts as it slides.'],
        ['Minimum Window Substring', 'H', 'Count what you `need`, expand until `have === need`, then shrink from the left while it still holds.'],
        ['Sliding Window Maximum', 'H', 'Monotonic deque of indices. The front is the max. Drop it when it leaves the window.', 'monotonic deque'],
      ],
    },
  ],
};
