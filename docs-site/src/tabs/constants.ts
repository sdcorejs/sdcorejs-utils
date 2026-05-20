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
};

export function renderConstants(el: HTMLElement): void {
  el.innerHTML = '';

  // ── VALIDATION_PATTERNS ──────────────────────────────────────────
  const sec1 = document.createElement('div');
  sec1.className = 'section';
  sec1.innerHTML = '<div class="section-title">VALIDATION_PATTERNS</div>';

  const search = document.createElement('input');
  search.type = 'text';
  search.placeholder = 'Search by type…';
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
  sec2.innerHTML = '<div class="section-title">OPERATORS</div>';

  const table2 = document.createElement('table');
  table2.innerHTML = '<thead><tr><th>value</th><th>symbol</th><th>display</th></tr></thead>';
  const tbody2 = document.createElement('tbody');
  for (const op of OPERATORS) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><code>${op.value}</code></td><td>${op.symbol}</td><td>${op.display}</td>`;
    tbody2.appendChild(tr);
  }
  table2.appendChild(tbody2);
  sec2.appendChild(table2);
  el.appendChild(sec2);

  // ── SUPPORTED_LANGUAGES ──────────────────────────────────────────
  const sec3 = document.createElement('div');
  sec3.className = 'section';
  sec3.innerHTML = `
    <div class="section-title">SUPPORTED_LANGUAGES</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${[...SUPPORTED_LANGUAGES].map(l =>
        `<span style="background:var(--accent-light);border-radius:4px;color:var(--primary);font-family:monospace;font-size:13px;padding:4px 10px">'${l}'</span>`
      ).join('')}
    </div>
  `;
  el.appendChild(sec3);
}

function buildPatternsTable(): HTMLTableElement {
  const table = document.createElement('table');
  table.innerHTML = '<thead><tr><th>type</th><th>pattern</th><th>sample valid input</th></tr></thead>';
  const tbody = document.createElement('tbody');
  for (const p of VALIDATION_PATTERNS) {
    const tr = document.createElement('tr');
    tr.dataset.type = p.type.toLowerCase();
    const truncated = p.pattern.length > 60 ? p.pattern.slice(0, 60) + '…' : p.pattern;
    tr.innerHTML = `
      <td><code style="color:var(--primary);font-weight:600">${p.type}</code></td>
      <td><code style="color:var(--text-muted);font-size:11px">${truncated}</code></td>
      <td><code style="color:var(--valid)">${SAMPLE_VALID[p.type] ?? ''}</code></td>
    `;
    // Set title attribute safely using setAttribute to avoid HTML injection
    const patternCodeEl = tr.querySelector('code:nth-of-type(2)');
    if (patternCodeEl) {
      patternCodeEl.setAttribute('title', p.pattern);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
}
