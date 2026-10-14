"""Bóc tách nội dung bộ luyện theo Part từ văn bản OCR của file DA (đáp án + giải thích)."""
import re, sys
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from ocrlines import load, BLANK
VI=re.compile(r'[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]',re.I)
# dấu (A)..(D) sau khi OCR có thể thành (©) (O) (Q) (0) …
MK=re.compile(r'^[^\w(]{0,3}(?:[yvVsSýÿ⁄”"’\'¬=—~-]{1,2}\s*)?(?:\(\s*(ID|lD|1D|CO|C0|[ABCD©OQG0])\s*[\)\]]?|([ABCD])\s*[.)](?=\s*\S))\s*(.*)$')
class _MKW:
    def __init__(s,m): s.m=m
    def group(s,i): return (s.m.group(1) or s.m.group(2)) if i==1 else s.m.group(3)
def _mk(t):
    m=MK.match(t); return _MKW(m) if m else None
ANS=re.compile(r'Ch[oọ]n\s+đ[áa]p\s+[áa]n\s*:?\s*([ABCD])\b')
NUM=re.compile(r'^\s*(\d{1,2})\s*[.,]\s*$')
QHDR=re.compile(r'^Questions?\s+(\d+)\s*[-–]\s*(\d+)',re.I)
def letter(x): return {'©':'C','O':'C','Q':'C','G':'C','0':'C','ID':'D','CO':'C','C0':'C','lD':'D','1D':'D'}.get(x,x)
def has_vi(s): return bool(VI.search(s))
_AMB={'©','O','Q','G','0','ID','lD','1D','CO','C0'}
def okL(raw,exp): return letter(raw)==exp or (raw in _AMB and exp in 'CD')
def looks_vi(s):
    w=s.split()
    return bool(w) and sum(1 for x in w if VI.search(x))/len(w)>0.3
def split_vi(s):
    """'English (Tiếng Việt)' -> (en, vi). Cắt ở dấu '(' đầu tiên mà phần sau có chữ tiếng Việt."""
    s=s.strip()
    for m in re.finditer(r'\(',s):
        rest=s[m.start()+1:]
        if has_vi(rest[:60]) and m.start()>0:
            en=s[:m.start()].strip(); vi=rest.strip()
            if vi.endswith(')'): vi=vi[:-1]
            return en, vi.strip().rstrip(')').strip()
    return s,''
from wordfreq import zipf_frequency as _zf
_SUB=[('c','e'),('1','i'),('1','l'),('rn','m'),('m','rn'),('0','o'),('I','l'),('l','I'),('e','c'),('ii','u'),('fi','f'),('h','b'),('cl','d'),('u','n'),('n','u'),('I','i')]
def _fixword(w):
    lw=w.lower()
    if not re.search('[a-z]',lw) or _zf(lw,'en')>=1.8 or len(lw)<2: return w
    best=(0,w)
    for a,b in _SUB:
        i=lw.find(a)
        while i>=0:
            c=w[:i]+b+w[i+len(a):]; z=_zf(c.lower(),'en')
            if z>best[0]: best=(z,c)
            i=lw.find(a,i+1)
    return best[1] if best[0]>=2.6 else w
_FIX={'Ata':'At a','ata':'at a','1s':'is','1n':'in','1t':'it','1ts':'its','1f':'if','thc':'the','arc':'are','wcre':'were','nccd':'need','bcen':'been','Ietter':'letter','ofƒ':'of','oƒ':'of','tbe':'the','aud':'and','ou':'on'}
_CONTR={'thats':"that's",'dont':"don't",'doesnt':"doesn't",'didnt':"didn't",'isnt':"isn't",'arent':"aren't",'wasnt':"wasn't",'werent':"weren't",'cant':"can't",'wont':"won't",'couldnt':"couldn't",'shouldnt':"shouldn't",'wouldnt':"wouldn't",'havent':"haven't",'hasnt':"hasn't",'hadnt':"hadn't",'theyre':"they're",'youre':"you're",'whats':"what's",'whos':"who's",'wheres':"where's",'shes':"she's",'theres':"there's",'ive':"I've",'im':"I'm",'youve':"you've",'weve':"we've",'theyve':"they've",'ill':None,'id':None}
def _contr(m):
    w=m.group(0); r=_CONTR.get(w.lower())
    if not r: return w
    return r[0].upper()+r[1:] if w[0].isupper() else r
def fix_light(s):
    """chỉ sửa lỗi OCR chắc chắn (dùng được cho dòng lẫn tiếng Việt)"""
    s=re.sub(r"\b(\w+)n[f’`*?´‘]t\b",lambda m:m.group(1)+"n't",s)
    s=re.sub(r"\b([A-Za-z]+)[*`´‘’?](s|re|ve|ll|d|m)\b",lambda m:m.group(1)+"'"+m.group(2),s)
    s=re.sub(r"(?<![\w'])(Ata|1s|1n|1t|1ts|thc|wcre|bcen)(?![\w'])",lambda m:_FIX[m.group(1)],s)
    s=re.sub(r'(?<=\s)[¬›](?=\s)','→',s)
    s=fix_odd(s); s=fix_typo(s)
    s=re.sub(r"\b(Im|Ive|Theyre|Youre|Thats|Dont|dont|didnt|doesnt|isnt|arent|wasnt|werent|cant|wont|couldnt|shouldnt|wouldnt|havent|hasnt|theyre|youre|thats|whats|Whats|Whos|whos|Theres|theres)\b",_contr,s)
    return s
def fix_en(s):
    s=re.sub(r"\b(\w+)n[f’`*?´‘]t\b",lambda m:m.group(1)+"n't",s)
    s=re.sub(r"\b(\w+)[*`´‘’?](s|re|ve|ll|d|m)\b",lambda m:m.group(1)+"'"+m.group(2),s)
    s=re.sub(r"\b[A-Za-z]+\b",_contr,s)
    s=re.sub(r"(?<![\w'])(Ata|ata|1s|1n|1t|1ts|1f|thc|arc|wcre|nccd|bcen|Ietter|oƒ|tbe)(?![\w'])",lambda m:_FIX[m.group(1)],s)
    return re.sub(r"[A-Za-z0-9][A-Za-z0-9']*",lambda m:_fixword(m.group(0)) if "'" not in m.group(0) else m.group(0),s)
_ODD={'ñ':['fi','f'],'Ê':['f','fi'],'É':['e',''],'ï':['i',''],'Ï':['I'],'ﬁ':['fi'],'ﬂ':['fl'],']':['l','j','I'],'#':['r'],'ø':['g','o'],'đ':['d']}
import unicodedata as _ud
def _strip(w): return ''.join(c for c in _ud.normalize('NFD',w) if _ud.category(c)!='Mn')
def _cands(w,general):
    cands={w}
    for ch,reps in _ODD.items():
        if ch=='đ' and not general: continue
        if ch in w: cands={c.replace(ch,r) for c in cands for r in reps}
    if general:
        for c in list(cands):
            if re.search(r'(?<=[a-z\]])I',c):
                cc={c}
                for _ in range(2): cc={re.sub(r'(?<=[a-z\]])I',r,x,count=1) for x in cc for r in 'li'}
                cands|=cc
        cands|={_strip(c) for c in cands}
        cands|={re.sub(r'[^\x00-\x7f]','',c) for c in cands}
    return cands
_KEEP={'café','Café','résumé','résumés','cafés'}
def _oddword(m,general=False):
    w=m.group(0)
    if w in _KEEP or len(w)<2: return w
    best=max(_cands(w,general),key=lambda c:(_zf(c.lower(),'en'),-abs(len(c)-len(w))))
    return best if best!=w and _zf(best.lower(),'en')>=2.5 else w
def fix_odd(s,general=False):
    if general: s=re.sub(r"[A-Za-z\]]*[a-z\]]I[A-Za-z\]]*",lambda m:_oddword(m,True),s)
    pat=r"[^\s.,?!;:\"()]*(?:[^\x00-\x7f]|[\]#])[^\s.,?!;:\"()]*" if general else r"[A-Za-zñÊïÏﬁﬂ]*[ñÊïÏﬁﬂ][A-Za-zñÊïÏﬁﬂ]*"
    return re.sub(pat,lambda m:_oddword(m,general),s)
_TYPO={'addlition':'addition','aninternational':'an international','atiract':'attract','badgce':'badge','butl':'but I','cmployce':'employee',
 'computecr':'computer','criuc':'critic','didntt':"didn't",'discussine':'discussing','docsn\'t':"doesn't",'dontt':"don't",'ecnergy':'energy',
 'elivery':'delivery','employcc':'employee','enroliment':'enrollment','ffom':'from','fificen':'fifteen','futurce':'future','hasntt':"hasn't",
 'igures':'figures','ilming':'filming','inorder':'in order','iscuss':'discuss','isplay':'display','isplayed':'displayed','khow':'know','khown':'known',
 "l'd":"I'd","l've":"I've","l'll":"I'll","l'm":"I'm","lI'd":"I'd",'ltneeds':'It needs','magaZince':'magazine','meceting':'meeting','mght':'might','mvite':'invite',
 'ncorrcct':'incorrect','neceds':'needs','ofexperience':'of experience','onlyif':'only if','opcncd':'opened','pceople':'people','pcoplc':'people',
 'proJject':'project','putit':'put it','recImbursement':'reimbursement','recception':'reception','recferences':'references','reftigerator':'refrigerator',
 'reporta':'report a','skilis':'skills','somce':'some','spcaker\'s':"speaker's",'spcakers':'speakers','suuch':'such','svimming':'swimming',
 'toinclude':'to include','tomorrowfs':"tomorrow's",'vegatables':'vegetables','voman':'woman','vwhen':'when','wefll':"we'll",'willinclude':'will include',
 'wvoman':'woman','1Us':"it's",'1m':'in','1sn\'t':"Isn't",'1ncorrcct':'incorrect','Ooverseas':'overseas','welll':"we'll",'Who*':"Who's",'lạ':'it.','lí':'If','company\'3s':"company's",'September2':'September','ModemÉn':'Modern','stAaff':'staff','organiZed':'organized'}
_TYPO_RE=re.compile(r"(?<![\w])("+'|'.join(re.escape(k) for k in sorted(_TYPO,key=len,reverse=True))+r")(?![\w])")
def fix_typo(s): return _TYPO_RE.sub(lambda m:_TYPO[m.group(1)],s)
def clean_en(s):
    s=fix_typo(s)
    s=fix_odd(s,True)
    s=fix_en(s)
    s=s.replace('’',"'").replace('“','"').replace('”','"').replace('*s',"'s").replace('“s',"'s")
    s=re.sub(r'\s+',' ',s).strip()
    for a,b in _EXTRA: s=re.sub(a,b,s)
    return fix_typo(s)
_ITSW='a|an|the|on|in|at|not|been|being|almost|pretty|behind|posted|only|still|about|really|probably|just|too|very|already|from|for|up|due|available|closed|open|located|scheduled|least|my|your|our|his|her|their|over|under|going|getting|time|raining|fine|OK|okay|all|quite|so|more|less|ready|free|hard|easy|here|there|near|next|by|across|down|out|off|important|necessary|true|possible|likely|supposed|been|gotten|that|this|those|these|actually|always|usually|still|nice|great|good|best|better|worth|currently|mine|yours|ours'
_EXTRA=[(r"(?<![\w$])S(?=(?:\d{2,}(?:,\d{3})*|\d+)\.\d\d\b|\d{2,}(?:,\d{3})*\b)",'$'),(r"\b([Ii])ts (?=(?:"+_ITSW+r")\b)",r"\1t's "),(r"\bll'd\b","I'd"),(r'(?<=[a-z])["°ˆ*](?=(?:s|re|ve|ll|d|m|t)\b)',"'"),(r"^[^\s]{1,3}?(?=(?:Who|What|Where|When|Why|How|Which|Look|According)\b)",''),
 (r"(?<![\w'])l(?=\s)",'I'),(r"^! (?=[a-z])",'I '),(r'(?<=[\s"])! (?=[a-z])','I '),(r'^m (?=[a-z])',"I'm "),
 (r"^lf\b",'If'),(r"(?<=\s)lf\b",'if'),(r"\blsn't\b","Isn't"),(r"^lt\b","It"),(r"\bIlI\b","I'll"),(r"\bTheyrre\b","They're"),
 (r"\bhaventt\b","haven't"),(r"\bItll\b","It'll"),(r"\bitll\b","it'll"),(r"\bJjoin\b","join"),(r"\bItjust\b","It just"),
 (r"\bSofiware\b","Software"),(r"\bJournat\b","Journal"),(r"¡","i")]
def is_marker_only(t):
    m=_mk(t); return bool(m) and len(m.group(2).strip())<=1
def join_wrapped(lines):
    """gộp dòng bị xuống hàng: dòng không bắt đầu bằng dấu phương án/'Chọn'/số câu/nhãn -> nối vào dòng trước"""
    out=[]
    for ln in lines:
        t=ln['text'].strip()
        starts=_mk(t) or ANS.search(t) or NUM.match(t) or QHDR.match(t) or re.match(r'^(Thông tin|Giải thích|Tạm dịch|Kiến thức|Direction|\d{2}:\d{2})',t)
        if out and not starts and out[-1].get('open') and len(t)>1:
            out[-1]['text']+=' '+t; out[-1]['open']=t.count('(')>t.count(')') or out[-1]['text'].count('(')>out[-1]['text'].count(')'); continue
        d=dict(ln); d['text']=t; d['open']=t.count('(')>t.count(')'); out.append(d)
    return out

def parse_listen12(d, part):
    """Part 1, 2: mỗi câu = (câu hỏi P2) + các phương án '(X) English (Tiếng Việt)' + 'Chọn đáp án X'."""
    L=join_wrapped(load(d,gaps=False))
    qs=[]; cur={'opts':[],'stem':None,'extra':[]}; warns=[]
    for ln in L:
        t=ln['text']
        a=ANS.search(t)
        if a:
            n=len(qs)+1; want=4 if part==1 else 3
            opts=cur['opts']
            if len(opts)<(4 if part==1 else 3) and len(cur.get('plain',[]))>=(4 if part==1 else 3):
                opts=[(o,'') for o in cur['plain'][-(4 if part==1 else 3):]]
                if part==2 and not cur['stem'] and cur.get('pstem'): cur['stem']=(cur['pstem'],'')
            if part==2 and len(opts)==4 and not cur['stem']:
                cur['stem']=opts[0]; opts=opts[1:]
            # bỏ trùng chữ cái, giữ thứ tự xuất hiện
            if len(opts)!=want: warns.append(f'câu {n}: có {len(opts)} phương án')
            q={'n':n,'part':part,'g':None,'stem':cur['stem'][0] if cur['stem'] else '','opts':[o[0] for o in opts],'ans':'ABCD'.index(a.group(1)),
               'vi':[o[1] for o in opts],'stem_vi':cur['stem'][1] if cur['stem'] else ''}
            if q['ans']>=len(opts): warns.append(f'câu {n}: đáp án {a.group(1)} ngoài số phương án')
            qs.append(q); cur={'opts':[],'stem':None,'extra':[]}; continue
        m=_mk(t)
        if m:
            body=m.group(2).strip()
            if len(body)<=2: continue
            en,vi=split_vi(body)
            if not vi and part!=5:   # dòng phương án không có bản dịch: chỉ dùng khi lời giải thiếu bản dịch
                cur.setdefault('plain',[]).append(clean_en(en)); continue
            cur['opts'].append((clean_en(en),vi)); continue
        if part==2 and not has_vi(t) and t.rstrip().endswith('?') and len(t)>8: cur['pstem']=clean_en(t)
        if part==2 and has_vi(t) and not cur['opts']:
            en,vi=split_vi(t)
            if vi: cur['stem']=(clean_en(en),vi)
    return qs,warns
def expl12(q):
    lines=['**Tạm dịch:**']
    if q.get('stem'): lines.append(f"{q['stem']}"+(f" ({q['stem_vi']})" if q.get('stem_vi') else ''))
    for i,(o,v) in enumerate(zip(q['opts'],q['vi'])): lines.append(f"- ({'ABCD'[i]}) {o}"+(f' ({v})' if v else ''))
    return '\n'.join(lines)

def dedupe(qs):
    """file DA in lặp: cắt phần lặp lại từ câu đầu tiên."""
    for k in range(1,len(qs)):
        if qs[k]['opts']==qs[0]['opts'] and qs[k]['opts']: return qs[:k]
    return qs

SPK=re.compile(r'^\(?\s*(W|M|M1|M2|W1|W2|Man|Woman|Woman 1|Woman 2|Man 1|Man 2)\s*[:;]')
def parse_listen34(d, part):
    L=join_wrapped(load(d,gaps=False))
    groups=[]; qs=[]; warns=[]
    i=0; g=None; mode=None; seg=[]
    def flush_q(seg, ans):
        n=len(qs)+1
        T=[l['text'] for l in seg]
        # câu hỏi lượt đầu: dòng tiếng Anh (không phải phương án/số câu) đầu tiên
        fi=next((j for j,t in enumerate(T) if not _mk(t) and not NUM.match(t) and not has_vi(t) and len(t)>6),None)
        stem=T[fi] if fi is not None else ''
        stem_vi=''
        _vc=[t for t in T if not _mk(t) and has_vi(t) and '?' in split_vi(t)[0] and not looks_vi(split_vi(t)[0])]
        vs=next((t for t in _vc if len(split_vi(t)[0].split())>=3),None)
        if vs: stem,stem_vi=split_vi(vs)
        elif stem:
            key=stem[-12:]
            for t in T:
                j=t.find(key)
                if j>=0 and has_vi(t[j:]): stem_vi=split_vi(t[j:])[1]; break
        opts=[];vis=[];last=-1
        for j,t in enumerate(T):
            if fi is not None and j<fi: continue
            m=_mk(t)
            if not m: continue
            en,vi=split_vi(m.group(2))
            if vi and '?' not in en and len(opts)<4 and okL(m.group(1),'ABCD'[len(opts)]): opts.append(clean_en(en)); vis.append(vi); last=j
        vj=next((j for j,t in enumerate(T) if t is vs),None) if vs else None
        if vj is None: vj=next((j for j,t in enumerate(T) if has_vi(t) and '?' in t and (fi is None or j>fi)),None)
        if vj is not None and len(opts)!=4:
            bk=(opts,vis,last); opts=[];vis=[];last=-1
            fo={}
            for t in T[(fi or 0):vj]:
                m=_mk(t)
                if m and not split_vi(m.group(2))[1]: fo.setdefault(letter(m.group(1)),m.group(2).strip())
            want='ABCD'
            for j in range(vj+1,len(T)):
                m=_mk(T[j])
                if not m: continue
                if len(opts)>=4 or not okL(m.group(1),want[len(opts)]): continue
                L_=want[len(opts)]
                body=m.group(2); en,vi=split_vi(body)
                if not vi:
                    k=body.rfind('(')
                    if k>0 and len(body)-k>3: en,vi=body[:k],body[k+1:].rstrip(')')
                    elif not has_vi(body): en=body
                    elif L_ in fo and body.startswith(fo[L_]): en=fo[L_]; vi=body[len(fo[L_]):].strip(' ()') if body.startswith(fo[L_]) else ''
                    else:
                        ws=body.split(); iv=next((q for q,w in enumerate(ws) if has_vi(w)),len(ws))
                        ew=ws[:iv]
                        if len(ew)>1 and re.fullmatch(r'[\d.,]+',ew[-1]) and ew[-1] in ' '.join(ew[:-1]): ew=ew[:-1]
                        en=' '.join(ew); vi=' '.join(ws[iv:]).rstrip(')')
                opts.append(clean_en(en.strip())); vis.append(vi.strip()); last=j
            if len(opts)!=4: opts,vis,last=bk
        if len(opts)!=4:
            start=(fi or 0)
            fo=[clean_en(split_vi(_mk(t).group(2))[0]) for t in T[start:] if _mk(t) and len(_mk(t).group(2))>2 and not split_vi(_mk(t).group(2))[1]]
            if len(fo)>=4: warns.append(f'câu {n}: phương án lấy từ lượt đầu'); opts=fo[:4]; vis=['']*4
            else: warns.append(f'câu {n}: chỉ có {len(opts)} phương án')
        info=[t for t in T[last+1:]] if last>=0 else []
        if not stem: warns.append(f'câu {n}: không thấy câu hỏi')
        pos=(seg[fi]['page'],seg[fi]['top']) if fi is not None else ((seg[0]['page'],seg[0]['top']) if seg else None)
        gbox=None
        if fi is not None:
            oj=next((j for j in range(fi+1,len(seg)) if _mk(T[j]) and _mk(T[j]).group(1)=='A' and not split_vi(_mk(T[j]).group(2))[1]),None)
            if oj is None: oj=next((j for j in range(fi+1,len(seg)) if has_vi(T[j]) and '?' in T[j]),None)
            if oj is not None:
                a_,b_=seg[fi],seg[oj]
                gbox=(a_['page'],a_['bottom'],b_['page'],b_['top'])
        qs.append({'n':n,'part':part,'g':g['id'] if g else None,'stem':clean_en(stem),'stem_vi':stem_vi,'opts':opts,'vi':vis,'ans':'ABCD'.index(ans),'info':info,'pos':pos,'gbox':gbox})
        if g: g['hi']=n
    for ln in L:
        t=ln['text']
        h=QHDR.match(t)
        if h:
            g={'id':f'g{len(qs)+1}','lo':len(qs)+1,'hi':len(qs)+1,'tr':[]}; groups.append(g); mode='tr'; seg=[]; continue
        if re.match(r'^\d{2}:\d{2}\s*/\s*\d{2}:\d{2}',t) or t.startswith('Giải thích'): continue
        if mode=='tr':
            if NUM.match(t) or (_mk(t) and not has_vi(t)) or (not has_vi(t) and not SPK.match(t) and t.endswith('?')):
                mode='q'; seg=[ln] if not NUM.match(t) else []; continue
            g['tr'].append(t); continue  # ghép lại sau bằng split_pairs
        a=ANS.search(t)
        if a and mode=='q':
            flush_q(seg,a.group(1)); seg=[]; continue
        if mode=='q': seg.append(ln)
    return qs,groups,warns
def transcript_md(lines):
    """các dòng 'W: English (Tiếng Việt)' -> Transcript + bảng dịch"""
    tr,rows=[],[]
    for t in lines:
        en,vi=split_vi(t)
        sp=SPK.match(en)
        tr.append(en)
        lab=(sp.group(1)+': ') if sp else ''
        rows.append(f"| {en.replace('|','/')} | {lab}{vi.replace('|','/')} |" if vi else f"| {en.replace('|','/')} | |")
    return '**Transcript:**\n'+'\n'.join(tr)+'\n\n**DỊCH BÀI:**\n\n| Bản gốc (English) | Bản dịch (Tiếng Việt) |\n| :--- | :--- |\n'+'\n'.join(rows)
def expl34(q):
    lines=[q['stem_vi']] if q['stem_vi'] else []
    lines+=[f"- {'ABCD'[i]}. {v}" for i,v in enumerate(q['vi']) if v]
    info=[fix_light(x) for x in q['info'] if x.strip()]
    if info: lines+=['']+info
    return '\n'.join(lines)

def split_pairs(text):
    """'Eng1 (Việt1) Eng2 (Việt2)…' -> [(Eng1,Việt1),…]; chỉ tách ở cặp ngoặc có chữ tiếng Việt"""
    out=[]; i=0; buf=''; n=len(text)
    while i<n:
        c=text[i]
        if c=='(':
            depth=0; j=i
            while j<n:
                if text[j]=='(': depth+=1
                elif text[j]==')':
                    depth-=1
                    if depth==0: break
                j+=1
            inner=text[i+1:j]
            if has_vi(inner) and len(inner)>3:
                out.append((buf.strip(),inner.strip())); buf=''; i=j+1; continue
        buf+=c; i+=1
    if buf.strip(): out.append((buf.strip(),''))
    return out
def transcript_md2(lines):
    pairs=split_pairs(' '.join(lines))
    tr=[]; rows=[]
    for en,vi in pairs:
        if not en: continue
        en=clean_en(en); vi=fix_light(vi); sp=SPK.match(en); lab=(sp.group(1)+': ') if sp else ''
        tr.append(en); rows.append(f"| {en.replace('|','/')} | {lab}{vi.replace('|','/')} |")
    return '**Transcript:**\n'+'\n'.join(tr)+'\n\n**DỊCH BÀI:**\n\n| Bản gốc (English) | Bản dịch (Tiếng Việt) |\n| :--- | :--- |\n'+'\n'.join(rows)

IPA=re.compile(r'\s*/[^/\n]{1,45}/(?=\s*[\(:,]|\s*/)')
DBG5=False
import os
_P5FIX={('p5_06',7):('must with','must ___ with')}
def parse_p5(d):
    L=load(d,gaps=True)
    st=next((i for i,l in enumerate(L) if NUM.match(l['text']) or re.match(r'^1\s*[.,]',l['text'])),0)
    L=L[st:]
    lefts=sorted(l['left'] for l in L); margin=lefts[len(lefts)//20]
    maxR=max(l['right'] for l in L)
    _cw=sorted((l['right']-l['left'])/len(l['text']) for l in L if len(l['text'])>40 and '\\_' not in l['text'])
    cw=_cw[len(_cw)//2] if _cw else 11.5
    NUM2=re.compile(r'^\s*\d{1,2}\s*[.,]?\s*$')
    def isopt(t):
        m=_mk(t)
        if not m: return False
        b=m.group(2)
        return not has_vi(b) or (len(b)<25 and ':' not in b and '(' not in b and len(b.split())<=3)
    def optbody(t):
        b=_mk(t).group(2).strip()
        if has_vi(b):
            import unicodedata
            b=''.join(c for c in unicodedata.normalize('NFD',b) if unicodedata.category(c)!='Mn').replace('đ','d')
            b=' '.join(_fixword(w) for w in b.split())
        if ' ' not in b: b=b.rstrip('.,')
        return clean_en(b)
    segs=[];cur=[]
    for l in L:
        a=ANS.search(l['text'])
        if a: segs.append((cur,a.group(1))); cur=[]; continue
        cur.append(l)
    if cur: segs.append((cur,None))
    qs=[];warns=[]
    BL='\\_'*7
    for si,(seg,ans) in enumerate(segs):
        T=[l['text'] for l in seg]
        j=0
        while j<len(T) and isopt(T[j]) and qs and len(qs[-1]['opts'])<4 and letter(_mk(T[j]).group(1))=='ABCD'[len(qs[-1]['opts'])]:
            body=optbody(T[j])
            if body and len(qs[-1]['opts'])<4: qs[-1]['opts'].append(body)
            j+=1
        while j<len(T) and NUM2.match(T[j]): j+=1
        stem=[];opts=[];k=j
        while k<len(T) and not _mk(T[k]):
            if not NUM2.match(T[k]): stem.append(seg[k])
            k+=1
        while k<len(T) and isopt(T[k]) and len(opts)<4 and letter(_mk(T[k]).group(1))=='ABCD'[len(opts)]:
            body=optbody(T[k])
            if body: opts.append(body)
            k+=1
        if ans is None: break
        ex=[fix_light(IPA.sub('',t)) for t in T[k:]]
        n=len(qs)+1
        parts=[re.sub(r'(?<=\s)_{1,6}(?=\s)',BL,x['text']) for x in stem]
        if not any('\\_' in t for t in parts) and stem:
            done=False
            for a in range(len(stem)):
                x=stem[a]
                if x['left']>margin+max(3*x['h'],50):
                    parts[a]=BL+' '+parts[a]; done=True; break
                if a+1<len(stem):
                    nxt=stem[a+1]['text'].split()
                    need=((len(nxt[0]) if nxt else 4)+1)*cw
                    if maxR-x["right"]>need+15:
                        parts[a]=parts[a]+' '+BL; done=True; break
            if not done and len(stem)>1:
                sl=[]
                for a in range(len(stem)-1):
                    x=stem[a]; nxt=stem[a+1]['text'].split()
                    need=((len(nxt[0]) if nxt else 4)+1)*cw
                    sl.append((maxR-x['right']-need,a))
                sv,a=max(sl)
                if DBG5: print('SL',sl,maxR,[x['right'] for x in stem])
                if sv>-25: parts[a]=parts[a]+' '+BL; done=True
            if not done and not re.search(r'[.?!"”]$',parts[-1]):
                parts[-1]=parts[-1]+' '+BL+'.'; done=True
            if done: warns.append(f'câu {n}: chỗ trống suy từ bố cục')
        parts=[re.sub(r'^[_—–]+(?=\s)',BL,t) for t in parts]
        fx=_P5FIX.get((os.path.basename(d.rstrip('/')),n))
        if fx and not any('\\_' in t for t in parts):
            j_=' '.join(parts); parts=[j_.replace(fx[0],fx[1].replace('___',BL))]; warns.append(f'câu {n}: chỗ trống đặt thủ công')
        s=clean_en(' '.join(parts)).replace(BL+' „',BL+',').replace(' „',',')
        if '\\_' not in s: warns.append(f'câu {n}: không tìm thấy chỗ trống')
        qs.append({'n':n,'part':5,'g':None,'stem':s,'opts':opts,'ans':'ABCD'.index(ans),'expl':'\n'.join(ex)})
    for q in qs:
        if len(q['opts'])!=4: warns.append(f"câu {q['n']}: {len(q['opts'])} phương án")
    return qs,warns
