# @sdcorejs/utils

Pure TypeScript utility library — models, constants, and functions shared across sdcorejs projects. Framework-agnostic (no Angular or React dependency).

## Installation

```bash
npm install @sdcorejs/utils
```

> **Optional peer dependency:** `rxjs` is required only if you use `MaybeAsync`, `resolveMaybeAsync`, or `normalizeAsync` from the `models` subpath.

## Subpath exports

```ts
import { ... } from '@sdcorejs/utils'           // everything (barrel)
import { ... } from '@sdcorejs/utils/models'     // types & interfaces only
import { ... } from '@sdcorejs/utils/constants'  // constants only
import { ... } from '@sdcorejs/utils/fns'        // utility objects & functions
```

---

## `@sdcorejs/utils/models`

### Paging & filtering

| Export | Description |
|---|---|
| `Filter<T>` | Union of all filter variants |
| `FilterHasData<T>` | Filter with a scalar `data` value |
| `FilterBetween<T>` | Filter with `{ from, to }` range |
| `FilterNoData<T>` | Null-check filter (no data) |
| `FilterAndOr<T>` | Logical AND/OR group |
| `Order<T>` | Sort descriptor — `{ field, direction }` |
| `QueryReq<T>` | Base query with optional filters + fields |
| `PagingReq<T>` | Extends `QueryReq` with page size, number, orders |
| `PagingRes<T>` | Response — `{ items: T[], total: number }` |

### Type utilities

| Export | Description |
|---|---|
| `NestedKeyOf<T>` | Dot-path keys of `T`, depth-limited to 4 levels |
| `Operator` | Union of all operator string literals |
| `OperatorHasData` | Operators that require a data value |
| `OperatorNoData` | `'NULL' \| 'NOT_NULL'` |
| `PatternType` | Validator pattern keys (`'EMAIL'`, `'PHONE'`, …) |
| `PatternCommon` | Pattern descriptor — `{ type, name, regex, errorMessage }` |
| `MaybeAsync<T>` | `T \| Promise<T> \| Observable<T>` |

### Primitive types

| Export | Values |
|---|---|
| `Size` | `'sm' \| 'md' \| 'lg'` |
| `Color` | `'primary' \| 'secondary' \| 'info' \| 'success' \| 'warning' \| 'error'` |
| `Language` | `'vi' \| 'en' \| 'ja' \| 'ko' \| 'zh'` |
| `MaterialIconFontSet` | Material icon font set string literals |

### Async helpers (requires `rxjs`)

| Export | Description |
|---|---|
| `resolveMaybeAsync<T>(value)` | Converts `MaybeAsync<T>` → `Promise<T>` |
| `normalizeAsync<T>(value)` | Converts `MaybeAsync<T>` → `Observable<T>` |

---

## `@sdcorejs/utils/constants`

| Export | Description |
|---|---|
| `EMPTY_STR` | `'--'` — default display for empty values |
| `OPERATORS` | Array of `{ value, symbol, display }` for all 14 operators |
| `PATTERN_COMMONS` | Array of `PatternCommon` for built-in validators |
| `SUPPORTED_LANGUAGES` | `readonly ['vi', 'en', 'ja', 'ko', 'zh']` |
| `DefaultMaterialIconFontSet` | `'material-icons-outlined'` |

---

## `@sdcorejs/utils/fns`

### `StringUtilities`

```ts
import { StringUtilities } from '@sdcorejs/utils/fns';
```

| Member | Description |
|---|---|
| `REGEX_EMAIL`, `REGEX_PHONE`, `REGEX_PHONE_VN`, `REGEX_IDVN`, `REGEX_PASSPORT`, `REGEX_IDVN_OR_PASSPORT`, `REGEX_TIME` | Regex pattern strings |
| `isValidEmail(v)` | Email format check |
| `isValidPhone(v)` | Phone format check |
| `isValidCode(v)` | Alphanumeric code (2–20 chars) |
| `isNullOrEmpty(v)` | `null \| undefined \| ''` |
| `isNullOrWhiteSpace(v)` | Whitespace-only string check |
| `changeAliasLowerCase(s)` | Strip Vietnamese diacritics + lowercase |
| `aliasIncludes(text, search)` | Diacritic-insensitive `includes` |
| `format(template, ...args)` | `{0}`, `{1}` placeholder substitution |
| `templateToDisplay(template, entity)` | `${field.path}` interpolation |
| `parseExpression(template, entity)` | Expression → typed value |
| `encrypt(obj)` / `decrypt(str)` | Lightweight reversible encoding |
| `convertToSnakeCaseCode(name)` | Vietnamese name → `snake_case` |
| `generateUniqueCode(name, existing)` | Unique snake_case code with suffix |
| `sha256(input)` | Async URL-safe base64 SHA-256 |

### `ArrayUtilities`

```ts
import { ArrayUtilities } from '@sdcorejs/utils/fns';
```

| Member | Description |
|---|---|
| `search(items, text, fields?, children?)` | Diacritic-insensitive search with optional tree traversal |
| `union(key, ...arrays)` | Merge arrays, deduplicate by key |
| `toObject(key, items)` | `T[]` → `Record<string, T>` |
| `distinct(items)` | Remove duplicates (`Set`) |
| `paging(items, pageSize, page?)` | Client-side slice |

### `NumberUtilities`

```ts
import { NumberUtilities } from '@sdcorejs/utils/fns';
```

| Member | Description |
|---|---|
| `toVNCurrency(v)` / `toVN(v)` | Format as Vietnamese locale number |
| `toISO(v)` | Format as US locale number |
| `isNumber(v)` | True for any numeric-coercible value |
| `isPositiveInteger(v)` | Integer > 0 |
| `isPositiveNumber(v)` | Number > 0 (decimal allowed) |
| `round(v, digits?)` | Round to N decimal places (default 2) |

### `DateUtilities`

```ts
import { DateUtilities } from '@sdcorejs/utils/fns';
```

| Member | Description |
|---|---|
| `isDate(v)` | Validates date string or value |
| `toFormat(v, format)` | Format date — tokens: `yyyy MM dd HH mm ss` |
| `parseFrom(v, format)` | Parse date string by format pattern |
| `equal(d1, d2)` | Deep equality by timestamp |
| `dayDiff(d1, d2)` / `monthDiff` / `yearDiff` | Numeric difference |
| `age(d1, d2)` | Age in years (decimal) |
| `addMiliseconds` / `addHours` / `addDays` / `addMonths` | Date arithmetic |
| `begin(d)` / `end(d)` | Start/end of day |
| `timeDifference(prev, now?)` | Human-readable elapsed time |

### `ColorUtilities`

```ts
import { ColorUtilities } from '@sdcorejs/utils/fns';
```

| Member | Description |
|---|---|
| `hslToHex(h, s, l)` | HSL → hex colour string |
| `rgbToHex(r, g, b)` | RGB → hex colour string |

### `BrowserUtilities`

```ts
import { BrowserUtilities } from '@sdcorejs/utils/fns';
```

| Member | Description |
|---|---|
| `upload(option?)` | Opens file picker, validates extension/size, returns `File \| File[]` |
| `download(fileOrPath, fileName?)` | Download `File` or URL |
| `downloadBlob(blob, fileName?)` | Download a `Blob` |
| `copyToClipboard(text)` | Write to clipboard |
| `isMobile()` | Detect mobile user agent |
| `getClientPublicIp()` | Fetch public IP via ipify |
| `detectIncognito()` | Cross-browser private-mode detection — returns `Promise<{ isPrivate, browserName }>` |

### `Utilities`

```ts
import { Utilities } from '@sdcorejs/utils/fns';
```

| Member | Description |
|---|---|
| `allWithPaging(fn, pageSize?)` | Exhaust paginated API, collect all items |
| `randomId(prefix?)` | Time+random base-36 ID |
| `hash(obj)` | Stable djb2 hash of any value |
| `parseQueryParams(qs?)` | Query string → `Record<string, string>` |
| `generateUuid()` | `crypto.randomUUID()` with fallback |
| `getNestedValue(obj, path)` | Dot-path accessor |

### Standalone export

| Export | Description |
|---|---|
| `detectIncognito()` | Same as `BrowserUtilities.detectIncognito` — available for direct import |

---

## Build

```bash
npm run build   # tsup → dist/ (ESM + CJS + .d.ts)
npm test        # vitest
```

## Publishing

Merge to `main` triggers GitHub Actions → `npm publish --access public`.  
Requires `NPM_TOKEN` secret in repository settings.
