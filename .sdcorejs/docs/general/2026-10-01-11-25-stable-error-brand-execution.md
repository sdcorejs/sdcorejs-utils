---
artifact_id: execution-utils-stable-error-brand-20261001
artifact_kind: execution-doc
change_ref: utils-stable-error-brand
source_spec: .sdcorejs/specs/general/2026-10-01-11-03-stable-error-brand.md
source_plan: .sdcorejs/plans/general/2026-10-01-11-25-stable-error-brand.md
commit_policy: with-change
owner: sdcorejs-execute-plan
track: general
created_at: 2026-10-01T05:00:00.000Z
redaction_applied: true
---

# Change Execution Record - Brand ổn định cho error class (@sdcorejs/utils 1.2.5)

## Requested Outcome

`instanceof` giữa các public entry (`fns`, `errors`, root) phải đúng và `error.name` phải ổn định khi app bundle thư viện. Hiện tại esbuild đổi tên các binding class trùng nhau (`UnsafePropertyPathError2`, hoặc tên ngắn khi minify), nên brand dựa vào `constructor.name` không còn khớp. Phát hiện này đến từ review NSP-5745 ở `@sd-angular/core` (R5).

## Material Changes

- EDIT `src/errors.ts`:
  - Thêm `static readonly errorName: string` cho cả 19 class.
  - `name` và brand chỉ lấy `errorName` riêng của class.
  - Constructor ném `TypeError('<ClassName> must declare its own static errorName')` khi class không tự khai báo `errorName`.
  - `Symbol.hasInstance` vẫn check native trước; class không có `errorName` riêng thì không được so brand (finding R1).
- CREATE `src/errors.spec.ts`: 27 case.
- EDIT `scripts/validate-package.mjs`: thêm `validateBundledErrorIdentity`, bundle esbuild với minify tắt và bật.
- CREATE `.changeset/stable-error-brand.md`: patch, có mục breaking cho lớp con.
- EDIT `README.md` (mục Typed errors) và `site/src/content/api/core-entries.ts` (entry `SdcoreUtilsError`).

## Decisions And Invariants

- `errorName` khai báo kiểu `string` thay vì literal. Lý do: `static readonly errorName = 'X'` bị suy ra kiểu literal, khiến lớp cháu gặp lỗi `TS2417` lúc typecheck.
- Brand và `hasInstance` chỉ dùng `errorName` riêng của class (INV-002). Một class trung gian không khai báo `errorName` sẽ không được so brand giữa các bản class.
- Phát hành bản patch 1.2.5 dù có breaking với lớp con. Đây là quyết định của owner (D-003), vì thư viện còn ít consumer.

## Verification Evidence

- Baseline:
  - `npm test`: exit 0, 843/843.
  - `npm run build && npm run test:package:browser`: exit 0, trên code cũ.
- RED:
  - `npm test -- src/errors.spec.ts`: exit 1, 24 fail, ví dụ `expected 'Re' to be 'Sub'`.
  - `npm run build && npm run test:package:browser`: exit 1, `name: "UnsafePropertyPathError2"`, mọi `instanceof` đều `false`.
- GREEN:
  - `npm run typecheck`: exit 0.
  - `npm test`: 869/869, sau repair R1 là 870/870.
  - `npm run validate`: exit 0, gồm coverage, publint, attw và test:package (runtime, types, browser, examples), có `bundled cross-entry error identity passed (minify off/on)`.
  - `npm run validate:site`: exit 0.
- Repair R1:
  - RED: `expected true to be false`.
  - GREEN: spec 27/27 và validate exit 0.

## Known Gaps

- AC-007 (manual): bạn cần review tay changeset, README và docs site.
- AC-008 (deferred): sau khi 1.2.5 được publish, `@sd-angular/core` nâng phiên bản utils đang pin (1.2.4), rồi kiểm tra ở portal đã bundle rằng huỷ chọn file không còn báo lỗi (R4 của NSP-5745).
- Plan ghi "20 class"; thực tế có 19 class. Test duyệt toàn bộ export nên không ảnh hưởng.
- Các finding R2 và R3 (message dùng tên class có thể bị minify; `errorName` vẫn gán lại được lúc chạy) để ở mức advisory, chưa sửa.

## Related Artifacts

- Spec: `.sdcorejs/specs/general/2026-10-01-11-03-stable-error-brand.md`
- Architecture: `.sdcorejs/architecture/general/2026-10-01-11-20-stable-error-brand.md`
- Plan: `.sdcorejs/plans/general/2026-10-01-11-25-stable-error-brand.md`
