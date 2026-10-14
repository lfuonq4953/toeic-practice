# Luyện thi TOEIC (nhiều đề)

Website thi thử TOEIC chạy hoàn toàn trên trình duyệt (HTML/CSS/JS thuần, không build, không server).

## Tính năng
Website có hai chuyên mục riêng, chuyển qua thanh trên cùng: **Luyện đề** và **Từ vựng**.

### Từ vựng (`#vocab`)
- 26 bài (≈1.300 từ) chia theo Part 1–4 và theo từ loại: động từ, danh từ, tính từ, trạng từ, giới từ & cụm từ.
- **Flashcard**: lật thẻ xem nghĩa, phiên âm UK/US, ví dụ song ngữ, cụm từ, từ liên quan; bấm "Đã thuộc" / "Chưa thuộc" (phím → / ←, Space để lật). Từ chưa thuộc quay lại sau vài thẻ.
- **Trắc nghiệm** 4 lựa chọn (Anh → Việt hoặc Việt → Anh), câu sai tự chuyển sang "Chưa thuộc".
- **Danh sách từ**: lọc, xem ví dụ, đổi trạng thái từng từ. Phát âm bằng giọng đọc của trình duyệt.
- Học cả nhóm, ôn tất cả từ chưa thuộc, tra từ trên toàn bộ dữ liệu.

### Luyện đề
- **Thư viện đề**: mỗi đề là một thư mục trong `tests/`, trạng thái và kết quả lưu riêng từng đề.
- **Thi thử toàn bộ**: audio Listening 4 Part tự chuyển tiếp, Reading có đồng hồ 75 phút, chỉ xem đáp án sau khi nộp.
- **Luyện từng Part**: đáp án và giải thích hiện ngay sau mỗi câu; audio tua được, đổi tốc độ.
- **Kết quả**: điểm ước tính (thang 990, quy đổi gần đúng), kết quả theo Part.
- **Xem lại**: lọc câu sai / chưa làm / đã đánh dấu, kèm transcript và bản dịch.
- Giao diện sáng/tối theo hệ thống, dùng được trên điện thoại. Tiến độ lưu bằng `localStorage`.

## Cấu trúc
```
index.html, style.css, app.js     giao diện và logic
tests/manifest.js                 danh sách đề
tests/<id>/data.js                câu hỏi, đáp án, giải thích (window.TEST)
tests/<id>/img/                   ảnh Part 1 và hình bảng/sơ đồ
tests/<id>/audio/part1..4.mp3     audio
tests/<id>/crops.json             tọa độ cắt ảnh từ PDF (để làm lại được)
vocab.js, vocab/data.js           phần Từ vựng (data.js tạo bằng tools/build_vocab.py)
tools/                            build_test.py, crop_images.py, validate_test.py, build_vocab.py
docs/ADD_NEW_TEST.md              prompt giao cho AI để thêm đề mới
docs/ADD_VOCAB.md                 cách thêm/cập nhật từ vựng từ file CSV
docs/MD_FORMAT.md                 định dạng markdown của đề
```

## Chạy trên máy
```bash
python3 -m http.server 8000   # mở http://localhost:8000
```

## Đăng lên GitHub Pages
Settings → Pages → Deploy from a branch → `main` / `(root)`. Trang cần internet để tải `marked` (cdnjs) và font (Google Fonts).

## Thêm đề mới
Xem `docs/ADD_NEW_TEST.md` (có prompt sẵn). Tóm tắt bằng tay:
```bash
python3 tools/build_test.py --id test-03 --title "TOEIC Test 03" --md de03.md --audio p1.mp3 p2.mp3 p3.mp3 p4.mp3 --graphics 63,66,69
python3 tools/crop_images.py --pdf lc.pdf --preview /tmp/pages      # xem trang, tìm tọa độ
# ghi tests/test-03/crops.json rồi:
python3 tools/crop_images.py --pdf lc.pdf --id test-03
python3 tools/validate_test.py --id test-03
```

## Bản quyền
Nội dung đề, audio và lời giải trong `tests/test-02` thuộc Tài Liệu Ôn Thi Group và cô Vũ Mai Phương. Chỉ đăng công khai khi có quyền sử dụng; nếu không, để repository ở chế độ private.
