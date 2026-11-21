// Independent read-only public-source recovery when Yahoo/Nordnet screening
// cannot produce a fund. Never seed missing prices from hard-coded examples.
type Period = 'today' | 'week1' | 'month1' | 'month3' | 'month6' | 'ytd' | 'year1' | 'year3' | 'year5';
type Observation = { observedAt: string; value: number };
type RecoveredFund = {
  id: string;
  label: string;
  symbol: string;
  price: number;
  observedAt: string;
  changes: Record<Period, number | null>;
};

type FundSpec = {
  id: 'handelsbanken-usa' | 'nordnet-finland' | 'storebrand-japan';
  label: string;
  isin: string;
  investing?: string;
  nordnet?: string;
};

const SPECS: FundSpec[] = [
  {
    id: 'handelsbanken-usa',
    label: 'HANDELSBANKEN USA INDEKSI',
    isin: 'SE0006800140',
    investing: 'https://fi.investing.com/funds/usa-index-a1-eur-historical-data',
    nordnet: 'https://www.nordnet.se/fonder/lista/handelsbanken-usa-index-a1-eur-348def3b',
  },
  {
    id: 'nordnet-finland',
    label: 'NORDNET SUOMI INDEKSI',
    isin: 'SE0005993102',
    investing: 'https://fi.investing.com/funds/nordnet-superrahasto-suomi-historical-data',
    nordnet: 'https://www.nordnet.fi/rahastot/lista/nordnet-suomi-indeksi-eur-a401761d',
  },
  {
    id: 'storebrand-japan',
    label: 'STOREBRAND JAPAN A EUR',
    isin: 'SE0013801479',
    nordnet: 'https://www.nordnet.fi/rahastot/lista/storebrand-japan-a-eur-dbe9644c',
  },
];

const DAY_MS = 86_400_000;
const FETCH_TIMEOUT_MS = 2_500;
const MAX_AGE_DAYS = 10;
const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const emptyChanges = (): Record<Period, number | null> => ({
  today: null, week1: null, month1: null, month3: null, month6: null,
  ytd: null, year1: null, year3: null, year5: null,
});

const numberValue = (value: string) => {
  const token = value.trim().replace(/\s/g, '');
  const numeric = Number(token.includes(',') && token.includes('.')
    ? token.lastIndexOf(',') > token.lastIndexOf('.')
      ? token.replace(/\./g, '').replace(',', '.')
      : token.replace(/,/g, '')
    : token.replace(',', '.'));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const dateFromToken = (raw: string) => {
  const numeric = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  const english = raw.match(/^([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})$/);
  const year = numeric ? Number(numeric[3]) : english ? Number(english[3]) : 0;
  const month = numeric ? Number(numeric[2]) : english ? MONTHS[english[1].toLowerCase()] : 0;
  const day = numeric ? Number(numeric[1]) : english ? Number(english[2]) : 0;
  if (!year || !month || !day) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day ? date.toISOString().slice(0, 10) : null;
};

const asText = (html: string) => html
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&minus;|&#8722;|&#x2212;/gi, '-')
  .replace(/\s+/g, ' ').trim();

export const parseInvestingFundHistory = (body: string, isin: string): Observation[] => {
  const text = asText(body);
  if (!new RegExp(`\\b${isin}\\b`).test(text)) return [];
  const section = text.match(/(?:Historical Data|historialliset tiedot)[\s\S]{0,15000}/i)?.[0] ?? text;
  const rows = new Map<string, number>();
  // Supports Finnish DD.MM.YYYY, English "Nov 20, 2026" and whitespace- or pipe-separated tables.
  const rx = /(\d{1,2}\.\d{1,2}\.\d{4}|[A-Za-z]{3}\s+\d{1,2},?\s+\d{4})\s*(?:\|\s*)?([\d][\d.,]*)(?:\s|\|)/g;
  for (const match of section.matchAll(rx)) {
    const date = dateFromToken(match[1]);
    const nav = numberValue(match[2]);
    if (date && nav !== null) rows.set(date, nav);
  }
  return [...rows].map(([observedAt, value]) => ({ observedAt, value }))
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt));
};

const verifyFresh = (date: string, now: Date) => {
  const millis = Date.parse(`${date}T00:00:00Z`);
  const age = now.getTime() - millis;
  return Number.isFinite(millis) && age >= -DAY_MS && age <= MAX_AGE_DAYS * DAY_MS;
};

const compareReturn = (latest: Observation, history: Observation[], days: number) => {
  const target = Date.parse(`${latest.observedAt}T00:00:00Z`) - days * DAY_MS;
  const older = history.filter((item) => Date.parse(`${item.observedAt}T00:00:00Z`) <= target).at(-1);
  return older && older.value > 0 ? (latest.value / older.value - 1) * 100 : null;
};

export const buildRecoveredHistoricalFund = (
  spec: Pick<FundSpec, 'id' | 'label' | 'isin'>,
  history: Observation[],
  now = new Date(),
): RecoveredFund | null => {
  const latest = history.at(-1);
  if (!latest || history.length < 2 || !verifyFresh(latest.observedAt, now)) return null;
  const changes = emptyChanges();
  const prior = history.at(-2);
  if (prior && prior.value > 0) changes.today = (latest.value / prior.value - 1) * 100;
  changes.week1 = compareReturn(latest, history, 7);
  changes.month1 = compareReturn(latest, history, 30);
  changes.month3 = compareReturn(latest, history, 92);
  changes.month6 = compareReturn(latest, history, 183);
  const latestDate = new Date(`${latest.observedAt}T00:00:00Z`);
  const ytdDays = Math.ceil((latestDate.getTime() - Date.UTC(latestDate.getUTCFullYear(), 0, 1)) / DAY_MS);
  changes.ytd = compareReturn(latest, history, ytdDays);
  changes.year1 = compareReturn(latest, history, 365);
  changes.year3 = compareReturn(latest, history, 1095);
  changes.year5 = compareReturn(latest, history, 1826);
  return { id: spec.id, label: spec.label, symbol: spec.isin,
    price: latest.value, observedAt: latest.observedAt, changes };
};

export const parseNordnetPublicFund = (
  html: string,
  spec: FundSpec,
  now = new Date(),
): RecoveredFund | null => {
  const text = asText(html);
  // Nordnet public fund pages do not always print the ISIN. Match exact fund
  // class and currency to avoid combining another share class with this row.
  const name = spec.id === 'storebrand-japan'
    ? 'Storebrand Japan A EUR'
    : spec.id === 'handelsbanken-usa'
      ? 'Handelsbanken USA Index (A1 EUR)'
      : 'Nordnet Suomi Indeksi';
  if (!text.toLowerCase().includes(name.toLowerCase())) return null;
  const match = text.match(/NAV\s*\((\d{1,2})\.(\d{1,2})\.\)\s*([\d.,]+)\s*EUR/i);
  if (!match) return null;
  let year = now.getUTCFullYear();
  let obs = dateFromToken(`${match[1]}.${match[2]}.${year}`);
  if (!obs) return null;
  if (Date.parse(`${obs}T00:00:00Z`) > now.getTime() + DAY_MS) {
    year -= 1;
    obs = dateFromToken(`${match[1]}.${match[2]}.${year}`);
  }
  const price = numberValue(match[3]);
  if (!obs || price === null || !verifyFresh(obs, now)) return null;
  const changes = emptyChanges();
  const escaped = name.replace(/[.*+?^$()|[\]{}\\]/g, '\\$&');
  const day = text.match(new RegExp(`([+\\-]?\\d+(?:[.,]\\d+)?)%\\s*${match[1]}\\.${match[2]}\\.`));
  const yearReturn = text.match(/([+\-]?\d+(?:[.,]\d+)?)%\s*12\s*kk/i);
  if (day) changes.today = Number(day[1].replace(',', '.'));
  if (yearReturn) changes.year1 = Number(yearReturn[1].replace(',', '.'));
  // A dated, source-verified NAV is still useful when daily returns are not published.
  // Never invent 1D/1W/1M figures from one quote.
  void escaped;
  return { id: spec.id, label: spec.label, symbol: spec.isin, price, observedAt: obs, changes };
};


// Nordnet renders the selected share class as escaped, structured hydration
// JSON in its public page HTML. The old screening API now returns HTTP 404.
// Bind NAV and returns to the nearest exact ISIN/currency before accepting.
export const parseNordnetEmbeddedFund = (
  html: string,
  spec: { id: string; label: string; isin: string },
  now = new Date(),
): RecoveredFund | null => {
  if (!html.includes(spec.isin) || html.length > 2_000_000) return null;
  const marker = '"navInfo":{';
  const expectedCurrency = spec.id === 'nordnet-sweden' || spec.id === 'spiltan-investmentbolag'
    ? 'SEK' : 'EUR';
  let startAt = 0;
  let inspected = 0;
  // Decode only a small neighborhood around each fund payload. A 1.3 MB
  // Nordnet page must not be fully unescaped in Cloudflare's CPU budget.
  while (inspected++ < 50) {
    const foundAt = html.indexOf('navInfo', startAt);
    if (foundAt < 0) break;
    startAt = foundAt + 'navInfo'.length;
    const decode = (part: string) => part.replace(/\\+"/g, '"').replace(/&quot;/g, '"');
    const before = decode(html.slice(Math.max(0, foundAt - 6_000), foundAt));
    const decoded = before + decode(html.slice(foundAt, foundAt + 5_000));
    // Anchor to THIS navInfo, not an earlier adjacent fund's object.
    const from = decoded.indexOf(marker, Math.max(0, before.length - 4));
    if (from < 0) continue;
    const context = decoded.slice(0, from);
    const allIsins = [...context.matchAll(/"isin":"([A-Z0-9]+)"/g)];
    const nearestIsin = allIsins.at(-1)?.[1];
    const currencies = [...context.matchAll(/"currency":"([A-Z]{3})"/g)];
    const nearestCurrency = currencies.at(-1)?.[1];
    if (nearestIsin === spec.isin && nearestCurrency === expectedCurrency) {
      const slice = decoded.slice(from, from + 4_500);
      const nav = slice.match(/"latestNav":\{"date":"(\d{4}-\d{2}-\d{2})","value":(-?\d+(?:\.\d+)?)/);
      if (!nav || !verifyFresh(nav[1], now)) return null;
      const price = Number(nav[2]);
      if (!Number.isFinite(price) || price <= 0) return null;
      const changes = emptyChanges();
      const returnsBlock = slice.match(/"returns":\[([^\]]*)\]/);
      if (returnsBlock) {
        try {
          const entries: unknown = JSON.parse('[' + returnsBlock[1] + ']');
          if (Array.isArray(entries)) {
            const periodMap: Record<string, Period> = {
              DAY_1: 'today', WEEK_1: 'week1', MONTH_1: 'month1',
              MONTH_3: 'month3', MONTH_6: 'month6', YTD: 'ytd',
              YEAR_1: 'year1', YEAR_3: 'year3', YEAR_5: 'year5',
            };
            for (const entry of entries) {
              if (!entry || typeof entry !== 'object') continue;
              const value = entry as Record<string, unknown>;
              if (typeof value.period !== 'string') continue;
              const period = periodMap[value.period];
              if (period && typeof value.development === 'number' &&
                  Number.isFinite(value.development)) {
                changes[period] = value.development;
              }
            }
          }
        } catch {
          // Preserve the verified NAV if the optional returns payload changes.
        }
      }
      return { id: spec.id, label: spec.label, symbol: spec.isin,
        price, observedAt: nav[1], changes };
    }
  }
  return null;
};

// Nordnet's own fund-company page publishes a dated NAV for its Suomi fund.
// This source is independent from the public screening API and Investing pages.
export const parseNordnetManagerNav = (html: string, now = new Date()): RecoveredFund | null => {
  const name = 'Nordnet Suomi Indeksi';
  const isin = 'SE0005993102';
  // Match a single HTML table row, or a single Markdown table row from the
  // text-reader fallback. Do not accidentally borrow the NEXT fund's NAV.
  const rows = [...(html.match(/<tr\b[\s\S]*?<\/tr>/gi) ?? []), ...html.split(/\r?\n/)];
  const row = rows.find((candidate) => {
    const text = asText(candidate);
    return text.toLowerCase().includes(name.toLowerCase()) && text.includes(isin);
  });
  if (!row) return null;
  const text = asText(row);
  const isinIndex = text.indexOf(isin);
  const match = text.slice(isinIndex + isin.length)
    .match(/(\d{1,6}[.,]\d{2,4})\s*(\d{1,2})\/(\d{1,2})\b/);
  if (!match) return null;
  const price = numberValue(match[1]);
  if (price === null) return null;
  let year = now.getUTCFullYear();
  let observedAt = dateFromToken(`${match[2]}.${match[3]}.${year}`);
  if (!observedAt) return null;
  if (Date.parse(`${observedAt}T00:00:00Z`) > now.getTime() + DAY_MS) {
    year -= 1;
    observedAt = dateFromToken(`${match[2]}.${match[3]}.${year}`);
  }
  if (!observedAt || !verifyFresh(observedAt, now)) return null;
  return {
    id: 'nordnet-finland', label: 'NORDNET SUOMI INDEKSI', symbol: isin,
    price, observedAt, changes: emptyChanges(),
  };
};

const fetchText = async (url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<string> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: {
      Accept: 'text/html,text/plain;q=0.9',
      'User-Agent': 'Mozilla/5.0 (compatible; aapopihkala.fi/1.0)',
    } });
    if (!response.ok) throw new Error(`source returned HTTP ${response.status}`);
    const length = Number(response.headers.get('content-length'));
    if (length > 2_000_000) throw new Error('fund page exceeds safe byte limit');
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
};

export const recoverMissingFund = async (id: FundSpec['id'], now = new Date()) => {
  const spec = SPECS.find((candidate) => candidate.id === id);
  if (!spec) return null;

  // Try the presently reachable fund's structured public page before
  // Investing.com's blocked 403 and the retired Nordnet screening 404 API.
  if (spec.nordnet) {
    for (const url of [spec.nordnet, 'https://r.jina.ai/' + spec.nordnet]) {
      try {
        const html = await fetchText(url, 7_000);
        const structured = parseNordnetEmbeddedFund(html, spec, now);
        if (structured) return structured;
        const visible = parseNordnetPublicFund(html, spec, now);
        if (visible) return visible;
      } catch {
        // Try the next independently validated source.
      }
    }
  }
  if (id === 'nordnet-finland') {
    for (const url of ['https://nordnetab.com/funds/our-funds/',
      'https://r.jina.ai/https://nordnetab.com/funds/our-funds/']) {
      try {
        const result = parseNordnetManagerNav(await fetchText(url), now);
        if (result) return result;
      } catch {
        // Try historical fund-price data if the fund company's NAV is stale.
      }
    }
  }
  if (spec.investing) {
    for (const url of [spec.investing, 'https://r.jina.ai/' + spec.investing]) {
      try {
        const result = buildRecoveredHistoricalFund(
          spec, parseInvestingFundHistory(await fetchText(url), spec.isin), now,
        );
        if (result) return result;
      } catch {
        // Keep unavailable or mismatched rows missing, never invent values.
      }
    }
  }
  return null;
};

// Independently recover only truly missing Nordnet/Spiltan return periods.
const PERIOD_RECOVERY_SPECS = [
  { id: 'nordnet-sweden', label: 'NORDNET SVERIGE INDEX',
    isin: 'SE0002756973',
    url: 'https://www.nordnet.se/fonder/lista/nordnet-sverige-index-sek-aa7a9014' },
  { id: 'spiltan-investmentbolag', label: 'SPILTAN AKTIEFOND INVESTMENTBOLAG',
    isin: 'SE0004297927',
    url: 'https://www.nordnet.se/fonder/lista/spiltan-aktiefond-investmentbolag-sek-d8fe1a7e' },
] as const;

export const recoverNordicReturnPeriods = async (
  id: 'nordnet-sweden' | 'spiltan-investmentbolag',
  now = new Date(),
) => {
  const spec = PERIOD_RECOVERY_SPECS.find((candidate) => candidate.id === id);
  if (!spec) return null;
  try {
    return parseNordnetEmbeddedFund(await fetchText(spec.url, 7_000), spec, now);
  } catch {
    return null;
  }
};
