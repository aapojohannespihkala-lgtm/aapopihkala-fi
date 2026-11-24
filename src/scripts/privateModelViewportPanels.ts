import { DESKTOP_LAYERS_ICON } from './privateModelDesktopToolbar.mjs';

const panelIcons: Record<string, string> = {
  'orientation-gizmo': '<circle cx="12" cy="12" r="8"/><path d="m15 9-2 5-4 1 2-5z"/>',
  'point-pick-panel': '<path d="M12 21C12 21 5 14 5 9.5a7 7 0 1 1 14 0C19 14 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2"/>',
  'point-measure-panel': '<path d="M3 17 17 3l4 4L7 21zM8 12l2 2m2-6 2 2"/>',
  'axis-measure-row': '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M8 16h8m-8-2v4m8-4v4"/>',
  'height-scale': '<path d="M8 3v18m0-15h6m-6 4h4m-4 4h6m-6 4h4"/>',
  'profile-panel': '<path d="M4 4v16h16M6 15l4-6 4 4 5-6"/>',
  'selection-panel': '<path d="m6 4 12 9-6 1-2 5z"/>',
  'p137e-place-panel': '<circle cx="12" cy="12" r="6"/><path d="M12 3v5m0 8v5M3 12h5m8 0h5"/>',
  'd1-known-door-legend': '<rect x="7" y="3" width="10" height="18" rx="1"/><path d="M13 12h1"/>',
};
const sourceIcon = '<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6m-6 4h6"/>';

const icon = (content: string) =>
  `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`;

/** Minimize the overlay independently of the feature that owns its visibility and content. */
export function mountPrivateModelViewportPanels(viewport: HTMLElement, toolbarTools: HTMLElement) {
  const doc = viewport.ownerDocument;
  const dock = doc.createElement('div');
  dock.className = 'viewport-panel-dock';
  dock.hidden = true;
  dock.setAttribute('role', 'group');
  dock.setAttribute('aria-label', 'Pienennetyt ikkunat');
  toolbarTools.append(dock);

  const tabs = new Map<HTMLElement, HTMLButtonElement>();
  const sync = () => {
    for (const [panel, tab] of tabs) {
      tab.hidden = panel.hidden || !panel.hasAttribute('data-viewport-minimized');
    }
    dock.hidden = !Array.from(tabs.values()).some(tab => !tab.hidden);
  };
  const observer = new MutationObserver(sync);

  for (const panel of viewport.querySelectorAll<HTMLElement>(':scope > aside[id]')) {
    const heading = panel.querySelector('h2, .point-measure-header > strong');
    const title = panel.dataset.panelTitle ?? heading?.textContent?.trim() ??
      panel.getAttribute('aria-label');
    if (!title) continue;

    const minimize = doc.createElement('button');
    minimize.type = 'button';
    minimize.className = 'viewport-panel-minimize';
    minimize.title = `Pienennä: ${title}`;
    minimize.setAttribute('aria-label', minimize.title);
    minimize.setAttribute('aria-controls', panel.id);

    const header = panel.querySelector(':scope > :is(.layers-header, .profile-header, .selection-header, .point-measure-header)');
    if (header) {
      header.insertBefore(minimize, header.querySelector(':scope > button'));
    } else {
      minimize.classList.add('viewport-panel-minimize-float');
      panel.prepend(minimize);
    }

    const tab = doc.createElement('button');
    tab.type = 'button';
    tab.className = 'desk-icon viewport-panel-tab';
    tab.innerHTML = panel.id === 'layers-panel' ? DESKTOP_LAYERS_ICON : icon(panelIcons[panel.id] ?? sourceIcon);
    tab.title = `Palauta: ${title}`;
    tab.setAttribute('aria-label', tab.title);
    tab.setAttribute('aria-controls', panel.id);
    tab.setAttribute('aria-expanded', 'false');
    tab.hidden = true;
    dock.append(tab);
    tabs.set(panel, tab);

    minimize.addEventListener('click', () => {
      panel.setAttribute('data-viewport-minimized', '');
      sync();
      tab.focus();
    });
    tab.addEventListener('click', () => {
      panel.removeAttribute('data-viewport-minimized');
      sync();
      minimize.focus();
    });
    observer.observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  }
}
