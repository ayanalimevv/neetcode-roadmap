// The "?" shortcut cheat sheet. Built from SHORTCUTS, so it can never drift from what the keys really do.

import { SHORTCUTS, isMac } from './keys.js';
import { esc } from './highlight.js';

export function keyLabel(k, mac = isMac()) {
  return k === 'mod' ? (mac ? '⌘' : 'Ctrl') : k;
}

/** Text form for a hint, like "g h" or "⌘ K". */
export function shortcutText(action, mac = isMac()) {
  const s = SHORTCUTS.find((x) => x.action === action);
  return s ? s.keys.map((k) => keyLabel(k, mac)).join(' ') : '';
}

export function initHelp() {
  const dialog = document.getElementById('help');
  const body = document.getElementById('help-body');

  const groups = [...new Set(SHORTCUTS.map((s) => s.group))];
  body.innerHTML = groups
    .map(
      (g) => `<section><h3>${esc(g)}</h3><dl>${SHORTCUTS.filter((s) => s.group === g)
        .map((s) => `<div><dt>${s.keys.map((k) => `<kbd>${esc(keyLabel(k))}</kbd>`).join('')}</dt><dd>${esc(s.label)}</dd></div>`)
        .join('')}</dl></section>`,
    )
    .join('');

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  document.getElementById('help-close').addEventListener('click', () => dialog.close());

  return {
    open() {
      document.querySelectorAll('dialog[open]').forEach((d) => { if (d !== dialog) d.close(); });
      if (!dialog.open) dialog.showModal();
    },
  };
}
