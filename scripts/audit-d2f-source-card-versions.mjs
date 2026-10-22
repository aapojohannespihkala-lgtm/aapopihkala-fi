import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createSourceCardResolver, sourceCardIdentity } from '../src/scripts/privateModelSourceCards.ts';

// Reproducible audit of the three explicitly named GLBs. Model bytes stay out
// of Git. --write refreshes reviewable binding data, never a GLB or publication.
const [originalPath, rawPath, publishedPath, mode] = process.argv.slice(2);
assert(originalPath && rawPath && publishedPath, 'Usage: node scripts/audit-d2f-source-card-versions.mjs ORIGINAL.glb SOURCE.glb PUBLISHED.glb [--write]');
assert(mode === undefined || mode === '--write');
const base = new URL('../worker/private-model-source-cards/', import.meta.url);
const read = name => JSON.parse(readFileSync(new URL(name, base), 'utf8'));
const module = read('modules/D2015/source_cards.json');
const hash = value => createHash('sha256').update(value).digest('hex');
const candidateId = 'auto-ylisrinne-d2015-d2f-keskuskaavio2014-sourcelinks-work-test-20261022-1wdqv2k5';
const targets = [
  { path: rawPath, kind: 'drive-source', sha256: '826a74615f47f15d516d2956b9649ec23a89976b0fb8b0ab48bd5b230ef2bf5c' },
  { path: publishedPath, kind: 'published-scene', sha256: 'd16d6c3e14eafaa8da09d0cef17dcabe3c36aab5a5cae05c97eea5e2e50f6403' },
];
globalThis.ProgressEvent ??= class { constructor(type, data) { Object.assign(this, { type }, data); } };
const load = async path => {
  const bytes = readFileSync(path);
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const identity = await sourceCardIdentity(gltf);
  return { bytes, sha256: hash(bytes), gltf, identity, json: gltf.parser.json };
};
const find = (model, scene, key, value) => {
  const matches = [];
  model.gltf.scenes[scene].updateMatrixWorld(true);
  model.gltf.scenes[scene].traverse(object => {
    const index = model.identity.parser.associations.get(object)?.nodes;
    if (Number.isInteger(index) && model.json.nodes[index].extras?.[key] === value) matches.push({ object, index });
  });
  assert.equal(matches.length, 1, `Ambiguous/missing ${key}=${value}`);
  const match = matches[0], path = [];
  let current = match.object;
  while (current && current !== model.gltf.scenes[scene]) {
    const index = model.identity.parser.associations.get(current)?.nodes;
    if (Number.isInteger(index)) path.unshift(index);
    current = current.parent;
  }
  assert.equal(current, model.gltf.scenes[scene]);
  return { ...match, path, node: model.json.nodes[match.index] };
};
const geometrySignature = object => {
  const primitives = [];
  object.traverse(mesh => {
    if (!mesh.geometry?.getAttribute('position')) return;
    const geometry = mesh.geometry;
    primitives.push({
      type: mesh.type,
      matrixWorld: mesh.matrixWorld.elements,
      attributes: Object.fromEntries(Object.entries(geometry.attributes).sort(([a], [b]) => a.localeCompare(b)).map(([name, attribute]) =>
        [name, { itemSize: attribute.itemSize, normalized: attribute.normalized, values: Array.from(attribute.array) }],
      )),
      indices: geometry.index ? Array.from(geometry.index.array) : null,
    });
  });
  assert(primitives.length > 0);
  return hash(JSON.stringify(primitives));
};
const original = await load(originalPath);
assert.equal(original.sha256, module.model.sha256);
const versions = [], fixture = {}, loadedTargets = [];
for (const target of targets) {
  const model = await load(target.path);
  assert.equal(model.sha256, target.sha256);
  assert.equal(model.json.scenes.length, 1);
  const bindings = [], geometryProofs = [], keep = new Set();
  for (const card of module.cards) {
    const selector = card.selector;
    const old = find(original, module.model.sceneIndex, selector.extrasKey, selector.extrasValue);
    const current = find(model, 0, selector.extrasKey, selector.extrasValue);
    assert.equal(old.index, selector.nodeIndex);
    assert.equal(current.node.name, selector.nodeName);
    assert.deepEqual(current.path.map(i => model.json.nodes[i].name), old.path.map(i => original.json.nodes[i].name));
    const geometry = geometrySignature(current.object);
    assert.equal(geometry, geometrySignature(old.object), `Geometry/world transform changed: ${card.reviewLabel}`);
    geometryProofs.push([card.reviewLabel, geometry]);
    const extraKeys = ['hostStorey', 'representationKind', 'sourcePdfDriveId', 'sourceGroupKey', 'sourceOccurrenceOrdinal', 'sourceScheduleName', 'sourceText'];
    const extraGuards = {};
    for (const key of extraKeys) {
      if (old.node.extras[key] === undefined) continue;
      assert.deepEqual(current.node.extras[key], old.node.extras[key], `${card.reviewLabel}: ${key}`);
      extraGuards[key] = current.node.extras[key];
    }
    assert.equal(current.node.extras.asBuilt, false);
    assert.equal(current.node.extras.current, false);
    assert.equal(current.node.extras.canonical, false);
    const links = current.node.extras.sourceLinks;
    assert.equal(links.length, card.sources.length);
    const sourceLinkGuards = card.sources.map(source => {
      const link = links.find(link => link.link === source.url);
      assert(link);
      assert.equal(link.role, source.role === 'group_name' ? 'support' : 'primary');
      if (source.role === 'group_name') assert.equal(link.documentDate, '2014-12-30');
      return { docId: link.docId, link: link.link, role: link.role, ...(link.documentDate ? { documentDate: link.documentDate } : {}) };
    });
    bindings.push({
      integrationCardId: `D2015::${card.reviewLabel}`,
      selector: { nodeIndex: current.index, nodeName: current.node.name, meshIndex: current.node.mesh, extrasKey: selector.extrasKey, extrasValue: selector.extrasValue,
        nodePath: current.path, nodePathNames: current.path.map(i => model.json.nodes[i].name), extraGuards, sourceLinkGuards },
      notes: card.sources.some(source => source.role === 'group_name')
        ? ['Keskuskaavion painettu päiväys on 30.12.2014. Vuosi 2015 kuvaa suunnitelma-aineiston arkistokontekstia.'] : [],
    });
    for (const index of current.path) keep.add(index);
  }
  assert.equal(bindings.length, 16);
  // Published node 398 is a D1F label, not G1. Keep that collision in fixtures.
  if (target.kind === 'published-scene') keep.add(398);
  const profile = { moduleId: 'D2015', sourceModelSha256: module.model.sha256,
    model: { sha256: model.sha256, byteLength: model.bytes.length, sceneIndex: 0, kind: target.kind,
      driveId: '1WdqV2K5BSyrmVdzKNV6GXfj-JqG_vYht', ...(target.kind === 'published-scene' ? { candidateId } : {}) },
    audit: { geometryAndTransformsUnchanged: true, semanticFieldsUnchanged: true, cardCount: 16, sourceRoleRecords: 31, geometryProofSha256: hash(JSON.stringify(geometryProofs)) },
    bindings };
  versions.push(profile);
  loadedTargets.push({ model, profile });
  fixture[target.kind] = { sha256: model.sha256, sceneIndex: 0,
    roots: model.json.scenes[0].nodes.filter(index => keep.has(index)),
    nodes: Object.fromEntries([...keep].sort((a, b) => a - b).map(index => {
      const node = model.json.nodes[index];
      const extras = { ...(bindings.find(binding => binding.selector.nodeIndex === index)?.selector.extraGuards ?? {}) };
      for (const key of ['hostStorey', 'sourceGroupKey', 'annotationStableKey', 'sourceLabelId', 'sourceLinks']) if (node.extras?.[key] !== undefined) extras[key] = node.extras[key];
      return [index, { name: node.name, ...(node.mesh === undefined ? {} : { mesh: node.mesh }),
        ...(node.children ? { children: node.children.filter(child => keep.has(child)) } : {}), extras }];
    })) };
}
const output = { schema: 'ylisrinne-source-card-version-bindings-v1', createdDate: '2026-10-22', totals: { modelVersions: 2, targetBindings: 32 }, versions };
const bundle = { schema: 'ylisrinne-viewer-source-cards-v1', manifest: read('integration_manifest.json'), lookup: read('selection_lookup.json'),
  modules: { D2015: module, KPH09_SWITCH: read('modules/KPH09_SWITCH/source_cards.json'), KPH_MIRROR: read('modules/KPH_MIRROR/source_cards.json') }, versionBindings: output };
let runtimeBindingsMatched = 0;
for (const { model, profile } of loadedTargets) {
  const before = JSON.stringify(model.json);
  const resolve = createSourceCardResolver(model.identity, model.sha256, bundle);
  for (const binding of profile.bindings) {
    const selected = find(model, 0, binding.selector.extrasKey, binding.selector.extrasValue);
    const result = resolve(selected.object);
    assert.equal(result.state, 'matched', `${profile.model.kind}:${binding.integrationCardId}: ${result.reason}`);
    assert.equal(result.cards[0].id, binding.integrationCardId);
    runtimeBindingsMatched++;
  }
  assert.equal(JSON.stringify(model.json), before);
}
const outputPath = new URL('version_bindings.json', base);
const fixturePath = new URL('../tests/fixtures/private-model-d2f-source-card-versions.json', import.meta.url);
if (mode === '--write') {
  writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
  writeFileSync(fixturePath, JSON.stringify(fixture, null, 2) + '\n');
} else {
  assert.deepEqual(JSON.parse(readFileSync(outputPath, 'utf8')), output);
  assert.deepEqual(JSON.parse(readFileSync(fixturePath, 'utf8')), fixture);
}
console.log(JSON.stringify({ result: 'PASS', versions: 2, auditedBindings: 32, runtimeBindingsMatched, originalCards: 16,
  publishedG1: versions[1].bindings[0].selector.nodeIndex, modelShas: versions.map(version => version.model.sha256) }));
