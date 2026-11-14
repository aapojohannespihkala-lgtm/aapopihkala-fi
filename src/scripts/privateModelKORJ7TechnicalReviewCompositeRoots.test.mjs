import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterCompositePresentationRoots,
  createTechnicalReviewPresentation,
} from './privateModelTechnicalReviewPresentation.mjs';
import { TATE4_MJ6263_SOURCE_SHA256 } from './privateModelTate4Mj62Mj63SourceProfile.mjs';
import { SUCCESSOR_R1_SHA256 } from './privateModelM6263Mj72Kiv005Pk1SuccessorSourceProfile.mjs';

test('KORJ7-07: only exact M6263 and successor SHAs demote composite visual roots', () => {
  const roots=[
    {node:2220,name:'C77 shower visual wrapper'},
    {node:11613,name:'H24 opened WC visual wrapper'},
    {node:11945,name:'MJ56 reference clearance'},
    {node:12086,name:'physical ventilation element'},
  ];
  for (const sha of [TATE4_MJ6263_SOURCE_SHA256,SUCCESSOR_R1_SHA256]) {
    const filtered=filterCompositePresentationRoots(roots,sha);
    assert.deepEqual(filtered,[roots[3]]);
    assert.equal(roots.length,4,'do not mutate immutable source profile');
  }
  assert.equal(filterCompositePresentationRoots(roots,'0'.repeat(64)),roots,
    'unapproved SHA keeps its own untouched profile');
  assert.equal(filterCompositePresentationRoots(null,TATE4_MJ6263_SOURCE_SHA256),null);
});

test('KORJ7-07: grey composite surroundings, keep actual tech, restore originals', () => {
  const wrapper={name:'H24 opened WC', parent:null};
  const tech={isMesh:true,material:{id:'technical-source'},parent:null};
  const basin={isMesh:true,material:[{id:'basin-source'},{id:'basin-metal'}],parent:wrapper};
  const wall={isMesh:true,material:{id:'wall-source'},parent:null};
  const root={parent:null,traverse(fn){[root,wrapper,tech,basin,wall].forEach(fn);}};
  wrapper.parent=root;tech.parent=root;wall.parent=root;
  const savedTech=tech.material,savedBasin=basin.material,savedWall=wall.material;
  const entries=[{node:11613,object:wrapper},{node:12086,object:tech}];
  const kept=filterCompositePresentationRoots(entries,TATE4_MJ6263_SOURCE_SHA256)
    .map(entry=>entry.object);
  const grey={id:'grey'},line={id:'line'},systems={VESI:{id:'water'}};
  const view=createTechnicalReviewPresentation(root,kept,()=>({surface:grey,line,systems}),()=> 'VESI');
  assert.equal(view.apply(true),true);
  assert.equal(tech.material,systems.VESI);
  assert.deepEqual(basin.material,[grey,grey]);
  assert.equal(wall.material,grey);
  assert.equal(view.changedCount,3);
  assert.equal(view.apply(false),false);
  assert.equal(tech.material,savedTech);
  assert.equal(basin.material,savedBasin);
  assert.equal(wall.material,savedWall);
  view.dispose();
});
