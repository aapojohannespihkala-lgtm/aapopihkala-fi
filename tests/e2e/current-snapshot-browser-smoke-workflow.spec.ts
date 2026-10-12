import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const workflow = readFileSync(
  new URL('../../.github/workflows/current-snapshot-browser-smoke.yml', import.meta.url),
  'utf8',
);

test('Snapshot smoke still checks the browser after an API failure and reports the failure', () => {
  const steps = workflow.split(/^      - name: /m).slice(1);
  const named = (name: string) => steps.findIndex((step) => step.startsWith(name + '\n'));
  const api = named('Verify production Widget v2 endpoint');
  const install = named('Install Chromium');
  const widget = named('Verify production standalone Widget in browser');
  const snapshot = named('Verify production Snapshot sources in browser');
  const final = named('Fail if Widget v2 API verification failed');

  expect(api).toBeGreaterThanOrEqual(0);
  expect(install).toBeGreaterThan(api);
  expect(widget).toBeGreaterThan(install);
  expect(snapshot).toBeGreaterThan(widget);
  expect(final).toBeGreaterThan(snapshot);

  expect(steps[api]).toMatch(/^        id: widget_api$/m);
  expect(steps[api]).toMatch(/^        continue-on-error: true$/m);
  expect(steps[final]).toMatch(/^        if: always\(\)$/m);
  expect(steps[final]).toContain('steps.widget_api.outcome');
  expect(steps[final]).toMatch(/\bexit 1\b/);
});
