import { expect, test } from '@playwright/test';

import { fetchCurrentGuarded } from '../../src/features/current/externalFetchGuard';

test('Snapshot browser timeout covers a stalled response body', async () => {
  let seenSignal: AbortSignal | null | undefined;

  const fetchImpl: typeof fetch = async (_input, init) => {
    seenSignal = init?.signal;
    const signal = seenSignal;

    return new Response(
      new ReadableStream({
        start(controller) {
          signal?.addEventListener(
            'abort',
            () => controller.error(signal.reason ?? new DOMException('Aborted', 'AbortError')),
            { once: true }
          );
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  const startedAt = Date.now();

  await expect(
    fetchCurrentGuarded(
      fetchImpl,
      'https://aapopihkala.fi/api/current/markets?portfolio=1&v=6',
      undefined,
      {
        pageUrl: 'https://aapopihkala.fi/current/snapshot/',
        snapshotApiTimeoutMs: 25,
      }
    )
  ).rejects.toThrow();

  expect(Date.now() - startedAt).toBeLessThan(1_000);
  expect(seenSignal).toBeInstanceOf(AbortSignal);
  expect(seenSignal?.aborted).toBe(true);
});
