#!/usr/bin/env python3
"""Tạo vocab/data.js từ thư mục các file từ vựng (CSV phân tách bằng dấu phẩy HOẶC tab).

Ví dụ:
  python3 tools/build_vocab.py --src ../../TuVung

Tên file: day<số>-<nhóm><số thứ tự>.csv, ví dụ day1-part1.csv, day11-dongtu1.csv, day26-gioitucumtu.csv.
Nhóm nhận dạng: part1..part7, dongtu, danhtu, tinhtu, trangtu, gioitu/gioitucumtu. Nhóm lạ -> "Khác".
Cột bắt buộc (dòng đầu): id, word, pos, ipa_uk, ipa_us, meaning, example_en, example_vi,
                         synonyms, antonyms, related, collocations
Trong một ô, nhiều ví dụ/cụm từ cách nhau bằng " | ".
"""
import argparse, csv, glob, json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COLS = ['id','word','pos','ipa_uk','ipa_us','meaning','example_en','example_vi','synonyms','antonyms','related','collocations']
# (mã nhóm, tên, mô tả, khu vực)
GROUPS = [
  ('part1','Part 1','Mô tả tranh','part'), ('part2','Part 2','Hỏi – đáp','part'),
  ('part3','Part 3','Hội thoại','part'), ('part4','Part 4','Bài nói','part'),
  ('part5','Part 5','Điền vào câu','part'), ('part6','Part 6','Điền vào đoạn văn','part'), ('part7','Part 7','Đọc hiểu','part'),
  ('dongtu','Động từ','Verbs','pos'), ('danhtu','Danh từ','Nouns','pos'), ('tinhtu','Tính từ','Adjectives','pos'),
  ('trangtu','Trạng từ','Adverbs','pos'), ('gioitu','Giới từ & cụm từ','Prepositions & phrases','pos'),
  ('khac','Khác','','pos'),
]

def group_of(slug):
    s = slug.lower()
    m = re.match(r'part([1-7])', s)
    if m: return 'part' + m.group(1)
    for g in ('dongtu','danhtu','tinhtu','trangtu','gioitu'):
        if s.startswith(g): return g
    return 'khac'

def read_rows(path):
    txt = open(path, encoding='utf-8-sig').read()
    head = txt.split('\n', 1)[0]
    if '\t' in head:
        rd = csv.reader(txt.splitlines(), delimiter='\t', quoting=csv.QUOTE_NONE)
    else:
        rd = csv.reader(txt.splitlines())
    rows = list(rd)
    hdr = [h.strip().lower() for h in rows[0]]
    miss = [c for c in COLS if c not in hdr]
    if miss: sys.exit(f'{os.path.basename(path)}: thiếu cột {miss}')
    out = []
    for r in rows[1:]:
        if not any(c.strip() for c in r): continue
        r = r + [''] * (len(hdr) - len(r))
        out.append({c: r[hdr.index(c)].strip() for c in COLS})
    return out

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--src', required=True, help='thư mục chứa các file dayN-*.csv')
    ap.add_argument('--out', default=os.path.join(ROOT, 'vocab', 'data.js'))
    a = ap.parse_args()
    files = []
    for f in glob.glob(os.path.join(a.src, '*.csv')):
        m = re.match(r'day(\d+)-(.+)\.csv$', os.path.basename(f), re.I)
        if not m: print('  bỏ qua (sai tên file):', os.path.basename(f)); continue
        files.append((int(m.group(1)), m.group(2), f))
    files.sort()
    decks, words, warns = [], [], []
    for day, slug, f in files:
        did = f'd{day:02d}'
        rows = read_rows(f)
        g = group_of(slug)
        n = sum(1 for d in decks if d['g'] == g) + 1
        for r in rows:
            if not r['word'] or not r['meaning']:
                warns.append(f'{os.path.basename(f)} id {r["id"]}: thiếu word/meaning'); continue
            if r['example_en'].count(' | ') != r['example_vi'].count(' | '):
                warns.append(f'{os.path.basename(f)} "{r["word"]}": số ví dụ EN/VI không khớp')
            w = {'k': f'{did}-{r["id"]}', 'd': did}
            for c in COLS[1:]:
                if r[c]: w[c] = r[c]
            words.append(w)
        decks.append({'id': did, 'day': day, 'g': g, 'n': n, 'file': os.path.basename(f),
                      'count': sum(1 for w in words if w['d'] == did)})
    keys = [w['k'] for w in words]
    if len(set(keys)) != len(keys): warns.append('Có id trùng trong cùng một file')
    used = {d['g'] for d in decks}
    groups = [{'id': g, 'name': n, 'sub': s, 'area': ar} for g, n, s, ar in GROUPS if g in used]
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    open(a.out, 'w', encoding='utf-8').write(
        '/* Tạo bởi tools/build_vocab.py — không sửa tay. */\nwindow.VOCAB=' +
        json.dumps({'groups': groups, 'decks': decks, 'words': words}, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print(f'{a.out}: {len(decks)} bài, {len(words)} từ, {os.path.getsize(a.out)/1024:.0f} KB')
    for g in groups:
        ds = [d for d in decks if d['g'] == g['id']]
        print(f'  {g["name"]}: {len(ds)} bài, {sum(d["count"] for d in ds)} từ')
    for w in warns: print('  CẢNH BÁO:', w)

if __name__ == '__main__':
    main()
