// Pure merge of two progress maps. No I/O, so it is easy to test.
//
// A record is { d, dt, n, nt, r, rt }:
//   d = done (0|1)       dt = when d last changed
//   n = note text        nt = when n last changed
//   r = revisit star     rt = when r last changed         (times are ms since epoch)
// Each field is merged on its own: the newer timestamp wins. Unticking keeps the record (d:0 with a
// newer dt), which is how an untick reaches the other device. Records saved before the star existed
// simply lack r and rt, which read as 0.

const ID = /^[a-z0-9-]{1,80}$/;
const EMPTY = { d: 0, dt: 0, n: '', nt: 0, r: 0, rt: 0 };

const time = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);

// Drops anything malformed. Applied to everything that comes from disk or from the network.
export function sanitize(items) {
  const out = {};
  if (!items || typeof items !== 'object') return out;
  for (const [id, r] of Object.entries(items)) {
    if (!ID.test(id) || !r || typeof r !== 'object') continue;
    out[id] = {
      d: r.d ? 1 : 0,
      dt: time(r.dt),
      n: typeof r.n === 'string' ? r.n.slice(0, 500) : '',
      nt: time(r.nt),
      r: r.r ? 1 : 0,
      rt: time(r.rt),
    };
  }
  return out;
}

// On an exact tie the larger value wins, so both devices settle on the same answer.
function pick(a, at, b, bt) {
  if (at !== bt) return at > bt ? [a, at] : [b, bt];
  return [a >= b ? a : b, at];
}

export function mergeItems(local, remote) {
  const a = sanitize(local);
  const b = sanitize(remote);
  const out = {};
  for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[id] ?? EMPTY;
    const y = b[id] ?? EMPTY;
    const [d, dt] = pick(x.d, x.dt, y.d, y.dt);
    const [n, nt] = pick(x.n, x.nt, y.n, y.nt);
    const [r, rt] = pick(x.r, x.rt, y.r, y.rt);
    out[id] = { d, dt, n, nt, r, rt };
  }
  return out;
}

export function sameItems(a, b) {
  const ka = Object.keys(a);
  if (ka.length !== Object.keys(b).length) return false;
  return ka.every((id) => {
    const x = a[id];
    const y = b[id];
    return y && x.d === y.d && x.dt === y.dt && x.n === y.n && x.nt === y.nt && x.r === y.r && x.rt === y.rt;
  });
}
