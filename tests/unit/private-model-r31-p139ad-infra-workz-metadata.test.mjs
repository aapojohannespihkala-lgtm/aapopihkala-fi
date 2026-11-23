import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { buildR31InfraOverlay, buildR31DrainageOverlay, R31_DRAINAGE_SOURCE } from '../../src/scripts/privateModelR31Inspection.mjs';
import { selectionMetadataEntries, formatSelectionMetadataKey, scalarSelectionMetadataValue } from '../../src/scripts/privateModelSelectionMetadata.ts';

test('R31 P139AD work-Z water/wastewater overlays preserve uncertainty and source Z caveats', () => {
  const routes = [
    {
      name: 'P139AD_LOCUS_WATER_MAIN_WORK_Z',
      label: 'Vesijohto - katu',
      sourceObject: 'G3_LOCUS_SITE_WATER_MAIN_REF_001',
      system: 'WATER',
      workZBasis: 'SOURCE_Z_CHAIN_WITH_INTERPOLATION_AND_EXTRAPOLATION',
      sourceZNote: 'Source has invalid Z values, retained as provenance rather than physical height',
      points: [[10, 20, 18], [12, 20, 17.9]],
    },
    {
      name: 'P139AD_LOCUS_WASTEWATER_PARCEL_WORK_Z',
      label: 'Jätevesi - tonttihaara',
      sourceObject: 'G3_LOCUS_SITE_WASTEWATER_PARCEL_UNCERTAIN_001',
      system: 'WASTEWATER',
      workZBasis: '1974_PARALLEL_ROUTE_PROFILE_TRANSFER',
      sourceZNote: 'A nearby pipe profile is an assumption, not proof of the same pipe',
      points: [[0, 0, 18.15], [5, 0, 17.9]],
    },
  ];
  const group = buildR31InfraOverlay(THREE, routes, 21.75);
  assert.deepEqual(group.userData.counts, { WATER: 1, WASTEWATER: 1 });
  assert.equal(group.children.length, 2);
  assert.equal(group.userData.presentationOnly, true);
  assert.equal(group.userData.verticalReferenceM, 21.75);

  for (const [index, mesh] of group.children.entries()) {
    const source = routes[index];
    const info = mesh.userData;
    assert.equal(mesh.name, 'R31_INFRA_' + source.name);
    assert.equal(info.label, source.label);
    assert.equal(info.sourceObject, source.sourceObject);
    assert.equal(info.system, source.system);
    assert.equal(info.sourceXYState, 'PRESERVED_EXACT_FROM_G3_LOCUS_SITE_P02');
    assert.equal(info.sourceZPreservedAsProvenance, true);
    assert.equal(info.sourceZNote, source.sourceZNote);
    assert.equal(info.workZBasis, source.workZBasis);
    assert.equal(info.workZAssumption, true);
    assert.equal(info.refinable, true);
    assert.equal(info.verticalDatumStatus, 'OPEN_UNVERIFIED');
    assert.equal(info.Canonical, false);
    assert.equal(info.presentationOnly, true);
    assert.equal(info.ModelStage, 'WORK_TEST_VIEW');
    for (const key of ['physicalZClaim', 'samePipeClaim', 'topologyLinkClaim', 'currentClaim', 'asBuiltClaim']) {
      assert.equal(info[key], false, key + ' must fail closed');
    }
    mesh.geometry.computeBoundingBox();
    const bounds = mesh.geometry.boundingBox;
    const expectedY = source.points[0][2] - 21.75;
    const expectedZ = -source.points[0][1];
    assert.ok(bounds.min.y <= expectedY + 0.15 && bounds.max.y >= expectedY - 0.15,
      'original work elevation is retained in the same Y-up frame');
    assert.ok(bounds.min.z <= expectedZ + 0.15 && bounds.max.z >= expectedZ - 0.15,
      'G1 Y still maps to negative viewer Z');
  }
  assert.equal(group.children[0].userData.uncertain, false);
  assert.equal(group.children[1].userData.uncertain, true);
  assert.equal(group.children[1].material.transparent, true);
  assert.equal(group.children[1].material.opacity, 0.6);
});

test('P139AD source retains its four original route notes and non-physical work-Z contract', () => {
  const page = readFileSync(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  const start = page.indexOf('const p139adLocusWorkZRoutes = [');
  const end = page.indexOf('] as const;', start);
  assert.ok(start >= 0 && end > start);
  const block = page.slice(start, end);
  for (const key of ['WATER_MAIN', 'WATER_PARCEL', 'WASTEWATER_MAIN', 'WASTEWATER_PARCEL']) {
    assert.ok(block.includes('P139AD_LOCUS_' + key + '_WORK_Z'), key);
  }
  assert.equal((block.match(/sourceZNote:/g) ?? []).length, 4);
  assert.equal((block.match(/workZBasis:/g) ?? []).length, 4);
  assert.match(page, /sourceZPreservedAsProvenance: true/);
  assert.match(page, /workZAssumption: true/);
  assert.match(page, /samePipeClaim: false/);
  assert.match(page, /topologyLinkClaim: false/);
});

test('P139AD selected water and sewer work-Z tubes show source caveats before the 12-entry cutoff', () => {
  const notes = [
    'Malformed XML Z stays provenance; street route elevation is interpolated, not measured.',
    '1974 parallel profile is not proof of the same pipe; this is a review-height assumption.',
  ];
  const routes = [
    {
      name: 'P139AD_LOCUS_WATER_MAIN_WORK_Z',
      label: 'Vesijohto - katu',
      sourceObject: 'G3_LOCUS_SITE_WATER_MAIN_REF_001',
      system: 'WATER',
      workZBasis: 'SOURCE_Z_CHAIN_WITH_INTERPOLATION_AND_EXTRAPOLATION',
      sourceZNote: notes[0],
      points: [[0, 0, 18], [2, 2, 17.9]],
    },
    {
      name: 'P139AD_LOCUS_WASTEWATER_PARCEL_WORK_Z',
      label: 'Jätevesi - tonttihaara',
      sourceObject: 'G3_LOCUS_SITE_WASTEWATER_PARCEL_UNCERTAIN_001',
      system: 'WASTEWATER',
      workZBasis: '1974_PARALLEL_ROUTE_PROFILE_TRANSFER',
      sourceZNote: notes[1],
      points: [[0, 0, 18.15], [4, 5, 17.9]],
    },
  ];
  const group = buildR31InfraOverlay(THREE, routes, 21.75);
  const expectedKeys = [
    'sourceZNote', 'workZBasis', 'workZAssumption',
    'physicalZClaim', 'samePipeClaim', 'topologyLinkClaim',
    'verticalDatumStatus', 'sourceObject', 'sourceXYState',
    'sourceZPreservedAsProvenance', 'refinable', 'ModelStage',
  ];
  for (const [i, mesh] of group.children.entries()) {
    const entries = selectionMetadataEntries(mesh, null);
    assert.equal(entries.length, 12, 'all displayed entries fit the actual viewer limit');
    assert.deepEqual(entries.map(([key]) => key), expectedKeys,
      'the review/source warnings must be visible, not alphabetically truncated');
    const values = Object.fromEntries(entries);
    assert.equal(values.sourceZNote, notes[i]);
    assert.equal(values.workZBasis, routes[i].workZBasis);
    assert.equal(values.workZAssumption, 'true');
    assert.equal(values.physicalZClaim, 'false');
    assert.equal(values.samePipeClaim, 'false');
    assert.equal(values.topologyLinkClaim, 'false');
    assert.equal(values.ModelStage, 'WORK_TEST_VIEW');
    assert.equal(formatSelectionMetadataKey('sourceZNote'),
      'Lähteen Z-huomautus (ei fyysinen putkikorko)');
    assert.equal(formatSelectionMetadataKey('workZBasis'), 'Työ-Z:n laskentaperuste');
  }
});

test('P139AD work-Z metadata sorting is not applied to unrelated objects', () => {
  const unrelated = {
    name: 'UNRELATED_SOURCE',
    userData: {
      sourceObject: 'OTHER_SOURCE',
      system: 'WATER',
      ModelStage: 'WORK_TEST_VIEW',
      workZAssumption: true,
      physicalZClaim: false,
      sourceZNote: 'Not a P139AD route',
      presentationOnly: true,
    },
    parent: null,
  };
  const entries = selectionMetadataEntries(unrelated, null);
  assert.equal(entries[0][0], 'ModelStage', 'existing generic priority is unchanged');
  assert.equal(entries.find(([key]) => key === 'sourceZNote')?.[1], 'Not a P139AD route');
});

test('P139AD original work-Z source notes fit the 180-character viewer metadata limit', () => {
  const page = readFileSync(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  const start = page.indexOf('const p139adLocusWorkZRoutes = [');
  const end = page.indexOf('] as const;', start);
  assert.ok(start >= 0 && end > start, 'original P139AD route literals must exist');
  const block = page.slice(start, end);
  const notes = [...block.matchAll(/sourceZNote:\s*'([^']+)'/g)].map((match) => match[1]);
  assert.equal(notes.length, 4, 'all four water and sewer work-Z routes need source caveats');
  for (const [index, sourceZNote] of notes.entries()) {
    assert.ok(sourceZNote.trim().length > 0, 'empty source-Z warning ' + index);
    assert.ok(
      sourceZNote.trim().length <= 180,
      'source-Z caveat ' + index + ' exceeds the 180-character selection cutoff and would disappear silently',
    );
    assert.equal(scalarSelectionMetadataValue(sourceZNote), sourceZNote.trim());
  }
  assert.equal(scalarSelectionMetadataValue('X'.repeat(181)), null,
    'document the metadata filter failure mode if source caveats grow beyond 180 characters');
});

test('R31 drainage well and unresolved-end selection pins nonphysical warning before 12-row cutoff', () => {
  const scenes = Array.from({ length: 60 }, () => new THREE.Group());
  const sourceScene = scenes[R31_DRAINAGE_SOURCE.sceneIndex];
  sourceScene.userData = { Pass: R31_DRAINAGE_SOURCE.pass };
  for (const [kind, x] of [['wellMarkerWork', 26], ['unresolvedBoundaryMarker', 27]]) {
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.01, 0.4), new THREE.MeshBasicMaterial());
    marker.position.set(x, -1, 0.7);
    marker.userData = { representationKind: kind };
    sourceScene.add(marker);
  }
  const gltf = {
    scenes,
    parser: { json: { scenes: scenes.map((_, i) => ({
      name: i === R31_DRAINAGE_SOURCE.sceneIndex ? R31_DRAINAGE_SOURCE.sceneName : 'other',
    })) } },
  };
  const overlay = buildR31DrainageOverlay(THREE, gltf);
  assert.deepEqual(overlay.userData.counts, { well: 1, route: 0, open: 1 });
  for (const marker of overlay.children) {
    Object.assign(marker.userData, Object.fromEntries(
      Array.from({ length: 18 }, (_, i) => ['decorativeField' + i, 'source-only']),
    ));
    const entries = selectionMetadataEntries(marker, null);
    assert.equal(entries.length, 12, 'same 12-row cap as actual selection UI');
    assert.equal(entries[0][0], 'sourceDisplayNote', 'nonphysical caveat must always be first');
    assert.equal(entries[1][0], 'markerDisplayKind');
    const info = Object.fromEntries(entries);
    assert.equal(info.physicalWellGeometryClaim, 'false');
    assert.equal(info.physicalZClaim, 'false');
    assert.equal(info.installationDepthClaim, 'false');
    assert.equal(info.currentClaim, 'false');
    assert.equal(info.asBuiltClaim, 'false');
    assert.ok(info.sourceDisplayNote.includes('ei '));
    assert.equal(info.ModelStage, 'WORK_TEST_VIEW');
    assert.equal(formatSelectionMetadataKey('sourceDisplayNote'),
      'Viitesymbolin tulkinta (ei mitoitettu rakenne)');
  }
  assert.match(overlay.children[0].userData.sourceDisplayNote, /kaivomerkki/);
  assert.match(overlay.children[1].userData.sourceDisplayNote, /päätepisteen viitemerkki/);
});
