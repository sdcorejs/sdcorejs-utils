import { FilterUtilities } from '@sdcorejs/utils/fns';
import type { Filter, FilterDataType, FilterFieldType, MatchOptions, Operator } from '@sdcorejs/utils/models';
import { renderResultBadge } from '../components/result-badge';
import { renderCodeBlock } from '../components/code-block';

// ── Sample entity the playground evaluates against ────────────────────────────

const sample = {
  name: 'iPhone 15',
  sku: '007',
  price: 1000,
  cost: 700,
  category: 'electronics',
  stock: 0,
  active: true,
  tags: ['phone', 'apple'],
  createdAt: '2025-01-15',
  updatedAtMs: new Date('2020-01-01').getTime(), // a date stored as ms timestamp
  vendor: { country: 'VN' },
};

type SampleField = keyof typeof sample | 'vendor.country';

const FIELDS: SampleField[] = [
  'name', 'sku', 'price', 'cost', 'category', 'stock', 'active', 'createdAt', 'updatedAtMs', 'vendor.country',
];

const OPERATORS: Operator[] = [
  'EQUAL', 'NOT_EQUAL', 'GREATER_THAN', 'LESS_THAN', 'GREATER_OR_EQUAL', 'LESS_OR_EQUAL',
  'CONTAIN', 'NOT_CONTAIN', 'START_WITH', 'END_WITH', 'IN', 'NOT_IN', 'BETWEEN', 'NULL', 'NOT_NULL',
];

const DATA_TYPES: { value: FilterDataType; label: string }[] = [
  { value: 'absolute',      label: 'absolute (literal)' },
  { value: 'field',         label: 'field (vs field)' },
  { value: 'date-today',    label: 'date-today' },
  { value: 'date-relative', label: 'date-relative' },
];

const NO_DATA: Operator[] = ['NULL', 'NOT_NULL'];

// ── small DOM helpers ─────────────────────────────────────────────────────────

function mkSelect<T extends string>(options: { value: T; label: string }[], value: T): HTMLSelectElement {
  const sel = document.createElement('select');
  for (const o of options) {
    const opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    sel.appendChild(opt);
  }
  sel.value = value;
  return sel;
}

function mkText(placeholder: string, value = ''): HTMLInputElement {
  const el = document.createElement('input');
  el.type = 'text';
  el.placeholder = placeholder;
  el.value = value;
  return el;
}

function mkField(label: string, control: HTMLElement): HTMLElement {
  const wrap = document.createElement('div');
  const lbl = document.createElement('div');
  lbl.className = 'panel-title';
  lbl.textContent = label;
  lbl.style.marginBottom = '6px';
  wrap.append(lbl, control);
  return wrap;
}

/** Parse a literal: JSON when possible (number/bool/null/array), else the raw string. */
function parseLiteral(raw: string): unknown {
  const s = raw.trim();
  if (s === '') return '';
  try {
    return JSON.parse(s);
  } catch {
    return raw;
  }
}

// ── interactive builder ───────────────────────────────────────────────────────

function renderPlayground(host: HTMLElement): void {
  const panel = document.createElement('div');
  panel.className = 'panel';

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(160px, 1fr))';
  grid.style.gap = '12px';
  grid.style.marginBottom = '16px';

  const fieldSel = mkSelect(FIELDS.map(f => ({ value: f, label: f })), 'price');
  const opSel = mkSelect(OPERATORS.map(o => ({ value: o, label: o })), 'GREATER_THAN');
  const typeSel = mkSelect(DATA_TYPES, 'field');

  // dynamic data-control host (depends on operator + dataType)
  const dataHost = document.createElement('div');

  // fieldTypes hint
  const hintWrap = document.createElement('label');
  hintWrap.style.display = 'flex';
  hintWrap.style.alignItems = 'center';
  hintWrap.style.gap = '8px';
  hintWrap.style.fontSize = '13px';
  const hintCheck = document.createElement('input');
  hintCheck.type = 'checkbox';
  hintCheck.style.width = 'auto';
  const hintTypeSel = mkSelect(
    (['date', 'number', 'string', 'boolean'] as FilterFieldType[]).map(t => ({ value: t, label: t })),
    'date'
  );
  hintTypeSel.style.maxWidth = '120px';
  hintWrap.append(hintCheck, document.createTextNode('fieldTypes hint →'), hintTypeSel);

  grid.append(
    mkField('field', fieldSel),
    mkField('operator', opSel),
    mkField('dataType', typeSel),
  );

  const output = document.createElement('div');
  output.style.display = 'flex';
  output.style.alignItems = 'center';
  output.style.gap = '12px';
  output.style.marginBottom = '12px';

  const codeHost = document.createElement('div');

  // Build the data-controls UI for the current operator + dataType.
  function buildDataControls(): void {
    dataHost.replaceChildren();
    const op = opSel.value as Operator;
    const dt = typeSel.value as FilterDataType;

    if (NO_DATA.includes(op)) return; // NULL / NOT_NULL → no value
    if (op === 'BETWEEN') {
      const from = mkText('from', '500');
      const to = mkText('to', '1500');
      from.dataset.role = 'from';
      to.dataset.role = 'to';
      from.addEventListener('input', evaluate);
      to.addEventListener('input', evaluate);
      const row = document.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = '1fr 1fr';
      row.style.gap = '12px';
      row.append(mkField('from', from), mkField('to', to));
      dataHost.appendChild(row);
      return;
    }
    if (dt === 'date-today') return; // data is the fixed 'TODAY' sentinel
    if (dt === 'field') {
      const ref = mkSelect(FIELDS.map(f => ({ value: f, label: f })), 'cost');
      ref.dataset.role = 'fieldref';
      ref.addEventListener('change', evaluate);
      dataHost.appendChild(mkField('data → field path', ref));
      return;
    }
    if (dt === 'date-relative') {
      const amount = mkText('amount', '7');
      amount.dataset.role = 'amount';
      const direction = mkSelect([{ value: 'previous', label: 'previous' }, { value: 'next', label: 'next' }], 'previous');
      direction.dataset.role = 'direction';
      const unit = mkSelect(
        (['hour', 'day', 'week', 'month'] as const).map(u => ({ value: u, label: u })),
        'day'
      );
      unit.dataset.role = 'unit';
      [amount, direction, unit].forEach(c => c.addEventListener('input', evaluate));
      [amount, direction, unit].forEach(c => c.addEventListener('change', evaluate));
      const row = document.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = 'repeat(3, 1fr)';
      row.style.gap = '12px';
      row.append(mkField('amount', amount), mkField('direction', direction), mkField('unit', unit));
      dataHost.appendChild(row);
      return;
    }
    // absolute
    const value = mkText('value (JSON or text, comma-list for IN)', '700');
    value.dataset.role = 'value';
    value.addEventListener('input', evaluate);
    dataHost.appendChild(mkField('data', value));
  }

  // Assemble the current Filter object from the controls.
  function buildFilter(): Filter<typeof sample> {
    const field = fieldSel.value as any;
    const op = opSel.value as Operator;
    const dt = typeSel.value as FilterDataType;

    if (op === 'NULL' || op === 'NOT_NULL') {
      return { field, operator: op };
    }
    if (op === 'BETWEEN') {
      const from = parseLiteral((dataHost.querySelector('[data-role=from]') as HTMLInputElement)?.value ?? '');
      const to = parseLiteral((dataHost.querySelector('[data-role=to]') as HTMLInputElement)?.value ?? '');
      return { field, operator: 'BETWEEN', data: { from: from as any, to: to as any } };
    }
    if (dt === 'date-today') {
      return { field, operator: op as any, dataType: 'date-today', data: 'TODAY' };
    }
    if (dt === 'field') {
      const ref = (dataHost.querySelector('[data-role=fieldref]') as HTMLSelectElement)?.value ?? 'cost';
      return { field, operator: op as any, dataType: 'field', data: ref as any };
    }
    if (dt === 'date-relative') {
      const amount = Number((dataHost.querySelector('[data-role=amount]') as HTMLInputElement)?.value || 0);
      const direction = (dataHost.querySelector('[data-role=direction]') as HTMLSelectElement)?.value as 'previous' | 'next';
      const unit = (dataHost.querySelector('[data-role=unit]') as HTMLSelectElement)?.value as 'hour' | 'day' | 'week' | 'month';
      return { field, operator: op as any, dataType: 'date-relative', data: { amount, direction, unit } };
    }
    const raw = (dataHost.querySelector('[data-role=value]') as HTMLInputElement)?.value ?? '';
    const data = op === 'IN' || op === 'NOT_IN' ? raw.split(',').map(s => parseLiteral(s)) : parseLiteral(raw);
    return { field, operator: op as any, data: data as any };
  }

  function buildOptions(): MatchOptions<typeof sample> | undefined {
    if (!hintCheck.checked) return undefined;
    return { fieldTypes: { [fieldSel.value]: hintTypeSel.value as FilterFieldType } } as MatchOptions<typeof sample>;
  }

  function evaluate(): void {
    const filter = buildFilter();
    const options = buildOptions();
    let result = false;
    try {
      result = FilterUtilities.match([filter], sample, options);
    } catch {
      result = false;
    }
    output.replaceChildren();
    output.appendChild(renderResultBadge(result, result ? 'match' : 'no match'));

    const call = options
      ? `FilterUtilities.match(\n  [${JSON.stringify(filter)}],\n  product,\n  ${JSON.stringify(options)}\n) // → ${result}`
      : `FilterUtilities.match(\n  [${JSON.stringify(filter)}],\n  product\n) // → ${result}`;
    codeHost.replaceChildren(renderCodeBlock(call));
  }

  function rebuild(): void {
    buildDataControls();
    evaluate();
  }

  fieldSel.addEventListener('change', evaluate);
  opSel.addEventListener('change', rebuild);
  typeSel.addEventListener('change', rebuild);
  hintCheck.addEventListener('change', evaluate);
  hintTypeSel.addEventListener('change', evaluate);

  panel.append(grid, dataHost, hintWrap, document.createElement('hr'), output, codeHost);
  // spacing on the hr
  (panel.querySelector('hr') as HTMLElement).style.cssText = 'border:none;border-top:1px solid var(--border);margin:16px 0;';
  host.appendChild(panel);
  rebuild();
}

// ── canned scenarios (read-only, each shows code + live badge) ────────────────

interface Scenario {
  title: string;
  filters: Filter<typeof sample>[];
  options?: MatchOptions<typeof sample>;
  note: string;
}

const SCENARIOS: Scenario[] = [
  {
    title: 'Field vs field — price > cost',
    filters: [{ field: 'price', operator: 'GREATER_THAN', dataType: 'field', data: 'cost' }],
    note: 'No literal — the operand is another field on the same entity.',
  },
  {
    title: 'Created before today',
    filters: [{ field: 'createdAt', operator: 'LESS_THAN', dataType: 'date-today', data: 'TODAY' }],
    note: "'TODAY' resolves to local midnight at evaluation time.",
  },
  {
    title: 'Stale "last 7 days" window excludes a 2025 record',
    filters: [{ field: 'createdAt', operator: 'GREATER_OR_EQUAL', dataType: 'date-relative', data: { amount: 7, direction: 'previous', unit: 'day' } }],
    note: 'date-relative = today ± amount × unit. Expected: no match.',
  },
  {
    title: 'Date stored as ms timestamp — auto-coerced',
    filters: [{ field: 'updatedAtMs', operator: 'LESS_OR_EQUAL', dataType: 'date-today', data: 'TODAY' }],
    note: 'A date-typed operand tells the evaluator to read updatedAtMs as a date.',
  },
  {
    title: 'EQUAL numeric-string with a number hint',
    filters: [{ field: 'sku', operator: 'EQUAL', data: 7 }],
    options: { fieldTypes: { sku: 'number' } },
    note: "sku is '007'; fieldTypes:{sku:'number'} makes Number('007') === 7.",
  },
  {
    title: 'Nested AND / OR',
    filters: [{ operator: 'OR', data: [
      { operator: 'AND', data: [
        { field: 'category', operator: 'EQUAL', data: 'electronics' },
        { field: 'active', operator: 'EQUAL', data: true },
      ] },
      { field: 'price', operator: 'GREATER_THAN', data: 99999 },
    ] }],
    note: 'Groups compose to any depth.',
  },
];

function renderScenarios(host: HTMLElement): void {
  for (const sc of SCENARIOS) {
    const section = document.createElement('div');
    section.className = 'section';

    const head = document.createElement('div');
    head.style.display = 'flex';
    head.style.alignItems = 'center';
    head.style.justifyContent = 'space-between';
    head.style.marginBottom = '8px';

    const title = document.createElement('div');
    title.className = 'section-title';
    title.style.marginBottom = '0';
    title.textContent = sc.title;

    let ok = false;
    try {
      ok = FilterUtilities.match(sc.filters, sample, sc.options);
    } catch {
      ok = false;
    }
    head.append(title, renderResultBadge(ok, ok ? 'match' : 'no match'));

    const note = document.createElement('div');
    note.style.color = 'var(--text-muted)';
    note.style.fontSize = '12px';
    note.style.marginBottom = '8px';
    note.textContent = sc.note;

    const code = sc.options
      ? `FilterUtilities.match(\n  ${JSON.stringify(sc.filters, null, 2)},\n  product,\n  ${JSON.stringify(sc.options)}\n)`
      : `FilterUtilities.match(\n  ${JSON.stringify(sc.filters, null, 2)},\n  product\n)`;

    section.append(head, note, renderCodeBlock(code));
    host.appendChild(section);
  }
}

// ── tab entry ─────────────────────────────────────────────────────────────────

type SubTab = 'playground' | 'scenarios' | 'entity';

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'playground', label: 'Playground' },
  { id: 'scenarios',  label: 'Scenarios' },
  { id: 'entity',     label: 'Sample entity' },
];

export function renderFilter(el: HTMLElement): void {
  el.innerHTML = '';

  const intro = document.createElement('div');
  intro.className = 'section';
  intro.innerHTML = `
    <div class="section-title">FilterUtilities.match(filters, entity, options?)</div>
    <div style="color:var(--text-muted);font-size:13px;line-height:1.6;">
      Evaluate the same <code>Filter[]</code> shape you send to the API directly against an
      in-memory object. Supports <b>field-to-field</b> comparison, <b>relative dates</b>
      (TODAY · N previous/next hour/day/week/month) and <b>type-aware coercion</b> so a date
      returned as an ISO string or a numeric timestamp still compares correctly.
    </div>`;
  el.appendChild(intro);

  const subTabBar = document.createElement('div');
  subTabBar.className = 'sub-tabs';
  const content = document.createElement('div');
  let active: SubTab = 'playground';

  const RENDER: Record<SubTab, (host: HTMLElement) => void> = {
    playground: renderPlayground,
    scenarios:  renderScenarios,
    entity:     (host) => host.appendChild(renderCodeBlock(`const product = ${JSON.stringify(sample, null, 2)};`)),
  };

  for (const tab of SUB_TABS) {
    const btn = document.createElement('button');
    btn.className = `sub-tab-btn${tab.id === active ? ' active' : ''}`;
    btn.dataset.subtab = tab.id;
    btn.textContent = tab.label;
    btn.addEventListener('click', () => {
      active = tab.id;
      subTabBar.querySelectorAll<HTMLButtonElement>('.sub-tab-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.subtab === tab.id)
      );
      content.replaceChildren();
      RENDER[tab.id](content);
    });
    subTabBar.appendChild(btn);
  }

  el.append(subTabBar, content);
  RENDER[active](content);
}
