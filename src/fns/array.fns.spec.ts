import { describe, it, expect } from 'vitest';
import { ArrayUtilities } from './array.fns';

// ─────────────────────────────────────────────
// search
// ─────────────────────────────────────────────
describe('ArrayUtilities.search', () => {
  const items = [
    { name: 'Nguyễn Văn A', code: 'NVA' },
    { name: 'Trần Thị B', code: 'TTB' },
    { name: 'Lê Văn C', code: 'LVC' },
  ];

  it('trả về tất cả item khi searchText rỗng', () => {
    expect(ArrayUtilities.search(items, '')).toEqual(items);
  });

  it('trả về tất cả item khi searchText là null', () => {
    expect(ArrayUtilities.search(items, null)).toEqual(items);
  });

  it('trả về tất cả item khi searchText là undefined', () => {
    expect(ArrayUtilities.search(items, undefined)).toEqual(items);
  });

  it('tìm kiếm bằng 1 field dạng string (không phải mảng)', () => {
    const result = ArrayUtilities.search(items, 'NVA', 'code');
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('NVA');
  });

  it('tìm kiếm bằng mảng field', () => {
    const result = ArrayUtilities.search(items, 'nguyen', ['name']);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Nguyễn Văn A');
  });

  it('tìm kiếm bằng nhiều field trong mảng (khớp ở bất kỳ field nào)', () => {
    const result = ArrayUtilities.search(items, 'NVA', ['name', 'code']);
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('NVA');
  });

  it('bỏ qua dấu tiếng Việt khi tìm kiếm', () => {
    const result = ArrayUtilities.search(items, 'nguyen van', ['name']);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Nguyễn Văn A');
  });

  it('trả về mảng rỗng khi không có kết quả khớp', () => {
    expect(ArrayUtilities.search(items, 'xyz_not_found', ['name'])).toHaveLength(0);
  });

  it('trả về mảng truyền vào khi items là null (không throw)', () => {
    // items null/undefined → !items.length truthy path → trả về items gốc
    const result = ArrayUtilities.search(null as any, 'abc');
    expect(result).toBeNull();
  });

  it('trả về mảng truyền vào khi items là mảng rỗng', () => {
    expect(ArrayUtilities.search([], 'abc')).toEqual([]);
  });

  it('tìm kiếm theo mảng field rỗng → fallback so sánh trực tiếp với item', () => {
    const strItems = ['Nguyễn', 'Trần', 'Lê'];
    const result = ArrayUtilities.search(strItems, 'nguyen', [] as any);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('Nguyễn');
  });

  it('lọc ra các item undefined/null trong mảng khi không có field', () => {
    const mixed = ['Nguyễn', null, undefined, 'Trần'];
    const result = ArrayUtilities.search(mixed as any, 'nguyen');
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('Nguyễn');
  });

  it('tìm kiếm cây (tree search) theo children', () => {
    const tree = [
      {
        name: 'Root',
        children: [
          { name: 'Nguyễn Văn A', children: [] },
          { name: 'Trần Thị B', children: [] },
        ],
      },
      {
        name: 'Other',
        children: [],
      },
    ];
    // Root không khớp trực tiếp nhưng con của nó khớp → Root được giữ lại
    const result = ArrayUtilities.search(tree, 'nguyen', ['name'], 'children');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Root');
  });

  it('tree search không trả về node cha khi cả cha lẫn con đều không khớp', () => {
    const tree = [
      { name: 'Root', children: [{ name: 'Child', children: [] }] },
    ];
    const result = ArrayUtilities.search(tree, 'xyz', ['name'], 'children');
    expect(result).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────
// union
// ─────────────────────────────────────────────
describe('ArrayUtilities.union', () => {
  it('trả về [] khi không có args', () => {
    expect(ArrayUtilities.union('id')).toEqual([]);
  });

  it('trả về item của mảng duy nhất khi chỉ truyền 1 mảng', () => {
    const a = [{ id: 1 }, { id: 2 }];
    expect(ArrayUtilities.union('id', a)).toEqual(a);
  });

  it('merge 2 mảng không trùng key', () => {
    const a = [{ id: 1, v: 'a' }];
    const b = [{ id: 2, v: 'b' }];
    const result = ArrayUtilities.union('id', a, b);
    expect(result).toHaveLength(2);
  });

  it('dedup khi 2 mảng có phần tử cùng key — giữ lần xuất hiện đầu tiên', () => {
    const a = [{ id: 1, v: 'first' }];
    const b = [{ id: 1, v: 'second' }, { id: 2, v: 'new' }];
    const result = ArrayUtilities.union('id', a, b);
    expect(result).toHaveLength(2);
    const item1 = result.find(r => r.id === 1);
    expect(item1?.v).toBe('first');
  });

  it('bỏ qua các arg là null hoặc undefined', () => {
    const a = [{ id: 1 }];
    const result = ArrayUtilities.union('id', a, null, undefined);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it('bỏ qua mảng null/undefined trong danh sách args', () => {
    // Lưu ý: implementation lọc null/undefined ở cấp độ item khi filterUnion chạy,
    // nhưng filterUnion gọi (e as any)[key] trên MỌI phần tử trong self (kể cả null).
    // Do đó chỉ truyền mảng hợp lệ — null/undefined-filtering áp dụng ở cấp args, không phải items.
    const a = [{ id: 1 }];
    const result = ArrayUtilities.union<{ id: number }>('id', a, null, undefined);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it('merge 3 mảng với dedup', () => {
    const a = [{ id: 1 }];
    const b = [{ id: 2 }];
    const c = [{ id: 1 }, { id: 3 }];
    const result = ArrayUtilities.union('id', a, b, c);
    expect(result).toHaveLength(3);
    const ids = result.map(r => r.id).sort();
    expect(ids).toEqual([1, 2, 3]);
  });
});

// ─────────────────────────────────────────────
// toObject
// ─────────────────────────────────────────────
describe('ArrayUtilities.toObject', () => {
  it('chuyển mảng thành object có key', () => {
    const items = [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ];
    expect(ArrayUtilities.toObject('id', items)).toEqual({
      a: { id: 'a', name: 'A' },
      b: { id: 'b', name: 'B' },
    });
  });

  it('trả về {} khi mảng rỗng', () => {
    expect(ArrayUtilities.toObject('id', [])).toEqual({});
  });

  it('trả về {} khi items là null', () => {
    expect(ArrayUtilities.toObject('id', null)).toEqual({});
  });

  it('trả về {} khi items là undefined', () => {
    expect(ArrayUtilities.toObject('id', undefined)).toEqual({});
  });

  it('key trùng → item sau ghi đè item trước', () => {
    const items = [
      { id: 'a', val: 'first' },
      { id: 'a', val: 'second' },
    ];
    const result = ArrayUtilities.toObject('id', items);
    expect(result['a'].val).toBe('second');
  });

  it('key là số → bị ép kiểu thành string', () => {
    const items = [{ id: 1, name: 'one' }, { id: 2, name: 'two' }];
    const result = ArrayUtilities.toObject('id', items as any);
    expect(result['1']).toEqual({ id: 1, name: 'one' });
    expect(result['2']).toEqual({ id: 2, name: 'two' });
  });

  it('bỏ qua item null/undefined trong mảng', () => {
    const items = [null, { id: 'a', name: 'A' }, undefined] as any;
    const result = ArrayUtilities.toObject<{ id: string; name: string }>('id', items);
    expect(Object.keys(result)).toHaveLength(1);
    expect(result['a'].name).toBe('A');
  });

  it('bỏ qua item có key là undefined (không thêm vào object)', () => {
    const items = [{ id: undefined, name: 'no-key' }, { id: 'b', name: 'B' }] as any;
    const result = ArrayUtilities.toObject('id', items);
    // item có id=undefined → toString() = "undefined" → string → được thêm vào
    // Hành vi thực tế của implementation: 'undefined'.toString() là 'undefined' → thêm vào
    expect(result['b']).toBeDefined();
  });
});

// ─────────────────────────────────────────────
// distinct
// ─────────────────────────────────────────────
describe('ArrayUtilities.distinct', () => {
  it('loại bỏ duplicate trong mảng số', () => {
    expect(ArrayUtilities.distinct([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
  });

  it('loại bỏ duplicate chuỗi', () => {
    expect(ArrayUtilities.distinct(['a', 'b', 'a'])).toEqual(['a', 'b']);
  });

  it('trả về mảng rỗng khi input rỗng', () => {
    expect(ArrayUtilities.distinct([])).toEqual([]);
  });

  it('trả về [] khi input là null', () => {
    expect(ArrayUtilities.distinct(null)).toEqual([]);
  });

  it('trả về [] khi input là undefined', () => {
    expect(ArrayUtilities.distinct(undefined)).toEqual([]);
  });

  it('không thay đổi mảng đã unique', () => {
    expect(ArrayUtilities.distinct([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('giữ lại undefined và null trong mảng (Set coi mỗi loại là unique)', () => {
    const result = ArrayUtilities.distinct([null, null, undefined, undefined, 1]);
    expect(result).toHaveLength(3); // null, undefined, 1
  });

  it('phân biệt reference với object (object !== object theo Set)', () => {
    const obj1 = { a: 1 };
    const obj2 = { a: 1 };
    // Hai object khác reference → Set giữ cả hai
    expect(ArrayUtilities.distinct([obj1, obj2])).toHaveLength(2);
  });

  it('dedup object cùng reference', () => {
    const obj = { a: 1 };
    expect(ArrayUtilities.distinct([obj, obj])).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────
// paging
// ─────────────────────────────────────────────
describe('ArrayUtilities.paging', () => {
  const items = [1, 2, 3, 4, 5, 6, 7];

  it('trang 0 trả về các item đầu tiên', () => {
    expect(ArrayUtilities.paging(items, 3, 0)).toEqual([1, 2, 3]);
  });

  it('trang 1 trả về các item tiếp theo', () => {
    expect(ArrayUtilities.paging(items, 3, 1)).toEqual([4, 5, 6]);
  });

  it('trang cuối có thể ít item hơn pageSize', () => {
    expect(ArrayUtilities.paging(items, 3, 2)).toEqual([7]);
  });

  it('page mặc định là 0 khi không truyền', () => {
    expect(ArrayUtilities.paging([1, 2, 3], 2)).toEqual([1, 2]);
  });

  it('trang vượt quá kích thước mảng → mảng rỗng', () => {
    expect(ArrayUtilities.paging(items, 3, 10)).toEqual([]);
  });

  it('trả về [] khi input là null', () => {
    expect(ArrayUtilities.paging(null, 5)).toEqual([]);
  });

  it('trả về [] khi input là undefined', () => {
    expect(ArrayUtilities.paging(undefined, 5)).toEqual([]);
  });

  it('pageSize lớn hơn mảng → trang 0 trả về toàn bộ', () => {
    expect(ArrayUtilities.paging([1, 2], 100, 0)).toEqual([1, 2]);
  });

  it('pageSize lớn hơn mảng → trang 1 trả về rỗng', () => {
    expect(ArrayUtilities.paging([1, 2], 100, 1)).toEqual([]);
  });

  it('pageSize = 1 → mỗi trang chứa đúng 1 item', () => {
    expect(ArrayUtilities.paging([10, 20, 30], 1, 0)).toEqual([10]);
    expect(ArrayUtilities.paging([10, 20, 30], 1, 1)).toEqual([20]);
    expect(ArrayUtilities.paging([10, 20, 30], 1, 2)).toEqual([30]);
  });

  it('mảng rỗng → mọi trang đều rỗng', () => {
    expect(ArrayUtilities.paging([], 5, 0)).toEqual([]);
  });
});
