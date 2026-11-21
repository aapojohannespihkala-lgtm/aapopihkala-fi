// Serve the public Olari forecast from the same origin so browsers that block
// third-party requests can still load Current weather.
const WEATHER_URL = new URL('https://api.open-meteo.com/v1/forecast');
WEATHER_URL.search = new URLSearchParams({
  latitude: '60.1719',
  longitude: '24.7314',
  timezone: 'Europe/Helsinki',
  forecast_days: '6',
  temperature_unit: 'celsius',
  current: 'temperature_2m,weather_code,is_day',
  hourly: 'temperature_2m,precipitation_probability,weather_code,is_day',
  daily: 'weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max,sunrise,sunset',
}).toString();

const responseHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

export const fetchWeatherResponse = async (
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 6_000,
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const upstream = await fetchImpl(WEATHER_URL.toString(), {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!upstream.ok) throw new Error('Weather upstream unavailable');
    const value: unknown = await upstream.json();
    if (!value || typeof value !== 'object') throw new Error('Invalid forecast');
    const payload = value as Record<string, unknown>;
    const current = payload.current as Record<string, unknown> | undefined;
    const hourly = payload.hourly as Record<string, unknown> | undefined;
    const daily = payload.daily as Record<string, unknown> | undefined;
    if (
      typeof current?.temperature_2m !== 'number' ||
      typeof current.time !== 'string' ||
      !Array.isArray(hourly?.time) ||
      !Array.isArray(daily?.time) ||
      !Array.isArray(daily?.sunrise)
    ) {
      throw new Error('Incomplete forecast');
    }
    return new Response(JSON.stringify(value), { status: 200, headers: responseHeaders });
  } catch {
    return new Response(JSON.stringify({ error: 'weather_unavailable' }), {
      status: 502,
      headers: responseHeaders,
    });
  } finally {
    clearTimeout(timeout);
  }
};

export const onRequestGet = () => fetchWeatherResponse();
