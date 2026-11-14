// ============================================================
// O₂ MANIFOLD — the oxygen stabiliser panel (Shackleton v0.13.0)
//
// A self-contained two-stage puzzle.
//
// Stage 1, ROUTE. A reserve tank sits in the middle of a grid of pipe
// sections, all knocked out of line. Tap a section to turn it a quarter
// turn. Oxygen flows through every section that lines up. Done when it
// reaches them all.
//
// Stage 2, REGULATE. Three of the outlets are marked. The tank supplies
// 16, and every T-junction on the way halves it. Trace each marked line
// back to the tank, work out what pressure arrives, and set its
// regulator. A wrong setting only says how many are right.
//
// Used two ways:
//   - inside Shackleton:  O2Panel.open({ size, seed, onSolved, onClose })
//   - on its own page:    shackleton/panel/index.html
//
// No dependencies. Classic script: sets window.O2Panel.
// ============================================================
(function () {
  'use strict';
  const N = 1, E = 2, S = 4, W = 8;
  const DIRS = [[N, 0, -1, S], [E, 1, 0, W], [S, 0, 1, N], [W, -1, 0, E]];
  const rotCW = (m) => ((m << 1) & 15) | (m >> 3);
  const bits = (m) => (m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1) + ((m >> 3) & 1);

  function rng(seed) {                       // mulberry32
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Build a solved layout: a random tree grown from the centre that
  // reaches every cell, with no four-way junctions. Then scramble.
  function generate(size, seed) {
    const R = rng(seed);
    const idx = (x, y) => y * size + x;
    const solved = new Array(size * size).fill(0);
    const src = idx(size >> 1, size >> 1);
    const inTree = new Array(size * size).fill(false);
    inTree[src] = true;
    const frontier = [src];
    let count = 1;
    while (count < size * size && frontier.length) {
      // Bias towards the newest cells: long winding runs, fewer stubs.
      const fi = R() < 0.72 ? frontier.length - 1 : Math.floor(R() * frontier.length);
      const c = frontier[fi], cx = c % size, cy = (c / size) | 0;
      const opts = [];
      for (const [bit, dx, dy, back] of DIRS) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
        const n = idx(nx, ny);
        if (inTree[n] || bits(solved[c]) >= (c === src ? 1 : 3)) continue;   // the tank feeds a single pipe
        opts.push([bit, n, back]);
      }
      if (!opts.length) { frontier.splice(fi, 1); continue; }
      const [bit, n, back] = opts[Math.floor(R() * opts.length)];
      solved[c] |= bit; solved[n] |= back; inTree[n] = true; frontier.push(n); count++;
    }
    // A handful of sections are still bolted in place: fixed points to reason from.
    const locked = new Array(size * size).fill(false);
    const want = Math.max(2, Math.round(size * size * 0.14));
    let guard = 0, placed = 0;
    while (placed < want && guard++ < 400) {
      const c = Math.floor(R() * size * size);
      if (c === src || locked[c] || bits(solved[c]) < 2) continue;
      locked[c] = true; placed++;
    }
    // Marked outlets and the pressure each one receives: 16 at the tank,
    // halved at every T-junction on the path.
    const parent = new Array(size * size).fill(-1), order = [src], seen = new Array(size * size).fill(false);
    seen[src] = true;
    for (let h = 0; h < order.length; h++) {
      const c = order[h], cx = c % size, cy = (c / size) | 0;
      for (const [bit, dx, dy] of DIRS) {
        if (!(solved[c] & bit)) continue;
        const n = idx(cx + dx, cy + dy);
        if (!seen[n]) { seen[n] = true; parent[n] = c; order.push(n); }
      }
    }
    const leaves = [];
    for (let i = 0; i < size * size; i++) {
      if (i === src || bits(solved[i]) !== 1) continue;
      let tees = 0;
      for (let p = parent[i]; p !== -1; p = parent[p]) if (bits(solved[p]) === 3) tees++;
      if (tees <= 4) leaves.push({ cell: i, pressure: 16 >> tees });
    }
    // Prefer three outlets with three different pressures.
    for (let i = leaves.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = leaves[i]; leaves[i] = leaves[j]; leaves[j] = t; }
    const marks = [];
    for (const lf of leaves) if (marks.length < 3 && !marks.some(m => m.pressure === lf.pressure)) marks.push(lf);
    for (const lf of leaves) if (marks.length < 3 && marks.indexOf(lf) < 0) marks.push(lf);
    const ok = count === size * size && marks.length === 3;
    const turns = solved.map((m, i) => {
      if (locked[i]) return 0;
      const straight = m === (N | S) || m === (E | W);
      return straight ? 1 : 1 + Math.floor(R() * 3);   // every loose section starts wrong
    });
    return { size, src, solved, locked, turns, marks, ok };
  }

  const CSS = `
#o2p { position: fixed; inset: 0; z-index: 80; display: none; align-items: center; justify-content: center;
  background: radial-gradient(ellipse at center, rgba(14,20,30,0.96), rgba(4,6,10,0.985));
  font-family: 'Courier New', monospace; color: #dfe6ee; touch-action: manipulation;
  -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; }
#o2p.on { display: flex; }
#o2p .o2p-box { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 12px; max-width: 100vw; max-height: 100vh; box-sizing: border-box; }
#o2p .o2p-head { text-align: center; }
#o2p .o2p-title { font-size: 14px; letter-spacing: 0.34em; color: #f0c674; }
#o2p .o2p-sub { font-size: 11px; letter-spacing: 0.06em; color: #8b96a5; margin-top: 6px; max-width: 34em; line-height: 1.5; }
#o2p .o2p-frame { position: relative; padding: 10px; border: 1px solid #2a3550; border-radius: 10px;
  background: linear-gradient(160deg, #161d2a, #0c1119); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.03), 0 12px 40px rgba(0,0,0,0.6); }
#o2p svg { display: block; width: min(78vmin, 520px); height: min(78vmin, 520px); }
#o2p .o2p-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; justify-content: center; }
#o2p .o2p-gauge { width: 150px; height: 8px; border-radius: 4px; background: #1a2230; overflow: hidden; border: 1px solid #2a3550; }
#o2p .o2p-gauge i { display: block; height: 100%; width: 0; background: linear-gradient(90deg, #2f8fb5, #8fefff); transition: width 0.35s ease; }
#o2p .o2p-read { font-size: 11px; letter-spacing: 0.14em; color: #9fb2c4; min-width: 9em; }
#o2p button { font: inherit; font-size: 11px; letter-spacing: 0.14em; color: #c8ccd2; background: rgba(20,26,38,0.9);
  border: 1px solid #2a3550; border-radius: 4px; padding: 9px 14px; cursor: pointer; }
#o2p button:active { background: #24304a; }
#o2p .tile { cursor: pointer; }
#o2p .tile .bg { fill: #121925; stroke: #1f2a3c; stroke-width: 1.5; }
#o2p .tile.locked .bg { fill: #1b2230; stroke: #3a4458; }
#o2p .tile.locked { cursor: default; }
#o2p .tile .rot { transition: transform 0.16s ease-out; transform-box: fill-box; transform-origin: 50% 50%; }
#o2p .pipe { stroke: #46536a; stroke-width: 16; stroke-linecap: round; fill: none; transition: stroke 0.25s ease; }
#o2p .core { fill: #46536a; transition: fill 0.25s ease; }
#o2p .flow { stroke: #dffbff; stroke-width: 4; stroke-linecap: round; fill: none; stroke-dasharray: 3 15; opacity: 0; }
#o2p .tile.live .pipe { stroke: #49c6e8; }
#o2p .tile.live .core { fill: #8fefff; }
#o2p .tile.live .flow { opacity: 0.9; animation: o2pflow 0.9s linear infinite; }
#o2p .tile.end .cap { fill: #0c1119; stroke: #46536a; stroke-width: 5; transition: stroke 0.25s ease, fill 0.25s ease; }
#o2p .tile.end.live .cap { stroke: #8fefff; fill: #1d5a70; }
#o2p .rivet { fill: #55627a; }
#o2p .tank { fill: #1d5a70; stroke: #8fefff; stroke-width: 5; }
#o2p .tanklbl { fill: #dffbff; font-size: 22px; font-family: 'Courier New', monospace; text-anchor: middle; dominant-baseline: central; pointer-events: none; }
#o2p .mark { fill: #f0c674; font-size: 26px; font-family: 'Courier New', monospace; text-anchor: middle; dominant-baseline: central; pointer-events: none; }
#o2p .o2p-stage { font-size: 11px; letter-spacing: 0.22em; color: #f0c674; }
#o2p .o2p-plac { font-size: 11px; line-height: 1.6; letter-spacing: 0.05em; color: #9fb2c4; border: 1px dashed #3a4458; border-radius: 4px; padding: 8px 12px; max-width: 30em; text-align: center; }
#o2p .o2p-regs { display: flex; gap: 10px; align-items: flex-end; justify-content: center; opacity: 0.32; pointer-events: none; transition: opacity 0.5s ease; }
#o2p.stage2 .o2p-regs { opacity: 1; pointer-events: auto; }
#o2p .o2p-reg { display: flex; flex-direction: column; align-items: center; gap: 5px; }
#o2p .o2p-reg span { color: #f0c674; font-size: 18px; }
#o2p .o2p-reg button { min-width: 58px; font-size: 20px; padding: 10px 6px; letter-spacing: 0; color: #dffbff; }
#o2p .o2p-go { color: #0c1119; background: #8fefff; border-color: #8fefff; font-weight: bold; }
#o2p .o2p-go:disabled { color: #55627a; background: rgba(20,26,38,0.9); border-color: #2a3550; }
#o2p .o2p-msg { font-size: 11px; letter-spacing: 0.14em; color: #ff9c8a; min-height: 1.3em; }
#o2p.stage2 .tile { cursor: default; }
#o2p.won .o2p-frame { border-color: #8fefff; box-shadow: 0 0 34px rgba(110,220,255,0.35), 0 12px 40px rgba(0,0,0,0.6); }
#o2p .o2p-done { font-size: 13px; letter-spacing: 0.3em; color: #8fefff; min-height: 1.3em; opacity: 0; transition: opacity 0.5s ease; }
#o2p.won .o2p-done { opacity: 1; }
@keyframes o2pflow { to { stroke-dashoffset: -18; } }
@media (orientation: landscape) and (max-height: 520px) {
  #o2p .o2p-box { flex-direction: row; gap: 18px; }
  #o2p svg { width: min(86vh, 520px); height: min(86vh, 520px); }
  #o2p .o2p-side { display: flex; flex-direction: column; align-items: center; gap: 8px; max-width: 42vw; }
  #o2p .o2p-sub { display: none; }
  #o2p .o2p-row { flex-direction: column; }
}`;

  let root = null, svg = null, st = null, opts = null, audio = null;
  const els = {};

  function build() {
    if (root) return;
    const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    root = document.createElement('div'); root.id = 'o2p';
    root.innerHTML =
      '<div class="o2p-box">' +
        '<div class="o2p-frame"><svg xmlns="http://www.w3.org/2000/svg"></svg></div>' +
        '<div class="o2p-side">' +
          '<div class="o2p-head"><div class="o2p-title">O₂ MANIFOLD</div>' +
          '<div class="o2p-sub">Tap a pipe section to turn it. Get oxygen from the reserve tank to every section.</div></div>' +
          '<div class="o2p-stage"></div>' +
          '<div class="o2p-row"><div class="o2p-gauge"><i></i></div><div class="o2p-read"></div></div>' +
          '<div class="o2p-plac">TANK SUPPLIES <b>16</b>. EVERY T-JUNCTION HALVES IT.<br>SET EACH REGULATOR TO THE PRESSURE ITS LINE RECEIVES.</div>' +
          '<div class="o2p-regs"></div>' +
          '<div class="o2p-msg"></div>' +
          '<div class="o2p-done">FLOW STABLE</div>' +
          '<div class="o2p-row"><button type="button" data-a="new">New layout</button><button type="button" data-a="close">Close</button></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);
    svg = root.querySelector('svg');
    els.fill = root.querySelector('.o2p-gauge i');
    els.read = root.querySelector('.o2p-read');
    els.newBtn = root.querySelector('[data-a="new"]');
    els.closeBtn = root.querySelector('[data-a="close"]');
    els.stage = root.querySelector('.o2p-stage');
    els.regs = root.querySelector('.o2p-regs');
    els.msg = root.querySelector('.o2p-msg');
    els.regs.addEventListener('click', (e) => {
      const b = e.target.closest ? e.target.closest('button') : null;
      if (!b || st.won) return;
      if (b.dataset.k === 'go') { engage(); return; }
      const k = +b.dataset.k;
      st.dials[k] = (st.dials[k] + 1) % DIAL.length;
      beep(300 + st.dials[k] * 60, 0.05, 'triangle', 0.05);
      drawRegs();
    });
    els.closeBtn.addEventListener('click', () => close(false));
    els.newBtn.addEventListener('click', () => start(st.size, (Math.random() * 1e9) | 0));
    svg.addEventListener('pointerdown', (e) => {
      const g = e.target.closest ? e.target.closest('.tile') : null;
      if (!g) return;
      e.preventDefault(); e.stopPropagation();
      turn(+g.dataset.i);
    });
    // Nothing behind the panel should see these.
    ['pointerdown', 'pointerup', 'pointermove', 'click', 'touchstart', 'touchend'].forEach(t =>
      root.addEventListener(t, (e) => e.stopPropagation()));
  }

  function beep(freq, dur, type, gain) {
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
      o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain || 0.06, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch (_) { /* sound is optional */ }
  }

  const DIAL = ['–', 1, 2, 4, 8, 16], GLYPH = ['▲', '■', '●'];

  function drawRegs() {
    let h = '';
    for (let k = 0; k < 3; k++) h += '<div class="o2p-reg"><span>' + GLYPH[k] + '</span><button type="button" data-k="' + k + '">' + DIAL[st.dials[k]] + '</button></div>';
    h += '<button type="button" class="o2p-go" data-k="go"' + (st.dials.some(d => d === 0) ? ' disabled' : '') + '>ENGAGE</button>';
    els.regs.innerHTML = h;
  }

  function engage() {
    if (st.dials.some(d => d === 0)) return;
    let right = 0;
    for (let k = 0; k < 3; k++) if (DIAL[st.dials[k]] === st.marks[k].pressure) right++;
    st.tries++;
    if (right === 3) { els.msg.textContent = ''; win(); return; }
    els.msg.textContent = 'REGULATOR FAULT  ·  ' + right + ' OF 3 CORRECT';
    beep(120, 0.25, 'sawtooth', 0.05);
    if (opts && opts.onFault) opts.onFault({ tries: st.tries, right: right });
  }

  function mask(i) {                          // current openings of section i
    let m = st.solved[i];
    for (let k = 0; k < (st.turns[i] & 3); k++) m = rotCW(m);
    return m;
  }

  function live() {                           // which sections the oxygen reaches
    const n = st.size, seen = new Array(n * n).fill(false), q = [st.src];
    seen[st.src] = true;
    while (q.length) {
      const c = q.pop(), cx = c % n, cy = (c / n) | 0, m = mask(c);
      for (const [bit, dx, dy, back] of DIRS) {
        if (!(m & bit)) continue;
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
        const d = ny * n + nx;
        if (seen[d] || !(mask(d) & back)) continue;
        seen[d] = true; q.push(d);
      }
    }
    return seen;
  }

  function draw() {
    const n = st.size, C = 100;
    svg.setAttribute('viewBox', '0 0 ' + n * C + ' ' + n * C);
    let h = '';
    for (let i = 0; i < n * n; i++) {
      const x = (i % n) * C, y = ((i / n) | 0) * C, m = st.solved[i];
      const cls = 'tile' + (st.locked[i] ? ' locked' : '') + (bits(m) === 1 && i !== st.src ? ' end' : '');
      h += '<g class="' + cls + '" data-i="' + i + '" transform="translate(' + x + ' ' + y + ')">';
      h += '<rect class="bg" x="3" y="3" width="94" height="94" rx="10"/>';
      if (st.locked[i]) h += '<circle class="rivet" cx="13" cy="13" r="3.2"/><circle class="rivet" cx="87" cy="13" r="3.2"/><circle class="rivet" cx="13" cy="87" r="3.2"/><circle class="rivet" cx="87" cy="87" r="3.2"/>';
      h += '<g class="rot" style="transform: rotate(' + st.turns[i] * 90 + 'deg)">';
      h += '<rect x="0" y="0" width="100" height="100" fill="none"/>';
      let d = '';
      if (m & N) d += 'M50 50L50 0'; if (m & E) d += 'M50 50L100 50';
      if (m & S) d += 'M50 50L50 100'; if (m & W) d += 'M50 50L0 50';
      h += '<path class="pipe" d="' + d + '"/><path class="flow" d="' + d + '"/>';
      if (i === st.src) h += '<circle class="tank" cx="50" cy="50" r="27"/>';
      else if (bits(m) === 1) h += '<circle class="cap" cx="50" cy="50" r="17"/>';
      else h += '<circle class="core" cx="50" cy="50" r="8"/>';
      h += '</g>';
      if (i === st.src) h += '<text class="tanklbl" x="50" y="51">O₂</text>';
      const mk = st.marks.findIndex(m => m.cell === i);
      if (mk >= 0) h += '<text class="mark" x="50" y="51">' + GLYPH[mk] + '</text>';
      h += '</g>';
    }
    svg.innerHTML = h;
    st.nodes = Array.prototype.slice.call(svg.querySelectorAll('.tile'));
    refresh();
  }

  function refresh() {
    const on = live();
    let c = 0;
    for (let i = 0; i < on.length; i++) { st.nodes[i].classList.toggle('live', on[i]); if (on[i]) c++; }
    const pct = Math.round(c / on.length * 100);
    els.fill.style.width = pct + '%';
    els.read.textContent = 'FLOW ' + pct + '%  ·  ' + st.moves + ' TURNS';
    els.stage.textContent = st.routed ? 'STAGE 2 OF 2  ·  REGULATE' : 'STAGE 1 OF 2  ·  ROUTE';
    return c === on.length;
  }

  function turn(i) {
    if (st.won || st.routed) return;          // the pipes are clamped once the flow is whole
    if (st.locked[i]) { beep(110, 0.08, 'square', 0.03); return; }
    st.turns[i]++; st.moves++;
    st.nodes[i].querySelector('.rot').style.transform = 'rotate(' + st.turns[i] * 90 + 'deg)';
    beep(520 + (st.turns[i] & 3) * 40, 0.05, 'triangle', 0.05);
    if (refresh()) routed();
  }

  function routed() {
    st.routed = true;
    root.classList.add('stage2');
    [392, 494].forEach((f, k) => setTimeout(() => beep(f, 0.35, 'sine', 0.06), k * 120));
    refresh();
  }

  function win() {
    st.won = true;
    root.classList.add('won');
    [392, 494, 587, 784].forEach((f, k) => setTimeout(() => beep(f, 0.5, 'sine', 0.07), k * 110));
    const cb = opts && opts.onSolved;
    const res = { moves: st.moves, tries: st.tries };
    if (opts && opts.autoClose !== false) setTimeout(() => { close(true); if (cb) cb(res); }, 1900);
    else if (cb) cb(res);
  }

  function start(size, seed) {
    let g = generate(size, seed), s2 = seed;
    while (!g.ok) g = generate(size, ++s2);   // needs three markable outlets
    st = { size: g.size, src: g.src, solved: g.solved, locked: g.locked, turns: g.turns, marks: g.marks,
           dials: [0, 0, 0], tries: 0, moves: 0, won: false, routed: false, seed: seed };
    root.classList.remove('won', 'stage2');
    els.msg.textContent = '';
    draw(); drawRegs();
    if (refresh()) start(size, s2 + 1);       // never hand over a layout that is already routed
  }

  function open(o) {
    build();
    opts = o || {};
    els.newBtn.style.display = opts.allowNew ? '' : 'none';
    els.closeBtn.style.display = opts.allowClose === false ? 'none' : '';
    // Coming back to an unfinished panel keeps the player's progress.
    if (!(opts.resume && st && !st.won && st.size === (opts.size || 5) && st.seed === opts.seed)) start(opts.size || 5, opts.seed === undefined ? ((Math.random() * 1e9) | 0) : opts.seed);
    root.classList.add('on');
    return api;
  }

  function close(solved) {
    if (!root) return;
    root.classList.remove('on');
    if (!solved && opts && opts.onClose) opts.onClose();
  }

  const api = {
    open: open,
    close: () => close(false),
    isOpen: () => !!root && root.classList.contains('on'),
    // For tests: the layout, and a way to turn a section without a pointer.
    _state: () => st,
    _turn: (i) => turn(i),
    _setDial: (k, value) => { st.dials[k] = DIAL.indexOf(value); drawRegs(); },
    _engage: () => engage(),
    _generate: generate,
  };
  window.O2Panel = api;
})();
