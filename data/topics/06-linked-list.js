export default {
  id: 'll',
  slug: 'linked-list',
  title: 'Linked List',
  group: 'struct',
  time: '≈45 min theory',

  theory: [
    '<strong>A node is <code>{ val, next }</code>.</strong> Draw the pointers on paper for every problem. The bugs are all in the order you reassign them.',
    '<strong>Use a dummy head</strong> when the head itself might change (merge, remove, insert). Return <code>dummy.next</code>.',
    '<strong>Reverse in place with three names:</strong> <code>prev</code>, <code>curr</code>, <code>next</code>. Save <code>next</code> before you overwrite <code>curr.next</code>.',
    '<strong>Slow and fast pointers</strong> find the middle and detect cycles. A gap of <code>n</code> nodes finds the n-th node from the end.',
    '<strong>Combine the tools.</strong> Reorder List is: find the middle, reverse the second half, then weave the two halves.',
  ],

  snippets: [
    {
      id: 'll-basics',
      title: 'ListNode · reverse · cycle check',
      code: `
class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

function reverseList(head) {
  let prev = null, curr = head;
  while (curr) {
    const next = curr.next;   // save before overwriting
    curr.next = prev;         // flip the pointer
    prev = curr;              // step both forward
    curr = next;
  }
  return prev;
}

function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;   // compare nodes, not values
  }
  return false;
}
`,
    },
    {
      id: 'll-merge',
      title: 'Merge two sorted lists · dummy head',
      note: 'uses ListNode above',
      needs: ['ll-basics'],
      code: `
function mergeTwoLists(a, b) {
  const dummy = new ListNode();
  let tail = dummy;
  while (a && b) {
    if (a.val <= b.val) { tail.next = a; a = a.next; }
    else { tail.next = b; b = b.next; }
    tail = tail.next;
  }
  tail.next = a || b;          // attach whatever is left
  return dummy.next;
}
`,
    },
  ],

  watch: [
    'Losing the rest of the list by overwriting <code>next</code> before saving it.',
    'Null dereference: <code>fast.next.next</code> when <code>fast.next</code> is null. Check <code>fast &amp;&amp; fast.next</code> first.',
    'Forgetting to cut the list (<code>node.next = null</code>) after splitting it in two, which leaves a cycle.',
    'Comparing nodes by value instead of identity (<code>===</code>) when detecting cycles.',
  ],

  groups: [
    {
      items: [
        ['Reverse Linked List', 'E', 'prev / curr / next, as above. Then write it recursively too.'],
        ['Merge Two Sorted Lists', 'E', 'A dummy head plus a tail pointer. Attach the smaller node each time.', 'dummy head'],
        ['Reorder List', 'M', 'Find the middle (slow / fast), reverse the second half, then alternate nodes from each half.'],
        ['Remove Nth Node From End of List', 'M', 'Move `fast` n steps ahead, then move both. `slow` stops just before the target. Use a dummy head.'],
        ['Copy List With Random Pointer', 'M', 'Two passes with a Map from old node to new node: create the copies, then wire `next` and `random`.', 'old → new Map'],
        ['Add Two Numbers', 'M', 'Walk both lists adding digits plus a carry. Keep going while either list or the carry is non-zero.'],
        ['Linked List Cycle', 'E', 'Slow and fast pointers meet if there is a cycle.', 'Floyd’s cycle detection'],
        ['Find The Duplicate Number', 'M', 'Treat `nums[i]` as a pointer to index `nums[i]`. The duplicate is where the cycle starts.', 'cycle start'],
        ['LRU Cache', 'M', 'A `Map` keeps insertion order. On get and put, delete and re-set the key so the oldest is `map.keys().next().value`. Then rebuild it with a doubly linked list.', 'Map as ordered cache'],
        ['Merge K Sorted Lists', 'H', 'Merge the lists pairwise (divide and conquer), or use a min-heap of the k heads.'],
        ['Reverse Nodes In K Group', 'H', 'Check that k nodes remain, reverse exactly k, then connect to the recursive result for the rest.'],
      ],
    },
  ],
};
