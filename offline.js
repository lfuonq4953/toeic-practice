/* Dùng offline: đăng ký service worker (sw.js) và tải trọn một đề (data.js, ảnh, audio) vào bộ nhớ trình duyệt.
   Danh sách đề đã tải: localStorage 'toeic:offline' = {id:{at,mb}} */
(function(){
const T=window.TOEIC, MANIFEST=window.MANIFEST||[], KEY='toeic:offline', DATA='toeic-data';
const ok=('serviceWorker' in navigator)&&('caches' in window)&&location.protocol!=='file:';
let REG={}; try{REG=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){}
const saveReg=()=>{try{localStorage.setItem(KEY,JSON.stringify(REG))}catch(e){}};
const JOB={}; // id -> {done,total,err}
let BULK=null; // {k,i,n,err}
if(ok){
  addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
}
const base=new URL('.',location.href).href, abs=p=>new URL(p,base).href;
const mbOf=id=>{const m=MANIFEST.find(t=>t.id===id);return m&&m.mb!=null?m.mb:null};
const fmt=mb=>mb==null?'':mb<0.1?'< 0,1 MB':String(mb).replace('.',',')+' MB';
async function files(id){
  const r=await fetch(abs('tests/'+id+'/data.js'),{cache:'no-cache'}); if(!r.ok)throw new Error('data');
  const w={}; new Function('window',await r.text())(w); const t=w.TEST;
  const m=MANIFEST.find(x=>x.id===id)||{};
  const list=['tests/'+id+'/data.js'];
  [...new Set(t.questions.filter(q=>q.img).map(q=>q.img))].forEach(i=>list.push(`tests/${id}/img/${i}.jpg`));
  if(m.audio!==false)[...new Set(t.questions.filter(q=>q.part<=4).map(q=>q.part))].forEach(p=>list.push(`tests/${id}/audio/part${p}.mp3`));
  return list;
}
async function download(id,quiet){
  if(!ok||JOB[id])return;
  JOB[id]={done:0,total:1};
  if(!quiet)paint(id);
  try{ if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{}); }catch(e){}
  try{
    const list=await files(id), c=await caches.open(DATA);
    JOB[id].total=list.length;
    for(const f of list){
      const res=await fetch(abs(f),{cache:'no-cache'});
      if(!res.ok)throw new Error(f);
      await c.put(abs(f),res);
      JOB[id].done++; if(!quiet)paint(id);
    }
    REG[id]={at:Date.now(),mb:mbOf(id)}; saveReg(); delete JOB[id];
  }catch(e){ JOB[id]={err:true}; }
  if(!quiet)paint(id);
}
async function remove(id){
  if(!ok)return;
  try{const c=await caches.open(DATA);const ks=await c.keys();await Promise.all(ks.filter(r=>r.url.includes('/tests/'+id+'/')).map(r=>c.delete(r)))}catch(e){}
  delete REG[id]; saveReg(); paint(id);
}
const has=id=>!!REG[id];
function rowHTML(id){
  if(!ok)return location.protocol==='file:'?`<div class="offrow" id="offrow">Mở trang qua web (GitHub Pages hoặc http://localhost) để dùng được offline.</div>`:'';
  const j=JOB[id], mb=fmt(mbOf(id));
  let inner;
  if(j&&j.err)inner=`<span>Tải chưa xong — kiểm tra kết nối mạng.</span><button class="btn sm" data-off="get" data-id="${T.esc(id)}">Thử lại</button>`;
  else if(j)inner=`<span>Đang tải về máy… ${j.done}/${j.total}</span><span class="bar"><i style="width:${j.total?j.done/j.total*100:0}%"></i></span>`;
  else if(has(id))inner=`<span class="offok">✓ Đã tải về máy — luyện được khi không có mạng</span><button class="btn sm ghost" data-off="rm" data-id="${T.esc(id)}">Xóa bản offline</button>`;
  else if(!navigator.onLine)inner=`<span>Đề này chưa tải về máy nên khi offline có thể thiếu audio và hình. Có mạng lại thì bấm tải về.</span>`;
  else inner=`<button class="btn sm" data-off="get" data-id="${T.esc(id)}">Tải về để luyện offline${mb?` · ${mb}`:''}</button>`;
  return `<div class="offrow" id="offrow" data-id="${T.esc(id)}">${inner}</div>`;
}
function bulkHTML(k,ids){
  if(!ok||!ids.length)return '';
  const left=ids.filter(id=>!has(id)), mb=left.reduce((s,id)=>s+(mbOf(id)||0),0);
  let inner;
  if(BULK&&BULK.k===k)inner=`<span>Đang tải ${BULK.i}/${BULK.n} đề…</span><span class="bar"><i style="width:${BULK.i/BULK.n*100}%"></i></span>`;
  else if(!left.length)inner=`<span class="offok">✓ Đã tải về máy cả ${ids.length} đề</span>`;
  else inner=`<button class="btn sm" data-off="bulk" data-k="${T.esc(k)}">Tải ${left.length} đề còn lại về máy · ${fmt(Math.round(mb*10)/10)}</button>`+(BULK&&BULK.err?'<span>Có đề chưa tải được, bấm lại để thử tiếp.</span>':'');
  return `<div class="offrow" id="offbulk" data-k="${T.esc(k)}">${inner}</div>`;
}
function paint(id){
  const el=document.getElementById('offrow');
  if(el&&el.dataset.id===id)el.outerHTML=rowHTML(id);
  paintBulk();
}
function paintBulk(){
  const el=document.getElementById('offbulk'); if(!el)return;
  const k=el.dataset.k, ids=MANIFEST.filter(t=>t.kind==='part'&&String((t.parts||[0])[0])===k).map(t=>t.id);
  el.outerHTML=bulkHTML(k,ids);
}
async function bulk(k){
  if(BULK)return;
  const ids=MANIFEST.filter(t=>t.kind==='part'&&String((t.parts||[0])[0])===k&&!has(t.id)).map(t=>t.id);
  BULK={k,i:0,n:ids.length,err:false}; paintBulk();
  for(const id of ids){ await download(id,true); if(!has(id))BULK.err=true; BULK.i++; paintBulk(); }
  const err=BULK.err; BULK=null; paintBulk(); if(err){BULK=null}
  if(window.TOEIC.rerender)window.TOEIC.rerender();
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-off]'); if(!b)return;
  const a=b.dataset.off;
  if(a==='get')download(b.dataset.id);
  else if(a==='rm')remove(b.dataset.id);
  else if(a==='bulk')bulk(b.dataset.k);
});
/* báo khi mất mạng */
function net(){
  let el=document.getElementById('netnote');
  if(navigator.onLine){if(el)el.remove();return}
  if(!el){el=document.createElement('div');el.id='netnote';el.className='offline-note';el.setAttribute('role','status');document.body.appendChild(el)}
  el.textContent='Đang offline — dùng được các đề đã tải về và phần Từ vựng';
}
addEventListener('online',()=>{net();paint((document.getElementById('offrow')||{}).dataset?.id)});addEventListener('offline',()=>{net();paint((document.getElementById('offrow')||{}).dataset?.id)});
if(document.readyState==='loading')addEventListener('DOMContentLoaded',net);else net();
window.Offline={rowHTML,bulkHTML,has,ok};
})();
