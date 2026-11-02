import {
  createViewerLayerModeMap,
  getViewerLayerEffectiveMode,
  viewerLayerNodeCapabilities,
  type ViewerLayerNodeId,
  type ViewerLayerParentMode,
  type ViewerLayerVisibilityMode,
} from './privateModelLayerHierarchyState';
import type {
  ViewerInteractionState,
  ViewerLayerPreset,
} from './privateModelViewerState';

export type ViewerLayerPanelGroup =
  | 'Rakennusosat' | 'Kalusteet ja varusteet' | 'Talotekniikka' | 'Lähteet ja viitteet';
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
export type ViewerLayerPanelNode = {
  id: string;
  layerId?: ViewerLayerNodeId;
  label: string;
  mode: ViewerLayerParentMode;
  effectiveMode: ViewerLayerVisibilityMode;
  /** Actual source-bound IDs affected by this branch, never inferred geometry. */
  commandIds: ViewerLayerNodeId[];
  children: ViewerLayerPanelNode[];
};
export type ViewerLayerPanelModel = {
  selectedPreset: ViewerLayerPreset | null;
  customized: boolean;
  groups: ViewerLayerPanelGroupModel[];
  roots: ViewerLayerPanelNode[];
};
export type ViewerLayerPresetPanelOptions = {
  availablePresets?: readonly ViewerLayerPreset[];
  /** IDs with actual renderable bindings, distinct from abstract UI parents. */
  boundNodeIds?: readonly string[];
  disabled?: boolean;
};
export type ViewerLayerPresetPanelCallbacks = {
  onPresetChange: (preset: ViewerLayerPreset) => void;
  onLayerModeChange: (id: ViewerLayerNodeId, mode: ViewerLayerVisibilityMode) => void;
  /** Virtual categories submit only verified real IDs as one branch command. */
  onLayerModesChange?: (ids: readonly ViewerLayerNodeId[], mode: ViewerLayerVisibilityMode) => void;
  onReset: () => void;
};

type CatalogNode = { id: string; label: string; children?: readonly CatalogNode[] };
const catalog: readonly CatalogNode[] = [
  { id: 'architecture', label: 'Rakennusosat', children: [
    { id: 'architecture-walls', label: 'Seinät', children: [
      { id: 'architecture-walls-exterior', label: 'Ulkoseinät' },
      { id: 'architecture-walls-party', label: 'Yhteiset seinät' },
      { id: 'architecture-walls-interior', label: 'Väliseinät' },
    ] },
    { id: 'architecture-floors', label: 'Lattiat' },
    { id: 'architecture-ceilings', label: 'Sisäkatot' },
    { id: 'roof', label: 'Vesikatto' },
    { id: 'architecture-doors', label: 'Ovet' },
    { id: 'architecture-windows', label: 'Ikkunat' },
  ] },
  { id: 'furniture', label: 'Kalusteet ja varusteet', children: [
    { id: 'architecture-fixtures', label: 'Tunnistetut kiintokalusteet' },
    { id: 'architecture-other', label: 'Muut tunnistetut kohteet' },
  ] },
  { id: 'technical', label: 'Talotekniikka', children: [
    { id: 'technical-ventilation', label: 'IV-laitteet ja venttiilit' },
    { id: 'technical-heating', label: 'Patterit ja ILP' },
    { id: 'technical-electrical', label: 'Sähkölaitteet ja valaisimet' },
  ] },
  { id: 'references', label: 'Lähteet ja viitteet', children: [
    { id: 'architecture-review-helpers', label: 'Tarkastelun apukohteet' },
    { id: 'locus', label: 'Järjestelmäviitteet', children: [
      { id: 'locus-water', label: 'Vesi, Locus' },
      { id: 'locus-wastewater', label: 'Viemärit, Locus' },
      { id: 'p161-kvv-2017', label: 'KVV 2017' },
      { id: 'p161-iv-1974-plan', label: 'IV 1974, suunnitelma' },
      { id: 'p161-iv-1974-section', label: 'IV 1974, leikkaus' },
    ] },
  ] },
];

export const viewerLayerPresetChoices = [
  ['whole-building', 'Koko rakennus'], ['d-apartment', 'D-asunto'],
  ['d-1f', 'D alakerta'], ['d-2f', 'D yläkerta'], ['site', 'Tontti'], ['infra', 'Infra'],
] as const satisfies ReadonlyArray<readonly [ViewerLayerPreset, string]>;
const isLayerId = (id: string): id is ViewerLayerNodeId =>
  Object.prototype.hasOwnProperty.call(viewerLayerNodeCapabilities, id);
const isPreset = (id: unknown): id is ViewerLayerPreset =>
  typeof id === 'string' && viewerLayerPresetChoices.some(([preset]) => preset === id);
const safeMode = (mode: unknown): ViewerLayerVisibilityMode =>
  mode === 'visible' || mode === 'ghost' ? mode : 'hidden';
const aggregate = (modes: readonly ViewerLayerVisibilityMode[]): ViewerLayerParentMode =>
  modes.length && modes.some(mode => mode !== modes[0]) ? 'mixed' : modes[0] ?? 'hidden';

export const buildViewerLayerPanelModel = (
  state: ViewerInteractionState,
  availableNodeIds: readonly string[],
  options: ViewerLayerPresetPanelOptions = {},
): ViewerLayerPanelModel => {
  const available = new Set(availableNodeIds.filter(isLayerId));
  const modes = state.layerPresetState?.modes ?? createViewerLayerModeMap(state.layers);
  const independent = state.layerPresetState?.visibilityTree === 'branch';
  // Older callers supply only availability. Do not count an abstract parent
  // as physical content when it has available children but no supplied binding.
  const inferredBound = [...available].filter(id => ![...available].some(child =>
    viewerLayerNodeCapabilities[child].parent === id));
  const bound = new Set((options.boundNodeIds ?? inferredBound)
    .filter(isLayerId).filter(id => available.has(id)));
  const effective = (id: ViewerLayerNodeId) => getViewerLayerEffectiveMode(modes, id, independent);
  const persisted = state.layerPresetState?.selected;
  const selectedPreset = isPreset(persisted) ? persisted
    : isPreset(state.researchPreset) ? state.researchPreset : null;

  const buildNode = (source: CatalogNode): ViewerLayerPanelNode | null => {
    const children = (source.children ?? []).map(buildNode)
      .filter((item): item is ViewerLayerPanelNode => item !== null);
    const layerId = isLayerId(source.id) && available.has(source.id) ? source.id : undefined;
    if (!layerId && !children.length && source.id !== 'references') return null;
    const commandIds = [...new Set([
      ...(layerId && bound.has(layerId) ? [layerId] : []),
      ...children.flatMap(child => child.commandIds),
    ])];
    const own = layerId ? safeMode(modes[layerId]) : 'hidden';
    return {
      id: source.id, layerId, label: source.label, children, commandIds,
      mode: source.children ? aggregate(commandIds.map(effective)) : own,
      effectiveMode: layerId ? effective(layerId) : 'hidden',
    };
  };
  const roots = catalog.map(buildNode).filter((node): node is ViewerLayerPanelNode => node !== null);
  const flatten = (node: ViewerLayerPanelNode): ViewerLayerPanelItem[] => [
    ...(node.layerId ? [{ id: node.layerId, label: node.label,
      mode: node.mode, effectiveMode: node.effectiveMode }] : []),
    ...node.children.flatMap(flatten),
  ];
  return {
    selectedPreset,
    customized: selectedPreset !== null && (state.layerPresetState?.customized ?? false),
    groups: roots.map(node => ({ label: node.label as ViewerLayerPanelGroup, items: flatten(node) }))
      .filter(group => group.items.length > 0),
    roots,
  };
};

const choices = [
  { id: 'visible', label: 'Näkyvä', mark: '●' },
  { id: 'ghost', label: 'Himmeä', mark: '◐' },
  { id: 'hidden', label: 'Piilossa', mark: '○' },
] as const;

/** One metadata-gated tree inside the existing Layers panel. */
export const mountViewerLayerPresetPanel = (
  host: HTMLElement,
  state: ViewerInteractionState,
  availableNodeIds: readonly string[],
  callbacks: ViewerLayerPresetPanelCallbacks,
  options: ViewerLayerPresetPanelOptions = {},
) => {
  if (host.querySelector('[data-layer-preset-panel]')) throw new Error('Layers preset controls already mounted');
  const doc = host.ownerDocument;
  const root = doc.createElement('section');
  root.dataset.layerPresetPanel = 'wp3';
  root.className = 'yl-layer-preset-panel';
  root.setAttribute('aria-label', 'Mallin sisältö');
  const presetLabel = doc.createElement('label');
  presetLabel.className = 'yl-layer-preset-field';
  const presetTitle = doc.createElement('span');
  presetTitle.textContent = 'Näkymän esiasetus';
  const presetSelect = doc.createElement('select');
  presetSelect.setAttribute('aria-label', 'Näkymän esiasetus');
  presetLabel.append(presetTitle, presetSelect);
  for (const [id, label] of [['', 'Valitse esiasetus'], ...viewerLayerPresetChoices]) {
    const option = doc.createElement('option');
    option.value = id; option.textContent = label;
    presetSelect.append(option);
  }
  const customized = doc.createElement('span');
  customized.dataset.layerPresetCustomized = '';
  customized.setAttribute('aria-live', 'polite');
  const legend = doc.createElement('div');
  legend.className = 'yl-layer-preset-legend';
  legend.setAttribute('aria-hidden', 'true');
  const legendTitle = doc.createElement('span'); legendTitle.textContent = 'Näkyvyys';
  const columns = doc.createElement('div'); columns.className = 'yl-layer-mode-columns';
  for (const choice of choices) {
    const column = doc.createElement('span'); column.textContent = choice.label; columns.append(column);
  }
  legend.append(legendTitle, columns);
  const groups = doc.createElement('div');
  groups.className = 'yl-layer-preset-groups'; groups.dataset.layerPresetGroups = '';
  const roofNotice = doc.createElement('p');
  roofNotice.className = 'yl-layer-preset-help'; roofNotice.dataset.layerRoofUnavailable = '';
  roofNotice.setAttribute('role', 'note');
  roofNotice.textContent = 'Yläkerran mallinäkymässä vesikattoa ei ole tunnistettu. Kattoa ei voi tässä näkymässä himmentää.';
  roofNotice.hidden = true;
  const help = doc.createElement('p');
  help.className = 'yl-layer-preset-help';
  help.textContent = 'Luokittelu on osittainen. Näytetään vain tunnistetut ryhmät.';
  const ghostHelp = doc.createElement('p');
  ghostHelp.className = 'yl-layer-preset-help';
  ghostHelp.textContent = 'Himmeä on esitystapa, ei tiedon varmuustaso.';
  const reset = doc.createElement('button');
  reset.type = 'button'; reset.className = 'yl-layer-preset-reset'; reset.textContent = 'Palauta näkyvyys';
  root.append(presetLabel, customized, legend, groups, roofNotice, help, ghostHelp, reset);
  host.insertBefore(root, host.firstChild);

  let panelOptions = options;
  let allowedPresets = new Set<ViewerLayerPreset>();
  let destroyed = false;
  const available = new Set<ViewerLayerNodeId>();
  const expanded = new Map<string, boolean>([['architecture', true], ['technical', true]]);
  type NodeView = {
    model: ViewerLayerPanelNode;
    wrapper: HTMLDivElement;
    row: HTMLDivElement;
    disclosure: HTMLButtonElement;
    name: HTMLSpanElement;
    mixed: HTMLSpanElement;
    controls: HTMLDivElement;
    buttons: HTMLButtonElement[];
    children: HTMLDivElement;
    empty: HTMLParagraphElement;
    hint: HTMLSpanElement;
  };
  const views = new Map<string, NodeView>();
  const setExpanded = (view: NodeView, open: boolean) => {
    expanded.set(view.model.id, open);
    view.disclosure.setAttribute('aria-expanded', String(open));
    view.disclosure.textContent = open ? '▾' : '▸';
    view.children.hidden = !open;
  };
  const command = (view: NodeView, mode: ViewerLayerVisibilityMode) => {
    if (destroyed || panelOptions.disabled || !root.contains(view.wrapper)) return;
    const targets = view.model.commandIds.filter(id => available.has(id));
    if (targets.length === 0) return;
    if (view.model.layerId && available.has(view.model.layerId)) {
      callbacks.onLayerModeChange(view.model.layerId, mode);
    } else if (callbacks.onLayerModesChange) {
      callbacks.onLayerModesChange(targets, mode);
    } else {
      targets.forEach(id => callbacks.onLayerModeChange(id, mode));
    }
  };
  const createView = (node: ViewerLayerPanelNode): NodeView => {
    const wrapper = doc.createElement('div'); wrapper.className = 'yl-layer-tree-node';
    wrapper.dataset.layerBranch = node.id;
    const row = doc.createElement('div'); row.className = 'yl-layer-preset-row';
    const nameBox = doc.createElement('div'); nameBox.className = 'yl-layer-node-name';
    const disclosure = doc.createElement('button');
    disclosure.type = 'button'; disclosure.className = 'yl-layer-disclosure';
    disclosure.dataset.layerDisclosure = node.id;
    const name = doc.createElement('span'); name.className = 'yl-layer-node-label';
    const mixed = doc.createElement('span'); mixed.className = 'yl-layer-preset-mixed'; mixed.textContent = 'Eri tiloja';
    name.append(mixed); nameBox.append(disclosure, name);
    const controls = doc.createElement('div');
    controls.className = 'yl-layer-mode-controls'; controls.setAttribute('role', 'group');
    const children = doc.createElement('div'); children.className = 'yl-layer-tree-children';
    children.id = `yl-layer-branch-${node.id}`;
    const empty = doc.createElement('p'); empty.className = 'yl-layer-preset-empty';
    empty.textContent = 'Tässä näkymässä ei ole erikseen luokiteltuja lähteitä tai viitteitä.';
    const hint = doc.createElement('span');
    hint.className = 'yl-layer-preset-parent-effect'; hint.dataset.layerParentEffect = '';
    const view: NodeView = { model: node, wrapper, row, disclosure, name, mixed, controls,
      buttons: [], children, empty, hint };
    for (const choice of choices) {
      const button = doc.createElement('button'); button.type = 'button';
      button.className = 'yl-layer-mode'; button.dataset.layerMode = choice.id;
      button.dataset.layerModeControl = '';
      const mark = doc.createElement('span'); mark.className = 'yl-layer-mode-mark';
      mark.textContent = choice.mark; mark.setAttribute('aria-hidden', 'true');
      button.append(mark); button.addEventListener('click', () => command(view, choice.id));
      controls.append(button); view.buttons.push(button);
    }
    disclosure.addEventListener('click', () => setExpanded(view, !(expanded.get(view.model.id) ?? false)));
    row.append(nameBox, controls, hint); wrapper.append(row, children);
    views.set(node.id, view);
    return view;
  };
  const place = (parent: HTMLElement, child: HTMLElement, index: number) => {
    if (parent.children[index] !== child) parent.insertBefore(child, parent.children[index] ?? null);
  };
  const render = (parent: HTMLElement, nodes: readonly ViewerLayerPanelNode[], depth: number, independent: boolean) => {
    const wanted = new Set(nodes.map(node => node.id));
    for (const child of Array.from(parent.children)) {
      if (!wanted.has((child as HTMLElement).dataset.layerBranch ?? '')) child.remove();
    }
    nodes.forEach((node, index) => {
      const view = views.get(node.id) ?? createView(node);
      view.model = node;
      place(parent, view.wrapper, index);
      const branch = node.children.length > 0 || node.id === 'references';
      view.wrapper.dataset.layerGroup = depth === 0 ? node.label : '';
      view.row.style.setProperty('--layer-depth', String(depth));
      if (node.layerId) view.row.dataset.layerNode = node.layerId;
      else delete view.row.dataset.layerNode;
      view.row.dataset.mode = node.mode;
      view.row.dataset.effectiveMode = node.effectiveMode;
      view.row.dataset.mixed = String(node.mode === 'mixed');
      view.row.classList.toggle('yl-layer-root-row', depth === 0);
      view.row.classList.toggle('yl-layer-reference-row', node.id === 'references');
      // Keep the text node and all focused buttons stable across updates.
      let title = view.name.firstChild;
      if (!title || title.nodeType !== 3) { title = doc.createTextNode(''); view.name.prepend(title); }
      title.textContent = node.label;
      view.mixed.hidden = node.mode !== 'mixed';
      view.disclosure.hidden = !branch;
      view.disclosure.setAttribute('aria-label', node.label + ', alaryhmät');
      view.disclosure.setAttribute('aria-controls', view.children.id);
      view.controls.hidden = node.id === 'references';
      view.controls.setAttribute('aria-label', node.label + ', näkyvyys');
      const parentEffect = !independent && !node.children.length && node.layerId &&
        node.effectiveMode !== node.mode
        ? node.effectiveMode === 'hidden'
          ? 'Ylempi tasoryhmä on piilossa. Oma asetus säilyy.'
          : 'Ylempi tasoryhmä on himmeä. Myös tämä taso näkyy himmeänä.'
        : null;
      view.hint.hidden = !parentEffect;
      view.hint.textContent = parentEffect ?? '';
      choices.forEach((choice, i) => {
        const button = view.buttons[i];
        button.disabled = panelOptions.disabled === true || node.commandIds.length === 0;
        button.setAttribute('aria-label', `${node.label}: ${choice.label.toLowerCase()}${branch ? ', koko haara' : ''}`);
        button.setAttribute('aria-pressed', String(node.mode === choice.id));
        button.dataset.effectiveMode = node.effectiveMode;
        if (parentEffect) button.setAttribute('aria-description', parentEffect);
        else button.removeAttribute('aria-description');
      });
      if (branch) {
        setExpanded(view, expanded.get(node.id) ?? false);
        render(view.children, node.children, depth + 1, independent);
        if (node.id === 'references' && !node.children.length) view.children.append(view.empty);
      } else view.children.hidden = true;
    });
  };
  presetSelect.addEventListener('change', () => {
    if (!destroyed && !presetSelect.disabled && isPreset(presetSelect.value) && allowedPresets.has(presetSelect.value)) {
      callbacks.onPresetChange(presetSelect.value);
    }
  });
  reset.addEventListener('click', () => { if (!destroyed && !reset.disabled) callbacks.onReset(); });
  const update = (next: ViewerInteractionState, ids: readonly string[], nextOptions?: ViewerLayerPresetPanelOptions) => {
    if (destroyed) throw new Error('Layers preset controls already destroyed');
    if (nextOptions) panelOptions = nextOptions;
    available.clear(); ids.filter(isLayerId).forEach(id => available.add(id));
    allowedPresets = new Set(panelOptions.availablePresets ?? viewerLayerPresetChoices.map(([id]) => id));
    for (const option of presetSelect.options) if (isPreset(option.value)) option.disabled = !allowedPresets.has(option.value);
    presetSelect.disabled = panelOptions.disabled === true || allowedPresets.size === 0;
    const model = buildViewerLayerPanelModel(next, ids, panelOptions);
    presetSelect.value = model.selectedPreset ?? '';
    customized.textContent = model.customized ? 'Mukautettu'
      : model.selectedPreset ? 'Oletusnäkyvyys' : 'Ei valittua esiasetusta';
    customized.dataset.customized = String(model.customized);
    reset.disabled = panelOptions.disabled === true || !model.selectedPreset || !allowedPresets.has(model.selectedPreset) || !model.customized;
    roofNotice.hidden = !(model.selectedPreset === 'd-2f' && !available.has('roof'));
    const scrollers: Array<{ element: HTMLElement; top: number }> = [];
    for (let parent = groups.parentElement; parent && parent !== doc.body; parent = parent.parentElement) {
      if (/^(auto|scroll|overlay)$/.test(doc.defaultView?.getComputedStyle(parent).overflowY ?? '')) {
        scrollers.push({ element: parent, top: parent.scrollTop });
      }
    }
    render(groups, model.roots, 0, next.layerPresetState?.visibilityTree === 'branch');
    for (const { element, top } of scrollers) element.scrollTop = top;
  };
  update(state, availableNodeIds);
  return { root, update, destroy: () => { if (!destroyed) { destroyed = true; root.remove(); views.clear(); } } };
};
