'use strict';

/* ================= helpers ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Number(n).toLocaleString();
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const roman = n => ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || String(n);
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ================= icons ================= */
const ICONS = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  map: 'M9 4 3 6.5V20l6-2.5 6 2.5 6-2.5V4l-6 2.5zM9 4v13.5M15 6.5V20',
  camera: 'M4 8.5h3.2L9 6h6l1.8 2.5H20a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1zM12 10a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
  shield: 'M12 3l8 3v6c0 4.8-3.4 8-8 9-4.6-1-8-4.2-8-9V6z',
  book: 'M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1',
  back: 'M15 5l-7 7 7 7',
  flip: 'M4 8h13l-3-3M20 16H7l3 3',
  undo: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  hand: 'M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V12M14 11.5V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7 6 6 0 0 1-5-3l-2.5-4.5a1.5 1.5 0 0 1 2.6-1.5L8 15',
};
const ico = n => `<svg class="i" viewBox="0 0 24 24"><path d="${ICONS[n]}"/></svg>`;

/* ================= 3D art (Fluent Emoji 3D, MIT, see art/LICENSE-fluent-emoji.txt) ================= */
const art = (key, cls = '') => `<img class="art ${cls}" src="art/${key}.webp" alt="" draggable="false">`;

/* ================= game data ================= */
const HEROES = [
  { id: 'guard', name: 'Royal Guard', price: 0 },
  { id: 'ninja', name: 'Shadow Ninja', price: 250 },
  { id: 'elf', name: 'Wood Elf', price: 600 },
  { id: 'mage', name: 'Archmage', price: 1200 },
  { id: 'hero', name: 'Champion', price: 2000 },
  { id: 'royal', name: 'Sovereign', price: 3500 },
];
const TONES = ['default', 't1', 't2', 't3', 't4', 't5'];
const TONE_SWATCH = { default: '#ffc83d', t1: '#f7dece', t2: '#f3d2a2', t3: '#d5ab88', t4: '#af7e57', t5: '#7c533e' };
const heroArt = (id = S.skin, cls = '') => art(`${HEROES.some(h => h.id === id) ? id : 'guard'}-${TONES.includes(S.tone) ? S.tone : 'default'}`, cls);

// [art key, name, flavor line]
const ZONES = [
  { name: 'Mossy Glade', sky: ['#1f4a5a', '#2f7a5a'], glow: 'rgba(110,231,160,.45)',
    mobs: [['frog', 'Bog Hopper', 'Croaks at you. Rudely.'], ['bee', 'Thorn Wasp', 'Small. Angry. Unionized.'], ['snake', 'Moss Viper', 'Hides in the ferns, judging your form.']],
    boss: ['bear', 'Grizzled Warden', 'Has guarded the glade since before the trees.'] },
  { name: 'Goblin Warrens', sky: ['#2a1f3d', '#5b3f5e'], glow: 'rgba(245,200,75,.4)',
    mobs: [['goblin', 'Warren Grunt', 'Smells like old cabbage.'], ['rat', 'Tunnel Rat', 'Eats goblin leftovers. Eats goblins too.'], ['bat', 'Blood Flitter', 'Squeaks in four languages.']],
    boss: ['ogre', 'Chieftain Grubb', 'Crowned himself. Twice.'] },
  { name: 'Frost Hollow', sky: ['#14284a', '#3a6a9a'], glow: 'rgba(124,180,255,.5)',
    mobs: [['wolf', 'Rime Wolf', 'Hunts in silence. Howls about it later.'], ['penguin', 'Ice Brawler', 'Do not let the tuxedo fool you.'], ['snowman', 'Frost Sentry', 'Built by children. Animated by spite.']],
    boss: ['mammoth', 'Glacier Mammoth', 'Has not moved in a century. Until now.'] },
  { name: 'Bone Crypt', sky: ['#0f1226', '#2b2d52'], glow: 'rgba(139,124,246,.5)',
    mobs: [['skull', 'Rattler', 'All bones, no backbone.'], ['ghost', 'Wailing Shade', 'Haunts people who skip leg day.'], ['zombie', 'Grave Walker', 'Slow, but never skips a day.']],
    boss: ['vampire', 'The Hollow Count', 'Ruled before the crypt had walls.'] },
  { name: 'Ember Peaks', sky: ['#3a0f14', '#a4402a'], glow: 'rgba(239,131,84,.55)',
    mobs: [['scorpion', 'Cinder Scorpion', 'Its tail glows when it is annoyed.'], ['lizard', 'Magma Salamander', 'Basks in lava. Do not hug.'], ['spider', 'Ash Weaver', 'Spins webs out of smoke.']],
    boss: ['trex', 'Molten Tyrant', 'Short arms. Long grudges.'] },
  { name: "Wyrm's Keep", sky: ['#120a1f', '#4b1f4f'], glow: 'rgba(240,86,107,.55)',
    mobs: [['troll', 'Keep Troll', 'Collects a toll of one rep per step.'], ['robot', 'Iron Sentinel', 'Guards the stair. Forever.'], ['octopus', 'Moat Horror', 'Eight arms. Zero pushups.']],
    boss: ['dragon', 'Elder Wyrm', 'The last fire in the world.'] },
];
const PER_ZONE = 10;
const CYCLE = ZONES.length * PER_ZONE;

function monsterFor(stage) {
  const cycle = Math.floor(stage / CYCLE), z = Math.floor(stage / PER_ZONE) % ZONES.length, i = stage % PER_ZONE;
  const boss = i === PER_ZONE - 1, Z = ZONES[z], mi = i % Z.mobs.length;
  const [sp, name, line] = boss ? Z.boss : Z.mobs[mi];
  const hp = Math.round((6 + stage * 0.8) * (boss ? 2 : 1));
  return { stage, cycle, z, i, boss, sp, line, hp, zone: Z, key: `${z}:${boss ? 'b' : mi}`, base: name, name: name + (cycle ? ' ' + roman(cycle + 1) : '') };
}

/* loot */
const SLOTS = {
  weapon: { em: 'dagger', label: 'Weapon', stat: 'xp', names: ['Blade', 'Axe', 'Warhammer', 'Spear'] },
  helm: { em: 'helmet', label: 'Helm', stat: 'gold', names: ['Helm', 'Hood', 'Crown', 'Circlet'] },
  armor: { em: 'shield', label: 'Armor', stat: 'xp', names: ['Mail', 'Plate', 'Cuirass', 'Tunic'] },
  charm: { em: 'ring', label: 'Charm', stat: 'gold', names: ['Ring', 'Amulet', 'Totem', 'Rune'] },
};
const PREFIX = ['Mossy', 'Oaken', 'Iron', 'Frostbound', 'Bonecarved', 'Emberforged', 'Stormforged', 'Wyrmscale', 'Starfallen'];
const RAR = [
  { id: 'common', w: 62, m: 1, c: '#a8a5b8' },
  { id: 'rare', w: 26, m: 2, c: '#7cb4ff' },
  { id: 'epic', w: 10, m: 3.5, c: '#c08cff' },
  { id: 'legendary', w: 2, m: 6, c: '#f5c84b' },
];
const rarity = id => RAR.find(r => r.id === id) || RAR[0];

function rollLoot(m) {
  if (Math.random() > (m.boss ? 1 : 0.22)) return null;
  const tiers = m.boss ? RAR.slice(1) : RAR;
  let r = Math.random() * tiers.reduce((a, t) => a + t.w, 0), rar = tiers[0];
  for (const t of tiers) { if ((r -= t.w) < 0) { rar = t; break; } }
  const slot = pick(Object.keys(SLOTS));
  const pre = PREFIX[Math.min(PREFIX.length - 1, m.z + m.cycle * 2 + (Math.random() < .3 ? 1 : 0))];
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    slot, rar: rar.id, name: `${pre} ${pick(SLOTS[slot].names)}`,
    stat: SLOTS[slot].stat, val: Math.max(1, Math.round((2 + m.z + m.cycle * 4) * rar.m)),
  };
}
function bonus() {
  const b = { xp: 0, gold: 0 };
  for (const id of Object.values(S.eq)) { const it = S.inv.find(i => i.id === id); if (it) b[it.stat] += it.val; }
  return b;
}
const salvageValue = it => Math.round(it.val * 6 * rarity(it.rar).m);

const TITLES = [[1, 'Peasant'], [3, 'Squire'], [6, 'Ranger'], [10, 'Knight'], [15, 'Champion'], [20, 'Warlord'], [30, 'Hero of the Realm'], [40, 'Legend'], [50, 'Demigod']];
const titleFor = lv => TITLES.filter(t => lv >= t[0]).pop()[1];
function levelInfo(xp) {
  let level = 1, need = 100;
  while (xp >= need) { xp -= need; level++; need = 100 + 50 * (level - 1); }
  return { level, into: xp, need };
}

const MOTTOS = [
  'Every rep is a sword swing. Make them count.',
  'Small sets, every day. That is how legends are forged.',
  'The monster does not care about your excuses.',
  'Consistency is the strongest enchantment.',
  'Your future self is watching this set.',
  'Ten good reps beat fifty sloppy ones.',
  'Rest is part of training. Quitting is not.',
];

const ACH = [
  ['first', 'blood', 'First Blood', 'Complete your first rep', s => s.total >= 1],
  ['c100', 'hundred', 'Centurion', '100 lifetime reps', s => s.total >= 100],
  ['c1k', 'fist', 'Thousand Fists', '1,000 lifetime reps', s => s.total >= 1000],
  ['c5k', 'biceps', 'Iron Body', '5,000 lifetime reps', s => s.total >= 5000],
  ['c10k', 'mountain', 'Mountain Mover', '10,000 lifetime reps', s => s.total >= 10000],
  ['set25', 'bolt', 'Flurry', '25 reps in one battle', s => s.best >= 25],
  ['set50', 'fire', 'Berserker', '50 reps in one battle', s => s.best >= 50],
  ['set100', 'volcano', 'Unstoppable', '100 reps in one battle', s => s.best >= 100],
  ['squat', 'leg', 'Leg Day', '100 squats', s => (s.byEx.squat || 0) >= 100],
  ['boss1', 'crown', 'Kingslayer', 'Defeat your first boss', s => s.stage >= PER_ZONE],
  ['crypt', 'skull', 'Gravewalker', 'Conquer the Bone Crypt', s => s.stage >= PER_ZONE * 4],
  ['wyrm', 'dragon', 'Wyrmbane', 'Slay the Elder Wyrm', s => s.stage >= CYCLE],
  ['lv10', 'swords', 'Knighted', 'Reach level 10', s => levelInfo(s.xp).level >= 10],
  ['lv25', 'trophy', 'Legendary', 'Reach level 25', s => levelInfo(s.xp).level >= 25],
  ['st3', 'candle', 'Kindled', '3-day streak', s => s.bestStreak >= 3],
  ['st7', 'link', 'Week of Fire', '7-day streak', s => s.bestStreak >= 7],
  ['st30', 'scroll', 'Oathkeeper', '30-day streak', s => s.bestStreak >= 30],
  ['epic', 'gem', 'Shiny', 'Find an epic item', s => s.inv.some(i => i.rar === 'epic' || i.rar === 'legendary') || s.foundEpic],
].map(([id, icon, name, desc, test]) => ({ id, icon, name, desc, test }));
const ACH_GOLD = 50;
const EX = { pushup: { one: 'pushup', many: 'pushups', label: 'Push-ups' }, squat: { one: 'squat', many: 'squats', label: 'Squats' } };

/* ================= state ================= */
const KEY = 'pushupquest.v1';
const defaults = () => ({
  v: 2, name: '', created: Date.now(),
  xp: 0, gold: 0, total: 0, best: 0, kills: 0, stage: 0, dmg: 0,
  byEx: { pushup: 0, squat: 0 }, mode: 'pushup',
  days: {}, sessions: [], ach: {}, bestStreak: 0, felled: {},
  inv: [], eq: { weapon: null, helm: null, armor: null, charm: null }, foundEpic: false,
  skin: 'guard', tone: 'default', owned: ['guard'],
  settings: { goal: 50, sound: true, haptics: true, counting: 'camera', sens: 1, facing: 'user', debounce: 350, debug: false },
  live: null, installDismissed: false, tipsSeen: false,
});
let S;
function load() {
  try { S = Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY)) || {}); }
  catch { S = defaults(); }
  const d = defaults();
  S.settings = Object.assign(d.settings, S.settings);
  S.eq = Object.assign(d.eq, S.eq);
  S.byEx = Object.assign(d.byEx, S.byEx);
  // v1 saves had no exercise split: count old reps as pushups
  if (S.v < 2) { S.byEx.pushup = S.total; S.v = 2; }
  // v2 pixel outfits -> v3 3D heroes at the same price points
  const OLD = { crimson: 'guard', azure: 'ninja', verdant: 'elf', shadow: 'mage', ember: 'hero', gilded: 'royal' };
  S.skin = OLD[S.skin] || S.skin;
  S.owned = [...new Set(['guard', ...S.owned.map(o => OLD[o] || o)])];
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }
const todayRec = () => (S.days[dayKey()] ||= { n: 0, q: false });

function streak() {
  const d = new Date();
  if (!S.days[dayKey(d)]?.q) d.setDate(d.getDate() - 1);
  let s = 0;
  while (S.days[dayKey(d)]?.q) { s++; d.setDate(d.getDate() - 1); }
  return s;
}

function checkAch(ev) {
  for (const a of ACH) if (!S.ach[a.id] && a.test(S)) { S.ach[a.id] = Date.now(); S.gold += ACH_GOLD; ev.push({ type: 'ach', a }); }
}

/* Core: apply n reps of the current exercise. Returns events. */
function applyReps(n, sess) {
  const ev = [], lv0 = levelInfo(S.xp).level, day = todayRec(), b = bonus();
  const xpPer = Math.round(10 * (1 + b.xp / 100));
  for (let r = 0; r < n; r++) {
    S.total++; day.n++; S.byEx[S.mode] = (S.byEx[S.mode] || 0) + 1; S.xp += xpPer; S.dmg++;
    if (sess) { sess.n++; sess.xp += xpPer; }
    const m = monsterFor(S.stage);
    if (S.dmg >= m.hp) {
      const xp = Math.round(m.hp * 3 * (1 + b.xp / 100)), gold = Math.round(m.hp * 1.5 * (1 + b.gold / 100));
      S.xp += xp; S.gold += gold; S.kills++; S.stage++; S.dmg = 0;
      S.felled[m.key] = (S.felled[m.key] || 0) + 1;
      const loot = rollLoot(m);
      if (loot) {
        S.inv.unshift(loot);
        if (loot.rar === 'epic' || loot.rar === 'legendary') S.foundEpic = true;
        trimInventory();
      }
      if (sess) { sess.xp += xp; sess.gold += gold; sess.kills++; if (loot) sess.loot.push(loot); }
      ev.push({ type: 'kill', m, xp, gold, loot });
    }
    if (!day.q && day.n >= S.settings.goal) {
      day.q = true; S.xp += 100; S.gold += 25;
      if (sess) { sess.xp += 100; sess.gold += 25; }
      S.bestStreak = Math.max(S.bestStreak, streak());
      ev.push({ type: 'quest' });
    }
  }
  const setSize = sess ? sess.n : n;
  if (setSize > S.best) S.best = setSize;
  const lv1 = levelInfo(S.xp).level;
  if (lv1 > lv0) ev.push({ type: 'level', level: lv1 });
  checkAch(ev);
  if (sess) S.live = sess;
  save();
  return ev;
}
function trimInventory() {
  const equipped = new Set(Object.values(S.eq));
  while (S.inv.length > 40) {
    let worst = -1;
    S.inv.forEach((it, i) => { if (!equipped.has(it.id) && (worst < 0 || it.val < S.inv[worst].val)) worst = i; });
    if (worst < 0) break;
    S.gold += salvageValue(S.inv[worst]);
    S.inv.splice(worst, 1);
  }
}

/* ================= audio + haptics ================= */
let AC;
function ac() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
function tone(f, d = .08, type = 'square', vol = .05, when = 0, slide) {
  if (!S.settings.sound) return;
  const a = ac(); if (!a) return;
  const t = a.currentTime + when, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + .02);
}
const SFX = {
  hit() { tone(320, .1, 'square', .05, 0, 90); tone(90, .12, 'triangle', .16, 0, 40); },
  crit() { tone(640, .14, 'square', .05, 0, 120); tone(70, .16, 'triangle', .18, 0, 30); },
  kill() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .14, 'triangle', .08, i * .08)); },
  level() { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .18, 'triangle', .08, i * .09)); },
  loot() { [880, 1175, 1568].forEach((f, i) => tone(f, .12, 'sine', .08, i * .06)); },
  coin() { tone(988, .06, 'square', .04); tone(1319, .14, 'square', .04, .06); },
  click() { tone(660, .03, 'sine', .05); },
};
const buzz = p => { if (S.settings.haptics && navigator.vibrate) navigator.vibrate(p); };

/* ================= UI primitives ================= */
function toast(icon, title, text = '') {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${art(icon, 'ti')}<div><b>${esc(title)}</b><span>${esc(text)}</span></div>`;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 3100);
}
function banner(ey, title, pills = '') {
  const el = document.createElement('div');
  el.className = 'banner';
  el.innerHTML = `<div class="ey">${ey}</div><div class="t">${esc(title)}</div>${pills ? `<div class="s">${pills}</div>` : ''}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1900);
}
function confetti(n = 26) {
  const colors = ['#f5c84b', '#ef8354', '#8b7cf6', '#6ee7a0', '#e879f9'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i');
    c.className = 'confetti';
    c.style.cssText = `left:50%;top:38%;background:${pick(colors)};--x:${(Math.random() - .5) * 340}px;--y:${(Math.random() - .2) * 360}px`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 1400);
  }
}
function sheet(html, mount) {
  const M = $('#sheet');
  M.innerHTML = `<div class="sheet"><div class="grab"></div>${html}</div>`;
  M.hidden = false;
  mount?.(M);
}
function closeSheet() { $('#sheet').hidden = true; $('#sheet').innerHTML = ''; }
$('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet' && S.name) closeSheet(); });

function handleEvents(ev, inBattle) {
  for (const e of ev) {
    if (e.type === 'quest') { toast('target', 'Daily goal complete!', '+100 XP · +25 gold'); SFX.coin(); }
    if (e.type === 'ach') toast(e.a.icon, 'Deed unlocked: ' + e.a.name, `+${ACH_GOLD} gold`);
    if (e.type === 'kill' && !inBattle) toast(e.m.sp, `${e.m.name} felled!`, `+${e.xp} XP · +${e.gold} gold`);
    if (e.type === 'kill' && e.loot) setTimeout(() => { toast(SLOTS[e.loot.slot].em, `${e.loot.rar.toUpperCase()} DROP · ${e.loot.name}`, `+${e.loot.val}% ${e.loot.stat === 'xp' ? 'XP' : 'gold'}`); SFX.loot(); }, inBattle ? 900 : 300);
  }
  const lv = ev.find(e => e.type === 'level');
  if (lv) setTimeout(() => { banner('LEVEL UP', `Level ${lv.level}`, `<span class="pill purple"><i></i>${titleFor(lv.level)}</span>`); confetti(40); SFX.level(); buzz([30, 40, 30, 40, 80]); }, inBattle && ev.some(e => e.type === 'kill') ? 1700 : 0);
}

/* ================= install guide ================= */
// "Add to Home Screen" lives in different places per browser, and in-app browsers
// (X, Instagram, WhatsApp...) can't install at all. Work out where we are and say so.
function installInfo() {
  const ua = navigator.userAgent;
  const standalone = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  const ios = /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1); // iPadOS reports as a Mac
  const android = /android/i.test(ua);
  const inApp = /FBAN|FBAV|Instagram|Twitter|LinkedInApp|Line\/|Snapchat|TikTok|musical_ly|WhatsApp|GSA\//i.test(ua);
  const browser = /CriOS/.test(ua) ? 'Chrome' : /FxiOS/.test(ua) ? 'Firefox' : /EdgiOS/.test(ua) ? 'Edge' : 'Safari';
  return { standalone, ios, android, mobile: ios || android, inApp, browser };
}
let installPrompt = null; // Android/desktop Chrome hands us a real install prompt
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; if (!sess) render(); });
window.addEventListener('appinstalled', () => { installPrompt = null; toast('check', 'Installed', 'Find Pushup Quest on your home screen'); });

function installSteps(i) {
  if (i.standalone) return ['You are already using the installed app.'];
  if (i.inApp) return [
    'This page is open inside another app, and its browser can\'t install apps.',
    `Tap <b>•••</b> or the compass icon and choose <b>Open in ${i.ios ? 'Safari' : 'browser'}</b>. Or copy the link below and paste it there.`,
    'Then come back to this guide in that browser.',
  ];
  if (i.ios && i.browser === 'Safari') return [
    'Tap <b>•••</b> at the bottom right of Safari. On older iPhones, tap the <b>Share</b> button (a square with an arrow).',
    'Tap <b>Share</b>, then scroll down or tap <b>View More</b>.',
    'Tap <b>Add to Home Screen</b>, then <b>Add</b>.',
  ];
  if (i.ios) return [
    `Tap the <b>Share</b> button in ${i.browser}'s address bar (top right), or open the menu and tap <b>Share</b>.`,
    'Scroll down the list and tap <b>Add to Home Screen</b>.',
    'Tap <b>Add</b>.',
  ];
  if (installPrompt && !i.ios) return ['Tap <b>Install now</b> below, then confirm.'];
  if (i.android) return ['Open the browser menu <b>⋮</b> (top right).', 'Tap <b>Install app</b> or <b>Add to Home screen</b>.', 'Confirm.'];
  return ['On a computer, click the install icon at the right of the address bar (Chrome or Edge).', 'On your phone, open <b>pushup.ikechukwupeter.com</b> and follow the steps there.'];
}

function openInstall() {
  const i = installInfo();
  sheet(`
    <h2>Install Pushup Quest</h2>
    <p class="dim" style="font-size:14px;margin:6px 0 14px">Installed, it opens full screen like an app and works offline.${i.standalone ? '' : ' It\'s free and takes a few seconds.'}</p>
    <ol class="tips install-steps">${installSteps(i).map(t => `<li>${t}</li>`).join('')}</ol>
    ${i.ios && !i.inApp && !i.standalone ? '<p class="dim" style="font-size:12.5px;margin:12px 0 0">No <b>Add to Home Screen</b> in the list? You are probably in another app\'s browser, such as X or Instagram. Open the page in Safari first.</p>' : ''}
    <div class="stack">
      ${installPrompt && !i.standalone && !i.ios && !i.inApp ? '<button class="btn" data-act="installNow">Install now</button>' : ''}
      ${i.inApp ? '<button class="btn" data-act="copyLink">Copy link</button>' : ''}
      <button class="btn ghost" data-act="close">Done</button>
    </div>`);
}

/* ================= views ================= */
let tab = 'home';
const VIEWS = {
  home() {
    const L = levelInfo(S.xp), m = monsterFor(S.stage), d = todayRec(), goal = S.settings.goal, st = streak();
    const left = m.hp - S.dmg, b = bonus();
    const xpGain = Math.round(m.hp * 3 * (1 + b.xp / 100)), goldGain = Math.round(m.hp * 1.5 * (1 + b.gold / 100));
    const inst = installInfo();
    const motto = MOTTOS[Math.floor(Date.now() / 864e5) % MOTTOS.length];
    const ex = EX[S.mode];
    const doneToday = d.q;
    const week = [];
    for (let i = 6; i >= 0; i--) { const dd = daysAgo(i); week.push({ l: 'SMTWTFS'[dd.getDay()], lit: !!S.days[dayKey(dd)]?.q, today: i === 0 }); }
    return `
      ${!inst.standalone && (inst.mobile || installPrompt) && !S.installDismissed ? `
      <div class="card install"><p>${inst.inApp ? 'Open this page in Safari or Chrome to install it.' : 'Install it to play full screen and offline.'}</p><button class="btn sm" data-act="install">How to install</button><button class="icon-btn" data-act="dismissInstall" aria-label="Dismiss">✕</button></div>` : ''}
      <header class="home-head">
        <div><div class="h-name">${esc(S.name || 'Hero')}</div><div class="h-sub">Level ${L.level} · ${titleFor(L.level)}</div></div>
        <div class="h-right"><span class="coin num">${art('coin')}${fmt(S.gold)}</span><button class="icon-btn" data-act="settings" aria-label="Settings">${art('gear')}</button></div>
      </header>
      <div>
        <div class="bar thick"><i style="width:${(L.into / L.need) * 100}%"></i></div>
        <div class="xp-meta"><span class="c-orange">${fmt(d.n)} today</span><span class="dim num">${fmt(L.into)} / ${fmt(L.need)} XP</span></div>
      </div>
      <div class="motto">${art('sparkles', 'fl')}<span class="quote">“${motto}”</span></div>

      <div class="card streak-card">
        <div class="streak-ico">${art('fire')}</div>
        <div style="flex:1">
          <h4>${st ? `${st} day${st > 1 ? 's' : ''}. ${doneToday ? 'Kept alive.' : "Don't lose it."}` : 'Light your first streak.'}</h4>
          <p>${doneToday ? 'Daily goal crushed. Anything extra is pure glory.' : `Hit ${goal} reps today to ${st ? 'keep the flame burning' : 'start a streak'}.`}</p>
        </div>
        <div class="ring ${doneToday ? 'done' : ''}" style="--p:${Math.min(100, (d.n / goal) * 100)}"><span>${doneToday ? '✓' : `${d.n}<br><small class="dim">/${goal}</small>`}</span></div>
      </div>

      <div class="card battle-card glow-o" style="--glow:${m.zone.glow}">
        <div class="bc-top">
          <span class="eyebrow c-orange">Next battle</span>
          <div class="seg"><button data-act="mode" data-m="pushup" class="${S.mode === 'pushup' ? 'on' : ''}">Push-ups</button><button data-act="mode" data-m="squat" class="${S.mode === 'squat' ? 'on' : ''}">Squats</button></div>
          ${m.boss ? `<span class="chip boss">${art('crown')}Boss</span>` : ''}
        </div>
        <div class="bc-main">
          <div style="flex:1;min-width:0">
            <h3>${esc(m.name)}</h3>
            <div class="where">${m.zone.name} · Stage ${m.i + 1} of ${PER_ZONE}</div>
            <div class="quote">“${m.line}”</div>
          </div>
          <div class="bc-art">${art(m.sp)}</div>
        </div>
        <div class="bc-meta"><span>${art('hourglass')}${left} ${left === 1 ? ex.one : ex.many}</span><span>${art('star')}+${xpGain} XP</span><span>${art('coin')}+${goldGain}</span></div>
        <div class="bar red bc-hp"><i style="width:${(left / m.hp) * 100}%"></i></div>
        <div style="height:14px"></div>
        <button class="btn" data-act="battle">${ico('camera')} ${m.boss ? 'Challenge Boss' : 'Start Battle'}</button>
      </div>

      <div class="card week">
        <div class="wk-streak"><b>${st}</b><span>STREAK</span></div>
        ${week.map(w => `<div class="d ${w.lit ? 'lit' : ''} ${w.today ? 'today' : ''}">${art('fire', 'f')}${w.l}</div>`).join('')}
      </div>`;
  },

  realm() {
    const cycle = Math.floor(S.stage / CYCLE), inCycle = S.stage % CYCLE;
    const victories = Object.values(S.felled).reduce((a, b) => a + b, 0);
    const known = ZONES.reduce((a, Z) => a + Z.mobs.length + 1, 0);
    return `
      <div class="eyebrow c-purple">The realm</div>
      <h1 class="title">An endless world<br><em>to conquer.</em></h1>
      <div class="row" style="flex-wrap:wrap;gap:8px;margin-bottom:18px">
        <span class="pill purple"><i></i>${ZONES.length} realms</span>
        <span class="pill gold"><i></i>${fmt(victories)} victories</span>
        ${cycle ? `<span class="pill orange"><i></i>Cycle ${roman(cycle + 1)}</span>` : ''}
      </div>
      ${ZONES.map((Z, zi) => {
        const start = zi * PER_ZONE, locked = inCycle < start, cleared = inCycle >= start + PER_ZONE;
        let path = '';
        for (let i = 0; i < PER_ZONE; i++) {
          const s = start + i, boss = i === PER_ZONE - 1;
          const cls = s < inCycle ? 'done' : s === inCycle ? 'cur' : '';
          if (i) path += `<div class="l ${s <= inCycle ? 'done' : ''}"></div>`;
          path += `<div class="n ${cls} ${boss ? 'boss' : ''}">${boss ? art('crown') : s < inCycle ? '✓' : i + 1}</div>`;
        }
        return `
          <div class="card zone ${locked ? 'locked' : ''}">
            <div class="zone-banner" style="background:linear-gradient(160deg,${Z.sky[0]},${Z.sky[1]})">
              ${art(Z.boss[0])}
              <div><h3>${Z.name}</h3><div class="dim">${locked ? 'Locked' : cleared ? '✓ Conquered' : `Boss · ${Z.boss[1]}`}</div></div>
            </div>
            <div class="path">${path}</div>
          </div>`;
      }).join('')}

      <div class="sec">
        <div class="eyebrow c-pink">The bestiary</div>
        <h1 class="title" style="margin-bottom:4px">Foes of the realm</h1>
        <div class="quote dim">Every foe felled is a rep earned. ${Object.keys(S.felled).length} of ${known} discovered.</div>
      </div>
      ${ZONES.map((Z, zi) => `
        <div class="chapter">Chapter ${roman(zi + 1)} · ${Z.name}</div>
        <div class="bestiary">${[...Z.mobs.map((mb, i) => [mb, `${zi}:${i}`, false]), [Z.boss, `${zi}:b`, true]].map(([mb, key, boss]) => {
          const n = S.felled[key] || 0;
          return `<div class="foe ${n ? '' : 'unk'} ${boss ? 'boss' : ''}">${art(mb[0])}<div class="nm">${n ? mb[1] : '???'}</div><div class="ct">${n ? `felled ×${n}` : boss ? 'boss' : 'not yet felled'}</div></div>`;
        }).join('')}</div>`).join('')}`;
  },

  armory() {
    const b = bonus(), eqIds = new Set(Object.values(S.eq));
    return `
      <div class="between"><div class="eyebrow c-orange">Forge your gear</div><span class="coin num">${art('coin')}${fmt(S.gold)}</span></div>
      <h1 class="title">Loot up.<br><em class="o">Earn more.</em></h1>
      <div class="card">
        <div class="eyebrow plain" style="margin-bottom:14px">Loadout</div>
        <div class="slots">${Object.entries(SLOTS).map(([k, sl]) => {
          const it = S.inv.find(i => i.id === S.eq[k]);
          return `<div class="slot ${it ? 'has' : ''}" style="--rc:${it ? rarity(it.rar).c : 'transparent'}">${art(sl.em, it ? 'em' : 'em off')}<span class="lb">${it ? '+' + it.val + '% ' + (it.stat === 'xp' ? 'XP' : 'Gold') : sl.label}</span></div>`;
        }).join('')}</div>
        <div class="bonuses"><span class="pill purple"><i></i>+${b.xp}% XP</span><span class="pill gold"><i></i>+${b.gold}% gold</span></div>
      </div>

      <div class="sec between"><div class="eyebrow">Inventory · ${S.inv.length}</div>${S.inv.some(i => i.rar === 'common' && !eqIds.has(i.id)) ? '<button class="chip" data-act="salvageCommons">Salvage commons</button>' : ''}</div>
      ${S.inv.length ? S.inv.map(it => {
        const r = rarity(it.rar), eq = eqIds.has(it.id), cur = S.inv.find(i => i.id === S.eq[it.slot]);
        const better = !eq && (!cur || it.val > cur.val);
        return `<div class="item" style="--rc:${r.c}">
          <div class="em">${art(SLOTS[it.slot].em)}</div>
          <div style="min-width:0"><div class="nm">${esc(it.name)}</div><div class="meta"><span class="rar">${it.rar}</span><span class="dim">+${it.val}% ${it.stat === 'xp' ? 'XP' : 'gold'}</span>${better ? '<span class="c-green">▲</span>' : ''}</div></div>
          <div class="acts">${eq ? '<span class="chip gold">Equipped</span>' : `<button class="btn sm green" data-act="equipItem" data-id="${it.id}">Equip</button><button class="btn sm ghost" data-act="salvage" data-id="${it.id}" aria-label="Salvage for ${salvageValue(it)} gold">${art('coin')}${salvageValue(it)}</button>`}</div>
        </div>`;
      }).join('') : '<div class="card flat dim" style="text-align:center">No loot yet. Foes drop gear when they fall. Bosses always do.</div>'}

      <div class="sec between"><div class="eyebrow">Your hero</div>
        <div class="tones" role="radiogroup" aria-label="Skin tone">${TONES.map(t => `<button class="${S.tone === t ? 'on' : ''}" style="--sw:${TONE_SWATCH[t]}" data-act="tone" data-t="${t}" aria-label="Skin tone ${t}"></button>`).join('')}</div>
      </div>
      <div class="skins">${HEROES.map(k => {
        const own = S.owned.includes(k.id), eq = S.skin === k.id;
        const btn = eq ? '<button class="btn sm ghost" disabled>Playing</button>'
          : own ? `<button class="btn sm ghost" data-act="equipSkin" data-id="${k.id}">Play as</button>`
          : `<button class="btn sm" data-act="buySkin" data-id="${k.id}" ${S.gold < k.price ? 'disabled' : ''}>${art('coin')}${fmt(k.price)}</button>`;
        return `<div class="skin ${eq ? 'eq' : ''} ${own ? '' : 'unowned'}">${heroArt(k.id)}<div class="nm">${k.name}</div>${btn}</div>`;
      }).join('')}</div>`;
  },

  hero() {
    const L = levelInfo(S.xp), goal = S.settings.goal;
    const days = [], vals = [];
    for (let i = 6; i >= 0; i--) { const d = daysAgo(i); days.push(d); vals.push(S.days[dayKey(d)]?.n || 0); }
    let prev = 0; for (let i = 7; i < 14; i++) prev += S.days[dayKey(daysAgo(i))]?.n || 0;
    const week = vals.reduce((a, b) => a + b, 0), max = Math.max(goal, ...vals);
    const delta = prev ? Math.round(((week - prev) / prev) * 100) : null;
    const got = ACH.filter(a => S.ach[a.id]), locked = ACH.filter(a => !S.ach[a.id]);
    return `
      <div class="eyebrow c-green">Your hero sheet</div>
      <h1 class="title"><em class="g">${fmt(S.total)} reps</em><br>and climbing.</h1>
      <div class="card">
        <div class="hero-top">
          <div class="avatar">${heroArt()}</div>
          <div style="flex:1;min-width:0">
            <h3>${esc(S.name || 'Hero')}</h3>
            <div class="dim" style="font-size:12.5px">Lv ${L.level} · ${fmt(S.total)} lifetime reps</div>
            <div class="badge">${art('star')}${titleFor(L.level)}</div>
          </div>
        </div>
        <div class="between" style="margin:14px 0 7px;font-size:11px;font-weight:700;letter-spacing:.1em"><span class="dim">LEVEL ${L.level} → ${L.level + 1}</span><span class="dim num">${fmt(L.into)} / ${fmt(L.need)}</span></div>
        <div class="bar"><i style="width:${(L.into / L.need) * 100}%"></i></div>
      </div>

      <div class="card">
        <div class="eyebrow plain">Reps this week</div>
        <div class="row" style="align-items:baseline;gap:8px;margin-top:6px"><span class="big num">${fmt(week)}</span><span class="dim" style="font-size:12.5px">reps${delta !== null ? ` · <span class="${delta >= 0 ? 'c-green' : 'c-red'}">${delta >= 0 ? '+' : ''}${delta}%</span> vs last week` : ''}</span></div>
        <div class="chart">${days.map((d, i) => `<div class="c ${i === 6 ? 'today' : ''}"><div class="b ${vals[i] ? '' : 'zero'}" style="height:${Math.max(5, (vals[i] / max) * 100)}%">${vals[i] ? `<span>${vals[i]}</span>` : ''}</div><div class="dl">${'SMTWTFS'[d.getDay()]}</div></div>`).join('')}</div>
      </div>

      <div class="grid3" style="margin-bottom:12px">
        <div class="stat"><div class="v num">${fmt(S.byEx.pushup || 0)}</div><div class="k">Push-ups</div></div>
        <div class="stat"><div class="v num">${fmt(S.byEx.squat || 0)}</div><div class="k">Squats</div></div>
        <div class="stat"><div class="v num">${fmt(S.best)}</div><div class="k">Best battle</div></div>
        <div class="stat"><div class="v num">${streak()}</div><div class="k">Streak</div></div>
        <div class="stat"><div class="v num">${S.bestStreak}</div><div class="k">Best streak</div></div>
        <div class="stat"><div class="v num">${fmt(S.kills)}</div><div class="k">Foes felled</div></div>
      </div>

      <div class="sec between"><div class="eyebrow c-gold">Deeds · ${got.length}/${ACH.length}</div></div>
      ${[...got, ...locked].map(a => `<div class="deed ${S.ach[a.id] ? '' : 'locked'}"><div class="em">${art(a.icon)}</div><div><div class="nm">${a.name}</div><div class="ds">${a.desc}</div></div>${S.ach[a.id] ? art('check', 'tick') : ''}</div>`).join('')}

      <div class="sec"><div class="eyebrow">Log reps without camera</div></div>
      <div class="card">
        <div class="row">
          <div class="stepper"><button data-act="mstep" data-d="-5">−</button><input id="manualN" type="number" inputmode="numeric" min="1" max="500" value="10"><button data-act="mstep" data-d="5">+</button></div>
          <button class="btn sm" data-act="manual" style="padding:13px 18px">Log ${EX[S.mode].many}</button>
        </div>
      </div>

      <div class="sec"><div class="eyebrow">Recent battles</div></div>
      <div class="card">${S.sessions.length ? `<ul class="sessions">${S.sessions.slice(0, 12).map(s => {
        const d = new Date(s.t);
        return `<li><span><span class="dim">${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span> · ${EX[s.ex || 'pushup'].label}${s.manual ? ' <span class="mute">(logged)</span>' : ''}</span><b class="num">${s.n}</b></li>`;
      }).join('')}</ul>` : '<div class="dim" style="text-align:center">No battles yet. Your saga awaits.</div>'}</div>`;
  },
};

function render() {
  const v = $('#view');
  v.innerHTML = VIEWS[tab]();
  v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter');
  $$('#tabbar [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
}

/* ================= battle ================= */
let sess = null, tracker = null, lastTap = 0, dying = false, wake = null, lastStatus = '';

async function requestWake() { try { wake = await navigator.wakeLock?.request('screen'); } catch {} }
document.addEventListener('visibilitychange', () => { if (sess && document.visibilityState === 'visible') requestWake(); });

function openBattle() {
  ac();
  closeSheet();
  sess = { t: Date.now(), n: 0, xp: 0, gold: 0, kills: 0, loot: [], ex: S.mode, lv0: levelInfo(S.xp).level };
  S.live = sess; save();
  const B = $('#battle');
  B.className = '';
  B.innerHTML = `
    <video playsinline muted autoplay></video>
    <canvas></canvas>
    <div class="tap-zone" hidden></div>
    <div class="shade"></div>
    <div class="b-top">
      <div class="b-row">
        <button class="b-back" data-bact="end" aria-label="End battle">${ico('back')}</button>
        <span class="b-name" id="bName"></span>
        <span class="b-chip o" id="bEx"></span>
        <span class="b-chip p" id="bStage"></span>
        <span class="b-pct" id="bPct"></span>
      </div>
      <div class="b-hp"><div class="bar red"><i id="bHp"></i></div></div>
      <div class="b-status" id="bStatus">Starting camera…</div>
      <div class="b-debug" id="bDebug" ${S.settings.debug ? '' : 'hidden'}></div>
    </div>
    <div class="b-foe" id="bFoe"></div>
    <div class="b-depth" id="bDepth"><span>DEPTH</span><div class="tube"><i></i><div class="tick"></div></div></div>
    <div class="b-bottom">
      <div class="b-count num" id="bCount">0<small>reps</small></div>
      <div class="b-cap" id="bCap"></div>
      <div class="tap-hint" id="bTapHint" hidden>Tap anywhere for each rep. Nose or chest works great.</div>
      <div class="b-loot"><span>XP <b id="bXp">0</b></span><span>Gold <b id="bGold">0</b></span><span>Felled <b id="bKills">0</b></span></div>
      <div class="b-actions">
        <button class="btn sm ghost" data-bact="undo">${ico('undo')} Undo</button>
        <button class="btn sm ghost" data-bact="flip" id="bFlip">${ico('flip')} Flip</button>
        <button class="btn sm" data-bact="end">Finish</button>
      </div>
    </div>
    <div class="b-loading" id="bLoad"></div>`;
  B.hidden = false;
  renderFoe();
  requestWake();
  if (S.settings.counting === 'tap') startTapMode();
  else startCamera();
}

const POSITION_TIPS = {
  pushup: ['Prop your phone on the floor, about 1.5–2 m away, to your side or in front of you.', 'Keep your shoulders, arms and hips in view. Side-on works best.', 'Hold a straight-arm plank for a second to start, then go down until the depth bar turns green and push all the way up.'],
  squat: ['Stand the phone up about 2–3 m away so your whole body is visible.', 'Side-on works best. Facing the camera works too.', 'Sit back until the depth bar turns green, then stand tall.'],
};

function showLoading(title, text, extra = '') {
  const el = $('#bLoad'); if (!el) return;
  el.hidden = false;
  el.innerHTML = `<div><div class="spin"></div><h3>${title}</h3><p>${text}</p>${extra}</div>`;
}

async function startCamera() {
  const tips = `<div class="card"><div class="eyebrow plain" style="margin-bottom:8px">Setup</div><ol class="tips">${POSITION_TIPS[S.mode].map(t => `<li>${t}</li>`).join('')}</ol></div>`;
  showLoading('Opening camera', 'Video stays on your phone. Nothing is uploaded.', tips);
  const mySess = sess;
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('nocam');
    const { startTracking } = await import('./pose.js');
    if (sess !== mySess) return;
    const t = await startTracking({
      video: $('#battle video'), canvas: $('#battle canvas'),
      mode: S.mode, sensitivity: S.settings.sens, facing: S.settings.facing,
      onStatus: s => { if (s === 'model') showLoading('Summoning the pose spirit', 'Loading the on-device pose model. The first time takes a few seconds.', tips); },
      onFrame, onRep: rep,
    });
    if (sess !== mySess) { t.stop(); return; }
    tracker = t;
    $('#bLoad').hidden = true;
    $('#bLoad').innerHTML = '';
  } catch (e) {
    if (sess !== mySess) return;
    console.warn(e);
    const denied = e?.name === 'NotAllowedError';
    $('#bLoad').innerHTML = `<div>
      <div style="margin-bottom:10px">${art('camera', 'big-ico')}</div>
      <h3>${denied ? 'Camera access denied' : 'Camera unavailable'}</h3>
      <p>${denied ? 'Allow camera access in your browser settings to count reps automatically.' : 'The camera or pose model could not start here.'} You can still fight by tapping.</p>
      <div class="stack" style="max-width:260px;margin:0 auto"><button class="btn" data-bact="tapmode">${ico('hand')} Use tap mode</button><button class="btn ghost" data-bact="retry">Try again</button><button class="btn ghost" data-bact="end">Back</button></div>
    </div>`;
  }
}

function startTapMode() {
  tracker?.stop(); tracker = null;
  const B = $('#battle');
  B.classList.add('tapmode');
  B.style.setProperty('--z1', monsterFor(S.stage).zone.sky[1]);
  $('#bLoad').hidden = true;
  $('.tap-zone', B).hidden = false;
  $('#bDepth').hidden = true;
  $('#bFlip').hidden = true;
  $('#bTapHint').hidden = false;
  setStatus('Tap mode', 'ok', true);
}

// The camera loop calls this every frame. A new message only replaces the
// current one after it has been asked for steadily (warnings 500ms, coaching
// 150ms) and the current one has been up for at least 700ms, so two
// alternating messages can't make the pill flicker.
let pendStatus = '', pendSince = 0, shownAt = 0;
function setStatus(text, cls = '', immediate = false) {
  const key = text + '|' + cls, now = performance.now();
  if (key === lastStatus) { pendStatus = ''; return; }
  if (!immediate) {
    if (key !== pendStatus) { pendStatus = key; pendSince = now; return; }
    if (now - pendSince < (cls === 'warn' ? 500 : 150) || now - shownAt < 700) return;
  }
  lastStatus = key; pendStatus = ''; shownAt = now;
  const el = $('#bStatus'); if (!el) return;
  el.textContent = text; el.className = 'b-status ' + cls;
}

// Why the counter is refusing to count, in plain words.
const REASONS = {
  nohips: 'Move back so your hips are in view too',
  upright: 'Get down into plank position',
  hands: 'Hands on the floor, below your shoulders',
  moved: 'Keep your hands planted. Rep not counted',
  noshoulders: 'Step back so your shoulders are in view',
  notupright: 'Stand up straight to start',
  slow: 'Rep took too long. Reset at the top',
};

function onFrame(r) {
  const tube = $('#bDepth .tube');
  if (!tube) return;
  tube.firstElementChild.style.height = Math.round(r.p * 100) + '%';
  tube.classList.toggle('deep', r.state === 'bottom');
  const sq = S.mode === 'squat';
  if (!r.visible) setStatus(sq ? 'Step back so your hips and knees are in view' : 'Show your shoulders, elbows and wrists', 'warn');
  else if (r.reason && REASONS[r.reason]) setStatus(REASONS[r.reason], 'warn');
  else if (r.state === 'wait') setStatus(sq ? 'Stand tall and hold still' : 'Hold a straight-arm plank', 'warn');
  else if (r.state === 'top') setStatus(sq ? 'Squat down' : 'Go down', 'ok');
  else setStatus(sq ? 'Now stand up!' : 'Now push up!', 'ok');
  if (S.settings.debug) $('#bDebug').textContent = `depth ${r.p.toFixed(2)} · ${r.state}${r.reason ? ' · ' + r.reason : ''}`;
}

function renderFoe() {
  const m = monsterFor(S.stage), f = $('#bFoe');
  if (!f) return;
  $('#bName').textContent = m.name;
  $('#bEx').innerHTML = art('swords') + EX[S.mode].label;
  $('#bStage').innerHTML = m.boss ? art('crown') + 'Boss' : `Stage ${m.i + 1}/${PER_ZONE}`;
  f.className = 'b-foe' + (m.boss ? ' boss' : '');
  f.style.setProperty('--fg', m.zone.glow);
  f.innerHTML = `<div class="halo"></div>${art(m.sp, 'spawn')}<div class="floor"></div>`;
  dying = false;
  updateBattle();
}

function updateBattle() {
  if (!sess) return;
  $('#bCount').innerHTML = `${sess.n}<small>reps</small>`;
  $('#bXp').textContent = fmt(sess.xp);
  $('#bGold').textContent = fmt(sess.gold);
  $('#bKills').textContent = sess.kills;
  if (!dying) {
    const m = monsterFor(S.stage), left = m.hp - S.dmg, ex = EX[S.mode];
    $('#bHp').style.width = (left / m.hp) * 100 + '%';
    $('#bPct').textContent = Math.round((left / m.hp) * 100) + '%';
    $('#bCap').textContent = `${left} ${left === 1 ? ex.one : ex.many} to fell the ${m.base}`;
  }
}

function retrigger(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

function rep() {
  if (!sess) return;
  const ev = applyReps(1, sess), crit = Math.random() < .12;
  retrigger($('#bCount'), 'pop');
  const foeImg = $('#bFoe img');
  if (!dying) retrigger(foeImg, 'hit');
  const d = document.createElement('div');
  d.className = 'dmg' + (crit ? ' crit' : '');
  d.textContent = crit ? 'CRIT!' : '−1';
  d.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
  $('#bFoe').appendChild(d);
  setTimeout(() => d.remove(), 800);
  crit ? SFX.crit() : SFX.hit();
  buzz(crit ? 30 : 15);

  const kill = ev.find(e => e.type === 'kill');
  if (kill && !dying) {
    dying = true;
    $('#bHp').style.width = '0%';
    $('#bPct').textContent = '0%';
    if (foeImg) { foeImg.classList.remove('hit'); retrigger(foeImg, 'die'); }
    setTimeout(() => {
      banner(kill.m.boss ? 'BOSS DEFEATED' : 'VICTORY EARNED', `${kill.m.name} felled!`,
        `<span class="pill gold"><i></i>+${kill.xp} XP</span><span class="pill orange"><i></i>+${kill.gold} gold</span>${kill.loot ? `<span class="pill purple"><i></i>${kill.loot.rar} drop</span>` : ''}`);
      confetti(kill.m.boss ? 50 : 26);
      SFX.kill(); buzz([40, 30, 60]);
    }, 150);
    setTimeout(renderFoe, 1200);
  }
  updateBattle();
  handleEvents(ev, true);
}

function undoRep() {
  if (!sess || sess.n <= 0 || S.dmg <= 0 || dying) { buzz(40); return; }
  const day = todayRec(), xpPer = Math.round(10 * (1 + bonus().xp / 100));
  S.total--; day.n = Math.max(0, day.n - 1); S.byEx[S.mode] = Math.max(0, (S.byEx[S.mode] || 0) - 1);
  S.xp -= xpPer; S.dmg--; sess.n--; sess.xp -= xpPer;
  S.live = sess; save();
  SFX.click();
  updateBattle();
}

function endBattle() {
  const s = sess; sess = null;
  tracker?.stop(); tracker = null; lastStatus = '';
  wake?.release?.().catch(() => {}); wake = null;
  $('#battle').hidden = true; $('#battle').innerHTML = '';
  finalizeSession(s);
  render();
  if (!s || s.n === 0) return;
  const lvNow = levelInfo(S.xp).level, mins = Math.max(1, Math.round((Date.now() - s.t) / 60000));
  sheet(`
    <div class="eyebrow c-gold">Battle report</div>
    <h2>${s.kills ? `${s.kills} foe${s.kills > 1 ? 's' : ''} felled` : 'The fight goes on'}</h2>
    <div class="dim" style="font-size:13px">${mins} min · ${EX[s.ex].label}${s.n >= S.best ? ' · <span class="c-gold">new best!</span>' : ''}</div>
    <div class="sum">
      <div><b class="num">${s.n}</b><span>${EX[s.ex].many}</span></div>
      <div><b class="num c-gold">+${fmt(s.xp)}</b><span>XP${lvNow > s.lv0 ? ` · Lv ${s.lv0} → ${lvNow}` : ''}</span></div>
      <div><b class="num c-gold">+${fmt(s.gold)}</b><span>gold</span></div>
      <div><b class="num">${s.loot.length}</b><span>loot drops</span></div>
    </div>
    ${s.loot.map(it => `<div class="item" style="--rc:${rarity(it.rar).c}"><div class="em">${art(SLOTS[it.slot].em)}</div><div><div class="nm">${esc(it.name)}</div><div class="meta"><span class="rar">${it.rar}</span><span class="dim">+${it.val}% ${it.stat === 'xp' ? 'XP' : 'gold'}</span></div></div></div>`).join('')}
    <div class="stack"><button class="btn" data-act="close">Continue</button></div>`);
}

function finalizeSession(s) {
  if (s && s.n > 0) {
    S.sessions.unshift({ t: s.t, n: s.n, ex: s.ex, dur: Date.now() - s.t });
    S.sessions.length = Math.min(S.sessions.length, 300);
  }
  S.live = null; save();
}

$('#battle').addEventListener('pointerdown', e => {
  const b = e.target.closest('[data-bact]');
  if (b) {
    const a = b.dataset.bact;
    if (a === 'end') endBattle();
    else if (a === 'undo') undoRep();
    else if (a === 'tapmode') startTapMode();
    else if (a === 'retry') startCamera();
    else if (a === 'flip') {
      S.settings.facing = S.settings.facing === 'user' ? 'environment' : 'user'; save();
      tracker?.stop(); tracker = null; startCamera();
    }
    return;
  }
  if (!e.target.closest('.tap-zone')) return;
  const now = performance.now();
  if (now - lastTap < S.settings.debounce) return;
  lastTap = now;
  e.preventDefault();
  rep();
});
document.addEventListener('keydown', e => {
  if (!sess) return;
  if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (!e.repeat) rep(); }
  if (e.code === 'Escape') endBattle();
});

/* ================= settings / onboarding ================= */
// Privacy promises shown on first launch and in Settings. Each line is enforced
// in code: on-device pose model, local storage only, and a Content-Security-Policy
// in index.html that blocks connections to anywhere but the app's own server.
const PRIVACY_POINTS = [
  ['camera', 'Your camera video is analyzed on this device. It is never recorded, saved or uploaded.'],
  ['lock', 'Your hero, reps and history are stored only on this device.'],
  ['shield', 'No account, no ads, no analytics, no tracking.'],
];
// Feedback opens a pre-filled email draft or GitHub issue. The app itself sends
// nothing: the person reviews the draft and chooses whether to send it.
const FEEDBACK_EMAIL = 'ikechukwupeter1999@gmail.com';
const FEEDBACK_BODY = [
  'What happened?', '', '', 'What did you expect?', '', '',
  'Exercise (pushups or squats):', 'Camera position (side or front, how far away):', 'Phone and browser:',
].join('\n');
// mailto needs %20 for spaces (URLSearchParams would write "+", which mail apps show literally)
const FEEDBACK_MAIL = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('Pushup Quest feedback')}&body=${encodeURIComponent(FEEDBACK_BODY)}`;
const FEEDBACK_URL = 'https://github.com/ikechukwu-peter/pushup-quest/issues/new?' + new URLSearchParams({ title: 'Feedback: ', body: FEEDBACK_BODY });
const PRIVACY_DETAILS = [
  ['Camera', 'During a battle the camera feed goes to a pose model that runs inside the app on your device. It finds your joints in each frame to count reps, then throws the frame away. Nothing is recorded or saved, and the camera turns off as soon as you leave the battle.'],
  ['Your progress', 'Your name, reps, streaks, loot and settings are kept in this browser\'s storage on this device. Nobody else can see them. Deleting the app or clearing this site\'s data erases them, so use Export save to keep a backup. Reset all progress deletes everything right away.'],
  ['Internet', 'After the first visit the app works fully offline. It only ever connects to its own server, to download the app and its updates. A built-in security rule makes the browser block connections to anywhere else. The pose model from Google includes a usage-statistics report, and we switched it off.'],
  ['Feedback', 'Email feedback opens a draft in your mail app, and Report on GitHub opens an issue form in your browser. Nothing is sent from the app: only what you choose to send reaches the developer. A GitHub issue is public, under your GitHub account; an email is private.'],
  ['What the server sees', 'Like any website, the server that hosts the app sees standard request details, such as your IP address, when your device downloads the app or an update. It never receives your video, reps or progress.'],
];
const privacyCard = () => `<div class="card privacy">
  <div class="privacy-head">${art('lock')}<b>Private by design</b></div>
  <ul>${PRIVACY_POINTS.map(([i, t]) => `<li>${art(i)}<span>${t}</span></li>`).join('')}</ul>
</div>`;
const privacyDetails = () => PRIVACY_DETAILS.map(([h, t]) => `<h4>${h}</h4><p>${t}</p>`).join('');
function openPrivacy() {
  sheet(`
    <h2>Your privacy</h2>
    ${privacyCard()}
    <div class="privacy-more">${privacyDetails()}</div>
    <div class="stack"><button class="btn ghost" data-act="settings">Back to settings</button></div>`);
}

function openSettings() {
  const st = S.settings;
  sheet(`
    <h2>Settings</h2>
    <div class="field"><label>Hero name</label><input type="text" id="setName" maxlength="16" value="${esc(S.name)}"></div>
    <div class="field"><label>Daily goal (reps)</label>
      <div class="stepper"><button data-act="gstep" data-d="-5">−</button><input id="setGoal" type="number" inputmode="numeric" value="${st.goal}"><button data-act="gstep" data-d="5">+</button></div>
    </div>
    <div class="field"><label>Rep counting</label>
      <div class="seg wide" data-group="counting"><button data-act="segpick" data-v="camera" class="${st.counting === 'camera' ? 'on' : ''}">Camera</button><button data-act="segpick" data-v="tap" class="${st.counting === 'tap' ? 'on' : ''}">Tap</button></div>
    </div>
    <div class="field"><label>Rep depth required</label>
      <div class="seg wide" data-group="sens"><button data-act="segpick" data-v="0" class="${st.sens === 0 ? 'on' : ''}">Strict</button><button data-act="segpick" data-v="1" class="${st.sens === 1 ? 'on' : ''}">Normal</button><button data-act="segpick" data-v="2" class="${st.sens === 2 ? 'on' : ''}">Easy</button></div>
    </div>
    ${installInfo().standalone ? '' : '<button class="opt opt-link" data-act="install"><div>Install on your phone<small>Full screen and offline, from your home screen.</small></div><span class="chev">›</span></button>'}
    <button class="opt opt-link" data-act="privacy"><div>Privacy<small>Your video and progress stay on this device.</small></div><span class="chev">›</span></button>
    <a class="opt opt-link" href="${FEEDBACK_MAIL}"><div>Email feedback<small>Opens a draft in your mail app. You choose what to send.</small></div><span class="chev">›</span></a>
    <a class="opt opt-link" href="${FEEDBACK_URL}" target="_blank" rel="noopener"><div>Report on GitHub<small>Opens a public issue form in your browser.</small></div><span class="chev">›</span></a>
    <div class="opt"><div>Show tracking details<small>Depth value and why reps are rejected, on the battle screen.</small></div><button class="toggle ${st.debug ? 'on' : ''}" data-act="tog" data-k="debug" aria-label="Tracking details"></button></div>
    <div class="opt"><div>Sound effects</div><button class="toggle ${st.sound ? 'on' : ''}" data-act="tog" data-k="sound" aria-label="Sound"></button></div>
    <div class="opt"><div>Vibration<small>Android only. iPhone doesn't let web apps vibrate.</small></div><button class="toggle ${st.haptics ? 'on' : ''}" data-act="tog" data-k="haptics" aria-label="Vibration"></button></div>
    <div class="stack">
      <button class="btn" data-act="saveSettings">Save</button>
      <div class="row"><button class="btn ghost" data-act="export">Export save</button><button class="btn ghost" data-act="import">Import save</button></div>
      <button class="btn red" data-act="reset">Reset all progress</button>
    </div>
    <input type="file" id="importFile" accept="application/json,.json" hidden>`, M => {
    $('#importFile', M).addEventListener('change', async e => {
      const f = e.target.files[0]; if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        if (typeof data.total !== 'number' || typeof data.days !== 'object') throw 0;
        localStorage.setItem(KEY, JSON.stringify(data)); load(); closeSheet(); render(); toast('check', 'Save imported');
      } catch { toast('lock', 'Invalid save file'); }
    });
  });
}

function onboarding() {
  sheet(`
    <div class="ob-art">${art('frog', 'ob-foe')}${heroArt('guard', 'ob-hero')}</div>
    <div class="eyebrow c-purple">Real reps, real combat</div>
    <h2>A new hero rises</h2>
    <p class="dim" style="font-size:14px;margin:6px 0 0">Prop up your phone and the camera counts your pushups and squats. Every rep strikes a monster. Fell foes, level up, find loot.</p>
    <div class="field"><label>Name your hero</label><input type="text" id="obName" maxlength="16" placeholder="Aldric the Unbroken"></div>
    <div class="field"><label>Daily goal (reps)</label>
      <div class="stepper"><button data-act="gstep" data-d="-5">−</button><input id="setGoal" type="number" inputmode="numeric" value="${S.settings.goal}"><button data-act="gstep" data-d="5">+</button></div>
    </div>
    ${privacyCard()}
    <details class="privacy-more"><summary>How this works</summary>${privacyDetails()}</details>
    <div class="stack"><button class="btn" data-act="begin">Begin quest</button></div>`);
}

const clampInput = (id, d, min, max) => { const el = $(id); el.value = Math.max(min, Math.min(max, (parseInt(el.value) || 0) + d)); };

/* ================= actions ================= */
const ACTIONS = {
  battle: openBattle,
  settings: openSettings,
  privacy: openPrivacy,
  close: closeSheet,
  dismissInstall() { S.installDismissed = true; save(); render(); },
  install: openInstall,
  async installNow() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice.catch(() => {});
    installPrompt = null; closeSheet(); render();
  },
  async copyLink(b) {
    try { await navigator.clipboard.writeText(location.origin + '/'); b.textContent = 'Link copied'; }
    catch { b.textContent = location.host; }
  },
  mode(b) { S.mode = b.dataset.m; save(); render(); SFX.click(); },
  gstep: b => clampInput('#setGoal', +b.dataset.d, 5, 1000),
  mstep: b => clampInput('#manualN', +b.dataset.d, 1, 500),
  tog: b => b.classList.toggle('on'),
  segpick(b) { $$('button', b.parentElement).forEach(x => x.classList.toggle('on', x === b)); },
  saveSettings() {
    const seg = g => $(`[data-group=${g}] .on`)?.dataset.v;
    S.name = $('#setName').value.trim().slice(0, 16) || S.name;
    S.settings.goal = Math.max(5, Math.min(1000, parseInt($('#setGoal').value) || 50));
    S.settings.counting = seg('counting') || 'camera';
    S.settings.sens = +(seg('sens') ?? 1);
    S.settings.sound = $('[data-k=sound]').classList.contains('on');
    S.settings.haptics = $('[data-k=haptics]').classList.contains('on');
    S.settings.debug = $('[data-k=debug]').classList.contains('on');
    save(); closeSheet(); render(); SFX.click();
  },
  begin() {
    S.name = $('#obName').value.trim().slice(0, 16) || 'Aldric';
    S.settings.goal = Math.max(5, Math.min(1000, parseInt($('#setGoal').value) || 50));
    save(); closeSheet(); render(); ac(); SFX.level();
  },
  manual() {
    const n = Math.max(1, Math.min(500, parseInt($('#manualN').value) || 0));
    const ev = applyReps(n);
    S.sessions.unshift({ t: Date.now(), n, ex: S.mode, manual: true });
    save(); render(); SFX.coin();
    toast('scroll', `Logged ${n} ${EX[S.mode].many}`, 'Damage dealt to your current foe');
    handleEvents(ev, false);
  },
  equipItem(b) {
    const it = S.inv.find(i => i.id === b.dataset.id); if (!it) return;
    S.eq[it.slot] = it.id; save(); render(); SFX.coin();
  },
  salvage(b) {
    const i = S.inv.findIndex(x => x.id === b.dataset.id); if (i < 0) return;
    S.gold += salvageValue(S.inv[i]); S.inv.splice(i, 1); save(); render(); SFX.coin();
  },
  salvageCommons() {
    const eq = new Set(Object.values(S.eq)); let g = 0;
    S.inv = S.inv.filter(it => { if (it.rar === 'common' && !eq.has(it.id)) { g += salvageValue(it); return false; } return true; });
    S.gold += g; save(); render(); SFX.coin(); toast('coin', 'Salvaged commons', `+${g} gold`);
  },
  buySkin(b) {
    const k = HEROES.find(s => s.id === b.dataset.id);
    if (!k || S.gold < k.price || S.owned.includes(k.id)) return;
    S.gold -= k.price; S.owned.push(k.id); S.skin = k.id;
    save(); render(); SFX.coin(); toast('crown', k.name + ' unlocked');
  },
  equipSkin(b) { S.skin = b.dataset.id; save(); render(); SFX.click(); },
  tone(b) { S.tone = b.dataset.t; save(); render(); SFX.click(); },
  export() {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
    const file = new File([blob], `pushup-quest-${dayKey()}.json`, { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] })) { navigator.share({ files: [file] }).catch(() => {}); return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  import() { $('#importFile').click(); },
  reset() {
    if (!confirm('Erase your hero and ALL progress? This cannot be undone.')) return;
    localStorage.removeItem(KEY); load(); closeSheet(); render(); onboarding();
  },
};
document.addEventListener('click', e => {
  const t = e.target.closest('[data-tab]');
  if (t) { if (tab !== t.dataset.tab) { tab = t.dataset.tab; render(); $('#view').scrollTop = 0; SFX.click(); } return; }
  const a = e.target.closest('[data-act]');
  if (a && ACTIONS[a.dataset.act]) ACTIONS[a.dataset.act](a);
});

/* ================= boot ================= */
load();
if (S.live) finalizeSession(S.live); // battle interrupted by the app closing
$$('[data-ico]').forEach(i => { i.outerHTML = ico(i.dataset.ico); });
render();
if (!S.name) onboarding();
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !sess) render(); });
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  // When an updated version installs, reload once so the new code runs (not mid-battle).
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !sess) location.reload(); });
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
