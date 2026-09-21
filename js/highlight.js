// Text helpers shared by the renderer: HTML escaping, `inline code`, and a tiny JS highlighter.

export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Escapes, then turns `x` into <code>x</code>. Used for hints, which are plain text with backticks.
export function inlineCode(s) {
  return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
}

// Runs on already-escaped text, in a single pass, so a comment swallows everything after `//`
// and keywords inside strings or comments are never coloured twice.
const TOKENS = /(\/\/.*$)|('[^'\n]*'|"[^"\n]*")|\b(function|const|let|return|for|if|else|new|class|of|in|break|continue|constructor|this|while|do|true|false|null|typeof|throw|static|extends)\b|\b(\d+)\b/gm;

export function highlight(src) {
  return esc(src).replace(TOKENS, (m, comment, str, keyword, num) => {
    if (comment) return `<span class="c">${comment}</span>`;
    if (str) return `<span class="s">${str}</span>`;
    if (keyword) return `<span class="k">${keyword}</span>`;
    return `<span class="n">${num}</span>`;
  });
}
