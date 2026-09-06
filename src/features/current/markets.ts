type MarketMacroId = 'eur-usd' | 'euribor-3m';

type MacroItem = {
  id: MarketMacroId;
  value: number;
  observedAt: string;
  change1m: number;
};

type MarketsResponse = {
  items?: unknown;
};

const MARKETS_API_URL = '/api/current/markets';
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const MARKET_IDS = new Set<MarketMacroId>(['eur-usd', 'euribor-3m']);

const isMacroItem = (value: unknown): value is MacroItem => {
  if (!value || typeof value !== 'object') return false;

  const item = value as Partial<MacroItem>;
  return (
    typeof item.id === 'string' &&
    MARKET_IDS.has(item.id as MarketMacroId) &&
    typeof item.value === 'number' &&
    Number.isFinite(item.value) &&
    typeof item.change1m === 'number' &&
    Number.isFinite(item.change1m) &&
    typeof item.observedAt === 'string' &&
    item.observedAt.length > 0
  );
};

const formatValue = (id: MarketMacroId, value: number) => {
  const decimals = id === 'euribor-3m' ? 3 : 4;

  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

const formatChange = (item: MacroItem) => {
  if (item.id === 'eur-usd') {
    const magnitude = Math.abs(item.change1m).toFixed(2);
    if (Math.abs(item.change1m) < 0.005) return `FLAT · ${magnitude}% / 1M`;
    return `${item.change1m > 0 ? 'EUR' : 'USD'} STRONGER · ${magnitude}% / 1M`;
  }

  const sign = item.change1m > 0 ? '+' : '';
  return `${sign}${item.change1m.toFixed(3)} PP / 1M`;
};

export const initCurrentMarkets = () => {
  const root = document.querySelector<HTMLElement>('[data-current-markets]');
  if (!root || root.dataset.marketsInitialized === 'true') return;
  root.dataset.marketsInitialized = 'true';

  const errorTarget = root.querySelector<HTMLElement>('[data-markets-error]');
  const retryButton = root.querySelector<HTMLButtonElement>('[data-markets-retry]');
  const observationTarget = root.querySelector<HTMLElement>('[data-markets-observation]');

  const renderItems = (items: MacroItem[]) => {
    for (const item of items) {
      const target = root.querySelector<HTMLElement>(`[data-market-value="${item.id}"]`);
      if (target) target.textContent = formatValue(item.id, item.value);

      const changeTarget = root.querySelector<HTMLElement>(`[data-market-change="${item.id}"]`);
      if (changeTarget) changeTarget.textContent = formatChange(item);
    }

    const latestObservation = items
      .map((item) => item.observedAt)
      .sort()
      .at(-1);

    if (observationTarget && latestObservation) {
      observationTarget.textContent = latestObservation;
    }
  };

  const loadMarkets = async () => {
    root.setAttribute('aria-busy', 'true');
    if (errorTarget) errorTarget.hidden = true;

    try {
      const response = await fetch(MARKETS_API_URL, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) throw new Error(`Markets request failed: ${response.status}`);

      const data = (await response.json()) as MarketsResponse;
      if (!Array.isArray(data.items)) throw new Error('Markets response contained no data');

      const items = data.items.filter(isMacroItem);
      if (items.length !== MARKET_IDS.size) throw new Error('Markets response was incomplete');

      renderItems(items);
      root.setAttribute('aria-busy', 'false');

      window.dispatchEvent(
        new CustomEvent('current:data-updated', {
          detail: { source: 'markets', at: new Date().toISOString() },
        })
      );
    } catch {
      root.setAttribute('aria-busy', 'false');
      if (errorTarget) errorTarget.hidden = false;
    }
  };

  retryButton?.addEventListener('click', loadMarkets);

  void loadMarkets();
  window.setInterval(loadMarkets, REFRESH_INTERVAL_MS);
};
