# Font nhúng cho xuất PDF (utils/pdf)

**Tinos** (Google, giấy phép Apache License 2.0 — https://fonts.google.com/specimen/Tinos/license):
metric-compatible với Times New Roman (cùng độ rộng ký tự), dùng thay Times New Roman
(font bản quyền Microsoft, không được đóng gói phân phối) để PDF ngắt dòng giống bản Word.

Đã cắt bớt (subset) chỉ giữ Latin + tiếng Việt + vài dấu câu, mỗi file ~24KB. Nguồn:
`@fontsource/tinos@4.5.9` (`files/tinos-all-*.woff`). Tạo lại bằng fonttools:

```
pyftsubset tinos-all-400-normal.woff --flavor= --no-hinting --layout-features='*' \
  --unicodes="U+0020-007E,U+00A0-00FF,U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303,U+0309,U+0323,U+1EA0-1EF9,U+2013-2014,U+2018-201D,U+2022,U+2026,U+20AB,U+2264-2265" \
  --output-file=Tinos-Regular.ttf
```
(tương tự 700-normal -> Bold, 400-italic -> Italic, 700-italic -> BoldItalic).

Ký tự ngoài danh sách trên sẽ KHÔNG hiển thị trong PDF — dấu ✓ không có trong Tinos nên
được vẽ bằng SVG (xem pdfChung.ts).
