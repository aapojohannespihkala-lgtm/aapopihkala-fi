import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import {
  KIV005_SOURCE_SHA256, KIV005_PARENT_SHA256, KIV005_DONOR_SHA256,
  KIV005_SCENES, KIV005_FLOORS, KIV005_SOURCE_SCENE_COUNT,
  KIV005_SOURCE_NODE_COUNT, KIV005_NODES, kiv005OrderedRootFnv,
  isKiv005OwnerSourceScene,
} from '../../src/scripts/privateModelC80Kiv005OwnerSourceProfile.mjs';

// Zlib-packed, ordered root indexes copied byte-for-byte from the SHA-checked
// source GLB JSON scenes 356 and 357; not fabricated names or scene numbers.
const ROOTS = {
  356:'eNotksuRACEIBRPyICq/WLY2/zSW17OXLlQakZmfvB7rhNcgbMW74Ah32Xa/K++cDELI5fewV4pmGaeXV23tKbouxOoTysutWq7IVu19Z5mqn0RPcCFWuKVQQq8oNVNqxuMJk9f9VGr2YlqLnMsj755Wc05EX+1Te/AEltN67ye4wDKFEnowt0jOYc3LJ+rp9jzBBR40S+s5qLnFrGckbbpwQiGFEnqy9x54MsVp5c4V3WbCRDlDnb1SdIUnHO6X027itD7+9y0mWZd+38Uhp/93FGwxNjSomkFmkBnkJHUyGV0aZAb57TPMdBgwYUEqFG7hFm7hFm7hFm7hFm7h9vfJcPub/bh2Wm+8862G8w8ML3wbGjzwQjKfw4AJqfNwHddxHddxHddxHddxHddxA1eTNL8OlRnnQe0E/cT7YrlBTaZtEZwmsWZrafAkNHig9os6RQ+l+VgddaIfVuQfwGrymx6aav1l8urmde39+wcyasWk',
  357:'eNotlskR3DAMBBPSg+CBIxaX80/DM73+TFESmwRBYHb/5D3rm6j3ze71dd20lKUtI3n+8MKyLefbe6+vUpPf3vfL++rLU+V3SH81M140NKXfl/OQtJSlLSPJ9b0658s8YdlaQLtJGB3L/WZCU05qlRvCriKQiLjjLbW8QlP0WfsTev0uLXxtf/AeBK4tYz3tpKAVkXcSVhaF1TqDpBX+Csu2HMu1OFkrLWVhns8ay2IiTISJMBEmQhu1Ull7k0qF9eZ61B55qd5O27Fcy7PoSMsb1XijDCI/6EUfmqgvTofTWa9FOUndgMSP7T1SV9i+5RyH2w7SF9yPCPRhNGWWz7t8yuUDxvgc57e542Ct8kulO5YzqqFe+obmuKCOjiO5Fh79dcJyLP4w/qAjzlN6TuqIEb4DbZOcMTljcsbkjFnob85Yi9ssgiMalRMKW7AFW7AFW7AN27AN27AN27AN27AN27ADO7ADO7ADO7ADO7ADO2ZzLTRQMrgOetGHJlpoo7ABG7ABG7ABG7ABG7ABG7AbdsNu2A27YTfsht2w3EVu2ANLEbhLrbDUYVKHSR2qq1DYA3thL+yFvbAX9sJe2At7YS/sg32wD/bByhXUTOV61nMcZy2OqtfjQhsdq7MmDZSZzlFc5z3cKhHPkUn9/tkjgroJ7ju46eBeg3sK7iO4g+AOgjsI7iB8B3XkQdv2szPtVQfZFmrF9nb0ReLZKm7ZEu/aIz06+Sq75XceKc8S2096XtkG9U6jsFPI464d8BYjm3PZM+1zT/UgaYsstB1MOxi3WbrLEuc5XsBJlh9qXnHxRVmXO9b9NW6vcXeNk1SzbFnLlrV4LIt/B5SkGuql6IM+dji1Xy9VneRZOJAeQ/3RTZJHKZHzPAujsuBGtttly3l0ln8fjrbQj0RYNKq009irSnmSXMtmfzNDPQ33Oz+XeXTso2P/r0vHPrr995vx89/8VSH1ysxkTuFZhR8VflT4UdXvPQnEjwo/Kvyo8KPCjwo/Kvyo8KPCjwo/Kvyo8KPCjwo/Kvyo5ndNsPPLt2tyz68LLjVPLxz00hGXjqDyz6+PLjMvPUIvnEs3Xda5sA/2wT7YB/tgH+yDfbAP9sHSWS56ddOh7+wagQcFHhR4ROALgRdEsibZjqTHsxg7t1F2Ov1yLDTQjfL18J5Tk/8gt9Fko9m3N2N2bKJt+n3s1NLfeKMHvSiFuqgiPGfwnMFnBk8Y3GCIcNhxiHCIbTjvbL4SwxxWJtrhLoacD7nVf6a//wAGV+wB',
};
const rootsFor = index => JSON.parse(inflateSync(Buffer.from(ROOTS[index], 'base64')).toString('utf8'));
const fixture = () => {
  const nodes = Array.from({length:KIV005_SOURCE_NODE_COUNT}, () => ({}));
  nodes[8912] = {children:[...KIV005_NODES.valveMeshChildren]};
  nodes[8913] = {children:[...KIV005_NODES.unchangedGroupChildren,8912]};
  nodes[11965] = {
    children:[...KIV005_NODES.valveMeshChildren],
    translation:[2.897,10.623583493828773,5.045],
    extras:{
      pointObservation:'OWNER_APPROX_VISUAL_MARK_2026-11-11',
      ownerMarkedWallPointG1M:[2.897,10.59,5.045],
      exactDonorGlbSHA256:KIV005_DONOR_SHA256,
    },
  };
  nodes[11966] = {
    children:[...KIV005_NODES.unchangedGroupChildren,11965],
    extras:{
      sourceParentGlbSHA256:KIV005_PARENT_SHA256,
      exactDonorGlbSHA256:KIV005_DONOR_SHA256,
      modelStatus:'WORK_TEST/HOST_HOLD',
      ownerApproxPointG1M:[2.897,10.59,5.045],
      sourceLinks:[{role:'OWNER2026_APPROX_VISUAL_MARK'}],
    },
  };
  const scenes=Array.from({length:KIV005_SOURCE_SCENE_COUNT},() => ({nodes:[],name:'source history'}));
  for(const [key,p] of Object.entries(KIV005_SCENES)) {
    scenes[key] = {
      name:p.name,nodes:rootsFor(key),
      extras:{
        stage:'WORK_TEST/HOST_HOLD',asBuilt:false,current:false,
        productionWebGL:'NOT_RUN',humanReview:'NOT_RUN',
        sourceParentGlbSHA256:KIV005_PARENT_SHA256,
        donorGlbSHA256:KIV005_DONOR_SHA256,
        sourceParentScene:p.sourceParentScene,
        donorScene:p.donorScene,
        oldKivGroup:8913,newKivGroup:11966,
        oldKivNode:8912,newKivNode:11965,
        ownerApproxPointG1M:[2.897,10.59,5.045],
        wallDepthAssumptionM:0.033583493828773,
        sourceLinks:[
          {role:'WORK_TEST_PARENT_COMBINED',glb_sha256:KIV005_PARENT_SHA256,sceneIndex:p.sourceParentScene},
          {role:'SOURCE_EXACT_KIV005_REPLACEMENT',glb_sha256:KIV005_DONOR_SHA256,sceneIndex:p.donorScene},
        ],
      },
    };
  }
  return {scene:292,nodes,scenes,asset:{extras:{
    current:false,asBuilt:false,canonical:false,ModelStage:'WORK_TEST',
    viewerFloorScenes:{'1F':347,'2F':348,BOTH:349},
  }}};
};
test('KIV005 real GLB ordered root snapshots accept only matching 2F and BOTH', () => {
  const j=fixture();
  for(const [floor,index] of Object.entries(KIV005_FLOORS)) {
    assert.equal(kiv005OrderedRootFnv(j.scenes[index].nodes), KIV005_SCENES[index].rootFnv);
    assert.equal(isKiv005OwnerSourceScene(j,KIV005_SOURCE_SHA256,index,floor),true);
  }
  assert.equal(isKiv005OwnerSourceScene(j,KIV005_SOURCE_SHA256,292),false);
  assert.equal(isKiv005OwnerSourceScene(j,KIV005_SOURCE_SHA256,356,'1F'),false);
});
test('KIV005 refuses incorrect SHA, roots, parent and swapped donor scene', () => {
  const j=fixture();
  assert.equal(isKiv005OwnerSourceScene(j,'0'.repeat(64),357),false);
  const roots=structuredClone(j);roots.scenes[356].nodes.reverse();
  assert.equal(isKiv005OwnerSourceScene(roots,KIV005_SOURCE_SHA256,356),false);
  const root=structuredClone(j);root.scenes[356].nodes[62]=8913;
  assert.equal(isKiv005OwnerSourceScene(root,KIV005_SOURCE_SHA256,356),false);
  const parent=structuredClone(j);parent.scenes[357].extras.sourceParentGlbSHA256='f'.repeat(64);
  assert.equal(isKiv005OwnerSourceScene(parent,KIV005_SOURCE_SHA256,357),false);
  const donor=structuredClone(j);donor.scenes[357].extras.sourceLinks[1].sceneIndex=350;
  assert.equal(isKiv005OwnerSourceScene(donor,KIV005_SOURCE_SHA256,357),false);
});
test('KIV005 refuses fake KIV, physical promotion, missing owner point and wrong floors', () => {
  const j=fixture();
  const extra=structuredClone(j);extra.nodes[11966].children[4]=8912;
  assert.equal(isKiv005OwnerSourceScene(extra,KIV005_SOURCE_SHA256,357),false);
  const physical=structuredClone(j);physical.asset.extras.asBuilt=true;
  assert.equal(isKiv005OwnerSourceScene(physical,KIV005_SOURCE_SHA256,357),false);
  const owner=structuredClone(j);delete owner.nodes[11965].translation;
  assert.equal(isKiv005OwnerSourceScene(owner,KIV005_SOURCE_SHA256,356),false);
  const floor=structuredClone(j);floor.asset.extras.viewerFloorScenes.BOTH=357;
  assert.equal(isKiv005OwnerSourceScene(floor,KIV005_SOURCE_SHA256,357),false);
});
