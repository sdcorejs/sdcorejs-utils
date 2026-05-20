import { VALIDATION_PATTERNS, OPERATORS, SUPPORTED_LANGUAGES } from '@sdcorejs/utils/constants';

const SAMPLE_VALID: Record<string, string> = {
  EMAIL: 'user@example.com',      PHONE: '+84901234567',
  VN_PHONE: '0912345678',         VN_ID: '001234567890',
  PASSPORT: 'B1234567',           VN_ID_OR_PASSPORT: '001234567890',
  TIME: '09:30',                  URL: 'https://example.com',
  DOMAIN: 'example.com',          IPV4: '192.168.1.1',
  IPV6: '2001:db8::1',            IMAGE_URL: 'https://cdn.example.com/img.jpg',
  SLUG: 'hello-world',            NUMBER: '-3.14',
  INTEGER: '42',                  DECIMAL: '3.14',
  POSITIVE_NUMBER: '10',          UUID: '550e8400-e29b-41d4-a716-446655440000',
  CODE_16: 'ABCDEF1234567890',    CODE_32: 'ABCDEF1234567890abcdef1234567890',
  HEX_COLOR: '#1A2B3C',           BASE64: 'SGVsbG8=',
  // keep in sync with VALIDATION_PATTERNS types
};

export function renderConstants(el: HTMLElement): void {
  el.innerHTML = '';

  // ── VALIDATION_PATTERNS ──────────────────────────────────────────
  const sec1 = document.createElement('div');
  sec1.className = 'section';
  const title1 = document.createElement('div');
  title1.className = 'section-title';
  title1.textContent = 'VALIDATION_PATTERNS';
  sec1.appendChild(title1);

  const search = document.createElement('input');
  search.type = 'text';
  search.placeholder = 'Search by type (e.g. EMAIL, VN_PHONE)…';
  search.className = 'search-bar';
  sec1.appendChild(search);

  const table1 = buildPatternsTable();
  sec1.appendChild(table1);

  search.addEventListener('input', () => {
    const q = search.value.toLowerCase();
    table1.querySelectorAll<HTMLTableRowElement>('tbody tr').forEach(row => {
      row.style.display = row.dataset.type?.includes(q) ? '' : 'none';
    });
  });

  el.appendChild(sec1);

  // ── OPERATORS ────────────────────────────────────────────────────
  const sec2 = document.createElement('div');
  sec2.className = 'section';
  const title2 = document.createElement('div');
  title2.className = 'section-title';
  title2.textContent = 'OPERATORS';
  sec2.appendChild(title2);

  const table2 = document.createElement('table');
  const thead2 = document.createElement('thead');
  thead2.innerHTML = '<tr><th>value</th><th>symbol</th><th>display</th></tr>';
  table2.appendChild(thead2);
  const tbody2 = document.createElement('tbody');
  for (const op of OPERATORS) {
    const tr = document.createElement('tr');
    const td1 = document.createElement('td');
    const code = document.createElement('code');
    code.textContent = op.value;
    td1.appendChild(code);
    const td2 = document.createElement('td');
    td2.textContent = op.symbol ?? '';
    const td3 = document.createElement('td');
    td3.textContent = op.display;
    tr.append(td1, td2, td3);
    tbody2.appendChild(tr);
  }
  table2.appendChild(tbody2);
  sec2.appendChild(table2);
  el.appendChild(sec2);

  // ── SUPPORTED_LANGUAGES ──────────────────────────────────────────
  const sec3 = document.createElement('div');
  sec3.className = 'section';
  const title3 = document.createElement('div');
  title3.className = 'section-title';
  title3.textContent = 'SUPPORTED_LANGUAGES';
  sec3.appendChild(title3);
  const badges = document.createElement('div');
  badges.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
  for (const lang of SUPPORTED_LANGUAGES) {
    const span = document.createElement('span');
    span.style.cssText = "background:var(--accent-light);border-radius:4px;color:var(--primary);font-family:monospace;font-size:13px;padding:4px 10px";
    span.textContent = `'${lang}'`;
    badges.appendChild(span);
  }
  sec3.appendChild(badges);
  el.appendChild(sec3);
}

function buildPatternsTable(): HTMLTableElement {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>type</th><th>pattern</th><th>sample valid input</th></tr>';
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  for (const p of VALIDATION_PATTERNS) {
    const tr = document.createElement('tr');
    tr.dataset.type = p.type.toLowerCase();

    // type cell
    const tdType = document.createElement('td');
    const codeType = document.createElement('code');
    codeType.style.cssText = 'color:var(--primary);font-weight:600';
    codeType.textContent = p.type;
    tdType.appendChild(codeType);

    // pattern cell — truncate display, full pattern in title
    const tdPattern = document.createElement('td');
    const codePattern = document.createElement('code');
    codePattern.className = 'pattern-cell';
    codePattern.style.cssText = 'color:var(--text-muted);font-size:11px';
    const truncated = p.pattern.length > 60 ? p.pattern.slice(0, 60) + '…' : p.pattern;
    codePattern.textContent = truncated;
    codePattern.setAttribute('title', p.pattern);
    tdPattern.appendChild(codePattern);

    // sample cell
    const tdSample = document.createElement('td');
    const codeSample = document.createElement('code');
    codeSample.style.cssText = 'color:var(--valid)';
    codeSample.textContent = SAMPLE_VALID[p.type] ?? '';
    tdSample.appendChild(codeSample);

    tr.append(tdType, tdPattern, tdSample);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
}
