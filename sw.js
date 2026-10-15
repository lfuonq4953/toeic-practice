/* Service worker: chạy offline.
   - Giao diện (HTML/CSS/JS, font, từ vựng): tải sẵn khi cài; khi có mạng luôn lấy bản mới nhất (network-first).
   - Dữ liệu đề (data.js, ảnh): lưu lại mỗi khi mở đề.
   - Audio: chỉ có offline khi bấm "Tải về" trong trang đề (offline.js); hỗ trợ tua (HTTP Range).
   Sửa danh sách SHELL thì tăng VERSION. */
const VERSION='2026-10-15b';
const SHELL='toeic-shell-'+VERSION, DATA='toeic-data';
const SHELL_FILES=[
  './','index.html','style.css','app.js','vocab.js','wrong.js','offline.js','manifest.webmanifest',
  'tests/manifest.js','vocab/data.js','vendor/marked.min.js','fonts/fonts.css',
  'icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png',
  'fonts/stix-two-math-latin-400-normal.woff2',
  'fonts/stix-two-text-latin-400-italic.woff2',
  'fonts/stix-two-text-latin-400-normal.woff2',
  'fonts/stix-two-text-latin-500-italic.woff2',
  'fonts/stix-two-text-latin-500-normal.woff2',
  'fonts/stix-two-text-latin-600-italic.woff2',
  'fonts/stix-two-text-latin-600-normal.woff2',
  'fonts/stix-two-text-latin-700-italic.woff2',
  'fonts/stix-two-text-latin-700-normal.woff2',
  'fonts/stix-two-text-latin-ext-400-italic.woff2',
  'fonts/stix-two-text-latin-ext-400-normal.woff2',
  'fonts/stix-two-text-latin-ext-500-italic.woff2',
  'fonts/stix-two-text-latin-ext-500-normal.woff2',
  'fonts/stix-two-text-latin-ext-600-italic.woff2',
  'fonts/stix-two-text-latin-ext-600-normal.woff2',
  'fonts/stix-two-text-latin-ext-700-italic.woff2',
  'fonts/stix-two-text-latin-ext-700-normal.woff2',
  'fonts/stix-two-text-vietnamese-400-italic.woff2',
  'fonts/stix-two-text-vietnamese-400-normal.woff2',
  'fonts/stix-two-text-vietnamese-500-italic.woff2',
  'fonts/stix-two-text-vietnamese-500-normal.woff2',
  'fonts/stix-two-text-vietnamese-600-italic.woff2',
  'fonts/stix-two-text-vietnamese-600-normal.woff2',
  'fonts/stix-two-text-vietnamese-700-italic.woff2',
  'fonts/stix-two-text-vietnamese-700-normal.woff2',
];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(SHELL).then(c=>c.addAll(SHELL_FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('toeic-shell-')&&k!==SHELL).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
const strip=u=>{const x=new URL(u);x.search='';x.hash='';return x.href};
async function fromCache(url){return caches.match(strip(url))}
/* trả về một đoạn của file đã lưu khi trình duyệt xin "Range" (audio) */
async function ranged(req){
  const hit=await fromCache(req.url);
  if(!hit)return fetch(req);
  const buf=await hit.arrayBuffer(), size=buf.byteLength;
  const m=/bytes=(\d*)-(\d*)/.exec(req.headers.get('range')||'');
  let start=0,end=size-1;
  if(m){ if(m[1]===''&&m[2]!==''){start=Math.max(0,size-Number(m[2]))} else {start=Number(m[1]||0); if(m[2]!=='')end=Math.min(Number(m[2]),size-1)} }
  if(start>=size)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+size}});
  return new Response(buf.slice(start,end+1),{status:206,headers:{'Content-Type':hit.headers.get('Content-Type')||'audio/mpeg','Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes'}});
}
async function networkFirst(req,cacheName){
  try{
    const res=await fetch(req);
    if(res.ok&&res.type==='basic'){const c=await caches.open(cacheName);c.put(strip(req.url),res.clone())}
    return res;
  }catch(err){
    const hit=await fromCache(req.url) || (req.mode==='navigate'?await caches.match(new URL('index.html',self.registration.scope).href):null);
    if(hit)return hit;
    throw err;
  }
}
async function cacheFirst(req,store){
  const hit=await fromCache(req.url); if(hit)return hit;
  const res=await fetch(req);
  if(store&&res.ok&&res.type==='basic'){const c=await caches.open(DATA);c.put(strip(req.url),res.clone())}
  return res;
}
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET')return;
  const url=new URL(req.url); if(url.origin!==location.origin)return;
  const p=url.pathname;
  if(/\.mp3$/i.test(p)){ e.respondWith(req.headers.has('range')?ranged(req):cacheFirst(req,false)); return; }
  if(/\/tests\/[^/]+\/img\//.test(p)||/\.(woff2|png|jpg|jpeg|svg)$/i.test(p)){ e.respondWith(cacheFirst(req,true)); return; }
  if(/\/tests\/[^/]+\/data\.js$/.test(p)){ e.respondWith(networkFirst(req,DATA)); return; }
  e.respondWith(networkFirst(req,SHELL));
});
