import { expect, test } from '@playwright/test';
import { buildWidgetV2Payload } from '../../functions/api/current/widget-v2';

test('widget v2 exposes a generic adaptive presentation contract', () => {
  const payload = buildWidgetV2Payload(
    {
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
    },
    {
      ilvesStanding: {
        rank: 6,
        totalTeams: 17,
      },
      nextIlvesGame: {
        start: '2026-09-16T15:30:00.000Z',
        homeTeam: 'Kärpät',
        awayTeam: 'Ilves',
      },
    },
    'prod',
    '2026-09-13T13:05:00.000Z'
  );

  expect(payload).toMatchObject({
    schemaVersion: 2,
    minEngineVersion: 2,
    channel: 'prod',
    refreshMinutes: 15,
    layouts: {
      compact: ['weather', 'electricity', 'markets', 'rates'],
      large: ['weather', 'electricity', 'markets', 'rates', 'liiga'],
    },
  });

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
    layout: 'stack',
    bars: [0, 1, 0.5],
  });

  const markets = payload.sections.find((section) => section.id === 'markets');
  expect(markets).toMatchObject({
    primary: '+0.08%',
    span: 'full',
    layout: 'stack',
  });
  expect(markets?.rows).toEqual([
    { label: 'WORLD', value: '+0.94%', tone: 'positive' },
    { label: 'USA', value: '+1.36%', tone: 'positive' },
    { label: 'FINLAND', value: '-1.09%', tone: 'negative' },
    { label: 'BTC / EUR', value: '-0.62%', tone: 'negative' },
    { label: 'REMEDY', value: '+1.64%', tone: 'positive' },
  ]);

  const rates = payload.sections.find((section) => section.id === 'rates');
  expect(rates).toMatchObject({ span: 'half', layout: 'stack' });

  const liiga = payload.sections.find((section) => section.id === 'liiga');
  expect(liiga).toMatchObject({
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
