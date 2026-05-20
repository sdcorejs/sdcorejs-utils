import { describe, it, expect } from 'vitest';
import { ArrayUtilities } from './array.fns';

describe('ArrayUtilities', () => {
  describe('distinct', () => {
    it('removes duplicates from primitive array', () => {
      expect(ArrayUtilities.distinct([1, 2, 2, 3])).toEqual([1, 2, 3]);
    });
    it('returns empty array for null/undefined', () => {
      expect(ArrayUtilities.distinct(null)).toEqual([]);
      expect(ArrayUtilities.distinct(undefined)).toEqual([]);
    });
  });

  describe('paging', () => {
    it('returns correct page slice', () => {
      const items = [1, 2, 3, 4, 5];
      expect(ArrayUtilities.paging(items, 2, 0)).toEqual([1, 2]);
      expect(ArrayUtilities.paging(items, 2, 1)).toEqual([3, 4]);
      expect(ArrayUtilities.paging(items, 2, 2)).toEqual([5]);
    });
    it('returns empty for null input', () => {
      expect(ArrayUtilities.paging(null, 2)).toEqual([]);
    });
  });

  describe('toObject', () => {
    it('converts array to keyed object', () => {
      const items = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }];
      expect(ArrayUtilities.toObject('id', items)).toEqual({ a: { id: 'a', name: 'A' }, b: { id: 'b', name: 'B' } });
    });
    it('returns empty object for null', () => {
      expect(ArrayUtilities.toObject('id', null)).toEqual({});
    });
  });

  describe('union', () => {
    it('merges arrays deduplicating by key', () => {
      const a = [{ id: 1, v: 'a' }];
      const b = [{ id: 1, v: 'b' }, { id: 2, v: 'c' }];
      const result = ArrayUtilities.union('id', a, b);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
    });
  });

  describe('search', () => {
    it('returns all items when searchText is empty', () => {
      const items = [{ name: 'Nguyen' }];
      expect(ArrayUtilities.search(items, '')).toEqual(items);
    });
    it('filters by field ignoring diacritics', () => {
      const items = [{ name: 'Nguyễn Văn A' }, { name: 'Trần Thị B' }];
      expect(ArrayUtilities.search(items, 'nguyen', ['name'])).toHaveLength(1);
    });
  });
});
