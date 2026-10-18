// Bump VERSION whenever you change app files so phones pick up the update.
const VERSION = 'pq-v7';
const VENDOR = 'pq-vendor-1.1.1-private'; // bump only when the files in vendor/ change
const SHELL = [
  './', 'index.html', 'styles.css', 'app.js', 'pose.js', 'counter.js', 'manifest.webmanifest',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
];
// 3D art (~0.5 MB, Fluent Emoji 3D, MIT).
const ART = ["bat.webp","bear.webp","bee.webp","biceps.webp","blood.webp","bolt.webp","camera.webp","candle.webp","check.webp","coin.webp","crown.webp","dagger.webp","dragon.webp","elf-default.webp","elf-t1.webp","elf-t2.webp","elf-t3.webp","elf-t4.webp","elf-t5.webp","fire.webp","fist.webp","frog.webp","gear.webp","gem.webp","ghost.webp","gift.webp","goblin.webp","guard-default.webp","guard-t1.webp","guard-t2.webp","guard-t3.webp","guard-t4.webp","guard-t5.webp","helmet.webp","hero-default.webp","hero-t1.webp","hero-t2.webp","hero-t3.webp","hero-t4.webp","hero-t5.webp","hourglass.webp","house.webp","hundred.webp","leg.webp","link.webp","lizard.webp","lock.webp","mage-default.webp","mage-t1.webp","mage-t2.webp","mage-t3.webp","mage-t4.webp","mage-t5.webp","mammoth.webp","map.webp","mountain.webp","ninja-default.webp","ninja-t1.webp","ninja-t2.webp","ninja-t3.webp","ninja-t4.webp","ninja-t5.webp","octopus.webp","ogre.webp","party.webp","penguin.webp","rat.webp","ring.webp","robot.webp","royal-default.webp","royal-t1.webp","royal-t2.webp","royal-t3.webp","royal-t4.webp","royal-t5.webp","scorpion.webp","scroll.webp","shield.webp","skull.webp","snake.webp","snowman.webp","sparkles.webp","spider.webp","star.webp","swords.webp","target.webp","trex.webp","troll.webp","trophy.webp","vampire.webp","volcano.webp","wolf.webp","zombie.webp"].map(f => 'art/' + f);
// The pose engine (~30 MB). Cached up front so camera counting works offline.
const ENGINE = [
  'vendor/vision_bundle.mjs', 'vendor/pose_landmarker_lite.task',
  'vendor/wasm/vision_wasm_internal.js', 'vendor/wasm/vision_wasm_internal.wasm',
  'vendor/wasm/vision_wasm_nosimd_internal.js', 'vendor/wasm/vision_wasm_nosimd_internal.wasm',
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    await (await caches.open(VERSION)).addAll([...SHELL, ...ART]);
    // Engine files are big: don't fail the install if one of them hiccups.
    const v = await caches.open(VENDOR);
    await Promise.allSettled(ENGINE.map(async f => { if (!(await v.match(f))) await v.add(f); }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== VENDOR).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const cacheName = url.pathname.includes('/vendor/') ? VENDOR : VERSION;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(cacheName).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => req.mode === 'navigate' ? caches.match('index.html') : Response.error()))
  );
});
