---
"@sdcorejs/utils": patch
---

Add `FilterUtilities.match(filters, entity, options?)` for client-side evaluation of the `Filter` model against in-memory objects.

Filter model gains a `dataType` discriminator (sibling of `data`, default `'absolute'`):
- `'field'` — compare two fields on the same entity (`data: NestedKeyOf<T>`)
- `'date-today'` — operand is the start of today (`data: 'TODAY'`)
- `'date-relative'` — operand is a `DateRelative` (`{ amount, direction: 'previous' | 'next', unit: 'hour' | 'day' | 'week' | 'month' }`)

New exports: `FilterDataType`, `DateRelative`, `FilterLiteral`, `FilterFieldType`, `MatchOptions<T>`, and `FilterUtilities` (`match`, `evaluate`, `relativeDate`, `isDateRelative`, `toEpoch`, `resolveData`, `resolveRelativeDate`).

Type-aware coercion handles dates returned as `Date`, ISO strings, or numeric (ms/seconds) timestamps; pass `options.fieldTypes` when the caller knows the declared types for exact comparison.
