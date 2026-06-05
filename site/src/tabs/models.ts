import { renderCodeBlock } from '../components/code-block';

const SNIPPETS: { title: string; code: string }[] = [
  {
    title: 'ValidationPatternType',
    code:
`export type ValidationPatternType =
  | 'EMAIL' | 'PHONE' | 'VN_PHONE' | 'VN_ID'
  | 'PASSPORT' | 'VN_ID_OR_PASSPORT' | 'TIME'
  | 'URL' | 'DOMAIN' | 'IPV4' | 'IPV6' | 'IMAGE_URL' | 'SLUG'
  | 'NUMBER' | 'INTEGER' | 'DECIMAL' | 'POSITIVE_NUMBER'
  | 'UUID' | 'CODE_16' | 'CODE_32' | 'HEX_COLOR' | 'BASE64';`,
  },
  {
    title: 'ValidationPattern',
    code:
`export interface ValidationPattern {
  type: ValidationPatternType;
  name: string;         // i18n key
  pattern: string;      // regex string → pass to Validators.pattern()
  errorMessage: string; // i18n key
}`,
  },
  {
    title: 'Filter<T>',
    code:
`export type Filter<T> =
  | FilterHasData<T>
  | FilterBetween<T>
  | FilterNoData<T>
  | FilterAndOr<T>;

// Single-value filter. 'dataType' (beside 'data') decides
// how 'data' is read; omitted means 'absolute'.
export type FilterDataType =
  | 'absolute'      // data: literal value (default)
  | 'field'         // data: NestedKeyOf<T> — compare two fields
  | 'date-today'    // data: 'TODAY'
  | 'date-relative';// data: DateRelative

export interface DateRelative {
  amount: number;
  direction: 'previous' | 'next';
  unit: 'hour' | 'day' | 'week' | 'month';
}

export type FilterHasData<T> =
  | { field: NestedKeyOf<T>; operator: OpNoBetween; dataType?: 'absolute'; data: FilterLiteral }
  | { field: NestedKeyOf<T>; operator: OpNoBetween; dataType: 'field'; data: NestedKeyOf<T> }
  | { field: NestedKeyOf<T>; operator: OpNoBetween; dataType: 'date-today'; data: 'TODAY' }
  | { field: NestedKeyOf<T>; operator: OpNoBetween; dataType: 'date-relative'; data: DateRelative };

export interface FilterAndOr<T> {
  operator: 'AND' | 'OR';
  data: Filter<T>[];
}`,
  },
  {
    title: 'MatchOptions<T> — type-aware evaluation',
    code:
`// Client rarely knows declared types — a date may arrive as a Date,
// an ISO string, or a numeric timestamp. Declaring 'date' coerces
// both sides to epoch ms so comparisons are exact.
export type FilterFieldType = 'string' | 'number' | 'boolean' | 'date';

export interface MatchOptions<T> {
  fieldTypes?: Partial<Record<NestedKeyOf<T>, FilterFieldType>>;
}`,
  },
  {
    title: 'FilterUtilities.match() — client-side evaluation',
    code:
`import { FilterUtilities } from '@sdcorejs/utils/fns';

const filters: Filter<Product>[] = [
  { field: 'price', operator: 'GREATER_THAN', dataType: 'field', data: 'cost' },
  { field: 'createdAt', operator: 'GREATER_OR_EQUAL',
    dataType: 'date-relative', data: { amount: 7, direction: 'previous', unit: 'day' } },
];

// Implicit AND across the array. Empty list matches everything.
FilterUtilities.match(filters, product);                       // boolean
FilterUtilities.match(filters, product, {
  fieldTypes: { createdAt: 'date' },                           // exact coercion
});

rows.filter(r => FilterUtilities.match(filters, r));`,
  },
  {
    title: 'PagingReq<T> / PagingRes<T>',
    code:
`export interface PagingReq<T> extends QueryReq<T> {
  pageSize: number;
  pageNumber: number;
  orders?: Order<T>[];
}

export interface PagingRes<T> {
  items: T[];
  total: number;
}`,
  },
  {
    title: 'MaybeAsync<T>',
    code:
`export type MaybeAsync<T> = T | Promise<T> | Observable<T>;

// Resolve any variant → Promise<T>  (requires rxjs)
const result = await resolveMaybeAsync(value);

// Normalize any variant → Observable<T>  (requires rxjs)
const obs$ = normalizeAsync(value);`,
  },
];

export function renderModels(el: HTMLElement): void {
  el.innerHTML = '';
  for (const s of SNIPPETS) {
    const section = document.createElement('div');
    section.className = 'section';
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = s.title;
    section.appendChild(title);
    section.appendChild(renderCodeBlock(s.code));
    el.appendChild(section);
  }
}
