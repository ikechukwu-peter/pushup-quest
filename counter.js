// Turns body landmarks into a 0..1 "depth" signal and counts full reps.
//
// Depth cues (whichever is stronger):
//  - pushups: elbow angle, and how far the shoulders drop toward the wrists
//    relative to arm length measured with straight arms (works from the front)
//  - squats: knee angle, and how far the hips drop toward the knees
//
// A rep is only counted when ALL of these hold, which rejects most false reps:
//  - the joints it depends on are clearly visible and inside the frame
//    (the model guesses joints that are off-screen; those guesses are ignored)
//  - tracking has been stable for a moment and a clean top position was held
//  - posture fits the exercise (pushups: torso not upright; squats: upright)
//  - the planted points stay planted (hands for pushups, feet for squats);
//    squatting or walking moves them, a real pushup doesn't
//  - a full cycle happened: top -> bottom (held briefly) -> top

export const LM = { nose: 0, ls: 11, rs: 12, le: 13, re: 14, lw: 15, rw: 16, lh: 23, rh: 24, lk: 25, rk: 26, la: 27, ra: 28 };
export const BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]];

const VIS = 0.6;        // visibility needed for a joint to be trusted
const EDGE = 0.01;      // normalized margin: joints outside the frame are guesses
const LOST_MS = 700;    // tracking gap that abandons the rep in progress
const FORGET_MS = 3000; // longer gap: also forget arm/leg calibration (you may come back at another distance)
const GRACE_MS = 400;   // posture must be wrong this long before a rep is abandoned (ignores flicker)
const SETTLE_MS = 250;  // stable tracking needed before counting starts
const TOP_HOLD_MS = 150;// time at the top before a rep can start
const MIN_BOTTOM_MS = 120;
const PARTIAL = 0.45;    // went at least this deep, then came back up: a shallow rep (not counted)
const MAX_REP_MS = 20000;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mean = a => ({ x: a.reduce((s, p) => s + p.x, 0) / a.length, y: a.reduce((s, p) => s + p.y, 0) / a.length });
// Anchors are tracked per side ({L, R}) so one hand/foot dropping out of view
// (often hidden behind the body at the bottom) doesn't look like movement.
const drift = (a, b) => { let d = 0; for (const k in a) if (b[k]) d = Math.max(d, dist(a[k], b[k])); return d; };
const blend = (a, b, w) => { const o = { ...a }; for (const k in b) o[k] = a[k] ? { x: a[k].x * (1 - w) + b[k].x * w, y: a[k].y * (1 - w) + b[k].y * w } : b[k]; return o; };
const inFrame = p => p.nx === undefined || (p.nx >= -EDGE && p.nx <= 1 + EDGE && p.ny >= -EDGE && p.ny <= 1 + EDGE);
const ok = (p, vis = VIS) => !!p && (p.visibility ?? 1) >= vis && inFrame(p);

export function angle(a, b, c) {
  const ux = a.x - b.x, uy = a.y - b.y, vx = c.x - b.x, vy = c.y - b.y;
  const d = Math.hypot(ux, uy) * Math.hypot(vx, vy);
  if (!d) return 180;
  return Math.acos(clamp((ux * vx + uy * vy) / d, -1, 1)) * 180 / Math.PI;
}

/**
 * Which body parts the camera can see well enough to count, for the setup screen.
 * A part is ok if either side's joint is confident and inside the frame.
 * Returns [{ key, label, ok }] in head-to-toe order; ready = every required part ok.
 */
export function jointStatus(pts, mode = 'pushup') {
  const parts = mode === 'squat'
    ? [['shoulders', 'Shoulders', LM.ls, LM.rs], ['hips', 'Hips', LM.lh, LM.rh], ['knees', 'Knees', LM.lk, LM.rk], ['ankles', 'Feet', LM.la, LM.ra]]
    : [['shoulders', 'Shoulders', LM.ls, LM.rs], ['elbows', 'Elbows', LM.le, LM.re], ['wrists', 'Hands', LM.lw, LM.rw], ['hips', 'Hips', LM.lh, LM.rh]];
  const list = parts.map(([key, label, a, b]) => ({ key, label, ok: !!pts && (ok(pts[a], key === 'hips' ? 0.5 : VIS) || ok(pts[b], key === 'hips' ? 0.5 : VIS)) }));
  // Squats can count without the feet in view (see squat()), so they're advisory.
  const ready = list.every(p => p.ok || p.key === 'ankles');
  return { parts: list, ready };
}

export class RepCounter {
  /**
   * @param {'pushup'|'squat'} mode
   * @param {{down?:number, up?:number, minGap?:number}} opts thresholds on the 0..1 depth signal
   */
  constructor(mode = 'pushup', opts = {}) {
    this.mode = mode;
    this.down = opts.down ?? 0.7;
    this.up = opts.up ?? 0.3;
    this.minGap = opts.minGap ?? 400;
    this.reset();
  }

  reset() {
    this.reps = 0;
    this.lastRep = -Infinity;
    this.restart();
  }

  // Forget the current attempt (e.g. after losing the person). Calibration is
  // kept unless forget is set, so getting back into position is quick.
  restart(forget = true) {
    this.state = 'wait'; // wait -> top -> bottom -> top (rep)
    this.p = 0;
    if (forget) this.ref = {};
    this.badSince = null;
    this.visible = false;
    this.validSince = null;
    this.lostAt = null;
    this.topSince = null;
    this.anchor = null;
    this.bottomAt = 0;
    this.repStart = 0;
    this.peak = 0;
    this.reason = '';
  }

  /**
   * pts: landmarks in pixel space ({x, y, visibility, nx?, ny?}); nx/ny are the
   * normalized coords used for the in-frame check. t: ms timestamp.
   * Returns {visible, posture, p, state, rep, partial, quality, reason}.
   * - rep: a full rep was just counted; quality = { depth: 0..1, ms } for it.
   * - partial: a shallow rep just ended (went partway down, came back up). Not counted.
   * - reason: why reps aren't being counted: nohips | upright | hands | noshoulders | notupright | moved | slow.
   */
  update(pts, t) {
    const m = pts ? (this.mode === 'squat' ? this.squat(pts) : this.pushup(pts)) : null;
    if (!m) {
      this.lostAt ??= t;
      if (t - this.lostAt > FORGET_MS) this.restart(true);
      else if (t - this.lostAt > LOST_MS && this.validSince !== null) this.restart(false);
      this.visible = false;
      this.p *= 0.8;
      return this.out(false, false);
    }
    this.lostAt = null;
    this.validSince ??= t;
    this.visible = true;

    if (m.why) {
      // Brief posture flickers (a joint's confidence wobbling) are ignored.
      this.badSince ??= t;
      if (t - this.badSince < GRACE_MS) return this.out(true, true);
      // Wrong body position for this exercise: abandon any rep in progress.
      this.reason = m.why;
      this.state = 'wait'; this.topSince = null; this.anchor = null; this.repStart = 0;
      this.p *= 0.8;
      return this.out(true, false);
    }
    this.badSince = null;
    if (this.reason !== 'moved' || this.state !== 'wait') this.reason = '';

    this.p = this.p * 0.35 + m.p * 0.65;
    const scale = m.scale || 1;
    const moved = m.anchor && this.anchor ? drift(m.anchor, this.anchor) / scale : 0;
    let rep = false, partial = false, quality = null;
    if (this.state !== 'wait' && this.p > this.up) this.peak = Math.max(this.peak, this.p);

    if (this.state === 'wait') {
      // Already calibrated earlier in this set (e.g. you just lay down or stepped
      // out briefly): lock back on almost instantly.
      const known = Object.keys(this.ref).length > 0;
      if (t - this.validSince >= (known ? 100 : SETTLE_MS) && this.p <= this.up) {
        this.topSince ??= t;
        if (t - this.topSince >= (known ? 0 : TOP_HOLD_MS)) { this.state = 'top'; this.anchor = m.anchor; this.reason = ''; }
      } else this.topSince = null;
    } else if (this.state === 'top') {
      if (moved > 0.6) { this.toWait('moved'); }
      else {
        if (m.anchor && this.p <= this.up) this.anchor = this.anchor ? blend(this.anchor, m.anchor, 0.2) : m.anchor;
        if (this.p > this.up && !this.repStart) this.repStart = t;
        if (this.p <= this.up) {
          // Came back up without reaching the bottom: a shallow rep if it went far enough.
          if (this.repStart && this.peak >= PARTIAL) partial = true;
          this.repStart = 0; this.peak = 0;
        }
        if (this.p >= this.down) { this.state = 'bottom'; this.bottomAt = t; this.repStart ||= t; }
      }
    } else if (this.state === 'bottom') {
      if (moved > 0.45) this.toWait('moved');
      else if (t - this.repStart > MAX_REP_MS) this.toWait('slow');
      else if (this.p < this.down) {
        // must have actually held the bottom for a moment
        if (t - this.bottomAt < MIN_BOTTOM_MS) { this.state = 'top'; }
        else this.state = 'rising';
      }
    }
    if (this.state === 'rising') {
      if (moved > 0.45) this.toWait('moved');
      else if (this.p >= this.down) { this.state = 'bottom'; }
      else if (this.p <= this.up) {
        if (t - this.lastRep >= this.minGap) {
          rep = true; this.reps++; this.lastRep = t;
          quality = { depth: Math.min(1, this.peak), ms: t - this.repStart };
        }
        this.state = 'top'; this.repStart = 0; this.peak = 0;
      }
    }
    return this.out(true, true, rep, partial, quality);
  }

  toWait(reason) { this.state = 'wait'; this.topSince = null; this.anchor = null; this.repStart = 0; this.peak = 0; this.reason = reason; }

  out(visible, posture, rep = false, partial = false, quality = null) {
    const state = this.state === 'rising' ? 'bottom' : this.state;
    return { visible, posture, p: this.p, state, rep, partial, quality, reason: this.reason };
  }

  // Reference limb length, measured while the limb is straight.
  // Grows instantly (moved closer) and shrinks slowly (moved away).
  refLen(key, len, straight) {
    const r = this.ref[key];
    if (straight) this.ref[key] = !r || len > r ? len : r * 0.99 + len * 0.01;
    return this.ref[key] || 0;
  }

  pushup(pts) {
    const sides = [];
    for (const [s, e, w, k] of [[LM.ls, LM.le, LM.lw, 'L'], [LM.rs, LM.re, LM.rw, 'R']]) {
      const S = pts[s], E = pts[e], W = pts[w];
      if (!ok(S) || !ok(E) || !ok(W)) continue;
      const ang = angle(S, E, W);
      const len = dist(S, E) + dist(E, W);
      const ref = this.refLen(k, len, ang > 150);
      const drop = W.y - S.y; // wrist below shoulder, in pixels
      const pAng = clamp((160 - ang) / 70);
      const pDrop = ref ? clamp((1 - drop / ref) / 0.6) : 0;
      // Hands are on the floor: wrists can't be well above the shoulders or elbows.
      const handsDown = W.y > S.y - 0.25 * len && W.y > E.y - 0.35 * len;
      sides.push({ k, p: Math.max(pAng, pDrop), W, S, len: ref || len, handsDown });
    }
    if (!sides.length) return null;
    const p = sides.reduce((a, s) => a + s.p, 0) / sides.length;
    const scale = Math.max(...sides.map(s => s.len));
    const anchor = Object.fromEntries(sides.filter(s => ok(s.W, 0.8)).map(s => [s.k, s.W]));
    const why = !sides.every(s => s.handsDown) ? 'hands' : this.uprightWhy(pts);
    return { p, scale, anchor, why };
  }

  // Pushup posture: the torso must not be upright (standing, sitting, kneeling tall).
  // Side view: torso near horizontal. Front view: hips roughly level with or above
  // the shoulders in the image. Hips are required, otherwise posture is unknown.
  // Returns '' when fine, otherwise a reason code.
  uprightWhy(pts) {
    const sh = [pts[LM.ls], pts[LM.rs]].filter(p => ok(p));
    const hp = [pts[LM.lh], pts[LM.rh]].filter(p => ok(p, 0.5));
    if (!sh.length || !hp.length) return 'nohips';
    const S = mean(sh), H = mean(hp);
    const dy = H.y - S.y, dx = Math.abs(H.x - S.x);
    const spread = sh.length === 2 ? dist(sh[0], sh[1]) : 0;
    return dy < 0.9 * Math.max(dx, spread * 0.8, 1) ? '' : 'upright';
  }

  squat(pts) {
    const sides = [];
    for (const [h, kn, an, k] of [[LM.lh, LM.lk, LM.la, 'L'], [LM.rh, LM.rk, LM.ra, 'R']]) {
      const H = pts[h], K = pts[kn], A = pts[an];
      if (!ok(H) || !ok(K)) continue;
      const hasA = ok(A);
      const thigh = dist(H, K);
      const drop = K.y - H.y; // knee below hip, in pixels
      let pAng = 0, straight = drop > thigh * 0.9; // without ankles: vertical thigh = standing
      if (hasA) { const ang = angle(H, K, A); straight = ang > 160; pAng = clamp((165 - ang) / 75); }
      const ref = this.refLen(k, thigh, straight);
      const pDrop = ref ? clamp((1 - drop / ref) / 0.7) : 0;
      sides.push({ k, p: Math.max(pAng, pDrop), A: hasA ? A : null, H, len: ref || thigh });
    }
    if (!sides.length) return null;
    const p = sides.reduce((a, s) => a + s.p, 0) / sides.length;
    const feet = sides.filter(s => s.A);
    // Squat posture: shoulders visible and above the hips (torso upright-ish).
    const sh = [pts[LM.ls], pts[LM.rs]].filter(p => ok(p));
    let why = 'noshoulders';
    if (sh.length) {
      const S = mean(sh), H = mean(sides.map(s => s.H));
      why = H.y - S.y > 0.5 * Math.abs(H.x - S.x) ? '' : 'notupright';
    }
    return { p, scale: Math.max(...sides.map(s => s.len)), anchor: Object.fromEntries(feet.filter(s => ok(s.A, 0.8)).map(s => [s.k, s.A])), why };
  }
}
