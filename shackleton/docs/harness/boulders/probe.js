// node probe.js <url-query> <script.json>  steps: {waitload}|{wait}|{key}|{eval}|{shot}
const puppeteer = require('puppeteer-core'); const fs = require('fs');
(async () => {
  const [,, q, stepsF] = process.argv; const steps = JSON.parse(fs.readFileSync(stepsF));
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', protocolTimeout: 600000,
    args: ['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const p = await b.newPage(); await p.setViewport({ width: +(process.env.VW||900), height: +(process.env.VH||700) });
  p.on('pageerror', e => console.log('PAGEERROR: ' + e.message));
  await p.goto('http://localhost:8765/shackleton/index.html?' + q, { waitUntil: 'load', timeout: 180000 });
  const ev = async (src) => { try { return await p.evaluate(s => { const v = window.__shk(s); try { return JSON.stringify(v); } catch (e) { return String(v); } }, src); } catch (e) { return 'EVALERR ' + e.message; } };
  for (const s of steps) {
    if (s.wait) await new Promise(r => setTimeout(r, s.wait));
    if (s.waitload) { for (let k = 0; k < 180; k++) { const ok = await p.evaluate(() => { const e = document.getElementById('loading'); return e && e.classList.contains('hide'); }); if (ok) break; await new Promise(r => setTimeout(r, 1000)); } }
    if (s.key) { await p.keyboard.down(s.key); await new Promise(r => setTimeout(r, 80)); await p.keyboard.up(s.key); }
    if (s.eval) { const r = await ev(s.file ? fs.readFileSync(s.eval, 'utf8') : s.eval); if (s.log !== false) console.log('EVAL =>', String(r).slice(0, s.max || 6000)); }
    if (s.shot) await p.screenshot({ path: s.shot });
  }
  await b.close();
})();
