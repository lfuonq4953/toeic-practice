#!/usr/bin/env python3
"""Cắt ảnh (Part 1 + hình bảng/sơ đồ) từ PDF phần Listening theo tọa độ tỉ lệ.

Bước 1 - xem các trang để tìm tọa độ (ảnh PNG 70 dpi lưu vào thư mục tạm):
  python3 tools/crop_images.py --pdf LC.pdf --preview /tmp/pages
Bước 2 - ghi tests/<id>/crops.json, ví dụ:
  {"q1": [2, 0.13, 0.086, 0.88, 0.44],   # [trang, x0, y0, x1, y1] đều là tỉ lệ 0..1 so với trang
   "q63": [8, 0.066, 0.061, 0.383, 0.21]}
Bước 3 - cắt:
  python3 tools/crop_images.py --pdf LC.pdf --id test-03
Trang đánh số từ 1. Cần poppler-utils (pdftoppm) và Pillow.
"""
import argparse, json, os, subprocess, sys, tempfile, glob
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def render(pdf, dpi, out):
    os.makedirs(out, exist_ok=True)
    subprocess.run(['pdftoppm', '-r', str(dpi), '-png', pdf, os.path.join(out, 'p')], check=True)
    return sorted(glob.glob(os.path.join(out, 'p-*.png')))

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--pdf', required=True)
    ap.add_argument('--preview', help='chỉ xuất ảnh các trang 70 dpi vào thư mục này rồi dừng')
    ap.add_argument('--id', help='mã đề; đọc tests/<id>/crops.json và ghi tests/<id>/img/*.jpg')
    a = ap.parse_args()
    if a.preview:
        for f in render(a.pdf, 70, a.preview): print(f)
        return
    if not a.id: sys.exit('Cần --id hoặc --preview')
    tdir = os.path.join(ROOT, 'tests', a.id)
    crops = json.load(open(os.path.join(tdir, 'crops.json'), encoding='utf-8'))
    tmp = tempfile.mkdtemp()
    pages = render(a.pdf, 150, tmp)
    os.makedirs(os.path.join(tdir, 'img'), exist_ok=True)
    for name, (page, x0, y0, x1, y1) in crops.items():
        im = Image.open(pages[page-1]).convert('RGB')
        W, H = im.size
        im.crop((int(x0*W), int(y0*H), int(x1*W), int(y1*H))).save(os.path.join(tdir, 'img', name + '.jpg'), quality=82)
        print('  ', name)

if __name__ == '__main__':
    main()
