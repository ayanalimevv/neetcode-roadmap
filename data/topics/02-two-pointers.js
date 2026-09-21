export default {
  id: 'tp',
  slug: 'two-pointers',
  title: 'Two Pointers',
  group: 'found',
  time: '≈30 min theory',

  theory: [
    '<strong>Two indices, one pass.</strong> Start at both ends (or one behind the other) and move them toward a decision, instead of trying every pair.',
    '<strong>Sorted input is the giveaway.</strong> If the sum is too small, move the left pointer up. Too big, move the right one down. Each step rules out a whole row of pairs.',
    '<strong>Move the pointer that can still improve.</strong> In Container With Most Water the shorter wall limits the area, so moving the taller one can never help.',
    '<strong>Skip duplicates on purpose</strong> (3Sum). After using a value, advance past equal neighbours so the same triple isn’t reported twice.',
  ],
  skip: 'Skip for now: the two-pointer version of Trapping Rain Water. It needs the “best wall on each side” idea from the earlier problems.',

  snippets: [
    {
      id: 'tp-three-sum',
      title: '3Sum · sort, anchor, two pointers',
      code: `
function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const res = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (nums[i] > 0) break;                          // smallest is positive: no more zero sums
    if (i > 0 && nums[i] === nums[i - 1]) continue;  // skip duplicate anchors
    let l = i + 1, r = nums.length - 1;
    while (l < r) {
      const sum = nums[i] + nums[l] + nums[r];
      if (sum < 0) l++;
      else if (sum > 0) r--;
      else {
        res.push([nums[i], nums[l], nums[r]]);
        l++; r--;
        while (l < r && nums[l] === nums[l - 1]) l++;  // skip duplicate partners
      }
    }
  }
  return res;
}
`,
    },
    {
      id: 'tp-max-area',
      title: 'Container With Most Water · move the shorter wall',
      code: `
function maxArea(height) {
  let l = 0, r = height.length - 1, best = 0;
  while (l < r) {
    best = Math.max(best, Math.min(height[l], height[r]) * (r - l));
    if (height[l] < height[r]) l++;
    else r--;                                        // always move the shorter wall
  }
  return best;
}
`,
    },
  ],

  watch: [
    'Using two pointers on unsorted input, where the “which way to move” rule doesn’t hold. Sort first, or use a Map instead.',
    '<code>l &lt; r</code> versus <code>l &lt;= r</code>. Decide whether the pointers may meet: pair problems say no.',
    'Forgetting the duplicate skip after a match, or skipping before the first match and losing valid triples.',
    '<code>sort()</code> mutates the input array. Copy it first if you still need the original.',
  ],

  groups: [
    {
      items: [
        ['Valid Palindrome', 'E', 'Move `l` and `r` inward, skipping anything that isn’t a letter or digit, and compare lower-cased.'],
        ['Two Sum II Input Array Is Sorted', 'M', 'Sorted, so sum too small → `l++`, too big → `r--`. O(1) extra space.'],
        ['3Sum', 'M', 'Sort, fix one number, then run Two Sum II on the rest. Skip duplicates.', 'dedup after sorting'],
        ['Container With Most Water', 'M', 'Area is limited by the shorter wall, so always move the shorter pointer.'],
        ['Trapping Rain Water', 'H', 'Water above a bar is `min(maxLeft, maxRight) - height`. Track both maxima as the pointers close in.', 'two-sided maximum'],
      ],
    },
  ],
};
