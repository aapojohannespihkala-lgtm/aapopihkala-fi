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
  const matches = text.match(/\d+/g);
  if (!matches?.length) return false;
  return Number(matches[matches.length - 1]) > 0;
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

  const childPreference = (id: ViewerLocusChildNodeId) =>
    id === 'locus-water'
      ? state.locusWaterVisible
      : id === 'locus-wastewater'
        ? state.locusWastewaterVisible
        : id === 'p161-kvv-2017'
          ? state.p161KvvVisible
          : id === 'p161-iv-1974-plan'
            ? state.p161IvPlanVisible
            : state.p161IvSectionVisible;

  const syncChildAvailability = () => {
    const bindings: Array<{
      id: ViewerLocusChildNodeId;
      selector: string;
      count: string;
      container: string;
    }> = [
      {
        id: 'locus-water',
        selector: '#locus-water-visible',
        count: '#locus-water-count',
        container: '#locus-layer-children',
      },
      {
        id: 'locus-wastewater',
        selector: '#locus-wastewater-visible',
        count: '#locus-wastewater-count',
        container: '#locus-layer-children',
      },
      {
        id: 'p161-kvv-2017',
        selector: '#p161-kvv-visible',
        count: '#p161-kvv-count',
        container: '#p161-system-layer-children',
      },
      {
        id: 'p161-iv-1974-plan',
        selector: '#p161-iv-plan-visible',
        count: '#p161-iv-plan-count',
        container: '#p161-system-layer-children',
      },
      {
        id: 'p161-iv-1974-section',
        selector: '#p161-iv-section-visible',
        count: '#p161-iv-section-count',
        container: '#p161-system-layer-children',
      },
    ];

    for (const binding of bindings) {
      const input = asInput(binding.selector);
      const container = document.querySelector<HTMLElement>(binding.container);
      if (!input || !container) continue;
      const available = !container.hidden && countIsPositive(binding.count);
      input.checked = childPreference(binding.id);
      input.disabled = !state.locusVisible || !available;
    }
  };

  const render = () => {
    const children = activeChildBindings();
    parentInput.checked = state.locusVisible;
    const activeIds = children.map((binding) => binding.id);
    const parentState = viewerLocusParentVisibilityState(state, activeIds);
    parentInput.indeterminate = parentState === 'mixed';
    canvas.dataset.locusLayerParentState = parentState;
    canvas.dataset.layerHierarchyController = 'vux-e3b';
    syncChildAvailability();
  };

  const bindChild = (selector: string, id: ViewerLocusChildNodeId) => {
    const input = asInput(selector);
    input?.addEventListener(
      'change',
      () => {
        state = childStatePatch(state, id, input.checked);
        queueMicrotask(render);
      },
      { capture: true },
    );
  };

  let replayingLegacyParent = false;
  parentInput.addEventListener(
    'change',
    (event) => {
      if (replayingLegacyParent) return;

      event.stopImmediatePropagation();
      setNode('locus', parentInput.checked);
      const desiredParentVisible = state.locusVisible;

      replayingLegacyParent = true;
      parentInput.checked = desiredParentVisible;
      parentInput.dispatchEvent(new Event('change', { bubbles: true }));
      replayingLegacyParent = false;

      if (desiredParentVisible) {
        for (const binding of activeChildBindings()) {
          const desired = childPreference(binding.id);
          if (binding.input.checked === desired) continue;
          binding.input.checked = desired;
          binding.input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      queueMicrotask(render);
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
      queueMicrotask(render);
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
    queueMicrotask(render);
  });
  modelObserver.observe(canvas, { attributes: true, attributeFilter: ['data-model-source'] });

  queueMicrotask(render);
};
