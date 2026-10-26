"""Protect pre-merge test selection without installing Node or a browser."""
import pathlib
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
SCRIPT = ROOT / '.github/scripts/select-browser-tests.sh'


def selected(*paths):
    result = subprocess.run(['bash', str(SCRIPT), *paths], check=True,
                            capture_output=True, text=True)
    return result.stdout.splitlines()


class SelectionTests(unittest.TestCase):
    def test_liiga_does_not_run_unrelated_sections(self):
        specs = selected('src/components/current/CurrentLiiga.astro')
        self.assertIn('tests/e2e/current-liiga-schedule.spec.ts', specs)
        self.assertIn('tests/e2e/current-snapshot-liiga.spec.ts', specs)
        self.assertFalse(any('electricity' in s or 'calendar' in s or 'current2' in s for s in specs))

    def test_hsl_is_scoped_to_its_ui_and_worker_guards(self):
        self.assertEqual(
            selected('src/features/current/hsl.ts'),
            [
                'tests/e2e/current-hsl-vehicle-freshness.spec.ts',
                'tests/e2e/current-hsl.spec.ts',
            ],
        )
        self.assertEqual(
            selected('functions/api/current/hsl.ts'),
            [
                'tests/e2e/current-hsl-vehicle-freshness.spec.ts',
                'tests/e2e/current-hsl.spec.ts',
                'tests/e2e/current-worker-regression.spec.ts',
            ],
        )

    def test_shared_layout_retains_all_domain_guards(self):
        specs = selected('src/layouts/BaseLayout.astro')
        for name in ['current-section-boundaries', 'current-electricity-alignment',
                     'current-snapshot-alignment', 'current-snapshot-month-calendar',
                     'current-liiga', 'current-hsl', 'current-markets',
                     'current-weather-timeout', 'current2-responsive']:
            self.assertIn(f'tests/e2e/{name}.spec.ts', specs)

    def test_mixed_changes_union_without_duplicates(self):
        paths = ['src/components/current/CurrentLiiga.astro',
                 'src/components/current/CurrentElectricity.astro']
        specs = selected(*paths, *paths)
        self.assertEqual(specs, sorted(set(selected(paths[0])) | set(selected(paths[1]))))

    def test_unknown_current_and_empty_diff_are_conservative(self):
        expected = selected('src/layouts/BaseLayout.astro')
        self.assertEqual(selected('src/features/current/future-feature.ts'), expected)
        self.assertTrue(set(expected).issubset(selected()))

    def test_changed_spec_runs_itself_and_deleted_spec_is_ignored(self):
        spec = 'tests/e2e/current-liiga-schedule.spec.ts'
        self.assertEqual(selected(spec), [spec])
        self.assertEqual(selected('tests/e2e/removed.spec.ts'), [])

    def test_docs_do_not_install_browser(self):
        self.assertEqual(selected('README.md', 'AGENTS.md', 'docs/ARCHITECTURE.md'), [])

    def test_private_model_page_changes_run_real_vm_and_floor_regressions(self):
        self.assertEqual(selected('src/pages/private-model/index.astro'), [
            'tests/e2e/private-model-d1f-combined-wall-scene-contract.spec.ts',
            'tests/e2e/private-model-main-view-scope.spec.ts',
            'tests/e2e/private-model-other-floor-reference.spec.ts',
            'tests/e2e/private-model-work-test-load-diagnostics.spec.ts',
        ])

    def test_work_test_loader_changes_run_diagnostics(self):
        self.assertEqual(selected('src/scripts/privateModelWorkTest.ts'), [
            'tests/e2e/private-model-work-test-load-diagnostics.spec.ts',
        ])

    def test_floor_scope_changes_recheck_reference_and_floor_filter(self):
        self.assertEqual(selected('src/scripts/privateModelMainViewScope.ts'), [
            'tests/e2e/private-model-main-view-scope.spec.ts',
            'tests/e2e/private-model-other-floor-reference.spec.ts',
        ])
        self.assertEqual(selected('src/scripts/privateModelOtherFloorReference.ts'), [
            'tests/e2e/private-model-other-floor-reference.spec.ts',
        ])

    def test_t04_source_changes_recheck_adjacent_floor_viewer_guards(self):
        # T04 source geometry remains separately gated by its Node/unit tests.
        expected = [
            'tests/e2e/private-model-main-view-scope.spec.ts',
            'tests/e2e/private-model-other-floor-reference.spec.ts',
        ]
        for path in ('src/scripts/privateModelSharedBoundaryClip.mjs',
                     'src/scripts/privateModelSharedCdMaterialClip.mjs',
                     'src/scripts/privateModelT04FloorScopeBridge.mjs'):
            self.assertEqual(selected(path), expected)

    def test_three_runtime_keeps_floor_reference_and_meshy_guards(self):
        self.assertEqual(selected('src/scripts/threeRuntime.ts'), [
            'tests/e2e/meshy-poise-regression.spec.ts',
            'tests/e2e/private-model-other-floor-reference.spec.ts',
        ])

    def test_private_model_changes_union_dedup_without_current_tests(self):
        paths = ('src/pages/private-model/index.astro',
                 'src/scripts/privateModelMainViewScope.ts',
                 'src/scripts/privateModelOtherFloorReference.ts',
                 'src/scripts/privateModelWorkTest.ts')
        selected_specs = selected(*paths, *paths)
        self.assertEqual(selected_specs, selected(paths[0]))
        self.assertEqual(selected_specs, sorted(set(selected_specs)))
        self.assertFalse(any('/current-' in item for item in selected_specs))

    def test_unrelated_source_still_does_not_trigger_private_model_browser(self):
        self.assertEqual(selected('README.md', 'src/scripts/unrelated-helper.ts'), [])

    def test_ci_changes_validate_selector_and_guards(self):
        self.assertEqual(selected('.github/scripts/select-browser-tests.sh'), selected())


if __name__ == '__main__':
    unittest.main()
