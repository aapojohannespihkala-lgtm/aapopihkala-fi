type PortfolioItem = {
  id?: unknown;
  price?: unknown;
};

type PortfolioResponse = {
  items?: unknown;
};

const API_URL = '/api/current/markets?portfolio=1&v=6';
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const READY_RETRY_MS = 50;
const READY_RETRY_LIMIT = 40;

const formatRemedyPrice = (value: number) =>
  `${new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} €`;

const applySnapshotRemedyLabel = (formatted: string) => {
  const snapshotValue = document.querySelector<HTMLElement>('[data-snapshot-market="remedy"]');
  const snapshotLabel = snapshotValue
    ?.closest<HTMLElement>('.snapshot-market-row')
    ?.querySelector<HTMLElement>('[role="rowheader"]');

  if (snapshotLabel) snapshotLabel.textContent = `REMEDY ${formatted}`;
};

const applyMarketsRemedyLabelWhenReady = (
  formatted: string,
  attempt = 0
) => {
  const marketRoot = document.querySelector<HTMLElement>('[data-current-market-performance]');
  if (!marketRoot) return;

  const table = marketRoot.querySelector<HTMLElement>('.markets-custom-table');
  if (table?.dataset.portfolioRowsReady === 'true') {
    const label = table.querySelector<HTMLElement>(
      '[data-market-performance-row="remedy"] .markets-custom-market strong'
    );
    if (label) label.textContent = `Remedy ${formatted}`;
    return;
  }

  if (attempt >= READY_RETRY_LIMIT) return;
  window.setTimeout(
    () => applyMarketsRemedyLabelWhenReady(formatted, attempt + 1),
    READY_RETRY_MS
  );
};

const applyRemedyLabel = (price: number) => {
  const formatted = formatRemedyPrice(price);
  applySnapshotRemedyLabel(formatted);
  applyMarketsRemedyLabelWhenReady(formatted);
};

export const initCurrentRemedyValueLabels = () => {
  const relevantPage =
    document.querySelector('[data-current-snapshot]') ||
    document.querySelector('[data-current-market-performance]');
  if (!relevantPage) return;

  const load = async () => {
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
      applyRemedyLabel(remedy.price);
    } catch {
      // Keep the normal Remedy label if live value data is unavailable.
    }
  };

  void load();
  window.setInterval(() => void load(), REFRESH_INTERVAL_MS);
};
