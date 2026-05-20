export function renderCodeBlock(code: string): HTMLElement {
  const pre = document.createElement('pre');
  pre.className = 'code-block';
  pre.innerHTML = highlightTS(code);
  return pre;
}

function highlightTS(code: string): string {
  return code
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/'([^']*)'/g, '<span class="st">\'$1\'</span>')
    .replace(
      /\b(export|type|interface|const|let|readonly|extends|import|from|return|async|await|string|boolean|number|void|null|undefined|Promise|Array)\b/g,
      '<span class="kw">$1</span>'
    )
    .replace(/\/\/.*/g, '<span class="cm">$&</span>');
}
