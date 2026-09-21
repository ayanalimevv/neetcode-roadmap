// One error type for everything that can go wrong talking to a provider, with a message a person can act on.

export class AiError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind; // 'auth' | 'model' | 'limit' | 'request' | 'server' | 'offline' | 'blocked' | 'error'
  }
}

/** Turns a failed HTTP response into an AiError. */
export async function httpError(res, label) {
  let detail = '';
  try {
    const body = JSON.parse(await res.text());
    detail = body?.error?.message ?? body?.message ?? '';
  } catch { /* the body was not JSON */ }
  detail = String(detail).replace(/\s+/g, ' ').slice(0, 200);
  const s = res.status;

  // Google answers a wrong key with 400, not 401.
  if (s === 401 || s === 403 || (s === 400 && /api key/i.test(detail))) {
    return new AiError('auth', `${label} rejected the key. Check it in the assistant settings.`);
  }
  if (s === 404) return new AiError('model', `${label} does not know that model. Pick another one in the settings.`);
  if (s === 429) {
    return new AiError('limit', `${label}’s free limit is used up for now. Wait a minute (or until tomorrow), or switch engine in the settings.`);
  }
  if (s === 400 || s === 413 || s === 422) {
    return new AiError('request', `${label} refused the request${detail ? `: ${detail}` : '.'} A shorter message may help.`);
  }
  if (s >= 500) return new AiError('server', `${label} is having trouble right now (${s}). Try again in a moment.`);
  return new AiError('error', `${label} returned ${s}${detail ? `: ${detail}` : '.'}`);
}

/** fetch that turns a network failure into an AiError, and lets an abort through untouched. */
export async function doFetch(fetchImpl, url, init, label) {
  try {
    return await fetchImpl(url, init);
  } catch (e) {
    if (e?.name === 'AbortError') throw e;
    throw new AiError('offline', `Can’t reach ${label}. Check your connection and try again.`);
  }
}
