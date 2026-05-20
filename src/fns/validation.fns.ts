import { StringUtilities } from './string.fns';
import { ValidationPatternType } from '../models/pattern.model';

const test = (regex: string, value: unknown): boolean => {
  if (value === null || value === undefined || value === '') return false;
  return new RegExp(regex).test(String(value));
};

/** Validate any value against a named {@link ValidationPatternType} pattern. */
const validate = (type: ValidationPatternType, value: unknown): boolean =>
  test(PATTERN_MAP[type], value);

const PATTERN_MAP: Record<ValidationPatternType, string> = {
  EMAIL:              StringUtilities.REGEX_EMAIL,
  PHONE:              StringUtilities.REGEX_PHONE,
  VN_PHONE:           StringUtilities.REGEX_VN_PHONE,
  VN_ID:              StringUtilities.REGEX_VN_ID,
  PASSPORT:           StringUtilities.REGEX_PASSPORT,
  VN_ID_OR_PASSPORT:  StringUtilities.REGEX_VN_ID_OR_PASSPORT,
  TIME:               StringUtilities.REGEX_TIME,
  URL:                StringUtilities.REGEX_URL,
  DOMAIN:             StringUtilities.REGEX_DOMAIN,
  IPV4:               StringUtilities.REGEX_IPV4,
  IPV6:               StringUtilities.REGEX_IPV6,
  IMAGE_URL:          StringUtilities.REGEX_IMAGE_URL,
  SLUG:               StringUtilities.REGEX_SLUG,
  NUMBER:             StringUtilities.REGEX_NUMBER,
  INTEGER:            StringUtilities.REGEX_INTEGER,
  DECIMAL:            StringUtilities.REGEX_DECIMAL,
  POSITIVE_NUMBER:    StringUtilities.REGEX_POSITIVE_NUMBER,
  UUID:               StringUtilities.REGEX_UUID,
  CODE_16:            StringUtilities.REGEX_CODE_16,
  CODE_32:            StringUtilities.REGEX_CODE_32,
  HEX_COLOR:          StringUtilities.REGEX_HEX_COLOR,
  BASE64:             StringUtilities.REGEX_BASE64,
};

const isEmail          = (v: unknown) => test(StringUtilities.REGEX_EMAIL,              v);
const isPhone          = (v: unknown) => test(StringUtilities.REGEX_PHONE,              v);
const isVnPhone        = (v: unknown) => test(StringUtilities.REGEX_VN_PHONE,           v);
const isVnId           = (v: unknown) => test(StringUtilities.REGEX_VN_ID,              v);
const isPassport       = (v: unknown) => test(StringUtilities.REGEX_PASSPORT,           v);
const isVnIdOrPassport = (v: unknown) => test(StringUtilities.REGEX_VN_ID_OR_PASSPORT,  v);
const isTime           = (v: unknown) => test(StringUtilities.REGEX_TIME,               v);
const isUrl            = (v: unknown) => test(StringUtilities.REGEX_URL,                v);
const isDomain         = (v: unknown) => test(StringUtilities.REGEX_DOMAIN,             v);
const isIpv4           = (v: unknown) => test(StringUtilities.REGEX_IPV4,               v);
const isIpv6           = (v: unknown) => test(StringUtilities.REGEX_IPV6,               v);
const isImageUrl       = (v: unknown) => test(StringUtilities.REGEX_IMAGE_URL,          v);
const isSlug           = (v: unknown) => test(StringUtilities.REGEX_SLUG,               v);
const isNumber         = (v: unknown) => test(StringUtilities.REGEX_NUMBER,             v);
const isInteger        = (v: unknown) => test(StringUtilities.REGEX_INTEGER,            v);
const isDecimal        = (v: unknown) => test(StringUtilities.REGEX_DECIMAL,            v);
const isPositiveNumber = (v: unknown) => test(StringUtilities.REGEX_POSITIVE_NUMBER,    v);
const isUuid           = (v: unknown) => test(StringUtilities.REGEX_UUID,               v);
const isCode16         = (v: unknown) => test(StringUtilities.REGEX_CODE_16,            v);
const isCode32         = (v: unknown) => test(StringUtilities.REGEX_CODE_32,            v);
const isHexColor       = (v: unknown) => test(StringUtilities.REGEX_HEX_COLOR,          v);
const isBase64         = (v: unknown) => test(StringUtilities.REGEX_BASE64,             v);

/** Alphanumeric code, 2–20 characters (letters, digits, @, _, -). */
const isCode = (v: unknown): boolean => {
  if (v === null || v === undefined || v === '') return false;
  return /^[a-zA-Z0-9@_\-]{2,20}$/.test(String(v));
};

export const ValidationUtilities = {
  validate,
  isEmail, isPhone, isVnPhone, isVnId, isPassport, isVnIdOrPassport, isTime,
  isUrl, isDomain, isIpv4, isIpv6, isImageUrl, isSlug,
  isNumber, isInteger, isDecimal, isPositiveNumber,
  isUuid, isCode16, isCode32, isHexColor, isBase64,
  isCode,
};
