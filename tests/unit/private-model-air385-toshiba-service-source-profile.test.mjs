import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import {
  AIR385_SOURCE_SHA256, AIR385_SOURCE_SCENE_COUNT, AIR385_SCENES,
  AIR385_FLOORS, AIR385_BASE_FLOORS, AIR385_PARENT_SHA256,
  AIR385_MJ69_DONOR_SHA256, AIR385_COMPONENTS, air385RootFnv32,
  isAir385SourceScene,
} from '../../src/scripts/privateModelAir385ToshibaServiceSourceProfile.mjs';

// Zlib snapshots of ordered root ID arrays, extracted from the verified
// raw GLB (not a mocked name-only list). The GLB bytes stay in private G2b.
const ROOT_SNAPSHOTS = {
  "383": "eNollMmRJCEQBBWqB8mRhyxjq78aG+H9caMBJw+o/st71jdR75vd6+u6aZTRxgjPCy+MbZxv772+Sm1+e98v76svT5XnQH81Mz40tKXfl/NAGmW0MUKuL/OEseUqkMDoGPebiaPjUwfckHEVXJBxx9F0srJS4ln7k3o9lwar7QUdkOSsaLGeIilfJeNI0spQRq30hVbmK4xtHOMa7tNKowz2ucxYho2wETbCRtgIBWp1sfami0rrzfWoPfJRvd2xY1zjGSppOVCNA2WQ+YEXPpjQd6biVOs11JNU8wX/bMdI3V77gnOcbjtJ320/MtDCaMss17tc5XKBMa7j/II7D84qT6rdsdxRDTXpG5rjt3RUjnANfnp1wjiGF8YLKnGe2nNSJUb4DhQmqTGpMakxqTEL/vaMWdxmkRzZvMIt3MIt3MIt3MJt3MZt3MZt3MZt3MYd3MEd3MEd3MEd3MEd3LGba8GAdHAdeOGDCQs2xA3cwA3cwA3cwA3cwA3cwN24G3fjbtyNu3E37sblLnLjHlwegb9SE5d3mLzD5B3qq4K4B/fiXtyLe3Ev7sW9uBf34l7ch/twH+7D1b+CPqbye9bvOO5aHL1ejws2HNNdEwMqUlx3PPyRRDznJHr++d8heDHBTQd3HNxocEPBTQTdD7ofdD/oftD9KCKWey1u6J11mHdfopKdybjYQz5F9PIb1afnk9v3F70Zb+b9esQND7zwwYQF3YchnyHP2Yw3ew4n+Lb28mniM/0Fihf+ZhIWZH+xv9hZv5kxe//7D5MPQNI=",
  "384": "eNotksGRQCEIQxvyICoQatnZ/tvYJH8vbxAIIPrTN2udShAVq941jnBX7My7+jJClNAr77EPsnisMyuBLZ+sm0KtOaW83qqVsmJh78tjq37bekIKtSqjBQizChoGGibrCcybeSpFX3G0ajavvpujNiNirknWJp7gI0ef/YQUfGwBwhDsInGT4M1pDac9T0jBF+IxhgGwCybYJdQvpoQWIAyT9yayvUROctlhJkKg1dwpfZB1hScct5dmMkROTv33FEyO0IVVMU1H/3vAdLS2GaZqljPLmeUcdSXbm+swvYL+/N5lp1lmmzBdAdbCWlgLa2EtrIW1sBbWwtr5Xsza+VZPbZzRHS+fiuQXIK/5thnmMa/pzJdmmW26zrM2rU1r09q0Nq1Na9PatDatTWvLWm0y8qapzDrPlKc8T73PlrZcU9+Ddjmq7ZHytP192gzzmPJDfzn0BcUyNQncBe4CTwhtL6D/ELO3CfeVrd9P++H3D2eTxVI=",
  "385": "eNotlckV3TAMAxv6B1ELl1ry0n8bAca5zJNtQaIoEv6T96zfRL3f7F6/rptGGW2M8PzhhbGN89t7r1+lJr+97y/vq1+eKr8D/auZ8aKhKf1+OQ+kUUYbI+T6ZZ4wtrTaSGB0jPubiaPlUwvckOJqc0GKO95NKysqBZ61f5Jev0uDr+0PWiCJWbvFetpJ8SoY7yRZGYqoFb7QinyFsY1jXMN5WmmUwTwfM5ZhRVgRVoQVYUVoo1YWa2+yqLDeXI/aIy/V2xk7xjWeoSMtb1TjjTKI/MALH0zoO9PhdNZrKCep5At+bO+Rur32Bec43HaQvtt+RKAPoymzfN7lUy4fMMbnON/mjoO1yi+V7ljOqIZ66Rua41o6Oo5wDR79dcI4hj+MP+iI85SekzpihO9A2yRnTM6YnDE5Yxb85oxZ3GYRHNG8QltoC22hLbSFttA22kbbaBtto220jbbRNtpGO2gH7aAdtIN20A7aQTtox9pcCwYkg+vACx9MWLAh2kAbaANtoA20gTbQBtpAG2g32o12o91oN9qNdqPdaLmL3GgPWorAXWqipQ6TOkzqUF0F0R60F+1Fe9FetBftRXvRXrQX7UX70D60D+1DK1dQM5XrWc9xnLU4ql6PCzYc01kTA2qnuM54uEkinmMS/f7ZHYKKCW46uOPgRoMbCm4iyH6Q/SD7QfbD2a8j99k2np1plzpgG1SJje3oi+DZKmsZEu/aIz067Sq45XceKcOCjSc9r2yAeqdR2CPkbtfed4uRHbnslna4p0oQ2pB5toNpB+MGS/dX4jnHCzi9ckLNK668KOhyr7qzxo017qtxkmqWzWrZrBaPZdj8laQaKqXogD72NjVeL9Wb8AwOpMdQZ3Rrl7bVy3KekUYZ2JB9dtlrHi3lH8PRDvo7hKFRpS3GJlVKk3CNzfbWDIU0XG/RMu/Rqo9W/b8urfpo8+9n8RlvfuVHoTIzmVOYVWFEhREVRlT1vSd/GFFhRIURFUZUGFFhRIURFUZUGFFhRIURFUZUGFFhRIUR1Xy3hHa+dLsk93zlfyl5muDASytcWoHCP18DXWZe2ohWOJc2uqxz0T60D+1D+9A+tA/tQ/vQPrQPLY3lmlczHdrOdhGYT2A+gTkEhhCYQCRrztdkNHc6e+HfuW+w+GUsGHBDvh7ec+pKbjwZF3No/foqwbegv5wjaXLVRNWbMeu4fM2EvCfaJtrmpI1VjO1d/MYbHnghJ7K9x2BUg1ENFjUYyXCi2cw5rGA7DX5qilNj9cGGz3QFihd+bxIWZH4xv5hZ35sxe//9B0V7+xA="
};
const rootList = index => JSON.parse(inflateSync(Buffer.from(ROOT_SNAPSHOTS[index], 'base64')).toString('utf8'));
const expectedNodes = Object.values(AIR385_COMPONENTS);
const fixture = () => {
  const nodes = Array.from({length:12083}, () => ({}));
  for (const part of expectedNodes) {
    nodes[part.node] = {name:part.name};
    if (part.children) nodes[part.node].children = [...part.children];
    if (part.mesh !== undefined) nodes[part.node].mesh = part.mesh;
  }
  nodes[12082].extras = {representationKind:'NONPHYSICAL_OPERATIONAL_OVERLAY'};
  const scenes = Array.from({length:AIR385_SOURCE_SCENE_COUNT}, () => ({name:'older-unmodified-scene',nodes:[]}));
  for (const [key, p] of Object.entries(AIR385_SCENES)) {
    scenes[key] = {
      name: p.name,
      nodes:rootList(key),
      extras:{
        derivedFromGLBSHA256:AIR385_PARENT_SHA256,
        derivedSceneIndex:p.derivedSceneIndex,
        MJ69DonorGLBSHA256:AIR385_MJ69_DONOR_SHA256,
        MJ69DonorSceneIndex:p.mj69Scene,
        newFilterGuideNode:p.includesNewComponents ? 12082 : null,
        WORK_TEST:true,HOST_HOLD:true,NOT_CURRENT_AS_BUILT:true,
      },
    };
  }
  return {
    scene:292,scenes,nodes,
    asset:{extras:{
      current:false,asBuilt:false,canonical:false,ModelStage:'WORK_TEST',
      viewerFloorScenes:{...AIR385_BASE_FLOORS},
    }},
  };
};
test('AIR385 authentic ordered source roots and opt-in floor profiles', () => {
  const j=fixture();
  for(const [floor,index] of Object.entries(AIR385_FLOORS)) {
    assert.equal(air385RootFnv32(j.scenes[index].nodes), AIR385_SCENES[index].rootFnv);
    assert.equal(isAir385SourceScene(j,AIR385_SOURCE_SHA256,index,floor),true);
  }
  assert.equal(isAir385SourceScene(j,AIR385_SOURCE_SHA256,292),false);
});
test('AIR385 rejects wrong SHA, floors, root changes and stale provenance', () => {
  const j=fixture();
  assert.equal(isAir385SourceScene(j,'0'.repeat(64),385,'BOTH'),false);
  assert.equal(isAir385SourceScene(j,AIR385_SOURCE_SHA256,385,'1F'),false);
  const bad=structuredClone(j);
  bad.scenes[385].nodes.reverse();
  assert.equal(isAir385SourceScene(bad,AIR385_SOURCE_SHA256,385,'BOTH'),false);
  const dupe=structuredClone(j);
  dupe.scenes[383].nodes[0]=dupe.scenes[383].nodes[1];
  assert.equal(isAir385SourceScene(dupe,AIR385_SOURCE_SHA256,383,'1F'),false);
  const donor=structuredClone(j);
  donor.scenes[383].extras.MJ69DonorGLBSHA256='0'.repeat(64);
  assert.equal(isAir385SourceScene(donor,AIR385_SOURCE_SHA256,383,'1F'),false);
  const legacy=structuredClone(j);
  legacy.asset.extras.viewerFloorScenes['1F']=383;
  assert.equal(isAir385SourceScene(legacy,AIR385_SOURCE_SHA256,383,'1F'),false);
});
test('AIR385 rejects physical identity upgrade and phantom 2F ducts', () => {
  const j=fixture();
  const physical=structuredClone(j); physical.asset.extras.asBuilt=true;
  assert.equal(isAir385SourceScene(physical,AIR385_SOURCE_SHA256,385,'BOTH'),false);
  const overlay=structuredClone(j);overlay.nodes[12082].extras.representationKind='PHYSICAL_DUCT';
  assert.equal(isAir385SourceScene(overlay,AIR385_SOURCE_SHA256,385,'BOTH'),false);
  const bogus=structuredClone(j); bogus.scenes[384].nodes[0]=12082;
  assert.equal(isAir385SourceScene(bogus,AIR385_SOURCE_SHA256,384,'2F'),false);
  const mixed=structuredClone(j); mixed.nodes[12079].children=[12080,12080];
  assert.equal(isAir385SourceScene(mixed,AIR385_SOURCE_SHA256,383,'1F'),false);
});
