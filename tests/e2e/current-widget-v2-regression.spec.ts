import { expect, test } from '@playwright/test';
import { summarizeWidgetElectricity } from '../../functions/api/current/widget';
import { buildWidgetV2Payload } from '../../functions/api/current/widget-v2';

const hslFixture = {
  fetchedAt: '2026-09-13T13:05:00.000Z',
  departures: [
    {
      route: '121',
      headsign: 'Tapiola (M) via Niittykumpu',
      departureAt: '2026-09-13T13:10:00.000Z',
      realtime: true,
    },
    {
      route: '125',
      headsign: 'Kamppi via Lauttasaari',
      departureAt: '2026-09-13T13:17:00.000Z',
      realtime: false,
    },
    {
      route: '121',
      headsign: 'Tapiola (M)',
      departureAt: '2026-09-13T13:25:00.000Z',
      realtime: true,
    },
    {
      route: '125',
      headsign: 'Kamppi',
      departureAt: '2026-09-13T13:35:00.000Z',
      realtime: true,
    },
    {
      route: '121',
      headsign: 'Tapiola',
      departureAt: '2026-09-13T13:45:00.000Z',
      realtime: false,
    },
    {
      route: '125',
      headsign: 'Kamppi',
      departureAt: '2026-09-13T13:55:00.000Z',
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
    tomorrowAverage: 2.22,
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
    remedyPrice: 13.72,
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
  lastIlvesGame: {
    homeTeam: 'Ilves',
    awayTeam: 'HIFK',
    homeGoals: 3,
    awayGoals: 2,
    ilvesResult: 'W',
    finish: 'REGULATION',
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
    4.21,
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
    detail: 'Light drizzle / 13° / 17°\nFORECAST 16:00=16°|18:00=15°|20:00=15°|22:00=13°',
    span: 'full',
    layout: 'stack',
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
    detail: 'TOMORROW AVG 2.22\nMONTH AVG 4.21  LOW 0.39  HIGH 5.03',
    span: 'full',
    layout: 'split',
    bars: [0, 1, 0.5],
    rows: [{ label: 'NOW', value: '2.54 c/kWh' }],
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
    { label: 'REMEDY 13.72 €', value: '+1.64%', tone: 'positive' },
  ]);

  const hsl = payload.sections.find((section) => section.id === 'hsl');
  expect(hsl).toMatchObject({
    index: '04',
    primary: '5 MIN',
    secondary: '121 / TAPIOLA',
    detail: '16:10 / LIVE',
    tone: 'accent',
    span: 'full',
    layout: 'split',
    countdownTargetMs: 1789305000000,
    rows: [
      {
        label: '121',
        value: '16:10',
        tone: 'accent',
        secondary: '121 / TAPIOLA',
        countdownTargetMs: 1789305000000,
      },
      {
        label: '125',
        value: '16:17',
        tone: 'neutral',
        secondary: '125 / KAMPPI',
        countdownTargetMs: 1789305420000,
      },
      {
        label: '121',
        value: '16:25',
        tone: 'accent',
        secondary: '121 / TAPIOLA',
        countdownTargetMs: 1789305900000,
      },
      {
        label: '125',
        value: '16:35',
        tone: 'accent',
        secondary: '125 / KAMPPI',
        countdownTargetMs: 1789306500000,
      },
      {
        label: '121',
        value: '16:45',
        tone: 'neutral',
        secondary: '121 / TAPIOLA',
        countdownTargetMs: 1789307100000,
      },
      {
        label: '125',
        value: '16:55',
        tone: 'neutral',
        secondary: '125 / KAMPPI',
        countdownTargetMs: 1789307700000,
      },
    ],
  });

  const rates = payload.sections.find((section) => section.id === 'rates');
  expect(rates).toMatchObject({ index: '05', span: 'half', layout: 'stack' });

  const liiga = payload.sections.find((section) => section.id === 'liiga');
  expect(liiga).toMatchObject({
    index: '06',
    primary: '6/17',
    secondary: 'KÄRPÄT - ILVES · WED 16 18:30',
    detail: 'ILVES - HIFK 3-2 · LAST',
    span: 'half',
    layout: 'stack',
    rows: [],
  });
});

test('widget v2 shows live Liiga score, teams and elapsed game time in two rows', () => {
  const payload = buildWidgetV2Payload(
    baseFixture,
    {
      ...liigaFixture,
      liveIlvesGame: {
        homeTeam: 'Ilves',
        awayTeam: 'KalPa',
        homeGoals: 2,
        awayGoals: 1,
        gameTime: 2058,
      },
    },
    'prod',
    '2026-09-13T13:05:00.000Z',
  );

  const liiga = payload.sections.find((section) => section.id === 'liiga');
  expect(liiga).toMatchObject({
    primary: '2-1',
    secondary: 'ILVES - KALPA · LIVE 34:18',
    tone: 'accent',
    rows: [],
  });
});

test('widget v2 marks overtime results compactly', () => {
  const payload = buildWidgetV2Payload(
    baseFixture,
    {
      ...liigaFixture,
      lastIlvesGame: {
        homeTeam: 'KalPa',
        awayTeam: 'Ilves',
        homeGoals: 2,
        awayGoals: 3,
        ilvesResult: 'W',
        finish: 'OVERTIME',
      },
    },
    'prod',
    '2026-09-13T13:05:00.000Z',
  );

  const liiga = payload.sections.find((section) => section.id === 'liiga');
  expect(liiga).toMatchObject({
    detail: 'KALPA - ILVES 2-3 OT · LAST',
    rows: [],
  });
});

test('widget v2 skips a departure once its countdown reaches zero', () => {
  const payload = buildWidgetV2Payload(
    baseFixture,
    liigaFixture,
    'prod',
    '2026-09-13T13:10:00.000Z',
    null,
    hslFixture,
  );

  const hsl = payload.sections.find((section) => section.id === 'hsl');
  expect(hsl).toMatchObject({
    primary: '7 MIN',
    secondary: '125 / KAMPPI',
    detail: '16:17 / SCHED',
    countdownTargetMs: 1789305420000,
  });
  expect(hsl?.primary).not.toBe('NOW');
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

test('widget electricity exposes tomorrow average only after the full market day is available', () => {
  const localMidnightUtc = Date.UTC(2026, 8, 12, 21, 0, 0);
  const day = (offsetDays: number, price: number, count = 96) =>
    Array.from({ length: count }, (_, index) => {
      const start = new Date(localMidnightUtc + offsetDays * 24 * 60 * 60 * 1000 + index * 15 * 60 * 1000);
      return {
        price,
        startDate: start.toISOString(),
        endDate: new Date(start.getTime() + 15 * 60 * 1000 - 1000).toISOString(),
      };
    });
  const now = new Date('2026-09-13T13:05:00.000Z');

  const complete = summarizeWidgetElectricity([...day(0, 1.5), ...day(1, 2.25)], now);
  const partial = summarizeWidgetElectricity([...day(0, 1.5), ...day(1, 2.25, 95)], now);

  expect(complete?.tomorrowAverage).toBe(2.25);
  expect(partial?.tomorrowAverage).toBeNull();
});

test('widget v2 keeps a stable tomorrow placeholder before prices are available', () => {
  const payload = buildWidgetV2Payload(
    {
      ...baseFixture,
      electricity: {
        ...baseFixture.electricity,
        tomorrowAverage: null,
      },
    },
    liigaFixture,
    'prod',
    '2026-09-13T13:05:00.000Z',
    null,
    hslFixture,
    4.21,
  );

  expect(payload.sections.find((section) => section.id === 'electricity')?.detail).toBe(
    'TOMORROW AVG --.--\nMONTH AVG 4.21  LOW 0.39  HIGH 5.03'
  );
});
