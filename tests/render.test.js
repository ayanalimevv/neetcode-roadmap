// The render functions are pure string builders, so they can be checked without a browser.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOPICS, GROUPS, TOTAL } from '../data/index.js';
import { OVERVIEW } from '../data/overview.js';
import { renderNav, renderCrumb, renderHome, renderAll, renderTopic } from '../js/render.js';

const count = (html, re) => (html.match(re) ?? []).length;
const allPages = () => [
  renderNav(TOPICS, GROUPS),
  renderHome({ overview: OVERVIEW, topics: TOPICS, groups: GROUPS, lastSlug: 'graphs', total: TOTAL }),
  renderAll({ topics: TOPICS, total: TOTAL }),
  ...TOPICS.map((t, i) => renderTopic(t, TOPICS[i - 1], TOPICS[i + 1], GROUPS[t.group])),
];

test('the sidebar links to Overview, All problems and every topic, under the right group', () => {
  const nav = renderNav(TOPICS, GROUPS);
  assert.equal(count(nav, /class="sb-link"/g), 20);
  assert.ok(nav.includes('href="#/all"'));
  for (const t of TOPICS) assert.ok(nav.includes(`href="#/${t.slug}"`), t.slug);
  for (const label of Object.values(GROUPS)) assert.ok(nav.includes(label), label);
});

test('breadcrumbs name the current page', () => {
  assert.ok(renderCrumb({ name: 'topic', slug: 'graphs' }, TOPICS).includes('Graphs'));
  assert.ok(renderCrumb({ name: 'all' }, TOPICS).includes('All problems'));
  assert.ok(renderCrumb({ name: 'home' }, TOPICS).includes('NeetCode 150'));
});

test('the home page shows all 18 tiles, every decision-table row, and a way to the full list', () => {
  const home = renderHome({ overview: OVERVIEW, topics: TOPICS, groups: GROUPS, lastSlug: 'graphs', total: TOTAL });
  assert.equal(count(home, /class="tile"/g), 18);
  assert.equal(count(home, /<div><dt>/g), OVERVIEW.pick.length);
  assert.ok(home.includes('Continue with Graphs'));
  assert.ok(home.includes('href="#/all"') && home.includes('Browse all 150 problems'));
  assert.ok(!home.includes('undefined'));
});

test('the home page shows no resume link for an unknown last topic', () => {
  const home = renderHome({ overview: OVERVIEW, topics: TOPICS, groups: GROUPS, lastSlug: 'nope', total: TOTAL });
  assert.ok(!home.includes('Continue with'));
});

test('every topic page puts the problems last, after theory, templates and watch-outs', () => {
  let rows = 0;
  TOPICS.forEach((t, i) => {
    const html = renderTopic(t, TOPICS[i - 1], TOPICS[i + 1], GROUPS[t.group]);
    const at = (s) => html.indexOf(s);
    assert.ok(at('<h2>Before problem 1</h2>') < at('<h2>Templates</h2>'), t.slug);
    assert.ok(at('<h2>Templates</h2>') < at('<h2>Watch out</h2>'), t.slug);
    assert.ok(at('<h2>Watch out</h2>') < at('id="problems"'), t.slug);
    assert.ok(html.includes('data-scroll="problems"'), 'a jump-to-problems button');

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

test('the all-problems page lists all 150 problems in 18 topic blocks with working controls', () => {
  const html = renderAll({ topics: TOPICS, total: TOTAL });
  assert.equal(count(html, /class="prob"/g), 150);
  assert.equal(count(html, /class="grp-block"/g), 18);
  assert.equal(count(html, /data-q="/g), 150);
  for (const id of ['f-q', 'f-topic', 'f-hints', 'f-count', 'f-empty']) assert.ok(html.includes(`id="${id}"`), id);
  assert.equal(count(html, /<option value="/g), 19);                 // 18 topics + "All topics"
  assert.equal(count(html, /data-f="diff"/g), 4);
  assert.equal(count(html, /data-f="status"/g), 3);
  assert.ok(html.includes('data-q="two sum'), 'search text is lower-cased');
});

test('no link can change the hash to something that is not a route', () => {
  for (const html of allPages()) {
    const bad = html.match(/href="#(?!\/)[^"]*"/g);
    assert.equal(bad, null, `router would treat ${bad} as a new page`);
  }
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

test('a quote in a problem name cannot break out of an attribute', () => {
  const t = structuredClone(TOPICS[0]);
  t.groups[0].items[0].name = 'He said "hi" onmouseover="x"';
  t.problems = t.groups.flatMap((g) => g.items);
  const html = renderTopic(t);
  assert.ok(!html.includes('aria-label="Mark He said "'));
  assert.ok(html.includes('&quot;hi&quot;'));
});

test('code blocks show highlighted, escaped code and a copy button', () => {
  const html = renderTopic(TOPICS.find((t) => t.id === 'bs'));
  assert.ok(html.includes('class="copy"'));
  assert.ok(html.includes('&lt;='), 'escaped comparison');
  assert.ok(html.includes('<span class="k">function</span>'));
});
