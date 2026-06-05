/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  DateRelative,
  Filter,
  FilterAndOr,
  FilterBetween,
  FilterFieldType,
  FilterHasData,
  FilterNoData,
  MatchOptions,
} from '../models/filter.model';
import { DateUtilities } from './date.fns';
import { Utilities } from './utility.fns';

// ─── Constructors / guards ───────────────────────────────────────────────────

/**
 * Dựng một {@link DateRelative}. Build a {@link DateRelative} spec.
 *
 * @example
 * FilterUtilities.relativeDate(3, 'previous', 'day');  // 3 ngày trước / 3 days ago
 */
const relativeDate = (
  amount: number,
  direction: DateRelative['direction'],
  unit: DateRelative['unit']
): DateRelative => ({ amount, direction, unit });

/** Narrows an arbitrary value to a {@link DateRelative}. */
const isDateRelative = (v: any): v is DateRelative =>
  !!v &&
  typeof v === 'object' &&
  typeof v.amount === 'number' &&
  (v.direction === 'previous' || v.direction === 'next') &&
  ['hour', 'day', 'week', 'month'].includes(v.unit);

// ─── Resolution ───────────────────────────────────────────────────────────────

/** Đầu ngày hôm nay (nửa đêm). Start of today (local midnight). */
const startOfToday = (): Date => DateUtilities.begin(new Date()) ?? new Date();

/** Resolve một {@link DateRelative} thành `Date`. Resolve a {@link DateRelative} to a `Date`. */
const resolveRelativeDate = (rel: DateRelative): Date => {
  // `hour` neo theo "bây giờ"; còn lại neo theo đầu ngày. `hour` anchors at now; others at start of today.
  const base = rel.unit === 'hour' ? new Date() : startOfToday();
  const n = (rel.direction === 'previous' ? -1 : 1) * Math.abs(rel.amount ?? 0);
  switch (rel.unit) {
    case 'hour':
      return DateUtilities.addHours(base, n) ?? base;
    case 'day':
      return DateUtilities.addDays(base, n) ?? base;
    case 'week':
      return DateUtilities.addDays(base, n * 7) ?? base;
    case 'month':
      return DateUtilities.addMonths(base, n) ?? base;
    default:
      return base;
  }
};

/**
 * Resolve `data` của một filter đơn-trị về giá trị so sánh thực, theo `dataType`.
 * Resolve a single-value filter's `data` to the concrete comparison value, per `dataType`.
 */
const resolveData = (filter: FilterHasData, entity: any): any => {
  switch (filter.dataType) {
    case 'field':
      return Utilities.getNestedValue(entity, filter.data);
    case 'date-today':
      return startOfToday();
    case 'date-relative':
      return resolveRelativeDate(filter.data);
    default:
      return filter.data; // 'absolute' hoặc bỏ trống / 'absolute' or omitted
  }
};

// ─── Type-aware coercion ─────────────────────────────────────────────────────
// Lõi giải bài toán "client không biết kiểu": khi BIẾT một vế là date (từ
// `fieldTypes`, từ `dataType`, hoặc operand là `Date`), ép CẢ HAI vế về epoch ms —
// xử lý cả Date, chuỗi ISO, và number/chuỗi-số timestamp (ms hoặc giây).
// The crux: when a side is KNOWN to be a date, both sides are coerced to epoch ms —
// handling Date, ISO strings, and numeric (ms or seconds) timestamps.

/** Ngưỡng phân biệt giây vs mili-giây (~ 2001-09 tính bằng ms). Seconds-vs-ms cutoff. */
const MS_CUTOFF = 1e12;

/** Ép bất kỳ biểu diễn date nào về epoch ms, hoặc `null` nếu không parse được. */
const toEpoch = (v: any): number | null => {
  if (v == null) return null;
  if (v instanceof Date) {
    const t = v.getTime();
    return isNaN(t) ? null : t;
  }
  if (typeof v === 'number') return v < MS_CUTOFF ? v * 1000 : v;
  if (typeof v === 'string') {
    const s = v.trim();
    if (/^\d+$/.test(s)) {
      const n = +s;
      return n < MS_CUTOFF ? n * 1000 : n;
    }
    const t = new Date(s).getTime();
    return isNaN(t) ? null : t;
  }
  return null;
};

/**
 * Chuẩn hoá một giá trị để so sánh, theo kiểu (nếu biết).
 * Normalize a value for comparison, given its type when known.
 *
 * - `'date'`             — epoch ms (qua {@link toEpoch}).
 * - `'number'/'string'/'boolean'` — ép tường minh, KHÔNG đoán date.
 * - không có kiểu / no type — heuristic: `Date` & chuỗi-giống-date → epoch ms; còn lại giữ nguyên.
 */
const coerce = (v: any, type?: FilterFieldType): any => {
  switch (type) {
    case 'date':
      return toEpoch(v);
    case 'number':
      return v == null ? v : Number(v);
    case 'string':
      return v == null ? v : String(v);
    case 'boolean':
      return v == null ? v : !!v;
    default:
      if (v instanceof Date) return v.getTime();
      if (typeof v === 'string' && DateUtilities.isDate(v)) return new Date(v).getTime();
      return v;
  }
};

/** Three-way comparison (`-1` / `0` / `1`), type-aware; `NaN` when a side is unresolved. */
const compare = (a: any, b: any, type?: FilterFieldType): number => {
  const x = coerce(a, type);
  const y = coerce(b, type);
  if (x == null || y == null) return NaN;
  if (x < y) return -1;
  if (x > y) return 1;
  return 0;
};

const looseEqual = (a: any, b: any, type?: FilterFieldType): boolean => coerce(a, type) === coerce(b, type);

/** Lower-cased string coercion for the substring/prefix/suffix family. */
const asString = (v: any): string => (v == null ? '' : String(v)).toLowerCase();

/**
 * Kiểu hiệu lực cho field này: ưu tiên `fieldTypes` khai báo; nếu không, suy ra `'date'`
 * khi operand chắc chắn là date; còn lại để heuristic tự lo.
 * Effective type for a field: declared `fieldTypes` wins; otherwise infer `'date'`
 * when the operand is certainly a date; else leave to the heuristic.
 */
const resolveType = (
  field: string,
  right: any,
  dataType: FilterHasData['dataType'],
  options?: MatchOptions
): FilterFieldType | undefined => {
  const declared = options?.fieldTypes?.[field];
  if (declared) return declared;
  if (dataType === 'date-today' || dataType === 'date-relative' || right instanceof Date) return 'date';
  return undefined;
};

// ─── Per-variant evaluators ────────────────────────────────────────────────

const evalHasData = (filter: FilterHasData, entity: any, options?: MatchOptions): boolean => {
  const left = Utilities.getNestedValue(entity, filter.field);
  const right = resolveData(filter, entity);
  const type = resolveType(filter.field, right, filter.dataType, options);
  switch (filter.operator) {
    case 'EQUAL':
      return looseEqual(left, right, type);
    case 'NOT_EQUAL':
      return !looseEqual(left, right, type);
    case 'GREATER_THAN':
      return compare(left, right, type) > 0;
    case 'LESS_THAN':
      return compare(left, right, type) < 0;
    case 'GREATER_OR_EQUAL':
      return compare(left, right, type) >= 0;
    case 'LESS_OR_EQUAL':
      return compare(left, right, type) <= 0;
    case 'CONTAIN':
      return asString(left).includes(asString(right));
    case 'NOT_CONTAIN':
      return !asString(left).includes(asString(right));
    case 'START_WITH':
      return asString(left).startsWith(asString(right));
    case 'NOT_START_WITH':
      return !asString(left).startsWith(asString(right));
    case 'END_WITH':
      return asString(left).endsWith(asString(right));
    case 'NOT_END_WITH':
      return !asString(left).endsWith(asString(right));
    case 'IN':
      return Array.isArray(right) && right.some(item => looseEqual(item, left, type));
    case 'NOT_IN':
      return !(Array.isArray(right) && right.some(item => looseEqual(item, left, type)));
    default:
      return false;
  }
};

const evalBetween = (filter: FilterBetween, entity: any, options?: MatchOptions): boolean => {
  const value = Utilities.getNestedValue(entity, filter.field);
  if (value == null) return false;
  const declared = options?.fieldTypes?.[filter.field];
  // Suy ra date nếu khai báo, hoặc cận dưới trông giống date. Infer date from schema or a date-like bound.
  const type: FilterFieldType | undefined =
    declared ?? (typeof filter.data.from === 'string' && DateUtilities.isDate(filter.data.from) ? 'date' : undefined);
  return compare(value, filter.data.from, type) >= 0 && compare(value, filter.data.to, type) <= 0;
};

const evalNoData = (filter: FilterNoData, entity: any): boolean => {
  const value = Utilities.getNestedValue(entity, filter.field);
  return filter.operator === 'NULL' ? value == null : value != null;
};

const evalAndOr = (filter: FilterAndOr, entity: any, options?: MatchOptions): boolean =>
  filter.operator === 'AND'
    ? filter.data.every(child => evaluate(child, entity, options))
    : filter.data.some(child => evaluate(child, entity, options));

/** Đánh giá một {@link Filter} (có thể lồng) trên `entity`. Evaluate one (possibly nested) {@link Filter}. */
const evaluate = (filter: Filter, entity: any, options?: MatchOptions): boolean => {
  if ('field' in filter) {
    switch (filter.operator) {
      case 'BETWEEN':
        return evalBetween(filter, entity, options);
      case 'NULL':
      case 'NOT_NULL':
        return evalNoData(filter, entity);
      default:
        return evalHasData(filter, entity, options);
    }
  }
  return evalAndOr(filter, entity, options);
};

/**
 * Áp danh sách filter lên một entity trong bộ nhớ, trả về có khớp không. Mảng cấp trên
 * cùng = **AND** ngầm — mọi filter phải đúng. Mảng rỗng/thiếu khớp tất cả.
 *
 * Evaluate a list of filters against an in-memory entity. The top-level array is
 * combined with implicit **AND** — every filter must pass. An empty/missing list
 * matches everything.
 *
 * **Kiểu dữ liệu / typing.** Client không biết kiểu khai báo nên việc nhận diện date là
 * suy luận. Khi vế phải chắc chắn là date (`dataType` date-today/date-relative hoặc operand
 * là `Date`), cả hai vế được ép về epoch ms — xử lý được cả chuỗi ISO lẫn number timestamp
 * (ms/giây). Với các trường hợp filter không tự biết (vd field-vs-field date, hay EQUAL date
 * với literal số), truyền `options.fieldTypes` để eval chính xác tuyệt đối.
 * Date detection is inferred; pass `options.fieldTypes` for exactness when the filter can't tell.
 *
 * @template T - The entity type being filtered.
 * @param filters - Filters to apply (implicit AND across the array).
 * @param entity - The object to test.
 * @param options - Optional `fieldTypes` map for deterministic, type-aware coercion.
 * @returns `true` if the entity satisfies every filter.
 *
 * @example
 * const filters: Filter<Product>[] = [
 *   { field: 'price', operator: 'GREATER_THAN', dataType: 'field', data: 'cost' },
 *   { field: 'createdAt', operator: 'GREATER_OR_EQUAL', dataType: 'date-relative', data: { amount: 7, direction: 'previous', unit: 'day' } },
 * ];
 * FilterUtilities.match(filters, product, { fieldTypes: { createdAt: 'date' } }); // boolean
 */
const match = <T = any>(filters: Filter<T>[], entity: T, options?: MatchOptions<T>): boolean => {
  if (!filters?.length) return true;
  return filters.every(filter => evaluate(filter as Filter, entity, options as MatchOptions));
};

/**
 * Tiện ích đánh giá filter phía client — áp cùng shape `Filter` gửi lên API lên object
 * trong bộ nhớ, kèm constructor + type guard + ép kiểu theo `fieldTypes`.
 * Client-side filter evaluation utilities — apply the same `Filter` shape sent to the
 * API against in-memory objects, with type-aware coercion, a constructor, and a guard.
 *
 * @example
 * import { FilterUtilities } from '@sdcorejs/utils/fns';
 *
 * FilterUtilities.match(filters, row, { fieldTypes: { createdAt: 'date' } }); // boolean
 * const rows = all.filter(r => FilterUtilities.match(filters, r));
 */
export const FilterUtilities = {
  match,
  evaluate,
  resolveData,
  resolveRelativeDate,
  toEpoch,
  relativeDate,
  isDateRelative,
};
