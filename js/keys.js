// Keyboard shortcuts. createKeyHandler() turns key events into calls on an `actions` object, so the logic
// can be tested with fake events. SHORTCUTS drives both the "?" cheat sheet and the tests: each entry says
// which keys to press and which action they must trigger.

export const SHORTCUTS = [
  { group: 'General', keys: ['mod', 'K'], label: 'Command palette', action: 'palette', press: [{ key: 'k', ctrlKey: true }] },
  { group: 'General', keys: ['/'], label: 'Search everything', action: 'palette', press: [{ key: '/' }] },
  { group: 'General', keys: ['a'], label: 'Ask the assistant (about the current problem)', action: 'ask', press: [{ key: 'a' }] },
  { group: 'General', keys: ['?'], label: 'Show these shortcuts', action: 'help', press: [{ key: '?', shiftKey: true }] },
  { group: 'General', keys: ['mod', '\\'], label: 'Toggle the sidebar', action: 'sidebar', press: [{ key: '\\', ctrlKey: true }] },
  { group: 'Go to', keys: ['g', 'h'], label: 'Overview', action: 'home', press: [{ key: 'g' }, { key: 'h' }] },
  { group: 'Go to', keys: ['g', 'a'], label: 'All problems', action: 'all', press: [{ key: 'g' }, { key: 'a' }] },
  { group: 'Go to', keys: ['g', 'r'], label: 'Revisit list', action: 'revisit', press: [{ key: 'g' }, { key: 'r' }] },
  { group: 'Go to', keys: ['g', 'n'], label: 'Next unsolved problem', action: 'nextUnsolved', press: [{ key: 'g' }, { key: 'n' }] },
  { group: 'Go to', keys: ['['], label: 'Previous topic', action: 'prevTopic', press: [{ key: '[' }] },
  { group: 'Go to', keys: [']'], label: 'Next topic', action: 'nextTopic', press: [{ key: ']' }] },
  { group: 'Problems', keys: ['j'], label: 'Next problem', action: 'next', press: [{ key: 'j' }] },
  { group: 'Problems', keys: ['k'], label: 'Previous problem', action: 'prev', press: [{ key: 'k' }] },
  { group: 'Problems', keys: ['x'], label: 'Tick or untick (Space works too)', action: 'toggleDone', press: [{ key: 'x' }] },
  { group: 'Problems', keys: ['s'], label: 'Star for revisit', action: 'toggleRevisit', press: [{ key: 's' }] },
  { group: 'Problems', keys: ['n'], label: 'Write a note', action: 'editNote', press: [{ key: 'n' }] },
  { group: 'Problems', keys: ['o'], label: 'Open on LeetCode (Enter works too)', action: 'openLeetCode', press: [{ key: 'o' }] },
  { group: 'Problems', keys: ['Esc'], label: 'Clear the current problem', action: 'clear', press: [{ key: 'Escape' }] },
];

const TEXT_INPUTS = new Set(['text', 'search', 'password', 'email', 'url', 'tel', 'number', '']);
const INTERACTIVE = 'a, button, input, select, textarea, summary, [role="button"]';
const PREFIX_MS = 1000;

/** True when typing should go to the element, not to a shortcut. Checkboxes and buttons don't count. */
export function isTypingTarget(t) {
  if (!t) return false;
  if (t.isContentEditable) return true;
  if (t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return true;
  return t.tagName === 'INPUT' && TEXT_INPUTS.has((t.type ?? '').toLowerCase());
}

export function isMac(nav = globalThis.navigator) {
  return /mac|iphone|ipad/i.test(nav?.userAgentData?.platform || nav?.platform || '');
}

export function createKeyHandler(actions, { now = Date.now, isBlocked = () => false } = {}) {
  let prefixAt = 0; // when "g" was pressed, or 0

  return function onKeyDown(e) {
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key;

    // Run an action; stop the browser's own handling unless the action says it did nothing.
    const run = (name) => {
      const result = actions[name]?.();
      if (result === false) return false;
      e.preventDefault();
      return true;
    };

    if (mod && !e.altKey) {
      if (key.toLowerCase() === 'k') return run('palette');
      if (key === '\\') return run('sidebar');
      return false;
    }
    if (mod || e.altKey) return false;
    if (isTypingTarget(e.target) || isBlocked()) return false;

    if (prefixAt && now() - prefixAt < PREFIX_MS) {
      prefixAt = 0;
      const second = { h: 'home', a: 'all', r: 'revisit', n: 'nextUnsolved' }[key];
      if (second) return run(second);
    }
    prefixAt = 0;

    const interactive = e.target?.closest?.(INTERACTIVE);
    switch (key) {
      case 'g': prefixAt = now(); return true;
      case '/': return run('palette');
      case '?': return run('help');
      case 'a': return run('ask');
      case '[': return run('prevTopic');
      case ']': return run('nextTopic');
      case 'j': return run('next');
      case 'k': return run('prev');
      case 'x': return run('toggleDone');
      case 's': return run('toggleRevisit');
      case 'n': return run('editNote');
      case 'o': return run('openLeetCode');
      case ' ':
      case 'Enter':
        // Only when a problem is selected and focus is not on a button or link, or Space could not scroll.
        if (interactive || !actions.hasCurrent?.()) return false;
        return run(key === ' ' ? 'toggleDone' : 'openLeetCode');
      case 'Escape':
        actions.clear?.();
        return false; // dialogs still close themselves
      default: return false;
    }
  };
}
