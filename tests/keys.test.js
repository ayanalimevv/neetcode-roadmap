import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SHORTCUTS, createKeyHandler, isTypingTarget, isMac } from '../js/keys.js';

const body = { tagName: 'BODY', closest: () => null };
const el = (tagName, type) => { const t = { tagName, type }; t.closest = () => t; return t; };
const ACTIONS = ['palette', 'help', 'sidebar', 'home', 'all', 'revisit', 'nextUnsolved', 'prevTopic', 'nextTopic',
  'next', 'prev', 'toggleDone', 'toggleRevisit', 'editNote', 'openLeetCode', 'clear', 'ask'];

function setup({ current = true, blocked = false } = {}) {
  const calls = [];
  const actions = Object.fromEntries(ACTIONS.map((a) => [a, () => { calls.push(a); }]));
  actions.hasCurrent = () => current;
  let t = 1000;
  const handler = createKeyHandler(actions, { now: () => t, isBlocked: () => blocked });
  const press = (key, extra = {}, target = body) => {
    const e = { key, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, target, defaultPrevented: false, ...extra };
    e.preventDefault = () => { e.defaultPrevented = true; };
    return { handled: handler(e), e };
  };
  return { calls, press, advance: (ms) => { t += ms; } };
}

test('every listed shortcut triggers exactly its action', () => {
  for (const s of SHORTCUTS) {
    const { calls, press } = setup();
    for (const ev of s.press) press(ev.key, ev);
    assert.deepEqual(calls, [s.action], `${s.keys.join('+')} should run ${s.action}`);
  }
});

test('every action the shortcuts name exists, and every action has a shortcut', () => {
  assert.deepEqual([...new Set(SHORTCUTS.map((s) => s.action))].sort(), [...ACTIONS].sort());
});

test('Cmd+K works like Ctrl+K, and both work while typing in a field', () => {
  const { calls, press } = setup();
  press('k', { metaKey: true });
  press('k', { ctrlKey: true }, el('INPUT', 'text'));
  assert.deepEqual(calls, ['palette', 'palette']);
});

test('plain keys are ignored while typing in a text field, textarea or select', () => {
  for (const target of [el('INPUT', 'text'), el('INPUT', 'search'), el('TEXTAREA'), el('SELECT'), { tagName: 'DIV', isContentEditable: true }]) {
    const { calls, press } = setup();
    for (const k of ['j', 'x', 's', '/', '?', 'g']) press(k, {}, target);
    assert.deepEqual(calls, [], target.tagName);
  }
});

test('a focused checkbox is not a typing target, so shortcuts still work', () => {
  assert.equal(isTypingTarget(el('INPUT', 'checkbox')), false);
  assert.equal(isTypingTarget(el('BUTTON')), false);
  assert.equal(isTypingTarget(el('INPUT', 'text')), true);
  const { calls, press } = setup();
  press('j', {}, el('INPUT', 'checkbox'));
  assert.deepEqual(calls, ['next']);
});

test('plain keys do nothing while a dialog is open, but Ctrl+K still opens the palette', () => {
  const { calls, press } = setup({ blocked: true });
  press('j'); press('x'); press('?');
  assert.deepEqual(calls, []);
  press('k', { ctrlKey: true });
  assert.deepEqual(calls, ['palette']);
});

test('the g prefix expires after a second and is cancelled by another key', () => {
  const a = setup();
  a.press('g'); a.advance(1500); a.press('h');
  assert.deepEqual(a.calls, [], 'too slow');
  const b = setup();
  b.press('g'); b.press('x'); b.press('h');
  assert.deepEqual(b.calls, ['toggleDone'], 'g then x is x, and a later h does nothing');
  const c = setup();
  c.press('g'); c.advance(400); c.press('a');
  assert.deepEqual(c.calls, ['all']);
});

test('Space and Enter act on the current problem, unless focus is on a button or link', () => {
  const on = setup({ current: true });
  on.press(' '); on.press('Enter');
  assert.deepEqual(on.calls, ['toggleDone', 'openLeetCode']);
  const none = setup({ current: false });
  assert.equal(none.press(' ').handled, false);
  assert.equal(none.press('Enter').handled, false);
  assert.deepEqual(none.calls, []);
  const focusedButton = setup({ current: true });
  focusedButton.press(' ', {}, el('BUTTON'));
  focusedButton.press('Enter', {}, { tagName: 'A', closest: () => ({}) });
  assert.deepEqual(focusedButton.calls, []);
});

test('handled shortcuts stop the browser default, unhandled keys do not', () => {
  const { press } = setup();
  assert.equal(press('j').e.defaultPrevented, true);
  assert.equal(press('q').e.defaultPrevented, false);
  assert.equal(press('Tab').e.defaultPrevented, false);
});

test('an action that returns false (nothing to do) leaves the key to the browser', () => {
  const actions = { toggleDone: () => false };
  const handler = createKeyHandler(actions);
  const e = { key: 'x', target: body, preventDefault() { this.defaultPrevented = true; } };
  assert.equal(handler(e), false);
  assert.equal(e.defaultPrevented, undefined);
});

test('keys with Alt, or Ctrl/Cmd plus other letters, are left to the browser', () => {
  const { calls, press } = setup();
  press('j', { altKey: true });
  press('c', { ctrlKey: true });
  press('x', { metaKey: true });
  assert.deepEqual(calls, []);
});

test('Escape clears the current problem but does not stop dialogs from closing', () => {
  const { calls, press } = setup();
  const r = press('Escape');
  assert.deepEqual(calls, ['clear']);
  assert.equal(r.e.defaultPrevented, false);
});

test('isMac reads the platform', () => {
  assert.equal(isMac({ platform: 'MacIntel' }), true);
  assert.equal(isMac({ userAgentData: { platform: 'macOS' } }), true);
  assert.equal(isMac({ platform: 'Win32' }), false);
  assert.equal(isMac(undefined), false);
});
