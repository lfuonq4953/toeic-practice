/* Sổ câu sai: tự lưu câu làm sai (khi luyện từng câu hoặc khi nộp bài thi) để ôn lại.
   Dữ liệu: localStorage 'toeic:wrong' = {v:1, seeded:bool, items:{"<id>#<n>":{id,n,part,at,miss,fixed,fixedAt}}} */
(function(){
const T=window.TOEIC, MANIFEST=window.MANIFEST||[], KEY='toeic:wrong', LET='ABCD', PAGE=20;
const PV={1:'Mô tả tranh',2:'Hỏi – đáp',3:'Hội thoại',4:'Bài nói',5:'Điền vào câu',6:'Điền vào đoạn văn',7:'Đọc hiểu'};
const esc=T.esc, md=s=>window.marked?marked.parse(s||'',{breaks:true}):esc(s), mdi=s=>window.marked?marked.parseInline(s||''):esc(s);
let DB=null;
function db(){
  if(DB)return DB;
  try{DB=JSON.parse(localStorage.getItem(KEY))}catch(e){}
  if(!DB||!DB.items)DB={v:1,seeded:false,items:{}};
  return DB;
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(DB))}catch(e){}}
const k=(id,n)=>id+'#'+n;
function add(id,q){
  const d=db(), it=d.items[k(id,q.n)]||{id,n:q.n,part:q.part,miss:0};
  it.miss++; it.at=Date.now(); it.fixed=false; delete it.fixedAt;
  d.items[k(id,q.n)]=it; save();
}
function counts(){const v=Object.values(db().items);const open=v.filter(x=>!x.fixed).length;return {open,fixed:v.length-open,all:v.length}}

/* tải data.js của một đề mà không đụng tới window.TEST của trang làm bài */
const CACHE={};
function loadTest(id){
  if(!CACHE[id])CACHE[id]=fetch('tests/'+id+'/data.js').then(r=>{if(!r.ok)throw new Error(id);return r.text()}).then(txt=>{
    const w={}; new Function('window',txt)(w); const t=w.TEST; t.QN={}; t.G={};
    t.questions.forEach(q=>t.QN[q.n]=q); (t.groups||[]).forEach(g=>t.G[g.id]=g); return t;
  }).catch(e=>{delete CACHE[id];throw e});
  return CACHE[id];
}
/* lần đầu mở sổ: lấy các câu sai từ bài đã làm trước khi có tính năng này */
async function seed(){
  const d=db(); if(d.seeded)return;
  for(const m of MANIFEST){
    let s=null; try{s=JSON.parse(localStorage.getItem('toeic:'+m.id))}catch(e){}
    if(!s)continue;
    const ans=Object.assign({},(s.exam&&s.exam.submitted&&s.exam.ans)||{},(s.prac&&s.prac.ans)||{});
    if(!Object.keys(ans).length)continue;
    let t; try{t=await loadTest(m.id)}catch(e){continue}
    const pa=(s.prac&&s.prac.ans)||{}, ea=(s.exam&&s.exam.submitted&&s.exam.ans)||{};
    t.questions.forEach(q=>{
      const wrong=(pa[q.n]!==undefined&&pa[q.n]!==q.ans)||(ea[q.n]!==undefined&&ea[q.n]!==q.ans);
      if(wrong&&!d.items[k(m.id,q.n)])d.items[k(m.id,q.n)]={id:m.id,n:q.n,part:q.part,miss:1,at:s.exam&&s.exam.subAt||Date.now()};
    });
  }
  d.seeded=true; save();
}

/* ---------- giao diện ---------- */
const U={st:'open',part:0,sort:'new',list:null,shown:PAGE,pick:{},open:{},busy:false,err:''};
function buildList(){
  let v=Object.values(db().items);
  if(U.st==='open')v=v.filter(x=>!x.fixed); else if(U.st==='fixed')v=v.filter(x=>x.fixed);
  if(U.part)v=v.filter(x=>x.part===U.part);
  v.sort(U.sort==='miss'?(a,b)=>b.miss-a.miss||b.at-a.at:(a,b)=>(b.at||0)-(a.at||0));
  U.list=v.map(x=>k(x.id,x.n)); U.shown=PAGE;
}
const title=id=>{const m=MANIFEST.find(t=>t.id===id);return m?m.title:id};
function itemHTML(key,t){
  const it=db().items[key]; if(!it)return '';
  const q=t.QN[it.n]; if(!q)return '';
  const g=q.g&&t.G[q.g], pick=U.pick[key], done=pick!==undefined;
  const opts=q.opts.map((o,i)=>{
    let c='opt'; if(done){if(i===q.ans)c+=pick===i?' ok':' miss'; else if(pick===i)c+=' bad'}
    return `<button class="${c}" data-wb="pick" data-k="${esc(key)}" data-i="${i}" ${done?'disabled':''}><span class="bub">${LET[i]}</span><span class="otx">${esc(o)}</span></button>`;
  }).join('');
  const listen=q.part<=4, noAudio=MANIFEST.find(m=>m.id===it.id)?.audio===false;
  const audio=listen&&!noAudio?`<div class="wbaudio"><span>Audio Part ${q.part} · cả bài, tua tới đoạn cần nghe</span><audio controls preload="none" src="tests/${esc(it.id)}/audio/part${q.part}.mp3"></audio></div>`:'';
  const passage=g&&q.part>=6?`<details class="wbpass" ${U.open['p'+key]!==false?'open':''}><summary>${esc(g.title||'Bài đọc')} · câu ${g.lo}–${g.hi}</summary><div class="passage md">${md(g.passage)}</div></details>`:'';
  const img=q.img?`<img class="qimg" src="tests/${esc(it.id)}/img/${esc(q.img)}.jpg" alt="Hình câu ${q.n}" loading="lazy">`:'';
  const stem=q.stem?mdi(q.stem):(q.part===1?'Chọn câu mô tả đúng nhất về bức tranh.':'Chọn phương án phù hợp nhất.');
  let verdict='',ex='';
  if(done){
    verdict=pick===q.ans?`<span class="verdict ok">Chính xác · Đáp án ${LET[q.ans]} — đã chuyển sang “Đã làm đúng”</span>`:`<span class="verdict bad">Chưa đúng · Đáp án đúng là ${LET[q.ans]}</span>`;
    ex=`<div class="expl md"><div class="t">Giải thích</div>${q.desc?`<p><b>Mô tả ảnh:</b> ${esc(q.desc)}</p>`:''}<div class="tbl">${md(q.expl)}</div></div>`;
    if(g&&g.expl){const o=!!U.open['g'+key];ex+=`<div><button class="btn sm" data-wb="gexp" data-k="${esc(key)}">${o?'Ẩn':'Xem'} ${q.part>=6?'bản dịch bài đọc':'transcript & bản dịch'}</button></div>${o?`<div class="gexp md"><div class="tbl">${md(g.expl)}</div></div>`:''}`}
  }
  const when=it.at?new Date(it.at).toLocaleDateString('vi-VN'):'';
  return `<article class="q wbq" id="wb-${esc(key.replace('#','-'))}">
    <div class="wbmeta"><button class="wbsrc" data-wb="open" data-id="${esc(it.id)}" title="Mở đề">${esc(title(it.id))} · câu ${q.n}</button><span class="chip-s">Part ${q.part}</span><span class="chip-s ${it.fixed?'ok':'bad'}">${it.fixed?'Đã làm đúng':`Sai ${it.miss} lần`}</span>${when?`<span class="wbd">${when}</span>`:''}<button class="btn sm ghost wbrm" data-wb="rm" data-k="${esc(key)}" aria-label="Bỏ câu này khỏi sổ">Bỏ khỏi sổ</button></div>
    ${passage}${audio}<div class="qh"><span class="qn">${q.n}</span><div class="qs">${stem}</div></div>${img}<div class="opts">${opts}</div>${verdict}${ex}</article>`;
}
async function render(){
  const app=document.getElementById('app');
  const d=db();
  if(!d.seeded&&!U.busy){U.busy=true;app.innerHTML=T.siteNav('wrong')+`<main class="wrap home"><div class="empty">Đang tổng hợp các câu đã làm sai…</div></main>`;
    try{await seed()}catch(e){} U.busy=false;}
  if(!U.list)buildList();
  const c=counts(), v=Object.values(d.items);
  const pc=p=>v.filter(x=>x.part===p&&(U.st==='all'||(U.st==='fixed'?x.fixed:!x.fixed))).length;
  const parts=[1,2,3,4,5,6,7].filter(p=>v.some(x=>x.part===p));
  const chip=(act,val,cur,label)=>`<button class="chip" data-wb="${act}" data-v="${val}" aria-pressed="${cur===val}">${label}</button>`;
  const keys=U.list.slice(0,U.shown);
  const ids=[...new Set(keys.map(x=>x.split('#')[0]))];
  let tests={}, err='';
  await Promise.all(ids.map(id=>loadTest(id).then(t=>tests[id]=t).catch(()=>{err='Không tải được dữ liệu một số đề.'})));
  if(location.hash.slice(1).split('/')[0]!=='wrong')return; // người dùng đã chuyển trang trong lúc tải
  const body=!c.all?`<div class="empty wbempty"><b>Sổ đang trống.</b><br>Khi bạn luyện từng câu hoặc nộp bài thi, câu nào sai sẽ tự lưu vào đây để ôn lại.<div class="row" style="justify-content:center;margin-top:1rem"><a class="btn pri" href="#">Đi luyện đề ${T.ICON.arrow}</a></div></div>`
    :!U.list.length?`<div class="empty">Không có câu nào khớp bộ lọc này.</div>`
    :keys.map(key=>tests[key.split('#')[0]]?itemHTML(key,tests[key.split('#')[0]]):'').join('')+(U.list.length>U.shown?`<div class="row" style="justify-content:center"><button class="btn" data-wb="more">Xem thêm ${Math.min(PAGE,U.list.length-U.shown)} câu</button></div>`:'');
  app.innerHTML=T.siteNav('wrong')+`<main class="wrap home wb">
    <section class="hero"><div class="eyebrow">Ôn tập</div><h1>Sổ câu sai</h1><p>Câu bạn làm sai khi luyện hoặc khi thi được tự lưu ở đây. Làm lại đúng thì câu chuyển sang mục “Đã làm đúng”; sai lại thì quay về “Cần ôn”.</p>
     <div class="facts"><span><b>${c.open}</b> câu cần ôn</span><span><b>${c.fixed}</b> câu đã làm đúng lại</span></div></section>
    ${c.all?`<div class="wbbar"><div class="fbar">${chip('st','open',U.st,`Cần ôn · ${c.open}`)}${chip('st','fixed',U.st,`Đã làm đúng · ${c.fixed}`)}${chip('st','all',U.st,`Tất cả · ${c.all}`)}</div>
     <div class="fbar">${chip('part',0,U.part,'Mọi Part')}${parts.map(p=>chip('part',p,U.part,`Part ${p} · ${pc(p)}`)).join('')}</div>
     <div class="fbar"><span class="lbl">Sắp xếp</span>${chip('sort','new',U.sort,'Mới nhất')}${chip('sort','miss',U.sort,'Sai nhiều nhất')}</div></div>`:''}
    ${err?`<div class="dirs" role="alert">${esc(err)}</div>`:''}
    <div class="wblist">${body}</div></main>`;
}
function keepRender(){const y=scrollY;render().then(()=>scrollTo(0,y))}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-wb]'); if(!b)return;
  const a=b.dataset.wb, key=b.dataset.k, d=db();
  if(a==='st'){U.st=b.dataset.v;U.list=null;U.pick={};render().then(()=>scrollTo(0,0))}
  else if(a==='part'){U.part=+b.dataset.v;U.list=null;U.pick={};render()}
  else if(a==='sort'){U.sort=b.dataset.v;U.list=null;render()}
  else if(a==='more'){U.shown+=PAGE;keepRender()}
  else if(a==='gexp'){U.open['g'+key]=!U.open['g'+key];keepRender()}
  else if(a==='rm'){delete d.items[key];save();U.list=U.list.filter(x=>x!==key);keepRender()}
  else if(a==='open'){location.hash='';setTimeout(()=>window.TOEIC.openTest&&window.TOEIC.openTest(b.dataset.id),80)}
  else if(a==='pick'){
    const it=d.items[key]; if(!it)return; const i=+b.dataset.i; U.pick[key]=i;
    loadTest(it.id).then(t=>{const q=t.QN[it.n];
      if(i===q.ans){it.fixed=true;it.fixedAt=Date.now()} else {it.miss++;it.at=Date.now();it.fixed=false}
      save(); keepRender();});
  }
});
document.addEventListener('toggle',e=>{const s=e.target; if(s.classList&&s.classList.contains('wbpass')){const a=s.closest('.wbq');if(a)U.open['p'+a.id.replace(/^wb-/,'').replace(/-(\d+)$/,'#$1')]=s.open}},true);
window.WrongBook={add,counts,render,reset:()=>{U.list=null;U.pick={};U.shown=PAGE}};
})();
