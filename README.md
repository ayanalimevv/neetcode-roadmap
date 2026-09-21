# NeetCode 150 roadmap

A study site for all 18 NeetCode topics and 150 problems, in JavaScript. Each topic has the minimum theory to start, tested code templates, a "watch out" list, and the problems in NeetCode's order with a one-line hint and a LeetCode link each. Tick a problem, star it to revisit, jot the trick in a note, and your progress syncs across devices.

Live: https://ayanalimevv.github.io/neetcode-roadmap/

No framework, no build step, no dependencies. It is plain HTML, CSS and ES modules.

## Using it

- **Command palette:** `Ctrl+K` (`⌘K` on a Mac), or `/`. Type to jump to any topic or problem; `Enter` opens it, `Ctrl/⌘+Enter` opens the problem on LeetCode.
- **Shortcuts:** press `?` for the list. Highlights: `j`/`k` move between problems, `x` ticks, `s` stars for revisit, `n` writes a note, `o` opens LeetCode, `g` then `h`/`a`/`r`/`n` go to Overview / All problems / Revisit / next unsolved, `[` and `]` change topic, `Ctrl+\` toggles the sidebar.
- **Progress:** a fill behind each topic in the sidebar, an overview card with a difficulty-split bar and an "Up next" button, and a thin line under the top bar on phones.
- **Premium:** seven problems are LeetCode Premium (Encode and Decode Strings, Walls and Gates, Number of Connected Components, Graph Valid Tree, Alien Dictionary, both Meeting Rooms). They are tagged; the link works if you have a subscription.

## The study assistant

Press `a` (or the **Ask** button) to open a panel beside the page. It answers with **your own free API key**, so nothing runs on a server of mine:

- **Hint:** a ladder (Nudge, Pattern, Outline). The full solution only appears when you choose it.
- **Debug:** paste your JavaScript plus what you expected and what happened. It points at the buggy line, explains why, and only shows the fix when you press *Show the fix*.
- **Review:** complexity, missed edge cases, a cleaner version, an alternative approach, and a related problem to try.
- **Explain / Chat:** questions about a hint, a template or a concept, and a one-click topic summary.

Set it up once in the panel's settings: pick an engine, paste a key, press *Load models*. **Gemini** (free key from Google AI Studio) is the default; **Groq** (fast, but a small free token allowance) and **OpenRouter** (free models, which change often) are alternatives. The key stays in that browser only. It is never synced, never in this repo, and a test checks it never reaches the gist. Chat history is kept per topic in the same browser. Your question and code go to the engine you choose, so don't paste secrets.

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

## LeetCode links

`data/leetcode.js` is generated. `node scripts/leetcode-links.mjs` (needs network) takes NeetCode's slugs, checks each one against LeetCode's public GraphQL API, and rewrites the file. It stops without writing if a slug is missing or a difficulty disagrees. Run it if a topic file gains, loses or renames a problem.

## Editing content

Each topic is one small file in `data/topics/`. A problem is `[name, difficulty, hint, learnTag?]`, and its saved-progress id comes from the topic id plus the name, so renaming a problem resets its tick. Add snippets to a topic's `snippets` list, then add a matching case in `tests/snippets.test.js` (a test fails if a snippet has no case).
