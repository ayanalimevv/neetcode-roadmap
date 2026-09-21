export default {
  id: 'dp1',
  slug: '1d-dp',
  title: '1-D Dynamic Programming',
  group: 'dp',
  time: '≈1 hr theory, then per problem',

  theory: [
    '<strong>Four questions for every problem.</strong> State: what does <code>dp[i]</code> mean, in one sentence? Transition: how does it come from smaller states? Base case: what is the smallest input you can answer directly? Order: which direction do you fill so the dependencies are ready?',
    '<strong>Two ways, same recurrence.</strong> Write the brute-force recursion, then either add a memo (top-down) or fill a table in order (bottom-up). Do the first few problems both ways.',
    '<strong>See the overlap.</strong> Draw the recursion tree of Climbing Stairs for n = 5 and circle the repeated subtrees. That repetition is the entire reason DP exists.',
    '<strong>Name patterns as they show up.</strong> You don’t need to study them first.<ul class="chips"><li>Fibonacci-style</li><li>knapsack 0/1</li><li>knapsack unbounded</li><li>expand around a centre</li></ul>',
  ],

  snippets: [
    {
      id: 'dp1-climb',
      title: 'Climbing Stairs · memo and table',
      code: `
// top-down: brute force + memo
function climb(n, memo = new Map()) {
  if (n <= 1) return 1;                       // base case
  if (memo.has(n)) return memo.get(n);
  const v = climb(n - 1, memo) + climb(n - 2, memo);
  memo.set(n, v);
  return v;
}

// bottom-up: same recurrence, filled in order
function climbBottomUp(n) {
  const dp = new Array(n + 1).fill(1);        // dp[i] = ways to reach step i
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
}
`,
    },
    {
      id: 'dp1-coin-change',
      title: 'Coin Change · unbounded knapsack',
      code: `
function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);   // dp[a] = fewest coins that make a
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}
`,
    },
  ],

  watch: [
    'A fuzzy state. If you can’t say what <code>dp[i]</code> means in one sentence, stop and fix that first.',
    'A table of size <code>n</code> instead of <code>n + 1</code>. You lose the “empty” base case.',
    'Filling in the wrong order, so <code>dp[i]</code> reads a cell you haven’t computed yet.',
    'Returning <code>Infinity</code> as an answer. Convert “impossible” to <code>-1</code> at the end.',
  ],

  groups: [
    {
      items: [
        ['Climbing Stairs', 'E', '`ways(n) = ways(n - 1) + ways(n - 2)`. Write it as a memo and as a table.', 'memo vs table'],
        ['Min Cost Climbing Stairs', 'E', 'Same shape. Define the state as the cost to stand on step i.'],
        ['House Robber', 'M', 'Rob or skip: `max(dp[i - 1], dp[i - 2] + nums[i])`.'],
        ['House Robber II', 'M', 'The street is a circle. Run House Robber twice, once without the first house and once without the last.'],
        ['Longest Palindromic Substring', 'M', 'Expand around every centre, both odd and even.', 'expand around a centre'],
        ['Palindromic Substrings', 'M', 'The same expansion, but count instead of tracking the longest.'],
        ['Decode Ways', 'M', 'Like stairs, but a 1- or 2-digit chunk only counts when it is a valid code.'],
        ['Coin Change', 'M', '`dp[a] = 1 + min(dp[a - coin])` over every coin.', 'unbounded knapsack'],
        ['Maximum Product Subarray', 'M', 'Track both the running max and min, because a negative flips them.'],
        ['Word Break', 'M', '`dp[i]` is true if some `j < i` has `dp[j]` and `s[j..i]` is in the dictionary.'],
        ['Longest Increasing Subsequence', 'M', '`dp[i] = 1 + max(dp[j])` over smaller earlier values. O(n²) is fine first.'],
        ['Partition Equal Subset Sum', 'M', 'Can a subset reach sum / 2? Each item is used at most once.', '0/1 knapsack'],
      ],
    },
  ],
};
