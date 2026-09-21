export default {
  id: 'math',
  slug: 'math-geometry',
  title: 'Math & Geometry',
  group: 'misc',
  time: '≈30 min theory',

  theory: [
    '<strong>Transform matrices in place with two simple moves.</strong> Rotating 90° clockwise is a transpose followed by reversing each row.',
    '<strong>Walk a spiral with four shrinking boundaries</strong> (<code>top</code>, <code>bottom</code>, <code>left</code>, <code>right</code>) and stop when they cross.',
    '<strong>Use the matrix as its own memory</strong> (Set Matrix Zeroes). The first row and column can hold the flags, as long as you remember whether they themselves need zeroing.',
    '<strong>Exponentiation by squaring</strong> turns <code>x^n</code> into O(log n): square the base and halve the exponent.',
    '<strong>JS numbers are doubles.</strong> Integers are exact up to <code>2**53 - 1</code>, and beyond that you need <code>BigInt</code>. <code>%</code> keeps the sign of the dividend, and <code>Math.trunc</code> rounds toward zero.',
  ],

  snippets: [
    {
      id: 'math-rotate',
      title: 'Rotate Image · transpose, then mirror',
      code: `
function rotate(matrix) {
  const n = matrix.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];   // transpose
    }
  }
  for (const row of matrix) row.reverse();                            // then mirror each row
}
`,
    },
    {
      id: 'math-pow',
      title: 'Pow(x, n) · exponentiation by squaring',
      code: `
function myPow(x, n) {
  if (n < 0) { x = 1 / x; n = -n; }
  let result = 1;
  while (n > 0) {
    if (n % 2 === 1) result *= x;      // this bit of the exponent is set
    x *= x;                             // square the base
    n = Math.floor(n / 2);              // halve the exponent
  }
  return result;
}
`,
    },
  ],

  watch: [
    'Copying the matrix when the problem says in place, or mixing row and column in the transpose loop (<code>j</code> must start at <code>i + 1</code>).',
    'Assuming 32-bit overflow like in Java or C++. JS numbers don’t overflow that way, but bit operators truncate to 32 bits.',
    'Halving the exponent with <code>&gt;&gt; 1</code> on a value that no longer fits in 32 bits. Use <code>Math.floor(n / 2)</code>.',
    'Forgetting the negative-exponent case, or <code>x = 0</code> with a negative exponent.',
  ],

  groups: [
    {
      items: [
        ['Rotate Image', 'M', 'Transpose, then reverse each row.'],
        ['Spiral Matrix', 'M', 'Four boundaries. Walk the top row, right column, bottom row and left column, then shrink each.'],
        ['Set Matrix Zeroes', 'M', 'Use the first row and column as flags (remember whether they need zeroing themselves) for O(1) space.', 'matrix as its own memory'],
        ['Happy Number', 'E', 'Repeat the digit-square sum. A repeat in a `Set` means a loop, and reaching 1 means happy.'],
        ['Plus One', 'E', 'Walk from the end. A 9 becomes 0 and carries. Otherwise add one and stop. If everything carries, prepend a 1.'],
        ['Pow(x, n)', 'M', 'Exponentiation by squaring. Handle a negative `n` by inverting `x`.', 'fast exponentiation'],
        ['Multiply Strings', 'M', 'Grade-school multiplication into an array of `m + n` digits. `i + j + 1` gets the product and `i + j` gets the carry.'],
        ['Detect Squares', 'M', 'A Map of point counts. For a query, treat each stored point on a diagonal as the opposite corner and multiply the counts of the other two corners.'],
      ],
    },
  ],
};
