// Builds the HTML for the nav, the home page and topic pages, and keeps progress in step with the store.
// Data comes from data/*.js (our own content), so it is inserted as HTML; user notes never are.

import { esc, inlineCode, highlight } from './highlight.js';

const DIFF = { E: 'Easy', M: 'Medium', H: 'Hard' };

/* ---------- nav ---------- */

export function renderNav(topics, groups) {
  let html = '<a class="tn-home" href="#/" data-route="home">Overview</a>';
  for (const [key, label] of Object.entries(groups)) {
    html += `<h3 class="tn-group">${esc(label)}</h3>`;
    for (const t of topics.filter((x) => x.group === key)) {
      html += `<a class="tn-link g-${t.group}" href="#/${t.slug}" data-route="${t.slug}">` +
        `<span>${esc(t.title)}</span><span class="tn-cnt" data-cnt="${t.id}"></span></a>`;
    }
  }
  return html;
}

export function markNav(nav, route) {
  const current = route.name === 'topic' ? route.slug : 'home';
  for (const a of nav.querySelectorAll('[data-route]')) {
    if (a.dataset.route === current) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
}

/* ---------- home ---------- */

export function renderHome({ overview, topics, groups, lastSlug }) {
  const bySlug = Object.fromEntries(topics.map((t) => [t.slug, t]));

  const loop = overview.loop
    .map((x) => `<div><h3>${esc(x.title)}</h3><p>${inlineCode(x.text)}</p></div>`)
    .join('');

  const pick = overview.pick
    .map((r) => {
      const t = r.slug && bySlug[r.slug];
      const answer = t ? `<a href="#/${t.slug}">${esc(r.label ?? t.title)}</a>` : inlineCode(r.then);
      return `<div${t ? ` class="g-${t.group}"` : ''}><dt>${esc(r.when)}</dt><dd>${answer}</dd></div>`;
    })
    .join('');

  const tiles = Object.entries(groups)
    .map(([key, label]) => {
      const cards = topics
        .filter((t) => t.group === key)
        .map(
          (t) =>
            `<a class="tile g-${t.group}" href="#/${t.slug}"><b>${esc(t.title)}</b>` +
            `<span data-count="${t.id}"></span><span>${esc(t.time)}</span>` +
            `<div class="track"><i data-bar="${t.id}"></i></div></a>`,
        )
        .join('');
      return `<div class="tile-group"><h3>${esc(label)}</h3><div class="tiles">${cards}</div></div>`;
    })
    .join('');

  const resume = bySlug[lastSlug]
    ? `<a class="resume" href="#/${lastSlug}">Continue with ${esc(bySlug[lastSlug].title)} →</a>`
    : '';

  return `<div class="home">
    <section class="home-hero">
      <p class="eyebrow">NeetCode 150 · JavaScript</p>
      <h1>${esc(overview.title)}</h1>
      <p class="lede">${inlineCode(overview.lede)}</p>
      ${resume}
    </section>
    <section><h2>How to use this</h2><div class="loop">${loop}</div><p class="calm">${inlineCode(overview.calm)}</p></section>
    <section><h2>Which technique is this?</h2><dl class="pick">${pick}</dl></section>
    <section><h2>All 18 topics</h2>${tiles}</section>
  </div>`;
}

/* ---------- topic ---------- */

function codeBlock(s) {
  const note = s.note ? ` <small>· ${esc(s.note)}</small>` : '';
  return `<figure class="code"><figcaption><span>${esc(s.title)}${note}</span>` +
    `<button type="button" class="copy">Copy</button></figcaption>` +
    `<pre><code>${highlight(s.code.replace(/^\n+|\s+$/g, ''))}</code></pre></figure>`;
}

function problemRow(p) {
  const learn = p.learn ? `<span class="learn">learn: ${esc(p.learn)}</span>` : '';
  return `<li class="prob" data-id="${p.id}">
    <input type="checkbox" id="c-${p.id}" aria-label="Mark ${esc(p.name)} solved">
    <div>
      <div class="ptop"><label class="pname" for="c-${p.id}">${esc(p.name)}</label>
        <span class="diff" data-d="${p.diff}">${DIFF[p.diff]}</span>${learn}</div>
      <p class="hint">${inlineCode(p.hint)}</p>
      <input class="note" id="n-${p.id}" type="text" maxlength="500" placeholder="One-line takeaway: what was the trick?" hidden>
    </div>
  </li>`;
}

function pagerLink(t, cls, label) {
  return t ? `<a class="${cls}" href="#/${t.slug}"><small>${label}</small><span>${esc(t.title)}</span></a>` : '';
}

export function renderTopic(t, prev, next) {
  const lists = t.groups
    .map((g) => {
      const head = g.title ? `<h3 class="grp">${esc(g.title)} <span>${esc(g.sub ?? '')}</span></h3>` : '';
      return `${head}<ol class="plist">${g.items.map(problemRow).join('')}</ol>`;
    })
    .join('');

  return `<article class="topic g-${t.group}">
    <header class="topic-head">
      <div><p class="eyebrow">${esc(t.time)} · ${t.problems.length} problems</p><h1>${esc(t.title)}</h1></div>
      <div class="prog"><span class="prog-n" data-count="${t.id}"></span><div class="track"><i data-bar="${t.id}"></i></div></div>
    </header>
    <div class="topic-grid">
      <div class="col">
        <div><h3>Before problem 1</h3>
          <ul class="theory">${t.theory.map((x) => `<li>${x}</li>`).join('')}</ul>
          ${t.skip ? `<p class="skip">${t.skip}</p>` : ''}
        </div>
        ${t.snippets.map(codeBlock).join('')}
        <div><h3>Watch out</h3><ul class="watch">${t.watch.map((x) => `<li>${x}</li>`).join('')}</ul></div>
      </div>
      <div class="col"><div>${lists}</div>${t.after ? `<p class="after">${t.after}</p>` : ''}</div>
    </div>
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
  document.getElementById('overall-text').textContent = `${done} / ${total}`;
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
    const btn = e.target.closest('.copy');
    if (!btn) return;
    const ok = await copyText(btn.closest('.code').querySelector('pre code').textContent);
    btn.textContent = ok ? 'Copied' : 'Select to copy';
    setTimeout(() => (btn.textContent = 'Copy'), 1600);
  });
}
