export default {
  id: 'bit',
  slug: 'bit-manipulation',
  title: 'Bit Manipulation',
  group: 'misc',
  time: '≈30 min theory',

  theory: [
    '<strong>Four moves cover almost everything.</strong> <code>a ^ a === 0</code> (XOR cancels pairs), <code>n &amp; (n - 1)</code> clears the lowest set bit, <code>n &amp; 1</code> reads the lowest bit, and <code>n &gt;&gt; 1</code> shifts right.',
    '<strong>JavaScript bit operators work on 32-bit signed integers.</strong> Operands are converted first, and results are signed. Use <code>&gt;&gt;&gt; 0</code> to view a result as unsigned, and <code>&gt;&gt;&gt;</code> (not <code>&gt;&gt;</code>) to shift right without copying the sign bit.',
    '<strong>Counting set bits:</strong> <code>while (n) { n &amp;= n - 1; count++; }</code> runs once per set bit.',
    '<strong>Adding without <code>+</code>:</strong> XOR adds without carrying, and <code>(a &amp; b) &lt;&lt; 1</code> is the carry. Repeat until the carry is 0.',
    '<strong>Build answers bit by bit:</strong> <code>(result &lt;&lt; 1) | (n &amp; 1)</code>, then shift <code>n</code> right.',
  ],

  snippets: [
    {
      id: 'bit-single-and-count',
      title: 'Single Number and Number of 1 Bits',
      code: `
function singleNumber(nums) {
  let x = 0;
  for (const n of nums) x ^= n;         // pairs cancel, the single one is left
  return x;
}

function hammingWeight(n) {
  let count = 0;
  while (n !== 0) {
    n &= n - 1;                          // clear the lowest set bit
    count++;
  }
  return count;
}
`,
    },
    {
      id: 'bit-reverse-and-sum',
      title: 'Reverse Bits and Sum of Two Integers',
      code: `
function reverseBits(n) {
  let result = 0;
  for (let i = 0; i < 32; i++) {
    result = (result << 1) | (n & 1);    // take n's lowest bit and append it
    n >>>= 1;
  }
  return result >>> 0;                    // back to an unsigned 32-bit value
}

function getSum(a, b) {
  while (b !== 0) {
    const carry = (a & b) << 1;
    a ^= b;                               // add without carrying
    b = carry;
  }
  return a;
}
`,
    },
  ],

  watch: [
    'Operator precedence. <code>n &amp; 1 === 0</code> parses as <code>n &amp; (1 === 0)</code>, so parenthesise: <code>(n &amp; 1) === 0</code>.',
    'Using <code>&gt;&gt;</code> on values that may have the top bit set. Use <code>&gt;&gt;&gt;</code>.',
    'Forgetting <code>&gt;&gt;&gt; 0</code> when the answer should be unsigned. Reverse Bits then returns a negative number.',
    'Assuming 64 bits. <code>1 &lt;&lt; 32</code> is <code>1</code> in JavaScript, not <code>4294967296</code>.',
  ],

  groups: [
    {
      items: [
        ['Single Number', 'E', 'XOR everything. Pairs cancel.', 'XOR cancels pairs'],
        ['Number of 1 Bits', 'E', '`n &= n - 1` clears the lowest set bit. Count the iterations.'],
        ['Counting Bits', 'E', '`bits[i] = bits[i >> 1] + (i & 1)`: reuse the answer for `i` without its last bit.', 'DP on bits'],
        ['Reverse Bits', 'E', 'Read the lowest bit, append it to the result, and shift `n` right, 32 times.'],
        ['Missing Number', 'E', 'XOR all indices `0..n` with all values, or take `n(n + 1) / 2` minus the sum.'],
        ['Sum of Two Integers', 'M', 'XOR is the sum without carry. `(a & b) << 1` is the carry. Repeat until there is no carry.', 'add with bit ops'],
        ['Reverse Integer', 'M', 'Peel digits with `% 10` and `Math.trunc(x / 10)`, then check the result stays within 32-bit range.'],
      ],
    },
  ],
};
