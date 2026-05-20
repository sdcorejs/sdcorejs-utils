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
  <a href="https://sdcorejs.github.io/sdcorejs-ultis/">Live Demo</a>
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
