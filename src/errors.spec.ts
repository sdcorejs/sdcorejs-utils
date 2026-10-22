import { once } from 'node:events';
import { createServer } from 'node:http';
import { JSDOM } from 'jsdom';
import { beforeAll, describe, expect, it, vi } from 'vitest';
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

describe('isAbortError cancellation contract', () => {
  // Keep the missing-export RED an assertion failure, not an import/configuration failure.
  const { isAbortError } = errors as typeof errors & {
    isAbortError: (error: unknown, signal?: AbortSignal | null) => boolean;
  };
  beforeAll(() => expect(isAbortError).toBeTypeOf('function'));

  it('recognizes AbortError names, including a DOMException from another realm', () => {
    expect(isAbortError(new DOMException('cancelled', 'AbortError'))).toBe(true);
    expect(isAbortError(Object.assign(new Error('cancelled'), { name: 'AbortError' }))).toBe(true);
    expect(isAbortError({ name: 'AbortError' }, null)).toBe(true);
    const window = new JSDOM('').window;
    try {
      const foreign = new window.DOMException('cancelled', 'AbortError');
      expect(foreign instanceof DOMException).toBe(false);
      expect(isAbortError(foreign)).toBe(true);
    } finally {
      window.close();
    }
  });

  it.each([new Error('custom'), {}, 'cancelled', 42, true, null, Symbol('reason'), () => undefined])(
    'requires the aborted signal to recognize a custom reason (%s)', (reason) => {
      const controller = new AbortController();
      controller.abort(reason);
      expect(isAbortError(reason)).toBe(false);
      expect(isAbortError(reason, controller.signal)).toBe(true);
      expect(isAbortError({}, controller.signal)).toBe(false);
    },
  );

  it('uses strict equality, requires aborted === true, and accepts null/undefined signals', () => {
    const controller = new AbortController();
    expect(isAbortError(controller.signal.reason, controller.signal)).toBe(false);
    controller.abort(NaN);
    expect(isAbortError(NaN, controller.signal)).toBe(false);
    expect(isAbortError(undefined, { aborted: true, reason: undefined } as AbortSignal)).toBe(true);
    expect(isAbortError('x', { aborted: 1, reason: 'x' } as unknown as AbortSignal)).toBe(false);
    expect(isAbortError({}, null)).toBe(false);
    expect(isAbortError({}, undefined)).toBe(false);
    const aborted = AbortSignal.abort();
    expect(isAbortError(aborted.reason)).toBe(true);
    expect(isAbortError(aborted.reason, aborted)).toBe(true);
  });

  it('always rejects TimeoutError, even when it matches the aborted signal reason', async () => {
    const reason = new DOMException('late', 'TimeoutError');
    expect(isAbortError(reason)).toBe(false);
    expect(isAbortError(reason, AbortSignal.abort(reason))).toBe(false);
    expect(isAbortError({ name: 'TimeoutError' })).toBe(false);
    const signal = AbortSignal.timeout(1);
    await new Promise<void>(resolve => signal.addEventListener('abort', () => resolve(), { once: true }));
    expect(signal.reason.name).toBe('TimeoutError');
    expect(isAbortError(signal.reason, signal)).toBe(false);
  });

  it.each([null, undefined, 'AbortError', 0, false, 1n, Symbol('AbortError'), {}, new Error('ordinary')])(
    'rejects unrelated input without throwing (%s)', value => expect(isAbortError(value)).toBe(false),
  );

  it('rejects every default utils error class', () => {
    for (const [, ErrorType] of exportedErrorClasses) {
      const instance = Reflect.construct(ErrorType, ['test']);
      expect(isAbortError(instance), ErrorType.errorName).toBe(false);
    }
  });

  it('does not read cause, mutate frozen input, or inspect a matching AbortError signal', () => {
    const cause = vi.fn(() => { throw new Error('must not read cause'); });
    const error = Object.freeze({ name: 'AbortError', get cause() { return cause(); } });
    const signal = new Proxy({} as AbortSignal, { get() { throw new Error('unused signal'); } });
    expect(isAbortError(error, signal)).toBe(true);
    expect(isAbortError(Object.freeze({ get cause() { return cause(); } }))).toBe(false);
    expect(isAbortError({ cause: error })).toBe(false);
    expect(cause).not.toHaveBeenCalled();
    const reason = Object.freeze({ message: 'custom' });
    expect(isAbortError(reason, Object.freeze({ aborted: true, reason }) as AbortSignal)).toBe(true);
  });

  it('reads name once and reason only after confirming the signal is aborted', () => {
    const name = vi.fn(() => 'AbortError');
    expect(isAbortError({ get name() { return name(); } })).toBe(true);
    expect(name).toHaveBeenCalledTimes(1);
    const reason = vi.fn(() => { throw new Error('unused reason'); });
    expect(isAbortError({}, { aborted: false, get reason() { return reason(); } } as unknown as AbortSignal)).toBe(false);
    expect(reason).not.toHaveBeenCalled();
    const timeoutName = vi.fn(() => 'TimeoutError');
    const timeout = { get name() { return timeoutName(); } };
    expect(isAbortError(timeout, AbortSignal.abort(timeout))).toBe(false);
    expect(timeoutName).toHaveBeenCalledTimes(1);
  });

  it('contains throwing accessors, throwing proxies and revoked proxies', () => {
    const throwing = { get name() { throw new Error('name'); } };
    const proxy = new Proxy({}, { get() { throw new Error('proxy'); } });
    const revoked = Proxy.revocable({}, {});
    revoked.revoke();
    for (const value of [throwing, proxy, revoked.proxy]) {
      expect(isAbortError(value)).toBe(false);
      expect(isAbortError(value, AbortSignal.abort(value))).toBe(false);
    }
    for (const signal of [
      new Proxy({}, { get() { throw new Error('signal proxy'); } }),
      { get aborted() { throw new Error('aborted'); } },
      { aborted: true, get reason() { throw new Error('reason'); } },
      revoked.proxy,
    ]) {
      expect(isAbortError({}, signal as AbortSignal)).toBe(false);
    }
  });

  it.skipIf(typeof fetch !== 'function')('recognizes a real fetch aborted after the server receives it', async () => {
    const server = createServer();
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const controller = new AbortController();
    try {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Expected TCP address');
      const received = once(server, 'request');
      const result = fetch(`http://127.0.0.1:${address.port}`, { signal: controller.signal })
        .then(() => { throw new Error('Expected fetch rejection'); }, error => error as unknown);
      await Promise.race([received, result.then(() => { throw new Error('Fetch ended before request'); })]);
      controller.abort();
      const error = await result;
      expect(isAbortError(error)).toBe(true);
      expect(isAbortError(error, controller.signal)).toBe(true);
    } finally {
      controller.abort();
      const closed = new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      server.closeAllConnections();
      await closed;
    }
  });
});

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
