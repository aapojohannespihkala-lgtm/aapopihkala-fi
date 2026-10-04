import { THREE } from './threeRuntime';
import {
  createViewerLayerControlsState,
  isViewerLayerNodeEffectivelyVisible,
  setViewerLayerNodeVisible,
  viewerArchitecturalParentVisibilityState,
  viewerArchitecturalRootChildNodeIds,
  viewerArchitecturalWallChildNodeIds,
  type ViewerArchitecturalLayerNodeId,
  type ViewerLayerControlsState,
} from './privateModelLayerHierarchyState';

type ArchitecturalDescriptor = {
  semanticWallFamily: 'EXTERIOR' | 'PARTY' | 'INTERIOR' | 'UNCLASSIFIED' | 'UNRESOLVED_SEMANTIC_CONFLICT';
  buildingPartFamily: 'WALL' | 'DOOR' | 'WINDOW' | 'REVIEW_HELPER' | 'OTHER';
  representationRole: 'PHYSICAL' | 'WORK_TEST_ASSUMPTION' | 'REFERENCE' | 'REVIEW_HELPER' | 'UNRESOLVED';
};

type ArchitecturalResolver = (
  object: any,
  stopAt?: any,
) => ArchitecturalDescriptor;

type LayerControls = {
  root: HTMLInputElement;
  walls: HTMLInputElement;
  exterior: HTMLInputElement;
  party: HTMLInputElement;
  interior: HTMLInputElement;
  doors: HTMLInputElement;
  windows: HTMLInputElement;
  helpers: HTMLInputElement;
  other: HTMLInputElement;
  rootCount: HTMLElement;
  wallsCount: HTMLElement;
  exteriorCount: HTMLElement;
  partyCount: HTMLElement;
  interiorCount: HTMLElement;
  doorsCount: HTMLElement;
  windowsCount: HTMLElement;
  helpersCount: HTMLElement;
  otherCount: HTMLElement;
};

const emptyCounts = (): Record<ViewerArchitecturalLayerNodeId, number> => ({
  architecture: 0,
  'architecture-walls': 0,
  'architecture-walls-exterior': 0,
  'architecture-walls-party': 0,
  'architecture-walls-interior': 0,
  'architecture-doors': 0,
  'architecture-windows': 0,
  'architecture-review-helpers': 0,
  'architecture-other': 0,
});

const renderable = (object: any) =>
  Boolean(object?.isMesh || object?.isLine || object?.isLineSegments || object?.isPoints);

const materialIsArchBase = (object: any) => {
  const materials = Array.isArray(object?.material) ? object.material : [object?.material];
  return materials.some(
    (material: any) => material?.userData?.presentationGroup === 'ARCH_BASE',
  );
};

const metadataChainHasArchitectureEvidence = (object: any, stopAt: any) => {
  let current = object;
  let depth = 0;
  while (current && current !== stopAt && depth < 10) {
    const data = current?.userData ?? {};
    const representationKind = String(data.representationKind ?? '').toUpperCase();
    const presentationLayer = String(data.presentationLayer ?? '').toUpperCase();
    if (
      typeof data.G2Id === 'string' ||
      typeof data.ParentG2Id === 'string' ||
      data.physicalWallClaim === true ||
      data.physicalOpeningClaim === true ||
      data.physicalDoorVoid === true ||
      data.physicalWindowClaim === true ||
      representationKind.includes('WALL') ||
      representationKind.includes('DOOR') ||
      representationKind.includes('WINDOW') ||
      presentationLayer === 'CURRENT_D_OUTLINE'
    ) {
      return true;
    }
    current = current.parent;
    depth += 1;
  }
  return materialIsArchBase(object);
};

const metadataChainIsRoof = (object: any, stopAt: any) => {
  let current = object;
  let depth = 0;
  while (current && current !== stopAt && depth < 10) {
    const data = current?.userData ?? {};
    const layer = String(data.presentationLayer ?? '').toUpperCase();
    const kind = String(data.representationKind ?? '').toUpperCase();
    if (layer.includes('ROOF') || kind.includes('ROOF')) return true;
    current = current.parent;
    depth += 1;
  }
  return false;
};

const makeCheckboxRow = (id: string, labelText: string, child = true) => {
  const label = document.createElement('label');
  label.className = child ? 'layer-row layer-tree-child' : 'layer-row';
  const input = document.createElement('input');
  input.id = id;
  input.type = 'checkbox';
  input.checked = true;
  const text = document.createElement('span');
  text.textContent = labelText;
  label.append(input, text);
  return { label, input, text };
};

const createControls = (): LayerControls | null => {
  const existing = document.querySelector<HTMLInputElement>('#architecture-layer-visible');
  if (existing) return null;

  const locusGroup = document.querySelector<HTMLElement>('#locus-layer-group');
  if (!locusGroup?.parentElement) return null;

  const section = document.createElement('div');
  section.id = 'architecture-layer-group';
  section.className = 'layer-section';

  const rootParent = document.createElement('div');
  rootParent.className = 'layer-tree-parent';
  const rootRow = makeCheckboxRow('architecture-layer-visible', 'Arkkitehtuuri', false);
  const rootCount = document.createElement('div');
  rootCount.id = 'architecture-layer-count';
  rootCount.className = 'layer-count';
  rootCount.textContent = '0 kohdetta';
  rootParent.append(rootRow.label, rootCount);

  const children = document.createElement('div');
  children.className = 'layer-tree-children';
  children.setAttribute('aria-label', 'Arkkitehtuurin alaryhmät');

  const wallsParent = document.createElement('div');
  wallsParent.className = 'layer-tree-parent';
  const wallsRow = makeCheckboxRow('architecture-walls-visible', 'Seinät');
  const wallsCount = document.createElement('div');
  wallsCount.id = 'architecture-walls-count';
  wallsCount.className = 'layer-count';
  wallsCount.textContent = '0 kohdetta';
  wallsParent.append(wallsRow.label, wallsCount);

  const wallChildren = document.createElement('div');
  wallChildren.className = 'layer-tree-children';
  wallChildren.setAttribute('aria-label', 'Seinäperheet');
  const exterior = makeCheckboxRow('architecture-exterior-walls-visible', 'Ulkoseinät 0');
  const party = makeCheckboxRow('architecture-party-walls-visible', 'Huoneistorajaseinät 0');
  const interior = makeCheckboxRow('architecture-interior-walls-visible', 'Sisäseinät 0');
  wallChildren.append(exterior.label, party.label, interior.label);

  const doors = makeCheckboxRow('architecture-doors-visible', 'Ovet 0');
  const windows = makeCheckboxRow('architecture-windows-visible', 'Ikkunat 0');
  const helpers = makeCheckboxRow(
    'architecture-review-helpers-visible',
    'Review-apugeometria 0',
  );
  const other = makeCheckboxRow('architecture-other-visible', 'Muu konteksti 0');

  children.append(
    wallsParent,
    wallChildren,
    doors.label,
    windows.label,
    helpers.label,
    other.label,
  );

  const note = document.createElement('div');
  note.className = 'layer-note';
  note.textContent =
    'Luokitus käyttää samaa G2-/esitystapametadataan perustuvaa semantiikkaa kuin objektin valinta.';

  section.append(rootParent, children, note);
  locusGroup.parentElement.insertBefore(section, locusGroup);

  return {
    root: rootRow.input,
    walls: wallsRow.input,
    exterior: exterior.input,
    party: party.input,
    interior: interior.input,
    doors: doors.input,
    windows: windows.input,
    helpers: helpers.input,
    other: other.input,
    rootCount,
    wallsCount,
    exteriorCount: exterior.text,
    partyCount: party.text,
    interiorCount: interior.text,
    doorsCount: doors.text,
    windowsCount: windows.text,
    helpersCount: helpers.text,
    otherCount: other.text,
  };
};

let installed = false;

export const installArchitecturalLayerRuntime = (resolve: ArchitecturalResolver) => {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  const controls = createControls();
  if (!controls) return;

  const canvas = document.querySelector<HTMLCanvasElement>('#private-model-canvas');
  if (!canvas) return;

  let state: ViewerLayerControlsState = createViewerLayerControlsState();
  let counts = emptyCounts();
  let trackedModelRoot: any = null;
  let modelIdentity = '';
  let filterActive = false;
  const visibilityBaseline = new Map<any, boolean>();

  const restoreBaseline = () => {
    for (const [object, visible] of visibilityBaseline.entries()) {
      object.visible = visible;
    }
    visibilityBaseline.clear();
  };

  const classify = (object: any): ViewerArchitecturalLayerNodeId | null => {
    if (!renderable(object) || !trackedModelRoot) return null;
    if (!metadataChainHasArchitectureEvidence(object, trackedModelRoot)) return null;
    if (metadataChainIsRoof(object, trackedModelRoot)) return null;

    const descriptor = resolve(object, trackedModelRoot);
    if (descriptor.representationRole === 'REVIEW_HELPER') {
      return 'architecture-review-helpers';
    }
    if (descriptor.buildingPartFamily === 'WALL') {
      if (descriptor.semanticWallFamily === 'EXTERIOR') {
        return 'architecture-walls-exterior';
      }
      if (descriptor.semanticWallFamily === 'PARTY') {
        return 'architecture-walls-party';
      }
      if (descriptor.semanticWallFamily === 'INTERIOR') {
        return 'architecture-walls-interior';
      }
      return 'architecture-other';
    }
    if (descriptor.buildingPartFamily === 'DOOR') return 'architecture-doors';
    if (descriptor.buildingPartFamily === 'WINDOW') return 'architecture-windows';
    return 'architecture-other';
  };

  const sync = () => {
    const rootState = viewerArchitecturalParentVisibilityState(
      state,
      'architecture',
      viewerArchitecturalRootChildNodeIds,
    );
    const wallState = viewerArchitecturalParentVisibilityState(
      state,
      'architecture-walls',
      viewerArchitecturalWallChildNodeIds,
    );

    controls.root.checked = state.architectureVisible;
    controls.root.indeterminate = state.architectureVisible && rootState === 'mixed';
    controls.walls.checked = state.architectureWallsVisible;
    controls.walls.indeterminate = state.architectureWallsVisible && wallState === 'mixed';
    controls.exterior.checked = state.architectureExteriorWallsVisible;
    controls.party.checked = state.architecturePartyWallsVisible;
    controls.interior.checked = state.architectureInteriorWallsVisible;
    controls.doors.checked = state.architectureDoorsVisible;
    controls.windows.checked = state.architectureWindowsVisible;
    controls.helpers.checked = state.architectureReviewHelpersVisible;
    controls.other.checked = state.architectureOtherVisible;

    controls.root.disabled = counts.architecture === 0 || filterActive;
    controls.walls.disabled = counts['architecture-walls'] === 0 || filterActive;
    controls.exterior.disabled =
      counts['architecture-walls-exterior'] === 0 || filterActive;
    controls.party.disabled = counts['architecture-walls-party'] === 0 || filterActive;
    controls.interior.disabled =
      counts['architecture-walls-interior'] === 0 || filterActive;
    controls.doors.disabled = counts['architecture-doors'] === 0 || filterActive;
    controls.windows.disabled = counts['architecture-windows'] === 0 || filterActive;
    controls.helpers.disabled =
      counts['architecture-review-helpers'] === 0 || filterActive;
    controls.other.disabled = counts['architecture-other'] === 0 || filterActive;

    controls.rootCount.textContent = counts.architecture + ' kohdetta';
    controls.wallsCount.textContent = counts['architecture-walls'] + ' kohdetta';
    controls.exteriorCount.textContent =
      'Ulkoseinät ' + counts['architecture-walls-exterior'];
    controls.partyCount.textContent =
      'Huoneistorajaseinät ' + counts['architecture-walls-party'];
    controls.interiorCount.textContent =
      'Sisäseinät ' + counts['architecture-walls-interior'];
    controls.doorsCount.textContent = 'Ovet ' + counts['architecture-doors'];
    controls.windowsCount.textContent = 'Ikkunat ' + counts['architecture-windows'];
    controls.helpersCount.textContent =
      'Review-apugeometria ' + counts['architecture-review-helpers'];
    controls.otherCount.textContent = 'Muu konteksti ' + counts['architecture-other'];

    canvas.dataset.architectureLayerParentState = rootState;
    canvas.dataset.architectureWallsParentState = wallState;
    canvas.dataset.architectureVisible = state.architectureVisible ? 'true' : 'false';
    canvas.dataset.architectureExteriorWallsVisible =
      state.architectureExteriorWallsVisible ? 'true' : 'false';
    canvas.dataset.architecturePartyWallsVisible =
      state.architecturePartyWallsVisible ? 'true' : 'false';
    canvas.dataset.architectureInteriorWallsVisible =
      state.architectureInteriorWallsVisible ? 'true' : 'false';
    canvas.dataset.architectureDoorsVisible =
      state.architectureDoorsVisible ? 'true' : 'false';
    canvas.dataset.architectureWindowsVisible =
      state.architectureWindowsVisible ? 'true' : 'false';
    canvas.dataset.architectureReviewHelpersVisible =
      state.architectureReviewHelpersVisible ? 'true' : 'false';
    canvas.dataset.architectureOtherVisible =
      state.architectureOtherVisible ? 'true' : 'false';
    canvas.dataset.architectureLayerObjectFilterLock = filterActive ? 'true' : 'false';
  };

  const apply = () => {
    if (!trackedModelRoot || filterActive) {
      sync();
      return;
    }

    restoreBaseline();
    counts = emptyCounts();
    const contentRoot = trackedModelRoot.children?.[0];
    contentRoot?.traverse?.((object: any) => {
      const nodeId = classify(object);
      if (!nodeId) return;
      visibilityBaseline.set(object, object.visible);
      counts.architecture += 1;
      counts[nodeId] += 1;
      if (
        nodeId === 'architecture-walls-exterior' ||
        nodeId === 'architecture-walls-party' ||
        nodeId === 'architecture-walls-interior'
      ) {
        counts['architecture-walls'] += 1;
      }
      if (!isViewerLayerNodeEffectivelyVisible(state, nodeId)) {
        object.visible = false;
      }
    });
    sync();
  };

  const refreshDerivedEdges = () => {
    const edgeMode = document.querySelector<HTMLSelectElement>('#edge-mode-select');
    edgeMode?.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const setNode = (
    nodeId: ViewerArchitecturalLayerNodeId,
    input: HTMLInputElement,
  ) => {
    if (filterActive) {
      sync();
      return;
    }
    state = setViewerLayerNodeVisible(state, nodeId, input.checked);
    apply();
    document.querySelector<HTMLButtonElement>('#clear-selection-button')?.click();
    refreshDerivedEdges();
    canvas.dataset.layerStateSource = 'manual';
  };

  controls.root.addEventListener('change', () => setNode('architecture', controls.root));
  controls.walls.addEventListener('change', () =>
    setNode('architecture-walls', controls.walls),
  );
  controls.exterior.addEventListener('change', () =>
    setNode('architecture-walls-exterior', controls.exterior),
  );
  controls.party.addEventListener('change', () =>
    setNode('architecture-walls-party', controls.party),
  );
  controls.interior.addEventListener('change', () =>
    setNode('architecture-walls-interior', controls.interior),
  );
  controls.doors.addEventListener('change', () =>
    setNode('architecture-doors', controls.doors),
  );
  controls.windows.addEventListener('change', () =>
    setNode('architecture-windows', controls.windows),
  );
  controls.helpers.addEventListener('change', () =>
    setNode('architecture-review-helpers', controls.helpers),
  );
  controls.other.addEventListener('change', () =>
    setNode('architecture-other', controls.other),
  );

  window.addEventListener('ylis-object-visibility-filter', (event: Event) => {
    const custom = event as CustomEvent<{ active?: boolean }>;
    filterActive = custom.detail?.active === true;
    if (!filterActive) apply();
    else sync();
  });

  const currentModelIdentity = () => {
    const badge = document.querySelector<HTMLElement>('#model-source-badge');
    return (badge?.dataset.kind ?? '') + '|' + (badge?.textContent ?? '');
  };

  const setTrackedRoot = (candidate: any) => {
    trackedModelRoot = candidate;
    const nextIdentity = currentModelIdentity();
    if (nextIdentity && nextIdentity !== modelIdentity) {
      modelIdentity = nextIdentity;
      state = createViewerLayerControlsState();
    }
    filterActive = canvas.dataset.objectVisibilityFilter === 'active';
    apply();
  };

  const originalAdd = THREE.Object3D.prototype.add;
  (THREE.Object3D.prototype as any).add = function (...objects: any[]) {
    const result = originalAdd.apply(this, objects as any);
    if (
      (this as any)?.parent?.isScene === true &&
      objects.some((object) => object?.isScene === true || object?.isGroup === true)
    ) {
      setTrackedRoot(this);
    }
    return result;
  };

  const originalClear = THREE.Object3D.prototype.clear;
  (THREE.Object3D.prototype as any).clear = function () {
    if (this === trackedModelRoot) restoreBaseline();
    return originalClear.apply(this);
  };

  sync();
};
