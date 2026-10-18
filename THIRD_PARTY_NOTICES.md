# Third-party notices

Pushup Quest's own code is MIT (see [LICENSE](LICENSE)). It ships with, or is tested against, the following.

## MediaPipe Tasks Vision — `vendor/`

- **What:** `@mediapipe/tasks-vision` 1.1.1 (`vision_bundle.mjs`, `wasm/`) and the Pose Landmarker lite model (`pose_landmarker_lite.task`), by Google.
- **Licence:** Apache License 2.0, in [vendor/LICENSE](vendor/LICENSE).
- **Modified:** yes, in `vendor/vision_bundle.mjs` only. The usage-statistics logger's `flush()` returns before sending, so nothing is posted to `odml.pa.googleapis.com`. The change is marked with a header comment and an inline comment containing "Pushup Quest". The `wasm/` files and the model are unchanged.
- **Source:** https://github.com/google-ai-edge/mediapipe and https://www.npmjs.com/package/@mediapipe/tasks-vision

## Fluent Emoji (3D) — `art/`

- **What:** 3D emoji images, converted from PNG to WebP and resized for the app.
- **Licence:** MIT, Copyright (c) Microsoft Corporation, in [art/LICENSE-fluent-emoji.txt](art/LICENSE-fluent-emoji.txt).
- **Source:** https://github.com/microsoft/fluentui-emoji

## Test fixtures — `tests/fixtures/`

- **What:** pose landmarks extracted from public exercise videos on Wikimedia Commons. The videos are not included.
- **Licence:** per file, matching the source video: CC BY-SA 4.0, CC BY-SA 3.0, CC BY 3.0, or public domain. Authors and links are in [tests/fixtures/README.md](tests/fixtures/README.md) and in each file's `source` field.
