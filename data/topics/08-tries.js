export default {
  id: 'trie',
  slug: 'tries',
  title: 'Tries',
  group: 'struct',
  time: '≈30 min theory',

  theory: [
    '<strong>A trie is a tree of characters.</strong> Each node holds its children (a <code>Map</code>) and a flag saying “a word ends here”.',
    '<strong>Insert, search and startsWith are one loop:</strong> walk one node per character. Only the final check differs.',
    '<strong>Wildcards mean branching.</strong> For <code>.</code> in Add and Search Words, recurse into every child.',
    '<strong>Prune while searching.</strong> Word Search II runs a grid DFS down the trie and abandons a path the moment there is no child for the next letter. Remove found words to avoid repeats.',
  ],

  snippets: [
    {
      id: 'trie-class',
      title: 'Trie · insert, search, startsWith',
      code: `
class Trie {
  constructor() {
    this.root = { kids: new Map(), end: false };
  }

  insert(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.kids.has(ch)) node.kids.set(ch, { kids: new Map(), end: false });
      node = node.kids.get(ch);
    }
    node.end = true;                        // only the LAST node marks a word
  }

  #walk(s) {                                // the node for prefix s, or null
    let node = this.root;
    for (const ch of s) {
      node = node.kids.get(ch);
      if (!node) return null;
    }
    return node;
  }

  search(word) { return this.#walk(word)?.end === true; }
  startsWith(prefix) { return this.#walk(prefix) !== null; }
}
`,
    },
  ],

  watch: [
    'Marking every node as a word instead of only the last one, so <code>search("app")</code> is true after inserting <code>"apple"</code>.',
    'Using a plain object for children. Prefer <code>Map</code>, which has no prototype keys.',
    'Missing the base case in wildcard search (a <code>.</code> on the last character).',
    'Not pruning in Word Search II. The grid DFS then re-explores dead ends and times out.',
  ],

  groups: [
    {
      items: [
        ['Implement Trie Prefix Tree', 'M', 'The class above. Type it from memory.'],
        ['Design Add And Search Words Data Structure', 'M', 'The same trie. On `.`, try every child recursively.', 'wildcard DFS'],
        ['Word Search II', 'H', 'Build a trie of the words, DFS the grid along it, and prune dead branches (and words already found).', 'trie + grid DFS'],
      ],
    },
  ],
};
