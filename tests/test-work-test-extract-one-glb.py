"""Source identity and rejection tests for WORK_TEST GLB or ZIP transport."""
import importlib.util
import json
import struct
import tempfile
import unittest
import zipfile
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / ".github/scripts/work-test-extract-one-glb.py"
spec = importlib.util.spec_from_file_location("extract_work_test_glb", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

def make_glb():
    payload = json.dumps({"asset": {"version": "2.0"}, "scenes": [{}], "scene": 0}).encode()
    payload += b" " * ((-len(payload)) % 4)
    return struct.pack("<4sII", b"glTF", 2, 20 + len(payload)) + struct.pack("<I4s", len(payload), b"JSON") + payload

class ExtractTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.src = self.root / "source.dat"
        self.out = self.root / "out.glb"
        self.model = make_glb()

    def zip(self, entries):
        with zipfile.ZipFile(self.src, "w", zipfile.ZIP_DEFLATED) as archive:
            for name, payload in entries:
                archive.writestr(name, payload)

    def test_raw_glb_preserves_all_bytes(self):
        self.src.write_bytes(self.model)
        self.assertEqual(module.extract_single_glb(self.src, self.out), "raw-glb")
        self.assertEqual(self.out.read_bytes(), self.model)

    def test_zip_model_and_supporting_files_preserves_exact_glb(self):
        self.zip([("work/my-model.GLB", self.model), ("manifest.json", b"{}"), ("views/oblique.png", b"png")])
        self.assertEqual(module.extract_single_glb(self.src, self.out), "zip-single-glb")
        self.assertEqual(self.out.read_bytes(), self.model)

    def test_reject_no_glb(self):
        self.zip([("manifest.json", b"{}")])
        with self.assertRaises(module.InvalidSource):
            module.extract_single_glb(self.src, self.out)

    def test_reject_ambiguous_two_glbs(self):
        self.zip([("a.glb", self.model), ("b.glb", self.model)])
        with self.assertRaises(module.InvalidSource):
            module.extract_single_glb(self.src, self.out)

    def test_reject_parent_escape(self):
        self.zip([("../unsafe.glb", self.model)])
        with self.assertRaises(module.InvalidSource):
            module.extract_single_glb(self.src, self.out)

    def test_reject_invalid_raw_header_length(self):
        invalid = bytearray(self.model)
        struct.pack_into("<I", invalid, 8, len(invalid) + 8)
        self.src.write_bytes(invalid)
        with self.assertRaises(module.InvalidSource):
            module.extract_single_glb(self.src, self.out)
        self.assertFalse(self.out.exists())

    def test_reject_invalid_zip_glb_header(self):
        self.zip([("source.glb", b"not a glTF model")])
        with self.assertRaises(module.InvalidSource):
            module.extract_single_glb(self.src, self.out)
        self.assertFalse(self.out.exists())

    def test_reject_symlink_member(self):
        with zipfile.ZipFile(self.src, "w") as archive:
            item = zipfile.ZipInfo("fake.glb")
            item.create_system = 3
            item.external_attr = (0o120777 << 16)
            archive.writestr(item, self.model)
        with self.assertRaises(module.InvalidSource):
            module.extract_single_glb(self.src, self.out)

    def test_reject_zip_inflation_claim(self):
        self.zip([("source.glb", self.model)])
        old = module.MAX_ARCHIVE_UNCOMPRESSED_BYTES
        module.MAX_ARCHIVE_UNCOMPRESSED_BYTES = len(self.model) - 1
        try:
            with self.assertRaises(module.InvalidSource):
                module.extract_single_glb(self.src, self.out)
        finally:
            module.MAX_ARCHIVE_UNCOMPRESSED_BYTES = old

    def test_reject_same_source_and_dest(self):
        self.src.write_bytes(self.model)
        with self.assertRaises(module.InvalidSource):
            module.extract_single_glb(self.src, self.src)

if __name__ == "__main__":
    unittest.main()
