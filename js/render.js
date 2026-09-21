// Builds the HTML for the sidebar, home, all-problems and topic pages, and keeps progress in step with the store.
// Data comes from data/*.js (our own content), so it is inserted as HTML; user notes never are.

import { esc, inlineCode, highlight } from './highlight.js';

const DIFF = { E: ['Easy', 'tag-easy'], M: ['Medium', 'tag-medium'], H: ['Hard', 'tag-hard'] };
const escAttr = (s) => esc(s).replace(/"/g, '&quot;');

/* ---------- sidebar and breadcrumb ---------- */

export function renderNav(topics, groups) {
  let html =
    '<a class="sb-brand" href="#/"><span class="sb-logo">N</span>NeetCode 150</a>' +
    '<a class="sb-link" href="#/" data-route="home"><span>Overview</span></a>' +
    '<a class="sb-link" href="#/all" data-route="all"><span>All problems</span><span class="sb-cnt" data-cnt="all"></span></a>';
  for (const [key, label] of Object.entries(groups)) {
    html += `<div class="sb-label">${esc(label)}</div>`;
    for (const t of topics.filter((x) => x.group === key)) {
      html += `<a class="sb-link" href="#/${t.slug}" data-route="${t.slug}">` +
        `<span>${esc(t.title)}</span><span class="sb-cnt" data-cnt="${t.id}"></span></a>`;
    }
  }
  return html;
}

export function markNav(nav, route) {
  const current = route.name === 'topic' ? route.slug : route.name;
  for (const a of nav.querySelectorAll('[data-route]')) {
    if (a.dataset.route === current) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
}

export function renderCrumb(route, topics) {
  const root = '<a href="#/">NeetCode 150</a><span>/</span>';
  if (route.name === 'topic') return `${root}<span class="here">${esc(topics.find((t) => t.slug === route.slug).title)}</span>`;
  if (route.name === 'all') return `${root}<span class="here">All problems</span>`;
  return '<span class="here">NeetCode 150</span>';
}

/* ---------- home ---------- */

export function renderHome({ overview, topics, groups, lastSlug, total }) {
  const bySlug = Object.fromEntries(topics.map((t) => [t.slug, t]));

  const loop = overview.loop
    .map((x) => `<div><h3>${esc(x.title)}</h3><p>${inlineCode(x.text)}</p></div>`)
    .join('');

  const pick = overview.pick
    .map((r) => {
      const t = r.slug && bySlug[r.slug];
      const answer = t ? `<a href="#/${t.slug}">${esc(r.label ?? t.title)}</a>` : inlineCode(r.then);
      return `<div><dt>${esc(r.when)}</dt><dd>${answer}</dd></div>`;
    })
    .join('');

  const tiles = Object.entries(groups)
    .map(([key, label]) => {
      const cards = topics
        .filter((t) => t.group === key)
        .map(
          (t) =>
            `<a class="tile" href="#/${t.slug}"><b>${esc(t.title)}</b>` +
            `<span data-count="${t.id}"></span><span>${esc(t.time)}</span>` +
            `<div class="track"><i data-bar="${t.id}"></i></div></a>`,
        )
        .join('');
      return `<p class="tile-label">${esc(label)}</p><div class="tiles">${cards}</div>`;
    })
    .join('');

  const resume = bySlug[lastSlug]
    ? `<a class="btn btn-primary" href="#/${lastSlug}">Continue with ${esc(bySlug[lastSlug].title)} →</a>`
    : '';

  return `<div class="page">
    <h1>${esc(overview.title)}</h1>
    <p class="lede">${inlineCode(overview.lede)}</p>
    <div class="actions">${resume}<a class="btn" href="#/all">Browse all ${total} problems</a></div>
    <section class="section"><h2>How to use this</h2><div class="loop">${loop}</div><p class="calm">${inlineCode(overview.calm)}</p></section>
    <section class="section"><h2>Which technique is this?</h2><dl class="pick">${pick}</dl></section>
    <section class="section"><h2>Topics</h2>${tiles}</section>
  </div>`;
}

/* ---------- problems ---------- */

function problemRow(p, num, q = '') {
  const [label, cls] = DIFF[p.diff];
  const learn = p.learn ? `<span class="tag">learn: ${esc(p.learn)}</span>` : '';
  return `<li class="prob" data-id="${p.id}" data-diff="${p.diff}"${q ? ` data-q="${escAttr(q)}"` : ''}>
    <input type="checkbox" id="c-${p.id}" aria-label="Mark ${escAttr(p.name)} solved">
    <div>
      <div><span class="pnum">${String(num).padStart(2, '0')}</span><label class="pname" for="c-${p.id}">${esc(p.name)}</label></div>
      <p class="hint">${inlineCode(p.hint)}</p>
      <input class="note" id="n-${p.id}" type="text" maxlength="500" placeholder="One-line takeaway: what was the trick?" aria-label="Note for ${escAttr(p.name)}" hidden>
    </div>
    <div class="ptags"><span class="tag ${cls}">${label}</span>${learn}</div>
  </li>`;
}

export function renderAll({ topics, total }) {
  const options = topics.map((t) => `<option value="${t.id}">${esc(t.title)}</option>`).join('');
  const blocks = topics
    .map((t) => {
      let n = 0;
      const rows = t.problems
        .map((p) => problemRow(p, ++n, [p.name, p.hint, p.learn ?? '', t.title].join(' ').toLowerCase()))
        .join('');
      return `<section class="grp-block" data-topic="${t.id}">
        <h2 class="grp-h"><a href="#/${t.slug}">${esc(t.title)}</a><span data-count="${t.id}"></span></h2>
        <ol class="plist">${rows}</ol></section>`;
    })
    .join('');

  return `<div class="page page-wide" id="all-page">
    <h1>All problems</h1>
    <p class="lede">All ${total} problems on one page, in NeetCode’s order. Search, filter, tick and take notes right here.</p>
    <div class="props"><div class="prop"><span class="prop-k">Progress</span>
      <span class="prop-v"><span class="num" data-count="all"></span><div class="track"><i data-bar="all"></i></div></span></div></div>

    <div class="filters" role="search">
      <input id="f-q" type="search" placeholder="Search problems, patterns, hints…" aria-label="Search problems">
      <select id="f-topic" aria-label="Topic"><option value="">All topics</option>${options}</select>
      <div class="seg" role="group" aria-label="Difficulty">
        <button type="button" data-f="diff" data-v="" aria-pressed="true">All</button>
        <button type="button" data-f="diff" data-v="E" aria-pressed="false">Easy</button>
        <button type="button" data-f="diff" data-v="M" aria-pressed="false">Medium</button>
        <button type="button" data-f="diff" data-v="H" aria-pressed="false">Hard</button>
      </div>
      <div class="seg" role="group" aria-label="Status">
        <button type="button" data-f="status" data-v="" aria-pressed="true">All</button>
        <button type="button" data-f="status" data-v="todo" aria-pressed="false">To do</button>
        <button type="button" data-f="status" data-v="done" aria-pressed="false">Done</button>
      </div>
      <label class="toggle"><input type="checkbox" id="f-hints" checked> Hints</label>
      <span id="f-count" class="f-count" aria-live="polite"></span>
    </div>

    <div id="all-list">${blocks}</div>
    <p id="f-empty" class="empty" hidden>No problems match these filters.</p>
  </div>`;
}

/* ---------- topic ---------- */

function codeBlock(s) {
  const note = s.note ? ` <small>· ${esc(s.note)}</small>` : '';
  return `<figure class="code"><figcaption><span>${esc(s.title)}${note}</span>` +
    `<button type="button" class="copy">Copy</button></figcaption>` +
    `<pre><code>${highlight(s.code.replace(/^\n+|\s+$/g, ''))}</code></pre></figure>`;
}

function pagerLink(t, cls, label) {
  return t ? `<a class="${cls}" href="#/${t.slug}"><small>${label}</small><span>${esc(t.title)}</span></a>` : '';
}

export function renderTopic(t, prev, next, groupLabel = '') {
  let n = 0;
  const lists = t.groups
    .map((g) => {
      const head = g.title ? `<h3 class="grp">${esc(g.title)} <span>${esc(g.sub ?? '')}</span></h3>` : '';
      return `${head}<ol class="plist">${g.items.map((p) => problemRow(p, ++n)).join('')}</ol>`;
    })
    .join('');

  return `<article class="page g-${t.group}">
    <h1>${esc(t.title)}</h1>
    <div class="props">
      <div class="prop"><span class="prop-k">Progress</span><span class="prop-v"><span class="num" data-count="${t.id}"></span><div class="track"><i data-bar="${t.id}"></i></div></span></div>
      <div class="prop"><span class="prop-k">Time to learn</span><span class="prop-v">${esc(t.time)}</span></div>
      <div class="prop"><span class="prop-k">Problems</span><span class="prop-v">${t.problems.length}<button type="button" class="link-btn" data-scroll="problems">Jump to problems ↓</button></span></div>
      ${groupLabel ? `<div class="prop"><span class="prop-k">Group</span><span class="prop-v"><span class="tag tag-group">${esc(groupLabel)}</span></span></div>` : ''}
    </div>

    <section class="section"><h2>Before problem 1</h2>
      <ul class="theory">${t.theory.map((x) => `<li>${x}</li>`).join('')}</ul>
      ${t.skip ? `<p class="callout">${t.skip}</p>` : ''}
    </section>
    <section class="section"><h2>Templates</h2>${t.snippets.map(codeBlock).join('')}</section>
    <section class="section"><h2>Watch out</h2><ul class="watch">${t.watch.map((x) => `<li>${x}</li>`).join('')}</ul></section>
    <section class="section" id="problems"><h2>Problems</h2>${lists}${t.after ? `<p class="after">${t.after}</p>` : ''}</section>

    <nav class="pager" aria-label="Neighbouring topics">${pagerLink(prev, 'prev', '← Previous')}${pagerLink(next, 'next', 'Next →')}</nav>
  </article>`;
}

/* ---------- keeping the page in step with the store ---------- */

function paintRow(row, store) {
  const id = row.dataset.id;
  const done = store.isDone(id);
  const box = row.querySelector('input[type="checkbox"]');
  const note = row.querySelector('.note');
  box.checked = done;
  row.classList.toggle('done', done);
  if (document.activeElement !== note) note.value = store.note(id); // never overwrite a note being typed
  note.hidden = !(done || note.value);
}

export function paintRows(app, store) {
  for (const row of app.querySelectorAll('.prob')) paintRow(row, store);
}

export function paintProgress(topics, store) {
  let done = 0;
  let total = 0;
  for (const t of topics) {
    const n = store.doneCount(t.problems.map((p) => p.id));
    done += n;
    total += t.problems.length;
    const text = `${n} / ${t.problems.length}`;
    for (const el of document.querySelectorAll(`[data-cnt="${t.id}"]`)) el.textContent = text;
    for (const el of document.querySelectorAll(`[data-count="${t.id}"]`)) el.textContent = `${text} solved`;
    for (const el of document.querySelectorAll(`[data-bar="${t.id}"]`)) el.style.width = `${(100 * n) / t.problems.length}%`;
  }
  const all = `${done} / ${total}`;
  for (const el of document.querySelectorAll('[data-cnt="all"]')) el.textContent = all;
  for (const el of document.querySelectorAll('[data-count="all"]')) el.textContent = `${all} solved`;
  for (const el of document.querySelectorAll('[data-bar="all"]')) el.style.width = `${(100 * done) / total}%`;
  document.getElementById('overall-text').textContent = all;
  document.getElementById('overall-bar').style.width = `${(100 * done) / total}%`;
}

/* ---------- events (delegated, so they survive re-rendering the page) ---------- */

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function bindInteractions(app, store) {
  app.addEventListener('change', (e) => {
    const box = e.target.closest('.prob input[type="checkbox"]');
    if (!box) return;
    const row = box.closest('.prob');
    store.setDone(row.dataset.id, box.checked);
    paintRow(row, store);
  });

  app.addEventListener('input', (e) => {
    const note = e.target.closest('.prob .note');
    if (note) store.setNote(note.closest('.prob').dataset.id, note.value);
  });

  app.addEventListener('click', async (e) => {
    const jump = e.target.closest('[data-scroll]');
    if (jump) {
      // Not an <a href="#…">: a hash change would be read by the router as a new page.
      document.getElementById(jump.dataset.scroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const btn = e.target.closest('.copy');
    if (!btn) return;
    const ok = await copyText(btn.closest('.code').querySelector('pre code').textContent);
    btn.textContent = ok ? 'Copied' : 'Select to copy';
    setTimeout(() => (btn.textContent = 'Copy'), 1600);
  });
}
