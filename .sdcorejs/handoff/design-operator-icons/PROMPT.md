Bạn đang làm trong repo `sdcorejs/sdcorejs-utils`. Việc: vẽ lại icon trong `OPERATORS` (`src/constants/operator.constants.ts`) theo `icons.md`. Đây là phần utils của đợt cải thiện sd-operator bên sdcorejs-angular.

Gói này đặt ở `.sdcorejs/handoff/design-operator-icons/`. Nếu tôi upload zip thì giải nén vào đó. Gói gồm:
- `icons.md`: quy tắc vẽ và chuỗi `icon` mới cho 17 operator. Đây là nguồn chính, toạ độ là giá trị chính xác.
- `screenshots/02-bo-icon.png`: bảng hiện tại / đề xuất ở 20·16·14px.
- `screenshots/03-icon-chevron-quy-tac.png`: &gt; hiện tại đặt cạnh chevron_right, quy tắc vẽ.

## Trước khi code
Đọc `icons.md`, `operator.constants.ts`, `operator.model.ts`, CHANGELOG (các mục về OPERATORS), README (mục Constants) và nội dung site nhắc tới OPERATORS (`site/src/content/api/core-entries.ts` quanh `symbol: 'OPERATORS'`). Trình kế hoạch ngắn:
- File sẽ đổi.
- Chỗ nào trong README, site, comment mô tả hình icon cụ thể và cần sửa.
- Mức changeset đề xuất (patch hay minor) và lý do.

Dừng chờ tôi duyệt.

## Phạm vi
1. **Spec trước:** thêm `src/constants/operator.constants.spec.ts` (vitest, parse bằng jsdom có sẵn):
   - Đủ 17 mục, `value` không trùng, thứ tự mảng không đổi.
   - Mọi `icon` parse được thành fragment SVG, chỉ gồm `line`, `polyline`, `rect`, `circle`, `path`.
   - Toạ độ nằm trong 0–24.
   - Mọi `NOT_*` (và NULL) chứa đúng một `<line x1="17" y1="5" x2="7" y2="19"/>`; `NOT_X` = icon của `X` + nét đó.
   - Phần tử tô đặc: circle r ≤ 2.75, rect ≤ 6×4.
   - `display` vẫn là key `core.operator.*.display`.
2. **Sửa `icon`** đúng chuỗi trong `icons.md`. Cập nhật comment trong file (họ văn bản, BETWEEN, NOT_NULL) cho khớp hình mới.
3. **Tài liệu:** README/site nếu có mô tả hình; changeset mô tả thay đổi hình (C1–C6), ghi rõ IN và NOT_NULL đổi nghĩa hình.

## Ràng buộc
- Không đổi `value`, `display`, kiểu của `OPERATORS`, thứ tự mảng; không thêm/bỏ operator; không thêm export.
- Không thêm `stroke-width`, `width`, `height` vào `icon`.
- IN và NOT_NULL đổi trong cùng một changeset.

## Kiểm tra
```
npm run typecheck
npm run test:coverage
npm run build
npm run validate:package
npm run validate:site
```

Không commit, push, version hay publish khi tôi chưa yêu cầu. Khi xong, báo lại:
- file đã đổi
- spec đã thêm
- kết quả các lệnh kiểm tra
- nội dung changeset
- điểm nào lệch khỏi `icons.md` và lý do
