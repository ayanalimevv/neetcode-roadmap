export default {
  id: 'bt',
  slug: 'backtracking',
  title: 'Backtracking',
  group: 'search',
  time: '≈1 hr theory',

  theory: [
    '<strong>Draw one tree by hand.</strong> Take <code>subsets([1,2,3])</code> and draw all 8 leaves. Each level is one decision, each branch is one option. Once you see that, backtracking stops being mysterious. This one exercise is worth more than any video.',
    '<strong>Learn the rhythm:</strong> choose → explore → un-choose. The <code>pop()</code> is how the recursion walks back up the tree.',
    '<strong>Know the two shapes of a decision.</strong> Include or exclude gives two branches per level (subsets). Looping over the next choice gives one branch per option (combinations, permutations, partitions).',
    '<strong>Copy the path, don’t share it.</strong> Push <code>[...path]</code>, not <code>path</code>. Otherwise every answer is the one array you keep mutating.',
  ],
  skip: 'Skip for now: pruning and dedup. You’ll learn them on Subsets II and Combination Sum II.',

  snippets: [
    {
      id: 'bt-loop',
      title: 'Loop template · subsets',
      code: `
function subsets(nums) {
  const res = [];
  const path = [];
  function backtrack(start) {
    res.push([...path]);              // copy! path keeps changing
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);             // choose
      backtrack(i + 1);               // explore
      path.pop();                     // un-choose
    }
  }
  backtrack(0);
  return res;
}
`,
    },
    {
      id: 'bt-include-exclude',
      title: 'Include / exclude shape · same answer',
      code: `
function subsetsIncludeExclude(nums) {
  const res = [];
  const path = [];
  function dfs(i) {
    if (i === nums.length) {
      res.push([...path]);
      return;
    }
    path.push(nums[i]);               // include nums[i]
    dfs(i + 1);
    path.pop();
    dfs(i + 1);                       // exclude nums[i]
  }
  dfs(0);
  return res;
}
`,
    },
  ],

  watch: [
    'Forgetting <code>pop()</code> (or the <code>used[i] = false</code> reset in permutations). Later branches inherit earlier choices.',
    'Recursing with <code>i</code> versus <code>i + 1</code>. <code>i</code> allows reusing the element, <code>i + 1</code> uses each once.',
    'Starting the loop at 0 instead of <code>start</code>. You get the same combination in every order.',
  ],

  groups: [
    {
      items: [
        ['Subsets', 'M', 'Include or exclude each index. This is the tree you drew by hand.'],
        ['Combination Sum', 'M', 'Loop from `start`, and recurse with the same `i` because reuse is allowed.'],
        ['Permutations', 'M', 'No `start`. Pick any unused element and track it in `used[]`.'],
        ['Subsets II', 'M', 'Sort, then skip a value equal to the previous one at the same level.', 'dedup'],
        ['Combination Sum II', 'M', 'Combination Sum plus the same sort-and-skip dedup. Each number is used once.'],
        ['Word Search', 'M', 'Grid DFS. Mark the cell on the way in and restore it on the way out.'],
        ['Palindrome Partitioning', 'M', 'The choice is where to cut next. Only recurse if the piece is a palindrome.', 'pruning'],
        ['Letter Combinations of a Phone Number', 'M', 'One level per digit, looping over that digit’s letters.'],
        ['N-Queens', 'H', 'One row per level. Track used columns and both diagonals (`r - c`, `r + c`) in Sets.'],
      ],
    },
  ],
};
