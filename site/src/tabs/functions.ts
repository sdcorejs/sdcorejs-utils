import { DateUtilities, NumberUtilities, ObjectUtilities, StringUtilities, ValidationUtilities } from '@sdcorejs/utils/fns';
import { renderResultBadge } from '../components/result-badge';

type SubTab = 'string' | 'validation' | 'date' | 'number' | 'object';

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'string', label: 'StringUtilities' },
  { id: 'validation', label: 'ValidationUtilities' },
  { id: 'date', label: 'DateUtilities' },
  { id: 'number', label: 'NumberUtilities' },
  { id: 'object', label: 'ObjectUtilities' },
];

export function renderFunctions(el: HTMLElement): void {
  el.innerHTML = '';

  const subTabBar = document.createElement('div');
  subTabBar.className = 'sub-tabs';
  const contentArea = document.createElement('div');
  let active: SubTab = 'string';

  const renderers: Record<SubTab, (el: HTMLElement) => void> = {
    string: renderStringDemos,
    validation: renderValidationDemos,
    date: renderDateDemos,
    number: renderNumberDemos,
    object: renderObjectDemos,
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
      contentArea.replaceChildren();
      renderers[tab.id](contentArea);
    });
    subTabBar.appendChild(btn);
  }

  el.appendChild(subTabBar);
  el.appendChild(contentArea);
  renderers[active](contentArea);
}

function mkInput(placeholder: string, value = ''): HTMLInputElement {
  const el = document.createElement('input');
  el.type = 'text';
  el.placeholder = placeholder;
  el.value = value;
  el.style.flex = '1';
  return el;
}

function mkTextarea(value = ''): HTMLTextAreaElement {
  const el = document.createElement('textarea');
  el.value = value;
  el.rows = 8;
  el.style.flex = '1';
  el.style.fontFamily = 'monospace';
  return el;
}

function mkOutput(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'demo-output';
  return el;
}

function mkRow(label: string, inputEl: HTMLElement, outputEl: HTMLElement): HTMLElement {
  const row = document.createElement('div');
  row.className = 'demo-row';
  const lbl = document.createElement('div');
  lbl.className = 'demo-label';
  lbl.textContent = label;
  row.append(lbl, inputEl, outputEl);
  return row;
}

function stringify(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function readJson(input: HTMLTextAreaElement): unknown {
  return JSON.parse(input.value);
}

function renderStringDemos(el: HTMLElement): void {
  const aliasIn = mkInput('Enter Vietnamese text', 'Nguyen Van Anh');
  const aliasOut = mkOutput();
  const updateAlias = (): void => {
    aliasOut.textContent = StringUtilities.changeAliasLowerCase(aliasIn.value);
  };
  aliasIn.addEventListener('input', updateAlias);
  updateAlias();
  el.appendChild(mkRow('changeAliasLowerCase(s)', aliasIn, aliasOut));

  const fmtTpl = mkInput('Template', 'Hello {0}, you are {1} years old');
  const fmtArgs = mkInput('Args (comma-separated)', 'World, 25');
  const fmtOut = mkOutput();
  const updateFmt = (): void => {
    fmtOut.textContent = StringUtilities.format(fmtTpl.value, ...fmtArgs.value.split(',').map(s => s.trim()));
  };
  fmtTpl.addEventListener('input', updateFmt);
  fmtArgs.addEventListener('input', updateFmt);
  updateFmt();
  el.appendChild(mkRow('format(template, ...args)', fmtTpl, fmtOut));
  el.appendChild(mkRow('args', fmtArgs, document.createElement('div')));

  const encIn = mkInput('JSON value', '{"id":1,"name":"test"}');
  const encOut = mkOutput();
  const decOut = mkOutput();
  const updateEnc = (): void => {
    try {
      const enc = StringUtilities.encrypt(JSON.parse(encIn.value));
      encOut.textContent = enc;
      decOut.textContent = JSON.stringify(StringUtilities.decrypt(enc));
    } catch {
      encOut.textContent = 'Invalid JSON';
      decOut.textContent = '';
    }
  };
  encIn.addEventListener('input', updateEnc);
  updateEnc();
  el.appendChild(mkRow('encrypt(obj)', encIn, encOut));
  el.appendChild(mkRow('decrypt(encrypted)', document.createElement('div'), decOut));
}

function renderValidationDemos(el: HTMLElement): void {
  const cases: { fn: string; placeholder: string; test: (v: string) => boolean }[] = [
    { fn: 'isEmail', placeholder: 'user@example.com', test: ValidationUtilities.isEmail },
    { fn: 'isUrl', placeholder: 'https://example.com', test: ValidationUtilities.isUrl },
    { fn: 'isUuid', placeholder: '550e8400-e29b-41d4-a716-446655440000', test: ValidationUtilities.isUuid },
    { fn: 'isIpv4', placeholder: '192.168.1.1', test: ValidationUtilities.isIpv4 },
    { fn: 'isVnPhone', placeholder: '0912345678', test: ValidationUtilities.isVnPhone },
    { fn: 'isHexColor', placeholder: '#1A2B3C', test: ValidationUtilities.isHexColor },
  ];

  for (const c of cases) {
    const inp = mkInput(c.placeholder);
    const out = document.createElement('div');
    out.style.flex = '0 0 auto';
    const update = (): void => {
      out.replaceChildren();
      if (inp.value) out.appendChild(renderResultBadge(c.test(inp.value)));
    };
    inp.addEventListener('input', update);
    el.appendChild(mkRow(`ValidationUtilities.${c.fn}(v)`, inp, out));
  }
}

function renderDateDemos(el: HTMLElement): void {
  const dateIn = document.createElement('input');
  dateIn.type = 'date';
  dateIn.value = new Date().toISOString().slice(0, 10);
  dateIn.style.flex = '1';
  const fmtIn = mkInput('Format string', 'dd/MM/yyyy HH:mm');
  const fmtOut = mkOutput();
  const updateDateFmt = (): void => {
    try {
      fmtOut.textContent = DateUtilities.toFormat(new Date(dateIn.value), fmtIn.value);
    } catch {
      fmtOut.textContent = 'Invalid date';
    }
  };
  dateIn.addEventListener('input', updateDateFmt);
  fmtIn.addEventListener('input', updateDateFmt);
  updateDateFmt();
  el.appendChild(mkRow('toFormat(date, format)', dateIn, fmtOut));
  el.appendChild(mkRow('format string', fmtIn, document.createElement('div')));

  const pastIn = document.createElement('input');
  pastIn.type = 'date';
  pastIn.style.flex = '1';
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  pastIn.value = twoWeeksAgo.toISOString().slice(0, 10);
  const diffOut = mkOutput();
  const updateDiff = (): void => {
    try {
      diffOut.textContent = DateUtilities.timeDifference(new Date(pastIn.value));
    } catch {
      diffOut.textContent = 'Invalid date';
    }
  };
  pastIn.addEventListener('input', updateDiff);
  updateDiff();
  el.appendChild(mkRow('timeDifference(past)', pastIn, diffOut));
}

function renderNumberDemos(el: HTMLElement): void {
  const vnIn = mkInput('Number', '1234567.89');
  const vnOut = mkOutput();
  const updateVn = (): void => {
    const n = parseFloat(vnIn.value);
    vnOut.textContent = Number.isNaN(n) ? 'Invalid' : NumberUtilities.toVNCurrency(n);
  };
  vnIn.addEventListener('input', updateVn);
  updateVn();
  el.appendChild(mkRow('toVNCurrency(n)', vnIn, vnOut));

  const rndIn = mkInput('Number', '3.14159');
  const digitsIn = mkInput('Digits', '2');
  const rndOut = mkOutput();
  const updateRnd = (): void => {
    const n = parseFloat(rndIn.value);
    const d = parseInt(digitsIn.value, 10);
    rndOut.textContent = Number.isNaN(n) || Number.isNaN(d) ? 'Invalid' : String(NumberUtilities.round(n, d));
  };
  rndIn.addEventListener('input', updateRnd);
  digitsIn.addEventListener('input', updateRnd);
  updateRnd();
  el.appendChild(mkRow('round(n, digits)', rndIn, rndOut));
  el.appendChild(mkRow('digits', digitsIn, document.createElement('div')));
}

function renderObjectDemos(el: HTMLElement): void {
  const baseIn = mkTextarea(`{
  "theme": {
    "mode": "light",
    "density": "comfortable",
    "tokens": {
      "primary": "blue",
      "radius": 4
    }
  },
  "columns": ["name", "email"]
}`);
  const overrideIn = mkTextarea(`{
  "theme": {
    "density": "compact",
    "tokens": {
      "radius": 8
    }
  },
  "columns": ["id"]
}`);
  const mergeOut = mkOutput();
  const deepMergeOut = mkOutput();
  const cloneOut = mkOutput();
  const plainOut = mkOutput();

  const updateObjectDemos = (): void => {
    try {
      const baseValue = readJson(baseIn);
      const overrideValue = readJson(overrideIn);
      const merged = ObjectUtilities.merge(baseValue, overrideValue);
      const deepMerged = ObjectUtilities.deepMerge(baseValue as Record<string, unknown>, overrideValue as Record<string, unknown>);
      const cloned = ObjectUtilities.clone(baseValue);

      mergeOut.textContent = stringify(merged);
      deepMergeOut.textContent = stringify(deepMerged);
      cloneOut.textContent = `clone !== input: ${String(cloned !== baseValue)}`;
      plainOut.replaceChildren(renderResultBadge(ObjectUtilities.isPlainObject(baseValue)));
    } catch {
      mergeOut.textContent = 'Invalid JSON';
      deepMergeOut.textContent = '';
      cloneOut.textContent = '';
      plainOut.textContent = '';
    }
  };

  baseIn.addEventListener('input', updateObjectDemos);
  overrideIn.addEventListener('input', updateObjectDemos);
  updateObjectDemos();

  el.appendChild(mkRow('default JSON', baseIn, mergeOut));
  el.appendChild(mkRow('override JSON', overrideIn, deepMergeOut));
  el.appendChild(mkRow('clone(default)', document.createElement('div'), cloneOut));
  el.appendChild(mkRow('isPlainObject(default)', document.createElement('div'), plainOut));
}
