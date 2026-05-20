import { NestedKeyOf } from './nested-key-of.model';

/**
 * Describes a single sort criterion for a paginated query.
 *
 * Pass an array of `Order` objects to `PagingReq.orders` to apply multi-column sorting.
 *
 * @template T - The entity type being sorted (e.g. `Product`).
 *
 * @example
 * const order: Order<Product> = { field: 'createdAt', direction: 'DESC' };
 * // Sort products newest-first
 */
export interface Order<T = any> {
  /** Dot-notation path of the field to sort by (e.g. `'address.city'`). */
  field: NestedKeyOf<T>;
  /** `'ASC'` for ascending, `'DESC'` for descending order. */
  direction: 'ASC' | 'DESC';
}
