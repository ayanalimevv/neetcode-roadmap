import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickDefaultModel, loadSettings, saveSettings, hasKey, maskKey, ENGINES, KEY, ask } from '../js/ai/engines.js';
import { loadHistory, saveHistory, clearHistory } from '../js/ai/history.js';
import { memoryStorage, createStore } from '../js/store.js';
import { createSync } from '../js/sync.js';
import { fakeFetch, streamResponse, jsonResponse, collect, geminiEvent, openaiEvent } from './ai-helpers.js';

test('the default Gemini model is the newest plain Flash, not a lite or live variant', () => {
  const ids = ['gemini-2.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.8-live', 'gemini-2.5-pro'];
  assert.equal(pickDefaultModel('gemini', ids), 'gemini-3.8-flash');
  assert.equal(pickDefaultModel('gemini', ['gemini-3.5-flash-lite', 'gemini-2.5-pro']), 'gemini-3.5-flash-lite');
  assert.equal(pickDefaultModel('gemini', ['gemini-2.5-pro']), 'gemini-2.5-pro');
  assert.equal(pickDefaultModel('gemini', ['gemini-10.0-flash', 'gemini-9.0-flash']), 'gemini-10.0-flash', 'compares versions as numbers');
  assert.equal(pickDefaultModel('gemini', []), '');
});

test('the default Groq model is gpt-oss-120b, then gpt-oss-20b, then Llama 3.3', () => {
  assert.equal(pickDefaultModel('groq', ['llama-3.3-70b-versatile', 'openai/gpt-oss-20b', 'openai/gpt-oss-120b']), 'openai/gpt-oss-120b');
  assert.equal(pickDefaultModel('groq', ['llama-3.3-70b-versatile', 'openai/gpt-oss-20b']), 'openai/gpt-oss-20b');
  assert.equal(pickDefaultModel('groq', ['llama-3.3-70b-versatile']), 'llama-3.3-70b-versatile');
});

test('the default OpenRouter model prefers a strong free coder and falls back to the first', () => {
  assert.equal(pickDefaultModel('openrouter', ['google/gemma-4-31b-it:free', 'nvidia/nemotron-3-ultra-550b-a55b:free']), 'nvidia/nemotron-3-ultra-550b-a55b:free');
  assert.equal(pickDefaultModel('openrouter', ['zzz/other:free']), 'zzz/other:free');
});

test('settings start blank, survive a reload, and trim pasted keys', () => {
  const storage = memoryStorage();
  assert.deepEqual(loadSettings(storage), { engine: 'gemini', keys: { gemini: '', groq: '', openrouter: '' }, models: { gemini: '', groq: '', openrouter: '' } });
  const s = loadSettings(storage);
  s.engine = 'groq';
  s.keys.groq = '  gsk_abc123  ';
  s.models.groq = 'openai/gpt-oss-120b';
  assert.equal(saveSettings(storage, s), true);
  const again = loadSettings(storage);
  assert.equal(again.engine, 'groq');
  assert.equal(again.keys.groq, 'gsk_abc123');
  assert.equal(hasKey(again), true);
  assert.equal(hasKey({ ...again, engine: 'gemini' }), false);
});

test('damaged or hostile saved settings are ignored', () => {
  for (const junk of ['{not json', 'null', '[]', '{"engine":"evil","keys":{"gemini":5},"models":null}']) {
    const storage = memoryStorage();
    storage.setItem(KEY, junk);
    const s = loadSettings(storage);
    assert.ok(s.engine in ENGINES);
    assert.equal(s.keys.gemini, '');
  }
});

test('saving still reports failure when storage is blocked', () => {
  const blocked = { getItem: () => null, setItem: () => { throw new Error('quota'); }, removeItem: () => {} };
  assert.equal(saveSettings(blocked, loadSettings(blocked)), false);
});

test('a key is shown only as its last four characters', () => {
  assert.equal(maskKey('AIzaSyD-abcdefgh1234'), '••••1234');
  assert.equal(maskKey(''), '');
});

test('each engine has a size limit, with Groq the tightest', () => {
  assert.ok(ENGINES.groq.maxInputChars < ENGINES.openrouter.maxInputChars && ENGINES.openrouter.maxInputChars < ENGINES.gemini.maxInputChars);
});

test('ask() routes to the right provider with the right key and model', async () => {
  const g = fakeFetch(() => streamResponse([geminiEvent('G')]));
  const settings = { engine: 'gemini', keys: { gemini: 'K1', groq: 'K2', openrouter: 'K3' }, models: { gemini: 'gemini-3.8-flash', groq: 'openai/gpt-oss-120b', openrouter: 'x:free' } };
  assert.deepEqual(await collect(ask({ settings, system: 's', messages: [{ role: 'user', content: 'q' }], fetchImpl: g })), ['G']);
  assert.equal(g.calls[0].init.headers['x-goog-api-key'], 'K1');
  assert.match(g.calls[0].url, /gemini-3\.8-flash/);

  const o = fakeFetch(() => streamResponse([openaiEvent('O'), 'data: [DONE]\n\n']));
  assert.deepEqual(await collect(ask({ settings: { ...settings, engine: 'groq' }, system: 's', messages: [{ role: 'user', content: 'q' }], fetchImpl: o })), ['O']);
  assert.equal(o.calls[0].init.headers.authorization, 'Bearer K2');
  assert.equal(o.calls[0].body.model, 'openai/gpt-oss-120b');
});

/* ---------- history ---------- */

test('chat history is kept per topic, survives a reload, and can be cleared', () => {
  const storage = memoryStorage();
  saveHistory(storage, 'gr', [{ role: 'user', content: 'hi', meta: { mode: 'chat' } }, { role: 'assistant', content: 'hello' }]);
  assert.equal(loadHistory(storage, 'gr').length, 2);
  assert.deepEqual(loadHistory(storage, 'gr')[0].meta, { mode: 'chat' });
  assert.deepEqual(loadHistory(storage, 'bt'), []);
  clearHistory(storage, 'gr');
  assert.deepEqual(loadHistory(storage, 'gr'), []);
});

test('history is capped in message count and total size, dropping the oldest first', () => {
  const storage = memoryStorage();
  const many = Array.from({ length: 50 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `m${i}` }));
  const kept = saveHistory(storage, 'gr', many);
  assert.equal(kept.length, 30);
  assert.equal(kept.at(-1).content, 'm49');
  const huge = Array.from({ length: 10 }, () => ({ role: 'user', content: 'x'.repeat(20000) }));
  const small = saveHistory(storage, 'dp1', huge);
  assert.ok(small.reduce((n, m) => n + m.content.length, 0) <= 60000);
  assert.ok(small.length >= 1);
});

test('damaged history is ignored', () => {
  const storage = memoryStorage();
  storage.setItem('neetcode-roadmap:ai-chat:gr', '[{"role":"evil","content":1},{"role":"user","content":"ok"}]');
  assert.deepEqual(loadHistory(storage, 'gr'), [{ role: 'user', content: 'ok' }]);
  storage.setItem('neetcode-roadmap:ai-chat:gr', 'nope');
  assert.deepEqual(loadHistory(storage, 'gr'), []);
});

/* ---------- the key stays out of the gist ---------- */

test('an API key saved in the same browser never appears in anything sync sends to GitHub', async () => {
  const storage = memoryStorage();
  const settings = loadSettings(storage);
  settings.keys.gemini = 'AIza-SUPER-SECRET-KEY';
  saveSettings(storage, settings);
  saveHistory(storage, 'gr', [{ role: 'user', content: 'my private question' }]);

  const store = createStore({ storage });
  store.setDone('arr-two-sum', true);
  store.setNote('arr-two-sum', 'a note');
  const bodies = [];
  const fetchImpl = async (url, init = {}) => {
    if (init.body) bodies.push(init.body);
    if (String(url).includes('/gists?')) return jsonResponse([]);
    return jsonResponse({ id: 'g1', files: {} }, 201);
  };
  const sync = createSync({ store, storage, fetchImpl, setTimer: () => 0, clearTimer: () => {} });
  await sync.connect('ghp_token');
  await sync.syncNow();

  assert.ok(bodies.length >= 1, 'sync must have written something');
  for (const b of bodies) {
    assert.ok(!b.includes('AIza-SUPER-SECRET-KEY'), 'the AI key leaked into a sync request');
    assert.ok(!b.includes('my private question'), 'chat history leaked into a sync request');
  }
});
