import { expect, test } from '@playwright/test';
import { onRequestGet as getNewsResponse } from '../../functions/api/current/news';
import worker from '../../worker/index';

const PROFILE_KEY = 'current.news.profile.v1';
const DAILY_KEY = 'current.news.daily.v1';
const RESET_MARKER = 'current.news.test.storage-reset';

const liveItems = [
  ['soundi-1', 'Kotimainen artisti julkaisee uuden albumin', 'https://www.soundi.fi/jutut/a/', 'Soundi', 'soundi', 'music', 'finland', 'release'],
  ['pitchfork-1', 'Archival electronic album receives a new reissue', 'https://pitchfork.com/reviews/albums/a/', 'Pitchfork', 'pitchfork', 'music', 'international', 'reissue'],
  ['quietus-1', 'A new experimental record explores field recordings', 'https://thequietus.com/articles/a/', 'The Quietus', 'quietus', 'music', 'international', 'review'],
  ['tcj-1', 'Alternative comics artist discusses a new book', 'https://www.tcj.com/a/', 'The Comics Journal', 'comics-journal', 'comics', 'international', 'interview'],
  ['soundi-2', 'Pitkä haastattelu kotimaisen säveltäjän levystä', 'https://www.soundi.fi/jutut/b/', 'Soundi', 'soundi', 'music', 'finland', 'interview'],
  ['pitchfork-2', 'Best new album blends ambient and contemporary classical music', 'https://pitchfork.com/reviews/albums/b/', 'Pitchfork', 'pitchfork', 'music', 'international', 'review'],
  ['quietus-2', 'Retrospective revisits a forgotten post-punk catalogue', 'https://thequietus.com/articles/b/', 'The Quietus', 'quietus', 'music', 'international', 'retrospective'],
  ['tcj-2', 'Review considers a formally unusual graphic novel', 'https://www.tcj.com/reviews/b/', 'The Comics Journal', 'comics-journal', 'comics', 'international', 'review'],
  ['pitchfork-3', 'Composer announces an electronic soundtrack album', 'https://pitchfork.com/news/c/', 'Pitchfork', 'pitchfork', 'music', 'international', 'release'],
  ['soundi-3', 'Arkistolöytö avaa kokeellisen musiikin historiaa', 'https://www.soundi.fi/jutut/c/', 'Soundi', 'soundi', 'music', 'finland', 'retrospective'],
].map(([id, title, url, source, sourceId, category, locality, kind], index) => ({
  id,
  title,
  summary: `Feed summary for ${title.toLowerCase()}.`,
  url,
  publishedAt: new Date(Date.UTC(2026, 8, 6 - Math.floor(index / 4), 12 - index)).toISOString(),
  language: sourceId === 'soundi' ? 'fi' : 'en',
  source, sourceId, category, locality,
  tags: [category, kind, sourceId],
  kind,
  baseScore: 1.1 - index * 0.02,
}));

const liveFixture = {
  generatedAt: '2026-09-06T18:30:00.000Z',
  items: liveItems,
  sources: [
    { id: 'soundi', name: 'Soundi', status: 'ok', count: 3 },
    { id: 'pitchfork', name: 'Pitchfork', status: 'ok', count: 3 },
    { id: 'quietus', name: 'The Quietus', status: 'ok', count: 2 },
    { id: 'comics-journal', name: 'The Comics Journal', status: 'ok', count: 2 },
  ],
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ profileKey, dailyKey, marker }) => {
      if (sessionStorage.getItem(marker) === 'true') return;
      localStorage.removeItem(profileKey);
      localStorage.removeItem(dailyKey);
      sessionStorage.setItem(marker, 'true');
    },
    { profileKey: PROFILE_KEY, dailyKey: DAILY_KEY, marker: RESET_MARKER }
  );
  await page.route('**/api/current/news', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(liveFixture),
  }));
});

test('standalone Current News uses live items and learns locally from both ratings', async ({ page }) => {
  await page.goto('/current/news/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('h1')).toHaveText('News');
  await expect(page.locator('a.current-news-status__link')).toHaveAttribute('href', '/current/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(page.locator('.news-mode')).toHaveText('LIVE RSS / 4 OF 4 SOURCES');
  await expect(page.locator('[data-news-slot]')).toHaveCount(3);
  await expect(page.locator('[data-news-context]')).toHaveCount(3);
  await expect(page.locator('[data-news-debug-pool]')).toHaveText('10');
  await expect(page.locator('.news-footer')).toContainText('SOUNDI');

  const contextLines = await page.locator('[data-news-context]').allTextContents();
  expect(contextLines.every((value) => value.startsWith('Feed summary for '))).toBe(true);

  const first = page.locator('[data-news-slot]').first();
  const firstId = await first.getAttribute('data-news-item-id');
  await expect(first.locator('[data-news-title] a')).toHaveAttribute('href', /^https:\/\//);

  await first.locator('[data-news-feedback="up"]').click();
  await expect(first).not.toHaveAttribute('data-news-item-id', firstId ?? '');
  await expect(page.locator('[data-news-debug-up]')).toHaveText('1');
  const replacementId = await first.getAttribute('data-news-item-id');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-news-slot]').first()).toHaveAttribute('data-news-item-id', replacementId ?? '');
  await expect(page.locator('[data-news-debug-up]')).toHaveText('1');

  const second = page.locator('[data-news-slot]').nth(1);
  const secondId = await second.getAttribute('data-news-item-id');
  await second.locator('[data-news-feedback="down"]').click();
  await expect(second).not.toHaveAttribute('data-news-item-id', secondId ?? '');
  await expect(page.locator('[data-news-debug-down]')).toHaveText('1');
  await expect(page.locator('[data-news-debug-seen]')).toHaveText('2');

  await page.locator('.news-debug').evaluate((element) => { (element as HTMLDetailsElement).open = true; });
  await expect(page.locator('[data-news-debug-signal]')).not.toHaveCount(0);
});

test('Current News keeps all three daily items in one compact desktop viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 760 });
  await page.goto('/current/news/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.news-mode')).toHaveText('LIVE RSS / 4 OF 4 SOURCES');
  const slots = page.locator('[data-news-slot]');
  await expect(slots).toHaveCount(3);
  await expect(page.locator('[data-news-context]')).toHaveCount(3);

  const lastBox = await slots.nth(2).boundingBox();
  expect(lastBox).not.toBeNull();
  if (lastBox) expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(760);
});

test('Current News reset stays local and the page fits a 390 px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/current/news/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-news-slot]').first().locator('[data-news-feedback="up"]').click();
  await page.locator('.news-debug').evaluate((element) => { (element as HTMLDetailsElement).open = true; });
  await page.locator('[data-news-reset]').click();

  await expect(page.locator('[data-news-debug-up]')).toHaveText('0');
  await expect(page.locator('[data-news-debug-down]')).toHaveText('0');
  await expect(page.locator('[data-news-debug-seen]')).toHaveText('0');

  const widths = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1);
});

const rss = (items: Array<[string, string, string, string, string]>) => `<?xml version="1.0"?><rss version="2.0"><channel>
${items.map(([title, link, date, category, description]) => `<item><title><![CDATA[${title}]]></title><link>${link}</link><pubDate>${date}</pubDate><category>${category}</category><description><![CDATA[${description}]]></description></item>`).join('\n')}
</channel></rss>`;

const feedFixtures = new Map<string, string>([
  ['https://www.soundi.fi/feed', rss([
    ['Kotimainen artisti julkaisee uuden albumin', 'https://www.soundi.fi/jutut/live-a/', 'Sun, 06 Sep 2026 12:00:00 GMT', 'Haastattelut', '<p>Artistin uusi levy rakentuu pitkän tauon jälkeen syntyneistä kappaleista ja uudesta kokoonpanosta.</p> Lue lisää'],
    ['Arkistolöytö kokeellisen musiikin historiasta', 'https://www.soundi.fi/jutut/live-b/', 'Sat, 05 Sep 2026 16:00:00 GMT', 'Musiikki', 'Arkistosta löytynyt tallenne avaa uuden näkökulman kotimaisen kokeellisen musiikin historiaan.'],
  ])],
  ['https://www.pelaaja.fi/feed/', rss([
    ['Remedyn uusi peli nostaa pelisuunnittelun valokeilaan', 'https://www.pelaaja.fi/uutiset/live-a/', 'Sun, 06 Sep 2026 13:00:00 GMT', 'Remedy', 'Suomalaisstudion tuleva peli painottaa uudenlaista pelisuunnittelua ja laajentaa studion tuttua maailmaa.'],
    ['GTA 6:n uusi yksityiskohta herättää keskustelua', 'https://www.pelaaja.fi/uutiset/live-b/', 'Sat, 05 Sep 2026 19:00:00 GMT', 'GTA 6', 'Rockstar on avannut yhden uuden yksityiskohdan Grand Theft Auto VI:n pelimekaniikasta.'],
  ])],
  ['https://muropaketti.com/pelit/feed', rss([
    ['PlayStation 5:n levytuotannosta saatiin uusia tietoja', 'https://muropaketti.com/pelit/peliuutiset/live-a/', 'Sun, 06 Sep 2026 12:30:00 GMT', 'Pelit', 'Sonyn uusien lukujen perusteella PlayStationin fyysisten pelilevyjen tuotanto jatkuu odotettua vahvempana.'],
    ['Kotimainen indiepeli palaa retropelien estetiikkaan', 'https://muropaketti.com/pelit/peliuutiset/live-b/', 'Sat, 05 Sep 2026 17:30:00 GMT', 'Pelit', 'Pieni suomalaisstudio rakentaa uuden indiepeliensä 1990-luvun retropelien estetiikan ympärille.'],
  ])],
  ['https://www.inferno.fi/feed', rss([
    ['Kotimainen black metal -yhtye julkaisee uuden levyn', 'https://www.inferno.fi/uutiset/live-a/', 'Sun, 06 Sep 2026 12:15:00 GMT', 'black metal', 'Kotimainen black metal -yhtye on vahvistanut uuden albuminsa julkaisupäivän ja ensimmäisen kappaleen.'],
    ['Progressive metal -yhtye palaa pitkän tauon jälkeen', 'https://www.inferno.fi/uutiset/live-b/', 'Sat, 05 Sep 2026 16:30:00 GMT', 'progressive metal', 'Progressive metal -yhtye kertoo paluunsa taustoista ja tulevan levyn syntyprosessista.'],
  ])],
  ['https://kulttuuritoimitus.fi/feed', rss([
    ['Arkkitehtuurin uusi näyttely tarkastelee muuttuvaa kaupunkia', 'https://kulttuuritoimitus.fi/artikkelit/live-a/', 'Sun, 06 Sep 2026 11:45:00 GMT', 'Arkkitehtuuri', 'Näyttely kokoaa yhteen suunnitelmia, valokuvia ja tutkimusta suomalaisen kaupunkitilan muutoksesta.'],
    ['Kokeellisen musiikin festivaali tuo uusia tekijöitä esiin', 'https://kulttuuritoimitus.fi/artikkelit/live-b/', 'Sat, 05 Sep 2026 15:45:00 GMT', 'Musiikki', 'Kotimainen festivaali nostaa ohjelmassaan esiin pieniä levymerkkejä ja kokeellisen musiikin uusia tekijöitä.'],
  ])],
  ['https://pitchfork.com/feed/feed-news/rss', rss([
    ['Composer announces a new electronic album', 'https://pitchfork.com/news/live-a/', 'Sun, 06 Sep 2026 11:00:00 GMT', 'News', 'The composer has announced an electronic album recorded with a small group of collaborators.'],
    ['Experimental artist shares details of a record', 'https://pitchfork.com/news/live-b/', 'Sat, 05 Sep 2026 18:00:00 GMT', 'News', 'The forthcoming record combines field recordings, electronics, and newly written material.'],
  ])],
  ['https://pitchfork.com/feed/reviews/best/albums/rss', rss([
    ['Ambient composer: Example Album Review', 'https://pitchfork.com/reviews/albums/live-a/', 'Sun, 06 Sep 2026 10:00:00 GMT', 'Best New Music', 'A spacious ambient record brings acoustic instruments into a restrained electronic setting.'],
  ])],
  ['https://pitchfork.com/feed/reviews/best/reissues/rss', rss([
    ['Electronic archive: Example Reissue Review', 'https://pitchfork.com/reviews/albums/live-b/', 'Sun, 06 Sep 2026 09:00:00 GMT', 'Reissues', 'A restored archival release gathers previously difficult-to-find electronic recordings.'],
  ])],
  ['https://thequietus.com/feed/', rss([
    ['A new experimental album &amp; a long-form interview', 'https://thequietus.com/articles/live-a/', 'Sun, 06 Sep 2026 08:00:00 GMT', 'Music', 'The artist discusses a new experimental album, its source material, and the process behind it.'],
    ['Retrospective revisits a post-punk archive', 'https://thequietus.com/articles/live-b/', 'Sat, 05 Sep 2026 14:00:00 GMT', 'Features', 'A retrospective returns to a neglected post-punk catalogue and traces how the records were made.'],
  ])],
  ['https://www.angrymetalguy.com/feed/', rss([
    ['Example Band - Black Metal Album Review', 'https://www.angrymetalguy.com/example-black-metal-review/', 'Sun, 06 Sep 2026 07:30:00 GMT', 'Black Metal', 'A black metal record stretches its arrangements with ambient passages and unusually restrained production.'],
    ['Doom Group - New Doom Metal Review', 'https://www.angrymetalguy.com/example-doom-review/', 'Sat, 05 Sep 2026 13:30:00 GMT', 'Doom Metal', 'The doom metal album builds slow riffs around a sparse vocal performance and a deliberately dry mix.'],
  ])],
  ['https://www.tcj.com/feed/', rss([
    ['Alternative comics artist discusses a new book', 'https://www.tcj.com/live-a/', 'Sun, 06 Sep 2026 07:00:00 GMT', 'Interviews', 'The cartoonist discusses the historical research and visual decisions behind a new book.'],
    ['Review: an unusual new graphic novel', 'https://www.tcj.com/reviews/live-b/', 'Sat, 05 Sep 2026 12:00:00 GMT', 'Reviews', 'The review examines a graphic novel built around an unusual page structure and shifting point of view.'],
  ])],
]);

const mockFeedFetch = () => {
  const original = globalThis.fetch;
  const requested = new Set<string>();
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    requested.add(url);
    const body = feedFixtures.get(url);
    expect(body, `Unexpected feed URL ${url}`).toBeDefined();
    expect(new Headers(init?.headers).get('Accept')).toContain('application/rss+xml');
    return new Response(body, { status: 200, headers: { 'Content-Type': 'application/rss+xml' } });
  };
  return { original, requested };
};

test('Current News API normalizes the verified feeds and Worker serves the route', async () => {
  const { original, requested } = mockFeedFetch();
  try {
    const response = await getNewsResponse();
    const data = (await response.json()) as {
      items: Array<{ id: string; title: string; summary: string; url: string; sourceId: string; category: string; tags: string[] }>;
      sources: Array<{ id: string; status: string; count: number }>;
    };
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('max-age=900');
    expect(data.items.length).toBeGreaterThanOrEqual(16);
    expect(new Set(data.items.map((item) => item.url)).size).toBe(data.items.length);
    expect(new Set(data.items.map((item) => item.sourceId))).toEqual(new Set([
      'soundi', 'pelaaja', 'muropaketti-games', 'inferno', 'kulttuuritoimitus',
      'pitchfork', 'quietus', 'angry-metal-guy', 'comics-journal',
    ]));
    expect(data.items.some((item) => item.title.includes('&'))).toBe(true);
    expect(data.items.every((item) => item.summary.length <= 190 && !item.summary.includes('<'))).toBe(true);
    expect(data.items.some((item) => item.summary.includes('Artistin uusi levy rakentuu'))).toBe(true);
    expect(data.items.some((item) => item.summary.includes('Lue lisää'))).toBe(false);
    expect(data.items.find((item) => item.sourceId === 'pelaaja')?.category).toBe('games');
    expect(data.items.find((item) => item.sourceId === 'muropaketti-games')?.tags).toContain('playstation');
    expect(data.items.find((item) => item.sourceId === 'inferno')?.tags).toContain('black-metal');
    expect(data.items.find((item) => item.sourceId === 'angry-metal-guy')?.tags).toContain('black-metal');
    expect(data.items.find((item) => item.sourceId === 'kulttuuritoimitus')?.category).toBe('architecture');
    expect(data.sources).toHaveLength(9);
    expect(data.sources.every((source) => source.status === 'ok' && source.count > 0)).toBe(true);
    expect(requested).toEqual(new Set(feedFixtures.keys()));

    const env = { ASSETS: { fetch: async (request: Request) => new Response(`asset:${new URL(request.url).pathname}`) } };
    expect((await worker.fetch(new Request('https://aapopihkala.fi/api/current/news'), env)).status).toBe(200);
    const post = await worker.fetch(new Request('https://aapopihkala.fi/api/current/news', { method: 'POST' }), env);
    expect(post.status).toBe(405);
    expect(post.headers.get('allow')).toBe('GET');
  } finally {
    globalThis.fetch = original;
  }
});
