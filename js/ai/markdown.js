// A tiny Markdown subset for the assistant's answers. Everything is HTML-escaped first, so model output
// (which we do not control) can never inject markup: no raw HTML, no links, no images.
// Supported: paragraphs, **bold**, `inline code`, ```fenced code```, bullet and numbered lists, #headings,
// and [[Problem Name]], which becomes a button when the name is one of the site's problems.

import { esc, highlight } from '../highlight.js';

const escAttr = (s) => esc(s).replace(/"/g, '&quot;');

function inline(raw, resolveProblem) {
  return raw
    .split(/(`[^`\n]+`)/)
    .map((part) => {
      if (/^`[^`\n]+`$/.test(part)) return `<code>${esc(part.slice(1, -1))}</code>`;
      let out = '';
      let last = 0;
      const re = /\*\*([^*\n]+)\*\*|\[\[([^\]\n]+)\]\]/g;
      for (let m = re.exec(part); m; m = re.exec(part)) {
        out += esc(part.slice(last, m.index));
        if (m[1] !== undefined) {
          out += `<strong>${esc(m[1])}</strong>`;
        } else {
          const name = m[2].trim();
          const id = resolveProblem?.(name);
          out += id ? `<button type="button" class="ai-problem" data-goto-problem="${escAttr(id)}">${esc(name)}</button>` : esc(name);
        }
        last = m.index + m[0].length;
      }
      return out + esc(part.slice(last));
    })
    .join('');
}

function codeBlock(lang, body) {
  const label = esc(lang || 'code');
  const shown = !lang || /^(js|javascript|jsx|ts|typescript|node)$/i.test(lang) ? highlight(body) : esc(body);
  return `<figure class="code"><figcaption><span>${label}</span><button type="button" class="copy">Copy</button></figcaption><pre><code>${shown}</code></pre></figure>`;
}

export function renderMarkdown(src, { resolveProblem } = {}) {
  const lines = String(src).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    const fence = /^\s*```\s*([\w+-]*)\s*$/.exec(line);
    if (fence) {
      const body = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) body.push(lines[i++]);
      i++; // the closing fence; an unclosed one simply runs to the end of the answer
      out.push(codeBlock(fence[1], body.join('\n')));
      continue;
    }
    if (/^\s*$/.test(line)) { i++; continue; }

    const heading = /^\s*#{1,4}\s+(.*)$/.exec(line);
    if (heading) { out.push(`<h4>${inline(heading[1], resolveProblem)}</h4>`); i++; continue; }

    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(`<li>${inline(lines[i++].replace(/^\s*[-*]\s+/, ''), resolveProblem)}</li>`);
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(`<li>${inline(lines[i++].replace(/^\s*\d+[.)]\s+/, ''), resolveProblem)}</li>`);
      out.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    const para = [];
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^\s*```/.test(lines[i]) && !/^\s*([-*]|\d+[.)]|#{1,4})\s+/.test(lines[i])) para.push(inline(lines[i++], resolveProblem));
    out.push(`<p>${para.join('<br>')}</p>`);
  }
  return out.join('');
}
