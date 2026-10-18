# 007 — Testing against replayed real footage, not only synthetic poses

## Context

The first tests used synthetic poses: arms and legs built from angles, with a little noise. They passed, and the counter still failed on a real webcam, because real landmarks don't behave like that:

- they jitter
- they get guessed off-screen
- one hand disappears behind the body
- confidence flickers

## Options

- **Test by hand on a webcam after every change.** It's slow, impossible to repeat, and depends on one person's body and room.
- **Synthetic poses only.** They're quick, but they encode the developer's assumptions, which were exactly what was wrong.
- **Replay real footage.** Extract landmarks from public exercise videos with the app's own model, commit them as fixtures, and assert counts against ground truth counted by hand.

## Decision

Replay real footage, alongside the synthetic tests:

- [scripts/extract-landmarks.mjs](../../scripts/extract-landmarks.mjs) turns a video into a fixture by feeding JPEG frames to the same model in headless Chrome.
- [tests/footage.test.js](../../tests/footage.test.js) asserts both counts that must be right and counts that must be zero.
- Stress cases built from the same footage recreate failures reported from a real webcam: walking out of frame, lying flat, and confidence flicker.

## Consequences

- Each fix in [accuracy.md](../accuracy.md) has a test that failed before it and passes after it. The whole suite runs in about a second, with no browser or camera.
- The first attempt fed frames by seeking a `<video>`. Headless Chrome doesn't repaint after a seek, so every "measurement" was frame one repeated. Feeding still images fixed it, and the extractor's comments say why.
- The videos aren't committed, only the landmarks, at about 1.1 MB. Fixtures from CC BY-SA videos stay CC BY-SA and are credited per file.
- Six videos isn't a population. The numbers show the counter's behavior, not its accuracy across all bodies and phones.
