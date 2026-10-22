---
artifact_id: architecture-draft-utils-is-abort-error-r1
artifact_kind: execution-doc
schema_version: 1
change_ref: utils-is-abort-error
source_spec: .sdcorejs/specs/general/2026-10-22-12-10-is-abort-error.md
source_plan: none
commit_policy: with-change
owner: sdcorejs-architecture
owner_repository_id: github.com/sdcorejs/sdcorejs-utils
owner_repository_role: library
owner_module_id: errors
execution_host_repository_id: github.com/sdcorejs/sdcorejs-utils
integration_owner_repository_id: github.com/sdcorejs/sdcorejs-utils
source_revision: dfe9fa7e05a9fbc86981f7f7c5872a6541bbbffc
---

# Architecture - isAbortError - 2026-10-22 12:12

Trạng thái: người dùng đã duyệt bằng lựa chọn 1 ngày 2026-10-22. Snapshot: .sdcorejs/architecture/general/2026-10-22-12-17-is-abort-error.md. Path/hash của context được lấy từ frontmatter snapshot; bản nháp không tự chứa hash của mình.

Spec đã duyệt: [isAbortError](../../specs/general/2026-10-22-12-10-is-abort-error.md), hash `sha256:v1:64bb4135f9473ef41fd2305b4e97d034d0ee2af3d87ca4313cdb4849e0df697d`. Baseline `main` v1.3.0 tại `dfe9fa7e05a9fbc86981f7f7c5872a6541bbbffc`; nhánh `feat/is-abort-error`.

## Quyết định kiến trúc

**Sở hữu và public entry.** `src/errors.ts` sở hữu duy nhất hợp đồng predicate. Entry gốc tái xuất qua barrel sẵn có; `./errors` dùng cấu hình package/tsup hiện hữu. API mới là additive và không cần migration của caller cũ. Không yêu cầu identity của function giống nhau giữa các bundle ESM/CJS.

**Thứ tự nhận diện.** Đọc tên của object khác null trong vùng bắt lỗi, tối đa một lần. TimeoutError đọc được luôn trả false; AbortError trả true. Nếu chưa khớp luật tên, chỉ nhận custom reason khi signal tồn tại, aborted bằng true và error bằng reason theo `===`. Không chặn primitive/null trước luật custom reason, không đọc cause hoặc kiểm bằng constructor/instanceof. Truy cập thuộc tính cần thiết gây lỗi thì trả false. Các trường hợp này giữ nguyên nội dung spec đã duyệt.

**Trạng thái và quan sát input.** Caller sở hữu controller, signal, reason và UI. Helper chỉ quan sát, không tự abort, ném reason, log, toast, tạo timer/listener hoặc mutate. Getter/Proxy có thể chạy mã của caller; helper bảo vệ exception, không cam kết hoàn tác tác động do mã đó. Việc có báo lỗi/rethrow hay bỏ qua thuộc caller và được minh họa trong các ví dụ.

**Hợp đồng tài liệu và ví dụ.** JSDoc đầy đủ nằm ở declaration của predicate; bốn ví dụ a–d có mã tương ứng trong file example. Validator hiện hữu kiểm public exports, giữ comment trong declarations, compile ví dụ site qua tarball và phát hiện lệch snippet. README và API en/vi diễn giải cùng hợp đồng; site dùng registry API/example sẵn có. Chi tiết tổ chức block/marker và thứ tự sửa file thuộc plan.

## Invariants giữ nguyên từ spec

| ID | Điều kiện bắt buộc | Cách chứng minh |
|---|---|---|
| INV-001 | TimeoutError đọc được luôn false, kể cả reason match; không duyệt cause. | Test timeout thật, object/Error timeout, lỗi bọc và getter cause không được đọc. |
| INV-002 | Không có exception thoát khỏi helper và không chủ động thay đổi trạng thái. | Test unknown/primitive/null, Proxy bị revoke/getter ném, signal bất thường, input frozen; review từng nhánh // why:. |
| INV-003 | Giữ error hierarchy, fetchAllByPaging, Angular, dependencies và package version thủ công ngoài phạm vi thay đổi. | Public entry fixtures, soát diff, changeset minor và các cổng validate. |

## Ranh giới và phụ thuộc

- Consumer gọi root/errors → predicate độc lập trong package; không thêm entry, runtime dependency hoặc class/helper.
- Ví dụ/docs → public API được đóng gói. `test:examples` dùng tarball; alias source của site không thay thế bằng chứng này.
- Controller và UI state → caller. Ví dụ search giữ controller riêng cho từng request để kết quả cũ không cập nhật UI.
- Thay đổi thuộc một repository library duy nhất. Không có child repository, Gitlink hoặc tích hợp Angular trong đợt này.
- Frontend architecture và AI-agent profile: không áp dụng; thay đổi site chỉ thêm nội dung API/example theo registry hiện có.

## Nghĩa vụ xác minh

| ID | Bằng chứng cần có khi triển khai | Tiêu chí spec |
|---|---|---|
| VAL-001 | Unit tests cho hai luật true, timeout precedence, non-aborted signal, false cases, no cause, hostile input, fetch thật và jsdom/khác realm. | AC-001–AC-006 |
| VAL-002 | ESM/CJS/types/browser sử dụng được cả hai entry; JSDoc còn trong dist/errors.d.ts và dist/index.d.ts. | AC-007–AC-008 |
| VAL-003 | Bốn snippet khớp mã runnable và compile qua tarball; README/API/registry/paging en/vi đúng hợp đồng. | AC-009–AC-011 |
| VAL-004 | Changeset minor, diff đúng phạm vi, npm run validate và npm run validate:site thành công; ghi runtime thực chạy. | AC-012–AC-013 |

Các bằng chứng trên là nghĩa vụ triển khai, chưa phải kết quả test. TDD cho predicate/public export regressions theo spec đã duyệt. Matrix Node 20/22/24 hiện có được giữ nguyên.

## Review và trạng thái phê duyệt

- Spec parent đã được `verifyApprovedArtifactGraph` xác minh từ file lưu thực tế.
- `classifyArchitectureGate` giữ signal `public-api-contract` và đúng rationale của spec.
- `validateArchitectureContext` kiểm các typed references, ba invariant, bốn nghĩa vụ và public API contract; chưa có lỗi cấu trúc ngoài hai field identity chỉ được tạo sau phê duyệt.
- `approved_architecture_path` và `approved_architecture_hash` để null có chủ đích. Không tạo hash/approved snapshot giả để qua gate.
- Rà soát chỉ đọc riêng sau khi soạn: kiểm phạm vi với approved spec, ánh xạ đầy đủ 13 AC, giữ nguyên ba invariant và xác minh parent hash. Không có phát hiện cần thay đổi nội dung hợp đồng.
- Sau khi người dùng duyệt, tạo immutable architecture snapshot có đúng một parent là spec này, xác minh graph và `validateArchitecturePrePlanHandoff`, rồi lập implementation plan để trình duyệt.
- `requirement_id: R-001` là typed anchor theo schema architecture; `source_requirement_id: UTILS-IS-ABORT-ERROR` giữ group ID của spec.
- Helper resolveArchitectureOwner được dùng theo nhánh chọn integration-owner vì schema không có selector repository-local/library; topology vẫn chỉ có một library. Không suy diễn có thay đổi cross-repository.

## Typed architecture context

```yaml
architecture_context:
  schema_version: 1
  source: "sdcorejs-architecture"
  contract_id: "utils-is-abort-error"
  requirement_id: "R-001"
  source_requirement_id: "UTILS-IS-ABORT-ERROR"
  approved_spec_reference: {"repository_id":"github.com/sdcorejs/sdcorejs-utils","artifact_id":"spec-utils-is-abort-error-r1","artifact_kind":"spec","revision":"dfe9fa7e05a9fbc86981f7f7c5872a6541bbbffc","approval_hash":"sha256:v1:64bb4135f9473ef41fd2305b4e97d034d0ee2af3d87ca4313cdb4849e0df697d"}
  approved_architecture_path: null
  approved_architecture_hash: null
  owner_repository_id: "github.com/sdcorejs/sdcorejs-utils"
  owner_module_id: "errors"
  execution_host_repository_id: "github.com/sdcorejs/sdcorejs-utils"
  integration_owner_repository_id: "github.com/sdcorejs/sdcorejs-utils"
  trigger: {"required":true,"signals":["public-api-contract"],"rationale":"Adds the public isAbortError contract through the root and errors package entries; the existing error hierarchy and dependencies remain unchanged."}
  invariants: [{"id":"INV-001","statement":"TimeoutError đọc được luôn false dù bằng signal.reason; không duyệt cause.","scope":"public cancellation classification","owner":"github.com/sdcorejs/sdcorejs-utils","rationale":"Tránh che lỗi timeout hoặc nhận nhầm lỗi bọc.","verification_method":"Unit tests cho TimeoutError và timeout thật; cause getter phải không được đọc.","requirement_refs":["R-002","R-006"],"decision_refs":["D-002","D-004"]},{"id":"INV-002","statement":"Helper không có exception thoát ra và không chủ động thay đổi trạng thái.","scope":"unknown input observation","owner":"github.com/sdcorejs/sdcorejs-utils","rationale":"Predicate dùng trong catch phải an toàn trước primitive, null, Proxy, getter lỗi và signal bất thường.","verification_method":"Unit tests throwing/revoked Proxy và getters; kiểm input frozen, không đọc reason trước aborted; review // why: và giới hạn getter.","requirement_refs":["R-001","R-003","R-006"],"decision_refs":["D-001","D-004"]},{"id":"INV-003","statement":"Không đổi error hierarchy, fetchAllByPaging, Angular, dependencies hoặc version package bằng tay.","scope":"package compatibility and delivery boundaries","owner":"github.com/sdcorejs/sdcorejs-utils","rationale":"API additive dùng entry/build hiện hữu; consumer integration nằm ngoài đợt này.","verification_method":"Public ESM/CJS/type/browser fixtures, soát diff và minor changeset, chạy validate/package/site theo spec.","requirement_refs":["R-001","R-004","R-005","R-007","R-008"],"decision_refs":["D-001","D-003","D-004"]}]
  boundaries: [{"id":"BOUNDARY-001","statement":"src/errors.ts sở hữu predicate; root tái xuất qua barrel đã có. Helper không gọi network, timer hoặc consumer UI.","invariant_refs":["INV-001","INV-002","INV-003"]},{"id":"BOUNDARY-002","statement":"JSDoc là hợp đồng hover; file ví dụ có mã a–d tương ứng; docs site tái dùng registry và validator hiện hữu.","invariant_refs":["INV-003"]}]
  dependency_directions: [{"from":"consumer -> @sdcorejs/utils or @sdcorejs/utils/errors","to":"src/errors.ts:isAbortError","rationale":"Public API đi qua hai entry hiện hữu, không thêm entry hay dependency.","invariant_refs":["INV-003"]},{"from":"site documentation examples and package validation","to":"packed @sdcorejs/utils public declarations","rationale":"test:examples phải kiểm package được phân phối; alias về src không đủ chứng minh declaration.","invariant_refs":["INV-003"]}]
  data_state_owners: [{"subject":"AbortController, AbortSignal, reason, request lifecycle, toast/log/UI state","owner_repository_id":"github.com/sdcorejs/sdcorejs-utils","owner":"caller application; no state owned by isAbortError","invariant_refs":["INV-002","INV-003"]}]
  public_contracts: [{"id":"PC-001","kind":"api","owner":"github.com/sdcorejs/sdcorejs-utils","signature":"export const isAbortError = (error: unknown, signal?: AbortSignal | null): boolean","entry_points":["@sdcorejs/utils","@sdcorejs/utils/errors"],"statement":"Non-null object name AbortError or aborted signal + strict reason equality yields true; readable TimeoutError and failed necessary property access yield false; no cause traversal.","compatibility":"Additive boolean API; retains existing entry layout, error classes and paging behavior; no constructor/realm dependency.","migration":"No existing caller migration; new consumers opt in and pass the request signal for custom reasons. Minor changeset only.","invariant_refs":["INV-001","INV-002","INV-003"]}]
  security_trust_boundaries: [{"id":"TRUST-001","statement":"error là giá trị do caller cung cấp; kiểm tên không chứng minh nguồn gốc hoặc quyền truy cập. Getter/Proxy trap có thể chạy mã caller; helper bắt lỗi nhưng không hoàn tác side effect của mã đó.","invariant_refs":["INV-002"]}]
  cross_repository_integration: []
  adopted_decision_refs: ["D-001","D-002","D-003","D-004"]
  deferred_decision_refs: []
  assumption_refs: ["A-001","A-002"]
  validation_obligations: [{"id":"VAL-001","expected_proof":"Unit tests cho AbortError, custom reason ===, signal chưa abort, TimeoutError, không đọc cause, input bất thường, fetch thật và jsdom/khác realm.","owner":"github.com/sdcorejs/sdcorejs-utils","invariant_refs":["INV-001","INV-002"],"acceptance_criterion_refs":["AC-001","AC-002","AC-003","AC-004","AC-005","AC-006"]},{"id":"VAL-002","expected_proof":"Hai package entry dùng được qua ESM/CJS/types/browser; JSDoc isAbortError còn nguyên trong dist/errors.d.ts và dist/index.d.ts.","owner":"github.com/sdcorejs/sdcorejs-utils","invariant_refs":["INV-002","INV-003"],"acceptance_criterion_refs":["AC-007","AC-008"]},{"id":"VAL-003","expected_proof":"Bốn snippet có cùng mã và được test:examples compile từ tarball; README, registry API và ví dụ en/vi, dòng paging đúng hợp đồng.","owner":"github.com/sdcorejs/sdcorejs-utils","invariant_refs":["INV-003"],"acceptance_criterion_refs":["AC-009","AC-010","AC-011"]},{"id":"VAL-004","expected_proof":"Diff đúng phạm vi, changeset minor, npm run validate và npm run validate:site exit 0; ghi runtime đã chạy thực tế.","owner":"github.com/sdcorejs/sdcorejs-utils","invariant_refs":["INV-003"],"acceptance_criterion_refs":["AC-012","AC-013"]}]
  profile_sections: {"frontend_architecture_ref":null,"agent_architecture_ref":null}
  change_control: {"revision":1,"supersedes":null}
```
