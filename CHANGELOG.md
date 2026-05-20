# Changelog

All notable changes to `@sdcorejs/utils` are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] — 2026-05-20

### Changed

- `fns`: extracted `ColorUtilities` (`hslToHex`, `rgbToHex`) and `BrowserUtilities` from the old `Utilities` namespace
- `BrowserUtilities` uses `detectIncognito` (full cross-browser detection returning `{ isPrivate, browserName }`) instead of the simpler `isIncognito`
- `Utilities` now contains only general-purpose helpers: `allWithPaging`, `randomId`, `hash`, `parseQueryParams`, `generateUuid`, `getNestedValue`
- Removed `Utilities.changeAliasLowerCase` (duplicate of `StringUtilities.changeAliasLowerCase`)
- Removed `Utilities.isIncognito` (replaced by `BrowserUtilities.detectIncognito`)

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
- `DefaultMaterialIconFontSet` — `'material-icons-outlined'`

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
