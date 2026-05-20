import { ValidationPattern } from '../models/pattern.model';
import { StringUtilities } from '../fns/string.fns';

/**
 * Pre-built validation patterns for common input formats.
 *
 * Each entry is a {@link ValidationPattern} pairing a `ValidationPatternType` with the
 * corresponding regex from `StringUtilities` and i18n keys for display name and error message.
 *
 * Use this array to populate a pattern-picker dropdown or look up the pattern string for a
 * given type at runtime.
 *
 * @example
 * const emailPattern = VALIDATION_PATTERNS.find(p => p.type === 'EMAIL');
 * // { type: 'EMAIL', name: 'core.validator.email.name', pattern: '...', errorMessage: '...' }
 *
 * // Use with Angular reactive forms:
 * const validator = Validators.pattern(emailPattern!.pattern);
 */
export const VALIDATION_PATTERNS: ValidationPattern[] = [
  { type: 'EMAIL',              name: 'core.validator.email.name',            pattern: StringUtilities.REGEX_EMAIL,              errorMessage: 'core.validator.email.error' },
  { type: 'PHONE',              name: 'core.validator.phone.name',            pattern: StringUtilities.REGEX_PHONE,              errorMessage: 'core.validator.phone.error' },
  { type: 'VN_PHONE',           name: 'core.validator.vn-phone.name',         pattern: StringUtilities.REGEX_VN_PHONE,           errorMessage: 'core.validator.vn-phone.error' },
  { type: 'VN_ID',              name: 'core.validator.vn-id.name',            pattern: StringUtilities.REGEX_VN_ID,              errorMessage: 'core.validator.vn-id.error' },
  { type: 'PASSPORT',           name: 'core.validator.passport.name',         pattern: StringUtilities.REGEX_PASSPORT,           errorMessage: 'core.validator.passport.error' },
  { type: 'VN_ID_OR_PASSPORT',  name: 'core.validator.vn-id-or-passport.name', pattern: StringUtilities.REGEX_VN_ID_OR_PASSPORT, errorMessage: 'core.validator.vn-id-or-passport.error' },
  { type: 'TIME',               name: 'core.validator.time.name',             pattern: StringUtilities.REGEX_TIME,               errorMessage: 'core.validator.time.error' },
  { type: 'URL',                name: 'core.validator.url.name',              pattern: StringUtilities.REGEX_URL,                errorMessage: 'core.validator.url.error' },
  { type: 'DOMAIN',             name: 'core.validator.domain.name',           pattern: StringUtilities.REGEX_DOMAIN,             errorMessage: 'core.validator.domain.error' },
  { type: 'IPV4',               name: 'core.validator.ipv4.name',             pattern: StringUtilities.REGEX_IPV4,               errorMessage: 'core.validator.ipv4.error' },
  { type: 'IPV6',               name: 'core.validator.ipv6.name',             pattern: StringUtilities.REGEX_IPV6,               errorMessage: 'core.validator.ipv6.error' },
  { type: 'IMAGE_URL',          name: 'core.validator.image-url.name',        pattern: StringUtilities.REGEX_IMAGE_URL,          errorMessage: 'core.validator.image-url.error' },
  { type: 'SLUG',               name: 'core.validator.slug.name',             pattern: StringUtilities.REGEX_SLUG,               errorMessage: 'core.validator.slug.error' },
  { type: 'NUMBER',             name: 'core.validator.number.name',           pattern: StringUtilities.REGEX_NUMBER,             errorMessage: 'core.validator.number.error' },
  { type: 'INTEGER',            name: 'core.validator.integer.name',          pattern: StringUtilities.REGEX_INTEGER,            errorMessage: 'core.validator.integer.error' },
  { type: 'DECIMAL',            name: 'core.validator.decimal.name',          pattern: StringUtilities.REGEX_DECIMAL,            errorMessage: 'core.validator.decimal.error' },
  { type: 'POSITIVE_NUMBER',    name: 'core.validator.positive-number.name',  pattern: StringUtilities.REGEX_POSITIVE_NUMBER,    errorMessage: 'core.validator.positive-number.error' },
  { type: 'UUID',               name: 'core.validator.uuid.name',             pattern: StringUtilities.REGEX_UUID,               errorMessage: 'core.validator.uuid.error' },
  { type: 'CODE_16',            name: 'core.validator.code-16.name',          pattern: StringUtilities.REGEX_CODE_16,            errorMessage: 'core.validator.code-16.error' },
  { type: 'CODE_32',            name: 'core.validator.code-32.name',          pattern: StringUtilities.REGEX_CODE_32,            errorMessage: 'core.validator.code-32.error' },
  { type: 'HEX_COLOR',          name: 'core.validator.hex-color.name',        pattern: StringUtilities.REGEX_HEX_COLOR,          errorMessage: 'core.validator.hex-color.error' },
  { type: 'BASE64',             name: 'core.validator.base64.name',           pattern: StringUtilities.REGEX_BASE64,             errorMessage: 'core.validator.base64.error' },
];
