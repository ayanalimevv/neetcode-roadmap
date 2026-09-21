// Boot: build the nav, route between home and topic pages, and start sync.

import { TOPICS, GROUPS } from '../data/index.js';
import { OVERVIEW } from '../data/overview.js';
import { createStore, browserStorage } from './store.js';
import { createSync } from './sync.js';
import { initSyncUi } from './sync-ui.js';
import { startRouter } from './router.js';
import { renderNav, markNav, renderHome, renderTopic, paintRows, paintProgress, bindInteractions } from './render.js';

const LAST_KEY = 'neetcode-roadmap:last';
const TITLE = 'NeetCode 150 Roadmap';

const storage = browserStorage();
const store = createStore({ storage });
const sync = createSync({ store, storage });

const app = document.getElementById('app');
const nav = document.getElementById('topic-nav');
const navToggle = document.getElementById('nav-toggle');

nav.innerHTML = renderNav(TOPICS, GROUPS);
bindInteractions(app, store);

store.subscribe((source) => {
  paintProgress(TOPICS, store);
  if (source === 'remote') paintRows(app, store); // a merge from another device
});

function setNavOpen(open) {
  document.body.classList.toggle('nav-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
}
navToggle.addEventListener('click', () => setNavOpen(!document.body.classList.contains('nav-open')));
nav.addEventListener('click', (e) => {
  if (e.target.closest('a')) setNavOpen(false);
});

let firstRoute = true;
startRouter(TOPICS.map((t) => t.slug), (route) => {
  if (route.name === 'topic') {
    const i = TOPICS.findIndex((t) => t.slug === route.slug);
    app.innerHTML = renderTopic(TOPICS[i], TOPICS[i - 1], TOPICS[i + 1]);
    document.title = `${TOPICS[i].title} · ${TITLE}`;
    storage.setItem(LAST_KEY, route.slug);
  } else {
    app.innerHTML = renderHome({ overview: OVERVIEW, topics: TOPICS, groups: GROUPS, lastSlug: storage.getItem(LAST_KEY) });
    document.title = TITLE;
  }
  paintRows(app, store);
  paintProgress(TOPICS, store);
  markNav(nav, route);
  setNavOpen(false);
  if (!firstRoute) {
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }
  firstRoute = false;
});

initSyncUi(sync);
sync.start();
