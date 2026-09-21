# NeetCode 150 roadmap

A study site for all 18 NeetCode topics and 150 problems, in JavaScript. Each topic has the minimum theory to start, tested code templates, a "watch out" list, and the problems in NeetCode's order with a one-line hint each. Tick a problem, jot the trick in a note, and your progress syncs across devices.

Live: https://ayanalimevv.github.io/neetcode-roadmap/

No framework, no build step, no dependencies. It is plain HTML, CSS and ES modules.

## Run it locally

ES modules need http, so open it through a server rather than double-clicking `index.html`:

```
python -m http.server 8765
```

then visit http://localhost:8765/.

## Tests

```
npm test
```

Uses Node's built-in test runner (no install needed). It checks that:

- the 150 problems match NeetCode's own list (`tests/neetcode150.json`) by name, order and difficulty
- every code snippet on the site runs correctly on small inputs
- the merge, store and sync logic behave, including two devices, offline, and a rejected token (sync is tested against a fake GitHub API)
- every page renders and escapes user text

## Deploy

GitHub Pages serves the `main` branch from the repo root. Every push to `main` goes live within about a minute. All URLs are relative and routing is hash-based (`#/graphs`), because the site lives under the `/neetcode-roadmap/` sub-path.

## Sync across devices

Progress is saved in the browser first. To keep it across devices, click the sync chip in the header and follow the steps once per device:

1. Create a classic GitHub token with only the `gist` scope (the dialog links to the right page).
2. Paste it in. It is stored only in that browser.

The site then keeps one **secret gist** called `neetcode-roadmap-progress.json` in your account and merges into it. Each tick and each note carries its own timestamp, and the newest change wins, so editing different problems on two devices never loses anything.

Things to know:

- A secret gist is unlisted, not private: anyone with its URL can read it. It holds only problem ids, ticks and notes.
- A `gist`-scope token can read and write all of your gists. Revoke it any time at https://github.com/settings/tokens.
- Nothing about your gist or token is in this repository.

## Editing content

Each topic is one small file in `data/topics/`. A problem is `[name, difficulty, hint, learnTag?]`, and its saved-progress id comes from the topic id plus the name, so renaming a problem resets its tick. Add snippets to a topic's `snippets` list, then add a matching case in `tests/snippets.test.js` (a test fails if a snippet has no case).
