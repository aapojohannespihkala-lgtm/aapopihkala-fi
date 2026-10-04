import { installPrivateModelLayerPanelUi } from './privateModelLayerPanelUi';

export const toolbarMenuAvailableHeight = (
  viewportHeight: number,
  panelTop: number,
) => Math.max(160, Math.floor(viewportHeight - panelTop - 10));

export const setupPrivateModelToolbarMenus = (toolbarMenus: HTMLDetailsElement[]) => {
  const closeToolbarMenus = (except: HTMLDetailsElement | null = null) => {
    toolbarMenus.forEach((menu) => {
      if (menu !== except) menu.open = false;
    });
  };

  const fitToolbarMenuToViewport = (menu: HTMLDetailsElement) => {
    const panel = menu.querySelector<HTMLElement>(':scope > .toolbar-menu-panel');
    if (!panel) return;

    panel.style.maxHeight = '';
    const panelTop = panel.getBoundingClientRect().top;
    panel.style.maxHeight = `${toolbarMenuAvailableHeight(window.innerHeight, panelTop)}px`;
  };

  toolbarMenus.forEach((menu) => {
    menu.addEventListener('toggle', () => {
      if (menu.open) {
        closeToolbarMenus(menu);
        requestAnimationFrame(() => fitToolbarMenuToViewport(menu));
      }
    });
    menu.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof Element && target.closest('button')) {
        menu.open = false;
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const openMenu = toolbarMenus.find((menu) => menu.open);
    if (!openMenu) return;

    event.preventDefault();
    openMenu.open = false;
    openMenu.querySelector<HTMLElement>(':scope > summary')?.focus();
  });

  document.addEventListener('pointerdown', (event) => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (toolbarMenus.some((menu) => menu.contains(target))) return;
    closeToolbarMenus();
  });

  queueMicrotask(installPrivateModelLayerPanelUi);

  window.addEventListener('resize', () => {
    toolbarMenus.forEach((menu) => {
      if (menu.open) fitToolbarMenuToViewport(menu);
    });
  });

  return { closeToolbarMenus };
};
