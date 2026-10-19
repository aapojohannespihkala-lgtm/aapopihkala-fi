"""Tests for publishing one glTF scene as the only/default scene of a GLB."""
import importlib.util
import json
import struct
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1] / ".github/scripts"
spec = importlib.util.spec_from_file_location("extract_scene", SCRIPTS / "work-test-extract-scene.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def make_glb(extra=None):
    # Two triangles' positions + indices; scene 0 uses node 0, scene 1 uses node 1 -> child 2.
    positions = struct.pack("<9f", 0, 0, 0, 1, 0, 0, 0, 1, 0)
    other = struct.pack("<9f", 5, 5, 5, 6, 5, 5, 5, 6, 5)
    indices = struct.pack("<3H", 0, 1, 2) + b"\0\0"
    binary = positions + other + indices
    gltf = {
        "asset": {"version": "2.0"},
        "scene": 0,
        "scenes": [{"name": "old", "nodes": [0]}, {"name": "latest", "nodes": [1]}],
        "nodes": [
            {"name": "unused", "mesh": 0},
            {"name": "root", "translation": [1, 2, 3], "children": [2]},
            {"name": "leaf", "mesh": 1},
        ],
        "meshes": [
            {"primitives": [{"attributes": {"POSITION": 0}, "indices": 2, "material": 0}]},
            {"primitives": [{"attributes": {"POSITION": 1}, "indices": 2, "material": 1}]},
        ],
        "materials": [{"name": "a"}, {"name": "b", "doubleSided": True}],
        "accessors": [
            {"bufferView": 0, "componentType": 5126, "count": 3, "type": "VEC3", "min": [0, 0, 0], "max": [1, 1, 0]},
            {"bufferView": 1, "componentType": 5126, "count": 3, "type": "VEC3", "min": [5, 5, 5], "max": [6, 6, 5]},
            {"bufferView": 2, "componentType": 5123, "count": 3, "type": "SCALAR"},
        ],
        "bufferViews": [
            {"buffer": 0, "byteOffset": 0, "byteLength": 36},
            {"buffer": 0, "byteOffset": 36, "byteLength": 36},
            {"buffer": 0, "byteOffset": 72, "byteLength": 6},
        ],
        "buffers": [{"byteLength": len(binary)}],
    }
    if extra:
        gltf.update(extra)
    return gltf, binary


class ExtractSceneTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.src = self.root / "src.glb"
        module.write_glb(self.src, *make_glb())

    def extract(self, name="out.glb", scene=1):
        out = self.root / name
        module.main(str(self.src), scene, str(out))
        return out

    def test_selected_scene_becomes_only_default_scene(self):
        g, _ = module.read_glb(self.extract())
        self.assertEqual(g["scene"], 0)
        self.assertEqual([s["name"] for s in g["scenes"]], ["latest"])
        self.assertEqual([n["name"] for n in g["nodes"]], ["root", "leaf"])
        self.assertEqual([m["name"] for m in g["materials"]], ["b"])
        self.assertEqual(len(g["accessors"]), 2)

    def test_output_is_byte_deterministic(self):
        self.assertEqual(self.extract("a.glb").read_bytes(), self.extract("b.glb").read_bytes())

    def test_verifier_accepts_extraction_and_rejects_wrong_scene(self):
        out = self.extract()
        verify = [sys.executable, "-I", str(SCRIPTS / "work-test-verify-scene-equal.py"), str(self.src)]
        ok = subprocess.run(verify + ["1", str(out)], capture_output=True, text=True)
        self.assertEqual(ok.returncode, 0, ok.stdout + ok.stderr)
        bad = subprocess.run(verify + ["0", str(out)], capture_output=True, text=True)
        self.assertEqual(bad.returncode, 1, bad.stdout + bad.stderr)

    def test_unsupported_features_are_refused(self):
        module.write_glb(self.src, *make_glb({"animations": [{"channels": [], "samplers": []}]}))
        with self.assertRaises(AssertionError):
            self.extract()


if __name__ == "__main__":
    unittest.main()
