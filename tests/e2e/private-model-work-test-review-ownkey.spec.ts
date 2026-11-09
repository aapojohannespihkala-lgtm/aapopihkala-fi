import { expect, test } from '@playwright/test';

import {
  getRequestedReviewCandidateId,
  p143aCandidateId,
  p143dReviewId,
  p185cReviewId,
} from '../../src/scripts/privateModelWorkTest';

test('WORK_TEST review URL never resolves inherited Object prototype keys', () => {
  // The review alias map is an ordinary frozen object. These keys must not
  // resolve to inherited methods or a prototype object.
  for (const id of [
    'constructor',
    '__proto__',
    'toString',
    'valueOf',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'toLocaleString',
  ]) {
    expect(
      getRequestedReviewCandidateId(`?review=${encodeURIComponent(id)}`),
      `inherited key ${id} must not resolve as a candidate`,
    ).toBeNull();
  }

  expect(getRequestedReviewCandidateId('?review=unknown')).toBeNull();
  expect(getRequestedReviewCandidateId('?review=')).toBeNull();
  expect(getRequestedReviewCandidateId('')).toBeNull();
});

test('WORK_TEST review URL preserves exact aliases and intended conventional fallback', () => {
  // Exact aliases may differ from their model candidate ID.
  expect(getRequestedReviewCandidateId(`?review=${p143dReviewId}`))
    .toBe(p143aCandidateId);

  // Existing route convention must remain unchanged.
  expect(getRequestedReviewCandidateId('?review=sample-source-review'))
    .toBe('sample-source');

  // An explicit blocked alias must not be reopened by the suffix fallback.
  expect(getRequestedReviewCandidateId(`?review=${p185cReviewId}`)).toBeNull();

  // The fallback only accepts lower-case ASCII source IDs with hyphens.
  expect(getRequestedReviewCandidateId('?review=Sample-source-review')).toBeNull();
  expect(getRequestedReviewCandidateId('?review=sample_source-review')).toBeNull();
  expect(getRequestedReviewCandidateId('?review=constructor')).toBeNull();
});
