/* MyCineList offline support. Online: always fetch the newest page. Offline: use the saved copy. */
const V='mcl-v5',CORE=['index.html','classic.html','icon.png','manifest.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(CORE.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
const isPage=(r,u)=>r.mode==='navigate'||/\.html$/.test(u.pathname)||u.pathname.endsWith('/');
async function networkFirst(r,u){const c=await caches.open(V);
 try{const res=await Promise.race([fetch(new Request(r,{cache:'reload'})),new Promise((_,j)=>setTimeout(()=>j(new Error('slow')),6000))]);
  if(res&&res.ok){const key=u.pathname.endsWith('/')?new URL('index.html',self.registration.scope).href:r.url.split('#')[0];c.put(key,res.clone()).catch(()=>{});return res}
  throw new Error('bad')}
 catch(e){const hit=await c.match(r,{ignoreSearch:true})||await c.match(new URL('index.html',self.registration.scope).href);if(hit)return hit;throw e}}
async function staleWhileRevalidate(r){const c=await caches.open(V),hit=await c.match(r);
 const net=fetch(r).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res}).catch(()=>null);return hit||net||fetch(r)}
async function cacheFirst(r){const c=await caches.open(V),hit=await c.match(r);if(hit)return hit;
 const res=await fetch(r);if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone()).catch(()=>{});return res}
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
 if(u.origin===location.origin){if(u.pathname.endsWith('/sw.js'))return;e.respondWith(isPage(r,u)?networkFirst(r,u):staleWhileRevalidate(r))}
 else if(/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname))e.respondWith(cacheFirst(r))});
