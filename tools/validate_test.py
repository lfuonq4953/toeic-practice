#!/usr/bin/env python3
"""Kiểm tra một đề đã build: python3 tools/validate_test.py --id test-03  (thoát mã 1 nếu có lỗi)"""
import argparse, json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RANGES = {1:(1,6),2:(7,31),3:(32,70),4:(71,100),5:(101,130),6:(131,146),7:(147,200)}

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--id', required=True); a = ap.parse_args()
    t = os.path.join(ROOT, 'tests', a.id)
    errs, warns = [], []
    try:
        txt = open(os.path.join(t, 'data.js'), encoding='utf-8').read()
        data = json.loads(re.sub(r'^window\.TEST=|;\s*$', '', txt))
    except Exception as e:
        sys.exit(f'LỖI: không đọc được data.js ({e})')
    qs = data['questions']; groups = {g['id']: g for g in data['groups']}
    nums = [q['n'] for q in qs]
    if nums != list(range(1, 201)): errs.append('Số câu phải là 1..200 liên tục, hiện có %d câu' % len(qs))
    for q in qs:
        n = q['n']; lo, hi = RANGES[q['part']]
        if not lo <= n <= hi: errs.append(f'Câu {n}: sai Part {q["part"]}')
        want = 3 if q['part'] == 2 else 4
        if len(q['opts']) != want or any(not o for o in q['opts']): errs.append(f'Câu {n}: cần {want} phương án, có {len(q["opts"])}')
        if q['ans'] is None or not 0 <= q['ans'] < want: errs.append(f'Câu {n}: thiếu/sai đáp án')
        if not q['expl']: warns.append(f'Câu {n}: chưa có giải thích')
        if q['part'] in (3,4,6,7):
            g = groups.get(q['g'])
            if not g: errs.append(f'Câu {n}: thiếu nhóm {q["g"]}')
            elif q['part'] >= 6 and not g['passage']: errs.append(f'Câu {n}: nhóm {g["id"]} thiếu bài đọc')
            elif q['part'] in (3,4) and not g['expl']: warns.append(f'Câu {n}: nhóm {g["id"]} thiếu transcript')
        if q['part'] in (5,) and not q['stem']: errs.append(f'Câu {n}: Part 5 thiếu đề')
        if q['part'] in (2,3,4,7) and not q['stem']: errs.append(f'Câu {n}: thiếu nội dung câu hỏi')
        if q.get('img') and not os.path.exists(os.path.join(t, 'img', q['img'] + '.jpg')):
            errs.append(f'Câu {n}: thiếu ảnh img/{q["img"]}.jpg')
    for q in qs:
        if q['part'] == 4 and 'graphic' in q['stem'].lower() and not q.get('img'): warns.append(f'Câu {q["n"]}: có chữ "graphic" nhưng chưa gắn ảnh (--graphics)')
        if q['part'] == 3 and 'graphic' in q['stem'].lower() and not q.get('img'): warns.append(f'Câu {q["n"]}: có chữ "graphic" nhưng chưa gắn ảnh (--graphics)')
    for i in range(1, 5):
        if not os.path.exists(os.path.join(t, 'audio', f'part{i}.mp3')): errs.append(f'Thiếu audio/part{i}.mp3')
    man = open(os.path.join(ROOT, 'tests', 'manifest.js'), encoding='utf-8').read()
    if f'"id": "{a.id}"' not in man: errs.append('Chưa có trong tests/manifest.js')
    for w in warns: print('CẢNH BÁO:', w)
    for e in errs: print('LỖI:', e)
    print(f'{len(qs)} câu, {len(errs)} lỗi, {len(warns)} cảnh báo')
    sys.exit(1 if errs else 0)

if __name__ == '__main__':
    main()
