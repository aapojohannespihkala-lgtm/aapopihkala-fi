type ToolPanel = { opener: HTMLButtonElement; close?: () => void };

const panelIcons: Record<string, string> = {
  'height-scale': '<path d="M8 3v18m0-15h6m-6 4h4m-4 4h6m-6 4h4"/>',
  'd1-known-door-legend': '<rect x="7" y="3" width="10" height="18" rx="1"/><path d="M13 12h1"/>',
};
const sourceIcon = '<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6m-6 4h6"/>';

const icon = (content: string) =>
  `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`;

/** Minimize the overlay independently of the feature that owns its visibility and content. */
export function mountPrivateModelViewportPanels(
  viewport: HTMLElement,
  toolbarTools: HTMLElement,
  cubeButton: HTMLButtonElement,
  toolPanels: Record<string, ToolPanel>,
) {
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
  const focusOpener = (opener: HTMLButtonElement) => {
    (opener.closest('details')?.querySelector<HTMLElement>(':scope > summary') ?? opener).focus();
  };

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

    if (panel.id === 'orientation-gizmo') {
      const setCubeVisible = (visible: boolean) => {
        panel.toggleAttribute('data-viewport-minimized', !visible);
        cubeButton.setAttribute('aria-expanded', String(visible));
        cubeButton.title = visible ? 'Pienennä suuntailmaisin' : 'Näytä suuntailmaisin';
      };
      cubeButton.addEventListener('click', () => setCubeVisible(panel.hasAttribute('data-viewport-minimized')));
      minimize.addEventListener('click', () => {
        setCubeVisible(false);
        cubeButton.focus();
      });
      continue;
    }

    const tool = toolPanels[panel.id];
    if (tool) {
      minimize.addEventListener('click', () => {
        if (tool.close) tool.close();
        else panel.setAttribute('data-viewport-minimized', '');
        focusOpener(tool.opener);
      });
      tool.opener.addEventListener('click', (event) => {
        if (!panel.hasAttribute('data-viewport-minimized')) return;
        panel.removeAttribute('data-viewport-minimized');
        if (panel.hidden) return;
        // Reselecting the active tool restores its window and keeps its state.
        event.stopImmediatePropagation();
        const menu = tool.opener.closest('details');
        if (menu) menu.open = false;
      }, { capture: true });
      continue;
    }

    const tab = doc.createElement('button');
    tab.type = 'button';
    tab.className = 'desk-icon viewport-panel-tab';
    tab.innerHTML = icon(panelIcons[panel.id] ?? sourceIcon);
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
