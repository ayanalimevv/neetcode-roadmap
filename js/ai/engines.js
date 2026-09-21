// The three engines, the user's saved settings, and one function to ask any of them.
// The API key lives ONLY in this browser's localStorage under KEY. It is never part of the store that
// js/sync.js copies to the gist, never in the repo, and never logged.

import * as gemini from './gemini.js';
import * as compat from './openai-compat.js';

export const KEY = 'neetcode-roadmap:ai';

export const ENGINES = {
  gemini: {
    id: 'gemini', label: 'Google Gemini', badge: 'Recommended',
    // Roughly the most text one request should carry. Groq's free plan is the tightest (about 8K tokens a minute).
    maxInputChars: 40000,
    keyUrl: 'https://aistudio.google.com/apikey', keyPlaceholder: 'AIza…',
    blurb: 'Best at explaining and finding subtle bugs, and handles long code. Free key from Google AI Studio.',
    privacy: 'On Google’s free tier, what you send may be used to improve Google’s products.',
  },
  groq: {
    id: 'groq', label: 'Groq', badge: 'Fast',
    maxInputChars: 10000,
    keyUrl: 'https://console.groq.com/keys', keyPlaceholder: 'gsk_…',
    blurb: 'Very fast, and its gpt-oss-120b model is strong at algorithms. The free plan allows only about 8K tokens a minute, so keep questions short.',
    privacy: 'Your question and code are sent to Groq. Check Groq’s terms for how they are handled.',
  },
  openrouter: {
    id: 'openrouter', label: 'OpenRouter', badge: 'Backup',
    maxInputChars: 20000,
    keyUrl: 'https://openrouter.ai/keys', keyPlaceholder: 'sk-or-…',
    blurb: 'Free models only, and the list changes without notice. About 50 requests a day without credits.',
    privacy: 'Your question and code go to OpenRouter and to whichever company runs the free model.',
  },
};

/* ---------- picking a sensible default model from what a provider offers ---------- */

const version = (id) => {
  const m = /^gemini-(\d+(?:\.\d+)?)-flash$/.exec(id);
  return m ? parseFloat(m[1]) : -1;
};

export function pickDefaultModel(engine, ids) {
  if (!ids?.length) return '';
  if (engine === 'gemini') {
    // The newest plain "flash": not lite, not a preview of some other product.
    const plain = ids.filter((id) => version(id) >= 0).sort((a, b) => version(b) - version(a));
    if (plain.length) return plain[0];
    return ids.find((id) => /flash/i.test(id) && !/lite/i.test(id)) ?? ids.find((id) => /flash/i.test(id)) ?? ids[0];
  }
  if (engine === 'groq') {
    return ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.3-70b-versatile'].find((id) => ids.includes(id)) ?? ids[0];
  }
  const prefer = [/gpt-oss-120b/i, /nemotron.*ultra/i, /qwen.*coder/i, /qwen/i, /glm/i, /gemma-4-31b/i];
  for (const re of prefer) {
    const hit = ids.find((id) => re.test(id));
    if (hit) return hit;
  }
  return ids[0];
}

/* ---------- saved settings ---------- */

const blank = () => ({ engine: 'gemini', keys: { gemini: '', groq: '', openrouter: '' }, models: { gemini: '', groq: '', openrouter: '' } });

export function loadSettings(storage) {
  const s = blank();
  try {
    const saved = JSON.parse(storage.getItem(KEY));
    if (saved && typeof saved === 'object') {
      if (saved.engine in ENGINES) s.engine = saved.engine;
      for (const id of Object.keys(ENGINES)) {
        if (typeof saved.keys?.[id] === 'string') s.keys[id] = saved.keys[id].trim();
        if (typeof saved.models?.[id] === 'string') s.models[id] = saved.models[id].trim();
      }
    }
  } catch { /* nothing saved, or damaged: start blank */ }
  return s;
}

export function saveSettings(storage, settings) {
  try {
    storage.setItem(KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false; // storage blocked or full: the settings last only until the page is closed
  }
}

export const hasKey = (settings) => !!settings.keys[settings.engine];
export const maskKey = (key) => (key ? `••••${key.slice(-4)}` : '');

/* ---------- talking to an engine ---------- */

export function listModels({ engine, key, fetchImpl }) {
  return engine === 'gemini' ? gemini.listModels(key, fetchImpl) : compat.listModels(engine, key, fetchImpl);
}

/** Streams the answer as text pieces. Throws AiError (or AbortError when cancelled). */
export function ask({ settings, system, messages, signal, effort, fetchImpl }) {
  const engine = settings.engine;
  const key = settings.keys[engine];
  const model = settings.models[engine];
  if (engine === 'gemini') return gemini.stream({ key, model, system, messages, signal, fetchImpl });
  return compat.stream({ engine, key, model, system, messages, signal, effort, fetchImpl });
}
