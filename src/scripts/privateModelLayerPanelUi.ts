import {
  createViewerLayerControlsState,
  setViewerLayerNodeVisible,
  setViewerRoofOpacity,
  viewerLocusParentVisibilityState,
  type ViewerLayerControlsState,
  type ViewerLocusChildNodeId,
  type ViewerLayerNodeId,
} from './privateModelLayerHierarchyState';

const asInput = (selector: string) =>
  document.querySelector<HTMLInputElement>(selector);

const countIsPositive = (selector: string) => {
  const text = document.querySelector<HTMLElement>(selector)?.textContent ?? '';
  const match = text.match(/\d+/);
  return match ? Number(match[0]) > 0 : false;
};

const activeChildBindings = (): Array<{
  id: ViewerLocusChildNodeId;
  input: HTMLInputElement;
}> => {
  const p161 = document.querySelector<HTMLElement>('#p161-system-layer-children');
  if (p161 && !p161.hidden) {
    return [
      ['p161-kvv-2017', '#p161-kvv-visible', '#p161-kvv-count'],
      ['p161-iv-1974-plan', '#p161-iv-plan-visible', '#p161-iv-plan-count'],
      ['p161-iv-1974-section', '#p161-iv-section-visible', '#p161-iv-section-count'],
    ]
      .filter(([, , count]) => countIsPositive(count))
      .map(([id, selector]) => ({
        id: id as ViewerLocusChildNodeId,
        input: document.querySelector<HTMLInputElement>(selector)!,
      }))
      .filter((binding) => Boolean(binding.input));
  }

  const locus = document.querySelector<HTMLElement>('#locus-layer-children');
  if (!locus || locus.hidden) return [];
  return [
    ['locus-water', '#locus-water-visible', '#locus-water-count'],
    ['locus-wastewater', '#locus-wastewater-visible', '#locus-wastewater-count'],
  ]
    .filter(([, , count]) => countIsPositive(count))
    .map(([id, selector]) => ({
      id: id as ViewerLocusChildNodeId,
      input: document.querySelector<HTMLInputElement>(selector)!,
    }))
    .filter((binding) => Boolean(binding.input));
};

const childStatePatch = (
  state: ViewerLayerControlsState,
  id: ViewerLocusChildNodeId,
  checked: boolean,
) => setViewerLayerNodeVisible(state, id, checked);

const installPresentationControl = () => {
  const viewPanel = document.querySelector<HTMLElement>('#view-menu > .toolbar-menu-panel');
  const edgeSelect = document.querySelector<HTMLSelectElement>('#edge-mode-select');
  const legacySection = edgeSelect?.closest<HTMLElement>('.layer-section');
  if (!viewPanel || !edgeSelect || !legacySection) return;

  const separator = document.createElement('div');
  separator.className = 'toolbar-menu-separator';
  separator.dataset.vuxE3c = 'presentation-separator';

  const label = document.createElement('div');
  label.className = 'toolbar-menu-label';
  label.textContent = 'Esitystapa';
  label.dataset.vuxE3c = 'presentation-label';

  const control = document.createElement('label');
  control.className = 'layer-select';
  control.dataset.vuxE3c = 'presentation-control';
  const controlLabel = document.createElement('span');
  controlLabel.textContent = 'Reunaviivat';
  const presentationSelect = edgeSelect.cloneNode(true) as HTMLSelectElement;
  presentationSelect.id = 'edge-presentation-select';
  presentationSelect.setAttribute('aria-label', 'Reunaviivojen esitystapa');
  presentationSelect.value = edgeSelect.value;
  control.append(controlLabel, presentationSelect);
  viewPanel.append(separator, label, control);

  presentationSelect.addEventListener('change', () => {
    edgeSelect.value = presentationSelect.value;
    edgeSelect.dispatchEvent(new Event('change', { bubbles: true }));
  });
  edgeSelect.addEventListener('change', () => {
    presentationSelect.value = edgeSelect.value;
  });

  legacySection.dataset.vuxE3cLegacyPresentationProxy = 'true';
  legacySection.setAttribute('aria-hidden', 'true');
  legacySection.style.position = 'absolute';
  legacySection.style.width = '1px';
  legacySection.style.height = '1px';
  legacySection.style.margin = '0';
  legacySection.style.padding = '0';
  legacySection.style.border = '0';
  legacySection.style.overflow = 'hidden';
  legacySection.style.opacity = '0';
  edgeSelect.tabIndex = -1;
};

export const installPrivateModelLayerPanelUi = () => {
  const canvas = document.querySelector<HTMLCanvasElement>('#private-model-canvas');
  const layersPanel = document.querySelector<HTMLElement>('#layers-panel');
  const parentInput = asInput('#locus-layer-visible');
  const roofInput = asInput('#roof-layer-visible');
  const roofOpacity = asInput('#roof-layer-opacity');
  const resetButton = document.querySelector<HTMLButtonElement>('#reset-view-defaults-button');
  if (!canvas || !layersPanel || !parentInput || !roofInput || !roofOpacity) return;

  layersPanel.style.maxHeight = 'calc(100% - 24px)';
  layersPanel.style.overflowY = 'auto';
  layersPanel.style.overscrollBehavior = 'contain';
  const roofLabel = roofInput.closest('label')?.querySelector('span');
  if (roofLabel?.textContent?.trim() === 'Katto (testi)') roofLabel.textContent = 'Katto';

  installPresentationControl();

  let state = createViewerLayerControlsState({
    roofVisible: roofInput.checked,
    roofOpacity: Number(roofOpacity.value) / 100,
    locusVisible: parentInput.checked,
  });

  const setNode = (id: ViewerLayerNodeId, visible: boolean) => {
    state = setViewerLayerNodeVisible(state, id, visible);
  };

  const render = (restoreLegacyChildren: boolean) => {
    const children = activeChildBindings();

    if (restoreLegacyChildren && state.locusVisible) {
      for (const binding of children) {
        const desired =
          binding.id === 'locus-water'
            ? state.locusWaterVisible
            : binding.id === 'locus-wastewater'
              ? state.locusWastewaterVisible
              : binding.id === 'p161-kvv-2017'
                ? state.p161KvvVisible
                : binding.id === 'p161-iv-1974-plan'
                  ? state.p161IvPlanVisible
                  : state.p161IvSectionVisible;
        if (binding.input.checked !== desired) {
          binding.input.checked = desired;
          binding.input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }

    parentInput.checked = state.locusVisible;
    const activeIds = children.map((binding) => binding.id);
    const parentState = viewerLocusParentVisibilityState(state, activeIds);
    parentInput.indeterminate = parentState === 'mixed';
    canvas.dataset.locusLayerParentState = parentState;
    canvas.dataset.locusLayerVisible = state.locusVisible ? 'true' : 'false';
    canvas.dataset.layerLocusVisible = state.locusVisible ? 'true' : 'false';
    canvas.dataset.layerHierarchyController = 'vux-e3b';

    for (const binding of children) {
      const desired =
        binding.id === 'locus-water'
          ? state.locusWaterVisible
          : binding.id === 'locus-wastewater'
            ? state.locusWastewaterVisible
            : binding.id === 'p161-kvv-2017'
              ? state.p161KvvVisible
              : binding.id === 'p161-iv-1974-plan'
                ? state.p161IvPlanVisible
                : state.p161IvSectionVisible;
      binding.input.checked = desired;
      binding.input.disabled = !state.locusVisible;
      if (binding.id === 'locus-water') {
        canvas.dataset.locusWaterVisible = desired ? 'true' : 'false';
      } else if (binding.id === 'locus-wastewater') {
        canvas.dataset.locusWastewaterVisible = desired ? 'true' : 'false';
      } else if (binding.id === 'p161-kvv-2017') {
        canvas.dataset.p161KvvVisible = desired ? 'true' : 'false';
      } else if (binding.id === 'p161-iv-1974-plan') {
        canvas.dataset.p161IvPlanVisible = desired ? 'true' : 'false';
      } else {
        canvas.dataset.p161IvSectionVisible = desired ? 'true' : 'false';
      }
    }
  };

  const bindChild = (selector: string, id: ViewerLocusChildNodeId) => {
    const input = asInput(selector);
    input?.addEventListener(
      'change',
      () => {
        state = childStatePatch(state, id, input.checked);
        queueMicrotask(() => render(false));
      },
      { capture: true },
    );
  };

  parentInput.addEventListener(
    'change',
    () => {
      setNode('locus', parentInput.checked);
      queueMicrotask(() => render(state.locusVisible));
    },
    { capture: true },
  );

  bindChild('#locus-water-visible', 'locus-water');
  bindChild('#locus-wastewater-visible', 'locus-wastewater');
  bindChild('#p161-kvv-visible', 'p161-kvv-2017');
  bindChild('#p161-iv-plan-visible', 'p161-iv-1974-plan');
  bindChild('#p161-iv-section-visible', 'p161-iv-1974-section');

  roofInput.addEventListener(
    'change',
    () => {
      setNode('roof', roofInput.checked);
    },
    { capture: true },
  );
  roofOpacity.addEventListener(
    'input',
    () => {
      state = setViewerRoofOpacity(state, Number(roofOpacity.value) / 100);
    },
    { capture: true },
  );

  resetButton?.addEventListener(
    'click',
    () => {
      state = createViewerLayerControlsState({
        roofVisible: roofInput.checked,
        roofOpacity: 1,
        locusVisible: parentInput.checked,
      });
      queueMicrotask(() => render(false));
    },
    { capture: true },
  );

  const modelObserver = new MutationObserver((records) => {
    if (!records.some((record) => record.attributeName === 'data-model-source')) return;
    state = createViewerLayerControlsState({
      roofVisible: roofInput.checked,
      roofOpacity: Number(roofOpacity.value) / 100,
      locusVisible: parentInput.checked,
    });
    queueMicrotask(() => render(false));
  });
  modelObserver.observe(canvas, { attributes: true, attributeFilter: ['data-model-source'] });

  queueMicrotask(() => render(false));
};
