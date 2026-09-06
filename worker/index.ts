import { onRequestGet as getElectricityPriceResponse } from '../functions/api/current/electricity';
import { onRequestGet as getMarketsResponse } from '../functions/api/current/markets';
import { onRequestGet as getNewsResponse } from '../functions/api/current/news';

type AssetsBinding = {
  fetch(request: Request): Promise<Response>;
};

type WorkerEnv = {
  ASSETS: AssetsBinding;
};

const ELECTRICITY_PATH = '/api/current/electricity';
const MARKETS_PATH = '/api/current/markets';
const NEWS_PATH = '/api/current/news';

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

    if (url.pathname === MARKETS_PATH) {
      if (request.method !== 'GET') return methodNotAllowed();
      return getMarketsResponse();
    }

    if (url.pathname === NEWS_PATH) {
      if (request.method !== 'GET') return methodNotAllowed();
      return getNewsResponse();
    }

    return env.ASSETS.fetch(request);
  },
};

export default worker;
