// The render functions are pure string builders, so they can be checked without a browser.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOPICS, GROUPS, TOTAL } from '../data/index.js';
import { OVERVIEW } from '../data/overview.js';
import { renderNav, renderHome, renderTopic } from '../js/render.js';

const count = (html, re) => (html.match(re) ?? []).length;

test('the nav links to every topic once, under the right group', () => {
  const nav = renderNav(TOPICS, GROUPS);
  assert.equal(count(nav, /class="tn-link/g), 18);
  for (const t of TOPICS) assert.ok(nav.includes(`href="#/${t.slug}"`), t.slug);
  for (const label of Object.values(GROUPS)) assert.ok(nav.includes(label), label);
});

test('the home page shows all 18 tiles and every decision-table row', () => {
  const home = renderHome({ overview: OVERVIEW, topics: TOPICS, groups: GROUPS, lastSlug: 'graphs' });
  assert.equal(count(home, /class="tile /g), 18);
  assert.equal(count(home, /<div[^>]*><dt>/g), OVERVIEW.pick.length);
  assert.ok(home.includes('Continue with Graphs'));
  assert.ok(!home.includes('undefined'));
});

test('the home page shows no resume link for an unknown last topic', () => {
  const home = renderHome({ overview: OVERVIEW, topics: TOPICS, groups: GROUPS, lastSlug: 'nope' });
  assert.ok(!home.includes('Continue with'));
});

test('every topic page renders its problems, code, and neighbours', () => {
  let rows = 0;
  TOPICS.forEach((t, i) => {
    const html = renderTopic(t, TOPICS[i - 1], TOPICS[i + 1]);
    assert.ok(html.includes(`<h1>`), t.title);
    const prose = html.replace(/<code>.*?<\/code>/gs, '').replace(/<pre>.*?<\/pre>/gs, '');   // code may say "undefined" on purpose
    assert.ok(!prose.includes('undefined'), `"undefined" leaked into ${t.slug}`);
    assert.equal(count(html, /class="prob"/g), t.problems.length, t.slug);
    assert.equal(count(html, /<figure class="code"/g), t.snippets.length, t.slug);
    assert.equal(count(html, /<article/g), 1);
    assert.equal(count(html, /<\/article>/g), 1);
    assert.equal(html.includes('class="prev"'), i > 0);
    assert.equal(html.includes('class="next"'), i < TOPICS.length - 1);
    rows += count(html, /class="prob"/g);
  });
  assert.equal(rows, TOTAL);
});

test('notes are never rendered as HTML: names and hints are escaped', () => {
  const t = structuredClone(TOPICS[0]);
  t.groups[0].items[0].name = '<img src=x onerror=alert(1)>';
  t.groups[0].items[0].hint = '<b>bold</b> and `code`';
  t.problems = t.groups.flatMap((g) => g.items);
  const html = renderTopic(t);
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('<b>bold</b>'));
  assert.ok(html.includes('&lt;b&gt;bold&lt;/b&gt; and <code>code</code>'));
});

test('code blocks show highlighted, escaped code and a copy button', () => {
  const html = renderTopic(TOPICS.find((t) => t.id === 'bs'));
  assert.ok(html.includes('class="copy"'));
  assert.ok(html.includes('lo &lt;= hi') || html.includes('&lt;='), 'escaped comparison');
  assert.ok(html.includes('<span class="k">function</span>'));
});
