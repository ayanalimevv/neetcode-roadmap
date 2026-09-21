import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esc, inlineCode, highlight } from '../js/highlight.js';

test('esc escapes the three characters that matter in HTML text', () => {
  assert.equal(esc('a < b && c > d'), 'a &lt; b &amp;&amp; c &gt; d');
});

test('inlineCode escapes first, then wraps `code`', () => {
  assert.equal(inlineCode('use `a < b` here'), 'use <code>a &lt; b</code> here');
});

test('highlight never lets raw markup through', () => {
  const html = highlight('if (a < b) { x = "<img>"; } // <script>');
  assert.ok(!html.includes('<img>'));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;'));
});

test('a comment swallows keywords inside it', () => {
  const html = highlight('// return const 42');
  assert.equal(html, '<span class="c">// return const 42</span>');
});

test('keywords, strings and numbers get their own classes', () => {
  const html = highlight("const n = 42; const s = 'hi';");
  assert.ok(html.includes('<span class="k">const</span>'));
  assert.ok(html.includes('<span class="n">42</span>'));
  assert.ok(html.includes(`<span class="s">'hi'</span>`));
});

test('member calls such as .get and .has are not mistaken for keywords', () => {
  const html = highlight('map.get(x); set.has(y);');
  assert.ok(!html.includes('class="k"'));
});
