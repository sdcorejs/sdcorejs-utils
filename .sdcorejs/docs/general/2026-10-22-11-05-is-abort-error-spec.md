---
artifact_id: spec-draft-utils-is-abort-error-r1
artifact_kind: execution-doc
schema_version: 1
change_ref: utils-is-abort-error
source_spec: .sdcorejs/specs/general/2026-10-22-12-10-is-abort-error.md
source_plan: none
commit_policy: with-change
owner: sdcorejs-spec
owner_repository_id: github.com/sdcorejs/sdcorejs-utils
owner_repository_role: library
owner_module_id: errors
source_revision: dfe9fa7e05a9fbc86981f7f7c5872a6541bbbffc
---

# Spec - Nhận diện lỗi hủy request bằng isAbortError - 2026-10-22 11:05

Trạng thái: người dùng đã duyệt bằng lựa chọn 1 ngày 2026-10-22. Snapshot đã duyệt là `.sdcorejs/specs/general/2026-10-22-12-10-is-abort-error.md`; chưa thay đổi mã thư viện.

## Problem & Goals

Ứng dụng cần phân biệt hủy request có chủ đích với lỗi thực để tránh toast, error log hoặc UI error không cần thiết khi gõ tìm kiếm, đổi trang/filter hay hủy component. Thêm một predicate nhỏ vào package hiện hữu, với hợp đồng có thể hiểu đầy đủ qua IDE hover và bốn ví dụ có kiểm tra kiểu.

Repository đích là `sdcorejs/sdcorejs-utils`. Sau lựa chọn của người dùng và `git fetch origin main`, baseline là `main` v1.3.0, commit `dfe9fa7e05a9fbc86981f7f7c5872a6541bbbffc`; nhánh làm việc `feat/is-abort-error`. Package `@sdcorejs/utils` là semantic owner và execution host của thay đổi.

## Requirements

- **R-001** — Thêm đúng API isAbortError(error: unknown, signal?: AbortSignal | null): boolean vào src/errors.ts và xuất qua entry gốc cùng ./errors.
- **R-002** — Nhận diện AbortError bằng tên hoặc custom reason trùng === với reason của signal đã abort; TimeoutError luôn bị loại trừ; không duyệt cause.
- **R-003** — Hàm không ném lỗi ra ngoài, bảo vệ việc đọc thuộc tính trên input bất thường, không tự thay đổi dữ liệu hoặc trạng thái bên ngoài và mỗi nhánh có // why:.
- **R-004** — JSDoc tiếng Anh tự đầy đủ khi hover, đáp ứng đủ 11 mục trong yêu cầu, giữ lại trong dist/errors.d.ts và dist/index.d.ts sau build.
- **R-005** — Bốn ví dụ JSDoc a–d có bản thực thi tương ứng trong site/src/examples/abort-errors.example.ts và được npm run test:examples kiểm tra kiểu để ngăn lỗi thời.
- **R-006** — Test hành vi trong src/errors.spec.ts cùng kiểm tra package exports bao phủ các trường hợp yêu cầu trên Node 20/22/24 và đối tượng khác realm/jsdom.
- **R-007** — README errors, API site en/vi và hướng dẫn paging giải thích cách xử lý hủy request; entry API và ví dụ được đăng ký vào catalog hiện hữu.
- **R-008** — Changeset minor cho @sdcorejs/utils; npm run validate và npm run validate:site thành công; giữ nguyên fetchAllByPaging và phạm vi ngoài package.

### Hợp đồng API và nhận diện

```ts
export const isAbortError = (error: unknown, signal?: AbortSignal | null): boolean
```

- Export từ `@sdcorejs/utils/errors` và `@sdcorejs/utils`; giữ kiểu trả về `boolean`.
- Object khác null có `name === 'AbortError'` trả `true`, gồm DOMException, Error thường và object khác realm. Không yêu cầu `instanceof`, constructor, message hoặc mã lỗi.
- Khi có signal, `signal.aborted === true` và `error === signal.reason` thì trả `true`, trừ TimeoutError và input có truy cập thuộc tính cần thiết gây lỗi.
- `name === 'TimeoutError'` luôn trả `false` dù chính là reason của signal. Đây là lỗi cần báo cho người dùng theo chính sách của API này.
- Signal chưa abort không giúp nhận diện reason, kể cả `error === undefined === signal.reason`. Signal null hoặc undefined chỉ tắt nhánh nhận diện custom reason; luật AbortError theo tên vẫn hoạt động.
- Dùng đúng `===`: object cùng nội dung nhưng khác reference không khớp; custom reason `NaN` không khớp chính nó. Primitive hoặc null có thể là custom reason hợp lệ khi signal thỏa điều kiện; không loại toàn bộ primitive trước nhánh signal.
- Không có luật nào khớp thì `false`. Không đọc `cause`, không unwrap lỗi bọc và không coi các SdcoreUtilsError mặc định là AbortError. Một reason được người gọi chủ động dùng trong `abort(reason)` vẫn theo luật custom reason.
- Bảo vệ việc đọc `name` bằng try/catch; đọc tối đa một lần. Proxy bị revoke, Proxy/getter ném hoặc truy cập signal bất thường không được làm exception thoát khỏi helper. Khi không đọc được name thì trả false, kể cả reason trùng, để tránh che một TimeoutError không kiểm tra được.
- Không tự mutate input, abort signal, ném reason, tạo timer/listener, log hay I/O. Mỗi nhánh và fallback có một dòng `// why:` giải thích lý do.
- Giới hạn của yêu cầu không side effect: property access có thể chạy getter/Proxy trap do caller cung cấp. Helper bắt lỗi từ chúng nhưng không thể hoàn tác side effect do mã getter tự thực hiện; remarks phải diễn đạt chính xác giới hạn này.

### Checklist JSDoc tiếng Anh

1. Summary cho biết giá trị bắt trong catch có phải lỗi do hủy request hay không.
2. Giải thích hủy là chủ động: rethrow hoặc bỏ qua; tránh toast, error log và UI error. Nêu đủ tìm kiếm khi gõ, đổi trang/filter và component teardown.
3. Nêu cả hai luật true, TimeoutError false kể cả reason match, các trường hợp còn lại false và không duyệt cause để tránh nhận nhầm lỗi bọc.
4. Giải thích DOMException phân biệt loại bằng name, không có subclass riêng cho từng loại và instanceof không đáng tin qua realm.
5. Giải thích khi cần signal cho abort(customReason); thiếu signal không có bằng chứng liên hệ reason tùy chỉnh với request đã hủy.
6. Phân biệt nhận diện với phát sinh hủy: dùng signal.throwIfAborted() hoặc Promise.reject(signal.reason) khi cần truyền lỗi hủy, không thêm helper mới.
7. Có @param error (unknown, kể cả primitive/null/undefined) và @param signal (AbortSignal tùy chọn; null/undefined bỏ kiểm custom reason).
8. Có @returns mô tả đúng boolean theo hợp đồng.
9. Có @remarks về không ném, không chủ động thay đổi trạng thái, giới hạn getter, browser/Node/jsdom và khác realm.
10. Có ít nhất bốn @example, mỗi ví dụ có câu giải thích ngay trước code và mã tương ứng trong file ví dụ.
11. Có @see liên kết MDN AbortSignal.reason, AbortSignal.throwIfAborted và liên hệ fetchAllByPaging.

Sau build, kiểm comment gắn với declaration `isAbortError` trong cả `dist/errors.d.ts` và `dist/index.d.ts`, gồm đủ bốn ví dụ. Không sửa trực tiếp dist; có thể áp dụng cùng kiểm tra cho .d.cts vì package hỗ trợ CJS.

### Bốn ví dụ bắt buộc

| Ví dụ | Nội dung và điều kiện chất lượng |
|---|---|
| a — Service nghiệp vụ | Trong catch, dùng isAbortError(error, signal) để bỏ toast cho hủy và rethrow cùng error cho caller. Lỗi khác được báo qua callback toast có kiểu rồi rethrow. |
| b — Search khi gõ | Dùng fetch + AbortController, hủy controller trước khi bắt đầu request mới; mỗi lời gọi giữ controller/signal riêng, bỏ lỗi hủy và không đưa kết quả cũ lên UI. Lỗi thật vẫn tới nhánh báo lỗi. |
| c — Custom reason | Tạo reason cụ thể, gọi abort(reason), dùng signal.throwIfAborted() trong try/catch và isAbortError(error, signal). Thể hiện cùng reason không signal trả false khi không có name AbortError. |
| d — Timeout | Dùng AbortSignal.timeout(), bắt reason khi signal thực sự đã abort, nhận false kể cả truyền signal và gọi callback báo lỗi. Không kiểm ngay trước khi timeout xảy ra. |

File ví dụ theo cách tổ chức `typed-errors.example.ts`: import public API, export các hàm sử dụng được, khai báo đủ kiểu/callback và không tự chạy request khi import. Không có ambient stub hoặc biến không khai báo thay cho mã ví dụ.

Bốn code block JSDoc và mã tương ứng trong file phải cùng nội dung; kiểm đồng bộ có thể chỉ chuẩn hóa comment margin và line ending. Cách chia block/marker cụ thể thuộc plan. Đây là kiểm chứng yêu cầu ví dụ không lỗi thời, không tạo framework docs mới.

## Decisions

- **D-001** (approved; explicit-user) — API thuần boolean, không tiền tố sd và không lớp/helper mới. Giữ đúng API người dùng đã cung cấp.
- **D-002** (approved; explicit-user) — Timeout bị loại trừ trước khi xét trùng reason; không duyệt cause. Timeout cần báo lỗi và cause không được che lỗi bọc.
- **D-003** (approved; authoritative-config) — Mở rộng validator có sẵn để kiểm ví dụ site và đối chiếu bốn snippet mới. test:examples hiện chỉ compile README và examples/.
- **D-004** (approved; explicit-user) — Bổ sung test hành vi và dùng các cổng kiểm tra package/site đang có. Người dùng đã chỉ định test matrix và hai lệnh nghiệm thu.

Người dùng đã duyệt đặc tả như trình bày; D-003 được chấp thuận và cách hiểu A-002 được xác nhận. Các quyết định không đổi phạm vi.

## Assumptions

- **A-001** (validated; non-blocking) — Mốc nguồn đã được xác nhận là main mới nhất sau git fetch origin main: v1.3.0 tại dfe9fa7e05a9fbc86981f7f7c5872a6541bbbffc; nhánh làm việc mới là feat/is-abort-error. Kiểm chứng: Kiểm lại revision, version và diff của các file liên quan trước khi lập plan/thực thi.
- **A-002** (confirmed; non-blocking) — Không có side effect nghĩa là helper không chủ động mutate/I/O/đăng ký listener; đọc name vẫn có thể chạy getter hoặc Proxy trap do caller cung cấp. Kiểm chứng: Rà hợp đồng và test quan sát input; mô tả giới hạn getter trong remarks thay vì cam kết sai.

Không có blocker về yêu cầu nghiệp vụ. Lựa chọn baseline đã được người dùng xác nhận. Không suy diễn việc đọc yêu cầu là phê duyệt spec/plan.

## Architecture gate classification

- Status: `required`; signal: `public-api-contract`.
- Lý do: thêm public API ở hai entry, với các invariant về TimeoutError, unknown input và phạm vi. Sau spec approval cần architecture snapshot gọn theo quy trình trước plan.
- Classification đã kiểm bằng `classifyArchitectureGate`. Gate này không kéo theo thay đổi error hierarchy, dependency hay state ownership.

## Non-goals

- Tạo class AbortError hoặc helper throwIfAborted; thêm tiền tố sd.
- Duyệt cause, sửa hành vi fetchAllByPaging, đổi error-brand/subclass contract.
- Sửa @sdcorejs/angular, read-state/table/select/entity-picker/SdApiService.
- Đổi dependency, lockfile, package version thủ công, build architecture hoặc CI matrix.
- Commit, push, publish, release/tag trong phạm vi chuẩn bị đặc tả.

## Architecture

`src/errors.ts` sở hữu predicate. `src/index.ts` đã có `export * from './errors'`; package exports và tsup đã có root/errors cho ESM, CJS và declarations, nên tái sử dụng cấu trúc này. Predicate chỉ cần quan sát giá trị được truyền vào, không phụ thuộc việc global DOMException hoặc AbortSignal constructor tồn tại để kiểm bằng instanceof.

API site dùng `SymbolSpec` với `kind: 'function'`, `pageId: 'api-errors'`, entry en/vi trong `core-entries.ts`, cùng inventory symbol/import-path. Ví dụ `abort-errors` được đăng ký ở `EXAMPLE_ENTRIES`, dùng trang paging/async hiện hữu.

`scripts/validate-package.mjs` hiện compile README và `examples/` qua tarball, còn `site/tsconfig.json` dùng alias về source. Vì vậy cần đưa `site/src/examples/` vào bước compile của `test:examples` để kiểm cả public declarations đã đóng gói. Tái sử dụng các fixture runtime ESM/CJS, declarations và browser bundle có sẵn.

## Stack profile and technology assumptions

- Track: `general`; stack profile: `node-general`; target-root-kind: `target-project`; confidence: high. Đây là thư viện TypeScript dùng ở Node và browser, không phải ứng dụng framework.
- Evidence: package.json v1.3.0, package-lock.json, tsup.config.ts, vitest.config.ts, site/package.json, site/tsconfig.json.
- Package manager: npm theo lockfile và script hiện có. Môi trường khảo sát: Node v22.14.0.
- Coverage đề xuất: TDD cho predicate và public export regressions; manual review cho nội dung JSDoc/docs, cộng kiểm tự động cho declaration retention và snippet parity.
- CI đã có Node 20/22/24. Test fetch dùng endpoint local có kiểm soát, không phụ thuộc Internet; timeout chờ sự kiện abort với giới hạn test. Test khác realm sử dụng jsdom đã có.
- Không cần dependency/env/migration mới. Kế hoạch sẽ ghi rõ runtime thực sự chạy và các kiểm tra chưa chạy.

## File structure

Đây là inventory phạm vi, chưa phải thứ tự triển khai.

| Đường dẫn | Ý định |
|---|---|
| `src/errors.ts` | EDIT: predicate, // why: và JSDoc 11 mục/bốn ví dụ. |
| `src/errors.spec.ts` | EDIT: ma trận hành vi, input nguy hiểm, fetch, timeout, khác realm và không đọc cause. |
| `scripts/validate-package.mjs` | EDIT: public entry smoke/types, declaration JSDoc, compile site examples và kiểm đồng bộ bốn snippet. |
| `site/src/examples/abort-errors.example.ts` | CREATE: bốn ví dụ a–d. |
| `site/src/content/api/core-entries.ts` | EDIT: entry API en/vi, symbol inventory và canonical import mapping. |
| `site/src/content/api/core-entries.spec.ts` | EDIT: phân biệt helper mới với 20 entry lỗi/options hiện có; kiểm entry, guidance và example relation. |
| `site/src/content/examples.ts` | EDIT: đăng ký abort-errors và liên kết tới isAbortError. |
| `site/src/content/examples.spec.ts` | EDIT: kiểm quan hệ symbol/example mới theo test registry hiện có. |
| `site/src/content/guides/paging.ts` | EDIT: dòng nhắc isAbortError trong đoạn AbortSignal, en/vi. |
| `README.md` | EDIT: ý nghĩa, khi dùng, ví dụ a/c trong phần errors. |
| `.changeset/is-abort-error.md` | CREATE: minor cho @sdcorejs/utils. |
| `src/index.ts`, `package.json`, `tsup.config.ts` | VERIFY: export/build đã đủ, không dự kiến sửa. |
| `dist/**`, `site/dist/**`, `coverage/**` | Output sinh bởi validation; không sửa tay hoặc commit. |

## Acceptance criteria

- **AC-001** (automated; R-002, R-006) — AbortError chuẩn và khác realm được nhận diện. Trả true, không phụ thuộc instanceof DOMException; fetch thật có thể skip có lý do chỉ khi runtime thiếu fetch.
- **AC-002** (automated; R-002, R-006) — Custom reason chỉ được nhận diện theo hợp đồng signal. Chỉ trả true khi signal.aborted === true và error === signal.reason (hoặc đã đủ luật name); undefined trùng reason của signal chưa abort vẫn false.
- **AC-003** (automated; R-002, R-006) — Timeout ưu tiên hơn reason matching. Mọi TimeoutError đọc được đều false kể cả khi error === signal.reason; kiểm timeout bằng sự kiện abort, không dựa vào thời gian chờ phỏng đoán.
- **AC-004** (automated; R-002, R-006) — Không nhận nhầm giá trị khác hoặc cause. Không có signal đủ điều kiện thì false; không đọc cause và không tìm sâu trong chuỗi nguyên nhân.
- **AC-005** (automated; R-003, R-006) — Input bất thường không làm hàm ném. Trả boolean, các truy cập cần thiết gây lỗi dẫn tới false; không thoát exception. Name chỉ được đọc một lần cho mỗi lời gọi.
- **AC-006** (automated; R-003) — Hàm chỉ quan sát. Không sửa error/signal, không gọi abort/throwIfAborted trong helper, không đăng ký listener, tạo timer, I/O, toast hay log; mỗi nhánh có // why:.
- **AC-007** (automated; R-001, R-006) — Hai entry package hoạt động sau đóng gói. Import/require isAbortError từ @sdcorejs/utils và @sdcorejs/utils/errors đều dùng được với đúng chữ ký và hành vi, không so sánh identity giữa hai bundle.
- **AC-008** (manual; R-004) — JSDoc đầy đủ và được giữ trong declarations. dist/errors.d.ts và dist/index.d.ts còn summary, true/false, remarks, params, returns, 4 examples kèm giải thích và see links; exports không làm mất hover docs.
- **AC-009** (automated; R-004, R-005) — Bốn ví dụ là mã có thể sử dụng và cùng nội dung. Các ví dụ có import/kiểu/callback cần thiết, không biến chưa khai báo; service bỏ toast rồi rethrow, search hủy request trước và bỏ kết quả cũ, custom reason có signal, timeout báo lỗi.
- **AC-010** (automated; R-005) — test:examples thực sự kiểm tra ví dụ site. site/src/examples/ được copy vào consumer tạm và compile với public declarations từ tarball, không dùng alias src; lệch mã giữa JSDoc và bốn ví dụ mới bị phát hiện.
- **AC-011** (manual; R-007) — Tài liệu được phát hiện và nhất quán ở hai ngôn ngữ. Có symbol function isAbortError ở api-errors, canonical import ./errors, liên kết ví dụ abort-errors hợp lệ; mô tả cùng luật TimeoutError và custom reason.
- **AC-012** (manual; R-008) — Phạm vi và bản phát hành đúng yêu cầu. Có changeset minor @sdcorejs/utils; không đổi version thủ công, dependencies, lockfile, Angular, error classes hay hành vi fetchAllByPaging.
- **AC-013** (automated; R-006, R-008) — Các cổng kiểm tra đều thành công. Cả hai lệnh exit 0; ghi rõ runtime thực chạy và các phiên bản chỉ được bảo vệ bởi CI, không nhận là đã kiểm local nếu chưa chạy.

Lệnh kiểm tra dự kiến, đều có trong package scripts: `npm test -- src/errors.spec.ts`, `npm run build`, `npm run test:examples`, `npm run validate`, `npm run validate:site`. `validate` đã bao gồm typecheck, coverage, build, publint, attw và test:package; tránh chạy lặp các bước rộng khi không có thay đổi mới.

## Risks & mitigations

- **False positive che timeout:** TimeoutError có ưu tiên loại trừ cao nhất; test reason match và timeout thật.
- **Getter/Proxy ném hoặc có side effect:** bảo vệ mọi truy cập cần thiết, chỉ đọc name một lần, không đọc cause, mô tả đúng giới hạn quan sát.
- **Race trong ví dụ search:** giữ controller của từng request trong closure và kiểm request còn hiệu lực trước cập nhật UI.
- **JSDoc hoặc ví dụ mất đồng bộ:** kiểm declaration comment, compile qua tarball và đối chiếu snippet, bên cạnh review tiếng Anh.
- **Test site giả định mọi export errors đều là class:** giữ coverage 20 entry cũ, thêm trường hợp function mới có example riêng thay vì gán sai typed-errors.
- **Baseline cũ làm mất thay đổi mới trên main:** đã fetch và tạo nhánh từ main v1.3.0; mọi plan/execution phải kiểm lại HEAD và working tree.
- **Mở rộng compile ví dụ làm lộ lỗi cũ:** báo rõ lỗi baseline nếu có; chỉ sửa trong phạm vi cần để các ví dụ được kiểm qua package, không tự nâng dependencies.

## Out of scope (deferred)

- Consumer Angular và UI integrations — xử lý ở đợt sau như yêu cầu.
- Thay đổi release version thực tế, commit/push/publish — cần yêu cầu riêng sau khi triển khai và kiểm tra.
- Chi tiết task order và ánh xạ TASK/EVIDENCE — thuộc plan sau các gate; future gaps ở giai đoạn spec là dự kiến.

## References and self-review

- Nội dung yêu cầu người dùng trong tệp đính kèm, cùng xác nhận “Lấy main mới nhất theo yêu cầu”.
- [MDN AbortSignal.reason](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/reason): reason chứa giá trị JavaScript của việc hủy; khi chưa abort là undefined.
- [MDN AbortSignal.throwIfAborted](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/throwIfAborted): phương thức ném reason nếu signal đã abort.
- [MDN AbortSignal.timeout](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static): reason khi hết hạn là TimeoutError.
- [DOM Standard](https://dom.spec.whatwg.org/#interface-abortsignal): hợp đồng AbortSignal. Các chính sách bỏ toast/log và loại trừ timeout là yêu cầu của helper này.
- Self-review: 8 yêu cầu, 13 tiêu chí nghiệm thu, 3 invariant; không có placeholder hoặc blocking assumption. Public API gate required. `validateDecisionCoverage(..., { stage: 'spec' })` kiểm cấu trúc; task/evidence mappings được giữ là future gaps cho plan.
- Chưa chạy validate/package/site cho thay đổi này vì đây mới là spec. Không có claim implementation hoặc test pass.

## Typed spec context

```yaml
spec_context:
  source: sdcorejs-spec
  decision_coverage:
    schema_version: 1
    revision: 1
    records: [
      {"id":"R-001","type":"requirement","statement":"Thêm đúng API isAbortError(error: unknown, signal?: AbortSignal | null): boolean vào src/errors.ts và xuất qua entry gốc cùng ./errors.","source":"explicit-user","status":"active","owner_repository_id":"github.com/sdcorejs/sdcorejs-utils","owner_module_id":"errors"},
      {"id":"R-002","type":"requirement","statement":"Nhận diện AbortError bằng tên hoặc custom reason trùng === với reason của signal đã abort; TimeoutError luôn bị loại trừ; không duyệt cause.","source":"explicit-user","status":"active","owner_repository_id":"github.com/sdcorejs/sdcorejs-utils","owner_module_id":"errors"},
      {"id":"R-003","type":"requirement","statement":"Hàm không ném lỗi ra ngoài, bảo vệ việc đọc thuộc tính trên input bất thường, không tự thay đổi dữ liệu hoặc trạng thái bên ngoài và mỗi nhánh có // why:.","source":"explicit-user","status":"active","owner_repository_id":"github.com/sdcorejs/sdcorejs-utils","owner_module_id":"errors"},
      {"id":"R-004","type":"requirement","statement":"JSDoc tiếng Anh tự đầy đủ khi hover, đáp ứng đủ 11 mục trong yêu cầu, giữ lại trong dist/errors.d.ts và dist/index.d.ts sau build.","source":"explicit-user","status":"active","owner_repository_id":"github.com/sdcorejs/sdcorejs-utils","owner_module_id":"errors"},
      {"id":"R-005","type":"requirement","statement":"Bốn ví dụ JSDoc a–d có bản thực thi tương ứng trong site/src/examples/abort-errors.example.ts và được npm run test:examples kiểm tra kiểu để ngăn lỗi thời.","source":"explicit-user","status":"active","owner_repository_id":"github.com/sdcorejs/sdcorejs-utils","owner_module_id":"errors"},
      {"id":"R-006","type":"requirement","statement":"Test hành vi trong src/errors.spec.ts cùng kiểm tra package exports bao phủ các trường hợp yêu cầu trên Node 20/22/24 và đối tượng khác realm/jsdom.","source":"explicit-user","status":"active","owner_repository_id":"github.com/sdcorejs/sdcorejs-utils","owner_module_id":"errors"},
      {"id":"R-007","type":"requirement","statement":"README errors, API site en/vi và hướng dẫn paging giải thích cách xử lý hủy request; entry API và ví dụ được đăng ký vào catalog hiện hữu.","source":"explicit-user","status":"active","owner_repository_id":"github.com/sdcorejs/sdcorejs-utils","owner_module_id":"errors"},
      {"id":"R-008","type":"requirement","statement":"Changeset minor cho @sdcorejs/utils; npm run validate và npm run validate:site thành công; giữ nguyên fetchAllByPaging và phạm vi ngoài package.","source":"explicit-user","status":"active","owner_repository_id":"github.com/sdcorejs/sdcorejs-utils","owner_module_id":"errors"},
      {"id":"AC-001","type":"acceptance-criterion","statement":"AbortError chuẩn và khác realm được nhận diện.","behavior":"Dùng DOMException('x', 'AbortError'), Error đổi name, object có name AbortError, reason của AbortSignal.abort(), DOMException của jsdom khác realm và fetch thực bị hủy.","expected_result":"Trả true, không phụ thuộc instanceof DOMException; fetch thật có thể skip có lý do chỉ khi runtime thiếu fetch.","verification_kind":"automated","blocking":true,"requirement_refs":["R-002","R-006"]},
      {"id":"AC-002","type":"acceptance-criterion","statement":"Custom reason chỉ được nhận diện theo hợp đồng signal.","behavior":"Dùng abort(reason) với Error thường, object và primitive; so sánh cùng reason, reason khác, object cùng nội dung nhưng khác identity; kiểm signal null/undefined/chưa abort.","expected_result":"Chỉ trả true khi signal.aborted === true và error === signal.reason (hoặc đã đủ luật name); undefined trùng reason của signal chưa abort vẫn false.","verification_kind":"automated","blocking":true,"requirement_refs":["R-002","R-006"]},
      {"id":"AC-003","type":"acceptance-criterion","statement":"Timeout ưu tiên hơn reason matching.","behavior":"Dùng DOMException TimeoutError, object/Error có name TimeoutError và reason thật của AbortSignal.timeout() cùng signal đã abort.","expected_result":"Mọi TimeoutError đọc được đều false kể cả khi error === signal.reason; kiểm timeout bằng sự kiện abort, không dựa vào thời gian chờ phỏng đoán.","verification_kind":"automated","blocking":true,"requirement_refs":["R-002","R-006"]},
      {"id":"AC-004","type":"acceptance-criterion","statement":"Không nhận nhầm giá trị khác hoặc cause.","behavior":"Truyền null, undefined, chuỗi AbortError, số, boolean, bigint, symbol, object rỗng, các SdcoreUtilsError mặc định, Error bọc cause AbortError và cause getter ném.","expected_result":"Không có signal đủ điều kiện thì false; không đọc cause và không tìm sâu trong chuỗi nguyên nhân.","verification_kind":"automated","blocking":true,"requirement_refs":["R-002","R-006"]},
      {"id":"AC-005","type":"acceptance-criterion","statement":"Input bất thường không làm hàm ném.","behavior":"Truyền Proxy ném, Proxy bị revoke, getter name ném, và đối số signal giả có getter aborted/reason ném khi nhánh custom reason cần đọc.","expected_result":"Trả boolean, các truy cập cần thiết gây lỗi dẫn tới false; không thoát exception. Name chỉ được đọc một lần cho mỗi lời gọi.","verification_kind":"automated","blocking":true,"requirement_refs":["R-003","R-006"]},
      {"id":"AC-006","type":"acceptance-criterion","statement":"Hàm chỉ quan sát.","behavior":"Kiểm input đóng băng, descriptor/trạng thái trước sau và không đọc reason khi aborted chưa true.","expected_result":"Không sửa error/signal, không gọi abort/throwIfAborted trong helper, không đăng ký listener, tạo timer, I/O, toast hay log; mỗi nhánh có // why:.","verification_kind":"automated","blocking":true,"requirement_refs":["R-003"]},
      {"id":"AC-007","type":"acceptance-criterion","statement":"Hai entry package hoạt động sau đóng gói.","behavior":"Mở rộng fixture ESM, CJS, TypeScript và browser bundle hiện có trong scripts/validate-package.mjs.","expected_result":"Import/require isAbortError từ @sdcorejs/utils và @sdcorejs/utils/errors đều dùng được với đúng chữ ký và hành vi, không so sánh identity giữa hai bundle.","verification_kind":"automated","blocking":true,"requirement_refs":["R-001","R-006"]},
      {"id":"AC-008","type":"acceptance-criterion","statement":"JSDoc đầy đủ và được giữ trong declarations.","behavior":"Đối chiếu checklist JSDoc 11 mục và declaration gắn với isAbortError sau build.","expected_result":"dist/errors.d.ts và dist/index.d.ts còn summary, true/false, remarks, params, returns, 4 examples kèm giải thích và see links; exports không làm mất hover docs.","verification_kind":"manual","blocking":true,"requirement_refs":["R-004"]},
      {"id":"AC-009","type":"acceptance-criterion","statement":"Bốn ví dụ là mã có thể sử dụng và cùng nội dung.","behavior":"Đối chiếu bốn code block JSDoc với các ví dụ a–d của abort-errors.example.ts; kiểm kiểu toàn bộ qua tarball.","expected_result":"Các ví dụ có import/kiểu/callback cần thiết, không biến chưa khai báo; service bỏ toast rồi rethrow, search hủy request trước và bỏ kết quả cũ, custom reason có signal, timeout báo lỗi.","verification_kind":"automated","blocking":true,"requirement_refs":["R-004","R-005"]},
      {"id":"AC-010","type":"acceptance-criterion","statement":"test:examples thực sự kiểm tra ví dụ site.","behavior":"Chạy npm run test:examples sau build; kiểm scope của validateExamples và đồng bộ snippet.","expected_result":"site/src/examples/ được copy vào consumer tạm và compile với public declarations từ tarball, không dùng alias src; lệch mã giữa JSDoc và bốn ví dụ mới bị phát hiện.","verification_kind":"automated","blocking":true,"requirement_refs":["R-005"]},
      {"id":"AC-011","type":"acceptance-criterion","statement":"Tài liệu được phát hiện và nhất quán ở hai ngôn ngữ.","behavior":"Đọc README mục errors có ví dụ a/c; kiểm API catalog, example registry, render en/vi và dòng nhắc isAbortError tại guides/paging.ts.","expected_result":"Có symbol function isAbortError ở api-errors, canonical import ./errors, liên kết ví dụ abort-errors hợp lệ; mô tả cùng luật TimeoutError và custom reason.","verification_kind":"manual","blocking":true,"requirement_refs":["R-007"]},
      {"id":"AC-012","type":"acceptance-criterion","statement":"Phạm vi và bản phát hành đúng yêu cầu.","behavior":"Kiểm diff và changeset.","expected_result":"Có changeset minor @sdcorejs/utils; không đổi version thủ công, dependencies, lockfile, Angular, error classes hay hành vi fetchAllByPaging.","verification_kind":"manual","blocking":true,"requirement_refs":["R-008"]},
      {"id":"AC-013","type":"acceptance-criterion","statement":"Các cổng kiểm tra đều thành công.","behavior":"Chạy npm run validate và npm run validate:site; giữ test chạy được trên matrix Node 20/22/24 có sẵn.","expected_result":"Cả hai lệnh exit 0; ghi rõ runtime thực chạy và các phiên bản chỉ được bảo vệ bởi CI, không nhận là đã kiểm local nếu chưa chạy.","verification_kind":"automated","blocking":true,"requirement_refs":["R-006","R-008"]},
      {"id":"A-001","type":"assumption","statement":"Mốc nguồn đã được xác nhận là main mới nhất sau git fetch origin main: v1.3.0 tại dfe9fa7e05a9fbc86981f7f7c5872a6541bbbffc; nhánh làm việc mới là feat/is-abort-error.","source":"explicit","confidence":"high","status":"validated","blocking":false,"evidence_refs":["user-base-choice-2026-10-22","git-fetch-origin-main","package.json","git-rev-parse-HEAD"],"consequence_if_wrong":"Danh sách file hoặc cấu trúc kiểm tra có thể khác khi chuyển sang mốc mới.","validation_method":"Kiểm lại revision, version và diff của các file liên quan trước khi lập plan/thực thi.","owner":"github.com/sdcorejs/sdcorejs-utils","rationale":"Người dùng chọn main mới nhất; fetch không thay đổi remote-tracking revision đã khảo sát.","impacted_refs":["R-001","R-005","R-006"]},
      {"id":"A-002","type":"assumption","statement":"Không có side effect nghĩa là helper không chủ động mutate/I/O/đăng ký listener; đọc name vẫn có thể chạy getter hoặc Proxy trap do caller cung cấp.","source":"inferred","confidence":"high","status":"confirmed","blocking":false,"evidence_refs":["user-request-read-name-in-try-catch"],"consequence_if_wrong":"Không thể đồng thời đọc getter tùy ý và bảo đảm mã getter đó không có side effect.","validation_method":"Rà hợp đồng và test quan sát input; mô tả giới hạn getter trong remarks thay vì cam kết sai.","owner":"github.com/sdcorejs/sdcorejs-utils","rationale":"Yêu cầu đọc name trực tiếp trong try/catch xác định cơ chế quan sát thuộc tính.","impacted_refs":["R-003","R-004"]},
      {"id":"D-001","type":"decision","statement":"API thuần boolean, không tiền tố sd và không lớp/helper mới.","question":"Chọn API nào?","selected_value":"isAbortError(error: unknown, signal?: AbortSignal | null): boolean","source":"explicit-user","status":"approved","blocking":true,"scope":"public-contract","owner_repository_id":"github.com/sdcorejs/sdcorejs-utils","rationale":"Giữ đúng API người dùng đã cung cấp.","supersedes":null,"revisit_condition":null,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-001","AC-007"]},
      {"id":"D-002","type":"decision","statement":"Timeout bị loại trừ trước khi xét trùng reason; không duyệt cause.","question":"Ưu tiên nhận diện thế nào?","selected_value":"TimeoutError false; AbortError name true; aborted === true + reason === error true","source":"explicit-user","status":"approved","blocking":true,"scope":"public-contract","owner_repository_id":"github.com/sdcorejs/sdcorejs-utils","rationale":"Timeout cần báo lỗi và cause không được che lỗi bọc.","supersedes":null,"revisit_condition":null,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-002","AC-002","AC-003","AC-004"]},
      {"id":"D-003","type":"decision","statement":"Mở rộng validator có sẵn để kiểm ví dụ site và đối chiếu bốn snippet mới.","question":"Làm sao ngăn ví dụ JSDoc lỗi thời?","selected_value":"Reuse scripts/validate-package.mjs; compile site examples against tarball; compare four documented snippets","source":"authoritative-config","status":"approved","blocking":false,"scope":"repository","owner_repository_id":"github.com/sdcorejs/sdcorejs-utils","rationale":"test:examples hiện chỉ compile README và examples/.","supersedes":null,"revisit_condition":null,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-004","R-005","AC-008","AC-009","AC-010"]},
      {"id":"D-004","type":"decision","statement":"Bổ sung test hành vi và dùng các cổng kiểm tra package/site đang có.","question":"Cần bằng chứng hoàn thành nào?","selected_value":"Test các trường hợp yêu cầu; npm run validate; npm run validate:site","source":"explicit-user","status":"approved","blocking":true,"scope":"repository","owner_repository_id":"github.com/sdcorejs/sdcorejs-utils","rationale":"Người dùng đã chỉ định test matrix và hai lệnh nghiệm thu.","supersedes":null,"revisit_condition":null,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-006","AC-001","AC-005","AC-007","AC-013"]},
      {"id":"INV-001","type":"invariant","statement":"TimeoutError đọc được luôn false dù bằng signal.reason; không duyệt cause.","protected_refs":["R-002","AC-003","AC-004"]},
      {"id":"INV-002","type":"invariant","statement":"Helper không có exception thoát ra và không chủ động thay đổi trạng thái.","protected_refs":["R-003","AC-005","AC-006"]},
      {"id":"INV-003","type":"invariant","statement":"Không đổi error hierarchy, fetchAllByPaging, Angular, dependencies hoặc version package bằng tay.","protected_refs":["R-008","AC-012"]}
    ]
    history: [{"revision":1,"active":[{"id":"R-001","type":"requirement"},{"id":"R-002","type":"requirement"},{"id":"R-003","type":"requirement"},{"id":"R-004","type":"requirement"},{"id":"R-005","type":"requirement"},{"id":"R-006","type":"requirement"},{"id":"R-007","type":"requirement"},{"id":"R-008","type":"requirement"},{"id":"AC-001","type":"acceptance-criterion"},{"id":"AC-002","type":"acceptance-criterion"},{"id":"AC-003","type":"acceptance-criterion"},{"id":"AC-004","type":"acceptance-criterion"},{"id":"AC-005","type":"acceptance-criterion"},{"id":"AC-006","type":"acceptance-criterion"},{"id":"AC-007","type":"acceptance-criterion"},{"id":"AC-008","type":"acceptance-criterion"},{"id":"AC-009","type":"acceptance-criterion"},{"id":"AC-010","type":"acceptance-criterion"},{"id":"AC-011","type":"acceptance-criterion"},{"id":"AC-012","type":"acceptance-criterion"},{"id":"AC-013","type":"acceptance-criterion"},{"id":"A-001","type":"assumption"},{"id":"A-002","type":"assumption"},{"id":"D-001","type":"decision"},{"id":"D-002","type":"decision"},{"id":"D-003","type":"decision"},{"id":"D-004","type":"decision"},{"id":"INV-001","type":"invariant"},{"id":"INV-002","type":"invariant"},{"id":"INV-003","type":"invariant"}],"tombstones":[]}]
  goal_backward_review:
    schema_version: 1
    mode: sdcorejs-plan:goal-backward
    stage: spec
    future_gaps: ["records.AC-001.task_refs","records.AC-002.task_refs","records.AC-003.task_refs","records.AC-004.task_refs","records.AC-005.task_refs","records.AC-006.task_refs","records.AC-007.task_refs","records.AC-008.task_refs","records.AC-009.task_refs","records.AC-010.task_refs","records.AC-011.task_refs","records.AC-012.task_refs","records.AC-013.task_refs","records.INV-001.evidence_refs","records.INV-002.evidence_refs","records.INV-003.evidence_refs","records.INV-001.task_refs","records.INV-002.task_refs","records.INV-003.task_refs","records.R-001.task_refs","records.R-002.task_refs","records.R-003.task_refs","records.R-004.task_refs","records.R-005.task_refs","records.R-006.task_refs","records.R-007.task_refs","records.R-008.task_refs"]
  architecture_gate:
    valid: true
    required: true
    status: required
    signals: [public-api-contract]
    bypass: null
    rationale: "Adds the public isAbortError contract through the root and errors package entries; the existing error hierarchy and dependencies remain unchanged."
  contract_id: utils-is-abort-error
  requirement_id: UTILS-IS-ABORT-ERROR
  approved_spec_path: .sdcorejs/specs/general/2026-10-22-12-10-is-abort-error.md
  approved_spec_hash: ""
  supersedes: null
  target_root: C:/Users/nghiatt15_onemount/Documents/sdcorejs/sdcorejs-ultis
  target_root_kind: target-project
  owner_repository_id: github.com/sdcorejs/sdcorejs-utils
  owner_repository_role: library
  owner_module_id: errors
  execution_host_repository_id: github.com/sdcorejs/sdcorejs-utils
  track: general
  stack_profile: node-general
  profile_confidence: high
  source_requirement_context: "Yêu cầu đính kèm ngày 2026-10-22 và xác nhận dùng main mới nhất; baseline v1.3.0 dfe9fa7e05a9fbc86981f7f7c5872a6541bbbffc."
  acceptance_criteria_count: 13
  manual_criteria_count: 3
  non_goals: ["Angular consumers", "fetchAllByPaging behavior", "new AbortError class or throwIfAborted helper", "dependencies/env/migrations", "commit/push/publish"]
  risks: ["Timeout false positives", "throwing getters/Proxies", "example drift", "search response races", "site error-entry assumptions"]
  assumptions: [A-001, A-002]
  redaction_applied: false
  approval:
    approved: true
    approved_at: "2026-10-22T05:10:53.000Z"
    approval_source: explicit-user-choice
  change_control:
    revision: 1
    supersedes: null
    change_reason: null
```
