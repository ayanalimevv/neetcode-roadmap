export default {
  id: 'gr',
  slug: 'graphs',
  title: 'Graphs',
  group: 'search',
  time: '≈2–3 hr theory',

  theory: [
    '<strong>Representations.</strong> An adjacency list is a <code>Map</code> from node to an array of neighbours. A grid is a graph too: cell <code>(r, c)</code> touches <code>(r±1, c)</code> and <code>(r, c±1)</code>. Most graph problems here are grids in disguise.',
    '<strong>Write BFS and DFS once each, from memory.</strong> BFS for shortest or fewest steps. DFS for counting regions, flood fill, “everything reachable” and cycle checks.',
    '<strong>The rule that prevents most bugs:</strong> mark visited when you <em>enqueue</em>, not when you dequeue. In DFS, check bounds and visited on the first line.',
    '<strong>JS has no deque.</strong> <code>queue.shift()</code> is O(n), so use a head index.',
  ],
  skip: 'Skip for now: topological sort and union-find. Each takes about 30 minutes at its own problem, and they are tagged in the list. Weighted shortest paths are in Advanced Graphs.',

  snippets: [
    {
      id: 'gr-bfs',
      title: 'Adjacency list + BFS',
      code: `
function buildGraph(edges) {          // undirected; drop the 2nd push if directed
  const adj = new Map();
  for (const [a, b] of edges) {
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a).push(b);
    adj.get(b).push(a);
  }
  return adj;
}

function bfs(adj, start) {
  const visited = new Set([start]);
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {   // head index: shift() is O(n)
    const node = queue[head];
    for (const nei of adj.get(node) ?? []) {
      if (!visited.has(nei)) {
        visited.add(nei);             // mark on ENQUEUE, not dequeue
        queue.push(nei);
      }
    }
  }
  return visited;
}
`,
    },
    {
      id: 'gr-grid',
      title: 'Grid DFS · number of islands',
      code: `
function countIslands(grid) {
  const R = grid.length, C = grid[0].length;
  let count = 0;

  function dfs(r, c) {
    if (r < 0 || c < 0 || r >= R || c >= C) return;   // bounds first
    if (grid[r][c] !== '1') return;                   // water or already seen
    grid[r][c] = '0';                                 // mark visited by sinking it
    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  }

  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (grid[r][c] === '1') {
        count++;
        dfs(r, c);
      }
    }
  }
  return count;
}
`,
    },
    {
      id: 'gr-topo',
      title: 'Topological sort · Course Schedule',
      code: `
function canFinish(numCourses, prerequisites) {
  const adj = Array.from({ length: numCourses }, () => []);
  const indegree = new Array(numCourses).fill(0);
  for (const [course, pre] of prerequisites) {
    adj[pre].push(course);                     // pre -> course
    indegree[course]++;
  }

  const queue = [];
  for (let i = 0; i < numCourses; i++) if (indegree[i] === 0) queue.push(i);

  let taken = 0;
  for (let head = 0; head < queue.length; head++) {
    taken++;
    for (const next of adj[queue[head]]) {
      if (--indegree[next] === 0) queue.push(next);
    }
  }
  return taken === numCourses;                 // fewer means there is a cycle
}
`,
    },
    {
      id: 'gr-union-find',
      title: 'Union-find',
      code: `
class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
    this.count = n;                            // number of separate components
  }

  find(x) {
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]];   // path halving
      x = this.parent[x];
    }
    return x;
  }

  union(a, b) {                                // false if they were already connected
    let ra = this.find(a), rb = this.find(b);
    if (ra === rb) return false;
    if (this.rank[ra] < this.rank[rb]) [ra, rb] = [rb, ra];
    this.parent[rb] = ra;
    if (this.rank[ra] === this.rank[rb]) this.rank[ra]++;
    this.count--;
    return true;
  }
}
`,
    },
  ],

  watch: [
    'Marking visited on dequeue. The same node then gets queued many times.',
    'Reading <code>grid[r][c]</code> before the bounds check. <code>grid[-1]</code> is <code>undefined</code>, and then <code>[c]</code> throws.',
    'Adding both directions of an edge for a directed graph, or only one for an undirected graph.',
    'Comparing grid cells to <code>1</code> when the input holds the string <code>"1"</code>.',
  ],

  groups: [
    {
      items: [
        ['Number of Islands', 'M', 'Grid flood fill. Count how many times you start a fill.', 'grid DFS'],
        ['Clone Graph', 'M', 'DFS with a Map from old node to new node, so each node is cloned once.'],
        ['Max Area of Island', 'M', 'The same fill, but return the size of each island and keep the max.'],
        ['Pacific Atlantic Water Flow', 'M', 'Flow backwards. Start at each ocean’s border, walk uphill, and intersect the two reachable sets.'],
        ['Surrounded Regions', 'M', 'Mark the O’s connected to the border as safe first, then flip the rest.'],
        ['Rotting Oranges', 'M', 'Multi-source BFS. Enqueue ALL rotten cells before the loop. One level is one minute.', 'level-by-level BFS'],
        ['Walls And Gates', 'M', 'BFS from every gate at once. The first visit to a room is its shortest distance.'],
        ['Course Schedule', 'M', 'Cycle detection in a directed graph.', 'topological sort'],
        ['Course Schedule II', 'M', 'The same topological sort. The order nodes leave the queue is the answer.'],
        ['Redundant Connection', 'M', 'Union-find. The first edge whose endpoints are already connected is the answer.', 'union-find'],
        ['Number of Connected Components In An Undirected Graph', 'M', 'Union-find and read `count`, or a plain DFS from each unvisited node.'],
        ['Graph Valid Tree', 'M', 'Exactly n − 1 edges and fully connected, which means no cycle.'],
        ['Word Ladder', 'H', 'BFS where a neighbour is a word one letter away. Bucket words by pattern like `h*t` to find neighbours quickly.'],
      ],
    },
  ],
};
