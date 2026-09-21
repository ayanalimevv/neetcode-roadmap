// Server-sent events, as sent by Gemini, Groq and OpenRouter when you ask for a streamed answer.
// The parser is separate from the network so it can be tested with awkwardly split chunks: a network
// packet can end in the middle of a line, or between the \r and the \n of a line break.

export function createSseParser() {
  let buffer = '';
  let data = [];

  // Handles one complete line. Returns the event's data when a blank line ends an event, otherwise null.
  function line(l) {
    if (l === '') {
      if (!data.length) return null;
      const joined = data.join('\n');
      data = [];
      return joined;
    }
    if (l.startsWith(':')) return null; // a comment (keep-alives)
    if (l.startsWith('data:')) data.push(l.slice(5).replace(/^ /, ''));
    return null; // event:, id: and retry: are not needed here
  }

  return {
    push(chunk) {
      buffer += chunk;
      const events = [];
      for (;;) {
        // A lone \r at the very end might be the first half of \r\n, so wait for more.
        const m = /\r\n|\n|\r(?=[\s\S])/.exec(buffer);
        if (!m) break;
        const ev = line(buffer.slice(0, m.index));
        buffer = buffer.slice(m.index + m[0].length);
        if (ev !== null) events.push(ev);
      }
      return events;
    },

    flush() {
      const events = [];
      if (buffer) {
        const ev = line(buffer.replace(/\r$/, ''));
        buffer = '';
        if (ev !== null) events.push(ev);
      }
      const last = line('');
      if (last !== null) events.push(last);
      return events;
    },
  };
}

/** Yields each event's data string from a fetch Response. Throws AbortError if the request is aborted. */
export async function* readSse(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = createSseParser();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const ev of parser.push(decoder.decode(value, { stream: true }))) yield ev;
    }
    for (const ev of parser.flush()) yield ev;
  } finally {
    try { reader.releaseLock(); } catch { /* already released */ }
  }
}
