# Progress

Resume here in a fresh session. Full plan: `C:\Users\Tharu\.claude\plans\give-a-html-roadmap-soft-hennessy.md`.

**What this is:** a static NeetCode 150 roadmap (18 topics, 150 problems, JavaScript), served on GitHub Pages at `https://ayanalimevv.github.io/neetcode-roadmap/`. Ticks and notes sync across devices through a private (secret) Gist, using a token the user pastes once per device. No backend, no build step, no dependencies.

**Working rules**
- One small file per step; explain it, then wait for "next".
- Commits are authored as `ayanalimevv` (repo-local git config, never global).
- All URLs relative, hash routing (`#/graphs`), because the site lives under a sub-path.
- Run `npm test` before every push (uses `node --test`, nothing to install).
- Local preview: `python -m http.server` (ES modules need http).

## Steps
- [x] 1. git init, repo-local identity, `.gitignore`, `.nojekyll`, `package.json`, this file
- [x] 2. `index.html` (shell + sync dialog markup; dialog is wired later in step 16)
- [ ] 3. `css/tokens.css`
- [ ] 4. `css/base.css`
- [ ] 5. `css/components.css`
- [ ] 6. `js/store.js`
- [ ] 7. `js/highlight.js`
- [ ] 8. `js/render.js`
- [ ] 9. `js/router.js` + `js/main.js`
- [ ] 10. `data/overview.js`
- [ ] 11. `data/topics/10-backtracking.js` + `data/index.js`
- [ ] 12. `tests/data.test.js` + `tests/snippets.test.js`
- [ ] 13. Create GitHub repo, push, enable Pages, confirm live
- [ ] 14. `js/merge.js` + `tests/merge.test.js`
- [ ] 15. `js/sync.js`
- [ ] 16. `js/sync-ui.js` (dialog markup already in `index.html`), push, test sync on two devices
- [ ] 17-33. Remaining 17 topics, one file each, in NeetCode order, push after each
- [ ] 34. `README.md`, final `PROGRESS.md`

## Topic order and counts (must total 150)
Arrays & Hashing 9 · Two Pointers 5 · Stack 7 · Binary Search 7 · Sliding Window 6 · Linked List 11 · Trees 15 · Tries 3 · Heap / Priority Queue 7 · Backtracking 9 · Graphs 13 · Advanced Graphs 6 · 1-D DP 12 · 2-D DP 11 · Greedy 8 · Intervals 6 · Math & Geometry 8 · Bit Manipulation 7

Problem lists must be cross-checked against neetcode.io before the data is final.

## Decisions
- Host: GitHub Pages from `main` / root (repo must be public on a free plan).
- Sync: secret Gist file `neetcode-roadmap-progress.json`, `{ v:1, items:{ id:{ d, n, t } } }`, last write wins per problem by `t`. Classic token with only the `gist` scope, stored in that browser's localStorage. Never reuse the `gh` CLI token.
