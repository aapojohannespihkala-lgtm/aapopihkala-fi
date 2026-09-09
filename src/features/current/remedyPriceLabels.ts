type PortfolioItem = {
  id?: unknown;
  price?: unknown;
};

type PortfolioResponse = {
  items?: unknown;
};

const API_URL = '/api/current/markets?portfolio=1&v=6';
const SNAPSHOT_REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const MARKETS_REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const TARGET_PATHS = new Set(['/current/snapshot/', '/current/markets/']);

const formatRemedyPrice = (value: number) =>
  new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const setRemedyLabel = (price: number) => {
  const formatted = `${formatRemedyPrice(price)} €`;

  const snapshotValue = document.querySelector<HTMLElement>('[data-snapshot-market="remedy"]');
  const snapshotLabel = snapshotValue
    ?.closest<HTMLElement>('.snapshot-market-row')
    ?.querySelector<HTMLElement>('[role="rowheader"]');
  if (snapshotLabel) snapshotLabel.textContent = `REMEDY ${formatted}`;

  const marketsLabel = document.querySelector<HTMLElement>(
    '[data-market-performance-row="remedy"] .markets-custom-market strong'
  );
  if (marketsLabel) marketsLabel.textContent = `Remedy ${formatted}`;
};

export const initRemedyPriceLabels = () => {
  if (!TARGET_PATHS.has(window.location.pathname)) return;

  let loading = false;

  const load = async () => {
    if (loading) return;
    loading = true;

    try {
      const response = await fetch(API_URL, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!response.ok) return;

      const data = (await response.json()) as PortfolioResponse;
      if (!Array.isArray(data.items)) return;

      const remedy = data.items.find((raw) => {
        if (!raw || typeof raw !== 'object') return false;
        return (raw as PortfolioItem).id === 'remedy';
      }) as PortfolioItem | undefined;

      if (typeof remedy?.price !== 'number' || !Number.isFinite(remedy.price)) return;
      setRemedyLabel(remedy.price);
    } catch {
      // Keep the existing label if the portfolio feed is unavailable.
    } finally {
      loading = false;
    }
  };

  void load();

  const interval = window.location.pathname === '/current/snapshot/'
    ? SNAPSHOT_REFRESH_INTERVAL_MS
    : MARKETS_REFRESH_INTERVAL_MS;
  window.setInterval(load, interval);

  if (window.location.pathname === '/current/snapshot/') {
    document.querySelector('[data-snapshot-refresh]')?.addEventListener('click', () => void load());
  }
};
