export default {
  id: 'arr',
  slug: 'arrays-hashing',
  title: 'Arrays & Hashing',
  group: 'found',
  time: '≈30 min theory',

  theory: [
    '<strong>Trade memory for time.</strong> A <code>Map</code> or <code>Set</code> turns “have I seen this?” from an O(n) scan into O(1). Most problems here are one pass while remembering something.',
    '<strong>Store the complement.</strong> For “find a pair that…”, look up what you <em>need</em> (<code>target - x</code>) instead of scanning for it.',
    '<strong>Group by a canonical key.</strong> Anagrams share a sorted string or a letter-count signature. Use it as the Map key.',
    '<strong>Count, then pick.</strong> Build a frequency Map first, then sort or bucket by count (Top K Frequent).',
  ],
  skip: 'Skip for now: prefix/suffix products and “start of a run” checks. You meet them on Product of Array Except Self and Longest Consecutive Sequence.',

  snippets: [
    {
      id: 'arr-two-sum',
      title: 'Two Sum · hash map complement',
      code: `
function twoSum(nums, target) {
  const seen = new Map();                 // value -> index
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);                 // set AFTER checking, so an element never pairs with itself
  }
  return [];
}
`,
    },
    {
      id: 'arr-group-anagrams',
      title: 'Group Anagrams · canonical key',
      code: `
function groupAnagrams(strs) {
  const groups = new Map();
  for (const s of strs) {
    const key = [...s].sort().join('');   // same letters => same key
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  return [...groups.values()];
}
`,
    },
  ],

  watch: [
    'Calling <code>.sort()</code> on numbers without a comparator. It sorts as strings: <code>[10, 9, 1].sort()</code> gives <code>[1, 10, 9]</code>. Use <code>(a, b) =&gt; a - b</code>.',
    'Using a plain object as a map. Keys like <code>"constructor"</code> collide with prototype properties. Prefer <code>Map</code> and <code>Set</code>.',
    'Adding to the map before checking it, so an element pairs with itself.',
    'Mutating the input array when you still need the original order.',
  ],

  groups: [
    {
      items: [
        ['Contains Duplicate', 'E', 'Add to a `Set`; the first repeat answers it. Or compare `new Set(nums).size` with the length.'],
        ['Valid Anagram', 'E', 'Count letters up for one string and down for the other. Everything must return to zero.'],
        ['Two Sum', 'E', 'Store each value’s index in a Map and look up `target - x`.', 'hash map complement'],
        ['Group Anagrams', 'M', 'Key each word by its sorted letters (or a 26-count signature).'],
        ['Top K Frequent Elements', 'M', 'Count with a Map, then bucket by frequency (index = count) and read from the end.', 'bucket sort'],
        ['Product of Array Except Self', 'M', 'Left-to-right prefix products, then right-to-left suffix products. No division.', 'prefix / suffix'],
        ['Valid Sudoku', 'M', 'One Set per row, column and 3×3 box. The box index is `Math.floor(r / 3) * 3 + Math.floor(c / 3)`.'],
        ['Encode and Decode Strings', 'M', 'Length-prefix every string (`4#word`) so any character, even `#`, is safe.'],
        ['Longest Consecutive Sequence', 'M', 'Put everything in a Set and only start counting from numbers with no `n - 1` in the set.', 'sequence starts'],
      ],
    },
  ],
};
