// Google Gemini, called straight from the browser with the user's own free key (Google AI Studio).
// The key goes in an x-goog-api-key header, which Google's CORS policy allows from this site.

import { readSse } from './sse.js';
import { AiError, httpError, doFetch } from './errors.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const LABEL = 'Google Gemini';

// Model families that cannot be used for text chat.
const NOT_CHAT = /tts|live|embed|image|imagen|veo|lyria|audio|transcribe|robotics|computer-use|aqa|translate/i;

export async function listModels(key, fetchImpl = (...a) => globalThis.fetch(...a)) {
  const found = [];
  let token = '';
  for (let page = 0; page < 5; page++) {
    const url = `${BASE}/models?pageSize=200${token ? `&pageToken=${encodeURIComponent(token)}` : ''}`;
    const res = await doFetch(fetchImpl, url, { headers: { 'x-goog-api-key': key } }, LABEL);
    if (!res.ok) throw await httpError(res, LABEL);
    const body = await res.json();
    for (const m of body.models ?? []) {
      const id = String(m.name ?? '').replace(/^models\//, '');
      if (id && (m.supportedGenerationMethods ?? []).includes('generateContent') && !NOT_CHAT.test(id)) found.push(id);
    }
    token = body.nextPageToken ?? '';
    if (!token) break;
  }
  return found;
}

/** Streams the answer as text pieces. messages: [{ role: 'user' | 'assistant', content }] */
export async function* stream({ key, model, system, messages, signal, fetchImpl = (...a) => globalThis.fetch(...a) }) {
  const res = await doFetch(
    fetchImpl,
    `${BASE}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`,
    {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
      }),
    },
    LABEL,
  );
  if (!res.ok) throw await httpError(res, LABEL);

  for await (const data of readSse(res)) {
    let ev;
    try { ev = JSON.parse(data); } catch { continue; }
    if (ev.error) throw new AiError('request', `${LABEL}: ${String(ev.error.message ?? 'error').slice(0, 200)}`);
    if (ev.promptFeedback?.blockReason) throw new AiError('blocked', `${LABEL} declined to answer that (${ev.promptFeedback.blockReason}). Try rewording it.`);
    const cand = ev.candidates?.[0];
    for (const part of cand?.content?.parts ?? []) {
      if (part.thought) continue; // the model's private reasoning summary, not the answer
      if (typeof part.text === 'string' && part.text) yield part.text;
    }
    if (cand?.finishReason === 'SAFETY') throw new AiError('blocked', `${LABEL} stopped the answer for safety reasons. Try rewording it.`);
  }
}
