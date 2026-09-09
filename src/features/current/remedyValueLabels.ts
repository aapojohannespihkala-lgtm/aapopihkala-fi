type PortfolioItem = {
  id?: unknown;
  price?: unknown;
};

type PortfolioResponse = {
  items?: unknown;
};

const API_URL = '/api/current/markets?portfolio=1&v=6';
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

const formatRemedyPrice = (value: number) =>
  `${new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} €`;

const applyRemedyLabel = (price: number) => {
  const formatted = formatRemedyPrice(price);

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

const loadRemedyValue = async () => {
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
};

export const initCurrentRemedyValueLabels = () => {
  const relevantPage =
    document.querySelector('[data-current-snapshot]') ||
    document.querySelector('[data-current-market-performance]');
  if (!relevantPage) return;

  const observer = new MutationObserver(() => {
    const marketsLabel = document.querySelector(
      '[data-market-performance-row="remedy"] .markets-custom-market strong'
    );
    if (marketsLabel) void loadRemedyValue();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  void loadRemedyValue();
  window.setInterval(() => void loadRemedyValue(), REFRESH_INTERVAL_MS);
};
