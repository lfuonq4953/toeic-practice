# Thêm / cập nhật từ vựng

Phần **Từ vựng** (`#vocab`) đọc dữ liệu từ `vocab/data.js`. File này được tạo tự động từ thư mục CSV, không sửa tay.

## Định dạng file CSV
- Tên file: `day<số>-<nhóm><số thứ tự>.csv`, ví dụ `day1-part1.csv`, `day11-dongtu1.csv`, `day26-gioitucumtu.csv`.
- Nhóm nhận dạng theo tên: `part1`…`part7`, `dongtu` (Động từ), `danhtu` (Danh từ), `tinhtu` (Tính từ), `trangtu` (Trạng từ), `gioitu…` (Giới từ & cụm từ). Tên khác vào nhóm "Khác".
- Phân tách bằng dấu phẩy (có ngoặc kép) **hoặc** tab đều được. Mã hóa UTF-8.
- Dòng đầu là tên cột:
  `id, word, pos, ipa_uk, ipa_us, meaning, example_en, example_vi, synonyms, antonyms, related, collocations`
- Nhiều ví dụ / cụm từ trong một ô cách nhau bằng ` | `. Số ví dụ ở `example_en` và `example_vi` phải bằng nhau.

## Tạo lại dữ liệu
```bash
python3 tools/build_vocab.py --src ../../TuVung
```
Script in số bài, số từ theo nhóm và các CẢNH BÁO (thiếu nghĩa, số ví dụ EN/VI lệch…).

## Tiến độ học
Lưu trong trình duyệt (`localStorage`, khóa `toeic:vocab`), theo mã `d<ngày>-<id>`. Nếu sửa `id` của từ trong CSV, tiến độ của từ đó sẽ mất.
