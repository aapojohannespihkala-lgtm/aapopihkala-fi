#!/usr/bin/env node
/** V29 WORK_TEST immutable source / classification preflight (not a production WebGL test).
 * Usage: node scripts/verify-v29-layer-source.mjs /path/to/V29.glb
 * Do not bypass SHA or path checks. This script is deliberately offline and read-only.
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { V29_SOURCE_SHA256, V29_SOURCE_SCENE_COUNT, V29_BUILDING_PARTS,
  V29_BUILDING_SCENES, V29_TECHNICAL_SCENES } from '../src/scripts/privateModelC80R2V29LayerSourceProfile.mjs';

const input = process.argv[2];
if (!input) { console.error('Usage: node scripts/verify-v29-layer-source.mjs <V29.glb>'); process.exitCode=2; }
else {
  const b = readFileSync(input);
  assert.equal(createHash('sha256').update(b).digest('hex'), V29_SOURCE_SHA256, 'source SHA mismatch');
  assert.equal(b.toString('ascii',0,4),'glTF','GLB magic');
  assert.equal(b.readUInt32LE(8),b.length,'GLB byte length');
  assert.equal(b.toString('ascii',16,20),'JSON','GLB JSON chunk');
  const len=b.readUInt32LE(12);
  const json=JSON.parse(b.subarray(20,20+len).toString('utf8'));
  assert.equal(json.scenes.length,V29_SOURCE_SCENE_COUNT,'GLB scene count');
  assert.deepEqual(V29_TECHNICAL_SCENES,{ '1F':180,'2F':162,'BOTH':181 });
  let bound=0;
  for (const [sceneId,info] of Object.entries(V29_BUILDING_SCENES)) {
    const scene=json.scenes[Number(sceneId)];
    assert.equal(scene?.name,info.name,'scene '+sceneId);
    for (const [leaf, paths] of Object.entries(info.paths)) {
      const expected=V29_BUILDING_PARTS[leaf];
      assert.ok(expected,'missing building part '+leaf);
      assert.equal(json.nodes[Number(leaf)]?.mesh,expected.mesh,'mesh '+leaf);
      assert.equal(json.nodes[Number(leaf)]?.name,expected.name,'name '+leaf);
      for (const chain of paths) {
        assert.equal(chain.at(-1),Number(leaf),'leaf '+leaf);
        assert.ok(scene.nodes.includes(chain[0]),'root '+chain[0]+' scene '+sceneId);
        for(let i=1;i<chain.length;i++)
          assert.ok(json.nodes[chain[i-1]]?.children?.includes(chain[i]),'parent '+chain[i-1]+' -> '+chain[i]);
        bound++;
      }
    }
  }
  for (const [sceneId, leaf] of [[180,8855],[181,8856]]) {
    assert.ok(json.scenes[sceneId].nodes.includes(leaf),'plinth root in '+sceneId);
    assert.equal(json.nodes[leaf].mesh,3035);
    assert.ok(json.nodes[leaf].extras?.terraceV29,'owner-confirmed continuation metadata');
    assert.equal(V29_BUILDING_PARTS[leaf].id,'architecture-walls-exterior');
  }
  console.log('V29 exact SHA, 182 scenes, plinth roots and '+bound+' building node paths PASS. WORK_TEST only.');
}
