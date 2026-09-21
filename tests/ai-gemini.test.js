import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stream, listModels } from '../js/ai/gemini.js';
import { AiError } from '../js/ai/errors.js';
import { fakeFetch, streamResponse, jsonResponse, hangingResponse, collect, geminiEvent } from './ai-helpers.js';

const args = (fetchImpl, extra = {}) => ({
  key: 'AIza-secret', model: 'gemini-3.8-flash', system: 'SYS', fetchImpl,
  messages: [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'hello' }, { role: 'user', content: 'again' }], ...extra,
});

test('streams the text pieces of an answer', async () => {
  const f = fakeFetch(() => streamResponse([geminiEvent('Hel'), geminiEvent('lo '), geminiEvent('there')]));
  assert.deepEqual(await collect(stream(args(f))), ['Hel', 'lo ', 'there']);
});

test('sends the key in a header (never in the URL), the model in the path, and maps roles', async () => {
  const f = fakeFetch(() => streamResponse([geminiEvent('ok')]));
  await collect(stream(args(f)));
  const [{ url, init, body }] = f.calls;
  assert.match(url, /\/models\/gemini-3\.8-flash:streamGenerateContent\?alt=sse$/);
  assert.ok(!url.includes('AIza-secret'), 'the key must not be in the URL');
  assert.equal(init.headers['x-goog-api-key'], 'AIza-secret');
  assert.equal(init.method, 'POST');
  assert.deepEqual(body.systemInstruction, { parts: [{ text: 'SYS' }] });
  assert.deepEqual(body.contents.map((c) => c.role), ['user', 'model', 'user']);
  assert.equal(body.contents[0].parts[0].text, 'hi');
});

test('skips the model\'s private "thought" parts', async () => {
  const thought = `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: 'thinking...', thought: true }, { text: 'answer' }] } }] })}\n\n`;
  assert.deepEqual(await collect(stream(args(fakeFetch(() => streamResponse([thought]))))), ['answer']);
});

test('a blocked prompt or a safety stop becomes a readable error', async () => {
  const blocked = fakeFetch(() => streamResponse([`data: ${JSON.stringify({ promptFeedback: { blockReason: 'OTHER' } })}\n\n`]));
  await assert.rejects(collect(stream(args(blocked))), (e) => e instanceof AiError && e.kind === 'blocked');
  const safety = fakeFetch(() => streamResponse([geminiEvent('x', { finishReason: 'SAFETY' })]));
  await assert.rejects(collect(stream(args(safety))), (e) => e.kind === 'blocked');
});

const failing = (status, body = {}) => fakeFetch(() => jsonResponse(body, status));
const kindOf = async (f) => { try { await collect(stream(args(f))); } catch (e) { return e.kind; } return null; };

test('HTTP errors become plain-language errors', async () => {
  assert.equal(await kindOf(failing(400, { error: { message: 'API key not valid. Please pass a valid API key.' } })), 'auth');
  assert.equal(await kindOf(failing(401)), 'auth');
  assert.equal(await kindOf(failing(403)), 'auth');
  assert.equal(await kindOf(failing(404)), 'model');
  assert.equal(await kindOf(failing(429)), 'limit');
  assert.equal(await kindOf(failing(400, { error: { message: 'Bad thing' } })), 'request');
  assert.equal(await kindOf(failing(503)), 'server');
});

test('error messages never contain the key', async () => {
  try { await collect(stream(args(failing(400, { error: { message: 'API key not valid: AIza-secret' } })))); } catch (e) { assert.ok(!e.message.includes('AIza-secret'), e.message); }
});

test('a network failure becomes an offline error', async () => {
  const f = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(collect(stream(args(f))), (e) => e.kind === 'offline');
});

test('aborting stops the stream with an AbortError, not an AiError', async () => {
  const ctl = new AbortController();
  const f = fakeFetch((_u, init) => hangingResponse(init.signal));
  const it = stream(args(f, { signal: ctl.signal }))[Symbol.asyncIterator]();
  const first = it.next();
  ctl.abort();
  await assert.rejects(async () => { await first; await it.next(); await it.next(); }, (e) => e.name === 'AbortError');
});

test('listModels keeps chat-capable models, drops tts/live/embedding ones, and follows pages', async () => {
  const pages = [
    { models: [{ name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] }, { name: 'models/gemini-3.8-live', supportedGenerationMethods: ['generateContent'] }, { name: 'models/text-embedding-9', supportedGenerationMethods: ['embedContent'] }], nextPageToken: 'p2' },
    { models: [{ name: 'models/gemini-2.5-flash-lite', supportedGenerationMethods: ['generateContent'] }, { name: 'models/gemini-2.5-flash-preview-tts', supportedGenerationMethods: ['generateContent'] }] },
  ];
  let n = 0;
  const f = fakeFetch(() => jsonResponse(pages[n++]));
  assert.deepEqual(await listModels('AIza-secret', f), ['gemini-3.8-flash', 'gemini-2.5-flash-lite']);
  assert.match(f.calls[1].url, /pageToken=p2/);
  assert.equal(f.calls[0].init.headers['x-goog-api-key'], 'AIza-secret');
});

test('listModels reports a rejected key', async () => {
  await assert.rejects(listModels('bad', failing(400, { error: { message: 'API key not valid' } })), (e) => e.kind === 'auth');
});
