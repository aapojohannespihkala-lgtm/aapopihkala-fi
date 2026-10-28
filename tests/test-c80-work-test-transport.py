"""Original C80 protected transport binding, never a production render proof.

Run YLIS_C80_GLB=/absolute/original/model.glb python tests/test-c80-work-test-transport.py
to include the private original-byte binding test. CI without that source skips it.
"""
import hashlib
import json
import os
import re
import struct
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
C80 = "ylisrinne-d-c80-source-only-20261028"
C70 = "ylisrinne-d-c70-source-only-20261027"


class C80ProtectedTransportTests(unittest.TestCase):
    def test_existing_publisher_resolves_c80_and_retains_c70(self):
        workflow = (ROOT / ".github/workflows/publish-work-test.yml").read_text()
        prefix = 'python3 - ".github/work-test-candidates.json" "$REQUESTED_CANDIDATE" "$GITHUB_ENV" <<\'PY\'\n'
        code = workflow.split(prefix, 1)[1].split("\n          PY", 1)[0]
        code = "\n".join(line.removeprefix("          ") for line in code.splitlines())
        for candidate, drive in [
            (C80, "1x5Ahnl16RVa1OSqzlgLkHYbOD5CMm4m7"),
            (C70, "1hHD39DHJCE8mR-R-RW16Za00dAfEvYI9"),
        ]:
            with self.subTest(candidate=candidate), tempfile.TemporaryDirectory() as tmp:
                output = Path(tmp) / "publisher.env"
                run = subprocess.run(
                    ["python3", "-c", code, str(ROOT / ".github/work-test-candidates.json"),
                     candidate, str(output)], cwd=ROOT, capture_output=True, text=True)
                self.assertEqual(run.returncode, 0, run.stderr)
                values = dict(line.split("=", 1) for line in output.read_text().splitlines())
                self.assertEqual(values["DRIVE_FILE_ID"], drive)
                self.assertEqual(values["CANDIDATE_ID"], candidate)
                self.assertEqual(values["EXTRACT_SCENE"], "")
                self.assertEqual(values["EXPECTED_PATH"], "/private-model/work-test/" + candidate + ".glb")

    @unittest.skipUnless(os.environ.get("YLIS_C80_GLB"), "Original C80 absent: actual byte binding NOT_RUN")
    def test_original_bytes_match_worker_and_keep_all_four_scenes(self):
        data = Path(os.environ["YLIS_C80_GLB"]).read_bytes()
        worker = (ROOT / "worker/privateWorkTest.ts").read_text()
        block = re.search(
            r"const D_C80_SOURCE_ONLY_PREVIEW_CANDIDATE = \{(.*?)\} as const satisfies PrivateWorkTestCandidate;",
            worker, re.S).group(1)
        expected_size = int(re.search(r"expectedSize: (\d+)", block).group(1))
        expected_sha = re.search(r"expectedSha256: '([0-9a-f]{64})'", block).group(1)
        self.assertEqual(len(data), expected_size)
        self.assertEqual(hashlib.sha256(data).hexdigest(), expected_sha)
        magic, version, length, json_length, chunk_type = struct.unpack_from("<5I", data)
        self.assertEqual((magic, version, length, chunk_type), (0x46546C67, 2, len(data), 0x4E4F534A))
        model = json.loads(data[20:20 + json_length])
        self.assertEqual(model["scene"], 0)
        self.assertEqual(len(model["scenes"]), 4)
        self.assertEqual(model["extras"]["C80Delivery"]["sceneMap"],
                         {"BOTH": 0, "1F": 1, "2F": 2, "FULL_CONTEXT": 3})
        registry = json.loads((ROOT / ".github/work-test-candidates.json").read_text())
        self.assertEqual(registry["candidates"][C80],
                         {"driveFileId": "1x5Ahnl16RVa1OSqzlgLkHYbOD5CMm4m7"})


if __name__ == "__main__":
    unittest.main()
