// lunar-terrain.js
// Shared with Shackleton (khalifa.games/shackleton), which uses createHeightfield
// for its crater floor. One addition for that: `baseScale` (default 1, so MASCON
// output is unchanged) scales the broad rolling ground under the craters.
//
// MASCON lunar south-pole terrain generator, extracted from the live build
// (khalifa.games/mascon) and rewritten as a standalone ES module.
//
// Units are metres, Y up. The playable area is a square `size` metres wide
// centred on the origin; a sinh-spaced backdrop carries the ground out to the
// horizon, with real lunar curvature, distant crater fields and mountains.
//
// With the default options the output is identical to MASCON's terrain.
// Change `seed` for a different world with the same character.
//
//   import * as THREE from 'three';
//   import { createLunarTerrain } from './lunar-terrain.js';
//   const terrain = createLunarTerrain({ seed: 7 });
//   scene.add(terrain.mesh, terrain.backdrop);
//   const y = terrain.heightAt(x, z);
//
// Requires three.js r150+ and a browser (textures are drawn on <canvas>).
// The pure heightfield (`createHeightfield`) has no DOM or three.js dependency
// and also runs in Node or a Web Worker.

import * as THREE from 'three';

export const DEFAULTS = {
  seed: 0,

  // Playable mesh
  size: 320,            // metres per side
  meshRes: 320,         // grid cells per side (≈1 m)
  cacheRes: 400,        // height lookup grid, cells per side
  cacheBound: 200,      // lookup grid covers ±cacheBound metres

  // Flat landing pad at the origin: fully flat inside `radius`,
  // blended to natural ground over `blend` metres.
  pad: { radius: 10, blend: 10 },

  // Dark, smooth mare basalt patches (low albedo, iron-rich in MASCON).
  maria: [{ x: -78, z: 46, r: 82 }, { x: 96, z: -92, r: 64 }],

  // Hand-placed craters: [x, z, radius, kind]. kind: fresh | mature | degraded
  landmarks: [[60, 70, 34, 'mature'], [-118, -88, 40, 'mature'], [118, 40, 22, 'fresh']],

  // Big craters on the edge of the map: [angle (rad), distance, radius]
  rim: [[0.4, 215, 70], [1.6, 240, 85], [2.7, 205, 60], [3.7, 250, 90], [4.6, 220, 65], [5.6, 235, 75]],

  // Random crater populations
  craters: [
    { count: 18,  spread: 300, clear: 34, rMin: 6,   rMax: 20,  fresh: 0.22, mature: 0.43 },
    { count: 70,  spread: 310, clear: 20, rMin: 1.6, rMax: 5.2, fresh: 0.25, mature: 0.40 },
    { count: 120, spread: 310, clear: 13, rMin: 0.7, rMax: 1.7, fresh: 0.12, mature: 0.38 },
  ],

  // Smooth fine-dust patches (also the floors of degraded craters)
  dust: { first: { x: 22, z: 26, r: 13 }, count: 11, rMin: 30, rMax: 140, sizeMin: 8, sizeMax: 24 },

  // Direction Earth hangs in (x, z). The distant mountain ring leaves a gap
  // here so Earth sits over a low horizon.
  earthDir: [-170, 180],

  // MASCON's mass-driver corridor: a long, gently falling, cleared strip of
  // far terrain running towards Earth. Off for other games.
  railCorridor: false,

  // Horizon backdrop
  backdrop: { extent: 16000, res: 420, curvature: true },

  moonRadius: 1737400,

  // Scale on the broad rolling ground (baseAt). 1 = MASCON. Shackleton
  // uses less: its crater floor already has its own swells.
  baseScale: 1,
};

// ---------------------------------------------------------------- helpers
const smooth = (t) => t * t * (3 - 2 * t);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function mulberry(seed) {
  return function () {
    seed = (seed + 1831565813) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Integer lattice hash → [0, 1). The seed shifts the lattice, so seed 0
// reproduces MASCON exactly.
function makeHash(seed) {
  const ox = seed ? (seed * 7919) % 100003 : 0;
  const oz = seed ? (seed * 104729) % 100019 : 0;
  return (x, z) => {
    let n = (x + ox) * 374761393 + (z + oz) * 668265263;
    n = (n ^ (n >>> 13)) * 1274126177;
    n ^= n >>> 16;
    return ((n >>> 0) % 1e5) / 1e5;
  };
}

const CRATER_KINDS = {
  //          depth/diam  bowl power  rim height  inner rim width  outer ejecta width
  fresh:    { d: 0.20, p: 2,   rim: 0.24,  wi: 0.09, wo: 0.32 },
  mature:   { d: 0.12, p: 2.5, rim: 0.12,  wi: 0.17, wo: 0.48 },
  degraded: { d: 0.05, p: 2,   rim: 0.035, wi: 0.32, wo: 0.70 },
};
const FAR_BIG = { d: 0.065, p: 2.2, rim: 0.16, wi: 0.16, wo: 0.55 };

// ------------------------------------------------------- pure heightfield
export function createHeightfield(options = {}) {
  const o = { ...DEFAULTS, ...options };
  const seed = o.seed | 0;
  const hash = makeHash(seed);

  // value noise, smoothstep-interpolated
  const vnoise = (x, z) => {
    const xi = Math.floor(x), zi = Math.floor(z);
    const sx = smooth(x - xi), sz = smooth(z - zi);
    const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
    return (a * (1 - sx) + b * sx) * (1 - sz) + (c * (1 - sx) + d * sx) * sz;
  };
  const fbm = (x, z, octaves = 4, freq = 0.04) => {
    let sum = 0, amp = 1, norm = 0;
    for (let i = 0; i < octaves; i++) { sum += vnoise(x * freq, z * freq) * amp; norm += amp; amp *= 0.5; freq *= 2; }
    return (sum / norm - 0.5) * 1.6;
  };

  // ---- maria: 0 (highland) … 1 (mare), with wobbly edges
  const mareAt = (x, z) => {
    const wx = x + (vnoise(x * 0.03 + 11, z * 0.03) - 0.5) * 34;
    const wz = z + (vnoise(x * 0.03, z * 0.03 + 7) - 0.5) * 34;
    let m = 0;
    for (const p of o.maria) {
      const d = Math.hypot(wx - p.x, wz - p.z) / p.r;
      m = Math.max(m, 1 - smooth(clamp((d - 0.78) / 0.32, 0, 1)));
    }
    return m;
  };

  // ---- craters
  const craters = [];
  (function () {
    const rnd = mulberry(1337 + seed);
    const add = (cx, cz, radius, kind, far = false) => {
      const k = CRATER_KINDS[kind];
      craters.push({
        cx, cz, radius, kind, far, k,
        depth: k.d * radius * 2 * (0.8 + rnd() * 0.4),
        rimMul: far ? 2.6 : 1,
        ph: rnd() * 6.28, ph2: rnd() * 6.28, ph3: rnd() * 6.28,
        a1: 0.04 + rnd() * 0.08, a2: 0.02 + rnd() * 0.05, a3: 0.01 + rnd() * 0.03,
      });
    };
    const pickKind = (fresh, mature) => { const r = rnd(); return r < fresh ? 'fresh' : r < fresh + mature ? 'mature' : 'degraded'; };
    for (const [x, z, r, kind] of o.landmarks) add(x, z, r, kind);
    for (const [ang, dist, r] of o.rim) add(Math.cos(ang) * dist, Math.sin(ang) * dist, r, rnd() < 0.4 ? 'fresh' : 'mature', true);
    for (const pop of o.craters) {
      for (let i = 0; i < pop.count; i++) {
        const x = (rnd() - 0.5) * pop.spread, z = (rnd() - 0.5) * pop.spread;
        if (Math.hypot(x, z) < pop.clear) { i--; continue; }
        add(x, z, pop.rMin + rnd() * (pop.rMax - pop.rMin), pickKind(pop.fresh, pop.mature));
      }
    }
  })();

  // Crater height contribution: parabolic bowl, raised rim, ejecta apron,
  // with a wobbly (non-circular) outline from three harmonics.
  const craterAt = (x, z, c) => {
    const dx = x - c.cx, dz = z - c.cz, k = c.k;
    const reach = c.radius * (1 + k.wo * 2.6);
    if (Math.abs(dx) > reach || Math.abs(dz) > reach) return 0;
    const d2 = dx * dx + dz * dz;
    if (d2 > reach * reach) return 0;
    const ang = Math.atan2(dz, dx);
    const wob = 1 + c.a1 * Math.sin(ang * 3 + c.ph) + c.a2 * Math.sin(ang * 7 + c.ph2) + c.a3 * Math.sin(ang * 13 + c.ph3);
    const u = Math.sqrt(d2) / (c.radius * wob);
    const rim = k.rim * c.rimMul * c.depth;
    return u < 1
      ? -c.depth * (1 - u ** k.p) + rim * Math.exp(-(((u - 1) / k.wi) ** 2))
      : rim * Math.exp(-(((u - 1) / k.wo) ** 2));
  };

  // ---- broad rolling ground
  const baseAt = (x, z) => ((vnoise(x * 0.011 + 5.3, z * 0.011 - 2.1) - 0.5) * 7.5 + (vnoise(x * 0.028 - 8, z * 0.028 + 9) - 0.5) * 2.6) * o.baseScale;

  // ---- rockiness: crater rims, ejecta, scattered blocky fields (0…1)
  const rockAt = (x, z) => {
    let r = 0;
    for (const c of craters) {
      if (c.kind === 'degraded' || c.radius < 1.6) continue;
      const dx = x - c.cx, dz = z - c.cz, s = c.radius * 1.7;
      if (dx > s || dx < -s || dz > s || dz < -s) continue;
      const u = Math.hypot(dx, dz) / c.radius, w = c.kind === 'fresh' ? 1 : 0.55;
      r = Math.max(r, w * Math.exp(-(((u - 1) / (c.kind === 'fresh' ? 0.28 : 0.2)) ** 2)));
    }
    const field = vnoise(x * 0.05 + 17, z * 0.05 - 31);
    const awayFromPad = smooth(clamp((Math.hypot(x, z) - 32) / 16, 0, 1));
    r = Math.max(r, smooth(clamp((field - 0.68) / 0.14, 0, 1)) * 0.55 * (1 - mareAt(x, z)) * awayFromPad);
    return clamp(r, 0, 1);
  };

  // ---- fine dust patches (0…1): smooth, slightly sunken ground
  const dustPatches = [];
  (function () {
    const rnd = mulberry(4711 + seed);
    if (o.dust.first) dustPatches.push({ ...o.dust.first });
    for (let i = 0; i < o.dust.count; i++) {
      const a = rnd() * Math.PI * 2, d = o.dust.rMin + rnd() * (o.dust.rMax - o.dust.rMin);
      dustPatches.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, r: o.dust.sizeMin + rnd() * (o.dust.sizeMax - o.dust.sizeMin) });
    }
  })();
  const dustAt = (x, z) => {
    let d = 0;
    for (const p of dustPatches) {
      const dx = x - p.x, dz = z - p.z;
      if (Math.abs(dx) > p.r * 1.5 || Math.abs(dz) > p.r * 1.5) continue;
      const wob = 1 + (vnoise(x * 0.12 + p.x, z * 0.12 + p.z) - 0.5) * 0.5;
      d = Math.max(d, 1 - smooth(clamp((Math.hypot(dx, dz) / (p.r * wob) - 0.7) / 0.35, 0, 1)));
    }
    for (const c of craters) {
      if (c.kind !== 'degraded' || c.radius < 2.5) continue;
      const dx = x - c.cx, dz = z - c.cz;
      if (Math.abs(dx) > c.radius || Math.abs(dz) > c.radius) continue;
      d = Math.max(d, 0.85 * (1 - smooth(clamp((Math.hypot(dx, dz) / c.radius - 0.45) / 0.4, 0, 1))));
    }
    return clamp(d, 0, 1);
  };

  // ---- near-field height (no pad)
  const naturalAt = (x, z) => {
    const m = mareAt(x, z);
    const base = baseAt(x, z) * (1 - 0.45 * m) - 1.6 * m; // maria sit lower and smoother
    let h = base + (vnoise(x * 0.1 + 3, z * 0.1 - 7) - 0.5) * 0.4 * (1 - 0.6 * m);
    for (const c of craters) h += craterAt(x, z, c);
    const rock = rockAt(x, z);
    if (rock > 0.02) h += rock * ((vnoise(x * 0.85 + 41, z * 0.85 - 13) - 0.5) * 0.55 + (vnoise(x * 2.1, z * 2.1 + 5) - 0.5) * 0.18);
    const dust = dustAt(x, z);
    if (dust > 0.01) {
      const settled = Math.min(h, base - 0.15) * 0.5 + (base - 0.15) * 0.5;
      h = h * (1 - dust) + settled * dust;
    }
    return h;
  };

  const padHeight = (() => {
    let s = 0;
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; s += naturalAt(Math.cos(a) * 8, Math.sin(a) * 8); }
    return s / 16;
  })();

  // ---- exact near-field height (slow; prefer heightAt)
  const exactHeightAt = (x, z) => {
    const p = smooth(clamp(1 - (Math.hypot(x, z) - o.pad.radius) / o.pad.blend, 0, 1));
    return p >= 1 ? padHeight : naturalAt(x, z) * (1 - p) + padHeight * p;
  };

  // ---- far field: horizon craters, ridged mountains, optional rail corridor
  const ed = Math.hypot(o.earthDir[0], o.earthDir[1]);
  const earth = { x: o.earthDir[0] / ed, z: o.earthDir[1] / ed };
  const alongEarth = (x, z) => ({ s: x * earth.x + z * earth.z, q: Math.abs(x * earth.z - z * earth.x) });
  const farCraters = [], mountains = [];
  (function () {
    const rnd = mulberry(90210 + seed);
    const earthAng = Math.atan2(earth.z, earth.x);
    const add = (cx, cz, radius, k) => farCraters.push({
      cx, cz, radius, k, rimMul: 1,
      depth: k.d * radius * 2 * (0.8 + rnd() * 0.4),
      ph: rnd() * 6.28, ph2: rnd() * 6.28, ph3: rnd() * 6.28,
      a1: 0.03 + rnd() * 0.06, a2: 0.02 + rnd() * 0.04, a3: 0.01 + rnd() * 0.02,
    });
    for (let tries = 0, placed = 0; placed < 34 && tries < 400; tries++) {
      const a = rnd() * Math.PI * 2, dist = 700 + rnd() ** 0.8 * 11000, r = 90 + rnd() ** 2.2 * 1300;
      const x = Math.cos(a) * dist, z = Math.sin(a) * dist, { s, q } = alongEarth(x, z);
      if (dist - r * 1.6 < 450) continue;
      if (o.railCorridor && s > -r && s < 4800 + r && q < 520 + r * 1.6) continue;
      add(x, z, r, r > 500 ? FAR_BIG : rnd() < 0.5 ? CRATER_KINDS.mature : CRATER_KINDS.degraded);
      placed++;
    }
    for (let i = 0; i < 9; i++) {
      const s = 450 + rnd() * 3600, q = (rnd() - 0.5) * 360, r = 18 + rnd() * 45;
      add(earth.x * s + earth.z * q, earth.z * s - earth.x * q, r, CRATER_KINDS.degraded);
    }
    for (let tries = 0, placed = 0; placed < 6 && tries < 100; tries++) {
      const a = rnd() * Math.PI * 2;
      if (Math.abs(Math.atan2(Math.sin(a - earthAng), Math.cos(a - earthAng))) < 0.75) continue; // keep Earth's horizon low
      const dist = 6500 + rnd() * 7000;
      mountains.push({
        x: Math.cos(a) * dist, z: Math.sin(a) * dist,
        r: 1400 + rnd() * 2200, h: 260 + rnd() * 620,
        ax: a + (rnd() - 0.5) * 1.2, st: 1.3 + rnd() * 1.2, ph: rnd() * 50,
      });
      placed++;
    }
  })();

  const mountainsAt = (x, z) => {
    let h = 0;
    for (const m of mountains) {
      const dx = x - m.x, dz = z - m.z;
      if (Math.abs(dx) > m.r * 1.8 || Math.abs(dz) > m.r * 1.8) continue;
      const c = Math.cos(m.ax), s = Math.sin(m.ax);
      const u = (dx * c + dz * s) / m.r, v = ((-dx * s + dz * c) / m.r) * m.st;
      const d = (u * u + v * v) * (1 + (vnoise(x * 0.0011 + m.ph, z * 0.0011) - 0.5) * 0.7);
      if (d > 3.2) continue;
      const ridge = 1 - Math.abs(vnoise(x * 0.0016 + m.ph, z * 0.0016 - m.ph) * 2 - 1);
      h += m.h * Math.exp(-d * 1.6) * (0.65 + 0.45 * ridge);
    }
    return h;
  };

  const corridorAt = (x, z) => {
    const { s, q } = alongEarth(x, z);
    return (1 - smooth(clamp((q - 240) / 340, 0, 1))) * smooth(clamp((s - 60) / 170, 0, 1)) * (1 - smooth(clamp((s - 4300) / 1900, 0, 1)));
  };

  const farHeightAt = (x, z) => {
    let h = baseAt(x, z) * 1.3;
    for (const c of craters) if (c.radius > 15) h += craterAt(x, z, c);
    const r = Math.hypot(x, z), rough = smooth(clamp((r - 320) / 1500, 0, 1));
    if (rough > 0) h += rough * (fbm(x, z, 4, 0.00055) * 70 + (vnoise(x * 0.0024 + 7, z * 0.0024 - 3) - 0.5) * 18);
    if (o.railCorridor) {
      const w = corridorAt(x, z);
      if (w > 0) {
        const { s } = alongEarth(x, z);
        const bed = padHeight - 3.2 - 0.0011 * s + (vnoise(x * 0.006 + 3, z * 0.006 - 1) - 0.5) * 1.4 + baseAt(x, z) * 0.1;
        h = h * (1 - w) + bed * w;
      }
    }
    for (const c of farCraters) h += craterAt(x, z, c);
    if (r > 4000) h += mountainsAt(x, z);
    return h;
  };

  // Drop due to the Moon's curvature beyond the playable square.
  const curvatureDrop = (x, z) => Math.max(0, x * x + z * z - (o.size / 2) ** 2) / (2 * o.moonRadius);

  // ---- cached bilinear lookup for the playable area (fast)
  const R = o.cacheRes, B = o.cacheBound, STEP = (B * 2) / R;
  const cache = new Float32Array(R * R);
  for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) cache[j * R + i] = exactHeightAt(-B + i * STEP, -B + j * STEP);

  const heightAt = (x, z) => {
    const fx = (x + B) / STEP, fz = (z + B) / STEP, i = Math.floor(fx), j = Math.floor(fz);
    if (i < 0 || j < 0 || i >= R - 1 || j >= R - 1) return exactHeightAt(x, z);
    const u = fx - i, v = fz - j;
    const a = cache[j * R + i], b = cache[j * R + i + 1], c = cache[(j + 1) * R + i], d = cache[(j + 1) * R + i + 1];
    return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
  };

  // Height anywhere, blending the playable area into the far field.
  const heightAtAny = (x, z) => {
    const half = o.size / 2, m = Math.max(Math.abs(x), Math.abs(z));
    if (m < half - 2) return heightAt(x, z);
    const w = smooth(clamp((m - half) / 120, 0, 1));
    return (w < 1 ? exactHeightAt(x, z) * (1 - w) : 0) + farHeightAt(x, z) * w - 0.06 - curvatureDrop(x, z);
  };

  // Surface normal into `out` (any object with set(x,y,z) and normalize()).
  const normalAt = (x, z, out) => {
    const e = 0.6, dx = heightAt(x + e, z) - heightAt(x - e, z), dz = heightAt(x, z + e) - heightAt(x, z - e);
    return out.set(-dx, 2 * e, -dz).normalize();
  };

  // Is the sun visible from (x, z)? `sunDir` is a unit vector towards the sun.
  // Ray-marches the heightfield; used for solar panels and permanent shadow.
  const sunVisible = (x, z, sunDir, eyeHeight = 1.2) => {
    const y0 = heightAt(x, z) + eyeHeight;
    for (let t = 1.5; t < 160; t += 1.5) {
      const y = y0 + sunDir.y * t;
      if (y > 40) return true;
      if (y < heightAt(x + sunDir.x * t, z + sunDir.z * t)) return false;
    }
    return true;
  };

  // Ground brightness 0.22…0.86: highland bright, mare dark, fresh crater rays.
  const albedoAt = (x, z) => {
    const m = mareAt(x, z);
    let a = 0.6 * (1 - m) + 0.37 * m;
    a += (vnoise(x * 0.03 + 31, z * 0.03 - 17) - 0.5) * 0.1 + (vnoise(x * 0.09, z * 0.09) - 0.5) * 0.05;
    for (const c of craters) {
      if (c.kind === 'degraded') continue;
      const dx = x - c.cx, dz = z - c.cz, s = c.radius * (c.kind === 'fresh' ? 3 : 1.8);
      if (dx > s || dx < -s || dz > s || dz < -s) continue;
      const u = Math.hypot(dx, dz) / c.radius;
      if (c.kind === 'fresh') {
        a += 0.11 * Math.exp(-(((u - 1.05) / 0.28) ** 2));
        if (u > 1.2 && u < 3 && c.radius > 3) a += 0.05 * Math.max(0, Math.sin(Math.atan2(dz, dx) * 7 + c.ph)) ** 3 * (1 - (u - 1.2) / 1.8); // ray streaks
      } else a += 0.035 * Math.exp(-(((u - 1.05) / 0.25) ** 2));
    }
    const dust = dustAt(x, z), rock = rockAt(x, z);
    a += dust * 0.035 - dust * (vnoise(x * 0.09, z * 0.09) - 0.5) * 0.04;
    a += rock * ((hash(Math.floor(x * 0.9 + 3), Math.floor(z * 0.9 - 7)) - 0.5) * 0.09 + 0.02);
    return clamp(a, 0.22, 0.86);
  };

  return {
    options: o, hash, vnoise, fbm,
    heightAt, heightAtAny, exactHeightAt, farHeightAt, normalAt, sunVisible,
    mareAt, isMare: (x, z) => mareAt(x, z) > 0.5, rockAt, dustAt, albedoAt, curvatureDrop,
    craters, farCraters, mountains, padHeight,
  };
}

// ------------------------------------------------------ textures (canvas)
function tileableNoise(hash, offset = 0) {
  return (x, z, period) => {
    const xi = Math.floor(x), zi = Math.floor(z), sx = smooth(x - xi), sz = smooth(z - zi);
    const w = (v) => ((v % period) + period) % period;
    const a = hash(w(xi) + offset, w(zi)), b = hash(w(xi + 1) + offset, w(zi)), c = hash(w(xi) + offset, w(zi + 1)), d = hash(w(xi + 1) + offset, w(zi + 1));
    return (a * (1 - sx) + b * sx) * (1 - sz) + (c * (1 - sx) + d * sx) * sz;
  };
}

// Tiling normal map: soft bumps plus a few tiny craters.
function makeGrainNormalMap(hash, seed, size = 512) {
  const h = new Float32Array(size * size), n = tileableNoise(hash);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const u = i / size, v = j / size;
    h[j * size + i] = n(u * 6, v * 6, 6) + n(u * 14, v * 14, 14) * 0.45 + n(u * 40, v * 40, 40) * 0.08;
  }
  const rnd = mulberry(99 + seed);
  for (let k = 0; k < 11; k++) {
    const cx = rnd() * size, cz = rnd() * size, r = 4 + rnd() ** 2.5 * 14, depth = 0.12 + rnd() * 0.22, ext = Math.ceil(r * 1.5);
    for (let dz = -ext; dz <= ext; dz++) for (let dx = -ext; dx <= ext; dx++) {
      const u = Math.hypot(dx, dz) / r;
      if (u > 1.5) continue;
      const x = ((Math.round(cx + dx) % size) + size) % size, z = ((Math.round(cz + dz) % size) + size) % size;
      h[z * size + x] += u < 1
        ? -depth * (1 - u * u) + 0.18 * depth * Math.exp(-(((u - 0.95) / 0.12) ** 2))
        : 0.18 * depth * Math.exp(-(((u - 1) / 0.25) ** 2));
    }
  }
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d'), img = ctx.createImageData(size, size);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    let nx = (h[j * size + ((i - 1 + size) % size)] - h[j * size + ((i + 1) % size)]) * 2.6;
    let nz = (h[((j - 1 + size) % size) * size + i] - h[((j + 1) % size) * size + i]) * 2.6;
    let ny = 1; const len = Math.hypot(nx, nz, ny); nx /= len; nz /= len; ny /= len;
    const p = (j * size + i) * 4;
    img.data[p] = (nx * 0.5 + 0.5) * 255; img.data[p + 1] = (nz * 0.5 + 0.5) * 255; img.data[p + 2] = (ny * 0.5 + 0.5) * 255; img.data[p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = 8;
  return tex;
}

// Tiling brightness grain for the colour map.
function makeGrainMap(hash, size = 256, period = 8) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d'), img = ctx.createImageData(size, size), n = tileableNoise(hash, 50);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const u = i / size, v = j / size;
    const g = n(u * period, v * period, period) * 0.65 + n(u * period * 3, v * period * 3, period * 3) * 0.35;
    const val = Math.round(255 * clamp(0.86 + g * 0.13, 0.7, 1)), p = (j * size + i) * 4;
    img.data[p] = img.data[p + 1] = img.data[p + 2] = val; img.data[p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = 8;
  return tex;
}

// Shader patch: rock reads faceted (flat-shaded look), dust reads smooth.
// Driven by the per-vertex `surf` attribute: x = rockiness, y = dust.
function patchSurfaceShader(material) {
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    if (prev) prev.call(material, shader, renderer);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 surf;\nvarying vec2 vSurf;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSurf = surf;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vSurf;')
      .replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
        float surfRock = clamp(vSurf.x * 1.3, 0.0, 1.0);
        vec3 surfBaseN = normalize(mix(normal, normalize(cross(dFdx(vViewPosition), dFdy(vViewPosition))), surfRock));`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        normal = normalize(mix(normal, surfBaseN, clamp(surfRock * 0.85 + vSurf.y * 0.9, 0.0, 1.0)));`);
  };
  const prevKey = material.customProgramCacheKey;
  material.customProgramCacheKey = () => (prevKey ? prevKey.call(material) : '') + '+lunar-surface';
  material.needsUpdate = true;
  return material;
}

// --------------------------------------------------------- meshes (three)
export function createLunarTerrain(options = {}) {
  const hf = createHeightfield(options);
  const o = hf.options, half = o.size / 2;

  // Playable ground
  const geo = new THREE.PlaneGeometry(o.size, o.size, o.meshRes, o.meshRes);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const greyColours = new Float32Array(pos.count * 3);   // normal view
  const surveyColours = new Float32Array(pos.count * 3); // mare = rust, highland = pale blue
  const surveyTint = (m) => [0.78 * m + 0.62 * (1 - m), 0.42 * m + 0.7 * (1 - m), 0.26 * m + 0.86 * (1 - m)];
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), z = pos.getZ(i);
    if (Math.abs(x) < half - 0.5 && Math.abs(z) < half - 0.5) { // jitter interior vertices: breaks the grid look
      x += (hf.hash(Math.round(x * 7 + 1000), Math.round(z * 7 + 3000)) - 0.5) * 0.62;
      z += (hf.hash(Math.round(x * 5 + 2000), Math.round(z * 11 + 4000)) - 0.5) * 0.62;
      pos.setX(i, x); pos.setZ(i, z);
    }
    pos.setY(i, hf.heightAt(x, z));
    const a = hf.albedoAt(x, z);
    greyColours[i * 3] = a; greyColours[i * 3 + 1] = a * 0.995; greyColours[i * 3 + 2] = a * 0.99;
    const t = surveyTint(hf.mareAt(x, z));
    surveyColours[i * 3] = t[0] * a * 1.3; surveyColours[i * 3 + 1] = t[1] * a * 1.3; surveyColours[i * 3 + 2] = t[2] * a * 1.3;
  }
  for (let i = 0; i < greyColours.length; i++) greyColours[i] = Math.min(1, greyColours[i] * 1.07);
  geo.computeVertexNormals();
  geo.setAttribute('color', new THREE.Float32BufferAttribute(greyColours.slice(), 3));
  const nrm = geo.attributes.normal, surf = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const steep = smooth(clamp((1 - nrm.getY(i) - 0.12) / 0.25, 0, 1)), dust = hf.dustAt(x, z);
    surf[i * 2] = Math.max(hf.rockAt(x, z), steep) * (1 - dust);
    surf[i * 2 + 1] = dust;
  }
  geo.setAttribute('surf', new THREE.Float32BufferAttribute(surf, 2));

  const normalMap = makeGrainNormalMap(hf.hash, o.seed | 0);
  const grainMap = makeGrainMap(hf.hash);
  normalMap.repeat.set(o.size / 27, o.size / 27);
  grainMap.repeat.set(o.size / 27, o.size / 27);
  const material = patchSurfaceShader(new THREE.MeshStandardMaterial({
    vertexColors: true, map: grainMap, roughness: 0.97, metalness: 0,
    normalMap, normalScale: new THREE.Vector2(0.5, 0.5),
  }));
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = 'terrain'; mesh.receiveShadow = true; mesh.castShadow = true;

  // Horizon backdrop: one grid whose spacing grows with sinh, from 1 m cells
  // near the play area to kilometre cells at the horizon. Skirts down under
  // the playable mesh's edge so no seam shows.
  let backdrop = null;
  if (o.backdrop) {
    const res = o.backdrop.res, k = 4.6, sk = Math.sinh(k), E = o.backdrop.extent;
    const warp = (v) => (Math.sign(v) * E * Math.sinh(k * Math.abs(v))) / sk;
    const bg = new THREE.PlaneGeometry(2, 2, res, res);
    bg.rotateX(-Math.PI / 2);
    const bp = bg.attributes.position, cols = new Float32Array(bp.count * 3);
    for (let i = 0; i < bp.count; i++) {
      const x = warp(bp.getX(i)), z = warp(bp.getZ(i)), r = Math.hypot(x, z), m = Math.max(Math.abs(x), Math.abs(z));
      const w = smooth(clamp((m - half) / 120, 0, 1));
      let y = (w < 1 ? hf.exactHeightAt(x, z) * (1 - w) : 0) + hf.farHeightAt(x, z) * w;
      y -= 0.06 + 30 * clamp((half - m) / 8.5, 0, 1);
      if (o.backdrop.curvature) y -= hf.curvatureDrop(x, z);
      bp.setXYZ(i, x, y, z);
      const a = hf.albedoAt(x, z) * (1 - 0.16 * smooth(clamp((r - 400) / 5000, 0, 1)));
      cols[i * 3] = a; cols[i * 3 + 1] = a * 0.995; cols[i * 3 + 2] = a * 0.99;
    }
    bg.computeVertexNormals();
    bg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    bg.computeBoundingSphere();
    backdrop = new THREE.Mesh(bg, new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.98, metalness: 0,
      polygonOffset: true, polygonOffsetFactor: 3, polygonOffsetUnits: 3,
    }));
    backdrop.name = 'terrain-backdrop'; backdrop.receiveShadow = true; backdrop.renderOrder = -1;
  }

  // Toggle the mineral survey colouring (mare rust / highland blue).
  const setSurvey = (on) => {
    const c = geo.attributes.color.array, src = on ? surveyColours : greyColours;
    for (let i = 0; i < c.length; i++) c[i] = src[i];
    geo.attributes.color.needsUpdate = true;
  };

  const dispose = () => {
    geo.dispose(); material.dispose(); normalMap.dispose(); grainMap.dispose();
    if (backdrop) { backdrop.geometry.dispose(); backdrop.material.dispose(); }
  };

  return { ...hf, mesh, backdrop, setSurvey, dispose };
}
