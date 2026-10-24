/* eslint-disable @typescript-eslint/no-explicit-any */
import { CircularReferenceError, ValidationError } from '../errors';
import { getOwnPropertyPath, resolveOwnPropertyPath } from '../internal/property-path';
import { assertSafeObjectKey, defineSafeDataProperty } from '../internal/security';
import { StringUtilities } from './string.fns';

/** Options for bounded tree search. */
export interface ArraySearchOptions {
  /**
   * Maximum child depth, default 100, with root items at depth 0. Must be a positive safe
   * integer. Enforced only during an active nonempty search; a visited nonempty child array
   * beyond the limit throws ValidationError. A match can short-circuit deeper traversal.
   */
  maxDepth?: number;
}

const validateMaxDepth = (value: number | undefined): number => {
  const maxDepth = value ?? 100;
  if (!Number.isSafeInteger(maxDepth) || maxDepth <= 0) {
    throw new ValidationError('maxDepth must be a positive safe integer');
  }
  return maxDepth;
};

type OwnDataArrayElement<T> =
  | { found: false }
  | { found: true; value: T };

const readOwnDataArrayElement = <T>(items: readonly T[], index: number): OwnDataArrayElement<T> => {
  const descriptor = Object.getOwnPropertyDescriptor(items, index);
  if (!descriptor || !Object.hasOwn(descriptor, 'value')) return { found: false };
  return { found: true, value: descriptor.value as T };
};

const matchesFields = (
  item: unknown,
  searchText: unknown,
  fields: readonly string[],
): boolean => {
  if (fields.length === 0) return item !== undefined && item !== null && StringUtilities.aliasIncludes(item, searchText);
  return fields.some(field => {
    const value = getOwnPropertyPath(item, field);
    return value !== undefined && value !== null && StringUtilities.aliasIncludes(value, searchText);
  });
};

const treeContainsMatch = (
  root: unknown,
  searchText: unknown,
  fields: readonly string[],
  childrenPath: string | undefined,
  maxDepth: number,
): boolean => {
  type Frame = { node: unknown; depth: number; exit: boolean };
  const active = new WeakSet<object>();
  const stack: Frame[] = [{ node: root, depth: 0, exit: false }];

  while (stack.length > 0) {
    const frame = stack.pop() as Frame;
    const objectNode = (typeof frame.node === 'object' || typeof frame.node === 'function') && frame.node !== null
      ? frame.node as object
      : undefined;
    if (frame.exit) {
      if (objectNode) active.delete(objectNode);
      continue;
    }
    if (objectNode) {
      if (active.has(objectNode)) throw new CircularReferenceError('array search tree');
      active.add(objectNode);
      stack.push({ ...frame, exit: true });
    }
    if (matchesFields(frame.node, searchText, fields)) return true;
    if (!childrenPath || !objectNode) continue;
    const resolution = resolveOwnPropertyPath(objectNode, childrenPath);
    if (!resolution.found || resolution.value === undefined || resolution.value === null) continue;
    if (!Array.isArray(resolution.value)) {
      throw new ValidationError(`children path ${JSON.stringify(childrenPath)} must resolve to an array`);
    }
    if (resolution.value.length === 0) continue;
    if (frame.depth >= maxDepth) throw new ValidationError(`array search exceeded maxDepth (${maxDepth})`);
    for (let index = resolution.value.length - 1; index >= 0; index--) {
      const child = readOwnDataArrayElement(resolution.value, index);
      if (!child.found) continue;
      stack.push({ node: child.value, depth: frame.depth + 1, exit: false });
    }
  }
  return false;
};

/**
 * Searches values or selected own-property fields without changing the input tree.
 *
 * Matching uses `StringUtilities.aliasIncludes`: case-insensitive Vietnamese accent
 * folding and punctuation normalization. A matching descendant retains its original
 * root item; descendants are not pruned or cloned. Input order is preserved.
 * Own data properties are read without invoking getters. Sparse slots are skipped
 * during an active search; an empty search returns the original array unchanged.
 *
 * @typeParam T - Item type preserved in the returned root items.
 * @param items - Root items. Empty/non-array runtime inputs are returned unchanged.
 * @param searchText - Text coerced with `toString`; nullish/empty text disables filtering.
 * @param fields - One or more dot/bracket paths; omitted/empty means match the item itself.
 * @param children - Optional own-property path to each node's child array.
 * @param options - Traversal limits; `maxDepth` defaults to 100 and must be a positive safe integer.
 * @returns A new matching-root array, or the original input when search is disabled/empty.
 * @throws {UnsafePropertyPathError} If a traversed property path is malformed or unsafe.
 * @throws {UnsafeObjectKeyError} If a supplied field/child key is prototype-sensitive.
 * @throws {CircularReferenceError} If the visited ancestor chain contains a cycle.
 * @throws {ValidationError} If child data is not an array or traversal exceeds its limit.
 * @example
 * ArrayUtilities.search([{ name: 'Đà Nẵng' }, { name: 'Huế' }], 'da nang', 'name');
 * // [{ name: 'Đà Nẵng' }]
 */
const search = <T = any>(
  items: T[],
  searchText: any,
  fields?: (string | undefined) | (string | undefined)[],
  children?: string,
  options: ArraySearchOptions = {},
): T[] => {
  if (!searchText?.toString()) return items;
  if (!Array.isArray(items) || items.length === 0) return items;
  const normalizedFields: string[] = [];
  if (Array.isArray(fields)) {
    for (let index = 0; index < fields.length; index++) {
      const field = readOwnDataArrayElement(fields, index);
      if (field.found && typeof field.value === 'string' && field.value.length > 0) {
        normalizedFields.push(field.value);
      }
    }
  } else if (typeof fields === 'string' && fields.length > 0) {
    normalizedFields.push(fields);
  }
  normalizedFields.forEach(assertSafeObjectKey);
  if (children) assertSafeObjectKey(children);
  const maxDepth = validateMaxDepth(options.maxDepth);
  const result: T[] = [];
  for (let index = 0; index < items.length; index++) {
    const item = readOwnDataArrayElement(items, index);
    if (item.found && treeContainsMatch(item.value, searchText, normalizedFields, children, maxDepth)) {
      result.push(item.value);
    }
  }
  return result;
};

/**
 * Combines arrays in input order, retaining the first item for each key value.
 *
 * Key values use Set/SameValueZero equality, so object-valued keys compare by
 * reference and `NaN` keys compare equal. Missing keys resolve to `undefined` and
 * therefore share one bucket. Items are neither cloned nor mutated.
 *
 * @typeParam T - Item type shared by the supplied arrays.
 * @param key - Own dot/bracket property path used to identify each item.
 * @param args - Arrays to merge; nullish/non-array inputs and nullish items are skipped.
 * @returns A new array containing the original first-occurrence item references.
 * @throws {UnsafeObjectKeyError} If the key is prototype-sensitive.
 * @throws {UnsafePropertyPathError} If the property path is malformed or unsafe.
 * @example
 * ArrayUtilities.union('id', [{ id: 1, name: 'first' }], [{ id: 1, name: 'later' }, { id: 2 }]);
 * // [{ id: 1, name: 'first' }, { id: 2 }]
 */
const union = <T = unknown>(key: string, ...args: (T[] | undefined | null)[]): T[] => {
  assertSafeObjectKey(key);
  const result: T[] = [];
  const seen = new Set<unknown>();
  for (const values of args) {
    if (!Array.isArray(values)) continue;
    for (const item of values) {
      if (item === undefined || item === null) continue;
      const itemKey = getOwnPropertyPath(item, key);
      if (seen.has(itemKey)) continue;
      seen.add(itemKey);
      result.push(item);
    }
  }
  return result;
};

/**
 * Indexes items by an own-property path, with the last duplicate key winning.
 *
 * Resolved key values are converted to strings. Nullish items and nullish key values
 * are skipped; empty-string keys are retained. Values remain the original references.
 * Only own data properties are traversed; getters and inherited values are skipped.
 *
 * @typeParam T - Type of each indexed value.
 * @param key - Dot/bracket path to the property's indexing value.
 * @param items - Input items; nullish/non-array inputs produce an empty record.
 * @returns A new ordinary object containing enumerable own data properties.
 * @throws {UnsafeObjectKeyError} If an input or generated object key is prototype-sensitive.
 * @throws {UnsafePropertyPathError} If a traversed path is malformed or unsafe.
 * @example
 * ArrayUtilities.toObject('id', [{ id: 'a', value: 1 }, { id: 'a', value: 2 }]);
 * // { a: { id: 'a', value: 2 } }
 */
const toObject = <T>(key: string, items: T[] | undefined | null): Record<string, T> => {
  assertSafeObjectKey(key);
  const result: Record<string, T> = {};
  if (!Array.isArray(items)) return result;
  for (const item of items) {
    if (item === undefined || item === null) continue;
    const value = getOwnPropertyPath(item, key);
    if (value === undefined || value === null) continue;
    const objectKey = String(value);
    assertSafeObjectKey(objectKey);
    defineSafeDataProperty(result, objectKey, item);
  }
  return result;
};

/**
 * Returns first occurrences using Set/SameValueZero equality and stable ordering.
 *
 * Objects are compared by reference, not content. `NaN` values collapse into one;
 * `0` and `-0` share a bucket. Array holes are visited as `undefined` by Set.
 *
 * @typeParam T - Element type retained in the result.
 * @param items - Source array; nullish/non-array inputs produce `[]`.
 * @returns A new array; the input and its element objects are not mutated or cloned.
 * @example
 * ArrayUtilities.distinct([1, 1, 2, NaN, NaN]); // [1, 2, NaN]
 */
const distinct = <T = any>(items: T[] | undefined | null): T[] =>
  Array.isArray(items) ? [...new Set(items)] : [];

/**
 * Copies one zero-based page without mutating the source array.
 *
 * This is in-memory slicing, not a network request. A page beyond the end returns
 * `[]`; a partial last page is allowed. Sparse slots remain sparse and item references
 * are preserved. Size/page validation occurs even when the input is nullish.
 *
 * @typeParam T - Element type retained in the page.
 * @param items - Source array; nullish/non-array inputs return `[]` after validation.
 * @param pageSize - Positive safe integer number of elements per page.
 * @param page - Nonnegative safe integer page index; defaults to 0.
 * @returns A new slice containing at most `pageSize` elements.
 * @throws {ValidationError} If size/index is invalid or their product exceeds the safe integer range.
 * @example
 * ArrayUtilities.paging(['a', 'b', 'c'], 2, 1); // ['c']
 */
const paging = <T = any>(
  items: T[] | undefined | null,
  pageSize: number,
  page?: number,
): T[] => {
  if (!Number.isSafeInteger(pageSize) || pageSize <= 0) {
    throw new ValidationError('pageSize must be a positive safe integer');
  }
  const pageNumber = page ?? 0;
  if (!Number.isSafeInteger(pageNumber) || pageNumber < 0) {
    throw new ValidationError('page must be a non-negative safe integer');
  }
  const offset = pageNumber * pageSize;
  if (!Number.isSafeInteger(offset)) throw new ValidationError('paging offset exceeds the safe integer range');
  if (!Array.isArray(items)) return [];
  return items.slice(offset, offset + pageSize);
};

/**
 * Stable array search, keyed union/indexing, deduplication and zero-based pagination.
 *
 * Functions preserve source data and document when result arrays retain original
 * references. Tree/property-path operations validate unsafe keys and traversal limits.
 *
 * @example
 * import { ArrayUtilities } from '@sdcorejs/utils/fns';
 * ArrayUtilities.distinct(['a', 'a', 'b']); // ['a', 'b']
 */
export const ArrayUtilities = {
  /**
   * Searches values or selected own-property fields without changing the input tree.
   *
   * Matching uses `StringUtilities.aliasIncludes`: case-insensitive Vietnamese accent
   * folding and punctuation normalization. A matching descendant retains its original
   * root item; descendants are not pruned or cloned. Input order is preserved.
   * Own data properties are read without invoking getters. Sparse slots are skipped
   * during an active search; an empty search returns the original array unchanged.
   *
   * @typeParam T - Item type preserved in the returned root items.
   * @param items - Root items. Empty/non-array runtime inputs are returned unchanged.
   * @param searchText - Text coerced with `toString`; nullish/empty text disables filtering.
   * @param fields - One or more dot/bracket paths; omitted/empty means match the item itself.
   * @param children - Optional own-property path to each node's child array.
   * @param options - Traversal limits; `maxDepth` defaults to 100 and must be a positive safe integer.
   * @returns A new matching-root array, or the original input when search is disabled/empty.
   * @throws {UnsafePropertyPathError} If a traversed property path is malformed or unsafe.
   * @throws {UnsafeObjectKeyError} If a supplied field/child key is prototype-sensitive.
   * @throws {CircularReferenceError} If the visited ancestor chain contains a cycle.
   * @throws {ValidationError} If child data is not an array or traversal exceeds its limit.
   * @example
   * ArrayUtilities.search([{ name: 'Đà Nẵng' }, { name: 'Huế' }], 'da nang', 'name');
   * // [{ name: 'Đà Nẵng' }]
   */
  search,
  /**
   * Combines arrays in input order, retaining the first item for each key value.
   *
   * Key values use Set/SameValueZero equality, so object-valued keys compare by
   * reference and `NaN` keys compare equal. Missing keys resolve to `undefined` and
   * therefore share one bucket. Items are neither cloned nor mutated.
   *
   * @typeParam T - Item type shared by the supplied arrays.
   * @param key - Own dot/bracket property path used to identify each item.
   * @param args - Arrays to merge; nullish/non-array inputs and nullish items are skipped.
   * @returns A new array containing the original first-occurrence item references.
   * @throws {UnsafeObjectKeyError} If the key is prototype-sensitive.
   * @throws {UnsafePropertyPathError} If the property path is malformed or unsafe.
   * @example
   * ArrayUtilities.union('id', [{ id: 1, name: 'first' }], [{ id: 1, name: 'later' }, { id: 2 }]);
   * // [{ id: 1, name: 'first' }, { id: 2 }]
   */
  union,
  /**
   * Indexes items by an own-property path, with the last duplicate key winning.
   *
   * Resolved key values are converted to strings. Nullish items and nullish key values
   * are skipped; empty-string keys are retained. Values remain the original references.
   * Only own data properties are traversed; getters and inherited values are skipped.
   *
   * @typeParam T - Type of each indexed value.
   * @param key - Dot/bracket path to the property's indexing value.
   * @param items - Input items; nullish/non-array inputs produce an empty record.
   * @returns A new ordinary object containing enumerable own data properties.
   * @throws {UnsafeObjectKeyError} If an input or generated object key is prototype-sensitive.
   * @throws {UnsafePropertyPathError} If a traversed path is malformed or unsafe.
   * @example
   * ArrayUtilities.toObject('id', [{ id: 'a', value: 1 }, { id: 'a', value: 2 }]);
   * // { a: { id: 'a', value: 2 } }
   */
  toObject,
  /**
   * Returns first occurrences using Set/SameValueZero equality and stable ordering.
   *
   * Objects are compared by reference, not content. `NaN` values collapse into one;
   * `0` and `-0` share a bucket. Array holes are visited as `undefined` by Set.
   *
   * @typeParam T - Element type retained in the result.
   * @param items - Source array; nullish/non-array inputs produce `[]`.
   * @returns A new array; the input and its element objects are not mutated or cloned.
   * @example
   * ArrayUtilities.distinct([1, 1, 2, NaN, NaN]); // [1, 2, NaN]
   */
  distinct,
  /**
   * Copies one zero-based page without mutating the source array.
   *
   * This is in-memory slicing, not a network request. A page beyond the end returns
   * `[]`; a partial last page is allowed. Sparse slots remain sparse and item references
   * are preserved. Size/page validation occurs even when the input is nullish.
   *
   * @typeParam T - Element type retained in the page.
   * @param items - Source array; nullish/non-array inputs return `[]` after validation.
   * @param pageSize - Positive safe integer number of elements per page.
   * @param page - Nonnegative safe integer page index; defaults to 0.
   * @returns A new slice containing at most `pageSize` elements.
   * @throws {ValidationError} If size/index is invalid or their product exceeds the safe integer range.
   * @example
   * ArrayUtilities.paging(['a', 'b', 'c'], 2, 1); // ['c']
   */
  paging,
};
