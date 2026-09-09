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

export const initCurrentRemedyValueLabels = () => {
  const relevantPage =
    document.querySelector('[data-current-snapshot]') ||
    document.querySelector('[data-current-market-performance]');
  if (!relevantPage) return;

  let remedyPrice: number | null = null;

  const observer = new MutationObserver(() => {
    if (remedyPrice !== null) applyRemedyLabel(remedyPrice);
  });
  observer.observe(document.body, { childList: true, subtree: true });

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
      remedyPrice = remedy.price;
      applyRemedyLabel(remedyPrice);
    } catch {
      // Keep the normal Remedy label if live value data is unavailable.
    }
  };

  void load();
  window.setInterval(() => void load(), REFRESH_INTERVAL_MS);
};
