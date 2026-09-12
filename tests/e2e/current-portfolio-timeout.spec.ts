import { expect, test } from '@playwright/test';
import { fetchTextWithTimeout } from '../../functions/api/current/portfolio-stable';

test('OP portfolio recovery timeout covers a stalled response body', async () => {
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
      { status: 200, headers: { 'Content-Type': 'text/plain' } }
    );
  };

  const startedAt = Date.now();

  await expect(
    fetchTextWithTimeout('https://r.jina.ai/https://www.op.fi/example', {}, 25, fetchImpl)
  ).rejects.toThrow();

  expect(Date.now() - startedAt).toBeLessThan(1_000);
  expect(seenSignal).toBeInstanceOf(AbortSignal);
  expect(seenSignal?.aborted).toBe(true);
});
