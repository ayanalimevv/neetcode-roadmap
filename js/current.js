// The "current" problem row, for keyboard use: j/k move it, x ticks, s stars, n opens the note, o opens LeetCode.
// It is just a class on a row (.is-current); the store is still changed through the row's own buttons, so
// ticking with the keyboard behaves exactly like ticking with the mouse.

export function createCurrent(app) {
  let id = null;

  const rows = () => [...app.querySelectorAll('.prob:not([hidden])')];
  const row = () => (id ? app.querySelector(`.prob[data-id="${id}"]:not([hidden])`) : null);

  function clear() {
    app.querySelectorAll('.prob.is-current').forEach((r) => r.classList.remove('is-current'));
    id = null;
  }

  function set(target, { scroll = true } = {}) {
    clear();
    id = target.dataset.id;
    target.classList.add('is-current');
    if (scroll) target.scrollIntoView({ block: 'nearest' });
  }

  // Clicking a row makes it current, so j/k continue from where you clicked.
  app.addEventListener('click', (e) => {
    const r = e.target.closest('.prob');
    if (r && !r.hidden) set(r, { scroll: false });
  });

  return {
    has: () => !!row(),
    clear,
    set,

    /** j / k. With nothing selected yet, start from the first row on screen. */
    move(dir) {
      const list = rows();
      if (!list.length) return false;
      const at = list.indexOf(row());
      if (at === -1) {
        const visible = list.findIndex((r) => {
          const b = r.getBoundingClientRect();
          return b.bottom > 120 && b.top < innerHeight;
        });
        set(list[visible === -1 ? 0 : visible]);
        return true;
      }
      set(list[Math.min(list.length - 1, Math.max(0, at + dir))]);
      return true;
    },

    toggleDone() {
      const r = row();
      if (!r) return false;
      r.querySelector('input[type="checkbox"]').click();
      return true;
    },

    toggleRevisit() {
      const r = row();
      if (!r) return false;
      r.querySelector('.star').click();
      return true;
    },

    editNote() {
      const r = row();
      if (!r) return false;
      const note = r.querySelector('.note');
      note.hidden = false;
      note.focus();
      return true;
    },

    openLeetCode() {
      const a = row()?.querySelector('a.lc');
      if (!a) return false;
      window.open(a.href, '_blank', 'noopener,noreferrer');
      return true;
    },
  };
}
