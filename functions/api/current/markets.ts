type MarketMacroId = 'eur-usd' | 'eur-sek' | 'estr';

type EcbSeries = {
  id: MarketMacroId;
  url: string;
};

const ECB_BASE_URL = 'https://data-api.ecb.europa.eu/service/data';

const SERIES: EcbSeries[] = [
  {
    id: 'eur-usd',
    url: `${ECB_BASE_URL}/EXR/D.USD.EUR.SP00.A?lastNObservations=1&format=csvdata&detail=dataonly`,
  },
  {
    id: 'eur-sek',
    url: `${ECB_BASE_URL}/EXR/D.SEK.EUR.SP00.A?lastNObservations=1&format=csvdata&detail=dataonly`,
  },
  {
    id: 'estr',
    url: `${ECB_BASE_URL}/EST/B.EU000A2X2A25.WT?lastNObservations=1&format=csvdata&detail=dataonly`,
  },
];

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

const parseLatestObservation = (csv: string) => {
  const lines = csv
    .replace(/^\uFEFF/, '')
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);

  if (lines.length < 2) throw new Error('ECB response has no observation');

  const headers = parseCsvLine(lines[0]);
  const row = parseCsvLine(lines.at(-1) ?? '');
  const timeIndex = headers.indexOf('TIME_PERIOD');
  const valueIndex = headers.indexOf('OBS_VALUE');

  if (timeIndex < 0 || valueIndex < 0) throw new Error('ECB response shape changed');

  const observedAt = row[timeIndex];
  const value = Number(row[valueIndex]);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(observedAt ?? '') || !Number.isFinite(value)) {
    throw new Error('ECB observation is invalid');
  }

  return { value, observedAt };
};

const fetchSeries = async (series: EcbSeries) => {
  const response = await fetch(series.url, {
    headers: { Accept: 'text/csv' },
  });

  if (!response.ok) throw new Error(`ECB request failed: ${response.status}`);

  const observation = parseLatestObservation(await response.text());
  return { id: series.id, ...observation };
};

export const onRequestGet = async () => {
  try {
    const items = await Promise.all(SERIES.map(fetchSeries));
    return jsonResponse({ items, source: 'ECB' }, 200);
  } catch {
    return jsonResponse({ error: 'market_macro_unavailable' }, 502);
  }
};
