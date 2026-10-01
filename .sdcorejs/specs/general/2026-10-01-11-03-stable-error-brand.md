---
artifact_id: spec-utils-stable-error-brand-r1
artifact_kind: spec
schema_version: 1
change_ref: utils-stable-error-brand
source_spec: none
source_plan: none
commit_policy: with-change
owner: sdcorejs-spec
name: stable-error-brand
description: Error classes carry a static errorName string brand so cross-entry instanceof and error.name survive app bundling; subclasses must declare errorName; patch 1.2.5.
contract_id: utils-stable-error-brand
requirement_id: UTILS-ERROR-BRAND
owner_repository_id: github.com/sdcorejs/sdcorejs-utils
owner_repository_role: library
owner_module_id: errors
repository_relative_path: .sdcorejs/specs/general/2026-10-01-11-03-stable-error-brand.md
source_revision: bb3778003bae0b382228ad71c17b6310b7ae4cde
parent_repository_id: null
parent_references: []
approved_at: '2026-10-01T04:06:58.551Z'
approved_by: nghiatt15_onemount
approval_source: explicit-user-choice
track: general
target_root_kind: target-project
stack_profile: node-general
profile_confidence: high
sourceDraftPath: .sdcorejs/docs/general/2026-10-01-11-03-stable-error-brand-spec.md
acceptance_criteria_count: 8
manual_criteria_count: 1
redaction_applied: false
supersedes: null
change_control:
  revision: 1
  supersedes: null
  change_reason: null
approval_hash: sha256:v1:fd07274a06d1c36e6b8be9c7a290e69f4bdee44a48df1332fabaef5afd6336c2
approved_spec_hash: sha256:v1:fd07274a06d1c36e6b8be9c7a290e69f4bdee44a48df1332fabaef5afd6336c2
---

# Brand ổn định cho error class của @sdcorejs/utils - Approved Spec

> Snapshot of what the user approved at the `sdcorejs-spec` gate. Do not edit by hand; re-author through `sdcorejs-spec` if the contract changes.

## Approved contract

# Spec - Brand ổn định cho error class của @sdcorejs/utils - 2026-10-01 11:03

```yaml
spec_context:
  source: sdcorejs-spec
  decision_coverage:
    {"schema_version": 1, "revision": 1, "records": [
      {"id":"R-001","type":"requirement","statement":"Every error class exported from src/errors.ts declares its own static readonly errorName equal to its export name, and instances expose name === errorName.","source":"explicit-user","status":"active","owner_repository_id":"github.com/sdcorejs/sdcorejs-utils","owner_module_id":"errors"},
      {"id":"R-002","type":"requirement","statement":"instanceof between a utils error thrown from one public entry (fns) and the same or a parent class imported from another entry (errors, root) holds in applications bundled by esbuild with minify on and off.","source":"explicit-user","status":"active","owner_repository_id":"github.com/sdcorejs/sdcorejs-utils","owner_module_id":"errors"},
      {"id":"R-003","type":"requirement","statement":"Constructing a subclass of SdcoreUtilsError that does not declare its own static errorName throws TypeError with message '<ClassName> must declare its own static errorName'.","source":"explicit-user","status":"active","owner_repository_id":"github.com/sdcorejs/sdcorejs-utils","owner_module_id":"errors"},
      {"id":"R-004","type":"requirement","statement":"Package validation (validate-package --browser, part of npm run validate) fails when cross-entry instanceof breaks in an esbuild bundle, with minify on and off.","source":"explicit-user","status":"active","owner_repository_id":"github.com/sdcorejs/sdcorejs-utils","owner_module_id":"scripts"},
      {"id":"R-005","type":"requirement","statement":"The change ships as patch 1.2.5 through a changeset that states the subclass requirement and its migration step; README and the docs site describe errorName.","source":"explicit-user","status":"active","owner_repository_id":"github.com/sdcorejs/sdcorejs-utils","owner_module_id":null},
      {"id":"R-006","type":"requirement","statement":"Existing error behaviour is preserved: messages, cause, own fields (path, key, protocol, valueType) and same-entry instanceof through the native prototype chain.","source":"authoritative-contract","status":"active","owner_repository_id":"github.com/sdcorejs/sdcorejs-utils","owner_module_id":"errors"},
      {"id":"AC-001","type":"acceptance-criterion","statement":"Every exported error class has an own, unique errorName equal to its export name.","behavior":"A unit test iterates every class exported by src/errors.ts.","expected_result":"Object.hasOwn(cls, 'errorName') is true, cls.errorName equals the export name, and all values are unique.","verification_kind":"automated","blocking":true,"requirement_refs":["R-001"]},
      {"id":"AC-002","type":"acceptance-criterion","statement":"Instances expose a stable name and keep their message and fields.","behavior":"A unit test constructs each built-in error with representative arguments.","expected_result":"error.name equals the class errorName; message, cause and own fields equal the values produced before the change.","verification_kind":"automated","blocking":true,"requirement_refs":["R-001","R-006"]},
      {"id":"AC-003","type":"acceptance-criterion","statement":"Brand-based instanceof does not depend on constructor.name.","behavior":"A unit test checks a foreign object that carries the global error-brand symbol with errorName values, and a class copy whose constructor name differs.","expected_result":"instanceof is true for the class and its parents named in the brand and false for unrelated classes.","verification_kind":"automated","blocking":true,"requirement_refs":["R-002","R-006"]},
      {"id":"AC-004","type":"acceptance-criterion","statement":"Bundled cross-entry instanceof holds with minify on and off.","behavior":"validate-package --browser bundles an entry with esbuild (minify false and true) that catches UnsafePropertyPathError thrown by fns Utilities.getNestedValue({}, 'a b').","expected_result":"The caught error is instanceof errors.UnsafePropertyPathError, errors.SecurityError, errors.SdcoreUtilsError and root.UnsafePropertyPathError, and its name is 'UnsafePropertyPathError', in both bundles.","verification_kind":"automated","blocking":true,"requirement_refs":["R-002","R-004"]},
      {"id":"AC-005","type":"acceptance-criterion","statement":"A subclass without its own errorName cannot be constructed.","behavior":"A unit test declares class Custom extends ValidationError {} and constructs it; another subclass declares static readonly errorName = 'Custom2'.","expected_result":"new Custom('x') throws TypeError 'Custom must declare its own static errorName'; new Custom2('x') succeeds, is instanceof ValidationError and has name 'Custom2'.","verification_kind":"automated","blocking":true,"requirement_refs":["R-003"]},
      {"id":"AC-006","type":"acceptance-criterion","statement":"Repository validation stays green.","behavior":"Run npm run validate (typecheck, test:coverage thresholds, build, publint, attw, test:package) and the docs site validation.","expected_result":"Every step exits 0.","verification_kind":"automated","blocking":true,"requirement_refs":["R-004","R-006"]},
      {"id":"AC-007","type":"acceptance-criterion","statement":"Release notes and docs describe the change.","behavior":"Read the changeset, README errors section and the docs site SdcoreUtilsError entry.","expected_result":"The changeset is a patch for @sdcorejs/utils that states the subclass requirement and migration; README and docs site document errorName.","verification_kind":"manual","blocking":true,"requirement_refs":["R-005"]},
      {"id":"AC-008","type":"acceptance-criterion","statement":"Downstream Core gains working cross-entry checks after upgrading.","behavior":"@sd-angular/core upgrades to @sdcorejs/utils 1.2.5 and bundles FilePickerCancelledError checks.","expected_result":"Cancel from the file picker no longer surfaces as an error in a bundled portal.","verification_kind":"deferred","blocking":true,"requirement_refs":["R-002"]},
      {"id":"A-001","type":"assumption","statement":"tsup output keeps static class fields as own properties of each constructor in both ESM and CJS builds.","source":"inferred","confidence":"high","status":"proposed","blocking":false,"evidence_refs":["poc-string-brand-esbuild"],"consequence_if_wrong":"Own-errorName detection would fail and every construction would throw.","validation_method":"AC-001, AC-005 and the CJS/ESM runtime checks in validate-package.","owner":"sdcorejs-utils maintainer","rationale":"Static fields compile to defineProperty on the constructor in ES2022 output and to helper calls in lower targets.","impacted_refs":["R-001","R-003"]},
      {"id":"A-002","type":"assumption","statement":"Few external consumers subclass utils error classes, so the strict subclass requirement is acceptable in a patch.","source":"explicit","confidence":"medium","status":"confirmed","blocking":false,"evidence_refs":["user-statement-2026-10-01","no-subclass-in-core-portal-sdcorejs-angular"],"consequence_if_wrong":"A consumer subclass would start throwing after a patch upgrade.","validation_method":"Changeset and README state the requirement and migration step.","owner":"nghiatt15_onemount","rationale":"User accepted the semver deviation on 2026-10-01.","impacted_refs":["R-003","R-005"]},
      {"id":"D-001","type":"decision","statement":"The stable brand is a public static readonly errorName on every error class, used for name, brands and Symbol.hasInstance.","question":"Which stable identifier replaces constructor.name?","selected_value":"static readonly errorName (string literal)","source":"explicit-user","status":"approved","blocking":true,"scope":"public-contract","owner_repository_id":"github.com/sdcorejs/sdcorejs-utils","rationale":"String literals survive bundler renaming and minification; 'name' cannot be redeclared as a static field in TypeScript.","supersedes":null,"revisit_condition":null,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-001","R-002","AC-001","AC-002","AC-003","AC-004"]},
      {"id":"D-002","type":"decision","statement":"A subclass without its own errorName throws TypeError during construction.","question":"What happens when a subclass does not declare errorName?","selected_value":"throw TypeError '<ClassName> must declare its own static errorName'","source":"explicit-user","status":"approved","blocking":true,"scope":"public-contract","owner_repository_id":"github.com/sdcorejs/sdcorejs-utils","rationale":"User chose strict enforcement so every brand is explicit.","supersedes":null,"revisit_condition":null,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-003","AC-005"]},
      {"id":"D-003","type":"decision","statement":"Release as patch 1.2.5 despite the subclass breaking change.","question":"Which version carries the change?","selected_value":"1.2.5 (patch changeset with explicit breaking note)","source":"explicit-user","status":"approved","blocking":true,"scope":"repository","owner_repository_id":"github.com/sdcorejs/sdcorejs-utils","rationale":"Few users; the fix is needed quickly by @sd-angular/core.","supersedes":null,"revisit_condition":null,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-005","AC-007"]},
      {"id":"INV-001","type":"invariant","statement":"Same-entry instanceof keeps using the native prototype check first, and messages, cause and own fields are unchanged.","protected_refs":["R-006","AC-002","AC-003"]},
      {"id":"INV-002","type":"invariant","statement":"Brand checks never read constructor.name or this.name; they use errorName only.","protected_refs":["R-002","AC-003","AC-004"]}
    ], "history": [{"revision":1,"active":[{"id":"R-001","type":"requirement"},{"id":"R-002","type":"requirement"},{"id":"R-003","type":"requirement"},{"id":"R-004","type":"requirement"},{"id":"R-005","type":"requirement"},{"id":"R-006","type":"requirement"},{"id":"AC-001","type":"acceptance-criterion"},{"id":"AC-002","type":"acceptance-criterion"},{"id":"AC-003","type":"acceptance-criterion"},{"id":"AC-004","type":"acceptance-criterion"},{"id":"AC-005","type":"acceptance-criterion"},{"id":"AC-006","type":"acceptance-criterion"},{"id":"AC-007","type":"acceptance-criterion"},{"id":"AC-008","type":"acceptance-criterion"},{"id":"A-001","type":"assumption"},{"id":"A-002","type":"assumption"},{"id":"D-001","type":"decision"},{"id":"D-002","type":"decision"},{"id":"D-003","type":"decision"},{"id":"INV-001","type":"invariant"},{"id":"INV-002","type":"invariant"}],"tombstones":[]}]}
  goal_backward_review:
    schema_version: 1
    mode: "sdcorejs-plan:goal-backward"
    stage: spec
    future_gaps: [R-001..R-006 task_refs, AC-001..AC-008 task_refs, INV-001..INV-002 task_refs + evidence_refs]
  architecture_gate:
    valid: true
    required: true
    status: required
    signals: [public-api-contract]
    bypass: null
    rationale: "Exported error classes gain a public static errorName and a new subclassing contract: a subclass without its own errorName throws on construction."
  contract_id: utils-stable-error-brand
  requirement_id: UTILS-ERROR-BRAND
  approved_spec_path: ""
  approved_spec_hash: ""
  supersedes: null
  target_root: C:/Users/nghiatt15_onemount/Documents/sdcorejs/sdcorejs-ultis
  target_root_kind: target-project
  owner_repository_id: github.com/sdcorejs/sdcorejs-utils
  owner_repository_role: library
  owner_module_id: errors
  execution_host_repository_id: gitlab.id.vin/mag/sales-platform/portals/portal-ops
  track: general
  stack_profile: node-general
  profile_confidence: high
  source_requirement_context: "sdcorejs-brainstorming 2026-10-01: user chose scope 1+2+4, strict subclass enforcement (option 3) and patch release 1.2.5; root cause found in NSP-5745 review R5."
  acceptance_criteria_count: 8
  manual_criteria_count: 1
  non_goals:
    - Bật tsup splitting:true để gộp class về một bản.
    - Đổi message, cause hoặc field riêng của các lỗi.
    - Sửa code ở consumer (@sd-angular/core, @sdcorejs/angular).
    - Tự publish npm (do workflow publish của maintainer).
  risks:
    - Lớp con của consumer thiếu errorName sẽ ném lỗi sau khi nâng bản patch.
    - Static field không còn là own property ở một target build nào đó.
    - Sót class khi khai báo errorName.
  assumptions:
    - A-001 tsup giữ static field là own property (proposed, non-blocking).
    - A-002 ít consumer kế thừa error class (confirmed bởi user).
  redaction_applied: false
  approval:
    approved: false
    approved_at: null
    approval_source: explicit-user-choice
  change_control:
    revision: 1
    supersedes: null
    change_reason: null
```

## Problem & Goals

`@sdcorejs/utils` đóng gói từng entry riêng (`tsup` với `splitting: false`), nên `dist/fns.js`, `dist/errors.js` và `dist/index.js` mỗi file có một bản riêng của mọi error class. Để `instanceof` vẫn đúng giữa các entry, `SdcoreUtilsError` gắn brand `constructor.name` lên instance, và `Symbol.hasInstance` so khớp bằng `this.name`.

Khi app bundle bằng esbuild (Angular CLI không bật `keepNames`), các module bị gộp vào một scope. Biến class trùng tên bị đổi thành `UnsafePropertyPathError2`, và khi minify thì thành tên ngắn như `W`/`Re`. Brand và tên đem so không còn khớp, nên `instanceof` trả `false`, kể cả khi không minify. `error.name` trong log production cũng chỉ còn là tên ngắn.

Repro bằng esbuild: `instanceofOk: false` khi minify tắt và khi minify bật. Bản mô phỏng dùng brand chuỗi: `true` ở cả hai.

Hậu quả: `@sd-angular/core` 19.0.41 kiểm `FilePickerCancelledError` qua `@sdcorejs/utils/errors` sẽ không bắt được lỗi trong portal đã bundle. Ở NSP-5745, resolver của table cũng phải né cơ chế này.

Mục tiêu:
- `instanceof` giữa các entry luôn đúng trong app đã bundle.
- `error.name` ổn định.
- Có test chặn tái diễn.
- Phát hành bản patch `1.2.5`.

## Requirements

- R-001 — Mọi error class export từ `src/errors.ts` khai báo `static readonly errorName` riêng, bằng đúng tên export; instance có `name === errorName`. Nguồn: explicit-user. Trạng thái: active. Owner: sdcorejs-utils / errors.
- R-002 — `instanceof` giữa lỗi ném từ một entry (`fns`) và class cùng tên hoặc lớp cha lấy từ entry khác (`errors`, root) luôn đúng trong app bundle bằng esbuild, minify tắt và bật. Nguồn: explicit-user. Trạng thái: active.
- R-003 — Tạo instance của lớp con `SdcoreUtilsError` mà lớp đó không khai báo `errorName` riêng thì ném `TypeError` với message `<ClassName> must declare its own static errorName`. Nguồn: explicit-user. Trạng thái: active.
- R-004 — Bước package validation (`validate-package --browser`, nằm trong `npm run validate`) phải fail nếu `instanceof` giữa các entry hỏng trong bundle esbuild, với cả minify tắt và bật. Nguồn: explicit-user. Trạng thái: active. Owner: scripts.
- R-005 — Phát hành patch `1.2.5` qua changeset. Changeset nêu rõ yêu cầu với lớp con và cách migrate; README và docs site mô tả `errorName`. Nguồn: explicit-user. Trạng thái: active.
- R-006 — Giữ nguyên hành vi hiện có: message, `cause`, các field riêng (`path`, `key`, `protocol`, `valueType`), và `instanceof` trong cùng entry qua prototype chain native. Nguồn: authoritative-contract. Trạng thái: active.

## Decisions

- D-001 — Dùng định danh ổn định nào thay cho `constructor.name`? Chọn: `static readonly errorName`, là chuỗi literal, public API bổ sung có JSDoc. Dùng cho `name`, brand và `Symbol.hasInstance`. Nguồn: explicit-user (tên `errorName` do mình đề xuất, xác nhận tại gate này). Trạng thái: approved, blocking, scope public-contract. Lý do: chuỗi literal không bị bundler đổi; TypeScript không cho khai báo lại `static name`.
- D-002 — Lớp con không khai báo `errorName` thì sao? Chọn: constructor `SdcoreUtilsError` ném `TypeError('<ClassName> must declare its own static errorName')`. Không dùng `SdcoreUtilsError` để ném, tránh gọi đệ quy. Nguồn: explicit-user (option 3). Trạng thái: approved, blocking, scope public-contract.
- D-003 — Version nào mang thay đổi? Chọn: patch `1.2.5`, changeset ghi rõ breaking với lớp con. Nguồn: explicit-user, chấp nhận lệch semver vì thư viện còn ít người dùng. Trạng thái: approved, blocking, scope repository.

## Assumptions

- A-001 — Output của tsup (ESM và CJS) giữ static field là own property của constructor. Nguồn: inferred, độ tin cao, proposed, non-blocking. Nếu sai: không phát hiện được `errorName` riêng và mọi lần tạo lỗi đều ném. Cách kiểm: AC-001, AC-005 và các bước runtime ESM/CJS của `validate-package`. Owner: maintainer.
- A-002 — Ít consumer bên ngoài kế thừa error class của utils, nên chặn cứng trong bản patch là chấp nhận được. Nguồn: explicit (user, 2026-10-01), confirmed, non-blocking. Bằng chứng: Core, portal và `sdcorejs-angular` không có lớp con nào. Nếu sai: lớp con của consumer bắt đầu ném lỗi sau khi nâng bản patch. Giảm thiểu: changeset và README nêu rõ yêu cầu và cách migrate.

## Architecture gate classification

- Status: required
- Signals: `public-api-contract`
- Rationale: các error class được export có thêm `static errorName` public và hợp đồng kế thừa mới (lớp con thiếu `errorName` thì ném lỗi khi khởi tạo). Cần artifact kiến trúc ghi lại hợp đồng public và invariant trước khi lên plan.

## Non-goals

- Không bật `tsup` `splitting: true` hay đổi cấu trúc `dist`.
- Không đổi message, `cause` hay field riêng của lỗi.
- Không sửa code consumer (`@sd-angular/core`, `@sdcorejs/angular`); họ nâng version sau.
- Không tự publish npm và không tự chạy `changeset version` hay đổi `package.json` version. Workflow publish của repo làm việc này sau khi merge.

## Architecture

- `src/errors.ts`:
  - `SdcoreUtilsError` có `static readonly errorName: string = 'SdcoreUtilsError'`.
  - Constructor kiểm `Object.hasOwn(new.target, 'errorName')`; nếu không có thì ném `TypeError`.
  - `this.name = new.target.errorName`.
  - Brand: đi ngược chuỗi constructor, lấy `errorName` của từng lớp có `errorName` riêng (dừng ở `Error`).
  - `Symbol.hasInstance` giữ check prototype native trước, sau đó so `brands.includes(this.errorName)`.
  - Mọi lớp con built-in khai báo `static override readonly errorName = '<ExportName>'`.
- `ERROR_BRANDS` vẫn là `Symbol.for('@sdcorejs/utils/error-brands')`, nên các bản class trong ESM/CJS và trong từng entry vẫn chia sẻ được brand.
- Brand cũ (lưu `constructor.name`) bị thay hoàn toàn. Instance tạo từ bản utils cũ sẽ không khớp brand với class mới, trừ khi tên gốc không bị đổi. Trường hợp trộn hai version utils trong một app nằm ngoài phạm vi.

## Stack profile and technology assumptions

- Track: general
- Stack profile: node-general
- Profile evidence: `package.json` (`tsup`, `vitest`, `@changesets/cli`), `tsup.config.ts`, CI `.github/workflows/ci.yml` chạy `npm run validate`.
- Technology assumptions: npm (`package-lock.json`), Node trên CI; `scripts/validate-package.mjs` đã import `esbuild`.

## File structure

- `src/errors.ts` — sửa.
- `src/errors.spec.ts` — tạo mới (AC-001, AC-002, AC-003, AC-005).
- `scripts/validate-package.mjs` — sửa bước browser bundle (AC-004).
- `.changeset/<tên>.md` — tạo mới (patch, ghi chú breaking với lớp con).
- `README.md` — sửa mục errors.
- `site/src/content/api/core-entries.ts` (và spec đi kèm nếu cần) — sửa entry `SdcoreUtilsError`.

## Acceptance criteria

- AC-001 (automated) — Mọi class export từ `src/errors.ts` có `errorName` riêng, bằng tên export, không trùng nhau.
- AC-002 (automated) — Instance có `name === errorName`; message, `cause` và field riêng giữ nguyên.
- AC-003 (automated) — `instanceof` theo brand không phụ thuộc `constructor.name`: object lạ mang symbol brand chứa `errorName`, hoặc bản class có tên constructor khác, vẫn khớp với class và lớp cha có trong brand; không khớp với class không liên quan.
- AC-004 (automated) — `validate-package --browser` bundle bằng esbuild (minify false và true) một entry bắt lỗi do `fns` `Utilities.getNestedValue({}, 'a b')` ném ra. Lỗi phải là `instanceof` `errors.UnsafePropertyPathError`, `errors.SecurityError`, `errors.SdcoreUtilsError` và `root.UnsafePropertyPathError`, và có `name === 'UnsafePropertyPathError'`.
- AC-005 (automated) — `class Custom extends ValidationError {}`: `new Custom('x')` ném `TypeError('Custom must declare its own static errorName')`. Lớp con có `static readonly errorName = 'Custom2'` thì tạo được, là `instanceof ValidationError`, và có `name === 'Custom2'`.
- AC-006 (automated) — `npm run validate` (typecheck, test:coverage với ngưỡng hiện có, build, publint, attw, test:package) và phần validate của docs site đều exit 0.
- AC-007 (manual) — Changeset là patch cho `@sdcorejs/utils`, nêu rõ yêu cầu với lớp con và cách migrate; README và docs site mô tả `errorName`.
- AC-008 (deferred) — `@sd-angular/core` nâng lên utils 1.2.5; trong portal đã bundle, huỷ chọn file không còn hiện thành lỗi.

## Risks & mitigations

- **Risk:** lớp con của consumer thiếu `errorName` sẽ ném lỗi sau khi nâng bản patch (lệch semver). -> **Mitigation:** user đã chấp nhận (D-003, A-002); changeset và README hướng dẫn thêm một dòng `static readonly errorName`.
- **Risk:** static field không phải own property ở target build CJS. -> **Mitigation:** AC-001, AC-005 và bước runtime CJS/ESM có sẵn của `validate-package`.
- **Risk:** sót class khi khai báo `errorName`. -> **Mitigation:** test AC-001 duyệt mọi export, và constructor tự ném lỗi nếu thiếu (D-002).
- **Risk:** test bundle chạy chậm hoặc phụ thuộc mạng. -> **Mitigation:** esbuild đã là devDependency và bundle chạy offline trong thư mục consumer tạm có sẵn.

## Out of scope (deferred)

- `tsup` `splitting: true` (một bản class duy nhất cho ESM) — hoãn tới khi cần giảm kích thước bundle hoặc bỏ cơ chế brand.
- Nâng utils trong Core và `sdcorejs-angular` (AC-008) — hoãn tới khi 1.2.5 được publish.

## Decisions captured during review

- (approved as drafted)

## Skill provenance

sdcorejs-spec (approved on attempt 1 / 3)
