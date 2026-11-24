/** Minimize the overlay independently of the feature that owns its visibility and content. */
export function mountPrivateModelViewportPanels(viewport: HTMLElement) {
  const doc = viewport.ownerDocument;
  const dock = doc.createElement('div');
  dock.className = 'viewport-panel-dock';
  dock.hidden = true;
  dock.setAttribute('role', 'group');
  dock.setAttribute('aria-label', 'Pienennetyt ikkunat');
  viewport.append(dock);

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
    minimize.textContent = '−';
    minimize.title = `Pienennä: ${title}`;
    minimize.setAttribute('aria-label', minimize.title);
    minimize.setAttribute('aria-controls', panel.id);

    const header = panel.querySelector(':scope > :is(.layers-header, .profile-header, .selection-header, .point-measure-header)');
    if (header) {
      header.insertBefore(minimize, header.querySelector('button'));
    } else {
      minimize.classList.add('viewport-panel-minimize-float');
      panel.prepend(minimize);
    }

    const tab = doc.createElement('button');
    tab.type = 'button';
    tab.className = 'viewport-panel-tab';
    tab.textContent = title;
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
