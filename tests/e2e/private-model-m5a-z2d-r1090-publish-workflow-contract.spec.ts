import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const candidateId = 'm5a-z2d-r1090-well-top-ground-surface';
const workflowPath = path.join(process.cwd(), '.github', 'workflows', 'publish-work-test.yml');
const docsPath = path.join(
  process.cwd(),
  'docs',
  'ylisrinne',
  'm5a-z2d-r1090-runtime-wiring-map.md',
);

const workflowContent = readFileSync(workflowPath, 'utf8');
const docsContent = readFileSync(docsPath, 'utf8');

test('Publish WORK_TEST workflow keeps the dispatch input contract needed by the R1091 V5 handoff', () => {
  expect(workflowContent).toContain('name: Publish WORK_TEST');
  expect(workflowContent).toContain('workflow_dispatch:');
  expect(workflowContent).toContain('candidate:');
  expect(workflowContent).toContain('description: Allowlisted WORK_TEST candidate id');
  expect(workflowContent).toContain('required: true');
  expect(workflowContent).toContain('type: string');

  expect(docsContent).toContain('## Historical R1090 V5 publish/readback status');
  expect(docsContent).toContain('## R1091 V5 publish/readback status');
  expect(docsContent).toContain('Publish WORK_TEST - m5a-z2d-r1090-well-top-ground-surface');
  expect(docsContent).toContain(`candidate: ${candidateId}`);
  expect(docsContent).toContain('Run `37835730136` successfully published and read back the earlier R1090 raw artifact.');
});

test('Publish WORK_TEST workflow preserves the exact production readback gates required before R1091 review release', () => {
  expect(workflowContent).toContain('CATALOG_URL: https://aapopihkala.fi/private-model/work-test/verify/catalog.json');
  expect(workflowContent).toContain('Read production catalog back');
  expect(workflowContent).toContain('Read full production GLB back and verify bytes');
  expect(workflowContent).toContain('Production catalog readback verified.');
  expect(workflowContent).toContain('Production byte-for-byte readback verified.');

  expect(workflowContent).toContain('"PUBLISH_URL": f"https://aapopihkala.fi/private-model/work-test/publish/{candidate_id}.glb"');
  expect(workflowContent).toContain('"GLB_URL": f"https://aapopihkala.fi/private-model/work-test/verify/{candidate_id}.glb"');
  expect(workflowContent).toContain('"EXPECTED_PATH": f"/private-model/work-test/{candidate_id}.glb"');
});

test('R1091 V5 handoff keeps publish, review, and promotion boundaries separated', () => {
  expect(docsContent).toContain('Do not claim machine publish/readback PASS yet');
  expect(docsContent).toContain('That retry must then prove machine publish, production catalog readback, and full production GLB size/SHA parity.');
  expect(docsContent).toContain('Before any HUMAN_REVIEW content question, the next pass must verify authenticated one-link live behavior');
  expect(docsContent).toContain('VISIBILITY_PROBE_REQUIRED');
  expect(docsContent).toContain('Do not promote this WORK_TEST successor to CURRENT, canonical, as-built, or publishToCURRENT from this note.');
});
