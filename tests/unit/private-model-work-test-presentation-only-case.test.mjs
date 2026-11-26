import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const file = readFileSync(new URL('../../src/scripts/privateModelWorkTest3DPoint.ts', import.meta.url), 'utf8');
const start = file.indexOf('const hasPresentationOnlyAncestor = ');
const end = file.indexOf('/** A material array', start);
assert.ok(start >= 0 && end > start, 'source predicate exists');
assert.match(file, /!hasPresentationOnlyAncestor\(object,modelRoot\)/, 'actual point picker uses the predicate');

const snippet = file.slice(start, end) + '\nexports.predicate = hasPresentationOnlyAncestor;\n';
const js = ts.transpileModule(snippet, {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText;
const exports = {};
vm.runInNewContext(js, {exports}, {timeout: 1000});
const isPresentationOnly = exports.predicate;

const node = (parent = null, userData = {}) => ({parent, userData});

// Owner 15.11.2026: "Piste mallissa" must work on C80/M5 source models.
// Their GLB extras set presentationOnly/PresentationOnly on whole building
// roots, so these flags must NOT exclude source surfaces. Only geometry the
// viewer itself generates (userData.viewerDerived) is excluded.
test('glTF lowercase presentationOnly on source mesh stays pickable', () => {
  const root = node();
  assert.equal(isPresentationOnly(node(root, {presentationOnly: true}), root), false);
});

test('glTF PresentationOnly whole-building root does not exclude child surfaces', () => {
  const root = node();
  const buildingRoot = node(root, {PresentationOnly: true, presentationOnly: true});
  assert.equal(isPresentationOnly(node(buildingRoot), root), false);
});

test('viewer-derived review geometry is excluded, also through an ancestor', () => {
  const root = node();
  assert.equal(isPresentationOnly(node(root, {viewerDerived: true, PresentationOnly: true}), root), true);
  const overlay = node(root, {viewerDerived: true});
  assert.equal(isPresentationOnly(node(overlay), root), true);
});

test('ordinary real visible source surface and false flags remain pickable', () => {
  const root = node();
  const normalParent = node(root, {presentationOnly: false, PresentationOnly: false, viewerDerived: false});
  assert.equal(isPresentationOnly(node(normalParent), root), false);
});
