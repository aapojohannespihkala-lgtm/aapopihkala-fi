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

const compareReturn = (
  latest: Observation, history: Observation[], days: number, maxLagDays = Infinity,
) => {
  const target = Date.parse(`${latest.observedAt}T00:00:00Z`) - days * DAY_MS;
  const older = history.filter((item) => Date.parse(`${item.observedAt}T00:00:00Z`) <= target).at(-1);
  if (!older || older.value <= 0) return null;
  // A sparse history must not turn a much older NAV into a claimed period return.
  // A three-calendar-day grace period covers weekends around a 7-day reference.
  if ((target - Date.parse(`${older.observedAt}T00:00:00Z`)) / DAY_MS > maxLagDays) return null;
  return (latest.value / older.value - 1) * 100;
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
  // Previous trading-day NAV can span a weekend/holiday, not an arbitrary gap.
  const previousGapDays = prior
    ? (Date.parse(`${latest.observedAt}T00:00:00Z`) - Date.parse(`${prior.observedAt}T00:00:00Z`)) / DAY_MS
    : Infinity;
  if (prior && prior.value > 0 && previousGapDays >= 1 && previousGapDays <= 4) {
    changes.today = (latest.value / prior.value - 1) * 100;
  }
  changes.week1 = compareReturn(latest, history, 7, 3);
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
  const name = spec.id === 'storebrand-japan' ? 'Storebrand Japan A EUR' : 'Nordnet Suomi Indeksi';
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
  if (changes.today === null && changes.year1 === null) return null;
  void escaped;
  return { id: spec.id, label: spec.label, symbol: spec.isin, price, observedAt: obs, changes };
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
  if (spec.investing) {
    for (const url of [spec.investing, `https://r.jina.ai/${spec.investing}`]) {
      try {
        const result = buildRecoveredHistoricalFund(
          spec, parseInvestingFundHistory(await fetchText(url), spec.isin), now,
        );
        if (result) return result;
      } catch {
        // Try another public source instead of fabricating the missing row.
      }
    }
  }
  if (spec.nordnet) {
    for (const url of [spec.nordnet, `https://r.jina.ai/${spec.nordnet}`]) {
      try {
        const result = parseNordnetPublicFund(await fetchText(url), spec, now);
        if (result) return result;
      } catch {
        // Keep an unverified or stale share class absent from live data.
      }
    }
  }
  return null;
};
