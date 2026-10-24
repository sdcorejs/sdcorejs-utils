/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  EncryptionAuthenticationError,
  EncryptionFormatError,
  SecureRandomUnavailableError,
  ValidationError,
  WebCryptoUnavailableError,
} from '../errors';
import { decodeBase64Url, decodeUtf8, encodeBase64Url, encodeUtf8 } from '../internal/encoding';
import { assertNoInvalidDate } from '../internal/invalid-date';
import { getOwnPropertyPath, PropertyPathOptions } from '../internal/property-path';
import { stableStringify } from './serialization.fns';

/**
 * Regular-expression source string for conventional email syntax with a nonempty local part and dotted domain; quoted local parts are permitted.
 * Does not prove mailbox existence, ownership, or deliverability.
 *
 * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
 * @example new RegExp(StringUtilities.REGEX_EMAIL).test("an@example.com"); // true
 */
const REGEX_EMAIL = '^(([^<>()[\\].,;:\\s@"]+(\\.[^<>()[\\].,;:\\s@"]+)*)|(".+"))@(([^<>()[\\].,;:\\s@"]+\\.)+[^<>()[\\].,;:\\s@"]{2,})$';
/**
 * Regular-expression source string for permissive phone-like syntax with optional plus/parentheses and separators.
 * Does not enforce a country-specific length or establish a reachable phone number.
 *
 * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
 * @example new RegExp(StringUtilities.REGEX_PHONE).test("+12025550123"); // true
 */
const REGEX_PHONE = '^[+]*[(]{0,1}[+]?[0-9]{1,4}[)]{0,1}[-\\s./0-9]*$';
/**
 * Regular-expression source string for the package's fixed Vietnamese mobile-prefix pattern with 0, 84, or +84 and seven subscriber digits.
 * This is a bundled prefix list, not a live numbering-plan lookup; it does not verify ownership.
 *
 * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
 * @example new RegExp(StringUtilities.REGEX_VN_PHONE).test("0912345678"); // true
 */
const REGEX_VN_PHONE = '^(?:\\+84|0|84)(3[2-9]|5[2689]|7[06-9]|8[1-689]|9[0-9])\\d{7}$';
/**
 * Regular-expression source string for exactly twelve ASCII digits.
 * Checks identifier shape only, without checksum, issue status, or identity verification.
 *
 * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
 * @example new RegExp(StringUtilities.REGEX_VN_ID).test("012345678901"); // true
 */
const REGEX_VN_ID = '^\\d{12}$';
/**
 * Regular-expression source string for one uppercase ASCII letter followed by seven digits.
 * This is the package's passport pattern, not a universal country-independent passport validator.
 *
 * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
 * @example new RegExp(StringUtilities.REGEX_PASSPORT).test("B1234567"); // true
 */
const REGEX_PASSPORT = '^[A-Z]\\d{7}$';
/**
 * Regular-expression source string for either twelve ASCII digits or one uppercase ASCII letter followed by seven digits.
 * Valid syntax does not prove an identifier was issued or belongs to anyone.
 *
 * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
 * @example new RegExp(StringUtilities.REGEX_VN_ID_OR_PASSPORT).test("B1234567"); // true
 */
const REGEX_VN_ID_OR_PASSPORT = '^(\\d{12}|[A-Z]\\d{7})$';
/**
 * Regular-expression source string for zero-padded 24-hour HH:mm with hours 00–23 and minutes 00–59.
 * Seconds, offsets, and single-digit hours are rejected.
 *
 * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
 * @example new RegExp(StringUtilities.REGEX_TIME).test("09:30"); // true
 */
const REGEX_TIME = '^(?:[01]\\d|2[0-3]):[0-5]\\d$';

/**
 * Legacy anchored HTTP(S) URL regex source. It is a compatibility pattern, not
 * the parser/policy used by ValidationUtilities.isUrl; use that helper for protocol and credential rules.
 *
 * @example new RegExp(StringUtilities.REGEX_URL).test("https://example.com"); // true
 */
const REGEX_URL = '^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b[-a-zA-Z0-9()@:%_+.~#?&/=]*$';
/**
 * Regular-expression source string for dotted ASCII domain labels with a final alphabetic suffix of at least two characters.
 * Does not perform DNS resolution; URLs, ports, and raw Unicode domain names are outside this pattern.
 *
 * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
 * @example new RegExp(StringUtilities.REGEX_DOMAIN).test("example.com"); // true
 */
const REGEX_DOMAIN = '^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,}$';
/**
 * Regular-expression source string for four decimal octets from 0 to 255, separated by dots.
 * The legacy pattern allows zero-padded octets; ports and CIDR suffixes are rejected.
 *
 * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
 * @example new RegExp(StringUtilities.REGEX_IPV4).test("192.168.1.1"); // true
 */
const REGEX_IPV4 = '^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$';
/**
 * Regular-expression source string for the bundled full/compressed hexadecimal IPv6 pattern.
 * Not a complete IP parser: IPv4-embedded forms, scope identifiers, brackets, and bare :: are not supported by this pattern.
 *
 * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
 * @example new RegExp(StringUtilities.REGEX_IPV6).test("2001:db8::1"); // true
 */
const REGEX_IPV6 = '^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}|[0-9a-fA-F]{1,4}::([0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4})$';
/**
 * Legacy HTTP(S) URL-plus-image-extension regex source; its extensions are jpg, jpeg,
 * png, gif, webp, svg, bmp, with optional query text. Use the i flag for mixed-case extensions.
 * It does not verify downloaded content and is not the implementation of isImageUrl.
 *
 * @example new RegExp(StringUtilities.REGEX_IMAGE_URL, "i").test("https://example.com/photo.PNG"); // true
 */
const REGEX_IMAGE_URL = '^https?:\\/\\/.+\\.(jpg|jpeg|png|gif|webp|svg|bmp)(\\?.*)?$';
/**
 * Regular-expression source string for lowercase ASCII letter/digit groups separated by single hyphens.
 * Underscores, repeated or edge hyphens, uppercase letters, and spaces are rejected.
 *
 * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
 * @example new RegExp(StringUtilities.REGEX_SLUG).test("hello-world"); // true
 */
const REGEX_SLUG = '^[a-z0-9]+(?:-[a-z0-9]+)*$';
/**
 * Regular-expression source string for optional minus, one or more digits, and an optional decimal part requiring digits on both sides.
 * Rejects plus signs, whitespace, exponents, and hexadecimal; this checks syntax, not finiteness or precision.
 *
 * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
 * @example new RegExp(StringUtilities.REGEX_NUMBER).test("-12.5"); // true
 */
const REGEX_NUMBER = '^-?\\d+(\\.\\d+)?$';
/**
 * Regular-expression source string for an optional minus followed by one or more digits.
 * Leading zeros are allowed; this does not enforce the JavaScript safe-integer range.
 *
 * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
 * @example new RegExp(StringUtilities.REGEX_INTEGER).test("-12"); // true
 */
const REGEX_INTEGER = '^-?\\d+$';
/**
 * Regular-expression source string for an optional minus and decimal digits requiring a decimal point with digits on both sides.
 * Whole-number text, trailing dots, leading-dot fractions, and exponent syntax are rejected.
 *
 * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
 * @example new RegExp(StringUtilities.REGEX_DECIMAL).test("12.50"); // true
 */
const REGEX_DECIMAL = '^-?\\d+\\.\\d+$';
/**
 * Regular-expression source string for unsigned digits with an optional fractional part requiring digits on both sides.
 * Despite the compatibility name, zero is accepted. Use a numeric comparison when strict positivity is required.
 *
 * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
 * @example new RegExp(StringUtilities.REGEX_POSITIVE_NUMBER).test("0"); // true
 */
const REGEX_POSITIVE_NUMBER = '^\\d+(\\.\\d+)?$';
/**
 * Anchored generic UUID shape regex source (8-4-4-4-12 hexadecimal characters).
 * The source uses lowercase ranges; add i for uppercase. Version and variant bits are not checked.
 *
 * @example new RegExp(StringUtilities.REGEX_UUID).test("550e8400-e29b-41d4-a716-446655440000"); // true
 */
const REGEX_UUID = '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
/**
 * Regular-expression source string for exactly sixteen ASCII letters or digits.
 * Case is preserved; punctuation, spaces, and Unicode letters are rejected.
 *
 * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
 * @example new RegExp(StringUtilities.REGEX_CODE_16).test("Abcd1234Efgh5678"); // true
 */
const REGEX_CODE_16 = '^[A-Za-z0-9]{16}$';
/**
 * Regular-expression source string for exactly thirty-two ASCII letters or digits.
 * Case is preserved; this is syntax, not a uniqueness or randomness check.
 *
 * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
 * @example new RegExp(StringUtilities.REGEX_CODE_32).test("Abcd1234Efgh5678Abcd1234Efgh5678"); // true
 */
const REGEX_CODE_32 = '^[A-Za-z0-9]{32}$';
/**
 * Regular-expression source string for a # prefix followed by three or six hexadecimal digits.
 * Case-insensitive hex digits are supported; alpha channels, missing #, and other CSS color forms are rejected.
 *
 * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
 * @example new RegExp(StringUtilities.REGEX_HEX_COLOR).test("#ff00aa"); // true
 */
const REGEX_HEX_COLOR = '^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$';
/**
 * Regular-expression source string for nonempty standard Base64 text of at least four characters, with valid block and padding placement.
 * URL-safe alphabet, whitespace, and omitted required padding are rejected. Pad-bit canonicality and decoded content are not checked.
 *
 * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
 * @example new RegExp(StringUtilities.REGEX_BASE64).test("aGk="); // true
 */
const REGEX_BASE64 = '^(?=.{4,}$)(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$';


/**
 * Tests specifically for `null`, `undefined`, or the empty string without coercion.
 *
 * @param value - Any input; whitespace, `0`, `false`, arrays, and objects are not empty.
 * @returns Whether the input is one of the three empty values.
 * @example StringUtilities.isNullOrEmpty(' '); // false
 */
const isNullOrEmpty = (value: any) => value === undefined || value === null || value === '';

/**
 * Tests whether an input is absent, a non-string, or an all-whitespace string.
 * This compatibility predicate treats every non-string as blank, including `0` and `false`.
 *
 * @param value - Input inspected without string coercion; whitespace follows JavaScript `\s`.
 * @returns `false` only for strings containing at least one non-whitespace character.
 * @example StringUtilities.isNullOrWhiteSpace(' \t'); // true
 * @example StringUtilities.isNullOrWhiteSpace(123); // true
 */
const isNullOrWhiteSpace = (value: any) =>
  value === undefined || value === null || typeof value !== 'string' || value.match(/^\s*$/) !== null;

/**
 * Builds a lowercase search alias by folding precomposed Vietnamese accents and
 * replacing supported punctuation with spaces, then trimming the ends.
 * This is a search normalization convention, not a general Unicode transliterator or slug encoder.
 *
 * @param alias - Value converted with its `toString()` method; nullish input becomes `''`.
 * @returns A new normalized string; the input is unchanged.
 * @throws Propagates errors from a caller-provided `toString()` implementation.
 * @example StringUtilities.changeAliasLowerCase('Điện thoại'); // 'dien thoai'
 */
const changeAliasLowerCase = (alias: any) => {
  let str: string = alias?.toString() ?? '';
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, ' ');
  str = str.replace(/ + /g, ' ');
  return str.trim();
};

/**
 * Performs a case- and Vietnamese-accent-insensitive substring search using
 * {@link changeAliasLowerCase} on both inputs.
 *
 * @param alias - Candidate text; nullish input normalizes to an empty string.
 * @param searchText - Search text; an empty normalized query matches every candidate.
 * @returns Whether the normalized candidate contains the normalized query.
 * @throws Propagates string-conversion errors from either input.
 * @example StringUtilities.aliasIncludes('Điện thoại', 'DIEN'); // true
 */
const aliasIncludes = (alias: any, searchText: any) =>
  changeAliasLowerCase(alias).includes(changeAliasLowerCase(searchText));

/** Options for {@link StringUtilities.mask}. The mask character is always `*`. */
export interface StringMaskOptions {
  /** Leading grapheme clusters to keep; a nonnegative safe integer. Defaults to 0. */
  keepStart?: number;
  /** Trailing grapheme clusters to keep; a nonnegative safe integer. Defaults to 0. */
  keepEnd?: number;
  /** Fixed asterisk count; an integer from 1 to 1024. Defaults to 4. */
  maskLength?: number;
}

const MAX_MASK_LENGTH = 1024;

/**
 * Masks text for display without trimming, coercing, normalizing, or mutating it.
 * Null/undefined return immediately without reading options; their types are preserved.
 * String inputs, including empty strings, validate options before returning.
 * If the keep counts cover the entire nonempty string, returns only the asterisks.
 * Otherwise the asterisk count is independent of the hidden text length.
 *
 * Positive keep counts on nonempty text require `Intl.Segmenter` for grapheme
 * boundaries (including combining marks, ZWJ emoji, and flags). Segmentation follows
 * the runtime Unicode data. Fully masked and empty strings do not require it.
 * The 1024 asterisk limit bounds allocation for this display helper.
 * This is not encryption or a security boundary and does not sanitize logs or JSON.
 *
 * @throws {ValidationError} For invalid input/options or missing `Intl.Segmenter`.
 * @example StringUtilities.mask('12345', { keepEnd: 2 }); // '****45'
 * @example StringUtilities.mask('12', { keepEnd: 2 }); // '****'
 * @example StringUtilities.mask('0912345678', { keepStart: 3, keepEnd: 2 }); // '091****78'
 * @example StringUtilities.mask(null); // null
 *
 * @typeParam T - Preserves a nullish input type while returning `string` for text.
 * @param value - Text to mask, or a nullish value to return unchanged.
 * @param options - Grapheme counts and mask length; defaults to fully masking with four asterisks.
 * @returns Display text, an empty string for empty input, or the original nullish value.
 */
function mask<T extends string | null | undefined>(
  value: T,
  options?: StringMaskOptions,
): T extends string ? string : T;
/**
 * Masks text for display without trimming, coercing, normalizing, or mutating it.
 * Null/undefined return immediately without reading options; their types are preserved.
 * String inputs, including empty strings, validate options before returning.
 * If the keep counts cover the entire nonempty string, returns only the asterisks.
 * Otherwise the asterisk count is independent of the hidden text length.
 *
 * Positive keep counts on nonempty text require `Intl.Segmenter` for grapheme
 * boundaries (including combining marks, ZWJ emoji, and flags). Segmentation follows
 * the runtime Unicode data. Fully masked and empty strings do not require it.
 * The 1024 asterisk limit bounds allocation for this display helper.
 * This is not encryption or a security boundary and does not sanitize logs or JSON.
 *
 * @throws {ValidationError} For invalid input/options or missing `Intl.Segmenter`.
 * @example StringUtilities.mask('12345', { keepEnd: 2 }); // '****45'
 * @example StringUtilities.mask('12', { keepEnd: 2 }); // '****'
 * @example StringUtilities.mask('0912345678', { keepStart: 3, keepEnd: 2 }); // '091****78'
 * @example StringUtilities.mask(null); // null
 *
 * @typeParam T - Preserves a nullish input type while returning `string` for text.
 * @param value - Text to mask, or a nullish value to return unchanged.
 * @param options - Grapheme counts and mask length; defaults to fully masking with four asterisks.
 * @returns Display text, an empty string for empty input, or the original nullish value.
 */
function mask(
  value: string | null | undefined,
  options: StringMaskOptions = {},
): string | null | undefined {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'string') throw new ValidationError('mask value must be a string, null, or undefined');
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new ValidationError('mask options must be an object');
  }
  const { keepStart = 0, keepEnd = 0, maskLength = 4 } = options;
  if (!Number.isSafeInteger(keepStart) || keepStart < 0) {
    throw new ValidationError('keepStart must be a nonnegative safe integer');
  }
  if (!Number.isSafeInteger(keepEnd) || keepEnd < 0) {
    throw new ValidationError('keepEnd must be a nonnegative safe integer');
  }
  if (!Number.isSafeInteger(maskLength) || maskLength < 1 || maskLength > MAX_MASK_LENGTH) {
    throw new ValidationError('maskLength must be an integer from 1 to 1024');
  }
  if (value === '') return '';
  const masked = '*'.repeat(maskLength);
  if (keepStart === 0 && keepEnd === 0) return masked;
  if (typeof globalThis.Intl?.Segmenter !== 'function') {
    throw new ValidationError('Intl.Segmenter is required to keep graphemes when masking');
  }
  const segments = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value);
  let length = 0;
  let prefixEnd = 0;
  for (const segment of segments) {
    if (length < keepStart) prefixEnd = segment.index + segment.segment.length;
    length++;
  }
  // Compare by subtraction so two safe keep counts cannot overflow when added.
  if (keepStart >= length || keepEnd >= length - keepStart) return masked;
  let suffixStart = value.length;
  if (keepEnd > 0) {
    let position = 0;
    for (const segment of segments) {
      if (position === length - keepEnd) {
        suffixStart = segment.index;
        break;
      }
      position++;
    }
  }
  return value.slice(0, prefixEnd) + masked + value.slice(suffixStart);
}

/**
 * Substitutes zero-based numbered placeholders such as `{0}` with literal string values.
 * Missing indices remain unchanged; a backslash before a placeholder escapes it and is removed.
 * Only nonnegative integer indices without leading zeros are recognized. No HTML escaping is applied.
 *
 * @param template - Template text containing numbered placeholders.
 * @param arr - Replacement values converted with `String`; `$&` and similar text stay literal.
 * @returns New formatted text without mutating the template or replacements.
 * @throws Propagates errors from replacement string conversion.
 * @example StringUtilities.format('{0}: {1}', 'Total', 3); // 'Total: 3'
 */
const format = (template: string, ...arr: any[]) =>
  template.replace(
    /\\(\{(?:0|[1-9]\d*)\})|\{(0|[1-9]\d*)\}/g,
    (placeholder, escaped: string | undefined, indexText: string | undefined) => {
      if (escaped !== undefined) return escaped;
      const index = Number(indexText);
      return Number.isSafeInteger(index) && index < arr.length
        ? String(arr[index])
        : placeholder;
    },
  );

/**
 * Safe property-path traversal options shared by string templates and object lookups.
 * Own data properties are used by default; accessor execution requires explicit opt-in.
 * See {@link PropertyPathOptions} for the depth limit and unsafe-path policy.
 */
export type TemplatePathOptions = PropertyPathOptions;

/**
 * Replaces `${path}` placeholders using safe own-property traversal, including supported
 * dot and bracket paths. A preceding backslash escapes a placeholder and is removed.
 * Getters are skipped by default, and inherited properties are never read.
 * Output is plain text: this helper neither evaluates JavaScript nor escapes HTML.
 *
 * @param template - Template text; an empty string is returned unchanged.
 * @param entity - Source of values; missing, null, and undefined values become `''`.
 * @param options - Path depth and accessor policy; defaults to safe own data properties.
 * @returns A new string with resolved values converted using `String`.
 * @throws {UnsafePropertyPathError} For prohibited or malformed matched paths.
 * @throws {UnsafePropertyPathError} For invalid traversal options.
 * @throws Propagates explicitly enabled getter and value string-conversion errors.
 * @example StringUtilities.templateToDisplay('Hello ${user.name}', { user: { name: 'An' } }); // 'Hello An'
 */
const templateToDisplay = (
  template: string,
  entity: Record<string, any>,
  options: TemplatePathOptions = {},
) => {
  if (!template) return template;
  return template.replace(
    /\\(\$\{[A-Za-z0-9._\-\[\]'\"]+\})|\$\{([A-Za-z0-9._\-\[\]'\"]+)\}/g,
    (_match, escaped: string | undefined, key: string | undefined) => {
      if (escaped !== undefined) return escaped;
      if (key === undefined) return _match;
      const value = getOwnPropertyPath(entity, key, options);
      return value === null || value === undefined ? '' : String(value);
    },
  );
};

const EXACT_TEMPLATE_REGEX = /^\$\{([A-Za-z0-9._-]*)\}$/;
const NUMBER_LITERAL_REGEX = /^-?\d+(\.\d+)?$/;

/**
 * Resolves a small literal/template grammar without evaluating JavaScript.
 * A trimmed exact `${a.b}` reference preserves the property's value and type. Literal
 * `true`, `false`, `null`, `undefined`, and signed decimal numbers are recognized;
 * other text is passed to {@link templateToDisplay} with its original whitespace.
 *
 * @param template - Expression text; empty input returns `undefined`.
 * @param entity - Own-property source for references; missing references return `undefined`.
 * @param options - Safe-path depth/accessor policy, as in {@link templateToDisplay}.
 * @returns The referenced value, parsed primitive, or substituted string; no schema validation occurs.
 * @throws {UnsafePropertyPathError} For unsafe property paths.
 * @throws {UnsafePropertyPathError} For invalid path options when traversal is performed.
 * @throws Propagates enabled getter or string-conversion errors.
 * @example StringUtilities.parseExpression('${count}', { count: 3 }); // 3 (number)
 */
const parseExpression = (
  template: string,
  entity: Record<string, any>,
  options: TemplatePathOptions = {},
) => {
  if (!template) return undefined;
  const trimmed = template.trim();
  const exactMatch = trimmed.match(EXACT_TEMPLATE_REGEX);
  if (exactMatch?.[1]) return getOwnPropertyPath(entity, exactMatch[1], options);
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (trimmed === 'undefined') return undefined;
  if (NUMBER_LITERAL_REGEX.test(trimmed)) return Number(trimmed);
  return templateToDisplay(template, entity, options);
};

const SALT = 'cb9f4b2a-d26c-4787-a66e-e7130ee00f95';

const legacyObfuscate = (obj: any) => {
  const chars = JSON.stringify(obj).split('');
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === '{') chars[i] = '}';
    else if (chars[i] === '}') chars[i] = '{';
  }
  return encodeURI(SALT + chars.join(''));
};

const legacyDeobfuscate = (encripted: string) => {
  encripted = decodeURI(encripted);
  if (encripted.indexOf(SALT) !== 0) throw new Error('object cannot be decrypted');
  const strs = encripted.substring(SALT.length).split('');
  for (let i = 0; i < strs.length; i++) {
    if (strs[i] === '{') strs[i] = '}';
    else if (strs[i] === '}') strs[i] = '{';
  }
  return JSON.parse(strs.join(''));
};

/**
 * Reversibly transforms JSON text using the fixed public prefix and brace-swap format
 * of v1.1.x, then URI-encodes it. This provides no confidentiality, integrity, or
 * authentication; never use it to protect secrets, tokens, or personal data.
 *
 * @param obj - JSON-serializable input; ordinary JSON omission and coercion rules apply.
 * @returns URI-encoded obfuscated JSON using the package's fixed compatibility prefix.
 * @throws {TypeError} For cycles, bigint, or top-level inputs without JSON text.
 * @throws Propagates errors from `toJSON` or URI encoding.
 * @example StringUtilities.deobfuscate(StringUtilities.obfuscate({ id: 1 })); // { id: 1 }
 */
export const obfuscate = legacyObfuscate;

/**
 * Reverses {@link obfuscate} and parses the recovered JSON without authentication.
 * The fixed public prefix detects only a format mismatch; an attacker can forge it.
 *
 * @param encripted - Compatibility spelling of the parameter containing obfuscated text.
 * @returns JSON-decoded data; prototypes and original Date instances are not restored.
 * @throws {Error} If the fixed compatibility prefix is missing.
 * @throws {URIError} For invalid URI encoding.
 * @throws {SyntaxError} For malformed recovered JSON.
 * @example StringUtilities.deobfuscate(StringUtilities.obfuscate('hello')); // 'hello'
 */
export const deobfuscate = legacyDeobfuscate;

/**
 * Compatibility alias of {@link obfuscate}, preserving the legacy wire format.
 *
 * @deprecated This is reversible obfuscation with no security guarantee. Use
 *   {@link encryptAesGcm} for authenticated encryption; migration changes the format and requires a key.
 * @param obj - JSON-serializable value to obfuscate.
 * @returns The same public-prefix encoding as {@link obfuscate}.
 * @throws Propagates JSON and URI serialization errors from {@link obfuscate}.
 * @example StringUtilities.encrypt({ id: 1 });
 */
export const encrypt = legacyObfuscate;

/**
 * Compatibility alias of {@link deobfuscate}, with no authenticity or integrity checks.
 *
 * @deprecated Use {@link decryptAesGcm} for tokens produced by {@link encryptAesGcm}.
 *   Existing obfuscated values must first be decoded and re-encrypted with a real key.
 * @param encripted - Legacy obfuscated text; the spelling is retained for compatibility.
 * @returns JSON-decoded legacy data.
 * @throws Propagates prefix mismatch, URI decoding, and JSON parsing errors.
 * @example StringUtilities.decrypt(StringUtilities.encrypt(1)); // 1
 */
export const decrypt = legacyDeobfuscate;

/** Options for authenticated AES-GCM encryption. */
export interface AesGcmEncryptOptions {
  /**
   * Optional unencrypted data authenticated with the ciphertext, default absent. Strings are
   * UTF-8 encoded; byte arrays are used as supplied. Decryption requires the identical bytes
   * and matching presence (even empty supplied data counts as present). Not stored in the token.
   */
  additionalData?: Uint8Array | string;
}

/** Options for authenticated AES-GCM decryption. */
export interface AesGcmDecryptOptions {
  /**
   * Additional authenticated data supplied during encryption, default absent. Strings are
   * UTF-8 encoded. Missing, unexpected, or different data causes authentication failure;
   * this context is not recovered from the token and must be supplied by the caller.
   */
  additionalData?: Uint8Array | string;
}

interface AesGcmEnvelopeV1 {
  version: 1;
  algorithm: 'AES-GCM';
  iv: string;
  ciphertext: string;
  hasAdditionalData: boolean;
}

const AES_GCM_TOKEN_PREFIX = 'sdcore.aesgcm.v1.';

const getCryptoApi = (): Crypto => {
  if (!globalThis.crypto?.subtle) throw new WebCryptoUnavailableError();
  return globalThis.crypto;
};

const normalizeAdditionalData = (value?: Uint8Array | string): Uint8Array | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === 'string') return encodeUtf8(value);
  if (value instanceof Uint8Array) return value;
  throw new ValidationError('additionalData must be a string or Uint8Array');
};

const validateCryptoKey = (key: CryptoKey, usage: KeyUsage): CryptoKey => {
  try {
    if (
      key?.type !== 'secret' ||
      key.algorithm?.name !== 'AES-GCM' ||
      !Array.isArray(key.usages) ||
      !key.usages.includes(usage)
    ) {
      throw new ValidationError(`A secret AES-GCM CryptoKey with ${usage} usage is required`);
    }
  } catch (cause) {
    if (cause instanceof ValidationError) throw cause;
    throw new ValidationError(`A secret AES-GCM CryptoKey with ${usage} usage is required`, { cause });
  }
  return key;
};

const importAesKey = async (
  key: CryptoKey | Uint8Array,
  usage: 'encrypt' | 'decrypt',
): Promise<CryptoKey> => {
  const cryptoApi = getCryptoApi();
  if (key instanceof Uint8Array) {
    if (![16, 24, 32].includes(key.byteLength)) {
      throw new ValidationError('Raw AES-GCM keys must contain 16, 24, or 32 bytes');
    }
    try {
      return await cryptoApi.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, [usage]);
    } catch (cause) {
      throw new ValidationError('Raw AES-GCM key material could not be imported', { cause });
    }
  }
  return validateCryptoKey(key, usage);
};

const parseAesGcmEnvelope = (token: string): AesGcmEnvelopeV1 => {
  if (typeof token !== 'string' || !token.startsWith(AES_GCM_TOKEN_PREFIX)) {
    if (typeof token === 'string' && token.startsWith('sdcore.aesgcm.')) {
      throw new EncryptionFormatError('Unsupported AES-GCM token version');
    }
    throw new EncryptionFormatError('Malformed AES-GCM token');
  }
  const encoded = token.slice(AES_GCM_TOKEN_PREFIX.length);
  try {
    const parsed = JSON.parse(decodeUtf8(decodeBase64Url(encoded))) as Partial<AesGcmEnvelopeV1>;
    if (
      !parsed ||
      parsed.version !== 1 ||
      parsed.algorithm !== 'AES-GCM' ||
      typeof parsed.iv !== 'string' ||
      typeof parsed.ciphertext !== 'string' ||
      typeof parsed.hasAdditionalData !== 'boolean'
    ) {
      throw new EncryptionFormatError('Malformed AES-GCM envelope');
    }
    const iv = decodeBase64Url(parsed.iv);
    const ciphertext = decodeBase64Url(parsed.ciphertext);
    if (iv.byteLength !== 12 || ciphertext.byteLength < 16) {
      throw new EncryptionFormatError('Malformed AES-GCM envelope');
    }
    return parsed as AesGcmEnvelopeV1;
  } catch (error) {
    if (error instanceof EncryptionFormatError) throw error;
    throw new EncryptionFormatError('Malformed AES-GCM envelope', { cause: error });
  }
};

/**
 * Authentically encrypts a supported JSON-domain value with AES-GCM.
 * A fresh random 96-bit IV is generated for every token. Raw keys must be
 * 128, 192, or 256 bits; password strings are intentionally unsupported.
 *
 * @typeParam T - Serializable input type; runtime serialization rules still apply.
 * @param value - Supported JSON data or valid Dates (serialized as ISO strings). Invalid Dates,
 *   undefined, bigint, non-finite numbers, sparse arrays, accessors, cycles, and unsupported instances fail.
 * @param key - A 16-, 24-, or 32-byte raw AES key, or a secret AES-GCM CryptoKey permitting encryption.
 * @param options - Optional additional authenticated data; string data is UTF-8 encoded.
 * @returns A Promise of a versioned `sdcore.aesgcm.v1.` token with a fresh 96-bit IV and 128-bit tag.
 * @throws {ValidationError} Rejects invalid keys, additional-data types, and encryption failures.
 * @throws {WebCryptoUnavailableError} Rejects when the Web Crypto API is unavailable.
 * @throws {SecureRandomUnavailableError} Rejects when secure IV generation fails.
 * @throws {UnsupportedSerializationTypeError} Rejects invalid Dates or other unsupported plaintext types.
 * @throws Rejects unsupported/unsafe serialized data with the corresponding serialization/security error.
 * @example
 * const key = crypto.getRandomValues(new Uint8Array(32));
 * const token = await StringUtilities.encryptAesGcm({ id: 1 }, key);
 * const value = await StringUtilities.decryptAesGcm<{ id: number }>(token, key);
 */
export const encryptAesGcm = async <T>(
  value: T,
  key: CryptoKey | Uint8Array,
  options: AesGcmEncryptOptions = {},
): Promise<string> => {
  const cryptoApi = getCryptoApi();
  if (typeof cryptoApi.getRandomValues !== 'function') throw new SecureRandomUnavailableError();
  const cryptoKey = await importAesKey(key, 'encrypt');
  let iv: Uint8Array;
  try {
    iv = cryptoApi.getRandomValues(new Uint8Array(12));
  } catch (cause) {
    throw new SecureRandomUnavailableError({ cause });
  }
  const additionalData = normalizeAdditionalData(options.additionalData);
  const algorithm: AesGcmParams = { name: 'AES-GCM', iv, tagLength: 128 };
  if (additionalData) algorithm.additionalData = additionalData;
  // Fail-closed on an invalid Date. stableStringify encodes one as "Invalid Date" so a
  // single bad cell cannot abort a whole value, but this plaintext is read back with
  // JSON.parse, so accepting it would decrypt to the string instead of the Date. Keeping
  // the pre-1.2.1 rejection preserves the "supported JSON-domain value" contract.
  assertNoInvalidDate(value);
  const plaintext = encodeUtf8(stableStringify(value));
  let ciphertext: ArrayBuffer;
  try {
    ciphertext = await cryptoApi.subtle.encrypt(algorithm, cryptoKey, plaintext);
  } catch (cause) {
    throw new ValidationError('The supplied AES-GCM key is not valid for encryption', { cause });
  }
  const envelope: AesGcmEnvelopeV1 = {
    version: 1,
    algorithm: 'AES-GCM',
    iv: encodeBase64Url(iv),
    ciphertext: encodeBase64Url(new Uint8Array(ciphertext)),
    hasAdditionalData: additionalData !== undefined,
  };
  return AES_GCM_TOKEN_PREFIX + encodeBase64Url(encodeUtf8(JSON.stringify(envelope)));
};

/**
 * Authenticates and decrypts an `sdcore.aesgcm.v1` token before parsing plaintext JSON.
 *
 * @typeParam T - Expected result type; this is a type assertion, not runtime schema validation.
 * @param token - Versioned AES-GCM token returned by {@link encryptAesGcm}.
 * @param key - Raw AES key or secret AES-GCM CryptoKey permitting decryption.
 * @param options - Additional authenticated data; must byte-for-byte match the encryption call.
 * @returns A Promise of authenticated, JSON-parsed plaintext; Dates remain strings.
 * @throws {EncryptionFormatError} Rejects malformed or unsupported envelopes.
 * @throws {ValidationError} Rejects invalid key shape/usage, additional-data types, and unsupported crypto parameters.
 * @throws {EncryptionAuthenticationError} Rejects wrong keys/AAD, tampering, or failures during decryption.
 * @example
 * const key = crypto.getRandomValues(new Uint8Array(32));
 * const token = await StringUtilities.encryptAesGcm('hello', key, { additionalData: 'record:1' });
 * await StringUtilities.decryptAesGcm<string>(token, key, { additionalData: 'record:1' }); // 'hello'
 */
export const decryptAesGcm = async <T>(
  token: string,
  key: CryptoKey | Uint8Array,
  options: AesGcmDecryptOptions = {},
): Promise<T> => {
  const envelope = parseAesGcmEnvelope(token);
  const additionalData = normalizeAdditionalData(options.additionalData);
  if (envelope.hasAdditionalData && additionalData === undefined) {
    throw new EncryptionAuthenticationError();
  }
  const algorithm: AesGcmParams = {
    name: 'AES-GCM',
    iv: decodeBase64Url(envelope.iv),
    tagLength: 128,
  };
  if (additionalData) algorithm.additionalData = additionalData;
  try {
    const keyForDecryption = await importAesKey(key, 'decrypt');
    const plaintext = await getCryptoApi().subtle.decrypt(
      algorithm,
      keyForDecryption,
      decodeBase64Url(envelope.ciphertext),
    );
    try {
      return JSON.parse(decodeUtf8(new Uint8Array(plaintext))) as T;
    } catch (error) {
      throw new EncryptionFormatError('Authenticated plaintext is not valid JSON', { cause: error });
    }
  } catch (error) {
    if (error instanceof EncryptionFormatError || error instanceof ValidationError) throw error;
    const errorName = typeof error === 'object' && error !== null && 'name' in error
      ? String((error as { name: unknown }).name)
      : '';
    if (error instanceof TypeError || ['InvalidAccessError', 'DataError', 'SyntaxError', 'NotSupportedError'].includes(errorName)) {
      throw new ValidationError('The supplied AES-GCM key is not valid for decryption', { cause: error });
    }
    throw new EncryptionAuthenticationError({ cause: error });
  }
};

/**
 * Converts a name into a lowercase ASCII code by decomposing accents, folding `đ`,
 * and replacing runs of non-alphanumeric characters with underscores.
 * Leading/trailing separators are removed; camel-case boundaries are not split.
 *
 * @param name - String to normalize. Unsupported scripts or punctuation alone may yield `''`.
 * @returns A new code containing only ASCII lowercase letters, digits, and underscores.
 * @throws {Error} For a non-string runtime input.
 * @example StringUtilities.convertToSnakeCaseCode('Điện thoại'); // 'dien_thoai'
 */
const convertToSnakeCaseCode = (name: string): string => {
  if (typeof name !== 'string') throw new Error('Invalid name');
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
};

/**
 * Normalizes a name with {@link convertToSnakeCaseCode} and chooses the first unused
 * code, trying `_1`, `_2`, and so on when needed. Comparisons are case-sensitive.
 * Uniqueness is limited to the supplied snapshot; concurrent writers require their own constraint.
 *
 * @param name - Name from which to derive the base code; an empty normalized base is permitted.
 * @param existingCodes - Codes already in use; this array is not mutated.
 * @returns The base code or the lowest available numbered suffix.
 * @throws {Error} For a non-string name.
 * @example StringUtilities.generateUniqueCode('Hello', ['hello', 'hello_1']); // 'hello_2'
 */
const generateUniqueCode = (name: string, existingCodes: string[]): string => {
  const baseCode = convertToSnakeCaseCode(name);
  if (!existingCodes.includes(baseCode)) return baseCode;
  let index = 1;
  let newCode = `${baseCode}_${index}`;
  while (existingCodes.includes(newCode)) { index++; newCode = `${baseCode}_${index}`; }
  return newCode;
};

/**
 * Hashes UTF-8 text with Web Crypto SHA-256 and encodes the digest as unpadded Base64URL.
 * The result is deterministic and is not a keyed signature or password-hashing scheme.
 * Unlike {@link sha256Canonical}, this hashes text directly and does not return hexadecimal.
 *
 * @param input - Text to UTF-8 encode with `TextEncoder`.
 * @returns A Promise of the 43-character Base64URL digest.
 * @throws {WebCryptoUnavailableError} Rejects if `crypto.subtle.digest` is unavailable.
 * @throws Rejects if the runtime's digest operation fails.
 * @example await StringUtilities.sha256('hello'); // 'LPJNul-wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ'
 */
const sha256 = async (input: string): Promise<string> => {
  const buffer = new TextEncoder().encode(input);
  const hash = await getCryptoApi().subtle.digest('SHA-256', buffer);
  const bytes = new Uint8Array(hash);
  return encodeBase64Url(bytes);
};

/**
 * String normalization, safe templates, display masking, validation-pattern sources,
 * legacy obfuscation, and Web Crypto helpers. Members are also available through the
 * package's utility namespaces where explicitly exported; see each method's runtime requirements.
 *
 * @example
 * import { StringUtilities } from '@sdcorejs/utils/fns';
 * StringUtilities.format('Hello {0}', 'An'); // 'Hello An'
 */
export const StringUtilities = {
  /**
   * Regular-expression source string for conventional email syntax with a nonempty local part and dotted domain; quoted local parts are permitted.
   * Does not prove mailbox existence, ownership, or deliverability.
   *
   * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
   * @example new RegExp(StringUtilities.REGEX_EMAIL).test("an@example.com"); // true
   */
  REGEX_EMAIL,
  /**
   * Regular-expression source string for permissive phone-like syntax with optional plus/parentheses and separators.
   * Does not enforce a country-specific length or establish a reachable phone number.
   *
   * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
   * @example new RegExp(StringUtilities.REGEX_PHONE).test("+12025550123"); // true
   */
  REGEX_PHONE,
  /**
   * Regular-expression source string for the package's fixed Vietnamese mobile-prefix pattern with 0, 84, or +84 and seven subscriber digits.
   * This is a bundled prefix list, not a live numbering-plan lookup; it does not verify ownership.
   *
   * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
   * @example new RegExp(StringUtilities.REGEX_VN_PHONE).test("0912345678"); // true
   */
  REGEX_VN_PHONE,
  /**
   * Regular-expression source string for exactly twelve ASCII digits.
   * Checks identifier shape only, without checksum, issue status, or identity verification.
   *
   * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
   * @example new RegExp(StringUtilities.REGEX_VN_ID).test("012345678901"); // true
   */
  REGEX_VN_ID,
  /**
   * Regular-expression source string for one uppercase ASCII letter followed by seven digits.
   * This is the package's passport pattern, not a universal country-independent passport validator.
   *
   * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
   * @example new RegExp(StringUtilities.REGEX_PASSPORT).test("B1234567"); // true
   */
  REGEX_PASSPORT,
  /**
   * Regular-expression source string for either twelve ASCII digits or one uppercase ASCII letter followed by seven digits.
   * Valid syntax does not prove an identifier was issued or belongs to anyone.
   *
   * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
   * @example new RegExp(StringUtilities.REGEX_VN_ID_OR_PASSPORT).test("B1234567"); // true
   */
  REGEX_VN_ID_OR_PASSPORT,
  /**
   * Regular-expression source string for zero-padded 24-hour HH:mm with hours 00–23 and minutes 00–59.
   * Seconds, offsets, and single-digit hours are rejected.
   *
   * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
   * @example new RegExp(StringUtilities.REGEX_TIME).test("09:30"); // true
   */
  REGEX_TIME,
  /**
   * Legacy anchored HTTP(S) URL regex source. It is a compatibility pattern, not
   * the parser/policy used by ValidationUtilities.isUrl; use that helper for protocol and credential rules.
   *
   * @example new RegExp(StringUtilities.REGEX_URL).test("https://example.com"); // true
   */
  REGEX_URL,
  /**
   * Regular-expression source string for dotted ASCII domain labels with a final alphabetic suffix of at least two characters.
   * Does not perform DNS resolution; URLs, ports, and raw Unicode domain names are outside this pattern.
   *
   * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
   * @example new RegExp(StringUtilities.REGEX_DOMAIN).test("example.com"); // true
   */
  REGEX_DOMAIN,
  /**
   * Regular-expression source string for four decimal octets from 0 to 255, separated by dots.
   * The legacy pattern allows zero-padded octets; ports and CIDR suffixes are rejected.
   *
   * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
   * @example new RegExp(StringUtilities.REGEX_IPV4).test("192.168.1.1"); // true
   */
  REGEX_IPV4,
  /**
   * Regular-expression source string for the bundled full/compressed hexadecimal IPv6 pattern.
   * Not a complete IP parser: IPv4-embedded forms, scope identifiers, brackets, and bare :: are not supported by this pattern.
   *
   * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
   * @example new RegExp(StringUtilities.REGEX_IPV6).test("2001:db8::1"); // true
   */
  REGEX_IPV6,
  /**
   * Legacy HTTP(S) URL-plus-image-extension regex source; its extensions are jpg, jpeg,
   * png, gif, webp, svg, bmp, with optional query text. Use the i flag for mixed-case extensions.
   * It does not verify downloaded content and is not the implementation of isImageUrl.
   *
   * @example new RegExp(StringUtilities.REGEX_IMAGE_URL, "i").test("https://example.com/photo.PNG"); // true
   */
  REGEX_IMAGE_URL,
  /**
   * Regular-expression source string for lowercase ASCII letter/digit groups separated by single hyphens.
   * Underscores, repeated or edge hyphens, uppercase letters, and spaces are rejected.
   *
   * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
   * @example new RegExp(StringUtilities.REGEX_SLUG).test("hello-world"); // true
   */
  REGEX_SLUG,
  /**
   * Regular-expression source string for optional minus, one or more digits, and an optional decimal part requiring digits on both sides.
   * Rejects plus signs, whitespace, exponents, and hexadecimal; this checks syntax, not finiteness or precision.
   *
   * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
   * @example new RegExp(StringUtilities.REGEX_NUMBER).test("-12.5"); // true
   */
  REGEX_NUMBER,
  /**
   * Regular-expression source string for an optional minus followed by one or more digits.
   * Leading zeros are allowed; this does not enforce the JavaScript safe-integer range.
   *
   * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
   * @example new RegExp(StringUtilities.REGEX_INTEGER).test("-12"); // true
   */
  REGEX_INTEGER,
  /**
   * Regular-expression source string for an optional minus and decimal digits requiring a decimal point with digits on both sides.
   * Whole-number text, trailing dots, leading-dot fractions, and exponent syntax are rejected.
   *
   * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
   * @example new RegExp(StringUtilities.REGEX_DECIMAL).test("12.50"); // true
   */
  REGEX_DECIMAL,
  /**
   * Regular-expression source string for unsigned digits with an optional fractional part requiring digits on both sides.
   * Despite the compatibility name, zero is accepted. Use a numeric comparison when strict positivity is required.
   *
   * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
   * @example new RegExp(StringUtilities.REGEX_POSITIVE_NUMBER).test("0"); // true
   */
  REGEX_POSITIVE_NUMBER,
  /**
   * Anchored generic UUID shape regex source (8-4-4-4-12 hexadecimal characters).
   * The source uses lowercase ranges; add i for uppercase. Version and variant bits are not checked.
   *
   * @example new RegExp(StringUtilities.REGEX_UUID).test("550e8400-e29b-41d4-a716-446655440000"); // true
   */
  REGEX_UUID,
  /**
   * Regular-expression source string for exactly sixteen ASCII letters or digits.
   * Case is preserved; punctuation, spaces, and Unicode letters are rejected.
   *
   * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
   * @example new RegExp(StringUtilities.REGEX_CODE_16).test("Abcd1234Efgh5678"); // true
   */
  REGEX_CODE_16,
  /**
   * Regular-expression source string for exactly thirty-two ASCII letters or digits.
   * Case is preserved; this is syntax, not a uniqueness or randomness check.
   *
   * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
   * @example new RegExp(StringUtilities.REGEX_CODE_32).test("Abcd1234Efgh5678Abcd1234Efgh5678"); // true
   */
  REGEX_CODE_32,
  /**
   * Regular-expression source string for a # prefix followed by three or six hexadecimal digits.
   * Case-insensitive hex digits are supported; alpha channels, missing #, and other CSS color forms are rejected.
   *
   * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
   * @example new RegExp(StringUtilities.REGEX_HEX_COLOR).test("#ff00aa"); // true
   */
  REGEX_HEX_COLOR,
  /**
   * Regular-expression source string for nonempty standard Base64 text of at least four characters, with valid block and padding placement.
   * URL-safe alphabet, whitespace, and omitted required padding are rejected. Pad-bit canonicality and decoded content are not checked.
   *
   * @remarks This is a string, not a RegExp instance; construct RegExp explicitly.
   * @example new RegExp(StringUtilities.REGEX_BASE64).test("aGk="); // true
   */
  REGEX_BASE64,
  /**
   * Builds a lowercase search alias by folding precomposed Vietnamese accents and
   * replacing supported punctuation with spaces, then trimming the ends.
   * This is a search normalization convention, not a general Unicode transliterator or slug encoder.
   *
   * @param alias - Value converted with its `toString()` method; nullish input becomes `''`.
   * @returns A new normalized string; the input is unchanged.
   * @throws Propagates errors from a caller-provided `toString()` implementation.
   * @example StringUtilities.changeAliasLowerCase('Điện thoại'); // 'dien thoai'
   */
  changeAliasLowerCase,
  /**
   * Performs a case- and Vietnamese-accent-insensitive substring search using
   * {@link changeAliasLowerCase} on both inputs.
   *
   * @param alias - Candidate text; nullish input normalizes to an empty string.
   * @param searchText - Search text; an empty normalized query matches every candidate.
   * @returns Whether the normalized candidate contains the normalized query.
   * @throws Propagates string-conversion errors from either input.
   * @example StringUtilities.aliasIncludes('Điện thoại', 'DIEN'); // true
   */
  aliasIncludes,
  /**
   * Masks text for display without trimming, coercing, normalizing, or mutating it.
   * Null/undefined return immediately without reading options; their types are preserved.
   * String inputs, including empty strings, validate options before returning.
   * If the keep counts cover the entire nonempty string, returns only the asterisks.
   * Otherwise the asterisk count is independent of the hidden text length.
   *
   * Positive keep counts on nonempty text require `Intl.Segmenter` for grapheme
   * boundaries (including combining marks, ZWJ emoji, and flags). Segmentation follows
   * the runtime Unicode data. Fully masked and empty strings do not require it.
   * The 1024 asterisk limit bounds allocation for this display helper.
   * This is not encryption or a security boundary and does not sanitize logs or JSON.
   *
   * @throws {ValidationError} For invalid input/options or missing `Intl.Segmenter`.
   * @example StringUtilities.mask('12345', { keepEnd: 2 }); // '****45'
   * @example StringUtilities.mask('12', { keepEnd: 2 }); // '****'
   * @example StringUtilities.mask('0912345678', { keepStart: 3, keepEnd: 2 }); // '091****78'
   * @example StringUtilities.mask(null); // null
   *
   * @typeParam T - Preserves a nullish input type while returning `string` for text.
   * @param value - Text to mask, or a nullish value to return unchanged.
   * @param options - Grapheme counts and mask length; defaults to fully masking with four asterisks.
   * @returns Display text, an empty string for empty input, or the original nullish value.
   */
  mask,
  /**
   * Substitutes zero-based numbered placeholders such as `{0}` with literal string values.
   * Missing indices remain unchanged; a backslash before a placeholder escapes it and is removed.
   * Only nonnegative integer indices without leading zeros are recognized. No HTML escaping is applied.
   *
   * @param template - Template text containing numbered placeholders.
   * @param arr - Replacement values converted with `String`; `$&` and similar text stay literal.
   * @returns New formatted text without mutating the template or replacements.
   * @throws Propagates errors from replacement string conversion.
   * @example StringUtilities.format('{0}: {1}', 'Total', 3); // 'Total: 3'
   */
  format,
  /**
   * Replaces `${path}` placeholders using safe own-property traversal, including supported
   * dot and bracket paths. A preceding backslash escapes a placeholder and is removed.
   * Getters are skipped by default, and inherited properties are never read.
   * Output is plain text: this helper neither evaluates JavaScript nor escapes HTML.
   *
   * @param template - Template text; an empty string is returned unchanged.
   * @param entity - Source of values; missing, null, and undefined values become `''`.
   * @param options - Path depth and accessor policy; defaults to safe own data properties.
   * @returns A new string with resolved values converted using `String`.
   * @throws {UnsafePropertyPathError} For prohibited or malformed matched paths.
   * @throws {UnsafePropertyPathError} For invalid traversal options.
   * @throws Propagates explicitly enabled getter and value string-conversion errors.
   * @example StringUtilities.templateToDisplay('Hello ${user.name}', { user: { name: 'An' } }); // 'Hello An'
   */
  templateToDisplay,
  /**
   * Resolves a small literal/template grammar without evaluating JavaScript.
   * A trimmed exact `${a.b}` reference preserves the property's value and type. Literal
   * `true`, `false`, `null`, `undefined`, and signed decimal numbers are recognized;
   * other text is passed to {@link templateToDisplay} with its original whitespace.
   *
   * @param template - Expression text; empty input returns `undefined`.
   * @param entity - Own-property source for references; missing references return `undefined`.
   * @param options - Safe-path depth/accessor policy, as in {@link templateToDisplay}.
   * @returns The referenced value, parsed primitive, or substituted string; no schema validation occurs.
   * @throws {UnsafePropertyPathError} For unsafe property paths.
   * @throws {UnsafePropertyPathError} For invalid path options when traversal is performed.
   * @throws Propagates enabled getter or string-conversion errors.
   * @example StringUtilities.parseExpression('${count}', { count: 3 }); // 3 (number)
   */
  parseExpression,
  /**
   * Reversibly transforms JSON text using the fixed public prefix and brace-swap format
   * of v1.1.x, then URI-encodes it. This provides no confidentiality, integrity, or
   * authentication; never use it to protect secrets, tokens, or personal data.
   *
   * @param obj - JSON-serializable input; ordinary JSON omission and coercion rules apply.
   * @returns URI-encoded obfuscated JSON using the package's fixed compatibility prefix.
   * @throws {TypeError} For cycles, bigint, or top-level inputs without JSON text.
   * @throws Propagates errors from `toJSON` or URI encoding.
   * @example StringUtilities.deobfuscate(StringUtilities.obfuscate({ id: 1 })); // { id: 1 }
   */
  obfuscate,
  /**
   * Reverses {@link obfuscate} and parses the recovered JSON without authentication.
   * The fixed public prefix detects only a format mismatch; an attacker can forge it.
   *
   * @param encripted - Compatibility spelling of the parameter containing obfuscated text.
   * @returns JSON-decoded data; prototypes and original Date instances are not restored.
   * @throws {Error} If the fixed compatibility prefix is missing.
   * @throws {URIError} For invalid URI encoding.
   * @throws {SyntaxError} For malformed recovered JSON.
   * @example StringUtilities.deobfuscate(StringUtilities.obfuscate('hello')); // 'hello'
   */
  deobfuscate,
  /**
   * Compatibility alias of {@link obfuscate}, preserving the legacy wire format.
   *
   * @deprecated This is reversible obfuscation with no security guarantee. Use
   *   {@link encryptAesGcm} for authenticated encryption; migration changes the format and requires a key.
   * @param obj - JSON-serializable value to obfuscate.
   * @returns The same public-prefix encoding as {@link obfuscate}.
   * @throws Propagates JSON and URI serialization errors from {@link obfuscate}.
   * @example StringUtilities.encrypt({ id: 1 });
   */
  encrypt,
  /**
   * Compatibility alias of {@link deobfuscate}, with no authenticity or integrity checks.
   *
   * @deprecated Use {@link decryptAesGcm} for tokens produced by {@link encryptAesGcm}.
   *   Existing obfuscated values must first be decoded and re-encrypted with a real key.
   * @param encripted - Legacy obfuscated text; the spelling is retained for compatibility.
   * @returns JSON-decoded legacy data.
   * @throws Propagates prefix mismatch, URI decoding, and JSON parsing errors.
   * @example StringUtilities.decrypt(StringUtilities.encrypt(1)); // 1
   */
  decrypt,
  /**
   * Authentically encrypts a supported JSON-domain value with AES-GCM.
   * A fresh random 96-bit IV is generated for every token. Raw keys must be
   * 128, 192, or 256 bits; password strings are intentionally unsupported.
   *
   * @typeParam T - Serializable input type; runtime serialization rules still apply.
   * @param value - Supported JSON data or valid Dates (serialized as ISO strings). Invalid Dates,
   *   undefined, bigint, non-finite numbers, sparse arrays, accessors, cycles, and unsupported instances fail.
   * @param key - A 16-, 24-, or 32-byte raw AES key, or a secret AES-GCM CryptoKey permitting encryption.
   * @param options - Optional additional authenticated data; string data is UTF-8 encoded.
   * @returns A Promise of a versioned `sdcore.aesgcm.v1.` token with a fresh 96-bit IV and 128-bit tag.
   * @throws {ValidationError} Rejects invalid keys, additional-data types, and encryption failures.
   * @throws {WebCryptoUnavailableError} Rejects when the Web Crypto API is unavailable.
   * @throws {SecureRandomUnavailableError} Rejects when secure IV generation fails.
   * @throws {UnsupportedSerializationTypeError} Rejects invalid Dates or other unsupported plaintext types.
   * @throws Rejects unsupported/unsafe serialized data with the corresponding serialization/security error.
   * @example
   * const key = crypto.getRandomValues(new Uint8Array(32));
   * const token = await StringUtilities.encryptAesGcm({ id: 1 }, key);
   * const value = await StringUtilities.decryptAesGcm<{ id: number }>(token, key);
   */
  encryptAesGcm,
  /**
   * Authenticates and decrypts an `sdcore.aesgcm.v1` token before parsing plaintext JSON.
   *
   * @typeParam T - Expected result type; this is a type assertion, not runtime schema validation.
   * @param token - Versioned AES-GCM token returned by {@link encryptAesGcm}.
   * @param key - Raw AES key or secret AES-GCM CryptoKey permitting decryption.
   * @param options - Additional authenticated data; must byte-for-byte match the encryption call.
   * @returns A Promise of authenticated, JSON-parsed plaintext; Dates remain strings.
   * @throws {EncryptionFormatError} Rejects malformed or unsupported envelopes.
   * @throws {ValidationError} Rejects invalid key shape/usage, additional-data types, and unsupported crypto parameters.
   * @throws {EncryptionAuthenticationError} Rejects wrong keys/AAD, tampering, or failures during decryption.
   * @example
   * const key = crypto.getRandomValues(new Uint8Array(32));
   * const token = await StringUtilities.encryptAesGcm('hello', key, { additionalData: 'record:1' });
   * await StringUtilities.decryptAesGcm<string>(token, key, { additionalData: 'record:1' }); // 'hello'
   */
  decryptAesGcm,
  /**
   * Tests specifically for `null`, `undefined`, or the empty string without coercion.
   *
   * @param value - Any input; whitespace, `0`, `false`, arrays, and objects are not empty.
   * @returns Whether the input is one of the three empty values.
   * @example StringUtilities.isNullOrEmpty(' '); // false
   */
  isNullOrEmpty,
  /**
   * Tests whether an input is absent, a non-string, or an all-whitespace string.
   * This compatibility predicate treats every non-string as blank, including `0` and `false`.
   *
   * @param value - Input inspected without string coercion; whitespace follows JavaScript `\s`.
   * @returns `false` only for strings containing at least one non-whitespace character.
   * @example StringUtilities.isNullOrWhiteSpace(' \t'); // true
   * @example StringUtilities.isNullOrWhiteSpace(123); // true
   */
  isNullOrWhiteSpace,
  /**
   * Converts a name into a lowercase ASCII code by decomposing accents, folding `đ`,
   * and replacing runs of non-alphanumeric characters with underscores.
   * Leading/trailing separators are removed; camel-case boundaries are not split.
   *
   * @param name - String to normalize. Unsupported scripts or punctuation alone may yield `''`.
   * @returns A new code containing only ASCII lowercase letters, digits, and underscores.
   * @throws {Error} For a non-string runtime input.
   * @example StringUtilities.convertToSnakeCaseCode('Điện thoại'); // 'dien_thoai'
   */
  convertToSnakeCaseCode,
  /**
   * Normalizes a name with {@link convertToSnakeCaseCode} and chooses the first unused
   * code, trying `_1`, `_2`, and so on when needed. Comparisons are case-sensitive.
   * Uniqueness is limited to the supplied snapshot; concurrent writers require their own constraint.
   *
   * @param name - Name from which to derive the base code; an empty normalized base is permitted.
   * @param existingCodes - Codes already in use; this array is not mutated.
   * @returns The base code or the lowest available numbered suffix.
   * @throws {Error} For a non-string name.
   * @example StringUtilities.generateUniqueCode('Hello', ['hello', 'hello_1']); // 'hello_2'
   */
  generateUniqueCode,
  /**
   * Hashes UTF-8 text with Web Crypto SHA-256 and encodes the digest as unpadded Base64URL.
   * The result is deterministic and is not a keyed signature or password-hashing scheme.
   * Unlike {@link sha256Canonical}, this hashes text directly and does not return hexadecimal.
   *
   * @param input - Text to UTF-8 encode with `TextEncoder`.
   * @returns A Promise of the 43-character Base64URL digest.
   * @throws {WebCryptoUnavailableError} Rejects if `crypto.subtle.digest` is unavailable.
   * @throws Rejects if the runtime's digest operation fails.
   * @example await StringUtilities.sha256('hello'); // 'LPJNul-wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ'
   */
  sha256,
};
