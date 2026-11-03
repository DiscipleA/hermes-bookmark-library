# Hermes Bookmark Library

A small, AI-assisted teaching demo for taking a local change through tests and a
reviewable PR. This repository is the runnable baseline. There are no application
packages to install, accounts, credentials, or external services.

## Run

Requires Node.js 22 or newer. In this folder:

```sh
npm start
```

Open `http://127.0.0.1:4173` in a modern browser. Stop with Ctrl+C. To choose another
port in Bash: `PORT=4174 npm start`. Use the local server rather than opening the
HTML as a `file:` URL, because the application uses JavaScript ES modules.

## Test

```sh
npm test
# equivalent:
node --test tests/*.test.mjs
```

The baseline has 20 passing tests: logic, a minimal-DOM UI adapter, and real
loopback HTTP integration. Tests need no internet connection or browser packages.
The DOM adapter tests are not a substitute for a full browser/layout test.

## Supported behavior

- Add a required title and an absolute HTTP/HTTPS URL.
- Normalize scheme/hostname casing, default ports, and a missing root slash.
- Reject unsupported schemes, relative URLs, malformed URLs, and URL credentials.
- List and remove saved bookmarks; add/edit comma-separated tags.
- Search title or tags with case-sensitive substring matching.
- Show validation feedback and empty/no-results states.

**State is ephemeral:** bookmarks are kept only in memory in the current tab.
Refreshing or closing the page clears them. There is no localStorage, database,
import/export, synchronization, or account system.

## Intentional unfinished behaviors / PR seeds

1. **Seeded bug: duplicate normalized URLs are accepted.** Save
   `https://example.com`, then `HTTPS://EXAMPLE.COM:443/`: both appear. The target
   bugfix must reject equivalent normalized URLs while preserving distinct paths
   and query strings. Do not fix this in the baseline.
2. **Enhancement: case-insensitive title/tag search.** Currently `nOdE` will not
   find `Node Documentation`. Improve matching without changing stored casing.

The seeds are outside this repo in
`../../scenarios/hermes-bookmark-library/`: `bugfix.md`, `regression.test.mjs`,
`enhancement.md`, `enhancement.test.mjs`, and machine-readable `scenario.json`.
Copy a seed test into this repo's `tests/` folder only when starting that exercise.
Both use `../src/bookmarks.mjs` relative to their copied location.

To reproduce the seeds without changing the passing baseline:

```sh
cd ../../scenarios/hermes-bookmark-library
python verify.py
```

That stdlib-only verifier writes isolated copies under the scenario folder's
`_verification/` directory, confirms baseline GREEN and each seed RED, and records
actual output under `evidence/`. Initial test-first RED transcripts are retained.
The duplicate seed has six failing rejection checks and one passing distinct-URL
check. The search seed has three failing case-insensitivity checks and one passing
empty/no-match check. These intentional failures are not part of `npm test`.

## Structure and safety

- `src/bookmarks.mjs`: pure collection transformations and URL validation.
- `src/app.mjs`: DOM UI using `textContent` and `createElement`, never untrusted HTML.
- `index.html` / `styles.css`: accessible labels, responsive layout, local assets.
- `server.mjs`: loopback-only, allowlisted static server with a restrictive CSP.
- `tests/`: Node's built-in test runner; no external test framework.

The app has no external dependencies, fonts, analytics, or background external
requests. Tests contact only loopback. Saved links open a new tab using
`rel="noopener noreferrer"`; intentionally opening one navigates to its site.
A GitHub Actions test workflow is included. Repository issues and PRs provide the
public exercises; Hermes schedules and credentials remain outside this repository.

## AI-assisted development disclosure

This demo and its tests/documentation were created with AI assistance for classroom
use. Baseline tests were observed failing before implementation, then passing.
Known demo defects are disclosed above; this is not a production bookmark service.
Review changes and run tests before reusing it beyond the lab.
