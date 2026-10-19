// Camera + on-device pose tracking. Video frames never leave the phone.
import { FilesetResolver, PoseLandmarker } from './vendor/vision_bundle.mjs';
import { RepCounter, BONES, LM, jointStatus } from './counter.js';

const base = new URL('./', import.meta.url);
let landmarkerP = null;

function loadLandmarker() {
  landmarkerP ||= (async () => {
    const fileset = await FilesetResolver.forVisionTasks(new URL('vendor/wasm', base).href);
    const opts = delegate => ({
      baseOptions: { modelAssetPath: new URL('vendor/pose_landmarker_lite.task', base).href, delegate },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    try { return await PoseLandmarker.createFromOptions(fileset, opts('GPU')); }
    catch { return await PoseLandmarker.createFromOptions(fileset, opts('CPU')); }
  })().catch(e => { landmarkerP = null; throw e; });
  return landmarkerP;
}

/**
 * Start tracking. Calls onFrame(result, info) every frame, where result is the
 * counter's output and info = { joints, fps, modelMs } (joints from jointStatus,
 * for the setup screen; fps/modelMs for the speed readout). onRep(quality) fires
 * per counted rep and onPartial() per shallow rep. Returns a controller with stop().
 */
export async function startTracking({ video, canvas, mode, sensitivity = 1, facing = 'user', onFrame, onRep, onPartial, onStatus }) {
  onStatus?.('camera');
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } },
  });
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  await video.play();
  const mirror = facing === 'user';
  video.classList.toggle('mirror', mirror);
  canvas.classList.toggle('mirror', mirror);

  onStatus?.('model');
  const landmarker = await loadLandmarker();
  onStatus?.('ready');

  // sensitivity 0 = strict (deep reps), 2 = easy (shallower reps count)
  const down = [0.8, 0.7, 0.58][sensitivity] ?? 0.7;
  const counter = new RepCounter(mode, { down, up: 0.3 });
  const ctx = canvas.getContext('2d');
  let running = true, lastVideoTime = -1, raf = 0;
  // speed readout: frames processed per second and model time, smoothed
  let fps = 0, modelMs = 0, lastT = 0;

  function frame() {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (video.readyState < 2 || video.currentTime === lastVideoTime) return;
    lastVideoTime = video.currentTime;
    const vw = video.videoWidth, vh = video.videoHeight;
    let res;
    const t0 = performance.now();
    try { res = landmarker.detectForVideo(video, t0); } catch { return; }
    const t1 = performance.now();
    modelMs = modelMs ? modelMs * 0.9 + (t1 - t0) * 0.1 : t1 - t0;
    if (lastT) fps = fps ? fps * 0.9 + (1000 / (t0 - lastT)) * 0.1 : 1000 / (t0 - lastT);
    lastT = t0;
    const lm = res.landmarks?.[0];
    // nx/ny (normalized) let the counter ignore joints the model guessed off-screen
    const pts = lm?.map(p => ({ x: p.x * vw, y: p.y * vh, nx: p.x, ny: p.y, visibility: p.visibility }));
    const r = counter.update(pts, performance.now());
    draw(ctx, canvas, video, pts, r);
    onFrame?.(r, { joints: jointStatus(pts, counter.mode), fps, modelMs });
    if (r.rep) onRep?.(r.quality);
    if (r.partial) onPartial?.();
  }
  raf = requestAnimationFrame(frame);

  return {
    counter,
    setMode(m) { counter.mode = m; counter.reset(); },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      stream.getTracks().forEach(t => t.stop());
      video.srcObject = null;
    },
  };
}

// Draw the skeleton over the video, matching its object-fit: cover crop.
function draw(ctx, canvas, video, pts, r) {
  const dpr = Math.min(2, devicePixelRatio || 1);
  const cw = canvas.clientWidth, ch = canvas.clientHeight;
  if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cw, ch);
  if (!pts) return;
  const vw = video.videoWidth, vh = video.videoHeight;
  const s = Math.max(cw / vw, ch / vh), ox = (cw - vw * s) / 2, oy = (ch - vh * s) / 2;
  const P = i => ({ x: pts[i].x * s + ox, y: pts[i].y * s + oy, v: pts[i].visibility ?? 1 });
  const hot = r.state === 'bottom';
  const line = hot ? '#6ee7a0' : '#8b7cf6';

  ctx.lineCap = 'round';
  ctx.shadowColor = line; ctx.shadowBlur = 12;
  ctx.strokeStyle = line; ctx.lineWidth = 4;
  for (const [a, b] of BONES) {
    const A = P(a), B = P(b);
    if (A.v < 0.5 || B.v < 0.5) continue;
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
  }
  // head ring
  const N = P(LM.nose), L = P(LM.ls), R = P(LM.rs);
  if (N.v > 0.5 && L.v > 0.5 && R.v > 0.5) {
    const rad = Math.max(24, Math.hypot(L.x - R.x, L.y - R.y) * 0.55);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(N.x, N.y, rad, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.shadowBlur = 0;
  const joints = new Set(BONES.flat());
  for (const i of joints) {
    const J = P(i);
    if (J.v < 0.5) continue;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = line; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(J.x, J.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
}
