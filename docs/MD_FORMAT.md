# Định dạng file markdown của đề

`tools/build_test.py` đọc file markdown có cấu trúc như đề số 02 (bộ "Tài Liệu Ôn Thi Group"). Nếu đề mới có cấu trúc khác, hãy chuyển về đúng định dạng này trước khi build.

## Khung chung
```
## LISTENING TEST
### PART 1
#### Câu 1-6:
...
### PART 2
#### Câu 7-31:
...
## READING TEST
### PART 5
#### Câu 101-130:
```
- Mỗi cụm câu bắt đầu bằng dòng `#### Câu a-b:` (Part 1, 2, 5 gộp cả Part trong một cụm; Part 3, 4, 6, 7 mỗi bài một cụm).
- Dải câu của từng Part cố định: P1 1-6, P2 7-31, P3 32-70, P4 71-100, P5 101-130, P6 131-146, P7 147-200.

## Một câu hỏi
```
**7.** Mark your answer on your answer sheet.      <- Part 2 có dòng này, sẽ bị bỏ
Why is the doctor running late?                      <- nội dung câu hỏi
- (A) OK, but I don't feel sick.
- (B) She had car trouble.
- (C) No, that's not too early.

**Giải thích:**
**Tạm dịch:** ...                                    <- mọi thứ đến dòng đáp án là phần giải thích (markdown)

**→ Chọn đáp án B**
```
- Số câu ở đầu dòng: `**N.**`. Phương án: `- (A) ...`. Part 2 có 3 phương án, còn lại 4.
- Dòng đáp án đúng bắt buộc: `**→ Chọn đáp án X**` (X là A-D). Nếu dòng có nhiều chữ cái, script lấy chữ cuối và in cảnh báo.
- Part 1: dòng ngay sau số câu có dạng `*(Hình ảnh: mô tả ...)*`, được lưu thành `desc` và chỉ hiện khi xem đáp án.
- Part 5: chỗ trống viết `\_\_\_\_\_\_\_`.
- Với câu "Look at the graphic", các dòng mô tả hình (`**Hình ảnh ...**`, `**Bảng ...**`, `- **...`) sẽ bị bỏ khỏi đề; hình thật lấy từ `img/q<N>.jpg`.

## Part 3, 4 (hội thoại, bài nói)
Sau `#### Câu a-b:` và trước câu đầu tiên:
```
**Giải thích:**
**Transcript:**
M: ...
**DỊCH BÀI:**
| Bản gốc (English) | Bản dịch (Tiếng Việt) |
...
```
Toàn bộ phần sau `**Giải thích:**` được lưu thành `expl` của nhóm (nút "Transcript & bản dịch").

## Part 6, 7 (bài đọc)
```
**Questions 131-134 refer to the following e-mail.**

> **From:** ...
> nội dung bài đọc, mỗi dòng bắt đầu bằng "> "
>
> (nhiều khối > cách nhau một dòng trống nếu có nhiều bài)

**Giải thích:**
**DỊCH BÀI:**
| ... bảng dịch ... |
```
- Tiêu đề `**Questions a-b refer to ...**` -> `title`; các dòng `>` -> `passage` (markdown); phần sau `**Giải thích:**` -> bản dịch.
- Chỗ trống Part 6 trong bài viết dạng `**131.\_\_\_\_\_\_\_**`.
