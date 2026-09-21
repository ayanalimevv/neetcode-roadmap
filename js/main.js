// Boot: build the sidebar, route between home / all problems / a topic, wire the keyboard and the palette, start sync.

import { TOPICS, GROUPS, TOTAL, PROBLEMS, PROBLEM_BY_ID, TOPIC_BY_ID } from '../data/index.js';
import { OVERVIEW } from '../data/overview.js';
import { createStore, browserStorage } from './store.js';
import { createSync } from './sync.js';
import { initSyncUi } from './sync-ui.js';
import { startRouter } from './router.js';
import { bindFilters } from './filters.js';
import { createKeyHandler, isMac } from './keys.js';
import { createCurrent } from './current.js';
import { initPalette } from './palette.js';
import { initHelp, shortcutText } from './help.js';
import { initOutline } from './outline.js';
import {
  renderNav, markNav, renderCrumb, renderHome, renderAll, renderTopic,
  paintRows, paintProgress, bindInteractions, nextUnsolved,
} from './render.js';

const LAST_KEY = 'neetcode-roadmap:last';
const SIDEBAR_KEY = 'neetcode-roadmap:sidebar';
const TITLE = 'NeetCode 150 Roadmap';

const storage = browserStorage();
const store = createStore({ storage });
const sync = createSync({ store, storage });

const $ = (id) => document.getElementById(id);
const app = $('app');
const nav = $('topic-nav');
const crumb = $('crumb');
const navToggle = $('nav-toggle');

let route = { name: 'home' };
let pendingProblem = null;
let stopOutline = () => {};

nav.innerHTML = renderNav(TOPICS, GROUPS);
const current = createCurrent(app);

/* ---------- jumping to a problem (palette, "Up next", revisit list) ---------- */

function focusRow(id) {
  const row = app.querySelector(`.prob[data-id="${id}"]:not([hidden])`);
  if (!row) return false;
  current.set(row, { scroll: false });
  row.scrollIntoView({ block: 'center' });
  row.classList.remove('flash');
  void row.offsetWidth; // restart the animation if it is already running
  row.classList.add('flash');
  return true;
}

function goToProblem(id) {
  const p = PROBLEM_BY_ID.get(id);
  if (!p || focusRow(id)) return;
  pendingProblem = id; // the row is on another page: go there, then focus it once it is drawn
  location.hash = `#/${TOPIC_BY_ID.get(p.topic).slug}`;
}

bindInteractions(app, store, { goToProblem });

/* ---------- sidebar: folds away on desktop (remembered), slides over the page on a phone ---------- */

const desktop = matchMedia('(min-width: 900px)');
const isOpen = () => (desktop.matches ? !document.body.classList.contains('sidebar-collapsed') : document.body.classList.contains('nav-open'));

function setOpen(open) {
  if (desktop.matches) {
    document.body.classList.toggle('sidebar-collapsed', !open);
    storage.setItem(SIDEBAR_KEY, open ? 'open' : 'closed');
  } else {
    document.body.classList.toggle('nav-open', open);
  }
  navToggle.setAttribute('aria-expanded', String(open));
}

if (storage.getItem(SIDEBAR_KEY) === 'closed') document.body.classList.add('sidebar-collapsed');
navToggle.setAttribute('aria-expanded', String(isOpen()));
navToggle.addEventListener('click', () => setOpen(!isOpen()));
$('scrim').addEventListener('click', () => setOpen(false));
desktop.addEventListener('change', () => {
  document.body.classList.remove('nav-open');
  navToggle.setAttribute('aria-expanded', String(isOpen()));
});
nav.addEventListener('click', (e) => {
  if (!desktop.matches && e.target.closest('a')) setOpen(false);
});
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !desktop.matches && isOpen() && !document.querySelector('dialog[open]')) setOpen(false);
});

// A plain "#app" link would change the hash and the router would treat it as a new page.
document.querySelector('.skip-link').addEventListener('click', (e) => {
  e.preventDefault();
  app.focus();
});

/* ---------- keyboard and palette ---------- */

const topicIndex = () => (route.name === 'topic' ? TOPICS.findIndex((t) => t.slug === route.slug) : -1);
const go = (hash) => { location.hash = hash; };

const help = initHelp();

const actions = {
  sidebar: () => setOpen(!isOpen()),
  help: () => help.open(),
  home: () => go('#/'),
  all: () => go('#/all'),
  revisit: () => go('#/all/revisit'),
  nextUnsolved() {
    const p = nextUnsolved(TOPICS, store);
    if (!p) return false;
    goToProblem(p.id);
  },
  nextTopic() {
    const t = TOPICS[topicIndex() + 1];
    if (!t) return false;
    go(`#/${t.slug}`);
  },
  prevTopic() {
    const i = topicIndex();
    if (i < 0) return false;
    go(i === 0 ? '#/' : `#/${TOPICS[i - 1].slug}`);
  },
  next: () => current.move(1),
  prev: () => current.move(-1),
  toggleDone: () => current.toggleDone(),
  toggleRevisit: () => current.toggleRevisit(),
  editNote: () => current.editNote(),
  openLeetCode: () => current.openLeetCode(),
  clear: () => current.clear(),
  hasCurrent: () => current.has(),
};

const palette = initPalette({
  topics: TOPICS,
  store,
  go: { topic: (slug) => go(`#/${slug}`), problem: goToProblem },
  openUrl: (url) => window.open(url, '_blank', 'noopener,noreferrer'),
  commands: [
    { title: 'Jump to next unsolved problem', hint: shortcutText('nextUnsolved'), keywords: 'up next continue', run: () => actions.nextUnsolved() },
    { title: 'Go to Overview', hint: shortcutText('home'), keywords: 'home', run: actions.home },
    { title: 'Go to All problems', hint: shortcutText('all'), keywords: 'list browse filter', run: actions.all },
    { title: 'Show revisit list', hint: shortcutText('revisit'), keywords: 'starred star', run: actions.revisit },
    { title: 'Toggle sidebar', hint: shortcutText('sidebar'), keywords: 'menu hide show', run: actions.sidebar },
    { title: 'Sync settings', hint: 'devices', keywords: 'gist token sync', run: () => $('sync-chip').click() },
    { title: 'Keyboard shortcuts', hint: shortcutText('help'), keywords: 'keys help', run: actions.help },
  ],
});
actions.palette = palette.open;

addEventListener('keydown', createKeyHandler(actions, { isBlocked: () => !!document.querySelector('dialog[open]') }));

const searchBtn = $('search-btn');
searchBtn.addEventListener('click', palette.open);
searchBtn.querySelector('kbd').textContent = isMac() ? '⌘K' : 'Ctrl K';
document.querySelector('.pal-mod').textContent = isMac() ? '⌘' : 'Ctrl';

/* ---------- routing ---------- */

const revisitList = () => {
  const ids = new Set(store.revisitIds());
  return PROBLEMS.filter((p) => ids.has(p.id)).map((p) => ({ id: p.id, name: p.name, topicTitle: TOPIC_BY_ID.get(p.topic).title }));
};

function draw(r) {
  stopOutline();
  stopOutline = () => {};
  current.clear();
  if (r.name === 'topic') {
    const i = TOPICS.findIndex((t) => t.slug === r.slug);
    const t = TOPICS[i];
    app.innerHTML = renderTopic(t, TOPICS[i - 1], TOPICS[i + 1], GROUPS[t.group]);
    document.title = `${t.title} · ${TITLE}`;
    storage.setItem(LAST_KEY, r.slug);
    stopOutline = initOutline(app);
  } else if (r.name === 'all') {
    app.innerHTML = renderAll({ topics: TOPICS, total: TOTAL, filter: r.filter });
    document.title = `${r.filter === 'revisit' ? 'Revisit' : 'All problems'} · ${TITLE}`;
  } else {
    app.innerHTML = renderHome({ overview: OVERVIEW, topics: TOPICS, groups: GROUPS, lastSlug: storage.getItem(LAST_KEY), total: TOTAL, revisit: revisitList() });
    document.title = TITLE;
  }
  paintRows(app, store); // before the filters, which read each row's done/revisit state
  if (r.name === 'all') bindFilters(app);
  crumb.innerHTML = renderCrumb(r, TOPICS);
  paintProgress(TOPICS, store);
  markNav(nav, r);
}

let firstRoute = true;
startRouter(TOPICS.map((t) => t.slug), (r) => {
  route = r;
  draw(r);
  if (!desktop.matches) setOpen(false);
  else nav.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' });
  if (!firstRoute) {
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }
  firstRoute = false;
  if (pendingProblem) {
    const id = pendingProblem;
    pendingProblem = null;
    focusRow(id); // the page is already drawn; no need to wait for a frame (which a background tab never runs)
  }
});

store.subscribe((source) => {
  paintProgress(TOPICS, store);
  if (source === 'remote') {
    paintRows(app, store); // a merge from another device
    if (route.name === 'home') draw(route); // the revisit list may have changed
  }
});

initSyncUi(sync);
sync.start();
