/* eslint-disable @typescript-eslint/no-explicit-any */

export type PlainRecord = Record<string, unknown>;

const isFileInstance = (value: unknown): value is File => typeof File !== 'undefined' && value instanceof File;

/**
 * Exhausts a paginated API endpoint by repeatedly calling `func` until all items are collected.
 *
 * @param func - Async function receiving `(pageSize, pageNumber)` and returning `{ items, total }`.
 *   Page number is 0-based.
 * @param defaultPageSize - Items per page (default 1000).
 * @returns All collected items across all pages.
 *
 * @example
 * const allUsers = await Utilities.fetchAllByPaging(
 *   (pageSize, pageNumber) => userApi.list({ pageSize, pageNumber }),
 *   200
 * );
 */
const fetchAllByPaging = async <T = unknown>(
  func: (pageSize: number, pageNumber: number) => Promise<{ items: T[]; total: number }>,
  defaultPageSize?: number
): Promise<T[]> => {
  const pageSize = defaultPageSize || 1000;
  let pageNumber = 0;
  let count = 0;
  let items: T[] = [];
  while (true) {
    const res = await func(pageSize, pageNumber);
    if (Array.isArray(res?.items) && res?.total > 0) {
      items = [...items, ...res.items];
      count += res.items.length;
      pageNumber++;
      if (count >= res.total || !res.items?.length) {
        return items;
      }
    } else {
      return [];
    }
  }
};

/**
 * Generates a short time-based random ID using base-36 encoding.
 *
 * @param prefix - Optional string prepended with an underscore separator.
 * @returns A unique-enough ID string, not a cryptographic UUID.
 *
 * @example
 * Utilities.randomId()          // 'lf3abc2xy'
 * Utilities.randomId('user')    // 'user_lf3abc2xy'
 */
const randomId = (prefix?: string | null): string => {
  const id = `${new Date().getTime().toString(36)}${Math.random().toString(36).substring(2, 7)}`;
  if (prefix) {
    return `${prefix}_${id}`;
  }
  return id;
};

/**
 * Serializes any value to stable JSON by sorting object keys recursively.
 */
const stableStringify = (obj: any): string => {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (obj instanceof Date) {
    return JSON.stringify(obj.toISOString());
  }

  if (isFileInstance(obj)) {
    return JSON.stringify({
      __type: 'File',
      name: obj.name,
      size: obj.size,
      type: obj.type,
      lastModified: obj.lastModified,
    });
  }

  if (Array.isArray(obj)) {
    return `[${obj.map(stableStringify).join(',')}]`;
  }

  const keys = Object.keys(obj).sort();
  const keyValuePairs = keys.map(key => `${JSON.stringify(key)}:${stableStringify(obj[key])}`);
  return `{${keyValuePairs.join(',')}}`;
};

/**
 * Computes a deterministic djb2 hash of any value, using stable JSON serialization.
 * Useful for change detection and cache keys.
 *
 * @param obj - Any value such as an object, array, primitive, Date, or File.
 * @returns A stable hash string prefixed with `h`, e.g. `h1234567890`.
 *
 * @example
 * Utilities.hash({ a: 1, b: 2 }) // same result regardless of key order
 * Utilities.hash({ b: 2, a: 1 }) // identical to above
 */
const hash = (obj: any): string => {
  const json = stableStringify(obj);
  let hashValue = 0;
  for (let i = 0; i < json.length; i++) {
    hashValue = (hashValue << 5) - hashValue + json.charCodeAt(i);
    hashValue |= 0;
  }
  return `h${Math.abs(hashValue)}`;
};

/**
 * Parses a URL query string into a key-value record.
 *
 * @param queryString - The query string to parse, with or without a leading `?`.
 * @returns A `Record<string, string>` of all key-value pairs.
 *
 * @example
 * Utilities.parseQueryParams('?page=1&size=20') // { page: '1', size: '20' }
 * Utilities.parseQueryParams('q=hello&lang=vi') // { q: 'hello', lang: 'vi' }
 */
const parseQueryParams = (queryString?: string): Record<string, string> => {
  const params = new URLSearchParams(queryString || '');
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
};

/**
 * Generates a UUID v4 string using `crypto.randomUUID()` with a time-based fallback.
 *
 * @returns A UUID-formatted string, or a fallback timestamp-based string in older browsers.
 *
 * @example
 * Utilities.generateUuid() // '550e8400-e29b-41d4-a716-446655440000'
 */
const generateUuid = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Reads a deeply nested value from an object using a dot-separated path string.
 *
 * @param obj - Source object to traverse.
 * @param path - Dot-separated key path, e.g. `user.address.city`.
 * @returns The value at the path, or `undefined` if any segment is missing.
 *
 * @example
 * const obj = { user: { address: { city: 'Hanoi' } } };
 * Utilities.getNestedValue(obj, 'user.address.city') // 'Hanoi'
 * Utilities.getNestedValue(obj, 'user.age')          // undefined
 */
const getNestedValue = (obj: any, path: string) => {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
};

/**
 * Checks whether a value is a plain object literal or a null-prototype record.
 */
const isPlainObject = (value: unknown): value is PlainRecord => {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false;
  }

  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

/**
 * Deeply clones arrays and plain objects. Non-plain object leaves are returned by reference.
 */
const clone = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map(item => clone(item)) as T;
  }

  if (isPlainObject(value)) {
    const out: PlainRecord = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      out[key] = clone(nestedValue);
    }
    return out as T;
  }

  return value;
};

/**
 * Deeply merges plain object keys. `undefined` keeps the default value; all other overrides win.
 */
const merge = <T>(defaultValue: T, overrideValue: T | undefined): T => {
  if (overrideValue === undefined) {
    return clone(defaultValue);
  }

  if (isPlainObject(defaultValue) && isPlainObject(overrideValue)) {
    const out: PlainRecord = {};
    const keys = new Set([...Object.keys(defaultValue), ...Object.keys(overrideValue)]);
    for (const key of keys) {
      out[key] = merge(defaultValue[key], overrideValue[key]);
    }
    return out as T;
  }

  return clone(overrideValue);
};

/**
 * Folds multiple partial objects from left to right using `merge`.
 */
const deepMerge = <T>(...sources: Partial<T>[]): T =>
  sources.reduce<PlainRecord>((acc, source) => merge(acc, source as PlainRecord), {}) as T;

/**
 * Object-focused utilities for stable serialization, hashing, cloning, and deep merging.
 */
export const ObjectUtilities = {
  stableStringify,
  hash,
  parseQueryParams,
  getNestedValue,
  isPlainObject,
  clone,
  merge,
  deepMerge,
};

/**
 * General-purpose utility functions: data fetching helpers, ID generation, hashing,
 * URL parsing, and object traversal.
 *
 * @example
 * import { Utilities } from '@sdcorejs/utils/fns';
 *
 * const id = Utilities.randomId('order');           // 'order_lf3abc2xy'
 * const h = Utilities.hash({ status: 'active' });   // 'h3849201730'
 */
export const Utilities = {
  fetchAllByPaging,
  randomId,
  stableStringify,
  hash,
  parseQueryParams,
  generateUuid,
  getNestedValue,
  isPlainObject,
  clone,
  merge,
  deepMerge,
};
