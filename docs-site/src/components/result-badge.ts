export function renderResultBadge(valid: boolean, label?: string): HTMLElement {
  const span = document.createElement('span');
  span.className = valid ? 'badge-valid' : 'badge-invalid';
  span.textContent = `${valid ? '✓' : '✗'} ${label ?? (valid ? 'valid' : 'invalid')}`;
  return span;
}
