/* Học từ vựng: flashcard, trắc nghiệm, danh sách. Dữ liệu: vocab/data.js (tạo bằng tools/build_vocab.py).
   Đường dẫn: #vocab (trang chủ) · #vocab/d01 (một bài) · #vocab/g/part1 (cả nhóm) · #vocab/review (từ chưa thuộc) */
(function(){
const T=window.TOEIC, esc=T.esc, $=s=>document.querySelector(s);
const KEY='toeic:vocab';
let D=null, W={}, loading=false, err='';
/* tiến độ: P.s[key] = 1 (đã thuộc) | 0 (chưa thuộc). Không có = chưa học */
let P={s:{}};
try{const j=JSON.parse(localStorage.getItem(KEY));if(j&&j.s)P=j}catch(e){}
const saveP=()=>{try{localStorage.setItem(KEY,JSON.stringify(P))}catch(e){}};
let O={mode:'card',filter:'all',dir:'en',shuffle:true,auto:false};
try{Object.assign(O,JSON.parse(localStorage.getItem(KEY+':opt'))||{})}catch(e){}
const saveO=()=>{try{localStorage.setItem(KEY+':opt',JSON.stringify(O))}catch(e){}};
let U={route:null,sess:null,q:'',open:{},listQ:''};

/* ---------- dữ liệu ---------- */
async function ensure(){
  if(D||loading)return; loading=true;
  try{ await T.loadScript('vocab/data.js'); D=window.VOCAB; D.words.forEach(w=>W[w.k]=w); }
  catch(e){ err='Không tải được vocab/data.js. Chạy tools/build_vocab.py để tạo dữ liệu.'; }
  loading=false; render();
}
const G=id=>D.groups.find(g=>g.id===id);
const deckTitle=d=>{const g=G(d.g);const many=D.decks.filter(x=>x.g===d.g).length>1;return `Day ${d.day} · ${g.name}${many?' – bài '+d.n:''}`};
function route(){
  const p=location.hash.slice(1).split('/');
  if(p[1]==='g'&&p[2])return {type:'group',id:p[2]};
  if(p[1]==='review')return {type:'review'};
  if(p[1])return {type:'deck',id:p[1]};
  return {type:'home'};
}
function setWords(r){
  if(r.type==='deck'){const d=D.decks.find(x=>x.id===r.id);if(!d)return null;return {title:deckTitle(d),eyebrow:G(d.g).name,keys:D.words.filter(w=>w.d===d.id).map(w=>w.k)}}
  if(r.type==='group'){const g=G(r.id);if(!g)return null;const ids=D.decks.filter(d=>d.g===g.id).map(d=>d.id);return {title:'Cả nhóm '+g.name,eyebrow:g.name,keys:D.words.filter(w=>ids.includes(w.d)).map(w=>w.k)}}
  if(r.type==='review')return {title:'Ôn từ chưa thuộc',eyebrow:'Tất cả các bài',keys:D.words.filter(w=>P.s[w.k]===0).map(w=>w.k)};
  return null;
}
function stats(keys){let k=0,l=0;keys.forEach(x=>{if(P.s[x]===1)k++;else if(P.s[x]===0)l++});return {t:keys.length,k,l,n:keys.length-k-l}}

/* ---------- phát âm ---------- */
const TTS='speechSynthesis' in window;
function speak(text,lang){
  if(!TTS||!text)return;
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=lang||'en-US';
    const v=speechSynthesis.getVoices().find(v=>v.lang&&v.lang.replace('_','-').startsWith(u.lang));if(v)u.voice=v;
    u.rate=.9;speechSynthesis.speak(u);}catch(e){}
}
const spk=(w,lang,label)=>TTS?`<button class="spk" data-v="speak" data-k="${esc(w.k)}" data-l="${lang}" aria-label="Phát âm ${label}" title="Phát âm ${label}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6h3l4-3v10L5 10H2z"/><path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.6 3.8a6 6 0 0 1 0 8.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>${label}</button>`:'';

/* ---------- hiển thị một từ ---------- */
const parts=s=>(s||'').split(/\s+\|\s+/).map(x=>x.trim()).filter(Boolean);
const listParts=s=>(s||'').split(/\s+\|\s+|;\s+/).map(x=>x.trim()).filter(Boolean);
const POS={n:'danh từ',v:'động từ',a:'tính từ',adj:'tính từ',adv:'trạng từ',prep:'giới từ',conj:'liên từ','phr.v':'cụm động từ',phr:'cụm từ'};
const posHTML=p=>(p||'').split(',').map(x=>x.trim()).filter(Boolean).map(x=>`<span class="pos" title="${esc(POS[x]||x)}">${esc(x==='a'?'adj':x)}</span>`).join('');
function hl(ex,word){
  const e=esc(ex);
  const toks=word.replace(/\(.*?\)/g,'').split(/\s+/).filter(t=>t&&!/^(sb|sth|someone|something|\.\.\.|…)$/i.test(t));
  if(!toks.length)return e;
  const re=toks.map(t=>{t=t.replace(/[^A-Za-z'-]/g,'');if(!t)return null;const st=t.length>3?t.replace(/(e|y)$/,''):t;return st.replace(/[-']/g,m=>'\\'+m)+'[a-z]*'}).filter(Boolean).join('\\s+');
  if(!re)return e;
  try{return e.replace(new RegExp('\\b('+re+')','i'),'<mark>$1</mark>')}catch(x){return e}
}
function ipaHTML(w){
  const a=[];
  if(w.ipa_uk)a.push(`<span class="ipa"><small>UK</small>${esc(w.ipa_uk)}</span>`);
  if(w.ipa_us)a.push(`<span class="ipa"><small>US</small>${esc(w.ipa_us)}</span>`);
  return a.join('');
}
function detailHTML(w){
  const en=parts(w.example_en),vi=parts(w.example_vi);
  const ex=en.map((x,i)=>`<li><span class="en">${hl(x,w.word)}</span>${vi[i]?`<span class="vi">${esc(vi[i])}</span>`:''}</li>`).join('');
  const blk=(t,s,cls)=>{const a=listParts(s);return a.length?`<div class="vblk ${cls||''}"><div class="vt">${t}</div><ul>${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''};
  return `${ex?`<div class="vblk"><div class="vt">Ví dụ</div><ul class="exs">${ex}</ul></div>`:''}`+
    blk('Cụm từ thường gặp',w.collocations)+blk('Từ liên quan',w.related)+
    blk('Đồng nghĩa',w.synonyms,'half')+blk('Trái nghĩa',w.antonyms,'half');
}

/* ---------- phiên học ---------- */
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function pool(){
  const all=U.set.keys;
  return O.filter==='todo'?all.filter(k=>P.s[k]!==1):all.slice();
}
function newCard(){
  let q=pool(); if(O.shuffle)q=shuffle(q);
  U.sess={kind:'card',queue:q,total:q.length,known:0,again:0,flip:false,seen:{}};
  if(O.auto&&q.length)setTimeout(()=>speak(W[q[0]].word),150);
}
function distractors(w,field,keys){
  const base=keys.filter(k=>k!==w.k&&W[k][field]!==w[field]);
  const same=base.filter(k=>(W[k].pos||'')===(w.pos||''));
  let pick=shuffle(same).slice(0,3);
  if(pick.length<3)pick=pick.concat(shuffle(base.filter(k=>!pick.includes(k))).slice(0,3-pick.length));
  if(pick.length<3){const more=D.words.map(x=>x.k).filter(k=>k!==w.k&&!pick.includes(k)&&W[k][field]!==w[field]);pick=pick.concat(shuffle(more).slice(0,3-pick.length))}
  return pick;
}
function newQuiz(){
  let q=pool(); q=O.shuffle?shuffle(q):q;
  const field=O.dir==='en'?'meaning':'word';
  const items=q.map(k=>{const w=W[k];const opts=shuffle([k].concat(distractors(w,field,U.set.keys)));return {k,opts,ans:opts.indexOf(k),pick:null}});
  U.sess={kind:'quiz',items,i:0,right:0};
}
function startSession(){ if(O.mode==='card')newCard(); else if(O.mode==='quiz')newQuiz(); else U.sess=null; }
function mark(k,v){P.s[k]=v;saveP()}

/* ---------- giao diện ---------- */
function homeHTML(){
  const all=D.words.map(w=>w.k), st=stats(all);
  const learn=D.words.filter(w=>P.s[w.k]===0).length;
  const area=(ar,title,sub)=>{
    const gs=D.groups.filter(g=>g.area===ar); if(!gs.length)return '';
    return `<section class="varea"><div class="sec-h"><h2>${title}</h2><span>${sub}</span></div><div class="vgroups">${gs.map(g=>{
      const ds=D.decks.filter(d=>d.g===g.id), keys=D.words.filter(w=>ds.some(d=>d.id===w.d)).map(w=>w.k), s=stats(keys);
      return `<div class="vgroup"><div class="vgh"><div><div class="vgn">${esc(g.name)}</div><div class="vgs">${esc(g.sub)} · ${s.t} từ</div></div><a class="btn sm" href="#vocab/g/${g.id}">Học cả nhóm</a></div>
        <div class="mini"><i style="width:${s.k/s.t*100}%"></i></div>
        <div class="decks">${ds.map(d=>{const k=D.words.filter(w=>w.d===d.id).map(w=>w.k),x=stats(k);
          return `<a class="deck" href="#vocab/${d.id}"><span class="dd">Day ${d.day}</span><span class="dn">${ds.length>1?'Bài '+d.n:g.name}</span><span class="dm">${x.k}/${x.t}${x.k===x.t&&x.t?' ✓':''}</span><span class="mini"><i style="width:${x.k/x.t*100}%"></i></span></a>`}).join('')}</div></div>`;
    }).join('')}</div></section>`;
  };
  const q=U.q.trim().toLowerCase();
  let res='';
  if(q){
    const hits=D.words.filter(w=>w.word.toLowerCase().includes(q)||w.meaning.toLowerCase().includes(q)).slice(0,40);
    res=`<div class="card vsearch-res">${hits.length?hits.map(w=>{const d=D.decks.find(x=>x.id===w.d);return `<a class="vhit" href="#vocab/${d.id}" data-v="goword" data-k="${esc(w.k)}"><b>${esc(w.word)}</b>${posHTML(w.pos)}<span>${esc(w.meaning)}</span><small>Day ${d.day}</small></a>`}).join(''):'<div class="empty">Không tìm thấy từ nào.</div>'}</div>`;
  }
  return T.siteNav('vocab')+`<div class="wrap home vhome">
    <div class="hero"><div class="eyebrow">Từ vựng TOEIC</div><h1>Học từ vựng bằng flashcard</h1><p>${D.decks.length} bài theo từng Part và theo từ loại. Lật thẻ để xem nghĩa, ví dụ và cụm từ; đánh dấu từ đã thuộc để lần sau chỉ ôn những từ còn lại.</p>
    <div class="vstats"><div><b>${st.t}</b><small>Tổng số từ</small></div><div class="ok"><b>${st.k}</b><small>Đã thuộc</small></div><div class="lr"><b>${st.l}</b><small>Chưa thuộc</small></div><div><b>${st.n}</b><small>Chưa học</small></div></div>
    <div class="vbar" aria-hidden="true"><i class="k" style="width:${st.k/st.t*100}%"></i><i class="l" style="width:${st.l/st.t*100}%"></i></div></div>
    <div class="vtools"><input id="vq" type="search" placeholder="Tra từ hoặc nghĩa tiếng Việt…" value="${esc(U.q)}" autocomplete="off" aria-label="Tìm từ">${learn?`<a class="btn pri" href="#vocab/review">Ôn ${learn} từ chưa thuộc</a>`:''}</div>
    ${res}
    ${area('part','Theo Part','Từ hay gặp trong từng phần Listening')}
    ${area('pos','Theo từ loại','Động từ, danh từ, tính từ, trạng từ, giới từ')}
  </div>`;
}

function optsHTML(){
  const st=stats(U.set.keys), todo=st.t-st.k;
  const chip=(k,v,l)=>`<button class="chip" data-v="opt" data-o="${k}" data-val="${v}" aria-pressed="${String(O[k])===String(v)}">${l}</button>`;
  if(O.mode==='list')return '';
  return `<div class="vopts"><span class="lbl">Từ</span>${chip('filter','all','Tất cả '+st.t)}${chip('filter','todo','Cần học '+todo)}
    <span class="lbl">Hỏi</span>${chip('dir','en','Anh → Việt')}${chip('dir','vi','Việt → Anh')}
    <span class="lbl">Thứ tự</span>${chip('shuffle',true,'Trộn')}${chip('shuffle',false,'Theo bài')}
    ${TTS&&O.mode==='card'?`<span class="lbl">Âm</span>${chip('auto',true,'Tự đọc')}${chip('auto',false,'Tắt')}`:''}</div>`;
}

function cardHTML(){
  const s=U.sess;
  if(!s.total)return `<div class="card vdone"><h2>Không còn từ nào</h2><p>${O.filter==='todo'?'Bạn đã thuộc hết các từ trong bài này. Chọn "Tất cả" để ôn lại.':'Bài này chưa có từ.'}</p></div>`;
  if(!s.queue.length){
    return `<div class="card vdone"><div class="eyebrow">Hoàn thành</div><h2>Đã thuộc ${s.known}/${s.total} từ trong lượt này</h2><p>${s.again?`Bạn bấm "Chưa thuộc" ${s.again} lần. Những từ đó được lưu để ôn lại sau.`:'Không có từ nào phải ôn lại.'}</p>
      <div class="row"><button class="btn pri" data-v="restart">Học lại lượt mới</button><button class="btn" data-v="mode" data-m="quiz">Làm trắc nghiệm</button><a class="btn" href="#vocab">Về danh sách bài</a></div></div>`;
  }
  const w=W[s.queue[0]], back=s.flip, en=O.dir==='en';
  const st=P.s[w.k], tag=st===1?'<span class="tag ok">Đã thuộc</span>':st===0?'<span class="tag lr">Chưa thuộc</span>':'<span class="tag">Từ mới</span>';
  const front=en?`<div class="fw">${esc(w.word)}</div><div class="fp">${posHTML(w.pos)}${ipaHTML(w)}</div>`:`<div class="fm">${esc(w.meaning)}</div><div class="fp">${posHTML(w.pos)}</div>`;
  return `<div class="vprog"><span>Còn <b>${s.queue.length}</b> thẻ</span><span>Đã thuộc <b>${s.known}</b></span><span>Ôn lại <b>${s.again}</b></span><div class="mini"><i style="width:${s.known/s.total*100}%"></i></div></div>
  <div class="fc ${back?'back':'front'} ${s.anim?'anim':''}" data-v="flip" role="button" tabindex="0" aria-label="${back?'Mặt sau':'Mặt trước'} – nhấn để lật">
    ${back?`${tag}<div class="bw"><span class="w">${esc(w.word)}</span>${posHTML(w.pos)}</div><div class="fp">${ipaHTML(w)}</div><div class="bm">${esc(w.meaning)}</div>${detailHTML(w)}`
          :`${tag}${front}<div class="fh">Nhấn vào thẻ hoặc phím Space để lật</div>`}
  </div>
  ${en||back?`<div class="fspk">${spk(w,'en-GB','UK')}${spk(w,'en-US','US')}</div>`:''}
  <div class="fact"><button class="btn again" data-v="again"><kbd>←</kbd> Chưa thuộc</button><button class="btn" data-v="flip">${back?'Mặt trước':'Lật thẻ'}</button><button class="btn known" data-v="known">Đã thuộc <kbd>→</kbd></button></div>`;
}

function quizHTML(){
  const s=U.sess;
  if(!s.items.length)return `<div class="card vdone"><h2>Không còn từ nào</h2><p>Chọn "Tất cả" để làm trắc nghiệm với mọi từ trong bài.</p></div>`;
  if(s.i>=s.items.length){
    const wrong=s.items.filter(x=>x.pick!==x.ans);
    return `<div class="card vdone"><div class="eyebrow">Kết quả</div><h2>Đúng ${s.right}/${s.items.length} câu</h2>
      ${wrong.length?`<p>Các từ trả lời sai đã được chuyển sang "Chưa thuộc":</p><ul class="vwrong">${wrong.map(x=>`<li><b>${esc(W[x.k].word)}</b> – ${esc(W[x.k].meaning)}</li>`).join('')}</ul>`:'<p>Bạn trả lời đúng tất cả.</p>'}
      <div class="row">${wrong.length?'<button class="btn pri" data-v="redowrong">Làm lại câu sai</button>':''}<button class="btn" data-v="restart">Làm lượt mới</button><button class="btn" data-v="mode" data-m="card">Học flashcard</button></div></div>`;
  }
  const it=s.items[s.i], w=W[it.k], en=O.dir==='en', done=it.pick!==null;
  const prompt=en?`<div class="fw">${esc(w.word)}</div><div class="fp">${posHTML(w.pos)}${ipaHTML(w)}</div>`:`<div class="fm">${esc(w.meaning)}</div><div class="fp">${posHTML(w.pos)}</div>`;
  const opts=it.opts.map((k,i)=>{let c='opt';if(done){if(i===it.ans)c+=' ok';else if(i===it.pick)c+=' bad'}
    return `<button class="${c}" data-v="pick" data-i="${i}" ${done?'disabled':''}><span class="bub">${'ABCD'[i]}</span><span class="otx">${esc(en?W[k].meaning:W[k].word)}</span></button>`}).join('');
  return `<div class="vprog"><span>Câu <b>${s.i+1}</b>/${s.items.length}</span><span>Đúng <b>${s.right}</b></span><div class="mini"><i style="width:${s.i/s.items.length*100}%"></i></div></div>
   <div class="card vquiz"><div class="qp">${prompt}</div>${en||done?`<div class="fspk">${spk(w,'en-GB','UK')}${spk(w,'en-US','US')}</div>`:''}<div class="opts">${opts}</div>
   ${done?`<div class="expl"><span class="verdict ${it.pick===it.ans?'ok':'bad'}">${it.pick===it.ans?'Chính xác':'Chưa đúng · đáp án '+'ABCD'[it.ans]}</span><div class="bw"><span class="w">${esc(w.word)}</span>${posHTML(w.pos)}<span class="bm2">${esc(w.meaning)}</span></div>${detailHTML(w)}<div class="row"><button class="btn pri" data-v="next">Câu tiếp <kbd>Enter</kbd></button></div></div>`:'<div class="fh">Phím 1–4 để chọn</div>'}
   </div>`;
}

function listHTML(){
  const q=U.listQ.trim().toLowerCase();
  const keys=U.set.keys.filter(k=>!q||W[k].word.toLowerCase().includes(q)||W[k].meaning.toLowerCase().includes(q));
  const rows=keys.map(k=>{const w=W[k],st=P.s[k],o=!!U.open[k];
    return `<div class="vrow ${o?'open':''}"><button class="vst s${st===1?1:st===0?0:'n'}" data-v="cycle" data-k="${esc(k)}" title="Đổi trạng thái" aria-label="Trạng thái: ${st===1?'đã thuộc':st===0?'chưa thuộc':'chưa học'}">${st===1?'✓':st===0?'!':''}</button>
      <button class="vrm" data-v="toggle" data-k="${esc(k)}" aria-expanded="${o}"><span class="w">${esc(w.word)}</span>${posHTML(w.pos)}<span class="ipa">${esc(w.ipa_uk||'')}</span><span class="m">${esc(w.meaning)}</span></button>
      ${spk(w,'en-US','')}
      ${o?`<div class="vdet">${detailHTML(w)}</div>`:''}</div>`}).join('');
  return `<div class="vlisttools"><input id="vlq" type="search" placeholder="Lọc trong bài…" value="${esc(U.listQ)}" aria-label="Lọc từ"><span class="note">Nhấn vào từ để xem ví dụ · nút tròn để đổi trạng thái (chưa học → chưa thuộc → đã thuộc)</span></div><div class="card vlist">${rows||'<div class="empty">Không có từ nào khớp.</div>'}</div>`;
}

function deckHTML(){
  const set=U.set, st=stats(set.keys);
  const tab=(m,l)=>`<button class="tab" role="tab" data-v="mode" data-m="${m}" aria-selected="${O.mode===m}">${l}</button>`;
  const body=O.mode==='card'?cardHTML():O.mode==='quiz'?quizHTML():listHTML();
  return T.siteNav('vocab')+`<div class="wrap vdeck">
    <div class="hero"><a class="btn sm" href="#vocab" style="justify-self:start">← Tất cả bài</a><div class="eyebrow">${esc(set.eyebrow)}</div><h1>${esc(set.title)}</h1>
     <div class="facts"><span><b>${st.t}</b> từ</span><span>Đã thuộc <b>${st.k}</b></span><span>Chưa thuộc <b>${st.l}</b></span><span>Chưa học <b>${st.n}</b></span>${st.k||st.l?'<button class="lnk" data-v="reset">Xóa tiến độ bài này</button>':''}</div></div>
    <div class="tabs vtabs" role="tablist">${tab('card','Flashcard')}${tab('quiz','Trắc nghiệm')}${tab('list','Danh sách từ')}</div>
    ${optsHTML()}
    <div class="vbody">${body}</div>
  </div>${U.modal?`<div class="ov" data-v="mclose"><div class="modal" role="dialog" aria-modal="true"><p>${U.modal.msg}</p><div class="row"><button class="btn" data-v="mclose">Hủy</button><button class="btn pri" data-v="mok">${U.modal.ok}</button></div></div></div>`:''}`;
}

function render(){
  const app=$('#app');
  if(!D){ app.innerHTML=T.siteNav('vocab')+`<div class="wrap home"><div class="${err?'dirs':'empty'}">${err||'Đang tải từ vựng…'}</div></div>`; ensure(); return; }
  const r=route(), key=JSON.stringify(r);
  if(r.type==='home'){U.route=key;app.innerHTML=homeHTML();return}
  if(U.route!==key){
    U.route=key; U.set=setWords(r); U.open={}; U.listQ=''; U.modal=null;
    if(!U.set){app.innerHTML=T.siteNav('vocab')+`<div class="wrap home"><div class="dirs">Không tìm thấy bài này. <a href="#vocab">Về danh sách bài</a></div></div>`;return}
    startSession(); scrollTo(0,0);
  }
  app.innerHTML=deckHTML();
}
function rerender(keepFocus){
  const y=scrollY, id=document.activeElement&&document.activeElement.id, pos=id&&document.activeElement.selectionStart;
  render(); scrollTo(0,y);
  if(keepFocus&&id){const el=document.getElementById(id);if(el){el.focus();try{el.setSelectionRange(pos,pos)}catch(e){}}}
}

/* ---------- hành động ---------- */
function flip(){const s=U.sess;if(!s||s.kind!=='card'||!s.queue.length)return;s.flip=!s.flip;s.anim=true;rerender();s.anim=false}
function answerCard(known){
  const s=U.sess;if(!s||s.kind!=='card'||!s.queue.length)return;
  const k=s.queue.shift();
  if(known){mark(k,1);s.known++}
  else{mark(k,0);s.again++;s.queue.splice(Math.min(4,s.queue.length),0,k)}
  s.flip=false; rerender();
  if(O.auto&&s.queue.length)speak(W[s.queue[0]].word);
}
function pickQuiz(i){
  const s=U.sess;if(!s||s.kind!=='quiz')return;const it=s.items[s.i];if(!it||it.pick!==null)return;
  it.pick=i; if(i===it.ans){s.right++;if(P.s[it.k]!==1)mark(it.k,1)} else mark(it.k,0);
  rerender();
}
function nextQuiz(){const s=U.sess;if(!s||s.kind!=='quiz')return;const it=s.items[s.i];if(it&&it.pick===null)return;s.i++;rerender();const b=$('.vbody');if(b&&b.getBoundingClientRect().top<0)b.scrollIntoView()}

document.addEventListener('click',e=>{
  const t=e.target.closest('[data-v]'); if(!t||!U.set&&!['speak','goword'].includes(t.dataset.v))return;
  const v=t.dataset.v;
  switch(v){
    case 'flip': flip(); break;
    case 'known': answerCard(true); break;
    case 'again': answerCard(false); break;
    case 'speak': e.stopPropagation(); speak(W[t.dataset.k].word,t.dataset.l); break;
    case 'mode': O.mode=t.dataset.m;saveO();startSession();rerender();break;
    case 'opt': { const k=t.dataset.o; let val=t.dataset.val; if(val==='true')val=true; else if(val==='false')val=false; O[k]=val; saveO(); if(k!=='auto')startSession(); rerender(); break; }
    case 'restart': startSession(); rerender(); scrollTo(0,0); break;
    case 'pick': pickQuiz(+t.dataset.i); break;
    case 'next': nextQuiz(); break;
    case 'redowrong': { const s=U.sess; const items=s.items.filter(x=>x.pick!==x.ans).map(x=>({k:x.k,opts:shuffle(x.opts),pick:null})); items.forEach(x=>x.ans=x.opts.indexOf(x.k)); U.sess={kind:'quiz',items:O.shuffle?shuffle(items):items,i:0,right:0}; rerender(); break; }
    case 'toggle': U.open[t.dataset.k]=!U.open[t.dataset.k]; rerender(); break;
    case 'cycle': { const k=t.dataset.k, s=P.s[k]; if(s===undefined)P.s[k]=0; else if(s===0)P.s[k]=1; else delete P.s[k]; saveP(); rerender(); break; }
    case 'reset': U.modal={msg:`Xóa trạng thái đã thuộc/chưa thuộc của ${U.set.keys.length} từ trong "${esc(U.set.title)}"?`,ok:'Xóa tiến độ',fn:()=>{U.set.keys.forEach(k=>delete P.s[k]);saveP();startSession()}}; rerender(); break;
    case 'mclose': if(t.classList.contains('ov')&&e.target!==t)return; U.modal=null; rerender(); break;
    case 'mok': { const f=U.modal.fn; U.modal=null; f(); rerender(); break; }
  }
});
document.addEventListener('input',e=>{
  if(e.target.id==='vq'){U.q=e.target.value;rerender(true)}
  if(e.target.id==='vlq'){U.listQ=e.target.value;rerender(true)}
});
document.addEventListener('keydown',e=>{
  if(!U.set||route().type==='home'||U.modal)return;
  const tg=e.target; if(tg&&(tg.tagName==='INPUT'||tg.tagName==='SELECT'||tg.tagName==='TEXTAREA'))return;
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const s=U.sess; if(!s)return;
  if(s.kind==='card'){
    if(e.key===' '||e.key==='Enter'){if(tg&&tg.tagName==='BUTTON'&&tg.dataset.v!=='flip'&&e.key==='Enter')return;e.preventDefault();flip()}
    else if(e.key==='ArrowRight'||e.key==='2'){e.preventDefault();answerCard(true)}
    else if(e.key==='ArrowLeft'||e.key==='1'){e.preventDefault();answerCard(false)}
    else if(e.key==='s'||e.key==='S'){const k=s.queue[0];if(k)speak(W[k].word)}
  } else if(s.kind==='quiz'){
    if(['1','2','3','4'].includes(e.key)){pickQuiz(+e.key-1)}
    else if(e.key==='Enter'){if(tg&&tg.tagName==='BUTTON'&&tg.dataset.v!=='next')return;e.preventDefault();nextQuiz()}
  }
});
if(TTS)try{speechSynthesis.getVoices();speechSynthesis.onvoiceschanged=()=>{}}catch(e){}

window.VocabApp={render};
if(location.hash.slice(1).split('/')[0]==='vocab')render();
})();
