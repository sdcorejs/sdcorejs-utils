---
artifact_id: execution-utils-operator-icons-r1
artifact_kind: execution-doc
change_ref: utils-operator-icons
source_spec: .sdcorejs/specs/general/2026-10-22-13-25-operator-icons.md
source_plan: .sdcorejs/plans/general/2026-10-22-13-25-operator-icons.md
commit_policy: with-change
owner: sdcorejs-execute-plan
---

# Operator icons execution

The user approved the four-step conversational plan with `1` on 2026-10-22.
Execution stayed on `feat/is-abort-error` at `dfe9fa7e05a9fbc86981f7f7c5872a6541bbbffc`.
Runtime: Node v22.14.0, npm, local Windows checkout.

## Delivered files

- `src/constants/operator.constants.spec.ts`: 126 Vitest cases with jsdom XML parsing.
- `src/constants/operator.constants.ts`: exact SVG strings for all 17 operators; updated SVG, text-family, BETWEEN and null-presence comments.
- `.changeset/operator-icons.md`: patch changeset covering C1-C6 plus EQUAL and BETWEEN adjustments.
- `.sdcorejs/handoff/design-operator-icons/PROMPT.md`
- `.sdcorejs/handoff/design-operator-icons/icons.md`
- `.sdcorejs/handoff/design-operator-icons/screenshots/02-bo-icon.png`
- `.sdcorejs/handoff/design-operator-icons/screenshots/03-icon-chevron-quy-tac.png`
- Approved requirement and plan snapshots referenced in this record's metadata, plus this execution record.

The four handoff files are byte-identical to the user ZIP. The immutable approved
artifacts were created and verified using approved-artifact.mjs. The conversational
plan was imported as explicit schema-v1 compatibility input; no schema-v2 plan
was downgraded and no strict-v2 convergence receipt is claimed.

## Acceptance evidence

| Criterion | Evidence | Result |
| --- | --- | --- |
| Exactly 17 distinct values; preserve order, display and public array type | Focused suite, typecheck; AST comparison with HEAD after excluding icon initializers and comments | PASS |
| Exact strings from the primary icons.md table | Per-operator fixtures; direct comparison of all 17 built exports through ESM/CJS root/constants | PASS |
| Valid SVG fragments with only line/polyline/rect/circle/path | jsdom DOMParser in image/svg+xml mode, namespace and leaf checks | PASS |
| Geometry in 0-24, including relative path commands | Per-operator bounds checks; IN half-ellipse and line geometry resolved from d | PASS |
| Filled circles r <= 2.75 and rectangles <= 6x4 | Per-operator fill checks | PASS |
| Shared slash for five negated operators and NULL; NOT_NULL exception | Exact slash counts, base-plus-slash checks, explicit null glyph assertions | PASS |
| Consumer retains stroke-width and SVG sizing | Per-operator attribute checks; rect dimensions retained | PASS |
| Comments match shapes; docs inspected | Source comments updated; README Constants and site OPERATORS entry contain no obsolete shape descriptions | PASS |
| One patch changeset includes C1-C6, IN and NOT_NULL | Changeset inspection | PASS |
| Existing work and dependencies preserved | 20 pre-existing dirty files checked by SHA-256; manifests, lockfiles, models, README and site left unchanged by this task | PASS |
| All required validation commands | Actual command results below | PASS |

## Commands

- `npm run test -- src/constants/operator.constants.spec.ts`: RED: exit 1; 30 failures caused by old icon values, 96 passes.
- `npm run test -- src/constants/operator.constants.spec.ts`: GREEN: exit 0; 126/126 tests.
- `npm run typecheck`: PASS; exit 0.
- `npm run test:coverage`: PASS; exit 0; 1,171 tests in 23 files. Statements 90.60%, branches 86.52%, functions 96.41%, lines 93.58%.
- `npm run build`: PASS; exit 0; ESM, CJS and declaration builds.
- `npm run validate:package`: PASS; exit 0; publint, attw node16 profile, runtime, declarations, browser, examples, RxJS coexistence. Legacy node10 resolution is ignored by the existing profile.
- `npm run validate:site`: PASS; exit 0; typecheck, 79 tests in 13 files, content validation, Vite build and build budget (25,773 / 102,400 gzip bytes).

No required command was skipped. No dependencies were added. No separate lint
script exists in package.json; the required package lint runs via validate:package.
No browser/Angular integration check is claimed; consumer changes are outside this
utils-only plan.

## Source interpretation

There is no deviation from the exact icon table in icons.md. The following
interpretations were included in the approved plan:

- NOT_NULL is a ring with a small dot and no slash, overriding the general NOT_* wording.
- width/height remain on rect geometry; SVG wrapper sizing and stroke-width remain consumer-owned.
- BETWEEN circles extend to x=4.5 and x=19.5, as the exact table requires, rather than the general 5-19 drawing-area wording.

README, site documentation, operator.model.ts and historical CHANGELOG entries
need no icon-description changes. Existing isAbortError changes remain intact.

## Changeset

`@sdcorejs/utils: patch`: redraw all 17 operator icons for small-size clarity.
C1 widens comparison signs; C2 aligns inclusive comparisons; C3 enlarges pills
and filled segments; C4 unifies slashes; C5 moves IN/NOT_IN to membership signs;
C6 uses a continuous slashed NULL ring and a NOT_NULL ring with a dot.
IN and NOT_NULL change their visual meaning in the same changeset. EQUAL and
BETWEEN are adjusted to the exact design coordinates. Filter semantics and API
metadata remain unchanged.

## Final source fingerprints

- `src/constants/operator.constants.ts`: `sha256:863db8aa91e6b2a76470133c907b17579ae85562b4c41173fc3470b40b468878`
- `src/constants/operator.constants.spec.ts`: `sha256:63d7e21891fbf5a83dade2726c4d02f5de4726cc2ed57000fb27af4c39986844`
- `.changeset/operator-icons.md`: `sha256:2a704b9924e44c6d8752b6d86a85a07a7c00df9c1c17c0e60156a588c0ed878d`
- `.sdcorejs/handoff/design-operator-icons/PROMPT.md`: `sha256:1d2cb5049a081f82c9aa45343082688f8e226b84052804b1ba1b2850ad688827`
- `.sdcorejs/handoff/design-operator-icons/icons.md`: `sha256:bb22248378e77946dc26dd798e84b9a1ae265014f3a855042f7b28ca3c2860c3`
- `.sdcorejs/handoff/design-operator-icons/screenshots/02-bo-icon.png`: `sha256:86bd4f836fc340a831df77cc8d3138c801a7935304da3ab344a06d5f92ff8525`
- `.sdcorejs/handoff/design-operator-icons/screenshots/03-icon-chevron-quy-tac.png`: `sha256:576341cac832945fbde586798198375b72aad2b0afde92e9c4b7a11bafdcf612`

## Delivery boundary

Implementation and all requested local checks are complete. No commit, push,
version command or publication was performed. Git/release delivery was not
requested. Final read-only hygiene and preservation checks follow this record;
any later source write requires relevant verification again.
