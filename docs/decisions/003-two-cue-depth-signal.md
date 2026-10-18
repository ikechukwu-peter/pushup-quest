# 003 — A two-cue depth signal over the elbow angle alone

## Context

A pushup is "elbows bend, then straighten", so the obvious signal is the elbow angle. But the camera sees a 2D projection. From the side the angle is honest. From the front, the elbows bend toward and away from the camera, along its line of sight, and the projected angle barely changes. Collinear points stay collinear under projection, so a straight arm always looks straight. A bent one can look straight too.

## Options

- **Elbow angle only**, and ask users to film from the side.
- **Shoulder height only:** how far the shoulders drop. That works from the front, but it depends on the person's size and their distance from the camera.
- **Both, normalized:** the elbow angle, plus the shoulder drop measured against the arm's own length captured while the arm is straight. Take whichever says "deeper".

## Decision

Both, combined as `max(angle cue, drop cue)` into one 0-to-1 depth signal ([counter.js L172-L193](../../counter.js#L172-L193)). The arm-length reference grows immediately when you move closer and shrinks slowly when you move away ([counter.js L166-L170](../../counter.js#L166-L170)). Squats mirror this with the knee angle and the hip drop against thigh length.

## Consequences

- It works from the side and from the front with one threshold. Synthetic front-view pushups count 8 of 8; in real footage the side view counts 6 of 6.
- Taking the max means either cue can produce a false "deep". That's why the counter needs gates on top ([004](004-gates-over-thresholds.md)), not just a threshold.
- Strict, Normal and Easy in Settings move a single number: the depth needed to count the bottom.
