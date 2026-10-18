# 001 — On-device pose detection over a server or a cloud API

## Context

To count reps, something has to look at the camera. A rep counter is used at home, often shirtless, by people who won't want that video going anywhere. It also has to keep up with the movement: a rep lasts about a second, and the feedback (depth bar, "now push up!") needs to feel immediate.

## Options

- **Stream frames to a server** that runs a pose model. Any model size is possible, but the video leaves the device, every user costs server time, and it's useless offline or on a bad connection.
- **A cloud vision API.** The same problems as a server, plus a third party sees the video.
- **On-device in the browser**, with MediaPipe Pose Landmarker (WASM + WebGL) or TensorFlow.js MoveNet.

## Decision

On-device, with MediaPipe Pose Landmarker **lite**. It returns 33 landmarks with a visibility score each. It runs on the GPU through WebGL and falls back to the CPU ([pose.js L8-L23](../../pose.js#L8-L23)). The lite model (about 5.8 MB) keeps the first load reasonable on a phone.

## Consequences

- Video never leaves the device, which is what makes the privacy promise possible at all ([005](005-privacy-enforced.md)).
- It works offline once cached, and running costs are zero.
- The model is the lite one: fewer pixels of evidence, less accuracy on small or distant bodies. The counter's gates ([004](004-gates-over-thresholds.md)) have to absorb that.
- The engine is large, about 33 MB including both WASM builds. It's cached once by the service worker.
