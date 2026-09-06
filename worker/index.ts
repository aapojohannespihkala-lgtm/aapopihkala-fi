import { onRequestGet as getElectricityPriceResponse } from '../functions/api/current/electricity';

type AssetsBinding = {
  fetch(request: Request): Promise<Response>;
};

type WorkerEnv = {
  ASSETS: AssetsBinding;
};

const ELECTRICITY_PATH = '/api/current/electricity';

const worker = {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === ELECTRICITY_PATH) {
      if (request.method !== 'GET') {
        return new Response('Method not allowed', {
          status: 405,
          headers: { Allow: 'GET' },
        });
      }

      return getElectricityPriceResponse();
    }

    return env.ASSETS.fetch(request);
  },
};

export default worker;
