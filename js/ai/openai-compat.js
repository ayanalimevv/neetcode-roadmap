// Groq and OpenRouter both speak the OpenAI "chat completions" protocol, so one adapter serves both.
// Called straight from the browser with the user's own free key (both allow that: CORS tested).

import { readSse } from './sse.js';
import { AiError, httpError, doFetch } from './errors.js';

export const PROVIDERS = {
  groq: { label: 'Groq', base: 'https://api.groq.com/openai/v1' },
  openrouter: { label: 'OpenRouter', base: 'https://openrouter.ai/api/v1' },
};

// Groq models that are not text chat models.
const GROQ_NOT_CHAT = /whisper|orpheus|guard|safeguard|tts|embed/i;

export async function listModels(engine, key, fetchImpl = (...a) => globalThis.fetch(...a)) {
  const p = PROVIDERS[engine];
  const res = await doFetch(fetchImpl, `${p.base}/models`, { headers: { authorization: `Bearer ${key}` } }, p.label);
  if (!res.ok) throw await httpError(res, p.label);
  const data = (await res.json()).data ?? [];
  const ids = engine === 'openrouter'
    // OpenRouter lists hundreds; offer only the free text models, since that is what this site is for.
    ? data
        .filter((m) => Number(m.pricing?.prompt) === 0 && Number(m.pricing?.completion) === 0)
        .filter((m) => (m.architecture?.output_modalities ?? ['text']).includes('text'))
        .map((m) => m.id)
    : data.map((m) => m.id).filter((id) => !GROQ_NOT_CHAT.test(id));
  return ids.sort();
}

/** Streams the answer as text pieces. `effort` ('low' | 'medium') only matters for Groq's gpt-oss models. */
export async function* stream({ engine, key, model, system, messages, signal, effort = 'low', fetchImpl = (...a) => globalThis.fetch(...a) }) {
  const p = PROVIDERS[engine];
  const body = {
    model,
    messages: [{ role: 'system', content: system }, ...messages.map((m) => ({ role: m.role, content: m.content }))],
    stream: true,
    temperature: 0.4,
    max_tokens: 3000,
  };
  // gpt-oss "thinks" before answering, and those tokens count toward Groq's small per-minute cap.
  if (engine === 'groq' && /gpt-oss/i.test(model)) body.reasoning_effort = effort;

  const res = await doFetch(
    fetchImpl,
    `${p.base}/chat/completions`,
    { method: 'POST', signal, headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` }, body: JSON.stringify(body) },
    p.label,
  );
  if (!res.ok) throw await httpError(res, p.label);

  for await (const data of readSse(res)) {
    if (data.trim() === '[DONE]') return;
    let ev;
    try { ev = JSON.parse(data); } catch { continue; }
    if (ev.error) throw new AiError('request', `${p.label}: ${String(ev.error.message ?? 'error').slice(0, 200)}`);
    const text = ev.choices?.[0]?.delta?.content; // delta.reasoning is the model thinking aloud: not shown
    if (typeof text === 'string' && text) yield text;
  }
}
