import type { NestedKeyOf } from './nested-key-of.model';
import type { QueryReq } from './paging.model';

/**
 * Supported aggregate operations over the rows selected by a query.
 *
 * `sum` and `avg` require numeric columns. `min` and `max` require ordered
 * scalar columns. `count` counts rows with `*`, or non-null values with a column.
 * Column compatibility and authorization must be validated by the executor.
 */
export type AggregateOperation = 'sum' | 'count' | 'avg' | 'min' | 'max';

/**
 * One aggregate calculation and its output key.
 *
 * Repeat a field with different operations and aliases to request several
 * calculations in one query. This is a structural contract, not a runtime
 * validator: executors must reject unsupported columns, operations and aliases.
 *
 * @template T - Entity shape used to suggest and check field paths.
 * @example
 * const metric: AggregateMetric<{ amount: number }> = {
 *   field: 'amount', operation: 'sum', alias: 'totalAmount',
 * };
 */
export interface AggregateMetric<T = unknown> {
  /**
   * Entity field to aggregate, or `*` to count all matching rows.
   * `*` is valid only with `count` and without `distinct: true`.
   * Nested paths are type suggestions; the executor decides which are supported.
   */
  field: NestedKeyOf<T> | '*';
  /** Calculation applied to the selected field. */
  operation: AggregateOperation;
  /**
   * Unique key in each response row, distinct from every group key.
   * NestJS requires an ASCII identifier of at most 63 characters and rejects
   * reserved object keys such as `__proto__`, `prototype` and `constructor`.
   */
  alias: string;
  /**
   * Aggregate distinct non-null column values when true; omitted means false.
   * Applies to a column metric, never to `count('*')`.
   */
  distinct?: boolean;
}

/**
 * Aggregate query sharing the filtering contract of {@link QueryReq}.
 *
 * Filters apply before aggregation. Inherited `fields` selects which group
 * keys appear in each row; it never removes metric aliases. Omit `fields` to
 * return all group keys, or pass an empty array to return only the metrics.
 * Non-group fields in that projection must be rejected by the executor.
 *
 * Omit `groupBy` (or use an empty array) for one summary across all matching
 * rows. Grouped results contain one row per group subject to executor limits.
 * The type carries no database, transaction or framework dependencies and
 * does not execute a query or validate untrusted request input.
 *
 * @template T - Entity shape used by filters, projection and metric paths.
 * @example
 * const req: AggregateReq<{ category: string; amount: number }> = {
 *   filters: [{ field: 'amount', operator: 'GREATER_THAN', data: 0 }],
 *   groupBy: ['category'],
 *   aggregates: [
 *     { field: 'amount', operation: 'sum', alias: 'totalAmount' },
 *     { field: 'amount', operation: 'max', alias: 'maxAmount' },
 *     { field: '*', operation: 'count', alias: 'rowCount' },
 *   ],
 * };
 */
export interface AggregateReq<T = unknown> extends QueryReq<T> {
  /**
   * Required calculations with unique aliases. The executor must require at
   * least one metric; NestJS currently accepts at most 32.
   */
  aggregates: readonly AggregateMetric<T>[];
  /**
   * Unique scalar field paths defining groups, in deterministic sort order.
   * NestJS accepts at most eight selectable root columns and sorts ascending,
   * with nulls first. Omitted or empty means no grouping.
   */
  groupBy?: readonly NestedKeyOf<T>[];
}

/**
 * Scalar value returned by an aggregate executor before JSON serialization.
 *
 * Drivers can return `bigint` and `numeric` SQL values as strings, including
 * counts, to preserve precision. Do not coerce them to JavaScript numbers
 * without an explicit precision policy. SQL null remains `null`; native dates
 * become ISO strings when serialized to JSON. This union does not promise
 * that a JSON client will receive a JavaScript Date instance.
 */
export type AggregateValue = string | number | boolean | Date | null;

/**
 * Flat aggregate output keyed by projected group fields and metric aliases.
 *
 * Keys are request-dependent, so the default contract uses a string index.
 * Supply a known row shape to {@link AggregateRes} when an endpoint has a
 * fixed projection and known driver scalar types.
 */
export type AggregateRow = Record<string, AggregateValue>;

/**
 * Aggregate result array without an HTTP envelope or a total group count.
 *
 * An ungrouped query returns one row; empty input yields zero counts and null
 * for the other supported operations. A grouped query returns zero or more
 * rows, and empty input returns an empty array. Group pagination is an
 * executor concern, so this array does not imply that all groups were returned.
 *
 * @template TRow - Known result row shape; defaults to {@link AggregateRow}.
 * @example
 * const res: AggregateRes<{ category: string; rowCount: string }> = [
 *   { category: 'books', rowCount: '2' },
 * ];
 */
export type AggregateRes<TRow = AggregateRow> = TRow[];
