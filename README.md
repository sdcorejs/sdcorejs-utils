# @sdcorejs/utils

<p align="center">
  <b>Enterprise-grade TypeScript utilities for modern web applications.</b>
</p>

<p align="center">
  Framework agnostic • Fully typed • Tree-shakable • AI-friendly
</p>

<p align="center">

  <a href="https://www.npmjs.com/package/@sdcorejs/utils">
    <img src="https://img.shields.io/npm/v/@sdcorejs/utils.svg" alt="npm version" />
  </a>

  <a href="https://www.npmjs.com/package/@sdcorejs/utils">
    <img src="https://img.shields.io/npm/dm/@sdcorejs/utils.svg" alt="npm downloads" />
  </a>

  <a href="https://github.com/sdcorejs/sdcorejs-utils/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/sdcorejs/sdcorejs-utils/release.yml" alt="build status" />
  </a>

  <a href="https://github.com/sdcorejs/sdcorejs-utils/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/sdcorejs/sdcorejs-utils" alt="license" />
  </a>

  <a href="https://bundlephobia.com/package/@sdcorejs/utils">
    <img src="https://img.shields.io/bundlephobia/minzip/@sdcorejs/utils" alt="bundle size" />
  </a>

  <a href="https://www.npmjs.com/package/@sdcorejs/utils">
    <img src="https://img.shields.io/npm/types/@sdcorejs/utils" alt="types included" />
  </a>

</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@sdcorejs/utils">npm</a>
  ·
  <a href="https://github.com/sdcorejs/sdcorejs-utils">GitHub</a>
  ·
  <a href="https://sdcorejs.github.io/sdcorejs-utils/">Live Demo</a>
</p>

---

## ✨ Features

* ✅ Pure TypeScript — no Angular or React dependency
* ✅ Fully typed APIs
* ✅ Tree-shakable subpath exports
* ✅ ESM + CommonJS support
* ✅ Enterprise-ready query & paging models
* ✅ Built-in validation patterns
* ✅ Browser, Date, String, Number, and Array utilities
* ✅ AI-friendly semantic contracts & naming
* ✅ Lightweight runtime dependencies

---

# 📦 Installation

```bash
npm install @sdcorejs/utils
```

> Optional peer dependency: `rxjs` is required only when using async helpers such as `MaybeAsync`, `resolveMaybeAsync`, or `normalizeAsync`.

---

# 🚀 Quick Examples

## Validation

```ts
import { StringUtilities } from '@sdcorejs/utils/fns';

StringUtilities.isValidEmail('test@gmail.com');
// true
```

---

## Date Formatting

```ts
import { DateUtilities } from '@sdcorejs/utils/fns';

DateUtilities.toFormat(new Date(), 'yyyy-MM-dd HH:mm');
```

---

## Exhaust Paginated API

```ts
import { Utilities } from '@sdcorejs/utils/fns';

const users = await Utilities.fetchAllByPaging(
  (pageSize, pageNumber) => api.getUsers(pageSize, pageNumber)
);
```

---

## Typed Query Models

```ts
import { PagingReq } from '@sdcorejs/utils/models';

const query: PagingReq<User> = {
  pageSize: 20,
  pageNumber: 0,
  filters: [
    {
      field: 'name',
      operator: 'LIKE',
      data: 'john'
    }
  ]
};
```

---

## Client-side Filtering

Evaluate the same `Filter[]` you send to the API directly against in-memory objects —
useful for optimistic UI, local search, and previewing query results.

```ts
import { FilterUtilities } from '@sdcorejs/utils/fns';
import type { Filter } from '@sdcorejs/utils/models';

const filters: Filter<Product>[] = [
  // literal
  { field: 'category', operator: 'EQUAL', data: 'electronics' },
  // field-to-field — compare two fields on the same entity
  { field: 'price', operator: 'GREATER_THAN', dataType: 'field', data: 'cost' },
  // relative date — TODAY, or N previous/next hour|day|week|month
  { field: 'createdAt', operator: 'GREATER_OR_EQUAL',
    dataType: 'date-relative', data: { amount: 7, direction: 'previous', unit: 'day' } },
];

// Top-level array = implicit AND. Empty list matches everything.
FilterUtilities.match(filters, product);                 // boolean
products.filter(p => FilterUtilities.match(filters, p));  // local filtering
```

**Type-aware coercion.** The client rarely knows a field's declared type — a date may arrive
as a `Date`, an ISO string, or a numeric (ms/seconds) timestamp. When the operand is itself a
date (`date-today` / `date-relative`), both sides are coerced to epoch ms automatically. For
the cases the filter can't infer (field-vs-field dates, seconds timestamps), pass `fieldTypes`:

```ts
FilterUtilities.match(filters, product, {
  fieldTypes: { createdAt: 'date', updatedAtMs: 'date', sku: 'number' },
});
```

---

# 📚 Subpath Exports

```ts
import { ... } from '@sdcorejs/utils'             // everything
import { ... } from '@sdcorejs/utils/models'      // types & interfaces
import { ... } from '@sdcorejs/utils/constants'   // constants
import { ... } from '@sdcorejs/utils/fns'         // utility functions
```

Optimized for tree-shaking and modular imports.

---

# 🧩 Package Structure

## `@sdcorejs/utils/models`

Typed models, interfaces, and utility types for enterprise applications.

### Includes

* Query & paging contracts
* Filtering models
* Validation pattern types
* Async utility types
* Primitive shared types

### Highlights

| Export                  | Description                            |
| ----------------------- | -------------------------------------- |
| `PagingReq<T>`          | Query with paging, filters, sorting    |
| `PagingRes<T>`          | Standard paginated response            |
| `Filter<T>`             | Typed filtering system                 |
| `NestedKeyOf<T>`        | Dot-path keys of nested objects        |
| `MaybeAsync<T>`         | `T \| Promise<T> \| Observable<T>`     |
| `ValidationPatternType` | Built-in validator pattern identifiers |

---

## `@sdcorejs/utils/constants`

Shared constants and reusable metadata definitions.

### Highlights

| Export                | Description                   |
| --------------------- | ----------------------------- |
| `OPERATORS`           | All supported query operators |
| `VALIDATION_PATTERNS` | Built-in validation metadata  |
| `SUPPORTED_LANGUAGES` | Supported i18n language list  |
| `EMPTY_STR`           | Default empty display value   |

---

## `@sdcorejs/utils/fns`

Framework-agnostic utility modules.

---

### `StringUtilities`

Validation, formatting, aliasing, hashing, parsing, and text helpers.

#### Common regex constants

* `REGEX_EMAIL`
* `REGEX_PHONE`
* `REGEX_VN_PHONE`
* `REGEX_UUID`
* `REGEX_URL`
* `REGEX_IPV4`
* `REGEX_HEX_COLOR`
* `REGEX_BASE64`

#### Common helpers

| Member                               | Description                       |
| ------------------------------------ | --------------------------------- |
| `isValidEmail(v)`                    | Email format validation           |
| `isNullOrEmpty(v)`                   | Null/undefined/empty check        |
| `aliasIncludes(text, search)`        | Vietnamese-insensitive search     |
| `sha256(input)`                      | URL-safe SHA-256 hashing          |
| `generateUniqueCode(name, existing)` | Unique snake_case code generation |

---

### `ArrayUtilities`

Array transformation and search helpers.

| Member                    | Description                  |
| ------------------------- | ---------------------------- |
| `search(items, text)`     | Diacritic-insensitive search |
| `union(key, ...arrays)`   | Merge & deduplicate          |
| `paging(items, pageSize)` | Client-side paging           |

---

### `NumberUtilities`

Number validation and formatting.

| Member                | Description                    |
| --------------------- | ------------------------------ |
| `toVNCurrency(v)`     | Vietnamese currency formatting |
| `round(v, digits?)`   | Decimal rounding               |
| `isPositiveNumber(v)` | Positive number check          |

---

### `DateUtilities`

Date parsing, formatting, comparison, and calculations.

| Member                 | Description                 |
| ---------------------- | --------------------------- |
| `toFormat(v, format)`  | Date formatting             |
| `parseFrom(v, format)` | Parse by format             |
| `dayDiff(d1, d2)`      | Difference in days          |
| `timeDifference(prev)` | Human-readable elapsed time |

---

### `BrowserUtilities`

Browser-specific helpers.

| Member                  | Description             |
| ----------------------- | ----------------------- |
| `upload(option?)`       | File picker helper      |
| `download(fileOrPath)`  | File downloader         |
| `copyToClipboard(text)` | Clipboard copy          |
| `detectIncognito()`     | Detect private browsing |

---

### `Utilities`

General-purpose utilities.

| Member                  | Description           |
| ----------------------- | --------------------- |
| `fetchAllByPaging(fn)`  | Exhaust paginated API |
| `randomId(prefix?)`     | Unique random ID      |
| `generateUuid()`        | UUID generation       |
| `parseQueryParams(qs?)` | Query string parser   |

---

### `FilterUtilities`

Client-side evaluation of the `Filter` model against in-memory objects.

| Member                            | Description                                                   |
| --------------------------------- | ------------------------------------------------------------- |
| `match(filters, entity, opts?)`   | `true` if the entity satisfies every filter (implicit AND)    |
| `evaluate(filter, entity, opts?)` | Evaluate a single (possibly nested) filter                    |
| `relativeDate(amount, dir, unit)` | Build a `DateRelative` operand                                |
| `isDateRelative(v)`               | Type guard for `DateRelative`                                 |
| `toEpoch(v)`                      | Normalize a `Date` / ISO string / ms or seconds timestamp → ms |

---

# 🏗 Build

```bash
npm run build
```

Builds:

* ESM
* CommonJS
* `.d.ts` typings

Powered by `tsup`.

---

# 🧪 Testing

```bash
npm test
```

Powered by `vitest`.

---

# 🚀 Publishing

Merging into `main` automatically triggers GitHub Actions and publishes the package to npm.

Requires:

* `NPM_TOKEN` repository secret

---

# 🎯 Philosophy

`@sdcorejs/utils` is designed around:

* predictable APIs
* semantic naming
* enterprise reuse
* minimal runtime dependencies
* tree-shakable architecture
* AI-friendly contracts

The goal is to provide a stable utility foundation for scalable frontend and backend ecosystems.

---

# 🌐 Ecosystem

* `@sdcorejs/utils`
* `@sdcorejs/angular`
* `@sdcorejs/nestjs`

---

# 📄 License

MIT
