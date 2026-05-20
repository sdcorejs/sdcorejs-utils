/**
 * Full union of all supported filter operators — combines operators that require a value
 * and operators that check for the presence/absence of data.
 *
 * @example
 * const op: Operator = 'EQUAL';
 * const nullOp: Operator = 'NOT_NULL';
 */
export type Operator = OperatorHasData | OperatorNoData;

/**
 * Filter operators that require an accompanying `data` value to evaluate against.
 *
 * - `EQUAL` / `NOT_EQUAL` — exact match / mismatch
 * - `CONTAIN` / `NOT_CONTAIN` — substring / non-substring match
 * - `IN` / `NOT_IN` — membership in a set
 * - `START_WITH` / `END_WITH` — prefix / suffix match
 * - `GREATER_THAN` / `LESS_THAN` — strict numeric / date comparison
 * - `GREATER_OR_EQUAL` / `LESS_OR_EQUAL` — inclusive numeric / date comparison
 * - `BETWEEN` — inclusive range check (use `FilterBetween` for the `{ from, to }` shape)
 *
 * @example
 * const op: OperatorHasData = 'GREATER_THAN';
 */
export type OperatorHasData =
  | 'EQUAL'
  | 'NOT_EQUAL'
  | 'CONTAIN'
  | 'NOT_CONTAIN'
  | 'IN'
  | 'NOT_IN'
  | 'START_WITH'
  | 'END_WITH'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'GREATER_OR_EQUAL'
  | 'LESS_OR_EQUAL'
  | 'BETWEEN';

/**
 * Filter operators that do **not** require a `data` value — they test field presence only.
 *
 * - `NULL` — field is null or undefined
 * - `NOT_NULL` — field has a non-null value
 *
 * @example
 * const op: OperatorNoData = 'NOT_NULL';
 */
export type OperatorNoData = 'NULL' | 'NOT_NULL';
