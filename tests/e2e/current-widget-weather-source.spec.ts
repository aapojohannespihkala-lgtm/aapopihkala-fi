import { expect, test } from '@playwright/test';
import {
  buildWidgetWeatherUrl,
  WIDGET_WEATHER_SOURCE,
} from '../../functions/api/current/widget';
import { buildWidgetSolarUrl } from '../../functions/api/current/widget-v2';

test('widget weather and solar requests share the same location source', () => {
  const weatherUrl = new URL(buildWidgetWeatherUrl());
  const solarUrl = new URL(buildWidgetSolarUrl());

  expect(solarUrl.origin + solarUrl.pathname).toBe(
    weatherUrl.origin + weatherUrl.pathname,
  );

  for (const key of ['latitude', 'longitude', 'timezone'] as const) {
    expect(solarUrl.searchParams.get(key)).toBe(weatherUrl.searchParams.get(key));
  }

  expect(weatherUrl.searchParams.get('latitude')).toBe(
    String(WIDGET_WEATHER_SOURCE.latitude),
  );
  expect(weatherUrl.searchParams.get('longitude')).toBe(
    String(WIDGET_WEATHER_SOURCE.longitude),
  );
  expect(weatherUrl.searchParams.get('timezone')).toBe(
    WIDGET_WEATHER_SOURCE.timeZone,
  );
});
