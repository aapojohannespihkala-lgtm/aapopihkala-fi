"""Tests for the Drive queue -> WORK_TEST auto candidate helper."""
import importlib.util
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "auto_queue", ROOT / ".github/scripts/work-test-auto-queue.py"
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

FILE_ID = "1AbCdEfGhIjKlMnOp"
SHA = "a" * 64


def registry(*auto_ids):
    candidates = {"manual-one": {"driveFileId": "1ManualFileId000"}}
    for cid in auto_ids:
        candidates[cid] = {"driveFileId": f"1Drive{cid[-6:]}xxxx"}
    return {"version": 1, "candidates": candidates}


class NameTests(unittest.TestCase):
    def test_scene_token_parsed_and_removed(self):
        stem, scene = module.split_name("Ylisrinne_SHARED301_SAUNA__scene299.zip")
        self.assertEqual(scene, 299)
        self.assertEqual(stem, "Ylisrinne_SHARED301_SAUNA")

    def test_no_scene_token(self):
        self.assertEqual(module.split_name("malli.glb"), ("malli", None))

    def test_candidate_id_is_valid_and_unique(self):
        first = module.candidate_id("Ylisrinne_SAUNA__scene3.glb", FILE_ID, set())
        self.assertTrue(first.startswith("auto-ylisrinne-sauna-"))
        self.assertTrue(re.fullmatch(r"[a-z0-9][a-z0-9-]{0,127}", first))
        second = module.candidate_id("Ylisrinne_SAUNA__scene3.glb", FILE_ID, {first})
        self.assertNotEqual(first, second)

    def test_label_strips_quotes(self):
        label = module.candidate_label("O'Reilly `x` \\ sauna.glb")
        self.assertNotIn("'", label)
        self.assertNotIn("`", label)
        self.assertNotIn("\\", label)


class PlanTests(unittest.TestCase):
    queue = [{"id": "1QueueFileId0001", "name": "a.glb", "createdTime": "2026-10-19T10:00:00Z"}]

    def test_register_new_file(self):
        result = module.plan(registry(), set(), self.queue, 99999, False)
        self.assertEqual(result["action"], "register")
        self.assertEqual(result["file_id"], "1QueueFileId0001")

    def test_known_file_not_registered_again(self):
        reg = registry()
        reg["candidates"]["auto-a-x"] = {"driveFileId": "1QueueFileId0001"}
        result = module.plan(reg, {"auto-a-x"}, self.queue, 99999, False)
        self.assertEqual(result["action"], "none")

    def test_unpublished_auto_waits_then_publishes(self):
        reg = registry("auto-a-111111")
        self.assertEqual(module.plan(reg, set(), [], 60, False)["action"], "wait")
        result = module.plan(reg, set(), [], 20 * 60, False)
        self.assertEqual(result, {"action": "publish", "candidate": "auto-a-111111"})

    def test_failed_publish_does_not_block_forever(self):
        reg = registry("auto-a-111111")
        result = module.plan(reg, set(), self.queue, 7 * 3600, False)
        self.assertEqual(result["action"], "register")

    def test_open_pr_blocks_registration(self):
        self.assertEqual(module.plan(registry(), set(), self.queue, 99999, True)["action"], "none")


class ApplyTests(unittest.TestCase):
    def test_apply_against_real_worker_source(self):
        worker = (ROOT / "worker/privateWorkTest.ts").read_text(encoding="utf-8")
        reg = registry()
        cid, reg, new_worker = module.apply(
            reg, worker, FILE_ID, "Ylisrinne_SAUNA__scene7.zip", 1234, SHA, "2026-10-19"
        )
        self.assertEqual(reg["candidates"][cid], {"driveFileId": FILE_ID, "extractScene": 7})
        self.assertIn(f"id: '{cid}'", new_worker)
        self.assertIn(f"expectedSha256: '{SHA}'", new_worker)
        # The publisher's own allowlist check must accept the new symbol.
        symbol = re.search(r"const ([A-Z][A-Z0-9_]*) = \{\s*id: '" + re.escape(cid) + "'", new_worker)
        self.assertIsNotNone(symbol)
        runtime = new_worker.split(module.RUNTIME_MARKER, 1)[1].split(module.END_MARKER, 1)[0]
        self.assertRegex(runtime, r"\b" + symbol.group(1) + r"\b")
        self.assertEqual(new_worker.count(module.RUNTIME_MARKER), 1)

    def test_apply_rejects_duplicate_file(self):
        reg = registry()
        reg["candidates"]["x"] = {"driveFileId": FILE_ID}
        with self.assertRaises(SystemExit):
            module.apply(reg, "", FILE_ID, "a.glb", 1, SHA, "2026-10-19")


if __name__ == "__main__":
    unittest.main()
