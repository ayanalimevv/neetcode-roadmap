export default {
  id: 'heap',
  slug: 'heap-priority-queue',
  title: 'Heap / Priority Queue',
  group: 'struct',
  time: '≈45 min theory',

  theory: [
    '<strong>A heap gives you the smallest (or largest) item in O(log n).</strong> Reach for it when the same question, “what is the min or max right now?”, repeats while the data changes.',
    '<strong>Top-K trick:</strong> keep a <em>min</em>-heap of size <code>k</code>. Anything smaller than its top can’t be in the top k, and the top is the k-th largest.',
    '<strong>JavaScript has no built-in heap.</strong> Copy the <code>MinHeap</code> below. For a max-heap pass <code>(a, b) =&gt; b - a</code>. For pairs, compare the priority: <code>(a, b) =&gt; a[0] - b[0]</code>.',
    '<strong>Two heaps</strong> give a running median: a max-heap for the lower half and a min-heap for the upper half, kept within one element of each other.',
  ],
  skip: 'Advanced Graphs reuses this MinHeap for Dijkstra, so keep it handy.',

  snippets: [
    {
      id: 'heap-minheap',
      title: 'MinHeap · with a comparator',
      code: `
class MinHeap {
  constructor(compare = (a, b) => a - b) {   // compare(a, b) < 0 means a comes out first
    this.a = [];
    this.cmp = compare;
  }
  get size() { return this.a.length; }
  peek() { return this.a[0]; }

  push(x) {
    const a = this.a;
    a.push(x);
    let i = a.length - 1;
    while (i > 0) {                          // sift up
      const p = (i - 1) >> 1;
      if (this.cmp(a[i], a[p]) >= 0) break;
      [a[i], a[p]] = [a[p], a[i]];
      i = p;
    }
  }

  pop() {
    const a = this.a;
    const top = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {                             // sift down
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < a.length && this.cmp(a[l], a[m]) < 0) m = l;
        if (r < a.length && this.cmp(a[r], a[m]) < 0) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}
`,
    },
    {
      id: 'heap-kth-largest',
      title: 'Kth Largest in a Stream · size-k min-heap',
      note: 'uses MinHeap above',
      needs: ['heap-minheap'],
      code: `
class KthLargest {
  constructor(k, nums) {
    this.k = k;
    this.heap = new MinHeap();                    // holds the k largest values seen so far
    for (const n of nums) this.add(n);
  }
  add(val) {
    this.heap.push(val);
    if (this.heap.size > this.k) this.heap.pop(); // drop the smallest
    return this.heap.peek();                      // the k-th largest
  }
}
`,
    },
  ],

  watch: [
    'Calling <code>array.sort()</code> in a loop instead of using a heap. That is O(n log n) every time.',
    'Default <code>sort</code> compares as strings, and a heap needs an explicit numeric comparator.',
    'Forgetting to cap the heap at size <code>k</code>, or using a max-heap where the top-k trick needs a min-heap.',
    'Pushing <code>[priority, value]</code> pairs without telling the heap to compare index 0.',
  ],

  groups: [
    {
      items: [
        ['Kth Largest Element In a Stream', 'E', 'A min-heap of size k. The top is the answer.', 'top-k with a min-heap'],
        ['Last Stone Weight', 'E', 'A max-heap: pop two and push back their difference if it is non-zero.'],
        ['K Closest Points to Origin', 'M', 'A max-heap of size k on squared distance (no `sqrt`). Or just sort.'],
        ['Kth Largest Element In An Array', 'M', 'The same size-k min-heap. Quickselect is the O(n) follow-up.'],
        ['Task Scheduler', 'M', 'Count each task. The most frequent one forces the idle gaps. Or simulate with a max-heap and a cooldown queue.'],
        ['Design Twitter', 'M', 'Per-user tweet lists with timestamps. The feed is a k-way merge of the newest tweets using a heap.', 'k-way merge'],
        ['Find Median From Data Stream', 'H', 'A max-heap for the lower half and a min-heap for the upper half. Keep their sizes within one.', 'two heaps'],
      ],
    },
  ],
};
