import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TOPICS, TOTAL, GROUPS } from '../data/index.js';
import { OVERVIEW } from '../data/overview.js';

// neetcode150.json is NeetCode's own list, copied from their public repo (.problemSiteData.json).
const snapshot = JSON.parse(readFileSync(new URL('./neetcode150.json', import.meta.url), 'utf8'));
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

test('18 topics, in NeetCode order, 150 problems in total', () => {
  assert.deepEqual(TOPICS.map((t) => t.id), Object.keys(snapshot));
  assert.equal(TOTAL, 150);
});

for (const t of TOPICS) {
  test(`${t.title}: problems match NeetCode's list, in order, with the same difficulty`, () => {
    const want = snapshot[t.id].map(([name, diff]) => `${norm(name)}:${diff}`);
    const got = t.problems.map((p) => `${norm(p.name)}:${p.diff}`);
    assert.deepEqual(got, want);
  });

  test(`${t.title}: has the pieces a topic page needs`, () => {
    assert.match(t.slug, /^[a-z0-9-]+$/);
    assert.ok(t.group in GROUPS, `unknown group ${t.group}`);
    assert.ok(t.time && t.title);
    assert.ok(t.theory.length >= 3, 'theory');
    assert.ok(t.watch.length >= 3, 'watch');
    assert.ok(t.snippets.length >= 1, 'snippets');
    for (const p of t.problems) {
      assert.ok(p.hint && p.hint.length > 10, `hint for ${p.name}`);
      assert.ok('EMH'.includes(p.diff), `difficulty for ${p.name}`);
    }
  });

  // Theory, watch and skip text is inserted as HTML, so only a few tags and entities may appear.
  test(`${t.title}: HTML in theory and watch is well-formed`, () => {
    const html = [...t.theory, ...t.watch, t.skip ?? '', t.after ?? ''].join('\n');
    const withoutTags = html.replace(/<\/?(code|strong|em|ul|li|a)\b[^>]*>/g, '');
    assert.ok(!withoutTags.includes('<'), 'a raw "<" (write &lt;) or an unknown tag');
    assert.ok(!/&(?!(amp|lt|gt|nbsp|#\d+);)/.test(withoutTags), 'a raw "&" (write &amp;)');
    for (const tag of ['code', 'strong', 'em', 'ul', 'li']) {
      const open = (html.match(new RegExp(`<${tag}\\b`, 'g')) ?? []).length;
      const close = (html.match(new RegExp(`</${tag}>`, 'g')) ?? []).length;
      assert.equal(open, close, `unbalanced <${tag}>`);
    }
  });
}

test('problem ids are unique and safe to use as storage keys', () => {
  const ids = TOPICS.flatMap((t) => t.problems.map((p) => p.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z0-9-]{1,80}$/);
});

test('topic slugs are unique', () => {
  const slugs = TOPICS.map((t) => t.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});

test('snippet ids are unique and every `needs` resolves', () => {
  const all = TOPICS.flatMap((t) => t.snippets);
  const ids = all.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const s of all) for (const n of s.needs ?? []) assert.ok(ids.includes(n), `${s.id} needs ${n}`);
});

test('the home page links only to topics that exist', () => {
  const slugs = new Set(TOPICS.map((t) => t.slug));
  for (const r of OVERVIEW.pick) if (r.slug) assert.ok(slugs.has(r.slug), r.slug);
});
