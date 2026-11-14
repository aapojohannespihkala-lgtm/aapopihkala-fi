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

test('glTF lowercase presentationOnly on source mesh is not pickable', () => {
  const root = node();
  const sourceMesh = node(root, {presentationOnly: true});
  assert.equal(isPresentationOnly(sourceMesh, root), true);
});

test('glTF lowercase presentationOnly on ancestor excludes child surface', () => {
  const root = node();
  const displayOnlyHost = node(root, {presentationOnly: true});
  const childMesh = node(displayOnlyHost);
  assert.equal(isPresentationOnly(childMesh, root), true);
});

test('legacy capitalized PresentationOnly remains excluded', () => {
  const root = node();
  assert.equal(isPresentationOnly(node(root, {PresentationOnly: true}), root), true);
});

test('ordinary real visible source surface and false flags remain pickable', () => {
  const root = node();
  const normalParent = node(root, {presentationOnly: false, PresentationOnly: false});
  assert.equal(isPresentationOnly(node(normalParent), root), false);
});
