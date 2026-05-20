import { PatternCommon } from '../models/pattern.model';
import { StringUtilities } from '../fns/string.fns';

export const PATTERN_COMMONS: PatternCommon[] = [
  { type: 'EMAIL',            name: 'core.validator.email.name',    regex: StringUtilities.REGEX_EMAIL,            errorMessage: 'core.validator.email.error' },
  { type: 'PHONE',            name: 'core.validator.phone.name',    regex: StringUtilities.REGEX_PHONE,            errorMessage: 'core.validator.phone.error' },
  { type: 'PHONE_VN',         name: 'core.validator.phone-vn.name', regex: StringUtilities.REGEX_PHONE_VN,         errorMessage: 'core.validator.phone-vn.error' },
  { type: 'IDVN',             name: 'core.validator.cccd.name',     regex: StringUtilities.REGEX_IDVN,             errorMessage: 'core.validator.cccd.error' },
  { type: 'PASSPORT',         name: 'core.validator.passport.name', regex: StringUtilities.REGEX_PASSPORT,         errorMessage: 'core.validator.passport.error' },
  { type: 'IDVN_OR_PASSPORT', name: 'core.validator.id-vn.name',   regex: StringUtilities.REGEX_IDVN_OR_PASSPORT, errorMessage: 'core.validator.id-vn.error' },
  { type: 'TIME',             name: 'core.validator.time.name',     regex: StringUtilities.REGEX_TIME,             errorMessage: 'core.validator.time.error' },
];
