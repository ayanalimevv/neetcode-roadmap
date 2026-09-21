import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSseParser, readSse } from '../js/ai/sse.js';
import { streamResponse, collect } from './ai-helpers.js';

const parse = (...chunks) => {
  const p = createSseParser();
  return [...chunks.flatMap((c) => p.push(c)), ...p.flush()];
};

test('reads one event per blank line', () => {
  assert.deepEqual(parse('data: one\n\ndata: two\n\n'), ['one', 'two']);
});

test('joins multi-line data with a newline', () => {
  assert.deepEqual(parse('data: a\ndata: b\n\n'), ['a\nb']);
});

test('ignores comments, event names, ids and retry hints', () => {
  assert.deepEqual(parse(': keep-alive\nevent: message\nid: 7\nretry: 100\ndata: x\n\n'), ['x']);
});

test('handles CRLF and bare CR line breaks', () => {
  assert.deepEqual(parse('data: a\r\n\r\ndata: b\r\r'), ['a', 'b']);
});

test('copes with a chunk that ends in the middle of a line', () => {
  assert.deepEqual(parse('data: {"te', 'xt":"hel', 'lo"}\n', '\n'), ['{"text":"hello"}']);
});

test('copes with \\r\\n split across two chunks', () => {
  assert.deepEqual(parse('data: a\r', '\n\r', '\ndata: b\n\n'), ['a', 'b']);
});

test('one byte at a time gives the same events', () => {
  const text = 'data: {"a":1}\n\ndata: [DONE]\n\n';
  assert.deepEqual(parse(...text), ['{"a":1}', '[DONE]']);
});

test('flush emits a final event that was never followed by a blank line', () => {
  assert.deepEqual(parse('data: last'), ['last']);
});

test('a blank line with no data produces nothing', () => {
  assert.deepEqual(parse('\n\n\ndata: x\n\n'), ['x']);
});

test('readSse streams events out of a Response, even split awkwardly', async () => {
  const res = streamResponse(['da', 'ta: one\n', '\ndata: t', 'wo\n\n']);
  assert.deepEqual(await collect(readSse(res)), ['one', 'two']);
});

test('multi-byte characters split across chunks decode correctly', async () => {
  const bytes = new TextEncoder().encode('data: héllo → ✓\n\n');
  const half = 9; // inside the "é"
  const body = new ReadableStream({ start(c) { c.enqueue(bytes.slice(0, half)); c.enqueue(bytes.slice(half)); c.close(); } });
  assert.deepEqual(await collect(readSse(new Response(body))), ['héllo → ✓']);
});
