# 002 — A vendored MediaPipe over loading it from a CDN

## Context

MediaPipe's documentation loads its JavaScript, WASM and model from jsDelivr and Google Cloud Storage at runtime. The app has to work offline after its first visit. And the privacy promise means that, after that first visit, nothing should connect anywhere but the app's own host.

## Options

- **Load it from the CDN** and let the service worker cache the cross-origin responses.
- **Vendor it:** copy a pinned version (`@mediapipe/tasks-vision` 1.1.1) and the model into `vendor/`, and serve them from the app's own origin.

## Decision

Vendor it. The service worker precaches the engine alongside the app, and the CSP can stay `connect-src 'self'`.

## Consequences

- One origin. Third-party CDN traffic and a third party's availability don't affect a user mid-workout.
- The version is pinned. A silent upstream change can't alter the model or the bundle.
- It made the telemetry patch possible ([005](005-privacy-enforced.md)). The modified file is marked, and Apache-2.0's notice requirements are met in [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md).
- The repo carries about 33 MB of binaries, and upgrades are manual: replace `vendor/`, re-apply the patch, and bump `VENDOR` in `sw.js`.
- Both WASM builds (with and without SIMD) are cached, roughly doubling the engine's size, so older phones without SIMD still work.
