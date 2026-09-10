import { onRequestGet as getElectricityPriceResponse } from '../functions/api/current/electricity';
import { onRequestGet as getElectricityMonthResponse } from '../functions/api/current/electricity-month';
import { fetchHslDeparturesResponse } from '../functions/api/current/hsl';
import { onRequestGet as getMarketsResponse } from '../functions/api/current/markets-stable';
import { onRequestGet as getPortfolioResponse } from '../functions/api/current/portfolio-complete';
import { onRequestGet as getNewsResponse } from '../functions/api/current/news';
import { onRequestGet as getLiigaResponse } from '../functions/api/current/liiga';
import { onRequestGet as getLiigaScheduleResponse } from '../functions/api/current/liiga-schedule';

type AssetsBinding = {
  fetch(request: Request): Promise<Response>;
};

type WorkerEnv = {
  ASSETS: AssetsBinding;
  DIGITRANSIT_API_KEY?: string;
};

const ELECTRICITY_PATH = '/api/current/electricity';
const ELECTRICITY_MONTH_PATH = '/api/current/electricity-month';
const HSL_PATH = '/api/current/hsl';
const MARKETS_PATH = '/api/current/markets';
const NEWS_PATH = '/api/current/news';
const LIIGA_PATH = '/api/current/liiga';
const LIIGA_SCHEDULE_PATH = '/api/current/liiga-schedule';

const methodNotAllowed = (allow = 'GET') =>
  new Response('Method not allowed', {
    status: 405,
    headers: { Allow: allow },
  });

const publicLiigaResponse = async (response: Response, error: string) => {
  if (response.status < 500) return response;

  return Response.json(
    { error },
    {
      status: response.status,
      headers: response.headers,
    }
  );
};

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

    if (url.pathname === HSL_PATH) {
      if (request.method !== 'POST') return methodNotAllowed('POST');
      return fetchHslDeparturesResponse({
        request,
        apiKey: env.DIGITRANSIT_API_KEY,
      });
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
      return publicLiigaResponse(await getLiigaResponse(), 'Liiga data request failed');
    }

    if (url.pathname === LIIGA_SCHEDULE_PATH) {
      if (request.method !== 'GET') return methodNotAllowed();
      return publicLiigaResponse(await getLiigaScheduleResponse(), 'Liiga schedule request failed');
    }

    return env.ASSETS.fetch(request);
  },
};

export default worker;
