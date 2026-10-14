#!/bin/bash
# OCR từng trang (150 dpi); dừng khi gặp lại tiêu đề "Question 1-" (file DA bị in lặp 2 lần)
pdf="$1"; out="$2"; mkdir -p "$out"; [ -f "$out/.done" ] && exit 0
n=$(pdfinfo "$pdf" | awk '/^Pages/{print $2}')
for ((i=1;i<=n;i++)); do
  [ -f "$out/p$i.tsv" ] || { pdftoppm -r 170 -gray -png -f $i -l $i "$pdf" "$out/_pg"; f=$(ls "$out"/_pg*.png | head -1);
    tesseract "$f" "$out/p$i" --tessdata-dir "${TESSDATA:-/usr/share/tesseract-ocr/5/tessdata}" -l vie --psm 4 -c tessedit_create_tsv=1 -c tessedit_create_txt=0 >/dev/null 2>&1; rm -f "$out"/_pg*.png; }
  if [ $i -gt 1 ] && awk -F'\t' 'prev=="Question" && $12 ~ /^1[-–]/ {f=1} {prev=$12} END{exit !f}' "$out/p$i.tsv"; then
    rm -f "$out/p$i.tsv"; echo "$i" > "$out/.dup"; break; fi
done
touch "$out/.done"
