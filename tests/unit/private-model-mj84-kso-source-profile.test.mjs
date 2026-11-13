import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import {
  MJ84_SOURCE_SHA256, MJ84_PARENT_SHA256, MJ84_SCENE_COUNT,
  MJ84_NODE_COUNT, MJ84_DEFAULT_SCENE, MJ84_PARENT_FLOORS, MJ84_FLOORS,
  MJ84_SCENES, MJ84_COMPONENTS, MJ84_EXISTING,
  mj84RootFnv32, isMJ84SourceScene,
} from '../../src/scripts/privateModelMJ84KsoSourceProfile.mjs';

// Byte-exact ordered root arrays, zlib/base64 snapshots extracted from the
// authenticated MJ84 GLB SHA 396f1abe..., not arbitrary filename matches.
const ROOTS = Object.freeze({
  352: 'eNotksuRQCEIBBPyICq/WLY2/zSW6beXLgQGEP3J67FOeA3CVrwLjnCXbfe78k5kEEIuvwdfyZpjnF5eteWTdV2I1SeUl1u1XJat2vvOMVU/sZ7gQqxwS6GEXlEapjSMxxMmr/up1PhiRouc5pF3z6g5EdFX+9QePIHjjN77CS5wTKGEHkwXiXNYc/OxeqY9T3CBC83RegI1Xaptupj6WYeQQgk9yXsPPFniTHKnQ7eZMFbOTsdXsq7whEN7adpNnMlH/z3FJJupqSo6JPrfo2CLsaFB1Qwyg8wgR12HyebSICvIz88u02HAhAWpUGgLbaEttIW20BbaQltoC21/L4a2v9WP1k7rjneeajhfYHjh29DggReS+RwGTEidh9bROlpH62gdraN1tI7W0TraQKtNml+HyozzoDzBPPE+W9qgJtu2CKKJrd1aGjwJDR4of+kvm76gGFCTFF2KLsWEpe1ZHUX1m8Xvh2xo8ED//QMCzMZ4',
  353: 'eNotlccV3TAQAxvSgcuwoRY/99+Ggfm+4FESh2ED9CfvWd9EvW92r6/rpqUsbRnJ84cXlm053957fZWa/Pa+X95XX54qv0P6q5nxoqEp/b6ch6SlLG0ZSa7v1Tlf5gnL1gLaTcLoWO43E5pyUqvcEHZ1AomIO95Sy+toOn3W/oRev0sLX9sfvAcH15axnnbSoXUi7ySsLDpW6w6S1vFXWLblWK7FwVppKQvzfNdYFhNhIkyEiTAR2qgVytqbUOpYb65H7ZGX6u2wHcu1PIuutLxRjTfK4OQHvehDE3XidDnd9VoUk1QGJH5s75FKYTvLOT5u+5BOcD9OoA+jKbN83+VbLl8wxvc4v819DtYqv1S4YzmiGuqlMzTHBXV0Hcm18OivE5Zj8YfxB11xnsJzUleMcA60TXLH5I7JHZM7ZqG/OWMtslkcjtOonFDYgi3Ygi3Ygm3Yhm3Yhm3Yhm3Yhm3Yhh3YgR3YgR3YgR3YgR3YMZtroYESwXXQiz400UIbhQ3YgA3YgA3YgA3YgA3YgN2wG3bDbtgNu2E37IYlF7lhDyxF4C61wlKHSR0mdaiuQmEP7IW9sBf2wl7YC3thL+yFvbAP9sE+2AcrV1AzletZz3EctTiqXo8LbXSsjpo0UGY6RnEd93CrRDyfTOr3zx4R1E2Q7yDTQV6DPAX5CHIQ5CDIQZCDcA7qyIO27Wdn2qsOsi3Uiu3t6IvEs1XcsiXetUd6dPBVdsvvPFKcJbaf9LyyDeqdRmGnkMddO+AtRjbnsmfa557qQdIWWWj7MO3DuM3SXZY4z/ECDrL8UPOKxBdlXe5Y99e4vcbdNQ5SzbJlLVvW4rEs/g8oSDXUS9EHfexwar9eqjrJs3AhPYb6o1u7tA1fxvMsaSkLZmS3XXacR2P593C0g/4RYdGo0kZjqyqFSXItm+3NDOU0pHdonPdo2EfD/l+Xhn00+++X8bPf/BUh5crMZE5hWYUdFXZU2FHV7z3xw44KOyrsqLCjwo4KOyrsqLCjwo4KOyrsqLCjwo4KOyrsqOaXJdj5hdsluefXBJeSpxUOemmIS0NQ+OfXRpeZlxahFc6lmS7rXNgH+2Af7IN9sA/2wT7YB/tgaSzXvJrp0HY2jcCCAgsKLCKwhcAKIlmTaEfS4lmMHdsoG51+HAsNdKN8Pbzn1uWfiJRxMYfWJyNBFoLIRxOr5lS9GbOOy9eaKO85bXPa5qaNVYxNXvobb/SgF30oFYhdDXY1GNVgVIO1TLy//wAfPule',
});
const rootList = key => JSON.parse(inflateSync(Buffer.from(ROOTS[key], 'base64')).toString('utf8'));
const fixture = () => {
  const nodes=Array.from({length:MJ84_NODE_COUNT},()=>({}));
  for (const component of Object.values(MJ84_COMPONENTS))
    nodes[component.node]={name:component.name,mesh:component.mesh,extras:{asBuilt:false,physicalConnectionVerified:false}};
  for(const idx of [11913,11914])
    nodes[idx]={name:'WORK_TEST_COW_TECH_ROOT',children:[
      MJ84_EXISTING.preferredFork,MJ84_EXISTING.followingDuct,...MJ84_EXISTING.ceilingKso,
    ]};
  const scenes=Array.from({length:MJ84_SCENE_COUNT},()=>({name:'older-scene',nodes:[]}));
  for(const [key,p] of Object.entries(MJ84_SCENES))scenes[key]={
    name:p.name,nodes:rootList(key),
    extras:{
      parentGLBSHA256:MJ84_PARENT_SHA256,parentScene:p.parentScene,
      sourceRoot:p.sourceRoot,COWRoot:p.cowRoot,
      verificationStage:'WORK_TEST_HOST_HOLD',
      physicalConnectionVerified:false,ductInternalBoreOpenVerified:false,
      verifiedAirflowLps:null,ownerG1XYZ:[5.004,5.494,5.195],
      sourceLinks:[
        {docId:'DOC:13JgMhHVCFqHjR0PP-J6KDWZOnz6GkIl5UZoaozbA7IA'},
        {docId:'DOC:1gb4mEwhOgxIkgxH9kXOecUxjs8eN7XF9'},
      ],
    },
  };
  return {scene:MJ84_DEFAULT_SCENE,scenes,nodes,asset:{extras:{
    current:false,asBuilt:false,canonical:false,ModelStage:'WORK_TEST',
    viewerFloorScenes:{...MJ84_PARENT_FLOORS},
  }}};
};
test('MJ84 real ordered roots and opt-in floor bindings', () => {
  const j=fixture();
  for(const [floor,index] of Object.entries(MJ84_FLOORS)) {
    assert.equal(mj84RootFnv32(j.scenes[index].nodes),MJ84_SCENES[index].rootFnv);
    assert.equal(isMJ84SourceScene(j,MJ84_SOURCE_SHA256,index,floor),true);
  }
  assert.equal(isMJ84SourceScene(j,MJ84_SOURCE_SHA256,292),false);
});
test('MJ84 fails closed on SHA/scene/floor/ordered-roots/parent mismatches', () => {
  const j=fixture();
  assert.equal(isMJ84SourceScene(j,'0'.repeat(64),352,'2F'),false);
  assert.equal(isMJ84SourceScene(j,MJ84_SOURCE_SHA256,352,'BOTH'),false);
  const ordered=structuredClone(j);ordered.scenes[353].nodes.reverse();
  assert.equal(isMJ84SourceScene(ordered,MJ84_SOURCE_SHA256,353,'BOTH'),false);
  const dupe=structuredClone(j);dupe.scenes[352].nodes[0]=dupe.scenes[352].nodes[1];
  assert.equal(isMJ84SourceScene(dupe,MJ84_SOURCE_SHA256,352),false);
  const parent=structuredClone(j);parent.scenes[352].extras.parentGLBSHA256='0'.repeat(64);
  assert.equal(isMJ84SourceScene(parent,MJ84_SOURCE_SHA256,352),false);
});
test('MJ84 keeps one 2026 wall KSO, separate WC ceiling and no historical T', () => {
  const j=fixture();
  const old=structuredClone(j);old.nodes[11913].children.push(MJ84_EXISTING.historicalT);
  assert.equal(isMJ84SourceScene(old,MJ84_SOURCE_SHA256,352),false);
  const hall=structuredClone(j);hall.nodes[11914].children.push(MJ84_EXISTING.obsoleteHall[0]);
  assert.equal(isMJ84SourceScene(hall,MJ84_SOURCE_SHA256,353),false);
  const wc=structuredClone(j);wc.nodes[11913].children=wc.nodes[11913].children.filter(n=>n!==11620);
  assert.equal(isMJ84SourceScene(wc,MJ84_SOURCE_SHA256,352),false);
  const upgrade=structuredClone(j);upgrade.asset.extras.asBuilt=true;
  assert.equal(isMJ84SourceScene(upgrade,MJ84_SOURCE_SHA256,353),false);
  const flow=structuredClone(j);flow.scenes[352].extras.ductInternalBoreOpenVerified=true;
  assert.equal(isMJ84SourceScene(flow,MJ84_SOURCE_SHA256,352),false);
  const node=structuredClone(j);node.nodes[11915].extras.physicalConnectionVerified=true;
  assert.equal(isMJ84SourceScene(node,MJ84_SOURCE_SHA256,353),false);
  const location=structuredClone(j);location.scenes[353].extras.ownerG1XYZ[0]=5.0;
  assert.equal(isMJ84SourceScene(location,MJ84_SOURCE_SHA256,353),false);
});
