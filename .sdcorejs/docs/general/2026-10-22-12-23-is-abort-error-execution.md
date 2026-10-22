---
artifact_id: execution-utils-is-abort-error-r1
artifact_kind: execution-doc
schema_version: 1
change_ref: utils-is-abort-error
source_spec: .sdcorejs/specs/general/2026-10-22-12-10-is-abort-error.md
source_architecture: .sdcorejs/architecture/general/2026-10-22-12-17-is-abort-error.md
source_plan: .sdcorejs/plans/general/2026-10-22-12-53-is-abort-error.md
commit_policy: with-change
owner: sdcorejs-execute-plan
owner_repository_id: github.com/sdcorejs/sdcorejs-utils
source_revision: dfe9fa7e05a9fbc86981f7f7c5872a6541bbbffc
---

# isAbortError — kết quả thực thi

Đã triển khai trên nhánh `feat/is-abort-error`, baseline main v1.3.0. Thực thi tuần tự theo plan đã duyệt. Không commit/push/tag/publish.

## Thay đổi

- Thêm predicate trong `src/errors.ts`: tên AbortError hoặc reason khớp signal đã hủy; TimeoutError ưu tiên false; không đọc cause; chứa exception từ property access.
- JSDoc tiếng Anh đủ 11 mục, bốn ví dụ trùng mã với `site/src/examples/abort-errors.example.ts`.
- Validator kiểm runtime/types/browser, JSDoc theo TypeScript symbol resolution, site examples compile qua tarball và snippet parity (kèm drift/missing/duplicate negative probes).
- README, API en/vi, example registry, paging note, các inventory tests và changeset minor.

## Bằng chứng TDD và kiểm chứng

| Lệnh | Kết quả |
| --- | --- |
| `npm test -- src/errors.spec.ts` trước thay đổi | PASS, 27 test |
| Cùng lệnh sau viết test, trước helper | RED, assertion export undefined; 27 test cũ qua |
| `npm run build` baseline + `npm run test:package:runtime` trước helper | Build PASS, runtime RED tại assertion public export |
| Errors suite sau helper | GREEN, 52 test, không skip |
| `npm run build` + `npm run test:package:runtime` sau helper | PASS ESM/CJS, root/errors và smoke RxJS hiện có |
| Bốn site specs trước metadata | RED, 9 assertion về entry/example/inventory mới |
| Bốn site specs sau metadata | GREEN, 29 test |
| `npm run test:examples` cuối | PASS, 18 README blocks, root và site examples, JSDoc parity |
| `npm run validate:all` cuối | PASS, exit 0; 1.045 test thư viện + 79 test site |
| `git diff --check` | PASS |

Lượt validate đầu phát hiện fixture signal getter trả never cần `as unknown as AbortSignal`; đã sửa fixture và chạy lại toàn bộ. Validator ban đầu yêu cầu declaration trực tiếp trong index.d.ts và negative probe bắt sai message; đã sửa cách phân giải declaration và marker fixture, rồi chạy lại. Không giảm assertions/coverage hoặc skip test để qua.

`validate` đã chạy typecheck, coverage, build, publint, attw và toàn bộ package fixtures. `validate:site` đã chạy typecheck, test, content validation, build và build-budget validation. Site có 165 public symbols, 13 examples; initial gzip 25.773 bytes dưới budget 102.400 bytes.

Coverage thư viện: statements 90,60%; branches 86,52%; functions 96,41%; lines 93,58%. `errors.ts` đạt 100% statements/functions/lines và 97,50% branches; nhánh chưa phủ thuộc constructor hiện hữu.

## JSDoc qua entry gốc

Build tsup hiện giữ declaration cùng JSDoc trong errors.d.ts/errors.d.cts, còn index.d.ts/index.d.cts tái xuất symbol. Không nhân bản comment vào file sinh ra. Validator dùng TypeScript checker đi theo alias của cả bốn public imports và kiểm documentation, tags, bốn code blocks trên declaration mà IDE sử dụng. Đây là điều chỉnh cách kiểm so với giả định declaration inline trong draft plan; hover contract và cấu hình build hiện hữu được giữ nguyên.

## Nghiệm thu

| ID | Kết quả | Bằng chứng |
| --- | --- | --- |
| AC-001 | PASS | AbortError, Error đổi name, jsdom khác realm và fetch HTTP local bị hủy thật. |
| AC-002 | PASS | Custom reason object/primitive/null/function, signal đã hủy, strict identity và NaN. |
| AC-003 | PASS | TimeoutError luôn false; đã đợi sự kiện AbortSignal.timeout() thật. |
| AC-004 | PASS | Không đọc cause; lỗi bọc và mọi class utils mặc định không bị nhận nhầm. |
| AC-005 | PASS | Getter/Proxy/revoked Proxy và signal access lỗi không thoát exception; name đọc một lần. |
| AC-006 | PASS + MANUAL | Input frozen, thứ tự đọc signal, review không mutation/I/O/timer/listener; từng nhánh có // why:. |
| AC-007 | PASS | Root và errors qua ESM/CJS, declarations .mts/.cts và browser bundle. |
| AC-008 | PASS + MANUAL | Review đủ 11 mục JSDoc; TypeScript checker xác nhận hover qua cả root/errors ESM/CJS. |
| AC-009 | PASS + MANUAL | Bốn ví dụ độc lập có đủ import/callback; review service/search/custom-reason/timeout. |
| AC-010 | PASS | Site examples và 18 README blocks compile bằng tarball; parity và negative checks qua. |
| AC-011 | PASS + MANUAL | API function en/vi, canonical import, liên kết example, paging; review bản dịch. |
| AC-012 | MANUAL | Changeset minor; diff không đổi hierarchy/paging/Angular/dependencies/version. |
| AC-013 | PASS | validate:all exit 0, bao gồm validate và validate:site. |

Các kết luận MANUAL là review mã/nội dung do `sdcorejs-execute-plan` thực hiện theo owner được chỉ định trong plan đã duyệt; không giả là automated PASS hoặc xác nhận cá nhân của người dùng. `evaluateValidationEvidence` trả `ready: true, result: MANUAL`, không blocker, với đủ 17 case IDs. Hai evidence-class projections UNIT/SUPPLEMENTAL_SMOKE cùng tham chiếu một lần chạy validate:all, không phải hai lần chạy độc lập.

Review JSDoc đã xác nhận: summary/cancellation UI/sources; hai luật true và false; name vs instanceof; custom signal; API nền tảng; hai params; returns; remarks no-throw/getter boundary/runtime; bốn ví dụ có giải thích; ba @see. Search kiểm identity và aborted trước render, bỏ kết quả cũ; service rethrow; timeout đi đến nhánh báo lỗi.

## Danh tính bằng chứng

- Runtime thực chạy: Node v22.14.0, Windows.
- Lần validate thành công: 2026-10-22T06:08:05.932Z đến 2026-10-22T06:10:54.065Z.
- Source/diff identity: `dfe9fa7e05a9fbc86981f7f7c5872a6541bbbffc+sha256:3f6f8e84008e926ee5eba6637c71315b3869286bec33410c17972604acb72026`.
- Output digest: `sha256:cab89bac098e9ab1243f6d1ea481b3afff7f5bd4335e4fe301e6aca7af4891f5`.
- Config fingerprint: `sha256:v1:00f72b70fd9e50ca856b56a549a4bdf1ec2d7b482a2c9a5aff2846a4e9b75f9b`.
- Environment fingerprint: `sha256:v1:90db7fa8c2cb05217bc930c9cbd692769505fed98d08fbd83a6360fd61266020`.
- Không chạy local Node 20/24; matrix CI 20/22/24 hiện hữu giữ nguyên, không suy ra đã chạy CI.
- Test HTTP đóng server/connections, jsdom đóng window, validator dọn consumer tạm.

## Phạm vi và bàn giao

TASK-001–TASK-007 hoàn tất; final read-only hygiene/closure check chạy sau khi ghi record này. Không sửa `src/fns/string.security.spec.ts`, các fns/models/constants, src/index.ts, manifests/locks, tsup/vitest config hoặc CI. Chỉ build/test tự sinh dist/coverage/site dist đã ignore.

Spec, architecture, approved plan và decision coverage đã được xác minh bằng helper hash/parent graph. Các draft/snapshot cùng change cần đi cùng implementation khi người dùng yêu cầu commit; execution record này là tài liệu bàn giao, không phải session checkpoint.

## Kết quả cổng bàn giao

Kiểm tra cuối xác nhận hash/parent graph hợp lệ, artifact closure đầy đủ, source không đổi sau validate và không có lỗi whitespace/conflict/focused-test/debug.

`evaluateValidationEvidence` chấp nhận bằng chứng và acknowledgement của executor theo plan (`ready: true, result: MANUAL`). Bộ `evaluateConvergence` hiện trả `DEFERRED`, fresh, chỉ với `MANUAL_OR_DEFERRED_EVIDENCE`: evaluator này luôn giữ các row manual của AC-006/008/009/011/012 ngoài trạng thái tự động CONVERGED, kể cả khi đã có review. Không tạo receipt CONVERGED hoặc tuyên bố READY cho Git/release. Các lệnh nghiệm thu kỹ thuật đều PASS; không có yêu cầu commit/push/release trong phạm vi hiện tại.

Projection convergence liên kết các task chỉ đọc với artifact thay đổi mà chúng kiểm chứng, tách khỏi quyền ghi; chuẩn hóa risk contract regression và gắn INV-003 cho phạm vi docs/declarations. Approved validation map và snapshots giữ nguyên.
