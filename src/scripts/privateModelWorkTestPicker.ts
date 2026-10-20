import type { WorkTestCandidate } from './privateModelWorkTest';

export type WorkTestPickerGroup = {
  key: string;
  label: string;
  candidates: WorkTestCandidate[];
};

const autoLabelPrefix = 'Auto:';
const datePattern = /(?<!\d)(20\d{2})(\d{2})(\d{2})(?!\d)/g;

const isAutoCandidate = (candidate: WorkTestCandidate) =>
  candidate.label.trim().startsWith(autoLabelPrefix);

/** Latest valid YYYYMMDD date written in a candidate label, as YYYY-MM-DD. */
export const workTestCandidateLabelDate = (label: string): string | null => {
  let latest: string | null = null;
  for (const match of label.matchAll(datePattern)) {
    const [, year, month, day] = match;
    const monthNumber = Number(month);
    const dayNumber = Number(day);
    if (monthNumber < 1 || monthNumber > 12 || dayNumber < 1 || dayNumber > 31) continue;
    const iso = `${year}-${month}-${day}`;
    if (!latest || iso > latest) latest = iso;
  }
  return latest;
};

const formatFinnishDate = (iso: string) => {
  const [year, month, day] = iso.split('-');
  return `${Number(day)}.${Number(month)}.${year}`;
};

/** Shorter option text: the group heading already says the version is automatic. */
export const workTestCandidateOptionText = (candidate: WorkTestCandidate) => {
  if (!isAutoCandidate(candidate)) return candidate.label;
  const text = candidate.label
    .trim()
    .slice(autoLabelPrefix.length)
    .replace(/\s+-\s+WORK_TEST$/, '')
    .trim();
  return text || candidate.label;
};

const normalizeSearch = (value: string) => value.toLocaleLowerCase('fi').replace(/\s+/g, ' ').trim();

export const workTestCandidateMatchesFilter = (candidate: WorkTestCandidate, filter: string) => {
  const terms = normalizeSearch(filter).split(' ').filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = normalizeSearch(`${candidate.label} ${candidate.id}`);
  return terms.every((term) => haystack.includes(term));
};

/**
 * Newest first. Catalog order is registration order, so automatic Drive-queue
 * versions are grouped by the date in their label (newest date first) and,
 * inside one date, the later-registered version comes first. Manually
 * registered review versions follow, also newest registration first.
 */
export const groupWorkTestCandidatesForPicker = (
  candidates: readonly WorkTestCandidate[],
): WorkTestPickerGroup[] => {
  const autoByDate = new Map<string, WorkTestCandidate[]>();
  const undatedAuto: WorkTestCandidate[] = [];
  const manual: WorkTestCandidate[] = [];

  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const candidate = candidates[index];
    if (!isAutoCandidate(candidate)) {
      manual.push(candidate);
      continue;
    }
    const date = workTestCandidateLabelDate(candidate.label);
    if (!date) {
      undatedAuto.push(candidate);
      continue;
    }
    const bucket = autoByDate.get(date);
    if (bucket) bucket.push(candidate);
    else autoByDate.set(date, [candidate]);
  }

  const groups: WorkTestPickerGroup[] = [...autoByDate.keys()]
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
    .map((date) => ({
      key: `auto-${date}`,
      label: `Automaattijulkaisut ${formatFinnishDate(date)}`,
      candidates: autoByDate.get(date) ?? [],
    }));

  if (undatedAuto.length > 0) {
    groups.push({ key: 'auto-undated', label: 'Automaattijulkaisut, ei päiväystä', candidates: undatedAuto });
  }
  if (manual.length > 0) {
    groups.push({ key: 'manual', label: 'Aiemmat tarkistusversiot', candidates: manual });
  }
  return groups;
};
