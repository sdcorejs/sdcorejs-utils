---
artifact_id: architecture-draft-utils-stable-error-brand-r1
artifact_kind: execution-doc
change_ref: utils-stable-error-brand
source_spec: .sdcorejs/specs/general/2026-10-01-11-03-stable-error-brand.md
source_plan: none
commit_policy: with-change
owner: sdcorejs-architecture
---

# Architecture - Brand ổn định cho error class của @sdcorejs/utils - 2026-10-01 11:20

Approved spec: `.sdcorejs/specs/general/2026-10-01-11-03-stable-error-brand.md` (`sha256:v1:fd07274a06d1c36e6b8be9c7a290e69f4bdee44a48df1332fabaef5afd6336c2`).

Gate: required, signal `public-api-contract`. Owner và integration owner: `github.com/sdcorejs/sdcorejs-utils`. Execution host: portal-ops.

## Hợp đồng public được chốt

- **PC-001 — `errorName`:** `SdcoreUtilsError` và mọi class con được export có `static readonly errorName: string`, giá trị bằng đúng tên export. Instance có `name === errorName`. Với caller đây là thay đổi bổ sung, không cần migrate.
- **PC-002 — kế thừa:** class kế thừa bất kỳ error nào của utils phải tự khai báo `static readonly errorName`. Nếu không, khởi tạo sẽ ném `TypeError("<ClassName> must declare its own static errorName")`. Đây là breaking với lớp con của consumer, phát hành trong patch 1.2.5 theo D-003. Cách migrate: thêm một dòng `static override readonly errorName = '<ClassName>'`.
- **PC-003 — brand giữa các bản class:** instance mang `Symbol.for('@sdcorejs/utils/error-brands')`, là mảng `errorName` (đã freeze) của cả chuỗi class. `Symbol.hasInstance` chạy check prototype native trước, sau đó so `this.errorName` với brand. Giá trị brand đổi từ tên constructor sang `errorName`, nên mỗi bundle app nên dùng một version utils duy nhất.

## Invariant

- **INV-001:** `instanceof` trong cùng entry vẫn dùng check prototype native trước. Message, `cause` và field riêng giữ nguyên.
- **INV-002:** brand và `error.name` không bao giờ đọc `constructor.name` hay `this.name`, chỉ dùng `errorName` riêng của class.

## Nghĩa vụ kiểm chứng

- **VAL-001** (INV-002; AC-003, AC-004): `instanceof` và `name` giữa các entry đúng sau khi bundle esbuild với minify tắt và bật; so brand không phụ thuộc tên constructor.
- **VAL-002** (INV-001; AC-002): message, `cause`, field và `instanceof` trong cùng entry không đổi.
- **VAL-003** (INV-002; AC-001, AC-005): mọi class có `errorName` riêng, không trùng nhau; lớp con thiếu `errorName` không khởi tạo được.

## Ngoài kiến trúc này

- Việc Core nâng utils lên 1.2.5 là follow-up AC-008 (deferred). Không ghi row `cross_repository_integration` vì phía Core chưa có artifact đã duyệt nào để tham chiếu.
- `tsup` `splitting: true` là non-goal.

```yaml
architecture_context:
  schema_version: 1
  source: sdcorejs-architecture
  contract_id: utils-stable-error-brand
  requirement_id: R-001
  approved_spec_reference:
    repository_id: github.com/sdcorejs/sdcorejs-utils
    artifact_id: spec-utils-stable-error-brand-r1
    artifact_kind: spec
    revision: bb3778003bae0b382228ad71c17b6310b7ae4cde
    approval_hash: sha256:v1:fd07274a06d1c36e6b8be9c7a290e69f4bdee44a48df1332fabaef5afd6336c2
  owner_repository_id: github.com/sdcorejs/sdcorejs-utils
  owner_module_id: errors
  execution_host_repository_id: gitlab.id.vin/mag/sales-platform/portals/portal-ops
  integration_owner_repository_id: github.com/sdcorejs/sdcorejs-utils
  trigger:
    required: true
    signals:
      - public-api-contract
    rationale: 'Exported error classes gain a public static errorName and a new subclassing contract: a subclass without its own errorName throws on construction.'
  invariants:
    - id: INV-001
      statement: Same-entry instanceof keeps using the native prototype check first; messages, cause and own fields (path, key, protocol, valueType) are unchanged.
      scope: src/errors.ts public error classes
      owner: github.com/sdcorejs/sdcorejs-utils
      rationale: The fix must only add a stable cross-copy brand, not change how errors read or compare inside one entry.
      verification_method: Unit tests in src/errors.spec.ts compare message, cause and own fields per class and assert native instanceof; existing suites stay green.
      requirement_refs:
        - R-006
      decision_refs:
        - D-001
    - id: INV-002
      statement: Brand checks and error.name never read constructor.name or this.name; they use the own static errorName only.
      scope: SdcoreUtilsError constructor and Symbol.hasInstance
      owner: github.com/sdcorejs/sdcorejs-utils
      rationale: Bundlers rename class bindings (collision suffix, minification); only string literals survive.
      verification_method: Unit test with a foreign branded object and a renamed class copy; validate-package --browser esbuild bundle with minify off and on.
      requirement_refs:
        - R-001
        - R-002
      decision_refs:
        - D-001
        - D-002
  boundaries: []
  dependency_directions: []
  data_state_owners: []
  public_contracts:
    - id: PC-001
      kind: api
      statement: 'SdcoreUtilsError and every exported subclass expose `static readonly errorName: string` equal to the export name; instances have `name === errorName`.'
      owner: github.com/sdcorejs/sdcorejs-utils
      compatibility: Additive for callers; error.name is unchanged in unbundled runtimes and becomes stable in bundled ones.
      migration: None for callers that only throw or catch utils errors.
      invariant_refs:
        - INV-001
        - INV-002
    - id: PC-002
      kind: api
      statement: 'Subclassing contract: a class extending any utils error must declare its own `static readonly errorName`; otherwise construction throws `TypeError("<ClassName> must declare its own static errorName")`.'
      owner: github.com/sdcorejs/sdcorejs-utils
      compatibility: Breaking for consumer subclasses without errorName; shipped in patch 1.2.5 by explicit owner decision D-003.
      migration: Add `static override readonly errorName = '<ClassName>'` (or without `override` in JavaScript) to each consumer subclass.
      invariant_refs:
        - INV-002
    - id: PC-003
      kind: api
      statement: 'Cross-copy brand: instances carry `Symbol.for(''@sdcorejs/utils/error-brands'')` as a frozen array of errorName values for the class chain; Symbol.hasInstance matches `this.errorName` after the native check.'
      owner: github.com/sdcorejs/sdcorejs-utils
      compatibility: Brand values change from constructor names to errorName; instances created by an older utils copy in the same app match only when their class names were not renamed.
      migration: Keep a single @sdcorejs/utils version per application bundle.
      invariant_refs:
        - INV-001
        - INV-002
  security_trust_boundaries: []
  cross_repository_integration: []
  adopted_decision_refs:
    - D-001
    - D-002
    - D-003
  deferred_decision_refs: []
  assumption_refs:
    - A-001
    - A-002
  validation_obligations:
    - id: VAL-001
      expected_proof: Bundled cross-entry instanceof and name hold with esbuild minify off and on; brand matching ignores constructor names.
      owner: github.com/sdcorejs/sdcorejs-utils
      invariant_refs:
        - INV-002
      acceptance_criterion_refs:
        - AC-003
        - AC-004
    - id: VAL-002
      expected_proof: Messages, cause, own fields and same-entry instanceof are unchanged for every built-in error.
      owner: github.com/sdcorejs/sdcorejs-utils
      invariant_refs:
        - INV-001
      acceptance_criterion_refs:
        - AC-002
    - id: VAL-003
      expected_proof: Every exported class has its own unique errorName and a subclass without one cannot be constructed.
      owner: github.com/sdcorejs/sdcorejs-utils
      invariant_refs:
        - INV-002
      acceptance_criterion_refs:
        - AC-001
        - AC-005
  profile_sections:
    frontend_architecture_ref: null
    agent_architecture_ref: null
  change_control:
    revision: 1
    supersedes: null
  approved_architecture_path: .sdcorejs/architecture/general/2026-10-01-11-20-stable-error-brand.md (after approval)
  approved_architecture_hash: (after approval)
```
