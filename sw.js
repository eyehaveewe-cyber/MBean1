const CACHE="mbean1-v4";
const CORE=["./","./index.html","./styles.css","./app.js","./manifest.webmanifest"];
const ALLOWED_RUNTIME_HOSTS=new Set(["raw.githubusercontent.com"]);

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  const allowedToCache=url.origin===self.location.origin||ALLOWED_RUNTIME_HOSTS.has(url.hostname);

  event.respondWith(
    caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
      if(allowedToCache&&response&&response.ok){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
      }
      return response;
    }))
  );
});