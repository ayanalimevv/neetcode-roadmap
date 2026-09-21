// Hash routing: "#/" is the home page, "#/graphs" is one topic.
// Hashes never reach the server, so a refresh on any page still works under GitHub Pages' sub-path.

export function parseHash(hash, slugs) {
  const m = /^#\/([a-z0-9-]+)\/?$/.exec(hash || '');
  return m && slugs.includes(m[1]) ? { name: 'topic', slug: m[1] } : { name: 'home' };
}

export function startRouter(slugs, onRoute) {
  const go = () => onRoute(parseHash(location.hash, slugs));
  addEventListener('hashchange', go);
  go();
}
