// Builds the HTML for the sidebar, home, all-problems and topic pages, and keeps progress in step with the store.
// Data comes from data/*.js (our own content), so it is inserted as HTML; user notes never are.

import { esc, inlineCode, highlight } from './highlight.js';

const DIFF = { E: ['Easy', 'tag-easy'], M: ['Medium', 'tag-medium'], H: ['Hard', 'tag-hard'] };
const DIFFS = ['E', 'M', 'H'];
const escAttr = (s) => esc(s).replace(/"/g, '&quot;');

const OUTLINE = [
  ['sec-theory', 'Before problem 1'],
  ['sec-templates', 'Templates'],
  ['sec-watch', 'Watch out'],
  ['problems', 'Problems'],
];

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
  if (route.name === 'all') return `${root}<span class="here">${route.filter === 'revisit' ? 'Revisit' : 'All problems'}</span>`;
  return '<span class="here">NeetCode 150</span>';
}

/* ---------- home ---------- */

export function renderHome({ overview, topics, groups, lastSlug, total, revisit = [] }) {
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
    ? `<a class="btn" href="#/${lastSlug}">Continue with ${esc(bySlug[lastSlug].title)} →</a>`
    : '';

  const legend = DIFFS
    .map((d) => `<li><span class="dot dot-${d.toLowerCase()}"></span>${DIFF[d][0]} <b data-dline="${d}"></b></li>`)
    .join('');

  const revisitSection = revisit.length
    ? `<section class="section"><h2>Revisit <span class="muted">${revisit.length}</span></h2>
        <ul class="revisit-list">${revisit
          .slice(0, 8)
          .map((r) => `<li><button type="button" class="link-row" data-goto-problem="${r.id}"><span>${esc(r.name)}</span><span class="muted">${esc(r.topicTitle)}</span></button></li>`)
          .join('')}</ul>
        ${revisit.length > 8 ? '<p class="after"><a href="#/all/revisit">See all starred problems →</a></p>' : ''}</section>`
    : '';

  return `<div class="page">
    <h1>${esc(overview.title)}</h1>
    <p class="lede">${inlineCode(overview.lede)}</p>

    <section class="progress-card" aria-labelledby="pc-h">
      <div class="pc-head"><h2 id="pc-h">Your progress</h2><span class="pc-pct" data-pct></span></div>
      <div class="pc-nums"><span class="pc-big" data-big>0</span><span class="pc-of">/ ${total} solved</span></div>
      <div class="stack" id="home-bar" role="progressbar" aria-label="Problems solved" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="0">
        <i class="pseg pseg-e" data-seg="E"></i><i class="pseg pseg-m" data-seg="M"></i><i class="pseg pseg-h" data-seg="H"></i>
      </div>
      <ul class="pc-legend">${legend}</ul>
      <div class="actions">
        <button type="button" class="btn btn-primary" data-goto-problem data-next>Up next</button>
        ${resume}
        <a class="btn" href="#/all">Browse all ${total} problems</a>
        ${revisit.length ? `<a class="btn" href="#/all/revisit">Revisit (${revisit.length})</a>` : ''}
      </div>
    </section>

    <section class="section"><h2>How to use this</h2><div class="loop">${loop}</div><p class="calm">${inlineCode(overview.calm)}</p></section>
    ${revisitSection}
    <section class="section"><h2>Which technique is this?</h2><dl class="pick">${pick}</dl></section>
    <section class="section"><h2>Topics</h2>${tiles}</section>
  </div>`;
}

/* ---------- problems ---------- */

const SPARK = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.5l1.6 4.4 4.4 1.6-4.4 1.6L10 14.5l-1.6-4.4L4 8.5l4.4-1.6z"/></svg>';
const STAR = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.6l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 7.9l5-.7z"/></svg>';

function lcLink(p) {
  if (!p.lc) return '';
  const label = `LeetCode #${p.lc.n}`;
  const title = p.lc.premium ? `${label} · needs LeetCode Premium` : `${label} · press o`;
  return `<a class="lc" href="${p.lc.url}" target="_blank" rel="noopener noreferrer" title="${escAttr(title)}" ` +
    `aria-label="Open ${escAttr(p.name)} on LeetCode, opens in a new tab">${label}<span aria-hidden="true"> ↗</span></a>`;
}

function problemRow(p, num, q = '') {
  const [label, cls] = DIFF[p.diff];
  const premium = p.lc?.premium ? '<span class="tag tag-premium" title="Needs LeetCode Premium">Premium</span>' : '';
  const learn = p.learn ? `<span class="tag">learn: ${esc(p.learn)}</span>` : '';
  return `<li class="prob" data-id="${p.id}" data-diff="${p.diff}"${q ? ` data-q="${escAttr(q)}"` : ''}>
    <input type="checkbox" id="c-${p.id}" aria-label="Mark ${escAttr(p.name)} solved">
    <div>
      <div class="pline">
        <span class="pnum">${String(num).padStart(2, '0')}</span><label class="pname" for="c-${p.id}">${esc(p.name)}</label>
        <span class="pactions">${lcLink(p)}<button type="button" class="ask" aria-label="Ask the assistant about ${escAttr(p.name)}" title="Ask the assistant · press a">${SPARK}</button><button type="button" class="star" aria-pressed="false" aria-label="Star ${escAttr(p.name)} to revisit" title="Revisit · press s">${STAR}</button></span>
      </div>
      <p class="hint">${inlineCode(p.hint)}</p>
      <input class="note" id="n-${p.id}" type="text" maxlength="500" placeholder="One-line takeaway: what was the trick?" aria-label="Note for ${escAttr(p.name)}" hidden>
    </div>
    <div class="ptags"><span class="tag ${cls}">${label}</span>${premium}${learn}</div>
  </li>`;
}

export function renderAll({ topics, total, filter = '' }) {
  const options = topics.map((t) => `<option value="${t.id}">${esc(t.title)}</option>`).join('');
  const pressed = (v) => String((filter || '') === v);
  const blocks = topics
    .map((t) => {
      let n = 0;
      const rows = t.problems
        .map((p) => problemRow(p, ++n, [p.name, p.hint, p.learn ?? '', t.title, p.lc ? `leetcode ${p.lc.n}` : ''].join(' ').toLowerCase()))
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
        <button type="button" data-f="status" data-v="" aria-pressed="${pressed('')}">All</button>
        <button type="button" data-f="status" data-v="todo" aria-pressed="false">To do</button>
        <button type="button" data-f="status" data-v="done" aria-pressed="false">Done</button>
        <button type="button" data-f="status" data-v="revisit" aria-pressed="${pressed('revisit')}">★ Revisit</button>
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

  const outline = OUTLINE.map(([id, label]) => `<button type="button" data-scroll="${id}">${label}</button>`).join('');

  return `<div class="topic-shell g-${t.group}"><article class="page">
    <h1>${esc(t.title)}</h1>
    <div class="props">
      <div class="prop"><span class="prop-k">Progress</span><span class="prop-v"><span class="num" data-count="${t.id}"></span><div class="track"><i data-bar="${t.id}"></i></div></span></div>
      <div class="prop"><span class="prop-k">By difficulty</span><span class="prop-v muted" data-diffline="${t.id}"></span></div>
      <div class="prop"><span class="prop-k">Time to learn</span><span class="prop-v">${esc(t.time)}</span></div>
      <div class="prop"><span class="prop-k">Problems</span><span class="prop-v">${t.problems.length}<button type="button" class="link-btn" data-scroll="problems">Jump to problems ↓</button></span></div>
      ${groupLabel ? `<div class="prop"><span class="prop-k">Group</span><span class="prop-v"><span class="tag tag-group">${esc(groupLabel)}</span></span></div>` : ''}
    </div>

    <section class="section" id="sec-theory"><h2>Before problem 1</h2>
      <ul class="theory">${t.theory.map((x) => `<li>${x}</li>`).join('')}</ul>
      ${t.skip ? `<p class="callout">${t.skip}</p>` : ''}
    </section>
    <section class="section" id="sec-templates"><h2>Templates</h2>${t.snippets.map(codeBlock).join('')}</section>
    <section class="section" id="sec-watch"><h2>Watch out</h2><ul class="watch">${t.watch.map((x) => `<li>${x}</li>`).join('')}</ul></section>
    <section class="section" id="problems"><h2>Problems</h2>${lists}${t.after ? `<p class="after">${t.after}</p>` : ''}</section>

    <nav class="pager" aria-label="Neighbouring topics">${pagerLink(prev, 'prev', '← Previous')}${pagerLink(next, 'next', 'Next →')}</nav>
  </article>
  <aside class="outline" aria-label="On this page"><p>On this page</p>${outline}</aside></div>`;
}

/* ---------- keeping the page in step with the store ---------- */

export function nextUnsolved(topics, store) {
  for (const t of topics) for (const p of t.problems) if (!store.isDone(p.id)) return p;
  return null;
}

function paintRow(row, store) {
  const id = row.dataset.id;
  const done = store.isDone(id);
  const starred = store.isRevisit(id);
  const box = row.querySelector('input[type="checkbox"]');
  const note = row.querySelector('.note');
  const star = row.querySelector('.star');
  box.checked = done;
  row.classList.toggle('done', done);
  row.classList.toggle('revisit', starred);
  star.setAttribute('aria-pressed', String(starred));
  if (document.activeElement !== note) note.value = store.note(id); // never overwrite a note being typed
  note.hidden = !(done || note.value || document.activeElement === note);
}

export function paintRows(app, store) {
  for (const row of app.querySelectorAll('.prob')) paintRow(row, store);
}

const setAll = (selector, fn) => document.querySelectorAll(selector).forEach(fn);

export function paintProgress(topics, store) {
  let done = 0;
  let total = 0;
  const solved = { E: 0, M: 0, H: 0 };
  const count = { E: 0, M: 0, H: 0 };

  for (const t of topics) {
    let n = 0;
    const td = { E: 0, M: 0, H: 0 };
    const dd = { E: 0, M: 0, H: 0 };
    for (const p of t.problems) {
      td[p.diff]++;
      count[p.diff]++;
      if (store.isDone(p.id)) { n++; dd[p.diff]++; solved[p.diff]++; }
    }
    done += n;
    total += t.problems.length;

    const text = `${n} / ${t.problems.length}`;
    const pct = (100 * n) / t.problems.length;
    setAll(`[data-cnt="${t.id}"]`, (el) => (el.textContent = text));
    setAll(`[data-count="${t.id}"]`, (el) => (el.textContent = `${text} solved`));
    setAll(`[data-bar="${t.id}"]`, (el) => (el.style.width = `${pct}%`));
    setAll(`[data-diffline="${t.id}"]`, (el) => (el.textContent = DIFFS.filter((d) => td[d]).map((d) => `${DIFF[d][0]} ${dd[d]}/${td[d]}`).join(' · ')));
    // the fill behind this topic's row in the sidebar
    setAll(`.sb-link[data-route="${t.slug}"]`, (el) => { el.style.setProperty('--p', pct); el.title = `${n} of ${t.problems.length} solved`; });
  }

  const all = `${done} / ${total}`;
  const pctAll = (100 * done) / total;
  setAll('[data-cnt="all"]', (el) => (el.textContent = all));
  setAll('[data-count="all"]', (el) => (el.textContent = `${all} solved`));
  setAll('[data-bar="all"]', (el) => (el.style.width = `${pctAll}%`));
  setAll('.sb-link[data-route="all"]', (el) => { el.style.setProperty('--p', pctAll); el.title = `${done} of ${total} solved`; });

  // top bar: the mini bar on wide screens, the thin line on phones
  document.getElementById('overall-text').textContent = all;
  document.getElementById('overall-bar').style.width = `${pctAll}%`;
  const line = document.getElementById('topline');
  if (line) {
    line.setAttribute('aria-valuenow', String(done));
    line.querySelector('i').style.width = `${pctAll}%`;
  }

  // home progress card
  setAll('[data-big]', (el) => (el.textContent = done));
  setAll('[data-pct]', (el) => (el.textContent = `${Math.round(pctAll)}%`));
  setAll('[data-seg]', (el) => (el.style.width = `${(100 * solved[el.dataset.seg]) / total}%`));
  setAll('[data-dline]', (el) => (el.textContent = `${solved[el.dataset.dline]}/${count[el.dataset.dline]}`));
  setAll('#home-bar', (el) => el.setAttribute('aria-valuenow', String(done)));

  const next = nextUnsolved(topics, store);
  setAll('[data-next]', (el) => {
    if (next) {
      el.textContent = `Up next: ${next.name} →`;
      el.dataset.gotoProblem = next.id;
      el.disabled = false;
    } else {
      el.textContent = `All ${total} problems solved`;
      el.dataset.gotoProblem = '';
      el.disabled = true;
    }
  });
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

export function bindInteractions(app, store, { goToProblem = () => {}, onAsk = () => {} } = {}) {
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
    const askBtn = e.target.closest('.ask');
    if (askBtn) {
      onAsk(askBtn.closest('.prob').dataset.id);
      return;
    }
    const star = e.target.closest('.star');
    if (star) {
      const row = star.closest('.prob');
      store.setRevisit(row.dataset.id, !store.isRevisit(row.dataset.id));
      paintRow(row, store);
      return;
    }
    const jump = e.target.closest('[data-scroll]');
    if (jump) {
      // Not an <a href="#…">: a hash change would be read by the router as a new page.
      document.getElementById(jump.dataset.scroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const go = e.target.closest('[data-goto-problem]');
    if (go) {
      if (go.dataset.gotoProblem) goToProblem(go.dataset.gotoProblem);
      return;
    }
    const btn = e.target.closest('.copy');
    if (!btn) return;
    const ok = await copyText(btn.closest('.code').querySelector('pre code').textContent);
    btn.textContent = ok ? 'Copied' : 'Select to copy';
    setTimeout(() => (btn.textContent = 'Copy'), 1600);
  });
}
