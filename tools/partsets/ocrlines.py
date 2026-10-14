"""Đọc TSV của tesseract -> danh sách dòng (theo thứ tự trang), có đánh dấu khoảng trống lớn (chỗ trống điền từ)."""
import csv, glob, os, re, statistics
BLANK='\\_\\_\\_\\_\\_\\_\\_'
JUNK=re.compile(r'^(Tài Liệu Ôn Thi Group|https?://\S*TaiLieu\S*|.*TAILIEUONTHI.*)$', re.I)
def page_lines(tsv, gaps=True):
    rows=list(csv.DictReader(open(tsv,encoding='utf-8'),delimiter='\t',quoting=csv.QUOTE_NONE))
    L={}
    for r in rows:
        if r['level']!='5' or not (r['text'] or '').strip(): continue
        k=(int(r['block_num']),int(r['par_num']),int(r['line_num']))
        L.setdefault(k,[]).append((int(r['left']),int(r['top']),int(r['width']),int(r['height']),r['text'],float(r['conf'])))
    out=[]
    for k in sorted(L):
        ws=sorted(L[k]); h=statistics.median([w[3] for w in ws])
        parts=[]
        for i,(l,t,w,hh,tx,cf) in enumerate(ws):
            if i and gaps:
                g=l-(ws[i-1][0]+ws[i-1][2])
                if g>max(h*2.2,40): parts.append(BLANK)
            parts.append(tx)
        out.append({'text':' '.join(parts),'left':ws[0][0],'right':ws[-1][0]+ws[-1][2],'top':min(w[1] for w in ws),'bottom':max(w[1]+w[3] for w in ws),'h':h})
    return out
def load(d, gaps=True):
    files=sorted(glob.glob(os.path.join(d,'p*.tsv')),key=lambda f:int(re.search(r'p(\d+)\.tsv$',f).group(1)))
    lines=[]
    for f in files:
        pg=int(re.search(r'p(\d+)\.tsv$',f).group(1))
        for ln in page_lines(f,gaps):
            t=ln['text'].strip()
            if not t or JUNK.match(t): continue
            ln['page']=pg; lines.append(ln)
    return lines
