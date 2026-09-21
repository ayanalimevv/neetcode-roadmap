// Boot: build the sidebar, route between home / all problems / a topic, and start sync.

import { TOPICS, GROUPS, TOTAL } from '../data/index.js';
import { OVERVIEW } from '../data/overview.js';
import { createStore, browserStorage } from './store.js';
import { createSync } from './sync.js';
import { initSyncUi } from './sync-ui.js';
import { startRouter } from './router.js';
import { bindFilters } from './filters.js';
import {
  renderNav, markNav, renderCrumb, renderHome, renderAll, renderTopic,
  paintRows, paintProgress, bindInteractions,
} from './render.js';

const LAST_KEY = 'neetcode-roadmap:last';
const SIDEBAR_KEY = 'neetcode-roadmap:sidebar';
const TITLE = 'NeetCode 150 Roadmap';

const storage = browserStorage();
const store = createStore({ storage });
const sync = createSync({ store, storage });

const app = document.getElementById('app');
const nav = document.getElementById('topic-nav');
const crumb = document.getElementById('crumb');
const navToggle = document.getElementById('nav-toggle');

nav.innerHTML = renderNav(TOPICS, GROUPS);
bindInteractions(app, store);

store.subscribe((source) => {
  paintProgress(TOPICS, store);
  if (source === 'remote') paintRows(app, store); // a merge from another device
});

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
document.getElementById('scrim').addEventListener('click', () => setOpen(false));
desktop.addEventListener('change', () => {
  document.body.classList.remove('nav-open');
  navToggle.setAttribute('aria-expanded', String(isOpen()));
});
nav.addEventListener('click', (e) => {
  if (!desktop.matches && e.target.closest('a')) setOpen(false);
});
addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
    e.preventDefault();
    setOpen(!isOpen());
  } else if (e.key === 'Escape' && !desktop.matches && isOpen()) {
    setOpen(false);
  }
});

// A plain "#app" link would change the hash and the router would treat it as a new page.
document.querySelector('.skip-link').addEventListener('click', (e) => {
  e.preventDefault();
  app.focus();
});

/* ---------- routing ---------- */

let firstRoute = true;
startRouter(TOPICS.map((t) => t.slug), (route) => {
  if (route.name === 'topic') {
    const i = TOPICS.findIndex((t) => t.slug === route.slug);
    const t = TOPICS[i];
    app.innerHTML = renderTopic(t, TOPICS[i - 1], TOPICS[i + 1], GROUPS[t.group]);
    document.title = `${t.title} · ${TITLE}`;
    storage.setItem(LAST_KEY, route.slug);
  } else if (route.name === 'all') {
    app.innerHTML = renderAll({ topics: TOPICS, total: TOTAL });
    bindFilters(app);
    document.title = `All problems · ${TITLE}`;
  } else {
    app.innerHTML = renderHome({ overview: OVERVIEW, topics: TOPICS, groups: GROUPS, lastSlug: storage.getItem(LAST_KEY), total: TOTAL });
    document.title = TITLE;
  }
  crumb.innerHTML = renderCrumb(route, TOPICS);
  paintRows(app, store);
  paintProgress(TOPICS, store);
  markNav(nav, route);
  if (!desktop.matches) setOpen(false);
  if (!firstRoute) {
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }
  firstRoute = false;
});

initSyncUi(sync);
sync.start();
