import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { StringUtilities as RootStringUtilities, type StringMaskOptions as RootMaskOptions } from '../index';
import { StringUtilities, type StringMaskOptions } from './index';
import { ValidationError } from '../errors';

const runtimeMask = (value: unknown, options?: unknown): unknown =>
  (StringUtilities.mask as (value: unknown, options?: unknown) => unknown)(value, options);

afterEach(() => vi.unstubAllGlobals());

describe('StringUtilities.mask', () => {
  it.each([
    ['', undefined, ''],
    ['', { keepStart: 100, keepEnd: 100 }, ''],
    ['1', undefined, '****'],
    ['12', undefined, '****'],
    ['12345', undefined, '****'],
    ['12345', {}, '****'],
    ['12345', { keepStart: 0, keepEnd: 0 }, '****'],
    ['12345', { keepStart: undefined, keepEnd: undefined, maskLength: undefined }, '****'],
    ['12345', { keepStart: 2 }, '12****'],
    ['12345', { keepEnd: 2 }, '****45'],
    ['1', { keepEnd: 2 }, '****'],
    ['12', { keepEnd: 2 }, '****'],
    ['123', { keepEnd: 2 }, '****23'],
    ['1', { keepStart: 1 }, '****'],
    ['12', { keepStart: 2 }, '****'],
    ['123', { keepStart: 2 }, '12****'],
    ['0912345678', { keepStart: 3, keepEnd: 2 }, '091****78'],
    ['12345', { keepStart: 2, keepEnd: 3 }, '****'],
    ['12345', { keepStart: 3, keepEnd: 3 }, '****'],
    ['12345', { keepStart: 6 }, '****'],
    ['12345', { keepEnd: 6 }, '****'],
    ['12345', { keepStart: Number.MAX_SAFE_INTEGER, keepEnd: Number.MAX_SAFE_INTEGER }, '****'],
    ['12345', { keepStart: 1, keepEnd: Number.MAX_SAFE_INTEGER }, '****'],
    ['12345', { keepStart: -0, keepEnd: -0 }, '****'],
    ['12345', { maskLength: 1 }, '*'],
    ['12345', { keepStart: 1, keepEnd: 1, maskLength: 7 }, '1*******5'],
    ['12', { keepEnd: 2, maskLength: 3 }, '***'],
    [' a b ', { keepStart: 1, keepEnd: 1 }, ' **** '],
    ['A\nB\tC', { keepStart: 2, keepEnd: 2 }, 'A\n****\tC'],
    ['*abc*', { keepStart: 1, keepEnd: 1 }, '******'],
  ] satisfies [string, StringMaskOptions | undefined, string][])(
    'masks %j with %j as %j', (value, options, expected) => {
      expect(StringUtilities.mask(value, options)).toBe(expected);
    },
  );

  it.each([null, undefined])('returns %s before reading or validating options', value => {
    const options = new Proxy({}, { get() { throw new Error('options must not be read'); } });
    expect(runtimeMask(value, options)).toBe(value);
    expect(runtimeMask(value, null)).toBe(value);
    expect(runtimeMask(value, { keepStart: -1, maskLength: Infinity })).toBe(value);
  });

  it.each([0, false, 1n, Symbol('value'), {}, [], new String('abc')])(
    'rejects non-string input %s without coercion', value => {
      expect(() => runtimeMask(value)).toThrow(ValidationError);
    },
  );

  it('does not invoke input coercion or mutate options', () => {
    const toString = vi.fn(() => 'abc');
    expect(() => runtimeMask({ toString })).toThrow(ValidationError);
    expect(toString).not.toHaveBeenCalled();
    const options = Object.freeze({ keepStart: 1, keepEnd: 1, maskLength: 2 });
    expect(StringUtilities.mask('abc', options)).toBe('a**c');
    expect(options).toEqual({ keepStart: 1, keepEnd: 1, maskLength: 2 });
  });

  it.each([null, false, 1, 'options', [], () => ({}), Symbol('options')])(
    'rejects invalid options %s', options => {
      expect(() => runtimeMask('abc', options)).toThrow(ValidationError);
    },
  );

  for (const key of ['keepStart', 'keepEnd', 'maskLength'] as const) {
    it.each([-1, 0.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, null, '1', true, 1n, {}, []])(
      `rejects invalid ${key} %s`, value => {
        expect(() => runtimeMask('abc', { [key]: value })).toThrow(ValidationError);
      },
    );
    it(`validates ${key} even for an empty string`, () => {
      expect(() => runtimeMask('', { [key]: -1 })).toThrow(ValidationError);
    });
  }

  it.each([0, -0, 1025, Number.MAX_SAFE_INTEGER])('rejects maskLength %s before repeat', maskLength => {
    expect(() => StringUtilities.mask('abc', { maskLength })).toThrow(ValidationError);
  });

  it('accepts the bounded maximum maskLength', () => {
    expect(StringUtilities.mask('abc', { maskLength: 1024 })).toBe('*'.repeat(1024));
  });

  it.each(['\u{1f600}', 'e\u0301', '\u{1f469}\u200d\u{1f4bb}', '\u{1f1fb}\u{1f1f3}', '\u{1f44d}\u{1f3fd}']) (
    'preserves whole grapheme %s at either edge', grapheme => {
      expect(StringUtilities.mask(`${grapheme}ab${grapheme}`, { keepStart: 1, keepEnd: 1 })).toBe(`${grapheme}****${grapheme}`);
      expect(StringUtilities.mask(`${grapheme}ab`, { keepStart: 1 })).toBe(`${grapheme}****`);
      expect(StringUtilities.mask(`ab${grapheme}`, { keepEnd: 1 })).toBe(`****${grapheme}`);
      expect(StringUtilities.mask(grapheme, { keepEnd: 1 })).toBe('****');
      expect(StringUtilities.mask(`${grapheme}${grapheme}`, { keepStart: 1, keepEnd: 1 })).toBe('****');
    },
  );

  it.each([undefined, {}])('reports missing Intl.Segmenter only when keeping graphemes', intl => {
    vi.stubGlobal('Intl', intl);
    expect(() => StringUtilities.mask('abc', { keepEnd: 1 })).toThrow(ValidationError);
    expect(StringUtilities.mask('abc')).toBe('****');
    expect(StringUtilities.mask('')).toBe('');
    expect(StringUtilities.mask(null)).toBeNull();
    expect(StringUtilities.mask(undefined)).toBeUndefined();
  });

  it('exports through root and /fns with precise nullish return types', () => {
    expect(RootStringUtilities.mask).toBe(StringUtilities.mask);
    expectTypeOf<RootMaskOptions>().toEqualTypeOf<StringMaskOptions>();
    expectTypeOf(StringUtilities.mask('literal')).toEqualTypeOf<string>();
    expectTypeOf(StringUtilities.mask(null)).toEqualTypeOf<null>();
    expectTypeOf(StringUtilities.mask(undefined)).toEqualTypeOf<undefined>();
    const checkTypes = (nullable: string | null, optional: string | undefined, union: string | null | undefined) => {
      expectTypeOf(StringUtilities.mask(nullable)).toEqualTypeOf<string | null>();
      expectTypeOf(StringUtilities.mask(optional)).toEqualTypeOf<string | undefined>();
      expectTypeOf(StringUtilities.mask(union)).toEqualTypeOf<string | null | undefined>();
      // @ts-expect-error Numeric inputs are outside the public contract.
      StringUtilities.mask(123);
      // @ts-expect-error The mask character is fixed and is not an option.
      StringUtilities.mask('abc', { maskChar: '#' });
    };
    void checkTypes;
  });
});
