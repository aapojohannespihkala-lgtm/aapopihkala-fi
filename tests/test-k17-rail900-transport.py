"""Exercise the existing publisher resolver against the full K17 GLB allowlist."""
import json,re,subprocess,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CID='ylisrinne-k17-rail900-20261104'
class K17Transport(unittest.TestCase):
    def test_existing_publisher_keeps_full_model_and_all_floor_scenes(self):
        workflow=(ROOT/'.github/workflows/publish-work-test.yml').read_text()
        prefix='python3 - ".github/work-test-candidates.json" "$REQUESTED_CANDIDATE" "$GITHUB_ENV" <<\'PY\'\n'
        code=workflow.split(prefix,1)[1].split('\n          PY',1)[0]
        code='\n'.join(line.removeprefix('          ') for line in code.splitlines())
        with tempfile.TemporaryDirectory() as tmp:
            out=Path(tmp)/'publisher.env'
            r=subprocess.run(['python3','-c',code,str(ROOT/'.github/work-test-candidates.json'),CID,str(out)],cwd=ROOT,capture_output=True,text=True)
            self.assertEqual(r.returncode,0,r.stderr)
            values=dict(line.split('=',1) for line in out.read_text().splitlines())
        self.assertEqual(values['DRIVE_FILE_ID'],'1J53QV9-XcOJr6JloXwJDOLJ4ej5t97P7')
        self.assertEqual(values['EXTRACT_SCENE'],'')
        self.assertEqual(values['EXPECTED_PATH'],f'/private-model/work-test/{CID}.glb')
        worker=(ROOT/'worker/privateWorkTest.ts').read_text()
        block=re.search(r'const K17_RAIL900_WORK_TEST_CANDIDATE = \{(.*?)\} as const satisfies PrivateWorkTestCandidate;',worker,re.S).group(1)
        self.assertIn('expectedSize: 31760668',block)
        self.assertIn('expectedSha256: \'4b8deb415c75de9eee623d8ad84a8cfa24fa8baf2540c19b59c4ec9423c58d99\'',block)
        registry=json.loads((ROOT/'.github/work-test-candidates.json').read_text())
        self.assertEqual(registry['candidates'][CID],{'driveFileId':'1J53QV9-XcOJr6JloXwJDOLJ4ej5t97P7'})
if __name__=='__main__':unittest.main()
