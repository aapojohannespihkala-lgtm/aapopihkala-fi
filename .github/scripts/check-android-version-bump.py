#!/usr/bin/env python3
"""Require an APK version bump when Android production inputs change."""
from __future__ import annotations

import re
import subprocess
import sys
from dataclasses import dataclass
from typing import Iterable

VERSION_FILE = "android-snapshot-widget/app/build.gradle.kts"
PRODUCTION_PREFIXES = (
    "android-snapshot-widget/app/src/main/",
    "android-snapshot-widget/gradle/",
)
PRODUCTION_FILES = {
    "android-snapshot-widget/app/build.gradle.kts",
    "android-snapshot-widget/build.gradle.kts",
    "android-snapshot-widget/settings.gradle.kts",
    "android-snapshot-widget/gradle.properties",
    "android-snapshot-widget/gradlew",
    "android-snapshot-widget/gradlew.bat",
}


@dataclass(frozen=True)
class AndroidVersion:
    code: int
    name: str


def is_production_android_path(path: str) -> bool:
    return path in PRODUCTION_FILES or path.startswith(PRODUCTION_PREFIXES)


def production_android_changes(paths: Iterable[str]) -> list[str]:
    return sorted(path for path in paths if is_production_android_path(path))


def parse_android_version(content: str) -> AndroidVersion:
    code_match = re.search(r"(?m)^\s*versionCode\s*=\s*(\d+)\s*$", content)
    name_match = re.search(r'(?m)^\s*versionName\s*=\s*"([^"]+)"\s*$', content)
    if not code_match or not name_match:
        raise ValueError(f"Could not parse versionCode/versionName from {VERSION_FILE}")
    return AndroidVersion(code=int(code_match.group(1)), name=name_match.group(1))


def validate_version_bump(
    changed_paths: Iterable[str],
    base_content: str,
    head_content: str,
) -> list[str]:
    production_changes = production_android_changes(changed_paths)
    if not production_changes:
        return []

    base = parse_android_version(base_content)
    head = parse_android_version(head_content)
    errors: list[str] = []
    if head.code <= base.code:
        errors.append(
            f"versionCode must increase for Android production changes: {base.code} -> {head.code}"
        )
    if head.name == base.name:
        errors.append(
            f"versionName must change for Android production changes: {base.name!r}"
        )
    return errors


def git(*args: str) -> str:
    result = subprocess.run(
        ["git", *args],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print(
            "usage: check-android-version-bump.py <base-sha> <head-sha>",
            file=sys.stderr,
        )
        return 2

    base_sha, head_sha = argv[1], argv[2]
    changed_paths = git("diff", "--name-only", f"{base_sha}...{head_sha}").splitlines()
    production_changes = production_android_changes(changed_paths)
    if not production_changes:
        print("No Android production inputs changed; APK version bump not required.")
        return 0

    base_content = git("show", f"{base_sha}:{VERSION_FILE}")
    head_content = git("show", f"{head_sha}:{VERSION_FILE}")
    errors = validate_version_bump(changed_paths, base_content, head_content)
    if errors:
        print("Android production inputs changed:", file=sys.stderr)
        for path in production_changes:
            print(f"  - {path}", file=sys.stderr)
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        print(
            "Update both versionCode and versionName in " + VERSION_FILE,
            file=sys.stderr,
        )
        return 1

    base = parse_android_version(base_content)
    head = parse_android_version(head_content)
    print(
        f"Android version bump verified: {base.name} ({base.code}) -> "
        f"{head.name} ({head.code})."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
