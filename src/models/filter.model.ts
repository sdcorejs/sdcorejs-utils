import { NestedKeyOf } from './nested-key-of.model';
import { OperatorHasData, OperatorNoData } from './operator.model';

/**
 * Discriminated union of all filter variants that can be sent to a query endpoint.
 * Union các biến thể filter gửi lên endpoint truy vấn.
 *
 * Use `FilterHasData` for single-value comparisons, `FilterBetween` for range checks,
 * `FilterNoData` for null checks, and `FilterAndOr` to compose filters logically.
 *
 * @template T - The entity type being filtered (e.g. `Product`).
 *
 * @example
 * const filter: Filter<Product> = {
 *   operator: 'AND',
 *   data: [
 *     { field: 'name', operator: 'CONTAIN', data: 'phone' },
 *     { field: 'price', operator: 'BETWEEN', data: { from: 100, to: 500 } },
 *   ],
 * };
 */
export type Filter<T = any> = FilterHasData<T> | FilterBetween<T> | FilterNoData<T> | FilterAndOr<T>;

/**
 * Cách diễn giải `data` của một filter đơn-trị — trường `dataType` đặt **cùng cấp** với `data`.
 * How a single-value filter's `data` is interpreted — the `dataType` field sits **beside** `data`.
 *
 * - `'absolute'`      — (mặc định / default) `data` là giá trị literal.
 * - `'field'`         — `data` là `NestedKeyOf<T>`: so sánh field với một field khác cùng entity.
 * - `'date-today'`    — `data` là hằng `'TODAY'`: resolve thành đầu ngày hôm nay (midnight).
 * - `'date-relative'` — `data` là {@link DateRelative}: mốc tương đối (hôm nay/bây giờ ± amount×unit).
 */
export type FilterDataType = 'absolute' | 'field' | 'date-today' | 'date-relative';

/**
 * Mốc thời gian tương đối, được resolve thành `Date` tại thời điểm đánh giá.
 * A relative date spec, resolved to a concrete `Date` at evaluation time.
 *
 * Neo (anchor) ngầm định: `hour` neo theo "bây giờ"; `day`/`week`/`month` neo theo đầu ngày hôm nay.
 * Implicit anchor: `hour` is relative to "now"; `day`/`week`/`month` to the start of today.
 *
 * @example
 * // 3 ngày trước / 3 days ago
 * const d: DateRelative = { amount: 3, direction: 'previous', unit: 'day' };
 */
export interface DateRelative {
  /** Độ lớn offset (>= 1). Offset magnitude. */
  amount: number;
  /** Lùi quá khứ (`previous`) hay tiến tương lai (`next`). Into the past or the future. */
  direction: 'previous' | 'next';
  /** Đơn vị offset. Offset unit. */
  unit: 'hour' | 'day' | 'week' | 'month';
}

/** Giá trị literal thuần — hành vi `dataType: 'absolute'`. A plain literal value (the `'absolute'` case). */
export type FilterLiteral = string | number | boolean | Date | null | undefined | Array<string | number | boolean>;

/** Trường chung cho mọi filter đơn-trị. Shared fields for every single-value filter. */
interface FilterHasDataBase<T = any> {
  /** Dot-notation path of the field to filter on (e.g. `'address.city'`). */
  field: NestedKeyOf<T>;
  /** Comparison operator — all `OperatorHasData` values except `'BETWEEN'`. */
  operator: Exclude<OperatorHasData, 'BETWEEN'>;
}

/** `dataType: 'absolute'` (mặc định / default) — `data` là literal. `data` is a literal value. */
export interface FilterHasDataAbsolute<T = any> extends FilterHasDataBase<T> {
  /** Bỏ trống = `'absolute'`. Omitted means `'absolute'`. */
  dataType?: 'absolute';
  /** Giá trị literal để so sánh. The literal value to compare against. */
  data: FilterLiteral;
}

/** `dataType: 'field'` — so sánh field với field khác (vd `price > cost`). Compare two fields. */
export interface FilterHasDataField<T = any> extends FilterHasDataBase<T> {
  dataType: 'field';
  /** Path của field dùng làm vế phải. Dot-notation path of the field used as the operand. */
  data: NestedKeyOf<T>;
}

/** `dataType: 'date-today'` — vế phải là đầu ngày hôm nay. The operand is the start of today. */
export interface FilterHasDataToday<T = any> extends FilterHasDataBase<T> {
  dataType: 'date-today';
  /** Hằng cố định. Fixed sentinel. */
  data: 'TODAY';
}

/** `dataType: 'date-relative'` — vế phải là mốc tương đối. The operand is a {@link DateRelative}. */
export interface FilterHasDataRelative<T = any> extends FilterHasDataBase<T> {
  dataType: 'date-relative';
  /** Spec ngày tương đối. The relative-date spec. */
  data: DateRelative;
}

/**
 * Filter cho mọi toán tử đơn-trị (tất cả `OperatorHasData` trừ `BETWEEN`).
 * `dataType` (cùng cấp `data`) quyết định cách đọc `data`; vắng mặt = `'absolute'`.
 *
 * Filter for all single-value operators (everything except `BETWEEN`). The
 * `dataType` sibling decides how `data` is read; absent means `'absolute'`.
 *
 * @template T - The entity type being filtered.
 *
 * @example
 * // literal (mặc định) / literal (default)
 * const a: FilterHasData<Product> = { field: 'category', operator: 'EQUAL', data: 'electronics' };
 * // field vs field
 * const b: FilterHasData<Product> = { field: 'price', operator: 'GREATER_THAN', dataType: 'field', data: 'cost' };
 * // hôm nay / today
 * const c: FilterHasData<Order> = { field: 'createdAt', operator: 'GREATER_OR_EQUAL', dataType: 'date-today', data: 'TODAY' };
 * // 7 ngày trước / 7 days ago
 * const d: FilterHasData<Order> = { field: 'createdAt', operator: 'GREATER_OR_EQUAL', dataType: 'date-relative', data: { amount: 7, direction: 'previous', unit: 'day' } };
 */
export type FilterHasData<T = any> =
  | FilterHasDataAbsolute<T>
  | FilterHasDataField<T>
  | FilterHasDataToday<T>
  | FilterHasDataRelative<T>;

/**
 * Filter for the `BETWEEN` operator, which checks an inclusive range.
 * Filter cho toán tử `BETWEEN` — kiểm tra khoảng đóng.
 *
 * @template T - The entity type being filtered.
 *
 * @example
 * const f: FilterBetween<Order> = {
 *   field: 'createdAt',
 *   operator: 'BETWEEN',
 *   data: { from: '2024-01-01', to: '2024-12-31' },
 * };
 */
export interface FilterBetween<T = any> {
  /** Dot-notation path of the field to filter on. */
  field: NestedKeyOf<T>;
  operator: 'BETWEEN';
  /** Inclusive lower and upper bounds for the range check. */
  data: {
    /** Lower bound (inclusive). */
    from: string | number;
    /** Upper bound (inclusive). */
    to: string | number;
  };
}

/**
 * Filter for null-presence operators that require no comparison value.
 * Filter cho toán tử kiểm tra null, không cần giá trị so sánh.
 *
 * @template T - The entity type being filtered.
 *
 * @example
 * const f: FilterNoData<User> = { field: 'deletedAt', operator: 'NULL' };
 */
export interface FilterNoData<T = any> {
  /** Dot-notation path of the field to check for null/non-null. */
  field: NestedKeyOf<T>;
  /** `'NULL'` or `'NOT_NULL'`. */
  operator: OperatorNoData;
}

/**
 * Logical grouping filter that combines multiple child filters with `AND` or `OR`.
 * Filter nhóm logic, kết hợp nhiều filter con bằng `AND` hoặc `OR`.
 *
 * @template T - The entity type being filtered.
 *
 * @example
 * const f: FilterAndOr<Product> = {
 *   operator: 'OR',
 *   data: [
 *     { field: 'status', operator: 'EQUAL', data: 'active' },
 *     { field: 'status', operator: 'EQUAL', data: 'pending' },
 *   ],
 * };
 */
export interface FilterAndOr<T = any> {
  /** Logical operator that joins all entries in `data`. */
  operator: 'AND' | 'OR';
  /** Child filters to combine. Each entry may itself be a `FilterAndOr` for nesting. */
  data: Filter<T>[];
}

/**
 * Kiểu dữ liệu khai báo của một field, dùng cho việc eval phía client ép kiểu chính xác.
 * Declared value type of a field, used for exact type-aware client-side evaluation.
 *
 * Cần thiết vì client thường không biết kiểu thực: vd date có thể về dạng `Date`, chuỗi ISO,
 * hay number timestamp. Khai báo `'date'` để cả hai vế được ép về epoch ms khi so sánh.
 * Needed because the client rarely knows the real type — a date may arrive as a `Date`, an
 * ISO string, or a numeric timestamp. Declaring `'date'` coerces both sides to epoch ms.
 */
export type FilterFieldType = 'string' | 'number' | 'boolean' | 'date';

/**
 * Tuỳ chọn cho việc eval filter phía client. Options for client-side filter evaluation.
 *
 * @template T - The entity type being filtered.
 */
export interface MatchOptions<T = any> {
  /**
   * Bản đồ `field path → kiểu`. Field-path → declared-type map.
   *
   * Caller nào biết kiểu (query-builder qua `SdQueryBuilderField.type`, form-generic qua
   * `Attribute.type`) nên truyền vào để loại bỏ hoàn toàn việc đoán kiểu khi so sánh —
   * đặc biệt cho date trả về dạng number timestamp, hoặc so sánh field-với-field.
   * Pass this when the caller knows the types to remove all guessing — especially for dates
   * returned as numeric timestamps, or field-to-field comparisons.
   */
  fieldTypes?: Partial<Record<NestedKeyOf<T> & string, FilterFieldType>>;
}
