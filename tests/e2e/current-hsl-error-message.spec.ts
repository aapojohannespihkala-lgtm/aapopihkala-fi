import { expect, test } from '@playwright/test';
import { hslErrorMessage } from '../../src/features/current/hsl';

test('only an explicit missing configuration error is labeled as an API key problem', () => {
  expect(hslErrorMessage(503, 'missing_configuration')).toBe(
    'DIGITRANSIT API KEY NOT CONFIGURED.'
  );

  expect(hslErrorMessage(503, null)).toBe('HSL DATA UNAVAILABLE.');
  expect(hslErrorMessage(503, 'worker_unavailable')).toBe('HSL DATA UNAVAILABLE.');
});

test('Digitransit authentication failures remain distinct from transient availability errors', () => {
  expect(hslErrorMessage(502, 'upstream_auth_failed')).toBe(
    'DIGITRANSIT AUTHENTICATION FAILED.'
  );
  expect(hslErrorMessage(502, 'upstream_unavailable')).toBe('HSL DATA UNAVAILABLE.');
});
