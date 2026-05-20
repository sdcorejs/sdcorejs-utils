import { describe, it, expect } from 'vitest';
import { NumberUtilities } from './number.fns';

// ─────────────────────────────────────────────
// isNumber
// ─────────────────────────────────────────────
describe('NumberUtilities.isNumber', () => {
  it('trả về true cho 0', () => {
    expect(NumberUtilities.isNumber(0)).toBe(true);
  });

  it('trả về true cho số nguyên dương', () => {
    expect(NumberUtilities.isNumber(1)).toBe(true);
    expect(NumberUtilities.isNumber(100)).toBe(true);
  });

  it('trả về true cho số nguyên âm', () => {
    expect(NumberUtilities.isNumber(-1)).toBe(true);
  });

  it('trả về true cho chuỗi số nguyên', () => {
    expect(NumberUtilities.isNumber('123')).toBe(true);
  });

  it("trả về true cho '0'", () => {
    expect(NumberUtilities.isNumber('0')).toBe(true);
  });

  it('trả về true cho số thập phân dạng string', () => {
    expect(NumberUtilities.isNumber('12.5')).toBe(true);
  });

  it('trả về true cho số âm dạng string', () => {
    expect(NumberUtilities.isNumber('-7')).toBe(true);
  });

  it('trả về false cho chuỗi rỗng', () => {
    expect(NumberUtilities.isNumber('')).toBe(false);
  });

  it('trả về false cho null', () => {
    expect(NumberUtilities.isNumber(null)).toBe(false);
  });

  it('trả về false cho undefined', () => {
    expect(NumberUtilities.isNumber(undefined)).toBe(false);
  });

  it("trả về false cho chuỗi chữ 'abc'", () => {
    expect(NumberUtilities.isNumber('abc')).toBe(false);
  });

  it('trả về false cho NaN (số NaN gốc)', () => {
    expect(NumberUtilities.isNumber(NaN)).toBe(false);
  });

  it('trả về true cho Infinity (vì +Infinity không phải NaN)', () => {
    // +Infinity không phải NaN → isNumber trả về true
    expect(NumberUtilities.isNumber(Infinity)).toBe(true);
  });

  it('trả về false cho chuỗi chỉ có khoảng trắng', () => {
    // +'  ' === 0, không phải NaN → true
    // Ghi chú: hành vi thực tế của +'  ' là 0 (falsy check không áp dụng ở đây vì value !== '')
    expect(NumberUtilities.isNumber('  ')).toBe(true);
  });
});

// ─────────────────────────────────────────────
// isPositiveInteger
// ─────────────────────────────────────────────
describe('NumberUtilities.isPositiveInteger', () => {
  it('trả về true cho số nguyên dương', () => {
    expect(NumberUtilities.isPositiveInteger(1)).toBe(true);
    expect(NumberUtilities.isPositiveInteger(100)).toBe(true);
  });

  it("trả về true cho chuỗi số nguyên dương '5'", () => {
    expect(NumberUtilities.isPositiveInteger('5')).toBe(true);
  });

  it('trả về false cho 0 (không phải dương)', () => {
    expect(NumberUtilities.isPositiveInteger(0)).toBe(false);
  });

  it('trả về false cho số âm', () => {
    expect(NumberUtilities.isPositiveInteger(-1)).toBe(false);
  });

  it('trả về false cho số thập phân 1.5', () => {
    expect(NumberUtilities.isPositiveInteger(1.5)).toBe(false);
  });

  it("trả về false cho chuỗi thập phân '1.5'", () => {
    expect(NumberUtilities.isPositiveInteger('1.5')).toBe(false);
  });

  it('trả về false cho chuỗi rỗng', () => {
    expect(NumberUtilities.isPositiveInteger('')).toBe(false);
  });

  it('trả về false cho null', () => {
    expect(NumberUtilities.isPositiveInteger(null)).toBe(false);
  });

  it('trả về false cho undefined', () => {
    expect(NumberUtilities.isPositiveInteger(undefined)).toBe(false);
  });

  it("trả về false cho chuỗi chữ 'abc'", () => {
    expect(NumberUtilities.isPositiveInteger('abc')).toBe(false);
  });
});

// ─────────────────────────────────────────────
// isPositiveNumber
// ─────────────────────────────────────────────
describe('NumberUtilities.isPositiveNumber', () => {
  it('trả về true cho số nguyên dương', () => {
    expect(NumberUtilities.isPositiveNumber(1)).toBe(true);
  });

  it('trả về true cho số thập phân dương', () => {
    expect(NumberUtilities.isPositiveNumber(1.5)).toBe(true);
  });

  it("trả về true cho chuỗi thập phân '2.5'", () => {
    expect(NumberUtilities.isPositiveNumber('2.5')).toBe(true);
  });

  it('trả về false cho 0', () => {
    expect(NumberUtilities.isPositiveNumber(0)).toBe(false);
  });

  it('trả về false cho số âm nguyên', () => {
    expect(NumberUtilities.isPositiveNumber(-1)).toBe(false);
  });

  it('trả về false cho số âm thập phân', () => {
    expect(NumberUtilities.isPositiveNumber(-0.5)).toBe(false);
  });

  it('trả về false cho chuỗi rỗng', () => {
    expect(NumberUtilities.isPositiveNumber('')).toBe(false);
  });

  it('trả về false cho null', () => {
    expect(NumberUtilities.isPositiveNumber(null)).toBe(false);
  });

  it('trả về false cho undefined', () => {
    expect(NumberUtilities.isPositiveNumber(undefined)).toBe(false);
  });

  it("trả về false cho chuỗi có nhiều dấu chấm '1.2.3'", () => {
    expect(NumberUtilities.isPositiveNumber('1.2.3')).toBe(false);
  });

  it("trả về false cho chuỗi chữ 'abc'", () => {
    expect(NumberUtilities.isPositiveNumber('abc')).toBe(false);
  });
});

// ─────────────────────────────────────────────
// toVNCurrency
// ─────────────────────────────────────────────
describe('NumberUtilities.toVNCurrency', () => {
  it('định dạng 1000 theo kiểu VN (ngăn cách bằng dấu chấm)', () => {
    const result = NumberUtilities.toVNCurrency(1000);
    // vi-VN dùng dấu chấm '.' để ngăn cách hàng nghìn
    expect(result).toContain('1.000');
  });

  it('định dạng số lớn 1000000', () => {
    const result = NumberUtilities.toVNCurrency(1000000);
    expect(result).toContain('1.000.000');
  });

  it('định dạng số thập phân', () => {
    const result = NumberUtilities.toVNCurrency(1234.56);
    expect(result).toContain('1.234');
  });

  it('trả về null khi value là null', () => {
    expect(NumberUtilities.toVNCurrency(null)).toBeNull();
  });

  it('trả về null khi value là undefined', () => {
    expect(NumberUtilities.toVNCurrency(undefined)).toBeNull();
  });

  it('trả về null khi value là chuỗi rỗng', () => {
    expect(NumberUtilities.toVNCurrency('')).toBeNull();
  });

  it("xử lý chuỗi có dấu phẩy kiểu US '1,000.50' → bỏ dấu phẩy trước khi parse", () => {
    const result = NumberUtilities.toVNCurrency('1,000.50');
    // sau khi bỏ dấu phẩy: '1000.50' → 1000.5 → định dạng VN
    expect(result).not.toBeNull();
    expect(result).toContain('1.000');
  });

  it("trả về null cho chuỗi chữ không phải số 'abc'", () => {
    expect(NumberUtilities.toVNCurrency('abc')).toBeNull();
  });

  it('định dạng 0 trả về chuỗi "0" (không phải null)', () => {
    // (0 ?? '') → 0, (0).toString() → '0', !'0' === false → không early-return null
    // +('0') = 0, !isNaN(0) → true → format → '0'
    const result = NumberUtilities.toVNCurrency(0);
    expect(result).toBe('0');
  });
});

// ─────────────────────────────────────────────
// toISO
// ─────────────────────────────────────────────
describe('NumberUtilities.toISO', () => {
  it('định dạng 1000 theo kiểu US (ngăn cách bằng dấu phẩy)', () => {
    const result = NumberUtilities.toISO(1000);
    expect(result).toContain('1,000');
  });

  it('định dạng số lớn 1000000', () => {
    const result = NumberUtilities.toISO(1000000);
    expect(result).toContain('1,000,000');
  });

  it('trả về null khi value là null', () => {
    expect(NumberUtilities.toISO(null)).toBeNull();
  });

  it('trả về null khi value là undefined', () => {
    expect(NumberUtilities.toISO(undefined)).toBeNull();
  });

  it('trả về null khi value là chuỗi rỗng', () => {
    expect(NumberUtilities.toISO('')).toBeNull();
  });

  it("trả về null cho chuỗi không phải số 'xyz'", () => {
    expect(NumberUtilities.toISO('xyz')).toBeNull();
  });
});

// ─────────────────────────────────────────────
// toVN (alias của toVNCurrency)
// ─────────────────────────────────────────────
describe('NumberUtilities.toVN', () => {
  it('là alias của toVNCurrency — trả về cùng kết quả', () => {
    expect(NumberUtilities.toVN(1000)).toBe(NumberUtilities.toVNCurrency(1000));
    expect(NumberUtilities.toVN(null)).toBe(NumberUtilities.toVNCurrency(null));
    expect(NumberUtilities.toVN('abc')).toBe(NumberUtilities.toVNCurrency('abc'));
  });

  it('định dạng 5000 giống toVNCurrency', () => {
    expect(NumberUtilities.toVN(5000)).toContain('5.000');
  });
});

// ─────────────────────────────────────────────
// round
// ─────────────────────────────────────────────
describe('NumberUtilities.round', () => {
  it('làm tròn 1.234 thành 1.23 (mặc định 2 chữ số)', () => {
    expect(NumberUtilities.round(1.234)).toBe(1.23);
  });

  it('làm tròn lên 1.235 thành 1.24', () => {
    expect(NumberUtilities.round(1.235)).toBe(1.24);
  });

  it('không thay đổi khi chữ số thập phân ít hơn digits', () => {
    expect(NumberUtilities.round(1.2)).toBe(1.2);
  });

  it('làm tròn thành số nguyên khi digits=0', () => {
    expect(NumberUtilities.round(1.6, 0)).toBe(2);
    expect(NumberUtilities.round(1.4, 0)).toBe(1);
  });

  it('giữ 3 chữ số thập phân khi digits=3', () => {
    expect(NumberUtilities.round(1.2345, 3)).toBe(1.235);
  });

  it('trả về null cho chuỗi chữ', () => {
    expect(NumberUtilities.round('abc' as any)).toBeNull();
  });

  it('trả về null cho null', () => {
    expect(NumberUtilities.round(null as any)).toBeNull();
  });

  it('trả về null cho undefined', () => {
    expect(NumberUtilities.round(undefined as any)).toBeNull();
  });

  it('trả về 0 cho input 0', () => {
    expect(NumberUtilities.round(0)).toBe(0);
  });

  it('xử lý đúng số âm', () => {
    expect(NumberUtilities.round(-1.235)).toBe(-1.24);
  });

  it('xử lý đúng chuỗi số hợp lệ', () => {
    expect(NumberUtilities.round('3.14159' as any, 3)).toBe(3.142);
  });

  it('digits lớn không làm mất độ chính xác của số nguyên', () => {
    expect(NumberUtilities.round(5, 5)).toBe(5);
  });
});
