// Frame guard: the game boots only top-level or inside our own sites; elsewhere a card links back to khalifa.games.
// Source: mascon-seed/src/frameguard.js + src/boot.js. A new build from mascon-seed includes this itself.
const OURS = ['khalifa.games', 'www.khalifa.games', 'localhost', '127.0.0.1'];
const HOME = 'https://khalifa.games/mascon/';

const hostOf = (url) => { try { return new URL(url).hostname; } catch { return ''; } };

// The hostname of the site framing us, '' if we're top-level or framed by one of our own origins,
// or '?' if we're framed but can't tell by whom (treated as foreign).
function foreignFramer() {
  let framed;
  try { framed = window.self !== window.top; } catch { framed = true; }
  if (!framed) return '';
  const anc = location.ancestorOrigins;   // Chromium and Safari list every ancestor; Firefox has no such list
  const origins = anc && anc.length ? Array.from(anc) : (document.referrer ? [document.referrer] : []);
  if (!origins.length) return '?';
  const foreign = origins.map(hostOf).find((h) => !OURS.includes(h));
  return foreign === undefined ? '' : (foreign || '?');
}

function showFrameCard(framer) {
  const src = framer && framer !== '?' ? framer.replace(/^www\./, '') : 'embed';
  const href = `${HOME}?utm_source=${encodeURIComponent(src)}&utm_medium=embed`;
  document.title = 'MASCON — play it at khalifa.games';
  document.body.innerHTML = `
  <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;
    background:#010207 url('${HOME}title.png') center/cover no-repeat;font-family:system-ui,-apple-system,sans-serif;color:#e8e3d6">
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(1,2,7,.55),rgba(1,2,7,.9))"></div>
    <div style="position:relative;max-width:420px;text-align:center">
      <div style="font-size:11px;letter-spacing:.24em;color:#e6a23a;text-transform:uppercase">The Seed Factory</div>
      <div style="font-size:clamp(34px,9vw,56px);letter-spacing:.14em;font-weight:500;margin:10px 0 14px">MASCON</div>
      <p style="font-size:15px;line-height:1.5;color:#c9c4b8;margin:0 0 26px;font-weight:300">
        This copy is running inside another site. The game lives at khalifa.games, with saves, Act 2 and every update.</p>
      <a href="${href}" target="_blank" rel="noopener" style="display:inline-block;background:#e6a23a;color:#05070c;
        text-decoration:none;font-size:15px;font-weight:500;letter-spacing:.04em;padding:14px 26px;border-radius:3px">
        Play free at khalifa.games &rarr;</a>
      <div style="margin-top:16px;font-size:12px;color:#8f8a82;user-select:text;-webkit-user-select:text">khalifa.games/mascon</div>
    </div>
  </div>`;
}

const framer = foreignFramer();
if (framer) showFrameCard(framer);
else import('./index-BCZg7_z0.js');
