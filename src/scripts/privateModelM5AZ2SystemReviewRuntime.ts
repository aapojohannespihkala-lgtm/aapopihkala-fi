import {
  getRequestedReviewCandidateId,
  isM5AZ2SystemReviewCandidateId,
  isM5AZ2SystemReviewId,
  m5aZ2LegacyCandidateId,
  m5aZ2LegacyReviewId,
  m5aZ2R1090CandidateId,
  m5aZ2R1090ReviewId,
} from './privateModelWorkTest';

const reviewQueryKey = 'review';

export const m5aZ2SystemReviewRuntimeCandidateIds = Object.freeze([
  m5aZ2LegacyCandidateId,
  m5aZ2R1090CandidateId,
]);

export const m5aZ2SystemReviewRuntimeReviewIds = Object.freeze([
  m5aZ2LegacyReviewId,
  m5aZ2R1090ReviewId,
]);

export const getRequestedM5AZ2SystemReviewId = (search: string) => {
  const reviewId = new URLSearchParams(search).get(reviewQueryKey);
  return isM5AZ2SystemReviewId(reviewId) ? reviewId : null;
};

export const getRequestedM5AZ2SystemCandidateId = (search: string) => {
  const candidateId = getRequestedReviewCandidateId(search);
  return candidateId && isM5AZ2SystemReviewCandidateId(candidateId) ? candidateId : null;
};

export const getActiveM5AZ2SystemReviewId = (search: string) =>
  getRequestedM5AZ2SystemReviewId(search) ?? m5aZ2LegacyReviewId;

export const getActiveM5AZ2SystemCandidateId = (search: string) =>
  getRequestedM5AZ2SystemCandidateId(search) ?? m5aZ2LegacyCandidateId;

export const isM5AZ2SystemReviewRequested = (search: string) =>
  getRequestedM5AZ2SystemReviewId(search) !== null;
