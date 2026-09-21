# Progress

Resume here in a fresh session. Original plan: `C:\Users\Tharu\.claude\plans\give-a-html-roadmap-soft-hennessy.md`.

**What this is:** a static NeetCode 150 roadmap (18 topics, 150 problems, JavaScript), on GitHub Pages at `https://ayanalimevv.github.io/neetcode-roadmap/`. Ticks and notes sync across devices through a secret Gist using a token the user pastes once per device. No backend, no build step, no dependencies.

**Working rules**
- Commits are authored as `ayanalimevv` (repo-local git config, never global).
- All URLs relative, hash routing (`#/graphs`), because the site lives under a sub-path.
- Run `npm test` before every push (`node --test`, nothing to install).
- Local preview: `python -m http.server 8765` (ES modules need http).

## State
All steps of the original plan are built and pushed. 18 topics, 150 problems, 143 tests.

- [x] Housekeeping, shell, CSS (tokens, base, components, pages)
- [x] JS: store, merge, sync, sync-ui, render, router, main, highlight
- [x] Data: overview + all 18 topic files, cross-checked against NeetCode's own list
- [x] Tests: data, snippets, merge, store, sync (fake GitHub API), router, highlight, render
- [x] README, repo created, pushed, Pages enabled

## Not yet verified by a person
- **Real sync end to end.** It is tested against a fake GitHub API only. Still to do with a real token: tick on device A, connect on device B, see it appear; edit on both; go offline; try a bad token.
- **Visual check on a phone and a desktop.** The Chrome tool could not reach localhost in the build session, so the layout has only been reasoned about, not looked at. Check the live URL.

## Deviations from the plan
- Records are `{ d, dt, n, nt }`, so the tick and the note each have their own timestamp (the plan had one `t`). Editing the note on one device and the tick on another no longer clobber each other.
- No ETag / `If-None-Match`. Each sync is one small GET plus, if something changed, one PATCH. Not worth the extra state.
- Each device never issues a timestamp older than the newest one it has seen (`stamp()` in `js/store.js`), so an edit made after receiving another device's edit always wins, even if the clocks disagree.
- Network Delay Time is under Advanced Graphs (as on NeetCode); the earlier private Artifact had it under Graphs.

## Decisions
- Host: GitHub Pages from `main` / root (the repo is public because free Pages needs that).
- Sync: secret Gist file `neetcode-roadmap-progress.json`, last write wins per field by timestamp. Classic token with only the `gist` scope, in that browser's localStorage. Never reuse the `gh` CLI token.
- Problem ids are `<topicId>-<slugified name>`. Renaming a problem resets its saved tick.
- `tests/neetcode150.json` is NeetCode's own list from `neetcode-gh/leetcode` (`.problemSiteData.json`, `neetcode150: true`).
