export function renderTabBar(
  tabs: { id: string; label: string }[],
  activeId: string,
  onSelect: (id: string) => void
): HTMLElement {
  const nav = document.createElement('nav');
  nav.className = 'tab-bar';
  for (const tab of tabs) {
    const btn = document.createElement('button');
    btn.className = `tab-btn${tab.id === activeId ? ' active' : ''}`;
    btn.dataset.tab = tab.id;
    btn.textContent = tab.label;
    btn.addEventListener('click', () => onSelect(tab.id));
    nav.appendChild(btn);
  }
  return nav;
}
