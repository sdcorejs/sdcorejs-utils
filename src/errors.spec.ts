import { describe, expect, it } from 'vitest';
import * as errors from './errors';
import {
  CircularReferenceError,
  DateParseError,
  EmptySubscribableError,
  EncryptionAuthenticationError,
  EncryptionFormatError,
  FilePickerCancelledError,
  FilterValidationError,
  PagingLimitError,
  PagingResponseError,
  SdcoreUtilsError,
  SecureRandomUnavailableError,
  SecurityError,
  SerializationError,
  UnsafeObjectKeyError,
  UnsafePropertyPathError,
  UnsafeUrlProtocolError,
  UnsupportedSerializationTypeError,
  ValidationError,
  WebCryptoUnavailableError,
} from './errors';

const ERROR_BRANDS = Symbol.for('@sdcorejs/utils/error-brands');

type ErrorClass = (abstract new (...args: never[]) => Error) & { readonly errorName?: string };

const exportedErrorClasses = (Object.entries(errors) as [string, unknown][]).filter(
  (entry): entry is [string, ErrorClass] =>
    typeof entry[1] === 'function' &&
    (entry[1] === SdcoreUtilsError || (entry[1] as { prototype: unknown }).prototype instanceof SdcoreUtilsError),
);

const branded = (...names: string[]) => ({ [ERROR_BRANDS]: Object.freeze(names) });

describe('error class identity', () => {
  it('exports every error class with its own errorName equal to the export name', () => {
    expect(exportedErrorClasses.map(([name]) => name).sort()).toEqual(
      [
        'CircularReferenceError', 'DateParseError', 'EmptySubscribableError', 'EncryptionAuthenticationError',
        'EncryptionFormatError', 'FilePickerCancelledError', 'FilterValidationError', 'PagingLimitError',
        'PagingResponseError', 'SdcoreUtilsError', 'SecureRandomUnavailableError', 'SecurityError',
        'SerializationError', 'UnsafeObjectKeyError', 'UnsafePropertyPathError', 'UnsafeUrlProtocolError',
        'UnsupportedSerializationTypeError', 'ValidationError', 'WebCryptoUnavailableError',
      ].sort(),
    );
    for (const [exportName, errorClass] of exportedErrorClasses) {
      expect(Object.hasOwn(errorClass, 'errorName'), exportName).toBe(true);
      expect(errorClass.errorName, exportName).toBe(exportName);
    }
    const names = exportedErrorClasses.map(([, errorClass]) => errorClass.errorName);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('error instances keep their observable contract', () => {
  const cause = new Error('lower level');
  const cases: { error: SdcoreUtilsError; errorClass: ErrorClass; message: string; parents: ErrorClass[]; fields?: Record<string, unknown> }[] = [
    { error: new SdcoreUtilsError('base failure', { cause }), errorClass: SdcoreUtilsError, message: 'base failure', parents: [], fields: { cause } },
    { error: new SecurityError('security failure'), errorClass: SecurityError, message: 'security failure', parents: [SdcoreUtilsError] },
    { error: new ValidationError('validation failure'), errorClass: ValidationError, message: 'validation failure', parents: [SdcoreUtilsError] },
    { error: new SerializationError('serialization failure'), errorClass: SerializationError, message: 'serialization failure', parents: [SdcoreUtilsError] },
    { error: new UnsafeObjectKeyError('__proto__'), errorClass: UnsafeObjectKeyError, message: 'Unsafe object key rejected: "__proto__"', parents: [SecurityError, SdcoreUtilsError], fields: { key: '__proto__' } },
    { error: new UnsafePropertyPathError('a b', 'malformed dot segment'), errorClass: UnsafePropertyPathError, message: 'Unsafe property path rejected: malformed dot segment', parents: [SecurityError, SdcoreUtilsError], fields: { path: 'a b' } },
    { error: new CircularReferenceError('$.a'), errorClass: CircularReferenceError, message: 'Circular reference detected at $.a', parents: [ValidationError, SdcoreUtilsError] },
    { error: new CircularReferenceError(), errorClass: CircularReferenceError, message: 'Circular reference detected', parents: [ValidationError, SdcoreUtilsError] },
    { error: new UnsupportedSerializationTypeError('Map', '$.x'), errorClass: UnsupportedSerializationTypeError, message: 'Unsupported serialization type at $.x: Map', parents: [SerializationError, SdcoreUtilsError], fields: { valueType: 'Map' } },
    { error: new WebCryptoUnavailableError(), errorClass: WebCryptoUnavailableError, message: 'The Web Crypto API is unavailable in this runtime', parents: [SecurityError, SdcoreUtilsError] },
    { error: new SecureRandomUnavailableError({ cause }), errorClass: SecureRandomUnavailableError, message: 'Cryptographically secure randomness is unavailable in this runtime', parents: [SecurityError, SdcoreUtilsError], fields: { cause } },
    { error: new EncryptionFormatError('bad token'), errorClass: EncryptionFormatError, message: 'bad token', parents: [ValidationError, SdcoreUtilsError] },
    { error: new EncryptionAuthenticationError({ cause }), errorClass: EncryptionAuthenticationError, message: 'Authenticated decryption failed', parents: [SecurityError, SdcoreUtilsError], fields: { cause } },
    { error: new FilterValidationError('bad filter'), errorClass: FilterValidationError, message: 'bad filter', parents: [ValidationError, SdcoreUtilsError] },
    { error: new DateParseError('bad date'), errorClass: DateParseError, message: 'bad date', parents: [ValidationError, SdcoreUtilsError] },
    { error: new PagingResponseError('bad page'), errorClass: PagingResponseError, message: 'bad page', parents: [ValidationError, SdcoreUtilsError] },
    { error: new PagingLimitError('too many pages'), errorClass: PagingLimitError, message: 'too many pages', parents: [ValidationError, SdcoreUtilsError] },
    { error: new FilePickerCancelledError(), errorClass: FilePickerCancelledError, message: 'File selection was cancelled', parents: [ValidationError, SdcoreUtilsError] },
    { error: new UnsafeUrlProtocolError('javascript:'), errorClass: UnsafeUrlProtocolError, message: 'URL protocol is not allowed: javascript:', parents: [SecurityError, SdcoreUtilsError], fields: { protocol: 'javascript:' } },
    { error: new UnsafeUrlProtocolError(''), errorClass: UnsafeUrlProtocolError, message: 'URL protocol is not allowed: (missing)', parents: [SecurityError, SdcoreUtilsError], fields: { protocol: '' } },
    { error: new EmptySubscribableError(), errorClass: EmptySubscribableError, message: 'The subscribable completed without emitting a value', parents: [ValidationError, SdcoreUtilsError] },
  ];

  it.each(cases)('$errorClass.errorName keeps name, message, fields and native instanceof', ({ error, errorClass, message, parents, fields }) => {
    expect(error.name).toBe(errorClass.errorName);
    expect(error.message).toBe(message);
    for (const [field, value] of Object.entries(fields ?? {})) {
      expect((error as unknown as Record<string, unknown>)[field], field).toBe(value);
    }
    expect(error).toBeInstanceOf(Error);
    expect(error instanceof errorClass).toBe(true);
    for (const parent of parents) expect(error instanceof parent, parent.errorName).toBe(true);
    expect((error as unknown as Record<symbol, unknown>)[ERROR_BRANDS]).toEqual(
      [errorClass, ...parents].map(item => item.errorName),
    );
  });
});

describe('brand matching uses errorName only', () => {
  it('matches a foreign branded object against the named class and its parents only', () => {
    const foreign = branded('UnsafePropertyPathError', 'SecurityError', 'SdcoreUtilsError');
    expect(foreign instanceof UnsafePropertyPathError).toBe(true);
    expect(foreign instanceof SecurityError).toBe(true);
    expect(foreign instanceof SdcoreUtilsError).toBe(true);
    expect(foreign instanceof ValidationError).toBe(false);
    expect(foreign instanceof UnsafeObjectKeyError).toBe(false);
  });

  it('ignores a renamed constructor, as produced by bundlers', () => {
    class Sub extends ValidationError {
      static override readonly errorName = 'Sub';
    }
    // why: esbuild renames duplicated class bindings (e.g. `Sub2`) and minifiers shorten them.
    Object.defineProperty(Sub, 'name', { value: 'Re' });

    const error = new Sub('renamed');
    expect(error.name).toBe('Sub');
    expect(error instanceof ValidationError).toBe(true);
    expect(branded('Sub', 'ValidationError', 'SdcoreUtilsError') instanceof Sub).toBe(true);
    expect(branded('Re', 'ValidationError', 'SdcoreUtilsError') instanceof Sub).toBe(false);
  });

  it('never brand-matches a class that lacks its own errorName', () => {
    // why: an inherited errorName would make the class match every error branded with its parent.
    class Unnamed extends ValidationError {}
    expect(branded('ValidationError', 'SdcoreUtilsError') instanceof Unnamed).toBe(false);
    expect(new ValidationError('plain') instanceof Unnamed).toBe(false);
  });
});

describe('subclassing contract', () => {
  it('rejects a subclass that does not declare its own errorName', () => {
    class Custom extends ValidationError {}
    expect(() => new Custom('missing name')).toThrow(TypeError);
    expect(() => new Custom('missing name')).toThrow('Custom must declare its own static errorName');
  });

  it('accepts a subclass that declares its own errorName', () => {
    class Custom2 extends ValidationError {
      static override readonly errorName = 'Custom2';
    }
    const error = new Custom2('declared');
    expect(error.name).toBe('Custom2');
    expect(error.message).toBe('declared');
    expect(error instanceof ValidationError).toBe(true);
    expect(error instanceof SdcoreUtilsError).toBe(true);
  });
});
