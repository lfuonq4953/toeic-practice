#!/usr/bin/env python3
"""Ghi dung lượng tải offline (MB) của từng đề vào tests/manifest.js (trường "mb").
Chạy lại sau khi thêm/sửa đề:  python3 tools/manifest_sizes.py"""
import json, re, os, glob
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
p=os.path.join(ROOT,'tests','manifest.js'); t=open(p,encoding='utf-8').read()
arr=json.loads(re.search(r'window\.MANIFEST\s*=\s*(\[.*\]);',t,re.S).group(1))
for a in arr:
    d=os.path.join(ROOT,'tests',a['id'])
    fs=[os.path.join(d,'data.js')]+glob.glob(os.path.join(d,'img','*'))+glob.glob(os.path.join(d,'audio','*.mp3'))
    a['mb']=round(sum(os.path.getsize(f) for f in fs if os.path.isfile(f))/1e6,1)
open(p,'w',encoding='utf-8').write(t.split('window.MANIFEST')[0]+'window.MANIFEST = '+json.dumps(arr,ensure_ascii=False,indent=1)+';\n')
print(len(arr),'đề; tổng',round(sum(a['mb'] for a in arr)),'MB')
