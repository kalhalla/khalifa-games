# Shackleton — handover (read this first)

Last updated 17 Nov 2026, at **v0.24.0** (preview; live is v0.23.5). This file supersedes the older handoff docs for **build state**. For story, use `SCRIPT.md` and `MEMORY_SPEC.md`. For systems, use the design docs in this folder.

## Where things are

- **Repo:** `kalhalla/khalifa-games`, folder `shackleton/`. The game is one file, `index.html` (about 17.5k lines). Alongside it: `lunar-terrain.js`, `o2-panel.js`, `assets/` (robots, music).
- **Live:** khalifa.games/shackleton, at **v0.23.5** since 17 Nov (merge 7fc1b9c). Built by Cloudflare Workers Builds from `main`. Branch commits always fail the Workers check; that's normal. Only `main` matters.
- **Preview:** branch `stage1-pipeline`, built by Vercel: https://khalifa-games-git-stage1-pipeline-khalifa-sabers-projects.vercel.app/shackleton/
- **URL switches:**
  - `?debug`: `window.__shk(src)` evaluates inside the game closure; `window.__step(n, dt)` advances in fixed steps. Robots show their intention, state and affinity.
  - `?debug&colliders` draws the box colliders.
  - `?nominds` turns the robot minds off.
  - `?wreck2=in` starts inside the wreck.

## Rules (Khal's)

- Push to `stage1-pipeline` only. Merge to `main` only when Khal says "push live".
- Read the file before editing. Use exact-match edits.
- After every edit, run the parse check (below).
- Bump `BUILD_VERSION` on every build.
- Never ship geometry without checking it in a render or numerically.
- Commits end with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: <session link>
  ```
- Khal's email is private.
- Music must be original, never a copy of a real score.
- UK English. Short replies; he reads on a phone.
- Exterior walking, running and jumping were approved at v0.10.7. Don't change the outdoor stride unless asked.

**Parse check:**
```
awk 'BEGIN{n=0} /^<script type="module">$/{n++} n==3' index.html | sed '1d' | sed '/^<\/script>$/,$d' > /tmp/game.js && node --check /tmp/game.js
```

## Version history (all live since 15 Nov 2026, merge `16a0ad7`)

| Version | What |
|---|---|
| v0.19.1 | KHAL hull lettering; wreck interior dressed; original music loop |
| v0.20.0 | Airlock replaces the breach (outer hatch → chamber → inner hatch) |
| v0.20.1 | Red light in unpowered rooms; life support goes white when fixed; lit boards |
| v0.21.0 | Puzzles v2: brace as a load puzzle with M-08; ice pocket as a light puzzle |
| v0.21.1–3 | M-08 lifting pose; rough ridge boulders; prop prompt fix; collision (props, head bump, robots); pickup animation |
| v0.22.0 | Robot minds, stage 1 |
| v0.22.1 | Devotion; suit O₂ warnings at 20% and 10% |
| v0.22.2 | L-07's spare O₂ bottle |
| v0.22.3 | Shadow acne fix (the flicker on the hull and robots) |
| **v0.24.0** | **Preview only.** Rescue climb. (1) Jump height now depends on speed (`jumpVelocityFor`): 2.3 m/s standing or at a slow walk (apex about 1.5 m), ramping to the old 3.0 at the jog. (2) Stack steps lowered from 1.2 m to 0.9 m rise (top at 3.6 m) and step 3 and the top enlarged to close 0.4–0.6 m gaps; measured take-off window at a walk is about 0.9–2.5 m from the next face, and a jog works from 1.5–4.5 m. (3) P-03 moved to the top's east edge (faces the wreck and the sun), nearly upright between two small rocks, with a double-flash strobe (`rescue.strobe`). (4) Signposting: objective `RESCUE_OBJ`, a suit call-out and L-07 pointing once he stands, and a waypoint chip (`#waypoint`, `_rescueWaypoint`) that tracks P-03, then `climb 1..3`, then P-03. Not tested: the free-P-03 interaction at its new position, and a full playthrough. |
| **v0.23.5** | **Live since 17 Nov (merge 7fc1b9c).** (1) Carry pose: the reach gesture's arm-aim helper had the same name (`_aimBone`) as the seated pose's helper, which takes a direction; the later declaration won, so since v0.5.1 every reach aimed the arms along the target's world position (arms out sideways). Renamed `_reachAim`. Deck plates are now carried level, long side across, hands on the near edge (`carry.flat`, `carry.grip`, `carry.yawOff` in `updateCarry`). (2) Door-frame shimmer: bulkhead posts were added twice and their faces were coplanar with the bulkhead's cut edge; airlock frames likewise. Posts now stand 2–3 cm proud. (3) Flight deck collision: the big boards (flight, life support) get a plinth and a collider; the slot behind the radio console is filled. Found, not changed: the stabiliser housing in life support has no collider. |
| **v0.23.4** | **Live since 16 Nov.** (1) Collision pass: the starship hull and nose are box colliders (`hullColliders`, tag `'hull'`, x 6.6–44.6, stepped to the nose profile; disabled while `airlockLock`/`airlockDrive` so the hatch walk works). O₂ tanks box (`'o2tanks'`), station crates (`'stationCrates'`), Flyer body box (`flyerBodyCollider`, walking only, hx 2.0 so the brace mount stays reachable). Walk-in tests stop him at surface + 0.35 m on every face. (2) Slow rise from the seat at the tanks (`seatRise`): 1.1 s holding still whatever the stick does, then speed ramps in over 0.8 s. (3) Boulder contact shadows: dark ring decals (`boulderContacts`, one InstancedMesh, +0.1 m because the ground mesh sits up to ~4 cm above the analytic height) and a base-darkening band on floor boulders (`boulderFloorMat`). The pale sliver is shadow-map resolution at the contact; deeper burial wouldn't fix it. |
| **v0.23.3** | **Live since 16 Nov.** Shadow contact gap ("gap at the bottom of the boulders", from v0.22.3's acne fix): sun shadow depth range 0.5–600 → 20–420, bias −0.0004 → −0.00003, normalBias 0.03 → 0.01. Contact gap ~30 cm → ~4 cm. Khal to check on his phone that the hull/robot flicker hasn't come back. |
| **v0.23.2** | **Live since 16 Nov.** Bug fix: the robot GLB was fitted to the procedural robot's box *including sprites*; with `?debug` the mind label (y 1.9) made robots ~2 m. Only `?debug` was affected (so every harness render and trailers v1–v3), not normal play. Now measured from meshes only: robots ~1.15–1.2 m. |
| **v0.23.1** | **Live since 16 Nov.** Wreck interior: ambient 0.55 → 0.32, room lights × `WL_LIGHT_K` (0.5), wall lamps with additive light pools (no extra real lights), dark haze in the wreck (fog swapped on entry/exit), large hull plates instead of the tile grid, softer grating, ribs and stringers |
| **v0.23.0** | **Live since 16 Nov.** Robot minds stage 2: sight, investigate, inspect the Flyer, remembered places, affinity from helping. See `ROBOT_MINDS.md` |

## Key systems and where they live in `index.html`

- **Music:** `updateMusic()`; `assets/music/shackleton_theme.mp3` (128 s loop, level 0.30, ×0.7 in the wreck, silent in memories and the demo end).
- **Airlock:** `airlockCycle` IIFE. Globals `airlockLock`, `airlockDrive`, `aimLock`, `puzzleHintFns`. Camera override `camFor`.
- **Wreck lighting and boards:** `wreckBoards` IIFE; `wreckLevel.lsLight`.
- **Brace puzzle:** `braceV2` IIFE. See `PUZZLES_V2.md`.
- **Ice pocket puzzle:** `iceV2` IIFE. See `PUZZLES_V2.md`.
- **Collision:** `boxResolvePlayer` (head bump, grounded-only step-up, adds `BOX_PLAYER_R` 0.35), `robotResolvePlayer` (radius 0.42), `wreckPropColliders` (tag `'wreckProps'`). Exterior: `hullColliders`, `flyerBodyCollider`, `'o2tanks'`, `'stationCrates'` (v0.23.4). Robots don't use the player's box colliders yet.
- **Pickup pose:** `_pickupPose`, `reach.crouch`.
- **Robot minds:** `robotMinds` IIFE after `ROBOT_NAMES`. See `ROBOT_MINDS.md`.
- **O₂ warnings:** `_o2Warnings(dt)`, `#o2-warn`, `#o2-edge`.
- **Shadows:** about line 796. Sun bias −0.00003, normalBias 0.01, depth range 20–420 (v0.23.3). Sun at 17° (`SUN_ELEV_DEG`), PCFSoft, 4096 map, follows him ±90 m.
- **Robot indices:** `robots[0]` = P-03 (blue), `[1]` = L-07 (yellow), `[2]` = M-08 (red).

## Test harness (rebuild in a new sandbox)

The sandbox can't reach CDNs, so use a local harness:
- `npm i three@0.187.0 puppeteer-core`.
- Copy `shackleton/` and the root `assets/` into a `root/` folder. Rewrite the import-map URLs to a local copy of `three/build` and `examples/jsm`.
- Serve with `python3 -m http.server`.
- Drive headless Chrome with `--use-gl=swiftshader --enable-unsafe-swiftshader`.
- Load `?debug`. Wait for loading to finish before pressing Enter. Run the opening with `__step(1300)`, then teleport, act and screenshot.
- Swiftshader runs at 2–4 fps; use `__step` for anything timed. Set `keys['w']`, not `input.forward`.
- Headless Chrome never decodes audio.
- The stabiliser uses a real-time 900 ms `setTimeout`, so wait 4 s after the drops.
- Regression scripts used: full chain, wrong-then-right brace, ice puzzle by prompts, rescue, O₂ warnings, bottle, minds, collision. They lived in `/tmp` and are lost with the sandbox; rewrite from the puzzle docs.
- **Since 15 Nov the filming harness is saved in `shackleton/docs/harness/`** (film.js, shot setups, captions, edit and cue scripts; see its README). Its setups run the page on a virtual clock: robot sway, gait flag, cue timers and wreck lights read `performance.now()`, so filming on the wall clock (2–4 s per frame) made the robots look like they vibrate.

## Open, in rough order

0. **Playtest readiness (17 Nov):** see the claude.ai doc "Shackleton: playtest readiness review". Five blockers before outside testers: a scripted full run saved in the repo, saved progress (no localStorage yet), feedback capture and a beat log, a device check beyond Khal's iPhone, and the rescue climb's landing marker and bigger landing areas (not found in the code). Note: item 5 below is out of date; the demo ending (`updateDemoEnd`, `#demo-end`) is built.

1. **Khal:** test v0.23.5 on the preview (carry a deck plate, door frames, flight console), then "push live". Also on live v0.23.4: shadows meet feet and boulders, no hull flicker (aim mode on the stick, the robot tones, music, airlock sounds, the wrist pad, frame rate with the extra lights).
2. ~~Trailer re-shoot at 1080p.~~ **Done 15 Nov (trailer v2):** 28.5 s, 1920×1080, 30 fps, H.264 + AAC, 8.7 Mbps. Robots run free; the breach is replaced by the airlock (outside, then the chamber) and the life-support power-up. Order: wake → L-07 → wreck → walk with robots → M-08 → airlock out → chamber → power-up → radio → ice → Earth → "...Elias?" → title. Sent to Khal, not in the repo (31 MB). Vibration cause: the wall clock in the harness (fixed), plus a real one: robot stride rate scales linearly with speed, so at the escort jog (1.3 m/s) the body bobs ~8.5 Hz. Offered to Khal as a gait fix; not changed.
2b. **Trailer v3 (15 Nov):** 28.5 s, 1080p. Robots were filmed ~1.7× too big in v1–v3 because of the `?debug` fit bug fixed in v0.23.2. Measure robot size by rendered pixels (side-on orthographic), never Box3. Adds quick puzzle cuts (stabiliser panel, brace lift with M-08, rescue jump) under "REBUILD A WAY HOME.", the ice beam ("FIND WATER.") and the relit interior. Shots: `docs/harness/tr/shots*3.json`, edit `edit3.py`.
2c. **Trailer v4 (16 Nov), the story cut:** 47.6 s, 1080p, robots at true size. Radio static ("…Shackleton… Elias? …respond…") → YOU WAKE ON THE MOON → YOUR SHIP CAME DOWN HARD → YOU DON'T REMEMBER WHO YOU ARE → THREE ROBOTS KEPT YOU ALIVE → airlock and power → memory flash (M01 lines) / PIECES COME BACK → broken Flyer + Michel M04 ("Do not attempt launch…") / THE FLYER IS YOUR WAY HOME. IT'S BROKEN. → puzzle cuts / REBUILD IT, PIECE BY PIECE → Earth + "If you can hear me… key your mic." → WHO ARE YOU? / WHY ARE YOU HERE? / HOW DO YOU GET HOME? → title. New 49 s cue (`trailer_v4_cue_compose.py`, audio starts 0.8 s in). Files: `edit4.py`, `render4.sh`, `tr/shots*4.json`, `cap4/`.
3. ~~Robot minds, stage 2~~ **Built in v0.23.0 on the preview** (15 Nov). Khal to try it, then "push live". Next: stage 3 (robot-to-robot moments, job-site props).
4. Tune the bottle (15% vs 10%) after Khal plays it.
5. The demo ending (ice memory, then Michel's cut-off warning, then a "3 parts missing" card with the wishlist prompt). Decided 13 Nov, not built.
6. Older items: knee joints, close-up brace panel, sound pass, a spectacle beat, Mixamo clips.
7. **Khal:** Steamworks account and fee, the name check, Next Fest registration (February Next Fest closes 10 Jan 2027). See `STEAM_PAGE.md`.

## Docs in this folder

| File | What |
|---|---|
| `HANDOVER.md` | This file |
| `SCRIPT.md` | Full story script (canon) |
| `MEMORY_SPEC.md`, `memory_fragments.js` | Memory fragment system and data |
| `ROBOT_MINDS.md` | Robot AI design and build status |
| `PUZZLES_V2.md` | Brace and ice pocket puzzles |
| `RADIO_PLAN.md` | Helmet radio and wrist-pad questions |
| `WRECK_PLAN.md` | Wreck interior plan and room order |
| `STEAM_PAGE.md` | Steam store kit |

The same docs, plus the older day-by-day handoff notes (12–14 Nov), are kept in the claude.ai project "Shackleton - Luner settlement game". This folder is excluded from the live site by `.assetsignore`, so the script isn't public.
