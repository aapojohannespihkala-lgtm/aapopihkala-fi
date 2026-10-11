import { expect, test } from '@playwright/test';
import {
  handlePrivatePlacementReviewRequest,
  isPrivatePlacementReviewPath,
} from '../../worker/privateReviewPlacement';

const origin = 'https://aapopihkala.fi';
const base = '/private-model/review-placement/g2';
const request = (path: string, method = 'GET', headers?: HeadersInit) =>
  new Request(origin + path, { method, headers });

test('P137E transport classifies only its own private G2 paths', () => {
  expect(isPrivatePlacementReviewPath(base + '/targets')).toBe(true);
  expect(isPrivatePlacementReviewPath(base + '/observations')).toBe(true);
  expect(isPrivatePlacementReviewPath(base + '/observations/P137E_G2_0123456789abcdef')).toBe(true);
  expect(isPrivatePlacementReviewPath('/private-model/work-test/catalog.json')).toBe(false);
  expect(isPrivatePlacementReviewPath(base)).toBe(false);
});

test('P137E transport is closed without explicit independent release flag', async () => {
  const paths = [
    base + '/targets',
    base + '/observations',
    base + '/observations/P137E_G2_0123456789abcdef',
  ];
  for (const path of paths) {
    const response = await handlePrivatePlacementReviewRequest(request(path), {});
    expect(response.status).toBe(404);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect((await response.text()).includes('P137E_G2_0123456789abcdef')).toBe(false);
  }
});

test('P137E release flag alone never exposes native G2 access', async () => {
  const response = await handlePrivatePlacementReviewRequest(
    request(base + '/targets'),
    { P137E_G2_REVIEW_RELEASE_ENABLED: 'true' },
  );
  expect(response.status).toBe(404);
});

test('P137E secret credentials alone cannot activate a review or write', async () => {
  const response = await handlePrivatePlacementReviewRequest(
    request(base + '/observations', 'POST', {
      Origin: origin,
      'Content-Type': 'application/json',
    }),
    {
      P137E_G2_SERVICE_ACCOUNT_EMAIL: 'test@sample.iam.gserviceaccount.com',
      P137E_G2_SERVICE_ACCOUNT_PRIVATE_KEY_PEM: 'DO_NOT_USE_TEST_KEY',
    },
  );
  expect(response.status).toBe(404);
});

test('P137E release plus dummy credentials still fail without verified Access token', async () => {
  const response = await handlePrivatePlacementReviewRequest(
    request(base + '/targets'),
    {
      P137E_G2_REVIEW_RELEASE_ENABLED: 'true',
      P137E_G2_SERVICE_ACCOUNT_EMAIL: 'test@sample.iam.gserviceaccount.com',
      P137E_G2_SERVICE_ACCOUNT_PRIVATE_KEY_PEM: 'DO_NOT_USE_TEST_KEY',
    },
  );
  expect(response.status).toBe(404);
});
