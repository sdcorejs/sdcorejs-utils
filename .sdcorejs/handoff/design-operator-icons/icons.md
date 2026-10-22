# Operator icons · thông số

Nguồn: `Operator Review.dc.html` mục 02–03 (gói handoff sd-operator của sdcorejs-angular). Mã C1–C6 khớp với trang đó.

## Quy tắc vẽ
- viewBox 24, `fill="none"`, `stroke="currentColor"`, `stroke-linecap/linejoin="round"`. Wrapper do consumer dựng, không đổi.
- Mọi glyph nằm trong vùng 5–19, tâm 12. Ngoại lệ: pill của nhóm văn bản (2.5–21.5).
- Một nét phủ định chung: `S = <line x1="17" y1="5" x2="7" y2="19"/>`. Mọi operator `NOT_*` = icon gốc + `S`.
- Phần tô đặc (`fill="currentColor" stroke="none"`) chỉ cho chấm nhỏ: circle r ≤ 2.75, rect ≤ 6×4.
- Stroke-width không nằm trong `icon`; consumer đặt theo cỡ (sd-operator: 20 → 2, 18 → 2.1, 16 → 2.25, 14 → 2.5).

## Icon mới
| Operator | `icon` | Mã |
|---|---|---|
| EQUAL | `<line x1="6" y1="9.5" x2="18" y2="9.5"/><line x1="6" y1="14.5" x2="18" y2="14.5"/>` | |
| NOT_EQUAL | EQUAL + S | C4 |
| GREATER_THAN | `<polyline points="7,7 17,12 7,17"/>` | C1 |
| LESS_THAN | `<polyline points="17,7 7,12 17,17"/>` | C1 |
| GREATER_OR_EQUAL | `<polyline points="7,5 17,10 7,15"/><line x1="7" y1="19" x2="17" y2="19"/>` | C2 |
| LESS_OR_EQUAL | `<polyline points="17,5 7,10 17,15"/><line x1="7" y1="19" x2="17" y2="19"/>` | C2 |
| CONTAIN | `<rect x="2.5" y="7" width="19" height="10" rx="5"/><rect x="9" y="10" width="6" height="4" rx="2" fill="currentColor" stroke="none"/>` | C3 |
| NOT_CONTAIN | CONTAIN + S | C3 |
| START_WITH | `<rect x="2.5" y="7" width="19" height="10" rx="5"/><rect x="5.5" y="10" width="6" height="4" rx="2" fill="currentColor" stroke="none"/>` | C3 |
| NOT_START_WITH | START_WITH + S | C3 |
| END_WITH | `<rect x="2.5" y="7" width="19" height="10" rx="5"/><rect x="12.5" y="10" width="6" height="4" rx="2" fill="currentColor" stroke="none"/>` | C3 |
| NOT_END_WITH | END_WITH + S | C3 |
| IN | `<path d="M17 6.5h-4.5a5.5 5.5 0 0 0 0 11H17M7 12h9"/>` (∈) | C5 |
| NOT_IN | IN + S (∉) | C5 |
| BETWEEN | `<line x1="7" y1="12" x2="17" y2="12"/><circle cx="7" cy="12" r="2.5" fill="currentColor" stroke="none"/><circle cx="17" cy="12" r="2.5" fill="currentColor" stroke="none"/>` | |
| NULL | `<circle cx="12" cy="12" r="6.5"/>` + S (∅) | C6 |
| NOT_NULL | `<circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="2.75" fill="currentColor" stroke="none"/>` | C6 |

Ghép `+ S` bằng cách nối chuỗi: icon gốc rồi tới `<line x1="17" y1="5" x2="7" y2="19"/>`.

## Lý do (tóm tắt)
- C1: `9,5 16,12 9,19` gần như `chevron_right`/`chevron_left`, dễ đọc thành điều hướng.
- C2: ≥ ≤ cao 17 đơn vị, góc lệch 1 đơn vị so với &gt; &lt;.
- C3: đoạn tô 5×2.5 chỉ còn ~3×1.5px ở 14px, ba vị trí khó phân biệt.
- C4: ba kiểu nét phủ định khác nhau (`18,5→6,19`, `19,5→5,19`, `17.5,6.5→6.5,17.5`).
- C5: IN đặt ở `cx=13`, lệch tâm; vòng + chấm giống radio.
- C6: NOT_NULL là đĩa đặc r=7, nặng nhất bộ; NULL viền đứt nhoè ở cỡ nhỏ.

IN (∈) và NOT_NULL (vòng + chấm, hình IN cũ) phải đổi trong cùng một bản phát hành.
