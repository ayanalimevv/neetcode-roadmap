export default {
  id: 'agr',
  slug: 'advanced-graphs',
  title: 'Advanced Graphs',
  group: 'search',
  time: '≈1–2 hr theory',

  theory: [
    '<strong>Shortest path with weights → Dijkstra.</strong> It is BFS with a min-heap keyed on distance. Skip a popped entry that is stale (<code>d &gt; dist[node]</code>).',
    '<strong>Negative edges, or “at most k edges” → Bellman-Ford.</strong> Relax every edge for <code>k + 1</code> rounds, reading last round’s distances.',
    '<strong>Connect everything as cheaply as possible → minimum spanning tree.</strong> Kruskal sorts edges and keeps each one that joins two components (union-find). Prim grows from one node with a min-heap.',
    '<strong>Use every edge exactly once → Euler path</strong> (Reconstruct Itinerary). DFS over sorted destinations and add nodes in post-order, then reverse.',
    '<strong>An ordering from constraints → topological sort</strong> (Alien Dictionary). Each pair of adjacent words gives at most one edge between letters.',
  ],
  skip: 'The MinHeap is in Heap / Priority Queue and union-find is in Graphs. Copy them from there.',

  snippets: [
    {
      id: 'agr-dijkstra',
      title: 'Dijkstra · Network Delay Time',
      note: 'uses MinHeap from Heap / Priority Queue',
      needs: ['heap-minheap'],
      code: `
function networkDelayTime(times, n, k) {
  const adj = Array.from({ length: n + 1 }, () => []);
  for (const [u, v, w] of times) adj[u].push([v, w]);

  const dist = new Array(n + 1).fill(Infinity);
  dist[k] = 0;
  const heap = new MinHeap((a, b) => a[0] - b[0]);   // entries are [distance, node]
  heap.push([0, k]);
  while (heap.size) {
    const [d, u] = heap.pop();
    if (d > dist[u]) continue;                        // stale entry
    for (const [v, w] of adj[u]) {
      if (d + w < dist[v]) {
        dist[v] = d + w;
        heap.push([dist[v], v]);
      }
    }
  }
  const worst = Math.max(...dist.slice(1));
  return worst === Infinity ? -1 : worst;
}
`,
    },
    {
      id: 'agr-bellman-ford',
      title: 'Bellman-Ford · at most k stops',
      code: `
function findCheapestPrice(n, flights, src, dst, k) {
  let prices = new Array(n).fill(Infinity);
  prices[src] = 0;
  for (let i = 0; i <= k; i++) {                      // k stops = k + 1 flights
    const next = [...prices];                         // read the old prices, write the new ones
    for (const [u, v, w] of flights) {
      if (prices[u] + w < next[v]) next[v] = prices[u] + w;
    }
    prices = next;
  }
  return prices[dst] === Infinity ? -1 : prices[dst];
}
`,
    },
  ],

  watch: [
    'Running Dijkstra with negative edge weights. It silently returns wrong answers. Use Bellman-Ford.',
    'Not skipping stale heap entries. The answer stays correct, but it gets slow.',
    'Bellman-Ford reading and writing the same array in one round, which lets a path use more than <code>k + 1</code> edges.',
    'A heap of pairs without <code>(a, b) =&gt; a[0] - b[0]</code>. The default comparator gives nonsense for arrays.',
  ],

  groups: [
    {
      items: [
        ['Reconstruct Itinerary', 'H', 'Euler path. Sort each airport’s destinations, DFS, and push airports in post-order. Reverse at the end.', 'Euler path (Hierholzer)'],
        ['Min Cost to Connect All Points', 'M', 'Minimum spanning tree over Manhattan distances: Prim with a heap, or Kruskal with union-find.', 'minimum spanning tree'],
        ['Network Delay Time', 'M', 'Weighted shortest paths from `k`. The answer is the largest distance, or -1.', 'Dijkstra'],
        ['Swim In Rising Water', 'H', 'Dijkstra where the cost of a path is the highest cell on it, not the sum.'],
        ['Alien Dictionary', 'H', 'Compare adjacent words to find the first differing letters. That is an edge. Topologically sort the letters, and watch for prefix cases and cycles.'],
        ['Cheapest Flights Within K Stops', 'M', 'Bellman-Ford limited to `k + 1` rounds, using last round’s prices.', 'Bellman-Ford'],
      ],
    },
  ],
};
