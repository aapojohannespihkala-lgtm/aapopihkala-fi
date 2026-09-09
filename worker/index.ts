import { onRequestGet as getElectricityPriceResponse } from '../functions/api/current/electricity';
import { onRequestGet as getElectricityMonthResponse } from '../functions/api/current/electricity-month';
import { onRequestGet as getMarketsResponse } from '../functions/api/current/markets-stable';
import { onRequestGet as getPortfolioResponse } from '../functions/api/current/portfolio-complete';
import { onRequestGet as getNewsResponse } from '../functions/api/current/news';
import { onRequestGet as getLiigaResponse } from '../functions/api/current/liiga';

type AssetsBinding = {
  fetch(request: Request): Promise<Response>;
};

type WorkerEnv = {
  ASSETS: AssetsBinding;
};

const ELECTRICITY_PATH = '/api/current/electricity';
const ELECTRICITY_MONTH_PATH = '/api/current/electricity-month';
const MARKETS_PATH = '/api/current/markets';
const NEWS_PATH = '/api/current/news';
const LIIGA_PATH = '/api/current/liiga';

const methodNotAllowed = () =>
  new Response('Method not allowed', {
    status: 405,
    headers: { Allow: 'GET' },
  });

const worker = {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === ELECTRICITY_PATH) {
      if (request.method !== 'GET') return methodNotAllowed();
      return getElectricityPriceResponse();
    }

    if (url.pathname === ELECTRICITY_MONTH_PATH) {
      if (request.method !== 'GET') return methodNotAllowed();
      return getElectricityMonthResponse();
    }

    if (url.pathname === MARKETS_PATH) {
      if (request.method !== 'GET') return methodNotAllowed();
      if (url.searchParams.get('portfolio') === '1') return getPortfolioResponse();
      return getMarketsResponse({ request });
    }

    if (url.pathname === NEWS_PATH) {
      if (request.method !== 'GET') return methodNotAllowed();
      return getNewsResponse();
    }

    if (url.pathname === LIIGA_PATH) {
      if (request.method !== 'GET') return methodNotAllowed();
      return getLiigaResponse();
    }

    return env.ASSETS.fetch(request);
  },
};

export default worker;
