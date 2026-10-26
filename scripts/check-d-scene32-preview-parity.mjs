import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Fixed, immutable WORK_TEST sources. This is a source/scene integrity gate,
// NOT a 3D appearance, authenticated browser, or as-built approval.
export const D_SCENE32_SOURCE_SHA = '2f42444401224f7b5bd62663c4227d78e3af0618c58c1961e317598cf7886680';
export const D_SCENE32_PREVIEW_SHA = 'e369287b0b113d18152767d5b45a6736f03a5932883e5de4ce1d7900d63afbab';
const previewExpected = [
  { index: 33, mask: 'D_1F', name: 'D / ALKAKERTA / WORK_TEST preview', count: 791 },
  { index: 34, mask: 'D_2F', name: 'D / YLAKERTA / WORK_TEST preview', count: 440 },
  { index: 35, mask: 'D_BOTH', name: 'D / MOLEMMAT / WORK_TEST preview', count: 1231 },
];

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = message => { throw new Error(`D scene32 preview HOLD: ${message}`); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function parseSingleBufferGlb(data) {
  const bytes = data instanceof Uint8Array ? data : fail('GLB input must be bytes');
  if (bytes.byteLength < 28) fail('GLB too short');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 ||
      view.getUint32(8, true) !== bytes.byteLength) fail('invalid GLB2 header/length');
  let offset = 12;
  const chunks = [];
  while (offset < bytes.byteLength) {
    if (offset + 8 > bytes.byteLength) fail('truncated GLB chunk header');
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    if (length % 4 || offset + 8 + length > bytes.byteLength) fail('invalid GLB chunk bounds');
    chunks.push({ type, bytes: bytes.subarray(offset + 8, offset + 8 + length) });
    offset += 8 + length;
  }
  if (chunks.length !== 2 || chunks[0].type !== 0x4e4f534a || chunks[1].type !== 0x004e4942)
    fail('expected one JSON and one BIN chunk');
  let gltf;
  try { gltf = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(chunks[0].bytes).trimEnd()); }
  catch { fail('malformed glTF JSON'); }
  if (gltf?.asset?.version !== '2.0' || !Array.isArray(gltf.scenes) ||
      !Array.isArray(gltf.nodes) || gltf.buffers?.length !== 1 ||
      gltf.buffers[0].uri || gltf.buffers[0].byteLength !== chunks[1].bytes.length)
    fail('unexpected glTF resource layout');
  return { gltf, bin: chunks[1].bytes };
}

/**
 * Check the *actual* R4E scene32 and 3-scene preview bytes. No write effects.
 * For test fixtures only, pass another immutable source contract via options.
 */
export function checkDScene32Preview(sourceBytes, previewBytes, options = {}) {
  const sourceSha = options.sourceSha ?? D_SCENE32_SOURCE_SHA;
  const previewSha = options.previewSha ?? D_SCENE32_PREVIEW_SHA;
  const originalScenes = options.originalScenes ?? 33;
  const originalNodes = options.originalNodes ?? 2930;
  const target = options.target ?? previewExpected;
  if (sha256(sourceBytes) !== sourceSha || sha256(previewBytes) !== previewSha)
    fail('source/preview SHA256 identity mismatch');
  const original = parseSingleBufferGlb(sourceBytes);
  const preview = parseSingleBufferGlb(previewBytes);
  const a = original.gltf, b = preview.gltf;
  if (a.scenes.length !== originalScenes || a.nodes.length !== originalNodes ||
      b.scenes.length !== originalScenes + target.length ||
      b.nodes.length !== originalNodes + target.at(-1).count ||
      b.scene !== target.at(-1)?.index)
    fail('source/default scene or original node-count drift');
  // Do not mistake a newly named preview for an unchanged scene32 source.
  if (!same(a.scenes, b.scenes.slice(0, originalScenes)) ||
      !same(a.nodes, b.nodes.slice(0, originalNodes)))
    fail('original scenes 0-32 or nodes changed');
  const allowedChanges = new Set(['scene', 'scenes', 'nodes']);
  if (!same(Object.keys(a).sort(), Object.keys(b).sort()) ||
      Object.keys(a).some(k => !allowedChanges.has(k) && !same(a[k], b[k])))
    fail('source glTF resource table or metadata changed');
  if (original.bin.length !== preview.bin.length ||
      !original.bin.every((v, i) => v === preview.bin[i]))
    fail('original BIN bytes changed');
  const actualSets = [];
  for (const { index, mask, name, count } of target) {
    const scene = b.scenes[index];
    const flags = scene?.extras?.ylisPreview;
    const roots = scene?.nodes;
    if (!scene || scene.name !== name || flags?.mask !== mask ||
        flags.stage !== 'SCENE32_WORK_TEST' || flags.objectCount !== count ||
        flags.browserQA !== 'NOT_RUN' || flags.current !== false ||
        flags.asBuilt !== false || flags.publishReady !== false ||
        flags.unresolvedSharedCD !== 'HOLD_NOT_IN_PREVIEW' ||
        flags.K14UnknownGableRoof8 !== 'HOLD_NOT_IN_PREVIEW' ||
        flags.K17Host !== 'HOLD_NOT_IN_PREVIEW' ||
        !Array.isArray(roots) || roots.length !== count ||
        roots.some(v => !Number.isInteger(v) || v < originalNodes || v >= b.nodes.length) ||
        new Set(roots).size !== count)
      fail(`scene ${index} identity, source role, HOLD flags or roots invalid`);
    actualSets.push(new Set(roots));
  }
  const [first, second, combined] = actualSets;
  if ([...first].some(i => second.has(i)) || combined.size !== first.size + second.size ||
      [...first, ...second].some(i => !combined.has(i)))
    fail('D_1F/D_2F/BOTH roots are not a disjoint union');
  const allRoots = [...first, ...second];
  if (new Set(allRoots).size !== b.nodes.length - originalNodes ||
      allRoots.some(i => b.nodes[i].children?.length || b.nodes[i].mesh == null))
    fail('preview source draw nodes include unknown or nested objects');
  return Object.freeze({
    status: 'SOURCE_PARITY_PASS_BROWSER_HOLD', sourceSha256: sourceSha,
    previewSha256: previewSha, originalScenes, originalNodes,
    previewScenes: target.map(({ index, mask, count }) => ({ index, mask, count })),
    sourceScenePreserved: true, allSourceResourcesAndBinPreserved: true,
    browserQA: 'NOT_RUN', current: false, canonical: false, asBuilt: false,
    readyForPublishQueue: false,
  });
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  if (process.argv.length !== 4) {
    console.error('Usage: node scripts/check-d-scene32-preview-parity.mjs SOURCE.glb PREVIEW.glb');
    process.exitCode = 2;
  } else {
    try {
      const result = checkDScene32Preview(readFileSync(process.argv[2]), readFileSync(process.argv[3]));
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(String(error.message));
      process.exitCode = 1;
    }
  }
}
