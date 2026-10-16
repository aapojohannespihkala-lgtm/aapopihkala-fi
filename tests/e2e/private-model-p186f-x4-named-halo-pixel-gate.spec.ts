import { test, expect } from '@playwright/test';
import { Group, Mesh, SphereGeometry, MeshBasicMaterial, OrthographicCamera, LineSegments, BufferGeometry, Vector3, LineBasicMaterial } from 'three';
// @ts-ignore - source-bound .mjs implementation
import { evaluateP186FX4NamedHaloPixels as evaluate } from '../../src/scripts/privateModelP186FX4NamedHaloPixelGate.mjs';

const width=240,height=160;
const rooms=[
  {room:'Bedroom',id:'D_THEMO_BEDROOM_CURRENT_01',pass:'P186F-X3-R1114',x:-3},
  {room:'Bathroom',id:'D_THEMO_BATHROOM_CURRENT_01',pass:'P186F-X3-R1114',x:0},
  {room:'Lobby',id:'D_THEMO_LOBBY_CURRENT_01',pass:'P186F-X4-R1117',x:3},
];
const frame=()=>new Uint8Array(width*height*4).fill(255);
const draw=(rgba:Uint8Array,x:number,y:number,color=[34,211,238,255])=>{
  for(let dy=-3;dy<3;dy++)for(let dx=-3;dx<3;dx++){
    const p=((y+dy)*width+x+dx)*4;
    rgba.set(color,p);
  }
};
function fixture() {
  const gltfScene=new Group();
  gltfScene.name='P186F-X4 R1117 D THEMO DOOR-PLAN-CLEAR WORK_TEST BABYLON Y-UP';
  const camera=new OrthographicCamera(-5,5,5,-5,0.1,100);
  camera.position.set(0,0,15);
  camera.lookAt(0,0,0);
  camera.updateMatrixWorld(true);
  for(const c of rooms){
    const target=new LineSegments(
      new BufferGeometry().setFromPoints([
        new Vector3(-.09,0,0),new Vector3(.09,0,0),
        new Vector3(0,-.09,0),new Vector3(0,.09,0),
      ]),
      new LineBasicMaterial({color:0xffffff}),
    );
    target.name='SOURCE_'+c.room;
    target.position.set(c.x,0,0);
    target.userData={
      representationKind:'thermostatRoomPresentationAnchor',
      roomAssignment:c.room,logicalDeviceId:c.id,Pass:c.pass,
      presentationOnly:true,workAssumption:true,current:false,Canonical:false,
      asBuilt:false,exactXYClaim:false,physicalThermostatXYClaim:false,
      HUMAN_REVIEW:'NOT_RUN',
    };
    const halo=new Mesh(new SphereGeometry(0.075),new MeshBasicMaterial({
      color:0x22d3ee,transparent:true,opacity:0.8,depthTest:false,depthWrite:false,
    }));
    halo.name='P186F_X4_'+c.room.toUpperCase()+'_VIEWER_ONLY_HALO';
    halo.userData={
      p186fX4VisibilityProxy:true,presentationOnly:true,current:false,
      Canonical:false,asBuilt:false,HUMAN_REVIEW:'NOT_RUN',
    };
    target.add(halo);
    gltfScene.add(target);
  }
  const rgba=frame();
  for(const c of rooms)draw(rgba,Math.round((c.x+5)*width/10),height/2);
  return {gltfScene,camera,rgba,width,height,sceneIndex:66};
}
test('binds the three real Three.js projected cyan proxies to Bedroom, Bathroom and Lobby',()=>{
  const f=fixture();
  const before=f.gltfScene.children.map(t=>({name:t.name,visible:t.visible,children:t.children.slice()}));
  const result=evaluate(f);
  expect(result.result).toBe('THREE_NAMED_SOURCE_HALO_PIXELS_IN_SUPPLIED_FRAME_ONLY');
  expect(result.matches.map((c:any)=>c.room)).toEqual(['Bedroom','Bathroom','Lobby']);
  expect(result.matches.map((c:any)=>c.componentIndex)).toEqual([0,1,2]);
  expect(result.matches.map((c:any)=>c.originalSourcePass)).toEqual([
    'P186F-X3-R1114','P186F-X3-R1114','P186F-X4-R1117',
  ]);
  expect(result).toMatchObject({
    checkedRooms:3,pixelColorGatePassed:true,individualRoomPixelAssociationVerified:true,
    originalGlbBytesVerifiedByThisFunction:false,
    authenticatedProductionBrowserVerifiedByThisFunction:false,
    placementVerified:false,current:false,canonical:false,asBuilt:false,humanReview:'NOT_RUN',
  });
  expect(f.gltfScene.children.map(t=>({name:t.name,visible:t.visible,children:t.children.slice()}))).toEqual(before);
});
test('source identity, placement uncertainty and original pass associations fail closed',()=>{
  const changes=[
    (f:any)=>f.gltfScene.children[0].userData.logicalDeviceId='D_THEMO_CURRENT_BEDROOM_01',
    (f:any)=>f.gltfScene.children[0].userData.Pass='P186F-X1',
    (f:any)=>f.gltfScene.children[2].userData.Pass='P186F-X3-R1114',
    (f:any)=>f.gltfScene.children[0].userData.roomAssignment='Bathroom',
    (f:any)=>f.gltfScene.children[1].userData.Canonical=true,
    (f:any)=>f.gltfScene.children[2].userData.physicalThermostatXYClaim=true,
    (f:any)=>f.gltfScene.children[0].geometry.setFromPoints([new Vector3(0,0,0),new Vector3(1,0,0)]),
    (f:any)=>f.gltfScene.children[2].children[0].userData.HUMAN_REVIEW='PASS',
    (f:any)=>f.gltfScene.children[0].children[0].name='FAKE_HALO',
    (f:any)=>f.gltfScene.children[1].children[0].material.opacity=1,
    (f:any)=>f.sceneIndex=65,
    (f:any)=>f.gltfScene.name='SCENE_66_UNVERIFIED',
  ];
  for(const change of changes){
    const f=fixture();change(f);
    expect(()=>evaluate(f)).toThrow('P186F_X4_NAMED_HALO_PIXEL_REJECTED');
  }
});
test('missing, extra, falsely positioned and merged screen pixels never impersonate 3 named targets',()=>{
  const changes=[
    (f:any)=>f.rgba=frame(),
    (f:any)=>draw(f.rgba,25,18),
    (f:any)=>f.gltfScene.children[0].position.x=-15,
    (f:any)=>f.gltfScene.children[1].position.x=3,
    (f:any)=>f.gltfScene.children[2].children[0].visible=false,
    (f:any)=>{ for(let y=76;y<84;y++)for(let x=50;x<185;x++){
      const at=(y*width+x)*4;f.rgba.set([34,211,238,255],at);
    }},
    (f:any)=>f.rgba=f.rgba.slice(0,-4),
  ];
  for(const change of changes){
    const f=fixture();change(f);
    expect(()=>evaluate(f)).toThrow('P186F_X4_NAMED_HALO_PIXEL_REJECTED');
  }
});
