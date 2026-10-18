# Accuracy

How well the rep counter does on real footage, what each fix changed, and how to rerun it.

## Method

Public exercise videos (credited in [tests/fixtures/README.md](../tests/fixtures/README.md)) were split into frames at 15 fps. Each frame was run through the same MediaPipe pose model the app uses, and the landmarks were saved as fixtures. [tests/footage.test.js](../tests/footage.test.js) replays them through `RepCounter`, exactly as `pose.js` feeds it live. Ground truth was counted by hand from contact sheets of the frames.

Three stress cases are built from the side-view footage to recreate failures seen on a real webcam:

- the person slides out of frame, is gone for 2 s, and comes back closer
- the person lies flat with their arms hidden for 3 s
- hip confidence drops below the threshold for 2 of every 9 frames

One synthetic case simulates sitting at a laptop with the wrists below the frame.

## Results

The "Before the gates" column is the counter as it was when a user first reported false counts. The "Now" column is the current counter, as asserted by the tests.

| Case | Truth | Before the gates | Now |
|---|---|---|---|
| Side-view pushups (interval, standing up and getting down included) | 6 | 6 | **6** |
| Barbell squats, filmed from behind | 2 | 2 | **2** |
| Front/oblique pushups, handheld moving camera | ≈ 6–7 | 0–2 while tuning | **4** |
| Close-ups and talking, pushup mode | 0 | 5 | **0** |
| Burpee how-to, pushup mode | 0 | 3 | **0** |
| Barbell squats, pushup mode | 0 | 1 | **0** |
| Side-view pushups, squat mode | 0 | 1 | **0** |
| Walk out of frame mid-set and back | 1 | 1 | **1** |
| Lie flat 3 s mid-set, then continue | 6 | 5 | **6** |
| Hip tracking flickering during the set | 6 | — | **6** |
| 40 s idle at a desk, wrists below the frame | 0 | 0 | **0** |

**Live check:** the full app, running in Chrome with the side-view video as its camera, counted **6 of 6**.

**Not a pass/fail case:** army hand-release pushups. The hands leave the floor at the bottom by design, so the planted-hands rule rejects them. The test only asserts the count never runs away (0–12).

## What each fix bought

- **In-frame check plus higher confidence threshold:** close-ups went from 5 false reps to 0. The model was guessing hidden wrists below the frame.
- **Posture gate:** squats counted as pushups went from 1 to 0, and burpees from 3 to 0.
- **Planted hands, tracked per hand:** the front view went from 0 to 4. An average of two hands jumped when the far hand was hidden behind the body.
- **Plank gate (side view):** standing up from the floor stopped counting as a 7th pushup in the first live test.
- **Keeping calibration through short dropouts, and re-locking in 0.1 s:** lying flat went from 5 to 6.
- **400 ms grace on posture flicker:** a wobbling hip no longer resets a rep in progress.

## Known limits

- Front views with a moving camera miss reps (4 of about 6–7). A phone propped still does better, but that isn't measured here.
- Only six videos. No measurements across many bodies, clothing, lighting or phones yet.
- Fixtures are sampled at 15 fps. Phones run the live model at 15–30 fps, and the counter's timings were chosen to hold at either rate.

## Rerun it

```sh
npm test                                            # all 23 tests, about 1 s
npm run extract -- clip.webm tests/fixtures/new.json --title "..." --author "..." --license "..." --url "..."
```

To measure a new clip, extract it, count its reps by hand, and add an `expectReps(...)` line to [tests/footage.test.js](../tests/footage.test.js).
