export default {
  id: 'gd',
  slug: 'greedy',
  title: 'Greedy',
  group: 'dp',
  time: '≈30–45 min theory',

  theory: [
    '<strong>One idea.</strong> Take the locally best choice and never look back. It fails when a choice you can’t undo turns out to be wrong later.',
    '<strong>The real skill is knowing when it’s safe.</strong> Try to break it first with a tiny counter-example. If none turns up, argue that swapping your choice for any other can’t improve the answer. That is the exchange argument.',
    '<strong>What it looks like:</strong> one pass with a running quantity you update, or a sort that makes each choice obvious.',
    '<strong>If a counter-example breaks your greedy,</strong> it is a DP problem. Go back to the brute-force recursion.<ul class="chips"><li>running-sum reset</li><li>reachability window</li><li>sort then sweep</li><li>last-seen index</li></ul>',
  ],

  snippets: [
    {
      id: 'gd-kadane-jump',
      title: 'Kadane and reachability',
      code: `
function maxSubArray(nums) {          // Kadane: extend or restart
  let cur = nums[0], best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]);
    best = Math.max(best, cur);
  }
  return best;
}

function canJump(nums) {              // track the farthest reachable index
  let reach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > reach) return false;      // stuck before i
    reach = Math.max(reach, i + nums[i]);
  }
  return true;
}
`,
    },
  ],

  watch: [
    'Trusting a greedy that passes the examples. Always try one adversarial input.',
    'Sorting by the wrong key, or sorting when the original order matters.',
    'Off-by-one at the window boundary, especially in Jump Game II.',
  ],

  groups: [
    {
      items: [
        ['Maximum Subarray', 'M', 'Kadane: extend the running sum or restart at this element.', 'running-sum reset'],
        ['Jump Game', 'M', 'Track the farthest reachable index.', 'reachability window'],
        ['Jump Game II', 'M', 'Count a jump each time you pass the end of the current reach window.'],
        ['Gas Station', 'M', 'If total gas ≥ total cost a start exists. Reset the start whenever the tank goes negative.'],
        ['Hand of Straights', 'M', 'Count the cards and always start a group from the smallest one left.', 'sort then sweep'],
        ['Merge Triplets to Form Target Triplet', 'M', 'Discard triplets that exceed the target anywhere, then check each slot is reachable.'],
        ['Partition Labels', 'M', 'Record each letter’s last index and extend the cut to the furthest one seen.', 'last-seen index'],
        ['Valid Parenthesis String', 'M', 'Track the range `[lo, hi]` of possible open counts.'],
      ],
    },
  ],
};
