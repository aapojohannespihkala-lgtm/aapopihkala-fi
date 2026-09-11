import { expect, test } from '@playwright/test';

import { fetchLiigaResponse } from '../../functions/api/current/liiga';
import worker from '../../worker/index';

const env = {
  ASSETS: {
    fetch: async (request: Request) =>
      new Response(`asset:${new URL(request.url).pathname}`, { status: 200 }),
  },
};

test('Snapshot portfolio uses the bounded resilient feed instead of full enrichment', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => new Response('temporary upstream failure', { status: 503 });

  try {
    const response = await worker.fetch(
      new Request('https://aapopihkala.fi/api/current/markets?portfolio=1&v=6', {
        headers: { Referer: 'https://aapopihkala.fi/current/snapshot/' },
      }),
      env
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      expected: number;
      source: string;
      version: number;
      unavailable: string[];
    };

    expect(body.expected).toBe(19);
    expect(body.source).toContain('Resilient Yahoo Finance + OP + Nordnet');
    expect(body.version).toBe(9);
    expect(body.unavailable).toHaveLength(19);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Snapshot Liiga can fall back to the second upstream inside a bounded deadline', async () => {
  const originalFetch = globalThis.fetch;
  let firstUpstreamAborted = false;

  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));

    if (url.pathname === '/api/v2/games') {
      return new Promise<Response>((_resolve, reject) => {
        const abort = () => {
          firstUpstreamAborted = true;
          reject(new DOMException('Aborted', 'AbortError'));
        };

        if (init?.signal?.aborted) abort();
        else init?.signal?.addEventListener('abort', abort, { once: true });
      });
    }

    if (url.pathname === '/api/v2/schedule') {
      return Promise.resolve(Response.json({
        games: [
          {
            id: 1,
            start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            homeTeam: { teamId: 'hpk', goals: null },
            awayTeam: { teamId: 'ilves', goals: null },
            started: false,
            ended: false,
            gameTime: null,
            cacheUpdateDate: '2026-09-11T12:00:00.000Z',
          },
        ],
      }));
    }

    return Promise.reject(new Error(`Unexpected upstream URL: ${url}`));
  }) as typeof fetch;

  const startedAt = Date.now();

  try {
    const response = await fetchLiigaResponse(25);
    expect(response.status).toBe(200);
    expect(firstUpstreamAborted).toBe(true);
    expect(Date.now() - startedAt).toBeLessThan(1_000);

    const body = (await response.json()) as {
      upstream: string;
      nextIlvesGame: { awayTeamId: string } | null;
    };
    expect(body.upstream).toBe('/api/v2/schedule');
    expect(body.nextIlvesGame?.awayTeamId).toBe('ilves');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
