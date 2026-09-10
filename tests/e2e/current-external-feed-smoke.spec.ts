import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const workflowPath = '.github/workflows/current-external-feed-smoke.yml';

test('Current external feed smoke covers the previously unmonitored production sources', async () => {
  const workflow = await readFile(workflowPath, 'utf8');

  for (const expected of [
    '/api/current/electricity?live_smoke=',
    '/api/current/electricity-month?live_smoke=',
    '/api/current/news?live_smoke=',
    'https://api.open-meteo.com/v1/forecast?',
  ]) {
    expect(workflow).toContain(expected);
  }

  expect(workflow).toContain('current=temperature_2m%2Cweather_code%2Cis_day');
  expect(workflow).toContain('hourly=temperature_2m%2Cprecipitation_probability%2Cweather_code%2Cis_day');
  expect(workflow).toContain('daily=weather_code%2Ctemperature_2m_min%2Ctemperature_2m_max%2Cprecipitation_probability_max%2Csunrise%2Csunset');
});

test('Current external feed smoke keeps every network probe bounded', async () => {
  const workflow = await readFile(workflowPath, 'utf8');
  const curlCommands = workflow.split(/\n(?=\s*if curl \\)/).slice(1);

  expect(curlCommands).toHaveLength(4);
  for (const command of curlCommands) {
    expect(command).toContain('--max-time 20');
  }
});
