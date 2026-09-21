// Everything the assistant says to the model. Pure functions, so the rules are easy to test:
//  - hints climb a ladder and a full solution is never the default
//  - the user's code is sent with line numbers, so the model can point at "line 7"
//  - the model is told it cannot run code, so it must not invent output
//  - requests stay under a size cap (Groq's free plan allows only about 8K tokens a minute)

export const SYSTEM = [
  'You are a friendly, precise tutor for data structures and algorithms. You are helping one person work through the NeetCode 150 list in JavaScript.',
  'Rules:',
  '- Keep answers short and concrete. Prefer a tiny example over a long explanation. Use Markdown.',
  '- Never give a full solution unless the user asks for it explicitly (hint level "full solution", or "show the fix"). Otherwise help them think.',
  '- When you debug, the user\'s code has line numbers. Point at the exact line, explain why it fails on a tiny input, and stop. Do not rewrite their code until they ask.',
  '- You cannot run code. Never claim you ran it and never invent program output. If you need real output, ask the user to paste it.',
  '- Write all code in JavaScript. State time and space complexity in Big-O when it matters.',
  '- When you suggest another problem to practise, write it exactly as [[Problem Name]] using its official NeetCode name.',
  '- If you are not sure of a fact about a specific LeetCode problem, say so instead of guessing.',
].join('\n');

export const MODES = ['hint', 'debug', 'review', 'explain', 'chat'];
export const HINT_LEVELS = ['nudge', 'pattern', 'outline', 'solution'];
export const HINT_LABELS = { nudge: 'Nudge', pattern: 'Pattern', outline: 'Outline', solution: 'Full solution' };

const HINT_TEXT = {
  nudge: 'Give me a NUDGE only: one or two sentences that steer me toward the right question to ask. Do not name the algorithm or data structure.',
  pattern: 'Give me the PATTERN only: name the technique or data structure that fits and say why it fits, in a few sentences. Do not list steps or write code.',
  outline: 'Give me an OUTLINE: the approach as short numbered steps in plain words, plus the time and space complexity. Do not write code.',
  solution: 'Give me the FULL SOLUTION: clear, commented JavaScript, then a short explanation and the time and space complexity.',
};

/** Puts "  1 | " in front of every line so the model can cite line numbers. */
export function numberLines(code) {
  const lines = String(code).replace(/\r\n?/g, '\n').replace(/\s+$/, '').split('\n');
  const width = String(lines.length).length;
  return lines.map((l, i) => `${String(i + 1).padStart(width, ' ')} | ${l}`).join('\n');
}

const stripTags = (html) => String(html).replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** A few lines saying where the user is on the site. Small on purpose. */
export function contextBlock({ topic, problem } = {}) {
  const lines = [];
  if (topic) lines.push(`Topic: ${topic.title}.`);
  if (problem) {
    const num = problem.lc ? ` (LeetCode #${problem.lc.n}${problem.lc.premium ? ', Premium' : ''})` : '';
    lines.push(`Problem: ${problem.name}${num}, ${{ E: 'Easy', M: 'Medium', H: 'Hard' }[problem.diff] ?? ''}.`);
    if (problem.learn) lines.push(`Pattern to learn here: ${problem.learn}.`);
    if (problem.hint) lines.push(`The site's one-line hint (do not repeat it unless asked): ${problem.hint}`);
  }
  return lines.join('\n');
}

/** The text of a whole topic, for "summarise this topic". */
export function topicText(topic) {
  return [
    `Topic: ${topic.title}`,
    'Theory:',
    ...topic.theory.map((t) => `- ${stripTags(t)}`),
    'Watch out:',
    ...topic.watch.map((t) => `- ${stripTags(t)}`),
  ].join('\n');
}

const fits = (text, cap) => text.length <= cap;

/**
 * Builds the message to send. Returns { content } or { error } (too long, or something missing).
 * input: { mode, level, topic, problem, code, expected, actual, question, followUp, cap, hasHistory }
 */
export function buildPrompt(input) {
  const { mode, level = 'nudge', topic, problem, code = '', expected = '', actual = '', question = '', followUp = '', cap = 10000, hasHistory = false } = input;
  const ctx = contextBlock({ topic, problem });
  const q = question.trim();
  let body;

  if (followUp === 'fix') {
    body = 'Now show the minimal fix: only the lines that change, with a one-line reason for each, then the corrected function.';
  } else if (mode === 'hint') {
    body = `${HINT_TEXT[level] ?? HINT_TEXT.nudge}${q ? `\n\nWhat I have tried or where I am stuck: ${q}` : ''}`;
  } else if (mode === 'debug') {
    if (!code.trim()) {
      if (!hasHistory || !q) return { error: 'Paste the code you want debugged.' };
      body = q; // a follow-up question about the code already in the conversation
    } else {
      body = [
        'Debug my JavaScript. Reply in exactly this order:',
        '1. **What the code does** (two sentences).',
        '2. **The bug**: quote the exact line(s) with their line numbers. List every bug you find. If the code looks correct, say so and tell me what to test.',
        '3. **Why it fails**: trace a tiny input through it.',
        '4. Then stop and ask if I want the fix. Do NOT write corrected code yet.',
        '',
        expected.trim() ? `What I expected: ${expected.trim()}` : '',
        actual.trim() ? `What happened (error or wrong output): ${actual.trim()}` : '',
        q ? `Also: ${q}` : '',
        '',
        'My code:',
        '```js',
        numberLines(code),
        '```',
      ].filter((l, i, a) => l !== '' || (a[i - 1] !== '' && i > 0)).join('\n');
    }
  } else if (mode === 'review') {
    if (!code.trim()) {
      if (!hasHistory || !q) return { error: 'Paste the solution you want reviewed.' };
      body = q;
    } else {
      body = [
        'Review my solution. Use these headings and keep each part short:',
        '- **Complexity**: time and space in Big-O, with the reasoning.',
        '- **Edge cases**: inputs I should test that I may have missed.',
        '- **Cleaner version**: a more idiomatic JavaScript version if there is one (show it), otherwise say it is already clean.',
        '- **Alternative approach**: name it, and say when it beats mine.',
        '- **Pattern**: which pattern this problem belongs to.',
        '- **Try next**: one related problem from NeetCode 150, written as [[Problem Name]].',
        q ? `\nAlso: ${q}` : '',
        '',
        'My solution:',
        '```js',
        numberLines(code),
        '```',
      ].join('\n');
    }
  } else if (mode === 'explain') {
    if (input.summarize && topic) {
      body = `Summarise this topic for me: a one or two sentence TL;DR, then 5 bullets I should remember, then 3 mistakes to avoid.\n\n${topicText(topic)}`;
    } else if (!q) {
      return { error: 'Type what you would like explained.' };
    } else {
      body = `Explain this in plain words, with a tiny example: ${q}`;
    }
  } else {
    if (!q) return { error: 'Type your question first.' };
    body = q;
  }

  // The site context goes in on the first message, or whenever the topic or problem has changed since.
  const includeContext = input.withContext === undefined ? !hasHistory : input.withContext;
  const content = [ctx && includeContext ? `${ctx}\n` : '', body].join('\n').trim();
  if (!fits(content, cap)) {
    return { error: `That is ${content.length.toLocaleString('en-US')} characters, over this engine's limit of ${cap.toLocaleString('en-US')}. Trim the code to the function you want help with, or switch engine in the settings.` };
  }
  return { content };
}

/** Keeps the most recent messages that fit in `cap` characters, always in whole messages. */
export function trimHistory(messages, cap, keep = 8) {
  const out = [];
  let total = 0;
  for (const m of messages.slice(-keep).reverse()) {
    if (out.length && total + m.content.length > cap) break;
    out.unshift(m);
    total += m.content.length;
  }
  // Providers want the conversation to start with the user.
  while (out.length && out[0].role !== 'user') out.shift();
  return out;
}
