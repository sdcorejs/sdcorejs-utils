import { afterEach, describe, expect, it, vi } from 'vitest';
import { DateUtilities } from './date.fns';

// Results here must not depend on the host time zone: CI runs in UTC, developers in Asia/Bangkok.
// Asia/Ho_Chi_Minh was +08 from 1959-12-31 23:00 to 1975-06-13 00:00 (local), +07 before and after.
const VN = 'Asia/Ho_Chi_Minh';
const BKK = 'Asia/Bangkok';
const iso = (value: Date | null): string | null => value?.toISOString() ?? null;

describe('DateUtilities.isValidTimeZone', () => {
  it.each(['Asia/Ho_Chi_Minh', 'Asia/Bangkok', 'UTC', 'Etc/GMT-7', 'America/New_York'])('accepts the IANA id %s', zone => {
    expect(DateUtilities.isValidTimeZone(zone)).toBe(true);
  });

  it.each(['+07:00', '-03:30', 'GMT+7', 'UTC+07:00', 'Mars/Base', 'local', '', ' Asia/Bangkok'])('rejects %j', zone => {
    expect(DateUtilities.isValidTimeZone(zone)).toBe(false);
  });

  it.each([null, undefined, 7, {}, new Date()])('rejects the non-string %j', zone => {
    expect(DateUtilities.isValidTimeZone(zone)).toBe(false);
  });
});

describe('DateUtilities.toFormat with a time zone', () => {
  it('shows an instant as the wall clock of the zone', () => {
    expect(DateUtilities.toFormat('1960-05-19T16:00:00Z', 'dd/MM/yyyy HH:mm', { timeZone: VN })).toBe('20/05/1960 00:00');
    expect(DateUtilities.toFormat('1960-05-19T16:00:00Z', 'dd/MM/yyyy HH:mm', { timeZone: BKK })).toBe('19/05/1960 23:00');
    expect(DateUtilities.toFormat('2026-08-14T17:00:00Z', 'yyyy/MM/dd HH:mm:ss', { timeZone: VN })).toBe('2026/08/15 00:00:00');
  });

  it('shows Date objects and epoch numbers as instants', () => {
    const instant = Date.UTC(1960, 4, 20, 0, 0, 0);
    expect(DateUtilities.toFormat(instant, 'dd/MM/yyyy HH:mm', { timeZone: VN })).toBe('20/05/1960 08:00');
    expect(DateUtilities.toFormat(new Date(instant), 'dd/MM/yyyy HH:mm', { timeZone: BKK })).toBe('20/05/1960 07:00');
  });

  it('keeps the digits of zone-less and date-only strings', () => {
    for (const timeZone of [VN, BKK, 'UTC', 'America/New_York']) {
      expect(DateUtilities.toFormat('1960/05/20', 'dd/MM/yyyy', { timeZone })).toBe('20/05/1960');
      expect(DateUtilities.toFormat('1960-05-20', 'dd/MM/yyyy', { timeZone })).toBe('20/05/1960');
      expect(DateUtilities.toFormat('1960/05/20 08:00:00', 'dd/MM/yyyy HH:mm:ss', { timeZone })).toBe('20/05/1960 08:00:00');
      expect(DateUtilities.toFormat('1960-05-20T08:30', 'yyyy-MM-dd HH:mm', { timeZone })).toBe('1960-05-20 08:30');
    }
  });

  it('keeps the digits of a wall clock that does not exist in the zone', () => {
    // 23:00-24:00 of 1959-12-31 was skipped in Asia/Ho_Chi_Minh.
    expect(DateUtilities.toFormat('1959/12/31 23:30:00', 'yyyy/MM/dd HH:mm:ss', { timeZone: VN })).toBe('1959/12/31 23:30:00');
  });

  it('returns an empty string for an invalid zone or value', () => {
    expect(DateUtilities.toFormat('1960-05-19T16:00:00Z', 'dd/MM/yyyy', { timeZone: 'Mars/Base' })).toBe('');
    expect(DateUtilities.toFormat('1960-05-19T16:00:00Z', 'dd/MM/yyyy', { timeZone: '+07:00' })).toBe('');
    expect(DateUtilities.toFormat('not a date', 'dd/MM/yyyy', { timeZone: VN })).toBe('');
  });
});

describe('DateUtilities.fromZonedParts', () => {
  it('maps a wall clock in the zone to an instant', () => {
    expect(iso(DateUtilities.fromZonedParts({ year: 1960, month: 5, day: 20 }, VN))).toBe('1960-05-19T16:00:00.000Z');
    expect(iso(DateUtilities.fromZonedParts({ year: 1960, month: 5, day: 20 }, BKK))).toBe('1960-05-19T17:00:00.000Z');
    expect(iso(DateUtilities.fromZonedParts({ year: 2026, month: 8, day: 15 }, VN))).toBe('2026-08-14T17:00:00.000Z');
    expect(iso(DateUtilities.fromZonedParts({ year: 1960, month: 5, day: 20, hour: 8, minute: 0, second: 0, millisecond: 250 }, VN))).toBe('1960-05-20T00:00:00.250Z');
  });

  it('normalizes out-of-range fields like Date.UTC', () => {
    expect(iso(DateUtilities.fromZonedParts({ year: 1960, month: 5, day: 32 }, VN))).toBe('1960-05-31T16:00:00.000Z');
    expect(iso(DateUtilities.fromZonedParts({ year: 1960, month: 13, day: 1 }, VN))).toBe('1960-12-31T16:00:00.000Z');
    expect(iso(DateUtilities.fromZonedParts({ year: 1960, month: 5, day: 20, hour: 24 }, VN))).toBe('1960-05-20T16:00:00.000Z');
  });

  it('resolves a repeated wall clock to the earlier offset', () => {
    // 23:00-24:00 of 1975-06-12 happened twice (+08, then +07).
    expect(iso(DateUtilities.fromZonedParts({ year: 1975, month: 6, day: 12, hour: 23, minute: 30 }, VN))).toBe('1975-06-12T15:30:00.000Z');
  });

  it('moves a skipped wall clock forward', () => {
    expect(iso(DateUtilities.fromZonedParts({ year: 1959, month: 12, day: 31, hour: 23, minute: 30 }, VN))).toBe('1959-12-31T16:30:00.000Z');
  });

  it('throws for an invalid zone', () => {
    expect(() => DateUtilities.fromZonedParts({ year: 1960, month: 5, day: 20 }, 'Mars/Base')).toThrow();
    expect(() => DateUtilities.fromZonedParts({ year: 1960, month: 5, day: 20 }, '+07:00')).toThrow();
  });
});

describe('DateUtilities.toZonedParts', () => {
  it('returns the wall clock of an instant in the zone', () => {
    expect(DateUtilities.toZonedParts('1960-05-19T16:00:00.250Z', VN)).toEqual({ year: 1960, month: 5, day: 20, hour: 0, minute: 0, second: 0, millisecond: 250 });
    expect(DateUtilities.toZonedParts('1960-05-19T16:00:00Z', BKK)).toEqual({ year: 1960, month: 5, day: 19, hour: 23, minute: 0, second: 0, millisecond: 0 });
  });

  it('returns the own fields of zone-less strings', () => {
    expect(DateUtilities.toZonedParts('1960/05/20 08:00:00', VN)).toEqual({ year: 1960, month: 5, day: 20, hour: 8, minute: 0, second: 0, millisecond: 0 });
    expect(DateUtilities.toZonedParts('1960-05-20', BKK)).toEqual({ year: 1960, month: 5, day: 20, hour: 0, minute: 0, second: 0, millisecond: 0 });
  });

  it('round-trips with fromZonedParts', () => {
    const cases = [
      { year: 1960, month: 5, day: 20, hour: 8, minute: 15, second: 30, millisecond: 5 },
      { year: 1975, month: 6, day: 12, hour: 22, minute: 59, second: 59, millisecond: 999 },
      { year: 1975, month: 6, day: 13, hour: 0, minute: 0, second: 0, millisecond: 0 },
      { year: 2026, month: 8, day: 15, hour: 0, minute: 30, second: 0, millisecond: 0 },
    ];
    for (const parts of cases) {
      expect(DateUtilities.toZonedParts(DateUtilities.fromZonedParts(parts, VN), VN)).toEqual(parts);
    }
  });

  it('returns null for an invalid zone or value', () => {
    expect(DateUtilities.toZonedParts('1960-05-19T16:00:00Z', 'Mars/Base')).toBeNull();
    expect(DateUtilities.toZonedParts('nope', VN)).toBeNull();
  });
});

describe('DateUtilities.begin / end with a time zone', () => {
  it('returns the calendar day bounds in the zone', () => {
    expect(iso(DateUtilities.begin('1960/05/20', { timeZone: VN }))).toBe('1960-05-19T16:00:00.000Z');
    expect(iso(DateUtilities.end('1960/05/20', { timeZone: VN }))).toBe('1960-05-20T15:59:59.999Z');
    expect(iso(DateUtilities.begin('1960-05-19T16:30:00Z', { timeZone: VN }))).toBe('1960-05-19T16:00:00.000Z');
    expect(iso(DateUtilities.begin('1960-05-19T16:30:00Z', { timeZone: BKK }))).toBe('1960-05-18T17:00:00.000Z');
  });

  it('uses calendar arithmetic across an offset change (25-hour day)', () => {
    expect(iso(DateUtilities.begin('1975/06/12', { timeZone: VN }))).toBe('1975-06-11T16:00:00.000Z');
    expect(iso(DateUtilities.end('1975/06/12', { timeZone: VN }))).toBe('1975-06-12T16:59:59.999Z');
  });

  it('starts a day whose midnight was skipped at its first instant', () => {
    expect(iso(DateUtilities.begin('1960/01/01', { timeZone: VN }))).toBe('1959-12-31T16:00:00.000Z');
  });

  it('returns null for an invalid zone or value', () => {
    expect(DateUtilities.begin('1960/05/20', { timeZone: 'Mars/Base' })).toBeNull();
    expect(DateUtilities.end('nope', { timeZone: VN })).toBeNull();
  });
});

describe('DateUtilities.parse', () => {
  it('reads zone-less strings as wall clock in the zone', () => {
    expect(iso(DateUtilities.parse('1960/05/20 08:00:00', { timeZone: VN }))).toBe('1960-05-20T00:00:00.000Z');
    expect(iso(DateUtilities.parse('1960/05/20', { timeZone: VN }))).toBe('1960-05-19T16:00:00.000Z');
    expect(iso(DateUtilities.parse('1960-05-20T08:00', { timeZone: BKK }))).toBe('1960-05-20T01:00:00.000Z');
  });

  it('keeps instants unchanged', () => {
    expect(iso(DateUtilities.parse('1960-05-19T16:00:00Z', { timeZone: BKK }))).toBe('1960-05-19T16:00:00.000Z');
    expect(iso(DateUtilities.parse('1960-05-20T00:00:00+08:00', { timeZone: VN }))).toBe('1960-05-19T16:00:00.000Z');
    expect(iso(DateUtilities.parse(Date.UTC(1960, 4, 20), { timeZone: VN }))).toBe('1960-05-20T00:00:00.000Z');
  });

  it('returns null instead of throwing', () => {
    expect(DateUtilities.parse('abc')).toBeNull();
    expect(DateUtilities.parse('abc', { timeZone: VN })).toBeNull();
    expect(DateUtilities.parse('1960/05/20', { timeZone: 'Mars/Base' })).toBeNull();
    expect(DateUtilities.parse(null)).toBeNull();
  });

  it('without a zone returns the local (1.2.6) reading of every input isDate accepts', () => {
    expect(DateUtilities.parse('2025-01-15')?.getTime()).toBe(new Date(2025, 0, 15).getTime());
    expect(DateUtilities.parse('2025/01/15 10:30:00')?.getTime()).toBe(new Date(2025, 0, 15, 10, 30).getTime());
    expect(iso(DateUtilities.parse('2025-01-15T03:20:30+0700'))).toBe('2025-01-14T20:20:30.000Z');
    expect(iso(DateUtilities.parse('2025-01-15T03:20:30.123456Z'))).toBe('2025-01-15T03:20:30.123Z');
    expect(DateUtilities.parse(Date.UTC(2025, 0, 15))?.getTime()).toBe(Date.UTC(2025, 0, 15));
  });
});

describe('DateUtilities.parseFrom with a time zone', () => {
  afterEach(() => vi.useRealTimers());

  it('reads the parsed fields as wall clock in the zone', () => {
    expect(iso(DateUtilities.parseFrom('20/05/1960', 'dd/MM/yyyy', { timeZone: VN }))).toBe('1960-05-19T16:00:00.000Z');
    expect(iso(DateUtilities.parseFrom('20/05/1960 08:00', 'dd/MM/yyyy HH:mm', { timeZone: BKK }))).toBe('1960-05-20T01:00:00.000Z');
  });

  it('takes today in the zone for time-only formats', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-14T17:30:00Z'));
    expect(iso(DateUtilities.parseFrom('08:00', 'HH:mm', { timeZone: VN }))).toBe('2026-08-15T01:00:00.000Z');
    expect(iso(DateUtilities.parseFrom('08:00', 'HH:mm', { timeZone: 'UTC' }))).toBe('2026-08-14T08:00:00.000Z');
  });

  it('returns null for an invalid zone or value', () => {
    expect(DateUtilities.parseFrom('20/05/1960', 'dd/MM/yyyy', { timeZone: 'Mars/Base' })).toBeNull();
    expect(DateUtilities.parseFrom('31/02/1960', 'dd/MM/yyyy', { timeZone: VN })).toBeNull();
  });
});

describe('time-zone options are opt-in and stateless', () => {
  const values = ['1960-05-19T16:00:00Z', '1960/05/20', '1960/05/20 08:00:00', Date.UTC(1960, 4, 20)];

  it('without timeZone every function returns the local (1.2.6) result', () => {
    for (const value of values) {
      for (const options of [undefined, {}, { timeZone: undefined }]) {
        expect(DateUtilities.toFormat(value, 'yyyy/MM/dd HH:mm:ss', options)).toBe(DateUtilities.toFormat(value, 'yyyy/MM/dd HH:mm:ss'));
        expect(iso(DateUtilities.begin(value, options))).toBe(iso(DateUtilities.begin(value)));
        expect(iso(DateUtilities.end(value, options))).toBe(iso(DateUtilities.end(value)));
      }
    }
    expect(iso(DateUtilities.parseFrom('20/05/1960', 'dd/MM/yyyy', {}))).toBe(iso(DateUtilities.parseFrom('20/05/1960', 'dd/MM/yyyy')));
  });

  it('gives independent results for alternating zones', () => {
    const results = [VN, BKK, VN, 'UTC', BKK, VN].map(timeZone => DateUtilities.toFormat('1960-05-19T16:00:00Z', 'dd/MM HH:mm', { timeZone }));
    expect(results).toEqual(['20/05 00:00', '19/05 23:00', '20/05 00:00', '19/05 16:00', '19/05 23:00', '20/05 00:00']);
  });
});
