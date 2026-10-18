# Test fixtures

Each file holds pose landmarks extracted from a public exercise video, one entry per frame at 15 fps. The rep counter is tested by replaying them, so accuracy claims can be rerun without a camera. The videos themselves are not in this repo.

A frame is `[t, joints]`. `t` is seconds, and `joints` is `null` when no person was detected. Otherwise it lists `[x, y, visibility]` for the joints named in `joints` at the top of the file: nose, shoulders, elbows, wrists, hips, knees and ankles, in MediaPipe's numbering. `x` and `y` are normalized to the frame, so a joint the model guessed off-screen falls outside `0..1`.

Regenerate or add one with `npm run extract -- <video> <out.json> --title ... --author ... --license ... --url ...`.

## Sources and licences

The landmark data is derived from these videos. Each fixture carries its source's licence, and its `source` field repeats the credit.

| Fixture | Source video | Author | Licence |
|---|---|---|---|
| `side-pushups.json` | [Interval Push-ups](https://commons.wikimedia.org/wiki/File:Interval_Push-ups.webm) | Taco fleur | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `barbell-squats-back.json` | [Squat - exercise demonstration video](https://commons.wikimedia.org/wiki/File:Squat_-_exercise_demonstration_video.webm) | FitnessScape | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) |
| `gym-closeups-talking.json` | [Squats Wikipedia](https://commons.wikimedia.org/wiki/File:Squats_Wikipedia.webm) | CRiles23 | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| `burpee-howto.json` | [Burpee How To](https://commons.wikimedia.org/wiki/File:Burpee_How_To.webm) | Gyglim | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| `army-hand-release-pushups.json` | [Army Combat Fitness Test: Hand-Release Push-Up](https://commons.wikimedia.org/wiki/File:Army_Combat_Fitness_Test-_Hand-Release_Push-Up_(HRP)_(Event_3).webm) | U.S. Army | Public domain |
| `navy-pushups-front.json` | [Navy SEAL BUD/S training: push-ups](https://commons.wikimedia.org/wiki/File:Navy-seal-buds-training-push-ups.ogv) | U.S. Navy SEALs | Public domain |

These fixtures are excluded from the repo's MIT licence. The four Creative Commons files stay under their source's licence; the CC BY-SA ones may be shared and adapted only under the same licence, with credit to the author.

## What each one tests

- **side-pushups**: 6 slow interval pushups filmed side-on, with standing up and getting down at the start and end. The ground truth was counted by hand from the frames.
- **barbell-squats-back**: 2 squats filmed from behind.
- **gym-closeups-talking**: close-ups of knees and shoes, plus someone talking to the camera. It is the "out of frame, not exercising" case, and should count almost nothing.
- **burpee-howto**: standing, face and hand close-ups, and planks with no pushup. It should count no pushups.
- **navy-pushups-front**: a slow front and diagonal demo with a handheld, moving camera, about 6 to 7 full dips.
- **army-hand-release-pushups**: the hands lift off the floor at the bottom, and the video cuts between angles. The planted-hands rule rejects these by design, so the test only guards against overcounting.
