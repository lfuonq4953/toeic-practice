(function(){
const MANIFEST=window.MANIFEST||[];
let Q=[],GR=[],G={},META=null,KEY='';
const PARTS={
 1:{n:'Photographs',vi:'Mô tả tranh',r:[1,6],dir:'Nghe 4 câu mô tả về mỗi bức tranh và chọn câu mô tả đúng nhất. Các câu chỉ được đọc một lần và không in trong đề.'},
 2:{n:'Question–Response',vi:'Hỏi – đáp',r:[7,31],dir:'Nghe một câu hỏi hoặc câu nói và ba phương án trả lời. Chọn phương án đáp lại phù hợp nhất. Chỉ đọc một lần, không in trong đề.'},
 3:{n:'Conversations',vi:'Hội thoại',r:[32,70],dir:'Nghe các đoạn hội thoại giữa hai hoặc nhiều người, mỗi đoạn trả lời 3 câu hỏi. Chỉ đọc một lần.'},
 4:{n:'Talks',vi:'Bài nói',r:[71,100],dir:'Nghe các bài nói của một người, mỗi bài trả lời 3 câu hỏi. Chỉ đọc một lần.'},
 5:{n:'Incomplete Sentences',vi:'Điền vào câu',r:[101,130],dir:'Chọn từ hoặc cụm từ phù hợp nhất để hoàn thành mỗi câu.'},
 6:{n:'Text Completion',vi:'Điền vào đoạn văn',r:[131,146],dir:'Đọc các văn bản có chỗ trống (từ, cụm từ hoặc câu) và chọn phương án điền phù hợp nhất.'},
 7:{n:'Reading Comprehension',vi:'Đọc hiểu',r:[147,200],dir:'Đọc các bài như email, thông báo, bài báo, tin nhắn. Mỗi bài hoặc cụm bài kèm theo một số câu hỏi.'}
};
const LETTERS='ABCD';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const md=s=>marked.parse(s||'',{breaks:true});
const mdi=s=>marked.parseInline(s||'');
const $=s=>document.querySelector(s);
const au=$('#au');
const isVocab=()=>location.hash.slice(1).split('/')[0]==='vocab';
/* ---------- tùy chỉnh hiển thị: cỡ chữ + giao diện sáng/tối ---------- */
const PKEY='toeic:prefs';
let PREF={fs:'m',theme:'auto'};
try{Object.assign(PREF,JSON.parse(localStorage.getItem(PKEY))||{})}catch(e){}
const FS={s:'15px',m:'16px',l:'18px',xl:'20px'};
function applyPrefs(){
  const r=document.documentElement;
  r.style.fontSize=FS[PREF.fs]||'16px';
  r.setAttribute('data-fs',PREF.fs);
  if(PREF.theme==='auto')r.removeAttribute('data-theme'); else r.setAttribute('data-theme',PREF.theme);
  const dark=PREF.theme==='dark'||(PREF.theme==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);
  const m=document.querySelector('meta[name=theme-color]'); if(m)m.content=dark?'#11151c':'#f5f4ef';
}
applyPrefs();
const ICON={
  sun:'<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="3.6"/><path d="M10 1.5v2.2M10 16.3v2.2M1.5 10h2.2M16.3 10h2.2M4 4l1.5 1.5M14.5 14.5 16 16M4 16l1.5-1.5M14.5 5.5 16 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  type:'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2 15.5 6.2 4.5h1.2l4.2 11M3.6 11.6h6.4M12.5 15.5l2.7-7h.9l2.7 7M13.5 13h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  head:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="3" y="13.5" width="4.5" height="7" rx="1.6"/><rect x="16.5" y="13.5" width="4.5" height="7" rx="1.6"/></svg>',
  book:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 5.5C6 4.3 9 4.3 12 6c3-1.7 6-1.7 8.5-.5v13c-2.5-1.2-5.5-1.2-8.5.5-3-1.7-6-1.7-8.5-.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 6v13" stroke="currentColor" stroke-width="1.8"/></svg>',
  cards:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="13" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 3h10.5A2.5 2.5 0 0 1 21 5.5V16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  clock:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  arrow:'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  back:'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16 10H5M9 5.5 4.5 10 9 14.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
const prefsBtn=()=>`<button class="ibtn" data-act="prefs" aria-label="Cỡ chữ và giao diện" title="Cỡ chữ và giao diện" aria-expanded="${!!(window.UIP&&UIP.open)}">${ICON.type}</button>`;
function prefsHTML(){
  const o=(k,v,l)=>`<button class="seg-b" data-act="pref" data-k="${k}" data-v="${v}" aria-pressed="${PREF[k]===v}">${l}</button>`;
  return `<div class="prefs" role="dialog" aria-label="Tùy chỉnh hiển thị"><div class="pf-h">Hiển thị</div>
   <div class="pf-r"><span>Cỡ chữ</span><div class="seg">${o('fs','s','<small>A</small>')}${o('fs','m','A')}${o('fs','l','<big>A</big>')}${o('fs','xl','<b>A</b>')}</div></div>
   <div class="pf-r"><span>Giao diện</span><div class="seg">${o('theme','auto','Tự động')}${o('theme','light','Sáng')}${o('theme','dark','Tối')}</div></div>
   <p class="pf-n">Lưu trên trình duyệt này.</p></div>`;
}
window.UIP={open:false};
function paintPrefs(){
  let el=document.getElementById('prefs-pop');
  if(!UIP.open){if(el)el.remove();document.querySelectorAll('[data-act=prefs]').forEach(b=>b.setAttribute('aria-expanded','false'));return}
  if(!el){el=document.createElement('div');el.id='prefs-pop';document.body.appendChild(el)}
  el.innerHTML=prefsHTML();
  const b=[...document.querySelectorAll('[data-act=prefs]')].find(x=>x.offsetParent);
  if(b){const r=b.getBoundingClientRect();el.style.top=(r.bottom+8)+'px';el.style.right=Math.max(12,innerWidth-r.right)+'px';b.setAttribute('aria-expanded','true')}
}
/* thanh điều hướng chung: Luyện đề | Từ vựng */
function siteNav(active){
  return `<header class="site"><div class="wrap sitein"><a class="logo" href="#" aria-label="Trang Luyện đề"><span class="lm">T</span><span class="lt">TOEIC<small>Luyện thi mỗi ngày</small></span></a>
   <nav class="snav" aria-label="Chuyên mục"><a href="#" ${active==='tests'?'aria-current="page"':''}>${ICON.book}<span>Luyện đề</span></a><a href="#vocab" ${active==='vocab'?'aria-current="page"':''}>${ICON.cards}<span>Từ vựng</span></a></nav>${prefsBtn()}</div></header>`;
}
window.TOEIC={siteNav,esc,ICON,prefsBtn,loadScript:src=>loadScript(src)};

/* ---------- state ---------- */
let S;
function fresh(){return {view:'home',kind:null,part:1,exam:null,prac:{ans:{}},filter:'all'}}
function load(){try{const j=JSON.parse(localStorage.getItem(KEY));if(j&&j.prac)return j}catch(e){}return null}
function save(){if(!KEY)return;try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
S=fresh();
let UI={open:{},modal:null,pal:false,audioPart:null,test:null,err:''};
const newExam=()=>({ans:{},flags:[],phase:'L',t0:Date.now(),rt0:null,submitted:false,subAt:null});

const curAns=()=> (S.kind==='practice'?S.prac.ans:(S.exam?S.exam.ans:{}));
const inReview=()=>S.view==='review'||S.view==='result';
const reveal=q=> S.view==='review' || (S.kind==='practice'&&S.view==='test'&&curAns()[q.n]!==undefined);

/* ---------- scoring ---------- */
function score(){
  const a=S.exam.ans, per={};
  for(let p=1;p<=7;p++)per[p]={c:0,t:0,u:0};
  Q.forEach(q=>{const x=per[q.part];x.t++; if(a[q.n]===undefined)x.u++; else if(a[q.n]===q.ans)x.c++;});
  const L=[1,2,3,4].reduce((s,p)=>s+per[p].c,0), R=[5,6,7].reduce((s,p)=>s+per[p].c,0);
  const scale=r=>Math.max(5,Math.min(495,Math.round((5+r*4.9)/5)*5));
  return {per,L,R,sL:scale(L),sR:scale(R)};
}

/* ---------- audio ---------- */
function setAudio(part,play){
  if(UI.audioPart!==part){UI.audioPart=part;au.src='tests/'+UI.test+'/audio/part'+part+'.mp3';au.load();}
  if(play){au.play().catch(()=>{});}
}
function stopAudio(){try{au.pause()}catch(e){}}
au.addEventListener('ended',()=>{
  if(S.view==='test'&&S.kind==='exam'&&S.exam.phase==='L'&&UI.audioPart<4){
    const nx=UI.audioPart+1; S.part=nx; setAudio(nx,true); save(); render(true);
  } else paintAudio();
});
['timeupdate','play','pause','loadedmetadata','durationchange'].forEach(e=>au.addEventListener(e,paintAudio));
const fmt=t=>{t=Math.max(0,Math.floor(t||0));return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0')};
function paintAudio(){
  const pp=$('#apl'),sk=$('#ask'),tm=$('#atm');
  if(!pp)return;
  pp.innerHTML=au.paused?'<svg viewBox="0 0 16 16"><path d="M4 2l10 6-10 6z"/></svg>':'<svg viewBox="0 0 16 16"><path d="M3 2h4v12H3zM9 2h4v12H9z"/></svg>';
  pp.setAttribute('aria-label',au.paused?'Phát':'Tạm dừng');
  if(sk&&document.activeElement!==sk){sk.max=Math.floor(au.duration||0);sk.value=Math.floor(au.currentTime||0)}
  if(tm)tm.textContent=fmt(au.currentTime)+' / '+fmt(au.duration);
}

/* ---------- timer ---------- */
let tick=null;
const READ_SEC=75*60;
function paintTimer(){
  const el=$('#tmr'); if(!el||!UI.test||!S.exam)return;
  if(S.kind!=='exam'||S.view!=='test'){return}
  if(S.exam.phase==='L'){el.textContent='Listening';el.classList.remove('low');return}
  const left=READ_SEC-Math.floor((Date.now()-S.exam.rt0)/1000);
  el.textContent=fmt(left>0?left:0);
  el.classList.toggle('low',left<=300);
  if(left<=0){submitExam()}
}
function startTick(){clearInterval(tick);tick=setInterval(paintTimer,1000)}

/* ---------- actions ---------- */
function startExam(){
  S.exam=newExam();S.kind='exam';S.view='test';S.part=1;S.filter='all';
  setAudio(1,true);save();startTick();render();scrollTo(0,0);
}
function resumeExam(){
  S.kind='exam';S.view='test';
  if(S.exam.phase==='L'){S.part=Math.min(S.part,4)||1;setAudio(S.part)}
  startTick();render();
}
function toReading(){
  S.exam.phase='R';S.exam.rt0=Date.now();S.part=5;stopAudio();save();render();scrollTo(0,0);
}
function submitExam(){
  stopAudio();clearInterval(tick);
  {const sc=score();S.exam.score={L:sc.L,R:sc.R,sL:sc.sL,sR:sc.sR};}S.exam.submitted=true;S.exam.subAt=Date.now();S.view='result';save();render();scrollTo(0,0);
}
function startPractice(p){
  S.kind='practice';S.view='test';S.part=p;
  if(p<=4)setAudio(p);else stopAudio();
  save();render();scrollTo(0,0);
}
function home(){stopAudio();clearInterval(tick);S.view='home';save();render();scrollTo(0,0)}
function library(){stopAudio();clearInterval(tick);UI.test=null;UI.open={};UI.modal=null;render();scrollTo(0,0)}
function loadScript(src){return new Promise((ok,no)=>{const el=document.createElement('script');el.src=src;el.onload=ok;el.onerror=()=>no(new Error(src));document.head.appendChild(el)})}
async function openTest(id){
  const m=MANIFEST.find(t=>t.id===id); if(!m)return;
  UI.err='';
  try{ delete window.TEST; await loadScript('tests/'+id+'/data.js'); }
  catch(e){ UI.err='Không tải được dữ liệu đề "'+id+'". Kiểm tra thư mục tests/'+id+'/data.js.'; render(); return; }
  const T=window.TEST; Q=T.questions; GR=T.groups; G={}; GR.forEach(g=>G[g.id]=g);
  META=Object.assign({},m,T.meta||{});
  UI.test=id; KEY='toeic:'+id; UI.audioPart=null; UI.open={}; au.removeAttribute('src');
  S=load()||fresh();
  if(S.view==='test'){S.view='home'}
  else if(S.view==='review'&&!(S.exam&&S.exam.submitted))S.view='home';
  else if(S.view==='review'&&S.part<=4)setAudio(S.part);
  render(); scrollTo(0,0);
}
function testState(id){
  const r={st:'Chưa làm',cls:'',pc:0,score:null,doing:null,prac:0};
  try{const j=JSON.parse(localStorage.getItem('toeic:'+id));
    if(j&&j.prac)r.prac=Object.keys(j.prac.ans||{}).length;
    if(j&&j.exam&&j.exam.submitted){r.score=j.exam.score?j.exam.score.sL+j.exam.score.sR:null;r.st=r.score!==null?`Đã thi · ${r.score} điểm`:'Đã nộp bài';r.cls='done';r.pc=100}
    else if(j&&j.exam){const n=Object.keys(j.exam.ans||{}).length;r.doing=n;r.st=`Đang thi dở · ${n}/200`;r.cls='doing';r.pc=n/2}
    else if(r.prac){r.st=`Đã luyện ${r.prac}/200 câu`;r.cls='prac';r.pc=r.prac/2}
  }catch(e){}
  return r;
}
function libHTML(){
  const states=MANIFEST.map(t=>({t,s:testState(t.id)}));
  const done=states.filter(x=>x.s.score!==null), best=done.length?Math.max(...done.map(x=>x.s.score)):null;
  const doing=states.find(x=>x.s.doing!==null);
  let known=0;try{const v=JSON.parse(localStorage.getItem('toeic:vocab'));if(v&&v.s)known=Object.values(v.s).filter(x=>x===1).length}catch(e){}
  const cards=states.map(({t,s},i)=>{
    const num=(t.id.match(/\d+/)||[String(i+1)])[0].padStart(2,'0');
    return `<button class="tcard ${s.cls}" data-act="open" data-id="${esc(t.id)}"><span class="tnum" aria-hidden="true">${esc(num)}</span><span class="tbody"><span class="tt">${esc(t.title)}</span><span class="ts">${esc(t.subtitle||'')}</span>
      <span class="tm"><span>${t.questions||200} câu · ${t.minutes||120} phút</span><span class="st ${s.cls}">${s.st}</span></span><span class="mini"><i style="width:${s.pc}%"></i></span></span></button>`;
  }).join('');
  const strip=`<div class="quick">
    ${doing?`<button class="qcard warm" data-act="open" data-id="${esc(doing.t.id)}"><span class="qi">${ICON.clock}</span><span><b>Tiếp tục ${esc(doing.t.title)}</b><small>Bài thi đang làm dở · ${doing.s.doing}/200 câu</small></span>${ICON.arrow}</button>`:''}
    <a class="qcard" href="#vocab"><span class="qi">${ICON.cards}</span><span><b>Học từ vựng</b><small>${known?`Đã thuộc ${known} từ · ôn tiếp bằng flashcard`:'Flashcard theo Part và theo từ loại'}</small></span>${ICON.arrow}</a>
  </div>`;
  return siteNav('tests')+`<main class="wrap home">
   <section class="hero"><div class="eyebrow">Luyện đề TOEIC</div><h1>Chọn một đề để bắt đầu</h1><p>Thi thử đủ 200 câu theo đúng thời gian, hoặc luyện từng Part và xem lời giải ngay sau mỗi câu. Kết quả được lưu trên trình duyệt này.</p>
    <div class="facts"><span><b>${MANIFEST.length}</b> đề</span><span><b>${done.length}</b> đã thi</span>${best!==null?`<span>Điểm cao nhất <b>${best}</b></span>`:''}</div></section>
   ${strip}
   ${UI.err?`<div class="dirs" role="alert">${esc(UI.err)}</div>`:''}
   <section><div class="sec-h"><h2>Thư viện đề</h2><span>Nhấn vào một đề để chọn thi thử hoặc luyện Part</span></div>
   <div class="tests">${cards||'<div class="empty">Chưa có đề nào trong tests/manifest.js.</div>'}</div></section></main>`;
}
function modal(msg,okLabel,fn){UI.modal={msg,okLabel,fn};render(true)}

/* ---------- views ---------- */
function partStats(p){
  const qs=Q.filter(q=>q.part===p);let a=0,c=0;
  qs.forEach(q=>{const v=S.prac.ans[q.n];if(v!==undefined){a++;if(v===q.ans)c++}});
  return {t:qs.length,a,c};
}
function homeHTML(){
  const ex=S.exam;
  let side='';
  if(ex&&!ex.submitted){
    const n=Object.keys(ex.ans).length;
    side=`<div class="card accent-l"><div class="eyebrow">Đang làm dở</div><h2>Bài thi chưa nộp</h2><p>Đã trả lời <b>${n}/200</b> câu, đang ở phần ${ex.phase==='L'?'Listening':'Reading'}.</p><div class="mini lg"><i style="width:${n/2}%"></i></div><div class="row"><button class="btn pri" data-act="resume">Tiếp tục làm bài ${ICON.arrow}</button></div></div>`;
  } else if(ex&&ex.submitted){
    const s=score();
    side=`<div class="card"><div class="eyebrow">Lần thi gần nhất</div><div class="last"><div><small>Điểm ước tính</small><span class="big">${s.sL+s.sR}<span class="note">/990</span></span></div><div><small>Listening</small><span class="big sm">${s.L}<span class="note">/100</span></span></div><div><small>Reading</small><span class="big sm">${s.R}<span class="note">/100</span></span></div></div><div class="row"><button class="btn" data-act="result">Xem kết quả</button><button class="btn" data-act="review">Xem lại đáp án</button></div></div>`;
  } else {
    side=`<div class="card soft"><div class="eyebrow">Mẹo</div><h2>Mới bắt đầu?</h2><p>Luyện từng Part để làm quen dạng câu hỏi và đọc lời giải, sau đó thi thử toàn bộ để biết điểm ước tính.</p></div>`;
  }
  const pcard=p=>{
    const st=partStats(p),P=PARTS[p],pc=st.a/st.t*100;
    return `<button class="pcard ${st.a===st.t?'full':''}" data-act="prac" data-part="${p}"><span class="ph"><span class="pn">Part ${p}</span><span class="pq">${st.t} câu</span></span><span class="pt">${P.vi}</span><span class="pv">${P.n}</span><span class="pm"><span>${st.a?`Đúng ${st.c}/${st.a}`:'Chưa làm'}</span><span>${st.a?Math.round(pc)+'%':''}</span></span><span class="mini"><i style="width:${pc}%"></i></span></button>`;
  };
  return siteNav('tests')+`<main class="wrap home">
   <section class="hero"><button class="btn sm ghost" data-act="lib">${ICON.back} Tất cả đề</button><div class="eyebrow">${esc(META.source||'')}</div><h1>${esc(META.title)}</h1>
   <p>${esc(META.subtitle||'Đề đầy đủ gồm Listening và Reading, có audio, chấm điểm tự động, lời giải chi tiết và bản dịch tiếng Việt.')}</p>
   <div class="facts"><span><b>${Q.length}</b> câu</span><span>Listening <b>45</b> phút</span><span>Reading <b>75</b> phút</span><span><b>7</b> Part</span></div></section>
   <div class="modes">
    <div class="card feature"><div class="eyebrow">Mô phỏng phòng thi</div><h2>Thi thử toàn bộ</h2><p>Nghe audio 4 Part liên tục, sau đó làm Reading trong 75 phút. Đáp án và lời giải chỉ hiện sau khi nộp bài.</p><div class="row"><button class="btn pri lg" data-act="start">${ex&&!ex.submitted?'Làm bài mới':'Bắt đầu thi thử'} ${ICON.arrow}</button><span class="note">Nên đeo tai nghe · audio phát một lần</span></div></div>
    ${side}
   </div>
   <section><div class="sec-h"><h2><span class="sh-i">${ICON.head}</span>Listening</h2><span>Có audio, tua và đổi tốc độ được</span></div><div class="parts">${[1,2,3,4].map(pcard).join('')}</div></section>
   <section><div class="sec-h"><h2><span class="sh-i">${ICON.book}</span>Reading</h2><span>Đáp án và lời giải hiện ngay sau mỗi câu</span></div><div class="parts">${[5,6,7].map(pcard).join('')}</div></section>
  </main>`;
}

function qpass(q){
  if(S.view!=='review')return true;
  const a=S.exam.ans[q.n],f=S.filter;
  if(f==='wrong')return a!==undefined&&a!==q.ans;
  if(f==='blank')return a===undefined;
  if(f==='flag')return S.exam.flags.includes(q.n);
  return true;
}
function qHTML(q){
  const ans=curAns()[q.n], rev=reveal(q), exam=S.kind==='exam'&&S.view==='test';
  const lettersOnly=(q.part<=2)&&!rev&&!(S.view==='review');
  const locked=S.view==='review'||(S.kind==='practice'&&ans!==undefined);
  const opts=q.opts.map((o,i)=>{
    let c='opt';
    if(rev){ if(i===q.ans)c+=(ans===i?' ok':' miss'); else if(ans===i)c+=' bad'; }
    else if(ans===i)c+=' sel';
    return `<button class="${c}" data-act="pick" data-q="${q.n}" data-i="${i}" ${locked?'disabled':''} aria-pressed="${ans===i}"><span class="bub">${LETTERS[i]}</span><span class="otx">${esc(o)}</span></button>`;
  }).join('');
  let verdict='';
  if(rev){
    if(ans===undefined)verdict=`<span class="verdict na">Chưa trả lời · Đáp án đúng: ${LETTERS[q.ans]}</span>`;
    else if(ans===q.ans)verdict=`<span class="verdict ok">Chính xác · Đáp án ${LETTERS[q.ans]}</span>`;
    else verdict=`<span class="verdict bad">Chưa đúng · Bạn chọn ${LETTERS[ans]}, đáp án đúng là ${LETTERS[q.ans]}</span>`;
  }
  const flag=(exam||S.view==='review')?`<button class="flag ${S.exam&&S.exam.flags.includes(q.n)?'on':''}" data-act="flag" data-q="${q.n}" ${S.view==='review'?'disabled':''} aria-label="Đánh dấu xem lại câu ${q.n}">${S.exam&&S.exam.flags.includes(q.n)?'⚑ Đã đánh dấu':'⚐ Đánh dấu'}</button>`:'';
  const img=q.img?`<img class="qimg" src="tests/${UI.test}/img/${q.img}.jpg" alt="Hình minh họa câu ${q.n}" loading="lazy">`:'';
  let ex='';
  if(rev){
    ex=`<div class="expl md"><div class="t">Giải thích</div>${q.desc?`<p><b>Mô tả ảnh:</b> ${esc(q.desc)}</p>`:''}<div class="tbl">${md(q.expl)}</div></div>`;
  }
  return `<article class="q" id="q${q.n}"><div class="qh"><span class="qn">${q.n}</span><div class="qs">${q.stem?mdi(q.stem):(q.part===1?'Chọn câu mô tả đúng nhất về bức tranh.':'Chọn phương án phù hợp nhất cho chỗ trống.')}</div>${flag}</div>${img}<div class="opts ${lettersOnly?'lettersonly':''}">${opts}</div>${verdict}${ex}</article>`;
}
function gexpHTML(g){
  const answered=S.view==='review'||(S.kind==='practice'&&Q.some(q=>q.g===g.id&&curAns()[q.n]!==undefined));
  if(!answered||!g.expl)return '';
  const k='g'+g.id, label=g.part>=6?'Bản dịch bài đọc':'Transcript & bản dịch';
  const open=!!UI.open[k];
  return `<div><button class="btn sm" data-act="gexp" data-k="${k}">${open?'Ẩn':'Xem'} ${label}</button></div>${open?`<div class="gexp md"><div class="tbl">${md(g.expl)}</div></div>`:''}`;
}
function contentHTML(){
  const p=S.part,P=PARTS[p];
  const qs=Q.filter(q=>q.part===p&&qpass(q));
  let body='';
  if(!qs.length) body=`<div class="empty">Không có câu nào khớp bộ lọc này trong Part ${p}.</div>`;
  else if(p<=2||p===5){ body=qs.map(qHTML).join(''); }
  else{
    const gids=[...new Set(qs.map(q=>q.g))];
    body=gids.map(id=>{
      const g=G[id],gq=qs.filter(q=>q.g===id);
      const head=`<div class="ghead"><b>Câu ${g.lo}–${g.hi}</b></div>`;
      if(p>=6){
        return `<section class="grp g67"><div class="passage md"><div class="ptt">${esc(g.title)}</div>${md(g.passage)}</div><div class="gq">${gq.map(qHTML).join('')}${gexpHTML(g)}</div></section>`;
      }
      return `<section class="grp">${head}${gq.map(qHTML).join('')}${gexpHTML(g)}</section>`;
    }).join('');
  }
  return `<div class="ptitle"><h2>Part ${p} · ${P.n}</h2><span>${P.vi} · câu ${P.r[0]}–${P.r[1]}</span></div><div class="dirs">${P.dir}</div>${body}`;
}
function palHTML(){
  const a=curAns(), rev=S.view==='review'||S.view==='result';
  const parts=S.kind==='practice'&&S.view==='test'?[S.part]:[1,2,3,4,5,6,7];
  const lockR=S.kind==='exam'&&S.view==='test'&&S.exam.phase==='L';
  const groups=parts.map(p=>{
    const dis=lockR&&p>=5;
    const btns=Q.filter(q=>q.part===p).map(q=>{
      let c='pb',v=a[q.n];
      if(rev||(S.kind==='practice'&&v!==undefined)){ if(v===undefined)c+=' na'; else c+=v===q.ans?' ok':' bd'; }
      else if(v!==undefined)c+=' a';
      if(S.exam&&S.exam.flags.includes(q.n)&&S.kind==='exam')c+=' fl';
      if(q.part===S.part&&false)c+=' cur';
      return `<button class="${c}" data-act="jump" data-q="${q.n}" ${dis?'disabled':''} aria-label="Câu ${q.n}">${q.n}</button>`;
    }).join('');
    return `<div class="pg"><div class="gl">Part ${p}</div><div class="pnum">${btns}</div></div>`;
  }).join('');
  const done=Object.keys(a).filter(n=>parts.includes(Q[n-1].part)).length, tot=parts.reduce((s,p)=>s+PARTS[p].r[1]-PARTS[p].r[0]+1,0);
  const legend=rev||S.kind==='practice'?`<div class="legend"><span><i style="background:var(--ok);border-color:var(--ok)"></i>Đúng</span><span><i style="background:var(--bad);border-color:var(--bad)"></i>Sai</span><span><i style="border-color:var(--warn)"></i>Bỏ trống</span></div>`:`<div class="legend"><span><i style="background:var(--accent);border-color:var(--accent)"></i>Đã chọn</span><span><i style="background:var(--warn);border-color:var(--warn)"></i>Đánh dấu</span></div>`;
  return `<div class="pal"><h3>Phiếu trả lời <span>${done}/${tot}</span></h3>${groups}${legend}</div>`;
}
function audioHTML(){
  const exam=S.kind==='exam'&&S.view==='test';
  if(S.part>4||(exam&&S.exam.phase!=='L'))return '';
  const lab=exam?`Audio Part ${UI.audioPart||1}/4 · tự chuyển Part`:`Audio Part ${S.part}`;
  return `<div class="audio wrap"><button class="pp" id="apl" data-act="aplay"></button>
   ${exam?'':'<button class="ic" data-act="aback" aria-label="Lùi 10 giây">−10s</button><button class="ic" data-act="afwd" aria-label="Tiến 10 giây">+10s</button>'}
   <span class="lab">${lab}</span>
   <input type="range" id="ask" min="0" max="100" value="0" ${exam?'disabled':''} aria-label="Tiến trình audio">
   <span class="tm" id="atm">00:00 / 00:00</span>
   ${exam?'':`<select id="aspd" aria-label="Tốc độ phát"><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option></select>`}</div>`;
}
function headerHTML(){
  const exam=S.kind==='exam'&&S.view==='test', prac=S.kind==='practice'&&S.view==='test', rev=S.view==='review';
  let right='';
  if(exam){
    right=`<span class="timer" id="tmr">Listening</span>`+
      (S.exam.phase==='L'?`<button class="btn sm" data-act="toR">Sang phần Reading</button>`:'')+
      `<button class="btn sm pri" data-act="submit">Nộp bài</button>`;
  } else if(prac){
    const st=partStats(S.part);
    right=`<span class="timer">${st.c}/${st.a} đúng</span><button class="btn sm" data-act="redo">Làm lại Part</button><button class="btn sm" data-act="home">Thoát</button>`;
  } else if(rev){
    right=`<button class="btn sm" data-act="result">Kết quả</button><button class="btn sm" data-act="home">Trang chủ</button>`;
  }
  let tabs='';
  if(!prac){
    const lockR=exam&&S.exam.phase==='L', lockL=exam&&S.exam.phase==='R';
    tabs=`<div class="tabs" role="tablist">`+[1,2,3,4,5,6,7].map(p=>{
      const dis=(lockR&&p>=5)||(lockL&&p<=4);
      return `<button class="tab" role="tab" data-act="tab" data-part="${p}" aria-selected="${p===S.part}" ${dis?'disabled':''}>Part ${p}<small>${PARTS[p].r[1]-PARTS[p].r[0]+1}</small></button>`;
    }).join('')+`</div>`;
  }
  const fb=rev?`<div class="fbar wrap" style="padding-bottom:8px">`+[['all','Tất cả'],['wrong','Câu sai'],['blank','Chưa làm'],['flag','Đã đánh dấu']].map(([k,l])=>`<button class="chip" data-act="filter" data-f="${k}" aria-pressed="${S.filter===k}">${l}</button>`).join('')+`</div>`:'';
  const title=prac?`Luyện Part ${S.part}`:rev?'Xem lại đáp án':(S.exam&&S.exam.phase==='R'?'Reading':'Listening');
  const a=curAns(), tot=prac?PARTS[S.part].r[1]-PARTS[S.part].r[0]+1:200;
  const n=prac?Q.filter(q=>q.part===S.part&&a[q.n]!==undefined).length:Object.keys(a).length;
  const back=exam?'':`<button class="ibtn" data-act="home" aria-label="Về trang đề" title="Về trang đề">${ICON.back}</button>`;
  return `<div class="hdr" id="hdr"><div class="wrap"><div class="hrow">${back}<div class="brand">${esc(META.title)} <small>${title}</small></div>${right}${prefsBtn()}</div>${tabs}</div>${fb}${audioHTML()}<div class="hprog" aria-hidden="true"><i style="width:${n/tot*100}%"></i></div></div>`;
}
function resultHTML(){
  const s=score(), tot=s.sL+s.sR;
  const blank=Object.values(s.per).reduce((a,x)=>a+x.u,0);
  const bars=[1,2,3,4,5,6,7].map(p=>{
    const x=s.per[p],pc=x.c/x.t*100;
    return `<div class="br"><span>Part ${p} · ${PARTS[p].vi}</span><div class="tr"><i class="${pc>=75?'hi':pc<50?'lo':''}" style="width:${pc}%"></i></div><b>${x.c}/${x.t}</b></div>`;
  }).join('');
  const sorted=[1,2,3,4,5,6,7].sort((a,b)=>s.per[a].c/s.per[a].t-s.per[b].c/s.per[b].t);
  const w=sorted[0];
  return siteNav('tests')+`<div class="wrap res">
   <div class="hero"><div class="eyebrow">Kết quả thi thử</div><h1>Bạn đúng ${s.L+s.R}/200 câu</h1><p>${blank?`Còn ${blank} câu chưa trả lời. `:''}Part cần ôn thêm nhiều nhất là Part ${w} (${PARTS[w].vi}), đúng ${s.per[w].c}/${s.per[w].t} câu.</p></div>
   <div class="scores"><div class="sc main"><small>Tổng điểm ước tính</small><div class="n">${tot}<em> / 990</em></div><p>Quy đổi gần đúng, không phải điểm chính thức.</p></div>
    <div class="sc"><small>Listening</small><div class="n">${s.sL}<em> / 495</em></div><p>${s.L}/100 câu đúng</p></div>
    <div class="sc"><small>Reading</small><div class="n">${s.sR}<em> / 495</em></div><p>${s.R}/100 câu đúng</p></div></div>
   <div class="card"><div class="sec-h"><h2>Kết quả theo Part</h2><span>Xanh ≥ 75% · Đỏ &lt; 50%</span></div><div class="bars">${bars}</div></div>
   <div class="row"><button class="btn pri" data-act="review">Xem lại đáp án và giải thích</button><button class="btn" data-act="start-confirm">Làm lại từ đầu</button><button class="btn" data-act="home">Trang chủ</button></div>
  </div>`;
}
function modalHTML(){
  if(!UI.modal)return '';
  return `<div class="ov" data-act="mclose"><div class="modal" role="dialog" aria-modal="true"><p>${UI.modal.msg}</p><div class="row"><button class="btn" data-act="mclose">Hủy</button><button class="btn pri" data-act="mok">${UI.modal.okLabel}</button></div></div></div>`;
}

function render(keep){
  const y=window.scrollY;
  document.body.classList.toggle('pal-open',UI.pal);
  const app=$('#app');
  if(isVocab()){ if(window.VocabApp)window.VocabApp.render(); return; }
  if(!UI.test)app.innerHTML=libHTML();
  else if(S.view==='home')app.innerHTML=homeHTML()+modalHTML();
  else if(S.view==='result')app.innerHTML=resultHTML()+modalHTML();
  else{
    app.innerHTML=headerHTML()+`<div class="wrap layout"><main class="qcol" id="qcol">${contentHTML()}</main><aside class="sticky" id="side">${palHTML()}</aside></div><button class="palbtn" data-act="pal">Phiếu trả lời</button>`+modalHTML();
    const h=$('#hdr');if(h)document.documentElement.style.setProperty('--hdr',h.offsetHeight+'px');
    const sp=$('#aspd');if(sp)sp.value=String(au.playbackRate);
    paintAudio();paintTimer();
  }
  if(keep)window.scrollTo(0,y);
}

/* ---------- events ---------- */
document.addEventListener('change',e=>{
  if(e.target.id==='aspd')au.playbackRate=parseFloat(e.target.value);
});
document.addEventListener('input',e=>{
  if(e.target.id==='ask'&&!e.target.disabled){au.currentTime=parseFloat(e.target.value)}
});
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-act]'); if(!t)return;
  const a=t.dataset.act;
  if(a==='mclose'){ if(t.classList.contains('ov')&&e.target!==t)return; UI.modal=null;render(true);return; }
  if(a==='mok'){const f=UI.modal.fn;UI.modal=null;render(true);f();return;}
  switch(a){
   case 'prefs': e.stopPropagation(); UIP.open=!UIP.open; paintPrefs(); return;
   case 'pref': { const k=t.dataset.k; PREF[k]=t.dataset.v; try{localStorage.setItem(PKEY,JSON.stringify(PREF))}catch(x){} applyPrefs(); paintPrefs(); const h=$('#hdr'); if(h)document.documentElement.style.setProperty('--hdr',h.offsetHeight+'px'); return; }
   case 'lib': library(); break;
   case 'open': openTest(t.dataset.id); break;
   case 'start':
     if(S.exam&&!S.exam.submitted) modal('Bạn đang có một bài thi chưa nộp. Bắt đầu bài mới sẽ xóa bài làm cũ.','Bắt đầu bài mới',startExam); else startExam(); break;
   case 'start-confirm': modal('Làm lại từ đầu sẽ xóa kết quả hiện tại.','Làm lại',startExam); break;
   case 'resume': resumeExam(); break;
   case 'result': S.view='result';save();render();scrollTo(0,0);break;
   case 'review': S.view='review';S.kind='exam';S.part=1;S.filter='all';setAudio(1);save();render();scrollTo(0,0);break;
   case 'prac': startPractice(+t.dataset.part); break;
   case 'home': home(); break;
   case 'redo':
     modal(`Xóa bài làm Part ${S.part} để làm lại?`,'Làm lại',()=>{Q.filter(q=>q.part===S.part).forEach(q=>delete S.prac.ans[q.n]);UI.open={};save();render();scrollTo(0,0)}); break;
   case 'toR': modal('Chuyển sang phần Reading sẽ dừng audio và bắt đầu đồng hồ 75 phút. Bạn không thể quay lại Listening.','Sang Reading',toReading); break;
   case 'submit': {
     const n=Object.keys(S.exam.ans).length;
     modal(`Bạn đã trả lời ${n}/200 câu. Nộp bài và xem kết quả?`,'Nộp bài',submitExam); break; }
   case 'tab': {
     S.part=+t.dataset.part; if(S.part<=4){setAudio(S.part,false)}
     UI.pal=false; save(); render(); scrollTo(0,0); break; }
   case 'jump': {
     const q=Q[+t.dataset.q-1]; S.part=q.part; UI.pal=false;
     if(q.part<=4&&S.kind!=='exam')setAudio(q.part);
     if(S.view==='review'&&S.filter!=='all')S.filter='all';
     render(); const el=document.getElementById('q'+q.n); if(el)el.scrollIntoView({block:'start'}); break; }
   case 'pick': {
     const n=+t.dataset.q,i=+t.dataset.i, ans=curAns();
     if(S.kind==='exam'&&ans[n]===i)delete ans[n]; else ans[n]=i;
     save(); render(true); break; }
   case 'flag': {
     const n=+t.dataset.q,f=S.exam.flags,k=f.indexOf(n); if(k>=0)f.splice(k,1); else f.push(n); save(); render(true); break; }
   case 'gexp': UI.open[t.dataset.k]=!UI.open[t.dataset.k]; render(true); break;
   case 'filter': S.filter=t.dataset.f; save(); render(); scrollTo(0,0); break;
   case 'pal': UI.pal=true; render(true); break;
   case 'aplay': if(!UI.audioPart)setAudio(S.part<=4?S.part:1); au.paused?au.play().catch(()=>{}):au.pause(); break;
   case 'aback': au.currentTime=Math.max(0,au.currentTime-10); break;
   case 'afwd': au.currentTime=Math.min(au.duration||1e9,au.currentTime+10); break;
  }
});
document.addEventListener('click',e=>{
  if(UIP.open&&!e.target.closest('#prefs-pop')&&!e.target.closest('[data-act=prefs]')){UIP.open=false;paintPrefs()}
  if(UI.pal&&!e.target.closest('#side')&&!e.target.closest('.palbtn')){UI.pal=false;document.body.classList.remove('pal-open')}
},true);
addEventListener('resize',()=>{const h=$('#hdr');if(h)document.documentElement.style.setProperty('--hdr',h.offsetHeight+'px')});

addEventListener('keydown',e=>{if(e.key==='Escape'){if(UIP.open){UIP.open=false;paintPrefs()} if(UI.pal){UI.pal=false;document.body.classList.remove('pal-open')} if(UI.modal){UI.modal=null;render(true)}}});
try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',applyPrefs)}catch(e){}
addEventListener('hashchange',()=>{
  UIP.open=false;paintPrefs();
  if(isVocab()){stopAudio();clearInterval(tick);UI.pal=false;document.body.classList.remove('pal-open');render();}
  else library();
});

/* ---------- boot ---------- */
render();
})();
