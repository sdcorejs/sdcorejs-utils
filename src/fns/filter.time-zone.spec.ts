import { describe, expect, it } from 'vitest';
import { DateUtilities } from './date.fns';
import { FilterUtilities } from './filter.fns';
import type { Filter } from '../models/filter.model';

// Results must not depend on the host time zone. "now" is 2026-08-15 00:30 in Asia/Ho_Chi_Minh
// and still 2026-08-14 in UTC.
const VN = 'Asia/Ho_Chi_Minh';
const now = new Date('2026-08-14T17:30:00Z');
const today: Filter = { field: 'day', operator: 'GREATER_OR_EQUAL', dataType: 'date-today', data: 'TODAY' };

describe('FilterUtilities with MatchOptions.timeZone', () => {
  it('resolves date-today to the start of today in the zone', () => {
    expect(FilterUtilities.evaluate(today, { day: '2026/08/15' }, { now, timeZone: VN })).toBe(true);
    expect(FilterUtilities.evaluate(today, { day: '2026/08/14' }, { now, timeZone: VN })).toBe(false);
    expect((FilterUtilities.resolveData(today, {}, { now, timeZone: VN }) as Date).toISOString()).toBe('2026-08-14T17:00:00.000Z');
  });

  it('keeps the 1.2.6 result without a zone', () => {
    const localToday = DateUtilities.begin(now)!.getTime();
    for (const day of ['2026/08/15', '2026/08/14', '2026/08/13']) {
      const expected = FilterUtilities.toEpoch(day)! >= localToday;
      expect(FilterUtilities.evaluate(today, { day }, { now })).toBe(expected);
    }
    expect((FilterUtilities.resolveData(today, {}, { now }) as Date).getTime()).toBe(localToday);
  });

  it('resolves date-relative in the zone calendar', () => {
    const previousDay = FilterUtilities.resolveRelativeDate({ amount: 1, direction: 'previous', unit: 'day' }, now, { timeZone: VN });
    const nextWeek = FilterUtilities.resolveRelativeDate({ amount: 1, direction: 'next', unit: 'week' }, now, { timeZone: VN });
    const nextMonth = FilterUtilities.resolveRelativeDate({ amount: 1, direction: 'next', unit: 'month' }, now, { timeZone: VN });
    const previousHours = FilterUtilities.resolveRelativeDate({ amount: 2, direction: 'previous', unit: 'hour' }, now, { timeZone: VN });
    expect(previousDay.toISOString()).toBe('2026-08-13T17:00:00.000Z');
    expect(nextWeek.toISOString()).toBe('2026-08-21T17:00:00.000Z');
    expect(nextMonth.toISOString()).toBe('2026-09-14T17:00:00.000Z');
    expect(previousHours.toISOString()).toBe('2026-08-14T15:30:00.000Z');
  });

  it('clamps a month step to the last day of the target month in the zone', () => {
    const jan31 = new Date('2026-01-30T17:00:00Z'); // 2026-01-31 00:00 in VN
    expect(FilterUtilities.resolveRelativeDate({ amount: 1, direction: 'next', unit: 'month' }, jan31, { timeZone: VN }).toISOString())
      .toBe('2026-02-27T17:00:00.000Z');
  });

  it('reads zone-less date operands as wall clock in the zone', () => {
    expect(FilterUtilities.toEpoch('1960/05/20', { timeZone: VN })).toBe(Date.UTC(1960, 4, 19, 16));
    expect(FilterUtilities.toEpoch('1960-05-20T08:00:00', { timeZone: VN })).toBe(Date.UTC(1960, 4, 20, 0));
    expect(FilterUtilities.toEpoch('1960-05-19T16:00:00Z', { timeZone: VN })).toBe(Date.UTC(1960, 4, 19, 16));
    const sameInstant: Filter<{ at: string }> = { field: 'at', operator: 'EQUAL', data: '1960-05-20T00:00:00Z' };
    expect(FilterUtilities.evaluate(sameInstant, { at: '1960-05-20T08:00:00' }, { timeZone: VN, fieldTypes: { at: 'date' } })).toBe(true);
    expect(FilterUtilities.evaluate(sameInstant, { at: '1960-05-20T08:00:00' }, { timeZone: 'Asia/Bangkok', fieldTypes: { at: 'date' } })).toBe(false);
  });

  it('treats an invalid zone operand as unresolved', () => {
    expect(FilterUtilities.toEpoch('1960/05/20', { timeZone: 'Mars/Base' })).toBeNull();
  });
});
