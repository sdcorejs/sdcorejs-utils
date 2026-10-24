import { DateParseError } from '../errors';
import { NumberUtilities } from './number.fns';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const FORMAT_TOKENS = ['yyyy', 'MM', 'dd', 'HH', 'mm', 'ss'] as const;
type FormatToken = (typeof FORMAT_TOKENS)[number];

/** Controls how adding calendar months handles a day absent from the target month. */
export interface AddMonthsOptions {
  /**
   * Missing-day policy, default `'constrain'`: clamp to the target month's last day.
   * `'balance'` uses native local-month rollover; `'reject'` returns null if the original day is absent.
   */
  overflow?: 'constrain' | 'balance' | 'reject';
}

/** Reads and shows dates in one fixed IANA time zone instead of the host's local zone. */
export interface TimeZoneOptions {
  /**
   * IANA time zone id such as `Asia/Ho_Chi_Minh`. Omitted means the host's local zone, exactly as in 1.2.x.
   * Numeric offsets (`+07:00`) are rejected because they carry no offset history.
   */
  timeZone?: string;
}

/** Wall-clock fields in a time zone; `month` is 1-12. */
export interface ZonedDateTimeParts {
  /**
   * Full calendar year, not a two-digit year. Parsing supports years 0000–9999;
   * parts derived from Date instants may cover the runtime's wider Date range.
   */
  year: number;
  /**
   * One-based calendar month, 1–12 for normalized output (unlike Date.getMonth).
   */
  month: number;
  /**
   * Day of the month, 1–31 as permitted by the normalized year and month.
   */
  day: number;
  /**
   * Wall-clock hour, 0–23 for normalized output, with no AM/PM conversion.
   */
  hour: number;
  /**
   * Wall-clock minute, 0–59 for normalized output.
   */
  minute: number;
  /**
   * Wall-clock second, 0–59 for normalized output; leap seconds are unsupported.
   */
  second: number;
  /**
   * Fractional-second component in whole milliseconds, 0–999 for normalized output.
   */
  millisecond: number;
}

const isLeapYear = (year: number): boolean => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

const daysInMonth = (year: number, month: number): number => {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
};

const validOrNull = (value: Date): Date | null => Number.isFinite(value.getTime()) ? value : null;

const utcCalendarEpoch = (value: Date): number => {
  const result = new Date(0);
  result.setUTCHours(0, 0, 0, 0);
  result.setUTCFullYear(value.getFullYear(), value.getMonth(), value.getDate());
  return result.getTime();
};

const isValidDateParts = (year: number, month: number, day: number): boolean =>
  Number.isSafeInteger(year) &&
  year >= 0 &&
  year <= 9999 &&
  Number.isSafeInteger(month) &&
  month >= 1 &&
  month <= 12 &&
  Number.isSafeInteger(day) &&
  day >= 1 &&
  day <= daysInMonth(year, month);

const isValidTimeParts = (hour: number, minute: number, second: number): boolean =>
  Number.isSafeInteger(hour) &&
  hour >= 0 &&
  hour <= 23 &&
  Number.isSafeInteger(minute) &&
  minute >= 0 &&
  minute <= 59 &&
  Number.isSafeInteger(second) &&
  second >= 0 &&
  second <= 59;

const makeLocalDate = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
): Date => {
  const result = new Date(0);
  result.setHours(0, 0, 0, 0);
  result.setFullYear(year, month - 1, day);
  result.setHours(hour, minute, second, millisecond);
  if (
    result.getFullYear() !== year ||
    result.getMonth() !== month - 1 ||
    result.getDate() !== day ||
    result.getHours() !== hour ||
    result.getMinutes() !== minute ||
    result.getSeconds() !== second ||
    result.getMilliseconds() !== millisecond
  ) {
    throw new DateParseError('Local date-time falls outside the supported calendar range');
  }
  return result;
};

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

type CalendarDay = Pick<ZonedDateTimeParts, 'year' | 'month' | 'day'>;

const localToday = (): CalendarDay => {
  const today = new Date();
  return { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
};

/** Validated fields of `value` in `format`; time-only formats take their date from `today`. */
const parseFormatFields = (value: string, format: string, allowTimeOnly: boolean, today: () => CalendarDay): ZonedDateTimeParts => {
  if (!value || !format) throw new DateParseError('Date value and format are required');

  const tokens: FormatToken[] = [];
  let pattern = '^';
  for (let index = 0; index < format.length;) {
    const token = FORMAT_TOKENS.find(candidate => format.startsWith(candidate, index));
    if (token) {
      if (tokens.includes(token)) throw new DateParseError(`Duplicate date format token: ${token}`);
      tokens.push(token);
      pattern += token === 'yyyy' ? '(\\d{4})' : '(\\d{2})';
      index += token.length;
    } else {
      pattern += escapeRegex(format[index]);
      index++;
    }
  }
  pattern += '$';

  const match = new RegExp(pattern).exec(value);
  if (!match) throw new DateParseError(`Date does not match format ${format}`);

  const parts = new Map<FormatToken, number>();
  tokens.forEach((token, index) => parts.set(token, Number(match[index + 1])));
  const hasAnyDate = ['yyyy', 'MM', 'dd'].some(token => parts.has(token as FormatToken));
  const hasCompleteDate = ['yyyy', 'MM', 'dd'].every(token => parts.has(token as FormatToken));
  if (hasAnyDate && !hasCompleteDate) throw new DateParseError('Date formats must include yyyy, MM, and dd together');
  if (!hasCompleteDate && !allowTimeOnly) throw new DateParseError('A complete local date is required');

  const fallback = hasCompleteDate ? undefined : today();
  const year = parts.get('yyyy') ?? fallback!.year;
  const month = parts.get('MM') ?? fallback!.month;
  const day = parts.get('dd') ?? fallback!.day;
  const hour = parts.get('HH') ?? 0;
  const minute = parts.get('mm') ?? 0;
  const second = parts.get('ss') ?? 0;

  if (!isValidDateParts(year, month, day)) throw new DateParseError('Invalid local calendar date');
  if (!isValidTimeParts(hour, minute, second)) throw new DateParseError('Invalid local time');
  return { year, month, day, hour, minute, second, millisecond: 0 };
};

const parseByFormat = (value: string, format: string, allowTimeOnly = false): Date => {
  const { year, month, day, hour, minute, second } = parseFormatFields(value, format, allowTimeOnly, localToday);
  return makeLocalDate(year, month, day, hour, minute, second);
};

// ─── Fixed time zones (Intl) ──────────────────────────────────────────────────
// Only `Intl.DateTimeFormat` is used, so the offset history comes from the runtime's tzdata
// and nothing is bundled. Formatters are cached per zone; the cache never changes results.

const NUMERIC_OFFSET_ZONE = /^(?:[+-]|(?:UTC|GMT)[+-])/i;
const zonedFormatters = new Map<string, Intl.DateTimeFormat>();

const zonedFormatter = (timeZone: string): Intl.DateTimeFormat | null => {
  const cached = zonedFormatters.get(timeZone);
  if (cached) return cached;
  if (!timeZone || timeZone.trim() !== timeZone || NUMERIC_OFFSET_ZONE.test(timeZone)) return null;
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      era: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
  } catch {
    return null;
  }
  zonedFormatters.set(timeZone, formatter);
  return formatter;
};

const requireZone = (timeZone: unknown): Intl.DateTimeFormat => {
  const formatter = typeof timeZone === 'string' ? zonedFormatter(timeZone) : null;
  if (!formatter) throw new DateParseError(`Unsupported time zone: ${String(timeZone)}`);
  return formatter;
};

const partsAt = (epoch: number, formatter: Intl.DateTimeFormat): ZonedDateTimeParts => {
  const fields: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  for (const part of formatter.formatToParts(new Date(epoch))) fields[part.type] = part.value;
  const yearOfEra = Number(fields.year);
  return {
    year: fields.era === 'BC' ? 1 - yearOfEra : yearOfEra,
    month: Number(fields.month),
    day: Number(fields.day),
    hour: Number(fields.hour),
    minute: Number(fields.minute),
    second: Number(fields.second),
    millisecond: ((epoch % 1000) + 1000) % 1000,
  };
};

/** Epoch of the wall clock read as if it were UTC; out-of-range fields roll over like `Date.UTC`. */
const wallEpoch = (parts: ZonedDateTimeParts): number => {
  const result = new Date(0);
  result.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  result.setUTCHours(parts.hour, parts.minute, parts.second, parts.millisecond);
  return result.getTime();
};

const offsetAt = (epoch: number, formatter: Intl.DateTimeFormat): number => wallEpoch(partsAt(epoch, formatter)) - epoch;

/**
 * Instant of a wall clock in a zone. A repeated wall clock takes the earlier offset and a skipped
 * one moves forward by the gap (Temporal's `compatible` disambiguation).
 */
const zonedEpoch = (parts: ZonedDateTimeParts, formatter: Intl.DateTimeFormat): number => {
  const wall = wallEpoch(parts);
  const before = wall - offsetAt(wall - MILLISECONDS_PER_DAY, formatter);
  const after = wall - offsetAt(wall + MILLISECONDS_PER_DAY, formatter);
  const exact = [before, after].filter(candidate => wallEpoch(partsAt(candidate, formatter)) === wall);
  if (exact.length > 0) return Math.min(...exact);
  return before;
};

const completeParts = (parts: Partial<ZonedDateTimeParts> & CalendarDay): ZonedDateTimeParts => {
  const complete = {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour ?? 0,
    minute: parts.minute ?? 0,
    second: parts.second ?? 0,
    millisecond: parts.millisecond ?? 0,
  };
  if (!Object.values(complete).every(Number.isSafeInteger)) throw new DateParseError('Zoned date-time fields must be safe integers');
  return complete;
};

/**
 * Strictly parses a plain calendar date at local midnight without a UTC date shift.
 *
 * @param value - String matching the exact format; no trimming or coercion is performed.
 * @param format - Defaults to `yyyy-MM-dd`. Requires yyyy, MM, dd exactly once, fixed-width
 *   digits, and literal separators. Time tokens are rejected.
 * @returns A new Date at host-local midnight; does not represent UTC midnight unless the host uses UTC.
 * @throws {DateParseError} For invalid type, syntax, format, impossible date, or unrepresentable local midnight.
 * @example parseLocalDateStrict('2024-02-29').getDate(); // 29
 */
export const parseLocalDateStrict = (value: unknown, format = 'yyyy-MM-dd'): Date => {
  if (typeof value !== 'string') throw new DateParseError('Local date must be a string');
  if (FORMAT_TOKENS.some(token => ['HH', 'mm', 'ss'].includes(token) && format.includes(token))) {
    throw new DateParseError('Local date format cannot contain time tokens');
  }
  return parseByFormat(value, format);
};

/**
 * Strictly parses a local date-time with no timezone conversion.
 *
 * @param value - Exact local date/time string with no timezone suffix or automatic trimming.
 * @param format - Defaults to `yyyy-MM-ddTHH:mm:ss`; supported tokens are yyyy, MM, dd,
 *   HH, mm, ss, each at most once. A complete date is required; omitted time fields become zero.
 * @returns A new Date interpreted in the host's local timezone.
 * @throws {DateParseError} For invalid syntax/calendar/time, duplicate tokens, or a DST gap
 *   that cannot preserve the requested local fields. Native overlap resolution chooses the earlier instant.
 * @example parseLocalDateTimeStrict('2024-01-15T10:30:00').getHours(); // 10
 */
export const parseLocalDateTimeStrict = (value: unknown, format = 'yyyy-MM-ddTHH:mm:ss'): Date => {
  if (typeof value !== 'string') throw new DateParseError('Local date-time must be a string');
  return parseByFormat(value, format);
};

const INSTANT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})$/;

/**
 * Strictly parses an epoch-millisecond value, `Date`, or millisecond-precision ISO instant carrying `Z`/an offset.
 *
 * @param value - Valid Date, finite epoch milliseconds, or ISO text with a four-digit date,
 *   `T`, hours/minutes, optional seconds and 1–3 fraction digits, and required `Z` or `±HH:mm`.
 *   Zone-less/date-only strings, arbitrary objects, and impossible fields are rejected.
 * @returns A new Date representing the instant; an input Date is cloned, never mutated.
 * @throws {DateParseError} For unsupported input, invalid syntax/fields, or an out-of-range instant.
 * @example parseInstant('2024-01-01T07:00:00+07:00').toISOString(); // '2024-01-01T00:00:00.000Z'
 */
export const parseInstant = (value: unknown): Date => {
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) throw new DateParseError('Invalid Date instance');
    return new Date(value.getTime());
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new DateParseError('Instant timestamp must be finite');
    const result = new Date(value);
    if (!Number.isFinite(result.getTime())) throw new DateParseError('Instant timestamp is outside the Date range');
    return result;
  }
  if (typeof value !== 'string') throw new DateParseError('Instant must be a Date, finite timestamp, or ISO string');

  const match = INSTANT_PATTERN.exec(value);
  if (!match) throw new DateParseError('ISO instant must include a Z or numeric timezone offset');
  const [, yearText, monthText, dayText, hourText, minuteText, secondText = '0', , zone] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  if (!isValidDateParts(year, month, day) || !isValidTimeParts(hour, minute, second)) {
    throw new DateParseError('Invalid ISO instant components');
  }
  if (zone !== 'Z') {
    const offsetHour = Number(zone.slice(1, 3));
    const offsetMinute = Number(zone.slice(4, 6));
    if (offsetHour > 23 || offsetMinute > 59) throw new DateParseError('Invalid timezone offset');
  }
  const epoch = Date.parse(value);
  if (!Number.isFinite(epoch)) throw new DateParseError('Invalid ISO instant');
  return new Date(epoch);
};

/**
 * Returns whether `value` is a valid plain calendar date in `format`.
 *
 * @param value - Candidate local date string; no coercion.
 * @param format - Exact format, default `yyyy-MM-dd`; uses {@link parseLocalDateStrict}.
 * @returns Whether strict local parsing succeeds; parse errors become false.
 * @example isValidLocalDate('2023-02-29'); // false
 */
export const isValidLocalDate = (value: unknown, format = 'yyyy-MM-dd'): boolean => {
  try {
    parseLocalDateStrict(value, format);
    return true;
  } catch {
    return false;
  }
};

/**
 * Returns whether `value` is a valid instant with explicit timezone semantics.
 *
 * @param value - Candidate Date, epoch milliseconds, or ISO string with explicit offset.
 * @returns Whether {@link parseInstant} succeeds; date-only and zone-less strings return false.
 * @example isValidInstant('2024-01-01T00:00:00Z'); // true
 */
export const isValidInstant = (value: unknown): boolean => {
  try {
    parseInstant(value);
    return true;
  } catch {
    return false;
  }
};

// Backend instants often carry micro- or nanosecond fractions (Java `Instant`, Postgres) or a
// colon-less offset (Jackson's `StdDateFormat` writes `+0000`). 1.1.x accepted both through
// `Date.parse`, so the legacy helpers keep doing so. `parseInstant` stays strict.
const LEGACY_INSTANT_PATTERN = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}:?\d{2})$/;

/** Fraction digits as whole milliseconds, truncated like `Date.parse` and Java's `toEpochMilli`. */
const fractionToMilliseconds = (fraction: string): string => fraction.slice(0, 3).padEnd(3, '0');

/** Rewrites a legacy instant into the millisecond, colon-offset form `parseInstant` accepts. */
const normalizeLegacyInstant = (value: string): string | undefined => {
  const match = LEGACY_INSTANT_PATTERN.exec(value);
  if (!match) return undefined;
  const [, dateTime, second, fraction, zone] = match;
  const milliseconds = fraction === undefined ? '' : `.${fractionToMilliseconds(fraction)}`;
  const seconds = second === undefined ? '' : `:${second}${milliseconds}`;
  const offset = zone === 'Z' || zone.includes(':') ? zone : `${zone.slice(0, 3)}:${zone.slice(3)}`;
  return `${dateTime}${seconds}${offset}`;
};

const LOCAL_DATE_YMD = /^(\d{4})([-/])(\d{1,2})\2(\d{1,2})$/;
const LOCAL_DATE_MDY = /^(\d{1,2})([-/])(\d{1,2})\2(\d{4})$/;
const LOCAL_DATE_TIME_YMD = /^(\d{4})([-/])(\d{1,2})\2(\d{1,2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?$/;
const LOCAL_DATE_TIME_MDY = /^(\d{1,2})([-/])(\d{1,2})\2(\d{4})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?$/;

const parseLegacyString = (value: string): Date => {
  const instant = normalizeLegacyInstant(value);
  if (instant !== undefined) return parseInstant(instant);

  let match = LOCAL_DATE_YMD.exec(value);
  if (match) return makeLocalDate(Number(match[1]), Number(match[3]), Number(match[4]));
  match = LOCAL_DATE_MDY.exec(value);
  if (match) return makeLocalDate(Number(match[4]), Number(match[1]), Number(match[3]));

  match = LOCAL_DATE_TIME_YMD.exec(value);
  if (match) {
    const [, year, , month, day, hour, minute, second = '0', fraction = '0'] = match;
    if (!isValidDateParts(+year, +month, +day) || !isValidTimeParts(+hour, +minute, +second)) {
      throw new DateParseError('Invalid local date-time');
    }
    return makeLocalDate(+year, +month, +day, +hour, +minute, +second, +fractionToMilliseconds(fraction));
  }
  match = LOCAL_DATE_TIME_MDY.exec(value);
  if (match) {
    const [, month, , day, year, hour, minute, second = '0', fraction = '0'] = match;
    if (!isValidDateParts(+year, +month, +day) || !isValidTimeParts(+hour, +minute, +second)) {
      throw new DateParseError('Invalid local date-time');
    }
    return makeLocalDate(+year, +month, +day, +hour, +minute, +second, +fractionToMilliseconds(fraction));
  }
  throw new DateParseError('Unsupported date string');
};

const parseDateInput = (value: unknown): Date => {
  if (value instanceof Date || typeof value === 'number') return parseInstant(value);
  if (typeof value === 'string' && value.length > 0) return parseLegacyString(value);
  throw new DateParseError('Unsupported date input');
};

/** Own fields of a zone-less string that `parseLegacyString` accepts; never converted through an instant. */
const parseWallClock = (value: string): ZonedDateTimeParts => {
  const build = (year: string, month: string, day: string, hour = '0', minute = '0', second = '0', fraction = '0'): ZonedDateTimeParts => {
    const parts = { year: +year, month: +month, day: +day, hour: +hour, minute: +minute, second: +second, millisecond: +fractionToMilliseconds(fraction) };
    if (!isValidDateParts(parts.year, parts.month, parts.day) || !isValidTimeParts(parts.hour, parts.minute, parts.second)) {
      throw new DateParseError('Invalid local date-time');
    }
    return parts;
  };
  let match = LOCAL_DATE_YMD.exec(value);
  if (match) return build(match[1], match[3], match[4]);
  match = LOCAL_DATE_MDY.exec(value);
  if (match) return build(match[4], match[1], match[3]);
  match = LOCAL_DATE_TIME_YMD.exec(value);
  if (match) return build(match[1], match[3], match[4], match[5], match[6], match[7], match[8]);
  match = LOCAL_DATE_TIME_MDY.exec(value);
  if (match) return build(match[4], match[1], match[3], match[5], match[6], match[7], match[8]);
  throw new DateParseError('Unsupported date string');
};

/** An instant (Date, epoch, ISO with Z/offset) or the own fields of a zone-less string. */
const readZoned = (value: unknown): { instant: number } | { wall: ZonedDateTimeParts } => {
  if (value instanceof Date || typeof value === 'number') return { instant: parseInstant(value).getTime() };
  if (typeof value !== 'string' || value.length === 0) throw new DateParseError('Unsupported date input');
  const instant = normalizeLegacyInstant(value);
  if (instant !== undefined) return { instant: parseInstant(instant).getTime() };
  return { wall: parseWallClock(value) };
};

const zonedFields = (value: unknown, formatter: Intl.DateTimeFormat): ZonedDateTimeParts => {
  const reading = readZoned(value);
  return 'instant' in reading ? partsAt(reading.instant, formatter) : reading.wall;
};

const zonedInstant = (value: unknown, formatter: Intl.DateTimeFormat): number => {
  const reading = readZoned(value);
  return 'instant' in reading ? reading.instant : zonedEpoch(reading.wall, formatter);
};

/**
 * Returns whether `value` is an IANA time zone id this runtime supports; numeric offsets and `local` are rejected.
 *
 * @param value - Candidate IANA identifier, such as `UTC` or `Asia/Ho_Chi_Minh`.
 * @returns Whether this runtime's Intl.DateTimeFormat accepts the zone under the library's
 *   identifier policy. Available names/history depend on runtime timezone data.
 * @example isValidTimeZone('Asia/Ho_Chi_Minh'); // true in runtimes with this zone.
 */
export const isValidTimeZone = (value: unknown): boolean => typeof value === 'string' && zonedFormatter(value) !== null;

/**
 * Wall-clock fields of a supported value in `timeZone`; zone-less strings keep their own fields. `null` when invalid.
 *
 * @param value - A value accepted by {@link parse}. Instants are converted to the zone;
 *   zone-less strings retain their calendar fields rather than being interpreted in the host zone first.
 * @param timeZone - Supported IANA zone; numeric offset identifiers are rejected.
 * @returns A new parts object, or null for invalid input/zone; does not mutate the input.
 * @example toZonedParts('2024-01-01T00:00:00Z', 'Asia/Ho_Chi_Minh')?.hour; // 7
 */
export const toZonedParts = (value: unknown, timeZone: string): ZonedDateTimeParts | null => {
  try {
    return { ...zonedFields(value, requireZone(timeZone)) };
  } catch {
    return null;
  }
};

/**
 * Instant of a wall clock in `timeZone`. Time fields default to 0 and out-of-range fields roll over
 * like `Date.UTC`. A repeated wall clock takes the earlier offset; a skipped one moves forward.
 * Throws `DateParseError` for an unsupported zone or non-integer fields.
 *
 * @param parts - Integer wall-clock fields; year/month/day are required and time fields default to zero.
 *   Out-of-range integer fields are balanced, not strictly rejected as calendar dates.
 * @param timeZone - Supported IANA zone whose rules resolve the wall clock.
 * @returns A new Date instant. DST overlaps choose the earlier instant; gaps move forward.
 * @throws {DateParseError} For invalid fields/zone or a result outside the Date range.
 * @example fromZonedParts({ year: 2024, month: 1, day: 1 }, 'UTC').toISOString(); // '2024-01-01T00:00:00.000Z'
 */
export const fromZonedParts = (parts: Partial<ZonedDateTimeParts> & Pick<ZonedDateTimeParts, 'year' | 'month' | 'day'>, timeZone: string): Date => {
  const formatter = requireZone(timeZone);
  const result = new Date(zonedEpoch(completeParts(parts), formatter));
  if (!Number.isFinite(result.getTime())) throw new DateParseError('Zoned date-time is outside the Date range');
  return result;
};

/**
 * Lenient parser for every input `isDate` accepts; `null` instead of throwing. Zone-less strings are read in `options.timeZone`.
 *
 * @param value - Valid Date, epoch milliseconds, ISO instant, or supported year-first/month-first
 *   date/time text with `-` or `/` separators. Legacy instants allow 1–9 fractional digits
 *   (truncated to milliseconds) and colon-less offsets. No arbitrary object coercion occurs.
 * @param options - Optional IANA zone for zone-less text; omission uses the host-local zone.
 * @returns A new Date, or null when parsing fails; input Date instances are not mutated.
 * @example parse('2024-01-01', { timeZone: 'UTC' })?.toISOString(); // '2024-01-01T00:00:00.000Z'
 */
export const parse = (value: unknown, options?: TimeZoneOptions): Date | null => {
  try {
    if (options?.timeZone === undefined) return parseDateInput(value);
    return new Date(zonedInstant(value, requireZone(options.timeZone)));
  } catch {
    return null;
  }
};

const formatFields = (format: string, parts: ZonedDateTimeParts): string => {
  const values: Record<FormatToken, string> = {
    yyyy: parts.year.toString().padStart(4, '0'),
    MM: parts.month.toString().padStart(2, '0'),
    dd: parts.day.toString().padStart(2, '0'),
    HH: parts.hour.toString().padStart(2, '0'),
    mm: parts.minute.toString().padStart(2, '0'),
    ss: parts.second.toString().padStart(2, '0'),
  };
  return format.replace(/yyyy|MM|dd|HH|mm|ss/g, token => values[token as FormatToken]);
};

/**
 * Legacy broad date guard, now rejecting coercible objects and impossible calendar values.
 *
 * @param value - Candidate in the legacy input domain described by {@link parse}.
 * @returns Whether host-local parsing succeeds; this is not an `instanceof Date` type guard.
 * @example isDate('2024-01-01'); // true
 * @example isDate({ valueOf: () => 0 }); // false
 */
export const isDate = (value: unknown): boolean => {
  try {
    parseDateInput(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Formats a supported date value; every token occurrence is replaced. Without `options.timeZone` it uses
 * the local timezone. With it, an instant shows the zone's wall clock and a zone-less string keeps its own digits.
 *
 * @param value - Supported input as described by {@link parse}; never mutated.
 * @param format - Token template using yyyy, MM, dd, HH, mm, ss. Other text stays literal;
 *   there is no escaping syntax, localized month name, or millisecond token.
 * @param options - Optional IANA zone; omission uses the host's local zone.
 * @returns Formatted text, or `''` for invalid input/zone/format type.
 * @example toFormat('2024-01-02T03:04:05Z', 'dd/MM/yyyy HH:mm', { timeZone: 'UTC' }); // '02/01/2024 03:04'
 */
export const toFormat = (value: unknown, format: string, options?: TimeZoneOptions): string => {
  if (typeof format !== 'string') return '';
  if (options?.timeZone !== undefined) {
    try {
      return formatFields(format, zonedFields(value, requireZone(options.timeZone)));
    } catch {
      return '';
    }
  }
  let date: Date;
  try {
    date = parseDateInput(value);
  } catch {
    return '';
  }
  return formatFields(format, {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
    millisecond: date.getMilliseconds(),
  });
};

/**
 * Adds elapsed milliseconds to a supported date value.
 *
 * @param value - Input accepted by {@link parse}; zone-less strings use the host-local zone.
 * @param milliseconds - Finite signed elapsed milliseconds; native Date precision is whole milliseconds.
 * @returns A new Date or null for invalid input/delta/result. Inputs are not mutated and DST
 *   does not change the elapsed duration being added.
 * @example addMilliseconds('2024-01-01T00:00:00Z', 1500)?.toISOString(); // '2024-01-01T00:00:01.500Z'
 */
export const addMilliseconds = (value: unknown, milliseconds: number): Date | null => {
  if (!Number.isFinite(milliseconds)) return null;
  try {
    const date = parseDateInput(value);
    date.setTime(date.getTime() + milliseconds);
    return validOrNull(date);
  } catch {
    return null;
  }
};

/**
 * Adds to the local millisecond field using the legacy misspelled API.
 *
 * @deprecated Misspelled compatibility alias. Use {@link addMilliseconds}.
 * Its legacy local-clock setter behavior is unchanged in v1.2. Migrating to
 * `addMilliseconds` intentionally changes results across a DST offset transition
 * because the replacement adds exact elapsed milliseconds.
 *
 * @param value - Supported legacy date value, parsed in the host-local zone when offsetless.
 * @param milliseconds - Finite signed change to the local millisecond field, with native rollover.
 * @returns A new Date or null for invalid input/result; no input mutation.
 * @example addMiliseconds('2024-01-15T10:00:00', 500)?.getMilliseconds(); // 500
 */
export const addMiliseconds = (value: unknown, milliseconds: number): Date | null => {
  if (!Number.isFinite(milliseconds)) return null;
  try {
    const date = parseDateInput(value);
    date.setMilliseconds(date.getMilliseconds() + milliseconds);
    return validOrNull(date);
  } catch {
    return null;
  }
};

/**
 * Adds local calendar days while preserving the local time-of-day.
 *
 * @param value - Supported date value; arithmetic uses the host-local calendar.
 * @param days - Finite signed day delta passed to the native local date setter. Prefer integers;
 *   fractions follow native field truncation rather than adding fractional 24-hour durations.
 * @returns A new Date or null for invalid input/result. DST may change elapsed hours;
 *   an input Date is not mutated.
 * @example toFormat(addDays('2024-02-28', 1), 'yyyy-MM-dd'); // '2024-02-29'
 */
export const addDays = (value: unknown, days: number): Date | null => {
  if (!Number.isFinite(days)) return null;
  try {
    const date = parseDateInput(value);
    date.setDate(date.getDate() + days);
    return validOrNull(date);
  } catch {
    return null;
  }
};

/**
 * Adds positive or negative local clock hours, including fractional hours.
 *
 * The fractional part is rounded to the nearest millisecond. The target local
 * clock is resolved once: DST gaps move forward and overlaps use the earlier
 * offset, following native Date setters. Elapsed time may therefore differ
 * from `hours * 3_600_000`; use {@link addMilliseconds} for a fixed-duration TTL.
 *
 * @param value - A supported date value. An input Date is never mutated.
 * @param hours - Finite local clock hours to add; `0.5` adds thirty local minutes.
 * @returns A new valid Date, or null for invalid input or an out-of-range result.
 * @example
 * addHours('2025-01-15T10:00:00', 0.5); // local 2025-01-15 10:30:00
 * addHours('2025-01-15T10:00:00', -0.5); // local 2025-01-15 09:30:00
 */
export const addHours = (value: unknown, hours: number): Date | null => {
  if (!Number.isFinite(hours)) return null;
  try {
    const date = parseDateInput(value);
    const wholeHours = Math.trunc(hours);
    const fractionalMilliseconds = Math.round((hours - wholeHours) * 3_600_000);
    // A single local setter preserves fractions without resolving DST twice.
    date.setHours(
      date.getHours() + wholeHours,
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds() + fractionalMilliseconds,
    );
    return validOrNull(date);
  } catch {
    return null;
  }
};

/**
 * Adds calendar months, constraining to the last valid target-month day by default.
 *
 * @param value - Supported date value; arithmetic uses the host-local calendar and preserves time-of-day.
 * @param months - Signed safe-integer calendar-month delta; fractional values are rejected.
 * @param options - Overflow policy, default `'constrain'`; see {@link AddMonthsOptions}.
 * @returns A new Date or null for invalid input, unknown policy, rejected overflow, or invalid result.
 *   Inputs are not mutated, and elapsed durations depend on month length and timezone rules.
 * @example toFormat(addMonths('2024-01-31', 1), 'yyyy-MM-dd'); // '2024-02-29'
 */
export const addMonths = (value: unknown, months: number, options: AddMonthsOptions = {}): Date | null => {
  if (!Number.isSafeInteger(months)) return null;
  let date: Date;
  try {
    date = parseDateInput(value);
  } catch {
    return null;
  }
  const overflow = options.overflow ?? 'constrain';
  if (!['constrain', 'balance', 'reject'].includes(overflow)) return null;
  if (overflow === 'balance') {
    date.setMonth(date.getMonth() + months);
    return validOrNull(date);
  }

  const originalDay = date.getDate();
  const absoluteMonth = date.getFullYear() * 12 + date.getMonth() + months;
  const targetYear = Math.floor(absoluteMonth / 12);
  const targetMonthIndex = ((absoluteMonth % 12) + 12) % 12;
  const maximumDay = daysInMonth(targetYear, targetMonthIndex + 1);
  if (overflow === 'reject' && originalDay > maximumDay) return null;
  date.setDate(1);
  date.setFullYear(targetYear, targetMonthIndex, Math.min(originalDay, maximumDay));
  return validOrNull(date);
};

/** Start of the calendar day `value` falls on in the zone; `dayOffset` moves to a following calendar day. */
const zonedDayStart = (value: unknown, timeZone: string, dayOffset: number): number => {
  const formatter = requireZone(timeZone);
  const { year, month, day } = zonedFields(value, formatter);
  return zonedEpoch({ year, month, day: day + dayOffset, hour: 0, minute: 0, second: 0, millisecond: 0 }, formatter);
};

/**
 * Returns local midnight at the beginning of the value's local calendar day. With `options.timeZone` it returns
 * the first instant of that calendar day in the zone (calendar arithmetic, never a fixed 24 hours).
 *
 * @param value - Supported date value whose calendar day is selected.
 * @param options - Optional IANA zone; omitted means host-local midnight.
 * @returns A new Date at the day's resolved start or null for invalid/unresolvable input.
 *   Local parsing rejects a midnight it cannot preserve; explicit-zone gap/overlap resolution
 *   follows {@link fromZonedParts}. The input is unchanged.
 * @example begin('2024-01-02T12:34:56Z', { timeZone: 'UTC' })?.toISOString(); // '2024-01-02T00:00:00.000Z'
 */
export const begin = (value: unknown, options?: TimeZoneOptions): Date | null => {
  try {
    if (options?.timeZone !== undefined) return new Date(zonedDayStart(value, options.timeZone, 0));
    const date = parseDateInput(value);
    return makeLocalDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  } catch {
    return null;
  }
};

/**
 * Returns the final millisecond of the value's local calendar day, or of its calendar day in `options.timeZone`.
 *
 * @param value - Supported date value whose calendar day is selected.
 * @param options - Optional IANA zone; omitted means host-local time.
 * @returns A new Date one millisecond before the next resolved day start, or null when parsing
 *   fails. A calendar day is not necessarily 24 hours. Inputs are not mutated.
 * @example end('2024-01-02', { timeZone: 'UTC' })?.toISOString(); // '2024-01-02T23:59:59.999Z'
 */
export const end = (value: unknown, options?: TimeZoneOptions): Date | null => {
  if (options?.timeZone !== undefined) {
    try {
      return new Date(zonedDayStart(value, options.timeZone, 1) - 1);
    } catch {
      return null;
    }
  }
  const date = begin(value);
  if (!date) return null;
  date.setDate(date.getDate() + 1);
  date.setMilliseconds(-1);
  return date;
};

/**
 * Legacy instant equality; two unsupported values remain equal for compatibility.
 *
 * @param date1 - First legacy date input.
 * @param date2 - Second legacy date input.
 * @returns True for equal epoch milliseconds or when both inputs are unsupported; false if only
 *   one parses. Use explicit validity checks if two invalid values must not compare equal.
 * @example equal(null, undefined); // true (compatibility behavior)
 */
export const equal = (date1: unknown, date2: unknown): boolean => {
  const valid1 = isDate(date1);
  const valid2 = isDate(date2);
  if (!valid1 && !valid2) return true;
  if (!valid1 || !valid2) return false;
  return parseDateInput(date1).getTime() === parseDateInput(date2).getTime();
};

/**
 * Returns fractional elapsed 24-hour periods between two instants.
 *
 * @param date1 - Start input, parsed with the supported legacy date grammar.
 * @param date2 - End input; values before date1 produce a negative result.
 * @returns `(end - start) / 86_400_000`, including fractions; inputs are unchanged.
 * @throws {DateParseError} If either value is invalid.
 * @example elapsedDayDifference('2024-01-01T00:00:00Z', '2024-01-01T12:00:00Z'); // 0.5
 */
export const elapsedDayDifference = (date1: unknown, date2: unknown): number =>
  (parseDateInput(date2).getTime() - parseDateInput(date1).getTime()) / MILLISECONDS_PER_DAY;

/**
 * Returns local calendar-day boundaries crossed, independent of DST elapsed hours.
 *
 * @param date1 - Starting date; its host-local date fields are used.
 * @param date2 - Ending date; time-of-day is discarded after parsing.
 * @returns Signed number of local calendar dates crossed, independent of DST day length.
 * @throws {DateParseError} If either value is invalid.
 * @example calendarDayDifference('2024-01-01T23:00:00', '2024-01-02T01:00:00'); // 1
 */
export const calendarDayDifference = (date1: unknown, date2: unknown): number => {
  const first = parseDateInput(date1);
  const second = parseDateInput(date2);
  const firstDay = utcCalendarEpoch(first);
  const secondDay = utcCalendarEpoch(second);
  return Math.round((secondDay - firstDay) / MILLISECONDS_PER_DAY);
};

/**
 * Returns the legacy floored elapsed-day difference, with null on invalid input.
 *
 * @deprecated The name does not distinguish elapsed time from calendar boundaries.
 * Its legacy elapsed-day flooring behavior is unchanged in v1.2. Use
 * `elapsedDayDifference` or `calendarDayDifference`; negative fractional results may differ.
 *
 * @param date1 - Starting supported date value.
 * @param date2 - Ending supported date value.
 * @returns Floored elapsed 24-hour units, or null for invalid input. Negative fractions floor
 *   toward negative infinity, so a negative half-day returns -1.
 * @example dayDiff('2024-01-02T00:00:00Z', '2024-01-01T12:00:00Z'); // -1
 */
export const dayDiff = (date1: unknown, date2: unknown): number | null => {
  try {
    return Math.floor(elapsedDayDifference(date1, date2));
  } catch {
    return null;
  }
};

/**
 * Legacy calendar-month boundary difference, ignoring day-of-month.
 *
 * @param date1 - Starting supported value, read in the host-local calendar.
 * @param date2 - Ending supported value, read in the host-local calendar.
 * @returns Signed difference of year/month indices, or null for invalid input; this does not
 *   count completed monthly anniversaries or account for days/time-of-day.
 * @example monthDiff('2024-01-31', '2024-02-01'); // 1
 */
export const monthDiff = (date1: unknown, date2: unknown): number | null => {
  try {
    const first = parseDateInput(date1);
    const second = parseDateInput(date2);
    return second.getMonth() + 12 * second.getFullYear() - (first.getMonth() + 12 * first.getFullYear());
  } catch {
    return null;
  }
};

/**
 * Legacy calendar-year boundary difference, ignoring anniversary completion.
 * @deprecated Use {@link completedYearDifference}. The v1.x year-number subtraction
 * and `null`-on-invalid behavior remain unchanged; anniversary-boundary results can differ.
 *
 * @param date1 - Starting supported value, read in the host-local calendar.
 * @param date2 - Ending supported value, read in the host-local calendar.
 * @returns End year minus start year, or null for invalid input; month/day are ignored.
 * @example yearDiff('2023-12-31', '2024-01-01'); // 1
 */
export const yearDiff = (date1: unknown, date2: unknown): number | null => {
  try {
    return parseDateInput(date2).getFullYear() - parseDateInput(date1).getFullYear();
  } catch {
    return null;
  }
};

/**
 * Returns whole anniversaries completed between two local calendar dates.
 * A February 29 anniversary is February 28 in a non-leap year.
 *
 * @param date1 - First supported date value.
 * @param date2 - Second supported value; earlier instants reverse the sign.
 * @returns Signed completed calendar anniversaries, with anniversary comparison at local midnight.
 *   Reversed dates less than one completed year apart may produce negative zero.
 * @throws {DateParseError} If either input or a required local anniversary is invalid.
 * @example completedYearDifference('2020-02-29', '2021-02-28'); // 1
 */
export const completedYearDifference = (date1: unknown, date2: unknown): number => {
  const first = parseDateInput(date1);
  const second = parseDateInput(date2);
  const sign = second.getTime() >= first.getTime() ? 1 : -1;
  const earlier = sign === 1 ? first : second;
  const later = sign === 1 ? second : first;
  let years = later.getFullYear() - earlier.getFullYear();
  const anniversaryDay = Math.min(earlier.getDate(), daysInMonth(later.getFullYear(), earlier.getMonth() + 1));
  const anniversary = makeLocalDate(later.getFullYear(), earlier.getMonth() + 1, anniversaryDay);
  if (later.getTime() < anniversary.getTime()) years--;
  return sign * years;
};

/**
 * Returns the month-based decimal-year difference rounded to 0-100 `digits`.
 *
 * @param date1 - Starting supported value, read in the host-local calendar.
 * @param date2 - Ending supported value, read in the host-local calendar.
 * @param digits - Decimal places, safe integer 0–100; defaults to 2.
 * @returns Calendar-month index difference divided by 12 and rounded; day/time are ignored.
 *   This is not an elapsed-duration or completed-age calculation.
 * @throws {DateParseError} For invalid dates, precision, or calculation results.
 * @example decimalYearDifference('2024-01-31', '2024-07-01'); // 0.5
 */
export const decimalYearDifference = (date1: unknown, date2: unknown, digits = 2): number => {
  if (!Number.isSafeInteger(digits) || digits < 0 || digits > 100) {
    throw new DateParseError('digits must be a safe integer between 0 and 100');
  }
  const months = monthDiff(date1, date2);
  if (months === null) throw new DateParseError('Both dates must be valid');
  const result = NumberUtilities.round(months / 12, digits);
  if (result === null) throw new DateParseError('Decimal year difference could not be calculated');
  return result;
};

/**
 * Returns the completed-year difference for a birth/reference pair and rejects a negative
 * completed-year result. February 29 anniversaries use February 28 in non-leap years.
 * This does not independently enforce timestamp ordering: a reference less than one
 * completed year before birth can yield negative zero. Validate ordering separately if required.
 *
 * @param dateOfBirth - Supported birth date, interpreted in the host-local calendar.
 * @param atDate - Reference date; defaults to the current instant.
 * @returns Completed calendar years using {@link completedYearDifference}.
 * @throws {DateParseError} For invalid input or a result less than zero.
 * @example completedAge('2000-06-15', '2024-06-14'); // 23
 */
export const completedAge = (dateOfBirth: unknown, atDate: unknown = new Date()): number => {
  const result = completedYearDifference(dateOfBirth, atDate);
  if (result < 0) throw new DateParseError('Reference date cannot precede date of birth');
  return result;
};

/**
 * Returns the legacy month-based decimal-year difference rounded to two places.
 *
 * @deprecated The ambiguous legacy decimal month-based behavior is unchanged in v1.2.
 * Use `completedAge` for completed birthdays or `decimalYearDifference` for decimal years;
 * migrating legal/business age checks can change boundary results.
 *
 * @param date1 - Starting supported value.
 * @param date2 - Ending supported value; negative differences are permitted.
 * @returns Month-based decimal years rounded to two places, or null for invalid input.
 * @example age('2024-01-01', '2024-07-01'); // 0.5
 */
export const age = (date1: unknown, date2: unknown): number | null => {
  try {
    return decimalYearDifference(date1, date2);
  } catch {
    return null;
  }
};

/**
 * Legacy format parser, now strict and locale-independent; invalid values return `null`. With `options.timeZone`
 * the parsed fields are a wall clock in that zone, and time-only formats take today's date in the zone.
 *
 * @param value - String or number converted to text and matched against format; a number is not
 *   interpreted as epoch milliseconds. Other runtime types return null.
 * @param format - Fixed-width yyyy/MM/dd/HH/mm/ss tokens with literal separators and no repeats.
 *   Date tokens must appear together; time-only formats use today's date in the selected zone.
 * @param options - Optional IANA timezone; omission uses host-local calendar rules.
 * @returns A new Date or null on invalid input/format/zone. Explicit-zone gaps/overlaps follow
 *   {@link fromZonedParts}; local parsing requires fields to survive native normalization.
 * @example parseFrom('31/12/2024', 'dd/MM/yyyy', { timeZone: 'UTC' })?.toISOString(); // '2024-12-31T00:00:00.000Z'
 */
export const parseFrom = (value: unknown, format: string, options?: TimeZoneOptions): Date | null => {
  if ((typeof value !== 'string' && typeof value !== 'number') || !format) return null;
  try {
    if (options?.timeZone === undefined) return parseByFormat(String(value), format, true);
    const formatter = requireZone(options.timeZone);
    const fields = parseFormatFields(String(value), format, true, () => partsAt(Date.now(), formatter));
    return new Date(zonedEpoch(fields, formatter));
  } catch {
    return null;
  }
};

const relativeUnit = (milliseconds: number): { amount: number; unit: string } => {
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;
  if (milliseconds < minute) return { amount: Math.round(milliseconds / 1000), unit: 'second' };
  if (milliseconds < hour) return { amount: Math.round(milliseconds / minute), unit: 'minute' };
  if (milliseconds < day) return { amount: Math.round(milliseconds / hour), unit: 'hour' };
  if (milliseconds < month) return { amount: Math.round(milliseconds / day), unit: 'day' };
  if (milliseconds < year) return { amount: Math.round(milliseconds / month), unit: 'month' };
  return { amount: Math.round(milliseconds / year), unit: 'year' };
};

/**
 * Returns approximate human-readable relative time using 30-day months and 365-day years.
 *
 * @param previous - Date being described relative to current; may also be in the future.
 * @param current - Reference instant, default `new Date()`.
 * @returns Rounded English text such as `'2 hours ago'` or `'in 2 hours'`; invalid inputs yield `''`.
 *   Uses fixed 24-hour days, 30-day months, and 365-day years, not calendar arithmetic or localization.
 * @example timeDifference('2024-01-01T00:00:00Z', '2024-01-01T02:00:00Z'); // '2 hours ago'
 */
export const timeDifference = (previous: unknown, current: unknown = new Date()): string => {
  let elapsed: number;
  try {
    elapsed = parseDateInput(current).getTime() - parseDateInput(previous).getTime();
  } catch {
    return '';
  }
  const { amount, unit } = relativeUnit(Math.abs(elapsed));
  const label = amount === 1 ? unit : `${unit}s`;
  return elapsed >= 0 ? `${amount} ${label} ago` : `in ${amount} ${label}`;
};

/**
 * Date parsing, calendar arithmetic, elapsed-time, and formatting utilities.
 *
 * All helpers return new values and leave input Dates unchanged. Read each method's
 * invalid-input contract: strict APIs throw, while compatibility APIs often return null or empty text.
 *
 * @example
 * import { DateUtilities } from '@sdcorejs/utils/fns';
 * DateUtilities.toFormat('2024-01-02', 'dd/MM/yyyy'); // '02/01/2024'
 */
export const DateUtilities = {
  /**
   * Legacy instant equality; two unsupported values remain equal for compatibility.
   *
   * @param date1 - First legacy date input.
   * @param date2 - Second legacy date input.
   * @returns True for equal epoch milliseconds or when both inputs are unsupported; false if only
   *   one parses. Use explicit validity checks if two invalid values must not compare equal.
   * @example equal(null, undefined); // true (compatibility behavior)
   */
  equal,
  /**
   * Returns the legacy floored elapsed-day difference, with null on invalid input.
   *
   * @deprecated The name does not distinguish elapsed time from calendar boundaries.
   * Its legacy elapsed-day flooring behavior is unchanged in v1.2. Use
   * `elapsedDayDifference` or `calendarDayDifference`; negative fractional results may differ.
   *
   * @param date1 - Starting supported date value.
   * @param date2 - Ending supported date value.
   * @returns Floored elapsed 24-hour units, or null for invalid input. Negative fractions floor
   *   toward negative infinity, so a negative half-day returns -1.
   * @example dayDiff('2024-01-02T00:00:00Z', '2024-01-01T12:00:00Z'); // -1
   */
  dayDiff,
  /**
   * Returns local calendar-day boundaries crossed, independent of DST elapsed hours.
   *
   * @param date1 - Starting date; its host-local date fields are used.
   * @param date2 - Ending date; time-of-day is discarded after parsing.
   * @returns Signed number of local calendar dates crossed, independent of DST day length.
   * @throws {DateParseError} If either value is invalid.
   * @example calendarDayDifference('2024-01-01T23:00:00', '2024-01-02T01:00:00'); // 1
   */
  calendarDayDifference,
  /**
   * Returns fractional elapsed 24-hour periods between two instants.
   *
   * @param date1 - Start input, parsed with the supported legacy date grammar.
   * @param date2 - End input; values before date1 produce a negative result.
   * @returns `(end - start) / 86_400_000`, including fractions; inputs are unchanged.
   * @throws {DateParseError} If either value is invalid.
   * @example elapsedDayDifference('2024-01-01T00:00:00Z', '2024-01-01T12:00:00Z'); // 0.5
   */
  elapsedDayDifference,
  /**
   * Legacy calendar-month boundary difference, ignoring day-of-month.
   *
   * @param date1 - Starting supported value, read in the host-local calendar.
   * @param date2 - Ending supported value, read in the host-local calendar.
   * @returns Signed difference of year/month indices, or null for invalid input; this does not
   *   count completed monthly anniversaries or account for days/time-of-day.
   * @example monthDiff('2024-01-31', '2024-02-01'); // 1
   */
  monthDiff,
  /**
   * Legacy calendar-year boundary difference, ignoring anniversary completion.
   * @deprecated Use {@link completedYearDifference}. The v1.x year-number subtraction
   * and `null`-on-invalid behavior remain unchanged; anniversary-boundary results can differ.
   *
   * @param date1 - Starting supported value, read in the host-local calendar.
   * @param date2 - Ending supported value, read in the host-local calendar.
   * @returns End year minus start year, or null for invalid input; month/day are ignored.
   * @example yearDiff('2023-12-31', '2024-01-01'); // 1
   */
  yearDiff,
  /**
   * Returns whole anniversaries completed between two local calendar dates.
   * A February 29 anniversary is February 28 in a non-leap year.
   *
   * @param date1 - First supported date value.
   * @param date2 - Second supported value; earlier instants reverse the sign.
   * @returns Signed completed calendar anniversaries, with anniversary comparison at local midnight.
   *   Reversed dates less than one completed year apart may produce negative zero.
   * @throws {DateParseError} If either input or a required local anniversary is invalid.
   * @example completedYearDifference('2020-02-29', '2021-02-28'); // 1
   */
  completedYearDifference,
  /**
   * Returns the month-based decimal-year difference rounded to 0-100 `digits`.
   *
   * @param date1 - Starting supported value, read in the host-local calendar.
   * @param date2 - Ending supported value, read in the host-local calendar.
   * @param digits - Decimal places, safe integer 0–100; defaults to 2.
   * @returns Calendar-month index difference divided by 12 and rounded; day/time are ignored.
   *   This is not an elapsed-duration or completed-age calculation.
   * @throws {DateParseError} For invalid dates, precision, or calculation results.
   * @example decimalYearDifference('2024-01-31', '2024-07-01'); // 0.5
   */
  decimalYearDifference,
  /**
   * Returns the legacy month-based decimal-year difference rounded to two places.
   *
   * @deprecated The ambiguous legacy decimal month-based behavior is unchanged in v1.2.
   * Use `completedAge` for completed birthdays or `decimalYearDifference` for decimal years;
   * migrating legal/business age checks can change boundary results.
   *
   * @param date1 - Starting supported value.
   * @param date2 - Ending supported value; negative differences are permitted.
   * @returns Month-based decimal years rounded to two places, or null for invalid input.
   * @example age('2024-01-01', '2024-07-01'); // 0.5
   */
  age,
  /**
   * Returns the completed-year difference for a birth/reference pair and rejects a negative
   * completed-year result. February 29 anniversaries use February 28 in non-leap years.
   * This does not independently enforce timestamp ordering: a reference less than one
   * completed year before birth can yield negative zero. Validate ordering separately if required.
   *
   * @param dateOfBirth - Supported birth date, interpreted in the host-local calendar.
   * @param atDate - Reference date; defaults to the current instant.
   * @returns Completed calendar years using {@link completedYearDifference}.
   * @throws {DateParseError} For invalid input or a result less than zero.
   * @example completedAge('2000-06-15', '2024-06-14'); // 23
   */
  completedAge,
  /**
   * Legacy format parser, now strict and locale-independent; invalid values return `null`. With `options.timeZone`
   * the parsed fields are a wall clock in that zone, and time-only formats take today's date in the zone.
   *
   * @param value - String or number converted to text and matched against format; a number is not
   *   interpreted as epoch milliseconds. Other runtime types return null.
   * @param format - Fixed-width yyyy/MM/dd/HH/mm/ss tokens with literal separators and no repeats.
   *   Date tokens must appear together; time-only formats use today's date in the selected zone.
   * @param options - Optional IANA timezone; omission uses host-local calendar rules.
   * @returns A new Date or null on invalid input/format/zone. Explicit-zone gaps/overlaps follow
   *   {@link fromZonedParts}; local parsing requires fields to survive native normalization.
   * @example parseFrom('31/12/2024', 'dd/MM/yyyy', { timeZone: 'UTC' })?.toISOString(); // '2024-12-31T00:00:00.000Z'
   */
  parseFrom,
  /**
   * Lenient parser for every input `isDate` accepts; `null` instead of throwing. Zone-less strings are read in `options.timeZone`.
   *
   * @param value - Valid Date, epoch milliseconds, ISO instant, or supported year-first/month-first
   *   date/time text with `-` or `/` separators. Legacy instants allow 1–9 fractional digits
   *   (truncated to milliseconds) and colon-less offsets. No arbitrary object coercion occurs.
   * @param options - Optional IANA zone for zone-less text; omission uses the host-local zone.
   * @returns A new Date, or null when parsing fails; input Date instances are not mutated.
   * @example parse('2024-01-01', { timeZone: 'UTC' })?.toISOString(); // '2024-01-01T00:00:00.000Z'
   */
  parse,
  /**
   * Returns whether `value` is an IANA time zone id this runtime supports; numeric offsets and `local` are rejected.
   *
   * @param value - Candidate IANA identifier, such as `UTC` or `Asia/Ho_Chi_Minh`.
   * @returns Whether this runtime's Intl.DateTimeFormat accepts the zone under the library's
   *   identifier policy. Available names/history depend on runtime timezone data.
   * @example isValidTimeZone('Asia/Ho_Chi_Minh'); // true in runtimes with this zone.
   */
  isValidTimeZone,
  /**
   * Wall-clock fields of a supported value in `timeZone`; zone-less strings keep their own fields. `null` when invalid.
   *
   * @param value - A value accepted by {@link parse}. Instants are converted to the zone;
   *   zone-less strings retain their calendar fields rather than being interpreted in the host zone first.
   * @param timeZone - Supported IANA zone; numeric offset identifiers are rejected.
   * @returns A new parts object, or null for invalid input/zone; does not mutate the input.
   * @example toZonedParts('2024-01-01T00:00:00Z', 'Asia/Ho_Chi_Minh')?.hour; // 7
   */
  toZonedParts,
  /**
   * Instant of a wall clock in `timeZone`. Time fields default to 0 and out-of-range fields roll over
   * like `Date.UTC`. A repeated wall clock takes the earlier offset; a skipped one moves forward.
   * Throws `DateParseError` for an unsupported zone or non-integer fields.
   *
   * @param parts - Integer wall-clock fields; year/month/day are required and time fields default to zero.
   *   Out-of-range integer fields are balanced, not strictly rejected as calendar dates.
   * @param timeZone - Supported IANA zone whose rules resolve the wall clock.
   * @returns A new Date instant. DST overlaps choose the earlier instant; gaps move forward.
   * @throws {DateParseError} For invalid fields/zone or a result outside the Date range.
   * @example fromZonedParts({ year: 2024, month: 1, day: 1 }, 'UTC').toISOString(); // '2024-01-01T00:00:00.000Z'
   */
  fromZonedParts,
  /**
   * Strictly parses a plain calendar date at local midnight without a UTC date shift.
   *
   * @param value - String matching the exact format; no trimming or coercion is performed.
   * @param format - Defaults to `yyyy-MM-dd`. Requires yyyy, MM, dd exactly once, fixed-width
   *   digits, and literal separators. Time tokens are rejected.
   * @returns A new Date at host-local midnight; does not represent UTC midnight unless the host uses UTC.
   * @throws {DateParseError} For invalid type, syntax, format, impossible date, or unrepresentable local midnight.
   * @example parseLocalDateStrict('2024-02-29').getDate(); // 29
   */
  parseLocalDateStrict,
  /**
   * Strictly parses a local date-time with no timezone conversion.
   *
   * @param value - Exact local date/time string with no timezone suffix or automatic trimming.
   * @param format - Defaults to `yyyy-MM-ddTHH:mm:ss`; supported tokens are yyyy, MM, dd,
   *   HH, mm, ss, each at most once. A complete date is required; omitted time fields become zero.
   * @returns A new Date interpreted in the host's local timezone.
   * @throws {DateParseError} For invalid syntax/calendar/time, duplicate tokens, or a DST gap
   *   that cannot preserve the requested local fields. Native overlap resolution chooses the earlier instant.
   * @example parseLocalDateTimeStrict('2024-01-15T10:30:00').getHours(); // 10
   */
  parseLocalDateTimeStrict,
  /**
   * Strictly parses an epoch-millisecond value, `Date`, or millisecond-precision ISO instant carrying `Z`/an offset.
   *
   * @param value - Valid Date, finite epoch milliseconds, or ISO text with a four-digit date,
   *   `T`, hours/minutes, optional seconds and 1–3 fraction digits, and required `Z` or `±HH:mm`.
   *   Zone-less/date-only strings, arbitrary objects, and impossible fields are rejected.
   * @returns A new Date representing the instant; an input Date is cloned, never mutated.
   * @throws {DateParseError} For unsupported input, invalid syntax/fields, or an out-of-range instant.
   * @example parseInstant('2024-01-01T07:00:00+07:00').toISOString(); // '2024-01-01T00:00:00.000Z'
   */
  parseInstant,
  /**
   * Legacy broad date guard, now rejecting coercible objects and impossible calendar values.
   *
   * @param value - Candidate in the legacy input domain described by {@link parse}.
   * @returns Whether host-local parsing succeeds; this is not an `instanceof Date` type guard.
   * @example isDate('2024-01-01'); // true
   * @example isDate({ valueOf: () => 0 }); // false
   */
  isDate,
  /**
   * Returns whether `value` is a valid plain calendar date in `format`.
   *
   * @param value - Candidate local date string; no coercion.
   * @param format - Exact format, default `yyyy-MM-dd`; uses {@link parseLocalDateStrict}.
   * @returns Whether strict local parsing succeeds; parse errors become false.
   * @example isValidLocalDate('2023-02-29'); // false
   */
  isValidLocalDate,
  /**
   * Returns whether `value` is a valid instant with explicit timezone semantics.
   *
   * @param value - Candidate Date, epoch milliseconds, or ISO string with explicit offset.
   * @returns Whether {@link parseInstant} succeeds; date-only and zone-less strings return false.
   * @example isValidInstant('2024-01-01T00:00:00Z'); // true
   */
  isValidInstant,
  /**
   * Formats a supported date value; every token occurrence is replaced. Without `options.timeZone` it uses
   * the local timezone. With it, an instant shows the zone's wall clock and a zone-less string keeps its own digits.
   *
   * @param value - Supported input as described by {@link parse}; never mutated.
   * @param format - Token template using yyyy, MM, dd, HH, mm, ss. Other text stays literal;
   *   there is no escaping syntax, localized month name, or millisecond token.
   * @param options - Optional IANA zone; omission uses the host's local zone.
   * @returns Formatted text, or `''` for invalid input/zone/format type.
   * @example toFormat('2024-01-02T03:04:05Z', 'dd/MM/yyyy HH:mm', { timeZone: 'UTC' }); // '02/01/2024 03:04'
   */
  toFormat,
  /**
   * Adds elapsed milliseconds to a supported date value.
   *
   * @param value - Input accepted by {@link parse}; zone-less strings use the host-local zone.
   * @param milliseconds - Finite signed elapsed milliseconds; native Date precision is whole milliseconds.
   * @returns A new Date or null for invalid input/delta/result. Inputs are not mutated and DST
   *   does not change the elapsed duration being added.
   * @example addMilliseconds('2024-01-01T00:00:00Z', 1500)?.toISOString(); // '2024-01-01T00:00:01.500Z'
   */
  addMilliseconds,
  /**
   * Adds to the local millisecond field using the legacy misspelled API.
   *
   * @deprecated Misspelled compatibility alias. Use {@link addMilliseconds}.
   * Its legacy local-clock setter behavior is unchanged in v1.2. Migrating to
   * `addMilliseconds` intentionally changes results across a DST offset transition
   * because the replacement adds exact elapsed milliseconds.
   *
   * @param value - Supported legacy date value, parsed in the host-local zone when offsetless.
   * @param milliseconds - Finite signed change to the local millisecond field, with native rollover.
   * @returns A new Date or null for invalid input/result; no input mutation.
   * @example addMiliseconds('2024-01-15T10:00:00', 500)?.getMilliseconds(); // 500
   */
  addMiliseconds,
  /**
   * Adds positive or negative local clock hours, including fractional hours.
   *
   * The fractional part is rounded to the nearest millisecond. The target local
   * clock is resolved once: DST gaps move forward and overlaps use the earlier
   * offset, following native Date setters. Elapsed time may therefore differ
   * from `hours * 3_600_000`; use {@link addMilliseconds} for a fixed-duration TTL.
   *
   * @param value - A supported date value. An input Date is never mutated.
   * @param hours - Finite local clock hours to add; `0.5` adds thirty local minutes.
   * @returns A new valid Date, or null for invalid input or an out-of-range result.
   * @example
   * addHours('2025-01-15T10:00:00', 0.5); // local 2025-01-15 10:30:00
   * addHours('2025-01-15T10:00:00', -0.5); // local 2025-01-15 09:30:00
   */
  addHours,
  /**
   * Adds local calendar days while preserving the local time-of-day.
   *
   * @param value - Supported date value; arithmetic uses the host-local calendar.
   * @param days - Finite signed day delta passed to the native local date setter. Prefer integers;
   *   fractions follow native field truncation rather than adding fractional 24-hour durations.
   * @returns A new Date or null for invalid input/result. DST may change elapsed hours;
   *   an input Date is not mutated.
   * @example toFormat(addDays('2024-02-28', 1), 'yyyy-MM-dd'); // '2024-02-29'
   */
  addDays,
  /**
   * Adds calendar months, constraining to the last valid target-month day by default.
   *
   * @param value - Supported date value; arithmetic uses the host-local calendar and preserves time-of-day.
   * @param months - Signed safe-integer calendar-month delta; fractional values are rejected.
   * @param options - Overflow policy, default `'constrain'`; see {@link AddMonthsOptions}.
   * @returns A new Date or null for invalid input, unknown policy, rejected overflow, or invalid result.
   *   Inputs are not mutated, and elapsed durations depend on month length and timezone rules.
   * @example toFormat(addMonths('2024-01-31', 1), 'yyyy-MM-dd'); // '2024-02-29'
   */
  addMonths,
  /**
   * Returns local midnight at the beginning of the value's local calendar day. With `options.timeZone` it returns
   * the first instant of that calendar day in the zone (calendar arithmetic, never a fixed 24 hours).
   *
   * @param value - Supported date value whose calendar day is selected.
   * @param options - Optional IANA zone; omitted means host-local midnight.
   * @returns A new Date at the day's resolved start or null for invalid/unresolvable input.
   *   Local parsing rejects a midnight it cannot preserve; explicit-zone gap/overlap resolution
   *   follows {@link fromZonedParts}. The input is unchanged.
   * @example begin('2024-01-02T12:34:56Z', { timeZone: 'UTC' })?.toISOString(); // '2024-01-02T00:00:00.000Z'
   */
  begin,
  /**
   * Returns the final millisecond of the value's local calendar day, or of its calendar day in `options.timeZone`.
   *
   * @param value - Supported date value whose calendar day is selected.
   * @param options - Optional IANA zone; omitted means host-local time.
   * @returns A new Date one millisecond before the next resolved day start, or null when parsing
   *   fails. A calendar day is not necessarily 24 hours. Inputs are not mutated.
   * @example end('2024-01-02', { timeZone: 'UTC' })?.toISOString(); // '2024-01-02T23:59:59.999Z'
   */
  end,
  /**
   * Returns approximate human-readable relative time using 30-day months and 365-day years.
   *
   * @param previous - Date being described relative to current; may also be in the future.
   * @param current - Reference instant, default `new Date()`.
   * @returns Rounded English text such as `'2 hours ago'` or `'in 2 hours'`; invalid inputs yield `''`.
   *   Uses fixed 24-hour days, 30-day months, and 365-day years, not calendar arithmetic or localization.
   * @example timeDifference('2024-01-01T00:00:00Z', '2024-01-01T02:00:00Z'); // '2 hours ago'
   */
  timeDifference,
};
