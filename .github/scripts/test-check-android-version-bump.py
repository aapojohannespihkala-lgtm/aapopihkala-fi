"""Regression tests for the Android production version-bump guard."""
import importlib.util
import pathlib
import sys
import unittest

SCRIPT = pathlib.Path(__file__).with_name('check-android-version-bump.py')
SPEC = importlib.util.spec_from_file_location('android_version_guard', SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)

BASE = '''
android {
    defaultConfig {
        versionCode = 55
        versionName = "2.10.26"
    }
}
'''


def head(code=56, name='2.10.27'):
    return f'''
android {{
    defaultConfig {{
        versionCode = {code}
        versionName = "{name}"
    }}
}}
'''


class AndroidVersionGuardTests(unittest.TestCase):
    def test_production_source_requires_bump(self):
        self.assertTrue(MODULE.is_production_android_path(
            'android-snapshot-widget/app/src/main/java/example/Widget.kt'
        ))
        self.assertTrue(MODULE.is_production_android_path(
            'android-snapshot-widget/app/build.gradle.kts'
        ))
        self.assertTrue(MODULE.is_production_android_path(
            'android-snapshot-widget/gradle/wrapper/gradle-wrapper.properties'
        ))

    def test_tests_docs_and_ci_do_not_require_apk_bump(self):
        for path in [
            'android-snapshot-widget/app/src/test/java/example/WidgetTest.kt',
            'android-snapshot-widget/README.md',
            '.github/workflows/android-snapshot-widget.yml',
            '.github/scripts/check-android-version-bump.py',
        ]:
            self.assertFalse(MODULE.is_production_android_path(path), path)

    def test_valid_code_and_name_bump_passes(self):
        errors = MODULE.validate_version_bump(
            ['android-snapshot-widget/app/src/main/java/example/Widget.kt'],
            BASE,
            head(),
        )
        self.assertEqual(errors, [])

    def test_unchanged_version_fails(self):
        errors = MODULE.validate_version_bump(
            ['android-snapshot-widget/app/src/main/java/example/Widget.kt'],
            BASE,
            BASE,
        )
        self.assertTrue(any('versionCode' in error for error in errors))
        self.assertTrue(any('versionName' in error for error in errors))

    def test_both_version_fields_are_required(self):
        code_only = MODULE.validate_version_bump(
            ['android-snapshot-widget/app/src/main/java/example/Widget.kt'],
            BASE,
            head(name='2.10.26'),
        )
        name_only = MODULE.validate_version_bump(
            ['android-snapshot-widget/app/src/main/java/example/Widget.kt'],
            BASE,
            head(code=55),
        )
        self.assertTrue(any('versionName' in error for error in code_only))
        self.assertTrue(any('versionCode' in error for error in name_only))

    def test_test_only_change_needs_no_version_parse(self):
        errors = MODULE.validate_version_bump(
            ['android-snapshot-widget/app/src/test/java/example/WidgetTest.kt'],
            'not gradle content',
            'not gradle content',
        )
        self.assertEqual(errors, [])


if __name__ == '__main__':
    unittest.main()
