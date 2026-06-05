import './style.css';
import { renderTabBar } from './components/tab-bar';
import { renderConstants } from './tabs/constants';
import { renderModels } from './tabs/models';
import { renderValidation } from './tabs/validation';
import { renderFunctions } from './tabs/functions';
import { renderFilter } from './tabs/filter';

const TABS = [
  { id: 'constants',  label: 'Constants' },
  { id: 'models',     label: 'Models' },
  { id: 'validation', label: 'Validation Playground' },
  { id: 'functions',  label: 'Functions Demo' },
  { id: 'filter',     label: 'Filter Playground' },
];

type TabId = 'constants' | 'models' | 'validation' | 'functions' | 'filter';

const RENDERERS: Record<TabId, (el: HTMLElement) => void> = {
  constants:  renderConstants,
  models:     renderModels,
  validation: renderValidation,
  functions:  renderFunctions,
  filter:     renderFilter,
};

function mount(): void {
  const app = document.getElementById('app')!;

  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="header-inner">
      <span class="header-logo">@sdcorejs/utils</span>
      <a class="header-link" href="https://github.com/sdcorejs/sdcorejs-utils" target="_blank" rel="noreferrer">GitHub ↗</a>
    </div>
  `;
  app.appendChild(header);

  let activeTab: TabId = 'validation';
  const content = document.createElement('main');
  content.className = 'tab-content';

  const tabBar = renderTabBar(TABS, activeTab, (id) => {
    if (!(id in RENDERERS)) return;
    activeTab = id as TabId;
    tabBar.querySelectorAll<HTMLButtonElement>('.tab-btn').forEach(btn =>
      btn.classList.toggle('active', btn.dataset.tab === id)
    );
    content.replaceChildren();
    RENDERERS[activeTab](content);
  });

  app.appendChild(tabBar);
  app.appendChild(content);
  RENDERERS[activeTab](content);
}

mount();
