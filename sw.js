// NOVA PWA: cache app shell only. Never cache AI requests, passcodes or user data.
const CACHE='nova-shell-v26';
const BASE=new URL('./',self.registration.scope);
const SHELL=['./','./index.html','./manifest.webmanifest','./icons/nova-mark.svg','./nova-ui.css','./nova-skills.js','./nova-language.js','./nova-online.js','./nova-project-check.js','./nova-3d.js','./nova-create.js','./nova-native-weights.js','./nova-native.js'].map(path=>new URL(path,BASE).href);
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()).catch(()=>{}));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('nova-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const r=event.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==self.location.origin||u.pathname.includes('/api/'))return;
 // Network-first avoids the old code/assets persisting after the GitHub update.
 // In offline mode, use the last successful cached asset.
 if(r.mode==='navigate'){
  event.respondWith(fetch(r,{cache:'no-cache'}).then(response=>{
   if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(r,copy)).catch(()=>{})}
   return response;
  }).catch(()=>caches.match(r).then(v=>v||caches.match(new URL('./index.html',BASE)))));
  return;
 }
 event.respondWith(fetch(r,{cache:'no-cache'}).then(response=>{
  if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(r,copy)).catch(()=>{})}
  return response;
 }).catch(()=>caches.match(r)));
});