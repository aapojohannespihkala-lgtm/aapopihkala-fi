import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { buildR31InfraOverlay } from '../../src/scripts/privateModelR31Inspection.mjs';

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
