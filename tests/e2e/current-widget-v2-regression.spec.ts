import { expect, test } from '@playwright/test';
import { buildWidgetV2Payload } from '../../functions/api/current/widget-v2';

const hslFixture = {
  fetchedAt: '2026-09-13T13:05:00.000Z',
  departures: [
    {
      route: '121',
      headsign: 'Central',
      departureAt: '2026-09-13T13:10:00.000Z',
      realtime: true,
    },
    {
      route: '125',
      headsign: 'Metro',
      departureAt: '2026-09-13T13:17:00.000Z',
      realtime: false,
    },
  ],
};

const baseFixture = {
  updated: '2026-09-13T13:05:00.000Z',
  weather: {
    location: 'OLARI / ESPOO',
    temperature: 16.2,
    condition: 'Light drizzle',
    min: 12.5,
    max: 16.9,
    forecast: [
      { time: '16:00', temperature: 16, condition: 'Light drizzle' },
      { time: '18:00', temperature: 15, condition: 'Rain' },
      { time: '20:00', temperature: 15, condition: 'Partly cloudy' },
      { time: '22:00', temperature: 13, condition: 'Partly cloudy' },
    ],
  },
  electricity: {
    price: 2.54,
    average: 1.83,
    low: 0.39,
    high: 5.03,
    series: [
      0, 0, 0, 0,
      10, 10, 10, 10,
      5, 5, 5, 5,
    ],
  },
  markets: {
    median: 0.08,
    world: 0.94,
    usa: 1.36,
    finland: -1.09,
    btcEur: -0.62,
    remedy: 1.64,
  },
  rates: {
    euribor3m: 2.65,
    yearAgo: 2.03,
  },
};

const liigaFixture = {
  ilvesStanding: {
    rank: 6,
    totalTeams: 17,
  },
  nextIlvesGame: {
    start: '2026-09-16T15:30:00.000Z',
    homeTeam: 'Kärpät',
    awayTeam: 'Ilves',
  },
};

test('widget v2 exposes production HSL through the large-layout presentation contract', () => {
  const payload = buildWidgetV2Payload(
    baseFixture,
    liigaFixture,
    'prod',
    '2026-09-13T13:05:00.000Z',
    null,
    hslFixture,
  );

  expect(payload).toMatchObject({
    schemaVersion: 2,
    minEngineVersion: 2,
    channel: 'prod',
    layouts: {
      compact: ['weather', 'electricity', 'markets', 'rates'],
      medium: ['weather', 'electricity', 'markets', 'rates'],
      large: ['weather', 'electricity', 'markets', 'hsl', 'rates', 'liiga'],
    },
  });
  expect(payload).not.toHaveProperty('refreshMinutes');

  const weather = payload.sections.find((section) => section.id === 'weather');
  expect(weather).toMatchObject({
    primary: '16.2°C',
    secondary: 'OLARI / ESPOO',
    detail: 'Light drizzle / 13° / 17°',
    span: 'full',
    layout: 'split',
    columns: [
      { label: '16:00', value: '16°' },
      { label: '18:00', value: '15°' },
      { label: '20:00', value: '15°' },
      { label: '22:00', value: '13°' },
    ],
  });

  const electricity = payload.sections.find((section) => section.id === 'electricity');
  expect(electricity).toMatchObject({
    primary: '1.83 c/kWh',
    secondary: 'DAY AVG / TODAY',
    detail: 'NOW 2.54  LOW 0.39  HIGH 5.03',
    span: 'full',
    layout: 'split',
    bars: [0, 1, 0.5],
  });

  const markets = payload.sections.find((section) => section.id === 'markets');
  expect(markets).toMatchObject({
    primary: '+0.08%',
    span: 'full',
    layout: 'split',
  });
  expect(markets?.rows).toEqual([
    { label: 'WORLD', value: '+0.94%', tone: 'positive' },
    { label: 'USA', value: '+1.36%', tone: 'positive' },
    { label: 'FINLAND', value: '-1.09%', tone: 'negative' },
    { label: 'BTC / EUR', value: '-0.62%', tone: 'negative' },
    { label: 'REMEDY', value: '+1.64%', tone: 'positive' },
  ]);

  const hsl = payload.sections.find((section) => section.id === 'hsl');
  expect(hsl).toMatchObject({
    index: '04',
    primary: '5 MIN',
    secondary: '121 / CENTRAL',
    detail: '16:10 / LIVE',
    tone: 'accent',
    span: 'full',
    layout: 'split',
    countdownTargetMs: 1789305000000,
    rows: [
      { label: '121', value: '16:10', tone: 'accent' },
      { label: '125', value: '16:17', tone: 'neutral' },
    ],
  });

  const rates = payload.sections.find((section) => section.id === 'rates');
  expect(rates).toMatchObject({ index: '05', span: 'half', layout: 'stack' });

  const liiga = payload.sections.find((section) => section.id === 'liiga');
  expect(liiga).toMatchObject({
    index: '06',
    primary: '6/17',
    secondary: 'KÄRPÄT - ILVES',
    detail: 'WED 16 18:30',
    span: 'half',
    layout: 'stack',
    rows: [
      { label: 'NEXT', value: 'KÄRPÄT - ILVES' },
      { label: 'START', value: 'WED 16 18:30' },
    ],
  });
});

test('widget v2 keeps prod and dev on the same large HSL layout', () => {
  const prod = buildWidgetV2Payload(
    baseFixture,
    liigaFixture,
    'prod',
    '2026-09-13T13:05:00.000Z',
    null,
    hslFixture,
  );
  const dev = buildWidgetV2Payload(
    baseFixture,
    liigaFixture,
    'dev',
    '2026-09-13T13:05:00.000Z',
    null,
    hslFixture,
  );

  const expected = ['weather', 'electricity', 'markets', 'hsl', 'rates', 'liiga'];
  expect(prod.layouts.large).toEqual(expected);
  expect(dev.layouts.large).toEqual(expected);
  expect(prod.sections.some((section) => section.id === 'hsl')).toBe(true);
  expect(dev.sections.some((section) => section.id === 'hsl')).toBe(true);
});

test('widget v2 omits HSL section without usable departures but keeps the rest of prod', () => {
  const payload = buildWidgetV2Payload(
    baseFixture,
    liigaFixture,
    'prod',
    '2026-09-13T13:05:00.000Z',
  );

  expect(payload.sections.some((section) => section.id === 'hsl')).toBe(false);
  expect(payload.sections.find((section) => section.id === 'rates')?.index).toBe('04');
  expect(payload.sections.find((section) => section.id === 'liiga')?.index).toBe('05');
});
