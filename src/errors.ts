/** Options shared by all public `@sdcorejs/utils` errors. */
export interface SdcoreUtilsErrorOptions {
  /** The lower-level error that caused this failure, when available. */
  cause?: unknown;
}

const ERROR_BRANDS = Symbol.for('@sdcorejs/utils/error-brands');

interface BrandedError {
  readonly [ERROR_BRANDS]?: readonly string[];
}

/** Base class for errors intentionally raised by `@sdcorejs/utils`. */
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

  /** The lower-level error that caused this failure, when available. */
  readonly cause?: unknown;

  /**
   * Preserves `instanceof` across independently bundled public entry points.
   * Native prototype-chain checks remain the fast path; the global-symbol brand, which holds the
   * `errorName` of every class in the chain, handles the same public error class loaded from
   * another package subpath.
   */
  static [Symbol.hasInstance](value: unknown): boolean {
    if (Function.prototype[Symbol.hasInstance].call(this, value)) return true;
    // why: an inherited errorName would let an undeclared subclass match every error of its parent.
    if (!Object.hasOwn(this, 'errorName')) return false;
    if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return false;
    const brands = (value as BrandedError)[ERROR_BRANDS];
    return Array.isArray(brands) && brands.includes(this.errorName);
  }

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

/** Base class for rejected operations that would cross a security boundary. */
export class SecurityError extends SdcoreUtilsError {
  static override readonly errorName: string = 'SecurityError';
}

/** Base class for invalid caller input. */
export class ValidationError extends SdcoreUtilsError {
  static override readonly errorName: string = 'ValidationError';
}

/** Base class for deterministic serialization failures. */
export class SerializationError extends SdcoreUtilsError {
  static override readonly errorName: string = 'SerializationError';
}

/** Raised when an object key could alter or expose a JavaScript prototype. */
export class UnsafeObjectKeyError extends SecurityError {
  static override readonly errorName: string = 'UnsafeObjectKeyError';

  /** The rejected key. */
  readonly key: string;

  constructor(key: string) {
    super(`Unsafe object key rejected: ${JSON.stringify(key)}`);
    this.key = key;
  }
}

/** Raised when a property path is malformed, too deep, or prototype-sensitive. */
export class UnsafePropertyPathError extends SecurityError {
  static override readonly errorName: string = 'UnsafePropertyPathError';

  /** The rejected path. */
  readonly path: string;

  constructor(path: string, reason: string) {
    super(`Unsafe property path rejected: ${reason}`);
    this.path = path;
  }
}

/** Raised when a recursive input graph contains a cycle that the API cannot encode. */
export class CircularReferenceError extends ValidationError {
  static override readonly errorName: string = 'CircularReferenceError';

  constructor(path?: string) {
    super(path ? `Circular reference detected at ${path}` : 'Circular reference detected');
  }
}

/** Raised when a value is outside a serializer's documented value domain. */
export class UnsupportedSerializationTypeError extends SerializationError {
  static override readonly errorName: string = 'UnsupportedSerializationTypeError';

  /** A stable description of the unsupported JavaScript type. */
  readonly valueType: string;

  constructor(valueType: string, path?: string) {
    super(`Unsupported serialization type${path ? ` at ${path}` : ''}: ${valueType}`);
    this.valueType = valueType;
  }
}

/** Raised when the Web Crypto API required by an operation is unavailable. */
export class WebCryptoUnavailableError extends SecurityError {
  static override readonly errorName: string = 'WebCryptoUnavailableError';

  constructor() {
    super('The Web Crypto API is unavailable in this runtime');
  }
}

/** Raised when cryptographically secure randomness is unavailable. */
export class SecureRandomUnavailableError extends SecurityError {
  static override readonly errorName: string = 'SecureRandomUnavailableError';

  constructor(options: SdcoreUtilsErrorOptions = {}) {
    super('Cryptographically secure randomness is unavailable in this runtime', options);
  }
}

/** Raised when an authenticated-encryption token is malformed or unsupported. */
export class EncryptionFormatError extends ValidationError {
  static override readonly errorName: string = 'EncryptionFormatError';
}

/** Raised when authenticated decryption fails without exposing secret material. */
export class EncryptionAuthenticationError extends SecurityError {
  static override readonly errorName: string = 'EncryptionAuthenticationError';

  constructor(options: SdcoreUtilsErrorOptions = {}) {
    super('Authenticated decryption failed', options);
  }
}

/** Raised when a filter definition is malformed or exceeds safety limits. */
export class FilterValidationError extends ValidationError {
  static override readonly errorName: string = 'FilterValidationError';
}

/** Raised when a strict date or instant cannot be parsed. */
export class DateParseError extends ValidationError {
  static override readonly errorName: string = 'DateParseError';
}

/** Raised when a paginated endpoint returns a malformed or non-progressing page. */
export class PagingResponseError extends ValidationError {
  static override readonly errorName: string = 'PagingResponseError';
}

/** Raised when pagination reaches its configured page limit. */
export class PagingLimitError extends ValidationError {
  static override readonly errorName: string = 'PagingLimitError';
}

/** Raised when a native file picker closes without a selection. */
export class FilePickerCancelledError extends ValidationError {
  static override readonly errorName: string = 'FilePickerCancelledError';

  constructor() {
    super('File selection was cancelled');
  }
}

/** Raised when a navigation or download URL uses a disallowed protocol. */
export class UnsafeUrlProtocolError extends SecurityError {
  static override readonly errorName: string = 'UnsafeUrlProtocolError';

  /** The rejected URL protocol. */
  readonly protocol: string;

  constructor(protocol: string) {
    super(`URL protocol is not allowed: ${protocol || '(missing)'}`);
    this.protocol = protocol;
  }
}

/** Raised when a subscribable completes before producing a value. */
export class EmptySubscribableError extends ValidationError {
  static override readonly errorName: string = 'EmptySubscribableError';

  constructor() {
    super('The subscribable completed without emitting a value');
  }
}
