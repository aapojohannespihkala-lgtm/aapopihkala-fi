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
  root.className = 'yl-layer-preset-panel';
  root.setAttribute('aria-label', 'Tasojen näkyvyys');
  const label = doc.createElement('label');
  label.className = 'yl-layer-preset-field';
  const labelText = doc.createElement('span');
  labelText.textContent = 'Näkymän esiasetus';
  const presetSelect = doc.createElement('select');
  presetSelect.setAttribute('aria-label', 'Näkymän esiasetus');
  label.append(labelText, presetSelect);
  const description = doc.createElement('p');
  description.className = 'yl-layer-preset-help';
  description.textContent = 'Esiasetus valitsee tasojen lähtönäkyvyyden. Voit muuttaa tasoja yksitellen.';
  const status = doc.createElement('div');
  status.className = 'yl-layer-preset-status';
  const customizedText = doc.createElement('span');
  customizedText.setAttribute('aria-live', 'polite');
  customizedText.dataset.layerPresetCustomized = '';
  const reset = doc.createElement('button');
  reset.type = 'button';
  reset.className = 'yl-layer-preset-reset';
  reset.textContent = 'Palauta presetin asetukset';
  status.append(customizedText, reset);
  const legend = doc.createElement('p');
  legend.className = 'yl-layer-preset-help';
  legend.textContent = 'Himmeä = läpikuultava esitystapa, ei tiedon varmuustaso.';
  const groups = doc.createElement('div');
  groups.className = 'yl-layer-preset-groups';
  groups.dataset.layerPresetGroups = '';
  root.append(label, description, status, legend, groups);
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
  legacyOption.textContent = 'Valitse esiasetus';
  presetSelect.prepend(legacyOption);

  presetSelect.addEventListener('change', () => {
    if (isPreset(presetSelect.value)) callbacks.onPresetChange(presetSelect.value);
  });
  reset.addEventListener('click', () => callbacks.onReset());

  let destroyed = false;
  const update = (next: ViewerInteractionState, available: readonly string[]) => {
    if (destroyed) throw new Error('Layers preset controls already destroyed');
    const model = buildViewerLayerPanelModel(next, available);
    // update() may be called synchronously from an onLayerModeChange callback.
    // Preserve keyboard focus when replacing only the metadata-gated rows.
    const focused = doc.activeElement;
    const focusedLayer = focused instanceof (doc.defaultView?.HTMLSelectElement ?? Object)
      && root.contains(focused) && focused.hasAttribute('data-layer-mode-control')
      ? focused.closest('[data-layer-node]')?.getAttribute('data-layer-node')
      : null;
    presetSelect.value = model.selectedPreset ?? '';
    customizedText.textContent = model.customized
      ? 'Mukautettu'
      : model.selectedPreset ? 'Oletusasetukset' : 'Ei valittua esiasetusta';
    customizedText.dataset.customized = String(model.customized);
    reset.disabled = !model.selectedPreset || !model.customized;
    groups.replaceChildren();
    if (model.groups.length === 0) {
      const empty = doc.createElement('p');
      empty.className = 'yl-layer-preset-empty';
      empty.textContent = 'Tasoryhmiä ei voi näyttää: mallista puuttuu vahvistettu tasometadata.';
      groups.append(empty);
    }

    for (const group of model.groups) {
      const section = doc.createElement('section');
      section.dataset.layerGroup = group.label;
      section.className = 'yl-layer-preset-group';
      const heading = doc.createElement('h3');
      heading.textContent = group.label;
      section.append(heading);

      for (const item of group.items) {
        const field = doc.createElement('label');
        field.dataset.layerNode = item.id;
        field.className = 'yl-layer-preset-row';
        field.dataset.mixed = String(item.mode === 'mixed');
        const name = doc.createElement('span');
        name.textContent = item.label;
        const select = doc.createElement('select');
        select.dataset.layerModeControl = '';
        select.setAttribute('aria-label', item.label + ', näkyvyys' +
          (item.mode === 'mixed' ? ', osittainen' : ''));
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
        if (item.mode === 'mixed') {
          const mixedHelp = doc.createElement('small');
          mixedHelp.className = 'yl-layer-preset-mixed';
          mixedHelp.textContent = 'Osittainen: alaryhmillä eri näkyvyys';
          field.append(mixedHelp);
        }
        section.append(field);
      }
      groups.append(section);
    }
    if (focusedLayer) {
      const restored = Array.from(groups.querySelectorAll<HTMLLabelElement>('[data-layer-node]'))
        .find((row) => row.dataset.layerNode === focusedLayer)
        ?.querySelector<HTMLSelectElement>('select[data-layer-mode-control]');
      restored?.focus({ preventScroll: true });
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
