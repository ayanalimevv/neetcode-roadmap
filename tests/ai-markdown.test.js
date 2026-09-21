import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../js/ai/markdown.js';

const resolve = (name) => ({ 'Two Sum': 'arr-two-sum', 'Clone Graph': 'gr-clone-graph' })[name];
const md = (s) => renderMarkdown(s, { resolveProblem: resolve });

test('model output can never inject HTML, links or images', () => {
  const html = md('<script>alert(1)</script> <img src=x onerror=alert(2)> [click](javascript:alert(3)) ![x](http://evil/x.png)');
  assert.ok(!html.includes('<script'));
  assert.ok(!html.includes('<img'));
  assert.ok(!html.includes('<a '));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('javascript:alert(3)'), 'shown as plain text, not a link');
});

test('escapes inside code spans and code blocks too', () => {
  assert.ok(md('use `<b>x</b>` here').includes('<code>&lt;b&gt;x&lt;/b&gt;</code>'));
  const block = md('```js\nif (a < b && c > d) {}\n```');
  assert.ok(block.includes('&lt;') && block.includes('&amp;&amp;') && !block.includes('< b'));
});

test('paragraphs, bold and inline code', () => {
  assert.equal(md('Hello **world** and `code`.'), '<p>Hello <strong>world</strong> and <code>code</code>.</p>');
  assert.equal(md('one\ntwo\n\nthree'), '<p>one<br>two</p><p>three</p>');
});

test('bold is not applied inside inline code', () => {
  assert.ok(md('`**not bold**`').includes('<code>**not bold**</code>'));
});

test('bullet and numbered lists', () => {
  assert.equal(md('- a\n- b'), '<ul><li>a</li><li>b</li></ul>');
  assert.equal(md('* a\n* b'), '<ul><li>a</li><li>b</li></ul>');
  assert.equal(md('1. first\n2) second'), '<ol><li>first</li><li>second</li></ol>');
});

test('headings become a small heading, never a big one', () => {
  assert.equal(md('## The bug'), '<h4>The bug</h4>');
});

test('fenced code shows its language, is highlighted for JavaScript, and has a copy button', () => {
  const html = md('```js\nconst x = 1;\n```');
  assert.ok(html.includes('<figure class="code">'));
  assert.ok(html.includes('<span>js</span>'));
  assert.ok(html.includes('<span class="k">const</span>'));
  assert.ok(html.includes('class="copy"'));
  const py = md('```python\nx = 1\n```');
  assert.ok(py.includes('<span>python</span>') && !py.includes('class="n"'));
});

test('an unclosed code fence (a cut-off answer) runs to the end without breaking the page', () => {
  const html = md('Here:\n```js\nlet a = 1;\nlet b');
  assert.ok(html.includes('<pre><code>'));
  assert.ok(html.includes('let'));
  assert.equal((html.match(/<figure/g) ?? []).length, (html.match(/<\/figure>/g) ?? []).length);
});

test('[[Problem Name]] becomes a button for a known problem, and plain text otherwise', () => {
  const html = md('Try [[Two Sum]] next, or [[Some Made Up Problem]].');
  assert.ok(html.includes('<button type="button" class="ai-problem" data-goto-problem="arr-two-sum">Two Sum</button>'));
  assert.ok(html.includes('Some Made Up Problem') && !html.includes('data-goto-problem="undefined"'));
});

test('a problem name cannot break out of the attribute or the button', () => {
  const html = renderMarkdown('[[x" onclick="alert(1)]]', { resolveProblem: () => 'a" onmouseover="b' });
  assert.ok(!/onclick="alert/.test(html.replace(/&quot;/g, '')) || html.includes('&quot;'));
  assert.ok(!html.includes('" onmouseover="'), html);
});

test('empty and odd input does not throw', () => {
  assert.equal(md(''), '');
  assert.equal(md('\n\n'), '');
  assert.doesNotThrow(() => md('**unclosed bold and `unclosed code and [[unclosed'));
});
