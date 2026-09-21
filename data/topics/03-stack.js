export default {
  id: 'stk',
  slug: 'stack',
  title: 'Stack',
  group: 'found',
  time: '≈30 min theory',

  theory: [
    '<strong>Last in, first out</strong> fits anything nested or “the most recent unresolved thing”: brackets, undo, expression evaluation.',
    '<strong>In JavaScript an array is your stack.</strong> <code>push</code> and <code>pop</code> are O(1). Read the top with <code>stack[stack.length - 1]</code>.',
    '<strong>Monotonic stack</strong> for “next greater / smaller element”. Keep the stack ordered. When a new value breaks the order, pop and resolve those entries.',
    '<strong>Push indices, not values,</strong> when the answer needs a distance or a width.',
  ],
  skip: 'Skip for now: Largest Rectangle in Histogram is the hardest monotonic-stack problem here. Do it last.',

  snippets: [
    {
      id: 'stk-valid-parens',
      title: 'Valid Parentheses',
      code: `
function isValid(s) {
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  for (const ch of s) {
    if (ch in pairs) {
      if (stack.pop() !== pairs[ch]) return false;   // wrong opener, or the stack was empty
    } else {
      stack.push(ch);
    }
  }
  return stack.length === 0;                          // nothing left open
}
`,
    },
    {
      id: 'stk-daily-temps',
      title: 'Daily Temperatures · monotonic stack',
      code: `
function dailyTemperatures(temps) {
  const res = new Array(temps.length).fill(0);
  const stack = [];                                   // indices still waiting for a warmer day
  for (let i = 0; i < temps.length; i++) {
    while (stack.length && temps[i] > temps[stack[stack.length - 1]]) {
      const j = stack.pop();
      res[j] = i - j;                                 // days waited
    }
    stack.push(i);
  }
  return res;
}
`,
    },
  ],

  watch: [
    'Popping an empty stack. <code>pop()</code> returns <code>undefined</code>, so check the length first or compare safely.',
    'Forgetting the final <code>stack.length === 0</code> check, which lets unmatched openers through.',
    'In a monotonic stack, using <code>&gt;=</code> where the problem needs <code>&gt;</code> (equal values), or the reverse.',
    'Using <code>shift()</code> or <code>unshift()</code> as stack operations. They are O(n). Stick to <code>push</code> and <code>pop</code>.',
  ],

  groups: [
    {
      items: [
        ['Valid Parentheses', 'E', 'Push openers. A closer must match the top. The stack must be empty at the end.'],
        ['Min Stack', 'M', 'Push `[value, minSoFar]` pairs so the minimum is always on top.'],
        ['Evaluate Reverse Polish Notation', 'M', 'Push numbers. On an operator pop two (right operand first), apply it, push the result. Use `Math.trunc` for division.'],
        ['Generate Parentheses', 'M', 'Backtrack: add `(` while `open < n`, add `)` while `close < open`.', 'backtracking preview'],
        ['Daily Temperatures', 'M', 'Monotonic stack of indices. Pop while today is warmer.', 'monotonic stack'],
        ['Car Fleet', 'M', 'Sort by position, closest to the target first, and compute arrival times. A car that arrives later than the fleet ahead starts a new fleet.'],
        ['Largest Rectangle In Histogram', 'H', 'Stack of increasing bar indices. When a shorter bar arrives, pop and compute the width each popped bar could span.'],
      ],
    },
  ],
};
