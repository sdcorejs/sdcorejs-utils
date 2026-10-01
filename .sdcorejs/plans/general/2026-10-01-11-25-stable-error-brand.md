---
artifact_id: plan-utils-stable-error-brand-r1
artifact_kind: plan
schema_version: 1
change_ref: utils-stable-error-brand
source_spec: .sdcorejs/specs/general/2026-10-01-11-03-stable-error-brand.md
source_architecture: .sdcorejs/architecture/general/2026-10-01-11-20-stable-error-brand.md
source_plan: none
commit_policy: with-change
owner: sdcorejs-plan
name: stable-error-brand
description: 'TDD plan: errors.spec.ts + bundled validate-package checks, static errorName in src/errors.ts, changeset patch 1.2.5, README and docs site.'
contract_id: utils-stable-error-brand
requirement_id: UTILS-ERROR-BRAND
approved_at: '2026-10-01T04:18:50.361Z'
approved_by: nghiatt15_onemount
approval_source: explicit-user-choice
track: general
sourceSpecPath: .sdcorejs/specs/general/2026-10-01-11-03-stable-error-brand.md
approved_spec_reference:
  repository_id: github.com/sdcorejs/sdcorejs-utils
  repository_relative_path: .sdcorejs/specs/general/2026-10-01-11-03-stable-error-brand.md
  artifact_id: spec-utils-stable-error-brand-r1
  revision: bb3778003bae0b382228ad71c17b6310b7ae4cde
  approval_hash: sha256:v1:fd07274a06d1c36e6b8be9c7a290e69f4bdee44a48df1332fabaef5afd6336c2
approved_architecture_reference:
  repository_id: github.com/sdcorejs/sdcorejs-utils
  artifact_id: architecture-utils-stable-error-brand-r1
  artifact_kind: architecture
  revision: bb3778003bae0b382228ad71c17b6310b7ae4cde
  approval_hash: sha256:v1:cc434ab8b2d56445439a6c247dcd50dac9a0c47b2dc255880ffc50de9b2ca9e9
  repository_relative_path: .sdcorejs/architecture/general/2026-10-01-11-20-stable-error-brand.md
parent_repository_id: null
parent_references:
  - repository_id: github.com/sdcorejs/sdcorejs-utils
    artifact_id: architecture-utils-stable-error-brand-r1
    artifact_kind: architecture
    revision: bb3778003bae0b382228ad71c17b6310b7ae4cde
    approval_hash: sha256:v1:cc434ab8b2d56445439a6c247dcd50dac9a0c47b2dc255880ffc50de9b2ca9e9
owner_repository_id: github.com/sdcorejs/sdcorejs-utils
owner_repository_role: library
owner_module_id: errors
execution_host_repository_id: gitlab.id.vin/mag/sales-platform/portals/portal-ops
integration_owner_repository_id: github.com/sdcorejs/sdcorejs-utils
repository_relative_path: .sdcorejs/plans/general/2026-10-01-11-25-stable-error-brand.md
source_revision: bb3778003bae0b382228ad71c17b6310b7ae4cde
dependency_order:
  - sdcorejs-utils:errors
gitlink_updates_in_scope: false
task_count: 6
phase_count: 4
target_root_kind: target-project
stack_profile: node-general
approved_spec_hash: sha256:v1:fd07274a06d1c36e6b8be9c7a290e69f4bdee44a48df1332fabaef5afd6336c2
approved_architecture_hash: sha256:v1:cc434ab8b2d56445439a6c247dcd50dac9a0c47b2dc255880ffc50de9b2ca9e9
allowed_paths:
  - src/errors.spec.ts
  - src/errors.ts
  - scripts/validate-package.mjs
  - .changeset/stable-error-brand.md
  - README.md
  - site/src/content/api/core-entries.ts
  - .sdcorejs/docs/general/2026-10-01-11-03-stable-error-brand-spec.md
  - .sdcorejs/specs/general/2026-10-01-11-03-stable-error-brand.md
  - .sdcorejs/docs/architecture/2026-10-01-11-20-stable-error-brand-architecture.md
  - .sdcorejs/architecture/general/2026-10-01-11-20-stable-error-brand.md
  - .sdcorejs/docs/general/2026-10-01-11-25-stable-error-brand-plan.md
  - .sdcorejs/plans/general/2026-10-01-11-25-stable-error-brand.md
  - .sdcorejs/docs/general/2026-10-01-11-25-stable-error-brand-execution.md
prohibited_paths:
  - package.json
  - package-lock.json
  - CHANGELOG.md
  - tsup.config.ts
  - dist/**
  - node_modules/**
  - coverage/**
  - site/package.json
  - site/package-lock.json
  - site/dist/**
  - site/node_modules/**
  - .sdcorejs/tasks/**
dependency_changes:
  required: false
  approval_required: false
env_changes:
  required: false
  approval_required: false
migration_changes:
  required: false
  approval_required: false
verification_strategy:
  package_manager: npm
  commands_planned:
    - npm test -- src/errors.spec.ts
    - npm run build && npm run test:package:browser
    - npm test
    - npm run validate
    - npm run validate:site
supersedes: null
change_control:
  revision: 1
  supersedes: null
  change_reason: null
approval_hash: sha256:v1:befb9ba0807bf1d287c8385ff77a7eb48372b9705ff004ec0e1a6b6f89081af6
approved_plan_hash: sha256:v1:befb9ba0807bf1d287c8385ff77a7eb48372b9705ff004ec0e1a6b6f89081af6
---

# Brand ổn định cho error class của @sdcorejs/utils - Approved Plan

> Snapshot of what the user approved at the `sdcorejs-plan` gate. Do not edit by hand; re-author through `sdcorejs-plan` if the contract changes.

## Approved contract

# Plan - Brand ổn định cho error class của @sdcorejs/utils - 2026-10-01 11:25

Approved spec: `.sdcorejs/specs/general/2026-10-01-11-03-stable-error-brand.md` (`sha256:v1:fd07274a06d1c36e6b8be9c7a290e69f4bdee44a48df1332fabaef5afd6336c2`).
Approved architecture (parent): `.sdcorejs/architecture/general/2026-10-01-11-20-stable-error-brand.md` (`sha256:v1:cc434ab8b2d56445439a6c247dcd50dac9a0c47b2dc255880ffc50de9b2ca9e9`).

## Scope

Hiện thực PC-001..PC-003:
- `static readonly errorName` cho 20 error class trong `src/errors.ts`.
- `name` và brand chỉ dùng `errorName`.
- Lớp con thiếu `errorName` thì ném `TypeError`.

Thêm test chống tái diễn: vitest, và bundle esbuild trong `validate-package --browser`. Ghi changeset patch 1.2.5, cập nhật README và docs site.

## Execution context

- Track: general
- Target root kind: target-project (`C:/Users/nghiatt15_onemount/Documents/sdcorejs/sdcorejs-ultis`)
- Stack profile: node-general
- Coverage approach: TDD. TASK-001 và TASK-002 viết test đỏ trước TASK-003.
- Parallel candidates: không. TASK-003 phụ thuộc cả hai task test đỏ, và phần docs phụ thuộc hợp đồng cuối cùng.
- Package manager: npm (`package-lock.json`). Lệnh lấy từ script trong `package.json`: `test`, `build`, `test:package:browser`, `validate`, `validate:site`.

```yaml
plan_context:
  schema_version: 2
  source: sdcorejs-plan
  architecture_gate:
    valid: true
    required: true
    status: required
    signals:
      - public-api-contract
    bypass: null
    rationale: 'Exported error classes gain a public static errorName and a new subclassing contract: a subclass without its own errorName throws on construction.'
    blockers: []
    blocker_messages: []
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
    approved_architecture_path: .sdcorejs/architecture/general/2026-10-01-11-20-stable-error-brand.md
    approved_architecture_hash: sha256:v1:cc434ab8b2d56445439a6c247dcd50dac9a0c47b2dc255880ffc50de9b2ca9e9
    owner_repository_id: github.com/sdcorejs/sdcorejs-utils
    owner_module_id: errors
    execution_host_repository_id: gitlab.id.vin/mag/sales-platform/portals/portal-ops
    integration_owner_repository_id: github.com/sdcorejs/sdcorejs-utils
    trigger:
      required: true
      signals: [public-api-contract]
      rationale: 'Exported error classes gain a public static errorName and a new subclassing contract: a subclass without its own errorName throws on construction.'
    invariants:
      - {id: INV-001, statement: 'Same-entry instanceof keeps using the native prototype check first; messages, cause and own fields (path, key, protocol, valueType) are unchanged.', scope: src/errors.ts public error classes, owner: github.com/sdcorejs/sdcorejs-utils, rationale: 'The fix must only add a stable cross-copy brand, not change how errors read or compare inside one entry.', verification_method: 'Unit tests in src/errors.spec.ts compare message, cause and own fields per class and assert native instanceof; existing suites stay green.', requirement_refs: [R-006], decision_refs: [D-001]}
      - {id: INV-002, statement: Brand checks and error.name never read constructor.name or this.name; they use the own static errorName only., scope: SdcoreUtilsError constructor and Symbol.hasInstance, owner: github.com/sdcorejs/sdcorejs-utils, rationale: 'Bundlers rename class bindings (collision suffix, minification); only string literals survive.', verification_method: Unit test with a foreign branded object and a renamed class copy; validate-package --browser esbuild bundle with minify off and on., requirement_refs: [R-001, R-002], decision_refs: [D-001, D-002]}
    boundaries: []
    dependency_directions: []
    data_state_owners: []
    public_contracts:
      - {id: PC-001, kind: api, statement: 'SdcoreUtilsError and every exported subclass expose `static readonly errorName: string` equal to the export name; instances have `name === errorName`.', owner: github.com/sdcorejs/sdcorejs-utils, compatibility: Additive for callers; error.name is unchanged in unbundled runtimes and becomes stable in bundled ones., migration: None for callers that only throw or catch utils errors., invariant_refs: [INV-001, INV-002]}
      - {id: PC-002, kind: api, statement: 'Subclassing contract: a class extending any utils error must declare its own `static readonly errorName`; otherwise construction throws `TypeError("<ClassName> must declare its own static errorName")`.', owner: github.com/sdcorejs/sdcorejs-utils, compatibility: Breaking for consumer subclasses without errorName; shipped in patch 1.2.5 by explicit owner decision D-003., migration: Add `static override readonly errorName = '<ClassName>'` (or without `override` in JavaScript) to each consumer subclass., invariant_refs: [INV-002]}
      - {id: PC-003, kind: api, statement: 'Cross-copy brand: instances carry `Symbol.for(''@sdcorejs/utils/error-brands'')` as a frozen array of errorName values for the class chain; Symbol.hasInstance matches `this.errorName` after the native check.', owner: github.com/sdcorejs/sdcorejs-utils, compatibility: Brand values change from constructor names to errorName; instances created by an older utils copy in the same app match only when their class names were not renamed., migration: Keep a single @sdcorejs/utils version per application bundle., invariant_refs: [INV-001, INV-002]}
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
      - {id: VAL-001, expected_proof: Bundled cross-entry instanceof and name hold with esbuild minify off and on; brand matching ignores constructor names., owner: github.com/sdcorejs/sdcorejs-utils, invariant_refs: [INV-002], acceptance_criterion_refs: [AC-003, AC-004]}
      - {id: VAL-002, expected_proof: 'Messages, cause, own fields and same-entry instanceof are unchanged for every built-in error.', owner: github.com/sdcorejs/sdcorejs-utils, invariant_refs: [INV-001], acceptance_criterion_refs: [AC-002]}
      - {id: VAL-003, expected_proof: Every exported class has its own unique errorName and a subclass without one cannot be constructed., owner: github.com/sdcorejs/sdcorejs-utils, invariant_refs: [INV-002], acceptance_criterion_refs: [AC-001, AC-005]}
    profile_sections:
      frontend_architecture_ref: null
      agent_architecture_ref: null
    change_control:
      revision: 1
      supersedes: null
  decision_coverage:
    schema_version: 1
    revision: 2
    records:
      - {id: R-001, type: requirement, statement: 'Every error class exported from src/errors.ts declares its own static readonly errorName equal to its export name, and instances expose name === errorName.', source: explicit-user, status: active, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, owner_module_id: errors, task_refs: [TASK-001, TASK-003]}
      - {id: R-002, type: requirement, statement: 'instanceof between a utils error thrown from one public entry (fns) and the same or a parent class imported from another entry (errors, root) holds in applications bundled by esbuild with minify on and off.', source: explicit-user, status: active, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, owner_module_id: errors, task_refs: [TASK-002, TASK-003]}
      - {id: R-003, type: requirement, statement: Constructing a subclass of SdcoreUtilsError that does not declare its own static errorName throws TypeError with message '<ClassName> must declare its own static errorName'., source: explicit-user, status: active, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, owner_module_id: errors, task_refs: [TASK-001, TASK-003]}
      - {id: R-004, type: requirement, statement: 'Package validation (validate-package --browser, part of npm run validate) fails when cross-entry instanceof breaks in an esbuild bundle, with minify on and off.', source: explicit-user, status: active, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, owner_module_id: scripts, task_refs: [TASK-002, TASK-006]}
      - {id: R-005, type: requirement, statement: The change ships as patch 1.2.5 through a changeset that states the subclass requirement and its migration step; README and the docs site describe errorName., source: explicit-user, status: active, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, owner_module_id: null, task_refs: [TASK-004, TASK-005]}
      - {id: R-006, type: requirement, statement: 'Existing error behaviour is preserved: messages, cause, own fields (path, key, protocol, valueType) and same-entry instanceof through the native prototype chain.', source: authoritative-contract, status: active, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, owner_module_id: errors, task_refs: [TASK-001, TASK-003, TASK-006]}
      - {id: AC-001, type: acceptance-criterion, statement: 'Every exported error class has an own, unique errorName equal to its export name.', behavior: A unit test iterates every class exported by src/errors.ts., expected_result: 'Object.hasOwn(cls, ''errorName'') is true, cls.errorName equals the export name, and all values are unique.', verification_kind: automated, blocking: true, requirement_refs: [R-001], task_refs: [TASK-001, TASK-003], evidence_refs: [EVIDENCE-001, EVIDENCE-003]}
      - {id: AC-002, type: acceptance-criterion, statement: Instances expose a stable name and keep their message and fields., behavior: A unit test constructs each built-in error with representative arguments., expected_result: 'error.name equals the class errorName; message, cause and own fields equal the values produced before the change.', verification_kind: automated, blocking: true, requirement_refs: [R-001, R-006], task_refs: [TASK-001, TASK-003], evidence_refs: [EVIDENCE-001, EVIDENCE-003]}
      - {id: AC-003, type: acceptance-criterion, statement: Brand-based instanceof does not depend on constructor.name., behavior: 'A unit test checks a foreign object that carries the global error-brand symbol with errorName values, and a class copy whose constructor name differs.', expected_result: instanceof is true for the class and its parents named in the brand and false for unrelated classes., verification_kind: automated, blocking: true, requirement_refs: [R-002, R-006], task_refs: [TASK-001, TASK-003], evidence_refs: [EVIDENCE-001, EVIDENCE-003]}
      - {id: AC-004, type: acceptance-criterion, statement: Bundled cross-entry instanceof holds with minify on and off., behavior: 'validate-package --browser bundles an entry with esbuild (minify false and true) that catches UnsafePropertyPathError thrown by fns Utilities.getNestedValue({}, ''a b'').', expected_result: 'The caught error is instanceof errors.UnsafePropertyPathError, errors.SecurityError, errors.SdcoreUtilsError and root.UnsafePropertyPathError, and its name is ''UnsafePropertyPathError'', in both bundles.', verification_kind: automated, blocking: true, requirement_refs: [R-002, R-004], task_refs: [TASK-002, TASK-003], evidence_refs: [EVIDENCE-002, EVIDENCE-003]}
      - {id: AC-005, type: acceptance-criterion, statement: A subclass without its own errorName cannot be constructed., behavior: 'A unit test declares class Custom extends ValidationError {} and constructs it; another subclass declares static readonly errorName = ''Custom2''.', expected_result: 'new Custom(''x'') throws TypeError ''Custom must declare its own static errorName''; new Custom2(''x'') succeeds, is instanceof ValidationError and has name ''Custom2''.', verification_kind: automated, blocking: true, requirement_refs: [R-003], task_refs: [TASK-001, TASK-003], evidence_refs: [EVIDENCE-001, EVIDENCE-003]}
      - {id: AC-006, type: acceptance-criterion, statement: Repository validation stays green., behavior: 'Run npm run validate (typecheck, test:coverage thresholds, build, publint, attw, test:package) and the docs site validation.', expected_result: Every step exits 0., verification_kind: automated, blocking: true, requirement_refs: [R-004, R-006], task_refs: [TASK-006], evidence_refs: [EVIDENCE-006]}
      - {id: AC-007, type: acceptance-criterion, statement: Release notes and docs describe the change., behavior: 'Read the changeset, README errors section and the docs site SdcoreUtilsError entry.', expected_result: The changeset is a patch for @sdcorejs/utils that states the subclass requirement and migration; README and docs site document errorName., verification_kind: manual, blocking: true, requirement_refs: [R-005], task_refs: [TASK-004, TASK-005], evidence_refs: [EVIDENCE-004, EVIDENCE-005]}
      - {id: AC-008, type: acceptance-criterion, statement: Downstream Core gains working cross-entry checks after upgrading., behavior: '@sd-angular/core upgrades to @sdcorejs/utils 1.2.5 and bundles FilePickerCancelledError checks.', expected_result: Cancel from the file picker no longer surfaces as an error in a bundled portal., verification_kind: deferred, blocking: true, requirement_refs: [R-002], task_refs: [TASK-006], evidence_refs: [EVIDENCE-007]}
      - {id: A-001, type: assumption, statement: tsup output keeps static class fields as own properties of each constructor in both ESM and CJS builds., source: inferred, confidence: high, status: proposed, blocking: false, evidence_refs: [poc-string-brand-esbuild], consequence_if_wrong: Own-errorName detection would fail and every construction would throw., validation_method: 'AC-001, AC-005 and the CJS/ESM runtime checks in validate-package.', owner: sdcorejs-utils maintainer, rationale: Static fields compile to defineProperty on the constructor in ES2022 output and to helper calls in lower targets., impacted_refs: [R-001, R-003]}
      - {id: A-002, type: assumption, statement: 'Few external consumers subclass utils error classes, so the strict subclass requirement is acceptable in a patch.', source: explicit, confidence: medium, status: confirmed, blocking: false, evidence_refs: [user-statement-2026-10-01, no-subclass-in-core-portal-sdcorejs-angular], consequence_if_wrong: A consumer subclass would start throwing after a patch upgrade., validation_method: Changeset and README state the requirement and migration step., owner: nghiatt15_onemount, rationale: User accepted the semver deviation on 2026-10-01., impacted_refs: [R-003, R-005]}
      - {id: D-001, type: decision, statement: 'The stable brand is a public static readonly errorName on every error class, used for name, brands and Symbol.hasInstance.', question: Which stable identifier replaces constructor.name?, selected_value: static readonly errorName (string literal), source: explicit-user, status: approved, blocking: true, scope: public-contract, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, rationale: String literals survive bundler renaming and minification; 'name' cannot be redeclared as a static field in TypeScript., supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-001, R-002, AC-001, AC-002, AC-003, AC-004], task_refs: [TASK-003]}
      - {id: D-002, type: decision, statement: A subclass without its own errorName throws TypeError during construction., question: What happens when a subclass does not declare errorName?, selected_value: throw TypeError '<ClassName> must declare its own static errorName', source: explicit-user, status: approved, blocking: true, scope: public-contract, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, rationale: User chose strict enforcement so every brand is explicit., supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-003, AC-005], task_refs: [TASK-003]}
      - {id: D-003, type: decision, statement: Release as patch 1.2.5 despite the subclass breaking change., question: Which version carries the change?, selected_value: 1.2.5 (patch changeset with explicit breaking note), source: explicit-user, status: approved, blocking: true, scope: repository, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, rationale: Few users; the fix is needed quickly by @sd-angular/core., supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-005, AC-007], task_refs: [TASK-004]}
      - {id: D-004, type: decision, statement: 'This change has no authorization boundary; proof is unit tests, a bundled package smoke check, repository validation and manual/deferred review.', question: Which validation boundary applies to utils-stable-error-brand?, selected_value: none, source: approved-plan, status: approved, blocking: true, scope: repository, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, rationale: 'Library error-class identity change; no server, permission or trust boundary.', supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, INV-001, INV-002], task_refs: [TASK-006], validation_boundary: {kind: none, source_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, INV-001, INV-002]}}
      - {id: INV-001, type: invariant, statement: 'Same-entry instanceof keeps using the native prototype check first, and messages, cause and own fields are unchanged.', protected_refs: [R-006, AC-002, AC-003], task_refs: [TASK-001, TASK-003], evidence_refs: [EVIDENCE-001, EVIDENCE-003]}
      - {id: INV-002, type: invariant, statement: Brand checks never read constructor.name or this.name; they use errorName only., protected_refs: [R-002, AC-003, AC-004], task_refs: [TASK-001, TASK-002, TASK-003], evidence_refs: [EVIDENCE-001, EVIDENCE-002, EVIDENCE-003]}
    history:
      - {revision: 1, active: [{id: R-001, type: requirement}, {id: R-002, type: requirement}, {id: R-003, type: requirement}, {id: R-004, type: requirement}, {id: R-005, type: requirement}, {id: R-006, type: requirement}, {id: AC-001, type: acceptance-criterion}, {id: AC-002, type: acceptance-criterion}, {id: AC-003, type: acceptance-criterion}, {id: AC-004, type: acceptance-criterion}, {id: AC-005, type: acceptance-criterion}, {id: AC-006, type: acceptance-criterion}, {id: AC-007, type: acceptance-criterion}, {id: AC-008, type: acceptance-criterion}, {id: A-001, type: assumption}, {id: A-002, type: assumption}, {id: D-001, type: decision}, {id: D-002, type: decision}, {id: D-003, type: decision}, {id: INV-001, type: invariant}, {id: INV-002, type: invariant}], tombstones: []}
      - {revision: 2, active: [{id: R-001, type: requirement}, {id: R-002, type: requirement}, {id: R-003, type: requirement}, {id: R-004, type: requirement}, {id: R-005, type: requirement}, {id: R-006, type: requirement}, {id: AC-001, type: acceptance-criterion}, {id: AC-002, type: acceptance-criterion}, {id: AC-003, type: acceptance-criterion}, {id: AC-004, type: acceptance-criterion}, {id: AC-005, type: acceptance-criterion}, {id: AC-006, type: acceptance-criterion}, {id: AC-007, type: acceptance-criterion}, {id: AC-008, type: acceptance-criterion}, {id: A-001, type: assumption}, {id: A-002, type: assumption}, {id: D-001, type: decision}, {id: D-002, type: decision}, {id: D-003, type: decision}, {id: D-004, type: decision}, {id: INV-001, type: invariant}, {id: INV-002, type: invariant}], tombstones: []}
  goal_backward_review:
    schema_version: 1
    mode: sdcorejs-plan:goal-backward
    decision_coverage:
      schema_version: 1
      revision: 2
      records: [{id: R-001, type: requirement, statement: 'Every error class exported from src/errors.ts declares its own static readonly errorName equal to its export name, and instances expose name === errorName.', source: explicit-user, status: active, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, owner_module_id: errors, task_refs: [TASK-001, TASK-003]}, {id: R-002, type: requirement, statement: 'instanceof between a utils error thrown from one public entry (fns) and the same or a parent class imported from another entry (errors, root) holds in applications bundled by esbuild with minify on and off.', source: explicit-user, status: active, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, owner_module_id: errors, task_refs: [TASK-002, TASK-003]}, {id: R-003, type: requirement, statement: Constructing a subclass of SdcoreUtilsError that does not declare its own static errorName throws TypeError with message '<ClassName> must declare its own static errorName'., source: explicit-user, status: active, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, owner_module_id: errors, task_refs: [TASK-001, TASK-003]}, {id: R-004, type: requirement, statement: 'Package validation (validate-package --browser, part of npm run validate) fails when cross-entry instanceof breaks in an esbuild bundle, with minify on and off.', source: explicit-user, status: active, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, owner_module_id: scripts, task_refs: [TASK-002, TASK-006]}, {id: R-005, type: requirement, statement: The change ships as patch 1.2.5 through a changeset that states the subclass requirement and its migration step; README and the docs site describe errorName., source: explicit-user, status: active, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, owner_module_id: null, task_refs: [TASK-004, TASK-005]}, {id: R-006, type: requirement, statement: 'Existing error behaviour is preserved: messages, cause, own fields (path, key, protocol, valueType) and same-entry instanceof through the native prototype chain.', source: authoritative-contract, status: active, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, owner_module_id: errors, task_refs: [TASK-001, TASK-003, TASK-006]}, {id: AC-001, type: acceptance-criterion, statement: 'Every exported error class has an own, unique errorName equal to its export name.', behavior: A unit test iterates every class exported by src/errors.ts., expected_result: 'Object.hasOwn(cls, ''errorName'') is true, cls.errorName equals the export name, and all values are unique.', verification_kind: automated, blocking: true, requirement_refs: [R-001], task_refs: [TASK-001, TASK-003], evidence_refs: [EVIDENCE-001, EVIDENCE-003]}, {id: AC-002, type: acceptance-criterion, statement: Instances expose a stable name and keep their message and fields., behavior: A unit test constructs each built-in error with representative arguments., expected_result: 'error.name equals the class errorName; message, cause and own fields equal the values produced before the change.', verification_kind: automated, blocking: true, requirement_refs: [R-001, R-006], task_refs: [TASK-001, TASK-003], evidence_refs: [EVIDENCE-001, EVIDENCE-003]}, {id: AC-003, type: acceptance-criterion, statement: Brand-based instanceof does not depend on constructor.name., behavior: 'A unit test checks a foreign object that carries the global error-brand symbol with errorName values, and a class copy whose constructor name differs.', expected_result: instanceof is true for the class and its parents named in the brand and false for unrelated classes., verification_kind: automated, blocking: true, requirement_refs: [R-002, R-006], task_refs: [TASK-001, TASK-003], evidence_refs: [EVIDENCE-001, EVIDENCE-003]}, {id: AC-004, type: acceptance-criterion, statement: Bundled cross-entry instanceof holds with minify on and off., behavior: 'validate-package --browser bundles an entry with esbuild (minify false and true) that catches UnsafePropertyPathError thrown by fns Utilities.getNestedValue({}, ''a b'').', expected_result: 'The caught error is instanceof errors.UnsafePropertyPathError, errors.SecurityError, errors.SdcoreUtilsError and root.UnsafePropertyPathError, and its name is ''UnsafePropertyPathError'', in both bundles.', verification_kind: automated, blocking: true, requirement_refs: [R-002, R-004], task_refs: [TASK-002, TASK-003], evidence_refs: [EVIDENCE-002, EVIDENCE-003]}, {id: AC-005, type: acceptance-criterion, statement: A subclass without its own errorName cannot be constructed., behavior: 'A unit test declares class Custom extends ValidationError {} and constructs it; another subclass declares static readonly errorName = ''Custom2''.', expected_result: 'new Custom(''x'') throws TypeError ''Custom must declare its own static errorName''; new Custom2(''x'') succeeds, is instanceof ValidationError and has name ''Custom2''.', verification_kind: automated, blocking: true, requirement_refs: [R-003], task_refs: [TASK-001, TASK-003], evidence_refs: [EVIDENCE-001, EVIDENCE-003]}, {id: AC-006, type: acceptance-criterion, statement: Repository validation stays green., behavior: 'Run npm run validate (typecheck, test:coverage thresholds, build, publint, attw, test:package) and the docs site validation.', expected_result: Every step exits 0., verification_kind: automated, blocking: true, requirement_refs: [R-004, R-006], task_refs: [TASK-006], evidence_refs: [EVIDENCE-006]}, {id: AC-007, type: acceptance-criterion, statement: Release notes and docs describe the change., behavior: 'Read the changeset, README errors section and the docs site SdcoreUtilsError entry.', expected_result: The changeset is a patch for @sdcorejs/utils that states the subclass requirement and migration; README and docs site document errorName., verification_kind: manual, blocking: true, requirement_refs: [R-005], task_refs: [TASK-004, TASK-005], evidence_refs: [EVIDENCE-004, EVIDENCE-005]}, {id: AC-008, type: acceptance-criterion, statement: Downstream Core gains working cross-entry checks after upgrading., behavior: '@sd-angular/core upgrades to @sdcorejs/utils 1.2.5 and bundles FilePickerCancelledError checks.', expected_result: Cancel from the file picker no longer surfaces as an error in a bundled portal., verification_kind: deferred, blocking: true, requirement_refs: [R-002], task_refs: [TASK-006], evidence_refs: [EVIDENCE-007]}, {id: A-001, type: assumption, statement: tsup output keeps static class fields as own properties of each constructor in both ESM and CJS builds., source: inferred, confidence: high, status: proposed, blocking: false, evidence_refs: [poc-string-brand-esbuild], consequence_if_wrong: Own-errorName detection would fail and every construction would throw., validation_method: 'AC-001, AC-005 and the CJS/ESM runtime checks in validate-package.', owner: sdcorejs-utils maintainer, rationale: Static fields compile to defineProperty on the constructor in ES2022 output and to helper calls in lower targets., impacted_refs: [R-001, R-003]}, {id: A-002, type: assumption, statement: 'Few external consumers subclass utils error classes, so the strict subclass requirement is acceptable in a patch.', source: explicit, confidence: medium, status: confirmed, blocking: false, evidence_refs: [user-statement-2026-10-01, no-subclass-in-core-portal-sdcorejs-angular], consequence_if_wrong: A consumer subclass would start throwing after a patch upgrade., validation_method: Changeset and README state the requirement and migration step., owner: nghiatt15_onemount, rationale: User accepted the semver deviation on 2026-10-01., impacted_refs: [R-003, R-005]}, {id: D-001, type: decision, statement: 'The stable brand is a public static readonly errorName on every error class, used for name, brands and Symbol.hasInstance.', question: Which stable identifier replaces constructor.name?, selected_value: static readonly errorName (string literal), source: explicit-user, status: approved, blocking: true, scope: public-contract, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, rationale: String literals survive bundler renaming and minification; 'name' cannot be redeclared as a static field in TypeScript., supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-001, R-002, AC-001, AC-002, AC-003, AC-004], task_refs: [TASK-003]}, {id: D-002, type: decision, statement: A subclass without its own errorName throws TypeError during construction., question: What happens when a subclass does not declare errorName?, selected_value: throw TypeError '<ClassName> must declare its own static errorName', source: explicit-user, status: approved, blocking: true, scope: public-contract, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, rationale: User chose strict enforcement so every brand is explicit., supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-003, AC-005], task_refs: [TASK-003]}, {id: D-003, type: decision, statement: Release as patch 1.2.5 despite the subclass breaking change., question: Which version carries the change?, selected_value: 1.2.5 (patch changeset with explicit breaking note), source: explicit-user, status: approved, blocking: true, scope: repository, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, rationale: Few users; the fix is needed quickly by @sd-angular/core., supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-005, AC-007], task_refs: [TASK-004]}, {id: D-004, type: decision, statement: 'This change has no authorization boundary; proof is unit tests, a bundled package smoke check, repository validation and manual/deferred review.', question: Which validation boundary applies to utils-stable-error-brand?, selected_value: none, source: approved-plan, status: approved, blocking: true, scope: repository, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, rationale: 'Library error-class identity change; no server, permission or trust boundary.', supersedes: null, revisit_condition: null, convention_impact: {candidate: false, category: null}, downstream_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, INV-001, INV-002], task_refs: [TASK-006], validation_boundary: {kind: none, source_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, INV-001, INV-002]}}, {id: INV-001, type: invariant, statement: 'Same-entry instanceof keeps using the native prototype check first, and messages, cause and own fields are unchanged.', protected_refs: [R-006, AC-002, AC-003], task_refs: [TASK-001, TASK-003], evidence_refs: [EVIDENCE-001, EVIDENCE-003]}, {id: INV-002, type: invariant, statement: Brand checks never read constructor.name or this.name; they use errorName only., protected_refs: [R-002, AC-003, AC-004], task_refs: [TASK-001, TASK-002, TASK-003], evidence_refs: [EVIDENCE-001, EVIDENCE-002, EVIDENCE-003]}]
      history: [{revision: 1, active: [{id: R-001, type: requirement}, {id: R-002, type: requirement}, {id: R-003, type: requirement}, {id: R-004, type: requirement}, {id: R-005, type: requirement}, {id: R-006, type: requirement}, {id: AC-001, type: acceptance-criterion}, {id: AC-002, type: acceptance-criterion}, {id: AC-003, type: acceptance-criterion}, {id: AC-004, type: acceptance-criterion}, {id: AC-005, type: acceptance-criterion}, {id: AC-006, type: acceptance-criterion}, {id: AC-007, type: acceptance-criterion}, {id: AC-008, type: acceptance-criterion}, {id: A-001, type: assumption}, {id: A-002, type: assumption}, {id: D-001, type: decision}, {id: D-002, type: decision}, {id: D-003, type: decision}, {id: INV-001, type: invariant}, {id: INV-002, type: invariant}], tombstones: []}, {revision: 2, active: [{id: R-001, type: requirement}, {id: R-002, type: requirement}, {id: R-003, type: requirement}, {id: R-004, type: requirement}, {id: R-005, type: requirement}, {id: R-006, type: requirement}, {id: AC-001, type: acceptance-criterion}, {id: AC-002, type: acceptance-criterion}, {id: AC-003, type: acceptance-criterion}, {id: AC-004, type: acceptance-criterion}, {id: AC-005, type: acceptance-criterion}, {id: AC-006, type: acceptance-criterion}, {id: AC-007, type: acceptance-criterion}, {id: AC-008, type: acceptance-criterion}, {id: A-001, type: assumption}, {id: A-002, type: assumption}, {id: D-001, type: decision}, {id: D-002, type: decision}, {id: D-003, type: decision}, {id: D-004, type: decision}, {id: INV-001, type: invariant}, {id: INV-002, type: invariant}], tombstones: []}]
    goals:
      - {id: G-001, statement: Cross-entry instanceof and error.name of utils errors survive application bundling., task_refs: [TASK-002, TASK-003]}
      - {id: G-002, statement: Every error class carries an explicit errorName and subclasses without one cannot be constructed., task_refs: [TASK-001, TASK-003]}
      - {id: G-003, statement: The change ships as documented patch 1.2.5 with green repository validation., task_refs: [TASK-004, TASK-005, TASK-006]}
    tasks:
      - {id: TASK-001, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, dependencies: [], planned_paths: [src/errors.spec.ts], planned_evidence: [{id: EVIDENCE-001, record_refs: [R-001, R-003, R-006, AC-001, AC-002, AC-003, AC-005, INV-001, INV-002]}], justification_refs: [R-001, R-003, R-006], enforces_invariant_refs: [INV-001, INV-002]}
      - {id: TASK-002, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, dependencies: [], planned_paths: [scripts/validate-package.mjs], planned_evidence: [{id: EVIDENCE-002, record_refs: [R-002, R-004, AC-004, INV-002]}], justification_refs: [R-002, R-004], enforces_invariant_refs: [INV-002]}
      - {id: TASK-003, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, dependencies: [TASK-001, TASK-002], planned_paths: [src/errors.ts], planned_evidence: [{id: EVIDENCE-003, record_refs: [R-001, R-002, R-003, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, D-001, D-002, INV-001, INV-002]}], justification_refs: [R-001, R-002, R-003, R-006, D-001, D-002], enforces_invariant_refs: [INV-001, INV-002]}
      - {id: TASK-004, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, dependencies: [TASK-003], planned_paths: [.changeset/stable-error-brand.md], planned_evidence: [{id: EVIDENCE-004, record_refs: [R-005, AC-007, D-003]}], justification_refs: [R-005, D-003], enforces_invariant_refs: []}
      - {id: TASK-005, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, dependencies: [TASK-003], planned_paths: [README.md, site/src/content/api/core-entries.ts], planned_evidence: [{id: EVIDENCE-005, record_refs: [R-005, AC-007]}], justification_refs: [R-005], enforces_invariant_refs: []}
      - {id: TASK-006, owner_repository_id: github.com/sdcorejs/sdcorejs-utils, dependencies: [TASK-004, TASK-005], planned_paths: [package.json], planned_evidence: [{id: EVIDENCE-006, record_refs: [R-004, R-006, AC-006, D-004]}, {id: EVIDENCE-007, record_refs: [R-002, AC-008]}], justification_refs: [R-004, R-006, D-004], enforces_invariant_refs: []}
    repository_inventory:
      repositories: [{repository_id: github.com/sdcorejs/sdcorejs-utils, existing_paths: [src/errors.ts, scripts/validate-package.mjs, README.md, site/src/content/api/core-entries.ts, package.json], intended_new_paths: [{path: src/errors.spec.ts, owner_task_id: TASK-001}, {path: .changeset/stable-error-brand.md, owner_task_id: TASK-004}]}]
    critique_history:
      - {round: 1, checker_version: sdcorejs-plan:goal-backward:v1, blockers: [], resolved_blockers: [], unresolved_blockers: []}
  validation_map:
    - invariant_refs: []
      risk: error-identity
      boundary: {kind: none, approval_ref: D-004, source_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, INV-001, INV-002]}
      authorization_boundary: false
      levels: [unit]
      command_source: package.json
      cwd: .
      evidence_class: UNIT
      automation: automated
      status: covered
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
      requirement_id: R-001
      acceptance_criterion_id: AC-001
      case_ids: [case-every-error-has-own-unique-error-name]
      planned_command: npm test -- src/errors.spec.ts
      expected_proof: Every exported error class has an own errorName equal to its export name, all unique.
      evidence_refs: [EVIDENCE-001, EVIDENCE-003]
    - invariant_refs: [INV-001]
      risk: error-identity
      boundary: {kind: none, approval_ref: D-004, source_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, INV-001, INV-002]}
      authorization_boundary: false
      levels: [unit]
      command_source: package.json
      cwd: .
      evidence_class: UNIT
      automation: automated
      status: covered
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
      requirement_id: R-001
      acceptance_criterion_id: AC-002
      case_ids: [case-error-name-message-fields-unchanged]
      planned_command: npm test -- src/errors.spec.ts
      expected_proof: name equals errorName; message, cause and own fields unchanged; native instanceof holds.
      evidence_refs: [EVIDENCE-001, EVIDENCE-003]
    - invariant_refs: [INV-001, INV-002]
      risk: error-identity
      boundary: {kind: none, approval_ref: D-004, source_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, INV-001, INV-002]}
      authorization_boundary: false
      levels: [unit]
      command_source: package.json
      cwd: .
      evidence_class: UNIT
      automation: automated
      status: covered
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
      requirement_id: R-002
      acceptance_criterion_id: AC-003
      case_ids: [case-brand-ignores-constructor-name]
      planned_command: npm test -- src/errors.spec.ts
      expected_proof: Foreign branded objects and renamed class copies match by errorName only.
      evidence_refs: [EVIDENCE-001, EVIDENCE-002, EVIDENCE-003]
    - invariant_refs: [INV-002]
      risk: error-identity
      boundary: {kind: none, approval_ref: D-004, source_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, INV-001, INV-002]}
      authorization_boundary: false
      levels: [integration]
      command_source: package.json
      cwd: .
      evidence_class: CONTAINER
      automation: automated
      status: covered
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
      requirement_id: R-002
      acceptance_criterion_id: AC-004
      case_ids: [case-bundled-cross-entry-instanceof-minify-off, case-bundled-cross-entry-instanceof-minify-on]
      planned_command: npm run build && npm run test:package:browser
      expected_proof: esbuild bundles (minify off/on) keep instanceof errors/root classes and name for an error thrown by fns.
      evidence_refs: [EVIDENCE-001, EVIDENCE-002, EVIDENCE-003]
    - invariant_refs: []
      risk: error-identity
      boundary: {kind: none, approval_ref: D-004, source_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, INV-001, INV-002]}
      authorization_boundary: false
      levels: [unit]
      command_source: package.json
      cwd: .
      evidence_class: UNIT
      automation: automated
      status: covered
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
      requirement_id: R-003
      acceptance_criterion_id: AC-005
      case_ids: [case-subclass-without-error-name-throws]
      planned_command: npm test -- src/errors.spec.ts
      expected_proof: Subclass without errorName throws the exact TypeError; subclass with errorName works.
      evidence_refs: [EVIDENCE-001, EVIDENCE-003]
    - invariant_refs: []
      risk: regression
      boundary: {kind: none, approval_ref: D-004, source_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, INV-001, INV-002]}
      authorization_boundary: false
      levels: [unit, integration]
      command_source: package.json
      cwd: .
      evidence_class: UNIT
      automation: automated
      status: covered
      rationale: null
      owner: null
      acknowledgement_required: false
      module_e2e: false
      module_id: null
      owner_repository_id: null
      requirement_id: R-004
      acceptance_criterion_id: AC-006
      case_ids: [case-repository-validate]
      planned_command: npm run validate
      expected_proof: typecheck, test:coverage thresholds, build, publint, attw and test:package exit 0.
      evidence_refs: [EVIDENCE-006]
    - invariant_refs: []
      risk: documentation-drift
      boundary: {kind: none, approval_ref: D-004, source_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, INV-001, INV-002]}
      authorization_boundary: false
      levels: [uat]
      command_source: manual
      cwd: .
      evidence_class: SUPPLEMENTAL_SMOKE
      automation: manual
      status: covered
      rationale: Release-note wording needs human review.
      owner: nghiatt15_onemount
      acknowledgement_required: true
      module_e2e: false
      module_id: null
      owner_repository_id: null
      requirement_id: R-005
      acceptance_criterion_id: AC-007
      case_ids: [case-release-notes-and-docs]
      planned_command: null
      expected_proof: Changeset patch note, README and docs site describe errorName and the subclass requirement.
      evidence_refs: [EVIDENCE-004, EVIDENCE-005]
    - invariant_refs: [INV-002]
      risk: integration
      boundary: {kind: none, approval_ref: D-004, source_refs: [R-001, R-002, R-003, R-004, R-005, R-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, INV-001, INV-002]}
      authorization_boundary: false
      levels: [browser-e2e]
      command_source: manual
      cwd: .
      evidence_class: FULL_E2E
      automation: deferred
      status: deferred
      rationale: Requires the published 1.2.5 and a Core upgrade.
      owner: nghiatt15_onemount
      acknowledgement_required: true
      module_e2e: false
      module_id: null
      owner_repository_id: null
      requirement_id: R-002
      acceptance_criterion_id: AC-008
      case_ids: [case-core-file-picker-cancel-bundled]
      planned_command: null
      expected_proof: Bundled portal no longer surfaces file-picker cancel as an error after Core upgrades to 1.2.5.
      evidence_refs: [EVIDENCE-001, EVIDENCE-002, EVIDENCE-003, EVIDENCE-007]
  contract_id: utils-stable-error-brand
  requirement_id: UTILS-ERROR-BRAND
  approved_spec_path: .sdcorejs/specs/general/2026-10-01-11-03-stable-error-brand.md
  approved_spec_hash: sha256:v1:fd07274a06d1c36e6b8be9c7a290e69f4bdee44a48df1332fabaef5afd6336c2
  approved_spec_reference:
    immutable_identity:
      repository_id: github.com/sdcorejs/sdcorejs-utils
      repository_relative_path: .sdcorejs/specs/general/2026-10-01-11-03-stable-error-brand.md
      artifact_id: spec-utils-stable-error-brand-r1
      revision: bb3778003bae0b382228ad71c17b6310b7ae4cde
      approval_hash: sha256:v1:fd07274a06d1c36e6b8be9c7a290e69f4bdee44a48df1332fabaef5afd6336c2
  approved_architecture_reference:
    repository_id: github.com/sdcorejs/sdcorejs-utils
    repository_relative_path: .sdcorejs/architecture/general/2026-10-01-11-20-stable-error-brand.md
    artifact_id: architecture-utils-stable-error-brand-r1
    revision: bb3778003bae0b382228ad71c17b6310b7ae4cde
    approval_hash: sha256:v1:cc434ab8b2d56445439a6c247dcd50dac9a0c47b2dc255880ffc50de9b2ca9e9
  approved_plan_path: ''
  approved_plan_hash: ''
  supersedes: null
  target_root: C:/Users/nghiatt15_onemount/Documents/sdcorejs/sdcorejs-ultis
  target_root_kind: target-project
  owner_repository_id: github.com/sdcorejs/sdcorejs-utils
  owner_repository_role: library
  owner_module_id: errors
  execution_host_repository_id: gitlab.id.vin/mag/sales-platform/portals/portal-ops
  integration_owner_repository_id: github.com/sdcorejs/sdcorejs-utils
  dependency_order:
    - sdcorejs-utils:errors
  gitlink_updates_in_scope: false
  track: general
  stack_profile: node-general
  task_count: 6
  phase_count: 4
  allowed_paths:
    - src/errors.spec.ts
    - src/errors.ts
    - scripts/validate-package.mjs
    - .changeset/stable-error-brand.md
    - README.md
    - site/src/content/api/core-entries.ts
    - .sdcorejs/docs/general/2026-10-01-11-03-stable-error-brand-spec.md
    - .sdcorejs/specs/general/2026-10-01-11-03-stable-error-brand.md
    - .sdcorejs/docs/architecture/2026-10-01-11-20-stable-error-brand-architecture.md
    - .sdcorejs/architecture/general/2026-10-01-11-20-stable-error-brand.md
    - .sdcorejs/docs/general/2026-10-01-11-25-stable-error-brand-plan.md
    - .sdcorejs/plans/general/2026-10-01-11-25-stable-error-brand.md
    - .sdcorejs/docs/general/2026-10-01-11-25-stable-error-brand-execution.md
  prohibited_paths:
    - package.json
    - package-lock.json
    - CHANGELOG.md
    - tsup.config.ts
    - dist/**
    - node_modules/**
    - coverage/**
    - site/package.json
    - site/package-lock.json
    - site/dist/**
    - site/node_modules/**
    - .sdcorejs/tasks/**
  generated_artifacts:
    - dist/**
    - coverage/**
    - site/dist/**
  docs_artifacts:
    - .changeset/stable-error-brand.md
    - README.md
    - site/src/content/api/core-entries.ts
  dependency_changes:
    required: false
    packages: []
    approval_required: false
  env_changes:
    required: false
    files: []
    approval_required: false
  migration_changes:
    required: false
    description: null
    approval_required: false
  frontend_architecture:
    required: false
    conformance_invariant_refs: []
    not_applicable_reason: Library error classes and package validation script; no UI.
  agent_architecture:
    required: false
    conformance_invariant_refs: []
    not_applicable_reason: Not an AI-agent change.
  verification_strategy:
    package_manager: npm
    commands_planned:
      - {command: npm test -- src/errors.spec.ts, reason: TASK-001 RED then TASK-003 GREEN (package.json test = vitest run)}
      - {command: npm run build && npm run test:package:browser, reason: 'TASK-002 RED on current classes, GREEN after TASK-003'}
      - {command: npm test, reason: full unit suite after TASK-003}
      - {command: npm run validate, reason: AC-006 repository gate used by CI}
      - {command: npm run validate:site, reason: AC-006 docs site gate after TASK-005}
    commands_skipped:
      - {command: npm run release / changeset version / changeset publish, reason: publishing and version bump belong to the maintainer publish workflow (non-goal)}
    checks: focused vitest file, bundled package browser validation, full validate, site validate
  parallel_candidates:
    allowed: false
    contract: 'Sequential: TASK-003 depends on both RED tasks and docs depend on the final contract.'
    shared_files: []
  repository_plan:
    schema_version: 1
    integration_owner_repository_id: github.com/sdcorejs/sdcorejs-utils
    dependency_order:
      - sdcorejs-utils:errors
    contract: Single repository; every mutable step has one Git root.
  finish_tail:
    contract: 'docs_before_final_branch_ready: TASK-004/005 before TASK-006; verify_before_done then branch_ready; no_writes_after_branch_ready: true'
  approval:
    approved: false
    approved_at: null
  change_control:
    revision: 1
    supersedes: null
    change_reason: null
```

## Execution preflight (execute-plan chạy trước khi sửa file)

1. `git status --short`, diffstat, untracked, branch, HEAD.
   - Lúc lập plan: `main` = `origin/main` = `bb37780`; untracked chỉ có artifact `.sdcorejs` của change này.
2. `git fetch origin`, rồi tạo branch `fix/stable-error-brand` từ `origin/main` (không làm trực tiếp trên `main`).
3. Đối chiếu `allowed_paths` / `prohibited_paths`.
4. Baseline:
   - `npm test`: ghi số pass/fail.
   - `npm run build && npm run test:package:browser`: ghi kết quả trước khi sửa.

## Tasks

### Phase 1 - RED tests

1. **TASK-001 CREATE** `src/errors.spec.ts` — vitest:
   - **AC-001:** duyệt mọi export của `./errors` là subclass của `Error`; mỗi class có own `errorName`, bằng tên export, không trùng nhau.
   - **AC-002:** tạo instance của từng error built-in với tham số mẫu.
     - `name === errorName`.
     - Message, `cause` và field riêng (`path`, `key`, `protocol`, `valueType`) bằng giá trị chuỗi cố định của hành vi hiện tại.
     - `instanceof` native đúng với chuỗi lớp cha.
   - **AC-003:**
     - Object lạ mang `Symbol.for('@sdcorejs/utils/error-brands')` với danh sách `errorName` khớp với class và lớp cha trong danh sách, không khớp với class không liên quan.
     - Lớp con có `errorName` nhưng bị đổi `.name` (`Object.defineProperty(Sub, 'name', { value: 'Re' })`) vẫn có `name === 'Sub'`, và object lạ brand `['Sub', ...]` khớp `instanceof Sub`.
   - **AC-005:** `class Custom extends ValidationError {}` thì `new Custom('x')` ném `TypeError('Custom must declare its own static errorName')`; lớp con có `errorName` thì tạo được.
   - RED dự kiến: AC-001, AC-003 (case đổi tên) và AC-005 fail với code hiện tại.
2. **TASK-002 EDIT** `scripts/validate-package.mjs` — trong `validateBrowserBundle`:
   - Thêm entry thứ hai: import `Utilities` từ `@sdcorejs/utils/fns`, import `errors` và root; `try { Utilities.getNestedValue({}, 'a b') } catch`.
   - Assert `instanceof` `errors.UnsafePropertyPathError`, `errors.SecurityError`, `errors.SdcoreUtilsError`, `root.UnsafePropertyPathError`, và `name === 'UnsafePropertyPathError'`.
   - Bundle esbuild hai lần (`minify: false`, `minify: true`, platform browser), chạy bằng `runNode`.
   - RED dự kiến khi chạy `npm run build && npm run test:package:browser` trên code hiện tại: assertion `instanceof` fail.

### Phase 2 - GREEN

3. **TASK-003 EDIT** `src/errors.ts`:
   - `SdcoreUtilsError`:
     - Thêm `static readonly errorName: string = 'SdcoreUtilsError'`.
     - Constructor: nếu `!Object.hasOwn(new.target, 'errorName')` thì `throw new TypeError(\`${new.target.name} must declare its own static errorName\`)`.
     - `this.name = new.target.errorName`.
     - Brand: thu `errorName` của các constructor có own `errorName` (dừng ở `Error`).
     - `Symbol.hasInstance`: check native trước, rồi `brands.includes(this.errorName)`.
   - 19 lớp con: mỗi lớp có `static override readonly errorName = '<ExportName>'`.
   - JSDoc cho `errorName` (PC-001/PC-002).
   - Message và field giữ nguyên (INV-001). Không còn đọc `constructor.name` hay `this.name` cho brand (INV-002).
   - Chạy `npm test -- src/errors.spec.ts`, `npm test`, `npm run build && npm run test:package:browser`: GREEN.

### Phase 3 - Release notes & docs

4. **TASK-004 CREATE** `.changeset/stable-error-brand.md`:
   - `'@sdcorejs/utils': patch`.
   - Nội dung tiếng Anh:
     - sửa `instanceof` giữa các entry khi bundle;
     - `error.name` ổn định;
     - **Breaking với lớp con**: phải khai báo `static readonly errorName`, kèm ví dụ migrate một dòng.
5. **TASK-005 EDIT** docs:
   - `README.md`, mục "Typed errors": thêm đoạn về `errorName`, và ví dụ khai báo cho lớp con.
   - `site/src/content/api/core-entries.ts`, entry `SdcoreUtilsError`: thêm `static readonly errorName: string` vào `signature`; sửa `runtimeEn`/`runtimeVi` (name và brand lấy từ `errorName`; lớp con thiếu `errorName` thì ném `TypeError`).

### Phase 4 - Verification

6. **TASK-006 RUN** (không sửa file):
   - `npm run validate`: typecheck, test:coverage với ngưỡng hiện có, build, publint, attw, test:package.
   - `npm run validate:site`.
   - Ghi nhận AC-008 deferred: Core nâng utils sau khi publish.

## Acceptance mapping

- AC-001, AC-002, AC-003, AC-005 -> TASK-001, TASK-003
- AC-004 -> TASK-002, TASK-003
- AC-006 -> TASK-006
- AC-007 -> TASK-004, TASK-005 (manual)
- AC-008 -> TASK-006 (deferred)

## Verification

- Focused: `npm test -- src/errors.spec.ts`; `npm run build && npm run test:package:browser`.
- Broad: `npm test`; `npm run validate`; `npm run validate:site`.
- Skipped: `npm run release` / `changeset version` / `changeset publish`. Việc phát hành và bump version thuộc workflow publish của maintainer.
- Manual: review changeset, README và docs site (AC-007).
- Deferred: AC-008 ở `@sd-angular/core`.

## Finish tail

Docs (TASK-004/005) chạy trước verification (TASK-006). Sau đó chạy `sdcorejs-ship` verify-before-done, rồi branch-ready. Không ghi file nào sau branch-ready. Commit, push và PR lên GitHub chỉ qua `sdcorejs-git` khi bạn yêu cầu.

## Review decisions

- Goal-backward vòng 1: không có blocker.
- Coverage revision 2 thêm D-004 (validation boundary `none`).

## Decisions captured during review

- (approved as drafted)

## Skill provenance

sdcorejs-plan (approved on attempt 1 / 3)
