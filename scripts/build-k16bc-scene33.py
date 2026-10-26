#!/usr/bin/env python3
"""Source-locked K16-b/c physical scene33 WORK_TEST COW builder.
Does not edit the input ZIP, old scenes, old nodes/meshes/materials or BIN.
All dimensions are source G1 plan/model refs or explicit WORK_ASSUMPTION.
"""
import argparse, copy, hashlib, io, json, struct, zipfile
from pathlib import Path
from collections import Counter

PARENT_SHA = '2421dcedd1dc9f2c4c4e65c2b3a46ec51c65a059883360f379f3e6a0f1ac458c'
PARENT_GLB_SHA = 'ebff62cbf081473101c5842a55e35707bce07872a36d673ce1a87e3afb63a7d3'
DOC='1etsXWpaOUnY8cI9E6anaiqTifO_IXnY3b12CbjHV0TU'
NAME = 'Ylisrinne_D_K16BC_TUMMAT_YHTENAISET_PARVEKENAUHAT_K3_PAADET_WORK_TEST_STAGING_HOLD_20261026__scene33.zip'


def sha(x): return hashlib.sha256(x).hexdigest()

def unpack_glb(raw):
    assert raw[:4]==b'glTF' and struct.unpack_from('<I',raw,4)[0]==2
    assert struct.unpack_from('<I',raw,8)[0]==len(raw)
    jl,jtyp=struct.unpack_from('<II',raw,12)
    assert jtyp==0x4e4f534a
    j=json.loads(raw[20:20+jl]); i=20+jl
    bl,typ=struct.unpack_from('<II',raw,i)
    assert typ==0x004e4942
    data=raw[i+8:i+8+bl]
    assert i+8+bl==len(raw)
    return j, data

def pack_glb(j, bindata):
    txt=json.dumps(j,ensure_ascii=False,separators=(',',':')).encode('utf8')
    txt+=b' '*((-len(txt))%4)
    data=bindata+b'\0'*((-len(bindata))%4)
    res=b'glTF'+struct.pack('<II',2,12+8+len(txt)+8+len(data))
    res+=struct.pack('<II',len(txt),0x4e4f534a)+txt
    res+=struct.pack('<II',len(data),0x004e4942)+data
    assert len(res)==struct.unpack_from('<I',res,8)[0]
    return res

def scene_active(j,sceneid):
    nodes=j['nodes'];queue=list(j['scenes'][sceneid]['nodes']);seen=set()
    while queue:
        i=queue.pop()
        if i in seen: continue
        seen.add(i);queue+=nodes[i].get('children',[])
    return seen

def main(inp,out):
    raw=Path(inp).read_bytes();assert sha(raw)==PARENT_SHA, 'parent zip SHA mismatch'
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        assert z.testzip() is None
        srcglb=z.read('model.glb')
    assert sha(srcglb)==PARENT_GLB_SHA,'parent GLB sha mismatch'
    src,basebin=unpack_glb(srcglb)
    assert len(src['scenes'])==33 and src['scene']==32
    assert len(src['nodes'])==2930 and len(src['meshes'])==1776
    assert len(src.get('materials',[]))==148
    assert 2832 in src['scenes'][32]['nodes']
    assert 1276 in src['scenes'][32]['nodes'] and 1278 in src['scenes'][32]['nodes']
    oldactive=scene_active(src,32)
    slatidx={i for i in oldactive if src['nodes'][i].get('mesh')==478}
    assert len(slatidx)==160, f'expected exact 160 original light slats, found {len(slatidx)}'
    parents={child:i for i,node in enumerate(src['nodes']) for child in node.get('children',[])}
    assert Counter(parents[i] for i in slatidx)==Counter({2832:40,1634:40,1756:40,1878:40})
    originals=json.dumps({'scenes':src['scenes'],'nodes':src['nodes'],'meshes':src['meshes'],'materials':src['materials'],'accessors':src['accessors'],'bufferViews':src['bufferViews']},sort_keys=True)
    j=copy.deepcopy(src)
    n=j['nodes'];mesh=j['meshes'];materials=j['materials']
    clones={}
    for k in [1634,1756,1878]:
        prior=n[k]
        assert prior.get('children')
        clone=copy.deepcopy(prior)
        clone['name']=prior['name']+'_K16BC_COW_SC33_WITHOUT_LIGHT_SLATS'
        clone['children']=[v for v in prior['children'] if v not in slatidx]
        assert len(prior['children'])-len(clone['children'])==40
        clones[k]=len(n);n.append(clone)
    prior=n[2832]
    mainroot=copy.deepcopy(prior)
    mainroot['name']=prior['name']+'_K16BC_COW_SC33_WITHOUT_LIGHT_SLATS'
    mainroot['children']=[clones.get(v,v) for v in prior['children'] if v not in slatidx]
    assert len(prior['children'])-len(mainroot['children'])==40
    clone_main=len(n);n.append(mainroot)
    # Existing mesh478 local UNIT CUBE POSITION+NORMAL with original BIN; new mesh references
    # the same accessors, but has a distinct dark facade material.
    dark=copy.deepcopy(materials[31]);dark['name']='K16BC_DARK_CONTINUOUS_BALCONY_BOARDS_WORK_ASSUMPTION_SC33'
    dark['pbrMetallicRoughness']['baseColorFactor']=[.18,.19,.205,1]
    dark['extras']={'sourceDocId':DOC,'workAssumption':True,'notAsBuilt':True,
      'reference':'OWNER_D_C_PHOTO_G1', 'continuousPairs':['D_C','B_A']}
    darkid=len(materials);materials.append(dark)
    slatmesh=copy.deepcopy(mesh[478]);slatmesh['name']='K16BC_CONTINUOUS_DARK_FASCIA_COURSE_UNIT_CUBE_SC33'
    slatmesh['primitives'][0]['material']=darkid
    slatmesh['extras']={'semantic':'CONTINUOUS_BALCONY_BOARD','workAssumption':True}
    slatmesh_id=len(mesh);mesh.append(slatmesh)
    wallmesh=copy.deepcopy(mesh[478]);wallmesh['name']='K16BC_K3_SOUTH_WALL_CUT_BOX_UNIT_CUBE_SC33'
    wallmesh['primitives'][0]['material']=99
    wallmesh['extras']={'semantic':'K3_PARTITION_COW_NOTCHED_BOX','workAssumption':True}
    wallmesh_id=len(mesh);mesh.append(wallmesh)
    roots=list(src['scenes'][32]['nodes'])
    assert roots.count(2832)==1 and roots.count(1276)==1 and roots.count(1278)==1
    roots=[clone_main if v==2832 else v for v in roots if v not in (1276,1278)]
    # Scene-only world-Y-up geometric boxes. No new buffer bytes or accessors.
    def boxnode(label,ms,limits,meta):
        a,b=limits
        assert all(b[k]>a[k] for k in range(3))
        node={'name':label,'mesh':ms,
              'translation':[(a[k]+b[k])/2 for k in range(3)],
              'scale':[b[k]-a[k] for k in range(3)],
              'extras':{'workTest':True,'stagingHold':True,'notCurrent':True,'notAsBuilt':True,**meta}}
        idx=len(n);n.append(node);return idx
    lower_pairs={
      'DC':(.22,12.50,2.912,3.554),
      'BA':(12.90,25.18,1.912,2.554),
    }
    upper_pairs={
      'DC':(.22,12.50,5.346,6.150),
      'BA':(12.90,25.18,4.346,5.150),
    }
    fascia_info=[]
    fascia_nodes=[]
    for level,pairs,count in [('LOWER',lower_pairs,8),('UPPER',upper_pairs,10)]:
        for pair,(a,b,y0,y1) in pairs.items():
            height=(y1-y0-0.006*(count-1))/count
            assert abs(height-.075)<1e-5, (level,pair,height)
            children=[]
            for course in range(count):
                lo=y0+course*(height+.006)
                hi=lo+height
                idx=boxnode(f'K16BC_{pair}_{level}_CONTINUOUS_DARK_COURSE_{course+1:02d}_SC33',slatmesh_id,([a,lo,1.582],[b,hi,1.606]),
                    {'group':f'K16BC_{pair}_{level}','course':course+1,
                     'source':'K16_owner_20261026_b_c_and_scene32_R4E',
                     'verifiedGeometry':False,'floorApplicability':'2F',
                     'workAssumptionUpperBandHeight':level=='UPPER'})
                children.append(idx)
            group={'name':f'K16BC_{pair}_{level}_ONE_CONTINUOUS_BAND_SC33','children':children,
                   'extras':{'workAssumption':True,'notAsBuilt':True,'sourceDocId':DOC,
                             'continuityAcrossApartmentBoundary':True,'courses':count}}
            groupid=len(n);n.append(group);roots.append(groupid)
            fascia_nodes+=children
            fascia_info.append({'name':group['name'],'courseCount':count,'x':[a,b],'y':[y0,y1],
                'z':[1.582,1.606],'nodeIds':children})
    assert len(fascia_nodes)==36
    # Work-reference K3 south-face notch: preserve northern host and the lower
    # balcony-unrelated face; shorten only the upper-floor south reach.
    # Source world bboxes from R4E/sc32 node1276/1278, not floor-height guesses.
    wall_info=[];wall_components={
     'DC': {'orig':1276,'x':[6.25,6.5],'y':[-.15,6.15],
            'split':2.76,'northEnd':-10.81,'northBottom':0.0,'southEnd':1.75},
     'BA': {'orig':1278,'x':[18.9,19.15],'y':[-1.,5.15],
            'split':1.76,'northEnd':-10.81,'northBottom':-1.0,'southEnd':1.75},
    }
    for pair,q in wall_components.items():
        components=[]
        xa,xb=q['x'];ylo,yhi=q['y'];split=q['split'];zmax=q['southEnd']
        for part,(bb0,bb1) in {
           'NORTH_HOST':([xa,q['northBottom'],q['northEnd']],[xb,yhi,0]),
           'SOUTH_LOWER_UNCHANGED':([xa,ylo,0],[xb,split,zmax]),
           'SOUTH_UPPER_TRIMMED':([xa,split,0],[xb,yhi,1.582]),
        }.items():
            idx=boxnode(f'K16BC_K3_{pair}_{part}_WORLD_COW_SC33',wallmesh_id,(bb0,bb1),
             {'sourceNodeIndex':q['orig'],'sourceName':src['nodes'][q['orig']]['name'],
              'sourceMaterialIndex':99,'ownerBoundary':pair,'trimmedUpperOnly':part=='SOUTH_UPPER_TRIMMED'})
            components.append(idx)
        group={'name':f'K16BC_K3_{pair}_NOTCHED_OWNER_PARTITION_COW_SC33',
               'children':components,'extras':{'sourceNodeIndex':q['orig'],
               'semanticObjectCount':1,'derivedParts':3,'sourceDocId':DOC,
               'oldSouthEdgeM':1.75,'newUpperSouthEdgeM':1.582,'workAssumption':True}}
        groupidx=len(n);n.append(group);roots.append(groupidx)
        wall_info.append({'pair':pair,'oldNode':q['orig'],'newGroup':groupidx,
                          'componentIds':components,'newUpperSouthEdgeM':1.582})
    new_scene=copy.deepcopy(src['scenes'][32]);new_scene['name']='Ylisrinne_K16BC_DARK_CONTINUOUS_BALCONY_BANDS_K3_NOTCH_WORK_TEST_SC33'
    new_scene['nodes']=roots
    new_scene['extras']={**new_scene.get('extras',{}),'K16bc':'CONTINUOUS_2LOWER_2UPPER_BANDS_AND_K3_DC_BA_COW_WORK_ASSUMPTION',
      'parentScene':32,'parentZipSha256':PARENT_SHA,'parentGlbSha256':PARENT_GLB_SHA,
      'stage':'K16-bc','status':'WORK_TEST','notCurrent':True,'notAsBuilt':True,
      'physicalHostValidation':'STAGING_HOLD','browserQA':'NOT_RUN',
      'HumanReview':'NOT_RUN','publishReady':False,'viewerQueueReady':False,
      'upperBandHeightEvidence':'WORK_ASSUMPTION_K12_TRACK_TO_G1_ROOF_EAVE_REFERENCE',
      'K17_K18_K19':'HOLD_NO_MODIFICATION'}
    assert len(j['scenes'])==33
    j['scenes'].append(new_scene);j['scene']=33
    assert j['scenes'][:33]==src['scenes'] and j['nodes'][:len(src['nodes'])]==src['nodes']
    assert j['meshes'][:len(src['meshes'])]==src['meshes'] and j['materials'][:len(src['materials'])]==src['materials']
    assert j['buffers']==src['buffers'] and j['bufferViews']==src['bufferViews'] and j['accessors']==src['accessors']
    oldlight=sum(j['nodes'][i].get('mesh')==478 for i in scene_active(j,32))
    newact=scene_active(j,33)
    newlight=sum(j['nodes'][i].get('mesh')==478 for i in newact)
    assert oldlight==160 and newlight==0, (oldlight,newlight)
    assert 1276 not in newact and 1278 not in newact
    assert all(v in newact for v in fascia_nodes)
    assert all(v in newact for info in wall_info for v in info['componentIds'])
    assert len([i for i in newact if j['nodes'][i].get('mesh')==slatmesh_id])==36
    assert len([i for i in newact if j['nodes'][i].get('mesh')==wallmesh_id])==6
    newglb=pack_glb(j,basebin)
    newer,bin2=unpack_glb(newglb)
    assert bin2==basebin and newer==j
    assert newer['scenes'][:33]==src['scenes']
    # Verify all old source fields not only old scene tree identity.
    assert json.dumps({'scenes':newer['scenes'][:33],'nodes':newer['nodes'][:2930],'meshes':newer['meshes'][:1776],
      'materials':newer['materials'][:148],'accessors':newer['accessors'],'bufferViews':newer['bufferViews']},sort_keys=True)==originals
    results={
      'task':'K16BC physical scene33 COW source-only', 'classification':'WORK_TEST/STAGING_HOLD/NOT_AS_BUILT',
      'sourceZipSha256':PARENT_SHA,'sourceGlbSha256':PARENT_GLB_SHA,'glbSha256':sha(newglb),
      'sourceScenesPreserved':33,'sceneCount':34,'newDefaultScene':33,
      'sourceActiveLightSlats':oldlight,'newActiveLightSlats':newlight,
      'newDarkCourseInstances':36,'newDarkBandGroups':4,'newWallSegmentMeshes':6,'replacedLegacyPartitionNodes':[1276,1278],
      'oldBinByteIdentical':bin2==basebin,'allSourceNodeObjectsUnchanged':True,'allSourceMeshMaterialsAccessorsUnchanged':True,
      'darkFascia':fascia_info,'partitionReplacement':wall_info,
      'upperBandHeight':'WORK_ASSUMPTION based on K12 upper track model and G1 roof/eave reference',
      'geometryContactNotYetIndependentlyValidated':'HOST_HOLD', 'browserQA':'NOT_RUN','humanReview':'NOT_RUN',
      'publishReady':False,
    }
    # Stable artefact: include original QA metadata provenance and the deterministic builder itself.
    out=Path(out);out.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        z.writestr('model.glb',newglb)
        z.writestr('QA.json',json.dumps(results,ensure_ascii=False,indent=2))
        z.writestr('README.txt',
          'Ylisrinne K16-b/c scene33 WORK_TEST/STAGING_HOLD / EI NYKYTILA / EI JULKAISUJONO\n'
          'Lähde: K16 26.10.2026 omistajan §10: 4 yhtenäistä tummaa parvekenauhaa C+D ja B+A, alempi+ylempi.\n'
          'Lähde R4E ei käytetty: fyysinen K16a scene32 ZIP1M_rCy1...; K17-K19 ennallaan.\n'
          '36 yhtenäistä vaakalautakurssia: 2x8 ala,2x10 ylä; kaikki vanhat 160 vaaleaa saumaslattia pois vain uudesta scenestä.\n'
          'K3 DC/BA päätyjen eteläiset ylimmän kerroksen osuudet lyhennetty Z1.75->Z1.582 ilman lävistystä, vanhat mesh/node/scene-tiedot säilyvät.\n'
          'Ylänauhojen korkeus ja katto-/räystäsliitos ovat WORK_ASSUMPTION/HOLD, ei varmistettu valokuvan mitoitus.\n'
          'Tarkista RAW ZIP/GLB SHA, scene0-32/materiaalien/mesh/BIN-prefix, todellinen selain/host ennen julkaisua.\n')
        z.writestr('build_k16bc.py',Path(__file__).read_bytes())
    reread=out.read_bytes();assert zipfile.ZipFile(io.BytesIO(reread)).testzip() is None
    with zipfile.ZipFile(io.BytesIO(reread)) as z:
        jo,bo=unpack_glb(z.read('model.glb'))
        assert jo['scene']==33 and len(jo['scenes'])==34 and bo==basebin
    results.update(zipSha256=sha(reread),zipSizeBytes=len(reread),glbSizeBytes=len(newglb))
    print(json.dumps({k:v for k,v in results.items() if k not in ['darkFascia','partitionReplacement']},ensure_ascii=False,indent=2))

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('input');ap.add_argument('output');a=ap.parse_args();main(a.input,a.output)
