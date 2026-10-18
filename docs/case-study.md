# Pushup Quest — case study

> A pushup RPG where your phone's camera counts the reps, and nothing it sees leaves the phone.

## 1. The problem

I downloaded a pushup RPG for iOS and found it wanted a subscription to count my own pushups. The idea is good: every rep is a sword swing, so a set becomes a fight you want to finish. Counting reps from a camera is a solved problem in research papers, and a browser can now run a pose model on a phone's GPU. So I set out to build my own, in the browser, installable, offline, and with no server that ever sees me exercising.

## 2. Constraints, chosen deliberately

- **The video never leaves the device.** People do pushups at home, often half-dressed. Not "we don't store it": it is never sent.
- **No server for my data.** Progress lives on the phone, with export and import for backups. No accounts.
- **It works offline.** A workout shouldn't depend on signal.
- **Lightweight.** No framework, no build step, and plain files a reviewer can read top to bottom.
- **Never invent reps.** A counter you keep score against must be conservative. Missing a rep is a small annoyance; counting one you didn't do makes the whole thing pointless.

## 3. Architecture

[![Architecture](architecture.png)](architecture.html)

**The camera** feeds `pose.js`, which runs MediaPipe Pose Landmarker (lite) in WebAssembly on the GPU. It returns 33 landmarks per frame and draws the skeleton overlay.

**`counter.js`** is a pure class with no DOM. It turns landmarks into a 0-to-1 depth signal, then decides through a set of gates whether a full rep has happened.

**`app.js`** is the game: monsters, damage, XP, loot, quests, streaks and screens. It saves to `localStorage`.

**`sw.js`** caches the app shell, the art and the 33 MB pose engine, so after the first visit it runs offline.

**A Content-Security-Policy** limits the app to its own origin, so even buggy or third-party code cannot send data out.

### Honest trade-offs

| Decision | What I gained | What it cost me |
|---|---|---|
| On-device pose model | Video never leaves the phone; offline; zero running cost | A 33 MB first download; the lite model's accuracy |
| Hard gates on every rep | Zero false reps across every negative case I could find | Some real reps missed from the front with a moving camera |
| Vendored, patched MediaPipe | One origin, pinned version, telemetry off | Manual upgrades; the patch must be re-applied |
| Plain files, no build | Nothing to install, readable top to bottom | No type checker; template-string views |
| `localStorage` only | No accounts, no server, private by construction | No sync between devices; clearing site data erases progress |

### Tech stack choices — what I picked and why

| Layer | Pick | Reason |
|---|---|---|
| Pose detection | MediaPipe Pose Landmarker (lite), vendored | On-device, GPU via WebGL, per-joint visibility scores, runs well on phones |
| App | Vanilla JS, HTML, CSS | A few screens and one canvas; a framework would cost more than it saves |
| Offline | Service worker + Cache Storage | Precache everything, cache-first, versioned |
| Storage | `localStorage` | One small JSON save file; export/import for backups |
| Art | Fluent Emoji 3D (MIT), as WebP | Glossy 3D look at about 0.5 MB for 93 images |
| Tests | `node --test`, replayed footage | No dependencies; fast; tests real behavior |
| Hosting | Vercel static, custom subdomain | HTTPS (required for the camera), headers for the CSP |

## 4. Six decisions worth defending

Each one has its own record in [decisions/](decisions/README.md).

1. **On-device over server inference** ([001](decisions/001-on-device-pose.md)). It is the only option that makes the privacy promise possible.
2. **Vendor MediaPipe** ([002](decisions/002-vendored-mediapipe.md)). Offline, pinned, one origin, and it made the telemetry patch possible.
3. **Two cues for depth** ([003](decisions/003-two-cue-depth-signal.md)). From the front, a 2D projection hides the elbow bend, so shoulder drop against a calibrated arm length carries those views.
4. **Gates, not a tighter threshold** ([004](decisions/004-gates-over-thresholds.md)). Each false rep had a cause; a threshold can't address causes.
5. **Enforce privacy, then write the copy** ([005](decisions/005-privacy-enforced.md)). The library had a telemetry call I hadn't asked for.
6. **Replay real footage in tests** ([007](decisions/007-footage-fixtures.md)). Synthetic poses encoded my assumptions, which were the bugs.

## 5. Measurements, not assumptions

Six public videos and four stress cases, replayed in about a second ([accuracy.md](accuracy.md)):

| | Truth | Counted |
|---|---|---|
| Side-view pushups | 6 | 6 |
| Squats from behind | 2 | 2 |
| Front/oblique pushups, moving camera | ≈ 6–7 | 4 |
| Close-ups, talking, burpees, squats in pushup mode, idle at a desk, walking out of frame | 0 extra | 0 extra |
| Lying flat 3 s mid-set | 6 | 6 |

The full app, running live in Chrome with the side-view video as its camera, counted 6 of 6.

## 6. Bugs, and what found them

- **Counting while I was sitting at the desk.** *Found by me, on a webcam.* MediaPipe returns all 33 landmarks even when your wrists are below the frame, and it guesses them with middling confidence. Jitter in the guesses crossed the depth threshold. *Fix:* joints must be confident **and** inside the frame.
- **Squats counted as pushups.** *Found by me.* From the front, the "must be in a plank" check was skipped, so lowering your body counted. *Fix:* a posture gate that works from any angle, plus the planted-hands rule: in a squat your hands drop with you, in a pushup they don't.
- **A 7th rep from standing up.** *Found by replaying side-view footage live through the app.* Bending down into position briefly looked like a rep. *Fix:* from the side, the torso must be near horizontal.
- **The far hand "moving".** *Found by tracing the counter's state frame by frame on a front-view clip.* At the bottom of a pushup, the far hand hides behind the body. The average of both hands jumped, which read as the hands moving. *Fix:* track each hand separately, and compare only the hands seen in both frames.
- **Slow to pick me up after I lay down.** *Found by me.* A 300 ms dropout wiped the calibration, and confidence flicker kept restarting the "hold the top" timer. *Fix:* keep the calibration through dropouts under 3 s, lock back on in 0.1 s when already calibrated, and give posture a 400 ms grace period. A test recreates it: lying flat 3 s mid-set, 6 of 6 still counted.
- **The coaching message flickering.** *Found by me.* It was rewritten every frame, alternating between two reasons. *Fix:* a message must be stable before it replaces the current one, and stays up for at least 700 ms.
- **Every early measurement was wrong.** *Found because one clip produced zero poses for a clearly visible person.* Headless Chrome doesn't repaint a `<video>` after seeking, so the extractor recorded the first frame hundreds of times. *Fix:* split videos into JPEG frames with ffmpeg and feed them as images. I redid every measurement after that.
- **"Nothing leaves your phone" was false.** *Found by reading the vendored bundle before writing the privacy note.* MediaPipe posts usage statistics every 60 s. *Fix:* patch it off, add a CSP, and verify with a network log.

## 7. What is deliberately not built

- **Friends, guilds, leaderboards, weekly bosses, reminders.** All need a server that knows who you are, and that's the trade I chose not to make.
- **Sync between devices.** Export and import cover backups without an account.
- **More exercises.** Pushups and squats share one design; adding more is a matter of new cues and gates, each with its own fixtures.
- **Server-side anything.** The host serves static files and nothing else.

## 8. Testing strategy

- **`counter.js` is pure.** Landmarks and a timestamp go in, a state comes out. Everything that decides a rep is testable without a browser.
- **Synthetic tests pin the contract:** full reps count, half reps don't, upright arm bends don't, and nobody in frame means nothing counted.
- **Footage tests pin reality:** true counts on real clips, zero on clips that must not count, and stress cases built from real landmarks.
- **Live checks pin the pipeline.** A headless Chrome run feeds a video file as the camera through the real app and checks the rep count and the network log. These ran during development and aren't in the suite, because they need Chrome and take a minute each.

## 9. What this taught me

**Debug the measurement before the system.** The worst bug in this project wasn't in the counter. It was in the tool that measured the counter, and it made a broken counter look fine.

**Every false positive has a cause, and a threshold can't name it.** "Out of frame" and "squatting" both crossed the same number. Fixing them meant asking what was physically different: guessed joints, an upright torso, hands that move. A single number couldn't capture that.

**Read your dependencies before making promises.** The privacy note was nearly shipped with a quiet telemetry call inside it.

**Credit where it's due:** I set the product, the bar and the trade-offs, tested it on my own body and webcam, and found the failures above. The code, test harness and these docs were written with AI assistance (Claude). Then everything was checked against real footage, a live camera and a network log before it was called done.
