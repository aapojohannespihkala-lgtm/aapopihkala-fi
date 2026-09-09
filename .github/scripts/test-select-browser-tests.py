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

    def test_shared_layout_retains_all_domain_guards(self):
        specs = selected('src/layouts/BaseLayout.astro')
        for name in ['current-section-boundaries', 'current-electricity-alignment',
                     'current-snapshot-month-calendar', 'current-liiga', 'current-news',
                     'current-markets', 'current-weather-timeout', 'current2-responsive']:
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

    def test_ci_changes_validate_selector_and_guards(self):
        self.assertEqual(selected('.github/scripts/select-browser-tests.sh'), selected())


if __name__ == '__main__':
    unittest.main()
