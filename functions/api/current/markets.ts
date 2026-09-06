type MarketMacroId = 'eur-usd' | 'euribor-3m';

type Observation = {
  value: number;
  observedAt: string;
};

type MarketMacroItem = Observation & {
  id: MarketMacroId;
  change1m: number;
};

const ECB_BASE_URL = 'https://data-api.ecb.europa.eu/service/data';
const EUR_USD_URL = `${ECB_BASE_URL}/EXR/D.USD.EUR.SP00.A?lastNObservations=23&format=csvdata&detail=dataonly`;
const EURIBOR_URL =
  'https://www.suomenpankki.fi/en/statistics/interest-rates-and-exchange-rates/euribor-rates/';
const DAY_MS = 24 * 60 * 60 * 1000;

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=900, s-maxage=900, stale-while-revalidate=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });

const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (character === ',' && !quoted) {
      values.push(current);
      current = '';
      continue;
    }

    current += character;
  }

  values.push(current);
  return values;
};

const parseEcbObservations = (csv: string): Observation[] => {
  const lines = csv
    .replace(/^\uFEFF/, '')
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);

  if (lines.length < 2) throw new Error('ECB response has no observations');

  const headers = parseCsvLine(lines[0]);
  const timeIndex = headers.indexOf('TIME_PERIOD');
  const valueIndex = headers.indexOf('OBS_VALUE');

  if (timeIndex < 0 || valueIndex < 0) throw new Error('ECB response shape changed');

  const observations = lines.slice(1).flatMap((line) => {
    const row = parseCsvLine(line);
    const observedAt = row[timeIndex];
    const value = Number(row[valueIndex]);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(observedAt ?? '') || !Number.isFinite(value)) return [];
    return [{ value, observedAt }];
  });

  if (observations.length < 2) throw new Error('ECB response has too few observations');
  return observations.sort((a, b) => a.observedAt.localeCompare(b.observedAt));
};

const fetchEurUsd = async (): Promise<MarketMacroItem> => {
  const response = await fetch(EUR_USD_URL, {
    headers: { Accept: 'text/csv' },
  });

  if (!response.ok) throw new Error(`ECB request failed: ${response.status}`);

  const observations = parseEcbObservations(await response.text());
  const first = observations[0];
  const latest = observations.at(-1);

  if (!first || !latest || first.value === 0) throw new Error('ECB observations are invalid');

  return {
    id: 'eur-usd',
    ...latest,
    change1m: (latest.value / first.value - 1) * 100,
  };
};

const htmlToText = (html: string) =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&#43;|&#x2b;/gi, '+')
    .replace(/&minus;|&#8722;|&#x2212;/gi, '-')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();

const MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

const toIsoDate = (day: string, month: string, year: string) => {
  const monthIndex = MONTHS[month];
  if (monthIndex === undefined) throw new Error('Bank of Finland date is invalid');
  return new Date(Date.UTC(Number(year), monthIndex, Number(day))).toISOString().slice(0, 10);
};

const parseEuribor3mObservations = (html: string): Observation[] => {
  const text = htmlToText(html);
  const rowPattern =
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)/g;
  const byDate = new Map<string, Observation>();

  for (const match of text.matchAll(rowPattern)) {
    const observedAt = toIsoDate(match[1], match[2], match[3]);
    const value = Number(match[6]);
    if (Number.isFinite(value)) byDate.set(observedAt, { observedAt, value });
  }

  const observations = [...byDate.values()].sort((a, b) => a.observedAt.localeCompare(b.observedAt));
  if (observations.length < 2) throw new Error('Bank of Finland response has too few Euribor observations');
  return observations;
};

const findOneMonthReference = (observations: Observation[]) => {
  const latest = observations.at(-1);
  if (!latest) throw new Error('Euribor latest observation is missing');

  const latestTime = Date.parse(`${latest.observedAt}T00:00:00Z`);
  const targetTime = latestTime - 30 * DAY_MS;
  const candidates = observations.filter((item) => item.observedAt !== latest.observedAt);

  const reference = candidates.reduce<Observation | undefined>((best, item) => {
    if (!best) return item;
    const itemDistance = Math.abs(Date.parse(`${item.observedAt}T00:00:00Z`) - targetTime);
    const bestDistance = Math.abs(Date.parse(`${best.observedAt}T00:00:00Z`) - targetTime);
    return itemDistance < bestDistance ? item : best;
  }, undefined);

  if (!reference) throw new Error('Euribor reference observation is missing');

  const referenceTime = Date.parse(`${reference.observedAt}T00:00:00Z`);
  if (latestTime - referenceTime < 20 * DAY_MS) {
    throw new Error('Euribor history does not cover one month');
  }

  return { latest, reference };
};

const fetchEuribor3m = async (): Promise<MarketMacroItem> => {
  const response = await fetch(EURIBOR_URL, {
    headers: { Accept: 'text/html' },
  });

  if (!response.ok) throw new Error(`Bank of Finland request failed: ${response.status}`);

  const observations = parseEuribor3mObservations(await response.text());
  const { latest, reference } = findOneMonthReference(observations);

  return {
    id: 'euribor-3m',
    ...latest,
    change1m: latest.value - reference.value,
  };
};

export const onRequestGet = async () => {
  try {
    const items = await Promise.all([fetchEurUsd(), fetchEuribor3m()]);
    return jsonResponse({ items, source: 'ECB + Bank of Finland' }, 200);
  } catch {
    return jsonResponse({ error: 'market_macro_unavailable' }, 502);
  }
};
