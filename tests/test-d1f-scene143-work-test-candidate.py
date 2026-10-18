"""Fail-closed static source binding for D1F scene143 WORK_TEST staging.

This is a staging-contract test, NOT CI/publish, browser-pixel or HUMAN_REVIEW proof.
"""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ID = "d1f-source-room-bosch-mirror-sauna-benches-scene143-20261018"
DRIVE = "1q7aZCyeCg4ZeHRZtD2P5kNUXU83P2X0i"
SOURCE_SIZE = 9384880
SOURCE_SHA = "3e8547a3833c0d12a8698e1ea67ae5a7be5f925e563e10e518aaff9bf9b13dfa"
SYMBOL = "D1F_SCENE143_SOURCE_ROOM_WORK_TEST_CANDIDATE"


class Source143CandidateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.registry = json.loads(
            (ROOT / ".github/work-test-candidates.json").read_text(encoding="utf-8")
        )
        cls.worker = (ROOT / "worker/privateWorkTest.ts").read_text(encoding="utf-8")

    def test_only_one_exact_source_record(self):
        self.assertEqual(self.registry["version"], 1)
        self.assertEqual(self.registry["candidates"][ID], {"driveFileId": DRIVE})
        self.assertEqual(
            sum(candidate == ID for candidate in self.registry["candidates"]), 1
        )

    def test_exact_worker_glb_binding(self):
        matches = re.findall(
            r"const " + SYMBOL + r" = \{(.*?)\} as const satisfies PrivateWorkTestCandidate;",
            self.worker,
            flags=re.S,
        )
        self.assertEqual(len(matches), 1)
        definition = matches[0]
        self.assertIn("id: '" + ID + "'", definition)
        self.assertIn("objectKey: 'work-test/" + ID + ".glb'", definition)
        self.assertIn("expectedSize: " + str(SOURCE_SIZE), definition)
        self.assertIn("expectedSha256: '" + SOURCE_SHA + "'", definition)
        self.assertRegex(SOURCE_SHA, r"^[0-9a-f]{64}$")

    def test_worker_runtime_registry_wires_symbol_once(self):
        runtime = self.worker.split(
            "const PRIVATE_WORK_TEST_RUNTIME_CANDIDATES = [", 1
        )[1].split("] as const satisfies readonly PrivateWorkTestCandidate[]", 1)[0]
        self.assertEqual(runtime.count(SYMBOL), 1)

    def test_no_other_worker_candidate_uses_same_id(self):
        self.assertEqual(self.worker.count("id: '" + ID + "'"), 1)


if __name__ == "__main__":
    unittest.main()
