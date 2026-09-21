export default {
  id: 'dp2',
  slug: '2d-dp',
  title: '2-D Dynamic Programming',
  group: 'dp',
  time: '≈45 min theory, then per problem',

  theory: [
    '<strong>The state gets a second index.</strong> <code>dp[i][j]</code> is usually “the answer for the first <code>i</code> of one thing and the first <code>j</code> of another”, or “cell <code>(i, j)</code> of a grid”.',
    '<strong>Draw the table for a tiny input and fill it by hand.</strong> Which neighbouring cells does each cell read? That is your transition and your fill order.',
    '<strong>Size it <code>+ 1</code></strong> so row 0 and column 0 mean “empty prefix”, and fill them first. Those are your base cases.',
    '<strong>Common shapes:</strong> grid paths, two-string (LCS, edit distance), knapsack with a target, and intervals (Burst Balloons).',
    '<strong>The space trick comes later.</strong> If a row only reads the row above, two rows are enough. Get it correct first.',
  ],

  snippets: [
    {
      id: 'dp2-lcs',
      title: '2-D table · longest common subsequence',
      code: `
// WRONG: new Array(m + 1).fill(new Array(n + 1).fill(0))  -> every row is the same array
function lcs(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1                    // match: extend the diagonal
        : Math.max(dp[i - 1][j], dp[i][j - 1]);   // else: best of skipping one char
    }
  }
  return dp[m][n];
}
`,
    },
    {
      id: 'dp2-edit-distance',
      title: 'Edit Distance · three neighbours',
      code: `
function minDistance(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;      // delete everything
  for (let j = 0; j <= n; j++) dp[0][j] = j;      // insert everything
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);   // delete, insert, replace
    }
  }
  return dp[m][n];
}
`,
    },
    {
      id: 'dp2-coin-change-2',
      title: 'Coin Change II · combinations, not orderings',
      code: `
function change(amount, coins) {
  const dp = new Array(amount + 1).fill(0);   // dp[a] = number of combinations that make a
  dp[0] = 1;
  for (const c of coins) {                     // coins in the OUTER loop => combinations
    for (let a = c; a <= amount; a++) dp[a] += dp[a - c];
  }
  return dp[amount];
}
`,
    },
  ],

  watch: [
    '<code>new Array(m).fill(new Array(n))</code> makes every row the same array. Build rows with <code>Array.from</code>.',
    'A table sized <code>n</code> instead of <code>n + 1</code>, which loses the empty-prefix row and column.',
    'Swapping the loop order in the knapsack shapes. Coins outer counts combinations, and amount outer counts orderings.',
    'Off-by-one between the table index <code>i</code> and the string index <code>i - 1</code>.',
  ],

  groups: [
    {
      items: [
        ['Unique Paths', 'M', '`dp[r][c] = dp[r - 1][c] + dp[r][c - 1]`.', 'grid paths'],
        ['Longest Common Subsequence', 'M', 'On a match take the diagonal plus 1. Otherwise take the best of up and left.', 'two-string table'],
        ['Best Time to Buy And Sell Stock With Cooldown', 'M', 'Think in states: holding, just sold, resting.', 'state machine'],
        ['Coin Change II', 'M', 'Count combinations, not orderings. Coins in the outer loop, amount in the inner.'],
        ['Target Sum', 'M', 'DP over (index, running sum), memoised in a Map keyed on both.'],
        ['Interleaving String', 'M', '`dp[i][j]`: can the first i and j chars of s1 and s2 build the first i + j of s3?'],
        ['Longest Increasing Path In a Matrix', 'H', 'DFS with a memo per cell. Strictly increasing means no visited set is needed.'],
        ['Distinct Subsequences', 'H', 'On a match you may use it or skip it. Otherwise you can only skip.'],
        ['Edit Distance', 'M', 'Insert, delete and replace are three neighbouring cells.'],
        ['Burst Balloons', 'H', 'Pick the LAST balloon to burst in `(l, r)`, not the first.', 'interval DP'],
        ['Regular Expression Matching', 'H', 'For `*`: use zero copies, or consume one char and stay on the same pattern position.'],
      ],
    },
  ],
};
