type RecordData = Record<string, any>;

export type SourceCardBundle = {
  schema: string;
  manifest: RecordData;
  lookup: { cards: RecordData[]; bindings: RecordData[] };
  modules: Record<string, RecordData>;
  versionBindings?: RecordData;
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

type IndexedCard = { id: string; moduleId: string; module: RecordData; raw: RecordData; binding: RecordData; notes?: string[] };

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
    const { binding, moduleId, module, raw, id } = entry;
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
      if (node.extras?.[key] !== value || selected?.userData?.[key] !== value) return result('mismatch', 'Versiosidonnan lähdetieto ei täsmää.', [], sceneIndex);
    }
    if (binding.sourceLinkGuards) {
      for (const rawLinks of [node.extras?.sourceLinks, selected?.userData?.sourceLinks]) {
        if (!Array.isArray(rawLinks) || rawLinks.length !== binding.sourceLinkGuards.length ||
            binding.sourceLinkGuards.some((expected: RecordData) => rawLinks.filter((link: RecordData) =>
              link && Object.entries(expected).every(([key, value]) => link[key] === value)).length !== 1)) return result('mismatch', 'Versiosidonnan lähdelinkit tai roolit eivät täsmää.', [], sceneIndex);
      }
    }
    if (moduleId === 'KPH09_SWITCH' &&
        (paths[0][0] !== 119 || (binding.nodeIndex !== 263 && paths[0].at(-2) !== 263))) return result('mismatch', 'Kytkinryhmän hierarkia ei täsmää.', [], sceneIndex);
    if (moduleId === 'KPH_MIRROR') {
      const root = json.nodes[221];
      if (paths[0][0] !== 119 || !paths[0].includes(221) ||
          root.extras?.donorGLBSha256 !== module.donor.glbSha256 ||
          root.extras?.donorMeasuredZipDriveId !== module.donor.driveId ||
          (binding.sourceDonorNode !== undefined &&
           (node.extras?.sourceDonorNode !== binding.sourceDonorNode || selected?.userData?.sourceDonorNode !== binding.sourceDonorNode))) return result('mismatch', 'Peilikaapin root/donor-kohdistus ei täsmää.', [], sceneIndex);
    }
    const card = adaptSourceCard(id, raw);
    card.notes.push(...(entry.notes ?? []));
    return result('matched', undefined, [card], sceneIndex);
  };
};

const sessions = new WeakMap<object, (object: SourceNode) => SelectionSourceEvidence>();
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
  sessions.set(gltf, createSourceCardResolver(identity, digest, cards.bundle, cards.failure));
  return gltf;
};

export const sourceCardResolverForModel = (gltf: object) => sessions.get(gltf) ?? createSourceCardResolver(gltf, null, null,
  'Tämän erikoisnäkymän lähdekorttikohdistusta ei ole varmennettu.');
