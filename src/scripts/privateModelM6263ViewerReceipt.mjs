import {
  TATE4_MJ6263_SOURCE_SHA256, TATE4_MJ6263_SCENES,
  isTate4Mj62Mj63SourceScene,
} from './privateModelTate4Mj62Mj63SourceProfile.mjs';
import {
  TATE4_BUILDING_PARTS, TATE4_BUILDING_SCENES, TATE4_TECHNICAL_NODES,
  TATE4_CARD_NODES, TATE4_CARD_LINKS, TATE4_TECHNICAL_REVIEW_ROOTS,
} from './privateModelC80TateInteriorLayerSourceProfile.mjs';
import newNodes from './privateModelM6263NodeReceipt.json' with { type: 'json' };

export { TATE4_MJ6263_SOURCE_SHA256 };
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const fingerprint = value => [...JSON.stringify(value ?? null)].reduce((h,c) =>
  Math.imul(h ^ c.codePointAt(0),16777619) >>> 0,2166136261).toString(16).padStart(8,'0');

function activeReceipt(json, sha, sceneIndex, nodeIndex, expected) {
  if (!Number.isInteger(nodeIndex) || !Array.isArray(expected?.path) ||
      !isTate4Mj62Mj63SourceScene(json,sha,sceneIndex) ||
      !json.scenes[sceneIndex].nodes.includes(expected.path[0])) return null;
  const node = json.nodes[nodeIndex];
  if (node?.name !== expected.name || (node?.mesh ?? null) !== (expected.mesh ?? null) ||
      (expected.sourceLinksFNV !== undefined && fingerprint(node.extras?.sourceLinks) !== expected.sourceLinksFNV) ||
      (expected.sourceLinks !== undefined && !same(node.extras?.sourceLinks, expected.sourceLinks))) return null;
  for (let i=0;i<expected.path.length;i++) {
    if (json.nodes[expected.path[i]]?.name !== expected.pathNames[i] ||
        (i>0 && !json.nodes[expected.path[i-1]]?.children?.includes(expected.path[i]))) return null;
  }
  if (expected.linkNode !== undefined && expected.linkFNV !== undefined &&
      fingerprint(json.nodes[expected.linkNode]?.extras?.sourceLinks) !== expected.linkFNV) return null;
  return expected;
}

// Parent labels are reused only after the NEW raw SHA and selected scene are
// verified. The parent node/mesh/path/link receipts describe unchanged nodes,
// not an inherited approval for another SHA or an inferred physical connection.
export function resolveM6263TechnicalNode(json,sha,sceneIndex,nodeIndex) {
  const spec=TATE4_MJ6263_SCENES[sceneIndex];
  if (!spec) return null;
  const expected=nodeIndex>=12086 && nodeIndex<=12096
    ? {...newNodes[nodeIndex],id:'technical-ventilation',storey:'1F'}
    : TATE4_TECHNICAL_NODES[spec.parent]?.[nodeIndex];
  return activeReceipt(json,sha,sceneIndex,nodeIndex,expected);
}

export function resolveM6263BuildingNode(json,sha,sceneIndex,nodeIndex,path) {
  const spec=TATE4_MJ6263_SCENES[sceneIndex];
  if (!Number.isInteger(nodeIndex) || !Array.isArray(path) || !spec || !isTate4Mj62Mj63SourceScene(json,sha,sceneIndex)) return null;
  if (Object.hasOwn(newNodes,nodeIndex) && nodeIndex<=12085) {
    const exact=activeReceipt(json,sha,sceneIndex,nodeIndex,newNodes[nodeIndex]);
    return exact && same(path,exact.path) ? {...exact,id:'architecture-windows'} : null;
  }
  const parent=TATE4_BUILDING_SCENES[spec.parent],part=TATE4_BUILDING_PARTS[nodeIndex];
  const node=json.nodes[nodeIndex];
  if (!part || !json.scenes[sceneIndex].nodes.includes(path?.[0]) ||
      node?.name!==part.name || node?.mesh!==part.mesh ||
      !parent.paths[nodeIndex]?.some(allowed=>same(allowed,path))) return null;
  return part;
}

export function resolveM6263CardNode(json,sha,sceneIndex,nodeIndex) {
  const spec=TATE4_MJ6263_SCENES[sceneIndex];
  if (!spec) return null;
  const fresh=newNodes[nodeIndex];
  const expected=fresh ?? TATE4_CARD_NODES[spec.parent]?.[nodeIndex];
  const exact=activeReceipt(json,sha,sceneIndex,nodeIndex,expected);
  if (!exact) return null;
  const links=fresh ? json.nodes[nodeIndex].extras?.sourceLinks ?? [] : TATE4_CARD_LINKS[String(exact.linkNode)] ?? [];
  return {...exact,links};
}

export function m6263ReviewProfile(json,sha,sceneIndex) {
  const spec=TATE4_MJ6263_SCENES[sceneIndex];
  if (!spec || !isTate4Mj62Mj63SourceScene(json,sha,sceneIndex)) return null;
  const roots=json.scenes[sceneIndex].nodes;
  const old=TATE4_TECHNICAL_REVIEW_ROOTS[spec.parent].filter(item=>roots.includes(item.node));
  const added=roots.filter(i=>i>=12086&&i<=12096).map(i=>({node:i,name:newNodes[i].name}));
  if (old.some(item=>json.nodes[item.node]?.name!==item.name)) return null;
  return { count:360,floors:{'1F':350,'2F':351,BOTH:352},
    scenes:{[sceneIndex]:{name:json.scenes[sceneIndex].name}},
    roots:{[sceneIndex]:[...old,...added]} };
}
