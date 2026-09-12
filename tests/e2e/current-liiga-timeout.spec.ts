import { expect, test } from '@playwright/test';

import { fetchLiigaResponse } from '../../functions/api/current/liiga';

test('Liiga upstream timeout remains active while reading the response body', async () => {
  const fetchImpl: typeof fetch = async (_input, init) => {
    const signal = init?.signal;

    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        const abort = () => controller.error(new DOMException('Aborted', 'AbortError'));
        if (signal?.aborted) {
          abort();
          return;
        }
        signal?.addEventListener('abort', abort, { once: true });
      },
    });

    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const startedAt = Date.now();
  const response = await fetchLiigaResponse(25, fetchImpl);
  const elapsedMs = Date.now() - startedAt;

  expect(response.status).toBe(502);
  expect(elapsedMs).toBeLessThan(500);

  const payload = await response.json() as { error?: string; detail?: string };
  expect(payload.error).toBe('Liiga data request failed');
  expect(payload.detail).toContain('timeout');
});
