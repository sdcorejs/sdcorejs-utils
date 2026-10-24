import { ValidationError } from '../errors';
import { ValidationPatternType } from '../models/pattern.model';
import { StringUtilities } from './string.fns';
import { isFiniteNumber, isNumericString, parseFiniteNumber } from './number.fns';

const PATTERN_MAP: Record<ValidationPatternType, RegExp> = {
  EMAIL: new RegExp(StringUtilities.REGEX_EMAIL),
  PHONE: new RegExp(StringUtilities.REGEX_PHONE),
  VN_PHONE: new RegExp(StringUtilities.REGEX_VN_PHONE),
  VN_ID: new RegExp(StringUtilities.REGEX_VN_ID),
  PASSPORT: new RegExp(StringUtilities.REGEX_PASSPORT),
  VN_ID_OR_PASSPORT: new RegExp(StringUtilities.REGEX_VN_ID_OR_PASSPORT),
  TIME: new RegExp(StringUtilities.REGEX_TIME),
  URL: new RegExp(StringUtilities.REGEX_URL),
  DOMAIN: new RegExp(StringUtilities.REGEX_DOMAIN),
  IPV4: new RegExp(StringUtilities.REGEX_IPV4),
  IPV6: new RegExp(StringUtilities.REGEX_IPV6),
  IMAGE_URL: new RegExp(StringUtilities.REGEX_IMAGE_URL, 'i'),
  SLUG: new RegExp(StringUtilities.REGEX_SLUG),
  NUMBER: new RegExp(StringUtilities.REGEX_NUMBER),
  INTEGER: new RegExp(StringUtilities.REGEX_INTEGER),
  DECIMAL: new RegExp(StringUtilities.REGEX_DECIMAL),
  POSITIVE_NUMBER: new RegExp(StringUtilities.REGEX_POSITIVE_NUMBER),
  UUID: new RegExp(StringUtilities.REGEX_UUID, 'i'),
  CODE_16: new RegExp(StringUtilities.REGEX_CODE_16),
  CODE_32: new RegExp(StringUtilities.REGEX_CODE_32),
  HEX_COLOR: new RegExp(StringUtilities.REGEX_HEX_COLOR),
  BASE64: new RegExp(StringUtilities.REGEX_BASE64),
};

const test = (regex: RegExp, value: unknown): boolean => {
  if (value === null || value === undefined || value === '') return false;
  return regex.test(String(value));
};

/**
 * Validates a value against a named built-in syntax pattern. Unknown runtime names throw.
 *
 * @param type - Built-in pattern name from ValidationPatternType; runtime unknown names are rejected.
 * @param value - Candidate input. URL, image URL, and UUID checks require strings; other
 *   patterns use the documented per-helper string conversion. Nullish/empty values do not match.
 * @returns Whether the selected validator accepts the value under its default options.
 * @throws {ValidationError} For an unknown pattern name.
 * @throws Propagates caller-defined string-conversion errors in regex-based checks.
 * @example ValidationUtilities.validate('EMAIL', 'an@example.com'); // true
 */
const validate = (type: ValidationPatternType, value: unknown): boolean => {
  if (!Object.hasOwn(PATTERN_MAP, type)) throw new ValidationError(`Unknown validation pattern: ${String(type)}`);
  if (type === 'URL') return isUrl(value);
  if (type === 'IMAGE_URL') return isImageUrl(value);
  if (type === 'UUID') return isUuid(value);
  if (type === 'BASE64') return isBase64(value);
  return test(PATTERN_MAP[type], value);
};

/** URL syntax/policy options. This validates syntax, not remote content or trust. */
export interface UrlValidationOptions {
  /**
   * Allowed schemes, default `['http:', 'https:']`. Matching is case-insensitive and
   * the trailing colon is optional in configuration. An empty array rejects all protocols.
   */
  protocols?: readonly string[];
  /**
   * Allow scheme-less paths, default false. Resolution must remain on the base URL's origin;
   * scheme-relative links to another origin are rejected even when this is true.
   */
  allowRelative?: boolean;
  /** Permit embedded username/password credentials. Defaults to `false`. */
  allowCredentials?: boolean;
  /** Require a non-empty hostname for absolute URLs. Defaults to `true`. */
  requireHost?: boolean;
  /**
   * Absolute parsing base, default `http://localhost`. Relative input is resolved against
   * this URL; an invalid base makes validation fail even for absolute candidate URLs.
   */
  baseUrl?: string;
}

/** UUID syntax options. */
export interface UuidValidationOptions {
  /**
   * Require this version nibble (1–8) when set; omitted means no version check.
   * This does not automatically enable RFC-variant checking.
   */
  version?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  /** Require the RFC variant (`8`, `9`, `a`, or `b`). Defaults to `false`. */
  requireRfcVariant?: boolean;
  /** Accept uppercase hexadecimal. Defaults to `true`. */
  allowUppercase?: boolean;
}

/**
 * Checks conventional email syntax with a nonempty local part and dotted domain; quoted local parts are permitted.
 * Does not prove mailbox existence, ownership, or deliverability.
 *
 * @param value - Candidate; null, undefined, and empty text return false. Other values
 *   are converted with String before matching; no trimming is applied.
 * @returns Whether the representation matches the bundled syntax pattern.
 * @throws Propagates errors from a caller-defined string conversion.
 * @example ValidationUtilities.isEmail("an@example.com"); // true
 */
const isEmail = (value: unknown) => test(PATTERN_MAP.EMAIL, value);
/**
 * Checks permissive phone-like syntax with optional plus/parentheses and separators.
 * Does not enforce a country-specific length or establish a reachable phone number.
 *
 * @param value - Candidate; null, undefined, and empty text return false. Other values
 *   are converted with String before matching; no trimming is applied.
 * @returns Whether the representation matches the bundled syntax pattern.
 * @throws Propagates errors from a caller-defined string conversion.
 * @example ValidationUtilities.isPhone("+12025550123"); // true
 */
const isPhone = (value: unknown) => test(PATTERN_MAP.PHONE, value);
/**
 * Checks the package's fixed Vietnamese mobile-prefix pattern with 0, 84, or +84 and seven subscriber digits.
 * This is a bundled prefix list, not a live numbering-plan lookup; it does not verify ownership.
 *
 * @param value - Candidate; null, undefined, and empty text return false. Other values
 *   are converted with String before matching; no trimming is applied.
 * @returns Whether the representation matches the bundled syntax pattern.
 * @throws Propagates errors from a caller-defined string conversion.
 * @example ValidationUtilities.isVnPhone("0912345678"); // true
 */
const isVnPhone = (value: unknown) => test(PATTERN_MAP.VN_PHONE, value);
/**
 * Checks exactly twelve ASCII digits.
 * Checks identifier shape only, without checksum, issue status, or identity verification.
 *
 * @param value - Candidate; null, undefined, and empty text return false. Other values
 *   are converted with String before matching; no trimming is applied.
 * @returns Whether the representation matches the bundled syntax pattern.
 * @throws Propagates errors from a caller-defined string conversion.
 * @example ValidationUtilities.isVnId("012345678901"); // true
 */
const isVnId = (value: unknown) => test(PATTERN_MAP.VN_ID, value);
/**
 * Checks one uppercase ASCII letter followed by seven digits.
 * This is the package's passport pattern, not a universal country-independent passport validator.
 *
 * @param value - Candidate; null, undefined, and empty text return false. Other values
 *   are converted with String before matching; no trimming is applied.
 * @returns Whether the representation matches the bundled syntax pattern.
 * @throws Propagates errors from a caller-defined string conversion.
 * @example ValidationUtilities.isPassport("B1234567"); // true
 */
const isPassport = (value: unknown) => test(PATTERN_MAP.PASSPORT, value);
/**
 * Checks either twelve ASCII digits or one uppercase ASCII letter followed by seven digits.
 * Valid syntax does not prove an identifier was issued or belongs to anyone.
 *
 * @param value - Candidate; null, undefined, and empty text return false. Other values
 *   are converted with String before matching; no trimming is applied.
 * @returns Whether the representation matches the bundled syntax pattern.
 * @throws Propagates errors from a caller-defined string conversion.
 * @example ValidationUtilities.isVnIdOrPassport("B1234567"); // true
 */
const isVnIdOrPassport = (value: unknown) => test(PATTERN_MAP.VN_ID_OR_PASSPORT, value);
/**
 * Checks zero-padded 24-hour HH:mm with hours 00–23 and minutes 00–59.
 * Seconds, offsets, and single-digit hours are rejected.
 *
 * @param value - Candidate; null, undefined, and empty text return false. Other values
 *   are converted with String before matching; no trimming is applied.
 * @returns Whether the representation matches the bundled syntax pattern.
 * @throws Propagates errors from a caller-defined string conversion.
 * @example ValidationUtilities.isTime("09:30"); // true
 */
const isTime = (value: unknown) => test(PATTERN_MAP.TIME, value);

/**
 * Parses a URL and applies an explicit protocol/relative/credential/host policy.
 *
 * @param value - Nonempty string with no leading/trailing whitespace; other values return false.
 * @param options - Protocol, credentials, relative-URL, hostname, and base-URL policy.
 *   Defaults to absolute HTTP(S), a required host, and no embedded credentials.
 * @returns Whether URL parsing and all policies succeed; parsing/configuration errors become false.
 *   Relative input is accepted only when enabled and resolving to the base URL's origin.
 * @remarks Does not fetch the URL, establish trust, block private IPs, or provide an SSRF boundary.
 * @example ValidationUtilities.isUrl('https://example.com/path'); // true
 * @example ValidationUtilities.isUrl('/path', { allowRelative: true }); // true
 */
const isUrl = (value: unknown, options: UrlValidationOptions = {}): boolean => {
  if (typeof value !== 'string' || value.length === 0 || value.trim() !== value) return false;
  const hasScheme = /^[A-Za-z][A-Za-z\d+.-]*:/.test(value);
  if (!hasScheme && !options.allowRelative) return false;
  try {
    const base = new URL(options.baseUrl ?? 'http://localhost');
    const parsed = new URL(value, base);
    if (!hasScheme && parsed.origin !== base.origin) return false;
    const protocols = (options.protocols ?? ['http:', 'https:']).map(protocol =>
      protocol.endsWith(':') ? protocol.toLowerCase() : `${protocol.toLowerCase()}:`);
    if (!protocols.includes(parsed.protocol.toLowerCase())) return false;
    if (!options.allowCredentials && (parsed.username || parsed.password)) return false;
    if ((options.requireHost ?? true) && hasScheme && !parsed.hostname) return false;
    return true;
  } catch {
    return false;
  }
};

/**
 * Checks dotted ASCII domain labels with a final alphabetic suffix of at least two characters.
 * Does not perform DNS resolution; URLs, ports, and raw Unicode domain names are outside this pattern.
 *
 * @param value - Candidate; null, undefined, and empty text return false. Other values
 *   are converted with String before matching; no trimming is applied.
 * @returns Whether the representation matches the bundled syntax pattern.
 * @throws Propagates errors from a caller-defined string conversion.
 * @example ValidationUtilities.isDomain("example.com"); // true
 */
const isDomain = (value: unknown) => test(PATTERN_MAP.DOMAIN, value);
/**
 * Checks four decimal octets from 0 to 255, separated by dots.
 * The legacy pattern allows zero-padded octets; ports and CIDR suffixes are rejected.
 *
 * @param value - Candidate; null, undefined, and empty text return false. Other values
 *   are converted with String before matching; no trimming is applied.
 * @returns Whether the representation matches the bundled syntax pattern.
 * @throws Propagates errors from a caller-defined string conversion.
 * @example ValidationUtilities.isIpv4("192.168.1.1"); // true
 */
const isIpv4 = (value: unknown) => test(PATTERN_MAP.IPV4, value);
/**
 * Checks the bundled full/compressed hexadecimal IPv6 pattern.
 * Not a complete IP parser: IPv4-embedded forms, scope identifiers, brackets, and bare :: are not supported by this pattern.
 *
 * @param value - Candidate; null, undefined, and empty text return false. Other values
 *   are converted with String before matching; no trimming is applied.
 * @returns Whether the representation matches the bundled syntax pattern.
 * @throws Propagates errors from a caller-defined string conversion.
 * @example ValidationUtilities.isIpv6("2001:db8::1"); // true
 */
const isIpv6 = (value: unknown) => test(PATTERN_MAP.IPV6, value);

/**
 * Checks only a path/URL filename extension; it does not validate remote content.
 *
 * @param value - Nonempty string containing a filename/path/URL; text after `?` or `#` is ignored.
 * @returns Whether the remaining path ends in jpg, jpeg, png, gif, webp, svg, or bmp,
 *   case-insensitively. No URL parsing, network access, MIME inspection, or content validation occurs.
 * @example ValidationUtilities.hasImageFileExtension('photo.PNG?size=2'); // true
 */
const hasImageFileExtension = (value: unknown): boolean => {
  if (typeof value !== 'string' || !value) return false;
  const path = value.split(/[?#]/, 1)[0];
  return /\.(?:jpe?g|png|gif|webp|svg|bmp)$/i.test(path);
};

/**
 * Checks HTTP(S) URL syntax plus a known image filename extension. It does not
 * prove that the remote response is an image.
 *
 * @deprecated Use {@link hasImageFileExtension} for filename syntax and validate
 * downloaded content independently on a trusted server. The high-level
 * URL-plus-extension role remains, but v1.2 URL parsing rejects embedded credentials
 * and malformed values more strictly. The replacement checks only extension syntax,
 * so call {@link isUrl} separately when URL policy is also required.
 *
 * @param value - Candidate absolute HTTP(S) URL without embedded credentials.
 * @returns Whether default {@link isUrl} policy and {@link hasImageFileExtension} both pass.
 * @example ValidationUtilities.isImageUrl('https://example.com/photo.jpg'); // true
 */
const isImageUrl = (value: unknown): boolean =>
  isUrl(value) && hasImageFileExtension(value);

/**
 * Checks lowercase ASCII letter/digit groups separated by single hyphens.
 * Underscores, repeated or edge hyphens, uppercase letters, and spaces are rejected.
 *
 * @param value - Candidate; null, undefined, and empty text return false. Other values
 *   are converted with String before matching; no trimming is applied.
 * @returns Whether the representation matches the bundled syntax pattern.
 * @throws Propagates errors from a caller-defined string conversion.
 * @example ValidationUtilities.isSlug("hello-world"); // true
 */
const isSlug = (value: unknown) => test(PATTERN_MAP.SLUG, value);
/**
 * Checks optional minus, one or more digits, and an optional decimal part requiring digits on both sides.
 * Rejects plus signs, whitespace, exponents, and hexadecimal; this checks syntax, not finiteness or precision.
 *
 * @param value - Candidate; null, undefined, and empty text return false. Other values
 *   are converted with String before matching; no trimming is applied.
 * @returns Whether the representation matches the bundled syntax pattern.
 * @throws Propagates errors from a caller-defined string conversion.
 * @example ValidationUtilities.isNumber("-12.5"); // true
 * @deprecated Use isNumericString for explicit numeric syntax options. Defaults differ: exponent and leading-plus forms are accepted by the replacement.
 */
const isNumberSyntax = (value: unknown) => test(PATTERN_MAP.NUMBER, value);
/**
 * Checks an optional minus followed by one or more digits.
 * Leading zeros are allowed; this does not enforce the JavaScript safe-integer range.
 *
 * @param value - Candidate; null, undefined, and empty text return false. Other values
 *   are converted with String before matching; no trimming is applied.
 * @returns Whether the representation matches the bundled syntax pattern.
 * @throws Propagates errors from a caller-defined string conversion.
 * @example ValidationUtilities.isInteger("-12"); // true
 */
const isInteger = (value: unknown) => test(PATTERN_MAP.INTEGER, value);
/**
 * Checks an optional minus and decimal digits requiring a decimal point with digits on both sides.
 * Whole-number text, trailing dots, leading-dot fractions, and exponent syntax are rejected.
 *
 * @param value - Candidate; null, undefined, and empty text return false. Other values
 *   are converted with String before matching; no trimming is applied.
 * @returns Whether the representation matches the bundled syntax pattern.
 * @throws Propagates errors from a caller-defined string conversion.
 * @example ValidationUtilities.isDecimal("12.50"); // true
 */
const isDecimal = (value: unknown) => test(PATTERN_MAP.DECIMAL, value);
/**
 * Checks unsigned digits with an optional fractional part requiring digits on both sides.
 * Despite the compatibility name, zero is accepted. Use a numeric comparison when strict positivity is required.
 *
 * @param value - Candidate; null, undefined, and empty text return false. Other values
 *   are converted with String before matching; no trimming is applied.
 * @returns Whether the representation matches the bundled syntax pattern.
 * @throws Propagates errors from a caller-defined string conversion.
 * @example ValidationUtilities.isPositiveNumber("0"); // true
 */
const isPositiveNumber = (value: unknown) => test(PATTERN_MAP.POSITIVE_NUMBER, value);

/**
 * Validates generic UUID shape with optional version and RFC-variant checks.
 *
 * @param value - UUID string in 8-4-4-4-12 hexadecimal form, without braces or whitespace.
 * @param options - Optional version and RFC-variant constraints; uppercase is accepted by default.
 * @returns Whether shape and enabled bit/casing policies pass. A default shape match does not
 *   prove a particular UUID version, valid variant, uniqueness, or secure generation.
 * @example ValidationUtilities.isUuid('550e8400-e29b-41d4-a716-446655440000', { version: 4 }); // true
 */
const isUuid = (value: unknown, options: UuidValidationOptions = {}): boolean => {
  if (typeof value !== 'string') return false;
  if (options.allowUppercase === false && value !== value.toLowerCase()) return false;
  const match = value.match(/^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i);
  if (!match) return false;
  if (options.version !== undefined && match[3][0].toLowerCase() !== String(options.version)) return false;
  if (options.requireRfcVariant && !/^[89ab]/i.test(match[4])) return false;
  return true;
};

/**
 * Validates a UUID v4 with the RFC variant bits.
 *
 * @param value - Candidate UUID string; uppercase hex is accepted, surrounding whitespace is not.
 * @returns Whether version nibble is 4 and variant nibble is 8, 9, a, or b in a valid UUID shape.
 * @example ValidationUtilities.isUuidV4('550e8400-e29b-41d4-a716-446655440000'); // true
 */
const isUuidV4 = (value: unknown): boolean => isUuid(value, { version: 4, requireRfcVariant: true });

/**
 * Checks exactly sixteen ASCII letters or digits.
 * Case is preserved; punctuation, spaces, and Unicode letters are rejected.
 *
 * @param value - Candidate; null, undefined, and empty text return false. Other values
 *   are converted with String before matching; no trimming is applied.
 * @returns Whether the representation matches the bundled syntax pattern.
 * @throws Propagates errors from a caller-defined string conversion.
 * @example ValidationUtilities.isCode16("Abcd1234Efgh5678"); // true
 */
const isCode16 = (value: unknown) => test(PATTERN_MAP.CODE_16, value);
/**
 * Checks exactly thirty-two ASCII letters or digits.
 * Case is preserved; this is syntax, not a uniqueness or randomness check.
 *
 * @param value - Candidate; null, undefined, and empty text return false. Other values
 *   are converted with String before matching; no trimming is applied.
 * @returns Whether the representation matches the bundled syntax pattern.
 * @throws Propagates errors from a caller-defined string conversion.
 * @example ValidationUtilities.isCode32("Abcd1234Efgh5678Abcd1234Efgh5678"); // true
 */
const isCode32 = (value: unknown) => test(PATTERN_MAP.CODE_32, value);
/**
 * Checks a # prefix followed by three or six hexadecimal digits.
 * Case-insensitive hex digits are supported; alpha channels, missing #, and other CSS color forms are rejected.
 *
 * @param value - Candidate; null, undefined, and empty text return false. Other values
 *   are converted with String before matching; no trimming is applied.
 * @returns Whether the representation matches the bundled syntax pattern.
 * @throws Propagates errors from a caller-defined string conversion.
 * @example ValidationUtilities.isHexColor("#ff00aa"); // true
 */
const isHexColor = (value: unknown) => test(PATTERN_MAP.HEX_COLOR, value);
/**
 * Checks nonempty standard Base64 text of at least four characters, with valid block and padding placement.
 * URL-safe alphabet, whitespace, and omitted required padding are rejected. Pad-bit canonicality and decoded content are not checked.
 *
 * @param value - Candidate; null, undefined, and empty text return false. Other values
 *   are converted with String before matching; no trimming is applied.
 * @returns Whether the representation matches the bundled syntax pattern.
 * @throws Propagates errors from a caller-defined string conversion.
 * @example ValidationUtilities.isBase64("aGk="); // true
 */
const isBase64 = (value: unknown): boolean => test(PATTERN_MAP.BASE64, value);

/**
 * Alphanumeric code, 2-20 characters (letters, digits, `@`, `_`, `-`).
 *
 * @param value - Candidate converted with String unless nullish/empty; no trimming occurs.
 * @returns Whether the representation is 2–20 characters from ASCII letters, digits, @, _, and -.
 * @throws Propagates caller-defined string-conversion failures.
 * @example ValidationUtilities.isCode('order_01'); // true
 */
const isCode = (value: unknown): boolean => {
  if (value === null || value === undefined || value === '') return false;
  return /^[a-zA-Z0-9@_-]{2,20}$/.test(String(value));
};

/**
 * Syntax and policy predicates for common text, numeric, URL, and UUID inputs.
 * Passing a predicate does not verify ownership, remote content, or business authorization.
 * Read individual coercion rules: regex helpers accept some non-strings, while URL/UUID APIs do not.
 *
 * @example
 * import { ValidationUtilities } from '@sdcorejs/utils/fns';
 * ValidationUtilities.isUuidV4('550e8400-e29b-41d4-a716-446655440000'); // true
 */
export const ValidationUtilities = {
  /**
   * Validates a value against a named built-in syntax pattern. Unknown runtime names throw.
   *
   * @param type - Built-in pattern name from ValidationPatternType; runtime unknown names are rejected.
   * @param value - Candidate input. URL, image URL, and UUID checks require strings; other
   *   patterns use the documented per-helper string conversion. Nullish/empty values do not match.
   * @returns Whether the selected validator accepts the value under its default options.
   * @throws {ValidationError} For an unknown pattern name.
   * @throws Propagates caller-defined string-conversion errors in regex-based checks.
   * @example ValidationUtilities.validate('EMAIL', 'an@example.com'); // true
   */
  validate,
  /**
   * Checks conventional email syntax with a nonempty local part and dotted domain; quoted local parts are permitted.
   * Does not prove mailbox existence, ownership, or deliverability.
   *
   * @param value - Candidate; null, undefined, and empty text return false. Other values
   *   are converted with String before matching; no trimming is applied.
   * @returns Whether the representation matches the bundled syntax pattern.
   * @throws Propagates errors from a caller-defined string conversion.
   * @example ValidationUtilities.isEmail("an@example.com"); // true
   */
  isEmail,
  /**
   * Checks permissive phone-like syntax with optional plus/parentheses and separators.
   * Does not enforce a country-specific length or establish a reachable phone number.
   *
   * @param value - Candidate; null, undefined, and empty text return false. Other values
   *   are converted with String before matching; no trimming is applied.
   * @returns Whether the representation matches the bundled syntax pattern.
   * @throws Propagates errors from a caller-defined string conversion.
   * @example ValidationUtilities.isPhone("+12025550123"); // true
   */
  isPhone,
  /**
   * Checks the package's fixed Vietnamese mobile-prefix pattern with 0, 84, or +84 and seven subscriber digits.
   * This is a bundled prefix list, not a live numbering-plan lookup; it does not verify ownership.
   *
   * @param value - Candidate; null, undefined, and empty text return false. Other values
   *   are converted with String before matching; no trimming is applied.
   * @returns Whether the representation matches the bundled syntax pattern.
   * @throws Propagates errors from a caller-defined string conversion.
   * @example ValidationUtilities.isVnPhone("0912345678"); // true
   */
  isVnPhone,
  /**
   * Checks exactly twelve ASCII digits.
   * Checks identifier shape only, without checksum, issue status, or identity verification.
   *
   * @param value - Candidate; null, undefined, and empty text return false. Other values
   *   are converted with String before matching; no trimming is applied.
   * @returns Whether the representation matches the bundled syntax pattern.
   * @throws Propagates errors from a caller-defined string conversion.
   * @example ValidationUtilities.isVnId("012345678901"); // true
   */
  isVnId,
  /**
   * Checks one uppercase ASCII letter followed by seven digits.
   * This is the package's passport pattern, not a universal country-independent passport validator.
   *
   * @param value - Candidate; null, undefined, and empty text return false. Other values
   *   are converted with String before matching; no trimming is applied.
   * @returns Whether the representation matches the bundled syntax pattern.
   * @throws Propagates errors from a caller-defined string conversion.
   * @example ValidationUtilities.isPassport("B1234567"); // true
   */
  isPassport,
  /**
   * Checks either twelve ASCII digits or one uppercase ASCII letter followed by seven digits.
   * Valid syntax does not prove an identifier was issued or belongs to anyone.
   *
   * @param value - Candidate; null, undefined, and empty text return false. Other values
   *   are converted with String before matching; no trimming is applied.
   * @returns Whether the representation matches the bundled syntax pattern.
   * @throws Propagates errors from a caller-defined string conversion.
   * @example ValidationUtilities.isVnIdOrPassport("B1234567"); // true
   */
  isVnIdOrPassport,
  /**
   * Checks zero-padded 24-hour HH:mm with hours 00–23 and minutes 00–59.
   * Seconds, offsets, and single-digit hours are rejected.
   *
   * @param value - Candidate; null, undefined, and empty text return false. Other values
   *   are converted with String before matching; no trimming is applied.
   * @returns Whether the representation matches the bundled syntax pattern.
   * @throws Propagates errors from a caller-defined string conversion.
   * @example ValidationUtilities.isTime("09:30"); // true
   */
  isTime,
  /**
   * Parses a URL and applies an explicit protocol/relative/credential/host policy.
   *
   * @param value - Nonempty string with no leading/trailing whitespace; other values return false.
   * @param options - Protocol, credentials, relative-URL, hostname, and base-URL policy.
   *   Defaults to absolute HTTP(S), a required host, and no embedded credentials.
   * @returns Whether URL parsing and all policies succeed; parsing/configuration errors become false.
   *   Relative input is accepted only when enabled and resolving to the base URL's origin.
   * @remarks Does not fetch the URL, establish trust, block private IPs, or provide an SSRF boundary.
   * @example ValidationUtilities.isUrl('https://example.com/path'); // true
   * @example ValidationUtilities.isUrl('/path', { allowRelative: true }); // true
   */
  isUrl,
  /**
   * Checks dotted ASCII domain labels with a final alphabetic suffix of at least two characters.
   * Does not perform DNS resolution; URLs, ports, and raw Unicode domain names are outside this pattern.
   *
   * @param value - Candidate; null, undefined, and empty text return false. Other values
   *   are converted with String before matching; no trimming is applied.
   * @returns Whether the representation matches the bundled syntax pattern.
   * @throws Propagates errors from a caller-defined string conversion.
   * @example ValidationUtilities.isDomain("example.com"); // true
   */
  isDomain,
  /**
   * Checks four decimal octets from 0 to 255, separated by dots.
   * The legacy pattern allows zero-padded octets; ports and CIDR suffixes are rejected.
   *
   * @param value - Candidate; null, undefined, and empty text return false. Other values
   *   are converted with String before matching; no trimming is applied.
   * @returns Whether the representation matches the bundled syntax pattern.
   * @throws Propagates errors from a caller-defined string conversion.
   * @example ValidationUtilities.isIpv4("192.168.1.1"); // true
   */
  isIpv4,
  /**
   * Checks the bundled full/compressed hexadecimal IPv6 pattern.
   * Not a complete IP parser: IPv4-embedded forms, scope identifiers, brackets, and bare :: are not supported by this pattern.
   *
   * @param value - Candidate; null, undefined, and empty text return false. Other values
   *   are converted with String before matching; no trimming is applied.
   * @returns Whether the representation matches the bundled syntax pattern.
   * @throws Propagates errors from a caller-defined string conversion.
   * @example ValidationUtilities.isIpv6("2001:db8::1"); // true
   */
  isIpv6,
  /**
   * Checks HTTP(S) URL syntax plus a known image filename extension. It does not
   * prove that the remote response is an image.
   *
   * @deprecated Use {@link hasImageFileExtension} for filename syntax and validate
   * downloaded content independently on a trusted server. The high-level
   * URL-plus-extension role remains, but v1.2 URL parsing rejects embedded credentials
   * and malformed values more strictly. The replacement checks only extension syntax,
   * so call {@link isUrl} separately when URL policy is also required.
   *
   * @param value - Candidate absolute HTTP(S) URL without embedded credentials.
   * @returns Whether default {@link isUrl} policy and {@link hasImageFileExtension} both pass.
   * @example ValidationUtilities.isImageUrl('https://example.com/photo.jpg'); // true
   */
  isImageUrl,
  /**
   * Checks only a path/URL filename extension; it does not validate remote content.
   *
   * @param value - Nonempty string containing a filename/path/URL; text after `?` or `#` is ignored.
   * @returns Whether the remaining path ends in jpg, jpeg, png, gif, webp, svg, or bmp,
   *   case-insensitively. No URL parsing, network access, MIME inspection, or content validation occurs.
   * @example ValidationUtilities.hasImageFileExtension('photo.PNG?size=2'); // true
   */
  hasImageFileExtension,
  /**
   * Checks lowercase ASCII letter/digit groups separated by single hyphens.
   * Underscores, repeated or edge hyphens, uppercase letters, and spaces are rejected.
   *
   * @param value - Candidate; null, undefined, and empty text return false. Other values
   *   are converted with String before matching; no trimming is applied.
   * @returns Whether the representation matches the bundled syntax pattern.
   * @throws Propagates errors from a caller-defined string conversion.
   * @example ValidationUtilities.isSlug("hello-world"); // true
   */
  isSlug,
  /**
   * Checks optional minus, one or more digits, and an optional decimal part requiring digits on both sides.
   * Rejects plus signs, whitespace, exponents, and hexadecimal; this checks syntax, not finiteness or precision.
   *
   * @param value - Candidate; null, undefined, and empty text return false. Other values
   *   are converted with String before matching; no trimming is applied.
   * @returns Whether the representation matches the bundled syntax pattern.
   * @throws Propagates errors from a caller-defined string conversion.
   * @example ValidationUtilities.isNumber("-12.5"); // true
   * @deprecated Use isNumericString for explicit numeric syntax options. Defaults differ: exponent and leading-plus forms are accepted by the replacement.
   */
  isNumber: isNumberSyntax,
  /**
   * Checks an optional minus followed by one or more digits.
   * Leading zeros are allowed; this does not enforce the JavaScript safe-integer range.
   *
   * @param value - Candidate; null, undefined, and empty text return false. Other values
   *   are converted with String before matching; no trimming is applied.
   * @returns Whether the representation matches the bundled syntax pattern.
   * @throws Propagates errors from a caller-defined string conversion.
   * @example ValidationUtilities.isInteger("-12"); // true
   */
  isInteger,
  /**
   * Checks an optional minus and decimal digits requiring a decimal point with digits on both sides.
   * Whole-number text, trailing dots, leading-dot fractions, and exponent syntax are rejected.
   *
   * @param value - Candidate; null, undefined, and empty text return false. Other values
   *   are converted with String before matching; no trimming is applied.
   * @returns Whether the representation matches the bundled syntax pattern.
   * @throws Propagates errors from a caller-defined string conversion.
   * @example ValidationUtilities.isDecimal("12.50"); // true
   */
  isDecimal,
  /**
   * Checks unsigned digits with an optional fractional part requiring digits on both sides.
   * Despite the compatibility name, zero is accepted. Use a numeric comparison when strict positivity is required.
   *
   * @param value - Candidate; null, undefined, and empty text return false. Other values
   *   are converted with String before matching; no trimming is applied.
   * @returns Whether the representation matches the bundled syntax pattern.
   * @throws Propagates errors from a caller-defined string conversion.
   * @example ValidationUtilities.isPositiveNumber("0"); // true
   */
  isPositiveNumber,
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
   * Validates generic UUID shape with optional version and RFC-variant checks.
   *
   * @param value - UUID string in 8-4-4-4-12 hexadecimal form, without braces or whitespace.
   * @param options - Optional version and RFC-variant constraints; uppercase is accepted by default.
   * @returns Whether shape and enabled bit/casing policies pass. A default shape match does not
   *   prove a particular UUID version, valid variant, uniqueness, or secure generation.
   * @example ValidationUtilities.isUuid('550e8400-e29b-41d4-a716-446655440000', { version: 4 }); // true
   */
  isUuid,
  /**
   * Validates a UUID v4 with the RFC variant bits.
   *
   * @param value - Candidate UUID string; uppercase hex is accepted, surrounding whitespace is not.
   * @returns Whether version nibble is 4 and variant nibble is 8, 9, a, or b in a valid UUID shape.
   * @example ValidationUtilities.isUuidV4('550e8400-e29b-41d4-a716-446655440000'); // true
   */
  isUuidV4,
  /**
   * Checks exactly sixteen ASCII letters or digits.
   * Case is preserved; punctuation, spaces, and Unicode letters are rejected.
   *
   * @param value - Candidate; null, undefined, and empty text return false. Other values
   *   are converted with String before matching; no trimming is applied.
   * @returns Whether the representation matches the bundled syntax pattern.
   * @throws Propagates errors from a caller-defined string conversion.
   * @example ValidationUtilities.isCode16("Abcd1234Efgh5678"); // true
   */
  isCode16,
  /**
   * Checks exactly thirty-two ASCII letters or digits.
   * Case is preserved; this is syntax, not a uniqueness or randomness check.
   *
   * @param value - Candidate; null, undefined, and empty text return false. Other values
   *   are converted with String before matching; no trimming is applied.
   * @returns Whether the representation matches the bundled syntax pattern.
   * @throws Propagates errors from a caller-defined string conversion.
   * @example ValidationUtilities.isCode32("Abcd1234Efgh5678Abcd1234Efgh5678"); // true
   */
  isCode32,
  /**
   * Checks a # prefix followed by three or six hexadecimal digits.
   * Case-insensitive hex digits are supported; alpha channels, missing #, and other CSS color forms are rejected.
   *
   * @param value - Candidate; null, undefined, and empty text return false. Other values
   *   are converted with String before matching; no trimming is applied.
   * @returns Whether the representation matches the bundled syntax pattern.
   * @throws Propagates errors from a caller-defined string conversion.
   * @example ValidationUtilities.isHexColor("#ff00aa"); // true
   */
  isHexColor,
  /**
   * Checks nonempty standard Base64 text of at least four characters, with valid block and padding placement.
   * URL-safe alphabet, whitespace, and omitted required padding are rejected. Pad-bit canonicality and decoded content are not checked.
   *
   * @param value - Candidate; null, undefined, and empty text return false. Other values
   *   are converted with String before matching; no trimming is applied.
   * @returns Whether the representation matches the bundled syntax pattern.
   * @throws Propagates errors from a caller-defined string conversion.
   * @example ValidationUtilities.isBase64("aGk="); // true
   */
  isBase64,
  /**
   * Alphanumeric code, 2-20 characters (letters, digits, `@`, `_`, `-`).
   *
   * @param value - Candidate converted with String unless nullish/empty; no trimming occurs.
   * @returns Whether the representation is 2–20 characters from ASCII letters, digits, @, _, and -.
   * @throws Propagates caller-defined string-conversion failures.
   * @example ValidationUtilities.isCode('order_01'); // true
   */
  isCode,
};
