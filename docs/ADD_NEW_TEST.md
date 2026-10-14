# Prompt để thêm đề mới vào website

Dùng khi bạn có một đề mới (file markdown + PDF + 4 file audio). Mở thư mục repo bằng một AI có quyền chạy lệnh và đọc file (ví dụ Claude Code), đặt các file đề vào một thư mục tạm (ví dụ `~/Downloads/de-03/`), rồi dán prompt dưới đây. Sửa phần trong `[...]` cho đúng đề của bạn.

---

## PROMPT

```
Bạn đang làm việc trong repo website luyện thi TOEIC (HTML/CSS/JS thuần, không build). Nhiệm vụ: thêm MỘT đề mới vào website mà không sửa code giao diện.

THÔNG TIN ĐỀ MỚI
- Mã đề (id): [test-03]            (chữ thường, số, gạch ngang; trùng id cũ = ghi đè đề đó)
- Tên hiển thị: [TOEIC Test 03]
- Mô tả ngắn: [Bộ đề thi thử sát đề thi thật 2025 – đề số 03]
- Nguồn: [Tài Liệu Ôn Thi Group]
- File markdown (đề + đáp án + giải thích): [~/Downloads/de-03/de_so_03.md]
- PDF Listening: [~/Downloads/de-03/lc.pdf]
- PDF Reading:   [~/Downloads/de-03/rc.pdf]   (chỉ để đối chiếu khi cần)
- Audio Part 1..4: [~/Downloads/de-03/audio-part-1.mp3, ...-2.mp3, ...-3.mp3, ...-4.mp3]

CẤU TRÚC REPO (đọc trước khi làm)
- index.html, style.css, app.js: giao diện. KHÔNG sửa trừ khi tôi yêu cầu.
- tests/manifest.js: danh sách đề (window.MANIFEST).
- tests/<id>/data.js (window.TEST = {questions, groups}), tests/<id>/img/, tests/<id>/audio/part1..4.mp3, tests/<id>/crops.json.
- tools/build_test.py, tools/crop_images.py, tools/validate_test.py: công cụ có sẵn. Chạy với --help để xem cách dùng.
- docs/MD_FORMAT.md: định dạng markdown mà build_test.py hiểu. Đề đã có sẵn trong tests/test-02/ để làm mẫu.

CÁC BƯỚC
1. Đọc docs/MD_FORMAT.md, rồi đọc file markdown mới (đọc theo từng đoạn nếu dài). So sánh với định dạng chuẩn. Nếu khác (ví dụ khác tiêu đề, khác cách ghi đáp án), hãy chuyển một BẢN SAO file markdown về đúng định dạng chuẩn. Không được bịa hoặc sửa nội dung câu hỏi, phương án, đáp án; chỉ đổi cách trình bày. Nếu không còn cách nào khác mới sửa tools/build_test.py và nói rõ đã sửa gì.
2. Xác định các câu Part 3/4 có "Look at the graphic" (câu có hình bảng/sơ đồ kèm theo). Ghi lại số câu.
3. Chạy tools/build_test.py với đủ tham số (--id, --title, --subtitle, --source, --md, --audio 4 file, --graphics <các số câu có hình>). Đọc mọi dòng CẢNH BÁO.
4. Ảnh: chạy tools/crop_images.py --pdf <LC.pdf> --preview <thư mục tạm> để xuất ảnh các trang, xem từng trang bằng công cụ đọc ảnh. Tìm 6 ảnh Part 1 (img/q1..q6) và các hình của câu trong bước 2 (img/q<số câu>). Ghi tests/<id>/crops.json theo tọa độ tỉ lệ 0..1 ([trang, x0, y0, x1, y1], trang đánh số từ 1), chạy lại crop_images.py với --id, rồi mở từng ảnh vừa cắt để kiểm tra: không bị cắt mất phần hình, không lẫn chữ của đề, không dính watermark lớn. Sửa tọa độ và cắt lại cho đến khi đạt.
5. Chạy tools/validate_test.py --id <id>. Phải ra 0 lỗi. Xử lý hết cảnh báo hoặc giải thích rõ vì sao bỏ qua.
6. Đối chiếu ngẫu nhiên: lấy ít nhất 15 câu rải đều 7 Part (gồm các câu graphic, Part 6, Part 7 có nhiều bài đọc) và so đáp án, phương án trong data.js với PDF/markdown gốc. Báo cáo mọi sai khác. Đặc biệt kiểm tra các câu mà đáp án trong file markdown có ghi chú mâu thuẫn với bài đọc.
7. Chạy thử: `python3 -m http.server 8000` trong thư mục repo, mở trang (nếu có trình duyệt headless/Playwright thì dùng), xác nhận: thư viện đề hiện thẻ đề mới; mở đề không báo lỗi; Part 1 có ảnh; phát được audio; làm một câu ở Part 5 và một câu ở Part 7 thấy chấm đúng/sai và hiện giải thích.
8. Kiểm tra dung lượng: mỗi file < 50 MB, tổng thư mục tests/<id> hợp lý (thường 15-25 MB). Nếu audio lớn hơn, nén thêm bằng ffmpeg (mono, 48-56 kbps).
9. KHÔNG xóa hoặc sửa các đề khác trong tests/. Chỉ tests/manifest.js được phép thay đổi ngoài thư mục tests/<id>/.
10. Không tự commit hoặc push. Cuối cùng báo cáo ngắn: số câu, các cảnh báo còn lại, những câu bạn nghi ngờ, danh sách file đã tạo/sửa, và đề xuất nội dung commit.

QUY TẮC
- Không bịa nội dung hoặc đáp án; thiếu dữ liệu thì dừng lại và hỏi tôi.
- Giữ nguyên tiếng Việt có dấu trong mọi file, mã hóa UTF-8.
- Nếu id đã tồn tại, hỏi tôi trước khi ghi đè.
```

---

## Nếu bạn chỉ có PDF (không có markdown)
Thêm vào đầu prompt: "Tôi không có file markdown. Hãy trích nội dung từ PDF (LC và RC) và file đáp án/giải thích [đường dẫn] thành một file markdown theo đúng docs/MD_FORMAT.md, làm theo từng Part, trình bày cho tôi mẫu Part 1 và Part 5 để duyệt trước khi làm tiếp." Việc này tốn nhiều công hơn; nên xin bản markdown/đáp án từ nguồn đề nếu có.

## Sau khi AI làm xong
1. Tự mở thử: `python3 -m http.server 8000` rồi vào http://localhost:8000.
2. `git add tests index.html && git commit -m "Thêm đề test-03" && git push`.
3. GitHub Pages tự cập nhật sau vài phút.
