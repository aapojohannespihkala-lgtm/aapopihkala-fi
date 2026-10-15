import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const workflow = readFileSync(resolve(process.cwd(), '.github/workflows/build-check.yml'), 'utf8');

test('build check includes ready-for-review in protected pull request events', () => {
  const from = workflow.indexOf('\n  pull_request:\n');
  const to = workflow.indexOf('\n  workflow_dispatch:', from);
  expect(from).toBeGreaterThan(0);
  expect(to).toBeGreaterThan(from);
  const block = workflow.slice(from, to);
  for (const event of ['opened', 'synchronize', 'reopened', 'ready_for_review']) {
    expect(block).toContain('      - ' + event + '\n');
  }
  expect(block).toContain('    branches:\n      - main');
});

test('ownerbot merge still excludes draft and untrusted pull requests', () => {
  const start = workflow.indexOf('\n  merge:\n');
  expect(start).toBeGreaterThan(0);
  const block = workflow.slice(start);
  expect(block).toContain("github.event_name == 'pull_request'");
  expect(block).toContain('github.event.pull_request.draft == false');
  expect(block).toContain('github.event.pull_request.head.repo.full_name == github.repository');
  expect(block).toContain('github.event.pull_request.user.login == github.repository_owner');
});
