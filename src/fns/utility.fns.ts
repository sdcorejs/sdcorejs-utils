import {
  PagingLimitError,
  PagingResponseError,
  SecureRandomUnavailableError,
  ValidationError,
} from '../errors';
import {
  PropertyPathOptions,
  getOwnPropertyPath,
} from '../internal/property-path';
import {
  assertSafeEnumerableOwnKeys,
  assertSafeObjectKey,
  createSafeRecord,
  defineSafeDataProperty,
} from '../internal/security';
import {
  canonicalStringify,
  hash,
  hash32,
  sha256Blob,
  sha256Canonical,
  stableStringify,
} from './serialization.fns';

export type { PropertyPathOptions } from '../internal/property-path';

/**
 * String-keyed record whose values must be narrowed before use. This is a compile-time
 * shape only: use {@link isPlainObject} to check prototypes at runtime. Symbol keys are
 * outside this type's index signature.
 */
export type PlainRecord = Record<string, unknown>;

/** Options for bounded clone and merge traversal. */
export interface ObjectTraversalOptions {
  /**
   * Maximum recursive depth, with the root at depth 0. Defaults to 1,000;
   * must be a positive safe integer. Exceeding the limit throws {@link ValidationError}.
   */
  maxDepth?: number;
}

const DEFAULT_OBJECT_MAX_DEPTH = 1_000;

const objectMaxDepth = (options: ObjectTraversalOptions): number => {
  const maxDepth = options.maxDepth ?? DEFAULT_OBJECT_MAX_DEPTH;
  if (!Number.isSafeInteger(maxDepth) || maxDepth <= 0) {
    throw new ValidationError('maxDepth must be a positive safe integer');
  }
  return maxDepth;
};

/** Options controlling bounded offset pagination. */
export interface FetchAllByPagingOptions {
  /**
   * Maximum number of sequential requests, including page 0. Defaults to 10,000;
   * must be a positive safe integer. Exceeding the cap rejects with {@link PagingLimitError}.
   */
  maxPages?: number;
  /**
   * Optional cancellation signal, raced against each page request and passed as the
   * callback's third argument. Abort rejects with `signal.reason` when present.
   * The callback must honor the signal to cancel its transport; racing alone cannot stop the network request.
   */
  signal?: AbortSignal;
  /**
   * How to handle totals changing after page 0. Defaults to `'error'`, which rejects.
   * `'latest'` adopts each new total, but still rejects totals below the collected count,
   * overfull responses, and empty pages that cannot reach the total.
   */
  totalChangePolicy?: 'error' | 'latest';
}

const assertPositiveSafeInteger = (value: number, label: string): void => {
  if (!Number.isSafeInteger(value) || value <= 0) throw new ValidationError(`${label} must be a positive safe integer`);
};

const throwIfAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) throw signal.reason ?? new ValidationError('Pagination was aborted');
};

const awaitPageWithAbort = <T>(request: PromiseLike<T>, signal?: AbortSignal): Promise<T> => {
  if (!signal) return Promise.resolve(request);
  if (signal.aborted) return Promise.reject(signal.reason ?? new ValidationError('Pagination was aborted'));

  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const cleanup = (): void => signal.removeEventListener('abort', onAbort);
    const onAbort = (): void => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(signal.reason ?? new ValidationError('Pagination was aborted'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
    if (signal.aborted) {
      onAbort();
      return;
    }
    void Promise.resolve(request).then(
      value => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(value);
      },
      error => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      },
    );
  });
};

/**
 * Exhausts a strictly zero-based paginated endpoint and returns all items in order.
 * Responses are validated on every page; later failures throw instead of discarding
 * already fetched data. Callback requests always start at page `0` and increment
 * consecutively. Duplicate item values remain lossless because a repeated payload is
 * not proof that an offset endpoint repeated the same logical page. Termination is
 * bounded by the declared total, empty-page checks, the safe page range, and `maxPages`.
 * When configured, the abort signal races each page promise and is passed to the
 * callback for transport cancellation.
 *
 * @typeParam T - Item type, returned by reference without cloning or deduplication.
 * @param func - Sequential page loader receiving `(pageSize, pageNumber, signal?)`.
 *   Return an items array no longer than pageSize and a nonnegative safe-integer total.
 * @param defaultPageSize - Positive safe integer requested on every page; defaults to 1,000.
 * @param options - Request cap, abort signal, and total-change policy.
 * @returns A Promise of all items in page order. Failures reject without returning a partial array.
 * @throws {ValidationError} Rejects invalid options or a non-callable loader.
 * @throws {PagingResponseError} Rejects malformed/inconsistent responses or lack of progress.
 * @throws {PagingLimitError} Rejects if the request cap or safe page-number range is exceeded.
 * @throws Rejects loader failures and abort reasons unchanged.
 * @example
 * const all = await fetchAllByPaging(async (pageSize, pageNumber) => ({
 *   items: [1, 2, 3].slice(pageNumber * pageSize, (pageNumber + 1) * pageSize),
 *   total: 3,
 * }), 2); // [1, 2, 3]
 */
export const fetchAllByPaging = async <T = unknown>(
  func: (
    pageSize: number,
    pageNumber: number,
    signal?: AbortSignal,
  ) => Promise<{ items: T[]; total: number }>,
  defaultPageSize = 1000,
  options: FetchAllByPagingOptions = {},
): Promise<T[]> => {
  if (typeof func !== 'function') throw new ValidationError('func must be callable');
  assertPositiveSafeInteger(defaultPageSize, 'pageSize');
  const maxPages = options.maxPages ?? 10_000;
  assertPositiveSafeInteger(maxPages, 'maxPages');
  if (options.totalChangePolicy !== undefined &&
      options.totalChangePolicy !== 'error' &&
      options.totalChangePolicy !== 'latest') {
    throw new ValidationError("totalChangePolicy must be 'error' or 'latest'");
  }
  const totalChangePolicy = options.totalChangePolicy ?? 'error';
  let pageNumber = 0;

  const collected: T[] = [];
  let expectedTotal: number | undefined;
  for (let pagesFetched = 0; ; pagesFetched++, pageNumber++) {
    throwIfAborted(options.signal);
    if (pagesFetched >= maxPages) throw new PagingLimitError(`Pagination exceeded maxPages (${maxPages})`);
    if (!Number.isSafeInteger(pageNumber)) throw new PagingLimitError('Pagination exceeded the safe page-number range');
    const request = options.signal === undefined
      ? func(defaultPageSize, pageNumber)
      : func(defaultPageSize, pageNumber, options.signal);
    const response = await awaitPageWithAbort(request, options.signal);
    throwIfAborted(options.signal);
    if (!response || !Array.isArray(response.items)) {
      throw new PagingResponseError(`Page ${pageNumber} did not return an items array`);
    }
    if (!Number.isFinite(response.total) || response.total < 0 || !Number.isSafeInteger(response.total)) {
      throw new PagingResponseError(`Page ${pageNumber} returned an invalid total`);
    }
    if (response.items.length > defaultPageSize) {
      throw new PagingResponseError(`Page ${pageNumber} returned more than pageSize items`);
    }

    if (expectedTotal === undefined) expectedTotal = response.total;
    else if (response.total !== expectedTotal) {
      if (totalChangePolicy === 'error') {
        throw new PagingResponseError(`Page ${pageNumber} changed total from ${expectedTotal} to ${response.total}`);
      }
      expectedTotal = response.total;
    }

    const reachableTotal = expectedTotal;
    if (collected.length > reachableTotal) {
      throw new PagingResponseError(`Page ${pageNumber} changed total below the number of collected items`);
    }
    if (reachableTotal === 0) {
      if (response.items.length > 0) throw new PagingResponseError(`Page ${pageNumber} returned items beyond total ${expectedTotal}`);
      return collected;
    }
    if (response.items.length === 0) {
      if (collected.length === reachableTotal) return collected;
      throw new PagingResponseError(`Page ${pageNumber} made no progress before reaching total ${reachableTotal}`);
    }

    if (collected.length + response.items.length > reachableTotal) {
      throw new PagingResponseError(`Page ${pageNumber} returned more items than total ${expectedTotal} permits`);
    }
    for (const item of response.items) collected.push(item);
    if (collected.length === reachableTotal) return collected;
  }
};

/**
 * Generates a short time/random identifier; it is neither a UUID nor cryptographically secure.
 *
 * @param prefix - Optional text prepended with `_`; empty or nullish values add no prefix.
 * @returns Base-36 time plus up to five pseudorandom characters. Length is not fixed,
 *   and collisions are possible; use {@link generateUuid} when secure randomness is required.
 * @example randomId('row'); // e.g. 'row_m9abc123xyz'
 */
export const randomId = (prefix?: string | null): string => {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`;
  return prefix ? `${prefix}_${id}` : id;
};

/**
 * Parses a query string into an own-property record and rejects prototype-sensitive keys.
 *
 * @param queryString - URL query component, optionally starting with `?`; defaults to empty.
 *   This is not a full-URL parser. `+` becomes a space and percent escapes follow URLSearchParams.
 * @returns A new record of decoded strings; the last occurrence wins for duplicate keys.
 * @throws {UnsafeObjectKeyError} For prototype-sensitive decoded keys such as `__proto__`.
 * @example parseQueryParams('?name=An+Nguyen&tag=a&tag=b'); // { name: 'An Nguyen', tag: 'b' }
 */
export const parseQueryParams = (queryString?: string): Record<string, string> => {
  const params = new URLSearchParams(queryString || '');
  const result: Record<string, string> = {};
  params.forEach((value, key) => defineSafeDataProperty(result, key, value));
  return result;
};

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/**
 * Generates a lowercase RFC 4122/9562-compatible UUID v4 or throws when secure randomness is unavailable.
 *
 * @returns A fresh lowercase UUID v4 string using `crypto.randomUUID` or `getRandomValues`.
 *   No Math.random fallback is used; random generation does not mathematically guarantee uniqueness.
 * @throws {SecureRandomUnavailableError} If neither secure source works.
 * @example const id = generateUuid(); // e.g. '550e8400-e29b-41d4-a716-446655440000'
 */
export const generateUuid = (): string => {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi) throw new SecureRandomUnavailableError();
  if (typeof cryptoApi.randomUUID === 'function') {
    try {
      const uuid = cryptoApi.randomUUID().toLowerCase();
      if (UUID_V4_PATTERN.test(uuid)) return uuid;
    } catch {
      // A working getRandomValues implementation remains a secure fallback.
    }
  }
  if (typeof cryptoApi.getRandomValues !== 'function') throw new SecureRandomUnavailableError();
  const bytes = new Uint8Array(16);
  try {
    cryptoApi.getRandomValues(bytes);
  } catch (cause) {
    throw new SecureRandomUnavailableError({ cause });
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

/**
 * Safely reads a dot/bracket path through own data properties only. Getters are skipped by default.
 *
 * @typeParam T - Expected result type; does not validate the resolved value's runtime type.
 * @param obj - Root value; nullish/missing intermediate values resolve to `undefined`.
 * @param path - Dot or numeric/quoted bracket path, e.g. `items[0].name`.
 * @param options - Defaults to a maximum of 32 path segments and no getter execution.
 * @returns The original referenced value, or `undefined` for missing/inherited/skipped properties.
 * @throws {UnsafePropertyPathError} For invalid, forbidden, or over-depth paths/options.
 * @throws Propagates opted-in getter or Proxy trap errors.
 * @example getNestedValue<string>({ items: [{ name: 'An' }] }, 'items[0].name'); // 'An'
 */
export const getNestedValue = <T = unknown>(
  obj: unknown,
  path: string,
  options: PropertyPathOptions = {},
): T | undefined => getOwnPropertyPath<T>(obj, path, options);

/**
 * Checks whether a value is a plain object literal or a null-prototype record.
 *
 * @param value - Value to inspect without coercion.
 * @returns Whether the prototype is this realm's Object.prototype or null; excludes arrays,
 *   Date/Map/Set, class instances, and ordinary objects from a different realm.
 * @throws Propagates Proxy getPrototypeOf failures.
 * @example isPlainObject(Object.create(null)); // true
 */
export const isPlainObject = (value: unknown): value is PlainRecord => {
  if (typeof value !== 'object' || value === null) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const isClassInstance = (value: object): boolean => {
  const prototype = Object.getPrototypeOf(value);
  if (prototype === null || prototype === Object.prototype) return false;
  const constructorDescriptor = Object.getOwnPropertyDescriptor(prototype, 'constructor');
  return constructorDescriptor !== undefined &&
    !constructorDescriptor.enumerable &&
    'value' in constructorDescriptor &&
    typeof constructorDescriptor.value === 'function' &&
    constructorDescriptor.value.prototype === prototype;
};

/**
 * Includes custom-prototype record-like objects so they are sanitized into safe
 * own-property records rather than escaping with an attacker-controlled prototype.
 * Genuine class instances remain compatibility leaves.
 */
const isCopyableRecord = (value: unknown): value is PlainRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && !isClassInstance(value);

type ExternalCloneResolver = (value: object) => object | undefined;

const cloneValue = <T>(
  value: T,
  seen: WeakMap<object, unknown>,
  externalClone?: ExternalCloneResolver,
  depth = 0,
  maxDepth = DEFAULT_OBJECT_MAX_DEPTH,
): T => {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return value;
  if (depth > maxDepth) throw new ValidationError(`Object traversal exceeded maxDepth (${maxDepth})`);
  const external = externalClone?.(value as object);
  if (external !== undefined) return external as T;
  if (seen.has(value as object)) return seen.get(value as object) as T;

  if (Array.isArray(value)) {
    assertSafeEnumerableOwnKeys(value);
    const output = new Array(value.length) as unknown[];
    seen.set(value, output);
    for (let index = 0; index < value.length; index++) {
      if (!Object.hasOwn(value, index)) continue;
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor || !('value' in descriptor)) throw new ValidationError(`Accessor array element rejected at index ${index}`);
      Object.defineProperty(output, index, {
        configurable: true,
        enumerable: true,
        value: cloneValue(descriptor.value, seen, externalClone, depth + 1, maxDepth),
        writable: true,
      });
    }
    return output as T;
  }

  if (!isCopyableRecord(value)) return value;
  const prototype = Object.getPrototypeOf(value) === null ? null : Object.prototype;
  const output = createSafeRecord(prototype);
  seen.set(value, output);
  for (const key of Object.keys(value)) {
    assertSafeObjectKey(key);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !('value' in descriptor)) throw new ValidationError(`Accessor property rejected: ${key}`);
    defineSafeDataProperty(output, key, cloneValue(descriptor.value, seen, externalClone, depth + 1, maxDepth));
  }
  return output as T;
};

/**
 * Deeply clones arrays and record-like objects while preserving cycles and null prototypes.
 * Sparse-array holes are preserved. Date, Map, Set, class instances, functions, and
 * other non-plain leaves retain their original reference for v1.x compatibility.
 * Custom-prototype records are sanitized to ordinary own-property records. Excessive
 * acyclic depth throws a typed validation error instead of overflowing the stack.
 *
 * @typeParam T - Input/output type; copying does not perform schema validation.
 * @param value - Graph to copy. Arrays and record-like objects are recursively copied;
 *   Date, Map, Set, class instances, functions, and primitive leaves retain their values/references.
 * @param options - Maximum traversal depth; defaults to 1,000.
 * @returns A graph preserving cycles, repeated references, and sparse array holes within
 *   copied portions. Own enumerable string data properties are copied; custom record prototypes
 *   are sanitized, while null prototypes are retained. Inputs are not mutated.
 * @throws {UnsafeObjectKeyError} For prohibited own keys in copied records/arrays.
 * @throws {ValidationError} For invalid/exceeded depth or accessor properties.
 * @throws Propagates Proxy inspection failures.
 * @example const copied = clone({ items: [{ id: 1 }] });
 */
export const clone = <T>(value: T, options: ObjectTraversalOptions = {}): T =>
  cloneValue(value, new WeakMap(), undefined, 0, objectMaxDepth(options));

interface MergeContext {
  defaultCloneSeen: WeakMap<object, unknown>;
  overrideCloneSeen: WeakMap<object, unknown>;
  pairSeen: WeakMap<object, WeakMap<object, PlainRecord>>;
  activeDefault: WeakMap<object, PlainRecord>;
  activeOverride: WeakMap<object, PlainRecord>;
  maxDepth: number;
}

const cloneForMerge = <T>(
  value: T,
  context: MergeContext,
  source: 'default' | 'override',
  depth: number,
): T => {
  const seen = source === 'default' ? context.defaultCloneSeen : context.overrideCloneSeen;
  const active = source === 'default' ? context.activeDefault : context.activeOverride;
  return cloneValue(value, seen, object => active.get(object), depth, context.maxDepth);
};

const rememberActive = (
  map: WeakMap<object, PlainRecord>,
  source: object,
  output: PlainRecord,
): (() => void) => {
  const hadPrior = map.has(source);
  const prior = map.get(source);
  map.set(source, output);
  return () => {
    if (hadPrior && prior !== undefined) map.set(source, prior);
    else map.delete(source);
  };
};

const mergeValue = <T>(
  defaultValue: T,
  overrideValue: T | undefined,
  context: MergeContext,
  depth: number,
): T => {
  if (depth > context.maxDepth) throw new ValidationError(`Object traversal exceeded maxDepth (${context.maxDepth})`);
  if (overrideValue === undefined) return cloneForMerge(defaultValue, context, 'default', depth);
  if (isCopyableRecord(defaultValue) && isCopyableRecord(overrideValue)) {
    const priorForDefault = context.pairSeen.get(defaultValue);
    const priorPair = priorForDefault?.get(overrideValue);
    if (priorPair !== undefined) return priorPair as T;

    const output = createSafeRecord(Object.getPrototypeOf(defaultValue) === null ? null : Object.prototype);
    const pairs = priorForDefault ?? new WeakMap<object, PlainRecord>();
    if (priorForDefault === undefined) context.pairSeen.set(defaultValue, pairs);
    pairs.set(overrideValue, output);
    const restoreDefault = rememberActive(context.activeDefault, defaultValue, output);
    const restoreOverride = rememberActive(context.activeOverride, overrideValue, output);
    try {
      const keys = new Set([...Object.keys(defaultValue), ...Object.keys(overrideValue)]);
      for (const key of keys) {
        assertSafeObjectKey(key);
        const defaultDescriptor = Object.getOwnPropertyDescriptor(defaultValue, key);
        const overrideDescriptor = Object.getOwnPropertyDescriptor(overrideValue, key);
        if (defaultDescriptor && !('value' in defaultDescriptor)) throw new ValidationError(`Accessor property rejected: ${key}`);
        if (overrideDescriptor && !('value' in overrideDescriptor)) throw new ValidationError(`Accessor property rejected: ${key}`);
        defineSafeDataProperty(
          output,
          key,
          mergeValue(defaultDescriptor?.value, overrideDescriptor?.value, context, depth + 1),
        );
      }
    } finally {
      restoreOverride();
      restoreDefault();
    }
    return output as T;
  }
  return cloneForMerge(overrideValue, context, 'override', depth);
};

/**
 * Deeply merges plain records. Arrays replace and clone; `undefined` inherits the
 * default; `null` overrides. Date, Map, Set, and class instances are non-plain
 * leaves and retain the selected reference. Cyclic plain graphs are preserved.
 *
 * @typeParam T - Expected result type, shared by the default and override inputs.
 * @param defaultValue - Base graph; own enumerable string data properties supply defaults.
 * @param overrideValue - Override graph. `undefined` inherits the default; null replaces it;
 *   arrays replace rather than concatenate. Record-like objects merge recursively.
 * @param options - Maximum traversal depth; defaults to 1,000.
 * @returns A merged graph without mutating inputs. Copied portions preserve cycles;
 *   non-plain leaf objects remain shared references. Null-prototype defaults retain that prototype.
 * @throws {UnsafeObjectKeyError} For prohibited keys in traversed records/arrays.
 * @throws {ValidationError} For invalid/exceeded depth or accessors.
 * @throws Propagates Proxy inspection failures.
 * @example merge({ page: 1, tags: ['old'] }, { page: 2, tags: ['new'] }); // { page: 2, tags: ['new'] }
 */
export const merge = <T>(
  defaultValue: T,
  overrideValue: T | undefined,
  options: ObjectTraversalOptions = {},
): T =>
  mergeValue(defaultValue, overrideValue, {
    defaultCloneSeen: new WeakMap(),
    overrideCloneSeen: new WeakMap(),
    pairSeen: new WeakMap(),
    activeDefault: new WeakMap(),
    activeOverride: new WeakMap(),
    maxDepth: objectMaxDepth(options),
  }, 0);

/**
 * Folds partial records from left to right using {@link merge}.
 *
 * @typeParam T - Expected complete output type; partial inputs do not guarantee all required fields exist.
 * @param sources - Partial records, applied left to right; later defined values win.
 * @returns A new merged record, or `{}` for no sources. Arrays replace; inputs are not mutated.
 * @throws Propagates unsafe-key, accessor, and default-depth errors from {@link merge}.
 * @example deepMerge<{ a: number; b: number }>({ a: 1 }, { b: 2 }); // { a: 1, b: 2 }
 */
export const deepMerge = <T>(...sources: Partial<T>[]): T =>
  sources.reduce<PlainRecord>((accumulator, source) => merge(accumulator, source as PlainRecord), {}) as T;

/**
 * Object-focused deterministic serialization, hashing, traversal, cloning, and merge helpers.
 *
 * @example
 * import { ObjectUtilities } from '@sdcorejs/utils/fns';
 * ObjectUtilities.clone({ id: 1 }); // { id: 1 }
 */
export const ObjectUtilities = {
  /**
   * Deterministically serializes JSON-compatible values, sorting plain-object keys.
   *
   * `Date` is retained for v1.x compatibility and encodes as its ISO string; a `Date`
   * holding `NaN` encodes as `"Invalid Date"`. The function rejects `undefined`, functions,
   * symbols, bigint, non-finite numbers, sparse arrays, accessors, class instances,
   * binary/collection objects, and cycles. Negative zero follows JSON semantics and
   * encodes as `0`.
   *
   * @param value - JSON primitives, dense arrays, plain records, or Dates. Valid Dates become ISO
   *   strings; invalid Dates become `'Invalid Date'`. These encodings can collide with literal strings.
   *   Undefined, bigint, non-finite numbers, functions, symbols, accessors, sparse arrays,
   *   class instances, and collections are unsupported. Object keys sort by UTF-16 code units.
   * @param options - Recursion limit, default 100. Inputs are not mutated and `toJSON` is not called.
   * @returns Deterministic JSON text; negative zero is represented as zero.
   * @throws {CircularReferenceError} For cyclic graphs (non-cyclic shared references are allowed).
   * @throws {UnsupportedSerializationTypeError} For unsupported data or invalid/exceeded limits.
   * @throws {UnsafeObjectKeyError} For prohibited own keys.
   * @example stableStringify({ b: 2, a: 1 }); // '{"a":1,"b":2}'
   */
  stableStringify,
  /**
   * Canonically encodes supported extended JavaScript values with collision-safe type tags.
   * Object keys, map entries, and set values are deterministically ordered. A `Date` holding
   * `NaN` carries its own tag payload, alongside the existing tags for `NaN`, the infinities,
   * negative zero, and array holes. Functions, symbols, class instances, accessors, Blob/File
   * values, and cycles are rejected.
   *
   * @param value - Extended data, including undefined, bigint, non-finite numbers, negative zero,
   *   sparse arrays, Dates, RegExp, Map, Set, ArrayBuffer, and supported typed views. Functions,
   *   symbols, class instances, Blob/File, accessors, and cycles are rejected.
   * @param options - Recursion limit, default 100; inputs are not mutated.
   * @returns Deterministic JSON text with type tags. Record keys and encoded Map/Set entries
   *   are sorted, preserving type distinctions absent from ordinary JSON. This package exposes
   *   no inverse decoder, and the representation should not be treated as ordinary application JSON.
   * @throws {CircularReferenceError} For cyclic graphs.
   * @throws {UnsupportedSerializationTypeError} For unsupported data or invalid/exceeded limits.
   * @throws {UnsafeObjectKeyError} For prohibited own keys.
   * @example canonicalStringify({ b: 2, a: 1 }) === canonicalStringify({ a: 1, b: 2 }); // true
   */
  canonicalStringify,
  /**
   * Legacy alias of {@link hash32}, including its collision-prone compatibility fallback.
   *
   * @deprecated Use {@link hash32} for explicit non-cryptographic naming, or {@link sha256Canonical}
   *   for a cryptographic digest of supported canonical data. Those choices have different guarantees.
   * @param value - Value passed unchanged to {@link hash32}.
   * @returns The same `h`-prefixed decimal compatibility hash.
   * @throws Propagates failures from {@link hash32}.
   * @example hash({ a: 1 }) === hash32({ a: 1 }); // true
   */
  hash,
  /**
   * Computes the legacy, non-cryptographic 32-bit rolling hash of a stable representation.
   * Uses {@link stableStringify} first, then a compatibility serializer with placeholders
   * for some unsupported values and circular references. Blob/File fallback hashes metadata,
   * not file bytes; unrelated values can collide even before the 32-bit hash is computed.
   *
   * @param value - Value to hash. Compatibility fallback does not make every possible input safe or supported.
   * @returns `h` followed by the absolute signed 32-bit hash in decimal. Do not use for integrity,
   *   authentication, unique IDs, or collision-free cache keys.
   * @throws Propagates failures that remain in fallback traversal, including unsafe keys and inspection errors.
   * @example hash32({ a: 1 }) === hash32({ a: 1 }); // true
   */
  hash32,
  /**
   * Canonicalizes a value and returns its SHA-256 digest as lowercase hexadecimal.
   *
   * @param value - Data supported by {@link canonicalStringify}; type distinctions affect the hash.
   * @param options - Canonical serialization depth limit, default 100.
   * @returns A Promise of 64 lowercase hexadecimal characters, hashing UTF-8 canonical text.
   *   This is an unkeyed digest, not a signature or a password-hashing function.
   * @throws {WebCryptoUnavailableError} Rejects if Web Crypto digest support is unavailable.
   * @throws Rejects serialization errors or runtime digest failures.
   * @example const digest = await sha256Canonical({ b: 2, a: 1 }); // 64 lowercase hexadecimal characters.
   */
  sha256Canonical,
  /**
   * Reads Blob/File bytes asynchronously and returns their SHA-256 digest as lowercase hexadecimal.
   *
   * @param blob - A Blob or File instance recognized by this runtime; its name/type are not hashed.
   * @returns A Promise of the bytes' 64-character lowercase hexadecimal SHA-256 digest.
   *   Reads the entire payload into memory; identical bytes yield identical digests regardless of metadata.
   * @throws {UnsupportedSerializationTypeError} Rejects inputs that are not Blob instances.
   * @throws {WebCryptoUnavailableError} Rejects if Web Crypto digest support is unavailable.
   * @throws Rejects Blob reading or runtime digest failures.
   * @example await sha256Blob(new Blob(['hello'])); // '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
   */
  sha256Blob,
  /**
   * Parses a query string into an own-property record and rejects prototype-sensitive keys.
   *
   * @param queryString - URL query component, optionally starting with `?`; defaults to empty.
   *   This is not a full-URL parser. `+` becomes a space and percent escapes follow URLSearchParams.
   * @returns A new record of decoded strings; the last occurrence wins for duplicate keys.
   * @throws {UnsafeObjectKeyError} For prototype-sensitive decoded keys such as `__proto__`.
   * @example parseQueryParams('?name=An+Nguyen&tag=a&tag=b'); // { name: 'An Nguyen', tag: 'b' }
   */
  parseQueryParams,
  /**
   * Safely reads a dot/bracket path through own data properties only. Getters are skipped by default.
   *
   * @typeParam T - Expected result type; does not validate the resolved value's runtime type.
   * @param obj - Root value; nullish/missing intermediate values resolve to `undefined`.
   * @param path - Dot or numeric/quoted bracket path, e.g. `items[0].name`.
   * @param options - Defaults to a maximum of 32 path segments and no getter execution.
   * @returns The original referenced value, or `undefined` for missing/inherited/skipped properties.
   * @throws {UnsafePropertyPathError} For invalid, forbidden, or over-depth paths/options.
   * @throws Propagates opted-in getter or Proxy trap errors.
   * @example getNestedValue<string>({ items: [{ name: 'An' }] }, 'items[0].name'); // 'An'
   */
  getNestedValue,
  /**
   * Checks whether a value is a plain object literal or a null-prototype record.
   *
   * @param value - Value to inspect without coercion.
   * @returns Whether the prototype is this realm's Object.prototype or null; excludes arrays,
   *   Date/Map/Set, class instances, and ordinary objects from a different realm.
   * @throws Propagates Proxy getPrototypeOf failures.
   * @example isPlainObject(Object.create(null)); // true
   */
  isPlainObject,
  /**
   * Deeply clones arrays and record-like objects while preserving cycles and null prototypes.
   * Sparse-array holes are preserved. Date, Map, Set, class instances, functions, and
   * other non-plain leaves retain their original reference for v1.x compatibility.
   * Custom-prototype records are sanitized to ordinary own-property records. Excessive
   * acyclic depth throws a typed validation error instead of overflowing the stack.
   *
   * @typeParam T - Input/output type; copying does not perform schema validation.
   * @param value - Graph to copy. Arrays and record-like objects are recursively copied;
   *   Date, Map, Set, class instances, functions, and primitive leaves retain their values/references.
   * @param options - Maximum traversal depth; defaults to 1,000.
   * @returns A graph preserving cycles, repeated references, and sparse array holes within
   *   copied portions. Own enumerable string data properties are copied; custom record prototypes
   *   are sanitized, while null prototypes are retained. Inputs are not mutated.
   * @throws {UnsafeObjectKeyError} For prohibited own keys in copied records/arrays.
   * @throws {ValidationError} For invalid/exceeded depth or accessor properties.
   * @throws Propagates Proxy inspection failures.
   * @example const copied = clone({ items: [{ id: 1 }] });
   */
  clone,
  /**
   * Deeply merges plain records. Arrays replace and clone; `undefined` inherits the
   * default; `null` overrides. Date, Map, Set, and class instances are non-plain
   * leaves and retain the selected reference. Cyclic plain graphs are preserved.
   *
   * @typeParam T - Expected result type, shared by the default and override inputs.
   * @param defaultValue - Base graph; own enumerable string data properties supply defaults.
   * @param overrideValue - Override graph. `undefined` inherits the default; null replaces it;
   *   arrays replace rather than concatenate. Record-like objects merge recursively.
   * @param options - Maximum traversal depth; defaults to 1,000.
   * @returns A merged graph without mutating inputs. Copied portions preserve cycles;
   *   non-plain leaf objects remain shared references. Null-prototype defaults retain that prototype.
   * @throws {UnsafeObjectKeyError} For prohibited keys in traversed records/arrays.
   * @throws {ValidationError} For invalid/exceeded depth or accessors.
   * @throws Propagates Proxy inspection failures.
   * @example merge({ page: 1, tags: ['old'] }, { page: 2, tags: ['new'] }); // { page: 2, tags: ['new'] }
   */
  merge,
  /**
   * Folds partial records from left to right using {@link merge}.
   *
   * @typeParam T - Expected complete output type; partial inputs do not guarantee all required fields exist.
   * @param sources - Partial records, applied left to right; later defined values win.
   * @returns A new merged record, or `{}` for no sources. Arrays replace; inputs are not mutated.
   * @throws Propagates unsafe-key, accessor, and default-depth errors from {@link merge}.
   * @example deepMerge<{ a: number; b: number }>({ a: 1 }, { b: 2 }); // { a: 1, b: 2 }
   */
  deepMerge,
};

/**
 * General-purpose pagination, ID, serialization, URL-query, and object helpers.
 *
 * @example
 * import { Utilities } from '@sdcorejs/utils/fns';
 * Utilities.parseQueryParams('page=2'); // { page: '2' }
 */
export const Utilities = {
  /**
   * Exhausts a strictly zero-based paginated endpoint and returns all items in order.
   * Responses are validated on every page; later failures throw instead of discarding
   * already fetched data. Callback requests always start at page `0` and increment
   * consecutively. Duplicate item values remain lossless because a repeated payload is
   * not proof that an offset endpoint repeated the same logical page. Termination is
   * bounded by the declared total, empty-page checks, the safe page range, and `maxPages`.
   * When configured, the abort signal races each page promise and is passed to the
   * callback for transport cancellation.
   *
   * @typeParam T - Item type, returned by reference without cloning or deduplication.
   * @param func - Sequential page loader receiving `(pageSize, pageNumber, signal?)`.
   *   Return an items array no longer than pageSize and a nonnegative safe-integer total.
   * @param defaultPageSize - Positive safe integer requested on every page; defaults to 1,000.
   * @param options - Request cap, abort signal, and total-change policy.
   * @returns A Promise of all items in page order. Failures reject without returning a partial array.
   * @throws {ValidationError} Rejects invalid options or a non-callable loader.
   * @throws {PagingResponseError} Rejects malformed/inconsistent responses or lack of progress.
   * @throws {PagingLimitError} Rejects if the request cap or safe page-number range is exceeded.
   * @throws Rejects loader failures and abort reasons unchanged.
   * @example
   * const all = await fetchAllByPaging(async (pageSize, pageNumber) => ({
   *   items: [1, 2, 3].slice(pageNumber * pageSize, (pageNumber + 1) * pageSize),
   *   total: 3,
   * }), 2); // [1, 2, 3]
   */
  fetchAllByPaging,
  /**
   * Generates a short time/random identifier; it is neither a UUID nor cryptographically secure.
   *
   * @param prefix - Optional text prepended with `_`; empty or nullish values add no prefix.
   * @returns Base-36 time plus up to five pseudorandom characters. Length is not fixed,
   *   and collisions are possible; use {@link generateUuid} when secure randomness is required.
   * @example randomId('row'); // e.g. 'row_m9abc123xyz'
   */
  randomId,
  /**
   * Deterministically serializes JSON-compatible values, sorting plain-object keys.
   *
   * `Date` is retained for v1.x compatibility and encodes as its ISO string; a `Date`
   * holding `NaN` encodes as `"Invalid Date"`. The function rejects `undefined`, functions,
   * symbols, bigint, non-finite numbers, sparse arrays, accessors, class instances,
   * binary/collection objects, and cycles. Negative zero follows JSON semantics and
   * encodes as `0`.
   *
   * @param value - JSON primitives, dense arrays, plain records, or Dates. Valid Dates become ISO
   *   strings; invalid Dates become `'Invalid Date'`. These encodings can collide with literal strings.
   *   Undefined, bigint, non-finite numbers, functions, symbols, accessors, sparse arrays,
   *   class instances, and collections are unsupported. Object keys sort by UTF-16 code units.
   * @param options - Recursion limit, default 100. Inputs are not mutated and `toJSON` is not called.
   * @returns Deterministic JSON text; negative zero is represented as zero.
   * @throws {CircularReferenceError} For cyclic graphs (non-cyclic shared references are allowed).
   * @throws {UnsupportedSerializationTypeError} For unsupported data or invalid/exceeded limits.
   * @throws {UnsafeObjectKeyError} For prohibited own keys.
   * @example stableStringify({ b: 2, a: 1 }); // '{"a":1,"b":2}'
   */
  stableStringify,
  /**
   * Canonically encodes supported extended JavaScript values with collision-safe type tags.
   * Object keys, map entries, and set values are deterministically ordered. A `Date` holding
   * `NaN` carries its own tag payload, alongside the existing tags for `NaN`, the infinities,
   * negative zero, and array holes. Functions, symbols, class instances, accessors, Blob/File
   * values, and cycles are rejected.
   *
   * @param value - Extended data, including undefined, bigint, non-finite numbers, negative zero,
   *   sparse arrays, Dates, RegExp, Map, Set, ArrayBuffer, and supported typed views. Functions,
   *   symbols, class instances, Blob/File, accessors, and cycles are rejected.
   * @param options - Recursion limit, default 100; inputs are not mutated.
   * @returns Deterministic JSON text with type tags. Record keys and encoded Map/Set entries
   *   are sorted, preserving type distinctions absent from ordinary JSON. This package exposes
   *   no inverse decoder, and the representation should not be treated as ordinary application JSON.
   * @throws {CircularReferenceError} For cyclic graphs.
   * @throws {UnsupportedSerializationTypeError} For unsupported data or invalid/exceeded limits.
   * @throws {UnsafeObjectKeyError} For prohibited own keys.
   * @example canonicalStringify({ b: 2, a: 1 }) === canonicalStringify({ a: 1, b: 2 }); // true
   */
  canonicalStringify,
  /**
   * Legacy alias of {@link hash32}, including its collision-prone compatibility fallback.
   *
   * @deprecated Use {@link hash32} for explicit non-cryptographic naming, or {@link sha256Canonical}
   *   for a cryptographic digest of supported canonical data. Those choices have different guarantees.
   * @param value - Value passed unchanged to {@link hash32}.
   * @returns The same `h`-prefixed decimal compatibility hash.
   * @throws Propagates failures from {@link hash32}.
   * @example hash({ a: 1 }) === hash32({ a: 1 }); // true
   */
  hash,
  /**
   * Computes the legacy, non-cryptographic 32-bit rolling hash of a stable representation.
   * Uses {@link stableStringify} first, then a compatibility serializer with placeholders
   * for some unsupported values and circular references. Blob/File fallback hashes metadata,
   * not file bytes; unrelated values can collide even before the 32-bit hash is computed.
   *
   * @param value - Value to hash. Compatibility fallback does not make every possible input safe or supported.
   * @returns `h` followed by the absolute signed 32-bit hash in decimal. Do not use for integrity,
   *   authentication, unique IDs, or collision-free cache keys.
   * @throws Propagates failures that remain in fallback traversal, including unsafe keys and inspection errors.
   * @example hash32({ a: 1 }) === hash32({ a: 1 }); // true
   */
  hash32,
  /**
   * Canonicalizes a value and returns its SHA-256 digest as lowercase hexadecimal.
   *
   * @param value - Data supported by {@link canonicalStringify}; type distinctions affect the hash.
   * @param options - Canonical serialization depth limit, default 100.
   * @returns A Promise of 64 lowercase hexadecimal characters, hashing UTF-8 canonical text.
   *   This is an unkeyed digest, not a signature or a password-hashing function.
   * @throws {WebCryptoUnavailableError} Rejects if Web Crypto digest support is unavailable.
   * @throws Rejects serialization errors or runtime digest failures.
   * @example const digest = await sha256Canonical({ b: 2, a: 1 }); // 64 lowercase hexadecimal characters.
   */
  sha256Canonical,
  /**
   * Reads Blob/File bytes asynchronously and returns their SHA-256 digest as lowercase hexadecimal.
   *
   * @param blob - A Blob or File instance recognized by this runtime; its name/type are not hashed.
   * @returns A Promise of the bytes' 64-character lowercase hexadecimal SHA-256 digest.
   *   Reads the entire payload into memory; identical bytes yield identical digests regardless of metadata.
   * @throws {UnsupportedSerializationTypeError} Rejects inputs that are not Blob instances.
   * @throws {WebCryptoUnavailableError} Rejects if Web Crypto digest support is unavailable.
   * @throws Rejects Blob reading or runtime digest failures.
   * @example await sha256Blob(new Blob(['hello'])); // '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
   */
  sha256Blob,
  /**
   * Parses a query string into an own-property record and rejects prototype-sensitive keys.
   *
   * @param queryString - URL query component, optionally starting with `?`; defaults to empty.
   *   This is not a full-URL parser. `+` becomes a space and percent escapes follow URLSearchParams.
   * @returns A new record of decoded strings; the last occurrence wins for duplicate keys.
   * @throws {UnsafeObjectKeyError} For prototype-sensitive decoded keys such as `__proto__`.
   * @example parseQueryParams('?name=An+Nguyen&tag=a&tag=b'); // { name: 'An Nguyen', tag: 'b' }
   */
  parseQueryParams,
  /**
   * Generates a lowercase RFC 4122/9562-compatible UUID v4 or throws when secure randomness is unavailable.
   *
   * @returns A fresh lowercase UUID v4 string using `crypto.randomUUID` or `getRandomValues`.
   *   No Math.random fallback is used; random generation does not mathematically guarantee uniqueness.
   * @throws {SecureRandomUnavailableError} If neither secure source works.
   * @example const id = generateUuid(); // e.g. '550e8400-e29b-41d4-a716-446655440000'
   */
  generateUuid,
  /**
   * Safely reads a dot/bracket path through own data properties only. Getters are skipped by default.
   *
   * @typeParam T - Expected result type; does not validate the resolved value's runtime type.
   * @param obj - Root value; nullish/missing intermediate values resolve to `undefined`.
   * @param path - Dot or numeric/quoted bracket path, e.g. `items[0].name`.
   * @param options - Defaults to a maximum of 32 path segments and no getter execution.
   * @returns The original referenced value, or `undefined` for missing/inherited/skipped properties.
   * @throws {UnsafePropertyPathError} For invalid, forbidden, or over-depth paths/options.
   * @throws Propagates opted-in getter or Proxy trap errors.
   * @example getNestedValue<string>({ items: [{ name: 'An' }] }, 'items[0].name'); // 'An'
   */
  getNestedValue,
  /**
   * Checks whether a value is a plain object literal or a null-prototype record.
   *
   * @param value - Value to inspect without coercion.
   * @returns Whether the prototype is this realm's Object.prototype or null; excludes arrays,
   *   Date/Map/Set, class instances, and ordinary objects from a different realm.
   * @throws Propagates Proxy getPrototypeOf failures.
   * @example isPlainObject(Object.create(null)); // true
   */
  isPlainObject,
  /**
   * Deeply clones arrays and record-like objects while preserving cycles and null prototypes.
   * Sparse-array holes are preserved. Date, Map, Set, class instances, functions, and
   * other non-plain leaves retain their original reference for v1.x compatibility.
   * Custom-prototype records are sanitized to ordinary own-property records. Excessive
   * acyclic depth throws a typed validation error instead of overflowing the stack.
   *
   * @typeParam T - Input/output type; copying does not perform schema validation.
   * @param value - Graph to copy. Arrays and record-like objects are recursively copied;
   *   Date, Map, Set, class instances, functions, and primitive leaves retain their values/references.
   * @param options - Maximum traversal depth; defaults to 1,000.
   * @returns A graph preserving cycles, repeated references, and sparse array holes within
   *   copied portions. Own enumerable string data properties are copied; custom record prototypes
   *   are sanitized, while null prototypes are retained. Inputs are not mutated.
   * @throws {UnsafeObjectKeyError} For prohibited own keys in copied records/arrays.
   * @throws {ValidationError} For invalid/exceeded depth or accessor properties.
   * @throws Propagates Proxy inspection failures.
   * @example const copied = clone({ items: [{ id: 1 }] });
   */
  clone,
  /**
   * Deeply merges plain records. Arrays replace and clone; `undefined` inherits the
   * default; `null` overrides. Date, Map, Set, and class instances are non-plain
   * leaves and retain the selected reference. Cyclic plain graphs are preserved.
   *
   * @typeParam T - Expected result type, shared by the default and override inputs.
   * @param defaultValue - Base graph; own enumerable string data properties supply defaults.
   * @param overrideValue - Override graph. `undefined` inherits the default; null replaces it;
   *   arrays replace rather than concatenate. Record-like objects merge recursively.
   * @param options - Maximum traversal depth; defaults to 1,000.
   * @returns A merged graph without mutating inputs. Copied portions preserve cycles;
   *   non-plain leaf objects remain shared references. Null-prototype defaults retain that prototype.
   * @throws {UnsafeObjectKeyError} For prohibited keys in traversed records/arrays.
   * @throws {ValidationError} For invalid/exceeded depth or accessors.
   * @throws Propagates Proxy inspection failures.
   * @example merge({ page: 1, tags: ['old'] }, { page: 2, tags: ['new'] }); // { page: 2, tags: ['new'] }
   */
  merge,
  /**
   * Folds partial records from left to right using {@link merge}.
   *
   * @typeParam T - Expected complete output type; partial inputs do not guarantee all required fields exist.
   * @param sources - Partial records, applied left to right; later defined values win.
   * @returns A new merged record, or `{}` for no sources. Arrays replace; inputs are not mutated.
   * @throws Propagates unsafe-key, accessor, and default-depth errors from {@link merge}.
   * @example deepMerge<{ a: number; b: number }>({ a: 1 }, { b: 2 }); // { a: 1, b: 2 }
   */
  deepMerge,
};
