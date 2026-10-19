// Synthetic poses with known geometry: the counter's basic contract.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RepCounter, jointStatus } from '../counter.js';
import { rng } from './helpers.js';

const rnd = rng(7);
const blank = () => Array.from({ length: 33 }, () => ({ x: 0, y: 0, visibility: 0.05 }));
const put = (a, i, x, y, v = 0.95) => { a[i] = { x: x + rnd() * 4, y: y + rnd() * 4, visibility: v }; };

// Side view pushup: forearm vertical, elbow angle swings between theta values.
function sidePush(theta) {
  const a = blank(), wx = 300, wy = 600, f = 110, u = 120, r = theta * Math.PI / 180;
  const ex = wx, ey = wy - f, sx = ex + u * Math.sin(r), sy = ey + u * Math.cos(r);
  for (const [s, e, w] of [[11, 13, 15], [12, 14, 16]]) { put(a, w, wx, wy); put(a, e, ex, ey); put(a, s, sx, sy); }
  put(a, 23, sx + 260, sy + 30); put(a, 24, sx + 262, sy + 32); // hips: body horizontal
  return a;
}
// Front view pushup: arms look straight in 2D, shoulders sink toward the hands.
function frontPush(d) {
  const a = blank(), arm = 220;
  [[11, 13, 15, 250], [12, 14, 16, 450]].forEach(([s, e, w, x]) => {
    const sy = 600 - arm * (1 - d);
    put(a, w, x, 600); put(a, s, x, sy); put(a, e, x + (x < 350 ? -1 : 1) * d * 60, (sy + 600) / 2);
    put(a, x < 350 ? 23 : 24, x + (x < 350 ? 40 : -40), sy - 30); // hips behind, level with shoulders
  });
  return a;
}
// Side view squat: knee angle swings between theta values.
function sideSquat(theta, ankles = true) {
  const a = blank(), ax = 300, ay = 800, sh = 200, th = 200, r = theta * Math.PI / 180;
  const kx = ax + 40 * (1 - theta / 180), ky = ay - sh, hx = kx - th * Math.sin(r), hy = ky + th * Math.cos(r);
  for (const [h, k, an] of [[23, 25, 27], [24, 26, 28]]) { put(a, h, hx, hy); put(a, k, kx, ky); ankles ? put(a, an, ax, ay) : put(a, an, ax, ay, 0.1); }
  put(a, 11, hx + 30, hy - 220); put(a, 12, hx + 32, hy - 222); // shoulders above hips
  return a;
}
// Upright person bending their elbows, e.g. sitting at a desk.
function standingCurl(theta) {
  const a = sidePush(theta);
  put(a, 23, a[11].x, a[11].y + 260); put(a, 24, a[12].x, a[12].y + 262);
  return a;
}

/** Hold the top, then do `reps` full (or partial) cycles at ~30 fps. */
function run(mode, frame, top, bottom, reps, partial = false) {
  const c = new RepCounter(mode);
  let t = 0, n = 0;
  for (let i = 0; i < 20; i++) n += c.update(frame(top), (t += 33)).rep;
  for (let r = 0; r < reps; r++) {
    const lo = partial ? top + (bottom - top) * 0.35 : bottom;
    for (let i = 0; i <= 30; i++) n += c.update(frame(top + (lo - top) * (i / 30)), (t += 33)).rep;
    for (let i = 0; i <= 30; i++) n += c.update(frame(lo + (top - lo) * (i / 30)), (t += 33)).rep;
  }
  return n;
}

test('counts side-view pushups', () => assert.equal(run('pushup', sidePush, 172, 75, 10), 10));
test('counts front-view pushups (shoulder drop, arms look straight)', () => assert.equal(run('pushup', frontPush, 0, 0.75, 8), 8));
test('ignores half pushups', () => assert.equal(run('pushup', sidePush, 172, 75, 6, true), 0));
test('ignores arm bends while upright', () => assert.equal(run('pushup', standingCurl, 172, 75, 6), 0));
test('counts side-view squats', () => assert.equal(run('squat', sideSquat, 175, 80, 12), 12));
test('counts squats with ankles out of view', () => assert.equal(run('squat', t => sideSquat(t, false), 175, 80, 5), 5));
test('counts nothing when nobody is in frame', () => {
  const c = new RepCounter();
  let n = 0;
  for (let i = 0; i < 200; i++) n += c.update(blank(), i * 33).rep;
  assert.equal(n, 0);
});

/** Like run(), but returns every event so shallow reps and rep quality can be checked. */
function events(mode, frame, top, bottom, reps, partial = false) {
  const c = new RepCounter(mode);
  let t = 0;
  const out = { reps: 0, partials: 0, qualities: [] };
  const step = f => { const r = c.update(f, (t += 33)); if (r.rep) { out.reps++; out.qualities.push(r.quality); } if (r.partial) out.partials++; };
  for (let i = 0; i < 20; i++) step(frame(top));
  for (let r = 0; r < reps; r++) {
    const lo = partial ? top + (bottom - top) * 0.55 : bottom;
    for (let i = 0; i <= 30; i++) step(frame(top + (lo - top) * (i / 30)));
    for (let i = 0; i <= 30; i++) step(frame(lo + (top - lo) * (i / 30)));
  }
  return out;
}

test('a shallow rep is reported, not counted', () => {
  const e = events('pushup', sidePush, 172, 75, 5, true);
  assert.equal(e.reps, 0);
  assert.equal(e.partials, 5);
});
test('full reps are never also reported as shallow', () => {
  const e = events('pushup', sidePush, 172, 75, 8);
  assert.equal(e.reps, 8);
  assert.equal(e.partials, 0);
});
test('each counted rep reports its depth and duration', () => {
  const e = events('pushup', sidePush, 172, 75, 4);
  assert.equal(e.qualities.length, 4);
  for (const q of e.qualities) {
    assert.ok(q.depth >= 0.9 && q.depth <= 1, `depth ${q.depth}`);
    assert.ok(q.ms > 1000 && q.ms < 2500, `ms ${q.ms}`); // 60 frames at 33 ms, minus the top dwell
  }
});
test('joint checklist: ready when the needed joints are seen, not when nobody is there', () => {
  assert.equal(jointStatus(sidePush(172), 'pushup').ready, true);
  assert.equal(jointStatus(blank(), 'pushup').ready, false);
  assert.deepEqual(jointStatus(blank(), 'pushup').parts.map(p => p.key), ['shoulders', 'elbows', 'wrists', 'hips']);
  assert.equal(jointStatus(sideSquat(175, false), 'squat').ready, true); // feet are optional for squats
});
