import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { buildR31InfraOverlay } from '../../src/scripts/privateModelR31Inspection.mjs';
import { selectionMetadataEntries, formatSelectionMetadataKey, scalarSelectionMetadataValue } from '../../src/scripts/privateModelSelectionMetadata.ts';
import { createSelectionPanelController } from '../../src/scripts/privateModelSelectionPanel.ts';

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

test('P139AD work-Z warnings survive the actual selection panel DOM receiver after technical fields', () => {
  // Small DOM contract double: exercises the real panel controller and
  // metadata production, not a browser/WebGL or physical as-built acceptance.
  const originalDocument = globalThis.document;
  globalThis.document = {
    querySelector: () => null,
    createElement: (tag) => ({ tagName: tag.toUpperCase(), textContent: '' }),
  };
  try {
    const list = {
      children: [],
      replaceChildren() { this.children = []; },
      append(...nodes) { this.children.push(...nodes); },
    };
    const field = () => ({ textContent: '-', hidden: false });
    const canvas = { dataset: {} };
    const controller = createSelectionPanelController({
      canvas, panel: field(), mesh: field(), group: field(),
      scene: field(), floor: field(), kind: field(),
      physicalClaim: field(), dimensions: field(),
      metadataList: list, metadataEmpty: field(),
    });
    const routes = [
      {
        name: 'P139AD_LOCUS_WATER_MAIN_WORK_Z',
        label: 'Vesijohto - katu',
        sourceObject: 'G3_LOCUS_SITE_WATER_MAIN_REF_001',
        system: 'WATER',
        workZBasis: 'SOURCE_Z_CHAIN_WITH_INTERPOLATION_AND_EXTRAPOLATION',
        sourceZNote: 'Malformed XML Z is source provenance, not a measured physical pipe elevation.',
        points: [[0, 0, 18], [2, 0, 17.9]],
      },
      {
        name: 'P139AD_LOCUS_WASTEWATER_PARCEL_WORK_Z',
        label: 'Jätevesi - tonttihaara',
        sourceObject: 'G3_LOCUS_SITE_WASTEWATER_PARCEL_UNCERTAIN_001',
        system: 'WASTEWATER',
        workZBasis: '1974_PARALLEL_ROUTE_PROFILE_TRANSFER',
        sourceZNote: '1974 parallel route is not evidence of the same pipe or an as-built connection.',
        points: [[0, 0, 18], [2, 0, 17.9]],
      },
    ];
    for (const route of routes) {
      const [selected] = buildR31InfraOverlay(THREE, [route], 21.75).children;
      const technical = [
        ['Tekninen kohde', selected.name],
        ['Tekninen ryhmä', 'Kunnallistekniikka'],
        ['Tekninen scene', 'R31 WORK_TEST'],
        ['Renderöintityyppi', 'Mesh'],
      ];
      const sourceRows = selectionMetadataEntries(selected, null);
      assert.equal(sourceRows.length, 12);
      controller.render({
        mesh: route.label, group: 'Kunnallistekniikka',
        scene: 'WORK_TEST', floor: 'Kohde', kind: 'SOURCE_ONLY',
        physicalClaim: 'Ei varmennettu', metadataEntries: [...technical, ...sourceRows],
        sourceLinks: [],
      });
      assert.equal(canvas.dataset.selectionMetadataCount, '16');
      assert.equal(list.children.length, 32, 'the panel must not truncate after 12 combined rows');
      const rendered = [];
      for (let i = 0; i < list.children.length; i += 2) {
        assert.equal(list.children[i].tagName, 'DT');
        assert.equal(list.children[i + 1].tagName, 'DD');
        rendered.push([list.children[i].textContent, list.children[i + 1].textContent]);
      }
      assert.deepEqual(rendered.slice(0, 4).map(([label]) => label), technical.map(([key]) => formatSelectionMetadataKey(key)));
      const byLabel = new Map(rendered);
      for (const [key, expected] of [
        ['sourceZNote', route.sourceZNote],
        ['workZBasis', route.workZBasis],
        ['workZAssumption', 'true'],
        ['physicalZClaim', 'false'],
        ['samePipeClaim', 'false'],
        ['topologyLinkClaim', 'false'],
        ['ModelStage', 'WORK_TEST_VIEW'],
      ]) {
        assert.equal(byLabel.get(formatSelectionMetadataKey(key)), expected, key + ' must remain visible');
      }
    }
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});
