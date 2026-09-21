export default {
  id: 'tree',
  slug: 'trees',
  title: 'Trees',
  group: 'struct',
  time: '≈45 min theory',

  theory: [
    '<strong>Think recursively.</strong> Solve for the left subtree, solve for the right, then combine. Write the base case (<code>null</code>) first.',
    '<strong>Pick the traversal by need.</strong> DFS (pre-, in-, post-order) for depth, paths and validation. BFS with a queue for levels and “right side view”.',
    '<strong>Return one thing, track another.</strong> Diameter and Max Path Sum return the best <em>downward</em> path but update a running answer with the best path <em>through</em> the node.',
    '<strong>BST means ordered.</strong> In-order traversal is sorted. To validate, pass <code>(min, max)</code> bounds down. Comparing only with the parent is the classic mistake.',
  ],

  snippets: [
    {
      id: 'tree-basics',
      title: 'TreeNode · max depth · level order',
      code: `
class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function maxDepth(root) {
  if (!root) return 0;                                  // base case first
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}

function levelOrder(root) {
  const res = [];
  const queue = root ? [root] : [];
  let head = 0;
  while (head < queue.length) {
    const size = queue.length - head;                   // nodes on this level
    const level = [];
    for (let i = 0; i < size; i++) {
      const node = queue[head++];
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    res.push(level);
  }
  return res;
}
`,
    },
    {
      id: 'tree-valid-bst',
      title: 'Validate BST · pass bounds down',
      code: `
function isValidBST(root, min = -Infinity, max = Infinity) {
  if (!root) return true;
  if (root.val <= min || root.val >= max) return false;   // must sit strictly inside (min, max)
  return isValidBST(root.left, min, root.val) &&
         isValidBST(root.right, root.val, max);
}
`,
    },
  ],

  watch: [
    'Forgetting the <code>null</code> base case, then reading <code>.left</code> of <code>null</code>.',
    'Validating a BST by comparing each node only with its parent. A node must respect <em>every</em> ancestor’s bound.',
    'Returning the path <em>through</em> a node instead of the best <em>downward</em> path (Diameter, Max Path Sum).',
    'Treating recursion depth as free. A skewed tree with 10⁵ nodes can overflow the JS call stack, so know the iterative version.',
  ],

  groups: [
    {
      items: [
        ['Invert Binary Tree', 'E', 'Swap the children, then recurse on both.'],
        ['Maximum Depth of Binary Tree', 'E', '`1 + max(depth(left), depth(right))`.'],
        ['Diameter of Binary Tree', 'E', 'At each node the longest path through it is `leftHeight + rightHeight`. Keep the max in an outer variable.', 'return one, track another'],
        ['Balanced Binary Tree', 'E', 'Return the height, or `-1` as a signal that a subtree is already unbalanced.'],
        ['Same Tree', 'E', 'Both null → true. One null or values differ → false. Otherwise recurse on both sides.'],
        ['Subtree of Another Tree', 'E', 'At every node of `root`, call Same Tree against `subRoot`.'],
        ['Lowest Common Ancestor of a Binary Search Tree', 'M', 'If both values are smaller go left, if both are larger go right. Otherwise this node is the LCA.'],
        ['Binary Tree Level Order Traversal', 'M', 'BFS, processing exactly `queue.length` nodes per round.', 'level-by-level BFS'],
        ['Binary Tree Right Side View', 'M', 'BFS by level and keep the last node of each level.'],
        ['Count Good Nodes In Binary Tree', 'M', 'DFS carrying the max value seen on the path so far.'],
        ['Validate Binary Search Tree', 'M', 'Pass `(min, max)` bounds down the recursion.', 'bounds'],
        ['Kth Smallest Element In a Bst', 'M', 'In-order traversal visits nodes in sorted order. Stop at the k-th.'],
        ['Construct Binary Tree From Preorder And Inorder Traversal', 'M', 'Preorder’s first value is the root. Find it in inorder to split left and right. Use a Map for the index.', 'split by root'],
        ['Binary Tree Maximum Path Sum', 'H', 'Return the best downward gain (ignore negatives). Update the answer with `node + leftGain + rightGain`.'],
        ['Serialize And Deserialize Binary Tree', 'H', 'Preorder with a `null` marker for missing children. Rebuild by consuming tokens in the same order.'],
      ],
    },
  ],
};
