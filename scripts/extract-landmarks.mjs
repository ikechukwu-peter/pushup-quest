// Turn an exercise video into a test fixture: pose landmarks per frame, in the
// same compact format as tests/fixtures/*.json.
//
//   npm run extract -- <video> <out.json> [--title T] [--author A] [--license L] [--url U]
//
// Needs ffmpeg and Google Chrome (set CHROME=/path/to/chrome if it is elsewhere).
// It splits the video into JPEG frames at 15 fps, serves them next to the app,
// and runs the app's own pose model over them in headless Chrome.
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const FPS = 15;
const JOINTS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]; // the joints counter.js reads
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(`--${k}`); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
const source = { title: opt('title'), author: opt('author'), license: opt('license'), url: opt('url') };
const [video, outPath] = args;
if (!video || !outPath) {
  console.error('usage: npm run extract -- <video> <out.json> [--title T] [--author A] [--license L] [--url U]');
  process.exit(1);
}

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const frames = mkdtempSync(join(tmpdir(), 'pq-frames-'));
const profile = mkdtempSync(join(tmpdir(), 'pq-chrome-'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
let chrome, server;

try {
  execFileSync('ffmpeg', ['-v', 'error', '-i', resolve(video), '-vf', `fps=${FPS}`, '-q:v', '4', join(frames, '%05d.jpg')]);
  const count = readdirSync(frames).length;
  server = await serve({ root, port: 0, mounts: { '/__frames/': frames } });
  const port = server.address().port;

  chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((ok, fail) => {
    let buf = '';
    chrome.stderr.on('data', d => { buf += d; const m = buf.match(/ws:\/\/[^\s]+/); if (m) ok(m[0]); });
    chrome.on('exit', () => fail(new Error('Chrome exited early. Set CHROME to your Chrome binary.')));
  });
  const { webSocketDebuggerUrl } = (await (await fetch(`http://${new URL(wsUrl).host}/json/new?about:blank`, { method: 'PUT' })).json());
  const ws = new WebSocket(webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', m => { const d = JSON.parse(m.data); pending.get(d.id)?.(d); pending.delete(d.id); });
  const cmd = (method, params = {}) => new Promise(r => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => {
    const r = await cmd('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'page error');
    return r.result?.result?.value;
  };

  await cmd('Page.navigate', { url: `http://localhost:${port}/scripts/extract-landmarks.html` });
  for (let i = 0; i < 120 && !(await evaluate('window.ready === true')); i++) await sleep(500);
  const raw = JSON.parse(await evaluate(`extract(${count}, ${FPS})`));
  ws.close();

  const r4 = v => Math.round(v * 1e4) / 1e4, r2 = v => Math.round(v * 100) / 100;
  const doc = {
    source,
    note: 'Pose landmarks extracted with MediaPipe Pose Landmarker (lite) at 15 fps. Only the joints the rep counter reads are kept. Derived data; same licence as the source video.',
    fps: FPS, width: raw.width, height: raw.height, joints: JOINTS,
    frames: raw.frames.map(f => [f.t, f.lm && JOINTS.map(j => [r4(f.lm[j][0]), r4(f.lm[j][1]), r2(f.lm[j][2])])]),
  };
  writeFileSync(resolve(outPath), JSON.stringify(doc));
  const seen = doc.frames.filter(f => f[1]).length;
  console.log(`${outPath}: ${doc.frames.length} frames, ${seen} with a pose`);
} finally {
  chrome?.kill();
  server?.close();
  rmSync(frames, { recursive: true, force: true });
  rmSync(profile, { recursive: true, force: true });
}
