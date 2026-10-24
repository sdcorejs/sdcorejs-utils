/**
 * Identifies a built-in validation pattern available in `VALIDATION_PATTERNS`.
 *
 * **Vietnamese formats**
 * - `'VN_PHONE'` — Vietnamese mobile phone number
 * - `'VN_ID'` — Vietnamese national ID card (CCCD / CMND, 12 digits)
 * - `'VN_ID_OR_PASSPORT'` — accepts either VN_ID or PASSPORT
 *
 * **Common formats**
 * - `'EMAIL'` — standard email address
 * - `'PHONE'` — generic international phone number
 * - `'PASSPORT'` — international passport number (letter + 7 digits)
 * - `'TIME'` — time string in `HH:mm` format
 *
 * **Web / network formats**
 * - `'URL'` — HTTP/HTTPS URL
 * - `'DOMAIN'` — bare domain name (e.g. `example.com`)
 * - `'IPV4'` — IPv4 address
 * - `'IPV6'` — IPv6 address
 * - `'IMAGE_URL'` — HTTP/HTTPS URL ending with a common image extension
 * - `'SLUG'` — URL-friendly slug (lowercase letters, digits, hyphens)
 *
 * **Numeric formats**
 * - `'NUMBER'` — integer or decimal, optionally negative
 * - `'INTEGER'` — whole number, optionally negative
 * - `'DECIMAL'` — number that must include a decimal point
 * - `'POSITIVE_NUMBER'` — non-negative integer or decimal
 *
 * **Identifier formats**
 * - `'UUID'` — generic UUID syntax (hyphen-separated hexadecimal groups)
 * - `'CODE_16'` — 16-character alphanumeric code
 * - `'CODE_32'` — 32-character alphanumeric code
 * - `'HEX_COLOR'` — CSS hex color (`#RGB` or `#RRGGBB`)
 * - `'BASE64'` — Base64-encoded string
 *
 * @example
 * const t: ValidationPatternType = 'VN_PHONE';
 */
export type ValidationPatternType =
  | 'EMAIL'
  | 'PHONE'
  | 'VN_PHONE'
  | 'VN_ID'
  | 'PASSPORT'
  | 'VN_ID_OR_PASSPORT'
  | 'TIME'
  | 'URL'
  | 'DOMAIN'
  | 'IPV4'
  | 'IPV6'
  | 'IMAGE_URL'
  | 'SLUG'
  | 'NUMBER'
  | 'INTEGER'
  | 'DECIMAL'
  | 'POSITIVE_NUMBER'
  | 'UUID'
  | 'CODE_16'
  | 'CODE_32'
  | 'HEX_COLOR'
  | 'BASE64';

/**
 * Metadata for one validation pattern: its identifier, regex source, label key, and error key.
 * Applications resolve translation keys and choose RegExp flags; the package does not supply
 * an i18n service. These patterns validate syntax only and may differ from higher-level
 * ValidationUtilities policies, particularly for URL and UUID validation.
 *
 * @example
 * const emailPattern: ValidationPattern = {
 *   type: 'EMAIL',
 *   name: 'core.validator.email.name',
 *   pattern: StringUtilities.REGEX_EMAIL,
 *   errorMessage: 'core.validator.email.error',
 * };
 * const valid = new RegExp(emailPattern.pattern).test('an@example.com'); // true
 */
export interface ValidationPattern {
  /** Pattern identifier — matches a `ValidationPatternType` member. */
  type: ValidationPatternType;
  /** i18n key for the human-readable pattern name shown in the UI. */
  name: string;
  /**
   * RegExp source string without surrounding slashes or embedded flags. Construct a RegExp
   * with any required flags explicitly; the type does not validate regex syntax or remote content.
   */
  pattern: string;
  /** i18n key for the validation error message shown when the pattern does not match. */
  errorMessage: string;
}
