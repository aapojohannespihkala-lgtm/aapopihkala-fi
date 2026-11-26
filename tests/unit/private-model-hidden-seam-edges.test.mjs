import test from 'node:test';
import assert from 'node:assert/strict';
import { createCoplanarFaceIndex, surfaceLookKey } from '../../src/scripts/privateModelHiddenSeamEdges.ts';

const v = (x, y, z) => ({ x, y, z });
const sub = (a, b) => v(a.x - b.x, a.y - b.y, a.z - b.z);
const cross = (a, b) => v(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
const norm = (a) => { const l = Math.hypot(a.x, a.y, a.z); return v(a.x / l, a.y / l, a.z / l); };
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;

// Axis-aligned box as 12 outward triangles (x0..x1, y0..y1, z0..z1), three.js world axes.
const box = (x0, x1, y0, y1, z0, z1) => {
  const p = (i) => v(i & 1 ? x1 : x0, i & 2 ? y1 : y0, i & 4 ? z1 : z0);
  const quads = [[0, 2, 6, 4], [1, 5, 7, 3], [0, 4, 5, 1], [2, 3, 7, 6], [0, 1, 3, 2], [4, 6, 7, 5]];
  const center = v((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const tris = [];
  for (const [a, b, c, d] of quads) for (const t of [[a, b, c], [a, c, d]]) {
    let [A, B, C] = t.map(p);
    if (dot(cross(sub(B, A), sub(C, A)), sub(A, center)) < 0) [B, C] = [C, B];
    tris.push([A, B, C]);
  }
  return tris;
};
const edgeInfo = (tri, i) => {
  const [a, b, c] = [tri[i], tri[(i + 1) % 3], tri[(i + 2) % 3]];
  const n = norm(cross(sub(tri[1], tri[0]), sub(tri[2], tri[0])));
  let inward = norm(cross(n, norm(sub(b, a))));
  if (dot(inward, sub(c, a)) < 0) inward = v(-inward.x, -inward.y, -inward.z);
  return { a, b, n, inward };
};
const index = (meshes) => {
  const faces = createCoplanarFaceIndex();
  meshes.forEach(({ tris, look }, owner) => {
    for (const t of tris) faces.add(owner, look, t[0], t[1], t[2], norm(cross(sub(t[1], t[0]), sub(t[2], t[0]))));
  });
  return faces;
};
// Classify the triangle edge of mesh `owner` that runs exactly from p to q.
const classifyEdge = (faces, meshes, owner, p, q, wantNormal) => {
  const out = [];
  for (const t of meshes[owner].tris) for (let i = 0; i < 3; i += 1) {
    const e = edgeInfo(t, i);
    const same = (u, w) => Math.hypot(u.x - w.x, u.y - w.y, u.z - w.z) < 1e-9;
    if (!((same(e.a, p) && same(e.b, q)) || (same(e.a, q) && same(e.b, p)))) continue;
    if (wantNormal && dot(e.n, wantNormal) < 0.99) continue;
    out.push(faces.classify(owner, meshes[owner].look, e.a, e.b, e.n, e.inward));
  }
  return out;
};

// K17 low wall from C80 620R18 (G1 X,N,H -> three x, y=H, z=-N): V62 long wall,
// V83 corner fill and V62 short wall are separate touching boxes.
const white = 'eeeeee||1';
const longWall = { tris: box(0.229, 2.379, 2.76, 3.87, -5.11, -5.005), look: white };
const cornerFill = { tris: box(2.379, 2.424, 2.76, 3.87, -5.11, -5.005), look: white };
const shortWall = { tris: box(2.424, 2.449, 2.76, 3.87, -6.325, -5.005), look: white };
const k17 = [longWall, cornerFill, shortWall];

test('K17 low wall: touching faces are hidden and the front-face seams drop', () => {
  const faces = index(k17);
  // Long wall's +X end face against the corner fill's -X face: hidden contact.
  assert.deepEqual(classifyEdge(faces, k17, 0, v(2.379, 2.76, -5.005), v(2.379, 3.87, -5.005), v(1, 0, 0)), ['CONTACT']);
  // Same edge on the long wall's south (-N = +z) face: surface continues in the fill.
  assert.deepEqual(classifyEdge(faces, k17, 0, v(2.379, 2.76, -5.005), v(2.379, 3.87, -5.005), v(0, 0, 1)), ['CONTINUED']);
  // Corner fill's south face at X2.424 continues into the short wall's south face.
  assert.deepEqual(classifyEdge(faces, k17, 1, v(2.424, 2.76, -5.005), v(2.424, 3.87, -5.005), v(0, 0, 1)), ['CONTINUED']);
  // Owner's wanted concave corner X2.424 N5.11: corner fill north face is a real outer face.
  assert.deepEqual(classifyEdge(faces, k17, 1, v(2.424, 2.76, -5.11), v(2.424, 3.87, -5.11), v(0, 0, -1)), [null]);
});

test('stairwell north face: 1F wall box under the 2F wall box has no seam at H2.76', () => {
  const wall1F = { tris: box(0.22, 2.444, 2.09, 2.76, -7.335, -7.225), look: white };
  const wall2F = { tris: box(0.22, 2.629, 2.76, 4.80, -7.335, -7.225), look: white };
  const meshes = [wall1F, wall2F];
  const faces = index(meshes);
  const top = classifyEdge(faces, meshes, 0, v(0.22, 2.76, -7.225), v(2.444, 2.76, -7.225), v(0, 0, 1));
  assert.ok(top.length > 0 && top.every((r) => r === 'CONTINUED'), JSON.stringify(top));
});

test('different look or a real outer corner keeps its line', () => {
  const frame = { tris: box(2.379, 2.424, 2.76, 3.87, -5.11, -5.005), look: '6d4c41||1' };
  const meshes = [longWall, frame];
  const faces = index(meshes);
  // Wall and a differently colored flush part: the visible joint stays.
  assert.deepEqual(classifyEdge(faces, meshes, 0, v(2.379, 2.76, -5.005), v(2.379, 3.87, -5.005), v(0, 0, 1)), [null]);
  // Free outer corner of a lone box.
  const lone = [{ tris: box(0, 1, 0, 1, -1, 0), look: white }];
  assert.deepEqual(classifyEdge(index(lone), lone, 0, v(1, 0, 0), v(1, 1, 0), v(1, 0, 0)), [null]);
});

test('surface look key follows color, texture and transparency', () => {
  const mat = (hex, map, transparent = false, opacity = 1) => ({ color: { getHexString: () => hex }, map, transparent, opacity });
  assert.equal(surfaceLookKey(mat('eeeeee')), surfaceLookKey([mat('eeeeee')]));
  assert.notEqual(surfaceLookKey(mat('eeeeee')), surfaceLookKey(mat('eeeeef')));
  assert.notEqual(surfaceLookKey(mat('eeeeee', { uuid: 'a' })), surfaceLookKey(mat('eeeeee')));
  assert.notEqual(surfaceLookKey(mat('eeeeee', null, true, 0.5)), surfaceLookKey(mat('eeeeee')));
});
