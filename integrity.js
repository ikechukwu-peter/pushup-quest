// Save integrity: tamper-evident, not tamper-proof.
//
// Everything runs on the player's own device, so a determined person can always
// change their save (or the code). This catches the casual cases — editing an
// exported file, or the browser's storage — and marks the save "edited":
//
//  1. sign():   every save is signed with a checksum. A save changed outside the
//               app no longer matches. (The salt is in this file, so this stops
//               editing a number, not someone who reads the code.)
//  2. repair(): totals that can be rebuilt from history are rebuilt, so editing
//               them directly does nothing.
//  3. check():  everything else is compared with the most that could possibly
//               have been earned. Bounds are deliberately generous: a false
//               "edited" on an honest save is worse than missing a small edit.
//
// Loaded as a classic script in the app (window.Integrity) and imported by the
// Node tests (globalThis.Integrity). Pure: no DOM, no storage.
(function (root) {
  'use strict';

  const SALT = 'pushup-quest/v3/';

  // cyrb53: a small, fast, synchronous 53-bit hash (not cryptographic).
  function hash(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 2654435761);
      h2 = Math.imul(h2 ^ c, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }

  /** Checksum of a save, ignoring its own `sig` field. */
  const sign = save => hash(SALT + JSON.stringify(save, (k, v) => (k === 'sig' ? undefined : v)));

  /**
   * Check a save as stored (before any migration).
   * 'ok' | 'legacy' (from before signing existed) | 'unsigned' | 'mismatch'
   */
  function verify(raw) {
    if (!raw || typeof raw !== 'object') return 'mismatch';
    if (!(raw.v >= 3)) return 'legacy';
    if (typeof raw.sig !== 'string') return 'unsigned';
    return raw.sig === sign(raw) ? 'ok' : 'mismatch';
  }

  /** Is this even shaped like a Pushup Quest save? (Import refuses anything that isn't.) */
  function looksLikeSave(raw) {
    const num = v => typeof v === 'number' && Number.isFinite(v);
    return !!raw && typeof raw === 'object' && !Array.isArray(raw)
      && num(raw.total) && num(raw.xp) && num(raw.gold)
      && raw.days && typeof raw.days === 'object' && !Array.isArray(raw.days);
  }

  /** Rebuild what can be derived from history. Mutates and returns the save. */
  function repair(s) {
    let total = 0;
    for (const d of Object.values(s.days || {})) total += Math.max(0, d && Number.isFinite(d.n) ? d.n : 0);
    s.total = total;
    const squat = Math.min(total, Math.max(0, s.byEx?.squat || 0));
    s.byEx = { ...(s.byEx || {}), pushup: total - squat, squat };
    if (s.best > total) s.best = total;
    return s;
  }

  /**
   * Plausibility checks. cfg = {
   *   hpAt(stage) -> monster HP at a stage, cycle -> stages per cycle,
   *   heroPrices -> { id: price }, achIds -> [ids], now -> ms (optional)
   * }. Returns a list of plain-language problems (empty = looks honest).
   */
  function check(s, cfg) {
    const problems = [];
    const add = msg => { if (!problems.includes(msg)) problems.push(msg); };
    const now = cfg.now ?? Date.now();
    const nonNeg = ['xp', 'gold', 'total', 'best', 'kills', 'stage', 'dmg'];
    for (const k of nonNeg) if (!(Number.isFinite(s[k]) && s[k] >= 0)) add(`${k} is not a valid number`);
    if (problems.length) return problems;

    // days: real dates, not in the future, humanly possible counts
    const tomorrow = new Date(now + 864e5);
    const maxKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    let questDays = 0;
    for (const [k, d] of Object.entries(s.days || {})) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || k > maxKey) add('reps logged on dates in the future');
      if (!d || !Number.isFinite(d.n) || d.n < 0 || d.n > 5000) add('more reps in a day than is humanly possible');
      if (d?.q) questDays++;
    }

    // sessions: no faster than the counter allows (one rep per 0.4 s, with slack)
    for (const x of s.sessions || []) {
      if (!x || !Number.isFinite(x.n) || x.n < 0 || x.n > 5000) { add('a workout with an impossible rep count'); continue; }
      if (x.manual && x.n > 500) add('a hand-logged set larger than the app allows');
      if (!x.manual && x.dur > 0 && x.n > 3 && x.n / (x.dur / 1000) > 3.5) add('reps faster than anyone can do them');
    }

    // progress: every monster defeated needed reps (at most 2 damage per rep)
    if (s.kills !== s.stage) add('monsters defeated does not match progress');
    let repsNeeded = 0, killXp = 0, killGold = 0;
    const cycle = Math.floor(s.stage / cfg.cycle);
    const itemMax = Math.round((7 + cycle * 4) * 6);            // strongest item obtainable this deep
    const mult = 1 + (2 * itemMax) / 100;                        // best possible XP/gold bonus (two slots)
    for (let st = 0; st < s.stage; st++) {
      const hp = cfg.hpAt(st);
      repsNeeded += hp / 2;
      killXp += hp * 3 * mult;
      killGold += hp * 1.5 * mult + itemMax * 36;                // reward + salvaging its drop
    }
    if (repsNeeded > s.total * 1.05 + 10) add('more monsters defeated than the recorded reps allow');
    if (s.dmg > cfg.hpAt(s.stage)) add('damage on the current monster is impossible');

    // XP and gold: no more than the best case for the reps and kills recorded
    const xpMax = s.total * 10 * mult + killXp + 100 * questDays;
    if (s.xp > xpMax * 1.1 + 200) add('more XP than the recorded reps could earn');
    const achCount = Object.keys(s.ach || {}).filter(id => cfg.achIds.includes(id)).length;
    const spent = (s.owned || []).reduce((sum, id) => sum + (cfg.heroPrices[id] || 0), 0);
    const goldMax = killGold + 25 * questDays + 50 * achCount - spent;
    if (s.gold > goldMax * 1.1 + 200) add('more gold than could have been earned');
    if (Object.keys(s.ach || {}).some(id => !cfg.achIds.includes(id))) add('unknown achievements');

    // loot: no item stronger than anything that can drop this deep
    const rars = ['common', 'rare', 'epic', 'legendary'];
    for (const it of s.inv || []) {
      if (!it || !rars.includes(it.rar) || !['xp', 'gold'].includes(it.stat) || !(it.val > 0) || it.val > itemMax) { add('items stronger than any that can drop'); break; }
    }
    if ((s.inv || []).length > 60) add('more items than the bag holds');
    if (s.best > s.total) add('best set larger than all reps ever done');
    if (s.freezes > 2) add('more streak freezes than can be held');
    return problems;
  }

  root.Integrity = { hash, sign, verify, looksLikeSave, repair, check };
})(typeof window !== 'undefined' ? window : globalThis);
