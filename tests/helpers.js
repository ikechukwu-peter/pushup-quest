// Shared helpers: load recorded landmark fixtures and replay frames through a RepCounter.
import { readFileSync } from 'node:fs';
import { RepCounter } from '../counter.js';

const FIXTURES = new URL('./fixtures/', import.meta.url);

/** Load tests/fixtures/<name>.json as { width, height, frames: [{ t, lm }] }, lm in 33-landmark layout. */
export function loadFixture(name) {
  const doc = JSON.parse(readFileSync(new URL(`${name}.json`, FIXTURES), 'utf8'));
  const frames = doc.frames.map(([t, kept]) => {
    if (!kept) return { t, lm: null };
    // Fixtures keep only the joints the counter reads; the rest are "not seen".
    const lm = Array.from({ length: 33 }, () => [0.5, 0.5, 0]);
    doc.joints.forEach((j, i) => { lm[j] = kept[i]; });
    return { t, lm };
  });
  return { width: doc.width, height: doc.height, frames };
}

/** What pose.js hands the counter: pixel coords plus normalized coords for the in-frame check. */
export const toPoints = (lm, w, h) => lm && lm.map(([x, y, v]) => ({ x: x * w, y: y * h, nx: x, ny: y, visibility: v }));

/** Replay frames through a fresh counter; returns the timestamps (s) at which reps were counted. */
export function replay({ frames, width, height }, mode) {
  const counter = new RepCounter(mode);
  const reps = [];
  for (const f of frames) if (counter.update(toPoints(f.lm, width, height), f.t * 1000).rep) reps.push(f.t);
  return reps;
}

/** Deterministic noise, so synthetic cases are reproducible. */
export function rng(seed = 11) {
  return () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5);
}
