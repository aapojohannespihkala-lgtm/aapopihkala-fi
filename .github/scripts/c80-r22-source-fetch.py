"""Trusted main-only exact Drive source read. Never logs credentials or bytes."""
import os,json,io,hashlib,zipfile,urllib.request
from pathlib import Path
assert os.environ['GITHUB_REF']=='refs/heads/main'
assert os.environ['GITHUB_REPOSITORY']=='aapojohannespihkala-lgtm/aapopihkala-fi'
assert os.environ['GITHUB_EVENT_NAME']=='workflow_dispatch'
root=Path(os.environ['RUNNER_TEMP'])
locks=json.loads((root/'r22-locks.json').read_text())
assert [x['key']for x in locks]==['r21','r22']
for lock in locks:
    req=urllib.request.Request('https://www.googleapis.com/drive/v3/files/'+lock['driveId']+'?alt=media&supportsAllDrives=true',headers={'Authorization':'Bearer '+os.environ['GDRIVE_ACCESS_TOKEN']})
    with urllib.request.urlopen(req,timeout=90)as response:raw=response.read(30_000_001)
    assert len(raw)<=30_000_000 and hashlib.sha256(raw).hexdigest()==lock['zipSha256'],'ZIP identity'
    with zipfile.ZipFile(io.BytesIO(raw))as archive:
        assert archive.testzip()is None,'ZIP CRC'
        members=[x for x in archive.infolist()if x.filename.lower().endswith('.glb')]
        assert len(members)==1 and members[0].file_size<=100_000_000
        data=archive.read(members[0])
    assert hashlib.sha256(data).hexdigest()==lock['glbSha256'],'GLB identity'
    (root/(lock['key']+'.glb')).write_bytes(data)
    print(lock['key']+': exact original ZIP CRC / SHA and GLB SHA PASS')
