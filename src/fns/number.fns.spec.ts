import { describe, it, expect } from 'vitest';
import { NumberUtilities } from './number.fns';

describe('NumberUtilities', () => {
  describe('isNumber', () => {
    it('returns true for numeric values', () => {
      expect(NumberUtilities.isNumber(0)).toBe(true);
      expect(NumberUtilities.isNumber('123')).toBe(true);
    });
    it('returns false for null/undefined/empty', () => {
      expect(NumberUtilities.isNumber(null)).toBe(false);
      expect(NumberUtilities.isNumber('')).toBe(false);
    });
  });

  describe('round', () => {
    it('rounds to 2 decimal places by default', () => {
      expect(NumberUtilities.round(1.234)).toBe(1.23);
      expect(NumberUtilities.round(1.235)).toBe(1.24);
    });
    it('returns null for non-number', () => {
      expect(NumberUtilities.round('abc')).toBeNull();
    });
  });

  describe('isPositiveInteger', () => {
    it('returns true for positive integers', () => {
      expect(NumberUtilities.isPositiveInteger(5)).toBe(true);
      expect(NumberUtilities.isPositiveInteger('10')).toBe(true);
    });
    it('returns false for zero, negative, decimal', () => {
      expect(NumberUtilities.isPositiveInteger(0)).toBe(false);
      expect(NumberUtilities.isPositiveInteger(-1)).toBe(false);
      expect(NumberUtilities.isPositiveInteger(1.5)).toBe(false);
    });
  });
});
