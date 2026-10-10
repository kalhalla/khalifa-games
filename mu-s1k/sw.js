const V='mu-s1k-v5';
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(['/mu-s1k/','/mu-s1k/app.css','/mu-s1k/app.js','/mu-s1k/manifest.webmanifest','/mu-s1k/icon-192.png','/mu-s1k/apple-touch-icon.png'])).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V&&x.startsWith('mu-s1k')).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;
  e.respondWith(fetch(r).then(res=>{if(res.ok&&(r.url.startsWith(self.location.origin)||r.url.includes('fonts.g'))){const c=res.clone();caches.open(V).then(x=>x.put(r.mode==='navigate'?'/mu-s1k/':r,c))}return res}).catch(()=>caches.match(r.mode==='navigate'?'/mu-s1k/':r)))});
