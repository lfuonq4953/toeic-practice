#!/usr/bin/env python3
"""Tạo một đề mới từ file markdown + audio và đăng ký vào tests/manifest.js.

Ví dụ:
  python3 tools/build_test.py --id test-03 --title "TOEIC Test 03" \
      --subtitle "Bộ đề thi thử sát đề thi thật 2025 – đề số 03" --source "Tài Liệu Ôn Thi Group" \
      --md /duong/dan/de_03.md \
      --audio p1.mp3 p2.mp3 p3.mp3 p4.mp3 \
      --graphics 63,66,69,95,99

Việc script làm:
  1. Đọc markdown (đúng định dạng của đề số 02, xem docs/MD_FORMAT.md) -> tests/<id>/data.js
  2. Nén 4 file audio -> tests/<id>/audio/part1..4.mp3 (mono 56 kbps, cần ffmpeg)
  3. Thêm/cập nhật mục của đề trong tests/manifest.js
Ảnh (Part 1 + các câu có hình) KHÔNG do script này tạo: dùng tools/crop_images.py.
"""
import argparse, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PART_RANGES = {1:(1,6),2:(7,31),3:(32,70),4:(71,100),5:(101,130),6:(131,146),7:(147,200)}
NUMRE = re.compile(r'^\*\*(\d+)\.\*\*\s*(.*)$')
OPTRE = re.compile(r'^- \(([A-D])\)\s*(.*)$')

def part_of(n):
    for p,(a,b) in PART_RANGES.items():
        if a <= n <= b: return p

def parse(md_path, graphics):
    L = open(md_path, encoding='utf-8').read().split('\n')
    hdr = [i for i,l in enumerate(L) if l.startswith('#### Câu')]
    hdr.append(len(L))
    qs, groups, notes = [], [], []
    for gi in range(len(hdr)-1):
        a, b = hdr[gi]+1, hdr[gi+1]
        for k in range(a, b):
            if L[k].startswith('### ') or L[k].startswith('## '):
                b = k; break
        m = re.match(r'#### Câu (\d+)-(\d+)', L[hdr[gi]])
        lo, hi = int(m.group(1)), int(m.group(2))
        part = part_of(lo)
        seg = L[a:b]
        fq = next((k for k,l in enumerate(seg) if NUMRE.match(l)), len(seg))
        g = {'id': f'g{lo}', 'part': part, 'lo': lo, 'hi': hi, 'title': '', 'passage': '', 'expl': ''}
        if part in (3,4,6,7):
            pas, exp, mode = [], [], None
            for l in seg[:fq]:
                if mode == 'e': exp.append(l); continue
                if l.startswith('**Giải thích:**'):
                    mode = 'e'; continue
                if l.startswith('**Questions') and not g['title']:
                    g['title'] = l.strip('*').strip(); continue
                if l.startswith('>'):
                    mode = 'p'; pas.append(l[1:].lstrip() if l.strip() != '>' else ''); continue
                # Part 6/7: bảng, tiêu đề... nằm giữa các khối '>' cũng là một phần của bài đọc
                if part in (6, 7) and (mode == 'p' or l.strip()):
                    mode = 'p'
                    if l.startswith('|') and pas and pas[-1].strip() and not pas[-1].startswith('|'): pas.append('')
                    if pas and pas[-1].startswith('|') and not l.startswith('|') and l.strip(): pas.append('')
                    pas.append(l)
            g['passage'] = '\n'.join(pas).strip(); g['expl'] = '\n'.join(exp).strip()
            groups.append(g)
        idx = [k for k,l in enumerate(seg) if NUMRE.match(l)] + [len(seg)]
        for j in range(len(idx)-1):
            blk = seg[idx[j]:idx[j+1]]
            n = int(NUMRE.match(blk[0]).group(1))
            opts, stem, ans, desc, ex, state = [], [], None, '', [], 'stem'
            for l in blk:
                mm = NUMRE.match(l)
                if mm: l = mm.group(2)
                if state == 'stem':
                    if OPTRE.match(l): state = 'opt'
                    elif l.startswith('**Giải thích'): state = 'ex'; continue
                    else:
                        if l.strip(): stem.append(l.strip())
                        continue
                if state == 'opt':
                    o = OPTRE.match(l)
                    if o: opts.append(o.group(2).strip()); continue
                    if l.startswith('**Giải thích'): state = 'ex'; continue
                    continue
                if state == 'ex':
                    a2 = re.match(r'^\*\*→ Chọn đáp án (.*?)\*\*\s*$', l)
                    if a2:
                        letters = re.findall(r'\b([A-D])\b', a2.group(1))
                        if len(letters) > 1:
                            notes.append(f'Câu {n}: dòng đáp án có nhiều lựa chọn "{a2.group(1)}", đã lấy "{letters[-1]}" (kiểm tra lại)')
                        if letters: ans = 'ABCD'.index(letters[-1])
                        continue
                    ex.append(l)
            clean = []
            for s in stem:
                if s.startswith('*(Hình ảnh'):
                    desc = s.strip('*()').replace('Hình ảnh:', '').strip(); continue
                if s.startswith('Mark your answer'): continue
                if s.startswith('**Hình ảnh') or s.startswith('**Bảng') or s.startswith('- **'): continue
                clean.append(s)
            q = {'n': n, 'part': part, 'g': g['id'] if part in (3,4,6,7) else None,
                 'stem': ' '.join(clean), 'opts': opts, 'ans': ans, 'expl': '\n'.join(ex).strip()}
            if desc: q['desc'] = desc
            if part == 1 or n in graphics: q['img'] = f'q{n}'
            qs.append(q)
    qs.sort(key=lambda q: q['n'])
    return qs, groups, notes

def compress_audio(files, outdir):
    os.makedirs(outdir, exist_ok=True)
    for i, f in enumerate(files, 1):
        out = os.path.join(outdir, f'part{i}.mp3')
        subprocess.run(['ffmpeg','-y','-loglevel','error','-i',f,'-ac','1','-b:a','56k',out], check=True)
        print(f'  audio part{i}: {os.path.getsize(out)/1e6:.1f} MB')

def update_manifest(entry):
    path = os.path.join(ROOT, 'tests', 'manifest.js')
    txt = open(path, encoding='utf-8').read()
    m = re.search(r'window\.MANIFEST\s*=\s*(\[.*\]);', txt, re.S)
    arr = json.loads(m.group(1)) if m else []
    arr = [t for t in arr if t['id'] != entry['id']] + [entry]
    head = txt.split('window.MANIFEST')[0]
    open(path, 'w', encoding='utf-8').write(head + 'window.MANIFEST = ' + json.dumps(arr, ensure_ascii=False, indent=2) + ';\n')

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--id', required=True, help='mã đề, ví dụ test-03 (chữ thường, số, gạch ngang)')
    ap.add_argument('--title', required=True)
    ap.add_argument('--subtitle', default='')
    ap.add_argument('--source', default='')
    ap.add_argument('--md', required=True, help='file markdown đề + đáp án + giải thích')
    ap.add_argument('--audio', nargs=4, metavar=('P1','P2','P3','P4'), help='4 file mp3 của Part 1-4')
    ap.add_argument('--graphics', default='', help='số câu Part 3/4 có hình, ví dụ 63,66,69,95,99')
    a = ap.parse_args()
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]*', a.id): sys.exit('--id chỉ gồm chữ thường, số, gạch ngang')
    graphics = {int(x) for x in a.graphics.split(',') if x.strip()}
    tdir = os.path.join(ROOT, 'tests', a.id)
    os.makedirs(os.path.join(tdir, 'img'), exist_ok=True)
    qs, groups, notes = parse(a.md, graphics)
    open(os.path.join(tdir, 'data.js'), 'w', encoding='utf-8').write(
        'window.TEST=' + json.dumps({'questions': qs, 'groups': groups}, ensure_ascii=False) + ';')
    print(f'data.js: {len(qs)} câu, {len(groups)} nhóm')
    for n in notes: print('  CẢNH BÁO:', n)
    if a.audio: compress_audio(a.audio, os.path.join(tdir, 'audio'))
    else: print('  (bỏ qua audio: chưa truyền --audio)')
    from datetime import date
    update_manifest({'id': a.id, 'title': a.title, 'subtitle': a.subtitle, 'source': a.source,
                     'questions': len(qs), 'minutes': 120, 'added': date.today().isoformat()})
    print('Đã cập nhật tests/manifest.js. Tiếp theo: tools/crop_images.py rồi tools/validate_test.py --id', a.id)

if __name__ == '__main__':
    main()
