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

    def plan(self, reg, catalog=(), queue=(), recent=None, failures=None, open_pr=False, **kw):
        return module.plan(reg, set(catalog), list(queue), recent or {}, failures or {}, open_pr, **kw)

    def test_register_new_file(self):
        result = self.plan(registry(), queue=self.queue)
        self.assertEqual(result["register"], [{"file_id": "1QueueFileId0001", "name": "a.glb"}])
        self.assertEqual(result["publish"], [])

    def test_known_file_not_registered_again(self):
        reg = registry()
        reg["candidates"]["auto-a-x"] = {"driveFileId": "1QueueFileId0001"}
        self.assertEqual(self.plan(reg, catalog={"auto-a-x"}, queue=self.queue)["register"], [])

    def test_whole_queue_registered_as_one_ordered_batch(self):
        queue = [
            {"id": f"1QueueFileId{n:04d}", "name": f"m{n}.glb", "createdTime": f"2026-10-19T10:{59 - n:02d}:00Z"}
            for n in range(20)
        ]
        result = self.plan(registry(), queue=queue)
        self.assertEqual(len(result["register"]), module.MAX_BATCH)
        self.assertEqual(result["register"][0]["file_id"], "1QueueFileId0019")  # oldest first

    def test_duplicate_queue_entries_registered_once(self):
        result = self.plan(registry(), queue=self.queue + self.queue)
        self.assertEqual(len(result["register"]), 1)

    def test_recent_batch_waits_for_deploy_then_publishes_all(self):
        reg = registry("auto-a-111111", "auto-b-222222")
        recent = {"auto-a-111111": 60, "auto-b-222222": 60}
        result = self.plan(reg, recent=recent)
        self.assertEqual(result["publish"], [])
        self.assertEqual(sorted(result["waiting"]), ["auto-a-111111", "auto-b-222222"])
        recent = {"auto-a-111111": 20 * 60, "auto-b-222222": 20 * 60}
        self.assertEqual(sorted(self.plan(reg, recent=recent)["publish"]), ["auto-a-111111", "auto-b-222222"])

    def test_published_and_old_candidates_are_not_published(self):
        reg = registry("auto-a-111111", "auto-b-222222")
        recent = {"auto-a-111111": 20 * 60, "auto-b-222222": 7 * 3600}
        self.assertEqual(self.plan(reg, catalog={"auto-a-111111"}, recent=recent)["publish"], [])

    def test_repeatedly_failed_publish_is_skipped(self):
        reg = registry("auto-a-111111", "auto-b-222222")
        recent = {"auto-a-111111": 3600, "auto-b-222222": 3600}
        failures = {"auto-a-111111": module.MAX_PUBLISH_FAILURES}
        result = self.plan(reg, recent=recent, failures=failures)
        self.assertEqual(result["publish"], ["auto-b-222222"])
        self.assertEqual(result["skipped"], ["auto-a-111111"])

    def test_failed_publish_does_not_block_registration(self):
        reg = registry("auto-a-111111")
        result = self.plan(reg, queue=self.queue, recent={"auto-a-111111": 3600}, failures={"auto-a-111111": 2})
        self.assertEqual(result["publish"], ["auto-a-111111"])
        self.assertEqual(len(result["register"]), 1)

    def test_open_pr_blocks_registration_only(self):
        reg = registry("auto-a-111111")
        result = self.plan(reg, queue=self.queue, recent={"auto-a-111111": 3600}, open_pr=True)
        self.assertEqual(result["register"], [])
        self.assertEqual(result["publish"], ["auto-a-111111"])


class RecentRegistrationTests(unittest.TestCase):
    def fake_git(self, commits, files, parents):
        class R:
            def __init__(self, out="", rc=0):
                self.stdout, self.returncode = out, rc

        def git(*args):
            if args[0] == "log":
                return R("".join(f"{sha} {ts}\n" for sha, ts in commits))
            if args[0] == "rev-parse":
                return R("", 0 if args[-1][:-1] in parents else 1)
            ref = args[1].split(":", 1)[0]
            return R(files[ref]) if ref in files else R("", 128)
        return git

    @staticmethod
    def reg(*ids):
        return __import__("json").dumps({"version": 1, "candidates": {i: {} for i in ids}})

    def test_only_ids_added_in_window_commits(self):
        files = {"c2": self.reg("manual", "auto-old", "auto-x", "auto-y"), "c2^": self.reg("manual", "auto-old")}
        git = self.fake_git([("c2", 1000)], files, parents={"c2"})
        recent = module.recent_registrations("r.json", 6 * 3600, now=1600, git=git)
        self.assertEqual(recent, {"auto-x": 600, "auto-y": 600})

    def test_commit_without_parent_in_history_is_ignored(self):
        files = {"c1": self.reg("auto-old", "auto-x")}
        git = self.fake_git([("c1", 1000)], files, parents=set())
        self.assertEqual(module.recent_registrations("r.json", 6 * 3600, now=1600, git=git), {})


class ApplyTests(unittest.TestCase):
    def test_apply_batch_registers_all_in_order(self):
        worker = (ROOT / "worker/privateWorkTest.ts").read_text(encoding="utf-8")
        items = [
            {"file_id": "1AbCdEfGhIjKlMn01", "name": "Ylisrinne_A.glb", "size": 10, "sha256": SHA},
            {"file_id": "1AbCdEfGhIjKlMn02", "name": "Ylisrinne_B__scene2.zip", "size": 20, "sha256": "b" * 64},
        ]
        ids, reg, new_worker = module.apply_batch(registry(), worker, items, "2026-10-22")
        self.assertEqual(len(ids), 2)
        self.assertEqual(list(reg["candidates"])[-2:], ids)
        runtime = new_worker.split(module.RUNTIME_MARKER, 1)[1].split(module.END_MARKER, 1)[0]
        for cid in ids:
            symbol = re.sub(r"[^A-Z0-9]+", "_", cid.upper()) + "_CANDIDATE"
            self.assertRegex(runtime, r"\b" + symbol + r"\b")
        self.assertEqual(reg["candidates"][ids[1]]["extractScene"], 2)

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
