// Real exercise footage, replayed as recorded landmarks (see fixtures/README.md),
// plus stress cases built from it that recreate failures seen on a real webcam.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadFixture, replay, rng } from './helpers.js';

const side = loadFixture('side-pushups');
const squats = loadFixture('barbell-squats-back');
const closeups = loadFixture('gym-closeups-talking');
const burpee = loadFixture('burpee-howto');
const navy = loadFixture('navy-pushups-front');
const army = loadFixture('army-hand-release-pushups');

/** Assert the rep count is within [min, max], showing when reps fired if not. */
function expectReps(src, mode, min, max = min) {
  const reps = replay(src, mode);
  assert.ok(reps.length >= min && reps.length <= max,
    `${mode}: got ${reps.length} reps (want ${min === max ? min : `${min}-${max}`}) at ${reps.map(t => t.toFixed(1) + 's').join(', ')}`);
}

// --- real footage: counts that must be right ---
test('side-view pushups: all 6 counted', () => expectReps(side, 'pushup', 6));
test('barbell squats filmed from behind: both counted', () => expectReps(squats, 'squat', 2));
// Front/oblique demo with a handheld, moving camera: about 6-7 dips, some legitimately rejected.
test('front/oblique pushups with a moving camera: most counted', () => expectReps(navy, 'pushup', 4, 9));

// --- real footage: things that must NOT count ---
test('close-ups and talking count no pushups', () => expectReps(closeups, 'pushup', 0));
test('close-ups and talking count at most 2 squats', () => expectReps(closeups, 'squat', 0, 2));
test('burpees count no pushups', () => expectReps(burpee, 'pushup', 0));
test('squats count no pushups', () => expectReps(squats, 'pushup', 0));
test('pushups count no squats', () => expectReps(side, 'squat', 0));
test('front pushups count no squats', () => expectReps(navy, 'squat', 0));
// Hand-release pushups lift the hands at the bottom and the video cuts between angles,
// so the planted-hands rule rejects them by design. Only guards against runaway counts.
test('hand-release pushups and camera cuts never overcount', () => expectReps(army, 'pushup', 0, 12));
test('hand-release pushups count no squats', () => expectReps(army, 'squat', 0));

// --- stress cases built from the side-view footage ---
const rnd = rng(11);
const at = (src, fn) => ({ ...src, frames: src.frames.map(fn) });

test('walking out of frame mid-set and back adds no reps', () => {
  // slide out to the right, gone 2 s, come back closer (bigger), hold still
  const out = [];
  let t = 0;
  for (const f of side.frames) { if (f.t >= 12) break; out.push(f); t = f.t; }
  const base = out[out.length - 1].lm, step = 1 / 15;
  for (let i = 1; i <= 15; i++) out.push({ t: t += step, lm: base.map(([x, y, v]) => [x + i * 0.07, y, Math.max(0.3, v - (x + i * 0.07 > 1 ? 0.35 : 0))]) });
  for (let i = 0; i < 30; i++) out.push({ t: t += step, lm: null });
  for (let i = 15; i >= 0; i--) out.push({ t: t += step, lm: base.map(([x, y, v]) => [0.5 + (x - 0.5) * 1.25 + i * 0.07, 0.5 + (y - 0.5) * 1.25 + rnd() * 0.02, Math.max(0.3, v - (i ? 0.2 : 0))]) });
  for (let i = 0; i < 30; i++) out.push({ t: t += step, lm: base.map(([x, y, v]) => [0.5 + (x - 0.5) * 1.25 + rnd() * 0.006, 0.5 + (y - 0.5) * 1.25 + rnd() * 0.006, v]) });
  expectReps({ ...side, frames: out }, 'pushup', 1); // the one real rep before walking off
});

test('lying flat for 3 s mid-set, then carrying on: no reps lost', () => {
  const lieFlat = at(side, f => f.t >= 18 && f.t < 21
    ? { t: f.t, lm: f.lm.map(([x, y, v], i) => i >= 13 && i <= 16 ? [x, y + 0.05, 0.2] : [x, y + 0.08, v]) }
    : f);
  expectReps(lieFlat, 'pushup', 6);
});

test('hip tracking flickering every few frames: no reps lost', () => {
  let n = 0;
  const flicker = at(side, f => n++ % 9 < 2 ? { t: f.t, lm: f.lm.map(([x, y, v], i) => i === 23 || i === 24 ? [x, y, 0.3] : [x, y, v]) } : f);
  expectReps(flicker, 'pushup', 6);
});

function deskIdle(secs = 40) {
  // seated at a laptop: head and shoulders visible, elbows near the bottom edge,
  // wrists below the frame (the model guesses them, jittery, with middling confidence)
  const frames = [];
  for (let i = 0; i < secs * 15; i++) {
    const lm = Array.from({ length: 33 }, () => [0.5, 1.4, 0.05]);
    const sway = Math.sin(i / 20) * 0.02, j = () => rnd() * 0.06;
    lm[0] = [0.5 + sway, 0.35, 0.99];
    lm[11] = [0.66 + sway, 0.68, 0.99]; lm[12] = [0.34 + sway, 0.68, 0.99];
    lm[13] = [0.72 + j(), 0.95 + j(), 0.6 + j()]; lm[14] = [0.28 + j(), 0.95 + j(), 0.6 + j()];
    lm[15] = [0.6 + j() * 3, 1.08 + j() * 3, 0.55 + j()]; lm[16] = [0.4 + j() * 3, 1.08 + j() * 3, 0.55 + j()];
    lm[23] = [0.62, 1.3, 0.3 + j()]; lm[24] = [0.38, 1.3, 0.3 + j()];
    frames.push({ t: i / 15, lm });
  }
  return { width: 640, height: 480, frames };
}
test('sitting at the desk doing nothing counts no pushups', () => expectReps(deskIdle(), 'pushup', 0));
test('sitting at the desk doing nothing counts no squats', () => expectReps(deskIdle(), 'squat', 0));
