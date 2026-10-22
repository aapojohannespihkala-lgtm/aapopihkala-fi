import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { adaptSourceCard, createSourceCardResolver, sourceCardIdentity } from '../src/scripts/privateModelSourceCards.ts';

// Read-only audit. --write updates only sidecar bindings and metadata fixtures.
// The latest scene extraction is prepared for publication, not proof it is live.
const [originalPath, iv1Path, iv1PublishedPath, latestPath, latestPublishedPath, mode] = process.argv.slice(2);
assert(originalPath && iv1Path && iv1PublishedPath && latestPath && latestPublishedPath,
  'Usage: node scripts/audit-kph-source-card-versions.mjs ORIGINAL.glb IV1.glb IV1_EXTRACT.glb LATEST.glb LATEST_EXTRACT.glb [--write]');
assert(mode === undefined || mode === '--write');
const base = new URL('../worker/private-model-source-cards/', import.meta.url);
const read = name => JSON.parse(readFileSync(new URL(name, base), 'utf8'));
const modules = Object.fromEntries(['D2015', 'KPH09_SWITCH', 'KPH_MIRROR'].map(id => [id, read(`modules/${id}/source_cards.json`)]));
const hash = value => createHash('sha256').update(value).digest('hex');
const pick = (object, keys) => Object.fromEntries(keys.filter(key => object[key] !== undefined).map(key => [key, object[key]]));
const rootKeys = ['sourcePhotoDriveId', 'userMeasuredCoverTopM', 'userMeasuredCoverTopAboveFinishedBathroomFloorM',
  'userConfirmedUpperControl', 'userConfirmedLowerControl', 'rotaryDimmingFunction', 'ownerConfirmedDimmer20261020',
  'unmeasuredFrameWidthM_WORK_ASSUMPTION', 'unmeasuredFrameHeightM_WORK_ASSUMPTION', 'frameWidthMmWorkAssumption',
  'frameHeightMmWorkAssumption', 'exactPhysicalFrameDimensionsVerified', 'absoluteHostXYVerified',
  'donorMeasuredZipDriveId', 'donorGLBSha256', 'saunaFinishedWallFaceCoordinateVerified',
  'presentationOnly', 'asBuilt', 'current', 'CURRENT', 'Canonical', 'publishToCURRENT', 'HUMAN_REVIEW'];
const childKeys = ['referenceDriveId', 'sourceDonorNode', 'status', 'functionalRoleUserConfirmed',
  'functionalRoleEvidence', 'installedModelAndElectricalSpec', 'physicalXYOrZVerified',
  'frameProductNotVerified', 'workWidthMm', 'workHeightMm', 'asBuilt', 'current', 'CURRENT', 'canonical', 'HUMAN_REVIEW'];
const iv1DriveId = '1DjaesisGH_brRucGyoDxTrV9pEmbnnK5';
const latestDriveId = '1YRn2dLK0ZMxdVmCf2Qpxuct6F-GXwNPs';
const candidateId = 'auto-ylisrinne-shared302-kph09-iv1-sourcedocid-v2-work-test-20261022-1djaesis';
const targets = [
  { key: 'kph-iv1-source', path: iv1Path, kind: 'drive-source', driveId: iv1DriveId, sha256: 'e51d0986e1b043177429546b424133a6b89ad5d4c9b56280b0b5ae0e041a3b15' },
  { key: 'kph-iv1-published', path: iv1PublishedPath, kind: 'published-scene', driveId: iv1DriveId, candidateId, sha256: '4f8fb2ecf3fde8470c1d1260773fda47109b34d17bc8847b783975220153a20a' },
  { key: 'kph-latest-source', path: latestPath, kind: 'drive-source', driveId: latestDriveId, sha256: 'b3e4d05ed0c76bf2c89fcb4c32b8d5eda46950487934b90453cea990cc226199' },
  { key: 'kph-latest-extract', path: latestPublishedPath, kind: 'published-scene', driveId: latestDriveId, sha256: 'db67604823671b701fb4822688d66da98362eb19068301496cac1eef53c0e73e' },
];
globalThis.ProgressEvent ??= class { constructor(type, data) { Object.assign(this, { type }, data); } };
const load = async path => {
  const bytes = readFileSync(path);
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const identity = await sourceCardIdentity(gltf);
  return { bytes, sha256: hash(bytes), gltf, identity, json: gltf.parser.json };
};
const find = (model, name) => {
  const matches = [];
  model.gltf.scenes[0].updateMatrixWorld(true);
  model.gltf.scenes[0].traverse(object => {
    const index = model.identity.parser.associations.get(object)?.nodes;
    if (Number.isInteger(index) && model.json.nodes[index].name === name) matches.push({ object, index });
  });
  assert.equal(matches.length, 1, `Ambiguous/missing ${name}`);
  const match = matches[0], path = [];
  let current = match.object;
  while (current && current !== model.gltf.scenes[0]) {
    const index = model.identity.parser.associations.get(current)?.nodes;
    if (Number.isInteger(index)) path.unshift(index);
    current = current.parent;
  }
  assert.equal(current, model.gltf.scenes[0]);
  return { ...match, path, node: model.json.nodes[match.index] };
};
const geometrySignature = object => {
  const primitives = [];
  object.traverse(mesh => {
    if (!mesh.geometry?.getAttribute('position')) return;
    primitives.push({ type: mesh.type, matrixWorld: mesh.matrixWorld.elements,
      attributes: Object.fromEntries(Object.entries(mesh.geometry.attributes).sort(([a], [b]) => a.localeCompare(b)).map(([name, attribute]) =>
        [name, { itemSize: attribute.itemSize, normalized: attribute.normalized, values: Array.from(attribute.array) }])),
      indices: mesh.geometry.index ? Array.from(mesh.geometry.index.array) : null });
  });
  assert(primitives.length > 0);
  return hash(JSON.stringify(primitives));
};
const original = await load(originalPath);
assert.equal(original.sha256, modules.KPH09_SWITCH.model.sha256);
const versions = [], fixtures = {}, loaded = [];
for (const target of targets) {
  const model = await load(target.path);
  assert.equal(model.sha256, target.sha256);
  assert.equal(model.json.scenes.length, 1);
  const groups = [], proofs = [], keep = new Set(), fixtureExtras = new Map();
  let links = 0;
  for (const moduleId of ['KPH09_SWITCH', 'KPH_MIRROR']) {
    const module = modules[moduleId], card = module.cards[0], root = find(model, card.targetBindings[0].nodeName);
    const bindings = [];
    for (const source of card.targetBindings) {
      const old = find(original, source.nodeName), current = find(model, source.nodeName);
      assert.equal(old.index, source.nodeIndex);
      assert.deepEqual(current.path.map(i => model.json.nodes[i].name), old.path.map(i => original.json.nodes[i].name));
      const proof = geometrySignature(current.object);
      assert.equal(proof, geometrySignature(old.object), `Geometry/world transform changed: ${source.nodeName}`);
      proofs.push([source.nodeName, proof]);
      const expectedChanges = moduleId === 'KPH09_SWITCH' && current.index === root.index ? {
        rotaryDimmingFunction: 'OWNER_CONFIRMED_LIGHT_BRIGHTNESS_DIMMER_20261020', userConfirmedLowerControl: 'BATHROOM_LIGHT_ROTARY_DIMMER',
        unmeasuredFrameWidthM_WORK_ASSUMPTION: 0.092, unmeasuredFrameHeightM_WORK_ASSUMPTION: 0.148,
      } : {};
      for (const [key, value] of Object.entries(old.node.extras ?? {})) {
        assert.deepEqual(current.node.extras[key], expectedChanges[key] ?? value, `${source.nodeName}: ${key}`);
      }
      const sourceLinks = current.node.extras.sourceLinks;
      const expectedUrls = card.sources.map(source => source.url);
      if (moduleId === 'KPH09_SWITCH' && [card.targetBindings[0], card.targetBindings.at(-1)].includes(source))
        expectedUrls.push('https://docs.google.com/document/d/1VKZNrkGd87QtwChV5ygs_E_k1Gi2e6iCPQbePpinzJY/edit');
      assert.equal(sourceLinks.length, expectedUrls.length);
      const sourceLinkGuards = expectedUrls.map(url => {
        const matches = sourceLinks.filter(link => link.link === url);
        assert.equal(matches.length, 1);
        assert.equal(matches[0].role, 'support');
        assert.equal(matches[0].docId, `DOC:${url.match(/\/d\/([^/]+)/)[1]}`);
        return pick(matches[0], ['docId', 'link', 'role']);
      });
      const extraGuards = pick(current.node.extras, current.index === root.index ? rootKeys : childKeys);
      const selector = { nodeIndex: current.index, nodeName: source.nodeName, meshIndex: current.node.mesh ?? null,
        ...(source.sourceField ?? source.sourceKey ? { sourceField: source.sourceField ?? source.sourceKey, sourceFieldValue: source.sourceFieldValue ?? source.sourceValue } : {}),
        ...(source.sourceDonorNode === undefined ? {} : { sourceDonorNode: source.sourceDonorNode }),
        nodePath: current.path, nodePathNames: current.path.map(i => model.json.nodes[i].name),
        extraGuards: current.index === root.index ? {} : extraGuards, sourceLinkGuards };
      bindings.push(selector); links += sourceLinks.length;
      fixtureExtras.set(current.index, { ...extraGuards, sourceLinks: sourceLinkGuards });
      for (const index of current.path) keep.add(index);
    }
    groups.push({ moduleId, integrationCardId: `${moduleId}::${card.cardId}`,
      cardRevision: moduleId === 'KPH09_SWITCH' ? 'owner-dimmer-and-frame-20261022' : 'original',
      roomNodeIndex: root.path[0], roomNodeName: model.json.nodes[root.path[0]].name,
      rootNodeIndex: root.index, rootNodeName: root.node.name,
      rootExtraGuards: pick(root.node.extras, rootKeys),
      rootSourceLinkGuards: bindings[0].sourceLinkGuards, bindings });
  }
  const profile = { sourceModelSha256: original.sha256,
    model: { sha256: model.sha256, byteLength: model.bytes.length, sceneIndex: 0, kind: target.kind, driveId: target.driveId,
      ...(target.candidateId ? { candidateId: target.candidateId } : {}) },
    audit: { geometryAndTransformsUnchanged: true, semanticFieldsReviewed: true, cardCount: 2, bindingCount: 22,
      sourceRoleRecords: links, geometryProofSha256: hash(JSON.stringify(proofs)) }, groups };
  versions.push(profile); loaded.push({ model, profile });
  // Old published node 263 is a different, unbound floor object.
  if (target.kind === 'published-scene') keep.add(263);
  fixtures[target.key] = { sha256: model.sha256, sceneIndex: 0,
    roots: model.json.scenes[0].nodes.filter(index => keep.has(index)),
    nodes: Object.fromEntries([...keep].sort((a, b) => a - b).map(index => {
      const node = model.json.nodes[index];
      return [index, { name: node.name, ...(node.mesh === undefined ? {} : { mesh: node.mesh }),
        ...(node.children ? { children: node.children.filter(child => keep.has(child)) } : {}),
        extras: fixtureExtras.get(index) ?? {} }];
    })) };
}
// Version-specific text and source identities remain in the private Worker
// payload. The public browser adapter does not embed model evidence or URLs.
const card = adaptSourceCard('KPH09_SWITCH::KPH09_SWITCH_GROUP_SHARED302', modules.KPH09_SWITCH.cards[0]);
card.status = 'WORK_TEST - ulkonäkö kuvasta, toiminto omistajan vahvistama';
card.facts = card.facts.map(fact => fact.label === 'Himmennys'
  ? { ...fact, value: 'Valohimmennin, omistaja vahvistanut 20.10.2026', kind: 'observation', evidence: 'USER_CONFIRMED_FUNCTION_COVERAGE_SECTION_28' }
  : fact.label === 'Alempi kiertosäädin' ? { ...fact, value: 'Kylpyhuoneen valohimmennin' } : fact);
card.conflicts = ['Vanhan SHARED302-version 110 x 222 mm metadata on tässä versiossa korjattu 92 x 148 mm työoletukseksi. Fyysisiä kehysmittoja ei ole varmennettu.'];
card.sources[1].title = '3D-kattavuus, osiot 11 ja 28';
card.sources[1].supports.push('Osioon 28 kirjattu omistajan vahvistus: alanuppi säätää valojen kirkkautta.');
card.sources.push({ title: 'KPH09-katselmushistoria, kohdat 2, 17 ja 18',
  url: 'https://docs.google.com/document/d/1VKZNrkGd87QtwChV5ygs_E_k1Gi2e6iCPQbePpinzJY/edit', role: 'owner_visual_proportion_and_function_review',
  supports: ['Omistajan valitsema 92:148-työmittasuhde ja kirjattu himmennystoiminto.'],
  limits: ['Fyysisiä tuotemittoja, tuotekoodia, sähköarvoja, johdotusta tai tarkkaa asennuspaikkaa. Koko KPH09:n katselmus on avoin.'] });
// The approval successor has an independent exact GLB bridge audit (SLUI QA §10):
// 22/22 selected nodes, 46/46 source roles, scene0 paths, geometry and transforms
// are identical to the previous published extract. Preserve the audited map;
// approval-only metadata on unrelated nodes does not extend card scope.
const approval = JSON.parse(JSON.stringify(versions.at(-1)));
assert.equal(approval.model.sha256, 'db67604823671b701fb4822688d66da98362eb19068301496cac1eef53c0e73e');
approval.model.sha256 = '6cab3b21177446fe377b703231feddf6837e3b47e0b141627fd866bfad393a2c';
approval.model.byteLength = 2005324;
approval.model.driveId = '1bc9Ji7W6DvJmKsKQJVKpDfLrccT2c3JG';
approval.model.candidateId = 'auto-ylisrinne-kph09-20-viiltoa-omistajan-aukotushyvaksynta-metadata-work-test-20261022-1bc9ji7w';
versions.push(approval);
fixtures['kph-approval-extract'] = { ...JSON.parse(JSON.stringify(fixtures['kph-latest-extract'])), sha256: approval.model.sha256 };
const output = { schema: 'ylisrinne-kph-source-card-version-bindings-v1', createdDate: '2026-10-22',
  switchCardRevision: { reviewSourceDriveId: '1VKZNrkGd87QtwChV5ygs_E_k1Gi2e6iCPQbePpinzJY', card },
  totals: { modelVersions: 5, targetBindings: 110 }, versions };
const bundle = { schema: 'ylisrinne-viewer-source-cards-v1', manifest: read('integration_manifest.json'), lookup: read('selection_lookup.json'),
  modules, versionBindings: read('version_bindings.json'), kphVersionBindings: output };
let runtimeBindingsMatched = 0;
for (const { model, profile } of loaded) {
  const before = JSON.stringify(model.json), resolve = createSourceCardResolver(model.identity, model.sha256, bundle);
  for (const group of profile.groups) for (const binding of group.bindings) {
    const selected = find(model, binding.nodeName), result = resolve(selected.object);
    assert.equal(result.state, 'matched', `${profile.model.sha256}:${binding.nodeIndex}: ${result.reason}`);
    assert.equal(result.cards[0].id, group.integrationCardId);
    if (group.moduleId === 'KPH09_SWITCH') assert.equal(result.cards[0].facts.find(fact => fact.label === 'Himmennys').kind, 'observation');
    runtimeBindingsMatched++;
  }
  assert.equal(JSON.stringify(model.json), before);
}
const outputPath = new URL('kph_version_bindings.json', base);
const fixturePath = new URL('../tests/fixtures/private-model-kph-source-card-versions.json', import.meta.url);
if (mode === '--write') {
  writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
  writeFileSync(fixturePath, JSON.stringify(fixtures, null, 2) + '\n');
} else {
  assert.deepEqual(JSON.parse(readFileSync(outputPath, 'utf8')), output);
  assert.deepEqual(JSON.parse(readFileSync(fixturePath, 'utf8')), fixtures);
}
console.log(JSON.stringify({ result: 'PASS', versions: versions.length, auditedBindings: 88, approvedBridgeBindings: 22, runtimeBindingsMatched,
  sourceRoleRecords: versions.map(version => version.audit.sourceRoleRecords),
  publishedRoots: versions.filter(version => version.model.kind === 'published-scene').map(version => version.groups.map(group => group.rootNodeIndex)),
  latestModelRegistrationVerified: false }));
