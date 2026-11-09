import { buildSourceNodeAssociations, createSourceNodeView } from './privateModelSourceNodeAssociations.mjs';
import { rehydrateHi20Unified52SourceScenes } from './privateModelHi20Unified52SourceScenes.mjs';
import { rehydrateIncompleteScene } from './privateModelSourceSceneRehydrate.mjs';
import { resolveC80R2ChainFloorScenes } from './privateModelC80R2ChainScenes.mjs';

type RecordData = Record<string, any>;

export type SourceCardBundle = {
  schema: string;
  manifest: RecordData;
  lookup: { cards: RecordData[]; bindings: RecordData[] };
  modules: Record<string, RecordData>;
  versionBindings?: RecordData;
  kphVersionBindings?: RecordData;
};

export type SourceEvidenceKind = 'measurement' | 'plan' | 'observation' | 'derived' | 'assumption' | 'unverified';
export type SourceEvidenceFact = { label: string; value: string; kind: SourceEvidenceKind; evidence: string };
export type SelectionSourceCard = {
  id: string;
  title: string;
  status: string;
  facts: SourceEvidenceFact[];
  sources: Array<{ title: string; url: string; role: string; supports: string[]; limits: string[] }>;
  conflicts: string[];
  notes: string[];
};
export type SelectionSourceEvidence = {
  state: 'matched' | 'unbound' | 'mismatch' | 'unavailable';
  version: string;
  reason?: string;
  cards: SelectionSourceCard[];
};

export const sourceEvidenceLabels: Record<SourceEvidenceKind, string> = {
  measurement: 'Kirjattu käyttäjämitta',
  plan: 'Historiallinen suunnitelma',
  observation: 'Käyttäjähavainto / rajattu katselmus',
  derived: 'Johdettu arvo',
  assumption: 'Työoletus',
  unverified: 'Varmistamatta',
};

/** Evidence belongs to one fact, never to all dimensions or to the whole object. */
export const classifySourceEvidence = (evidence: string, context = ''): SourceEvidenceKind => {
  const value = `${evidence} ${context}`;
  if (/DERIVED/.test(value)) return 'derived';
  if (/WORK_ASSUMPTION|PRESENTATION_STYLE/.test(value)) return 'assumption';
  if (/HISTORICAL_PLAN/.test(value)) return 'plan';
  if (/USER_FIELD_MEASURED_CURRENT|USER_REPORTED_MEASUREMENT|USER_MEASUREMENTS_DOCUMENTED|USER_MEASUREMENT_DOCUMENTED|USER_CONFIRMED_PANEL_TOPOLOGY_AND_MEASUREMENTS/.test(value)) return 'measurement';
  if (/USER_CONFIRMED|USER_VISUAL_CONFIRMATION|PARTIAL_VISUAL_REVIEW/.test(value)) return 'observation';
  return 'unverified';
};

export const allowedSourceCardUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return !url.username && !url.password &&
      ['https://drive.google.com', 'https://docs.google.com'].includes(url.origin);
  } catch { return false; }
};

const texts = (value: unknown): string[] => Array.isArray(value)
  ? value.filter((item): item is string => typeof item === 'string') : [];
const text = (value: unknown) => typeof value === 'string' ? value : '';

export const adaptSourceCard = (id: string, raw: RecordData): SelectionSourceCard => {
  const facts: SourceEvidenceFact[] = (raw.display?.facts ?? []).map((fact: RecordData) => ({
    label: text(fact.label), value: text(fact.value),
    evidence: text(fact.evidence), kind: classifySourceEvidence(text(fact.evidence)),
  }));
  if (raw.display?.period) {
    facts.push({ label: 'Lähdekonteksti', value: raw.display.period, kind: 'plan', evidence: 'HISTORICAL_PLAN' });
    facts.push({ label: 'Sijainti', value: raw.display.locationStatus, kind: 'derived', evidence: raw.sourceBindingClass });
    facts.push({ label: 'Alkuperäinen lähdeteksti', value: raw.sourceTextVerbatim, kind: 'plan', evidence: 'HISTORICAL_PLAN' });
  }
  for (const fact of raw.derivedDimensions ?? []) {
    facts.push({ label: fact.label, value: `${fact.valueMm} mm (${fact.calculation})`, kind: 'derived', evidence: fact.evidence });
  }
  for (const fact of raw.workAssumptions ?? []) {
    facts.push({ label: fact.label, value: fact.value ?? fact.allocation ?? `${fact.valueMmEachEdge} mm / reuna`, kind: 'assumption', evidence: 'WORK_ASSUMPTION' });
  }
  const conflicts = (raw.metadataConflicts ?? []).map((conflict: RecordData) =>
    `Vanha metadata: ${conflict.oldValuesM?.join(' x ')} m. Uudempi metadata: ${conflict.newerValuesMm?.join(' x ')} mm. ${conflict.displayPolicy}`,
  );
  return {
    id, title: raw.display.title,
    status: raw.display.status ?? 'WORK_TEST - historiallinen suunnitelma, viitteellinen sijainti',
    facts,
    sources: (raw.sources ?? []).filter((source: RecordData) => allowedSourceCardUrl(source.url)).map((source: RecordData) => ({
      title: source.title ?? source.section ?? source.driveId ?? 'Lähde',
      url: source.url, role: text(source.role),
      supports: texts(source.supports),
      limits: [
        ...texts(source.doesNotEstablish),
        ...(source.isPrimaryMeasurementRecord === false ? ['Ei alkuperäinen mittaustallenne tai riippumaton uusi mittaus.'] : []),
      ],
    })),
    conflicts,
    notes: [...texts(raw.notes), ...texts(raw.modelAuditNotes),
      'WORK_TEST. Lähdeviite tai rajattu katselmus ei vahvista nykyistä sijaintia tai toteumaa.'],
  };
};

type IndexedCard = { id: string; moduleId: string; module: RecordData; raw: RecordData; binding: RecordData; notes?: string[];
  kphGroup?: RecordData; cardRevision?: SelectionSourceCard };

const validIndex = (value: unknown): value is number => Number.isInteger(value) && Number(value) >= 0;
const validSha = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const sameValues = (first: unknown, second: unknown) => JSON.stringify(first) === JSON.stringify(second);

/** Explicitly audited D2F versions reuse card content, never another version's
 * numeric selectors. The original handoff and payload bytes remain unchanged. */
const appendD2FVersionBindings = (bundle: SourceCardBundle, entries: IndexedCard[], keys: Set<string>) => {
  const additional = bundle.versionBindings;
  if (!additional) return;
  const invalid = () => { throw Error('D2F-lähdekortin versiosidontaa ei ole varmennettu.'); };
  if (additional.schema !== 'ylisrinne-source-card-version-bindings-v1' || !Array.isArray(additional.versions)) invalid();
  const originalCards = new Map(entries.filter(entry => entry.moduleId === 'D2015').map(entry => [entry.id, entry]));
  const scopes = new Set(entries.map(entry => entry.module.model.sha256));
  let count = 0;
  for (const version of additional.versions) {
    const model = version.model;
    const originalModule = bundle.modules.D2015;
    if (version.moduleId !== 'D2015' || version.sourceModelSha256 !== originalModule.model.sha256 ||
        !validSha(model?.sha256) || scopes.has(model.sha256) || model.sceneIndex !== 0 ||
        !validIndex(model.byteLength) || model.byteLength === 0 || !['drive-source', 'published-scene'].includes(model.kind) ||
        !Array.isArray(version.bindings) || version.bindings.length !== originalModule.cards.length ||
        version.audit?.geometryAndTransformsUnchanged !== true || version.audit?.semanticFieldsUnchanged !== true ||
        !validSha(version.audit?.geometryProofSha256)) invalid();
    scopes.add(model.sha256);
    const cardIds = new Set<string>();
    let links = 0;
    for (const item of version.bindings) {
      const source = originalCards.get(item.integrationCardId);
      const selector = item.selector;
      if (!source || cardIds.has(source.id) || !selector) invalid();
      const original = source!.raw.selector;
      const isGroup = source!.raw.sourceGroupKey !== null;
      const expectedRoot = isGroup ? 'P186E_X1_D2015_GROUP_LABEL_ANCHORS_ROOT_BABYLON_Y_UP' : 'P186E_X1_D2015_SPECIAL_LABEL_ANCHORS_ROOT_BABYLON_Y_UP';
      if (selector.nodeName !== original.nodeName || selector.extrasKey !== original.extrasKey || selector.extrasValue !== original.extrasValue ||
          !validIndex(selector.nodeIndex) || !validIndex(selector.meshIndex) ||
          !Array.isArray(selector.nodePath) || selector.nodePath.length !== 2 || !selector.nodePath.every(validIndex) ||
          selector.nodePath[0] === selector.nodeIndex || selector.nodePath[1] !== selector.nodeIndex ||
          !sameValues(selector.nodePathNames, [expectedRoot, original.nodeName]) ||
          selector.extraGuards?.hostStorey !== 'D_2F' ||
          selector.extraGuards?.sourcePdfDriveId !== source!.raw.sources[0].driveId ||
          (isGroup && (selector.extraGuards.sourceGroupKey !== source!.raw.sourceGroupKey ||
            selector.extraGuards.sourceOccurrenceOrdinal !== source!.raw.sourceOccurrenceOrdinal ||
            selector.extraGuards.sourceScheduleName !== source!.raw.sourceTextVerbatim)) ||
          (!isGroup && (selector.extraGuards.sourceText !== source!.raw.sourceTextVerbatim || selector.extraGuards.sourceGroupKey !== undefined)) ||
          !Array.isArray(selector.sourceLinkGuards) || selector.sourceLinkGuards.length !== source!.raw.sources.length ||
          !Array.isArray(item.notes) || item.notes.some((note: unknown) => typeof note !== 'string') || (!isGroup && item.notes.length > 0)) invalid();
      for (const reference of source!.raw.sources) {
        const matches = selector.sourceLinkGuards.filter((link: RecordData) => link.link === reference.url);
        const role = reference.role === 'group_name' ? 'support' : 'primary';
        if (matches.length !== 1 || !allowedSourceCardUrl(matches[0].link) || matches[0].docId !== `DOC:${reference.driveId}` ||
            matches[0].role !== role || (role === 'support' && matches[0].documentDate !== '2014-12-30')) invalid();
      }
      const key = `${model.sha256}:${model.sceneIndex}:${selector.nodeIndex}`;
      if (keys.has(key)) invalid();
      keys.add(key); cardIds.add(source!.id); links += selector.sourceLinkGuards.length; count++;
      entries.push({ ...source!, module: { ...source!.module, model }, binding: selector, notes: item.notes });
    }
    if (cardIds.size !== originalCards.size || version.audit.cardCount !== cardIds.size || version.audit.sourceRoleRecords !== links) invalid();
  }
  if (additional.totals?.modelVersions !== additional.versions.length || additional.totals?.targetBindings !== count) invalid();
};

const kphDimmer = 'OWNER_CONFIRMED_LIGHT_BRIGHTNESS_DIMMER_20261020';

/** The two KPH cards share a model, but have separate component roots. Numeric
 * paths and the later switch evidence are audited for each exact GLB. */
const appendKphVersionBindings = (bundle: SourceCardBundle, entries: IndexedCard[], keys: Set<string>) => {
  const additional = bundle.kphVersionBindings;
  if (!additional) return;
  const invalid = () => { throw Error('KPH-lähdekortin versiosidontaa ei ole varmennettu.'); };
  if (additional.schema !== 'ylisrinne-kph-source-card-version-bindings-v1' || !Array.isArray(additional.versions)) invalid();
  const revision = additional.switchCardRevision, originalCard = bundle.modules.KPH09_SWITCH.cards[0];
  const originalView = adaptSourceCard(`KPH09_SWITCH::${originalCard.cardId}`, originalCard);
  const revised = revision?.card;
  if (!revised || revised.id !== originalView.id || revised.title !== originalView.title ||
      !Array.isArray(revised.facts) || revised.facts.length !== originalView.facts.length ||
      [0, 2, 3, 5].some(index => !sameValues(revised.facts[index], originalView.facts[index])) ||
      revised.facts[1]?.label !== originalView.facts[1].label || revised.facts[1].kind !== 'observation' ||
      revised.facts[4]?.label !== originalView.facts[4].label || revised.facts[4].kind !== 'observation' ||
      revised.facts[4].evidence !== 'USER_CONFIRMED_FUNCTION_COVERAGE_SECTION_28' ||
      !sameValues(revised.notes, originalView.notes) || !Array.isArray(revised.conflicts) ||
      revised.conflicts.some((item: unknown) => typeof item !== 'string') || !Array.isArray(revised.sources) || revised.sources.length !== 3 ||
      !sameValues(revised.sources[0], originalView.sources[0]) || revised.sources[1].url !== originalView.sources[1].url ||
      revised.sources[1].role !== originalView.sources[1].role || !sameValues(revised.sources[1].limits, originalView.sources[1].limits) ||
      revised.sources.some((source: RecordData) => !allowedSourceCardUrl(source.url)) ||
      revised.sources[2].url !== `https://docs.google.com/document/d/${revision.reviewSourceDriveId}/edit` ||
      revised.sources[2].role !== 'owner_visual_proportion_and_function_review') invalid();
  const originalScopes = new Set(entries.map(entry => entry.module.model.sha256));
  let count = 0;
  for (const version of additional.versions) {
    const model = version.model;
    if (!validSha(model?.sha256) || originalScopes.has(model.sha256) || model.sceneIndex !== 0 ||
        !validIndex(model.byteLength) || model.byteLength === 0 || !['drive-source', 'published-scene'].includes(model.kind) ||
        !Array.isArray(version.groups) || version.groups.length !== 2 ||
        version.audit?.geometryAndTransformsUnchanged !== true || version.audit?.semanticFieldsReviewed !== true ||
        version.audit.cardCount !== 2 || version.audit.bindingCount !== 22 || !validSha(version.audit.geometryProofSha256)) invalid();
    originalScopes.add(model.sha256);
    const modules = new Set<string>();
    let links = 0;
    for (const group of version.groups) {
      const moduleId = group.moduleId;
      if (!['KPH09_SWITCH', 'KPH_MIRROR'].includes(moduleId) || modules.has(moduleId)) invalid();
      modules.add(moduleId);
      const module = bundle.modules[moduleId], raw = module.cards[0];
      const original = raw.targetBindings, root = original[0];
      if (version.sourceModelSha256 !== module.model.sha256 || group.integrationCardId !== `${moduleId}::${raw.cardId}` ||
          !validIndex(group.roomNodeIndex) || !validIndex(group.rootNodeIndex) || group.roomNodeIndex === group.rootNodeIndex ||
          group.roomNodeName !== 'D1F_ROOM_KPH09_PHOTO_PROPORTIONED_FLAT_ROCKER_AND_FLAT_DIAL_WORK_TEST' ||
          group.rootNodeName !== root.nodeName || !Array.isArray(group.bindings) || group.bindings.length !== original.length ||
          !group.rootExtraGuards || !Array.isArray(group.rootSourceLinkGuards)) invalid();
      if (moduleId === 'KPH09_SWITCH') {
        const guards = group.rootExtraGuards;
        if (group.cardRevision !== 'owner-dimmer-and-frame-20261022' || guards.rotaryDimmingFunction !== kphDimmer ||
            guards.userConfirmedLowerControl !== 'BATHROOM_LIGHT_ROTARY_DIMMER' ||
            guards.unmeasuredFrameWidthM_WORK_ASSUMPTION !== 0.092 || guards.unmeasuredFrameHeightM_WORK_ASSUMPTION !== 0.148 ||
            guards.sourcePhotoDriveId !== raw.sources[0].driveId || guards.userMeasuredCoverTopM !== 1.02 ||
            guards.ownerConfirmedDimmer20261020?.sourceDocument !== raw.sources[1].url ||
            guards.ownerConfirmedDimmer20261020?.geometryChanged !== false ||
            !group.rootSourceLinkGuards.some((link: RecordData) => link.docId === `DOC:${revision.reviewSourceDriveId}`)) invalid();
      } else if (group.cardRevision !== 'original' || group.rootExtraGuards.donorGLBSha256 !== module.donor.glbSha256 ||
          group.rootExtraGuards.donorMeasuredZipDriveId !== module.donor.driveId) invalid();
      const seen = new Set<string>();
      for (const selector of group.bindings) {
        const source = original.find((item: RecordData) => item.nodeName === selector.nodeName);
        const isRoot = selector.nodeIndex === group.rootNodeIndex;
        const path = isRoot ? [group.roomNodeIndex, group.rootNodeIndex] : [group.roomNodeIndex, group.rootNodeIndex, selector.nodeIndex];
        const names = isRoot ? [group.roomNodeName, group.rootNodeName] : [group.roomNodeName, group.rootNodeName, selector.nodeName];
        if (!source || seen.has(selector.nodeName) || isRoot !== (source === root) || !validIndex(selector.nodeIndex) ||
            (source.meshIndex === null ? selector.meshIndex !== null : !validIndex(selector.meshIndex)) ||
            selector.sourceField !== (source.sourceField ?? source.sourceKey) ||
            selector.sourceFieldValue !== (source.sourceFieldValue ?? source.sourceValue) ||
            selector.sourceDonorNode !== source.sourceDonorNode || !sameValues(selector.nodePath, path) ||
            !sameValues(selector.nodePathNames, names) || !Array.isArray(selector.sourceLinkGuards)) invalid();
        const expectedSources = [...raw.sources.map((source: RecordData) => source.url)];
        if (moduleId === 'KPH09_SWITCH' && (isRoot || source === original.at(-1)))
          expectedSources.push(revised.sources[2].url);
        if (selector.sourceLinkGuards.length !== expectedSources.length || expectedSources.some(url =>
          selector.sourceLinkGuards.filter((link: RecordData) => link.link === url && link.role === 'support' &&
            allowedSourceCardUrl(link.link) && link.docId === `DOC:${url.match(/\/d\/([^/]+)/)?.[1]}`).length !== 1)) invalid();
        if (isRoot && !sameValues(selector.sourceLinkGuards, group.rootSourceLinkGuards)) invalid();
        const key = `${model.sha256}:${model.sceneIndex}:${selector.nodeIndex}`;
        if (keys.has(key)) invalid();
        keys.add(key); seen.add(selector.nodeName); links += selector.sourceLinkGuards.length; count++;
        entries.push({ id: group.integrationCardId, moduleId, module: { ...module, model }, raw, binding: selector, kphGroup: group,
          ...(moduleId === 'KPH09_SWITCH' ? { cardRevision: revised } : {}) });
      }
    }
    if (version.audit.sourceRoleRecords !== links) invalid();
  }
  if (additional.totals?.modelVersions !== additional.versions.length || additional.totals?.targetBindings !== count) invalid();
};

const adaptVersionedCard = (entry: IndexedCard) => {
  const card = entry.cardRevision ? structuredClone(entry.cardRevision) : adaptSourceCard(entry.id, entry.raw);
  card.notes.push(...(entry.notes ?? []));
  return card;
};

/** Reject incomplete/ambiguous handoffs rather than widening a card's scope. */
export const indexSourceCardBundle = (bundle: SourceCardBundle): IndexedCard[] => {
  if (bundle.schema !== 'ylisrinne-viewer-source-cards-v1' ||
      bundle.manifest?.schema !== 'ylisrinne-source-card-integration-handoff-v1') throw Error('Lähdekorttien tietomuoto ei täsmää.');
  const entries: IndexedCard[] = [];
  const keys = new Set<string>();
  for (const specification of bundle.manifest.modules) {
    const module = bundle.modules[specification.module];
    if (module?.model?.sha256 !== specification.modelSha256 || module.model.sceneIndex !== specification.sceneIndex ||
        module.cards.length !== specification.cardCount) throw Error('Lähdekorttien moduuli ei täsmää.');
    for (const raw of module.cards) {
      const id = `${specification.module}::${raw.reviewLabel ?? raw.cardId}`;
      for (const binding of raw.selector ? [raw.selector] : raw.targetBindings) {
        const key = `${module.model.sha256}:${module.model.sceneIndex}:${binding.nodeIndex}`;
        if (keys.has(key)) throw Error('Lähdekortin kohdistus on moniselitteinen.');
        keys.add(key);
        const lookup = bundle.lookup.bindings.filter(item => item.modelSha256 === module.model.sha256 &&
          item.sceneIndex === module.model.sceneIndex && item.nodeIndex === binding.nodeIndex);
        if (lookup.length !== 1 || lookup[0].integrationCardId !== id || lookup[0].nodeName !== binding.nodeName) throw Error('Lähdekorttien valintaindeksi ei täsmää.');
        entries.push({ id, moduleId: specification.module, module, raw, binding });
      }
    }
  }
  if (new Set(entries.map(entry => entry.id)).size !== bundle.manifest.totals.cards ||
      entries.length !== bundle.manifest.totals.targetBindings || entries.length !== bundle.lookup.bindings.length) throw Error('Lähdekorttien kattavuus ei täsmää.');
  appendD2FVersionBindings(bundle, entries, keys);
  appendKphVersionBindings(bundle, entries, keys);
  return entries;
};

type GltfSource = { parser?: { json?: RecordData; associations?: Map<object, RecordData>; getDependencies?: (type: string) => Promise<object[]> }; scenes?: any[] };
type SourceNode = { name?: string; parent?: SourceNode | null; userData?: RecordData };

/** GLTFLoader prunes its association map between scenes. Its node cache still
 * identifies the original node objects by source index. Keep a private copy,
 * leaving both GLTFLoader and the model metadata untouched. */
export const sourceCardIdentity = async (gltf: GltfSource): Promise<GltfSource> => {
  if (!gltf.parser?.getDependencies) return gltf;
  const nodes = await gltf.parser.getDependencies('node');
  const associations = new Map(gltf.parser.associations);
  const seen = new Set<object>();
  const ambiguous = new Set<object>();
  nodes.forEach((node, index) => {
    if (seen.has(node) || (associations.get(node)?.nodes !== undefined && associations.get(node)?.nodes !== index)) {
      ambiguous.add(node);
    } else associations.set(node, { ...associations.get(node), nodes: index });
    seen.add(node);
  });
  for (const node of ambiguous) associations.delete(node);
  return { scenes: gltf.scenes, parser: { json: gltf.parser.json, associations } };
};

// Select the unique path in the actual internal scene. Transport filenames are never selectors.
const sourcePaths = (json: RecordData, sceneIndex: number, target: number): number[][] => {
  const found: number[][] = [];
  const walk = (index: number, path: number[]) => {
    if (path.includes(index) || path.length > 128 || found.length > 1) return;
    const next = [...path, index];
    if (index === target) { found.push(next); return; }
    for (const child of json.nodes?.[index]?.children ?? []) walk(child, next);
  };
  for (const index of json.scenes?.[sceneIndex]?.nodes ?? []) walk(index, []);
  return found;
};

export const createSourceCardResolver = (
  gltf: GltfSource, sha256: string | null, bundle: SourceCardBundle | null, failure?: string,
): ((object: SourceNode) => SelectionSourceEvidence) => {
  const version = sha256 ? `GLB ${sha256}` : 'GLB-versiota ei varmennettu';
  let index: IndexedCard[] = [];
  try { if (bundle) index = indexSourceCardBundle(bundle); } catch (error) { failure = String(error); }
  const json = gltf.parser?.json;
  const associations = gltf.parser?.associations;
  return (object) => {
    const result = (state: SelectionSourceEvidence['state'], reason?: string, cards: SelectionSourceCard[] = [], scene?: number): SelectionSourceEvidence => ({
      state, version: `${version}${scene === undefined ? '' : ` / scene ${scene}`}`, reason, cards,
    });
    if (!bundle || failure) return result('unavailable', failure ?? 'Lähdekorttiaineistoa ei voitu ladata.');
    if (!sha256 || !json || !associations || !Array.isArray(gltf.scenes)) return result('mismatch', 'Mallin tavutunniste tai alkuperäinen valintakohdistus puuttuu.');
    let current: SourceNode | null | undefined = object;
    let selected: SourceNode | undefined;
    let nodeIndex: number | undefined;
    let sceneIndex = -1;
    const runtimePath: number[] = [];
    const visited = new Set<object>();
    while (current && !visited.has(current) && visited.size < 128) {
      visited.add(current);
      const candidateScene = gltf.scenes.indexOf(current);
      if (candidateScene >= 0) { sceneIndex = candidateScene; break; }
      const association = associations.get(current);
      if (Number.isInteger(association?.nodes)) {
        if (nodeIndex === undefined) { nodeIndex = association!.nodes; selected = current; }
        runtimePath.push(association!.nodes);
      }
      current = current.parent;
    }
    const node = nodeIndex === undefined ? undefined : json.nodes?.[nodeIndex];
    const entry = index.find(item => item.module.model.sha256 === sha256 &&
      item.module.model.sceneIndex === sceneIndex && item.binding.nodeIndex === nodeIndex);
    if (!entry) {
      const known = index.some(item => item.binding.nodeName === node?.name || item.binding.nodeName === object.name);
      return result(known ? 'mismatch' : 'unbound', known ? 'Mallin SHA-256, sisäinen scene tai solmu ei vastaa lähdekortin versiota.' : undefined, [], sceneIndex >= 0 ? sceneIndex : undefined);
    }
    const { binding, moduleId, module, kphGroup } = entry;
    const paths = sourcePaths(json, sceneIndex, binding.nodeIndex);
    if (paths.length !== 1 || runtimePath.join(',') !== [...paths[0]].reverse().join(',')) return result('mismatch', 'Objektin parent/root-polku ei täsmää alkuperäiseen sceneen.', [], sceneIndex);
    if (binding.nodePath && (!sameValues(paths[0], binding.nodePath) ||
        !sameValues(paths[0].map(index => json.nodes[index].name), binding.nodePathNames))) return result('mismatch', 'Versiosidonnan root-polku ei täsmää.', [], sceneIndex);
    if (node.name !== binding.nodeName || selected?.name !== binding.nodeName ||
        (binding.meshIndex !== undefined && (node.mesh ?? null) !== binding.meshIndex)) return result('mismatch', 'Objektin lähdenimi tai mesh ei täsmää.', [], sceneIndex);
    const field = binding.extrasKey ?? binding.sourceField ?? binding.sourceKey;
    const expected = binding.extrasValue ?? binding.sourceFieldValue ?? binding.sourceValue;
    if (field && (node.extras?.[field] !== expected || selected?.userData?.[field] !== expected)) return result('mismatch', 'Objektin lähdekenttä ei täsmää.', [], sceneIndex);
    for (const [key, value] of Object.entries(binding.extraGuards ?? {})) {
      if (!sameValues(node.extras?.[key], value) || !sameValues(selected?.userData?.[key], value)) return result('mismatch', 'Versiosidonnan lähdetieto ei täsmää.', [], sceneIndex);
    }
    if (binding.sourceLinkGuards) {
      for (const rawLinks of [node.extras?.sourceLinks, selected?.userData?.sourceLinks]) {
        if (!Array.isArray(rawLinks) || rawLinks.length !== binding.sourceLinkGuards.length ||
            binding.sourceLinkGuards.some((expected: RecordData) => rawLinks.filter((link: RecordData) =>
              link && Object.entries(expected).every(([key, value]) => link[key] === value)).length !== 1)) return result('mismatch', 'Versiosidonnan lähdelinkit tai roolit eivät täsmää.', [], sceneIndex);
      }
    }
    if (kphGroup) {
      const root = json.nodes[kphGroup.rootNodeIndex];
      let rootObject: SourceNode | null | undefined = selected;
      while (rootObject && associations.get(rootObject)?.nodes !== kphGroup.rootNodeIndex) rootObject = rootObject.parent;
      if (!rootObject || root.name !== kphGroup.rootNodeName || rootObject.name !== kphGroup.rootNodeName ||
          Object.entries(kphGroup.rootExtraGuards).some(([key, value]) =>
            !sameValues(root.extras?.[key], value) || !sameValues(rootObject!.userData?.[key], value)) ||
          [root.extras?.sourceLinks, rootObject.userData?.sourceLinks].some(links => !Array.isArray(links) ||
            links.length !== kphGroup.rootSourceLinkGuards.length || kphGroup.rootSourceLinkGuards.some((expected: RecordData) =>
              links.filter((link: RecordData) => link && Object.entries(expected).every(([key, value]) => sameValues(link[key], value))).length !== 1)))
        return result('mismatch', 'KPH-version ryhmän lähdetiedot tai toiminto eivät täsmää.', [], sceneIndex);
    }
    if (moduleId === 'KPH09_SWITCH' && !kphGroup &&
        (paths[0][0] !== 119 || (binding.nodeIndex !== 263 && paths[0].at(-2) !== 263))) return result('mismatch', 'Kytkinryhmän hierarkia ei täsmää.', [], sceneIndex);
    if (moduleId === 'KPH_MIRROR') {
      const rootIndex = kphGroup?.rootNodeIndex ?? 221;
      const root = json.nodes[rootIndex];
      if (paths[0][0] !== (kphGroup?.roomNodeIndex ?? 119) || !paths[0].includes(rootIndex) ||
          root.extras?.donorGLBSha256 !== module.donor.glbSha256 ||
          root.extras?.donorMeasuredZipDriveId !== module.donor.driveId ||
          (binding.sourceDonorNode !== undefined &&
           (node.extras?.sourceDonorNode !== binding.sourceDonorNode || selected?.userData?.sourceDonorNode !== binding.sourceDonorNode))) return result('mismatch', 'Peilikaapin root/donor-kohdistus ei täsmää.', [], sceneIndex);
    }
    const card = adaptVersionedCard(entry);
    return result('matched', undefined, [card], sceneIndex);
  };
};

const sessions = new WeakMap<object, (object: SourceNode) => SelectionSourceEvidence>();
const loadedDigests = new WeakMap<object, string>();
/** The digest of the exact GLB bytes parsed in this load session, never catalog metadata. */
export const loadedModelSha256 = (gltf: object) => loadedDigests.get(gltf) ?? null;
const loadedNodeAssociations = new WeakMap<object, Map<object, { nodes: number }>>();
/**
 * The parsed model with source node indices restored for every scene object.
 * GLTFLoader keeps none for multi-scene GLBs; the map is captured from the
 * pristine parse, so later viewer helpers cannot shift the structure.
 */
export const sourceNodeModel = <T extends object>(gltf: T): T =>
  createSourceNodeView(gltf, loadedNodeAssociations.get(gltf)) as T;
let bundleRequest: Promise<{ bundle: SourceCardBundle | null; failure?: string }> | undefined;
const getBundle = () => bundleRequest ??= (async () => {
  try {
    const response = await fetch('/private-model/source-cards.json', { credentials: 'same-origin', signal: AbortSignal.timeout(5000) });
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw Error('Lähdekorttien käyttöoikeus tai lataus ei onnistunut.');
    return { bundle: await response.json() as SourceCardBundle };
  } catch { return { bundle: null, failure: 'Lähdekorttien käyttöoikeus tai lataus ei onnistunut. Mallin valinta toimii edelleen.' }; }
})();

/** Hash the same bytes passed to the existing GLTFLoader, never a catalog claim or a second fetch. */
export const loadModelWithSourceCards = async <T extends GltfSource & object>(
  loader: { parseAsync(data: ArrayBuffer, path: string): Promise<T> }, path: string,
): Promise<T> => {
  const url = new URL(path, window.location.href);
  if (url.origin !== window.location.origin || !url.pathname.startsWith('/private-model/')) throw Error('Virheellinen mallipolku.');
  const response = await fetch(url, { credentials: 'same-origin', signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw Error('Suojatun mallin lataus ei onnistunut.');
  const bytes = await response.arrayBuffer();
  const [gltf, digest, cards] = await Promise.all([
    loader.parseAsync(bytes, new URL('.', url).href),
    crypto.subtle.digest('SHA-256', bytes).then(value => Array.from(new Uint8Array(value), byte => byte.toString(16).padStart(2, '0')).join('')).catch(() => null),
    getBundle(),
  ]);
  let identity: GltfSource = gltf;
  try { identity = await sourceCardIdentity(gltf); } catch { /* Cards fail closed, model loading remains available. */ }
  // After the full node cache is loaded: getDependencies('node') above moves
  // shared children into orphan parents, and later lookups can no longer steal
  // the rehydrated per-scene copies. Exact HI20 52scene SHA only.
  try {
    const staged = await rehydrateHi20Unified52SourceScenes(gltf, digest);
    const cardMap = identity !== gltf ? identity.parser?.associations : undefined;
    if (staged && cardMap) for (const objects of staged.values())
      for (const [id, object] of objects) cardMap.set(object, { ...cardMap.get(object), nodes: id });
  } catch { /* Keep the loader graph; exact presentations fail closed. */ }
  // Default scene, plus the three C80R2 successor floor scenes when present.
  const json = gltf.parser?.json;
  const chain = resolveC80R2ChainFloorScenes(json);
  const rehydrate = new Set<number>([json?.scene ?? 0, ...(chain ? [chain['1F'], chain['2F'], chain.BOTH] : [])]);
  for (const sceneIndex of rehydrate) {
    try {
      const rebuilt = await rehydrateIncompleteScene(gltf, sceneIndex);
      const cardMap = identity !== gltf ? identity.parser?.associations : undefined;
      if (rebuilt && cardMap) for (const [object, id] of rebuilt)
        cardMap.set(object, { ...cardMap.get(object), nodes: id });
    } catch { /* Keep the loader graph for this scene. */ }
  }
  sessions.set(gltf, createSourceCardResolver(identity, digest, cards.bundle, cards.failure));
  if (digest) loadedDigests.set(gltf, digest);
  try { loadedNodeAssociations.set(gltf, buildSourceNodeAssociations(gltf)); } catch { /* Presentations fail closed. */ }
  return gltf;
};

export const sourceCardResolverForModel = (gltf: object) => sessions.get(gltf) ?? createSourceCardResolver(gltf, null, null,
  'Tämän erikoisnäkymän lähdekorttikohdistusta ei ole varmennettu.');
