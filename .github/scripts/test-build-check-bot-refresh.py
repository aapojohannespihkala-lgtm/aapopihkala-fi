#!/usr/bin/env python3
"""Fail-closed source contract for CI refresh-to-replay; no API calls."""
from pathlib import Path
import re
import unittest

WF = Path(__file__).resolve().parents[1] / "workflows" / "build-check.yml"
BODY = WF.read_text(encoding="utf-8")


class BotRefreshPolicy(unittest.TestCase):
    def test_exact_sha_guard(self):
        self.assertIn('[[ "$GITHUB_SHA" == "$REPLAY_SHA" ]]', BODY)
        self.assertIn('.head.sha==$sha', BODY)

    def test_trusted_same_repo_owner_and_base(self):
        self.assertGreaterEqual(BODY.count('.head.repo.full_name==$repo'), 2)
        self.assertGreaterEqual(BODY.count('.user.login==$owner'), 2)
        self.assertGreaterEqual(BODY.count('.base.ref=="main"'), 2)

    def test_no_workflow_changes_replay(self):
        self.assertIn('Workflow-changing PRs cannot use bot replay', BODY)
        self.assertIn('This PR edits GitHub Actions workflows and is behind main', BODY)

    def test_bounded_replay(self):
        self.assertIn('if (( REPLAY_ROUND >= 2 )); then', BODY)
        self.assertIn('[[ "$REPLAY_ROUND" =~ ^[12]$ ]]', BODY)

    def test_explicit_event_and_new_sha(self):
        self.assertIn('actions/workflows/build-check.yml/dispatches"', BODY)
        self.assertIn('--raw-field ref="$HEAD_REF"', BODY)
        self.assertIn('"inputs[replay_sha]=$refreshed"', BODY)
        self.assertIn('[[ "$refreshed" =~ ^[0-9a-f]{40}$', BODY)

    def test_pr_guards_run_for_replay(self):
        self.assertIn('inputs.replay_pr !=', BODY)
        self.assertIn('steps.changes.outputs.browser_tests !=', BODY)
        self.assertIn('Verify bot-refresh replay policy', BODY)

    def test_existing_manual_main_dispatch_preserved(self):
        self.assertIn("inputs.replay_pr == ''", BODY)
        self.assertIn('github.event_name != \'pull_request\'', BODY)

    def test_sha_locked_merge(self):
        self.assertIn('--raw-field sha="$HEAD_SHA"', BODY)
        self.assertIn('github.event.pull_request.number || inputs.replay_pr', BODY)


if __name__ == "__main__":
    unittest.main()
