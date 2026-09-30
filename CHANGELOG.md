# Changelog

## 1.2.4

### Patch Changes

- Accept an RxJS Observable of a narrower type as `MaybeAsync<T>` / `SubscribableLike<T>` again.

  In 1.1.x, `MaybeAsync<T>` included RxJS `Observable<T>`, so an `Observable<string>` fit a
  `MaybeAsync<string | null | undefined>` slot, and an Observable of a subtype or of one union
  member fit a slot of the wider type. Since 1.2.0 the structural `SubscribableLike<T>` typed the
  first `subscribe` parameter as `... | null`. RxJS's single-argument `subscribe(observerOrNext?)`
  overload does not accept `null`, so TypeScript rejected every such Observable, and code that
  compiled against 1.1.x stopped compiling. Two examples are a token getter returning
  `Observable<string>` and an auth source that is a `BehaviorSubject` of a user subtype.

  The first parameter of `SubscribableLike.subscribe` no longer includes `null`. Every call form
  still type-checks: an observer object, a `next` callback, or `(next, error, complete)`. Hand-written
  implementations whose parameter also accepts `null` still satisfy the interface, and the
  runtime behaviour is unchanged. The only thing now rejected at compile time is passing a literal
  `null` as the first argument when calling `subscribe` on a value typed `SubscribableLike`; pass
  `undefined` or omit it instead. RxJS deprecated that form too.

## 1.2.3

### Patch Changes

- Restore the 1.1.x date inputs that backends commonly send to the legacy date helpers.

  Since 1.2.0, `toFormat`, `isDate`, `begin`/`end`, the `add*` helpers and the difference helpers
  rejected an ISO instant with more than three fraction digits (`2026-07-09T08:49:29.851409Z`,
  the default for Java `Instant` and Postgres timestamps) and an offset without a colon
  (`+0700`, written by Jackson's `StdDateFormat`). `toFormat` returned `""` for these values, so
  every such value rendered as empty in the UI of any caller that formats backend dates. Local
  date-times with a sub-millisecond fraction were rejected the same way.

  These helpers now accept one to nine fraction digits and a `±HHmm` offset again. The fraction
  is truncated to whole milliseconds, not rounded, which matches what `Date.parse` did in 1.1.x
  and what Java's `toEpochMilli` does. Malformed fractions, out-of-range offsets and impossible
  calendar values are still rejected.

  `parseInstant` and `isValidInstant` are unchanged: they still require millisecond precision and
  a `±HH:mm` offset, so they keep signalling input that a `Date` cannot represent exactly.

## 1.2.2

### Patch Changes

- Make `hash32` (and its `hash` alias) total instead of throwing.

  `hash32` is a bucket key for runtime data, not a serialization, yet it inherited
  `stableStringify`'s strict JSON domain and threw `UnsupportedSerializationTypeError` for
  `undefined` at any depth, non-finite numbers, `bigint`, functions, symbols, sparse arrays,
  accessors, class instances, `Map`/`Set`, `Blob`/`File` and cycles. Callers that key caches,
  rows or groups by a hash of caller-supplied data lost the whole operation to one `undefined`
  field, and were pushed into writing their own wrapper around this function.

  A value inside the strict domain is still hashed straight through `stableStringify`, so
  every key that exists today is unchanged — important because these keys reach persistent
  storage. Only when that attempt throws is the value re-hashed from a copy in which each
  rejected value is replaced by its own namespaced placeholder, so those inputs hash
  deterministically and still differ from one another; a sparse hole stays distinct from a
  real `undefined`, and accessors are never invoked.

  `stableStringify` and `canonicalStringify` are unchanged and still reject, so callers using
  them to validate that data is serializable keep that signal.

## 1.2.1

### Patch Changes

- Encode an invalid `Date` instead of rejecting the value that contains it.

  `stableStringify` and `canonicalStringify` both threw `UnsupportedSerializationTypeError`
  for a `Date` holding `NaN`, so a single unparsable date aborted serialization — and with it
  `hash32`/`hash` and `sha256Canonical` — for an otherwise fully supported value. Callers that
  key UI state by `hash32` lost every row of a list to one malformed date cell.

  An invalid `Date` has exactly one observable state, so it now encodes deterministically:
  `stableStringify` emits `"Invalid Date"`, matching `String(new Date(NaN))`, and
  `canonicalStringify` emits its own tag payload, which cannot collide with a valid date
  because a valid payload is always an ISO-8601 string. This matches how the canonical domain
  already encodes the other degenerate-but-well-defined values (`NaN`, the infinities,
  negative zero, array holes).

  Widening only: no previously successful call changes its output. The plain-number `NaN`
  stays outside the JSON domain and `stableStringify` still rejects it.

  `encryptAesGcm` deliberately does not widen with it. Its plaintext is read back with
  `JSON.parse`, so an encoded invalid `Date` would decrypt as the string `"Invalid Date"`
  instead of failing; it keeps rejecting the value with `UnsupportedSerializationTypeError`.

## 1.2.0

### Minor Changes

- c57ad52: Ship the v1.2.0 production-foundation refactor in one release: add safe object/path
  handling and typed errors, authenticated AES-GCM APIs, deterministic canonical
  serialization and SHA-256, strict date/filter/number/URL contracts, terminating
  page-0-first pagination with a strictly zero-based contract, secure UUID v4 generation,
  hardened browser workflows, and a dependency-free structural `MaybeAsync` contract.
  Preserve legacy import paths and
  obfuscation payloads through documented deprecated wrappers while rejecting previously
  accepted unsafe or malformed inputs. One-based services adapt `pageNumber + 1` only in
  their transport callback; no paging-base compatibility options are public. Strengthen
  ESM/CommonJS declarations, packed consumer validation, coverage, multi-timezone tests,
  CI, security guidance, and the v1.2 migration path.

## 1.1.4

### Patch Changes

- Add `ObjectUtilities` with plain-object detection, deep clone, deep merge, and multi-source deep merge helpers. Update the docs site with interactive ObjectUtilities demos.

## 1.1.3

### Patch Changes

- 0c4c4a9: Add `FilterUtilities.match(filters, entity, options?)` for client-side evaluation of the `Filter` model against in-memory objects.

  Filter model gains a `dataType` discriminator (sibling of `data`, default `'absolute'`):

  - `'field'` — compare two fields on the same entity (`data: NestedKeyOf<T>`)
  - `'date-today'` — operand is the start of today (`data: 'TODAY'`)
  - `'date-relative'` — operand is a `DateRelative` (`{ amount, direction: 'previous' | 'next', unit: 'hour' | 'day' | 'week' | 'month' }`)

  New exports: `FilterDataType`, `DateRelative`, `FilterLiteral`, `FilterFieldType`, `MatchOptions<T>`, and `FilterUtilities` (`match`, `evaluate`, `relativeDate`, `isDateRelative`, `toEpoch`, `resolveData`, `resolveRelativeDate`).

  Type-aware coercion handles dates returned as `Date`, ISO strings, or numeric (ms/seconds) timestamps; pass `options.fieldTypes` when the caller knows the declared types for exact comparison.

## 1.1.2

### Patch Changes

- 0793771: Thêm operator `BETWEEN` (kèm icon SVG) vào `OPERATORS`.

## 1.1.1

### Patch Changes

- 7a81260: Thay `symbol` bằng `icon` (SVG path) trong `OPERATORS` để render biểu tượng toán tử trực tiếp.

## 1.1.0

### Minor Changes

- Add `NOT_START_WITH` and `NOT_END_WITH` operators to `OperatorHasData` union and `OPERATORS` UI metadata list. Fills a gap when building filter UIs that need negated prefix/suffix matching. Replaces the legacy typo `NOT_END_WIDTH` from `be-masterdata/core-be` with the correctly-spelled `NOT_END_WITH` — consumers migrating from `core-be` rename `NOT_END_WIDTH` → `NOT_END_WITH` at the call site.

All notable changes to `@sdcorejs/utils` are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.3] — 2026-05-20

### Changed

- Repository renamed from `sdcorejs-ultis` to `sdcorejs-utils`
- Updated `homepage`, `repository.url`, `bugs.url` in `package.json`
- Updated GitHub Pages base URL to `/sdcorejs-utils/`
- Updated all internal links to reflect new repo name

---

## [1.0.2] — 2026-05-20

### Changed (breaking — rename)

- `models`: `PatternType` → `ValidationPatternType`, `PatternCommon` → `ValidationPattern`
- `models`: `ValidationPattern.regex` field renamed to `pattern` (aligns with Angular `Validators.pattern()`)
- `models`: `ValidationPatternType` members renamed — `PHONE_VN` → `VN_PHONE`, `IDVN` → `VN_ID`, `IDVN_OR_PASSPORT` → `VN_ID_OR_PASSPORT`
- `fns`: `StringUtilities.REGEX_PHONE_VN` → `REGEX_VN_PHONE`, `REGEX_IDVN` → `REGEX_VN_ID`, `REGEX_IDVN_OR_PASSPORT` → `REGEX_VN_ID_OR_PASSPORT`
- `constants`: `PATTERN_COMMONS` → `VALIDATION_PATTERNS`

### Added

- `models`: 15 new `ValidationPatternType` members — `URL`, `DOMAIN`, `IPV4`, `IPV6`, `IMAGE_URL`, `SLUG`, `NUMBER`, `INTEGER`, `DECIMAL`, `POSITIVE_NUMBER`, `UUID`, `CODE_16`, `CODE_32`, `HEX_COLOR`, `BASE64`
- `fns`: 15 new `StringUtilities` regex constants — `REGEX_URL`, `REGEX_DOMAIN`, `REGEX_IPV4`, `REGEX_IPV6`, `REGEX_IMAGE_URL`, `REGEX_SLUG`, `REGEX_NUMBER`, `REGEX_INTEGER`, `REGEX_DECIMAL`, `REGEX_POSITIVE_NUMBER`, `REGEX_UUID`, `REGEX_CODE_16`, `REGEX_CODE_32`, `REGEX_HEX_COLOR`, `REGEX_BASE64`
- `constants`: `VALIDATION_PATTERNS` now covers all 22 pattern types
- Tests: 78 new tests for renamed and new regex patterns (total 468)

---

## [1.0.1] — 2026-05-20

### Changed

- `fns`: extracted `ColorUtilities` (`hslToHex`, `rgbToHex`) and `BrowserUtilities` from the old `Utilities` namespace
- `BrowserUtilities` uses `detectIncognito` (full cross-browser detection returning `{ isPrivate, browserName }`) instead of the simpler `isIncognito`
- `Utilities.allWithPaging` renamed to `fetchAllByPaging`
- `Utilities` now contains only general-purpose helpers: `fetchAllByPaging`, `randomId`, `hash`, `parseQueryParams`, `generateUuid`, `getNestedValue`
- Removed `Utilities.changeAliasLowerCase` (duplicate of `StringUtilities.changeAliasLowerCase`)
- Removed `Utilities.isIncognito` (replaced by `BrowserUtilities.detectIncognito`)
- Added `MaterialSymbolFontSet` type and `DEFAULT_MATERIAL_SYMBOL_FONT_SET` constant
- Added `SD_LANGUAGE_STORAGE_KEY` and `IPIFY_API_URL` constants (previously hardcoded strings)

---

## [1.0.0] — 2026-05-20

Initial release. Pure TypeScript utility library extracted from `@vn-angular/` (`projects/sd-angular/utilities/` and `projects/sd-angular/models/`).

### Added

**`@sdcorejs/utils/models`**

- `Filter<T>`, `FilterHasData<T>`, `FilterBetween<T>`, `FilterNoData<T>`, `FilterAndOr<T>`
- `Order<T>`, `QueryReq<T>`, `PagingReq<T>`, `PagingRes<T>`
- `NestedKeyOf<T>` — recursive dot-path type, depth-limited to 4 levels
- `Operator`, `OperatorHasData`, `OperatorNoData`
- `PatternType`, `PatternCommon`
- `MaybeAsync<T>`, `resolveMaybeAsync<T>()`, `normalizeAsync<T>()`
- `Size`, `Color`, `Language`, `MaterialIconFontSet`

**`@sdcorejs/utils/constants`**

- `EMPTY_STR` — default placeholder for empty display values (`'--'`)
- `OPERATORS` — lookup table for all 14 filter operators
- `PATTERN_COMMONS` — built-in validator definitions (email, phone, CCCD, passport, time)
- `SUPPORTED_LANGUAGES` — `['vi', 'en', 'ja', 'ko', 'zh']`
- `DEFAULT_MATERIAL_ICON_FONT_SET` — `'material-icons-outlined'`
- `DEFAULT_MATERIAL_SYMBOL_FONT_SET` — `'material-symbols-outlined'`

**`@sdcorejs/utils/fns`**

- `StringUtilities` — regex constants, validators, Vietnamese diacritic normalization, template interpolation, encrypt/decrypt, `sha256`
- `ArrayUtilities` — search (diacritic-insensitive, tree-aware), union, toObject, distinct, paging
- `NumberUtilities` — VN/ISO formatters, isNumber, round
- `DateUtilities` — isDate, toFormat, parseFrom, arithmetic (add days/hours/months), diff, timeDifference
- `Utilities` — upload (file picker with validation), download, downloadBlob, clipboard, allWithPaging, isIncognito, isMobile, randomId, hash, parseQueryParams, getClientPublicIp, generateUuid, getNestedValue
- `hslToHex`, `rgbToHex` — colour conversion utilities
- `detectIncognito` — cross-browser private-mode detection

### Infrastructure

- Build: tsup — outputs ESM (`.js`), CJS (`.cjs`), type declarations (`.d.ts`) for each subpath entry
- Test: vitest, 29 tests
- CI/CD: GitHub Actions — publish to npm on merge to `main`
- Subpath exports: `@sdcorejs/utils`, `./models`, `./constants`, `./fns`
