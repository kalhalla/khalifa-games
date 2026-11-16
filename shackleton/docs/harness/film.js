// node film.js <outDir> <setup.json> <shots.json>
// setup: [{wait}|{key,hold}|{eval,log}]   shots: [{name,frames,pre,wait,js}]
// js runs per frame with i, t=i/30, n; default 'frame(1/30);'. Env: VW VH URL ONLY STILLS(auto|list|none)
const puppeteer = require('puppeteer-core'); const fs = require('fs');
(async () => {
  const [,, out, setupF, shotsF] = process.argv;
  const setup = JSON.parse(fs.readFileSync(setupF)); const shots = shotsF ? JSON.parse(fs.readFileSync(shotsF)) : [];
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', protocolTimeout: 600000,
    args: ['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage();
  await p.setViewport({ width: +(process.env.VW||1280), height: +(process.env.VH||720) });
  p.on('pageerror', e => console.log('PAGEERROR: ' + e.message));
  p.on('console', m => { const t = m.text(); if (!/emissive/.test(m.text()) && /warn|error|\[minds\]|\[brace\]|\[airlock\]/i.test(m.type()+t) && !/404|Failed to load/.test(t)) console.log('CONSOLE', t.slice(0,200)); });
  await p.goto((process.env.URL||'http://localhost:8765/shackleton/index.html?debug'), { waitUntil: 'load', timeout: 180000 });
  const ev = async (src) => { try { return await p.evaluate(s => { const v = window.__shk(s); try { return JSON.stringify(v); } catch (e) { return String(v); } }, src); } catch (e) { return 'EVALERR ' + e.message; } };
  for (const s of setup) {
    if (s.wait) await new Promise(r => setTimeout(r, s.wait));
    if (s.waitload) { for (let k = 0; k < 120; k++) { const ok = await p.evaluate(() => { const e = document.getElementById('loading'); return e && e.classList.contains('hide'); }); if (ok) break; await new Promise(r => setTimeout(r, 1000)); } }
    if (s.key) { await p.keyboard.down(s.key); await new Promise(r => setTimeout(r, s.hold || 80)); await p.keyboard.up(s.key); }
    if (s.eval) { const r = await ev(s.eval); if (s.log !== false) console.log('EVAL', s.eval.slice(0, 60), '=>', String(r).slice(0, 600)); }
    if (s.shot) await p.screenshot({ path: `${out}_${s.shot}.png` });
  }
  for (const sh of shots) {
    if (process.env.ONLY && !process.env.ONLY.split(',').includes(sh.name)) continue;
    const dir = `${out}/${sh.name}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    if (sh.pre) { const r = await ev(sh.pre); console.log('PRE', sh.name, '=>', String(r).slice(0, 600)); }
    if (sh.wait) await new Promise(r => setTimeout(r, sh.wait));
    let stills = process.env.STILLS ? process.env.STILLS.split(',').map(Number) : null;
    if (process.env.STILLS === 'auto') stills = [0, Math.floor(sh.frames/2), sh.frames-1];
    if (process.env.STILLS === 'none') stills = [];
    const t0 = Date.now(); const log = [];
    for (let i = 0; i < sh.frames; i++) {
      const skipR = !!stills && !stills.includes(i);
      const r = await ev(`(()=>{ const i=${i}, t=${i}/30, n=${sh.frames}; const __r=renderer.render; if(${skipR}) renderer.render=()=>{}; try { ${sh.js || 'frame(1/30);'} } finally { renderer.render=__r; } return window.__probe ? window.__probe() : 0; })()`);
      if (String(r).startsWith('EVALERR')) { console.log(sh.name, i, r); break; }
      log.push(r);
      if (!skipR) await p.screenshot({ path: `${dir}/f${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 93 });
    }
    fs.writeFileSync(`${dir}/probe.json`, '[' + log.join(',') + ']');
    console.log('SHOT', sh.name, sh.frames, 'frames in', ((Date.now() - t0) / 1000).toFixed(1), 's');
  }
  await b.close();
})();
