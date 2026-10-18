# 006 — Plain files, no framework and no build step

## Context

The app is a handful of screens, one canvas overlay and a state object saved to `localStorage`. The heavy part, the pose model, is a prebuilt bundle. The brief was "very lightweight", installable and offline.

## Options

- **React or Svelte + Vite.** Components, hot reload and a type checker, at the cost of a build step, a dependency tree and a bigger first download.
- **Plain HTML, CSS and JavaScript.** `app.js` is a classic script, and `pose.js` and `counter.js` are ES modules, with `pose.js` loaded lazily on the first battle.

## Decision

Plain files. The app (HTML, CSS, JS) is about 1,900 lines and 115 KB before the art and engine. Tests and tools use only Node's standard library: `node --test`, `node:http`, and the `WebSocket` built into Node 22 for driving Chrome.

## Consequences

- There's nothing to install or upgrade, no supply chain beyond the vendored MediaPipe, and deploying is copying files.
- The service worker can list exactly what to cache, because the files in the repo are the files served.
- No type checker. `counter.js`, the part that must be right, is pure, has no DOM, and is covered by 23 tests instead.
- `app.js` renders views with template strings and one delegated click handler. That's fine at this size. Past a few more screens, a component framework would earn its keep.
