// Chat history, kept per topic in this browser only. It is never synced and never sent anywhere except as
// part of a question to the engine the user chose. Capped, so it cannot fill the storage.

const PREFIX = 'neetcode-roadmap:ai-chat:';
const MAX_MESSAGES = 30;
const MAX_CHARS = 60000;

// A message is { role: 'user' | 'assistant', content, meta? }. meta is only for showing it nicely.
function clean(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content, ...(m.meta && typeof m.meta === 'object' ? { meta: m.meta } : {}) }));
}

export function loadHistory(storage, topicId) {
  try {
    return clean(JSON.parse(storage.getItem(PREFIX + topicId)));
  } catch {
    return [];
  }
}

export function saveHistory(storage, topicId, messages) {
  let kept = clean(messages).slice(-MAX_MESSAGES);
  let total = kept.reduce((n, m) => n + m.content.length, 0);
  while (kept.length > 1 && total > MAX_CHARS) total -= kept.shift().content.length; // drop the oldest first
  try {
    storage.setItem(PREFIX + topicId, JSON.stringify(kept));
  } catch { /* out of space: the chat still works this session */ }
  return kept;
}

export function clearHistory(storage, topicId) {
  try { storage.removeItem(PREFIX + topicId); } catch { /* nothing to do */ }
}
