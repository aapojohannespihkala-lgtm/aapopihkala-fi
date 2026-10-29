import {
  createViewerLayerModeMap,
  getViewerLayerEffectiveMode,
  getViewerLayerParentMode,
  viewerLayerNodeCapabilities,
  type ViewerLayerNodeId,
  type ViewerLayerParentMode,
  type ViewerLayerVisibilityMode,
} from './privateModelLayerHierarchyState';
import type {
  ViewerInteractionState,
  ViewerLayerPreset,
} from './privateModelViewerState';

export type ViewerLayerPanelGroup = 'Rakenteet' | 'Sisältö' | 'Tekniset järjestelmät';

export type ViewerLayerPanelItem = {
  id: ViewerLayerNodeId;
  label: string;
  mode: ViewerLayerParentMode;
  effectiveMode: ViewerLayerVisibilityMode;
};

export type ViewerLayerPanelGroupModel = {
  label: ViewerLayerPanelGroup;
  items: ViewerLayerPanelItem[];
};

export type ViewerLayerPanelModel = {
  selectedPreset: ViewerLayerPreset | null;
  customized: boolean;
  groups: ViewerLayerPanelGroupModel[];
};

/**
 * Labels deliberately cover only existing hierarchy IDs.
 * The caller MUST derive availableNodeIds from explicit trusted model metadata.
 * Listing a known hierarchy ID here does not assert the current GLB contains it.
 */
const layerGroups: ReadonlyArray<{
  label: ViewerLayerPanelGroup;
  items: ReadonlyArray<readonly [ViewerLayerNodeId, string]>;
}> = [
  {
    label: 'Rakenteet',
    items: [
      ['architecture', 'Rakenteet'],
      ['architecture-walls', 'Seinät'],
      ['architecture-walls-exterior', 'Ulkoseinät'],
      ['architecture-walls-party', 'Yhteiset seinät'],
      ['architecture-walls-interior', 'Väliseinät'],
      ['architecture-floors', 'Lattiat'],
      ['architecture-ceilings', 'Sisäkatot'],
      ['roof', 'Vesikatto'],
      ['architecture-doors', 'Ovet'],
      ['architecture-windows', 'Ikkunat'],
      ['architecture-review-helpers', 'Tarkastelun apukohteet'],
    ],
  },
  {
    label: 'Sisältö',
    items: [
      ['architecture-fixtures', 'Kiintokalusteet'],
      ['architecture-other', 'Muut luokitellut kohteet'],
    ],
  },
  {
    label: 'Tekniset järjestelmät',
    items: [
      ['locus', 'Tekniset järjestelmät'],
      ['locus-water', 'Vesi'],
      ['locus-wastewater', 'Viemärit'],
      ['p161-kvv-2017', 'KVV 2017'],
      ['p161-iv-1974-plan', 'IV 1974, suunnitelma'],
      ['p161-iv-1974-section', 'IV 1974, leikkaus'],
    ],
  },
];

export const viewerLayerPresetChoices = [
  ['whole-building', 'Koko rakennus'],
  ['d-apartment', 'D-asunto'],
  ['d-1f', 'D alakerta'],
  ['d-2f', 'D yläkerta'],
  ['site', 'Tontti'],
  ['infra', 'Infra'],
] as const satisfies ReadonlyArray<readonly [ViewerLayerPreset, string]>;

const isLayerId = (id: string): id is ViewerLayerNodeId =>
  Object.prototype.hasOwnProperty.call(viewerLayerNodeCapabilities, id);

const isPreset = (id: string): id is ViewerLayerPreset =>
  viewerLayerPresetChoices.some(([preset]) => preset === id);

export const buildViewerLayerPanelModel = (
  state: ViewerInteractionState,
  availableNodeIds: readonly string[],
): ViewerLayerPanelModel => {
  // No extra layer is inferred from a preset, scene name, G2 status or appearance.
  const available = new Set(availableNodeIds.filter(isLayerId));
  const modes = state.layerPresetState?.modes ?? createViewerLayerModeMap(state.layers);

  return {
    selectedPreset: state.layerPresetState?.selected ??
      (isPreset(state.researchPreset) ? state.researchPreset : null),
    customized: state.layerPresetState?.customized ?? false,
    groups: layerGroups.map((group) => ({
      label: group.label,
      items: group.items.filter(([id]) => available.has(id)).map(([id, label]) => {
        const children = (Object.keys(viewerLayerNodeCapabilities) as ViewerLayerNodeId[])
          .filter((child) =>
            available.has(child) && viewerLayerNodeCapabilities[child].parent === id,
          );
        return {
          id,
          label,
          mode: children.length ? getViewerLayerParentMode(modes, id, children) : modes[id],
          effectiveMode: getViewerLayerEffectiveMode(modes, id),
        };
      }),
    })).filter((group) => group.items.length > 0),
  };
};

export type ViewerLayerPresetPanelCallbacks = {
  onPresetChange: (preset: ViewerLayerPreset) => void;
  onLayerModeChange: (id: ViewerLayerNodeId, mode: ViewerLayerVisibilityMode) => void;
  onReset: () => void;
};

const modeOptions = [
  ['visible', 'Näkyvä'],
  ['ghost', 'Himmeä'],
  ['hidden', 'Piilossa'],
] as const;

/**
 * A self-contained control surface, intentionally NOT auto-installed.
 * WP3's sole index.astro writer must call update() with actual application
 * state, wire the callbacks through the existing viewer and enforce GLB
 * scope/floor/source gates before allowing any rendering change.
 */
export const mountViewerLayerPresetPanel = (
  host: HTMLElement,
  state: ViewerInteractionState,
  availableNodeIds: readonly string[],
  callbacks: ViewerLayerPresetPanelCallbacks,
) => {
  if (host.querySelector('[data-layer-preset-panel]')) {
    throw new Error('Layers preset controls already mounted');
  }

  const doc = host.ownerDocument;
  const root = doc.createElement('section');
  root.dataset.layerPresetPanel = 'wp3';
  const label = doc.createElement('label');
  label.textContent = 'Layer preset';
  const presetSelect = doc.createElement('select');
  presetSelect.setAttribute('aria-label', 'Layer preset');
  label.append(presetSelect);
  const customizedText = doc.createElement('span');
  customizedText.setAttribute('aria-live', 'polite');
  customizedText.dataset.layerPresetCustomized = '';
  const reset = doc.createElement('button');
  reset.type = 'button';
  reset.textContent = 'Palauta presetin asetukset';
  const groups = doc.createElement('div');
  groups.dataset.layerPresetGroups = '';
  root.append(label, customizedText, reset, groups);
  host.insertBefore(root, host.firstChild);

  for (const [id, title] of viewerLayerPresetChoices) {
    const option = doc.createElement('option');
    option.value = id;
    option.textContent = title;
    presetSelect.append(option);
  }
  // Legacy Salaojat/Sähköt research presets remain separate and untouched.
  const legacyOption = doc.createElement('option');
  legacyOption.value = '';
  legacyOption.textContent = 'Valitse preset';
  presetSelect.prepend(legacyOption);

  presetSelect.addEventListener('change', () => {
    if (isPreset(presetSelect.value)) callbacks.onPresetChange(presetSelect.value);
  });
  reset.addEventListener('click', () => callbacks.onReset());

  let destroyed = false;
  const update = (next: ViewerInteractionState, available: readonly string[]) => {
    if (destroyed) throw new Error('Layers preset controls already destroyed');
    const model = buildViewerLayerPanelModel(next, available);
    presetSelect.value = model.selectedPreset ?? '';
    customizedText.textContent = model.customized ? 'Mukautettu' : '';
    reset.disabled = !model.selectedPreset || !model.customized;
    groups.replaceChildren();

    for (const group of model.groups) {
      const section = doc.createElement('section');
      section.dataset.layerGroup = group.label;
      const heading = doc.createElement('h3');
      heading.textContent = group.label;
      section.append(heading);

      for (const item of group.items) {
        const field = doc.createElement('label');
        field.dataset.layerNode = item.id;
        const name = doc.createElement('span');
        name.textContent = item.label;
        const select = doc.createElement('select');
        select.setAttribute('aria-label', item.label + ', näkyvyys');
        for (const [mode, title] of modeOptions) {
          const option = doc.createElement('option');
          option.value = mode;
          option.textContent = title;
          select.append(option);
        }
        if (item.mode === 'mixed') {
          const option = doc.createElement('option');
          option.value = 'mixed';
          option.textContent = 'Osittainen';
          option.disabled = true;
          select.prepend(option);
        }
        select.value = item.mode;
        select.dataset.effectiveMode = item.effectiveMode;
        select.addEventListener('change', () => {
          if (select.value === 'visible' || select.value === 'ghost' ||
              select.value === 'hidden') {
            callbacks.onLayerModeChange(item.id, select.value);
          }
        });
        field.append(name, select);
        section.append(field);
      }
      groups.append(section);
    }
  };

  update(state, availableNodeIds);
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    root.remove();
  };
  return { root, update, destroy };
};
