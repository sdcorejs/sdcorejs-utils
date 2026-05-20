import { describe, it, expect } from 'vitest';
import { StringUtilities } from './string.fns';

describe('StringUtilities', () => {
  describe('isValidEmail', () => {
    it('returns true for valid email', () => {
      expect(StringUtilities.isValidEmail('test@example.com')).toBe(true);
    });
    it('returns false for invalid email', () => {
      expect(StringUtilities.isValidEmail('not-an-email')).toBe(false);
    });
    it('returns false for null/undefined', () => {
      expect(StringUtilities.isValidEmail(null)).toBe(false);
      expect(StringUtilities.isValidEmail(undefined)).toBe(false);
    });
  });

  describe('changeAliasLowerCase', () => {
    it('removes Vietnamese diacritics', () => {
      expect(StringUtilities.changeAliasLowerCase('Nguyễn Văn A')).toBe('nguyen van a');
    });
    it('handles đ/Đ', () => {
      expect(StringUtilities.changeAliasLowerCase('Đội')).toBe('doi');
    });
  });

  describe('aliasIncludes', () => {
    it('finds Vietnamese text ignoring diacritics', () => {
      expect(StringUtilities.aliasIncludes('Nguyễn', 'nguyen')).toBe(true);
    });
    it('returns false when not found', () => {
      expect(StringUtilities.aliasIncludes('Nguyễn', 'Trần')).toBe(false);
    });
  });

  describe('convertToSnakeCaseCode', () => {
    it('converts Vietnamese name to snake_case', () => {
      expect(StringUtilities.convertToSnakeCaseCode('Đội Kỹ Thuật')).toBe('doi_ky_thuat');
    });
    it('throws for non-string input', () => {
      expect(() => StringUtilities.convertToSnakeCaseCode(123 as any)).toThrow('Invalid name');
    });
  });

  describe('generateUniqueCode', () => {
    it('returns base code when no conflict', () => {
      expect(StringUtilities.generateUniqueCode('test', [])).toBe('test');
    });
    it('appends _1 on first conflict', () => {
      expect(StringUtilities.generateUniqueCode('test', ['test'])).toBe('test_1');
    });
    it('increments suffix until unique', () => {
      expect(StringUtilities.generateUniqueCode('test', ['test', 'test_1'])).toBe('test_2');
    });
  });

  describe('isNullOrEmpty', () => {
    it('returns true for null, undefined, empty string', () => {
      expect(StringUtilities.isNullOrEmpty(null)).toBe(true);
      expect(StringUtilities.isNullOrEmpty(undefined)).toBe(true);
      expect(StringUtilities.isNullOrEmpty('')).toBe(true);
    });
    it('returns false for non-empty string', () => {
      expect(StringUtilities.isNullOrEmpty('hello')).toBe(false);
    });
  });
});
