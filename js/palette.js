// The command palette (Cmd/Ctrl+K): one search box over actions, topics and every problem.
// Markup lives in index.html (#palette). It is a native <dialog>, so focus trapping and Esc come for free,
// and the backdrop is dimmed and blurred by CSS.

import { search } from './search.js';
import { esc } from './highlight.js';

const $ = (id) => document.getElementById(id);
const KIND_LABEL = { action: 'Action', topic: 'Topic', problem: 'Problem' };
const DIFF_LABEL = { E: 'Easy', M: 'Medium', H: 'Hard' };
const MAX_RESULTS = 12;

/**
 * commands: [{ title, hint?, keywords?, run }]      go: { topic(slug), problem(id) }      openUrl(url)
 * Returns { open(), close() }.
 */
export function initPalette({ topics, store, commands, go, openUrl }) {
  const dialog = $('palette');
  const input = $('pal-input');
  const list = $('pal-list');

  const actionItems = commands.map((c) => ({ kind: 'action', title: c.title, sub: c.hint ?? '', keywords: c.keywords ?? '', run: c.run }));
  const topicItems = topics.map((t) => ({
    kind: 'topic', title: t.title, sub: `${t.problems.length} problems`, keywords: t.time, run: () => go.topic(t.slug),
  }));
  const problemItems = topics.flatMap((t) =>
    t.problems.map((p) => ({
      kind: 'problem', title: p.name, sub: t.title, problem: p,
      keywords: `${p.learn ?? ''} ${p.hint} ${p.lc ? `leetcode ${p.lc.n}` : ''}`,
      run: () => go.problem(p.id),
    })),
  );
  const everything = [...actionItems, ...topicItems, ...problemItems];

  let items = [];
  let active = 0;

  function results(query) {
    // Nothing typed: the actions, then every topic. Problems only appear once you start typing.
    return query.trim() ? search(everything, query, MAX_RESULTS) : [...actionItems, ...topicItems];
  }

  function meta(item) {
    if (item.kind === 'problem') {
      const p = item.problem;
      const state = [store.isDone(p.id) ? '<span class="pal-done" title="Solved">✓</span>' : '', store.isRevisit(p.id) ? '<span class="pal-star" title="Starred">★</span>' : ''].join('');
      return `${state}<span class="pal-diff pal-diff-${p.diff.toLowerCase()}">${DIFF_LABEL[p.diff]}</span>`;
    }
    if (item.kind === 'topic') return '<span class="pal-kind">Topic</span>';
    return '<span class="pal-kind">Action</span>';
  }

  function render() {
    items = results(input.value);
    active = Math.min(active, Math.max(0, items.length - 1));
    list.innerHTML = items.length
      ? items
          .map(
            (item, i) =>
              `<li role="option" id="pal-o${i}" data-i="${i}" aria-selected="${i === active}">` +
              `<span class="pal-main"><span class="pal-title">${esc(item.title)}</span>` +
              `${item.sub ? `<span class="pal-sub">${esc(item.sub)}</span>` : ''}</span>` +
              `<span class="pal-meta">${meta(item)}</span></li>`,
          )
          .join('')
      : '<li class="pal-empty" role="presentation">Nothing matches. Try a topic, a problem name, or a pattern like “bfs”.</li>';
    input.setAttribute('aria-activedescendant', items.length ? `pal-o${active}` : '');
  }

  function setActive(i, { scroll = true } = {}) {
    if (!items.length) return;
    active = (i + items.length) % items.length;
    list.querySelectorAll('[role="option"]').forEach((li, n) => li.setAttribute('aria-selected', String(n === active)));
    input.setAttribute('aria-activedescendant', `pal-o${active}`);
    if (scroll) $(`pal-o${active}`)?.scrollIntoView({ block: 'nearest' });
  }

  function choose(i, { leetcode = false } = {}) {
    const item = items[i];
    if (!item) return;
    if (leetcode) {
      if (item.problem?.lc) openUrl(item.problem.lc.url); // ⌘/Ctrl+Enter: straight to LeetCode
      return;
    }
    close();
    item.run();
  }

  function open() {
    document.querySelectorAll('dialog[open]').forEach((d) => { if (d !== dialog) d.close(); });
    if (!dialog.open) dialog.showModal();
    input.value = '';
    active = 0;
    render();
    input.focus();
  }

  function close() {
    if (dialog.open) dialog.close();
  }

  input.addEventListener('input', () => { active = 0; render(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(active, { leetcode: e.metaKey || e.ctrlKey }); }
  });
  list.addEventListener('click', (e) => {
    const li = e.target.closest('[role="option"]');
    if (li) choose(Number(li.dataset.i), { leetcode: e.metaKey || e.ctrlKey });
  });
  list.addEventListener('mousemove', (e) => {
    const li = e.target.closest('[role="option"]');
    if (li && Number(li.dataset.i) !== active) setActive(Number(li.dataset.i), { scroll: false });
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close(); // a click on the dimmed backdrop
  });

  return { open, close };
}
