import {C80_437_GLB_SHA256,C80_437_SCENES,isC80437SourceScene,resolveC80437TechnicalNode} from './privateModelC80437SourceProfile.mjs';
import { isM6263Mj72Kiv005Pk1SuccessorSourceScene, SUCCESSOR_R1_SCENES } from './privateModelM6263Mj72Kiv005Pk1SuccessorSourceProfile.mjs';
import { isTate4Mj62Mj63SourceScene, TATE4_MJ6263_SCENES } from './privateModelTate4Mj62Mj63SourceProfile.mjs';
import { sameSourceName } from './privateModelSourceNodeAssociations.mjs';

// Filled from the SHA-verified original GLB, never appearance or name search.
// These are display roles only. Hidden routes remain unverified WORK_TEST.
const CONCEALED = [
  {
    "node": 11733,
    "mesh": 4483,
    "name": "P04_D1F_SAUNA_140X40_TO_D100_HIDDEN_TRANSITION",
    "path": [
      11730,
      11733
    ],
    "semantic": [
      11733,
      [
        "part"
      ],
      "HIDDEN_ADAPTER_WORK_ASSUMPTION"
    ],
    "floors": [
      "1F",
      "BOTH"
    ]
  },
  {
    "node": 11737,
    "mesh": 4487,
    "name": "P04_D1F_ABOVE_SUSPENDED_CEILING_D100_ELBOW_XY",
    "path": [
      11730,
      11737
    ],
    "semantic": [
      11737,
      [
        "part"
      ],
      "HIDDEN_ELBOW_WORK_ASSUMPTION"
    ],
    "floors": [
      "1F",
      "BOTH"
    ]
  },
  {
    "node": 11738,
    "mesh": 4488,
    "name": "P04_D1F_ABOVE_SUSPENDED_CEILING_D100_ELBOW_YZ",
    "path": [
      11730,
      11738
    ],
    "semantic": [
      11738,
      [
        "part"
      ],
      "HIDDEN_ELBOW_WORK_ASSUMPTION"
    ],
    "floors": [
      "1F",
      "BOTH"
    ]
  },
  {
    "node": 11829,
    "mesh": 4504,
    "name": "GPT6H_P01_RK3_3PH_2015_LIESI_TO_2026_AEG_HOB_HIDDEN_STRUCTURAL_FEED_ONE_ROUTE_WORK_TEST_HOST_HOLD",
    "path": [
      11829
    ],
    "semantic": [
      11829,
      [
        "noVisibleRoomCable"
      ],
      true
    ],
    "floors": [
      "1F",
      "2F",
      "BOTH"
    ]
  },
  {
    "node": 11905,
    "mesh": 4512,
    "name": "PK1_DN32_CONCEALED_BRANCH_TO_PA2_D4_AFTER_BASIN_TRAP",
    "path": [
      11905
    ],
    "semantic": [
      11905,
      [
        "pk1Function"
      ],
      "concealed_gravity_waste_to_D4"
    ],
    "floors": [
      "1F",
      "BOTH"
    ]
  },
  {
    "node": 11909,
    "mesh": 4515,
    "name": "GPT6H_P01_RK13_2_APK_CONCEALED_UNDERFLOOR_SINGLE_ENVELOPE_OPEN_OPEN_WORK_TEST",
    "path": [
      11908,
      11909
    ],
    "semantic": [
      11908,
      [
        "designNoVisibleRoomCable"
      ],
      true
    ],
    "floors": [
      "1F",
      "2F",
      "BOTH"
    ]
  },
  {
    "node": 11911,
    "mesh": 4516,
    "name": "GPT6H_P01_RK13_3_UUNI_SINGLE_HIDDEN_2F_FLOOR_FEED_OPEN_OPEN_NONPHYSICAL_WORK_TEST",
    "path": [
      11912,
      11911
    ],
    "semantic": [
      11911,
      [
        "confidence",
        "concealedRoute"
      ],
      "WORK_ASSUMPTION"
    ],
    "floors": [
      "1F",
      "2F",
      "BOTH"
    ]
  }
];

/** Resolve only the declared concealed route nodes in the active exact source. */
export function resolveConcealedTechnicalObjects(gltf, scene, sceneIndex, loadedSha, expectedSha) {
  const json = gltf?.parser?.json;
  const associations = gltf?.parser?.associations;
  if (loadedSha !== expectedSha || gltf?.scenes?.[sceneIndex] !== scene ||
      typeof scene?.traverse !== 'function' || typeof associations?.get !== 'function' ||
      (!isC80437SourceScene(json,loadedSha,sceneIndex) &&
       !isM6263Mj72Kiv005Pk1SuccessorSourceScene(json, loadedSha, sceneIndex) &&
       !isTate4Mj62Mj63SourceScene(json, loadedSha, sceneIndex))) return null;
  const profile = C80_437_SCENES[sceneIndex] ?? SUCCESSOR_R1_SCENES[sceneIndex] ?? TATE4_MJ6263_SCENES[sceneIndex];
  const objects = [];
  const specs=loadedSha===C80_437_GLB_SHA256 ? CONCEALED.filter(e=>![11829,11909,11911].includes(e.node)) : CONCEALED;
  if(loadedSha===C80_437_GLB_SHA256 && profile.floor!=='2F'){
    const node=profile.floor==='1F'?12138:12139;
    const exact=resolveC80437TechnicalNode(json,loadedSha,sceneIndex,node);
    if(!exact || exact.paths.length!==1)return null;
    specs.push({node,mesh:exact.mesh,name:exact.name,path:exact.paths[0],semantic:[node,['hiddenRoutingVerified'],false],floors:[profile.floor]});
  }
  for (const spec of specs) {
    if (!spec.floors.includes(profile.floor)) continue;
    const definition = json.nodes[spec.node];
    const [semanticNode, keys, expected] = spec.semantic;
    const semantic = keys.reduce((value, key) => value?.[key], json.nodes[semanticNode]?.extras);
    if (definition?.name !== spec.name || definition.mesh !== spec.mesh ||
        (definition.children?.length ?? 0) !== 0 || semantic !== expected) return null;
    const matches = [];
    scene.traverse(object => {
      if (associations.get(object)?.nodes === spec.node &&
          associations.get(object.parent)?.nodes !== spec.node) matches.push(object);
    });
    if (matches.length !== 1) return null;
    const object = matches[0];
    let ancestor = object;
    for (let i = spec.path.length - 1; i >= 0; i--) {
      const id = spec.path[i], source = json.nodes[id];
      const siblings = i === 0 ? json.scenes[sceneIndex].nodes : json.nodes[spec.path[i - 1]]?.children;
      if (!ancestor || associations.get(ancestor)?.nodes !== id ||
          !sameSourceName(ancestor.name, source?.name) ||
          !Array.isArray(siblings) || siblings.filter(value => value === id).length !== 1) return null;
      ancestor = ancestor.parent;
    }
    if (ancestor !== scene) return null;
    objects.push(object);
  }
  return { objects, diagnosticScene: profile.cutaway === true };
}

/**
 * Apply AFTER Layers and dispose BEFORE its baseline is restored. Inspection
 * restores only the saved local visibility: it never unhides a layer, ancestor
 * or an authored-hidden object. Camera, source geometry and materials are untouched.
 */
export function createConcealedTechnicalPresentation({ objects, diagnosticScene = false }) {
  const saved = new Map(objects.map(object => [object, object.visible]));
  let disposed = false;
  const apply = inspectionOn => {
    if (disposed) return;
    for (const [object, visible] of saved) object.visible = (inspectionOn || diagnosticScene) ? visible : false;
  };
  const dispose = () => {
    if (disposed) return;
    for (const [object, visible] of saved) object.visible = visible;
    saved.clear();
    disposed = true;
  };
  return { apply, dispose, get count() { return saved.size; } };
}
