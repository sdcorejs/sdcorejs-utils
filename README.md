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
| `ValidationPatternType` | Validator pattern keys (`'EMAIL'`, `'VN_PHONE'`, `'UUID'`, …) |
| `ValidationPattern` | Pattern descriptor — `{ type, name, pattern, errorMessage }` |
| `MaybeAsync<T>` | `T \| Promise<T> \| Observable<T>` |

### Primitive types

| Export | Values |
|---|---|
| `Size` | `'sm' \| 'md' \| 'lg'` |
| `Color` | `'primary' \| 'secondary' \| 'info' \| 'success' \| 'warning' \| 'error'` |
| `Language` | `'vi' \| 'en' \| 'ja' \| 'ko' \| 'zh'` |
| `MaterialIconFontSet` | Legacy Material Icons font set identifiers |
| `MaterialSymbolFontSet` | Material Symbols (variable font) font set identifiers |

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
| `VALIDATION_PATTERNS` | Array of `ValidationPattern` for all 22 built-in validators |
| `SUPPORTED_LANGUAGES` | `readonly ['vi', 'en', 'ja', 'ko', 'zh']` |
| `DEFAULT_MATERIAL_ICON_FONT_SET` | `'material-icons-outlined'` |
| `DEFAULT_MATERIAL_SYMBOL_FONT_SET` | `'material-symbols-outlined'` |

---

## `@sdcorejs/utils/fns`

### `StringUtilities`

```ts
import { StringUtilities } from '@sdcorejs/utils/fns';
```

**Regex pattern strings** — pass directly to `Validators.pattern()` or `new RegExp()`:

| Constant | Matches |
|---|---|
| `REGEX_EMAIL` | Standard email address |
| `REGEX_PHONE` | Generic international phone |
| `REGEX_VN_PHONE` | Vietnamese mobile phone number |
| `REGEX_VN_ID` | Vietnamese national ID (CCCD/CMND, 12 digits) |
| `REGEX_PASSPORT` | International passport (letter + 7 digits) |
| `REGEX_VN_ID_OR_PASSPORT` | Either VN_ID or PASSPORT |
| `REGEX_TIME` | `HH:mm` time string |
| `REGEX_URL` | HTTP/HTTPS URL |
| `REGEX_DOMAIN` | Bare domain name |
| `REGEX_IPV4` | IPv4 address |
| `REGEX_IPV6` | IPv6 address |
| `REGEX_IMAGE_URL` | HTTP/HTTPS URL ending with image extension |
| `REGEX_SLUG` | URL-friendly slug (lowercase, digits, hyphens) |
| `REGEX_NUMBER` | Integer or decimal, optionally negative |
| `REGEX_INTEGER` | Whole number, optionally negative |
| `REGEX_DECIMAL` | Number with mandatory decimal point |
| `REGEX_POSITIVE_NUMBER` | Non-negative integer or decimal |
| `REGEX_UUID` | UUID (lowercase hex, hyphen-separated) |
| `REGEX_CODE_16` | 16-character alphanumeric code |
| `REGEX_CODE_32` | 32-character alphanumeric code |
| `REGEX_HEX_COLOR` | CSS hex color (`#RGB` or `#RRGGBB`) |
| `REGEX_BASE64` | Base64-encoded string |

**Functions:**

| Member | Description |
|---|---|
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
| `detectIncognito()` | Cross-browser private-mode detection — returns `Promise<{ isPrivate, browserName }>` |

### `Utilities`

```ts
import { Utilities } from '@sdcorejs/utils/fns';
```

| Member | Description |
|---|---|
| `fetchAllByPaging(fn, pageSize?)` | Exhaust paginated API, collect all items |
| `randomId(prefix?)` | Time+random base-36 ID |
| `hash(obj)` | Stable djb2 hash of any value |
| `parseQueryParams(qs?)` | Query string → `Record<string, string>` |
| `generateUuid()` | `crypto.randomUUID()` with fallback |
| `getNestedValue(obj, path)` | Dot-path accessor |

---

## Build

```bash
npm run build   # tsup → dist/ (ESM + CJS + .d.ts)
npm test        # vitest
```

## Publishing

Merge to `main` triggers GitHub Actions → `npm publish --access public`.  
Requires `NPM_TOKEN` secret in repository settings.
