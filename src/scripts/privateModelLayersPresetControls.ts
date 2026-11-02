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
      ['technical', 'Tekniset laitteet'],
      ['technical-ventilation', 'IV-laitteet ja venttiilit'],
      ['technical-heating', 'Patterit ja ILP'],
      ['technical-electrical', 'Sähkölaitteet ja valaisimet'],
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

const isPreset = (id: unknown): id is ViewerLayerPreset =>
  typeof id === 'string' &&
  viewerLayerPresetChoices.some(([preset]) => preset === id);

export const buildViewerLayerPanelModel = (
  state: ViewerInteractionState,
  availableNodeIds: readonly string[],
): ViewerLayerPanelModel => {
  // No extra layer is inferred from a preset, scene name, G2 status or appearance.
  const available = new Set(availableNodeIds.filter(isLayerId));
  const modes = state.layerPresetState?.modes ?? createViewerLayerModeMap(state.layers);
  // Persisted state is runtime data, not a trusted TypeScript union. A bad
  // saved ID must not produce an empty select with "Oletusasetukset" beside it.
  const persistedPreset = state.layerPresetState?.selected;
  const selectedPreset = isPreset(persistedPreset) ? persistedPreset
    : isPreset(state.researchPreset) ? state.researchPreset : null;

  return {
    selectedPreset,
    customized: selectedPreset !== null && (state.layerPresetState?.customized ?? false),
    groups: layerGroups.map((group) => ({
      label: group.label,
      items: group.items.filter(([id]) => available.has(id)).map(([id, label]) => {
        // Include only source-confirmed descendants. The root reports "mixed"
        // when a grandchild differs, even if its immediate child is visible.
        const descendants = (Object.keys(viewerLayerNodeCapabilities) as ViewerLayerNodeId[])
          .filter((child) => {
            if (!available.has(child) || child === id) return false;
            let ancestor = viewerLayerNodeCapabilities[child].parent;
            const visited = new Set<ViewerLayerNodeId>();
            while (ancestor && available.has(ancestor) && !visited.has(ancestor)) {
              if (ancestor === id) return true;
              visited.add(ancestor);
              ancestor = viewerLayerNodeCapabilities[ancestor].parent;
            }
            return false;
          });
        // The renderer treats missing/malformed modes as hidden. A leaf
        // select must show the same safe state, never a blank option.
        const ownMode = modes[id];
        const safeOwnMode = ownMode === 'visible' || ownMode === 'ghost'
          ? ownMode : 'hidden';
        return {
          id,
          label,
          mode: descendants.length ? getViewerLayerParentMode(modes, id, descendants) : safeOwnMode,
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

export type ViewerLayerPresetPanelOptions = {
  /** Only preset scopes supported by the current source may be selected. */
  availablePresets?: readonly ViewerLayerPreset[];
  disabled?: boolean;
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
  options: ViewerLayerPresetPanelOptions = {},
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
  // The D 2F scene may have no independently verified roof node.
  // Explain the unavailable ghost control without fabricating a roof layer.
  const roofUnavailableNotice = doc.createElement('p');
  roofUnavailableNotice.className = 'yl-layer-preset-help';
  roofUnavailableNotice.dataset.layerRoofUnavailable = '';
  roofUnavailableNotice.setAttribute('role', 'note');
  roofUnavailableNotice.textContent = 'Yläkerran mallinäkymässä vesikattoa ei ole tunnistettu. Kattoa ei voi tässä näkymässä himmentää.';
  roofUnavailableNotice.hidden = true;
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
  root.append(label, description, roofUnavailableNotice, status, legend, groups);
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

  let panelOptions = options;
  let allowedPresets = new Set<ViewerLayerPreset>();
  presetSelect.addEventListener('change', () => {
    if (!presetSelect.disabled && isPreset(presetSelect.value) &&
        allowedPresets.has(presetSelect.value)) callbacks.onPresetChange(presetSelect.value);
  });
  reset.addEventListener('click', () => callbacks.onReset());

  let destroyed = false;
  const update = (
    next: ViewerInteractionState,
    available: readonly string[],
    nextOptions?: ViewerLayerPresetPanelOptions,
  ) => {
    if (destroyed) throw new Error('Layers preset controls already destroyed');
    if (nextOptions) panelOptions = nextOptions;
    allowedPresets = new Set(panelOptions.availablePresets ??
      viewerLayerPresetChoices.map(([id]) => id));
    for (const option of presetSelect.options) {
      if (isPreset(option.value)) option.disabled = !allowedPresets.has(option.value);
    }
    presetSelect.disabled = panelOptions.disabled === true || allowedPresets.size === 0;
    const model = buildViewerLayerPanelModel(next, available);
    roofUnavailableNotice.hidden = !(model.selectedPreset === 'd-2f' &&
      !available.includes('roof'));
    // update() may be called synchronously from an onLayerModeChange callback.
    // Preserve keyboard focus when replacing only the metadata-gated rows.
    const focused = doc.activeElement;
    const focusedLayer = focused instanceof (doc.defaultView?.HTMLButtonElement ?? Object)
      && root.contains(focused) && focused.hasAttribute('data-layer-mode-control')
      ? focused.closest('[data-layer-node]')?.getAttribute('data-layer-node')
      : null;
    const focusedMode = focusedLayer ? (focused as HTMLButtonElement).dataset.layerMode : null;
    // Rebuilding the long list briefly collapses its height. On mobile this
    // clamps an ancestor's scrollTop to zero, even if focus is restored later.
    // Keep only real scroll containers; do not touch page/window scrolling.
    const scrollers: Array<{ element: HTMLElement; top: number }> = [];
    for (let ancestor = groups.parentElement; ancestor && ancestor !== doc.body;
      ancestor = ancestor.parentElement) {
      const overflowY = doc.defaultView?.getComputedStyle(ancestor).overflowY;
      if (/^(auto|scroll|overlay)$/.test(overflowY ?? '') &&
          ancestor.scrollHeight > ancestor.clientHeight) {
        scrollers.push({ element: ancestor, top: ancestor.scrollTop });
      }
    }
    presetSelect.value = model.selectedPreset ?? '';
    customizedText.textContent = model.customized
      ? 'Mukautettu'
      : model.selectedPreset ? 'Oletusasetukset' : 'Ei valittua esiasetusta';
    customizedText.dataset.customized = String(model.customized);
    reset.disabled = panelOptions.disabled === true || !model.selectedPreset ||
      !allowedPresets.has(model.selectedPreset) || !model.customized;
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
        const field = doc.createElement('div');
        field.dataset.layerNode = item.id;
        field.className = 'yl-layer-preset-row';
        field.dataset.mixed = String(item.mode === 'mixed');
        const name = doc.createElement('span');
        name.textContent = item.label;
        // Three direct, independently focusable actions. The source-bound
        // availableNodeIds filter runs before creating any control.
        const choices = doc.createElement('div');
        choices.className = 'yl-layer-mode-choices';
        choices.dataset.layerModeChoices = '';
        choices.dataset.selectedMode = item.mode;
        choices.dataset.effectiveMode = item.effectiveMode;
        choices.setAttribute('role', 'group');
        choices.setAttribute('aria-label', item.label + ', näkyvyys' +
          (item.mode === 'mixed' ? ', osittainen' : ''));
        choices.setAttribute('aria-disabled', String(panelOptions.disabled === true));
        // Parent gating affects presentation, not the child's saved choice.
        const parentEffect = item.effectiveMode === 'hidden' && item.mode !== 'hidden'
          ? 'Ylempi tasoryhmä on piilossa. Tämä taso ei nyt näy, vaikka oma asetus säilyy.'
          : item.effectiveMode === 'ghost' && item.mode === 'visible'
            ? 'Ylempi tasoryhmä on himmeä. Myös tämä taso näkyy himmeänä.'
            : null;
        for (const [mode, title] of modeOptions) {
          const button = doc.createElement('button');
          button.type = 'button';
          button.dataset.layerModeControl = '';
          button.dataset.layerMode = mode;
          button.dataset.effectiveMode = item.effectiveMode;
          button.className = 'yl-layer-mode-button';
          button.textContent = title;
          button.setAttribute('aria-label', item.label + ': ' + title);
          button.setAttribute('aria-pressed', String(item.mode === mode));
          button.disabled = panelOptions.disabled === true;
          if (parentEffect) button.setAttribute('aria-description', parentEffect);
          button.addEventListener('click', () => {
            if (!button.disabled) callbacks.onLayerModeChange(item.id, mode);
          });
          choices.append(button);
        }
        field.append(name, choices);
        if (item.mode === 'mixed') {
          const option = doc.createElement('option');
          option.value = 'mixed';
          option.textContent = 'Osittainen';
          option.disabled = true;
          select.prepend(option);
        }
        select.value = item.mode;
        select.dataset.effectiveMode = item.effectiveMode;
        // Child preference is retained when a parent prevents visibility.
        // Explain the actual presentation without changing or disabling
        // that preference. It becomes effective again when the parent opens.
        const parentEffect = item.effectiveMode === 'hidden' && item.mode !== 'hidden'
          ? 'Ylempi tasoryhmä on piilossa. Tämä taso ei nyt näy, vaikka oma asetus säilyy.'
          : item.effectiveMode === 'ghost' && item.mode === 'visible'
            ? 'Ylempi tasoryhmä on himmeä. Myös tämä taso näkyy himmeänä.'
            : null;
        if (parentEffect) select.setAttribute('aria-description', parentEffect);
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
          mixedHelp.textContent = 'Osittainen: ylätason ja alatasojen näkyvyys poikkeaa. Muuta alatasoja tarvittaessa erikseen.';
          field.append(mixedHelp);
        }
        if (parentEffect) {
          const hint = doc.createElement('small');
          hint.className = 'yl-layer-preset-parent-effect';
          hint.dataset.layerParentEffect = '';
          hint.textContent = parentEffect;
          field.append(hint);
        }
        section.append(field);
      }
      groups.append(section);
    }
    if (focusedLayer) {
      const restoredRow = Array.from(groups.querySelectorAll<HTMLElement>('[data-layer-node]'))
        .find((row) => row.dataset.layerNode === focusedLayer);
      const restored = Array.from(
        restoredRow?.querySelectorAll<HTMLButtonElement>('button[data-layer-mode-control]') ?? [],
      ).find((button) => button.dataset.layerMode === focusedMode);
      restored?.focus({ preventScroll: true });
    }
    // The browser naturally clamps this if fewer source-verified rows remain.
    for (const { element, top } of scrollers) element.scrollTop = top;
  };

  update(state, availableNodeIds);
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    root.remove();
  };
  return { root, update, destroy };
};
