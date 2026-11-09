"""Offline stdlib regression for V87 source-link metadata patch; no live Drive access."""

import hashlib
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('v87_patch', ROOT / 'scripts/v87_source_links_patch.py')
patcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(patcher)


def fixture():
    nodes = [{'name': 'other', 'extras': {'flag': 1}} for _ in range(11320)]
    for i, name in patcher.TARGET_NAMES.items():
        nodes[i] = {'name': name, 'extras': {'stage': 'WORK_TEST', 'hostHold': True}}
    nodes[7335] = {
        'name': 'ROOM3_TWO_DOOR_CABINET_EAST_1000MM_OWNER_ESTIMATE_K1_V8',
        'extras': {'sourceLinks': [{'docId': 'DOC:old', 'link': 'https://docs.google.com/document/d/old/edit',
                                   'role': 'historical', 'supports': '2015 only'}]},
    }
    return {'asset': {'version': '2.0'}, 'scenes': [{'nodes': [11298, 11304, 11311, 11315, 11319]}],
            'nodes': nodes, 'meshes': [{'primitives': [{'attributes': {'POSITION': 0}}]}],
            'accessors': [{'bufferView': 0, 'componentType': 5126, 'count': 3, 'type': 'VEC3'}],
            'bufferViews': [{'buffer': 0, 'byteLength': 36}], 'buffers': [{'byteLength': 36}]}


class PatchTests(unittest.TestCase):
    def test_only_five_existing_node_extras_change(self):
        source = fixture()
        result = patcher.patch_document(source)
        self.assertEqual(source['scenes'], result['scenes'])
        self.assertEqual(source['meshes'], result['meshes'])
        self.assertNotIn('sourceLinks', source['nodes'][11319]['extras'])
        self.assertEqual(len([i for i, (a, b) in enumerate(zip(source['nodes'], result['nodes'])) if a != b]), 5)
        self.assertIn('NOT VERIFIED', result['nodes'][11319]['extras']['sourceLinks'][0]['supports'])
        self.assertEqual(result['nodes'][11304]['extras']['sourceLinks'], source['nodes'][7335]['extras']['sourceLinks'])
        self.assertIsNot(result['nodes'][11304]['extras']['sourceLinks'], source['nodes'][7335]['extras']['sourceLinks'])

    def test_binary_chunks_and_all_original_nodes_survive(self):
        source = fixture()
        binary = bytes(range(36))
        original = patcher.encode_glb(source, [(b'JSON', b'{} '), (b'BIN\x00', binary)])
        result = patcher.patch_glb(original, expected_sha=hashlib.sha256(original).hexdigest())
        old_doc, old_chunks = patcher.read_glb(original)
        new_doc, new_chunks = patcher.read_glb(result)
        self.assertEqual(new_chunks[1:], old_chunks[1:])
        self.assertEqual(new_doc['scenes'], old_doc['scenes'])
        self.assertEqual(new_doc['meshes'], old_doc['meshes'])
        self.assertEqual(new_doc['accessors'], old_doc['accessors'])
        self.assertNotEqual(result, original)

    def test_sha_name_and_preexisting_metadata_fail_closed(self):
        source = fixture()
        source['nodes'][11319]['name'] = 'other'
        with self.assertRaisesRegex(ValueError, 'identity mismatch'):
            patcher.patch_document(source)
        source = fixture()
        source['nodes'][11319]['extras']['sourceLinks'] = []
        with self.assertRaisesRegex(ValueError, 'expected state'):
            patcher.patch_document(source)
        original = patcher.encode_glb(fixture(), [(b'JSON', b'{} '), (b'BIN\x00', b'\x00' * 36)])
        with self.assertRaisesRegex(ValueError, 'SHA mismatch'):
            patcher.patch_glb(original)


if __name__ == '__main__':
    unittest.main()
