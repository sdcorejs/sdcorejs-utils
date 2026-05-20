import { ValidationUtilities } from '@sdcorejs/utils/fns';
import { VALIDATION_PATTERNS } from '@sdcorejs/utils/constants';
import type { ValidationPatternType } from '@sdcorejs/utils/models';
import { renderResultBadge } from '../components/result-badge';

const GROUPS: { label: string; types: ValidationPatternType[] }[] = [
  { label: 'Vietnamese',    types: ['VN_PHONE', 'VN_ID', 'VN_ID_OR_PASSPORT'] },
  { label: 'Common',        types: ['EMAIL', 'PHONE', 'PASSPORT', 'TIME'] },
  { label: 'Web / Network', types: ['URL', 'DOMAIN', 'IPV4', 'IPV6', 'IMAGE_URL', 'SLUG'] },
  { label: 'Numeric',       types: ['NUMBER', 'INTEGER', 'DECIMAL', 'POSITIVE_NUMBER'] },
  { label: 'Identifiers',   types: ['UUID', 'CODE_16', 'CODE_32', 'HEX_COLOR', 'BASE64'] },
];

export function renderValidation(el: HTMLElement): void {
  el.innerHTML = '';

  const titleEl = document.createElement('div');
  titleEl.className = 'section-title';
  titleEl.textContent = 'Validation Playground';
  el.appendChild(titleEl);

  const split = document.createElement('div');
  split.className = 'split';

  // ── LEFT PANEL ───────────────────────────────────────────────────
  const left = document.createElement('div');
  left.className = 'panel';

  const panelTitleLeft = document.createElement('div');
  panelTitleLeft.className = 'panel-title';
  panelTitleLeft.textContent = 'Input';
  left.appendChild(panelTitleLeft);

  // value input
  const valueLabel = document.createElement('label');
  valueLabel.style.cssText = 'font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px';
  valueLabel.textContent = 'Value';
  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.id = 'val-input';
  valueInput.placeholder = 'Enter a value to validate…';
  const valueWrap = document.createElement('div');
  valueWrap.style.marginBottom = '12px';
  valueWrap.appendChild(valueLabel);
  valueWrap.appendChild(valueInput);
  left.appendChild(valueWrap);

  // pattern select
  const patternLabel = document.createElement('label');
  patternLabel.style.cssText = 'font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px';
  patternLabel.textContent = 'Pattern';
  const select = document.createElement('select');
  select.id = 'val-type';
  for (const group of GROUPS) {
    const og = document.createElement('optgroup');
    og.label = group.label;
    for (const type of group.types) {
      const opt = document.createElement('option');
      opt.value = type;
      opt.textContent = type;
      og.appendChild(opt);
    }
    select.appendChild(og);
  }
  const selectWrap = document.createElement('div');
  selectWrap.style.marginBottom = '16px';
  selectWrap.appendChild(patternLabel);
  selectWrap.appendChild(select);
  left.appendChild(selectWrap);

  // validate button
  const btn = document.createElement('button');
  btn.className = 'btn-primary';
  btn.textContent = 'Validate';
  left.appendChild(btn);

  // ── RIGHT PANEL ──────────────────────────────────────────────────
  const right = document.createElement('div');
  right.className = 'panel';

  const panelTitleRight = document.createElement('div');
  panelTitleRight.className = 'panel-title';
  panelTitleRight.textContent = 'Result';
  right.appendChild(panelTitleRight);

  const resultEl = document.createElement('div');
  resultEl.style.minHeight = '160px';
  const placeholder = document.createElement('p');
  placeholder.style.cssText = 'color:var(--text-muted);font-size:13px';
  placeholder.textContent = 'Enter a value to validate.';
  resultEl.appendChild(placeholder);
  right.appendChild(resultEl);

  split.appendChild(left);
  split.appendChild(right);
  el.appendChild(split);

  // ── RUN LOGIC ────────────────────────────────────────────────────
  const run = (): void => {
    const type = select.value as ValidationPatternType;
    const value = valueInput.value;
    if (!value) {
      resultEl.replaceChildren();
      const p = document.createElement('p');
      p.style.cssText = 'color:var(--text-muted);font-size:13px';
      p.textContent = 'Enter a value to validate.';
      resultEl.appendChild(p);
      return;
    }
    const valid = ValidationUtilities.validate(type, value);
    const pattern = VALIDATION_PATTERNS.find(p => p.type === type)?.pattern ?? '';

    resultEl.replaceChildren();
    resultEl.appendChild(renderResultBadge(valid));

    const patternTypeLabel = document.createElement('div');
    patternTypeLabel.style.cssText = 'margin-top:12px;font-size:12px;color:var(--text-muted)';
    patternTypeLabel.textContent = 'Pattern type';
    resultEl.appendChild(patternTypeLabel);

    const patternTypeValue = document.createElement('div');
    patternTypeValue.style.cssText = 'font-family:monospace;font-weight:600;color:var(--primary);margin-top:2px';
    patternTypeValue.textContent = type;
    resultEl.appendChild(patternTypeValue);

    const regexLabel = document.createElement('div');
    regexLabel.style.cssText = 'margin-top:12px;font-size:12px;color:var(--text-muted)';
    regexLabel.textContent = 'Regex';
    resultEl.appendChild(regexLabel);

    const regexValue = document.createElement('div');
    regexValue.style.cssText = 'font-family:monospace;font-size:11px;color:var(--text-muted);margin-top:4px;word-break:break-all';
    regexValue.textContent = pattern;
    resultEl.appendChild(regexValue);

    const snippet = document.createElement('pre');
    snippet.className = 'code-block';
    snippet.style.fontSize = '11px';
    snippet.style.marginTop = '16px';
    snippet.textContent = `ValidationUtilities.validate('${type}', '${value}')\n// → ${valid}`;
    resultEl.appendChild(snippet);
  };

  let timer: ReturnType<typeof setTimeout>;
  valueInput.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 300); });
  valueInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { clearTimeout(timer); run(); } });
  btn.addEventListener('click', run);
  select.addEventListener('change', run);
}
