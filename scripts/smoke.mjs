// End-to-end smoke test in headless Chrome, run in CI on every push.
//
//   node scripts/smoke.mjs [video.mjpeg]
//
// Serves the app, opens it, starts a battle with Chrome's fake camera, and
// checks that the camera and the on-device pose model start, the setup screen
// appears, and no request leaves the app's own origin. With a real exercise
// video (MJPEG) as the camera it also asserts the rep count.
//
// Needs Google Chrome or Chromium; set CHROME=/path/to/chrome if it isn't found.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const CANDIDATES = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].filter(Boolean);
const CHROME = CANDIDATES.find(p => existsSync(p));
if (!CHROME) { console.error('Chrome not found; set CHROME=/path/to/chrome'); process.exit(2); }

const video = process.argv[2] && resolve(process.argv[2]);
const expectReps = video ? Number(process.env.EXPECT_REPS || 6) : null;
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const profile = mkdtempSync(join(tmpdir(), 'pq-smoke-'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const failures = [];
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) failures.push(msg); };
let chrome, server;

try {
  server = await serve({ root, port: 0 });
  const origin = `http://localhost:${server.address().port}`;
  chrome = spawn(CHROME, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-sandbox',
    '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
    ...(video ? [`--use-file-for-fake-video-capture=${video}`] : []),
    '--autoplay-policy=no-user-gesture-required', 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((ok, fail) => {
    let buf = '';
    chrome.stderr.on('data', d => { buf += d; const m = buf.match(/ws:\/\/[^\s]+/); if (m) ok(m[0]); });
    chrome.on('exit', () => fail(new Error('Chrome exited early')));
  });
  const target = await (await fetch(`http://${new URL(wsUrl).host}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = new Map(); const requests = []; const errors = [];
  ws.addEventListener('message', m => {
    const d = JSON.parse(m.data);
    pending.get(d.id)?.(d); pending.delete(d.id);
    if (d.method === 'Network.requestWillBeSent') requests.push(d.params.request.url);
    if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.method === 'Log.entryAdded' && /Content Security Policy/.test(d.params.entry.text)) errors.push(d.params.entry.text);
  });
  const cmd = (method, params = {}) => new Promise(r => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => (await cmd('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;

  await cmd('Runtime.enable'); await cmd('Network.enable'); await cmd('Log.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await cmd('Page.navigate', { url: origin + '/' });
  await sleep(4000);

  check(await evaluate(`!!document.getElementById('obName')`), 'app loads and shows onboarding');
  await evaluate(`$('#obName').value = 'Smoke'; ACTIONS.begin(); openBattle(); 'ok'`);

  let started = false;
  for (let i = 0; i < 120 && !started; i++) { await sleep(500); started = await evaluate(`!!tracker`); }
  check(started, 'camera and on-device pose model start');
  check(await evaluate(`!document.getElementById('bSetup').hidden || armed`), 'setup screen appears (or counter is already armed)');

  if (video) {
    await sleep(Number(process.env.SECS || 56) * 1000);
    const n = await evaluate('sess.n');
    check(n === expectReps, `counts ${expectReps} reps from the test video (got ${n})`);
  } else {
    await sleep(3000);
  }
  await evaluate(`endBattle(); 'ok'`);

  const outside = requests.filter(u => !u.startsWith(origin) && !u.startsWith('data:') && !u.startsWith('blob:'));
  check(outside.length === 0, `no request leaves the app's origin (${requests.length} requests${outside.length ? ': ' + outside.slice(0, 3).join(', ') : ''})`);
  check(errors.length === 0, `no page errors or CSP violations${errors.length ? ': ' + errors.slice(0, 2).join(' | ') : ''}`);
  ws.close();
} catch (e) {
  failures.push(e.message); console.error(e);
} finally {
  // Wait for Chrome to exit before deleting its profile, or it may still be writing to it.
  if (chrome && chrome.exitCode === null) { const gone = new Promise(r => chrome.once('exit', r)); chrome.kill(); await Promise.race([gone, sleep(5000)]); }
  server?.close();
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
console.log(failures.length ? `\n${failures.length} failing` : '\nsmoke test passed');
process.exit(failures.length ? 1 : 0);
