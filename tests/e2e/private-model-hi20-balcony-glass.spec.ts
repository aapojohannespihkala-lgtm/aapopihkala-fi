import { test, expect } from '@playwright/test';
import { applyHi20BalconyGlassVisibility, HI20_UNIFIED52_SHA } from '../../src/scripts/privateModelUnified52Floor';

const upper2F = Array.from({length:8}, (_,i)=>2221+i);
const upperBOTH = Array.from({length:8}, (_,i)=>i);
const lower = Array.from({length:5}, (_,i)=>5943+i);
function fixture({missingOne = false} = {}) {
  const nodes: any[] = Array.from({length:5948}, () => ({}));
  const allIds = new Set([...upper2F,...upperBOTH,...lower]);
  for (const i of allIds) nodes[i] = {
    name: i >= 5943
      ? 'C80_020_D2F_WP3_LOWER_INNER_GLAZING_PANEL_' + String(i-5942).padStart(2,'0')
      : 'G2_D_2F_BALCONY_GLASS_FIELD_20261024_PANEL_' +
          String(i>=2221?i-2220:i+1).padStart(2,'0'),
    mesh: 205,
  };
  const materials = Array.from({length:19}, () => ({}));
  materials[18] = {alphaMode:'BLEND', doubleSided:true, pbrMetallicRoughness:{baseColorFactor:[.65,.82,.9,.24]}};
  const meshes = Array.from({length:206}, () => ({}));
  meshes[205] = {primitives:[{material:18}]};
  const associations = new Map<any, any>();
  const makeFloor = (ids: number[]) => {
    const objects = ids.map((id) => {
      const material = {
        opacity: .24, transparent: true, depthWrite:false,
        clone() { return {...this}; },
      };
      const obj = {isMesh:true, name:nodes[id].name, material, parent:null};
      associations.set(obj, {nodes:id});
      return obj;
    });
    return {objects, traverse(fn: (object:any)=>void) {for(const o of objects)fn(o);}};
  };
  const twoF = makeFloor(missingOne ? [...upper2F,...lower].slice(1) : [...upper2F,...lower]);
  const both = makeFloor([...upperBOTH,...lower]);
  const gltf = {parser:{json:{nodes,materials,meshes},associations}};
  const scenes = {'1F':makeFloor([]),'2F':twoF,BOTH:both};
  return {gltf,scenes};
}

test('exact HI20 52-scene balcony 8+5 panes are strengthened without changing geometry or 1F', () => {
  const {gltf,scenes} = fixture();
  const before2F = scenes['2F'].objects.map((x:any)=>x.material);
  const result = applyHi20BalconyGlassVisibility(gltf as any, scenes as any, HI20_UNIFIED52_SHA);
  expect(result).toEqual({applied:true,counts:{'2F':13,BOTH:13},opacity:.58});
  expect(scenes['1F'].objects).toHaveLength(0);
  expect(scenes['2F'].objects).toHaveLength(13);
  expect(scenes.BOTH.objects).toHaveLength(13);
  for (const [i,mesh] of scenes['2F'].objects.entries()) {
    expect(mesh.material).not.toBe(before2F[i]);
    expect(mesh.material.opacity).toBe(.58);
    expect(before2F[i].opacity).toBe(.24);
  }
  expect(gltf.parser.json.materials[18].pbrMetallicRoughness.baseColorFactor[3]).toBe(.24);
});

test('missing pane preserves all source materials with no partial styling', () => {
  const {gltf,scenes} = fixture({missingOne:true});
  const result = applyHi20BalconyGlassVisibility(gltf as any, scenes as any, HI20_UNIFIED52_SHA);
  expect(result).toEqual({applied:false,counts:{'2F':12,BOTH:13},opacity:null});
  expect(scenes.BOTH.objects.every((o:any)=>o.material.opacity===.24)).toBe(true);
});

test('wrong source SHA fails closed', () => {
  const {gltf,scenes} = fixture();
  expect(() => applyHi20BalconyGlassVisibility(gltf as any, scenes as any, 'not-the-source-sha'))
    .toThrow('HI20_UNIFIED52_FAIL_CLOSED');
  expect(scenes['2F'].objects.every((o:any)=>o.material.opacity===.24)).toBe(true);
});
