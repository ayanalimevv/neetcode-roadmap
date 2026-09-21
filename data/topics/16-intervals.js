export default {
  id: 'int',
  slug: 'intervals',
  title: 'Intervals',
  group: 'misc',
  time: '≈30 min theory',

  theory: [
    '<strong>Sort first, almost always.</strong> Sorting by start puts overlaps next to each other. Sorting by end suits “keep as many as possible” greedy problems.',
    '<strong>Two intervals overlap when</strong> <code>a.start &lt;= b.end &amp;&amp; b.start &lt;= a.end</code>. After sorting by start you only need to check <code>next.start &lt;= cur.end</code>.',
    '<strong>Merge by extending:</strong> if they overlap, set <code>cur.end = Math.max(cur.end, next.end)</code>. Otherwise push and move on.',
    '<strong>Counting things at the same time</strong> (Meeting Rooms II): sort starts and ends separately and sweep, or keep a min-heap of end times.',
    '<strong>Queries against intervals</strong> (Minimum Interval): sort both, sweep the queries in order, and keep a heap of the intervals that currently cover the query.',
  ],

  snippets: [
    {
      id: 'int-merge',
      title: 'Merge Intervals · sort by start',
      code: `
function merge(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  const res = [];
  for (const [start, end] of intervals) {
    const last = res[res.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);   // overlap: extend
    else res.push([start, end]);
  }
  return res;
}
`,
    },
    {
      id: 'int-meeting-rooms',
      title: 'Meeting Rooms II · sweep starts and ends',
      code: `
function minMeetingRooms(intervals) {
  const starts = intervals.map((i) => i[0]).sort((a, b) => a - b);
  const ends = intervals.map((i) => i[1]).sort((a, b) => a - b);
  let rooms = 0, e = 0;
  for (const s of starts) {
    if (s < ends[e]) rooms++;      // starts before the earliest meeting ends: need a new room
    else e++;                      // that meeting ended: reuse its room
  }
  return rooms;
}
`,
    },
  ],

  watch: [
    'Sorting without a comparator. <code>[[10, 11], [2, 3]].sort()</code> compares the arrays as strings.',
    'Touching intervals. Decide whether <code>[1, 2]</code> and <code>[2, 3]</code> overlap (<code>&lt;</code> versus <code>&lt;=</code>). Read the problem.',
    'Mutating the input intervals when you merge. Copy them if you still need the originals.',
    'Comparing with the wrong interval. After sorting by start, compare with the last <em>merged</em> one.',
  ],

  groups: [
    {
      items: [
        ['Insert Interval', 'M', 'Three phases: copy the intervals that end before the new one, merge all that overlap it, copy the rest.'],
        ['Merge Intervals', 'M', 'Sort by start. Extend the last merged interval while the next one overlaps.', 'sort by start'],
        ['Non Overlapping Intervals', 'M', 'Sort by end and keep the interval that finishes first. Count the ones you must remove.', 'sort by end (greedy)'],
        ['Meeting Rooms', 'E', 'Sort by start. Any interval that starts before the previous one ends is a clash.'],
        ['Meeting Rooms II', 'M', 'Sort starts and ends separately and sweep, or use a min-heap of end times.', 'sweep line'],
        ['Minimum Interval to Include Each Query', 'H', 'Sort intervals and queries. For each query push covering intervals onto a min-heap of `[size, end]` and pop the expired ones.', 'offline queries + heap'],
      ],
    },
  ],
};
