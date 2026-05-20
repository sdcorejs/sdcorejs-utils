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

export interface FilterHasData<T> {
  field: NestedKeyOf<T>;
  operator: OperatorHasData;
  data: unknown;
}

export interface FilterBetween<T> {
  field: NestedKeyOf<T>;
  operator: 'BETWEEN';
  from: unknown;
  to: unknown;
}

export interface FilterAndOr<T> {
  operator: 'AND' | 'OR';
  filters: Filter<T>[];
}`,
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
