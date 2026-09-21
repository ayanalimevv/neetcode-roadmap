import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SYSTEM, buildPrompt, numberLines, contextBlock, topicText, trimHistory, HINT_LEVELS } from '../js/ai/prompts.js';
import { TOPICS, PROBLEM_BY_ID } from '../data/index.js';

const topic = TOPICS.find((t) => t.id === 'gr');
const problem = PROBLEM_BY_ID.get('gr-clone-graph');
const base = { topic, problem, cap: 10000 };

test('the system prompt sets the rules the assistant must follow', () => {
  assert.match(SYSTEM, /never give a full solution unless/i);
  assert.match(SYSTEM, /cannot run code/i);
  assert.match(SYSTEM, /never (claim you ran it|invent)/i);
  assert.match(SYSTEM, /\[\[Problem Name\]\]/);
  assert.match(SYSTEM, /JavaScript/);
  assert.match(SYSTEM, /line numbers/i);
});

test('numberLines puts a right-aligned line number in front of every line', () => {
  assert.equal(numberLines('a\nb'), '1 | a\n2 | b');
  const ten = Array.from({ length: 10 }, (_, i) => `x${i}`).join('\n');
  assert.equal(numberLines(ten).split('\n')[0], ' 1 | x0');
  assert.equal(numberLines(ten).split('\n')[9], '10 | x9');
  assert.equal(numberLines('a\r\nb\r\n\r\n'), '1 | a\n2 | b');
});

test('the context names the topic and the problem, with the LeetCode number and the site hint', () => {
  const c = contextBlock({ topic, problem });
  assert.match(c, /Topic: Graphs/);
  assert.match(c, /Clone Graph \(LeetCode #133\)/);
  assert.match(c, /Medium/);
  assert.match(c, /one-line hint/);
  assert.match(contextBlock({ topic, problem: PROBLEM_BY_ID.get('arr-encode-and-decode-strings') }), /Premium/);
  assert.equal(contextBlock({}), '');
});

test('a hint starts at a nudge, asks for exactly one level, and never asks for code before the last level', () => {
  const nudge = buildPrompt({ ...base, mode: 'hint' }).content;
  assert.match(nudge, /NUDGE only/);
  assert.match(nudge, /Do not name the algorithm/);
  for (const level of ['nudge', 'pattern', 'outline']) {
    const { content } = buildPrompt({ ...base, mode: 'hint', level });
    assert.ok(!/FULL SOLUTION/.test(content), level);
  }
  assert.match(buildPrompt({ ...base, mode: 'hint', level: 'pattern' }).content, /PATTERN only/);
  assert.match(buildPrompt({ ...base, mode: 'hint', level: 'outline' }).content, /Do not write code/);
  assert.match(buildPrompt({ ...base, mode: 'hint', level: 'solution' }).content, /FULL SOLUTION/);
  assert.deepEqual(HINT_LEVELS, ['nudge', 'pattern', 'outline', 'solution']);
});

test('what the user has tried is passed along with a hint request', () => {
  assert.match(buildPrompt({ ...base, mode: 'hint', question: 'I tried BFS but revisit nodes' }).content, /I tried BFS but revisit nodes/);
});

test('debug sends numbered code and asks for the bug first, without the fix', () => {
  const code = 'function f(a) {\n  return a + 1;\n}';
  const { content } = buildPrompt({ ...base, mode: 'debug', code, expected: '3', actual: '2' });
  assert.match(content, /1 \| function f\(a\) \{/);
  assert.match(content, /2 \|   return a \+ 1;/);
  assert.match(content, /quote the exact line/i);
  assert.match(content, /Do NOT write corrected code yet/);
  assert.match(content, /What I expected: 3/);
  assert.match(content, /What happened \(error or wrong output\): 2/);
  assert.match(content, /```js/);
});

test('the fix is only requested by the explicit follow-up', () => {
  assert.ok(!/minimal fix/i.test(buildPrompt({ ...base, mode: 'debug', code: 'x' }).content));
  const fix = buildPrompt({ ...base, mode: 'debug', followUp: 'fix', hasHistory: true }).content;
  assert.match(fix, /minimal fix/i);
});

test('debug and review need code unless there is a conversation to follow up on', () => {
  assert.match(buildPrompt({ ...base, mode: 'debug' }).error, /Paste the code/);
  assert.match(buildPrompt({ ...base, mode: 'review' }).error, /Paste the solution/);
  assert.equal(buildPrompt({ ...base, mode: 'debug', hasHistory: true, question: 'why line 3?' }).content, 'why line 3?');
});

test('review asks for the useful headings and a related problem in [[double brackets]]', () => {
  const { content } = buildPrompt({ ...base, mode: 'review', code: 'x' });
  for (const h of ['Complexity', 'Edge cases', 'Cleaner version', 'Alternative approach', 'Pattern', 'Try next']) assert.match(content, new RegExp(h));
  assert.match(content, /\[\[Problem Name\]\]/);
});

test('explain can summarise a whole topic, from plain text without HTML', () => {
  const { content } = buildPrompt({ ...base, mode: 'explain', summarize: true });
  assert.match(content, /TL;DR/);
  assert.match(content, /Topic: Graphs/);
  assert.match(content, /Theory:/);
  assert.ok(!/<code>|<strong>/.test(content), 'no HTML tags');
  assert.ok(!/&lt;|&amp;/.test(topicText(TOPICS.find((t) => t.id === 'stk'))), 'entities decoded');
  assert.match(buildPrompt({ ...base, mode: 'explain' }).error, /what you would like explained/i);
});

test('chat needs a question', () => {
  assert.match(buildPrompt({ ...base, mode: 'chat' }).error, /question/i);
  assert.match(buildPrompt({ ...base, mode: 'chat', question: 'why BFS?' }).content, /why BFS\?/);
});

test('the site context is only included on the first message of a conversation', () => {
  assert.match(buildPrompt({ ...base, mode: 'chat', question: 'q' }).content, /Topic: Graphs/);
  assert.equal(buildPrompt({ ...base, mode: 'chat', question: 'q', hasHistory: true }).content, 'q');
});

test('a message over the engine limit is refused with a helpful message, not sent', () => {
  const big = 'x'.repeat(12000);
  const r = buildPrompt({ ...base, mode: 'debug', code: big, cap: 10000 });
  assert.equal(r.content, undefined);
  assert.match(r.error, /over this engine's limit of 10,000/);
  assert.match(r.error, /switch engine/i);
  assert.ok(buildPrompt({ ...base, mode: 'debug', code: big, cap: 40000 }).content);
});

test('trimHistory keeps whole recent messages within the cap, starting with a user message', () => {
  const m = (role, n) => ({ role, content: 'x'.repeat(n) });
  const history = [m('user', 100), m('assistant', 100), m('user', 100), m('assistant', 100)];
  assert.equal(trimHistory(history, 1000).length, 4);
  const trimmed = trimHistory(history, 250);
  assert.equal(trimmed[0].role, 'user');
  assert.ok(trimmed.reduce((n, x) => n + x.content.length, 0) <= 250);
  assert.equal(trimHistory(history, 1000, 2).length, 2);
  assert.deepEqual(trimHistory([], 100), []);
});
