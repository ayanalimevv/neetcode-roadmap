import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stream, listModels } from '../js/ai/openai-compat.js';
import { AiError } from '../js/ai/errors.js';
import { fakeFetch, streamResponse, jsonResponse, hangingResponse, collect, openaiEvent } from './ai-helpers.js';

const args = (fetchImpl, extra = {}) => ({
  engine: 'groq', key: 'gsk_secret', model: 'openai/gpt-oss-120b', system: 'SYS', fetchImpl,
  messages: [{ role: 'user', content: 'hi' }], ...extra,
});

test('streams delta content, ignores reasoning, and stops at [DONE]', async () => {
  const f = fakeFetch(() => streamResponse([
    openaiEvent('', { reasoning: 'hmm' }), openaiEvent('Hel'), openaiEvent('lo'), 'data: [DONE]\n\n', openaiEvent('after done'),
  ]));
  assert.deepEqual(await collect(stream(args(f))), ['Hel', 'lo']);
});

test('the request has a Bearer key, the system prompt first, and streaming on', async () => {
  const f = fakeFetch(() => streamResponse(['data: [DONE]\n\n']));
  await collect(stream(args(f)));
  const [{ url, init, body }] = f.calls;
  assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions');
  assert.equal(init.headers.authorization, 'Bearer gsk_secret');
  assert.equal(body.stream, true);
  assert.deepEqual(body.messages[0], { role: 'system', content: 'SYS' });
  assert.deepEqual(body.messages[1], { role: 'user', content: 'hi' });
});

test('reasoning_effort is sent only for Groq gpt-oss models', async () => {
  const send = async (extra) => { const f = fakeFetch(() => streamResponse(['data: [DONE]\n\n'])); await collect(stream(args(f, extra))); return f.calls[0].body; };
  assert.equal((await send({ effort: 'medium' })).reasoning_effort, 'medium');
  assert.equal((await send({})).reasoning_effort, 'low');
  assert.equal('reasoning_effort' in (await send({ model: 'llama-3.3-70b-versatile' })), false);
  assert.equal('reasoning_effort' in (await send({ engine: 'openrouter', model: 'openai/gpt-oss-120b:free' })), false);
});

test('OpenRouter uses its own base URL', async () => {
  const f = fakeFetch(() => streamResponse(['data: [DONE]\n\n']));
  await collect(stream(args(f, { engine: 'openrouter', model: 'x:free' })));
  assert.equal(f.calls[0].url, 'https://openrouter.ai/api/v1/chat/completions');
});

test('an error event in the stream becomes an AiError', async () => {
  const f = fakeFetch(() => streamResponse([`data: ${JSON.stringify({ error: { message: 'model overloaded' } })}\n\n`]));
  await assert.rejects(collect(stream(args(f))), (e) => e instanceof AiError && /overloaded/.test(e.message));
});

const kindOf = async (status, body = {}) => {
  try { await collect(stream(args(fakeFetch(() => jsonResponse(body, status))))); } catch (e) { return e.kind; }
  return null;
};

test('HTTP errors become plain-language errors', async () => {
  assert.equal(await kindOf(401), 'auth');
  assert.equal(await kindOf(403), 'auth');
  assert.equal(await kindOf(404), 'model');
  assert.equal(await kindOf(429), 'limit');
  assert.equal(await kindOf(413), 'request');
  assert.equal(await kindOf(500), 'server');
});

test('the 429 message tells the user what to do, and never contains the key', async () => {
  try { await collect(stream(args(fakeFetch(() => jsonResponse({ error: { message: 'Rate limit for gsk_secret' } }, 429))))); } catch (e) {
    assert.match(e.message, /free limit/i);
    assert.ok(!e.message.includes('gsk_secret'));
  }
});

test('a network failure becomes an offline error', async () => {
  await assert.rejects(collect(stream(args(async () => { throw new TypeError('Failed to fetch'); }))), (e) => e.kind === 'offline');
});

test('aborting stops the stream with an AbortError', async () => {
  const ctl = new AbortController();
  const f = fakeFetch((_u, init) => hangingResponse(init.signal));
  const it = stream(args(f, { signal: ctl.signal }))[Symbol.asyncIterator]();
  const first = it.next();
  ctl.abort();
  await assert.rejects(async () => { await first; await it.next(); await it.next(); }, (e) => e.name === 'AbortError');
});

test('Groq model list drops speech, guard and embedding models', async () => {
  const f = fakeFetch(() => jsonResponse({ data: [{ id: 'openai/gpt-oss-120b' }, { id: 'whisper-large-v3' }, { id: 'meta-llama/llama-prompt-guard-2-22m' }, { id: 'llama-3.3-70b-versatile' }, { id: 'canopylabs/orpheus-v1-english' }] }));
  assert.deepEqual(await listModels('groq', 'gsk_secret', f), ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b']);
});

test('OpenRouter model list keeps only free text models', async () => {
  const f = fakeFetch(() => jsonResponse({ data: [
    { id: 'a/free-chat:free', pricing: { prompt: '0', completion: '0' }, architecture: { output_modalities: ['text'] } },
    { id: 'b/paid', pricing: { prompt: '0.000001', completion: '0.000002' }, architecture: { output_modalities: ['text'] } },
    { id: 'c/free-image:free', pricing: { prompt: '0', completion: '0' }, architecture: { output_modalities: ['image'] } },
    { id: 'd/half-free', pricing: { prompt: '0', completion: '0.000002' } },
  ] }));
  assert.deepEqual(await listModels('openrouter', 'k', f), ['a/free-chat:free']);
});
