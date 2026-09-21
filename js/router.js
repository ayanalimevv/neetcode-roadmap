// Hash routing: "#/" is home, "#/all" lists every problem, "#/all/revisit" the same page filtered to
// starred problems, and "#/graphs" is one topic.
// Hashes never reach the server, so a refresh on any page still works under GitHub Pages' sub-path.

export function parseHash(hash, slugs) {
  const m = /^#\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?\/?$/.exec(hash || '');
  if (!m) return { name: 'home' };
  const [, first, second] = m;
  if (first === 'all') {
    if (!second) return { name: 'all' };
    return second === 'revisit' ? { name: 'all', filter: 'revisit' } : { name: 'home' };
  }
  return !second && slugs.includes(first) ? { name: 'topic', slug: first } : { name: 'home' };
}

export function startRouter(slugs, onRoute) {
  const go = () => onRoute(parseHash(location.hash, slugs));
  addEventListener('hashchange', go);
  go();
}
