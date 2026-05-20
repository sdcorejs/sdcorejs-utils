import { NestedKeyOf } from './nested-key-of.model';
import { OperatorHasData, OperatorNoData } from './operator.model';

/**
 * Discriminated union of all filter variants that can be sent to a query endpoint.
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
 * Filter for all single-value operators (everything except `BETWEEN`, `NULL`, and `NOT_NULL`).
 *
 * @template T - The entity type being filtered.
 *
 * @example
 * const f: FilterHasData<Product> = { field: 'category', operator: 'EQUAL', data: 'electronics' };
 */
export interface FilterHasData<T = any> {
  /** Dot-notation path of the field to filter on (e.g. `'address.city'`). */
  field: NestedKeyOf<T>;
  /** Comparison operator — all `OperatorHasData` values except `'BETWEEN'`. */
  operator: Exclude<OperatorHasData, 'BETWEEN'>;
  /** The value to compare the field against. */
  data: any;
}

/**
 * Filter for the `BETWEEN` operator, which checks an inclusive range.
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
