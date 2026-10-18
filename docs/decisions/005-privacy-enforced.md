# 005 — Enforcing privacy in code, not just stating it

## Context

The plan was a first-launch note: your video stays on this device, your progress stays on this device, nothing is tracked. Before writing it, the vendored MediaPipe bundle was searched for network calls. It contains a logger that posts usage statistics (task name, running mode, latency counters) to `https://odml.pa.googleapis.com/v1/log` every 60 seconds. It starts automatically and has no option to disable it. No images or landmarks are in it, but "nothing leaves your phone" would still have been false.

## Options

- **Soften the copy** ("anonymous usage statistics may be sent to Google").
- **Patch the logger** so it never sends.
- **Block it in the browser** with a Content-Security-Policy, `connect-src 'self'`.
- **Both:** patch it, and block anything that slips through.

## Decision

Both:

- **The patch:** in `vendor/vision_bundle.mjs`, `flush()` returns immediately and drops its queue.
- **The block:** a CSP allows connections only to the app's own origin. It's set as a `<meta>` tag in [index.html](../../index.html#L12) and as a response header in [vercel.json](../../vercel.json), along with `Permissions-Policy: camera=(self)`.

The user-facing note was written only after a network log showed it to be true:

- **Without the patch:** every request recorded during a 75 s camera battle stayed on the app's origin, and the browser logged the blocked attempt to `odml.pa.googleapis.com` at about 60 s.
- **With the patch:** there was no attempt at all.

## Consequences

- The promise holds even if a future dependency tries to phone home: the browser refuses it.
- The patch has to be re-applied on any MediaPipe upgrade. It's marked in the file and noted in [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md).
- The CSP rules out third-party scripts, fonts and analytics for good. Any of them would need a deliberate policy change, which is the point.
- The host still sees ordinary request metadata when files are downloaded, and the privacy page says so.
