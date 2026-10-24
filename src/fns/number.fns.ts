/* eslint-disable @typescript-eslint/no-explicit-any */

/** Options for strict numeric-string recognition and parsing. */
export interface NumericStringOptions {
  /** Permit surrounding whitespace by trimming first. Defaults to `false`. */
  trim?: boolean;
  /**
   * Permit unsigned hexadecimal text such as `0xff`, default false. Signed hex is rejected.
   * This branch is independent of the decimal/exponent/leading-plus options.
   */
  allowHex?: boolean;
  /** Permit exponent notation such as `1e3`. Defaults to `true`. */
  allowExponent?: boolean;
  /**
   * Permit fractional mantissas including `.5` and `1.`, default true. Setting false restricts
   * the mantissa to digits but does not disable exponent notation; configure allowExponent separately.
   */
  allowDecimal?: boolean;
  /**
   * Permit a leading plus on a decimal mantissa, default true. A leading minus is always
   * allowed; exponent signs remain allowed when allowExponent is enabled.
   */
  allowLeadingPlus?: boolean;
}

/** Options for finite-number parsing. */
export interface ParseFiniteNumberOptions extends NumericStringOptions {
  /** Permit boolean `true`/`false` as `1`/`0`. Disabled by default. */
  allowBoolean?: boolean;
}

/**
 * Formats a legacy numeric input with Vietnamese digit grouping and decimal separators.
 *
 * Despite its name, this produces a decimal number string with no currency symbol.
 * Commas are removed before Number coercion; it is not a parser for localized decimal
 * text. At most ten fractional digits are shown. Empty/nullish inputs yield `null`,
 * while whitespace can coerce to zero and infinity is allowed by the legacy contract.
 *
 * @param value - Value converted to text, stripped of commas, then coerced to a number.
 * @returns Locale-formatted decimal text, or `null` for empty or NaN-producing input.
 * @throws {TypeError} If a supplied object's string conversion fails.
 * @example
 * NumberUtilities.toVNCurrency('1,234.5'); // '1.234,5'
 * NumberUtilities.toVNCurrency(null); // null
 */
const toVNCurrency = (value: any) => {
  value = (value ?? '').toString().replace(/,/g, '');
  if (!value) return null;
  const val = +value;
  return !Number.isNaN(val) ? val.toLocaleString('vi-VN', { maximumFractionDigits: 10 }) : null;
};

/**
 * Alias of `NumberUtilities.toVNCurrency` with identical coercion and formatting.
 *
 * Commas are stripped before conversion. No currency symbol is added and no input
 * object is mutated; user-defined string conversion may run caller code.
 *
 * @param value - Legacy numeric input; empty/nullish/NaN-producing input returns `null`.
 * @returns Vietnamese decimal text with at most ten fractional digits, or `null`.
 * @throws {TypeError} If a supplied object's string conversion fails.
 * @example
 * NumberUtilities.toVN(1234.5); // '1.234,5'
 */
const toVN = toVNCurrency;

/**
 * Formats a legacy numeric input using en-US grouping and decimal separators.
 *
 * The name is historical: output is human-readable grouped decimal text, not an ISO
 * currency or machine-number encoding. Commas are stripped before coercion; localized
 * comma decimals are not parsed. Infinity is not rejected. No currency symbol is added.
 *
 * @param value - Value converted to text and then Number after removing all commas.
 * @returns en-US text with at most ten fractional digits, or `null` for empty/nullish/NaN input.
 * @throws {TypeError} If a supplied object's string conversion fails.
 * @example
 * NumberUtilities.toISO('1,234.5'); // '1,234.5'
 */
const toISO = (value: any) => {
  value = (value ?? '').toString().replace(/,/g, '');
  if (!value) return null;
  const val = +value;
  return !Number.isNaN(val) ? val.toLocaleString('en-US', { maximumFractionDigits: 10 }) : null;
};

/**
 * Checks the legacy digits-only representation of a value and requires it to exceed zero.
 *
 * Accepts numeric values and digit strings such as `'01'`. Signs, whitespace, decimal
 * points and exponent syntax are rejected. This is a syntax/coercion predicate, not a
 * safe-integer bound check; use explicit bounds for counters and array sizes.
 *
 * @param value - Candidate; falsy values immediately return false, others undergo regex coercion.
 * @returns True for a digits-only representation whose numeric conversion is greater than zero.
 * @throws {TypeError} If regex string coercion fails, for example for a Symbol.
 * @example
 * NumberUtilities.isPositiveInteger('01'); // true
 * NumberUtilities.isPositiveInteger(0); // false
 */
const isPositiveInteger = (value: any) => {
  if (!value) return false;
  return /^([0-9]*)$/.test(value) && +value > 0;
};

/**
 * Checks a positive legacy decimal representation without signs or exponent notation.
 *
 * Accepts digit strings, integer numbers and fractions such as `'.5'`. Zero, negatives,
 * whitespace and trailing decimal points are rejected. Conversion is not a finite-value
 * or precision guarantee; huge digit strings can still be accepted.
 *
 * @param value - Candidate; falsy values return false before regex coercion.
 * @returns Whether the allowed decimal representation converts to a value greater than zero.
 * @throws {TypeError} If regex string coercion fails.
 * @example
 * NumberUtilities.isPositiveNumber('.5'); // true
 * NumberUtilities.isPositiveNumber('-1'); // false
 */
const isPositiveNumber = (value: any) => {
  if (!value) return false;
  return /^([0-9]*)(\.[0-9]+$){0,1}$/.test(value) && +value > 0;
};

/**
 * Recognizes primitive finite JavaScript numbers without coercion.
 *
 * Accepts zero, negative zero, negative numbers and fractions. Rejects numeric strings,
 * boxed Number objects, nullish values, booleans, NaN and both infinities. No mutation,
 * property access on the value, or environment-dependent operation is performed.
 *
 * @param value - Any runtime value to narrow.
 * @returns True only when `value` has primitive number type and is finite.
 * @example
 * isFiniteNumber(0); // true
 * isFiniteNumber('12'); // false
 */
export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/**
 * Checks numeric text syntax under explicit options without converting the result.
 *
 * Defaults accept signed decimal and exponent forms, including `'.5'` and `'1.'`,
 * but reject surrounding whitespace and hexadecimal. This only validates syntax:
 * `'1e999'` can pass even though Number conversion overflows. Use `parseFiniteNumber`
 * when finite numeric output is required. Inputs and options are not modified.
 *
 * @param value - Primitive string candidate; empty/non-string inputs return false.
 * @param options - Trimming, hex, exponent, decimal and leading-plus policies.
 * @returns Whether the entire normalized string matches the selected grammar.
 * @example
 * isNumericString('1e3'); // true
 * isNumericString(' 12 ', { trim: true }); // true
 * isNumericString('0xff'); // false
 */
export const isNumericString = (value: unknown, options: NumericStringOptions = {}): value is string => {
  if (typeof value !== 'string' || value.length === 0) return false;
  const normalized = options.trim ? value.trim() : value;
  if (!normalized || (!options.trim && normalized !== value)) return false;
  if (options.allowHex && /^0[xX][0-9a-fA-F]+$/.test(normalized)) return true;
  const sign = options.allowLeadingPlus === false ? '-?' : '[+-]?';
  const unsigned = options.allowDecimal === false
    ? '\\d+'
    : '(?:\\d+(?:\\.\\d*)?|\\.\\d+)';
  const exponent = options.allowExponent === false ? '' : '(?:[eE][+-]?\\d+)?';
  return new RegExp(`^${sign}${unsigned}${exponent}$`).test(normalized);
};

/**
 * Converts a primitive number or explicitly allowed numeric string to a finite number.
 *
 * Numbers must already be finite. Strings follow `isNumericString` options, then use
 * Number conversion; an overflowing result is rejected. Boolean conversion is opt-in.
 * Objects, arrays, bigint and nullish values are never coerced. No input is mutated.
 *
 * @param value - Untrusted candidate value.
 * @param options - Numeric syntax policy; `allowBoolean` defaults to false.
 * @returns A finite number, including zero/negative zero, or `null` when rejected.
 * @example
 * parseFiniteNumber('1e3'); // 1000
 * parseFiniteNumber('1e999'); // null
 * parseFiniteNumber(true, { allowBoolean: true }); // 1
 */
export const parseFiniteNumber = (
  value: unknown,
  options: ParseFiniteNumberOptions = {},
): number | null => {
  if (isFiniteNumber(value)) return value;
  if (typeof value === 'boolean') return options.allowBoolean ? Number(value) : null;
  if (!isNumericString(value, options)) return null;
  const parsed = Number(options.trim ? value.trim() : value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Broad v1.x coercion check retained unchanged for compatibility.
 *
 * @deprecated Use {@link isFiniteNumber}, {@link isNumericString}, or
 * {@link parseFiniteNumber}. Arrays and booleans may be accepted by this legacy API.
 *
 * @param value - Candidate subjected to unary-plus coercion after a nullish/empty guard.
 * @returns False for null, undefined, empty text or NaN conversion; infinity is accepted.
 * @throws {TypeError} If numeric coercion fails, including Symbol and bigint inputs.
 * @example
 * NumberUtilities.isNumber(true); // true (legacy coercion)
 * NumberUtilities.isNumber(''); // false
 */
export const isNumber = (value: any) => {
  if (value === undefined || value === null || value === '') return false;
  return !Number.isNaN(+value);
};

/**
 * Rounds a legacy numeric input using `Math.round(value * 10 ** digits) / 10 ** digits`.
 *
 * This is binary floating-point arithmetic, not exact decimal or financial rounding.
 * Half-way values follow Math.round (toward positive infinity); negative zero may be
 * retained. Precision is not validated and extreme values can produce NaN/infinity.
 *
 * @param value - Candidate accepted by legacy `isNumber`, including coercible values.
 * @param digits - Decimal places, default 2; negative values round to tens/hundreds.
 * @returns Rounded number, or `null` when legacy numeric validation fails.
 * @throws {TypeError} If numeric coercion fails.
 * @example
 * NumberUtilities.round(12.345, 2); // 12.35
 * NumberUtilities.round(149, -1); // 150
 * NumberUtilities.round(null); // null
 */
const round = (value: any, digits = 2): number | null => {
  if (!isNumber(value)) return null;
  const val = Math.pow(10, digits);
  return Math.round(value * val) / val;
};

/**
 * Numeric syntax checks, explicit finite parsing, locale formatting and legacy rounding.
 *
 * Prefer `isFiniteNumber`, `isNumericString` and `parseFiniteNumber` for new input
 * validation. Formatting/rounding helpers retain documented legacy coercion and IEEE
 * 754 precision behavior; they do not provide exact monetary arithmetic.
 *
 * @example
 * import { NumberUtilities } from '@sdcorejs/utils/fns';
 * NumberUtilities.parseFiniteNumber('42'); // 42
 */
export const NumberUtilities = {
  /**
   * Formats a legacy numeric input with Vietnamese digit grouping and decimal separators.
   *
   * Despite its name, this produces a decimal number string with no currency symbol.
   * Commas are removed before Number coercion; it is not a parser for localized decimal
   * text. At most ten fractional digits are shown. Empty/nullish inputs yield `null`,
   * while whitespace can coerce to zero and infinity is allowed by the legacy contract.
   *
   * @param value - Value converted to text, stripped of commas, then coerced to a number.
   * @returns Locale-formatted decimal text, or `null` for empty or NaN-producing input.
   * @throws {TypeError} If a supplied object's string conversion fails.
   * @example
   * NumberUtilities.toVNCurrency('1,234.5'); // '1.234,5'
   * NumberUtilities.toVNCurrency(null); // null
   */
  toVNCurrency,
  /**
   * Alias of `NumberUtilities.toVNCurrency` with identical coercion and formatting.
   *
   * Commas are stripped before conversion. No currency symbol is added and no input
   * object is mutated; user-defined string conversion may run caller code.
   *
   * @param value - Legacy numeric input; empty/nullish/NaN-producing input returns `null`.
   * @returns Vietnamese decimal text with at most ten fractional digits, or `null`.
   * @throws {TypeError} If a supplied object's string conversion fails.
   * @example
   * NumberUtilities.toVN(1234.5); // '1.234,5'
   */
  toVN,
  /**
   * Formats a legacy numeric input using en-US grouping and decimal separators.
   *
   * The name is historical: output is human-readable grouped decimal text, not an ISO
   * currency or machine-number encoding. Commas are stripped before coercion; localized
   * comma decimals are not parsed. Infinity is not rejected. No currency symbol is added.
   *
   * @param value - Value converted to text and then Number after removing all commas.
   * @returns en-US text with at most ten fractional digits, or `null` for empty/nullish/NaN input.
   * @throws {TypeError} If a supplied object's string conversion fails.
   * @example
   * NumberUtilities.toISO('1,234.5'); // '1,234.5'
   */
  toISO,
  /**
   * Checks the legacy digits-only representation of a value and requires it to exceed zero.
   *
   * Accepts numeric values and digit strings such as `'01'`. Signs, whitespace, decimal
   * points and exponent syntax are rejected. This is a syntax/coercion predicate, not a
   * safe-integer bound check; use explicit bounds for counters and array sizes.
   *
   * @param value - Candidate; falsy values immediately return false, others undergo regex coercion.
   * @returns True for a digits-only representation whose numeric conversion is greater than zero.
   * @throws {TypeError} If regex string coercion fails, for example for a Symbol.
   * @example
   * NumberUtilities.isPositiveInteger('01'); // true
   * NumberUtilities.isPositiveInteger(0); // false
   */
  isPositiveInteger,
  /**
   * Checks a positive legacy decimal representation without signs or exponent notation.
   *
   * Accepts digit strings, integer numbers and fractions such as `'.5'`. Zero, negatives,
   * whitespace and trailing decimal points are rejected. Conversion is not a finite-value
   * or precision guarantee; huge digit strings can still be accepted.
   *
   * @param value - Candidate; falsy values return false before regex coercion.
   * @returns Whether the allowed decimal representation converts to a value greater than zero.
   * @throws {TypeError} If regex string coercion fails.
   * @example
   * NumberUtilities.isPositiveNumber('.5'); // true
   * NumberUtilities.isPositiveNumber('-1'); // false
   */
  isPositiveNumber,
  /**
   * Broad v1.x coercion check retained unchanged for compatibility.
   *
   * @deprecated Use {@link isFiniteNumber}, {@link isNumericString}, or
   * {@link parseFiniteNumber}. Arrays and booleans may be accepted by this legacy API.
   *
   * @param value - Candidate subjected to unary-plus coercion after a nullish/empty guard.
   * @returns False for null, undefined, empty text or NaN conversion; infinity is accepted.
   * @throws {TypeError} If numeric coercion fails, including Symbol and bigint inputs.
   * @example
   * NumberUtilities.isNumber(true); // true (legacy coercion)
   * NumberUtilities.isNumber(''); // false
   */
  isNumber,
  /**
   * Recognizes primitive finite JavaScript numbers without coercion.
   *
   * Accepts zero, negative zero, negative numbers and fractions. Rejects numeric strings,
   * boxed Number objects, nullish values, booleans, NaN and both infinities. No mutation,
   * property access on the value, or environment-dependent operation is performed.
   *
   * @param value - Any runtime value to narrow.
   * @returns True only when `value` has primitive number type and is finite.
   * @example
   * isFiniteNumber(0); // true
   * isFiniteNumber('12'); // false
   */
  isFiniteNumber,
  /**
   * Checks numeric text syntax under explicit options without converting the result.
   *
   * Defaults accept signed decimal and exponent forms, including `'.5'` and `'1.'`,
   * but reject surrounding whitespace and hexadecimal. This only validates syntax:
   * `'1e999'` can pass even though Number conversion overflows. Use `parseFiniteNumber`
   * when finite numeric output is required. Inputs and options are not modified.
   *
   * @param value - Primitive string candidate; empty/non-string inputs return false.
   * @param options - Trimming, hex, exponent, decimal and leading-plus policies.
   * @returns Whether the entire normalized string matches the selected grammar.
   * @example
   * isNumericString('1e3'); // true
   * isNumericString(' 12 ', { trim: true }); // true
   * isNumericString('0xff'); // false
   */
  isNumericString,
  /**
   * Converts a primitive number or explicitly allowed numeric string to a finite number.
   *
   * Numbers must already be finite. Strings follow `isNumericString` options, then use
   * Number conversion; an overflowing result is rejected. Boolean conversion is opt-in.
   * Objects, arrays, bigint and nullish values are never coerced. No input is mutated.
   *
   * @param value - Untrusted candidate value.
   * @param options - Numeric syntax policy; `allowBoolean` defaults to false.
   * @returns A finite number, including zero/negative zero, or `null` when rejected.
   * @example
   * parseFiniteNumber('1e3'); // 1000
   * parseFiniteNumber('1e999'); // null
   * parseFiniteNumber(true, { allowBoolean: true }); // 1
   */
  parseFiniteNumber,
  /**
   * Rounds a legacy numeric input using `Math.round(value * 10 ** digits) / 10 ** digits`.
   *
   * This is binary floating-point arithmetic, not exact decimal or financial rounding.
   * Half-way values follow Math.round (toward positive infinity); negative zero may be
   * retained. Precision is not validated and extreme values can produce NaN/infinity.
   *
   * @param value - Candidate accepted by legacy `isNumber`, including coercible values.
   * @param digits - Decimal places, default 2; negative values round to tens/hundreds.
   * @returns Rounded number, or `null` when legacy numeric validation fails.
   * @throws {TypeError} If numeric coercion fails.
   * @example
   * NumberUtilities.round(12.345, 2); // 12.35
   * NumberUtilities.round(149, -1); // 150
   * NumberUtilities.round(null); // null
   */
  round,
};
