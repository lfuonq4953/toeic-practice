#!/usr/bin/env python3
"""Tạo các bộ luyện theo Part (tests/pK-NN) từ OCR file DA + audio. Dùng: build_sets.py <setid> [...]  (vd p1_01)"""
import sys, os, json, re, glob, subprocess, shutil
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import partparse as P
from photos import render, find_images
from ocrlines import load
from PIL import Image
U=os.environ.get('LUYENDE','../../..'); REPO=os.environ.get('REPO',os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))); OCR=os.environ.get('OCR_DIR','ocr')
META=os.path.join(OCR,'meta')
VN={1:'Part 1',2:'Part 2',3:'Part 3',4:'Part 4',5:'Part 5'}
def da_pdf(part,n):
    d=f'{U}/De_Part{part}/De{n}'; return (glob.glob(d+'/*A_*.pdf') or [None])[0]
def mp3(part,n):
    d=f'{U}/De_Part{part}/De{n}'; return (glob.glob(d+'/*.mp3') or [None])[0]
def header_n(d):
    for l in load(d,gaps=False)[:15]:
        m=re.match(r'^Questions?\s+1\s*[-–]\s*(\d+)',l['text'])
        if m: return int(m.group(1))
def last_page(d):
    p=os.path.join(d,'.dup')
    return int(open(p).read())-1 if os.path.exists(p) else None
def crop_images(pdf, d, want, outdir, names, positions=None):
    tmp='/tmp/crop_'+os.path.basename(d); shutil.rmtree(tmp,ignore_errors=True)
    lp=last_page(d)
    pages=render(pdf,150,tmp,1,lp) if lp else render(pdf,150,tmp)
    found=[]
    for pi,f in enumerate(pages,1):
        boxes,(W,H)=find_images(f)
        for b in boxes: found.append((pi,b,f,W,H))
    if positions:  # chọn ảnh nằm ngay sau vị trí câu hỏi (trang, top theo 170dpi)
        sel=[]
        for pos in positions:
            pg,top=pos; top150=top*150/170
            c=[x for x in found if (x[0]>pg) or (x[0]==pg and x[1][1]>=top150-20)]
            sel.append(c[0] if c else None)
    else:
        sel=found[:want]
    os.makedirs(outdir,exist_ok=True); ok=0
    for nm,x in zip(names,sel):
        if not x: continue
        pi,(x0,y0,x1,y1,_),f,W,H=x
        Image.open(f).convert('RGB').crop((x0,y0,x1,y1)).save(os.path.join(outdir,nm+'.jpg'),quality=82); ok+=1
    shutil.rmtree(tmp,ignore_errors=True)
    return len(found),ok
def _trim(c):
    import numpy as np
    rgb=np.asarray(c).astype(int)
    green=((rgb[:,:,1]-rgb[:,:,0])>6)&((rgb[:,:,1]-rgb[:,:,2])>3)
    rows=np.where(green.mean(1)>0.3)[0]
    if len(rows): c=c.crop((0,0,c.width,max(1,rows[0]-4)))   # bỏ khung xanh của đáp án đúng
    a=np.asarray(c.convert('L'))<225
    ys=np.where(a.any(1))[0]; xs=np.where(a.any(0))[0]
    if len(ys)<20: return None
    c=c.crop((max(0,xs[0]-6),max(0,ys[0]-6),min(c.width,xs[-1]+7),min(c.height,ys[-1]+7)))
    return c if c.height>=50 and c.width>=80 else None
def crop_graphic(pdf,gbox,out):
    p0,y0,p1,y1=gbox
    tmp='/tmp/cg'; shutil.rmtree(tmp,ignore_errors=True)
    pages=render(pdf,170,tmp,p0,p1)
    ims=[Image.open(f).convert('RGB') for f in pages]
    H=ims[0].height; W=ims[0].width
    parts=[]
    if p0==p1: parts.append(ims[0].crop((0,y0+4,W,y1-28)))
    else:
        parts.append(ims[0].crop((0,y0+4,W,H-110)))   # bỏ chân trang
        parts.append(ims[-1].crop((0,90,W,y1-28)))     # bỏ đầu trang
    parts=[p for p in (_trim(x) for x in parts if x.height>10) if p]
    if not parts: return False
    if len(parts)==1: c=parts[0]
    else:
        w=max(p.width for p in parts); c=Image.new('RGB',(w,sum(p.height for p in parts)),'white'); y=0
        for p in parts: c.paste(p,(0,y)); y+=p.height
    c.save(out,quality=85); return True
def compress(src,dst):
    os.makedirs(os.path.dirname(dst),exist_ok=True)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',src,'-map','0:a','-ac','1','-b:a','56k',dst],check=True)
    d=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',dst],capture_output=True,text=True).stdout.strip()
    return float(d or 0)
def build(sid):
    part=int(sid[1]); n=int(sid.split('_')[1]); d=f'{OCR}/{sid}'
    tid=f'p{part}-{n:02d}'; tdir=f'{REPO}/tests/{tid}'
    pdf=da_pdf(part,n); warns=[]
    if part in (1,2):
        qs,w=P.parse_listen12(d,part); groups=[]
        for q in qs: q['expl']=P.expl12(q)
    elif part in (3,4):
        qs,groups,w=P.parse_listen34(d,part)
        for q in qs: q['expl']=P.expl34(q)
        for g in groups: g.update({'part':part,'title':'','passage':'','expl':P.transcript_md2(g.pop('tr'))})
    else:
        qs,w=P.parse_p5(d); groups=[]
    warns+=w
    N=header_n(d)
    if part in (3,4): N=None
    if N and len(qs)>N: qs=qs[:N]; groups=[g for g in groups if g['lo']<=N]
    if N and len(qs)!=N: warns.append(f'số câu {len(qs)} khác tiêu đề 1-{N}')
    # ảnh
    shutil.rmtree(tdir,ignore_errors=True); os.makedirs(tdir+'/img',exist_ok=True)
    if part==1:
        names=[f'q{q["n"]}' for q in qs]
        tot,ok=crop_images(pdf,d,len(qs),tdir+'/img',names)
        for q in qs: q['img']=f'q{q["n"]}'
        if ok!=len(qs) or tot!=len(qs): warns.append(f'ảnh: tìm {tot}, cắt {ok}/{len(qs)}')
    if part in (3,4):
        gq=[q for q in qs if 'graphic' in q['stem'].lower()]
        if gq:
            ok=0
            for q in gq:
                if q.get('gbox') and crop_graphic(pdf,q['gbox'],f'{tdir}/img/q{q["n"]}.jpg'): q['img']=f'q{q["n"]}'; ok+=1
            warns.append(f'hình: {ok}/{len(gq)} câu graphic')
    # audio
    meta={'id':tid,'title':f'{VN[part]} · Đề {n:02d}','subtitle':f'Luyện tập {"PART 5" if part==5 else "PART "+str(part)} theo xu hướng ra đề 2025 – đề số {n:02d}',
          'source':'Tài Liệu Ôn Thi Group','kind':'part','parts':[part],'questions':len(qs)}
    if part<=4:
        a=mp3(part,n)
        if a: dur=compress(a,f'{tdir}/audio/part{part}.mp3'); meta['minutes']=max(1,round(dur/60))
        else: meta['audio']=False; meta['minutes']=0; warns.append('không có audio')
    else: meta['minutes']=max(5,round(len(qs)*0.6))
    for q in qs:
        for k in ('vi','stem_vi','info','pos','gbox'): q.pop(k,None)
    data={'questions':qs,'groups':groups,'meta':{k:meta[k] for k in ('audio',) if k in meta}}
    open(f'{tdir}/data.js','w',encoding='utf-8').write('window.TEST='+json.dumps(data,ensure_ascii=False)+';')
    os.makedirs(META,exist_ok=True); json.dump(meta,open(os.path.join(META,f'{tid}.json'),'w',encoding='utf-8'),ensure_ascii=False)
    return tid,len(qs),warns
if __name__=='__main__':
    for sid in sys.argv[1:]:
        try: print(*build(sid))
        except Exception as e: import traceback; traceback.print_exc(); print(sid,'LỖI',e)
