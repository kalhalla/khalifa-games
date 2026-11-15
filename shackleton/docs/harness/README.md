# Shackleton test and trailer harness

Not published (shackleton/docs is in .assetsignore).

## Setup (new sandbox)
```
mkdir h && cd h && npm init -y && npm i three@0.187.0 puppeteer-core
mkdir root && cp -r <repo>/shackleton <repo>/assets root/
mkdir root/vendor && ln -s $PWD/node_modules/three root/vendor/three
sed -i 's#https://cdn.jsdelivr.net/npm/three@0.187.0/#/vendor/three/#g' root/shackleton/index.html
(cd root && python3 -m http.server 8765 &)
cp <repo>/shackleton/docs/harness/* . ; mkdir -p tr && cp <repo>/shackleton/docs/harness/tr/* tr/
```

## film.js
`node film.js <out> <setup.json> [shots.json]` (env VW, VH, ONLY, STILLS=auto|none|list).
Setup steps: `{waitload}`, `{wait}`, `{key}`, `{eval}`, `{shot}`. Shots: `{name, frames, pre, js}`; `js` runs once per frame.

## Rules learnt the hard way
- **Virtual clock.** setupB/C replace `performance.now` with a clock that advances 1/30 s per `frame()`.
  Robot idle sway, strain tremble, gait flag, cue timers and wreck lights read the wall clock;
  a filmed frame takes ~2–4 s of wall time, so without this the robots appear to vibrate.
- **Never pin robots** (`rs.scripted`, heading, state) per frame. Place once in `pre`, then let the minds run.
  Track them with the smoothed `__T(key, vec, alpha)` camera helper.
- `__shoot(pos, look)` steps one frame, moves the camera, re-runs `updateSuitLamp()` (the glare is camera-relative), renders.
- Dev sprites (robot mind tags, wreck labels) are removed in setup; `interactMarker` hidden per shot.
- Fast robot gait (escort jog, 1.3 m/s) bobs ~8.5 Hz: buzzy at 30 fps. Keep robots near walking pace in close shots.
- Headless Chrome never decodes audio.

## Trailer
`render.sh` films everything at 1920×1080 (~4 s/frame, ~1 h). `edit.py` cuts it with the captions in `cap/`
(PNG overlays, 1920×1080) and the cue from `trailer_cue_compose.py`.
