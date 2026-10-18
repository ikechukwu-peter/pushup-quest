# 004 — Hard gates over tuning one threshold

## Context

The first counter was a depth signal with two thresholds: down past 0.7, back up past 0.3. Tested on a real webcam it counted reps when nobody was exercising:

- someone stepping out of frame and back
- squats in pushup mode
- sitting at the desk with hands below the frame

Replaying public footage reproduced all of these (5 false reps in a clip of close-ups and talking, 3 in a burpee demo).

## Options

- **Tune the thresholds tighter.** It cuts some false reps, and real ones with them, and does nothing about off-screen guesses that cross any threshold.
- **Smooth harder.** That adds lag and doesn't change what is being measured.
- **Gates:** conditions that must all hold before a rep can count, each one tied to a failure actually observed.

## Decision

Gates ([counter.js L20-L37](../../counter.js#L20-L37), [L89-L155](../../counter.js#L89-L155)):

1. **Seen and in frame.** Every joint the rep depends on has visibility ≥ 0.6 and normalized coordinates inside the frame, because the model returns guesses for joints off-screen.
2. **Settled.** Tracking is stable for 250 ms, and a clean top position is held for 150 ms before counting starts.
3. **Posture.**
   - For pushups the torso is not upright: near-horizontal from the side, and hips level with the shoulders from the front. The hands are below the shoulders.
   - For squats the shoulders are visible and above the hips.
4. **Planted.** The hands (pushups) or feet (squats) stay within a fraction of a limb length of where they were at the top. Each one is tracked separately, so the far hand disappearing behind the body doesn't look like movement.
5. **A full cycle.** Top, then bottom held for at least 120 ms, then top again, with at least 400 ms between reps.

Two tolerances keep the gates from being brittle:

- A posture must be wrong for 400 ms before a rep is abandoned, which absorbs confidence flicker.
- A dropout under 3 s keeps the calibration and re-locks in 0.1 s.

## Consequences

- False reps went to zero across every negative case in [accuracy.md](../accuracy.md), while true reps held (6/6 side view, 2/2 squats).
- Front views with a moving camera lose some reps (4 of about 6–7). That's an accepted cost: a counter people score themselves with must not invent reps.
- Hand-release pushups don't count, because the hands lift by design.
- Every gate is a reason the app can show the user, for example "Move back so your hips are in view too".
