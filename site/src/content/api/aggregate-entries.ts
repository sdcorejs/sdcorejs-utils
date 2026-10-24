import type { SymbolSpec } from './shared';

const common = {
  pageId: 'api-models-types',
  importPath: '@sdcorejs/utils/models',
  runtimeEn: ['Type-only contracts erased from JavaScript; the consuming repository executes and validates the query.'],
  runtimeVi: ['Contract chỉ kiểu bị xóa khỏi JavaScript; repository sử dụng sẽ thực thi và kiểm tra truy vấn.'],
  securityEn: ['Validate filters, authorized columns, operations and unique aliases at the server boundary. Types do not authorize access.'],
  securityVi: ['Kiểm tra filter, cột được phép, phép tính và alias duy nhất tại server. Kiểu dữ liệu không cấp quyền truy cập.'],
  exampleIds: ['aggregate-query'],
} as const;

export const AGGREGATE_SPECS: readonly SymbolSpec[] = [
  {
    ...common, symbol: 'AggregateOperation', kind: 'type',
    signature: "type AggregateOperation = 'sum' | 'count' | 'avg' | 'min' | 'max'",
    en: 'Five aggregate operations; sum/avg require numeric columns, min/max require ordered scalar columns.',
    vi: 'Năm phép tổng hợp; sum/avg yêu cầu cột số, min/max yêu cầu cột scalar có thể sắp thứ tự.',
    returnsEn: 'An operation literal. Count with * counts rows; count with a field excludes nulls.',
    returnsVi: 'Literal phép tính. Count với * đếm dòng; count với field bỏ qua null.',
  },
  {
    ...common, symbol: 'AggregateMetric', kind: 'interface',
    signature: "interface AggregateMetric<T = unknown> { field: NestedKeyOf<T> | '*'; operation: AggregateOperation; alias: string; distinct?: boolean }",
    en: 'One calculation with a unique output alias; repeat a field to calculate several metrics.',
    vi: 'Một phép tính có alias đầu ra duy nhất; lặp field để tính nhiều chỉ số.',
    properties: [
      { name: 'field', type: "NestedKeyOf<T> | '*'", en: 'Column path, or * only for count without distinct.', vi: 'Đường dẫn cột, hoặc * chỉ dùng cho count không distinct.' },
      { name: 'operation', type: 'AggregateOperation', en: 'Calculation to apply.', vi: 'Phép tính cần áp dụng.' },
      { name: 'alias', type: 'string', en: 'Unique output key distinct from group keys; NestJS allows ASCII identifiers up to 63 characters and rejects reserved object keys.', vi: 'Khóa đầu ra duy nhất không trùng khóa nhóm; NestJS cho phép định danh ASCII tối đa 63 ký tự và từ chối khóa object dành riêng.' },
      { name: 'distinct', type: 'boolean', optional: true, defaultValue: 'false', en: 'Use distinct non-null column values; invalid for *.', vi: 'Dùng giá trị cột khác null không trùng lặp; không hợp lệ với *.' },
    ],
    returnsEn: 'A structural metric descriptor, with column compatibility validated by the executor.',
    returnsVi: 'Mô tả phép tính dạng cấu trúc; executor kiểm tra tính tương thích của cột.',
  },
  {
    ...common, symbol: 'AggregateReq', kind: 'interface',
    signature: 'interface AggregateReq<T = unknown> extends QueryReq<T> { aggregates: readonly AggregateMetric<T>[]; groupBy?: readonly NestedKeyOf<T>[] }',
    en: 'Extends QueryReq filters and projection with calculations and optional grouping.',
    vi: 'Mở rộng filter và projection của QueryReq bằng phép tính và phân nhóm tùy chọn.',
    properties: [
      { name: 'filters', type: 'Filter<T>[]', optional: true, en: 'Conditions applied before grouping.', vi: 'Điều kiện áp dụng trước phân nhóm.' },
      { name: 'fields', type: 'NestedKeyOf<T>[]', optional: true, en: 'Projected group keys only; omitted returns all, [] returns none. Metrics always remain.', vi: 'Chỉ chọn khóa nhóm; bỏ qua trả tất cả, [] không trả khóa nào. Luôn giữ các phép tính.' },
      { name: 'aggregates', type: 'readonly AggregateMetric<T>[]', en: 'At least one calculation; NestJS allows at most 32.', vi: 'Ít nhất một phép tính; NestJS cho phép tối đa 32.' },
      { name: 'groupBy', type: 'readonly NestedKeyOf<T>[]', optional: true, en: 'Omitted or empty means one global summary. NestJS accepts up to eight scalar root keys, sorted ascending with nulls first.', vi: 'Bỏ qua hoặc rỗng nghĩa là tổng hợp toàn bộ. NestJS nhận tối đa tám khóa scalar gốc, sắp tăng dần với null trước.' },
    ],
    returnsEn: 'A reusable request; query execution, authorization and group limits belong to the consumer.',
    returnsVi: 'Request tái sử dụng; thực thi truy vấn, phân quyền và giới hạn nhóm thuộc consumer.',
  },
  {
    ...common, symbol: 'AggregateValue', kind: 'type',
    signature: 'type AggregateValue = string | number | boolean | Date | null',
    en: 'Driver-native scalar value preserving numeric precision and SQL null.',
    vi: 'Giá trị scalar gốc từ driver, giữ độ chính xác số và SQL null.',
    returnsEn: 'PostgreSQL bigint/numeric can remain strings; Date serializes to an ISO string over JSON.',
    returnsVi: 'PostgreSQL bigint/numeric có thể giữ dạng chuỗi; Date serialize thành chuỗi ISO qua JSON.',
  },
  {
    ...common, symbol: 'AggregateRow', kind: 'type',
    signature: 'type AggregateRow = Record<string, AggregateValue>',
    en: 'Flat row keyed by projected group fields and metric aliases.',
    vi: 'Dòng phẳng có khóa là field nhóm được chọn và alias phép tính.',
    returnsEn: 'Request-dependent scalar keys; nested result objects are not part of this contract.',
    returnsVi: 'Khóa scalar tùy theo request; object kết quả lồng nhau không thuộc contract này.',
  },
  {
    ...common, symbol: 'AggregateRes', kind: 'type',
    signature: 'type AggregateRes<TRow = AggregateRow> = TRow[]',
    en: 'Result array: one ungrouped summary or zero or more grouped rows, without a total group count.',
    vi: 'Mảng kết quả: một dòng tổng hợp hoặc không hay nhiều dòng nhóm, không kèm tổng số nhóm.',
    returnsEn: 'Empty input gives zero counts and null other metrics without grouping, or [] with grouping. HTTP envelopes and group pagination remain consumer-owned.',
    returnsVi: 'Dữ liệu rỗng trả count bằng không và phép khác null khi không nhóm, hoặc [] khi nhóm. Envelope HTTP và phân trang nhóm thuộc consumer.',
  },
];
