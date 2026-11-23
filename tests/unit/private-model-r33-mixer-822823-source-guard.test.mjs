import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  R33_MIXER_2F_SOURCE,
  verifyR33Mixer2FSourceOptIn,
} from '../../src/scripts/privateModelR33Mixer2FSourceGuard.mjs';

// Baseline roots are an existing, independently committed R33 original fixture.
// No output model is promoted to the production registry by this synthetic test.
const r33 = JSON.parse(readFileSync(
  new URL('../fixtures/private-model-r33-scene-roots.json', import.meta.url), 'utf8',
));

const sceneNames = {
  822: 'Ylisrinne_R33_D2F_KITCHEN_MIXER_CONNECTORS_2F_NORMAL_WORK_TEST_HOST_HOLD__scene822',
  823: 'Ylisrinne_R33_D2F_KITCHEN_MIXER_CONNECTORS_2F_SERVICE_WORK_TEST_HOST_HOLD__scene823',
};

const candidate = (sceneIndex = 822) => {
  const gltf = {
    asset: { extras: { ModelStage: 'WORK_TEST', current: false, asBuilt: false, HUMAN_REVIEW: 'NOT_RUN' } },
    scene: 292,
    scenes: Array.from({ length: 824 }, () => ({ name: 'historical', nodes: [] })),
    nodes: Array.from({ length: 13846 }, () => ({})),
    meshes: Array.from({ length: 5237 }, () => ({})),
  };
  for (const i of [818, 819, 820, 821]) {
    gltf.scenes[i] = structuredClone(r33.scenes[String(i)]);
  }
  gltf.nodes[13472] = {
    name: 'D2F_MIXER_HOSE_CONNECTOR_ROOT_NO_HYDRAULIC_PROOF',
    children: [13470, 13471],
    extras: { role: '2F_AND_BOTH_OPTIN_ONLY', physicalInstallationVerified: false, current: false, asBuilt: false },
  };
  gltf.nodes[13470] = {
    name: 'D2F_KV_BLUE_MIXER_UNDERSIDE_WORK_ASSUMPTION_CONNECTOR',
    mesh: 5160,
    extras: { physicalConnectionVerified: false, current: false, asBuilt: false },
  };
  gltf.nodes[13471] = {
    name: 'D2F_LV_RED_MIXER_UNDERSIDE_WORK_ASSUMPTION_CONNECTOR',
    mesh: 5161,
    extras: { physicalConnectionVerified: false, current: false, asBuilt: false },
  };
  for (const [newIndex, oldIndex] of [[822, 820], [823, 821]]) {
    gltf.scenes[newIndex] = {
      name: sceneNames[newIndex],
      nodes: [...gltf.scenes[oldIndex].nodes, 13472],
      extras: {
        modelStage: 'WORK_TEST',
        hostHold: true,
        canonical: false,
        mixer2FConnectorSourceCOW: {
          originalR33GLBSHA256: R33_MIXER_2F_SOURCE.sourceGlbSha256,
          originalScene: oldIndex,
          existingSourceRootNode: 13472,
          sourceNodeIndices: [13470, 13471],
          meshIndices: [5160, 5161],
          kind: 'WORK_TEST_VISUAL_CONNECTOR',
          physicalConnectionVerified: false,
          current: false,
          asBuilt: false,
          sourceLinksOutputShaBound: false,
          humanReview: 'NOT_RUN',
          productionWebGL: 'NOT_RUN',
        },
      },
    };
  }
  return {
    explicitOptIn: true,
    glbSha256: R33_MIXER_2F_SOURCE.candidateGlbSha256,
    sourceGlbSha256: R33_MIXER_2F_SOURCE.sourceGlbSha256,
    sceneIndex,
    gltf,
  };
};

const rejectWith = (mutate, reason) => {
  const args = candidate();
  mutate(args);
  const result = verifyR33Mixer2FSourceOptIn(args);
  assert.equal(result.sourceOnlyPass, false);
  assert.ok(result.issues.includes(reason), JSON.stringify(result.issues));
};

test('both source-exact 822/823 2F opt-in scenes pass but never authorize publication or as-built', () => {
  for (const sceneIndex of [822, 823]) {
    const result = verifyR33Mixer2FSourceOptIn(candidate(sceneIndex));
    assert.deepEqual(result.issues, []);
    assert.equal(result.sourceOnlyPass, true);
    assert.equal(result.published, false);
    assert.equal(result.productionWebGLVerified, false);
    assert.equal(result.physicalConnectionVerified, false);
    assert.equal(result.currentOrAsBuilt, false);
  }
});

test('unrequested opt-in and legacy 818-821 selection fail closed', () => {
  rejectWith((args) => { args.explicitOptIn = false; }, 'EXPLICIT_OPT_IN_REQUIRED');
  rejectWith((args) => { args.sceneIndex = 820; }, 'WRONG_SCENE_INDEX');
});
test('wrong output GLB or original R33 parent SHA fails closed', () => {
  rejectWith((args) => { args.glbSha256 = '0'.repeat(64); }, 'CANDIDATE_GLB_SHA_MISMATCH');
  rejectWith((args) => { args.sourceGlbSha256 = 'a'.repeat(64); }, 'R33_PARENT_SHA_MISMATCH');
});
test('extra scene, changed default and current asset are rejected', () => {
  rejectWith((args) => { args.gltf.scenes.push({ nodes: [] }); }, 'GLTF_PREFIX_COUNTS_OR_DEFAULT_MISMATCH');
  rejectWith((args) => { args.gltf.scene = 822; }, 'GLTF_PREFIX_COUNTS_OR_DEFAULT_MISMATCH');
  rejectWith((args) => { args.gltf.asset.extras.current = true; }, 'ASSET_WORK_TEST_GATE');
});
test('wrong root list and source-scene edits fail scene parity', () => {
  rejectWith((args) => { args.gltf.scenes[822].nodes.pop(); }, 'COW_SCENE_ROOT_PARITY_MISMATCH');
  rejectWith((args) => { args.gltf.scenes[822].nodes[0] = 9999; }, 'COW_SCENE_ROOT_PARITY_MISMATCH');
  rejectWith((args) => { args.gltf.scenes[820].nodes.push(13472); }, 'R33_LEGACY_SCENE_GATE_820');
});
test('legacy BOTH connector is not silently dropped', () => {
  rejectWith((args) => { args.gltf.scenes[818].nodes = args.gltf.scenes[818].nodes.filter((id) => id !== 13472); }, 'R33_LEGACY_SCENE_GATE_818');
});
test('source geometry identity and provenance cannot be silently substituted', () => {
  rejectWith((args) => { args.gltf.nodes[13470].mesh = 999; }, 'KV_SOURCE_NODE_MISMATCH');
  rejectWith((args) => { args.gltf.nodes[13471].mesh = 999; }, 'LV_SOURCE_NODE_MISMATCH');
  rejectWith((args) => { args.gltf.nodes[13472].children.reverse(); }, 'CONNECTOR_SOURCE_ROOT_MISMATCH');
  rejectWith((args) => { args.gltf.scenes[822].extras.mixer2FConnectorSourceCOW.meshIndices[0] = 999; }, 'COW_SOURCE_PROVENANCE_OR_SAFETY_GATE');
});
test('false physical, sourceLink, human-review, or published semantics fail closed', () => {
  rejectWith((args) => { args.gltf.nodes[13470].extras.physicalConnectionVerified = true; }, 'KV_SOURCE_NODE_MISMATCH');
  rejectWith((args) => { args.gltf.scenes[822].extras.mixer2FConnectorSourceCOW.sourceLinksOutputShaBound = true; }, 'COW_SOURCE_PROVENANCE_OR_SAFETY_GATE');
  rejectWith((args) => { args.gltf.scenes[822].extras.mixer2FConnectorSourceCOW.humanReview = 'PASS'; }, 'COW_SOURCE_PROVENANCE_OR_SAFETY_GATE');
  rejectWith((args) => { args.gltf.scenes[822].extras.hostHold = false; }, 'COW_HOST_HOLD_GATE');
});
test('wrong scene alias is rejected', () => {
  rejectWith((args) => { args.gltf.scenes[822].name = 'R33_2F_mixer__scene822'; }, 'COW_SCENE_NAME_MISMATCH');
});
