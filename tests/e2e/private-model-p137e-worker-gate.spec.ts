import { expect, test } from '@playwright/test';
import {
  handlePrivatePlacementReviewRequest,
  isPrivatePlacementReviewPath,
  readBoundedPlacementRequest,
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

test('P137E streamed request accepts exactly 16 kB and rejects 16 kB plus one', async () => {
  const max = new Request(origin + base + '/observations', {
    method: 'POST',
    body: 'x'.repeat(16000),
  });
  expect(await readBoundedPlacementRequest(max)).toBe('x'.repeat(16000));

  const oversized = new Request(origin + base + '/observations', {
    method: 'POST',
    body: 'x'.repeat(16001),
  });
  expect(await readBoundedPlacementRequest(oversized)).toBeNull();
});

test('P137E chunked input stops before consuming later untrusted chunks', async () => {
  let pulls = 0;
  let cancelled = false;
  const source = new ReadableStream<Uint8Array>({
    pull(controller) {
      pulls += 1;
      if (pulls === 1) controller.enqueue(new Uint8Array(12000));
      else if (pulls === 2) controller.enqueue(new Uint8Array(5000));
      else controller.enqueue(new Uint8Array(10000));
    },
    cancel() { cancelled = true; },
  });
  const request = new Request(origin + base + '/observations', {
    method: 'POST',
    body: source,
    duplex: 'half',
  } as RequestInit & { duplex: 'half' });
  expect(await readBoundedPlacementRequest(request)).toBeNull();
  expect(pulls).toBeLessThan(4);
  expect(cancelled).toBe(true);
});

test('P137E input decoding rejects malformed UTF-8 and preserves split multibyte text', async () => {
  const bad = new Request(origin + base + '/observations', {
    method: 'POST',
    body: new Uint8Array([0xc3, 0x28]),
  });
  expect(await readBoundedPlacementRequest(bad)).toBeNull();

  const bytes = [new Uint8Array([0xc3]), new Uint8Array([0xa4])];
  let index = 0;
  const good = new Request(origin + base + '/observations', {
    method: 'POST',
    body: new ReadableStream<Uint8Array>({
      pull(controller) {
        if (index < bytes.length) controller.enqueue(bytes[index++]);
        else controller.close();
      },
    }),
    duplex: 'half',
  } as RequestInit & { duplex: 'half' });
  expect(await readBoundedPlacementRequest(good)).toBe('ä');
});
