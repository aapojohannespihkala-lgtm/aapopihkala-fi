import { expect, test } from '@playwright/test';
import { onRequestGet as getNewsResponse } from '../../functions/api/current/news';

const DEFAULT_USER_AGENT = 'aapopihkala.fi Current News/1.0';
const BROWSER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36';

test('Current News scopes browser request headers to Angry Metal Guy', async () => {
  const originalFetch = globalThis.fetch;
  const seen = new Map<string, Headers>();

  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    const headers = new Headers(init?.headers);
    seen.set(url.href, headers);

    const slug = `${url.hostname}-${url.pathname}`.replace(/[^a-z0-9]+/gi, '-');
    const xml = `<?xml version="1.0"?><rss version="2.0"><channel><item><title>Contract ${slug}</title><link>${url.origin}/contract-${slug}/</link><pubDate>${new Date().toUTCString()}</pubDate><description>Contract fixture.</description></item></channel></rss>`;
    return new Response(xml, { status: 200, headers: { 'Content-Type': 'application/rss+xml' } });
  };

  try {
    const response = await getNewsResponse();
    expect(response.status).toBe(200);

    const angry = seen.get('https://www.angrymetalguy.com/feed/');
    expect(angry?.get('User-Agent')).toBe(BROWSER_USER_AGENT);
    expect(angry?.get('Accept')).toContain('application/atom+xml');

    const quietus = seen.get('https://thequietus.com/feed/');
    expect(quietus?.get('User-Agent')).toBe(DEFAULT_USER_AGENT);
    expect(quietus?.get('Accept')).not.toContain('application/atom+xml');

    expect(seen.size).toBe(13);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
