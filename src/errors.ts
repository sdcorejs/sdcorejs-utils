/** Options shared by all public `@sdcorejs/utils` errors. */
export interface SdcoreUtilsErrorOptions {
  /**
   * Optional underlying failure, of any JavaScript type. When not undefined, retained by reference
   * as a non-enumerable, non-writable (but configurable) cause property. No redaction or serialization is applied.
   */
  cause?: unknown;
}

const ERROR_BRANDS = Symbol.for('@sdcorejs/utils/error-brands');

interface BrandedError {
  readonly [ERROR_BRANDS]?: readonly string[];
}

/**
 * Base class for errors intentionally raised by `@sdcorejs/utils`.
 *
 * @remarks Extends Error. The stable name is 'SdcoreUtilsError'; instanceof works across
 *   independently bundled package entry points using the shared error brand. Branding is
 *   for error classification, not authentication of untrusted objects.
 * @example new SdcoreUtilsError('Invalid input', { cause: new Error('Underlying failure') });
 */
export class SdcoreUtilsError extends Error {
  /**
   * Stable identity of the error class, used for `name` and for `instanceof` across
   * independently bundled public entry points.
   *
   * Application bundlers rename class bindings (a `2` suffix for duplicated names, short names
   * when minifying), so the identity is a string literal rather than `constructor.name`. Every
   * subclass, including subclasses defined outside this package, must declare its own value:
   * `static override readonly errorName: string = 'MyError';` (the `string` annotation keeps the
   * class extendable). Constructing a subclass without one throws a `TypeError`.
   */
  static readonly errorName: string = 'SdcoreUtilsError';

  /**
   * Underlying failure supplied in constructor options, retained by reference. Absent when
   * undefined; otherwise defined non-enumerably and non-writably. May contain caller-provided sensitive data.
   */
  readonly cause?: unknown;

  /**
   * Preserves `instanceof` across independently bundled public entry points.
   * Native prototype-chain checks remain the fast path; the global-symbol brand, which holds the
   * `errorName` of every class in the chain, handles the same public error class loaded from
   * another package subpath.
   *
   * @param value - Candidate instance or branded object to inspect.
   * @returns Whether native inheritance or the shared public brand matches this class.
   * @throws Propagates getter/Proxy failures while reading a candidate brand.
   * @remarks A forged symbol brand can match; never use instanceof as an authorization control.
   * @example new ValidationError('bad input') instanceof SdcoreUtilsError; // true
   */
  static [Symbol.hasInstance](value: unknown): boolean {
    if (Function.prototype[Symbol.hasInstance].call(this, value)) return true;
    // why: an inherited errorName would let an undeclared subclass match every error of its parent.
    if (!Object.hasOwn(this, 'errorName')) return false;
    if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return false;
    const brands = (value as BrandedError)[ERROR_BRANDS];
    return Array.isArray(brands) && brands.includes(this.errorName);
  }

  /**
   * Creates a SdcoreUtilsError with its stable name and diagnostic context.
   *
   * @param message - Human-readable diagnostic message; do not embed keys, plaintext secrets, or sensitive payloads.
   * @param options - Optional lower-level cause; defaults to no cause. The cause value is retained by reference.
   * @throws {TypeError} When constructing a subclass that has not declared its own static errorName.
   * @example new SdcoreUtilsError('Invalid input', { cause: new Error('Underlying failure') });
   */
  constructor(message: string, options: SdcoreUtilsErrorOptions = {}) {
    super(message);
    const errorClass = new.target as typeof SdcoreUtilsError;
    if (!Object.hasOwn(errorClass, 'errorName')) {
      throw new TypeError(`${errorClass.name} must declare its own static errorName`);
    }
    this.name = errorClass.errorName;
    Object.setPrototypeOf(this, new.target.prototype);
    const brands: string[] = [];
    let constructor: object | null = new.target;
    while (typeof constructor === 'function' && constructor !== Error) {
      if (Object.hasOwn(constructor, 'errorName')) brands.push((constructor as typeof SdcoreUtilsError).errorName);
      constructor = Object.getPrototypeOf(constructor) as object | null;
    }
    Object.defineProperty(this, ERROR_BRANDS, {
      configurable: false,
      enumerable: false,
      value: Object.freeze(brands),
      writable: false,
    });
    if (options.cause !== undefined) {
      Object.defineProperty(this, 'cause', {
        configurable: true,
        enumerable: false,
        value: options.cause,
        writable: false,
      });
    }
  }
}

/**
 * Base class for rejected operations that would cross a security boundary.
 *
 * @remarks Extends SdcoreUtilsError. The stable name is 'SecurityError'; instanceof works across
 *   independently bundled package entry points using the shared error brand. Branding is
 *   for error classification, not authentication of untrusted objects.
 * @example new SecurityError('Invalid input', { cause: new Error('Underlying failure') });
 */
export class SecurityError extends SdcoreUtilsError {
  /**
   * Stable 'SecurityError' identity used by instance.name and cross-entry-point instanceof checks.
   * External subclasses must declare their own static readonly errorName rather than inheriting it.
   */
  static override readonly errorName: string = 'SecurityError';
}

/**
 * Base class for invalid caller input.
 *
 * @remarks Extends SdcoreUtilsError. The stable name is 'ValidationError'; instanceof works across
 *   independently bundled package entry points using the shared error brand. Branding is
 *   for error classification, not authentication of untrusted objects.
 * @example new ValidationError('Invalid input', { cause: new Error('Underlying failure') });
 */
export class ValidationError extends SdcoreUtilsError {
  /**
   * Stable 'ValidationError' identity used by instance.name and cross-entry-point instanceof checks.
   * External subclasses must declare their own static readonly errorName rather than inheriting it.
   */
  static override readonly errorName: string = 'ValidationError';
}

/**
 * Base class for deterministic serialization failures.
 *
 * @remarks Extends SdcoreUtilsError. The stable name is 'SerializationError'; instanceof works across
 *   independently bundled package entry points using the shared error brand. Branding is
 *   for error classification, not authentication of untrusted objects.
 * @example new SerializationError('Invalid input', { cause: new Error('Underlying failure') });
 */
export class SerializationError extends SdcoreUtilsError {
  /**
   * Stable 'SerializationError' identity used by instance.name and cross-entry-point instanceof checks.
   * External subclasses must declare their own static readonly errorName rather than inheriting it.
   */
  static override readonly errorName: string = 'SerializationError';
}

/**
 * Raised when an object key could alter or expose a JavaScript prototype.
 *
 * @remarks Extends SecurityError. The stable name is 'UnsafeObjectKeyError'; instanceof works across
 *   independently bundled package entry points using the shared error brand. Branding is
 *   for error classification, not authentication of untrusted objects.
 * @example new UnsafeObjectKeyError('__proto__');
 */
export class UnsafeObjectKeyError extends SecurityError {
  /**
   * Stable 'UnsafeObjectKeyError' identity used by instance.name and cross-entry-point instanceof checks.
   * External subclasses must declare their own static readonly errorName rather than inheriting it.
   */
  static override readonly errorName: string = 'UnsafeObjectKeyError';

  /** The rejected key. */
  readonly key: string;

  /**
   * Creates a UnsafeObjectKeyError with its stable name and diagnostic context.
   *
   * @param key - Rejected property key, recorded on the readonly key field and included in the message.
   * @throws {TypeError} When constructing a subclass that has not declared its own static errorName.
   * @example new UnsafeObjectKeyError('__proto__');
   */
  constructor(key: string) {
    super(`Unsafe object key rejected: ${JSON.stringify(key)}`);
    this.key = key;
  }
}

/**
 * Raised when a property path is malformed, too deep, or prototype-sensitive.
 *
 * @remarks Extends SecurityError. The stable name is 'UnsafePropertyPathError'; instanceof works across
 *   independently bundled package entry points using the shared error brand. Branding is
 *   for error classification, not authentication of untrusted objects.
 * @example new UnsafePropertyPathError('user.name', 'access denied');
 */
export class UnsafePropertyPathError extends SecurityError {
  /**
   * Stable 'UnsafePropertyPathError' identity used by instance.name and cross-entry-point instanceof checks.
   * External subclasses must declare their own static readonly errorName rather than inheriting it.
   */
  static override readonly errorName: string = 'UnsafePropertyPathError';

  /** The rejected path. */
  readonly path: string;

  /**
   * Creates a UnsafePropertyPathError with its stable name and diagnostic context.
   *
   * @param path - Diagnostic property path; optional where the constructor signature permits omission.
   * @param reason - Human-readable reason for rejecting the path; included in the error message.
   * @throws {TypeError} When constructing a subclass that has not declared its own static errorName.
   * @example new UnsafePropertyPathError('user.name', 'access denied');
   */
  constructor(path: string, reason: string) {
    super(`Unsafe property path rejected: ${reason}`);
    this.path = path;
  }
}

/**
 * Raised when a recursive input graph contains a cycle that the API cannot encode.
 *
 * @remarks Extends ValidationError. The stable name is 'CircularReferenceError'; instanceof works across
 *   independently bundled package entry points using the shared error brand. Branding is
 *   for error classification, not authentication of untrusted objects.
 * @example new CircularReferenceError('user.name');
 */
export class CircularReferenceError extends ValidationError {
  /**
   * Stable 'CircularReferenceError' identity used by instance.name and cross-entry-point instanceof checks.
   * External subclasses must declare their own static readonly errorName rather than inheriting it.
   */
  static override readonly errorName: string = 'CircularReferenceError';

  /**
   * Creates a CircularReferenceError with its stable name and diagnostic context.
   *
   * @param path - Diagnostic property path; optional where the constructor signature permits omission.
   * @throws {TypeError} When constructing a subclass that has not declared its own static errorName.
   * @example new CircularReferenceError('user.name');
   */
  constructor(path?: string) {
    super(path ? `Circular reference detected at ${path}` : 'Circular reference detected');
  }
}

/**
 * Raised when a value is outside a serializer's documented value domain.
 *
 * @remarks Extends SerializationError. The stable name is 'UnsupportedSerializationTypeError'; instanceof works across
 *   independently bundled package entry points using the shared error brand. Branding is
 *   for error classification, not authentication of untrusted objects.
 * @example new UnsupportedSerializationTypeError('function', 'user.name');
 */
export class UnsupportedSerializationTypeError extends SerializationError {
  /**
   * Stable 'UnsupportedSerializationTypeError' identity used by instance.name and cross-entry-point instanceof checks.
   * External subclasses must declare their own static readonly errorName rather than inheriting it.
   */
  static override readonly errorName: string = 'UnsupportedSerializationTypeError';

  /** A stable description of the unsupported JavaScript type. */
  readonly valueType: string;

  /**
   * Creates a UnsupportedSerializationTypeError with its stable name and diagnostic context.
   *
   * @param valueType - Description of the unsupported type or serialization constraint, retained as valueType.
   * @param path - Diagnostic property path; optional where the constructor signature permits omission.
   * @throws {TypeError} When constructing a subclass that has not declared its own static errorName.
   * @example new UnsupportedSerializationTypeError('function', 'user.name');
   */
  constructor(valueType: string, path?: string) {
    super(`Unsupported serialization type${path ? ` at ${path}` : ''}: ${valueType}`);
    this.valueType = valueType;
  }
}

/**
 * Raised when the Web Crypto API required by an operation is unavailable.
 *
 * @remarks Extends SecurityError. The stable name is 'WebCryptoUnavailableError'; instanceof works across
 *   independently bundled package entry points using the shared error brand. Branding is
 *   for error classification, not authentication of untrusted objects.
 * @example new WebCryptoUnavailableError();
 */
export class WebCryptoUnavailableError extends SecurityError {
  /**
   * Stable 'WebCryptoUnavailableError' identity used by instance.name and cross-entry-point instanceof checks.
   * External subclasses must declare their own static readonly errorName rather than inheriting it.
   */
  static override readonly errorName: string = 'WebCryptoUnavailableError';

  /**
   * Creates a WebCryptoUnavailableError with its stable name and diagnostic context.
   *
   *
   * @throws {TypeError} When constructing a subclass that has not declared its own static errorName.
   * @example new WebCryptoUnavailableError();
   */
  constructor() {
    super('The Web Crypto API is unavailable in this runtime');
  }
}

/**
 * Raised when cryptographically secure randomness is unavailable.
 *
 * @remarks Extends SecurityError. The stable name is 'SecureRandomUnavailableError'; instanceof works across
 *   independently bundled package entry points using the shared error brand. Branding is
 *   for error classification, not authentication of untrusted objects.
 * @example new SecureRandomUnavailableError({ cause: new Error('Underlying failure') });
 */
export class SecureRandomUnavailableError extends SecurityError {
  /**
   * Stable 'SecureRandomUnavailableError' identity used by instance.name and cross-entry-point instanceof checks.
   * External subclasses must declare their own static readonly errorName rather than inheriting it.
   */
  static override readonly errorName: string = 'SecureRandomUnavailableError';

  /**
   * Creates a SecureRandomUnavailableError with its stable name and diagnostic context.
   *
   * @param options - Optional lower-level cause; defaults to no cause. The cause value is retained by reference.
   * @throws {TypeError} When constructing a subclass that has not declared its own static errorName.
   * @example new SecureRandomUnavailableError({ cause: new Error('Underlying failure') });
   */
  constructor(options: SdcoreUtilsErrorOptions = {}) {
    super('Cryptographically secure randomness is unavailable in this runtime', options);
  }
}

/**
 * Raised when an authenticated-encryption token is malformed or unsupported.
 *
 * @remarks Extends ValidationError. The stable name is 'EncryptionFormatError'; instanceof works across
 *   independently bundled package entry points using the shared error brand. Branding is
 *   for error classification, not authentication of untrusted objects.
 * @example new EncryptionFormatError('Invalid input', { cause: new Error('Underlying failure') });
 */
export class EncryptionFormatError extends ValidationError {
  /**
   * Stable 'EncryptionFormatError' identity used by instance.name and cross-entry-point instanceof checks.
   * External subclasses must declare their own static readonly errorName rather than inheriting it.
   */
  static override readonly errorName: string = 'EncryptionFormatError';
}

/**
 * Raised when authenticated decryption fails without exposing secret material.
 *
 * @remarks Extends SecurityError. The stable name is 'EncryptionAuthenticationError'; instanceof works across
 *   independently bundled package entry points using the shared error brand. Branding is
 *   for error classification, not authentication of untrusted objects.
 * @example new EncryptionAuthenticationError({ cause: new Error('Underlying failure') });
 */
export class EncryptionAuthenticationError extends SecurityError {
  /**
   * Stable 'EncryptionAuthenticationError' identity used by instance.name and cross-entry-point instanceof checks.
   * External subclasses must declare their own static readonly errorName rather than inheriting it.
   */
  static override readonly errorName: string = 'EncryptionAuthenticationError';

  /**
   * Creates a EncryptionAuthenticationError with its stable name and diagnostic context.
   *
   * @param options - Optional lower-level cause; defaults to no cause. The cause value is retained by reference.
   * @throws {TypeError} When constructing a subclass that has not declared its own static errorName.
   * @example new EncryptionAuthenticationError({ cause: new Error('Underlying failure') });
   */
  constructor(options: SdcoreUtilsErrorOptions = {}) {
    super('Authenticated decryption failed', options);
  }
}

/**
 * Raised when a filter definition is malformed or exceeds safety limits.
 *
 * @remarks Extends ValidationError. The stable name is 'FilterValidationError'; instanceof works across
 *   independently bundled package entry points using the shared error brand. Branding is
 *   for error classification, not authentication of untrusted objects.
 * @example new FilterValidationError('Invalid input', { cause: new Error('Underlying failure') });
 */
export class FilterValidationError extends ValidationError {
  /**
   * Stable 'FilterValidationError' identity used by instance.name and cross-entry-point instanceof checks.
   * External subclasses must declare their own static readonly errorName rather than inheriting it.
   */
  static override readonly errorName: string = 'FilterValidationError';
}

/**
 * Raised when a strict date or instant cannot be parsed.
 *
 * @remarks Extends ValidationError. The stable name is 'DateParseError'; instanceof works across
 *   independently bundled package entry points using the shared error brand. Branding is
 *   for error classification, not authentication of untrusted objects.
 * @example new DateParseError('Invalid input', { cause: new Error('Underlying failure') });
 */
export class DateParseError extends ValidationError {
  /**
   * Stable 'DateParseError' identity used by instance.name and cross-entry-point instanceof checks.
   * External subclasses must declare their own static readonly errorName rather than inheriting it.
   */
  static override readonly errorName: string = 'DateParseError';
}

/**
 * Raised when a paginated endpoint returns a malformed or non-progressing page.
 *
 * @remarks Extends ValidationError. The stable name is 'PagingResponseError'; instanceof works across
 *   independently bundled package entry points using the shared error brand. Branding is
 *   for error classification, not authentication of untrusted objects.
 * @example new PagingResponseError('Invalid input', { cause: new Error('Underlying failure') });
 */
export class PagingResponseError extends ValidationError {
  /**
   * Stable 'PagingResponseError' identity used by instance.name and cross-entry-point instanceof checks.
   * External subclasses must declare their own static readonly errorName rather than inheriting it.
   */
  static override readonly errorName: string = 'PagingResponseError';
}

/**
 * Raised when pagination reaches its configured page limit.
 *
 * @remarks Extends ValidationError. The stable name is 'PagingLimitError'; instanceof works across
 *   independently bundled package entry points using the shared error brand. Branding is
 *   for error classification, not authentication of untrusted objects.
 * @example new PagingLimitError('Invalid input', { cause: new Error('Underlying failure') });
 */
export class PagingLimitError extends ValidationError {
  /**
   * Stable 'PagingLimitError' identity used by instance.name and cross-entry-point instanceof checks.
   * External subclasses must declare their own static readonly errorName rather than inheriting it.
   */
  static override readonly errorName: string = 'PagingLimitError';
}

/**
 * Raised when native file selection is cancelled, empty, or reaches its configured timeout.
 *
 * @remarks Extends ValidationError. The stable name is 'FilePickerCancelledError'; instanceof works across
 *   independently bundled package entry points using the shared error brand. Branding is
 *   for error classification, not authentication of untrusted objects.
 * @example new FilePickerCancelledError();
 */
export class FilePickerCancelledError extends ValidationError {
  /**
   * Stable 'FilePickerCancelledError' identity used by instance.name and cross-entry-point instanceof checks.
   * External subclasses must declare their own static readonly errorName rather than inheriting it.
   */
  static override readonly errorName: string = 'FilePickerCancelledError';

  /**
   * Creates a FilePickerCancelledError with its stable name and diagnostic context.
   *
   *
   * @throws {TypeError} When constructing a subclass that has not declared its own static errorName.
   * @example new FilePickerCancelledError();
   */
  constructor() {
    super('File selection was cancelled');
  }
}

/**
 * Raised when a navigation or download URL uses a disallowed protocol.
 *
 * @remarks Extends SecurityError. The stable name is 'UnsafeUrlProtocolError'; instanceof works across
 *   independently bundled package entry points using the shared error brand. Branding is
 *   for error classification, not authentication of untrusted objects.
 * @example new UnsafeUrlProtocolError('javascript:');
 */
export class UnsafeUrlProtocolError extends SecurityError {
  /**
   * Stable 'UnsafeUrlProtocolError' identity used by instance.name and cross-entry-point instanceof checks.
   * External subclasses must declare their own static readonly errorName rather than inheriting it.
   */
  static override readonly errorName: string = 'UnsafeUrlProtocolError';

  /** The rejected URL protocol. */
  readonly protocol: string;

  /**
   * Creates a UnsafeUrlProtocolError with its stable name and diagnostic context.
   *
   * @param protocol - Rejected URL scheme, normally including its trailing colon; retained as protocol.
   * @throws {TypeError} When constructing a subclass that has not declared its own static errorName.
   * @example new UnsafeUrlProtocolError('javascript:');
   */
  constructor(protocol: string) {
    super(`URL protocol is not allowed: ${protocol || '(missing)'}`);
    this.protocol = protocol;
  }
}

/**
 * Raised when a subscribable completes before producing a value.
 *
 * @remarks Extends ValidationError. The stable name is 'EmptySubscribableError'; instanceof works across
 *   independently bundled package entry points using the shared error brand. Branding is
 *   for error classification, not authentication of untrusted objects.
 * @example new EmptySubscribableError();
 */
export class EmptySubscribableError extends ValidationError {
  /**
   * Stable 'EmptySubscribableError' identity used by instance.name and cross-entry-point instanceof checks.
   * External subclasses must declare their own static readonly errorName rather than inheriting it.
   */
  static override readonly errorName: string = 'EmptySubscribableError';

  /**
   * Creates a EmptySubscribableError with its stable name and diagnostic context.
   *
   *
   * @throws {TypeError} When constructing a subclass that has not declared its own static errorName.
   * @example new EmptySubscribableError();
   */
  constructor() {
    super('The subscribable completed without emitting a value');
  }
}

/**
 * Reports whether a value caught in catch represents intentional request cancellation.
 *
 * Cancellation is deliberate, rather than a failed operation: rethrow for the caller
 * or ignore it at the UI boundary without a toast, error log, or error UI state.
 * Common sources are typing a new search (superseding the previous request),
 * changing pages or filters, navigating away, and component teardown.
 *
 * Returns true under either of these rules:
 * - A non-null object has name === 'AbortError', including DOMException and renamed Error objects.
 * - The supplied signal has aborted === true and error === signal.reason (strict identity/value equality).
 *
 * A readable name === 'TimeoutError' always returns false, even when it equals
 * signal.reason: a timeout is a real failure that the UI should report. All other
 * values return false unless the custom-reason rule matches. The cause chain is
 * never traversed, so a wrapper failure is not mistaken for its cancellation cause.
 * A failed necessary property read also returns false.
 *
 * DOMException uses name to distinguish error kinds; it has no subclass for each
 * kind. Checking name instead of instanceof DOMException also works across realms,
 * where the same kind of exception may have a different constructor.
 *
 * Pass the request's signal when abort(customReason) is possible. A custom reason
 * can be any value and may have no AbortError name; without that signal, the helper
 * cannot associate it with cancellation. An un-aborted signal never matches its reason.
 * TimeoutError still takes precedence over custom-reason matching.
 *
 * This helper only recognizes cancellation. To throw it, use the platform's
 * signal.throwIfAborted(), or Promise.reject(signal.reason) after confirming
 * signal.aborted. No custom AbortError class or throwing helper is needed.
 *
 * @param error - Any caught value, including null, undefined, primitives, errors, and objects.
 * Null/undefined do not match by name; they can match a supplied aborted signal's reason.
 * @param signal - The request's signal for custom-reason matching. Omit it, or pass null or
 * undefined, to use only the AbortError name rule.
 * @returns True for recognized intentional cancellation; false for timeouts, unrelated
 * values, or failed necessary property reads.
 * @remarks
 * Never throws, including for throwing getters or revoked Proxies. Reads name at
 * most once, and only reads reason after confirming aborted === true. Works in
 * browsers, Node.js (including Node 20/22/24), and jsdom without relying on realm identity.
 * Has no intentional side effects: it does not mutate inputs, abort, log, show UI,
 * perform I/O, create timers, or attach listeners. Property getters/Proxy traps can
 * run caller code; their own side effects cannot be undone by this predicate.
 * Name matching is classification, not proof of an error's origin or authorization.
 *
 * @example
 * A business service suppresses cancellation toasts and rethrows so its caller owns recovery.
 * ```ts
 * import { isAbortError } from '@sdcorejs/utils/errors';
 *
 * export async function loadProfile(
 *   showToast: (message: string) => void,
 *   signal?: AbortSignal,
 * ): Promise<unknown> {
 *   try {
 *     const response = await fetch('/api/profile', { signal });
 *     if (!response.ok) throw new Error('Profile request failed');
 *     return await response.json();
 *   } catch (error: unknown) {
 *     if (!isAbortError(error, signal)) showToast('Could not load the profile.');
 *     throw error;
 *   }
 * }
 * ```
 *
 * @example
 * A search box cancels the previous fetch and ignores stale results; call cancel() on navigation or teardown.
 * ```ts
 * import { isAbortError } from '@sdcorejs/utils/errors';
 *
 * export function createSearch(
 *   render: (results: unknown) => void,
 *   showError: (error: unknown) => void,
 * ) {
 *   let current: AbortController | undefined;
 *   return {
 *     async search(query: string): Promise<void> {
 *       current?.abort();
 *       const controller = new AbortController();
 *       current = controller;
 *       try {
 *         const response = await fetch('/api/search?q=' + encodeURIComponent(query), {
 *           signal: controller.signal,
 *         });
 *         if (!response.ok) throw new Error('Search request failed');
 *         const results: unknown = await response.json();
 *         if (current === controller && !controller.signal.aborted) render(results);
 *       } catch (error: unknown) {
 *         if (current !== controller || isAbortError(error, controller.signal)) return;
 *         showError(error);
 *       }
 *     },
 *     cancel(): void {
 *       current?.abort();
 *       current = undefined;
 *     },
 *   };
 * }
 * ```
 *
 * @example
 * Pass the same request signal to identify a custom reason thrown by the platform.
 * ```ts
 * import { isAbortError } from '@sdcorejs/utils/errors';
 *
 * export function customCancellation(): boolean {
 *   const controller = new AbortController();
 *   const reason = { action: 'navigation' };
 *   controller.abort(reason);
 *   try {
 *     controller.signal.throwIfAborted();
 *     return false;
 *   } catch (error: unknown) {
 *     return isAbortError(error, controller.signal); // true; without the signal: false
 *   }
 * }
 * ```
 *
 * @example
 * A timed-out fetch remains a real failure: TimeoutError returns false even with its signal, so show the error.
 * ```ts
 * import { isAbortError } from '@sdcorejs/utils/errors';
 *
 * export async function loadWithTimeout(showError: (error: unknown) => void): Promise<void> {
 *   const signal = AbortSignal.timeout(1_000);
 *   try {
 *     const response = await fetch('/api/report', { signal });
 *     if (!response.ok) throw new Error('Report request failed');
 *   } catch (error: unknown) {
 *     if (!isAbortError(error, signal)) showError(error);
 *   }
 * }
 * ```
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/reason
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/throwIfAborted
 * @see {@link fetchAllByPaging} for paged requests that accept an AbortSignal.
 */
export const isAbortError = (error: unknown, signal?: AbortSignal | null): boolean => {
  try {
    // why: only non-null objects participate in the platform error-name rule.
    if (typeof error === 'object' && error !== null) {
      const name = (error as { name?: unknown }).name;
      // why: a deadline is a real failure, even when it is also the signal's reason.
      if (name === 'TimeoutError') return false;
      // why: name identifies cancellation across realms without constructor checks.
      if (name === 'AbortError') return true;
    }
    // why: custom reasons may be any value, but only an aborted request can supply one.
    if (signal != null && signal.aborted === true) return error === signal.reason;
    // why: unrelated values and signals that have not aborted do not prove cancellation.
    return false;
  } catch {
    // why: classification in a catch handler must survive hostile getters and Proxies.
    return false;
  }
};
