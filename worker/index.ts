import { onRequestGet as getElectricityPriceResponse } from '../functions/api/current/electricity';
import { onRequestGet as getMarketsResponse } from '../functions/api/current/markets';

type AssetsBinding = {
  fetch(request: Request): Promise<Response>;
};

type WorkerEnv = {
  ASSETS: AssetsBinding;
};

const ELECTRICITY_PATH = '/api/current/electricity';
const MARKETS_PATH = '/api/current/markets';

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

    return env.ASSETS.fetch(request);
  },
};

export default worker;
