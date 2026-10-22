import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import {
  adaptSourceCard, allowedSourceCardUrl, classifySourceEvidence,
  createSourceCardResolver, indexSourceCardBundle, sourceCardIdentity,
  type SourceCardBundle,
} from '../../src/scripts/privateModelSourceCards';
import { privateModelSourceCards } from '../../worker/privateModelSourceCards';
import { handlePrivateModelRequest } from '../../worker/privateModel';
import { getPrivateWorkTestCandidateById } from '../../worker/privateWorkTest';

const fixtures = {
  ...JSON.parse(readFileSync(new URL('../fixtures/private-model-source-cards.json', import.meta.url), 'utf8')),
  ...JSON.parse(readFileSync(new URL('../fixtures/private-model-d2f-source-card-versions.json', import.meta.url), 'utf8')),
  ...JSON.parse(readFileSync(new URL('../fixtures/private-model-kph-source-card-versions.json', import.meta.url), 'utf8')),
};
const bundle = () => structuredClone(privateModelSourceCards);
const model = (name = 'shared302') => {
  const fixture = structuredClone(fixtures[name]);
  const count = Math.max(...Object.keys(fixture.nodes).map(Number)) + 1;
  const nodes = Array.from({ length: count }, (_, index) => fixture.nodes[index] ?? {});
  const objects = nodes.map(node => ({ name: node.name, userData: structuredClone(node.extras ?? {}), parent: null as any }));
  const scenes = Array.from({ length: fixture.sceneIndex + 1 }, (_, index) => ({ nodes: index === fixture.sceneIndex ? fixture.roots : [] }));
  const sceneObjects = scenes.map(() => ({ name: 'original scene', parent: null }));
  nodes.forEach((node, index) => { for (const child of node.children ?? []) objects[child].parent = objects[index]; });
  for (const root of fixture.roots) objects[root].parent = sceneObjects[fixture.sceneIndex];
  const associations = new Map<object, any>(objects.map((object, index) => [object, { nodes: index }]));
  return { sha256: fixture.sha256, objects, gltf: {
    scenes: sceneObjects,
    parser: { json: { nodes, scenes }, associations, getDependencies: async () => objects },
  } };
};

test('T01 original module bytes, 18 cards, 38 unique bindings and 35 source roles are preserved', () => {
  const data = bundle();
  const entries = indexSourceCardBundle({ ...data, versionBindings: undefined, kphVersionBindings: undefined });
  expect(entries).toHaveLength(38);
  expect(new Set(entries.map(entry => entry.id)).size).toBe(18);
  expect(new Set(entries.map(entry => entry.module.model.sha256)).size).toBe(2);
  expect(Object.values(data.modules).reduce((sum, module) => sum + module.cards.reduce((total, card) => total + card.sources.length, 0), 0)).toBe(35);
  for (const module of data.manifest.modules) {
    const raw = readFileSync(new URL(`../../worker/private-model-source-cards/${module.payloadFile}`, import.meta.url));
    expect(createHash('sha256').update(raw).digest('hex')).toBe(module.rawPayloadSha256);
  }
  data.lookup.bindings.push(data.lookup.bindings[0]);
  expect(() => indexSourceCardBundle(data)).toThrow();
});

test('D2F source and published versions add 32 audited bindings without adding cards or changing original handoff counts', () => {
  const data = bundle();
  const entries = indexSourceCardBundle({ ...data, kphVersionBindings: undefined });
  expect(entries).toHaveLength(70);
  expect(new Set(entries.map(entry => entry.id)).size).toBe(18);
  expect(new Set(entries.map(entry => entry.module.model.sha256)).size).toBe(4);
  expect(data.manifest.totals.targetBindings).toBe(38);
  expect(data.lookup.bindings).toHaveLength(38);
  expect(data.versionBindings.totals.targetBindings).toBe(32);
  const source = data.versionBindings.versions.find(version => version.model.kind === 'drive-source')!;
  const published = data.versionBindings.versions.find(version => version.model.kind === 'published-scene')!;
  expect(source.bindings[0].selector.nodeIndex).toBe(398);
  expect(source.bindings[0].selector.nodePath).toEqual([414, 398]);
  expect(published.bindings[0].selector.nodeIndex).toBe(399);
  expect(published.bindings[0].selector.nodePath).toEqual([384, 399]);
  const registered = getPrivateWorkTestCandidateById(published.model.candidateId!);
  expect(registered?.expectedSha256).toBe(published.model.sha256);
  expect(registered?.expectedSize).toBe(published.model.byteLength);
  expect(source.audit.geometryProofSha256).toBe(published.audit.geometryProofSha256);
});

test('all 32 D2F version bindings resolve to the unchanged original cards; published node 398 cannot become G1', async () => {
  const data = bundle();
  const before = JSON.stringify(data);
  for (const version of data.versionBindings.versions) {
    const source = model(version.model.kind);
    const original = JSON.stringify(source.gltf.parser.json);
    const resolve = createSourceCardResolver(await sourceCardIdentity(source.gltf), source.sha256, data);
    for (const binding of version.bindings) {
      const result = resolve(source.objects[binding.selector.nodeIndex]);
      expect(result.state, `${version.model.kind}:${binding.integrationCardId}`).toBe('matched');
      expect(result.cards.map(card => card.id)).toEqual([binding.integrationCardId]);
      if (binding.integrationCardId !== 'D2015::S1') expect(result.cards[0].notes.join(' ')).toContain('30.12.2014');
      else {
        expect(result.cards[0].sources).toHaveLength(1);
        expect(result.cards[0].notes.join(' ')).not.toContain('Keskuskaavio');
      }
    }
    if (version.model.kind === 'published-scene') {
      expect(source.objects[398].userData.hostStorey).toBe('D_1F');
      expect(resolve(source.objects[398]).cards).toEqual([]);
    }
    expect(JSON.stringify(source.gltf.parser.json)).toBe(original);
  }
  expect(JSON.stringify(data)).toBe(before);
});

for (const failure of ['sha', 'scene', 'old-index', 'root-name', 'source-text', 'source-role', 'source-date', 'missing-source']) {
  test(`D2F published binding rejects ${failure} without showing the old card`, () => {
    const source = model('published-scene');
    const selected = source.objects[399];
    if (failure === 'sha') source.sha256 = fixtures['drive-source'].sha256;
    if (failure === 'scene') source.gltf.scenes.unshift({ name: '__scene301 transport name', parent: null });
    if (failure === 'old-index') source.gltf.parser.associations.set(selected, { nodes: 398 });
    if (failure === 'root-name') source.gltf.parser.json.nodes[384].name = 'Unverified root';
    if (failure === 'source-text') selected.userData.sourceScheduleName = 'Wrong circuit';
    if (failure === 'source-role') selected.userData.sourceLinks[1].role = 'primary';
    if (failure === 'source-date') selected.userData.sourceLinks[1].documentDate = '2015-01-01';
    if (failure === 'missing-source') selected.userData.sourceLinks.pop();
    const result = createSourceCardResolver(source.gltf, source.sha256, bundle())(selected);
    expect(result.state).toBe('mismatch');
    expect(result.cards).toEqual([]);
  });
}

for (const failure of ['duplicate-version', 'original-sha', 'stable-key', 'missing-card', 'source-role', 'led-extra-source', 'audit', 'root-path']) {
  test(`D2F version handoff rejects ${failure}`, () => {
    const data: SourceCardBundle = bundle();
    const version = data.versionBindings!.versions[1];
    const binding = version.bindings[0];
    if (failure === 'duplicate-version') version.model.sha256 = data.modules.D2015.model.sha256;
    if (failure === 'original-sha') version.sourceModelSha256 = '0'.repeat(64);
    if (failure === 'stable-key') binding.selector.extrasValue = 'unverified';
    if (failure === 'missing-card') version.bindings.pop();
    if (failure === 'source-role') binding.selector.sourceLinkGuards[1].role = 'primary';
    if (failure === 'led-extra-source') version.bindings[15].selector.sourceLinkGuards.push(binding.selector.sourceLinkGuards[1]);
    if (failure === 'audit') version.audit.geometryAndTransformsUnchanged = false;
    if (failure === 'root-path') binding.selector.nodePath[1] = 398;
    expect(() => indexSourceCardBundle(data)).toThrow('versiosidontaa');
  });
}

test('KPH IV1 and latest photo-slot source/extract versions add 88 bindings for two existing cards', () => {
  const data = bundle(), entries = indexSourceCardBundle(data);
  expect(entries).toHaveLength(158);
  expect(new Set(entries.map(entry => entry.id)).size).toBe(18);
  expect(new Set(entries.map(entry => entry.module.model.sha256)).size).toBe(8);
  expect(data.kphVersionBindings.totals).toEqual({ modelVersions: 4, targetBindings: 88 });
  expect(data.kphVersionBindings.versions.map(version => version.audit.sourceRoleRecords)).toEqual([46, 46, 46, 46]);
  expect(new Set(data.kphVersionBindings.versions.map(version => version.audit.geometryProofSha256)).size).toBe(1);
  const registered = data.kphVersionBindings.versions[1].model;
  expect(getPrivateWorkTestCandidateById(registered.candidateId!)?.expectedSha256).toBe(registered.sha256);
  expect(getPrivateWorkTestCandidateById(registered.candidateId!)?.expectedSize).toBe(registered.byteLength);
  // Prepared bindings do not register or publish the newest model.
  expect(data.kphVersionBindings.versions[3].model.candidateId).toBeUndefined();
});

test('all 88 KPH version bindings preserve measurements and distinguish owner-confirmed dimming from open product and host', async () => {
  const data = bundle(), before = JSON.stringify(data);
  for (const name of ['kph-iv1-source', 'kph-iv1-published', 'kph-latest-source', 'kph-latest-extract']) {
    const source = model(name), original = JSON.stringify(source.gltf.parser.json);
    const profile = data.kphVersionBindings.versions.find(version => version.model.sha256 === source.sha256)!;
    const resolve = createSourceCardResolver(await sourceCardIdentity(source.gltf), source.sha256, data);
    for (const group of profile.groups) for (const binding of group.bindings) {
      const result = resolve(source.objects[binding.nodeIndex]);
      expect(result.state, `${name}:${binding.nodeIndex}`).toBe('matched');
      const card = result.cards[0];
      expect(card.id).toBe(group.integrationCardId);
      if (group.moduleId === 'KPH09_SWITCH') {
        expect(card.facts.find(fact => fact.label === 'Himmennys')).toMatchObject({ kind: 'observation', value: 'Valohimmennin, omistaja vahvistanut 20.10.2026' });
        expect(card.facts.find(fact => fact.value === '1,020 m')?.kind).toBe('measurement');
        expect(card.facts.find(fact => fact.value === '92 x 148 mm')?.kind).toBe('assumption');
        expect(card.facts.find(fact => fact.label === 'Tarkka asennuspaikka ja seinäkiinnitys')?.kind).toBe('unverified');
        expect(card.conflicts[0]).toContain('tässä versiossa korjattu');
        expect(card.sources[0].limits).toContain('Himmennystoiminto');
        expect(card.sources[1].supports.join(' ')).toContain('Osioon 28');
        expect(card.sources[2].limits.join(' ')).toContain('tuotekoodi');
      } else {
        expect(card.facts.find(fact => fact.value.startsWith('2130 mm'))?.kind).toBe('derived');
        expect(card.facts.find(fact => fact.label === 'Tarkka sijoitus mallin seinäpintaan')?.kind).toBe('unverified');
      }
    }
    if (name.includes('published') || name.includes('extract')) {
      expect(source.objects[263].name).not.toBe(data.modules.KPH09_SWITCH.cards[0].targetBindings[0].nodeName);
      expect(resolve(source.objects[263]).cards).toEqual([]);
      expect(profile.groups.map(group => group.rootNodeIndex)).toEqual([268, 226]);
    }
    expect(JSON.stringify(source.gltf.parser.json)).toBe(original);
  }
  expect(JSON.stringify(data)).toBe(before);
});

for (const failure of ['sha', 'scene', 'old-index', 'root-name', 'source', 'source-role', 'missing-source', 'dimming', 'frame', 'donor']) {
  test(`KPH published binding rejects ${failure}, including changes on a selected child's group root`, () => {
    const source = model('kph-latest-extract');
    const selected = source.objects[failure === 'donor' ? 227 : 269];
    if (failure === 'sha') source.sha256 = '0'.repeat(64);
    if (failure === 'scene') source.gltf.scenes.unshift({ name: 'wrong scene', parent: null });
    if (failure === 'old-index') source.gltf.parser.associations.set(selected, { nodes: 264 });
    if (failure === 'root-name') source.gltf.parser.json.nodes[268].name = 'wrong root';
    if (failure === 'source') selected.userData.referenceDriveId = 'wrong photo';
    if (failure === 'source-role') selected.userData.sourceLinks[0].role = 'primary';
    if (failure === 'missing-source') selected.userData.sourceLinks.pop();
    if (failure === 'dimming') source.objects[268].userData.rotaryDimmingFunction = 'UNVERIFIED';
    if (failure === 'frame') source.objects[268].userData.unmeasuredFrameWidthM_WORK_ASSUMPTION = 0.11;
    if (failure === 'donor') source.gltf.parser.json.nodes[226].extras.donorGLBSha256 = 'wrong donor';
    const result = createSourceCardResolver(source.gltf, source.sha256, bundle())(selected);
    expect(result.state).toBe('mismatch');
    expect(result.cards).toEqual([]);
  });
}

for (const failure of ['duplicate-version', 'original-sha', 'missing-group', 'missing-binding', 'source-role', 'root-path', 'donor', 'revision', 'revision-measurement', 'revision-function', 'revision-source', 'dimming', 'audit']) {
  test(`KPH version handoff rejects ${failure}`, () => {
    const data: SourceCardBundle = bundle();
    const version = data.kphVersionBindings!.versions[3], group = version.groups[0];
    if (failure === 'duplicate-version') version.model.sha256 = data.kphVersionBindings!.versions[0].model.sha256;
    if (failure === 'original-sha') version.sourceModelSha256 = '0'.repeat(64);
    if (failure === 'missing-group') version.groups.pop();
    if (failure === 'missing-binding') group.bindings.pop();
    if (failure === 'source-role') group.bindings[1].sourceLinkGuards[0].role = 'primary';
    if (failure === 'root-path') group.bindings[1].nodePath[1] = 263;
    if (failure === 'donor') version.groups[1].rootExtraGuards.donorGLBSha256 = 'wrong donor';
    if (failure === 'revision') group.cardRevision = 'unreviewed';
    if (failure === 'revision-measurement') data.kphVersionBindings!.switchCardRevision.card.facts[2].kind = 'observation';
    if (failure === 'revision-function') data.kphVersionBindings!.switchCardRevision.card.facts[4].kind = 'measurement';
    if (failure === 'revision-source') data.kphVersionBindings!.switchCardRevision.card.sources[2].url = 'https://example.test/wrong-source';
    if (failure === 'dimming') group.rootExtraGuards.rotaryDimmingFunction = 'UNVERIFIED';
    if (failure === 'audit') version.audit.geometryAndTransformsUnchanged = false;
    expect(() => indexSourceCardBundle(data)).toThrow('versiosidontaa');
  });
}

test('T03/T04 all 38 source-fixture bindings resolve only in their internal scene and do not mutate metadata', async () => {
  const data = bundle();
  const before = JSON.stringify(data);
  for (const name of ['shared302', 'd2015']) {
    const source = model(name);
    const original = JSON.stringify(source.gltf.parser.json);
    // Multi-scene GLTFLoader can prune these entries. Its exact node cache is the fallback.
    if (name === 'd2015') source.gltf.parser.associations.clear();
    const identity = await sourceCardIdentity(source.gltf);
    const resolve = createSourceCardResolver(identity, source.sha256, data);
    for (const binding of data.lookup.bindings.filter(item => item.modelSha256 === source.sha256)) {
      const result = resolve(source.objects[binding.nodeIndex]);
      expect(result.state, `${name}:${binding.nodeIndex}`).toBe('matched');
      expect(result.cards.map(card => card.id)).toEqual([binding.integrationCardId]);
      expect(result.version).toContain(`scene ${binding.sceneIndex}`);
    }
    expect(JSON.stringify(source.gltf.parser.json)).toBe(original);
  }
  expect(JSON.stringify(data)).toBe(before);
});

for (const failure of ['sha', 'scene', 'node', 'name', 'mesh', 'source', 'hierarchy', 'donor']) {
  test(`T02 rejects ${failure} mismatch without returning an object card`, () => {
    const source = model();
    const index = failure === 'donor' ? 222 : 264;
    if (failure === 'sha') source.sha256 = '0'.repeat(64);
    if (failure === 'scene') source.gltf.scenes.unshift({ name: 'transport __scene301', parent: null });
    if (failure === 'node') source.gltf.parser.associations.set(source.objects[index], { nodes: 265 });
    if (failure === 'name') source.gltf.parser.json.nodes[index].name = 'wrong source name';
    if (failure === 'mesh') source.gltf.parser.json.nodes[index].mesh = 230;
    if (failure === 'source') source.objects[index].userData.referenceDriveId = 'wrong';
    if (failure === 'hierarchy') source.objects[index].parent = source.objects[119];
    if (failure === 'donor') source.gltf.parser.json.nodes[221].extras.donorGLBSha256 = 'wrong';
    const result = createSourceCardResolver(source.gltf, source.sha256, bundle())(source.objects[index]);
    expect(result.state).toBe('mismatch');
    expect(result.reason).toBeTruthy();
    expect(result.cards).toEqual([]);
  });
}

test('T06/T07 measurements, derived values, assumptions, uncertainty and both conflicting values remain distinct', () => {
  const data = bundle();
  const card = adaptSourceCard('switch', data.modules.KPH09_SWITCH.cards[0]);
  expect(card.facts.filter(fact => fact.kind === 'measurement').map(fact => fact.value)).toEqual(['1,020 m']);
  expect(card.facts.find(fact => fact.value === '92 x 148 mm')?.kind).toBe('assumption');
  expect(card.facts.filter(fact => fact.kind === 'unverified')).toHaveLength(2);
  expect(card.conflicts[0]).toContain('0.11 x 0.222 m');
  expect(card.conflicts[0]).toContain('92 x 148 mm');
  expect(card.sources.map(source => source.role)).toEqual(['photo_relative_appearance', 'documented_measurement_and_limits']);
  expect(card.sources[1].limits.join(' ')).toContain('Ei alkuperäinen mittaustallenne');
  const mirror = adaptSourceCard('mirror', data.modules.KPH_MIRROR.cards[0]);
  expect(mirror.facts.find(fact => fact.value.startsWith('2130 mm'))?.kind).toBe('derived');
  expect(mirror.facts.find(fact => fact.label.includes('Host-seinäpinta'))?.kind).toBe('assumption');
  expect(mirror.notes.join(' ')).toContain('ei vahvista nykyistä sijaintia');
  expect(classifySourceEvidence('SOURCE_DIRECT_NUMBER', 'HISTORICAL_PLAN')).toBe('plan');
  expect(classifySourceEvidence('DERIVED_SOURCE_CHAIN_R', 'WORK_ASSUMPTION')).toBe('derived');
  expect(classifySourceEvidence('USER_FIELD_MEASURED_CURRENT')).toBe('measurement');
  expect(classifySourceEvidence('WORK_TEST NONCURRENT NONCANONICAL REJECTED')).toBe('unverified');
});

test('G4/G5 remain occurrences, G10 preserves source spelling and S1 has no invented group or schedule source', () => {
  const cards = bundle().modules.D2015.cards;
  expect(cards[3].sourceGroupKey).toBe(cards[4].sourceGroupKey);
  expect(cards[3].selector.nodeIndex).not.toBe(cards[4].selector.nodeIndex);
  expect(adaptSourceCard('G10', cards[9]).title).toContain('Liesituuletin');
  expect(adaptSourceCard('G10', cards[9]).facts.some(fact => fact.value.includes('Lieistuuletin'))).toBe(true);
  const led = adaptSourceCard('S1', cards[15]);
  expect(led.title).toContain('9,6 W/m');
  expect(led.sources).toHaveLength(1);
  expect(cards[15].sourceGroupKey).toBeNull();
});

test('T09 R476 context nodes and alternative KPH/RING patches are excluded from executable bindings', () => {
  const data = bundle();
  const index = indexSourceCardBundle(data);
  expect(index.some(entry => [1063, 1064].includes(entry.binding.nodeIndex))).toBe(false);
  expect(index.map(entry => entry.moduleId).every(id => ['D2015', 'KPH09_SWITCH', 'KPH_MIRROR'].includes(id))).toBe(true);
  const source = model('d2015');
  expect(createSourceCardResolver(source.gltf, source.sha256, data)({ name: 'R476 context' }).cards).toEqual([]);
  expect(JSON.stringify(data)).toBe(JSON.stringify(privateModelSourceCards));
});

test('source links accept only original HTTPS Drive/Docs origins without credentials', () => {
  expect(allowedSourceCardUrl('https://docs.google.com/document/d/test/edit')).toBe(true);
  for (const url of ['javascript:alert(1)', 'https://drive.google.com.evil.test/a', 'https://user:pass@drive.google.com/a', 'http://drive.google.com/a', 'https://drive.google.com:444/a']) expect(allowedSourceCardUrl(url)).toBe(false);
});

test('T05 source-card route requires Access and keeps authenticated GET/HEAD private', async () => {
  const originalFetch = globalThis.fetch;
  const keys = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const team = 'https://source-card-test.cloudflareaccess.com';
  const kid = 'source-card-test';
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const signed = `${encode({ alg: 'RS256', kid })}.${encode({ iss: team, aud: 'source-cards', exp: Math.floor(Date.now() / 1000) + 300, sub: 'test-viewer' })}`;
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', keys.privateKey, new TextEncoder().encode(signed));
  const token = `${signed}.${Buffer.from(signature).toString('base64url')}`;
  globalThis.fetch = async () => Response.json({ keys: [{ ...await crypto.subtle.exportKey('jwk', keys.publicKey), kid }] });
  let assets = 0;
  const env = { ASSETS: { fetch: async () => { assets++; return new Response('public asset'); } }, CF_ACCESS_TEAM_DOMAIN: team, CF_ACCESS_AUD: 'source-cards' };
  const path = 'https://example.test/private-model/source-cards.json';
  try {
    expect((await handlePrivateModelRequest(new Request(path), env)).status).toBe(404);
    const headers = { 'cf-access-jwt-assertion': token };
    const result = await handlePrivateModelRequest(new Request(path, { headers }), env);
    expect(result.status).toBe(200);
    expect(result.headers.get('Cache-Control')).toBe('private, no-store');
    expect(result.headers.get('Cross-Origin-Resource-Policy')).toBe('same-origin');
    expect((await result.json()).manifest.totals.cards).toBe(18);
    const head = await handlePrivateModelRequest(new Request(path, { headers, method: 'HEAD' }), env);
    expect(head.status).toBe(200);
    expect(await head.text()).toBe('');
    expect((await handlePrivateModelRequest(new Request(path, { headers, method: 'POST' }), env)).status).toBe(405);
    expect(assets).toBe(0);
  } finally { globalThis.fetch = originalFetch; }
});

// A small, explicitly test-only GLB exercises the real loader, SHA calculation,
// raycast, selection controller and DOM. It is not production-model UI evidence.
const switchGlb = (offset = 0, name = 'shared302') => {
  const positions = Buffer.alloc(36);
  [-1 + offset, -1, 0, 1, -1, 0, 0, 1, 0].forEach((value, index) => positions.writeFloatLE(value, index * 4));
  const source = fixtures[name].nodes;
  const root = name === 'shared302' ? 263 : 268, frame = root + 1;
  const nodes = Array.from({ length: frame + 1 }, () => ({} as any));
  for (const id of [119, root, frame]) nodes[id] = structuredClone(source[id]);
  nodes[119].children = [root]; nodes[root].children = [frame];
  if (name === 'shared302') nodes[frame].extras.sourceLinks = [{ link: 'https://docs.google.com/document/d/raw-source/edit', role: 'support', supports: 'fixture source reference' }];
  const json = { asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [119] }], nodes,
    meshes: Array.from({ length: nodes[frame].mesh + 1 }, () => ({ primitives: [{ attributes: { POSITION: 0 } }] })),
    buffers: [{ byteLength: positions.length }], bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: positions.length }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [-1, -1, 0], max: [1, 1, 0] }] };
  const raw = Buffer.from(JSON.stringify(json));
  const chunk = Buffer.concat([raw, Buffer.alloc((4 - raw.length % 4) % 4, 0x20)]);
  const header = Buffer.alloc(20); header.write('glTF'); header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + chunk.length + positions.length, 8); header.writeUInt32LE(chunk.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  const bin = Buffer.alloc(8); bin.writeUInt32LE(positions.length); bin.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, chunk, bin, positions]);
};

const browserFixture = async (page: Page, denied = false, name = 'shared302') => {
  const glb = switchGlb(0, name);
  const sha = createHash('sha256').update(glb).digest('hex');
  const testBundle = JSON.parse(JSON.stringify(bundle()).replaceAll(fixtures[name].sha256, sha));
  await page.route('**/private-model/source-cards.json', route => route.fulfill({ status: denied ? 403 : 200, contentType: 'application/json', body: JSON.stringify(testBundle) }));
  await page.route('**/private-model/model.glb', route => route.fulfill({ contentType: 'model/gltf-binary', body: glb }));
  return sha;
};
const selectCenter = async (page: Page) => {
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');
  await page.locator('#selection-tool-button').click();
  const canvas = page.locator('#private-model-canvas');
  const box = (await canvas.boundingBox())!;
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(page.locator('#selection-panel')).toBeVisible();
};

for (const width of [1280, 390]) {
  test(`browser T05-T08 ${width}px: selected source card preserves links, roles, evidence, conflict and clear`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const sha = await browserFixture(page);
    await page.goto('/private-model/');
    await selectCenter(page);
    const section = page.locator('#selection-source-evidence');
    await expect(section).toHaveAttribute('data-state', 'matched');
    await expect(section.getByRole('heading', { name: 'Saunan ja kylpyhuoneen valokatkaisimet' })).toBeVisible();
    await expect(section.locator('[data-evidence-kind="measurement"]')).toContainText('1,020 m');
    await expect(section.locator('[data-evidence-kind="assumption"]')).toContainText('92 x 148 mm');
    await expect(section.locator('.source-evidence-conflict')).toContainText('0.11 x 0.222 m');
    await expect(section.locator('[data-source-role="documented_measurement_and_limits"]')).toBeVisible();
    const original = privateModelSourceCards.modules.KPH09_SWITCH.cards[0].sources[0].url;
    await expect(section.locator('a').first()).toHaveAttribute('href', original);
    await expect(section.locator('a').first()).toHaveAttribute('rel', 'noopener noreferrer');
    await section.getByText('Malliversio ja kohdistus', { exact: true }).click();
    await expect(section).toContainText(sha);
    const raw = page.locator('#selection-source-links');
    await raw.locator('summary').click();
    await expect(raw.locator('a')).toHaveAttribute('href', 'https://docs.google.com/document/d/raw-source/edit');
    await page.locator('#clear-selection-button').click();
    await expect(section).toBeHidden();
    await expect(section.locator('a')).toHaveCount(0);
  });
  test(`browser KPH ${width}px: new-version frame shows confirmed dimming and keeps physical dimensions open`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const sha = await browserFixture(page, false, 'kph-latest-extract');
    await page.goto('/private-model/');
    await selectCenter(page);
    const section = page.locator('#selection-source-evidence');
    await expect(section).toHaveAttribute('data-state', 'matched');
    await expect(section.locator('[data-evidence-kind="observation"]')).toContainText(['Saunan valo', 'Kylpyhuoneen valohimmennin', 'Valohimmennin, omistaja vahvistanut 20.10.2026']);
    await expect(section.locator('[data-evidence-kind="measurement"]')).toContainText('1,020 m');
    await expect(section.locator('[data-evidence-kind="assumption"]')).toContainText('92 x 148 mm');
    await expect(section.locator('[data-evidence-kind="unverified"]')).toContainText('Ei varmennettu');
    await expect(section.locator('.source-evidence-conflict')).toContainText('tässä versiossa korjattu');
    await expect(section.locator('[data-source-role="owner_visual_proportion_and_function_review"]')).toContainText('Omistajan valinta ja toiminnon vahvistus');
    await expect(section).toContainText('Fyysisiä tuotemittoja, tuotekoodia');
    await section.getByText('Malliversio ja kohdistus', { exact: true }).click();
    await expect(section).toContainText(sha);
    await page.locator('#clear-selection-button').click();
    await expect(section).toBeHidden();
  });
}

test('browser T02/T08 a changed GLB cannot reuse a card, and Access failure preserves raw links and selection', async ({ page }) => {
  await browserFixture(page);
  await page.route('**/private-model/model.glb', route => route.fulfill({ contentType: 'model/gltf-binary', body: switchGlb(0.1) }));
  await page.goto('/private-model/');
  await selectCenter(page);
  const section = page.locator('#selection-source-evidence');
  await expect(section).toHaveAttribute('data-state', 'mismatch');
  await expect(section).toContainText('Kohdistus ei vahvistettu');
  await expect(section.locator('a')).toHaveCount(0);
  await browserFixture(page, true);
  await page.reload();
  await selectCenter(page);
  await expect(section).toHaveAttribute('data-state', 'unavailable');
  await section.locator('summary').click();
  await expect(section).toContainText('käyttöoikeus tai lataus');
  await expect(page.locator('#selection-source-links')).toBeVisible();
});
