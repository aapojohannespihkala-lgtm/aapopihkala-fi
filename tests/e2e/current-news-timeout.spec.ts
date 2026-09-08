import { expect, test } from '@playwright/test';
import { onRequestGet as getNewsResponse } from '../../functions/api/current/news';

const HANGING_FEED = 'https://thequietus.com/feed/';

const rssFor = (feedUrl: string) => {
  const url = new URL(feedUrl);
  const suffix = url.pathname.replaceAll('/', '-').replace(/^-+|-+$/g, '') || 'feed';
  const link = `${url.origin}/current-news-timeout-test-${suffix}/`;
  return `<?xml version="1.0"?><rss version="2.0"><channel><item>
    <title>Current News timeout resilience item from ${url.hostname}</title>
    <link>${link}</link>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <category>News</category>
    <description>Healthy source remains available while another RSS source is stalled.</description>
  </item></channel></rss>`;
};

test('Current News returns healthy feeds when one RSS source stalls', async () => {
  test.setTimeout(10_000);
  const original = globalThis.fetch;

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url === HANGING_FEED) {
      return new Promise<Response>((_, reject) => {
        const signal = init?.signal;
        if (!signal) {
          reject(new Error('Expected Current News fetch to provide an AbortSignal'));
          return;
        }
        const abort = () => reject(new DOMException('Aborted', 'AbortError'));
        if (signal.aborted) abort();
        else signal.addEventListener('abort', abort, { once: true });
      });
    }

    return new Response(rssFor(url), {
      status: 200,
      headers: { 'Content-Type': 'application/rss+xml' },
    });
  };

  try {
    const started = Date.now();
    const response = await getNewsResponse();
    const elapsed = Date.now() - started;
    const data = (await response.json()) as {
      items: unknown[];
      sources: Array<{ id: string; status: string; count: number }>;
    };

    expect(response.status).toBe(200);
    expect(elapsed).toBeLessThan(6_000);
    expect(data.items.length).toBeGreaterThanOrEqual(3);
    expect(data.sources.find((source) => source.id === 'quietus')).toMatchObject({
      status: 'error',
      count: 0,
    });
    expect(data.sources.some((source) => source.status === 'ok' && source.count > 0)).toBe(true);
  } finally {
    globalThis.fetch = original;
  }
});
