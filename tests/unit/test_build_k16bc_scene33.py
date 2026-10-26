"""Source-locked K16-b/c scene33 geometry replay tests.

Set YLISRINNE_K16BC_SOURCE_ZIP to the original Drive scene32 ZIP to replay
the real model and verify its exact scene33 GLB SHA. Without source, four
self-contained regression tests still work without external dependencies.
"""
import hashlib
import importlib.util
import os
from pathlib import Path
import tempfile
import unittest
import zipfile

SCRIPT = Path(__file__).resolve().parents[2] / 'scripts' / 'build-k16bc-scene33.py'
SPEC = importlib.util.spec_from_file_location('k16bc_scene33_builder', SCRIPT)
builder = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(builder)
EXPECTED_GLB_SHA = '295c1b8e04d8df4e2dd7fa3e5f58e6a2eee2e16b56b24253ccd1f81fbcd7ef08'


class K16BCBuilderTests(unittest.TestCase):
    def test_glb_codec_preserves_bin(self):
        payload = b'\x01\x02\x03\x04\x99\xa0\x00\x00'
        metadata = {'asset': {'version': '2.0'}, 'nodes': [], 'scenes': [{'nodes': []}]}
        result = builder.pack_glb(metadata, payload)
        unpacked, binary = builder.unpack_glb(result)
        self.assertEqual(unpacked, metadata)
        self.assertEqual(binary, payload)

    def test_scene_active_includes_descendants_once(self):
        model = {'nodes': [{'children': [1, 2]}, {'children': [3]}, {'children': [3]}, {}],
                 'scenes': [{'nodes': [0]}]}
        self.assertEqual(builder.scene_active(model, 0), {0, 1, 2, 3})

    def test_parent_sha_lock_rejects_non_source_zip(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / 'untrusted.zip'
            with zipfile.ZipFile(p, 'w') as z:
                z.writestr('model.glb', b'not the right model')
            with self.assertRaisesRegex(AssertionError, 'parent zip SHA mismatch'):
                builder.main(p, Path(tmp) / 'result.zip')

    def test_expected_version_hashes_are_complete(self):
        self.assertRegex(builder.PARENT_SHA, r'^[a-f0-9]{64}$')
        self.assertRegex(builder.PARENT_GLB_SHA, r'^[a-f0-9]{64}$')
        self.assertNotEqual(builder.PARENT_SHA, builder.PARENT_GLB_SHA)

    def test_full_source_replay_glb_identity_and_immutability(self):
        source = os.environ.get('YLISRINNE_K16BC_SOURCE_ZIP')
        if not source:
            self.skipTest('Set YLISRINNE_K16BC_SOURCE_ZIP to original Drive scene32 ZIP')
        original_bytes = Path(source).read_bytes()
        self.assertEqual(hashlib.sha256(original_bytes).hexdigest(), builder.PARENT_SHA)
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / 'replayed-scene33.zip'
            builder.main(source, dest)
            with zipfile.ZipFile(dest) as z:
                self.assertIsNone(z.testzip())
                glb = z.read('model.glb')
                qa = z.read('QA.json').decode('utf-8')
            self.assertEqual(hashlib.sha256(glb).hexdigest(), EXPECTED_GLB_SHA)
            self.assertIn('"publishReady": false', qa)
            self.assertIn('"newActiveLightSlats": 0', qa)
            self.assertIn('"oldBinByteIdentical": true', qa)
        self.assertEqual(Path(source).read_bytes(), original_bytes)


if __name__ == '__main__':
    unittest.main()
