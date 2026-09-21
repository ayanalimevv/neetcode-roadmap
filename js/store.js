// Ticks and notes for every problem. localStorage is the offline cache; js/sync.js copies it to a Gist.
// Records are { d, dt, n, nt } (see js/merge.js).

import { sanitize } from './merge.js';

const KEY = 'neetcode-roadmap:v1';

export function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
  };
}

// localStorage can be missing or throw (private windows, blocked site data): fall back to memory.
export function browserStorage() {
  try {
    const s = globalThis.localStorage;
    s.setItem('__probe', '1');
    s.removeItem('__probe');
    return s;
  } catch {
    return memoryStorage();
  }
}

const newest = (items) => Object.values(items).reduce((m, r) => Math.max(m, r.dt, r.nt), 0);

export function createStore({ storage = browserStorage(), now = Date.now } = {}) {
  const listeners = new Set();
  let items = load();
  let lastStamp = newest(items);

  function load() {
    try {
      const saved = JSON.parse(storage.getItem(KEY));
      return saved && saved.v === 1 ? sanitize(saved.items) : {};
    } catch {
      return {};
    }
  }

  function persist() {
    try {
      storage.setItem(KEY, JSON.stringify({ v: 1, items }));
    } catch {
      /* out of space or blocked: keep working in memory */
    }
  }

  function emit(source) {
    for (const fn of listeners) fn(source);
  }

  // Strictly increasing, and never older than anything this device has seen. So an edit made
  // after receiving another device's edit always sorts after it, even if the two clocks disagree.
  function stamp() {
    lastStamp = Math.max(now(), lastStamp + 1);
    return lastStamp;
  }

  return {
    isDone: (id) => items[id]?.d === 1,
    note: (id) => items[id]?.n ?? '',
    doneCount: (ids) => ids.filter((id) => items[id]?.d === 1).length,

    setDone(id, done) {
      const r = (items[id] ??= { d: 0, dt: 0, n: '', nt: 0 });
      r.d = done ? 1 : 0;
      r.dt = stamp();
      persist();
      emit('local');
    },

    setNote(id, text) {
      if (!items[id] && !text) return;
      const r = (items[id] ??= { d: 0, dt: 0, n: '', nt: 0 });
      r.n = String(text).slice(0, 500);
      r.nt = stamp();
      persist();
      emit('local');
    },

    snapshot: () => JSON.parse(JSON.stringify(items)),

    // Used by sync after a merge. Emits 'remote' so the sync engine does not echo it back as an edit.
    replaceAll(next) {
      items = sanitize(next);
      lastStamp = Math.max(lastStamp, newest(items));
      persist();
      emit('remote');
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
