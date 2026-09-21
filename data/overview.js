// Text for the home page. Plain strings; `backticks` become inline code.

export const OVERVIEW = {
  title: 'All 150 problems, one pattern at a time',
  lede:
    'For each of the 18 NeetCode topics you get the minimum theory to start, JavaScript templates that are tested, and the problems in NeetCode’s order with a one-line hint each. Read a little, solve a lot, and learn the rest at the problem that needs it. Connect sync once and your ticks and notes follow you between devices.',

  loop: [
    {
      title: '20-minute rule',
      text: 'Struggle alone for 20 minutes. Then ask for a hint, like “what pattern is this?”, never the full solution. A solution at minute 21 feels productive and teaches almost nothing.',
    },
    {
      title: 'Rewrite from scratch',
      text: 'After it passes, close everything and write it again from a blank file. If you can’t, you haven’t learned it yet. This matters most for the template-recall topics: backtracking, graphs and DP.',
    },
    {
      title: 'One-line log',
      text: 'Tick a problem and a note field opens. Write the trick in one line: “Rotting Oranges: push ALL rotten cells before the loop.” Ten of these beat rereading a chapter.',
    },
  ],

  calm: 'Expect every new pattern to feel bad for the first three or four problems and then click. That is the normal curve, not a signal to go back and study more theory. If you understand every solution but can’t start a blank one, the fix is the rewrite habit, not more reading.',

  // { when, slug, label? } links to a topic; { when, then } is a plain answer.
  pick: [
    { when: 'You need lookups, counts or duplicates.', slug: 'arrays-hashing' },
    { when: 'Two ends of a sorted array, or a pair that meets a condition.', slug: 'two-pointers' },
    { when: 'Matching, nesting, or “next greater element”.', slug: 'stack' },
    { when: 'Sorted input, or “smallest x such that…”.', slug: 'binary-search' },
    { when: 'A contiguous range that must satisfy a condition.', slug: 'sliding-window' },
    { when: 'Repeatedly need the min, max or top k.', slug: 'heap-priority-queue' },
    { when: 'Prefix lookups on many strings.', slug: 'tries' },
    { when: 'You need every valid arrangement, subset or path.', slug: 'backtracking' },
    { when: 'Connected things, reachability, or fewest steps between two points.', slug: 'graphs' },
    { when: 'Choices overlap and you want the best value or a count.', slug: '1d-dp', label: 'Dynamic programming' },
    { when: 'One local choice is provably safe and never needs undoing.', slug: 'greedy' },
    { when: 'Ranges that may overlap.', slug: 'intervals' },
    { when: 'None of these is clear.', then: 'Write the brute-force recursion first. The memo or the pruning usually appears from it.' },
  ],
};
