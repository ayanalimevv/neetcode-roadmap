// Helpers shared by the assistant tests: a fake streaming `fetch`. Not a test file (node --test only runs *.test.js).

const enc = new TextEncoder();

/** A streamed response whose body arrives in the given chunks (strings), like a real network stream. */
export function streamResponse(chunks, { status = 200, headers = { 'content-type': 'text/event-stream' } } = {}) {
  const body = new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(enc.encode(c));
      controller.close();
    },
  });
  return new Response(body, { status, headers });
}

export const jsonResponse = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });

/** Records every call and answers with whatever `respond(url, init)` returns. */
export function fakeFetch(respond) {
  const calls = [];
  const fn = async (url, init = {}) => {
    calls.push({ url: String(url), init, body: init.body ? JSON.parse(init.body) : undefined });
    return respond(String(url), init);
  };
  fn.calls = calls;
  return fn;
}

/** A response that never ends until the request is aborted, then errors like a real aborted fetch. */
export function hangingResponse(signal) {
  return new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(enc.encode('data: {"first":true}\n\n'));
      signal?.addEventListener('abort', () => controller.error(new DOMException('The operation was aborted.', 'AbortError')));
    },
  }), { status: 200 });
}

export async function collect(iterable) {
  const out = [];
  for await (const x of iterable) out.push(x);
  return out;
}

/** Gemini-style and OpenAI-style event builders. */
export const geminiEvent = (text, extra = {}) => `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, ...extra }] })}\n\n`;
export const openaiEvent = (content, extra = {}) => `data: ${JSON.stringify({ choices: [{ delta: { content, ...extra } }] })}\n\n`;
