// Save integrity: honest saves pass, edited ones are caught.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../integrity.js';

const { sign, verify, repair, check, looksLikeSave } = globalThis.Integrity;

// Mirrors the game's rules (app.js): HP per stage, 50 stages per cycle, hero prices.
const cfg = {
  hpAt: st => Math.round((6 + st * 0.8) * (st % 10 === 9 ? 2 : 1)),
  cycle: 50,
  heroPrices: { guard: 0, ninja: 250, elf: 600, mage: 1200, hero: 2000, royal: 3500 },
  achIds: ['first', 'c100', 'c1k', 'boss1'],
  now: new Date(2026, 9, 19, 12).getTime(),
};

/** Play an honest game the way app.js does: reps damage monsters, kills pay out. */
function honestSave({ days = 30, perDay = 60, perfectShare = 0.3 } = {}) {
  const s = { v: 3, xp: 0, gold: 0, total: 0, best: 0, kills: 0, stage: 0, dmg: 0, byEx: { pushup: 0, squat: 0 },
    days: {}, sessions: [], ach: { first: 1, c100: 1 }, inv: [], owned: ['guard'], freezes: 0 };
  for (let d = 0; d < days; d++) {
    const key = `2026-09-${String(d + 1).padStart(2, '0')}`;
    s.days[key] = { n: 0, q: false };
    for (let r = 0; r < perDay; r++) {
      s.total++; s.days[key].n++; s.byEx.pushup++; s.xp += 10;
      s.dmg += r % Math.round(1 / perfectShare) === 0 ? 2 : 1;
      const hp = cfg.hpAt(s.stage);
      if (s.dmg >= hp) {
        s.xp += hp * 3; s.gold += Math.round(hp * 1.5); s.kills++; s.stage++; s.dmg = 0;
        if (s.stage % 10 === 0) s.inv.push({ id: 'i' + s.stage, slot: 'weapon', rar: 'rare', stat: 'xp', val: 6 });
      }
      if (!s.days[key].q && s.days[key].n >= 50) { s.days[key].q = true; s.xp += 100; s.gold += 25; }
    }
    s.sessions.unshift({ t: 0, n: perDay, dur: perDay * 1500 });
    s.best = Math.max(s.best, perDay);
  }
  s.gold += 100; // two achievements
  return s;
}

test('an honest save passes every check', () => {
  const s = honestSave();
  assert.deepEqual(check(repair(s), cfg), []);
});

test('an honest save that bought a hero still passes', () => {
  const s = honestSave({ days: 40, perDay: 80 });
  s.gold -= 250; s.owned.push('ninja');
  assert.ok(s.gold >= 0);
  assert.deepEqual(check(repair(s), cfg), []);
});

test('signature: matches untouched, breaks on any edit', () => {
  const s = honestSave();
  s.sig = sign(s);
  assert.equal(verify(JSON.parse(JSON.stringify(s))), 'ok');
  const edited = { ...s, gold: s.gold + 1 };
  assert.equal(verify(edited), 'mismatch');
  assert.equal(verify({ ...s, sig: undefined }), 'unsigned');
  assert.equal(verify({ ...s, v: 2 }), 'legacy'); // saves from before signing aren't blamed
});

test('editing total reps does nothing: it is rebuilt from the daily log', () => {
  const s = honestSave();
  const real = s.total;
  s.total = 999999; s.byEx.pushup = 999999;
  repair(s);
  assert.equal(s.total, real);
  assert.equal(s.byEx.pushup + s.byEx.squat, real);
});

test('maxed-out gold and XP are caught', () => {
  const s = repair(honestSave());
  assert.ok(check({ ...s, gold: 999999 }, cfg).includes('more gold than could have been earned'));
  assert.ok(check({ ...s, xp: 9999999 }, cfg).includes('more XP than the recorded reps could earn'));
});

test('skipping ahead in the realm is caught', () => {
  const s = repair(honestSave());
  assert.ok(check({ ...s, stage: 300, kills: 300 }, cfg).includes('more monsters defeated than the recorded reps allow'));
  assert.ok(check({ ...s, stage: s.stage + 5 }, cfg).includes('monsters defeated does not match progress'));
});

test('impossible days, pace, items and freezes are caught', () => {
  const s = repair(honestSave());
  const futureDay = check(repair({ ...s, days: { ...s.days, '2030-01-01': { n: 10, q: false } } }), cfg);
  assert.ok(futureDay.includes('reps logged on dates in the future'));
  assert.ok(check({ ...s, days: { ...s.days, '2026-09-02': { n: 9000, q: true } } }, cfg).includes('more reps in a day than is humanly possible'));
  assert.ok(check({ ...s, sessions: [{ t: 0, n: 300, dur: 30000 }] }, cfg).includes('reps faster than anyone can do them'));
  assert.ok(check({ ...s, inv: [{ rar: 'legendary', stat: 'xp', val: 5000 }] }, cfg).includes('items stronger than any that can drop'));
  assert.ok(check({ ...s, freezes: 9 }, cfg).includes('more streak freezes than can be held'));
});

test('import refuses files that are not saves at all', () => {
  assert.equal(looksLikeSave({ hello: 'world' }), false);
  assert.equal(looksLikeSave([]), false);
  assert.equal(looksLikeSave({ total: '5', xp: 0, gold: 0, days: {} }), false);
  assert.equal(looksLikeSave(honestSave()), true);
});
