type PriceEntry = {
  price: number;
  startDate: string;
  endDate: string;
};

type PriceResponse = {
  prices: PriceEntry[];
};

const UPSTREAM_PRICE_URL = 'https://api.porssisahko.net/v2/latest-prices.json';

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });

const isPriceResponse = (value: unknown): value is PriceResponse => {
  if (!value || typeof value !== 'object') return false;

  const prices = (value as { prices?: unknown }).prices;
  if (!Array.isArray(prices) || prices.length === 0) return false;

  return prices.every((entry) => {
    if (!entry || typeof entry !== 'object') return false;

    const candidate = entry as Partial<PriceEntry>;
    return (
      typeof candidate.price === 'number' &&
      Number.isFinite(candidate.price) &&
      typeof candidate.startDate === 'string' &&
      typeof candidate.endDate === 'string'
    );
  });
};

export const onRequestGet = async () => {
  try {
    const upstreamResponse = await fetch(UPSTREAM_PRICE_URL, {
      headers: { Accept: 'application/json' },
    });

    if (!upstreamResponse.ok) {
      return jsonResponse({ error: 'upstream_unavailable' }, 502);
    }

    const data: unknown = await upstreamResponse.json();
    if (!isPriceResponse(data)) {
      return jsonResponse({ error: 'invalid_upstream_data' }, 502);
    }

    return jsonResponse(data, 200);
  } catch {
    return jsonResponse({ error: 'upstream_unavailable' }, 502);
  }
};
