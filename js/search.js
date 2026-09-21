// A small search for the command palette. No dependency.
// An item is { title, sub?, keywords? }. Every word you type must match somewhere; a match at the start of
// the title ranks highest, then the start of a title word, then anywhere in the title, then the extra text.

const words = (s) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

function tokenScore(token, titleLower, titleWords, extraLower, extraWords) {
  if (titleLower.startsWith(token)) return 100;
  if (titleWords.some((w) => w.startsWith(token))) return 70;
  if (titleLower.includes(token)) return 50;
  if (extraWords.some((w) => w.startsWith(token))) return 30;
  if (extraLower.includes(token)) return 20;
  return 0;
}

/** 0 means "no match"; bigger is better. */
export function scoreItem(query, item) {
  const tokens = words(query);
  if (!tokens.length) return 0;
  const titleLower = item.title.toLowerCase();
  const titleWords = words(item.title);
  const extraLower = `${item.sub ?? ''} ${item.keywords ?? ''}`.toLowerCase();
  const extraWords = words(extraLower);
  let total = 0;
  for (const token of tokens) {
    const s = tokenScore(token, titleLower, titleWords, extraLower, extraWords);
    if (!s) return 0;
    total += s;
  }
  return titleLower === tokens.join(' ') ? total + 50 : total;
}

/** Best matches first. Ties keep their original order, so topics and NeetCode order stay stable. */
export function search(items, query, limit = 8) {
  return items
    .map((item, i) => ({ item, i, score: scoreItem(query, item) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.item);
}
