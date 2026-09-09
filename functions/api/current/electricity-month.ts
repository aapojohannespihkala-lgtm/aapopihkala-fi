type DailyPrice = {
  day?: unknown;
  average?: unknown;
  hours?: unknown;
};

type MonthlyPrice = {
  month?: unknown;
  average?: unknown;
  hours?: unknown;
};

type StatisticsResponse = {
  daily?: unknown;
  monthly?: unknown;
};

const HELSINKI_TIME_ZONE = 'Europe/Helsinki';
const STATISTICS_URL = 'https://parassahko.fi/tilastot/data.json';
const STATISTICS_TIMEOUT_MS = 8_000;

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': status === 200
        ? 'public, max-age=900, s-maxage=3600'
        : 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const localDateFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: HELSINKI_TIME_ZONE,
});

const getLocalDateKey = (date: Date) => {
  const parts = Object.fromEntries(
    localDateFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return `${parts.year ?? '0000'}-${parts.month ?? '00'}-${parts.day ?? '00'}`;
};

const findLatestCompleteMonth = (monthly: unknown[]) => {
  const valid = monthly.flatMap((raw) => {
    if (!raw || typeof raw !== 'object') return [];
    const item = raw as MonthlyPrice;
    if (
      typeof item.month !== 'string' ||
      !isFiniteNumber(item.average)
    ) {
      return [];
    }

    return [{
      month: item.month,
      average: item.average,
      hours: isFiniteNumber(item.hours) ? item.hours : null,
    }];
  });

  return valid.at(-1) ?? null;
};

export const fetchElectricityMonthResponse = async (
  fetchImpl: typeof fetch = fetch,
  timeoutMs = STATISTICS_TIMEOUT_MS
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const upstream = await fetchImpl(STATISTICS_URL, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!upstream.ok) {
      return jsonResponse({ error: 'statistics_unavailable' }, 502);
    }

    const data = (await upstream.json()) as StatisticsResponse;
    const daily = Array.isArray(data.daily) ? data.daily : [];
    const monthly = Array.isArray(data.monthly) ? data.monthly : [];

    const today = getLocalDateKey(new Date());
    const month = today.slice(0, 7);

    const monthDays = daily.flatMap((raw) => {
      if (!raw || typeof raw !== 'object') return [];
      const item = raw as DailyPrice;
      if (
        typeof item.day !== 'string' ||
        !item.day.startsWith(`${month}-`) ||
        item.day >= today ||
        !isFiniteNumber(item.average) ||
        !isFiniteNumber(item.hours) ||
        item.hours <= 0
      ) {
        return [];
      }

      return [{ day: item.day, average: item.average, hours: item.hours }];
    });

    if (monthDays.length > 0) {
      const totalHours = monthDays.reduce((sum, item) => sum + item.hours, 0);
      const weightedTotal = monthDays.reduce(
        (sum, item) => sum + item.average * item.hours,
        0
      );
      const latest = monthDays.at(-1);

      if (totalHours > 0 && latest) {
        return jsonResponse({
          average: weightedTotal / totalHours,
          kind: 'month-to-date',
          month,
          through: latest.day,
          hours: totalHours,
          unit: 'c/kWh',
          vatIncluded: true,
          source: 'ParasSähkö.fi',
          sourceUrl: 'https://parassahko.fi/tilastot',
          underlyingSource: 'Porssisahko.net API',
        }, 200);
      }
    }

    const fallback = findLatestCompleteMonth(monthly);
    if (!fallback) {
      return jsonResponse({ error: 'month_average_unavailable' }, 502);
    }

    return jsonResponse({
      average: fallback.average,
      kind: 'last-complete-month',
      month: fallback.month,
      through: null,
      hours: fallback.hours,
      unit: 'c/kWh',
      vatIncluded: true,
      source: 'ParasSähkö.fi',
      sourceUrl: 'https://parassahko.fi/tilastot',
      underlyingSource: 'Porssisahko.net API',
    }, 200);
  } catch {
    return jsonResponse({ error: 'statistics_unavailable' }, 502);
  } finally {
    clearTimeout(timeout);
  }
};

export const onRequestGet = () => fetchElectricityMonthResponse();
