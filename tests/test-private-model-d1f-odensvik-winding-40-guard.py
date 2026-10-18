#!/usr/bin/env python3
"""Minimal structural boundary tests for the corrected ODENSVIK source gate."""
import importlib.util
import unittest
from pathlib import Path

p = Path(__file__).resolve().parents[1] / ".github/scripts/private-model-d1f-odensvik-winding-40-pointer-guard.py"
spec = importlib.util.spec_from_file_location("odensvik_winding_guard", p)
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)


class GuardBoundaryTests(unittest.TestCase):
    def test_expected_target_roster(self):
        self.assertEqual(len(guard.VARIANTS), 4)
        self.assertEqual(len(guard.SURFACES) + len(guard.THEMOS) + 2, 10)

    def test_missing_or_old_scenes_rejected(self):
        for value in (None, {}, {"scenes": []}, {"scenes": [{} for _ in range(112)]}):
            with self.subTest(value_type=type(value).__name__):
                with self.assertRaises((ValueError, AttributeError)):
                    guard.validate(value)

    def test_invalid_glb_rejected(self):
        for raw in (b"", b"glTF", b"not-a-GLB"):
            with self.assertRaises(ValueError):
                guard.parse_glb(raw)


if __name__ == "__main__":
    unittest.main()
