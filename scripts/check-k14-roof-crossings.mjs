/**
 * Scene32 K14 roof footprint evidence gate (WORK_TEST / SOURCE_ONLY).
 *
 * The source footprint is from the owner's K13/K14 world-AABB QA in §10;
 * G1c apartment intervals are planning/reference modules, NOT proof of roof
 * ownership or a safe per-apartment clipping mesh.
 *
 * This is a diagnostic on supplied world-AABBs, not a GLB parser, not a
 * physical as-built check and NEVER a viewer/publish authorization.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  evidenceAnchors, scene32SourceEvidence, auditScene32Evidence,
} from '../src/data/scene32SourceScopeEvidence.mjs';

export const G1_APARTMENT_MODULES = Object.freeze([
  Object.freeze({ apartment: 'D', minX: 0.25, maxX: 6.25 }),
  Object.freeze({ apartment: 'C', minX: 6.50, maxX: 12.50 }),
  Object.freeze({ apartment: 'B', minX: 12.90, maxX: 18.90 }),
  Object.freeze({ apartment: 'A', minX: 19.15, maxX: 25.15 }),
]);

// Verified K14 scene30 world-X bounds inherited by scene32 (metres).
// These are bounded SOURCE_EVIDENCE fixtures, not fresh GLB measurements.
export const K14_KNOWN_ROOF_FOOTPRINTS = Object.freeze([
  Object.freeze({ nodeIndex: 2764, minX: -0.600, maxX: 13.250 }),
  Object.freeze({ nodeIndex: 2765, minX: 12.700, maxX: 26.000 }),
]);
export const K14_HELD_INDICES = Object.freeze([
  2762, 2763, 2764, 2765, 2784, 2785, 2786, 2787,
]);

const validExtent = (x) => Number.isFinite(x?.minX) &&
  Number.isFinite(x?.maxX) && x.minX < x.maxX;

/** Overlap of apartment reference modules in X, NOT roof ownership. */
export function xModuleOverlaps(extent, modules = G1_APARTMENT_MODULES) {
  if (!validExtent(extent)) return [];
  return modules.filter((m) => validExtent(m) &&
    Math.min(extent.maxX, m.maxX) - Math.max(extent.minX, m.minX) > 1e-6)
    .map((m) => m.apartment);
}

/**
 * Fail-closed gate. The caller must supply an independently extracted
 * source-ZIP hash and the active scene's world-X roof bounds. The script
 * checks against the version-locked §10 evidence, it does not read ZIP/GLB.
 */
export function auditK14RoofCrossings({
  sourceZipSha256, scene, footprints, sourceEvidence = scene32SourceEvidence(),
} = {}) {
  const errors = [];
  if (sourceZipSha256 !== evidenceAnchors.scene32ZipSha256) {
    errors.push('SOURCE_ZIP_SHA_MISMATCH');
  }
  if (scene !== 32) errors.push('SCENE_ID_MISMATCH');
  const sourceCheck = auditScene32Evidence(sourceEvidence);
  if (!sourceCheck.ok) errors.push('SOURCE_EVIDENCE_FAIL');
  const held = sourceEvidence.filter((r) => K14_HELD_INDICES.includes(r.nodeIndex));
  if (held.length !== 8 || new Set(held.map((r) => r.nodeIndex)).size !== 8 ||
      held.some((r) => r.storeyScope !== 'UNKNOWN' ||
        r.role !== 'UNCLASSIFIED' || !r.unresolved)) {
    errors.push('EIGHT_K14_HOLD_BYPASS');
  }
  if (!Array.isArray(footprints) || footprints.length !== 2 ||
      new Set(footprints.map((x) => x?.nodeIndex)).size !== 2) {
    errors.push('ROOF_FOOTPRINT_SET_INVALID');
  }
  const results = [];
  for (const reference of K14_KNOWN_ROOF_FOOTPRINTS) {
    const matches = Array.isArray(footprints)
      ? footprints.filter((x) => x?.nodeIndex === reference.nodeIndex) : [];
    const observed = matches[0];
    if (matches.length !== 1 || !validExtent(observed)) {
      errors.push('ROOF_FOOTPRINT_INVALID:' + reference.nodeIndex);
      continue;
    }
    if (Math.abs(observed.minX - reference.minX) > 0.001 ||
        Math.abs(observed.maxX - reference.maxX) > 0.001) {
      errors.push('ROOF_FOOTPRINT_SOURCE_DRIFT:' + reference.nodeIndex);
    }
    const scope = held.find((r) => r.nodeIndex === reference.nodeIndex);
    const referenceModules = xModuleOverlaps(observed);
    if (!scope || referenceModules.length < 2) {
      errors.push('CROSS_APARTMENT_GUARD_MISSING:' + reference.nodeIndex);
    }
    results.push({
      nodeIndex: reference.nodeIndex,
      sourceLabel: scope?.apartmentScope ?? 'UNKNOWN',
      worldX: [observed.minX, observed.maxX],
      overlappedG1Modules: referenceModules,
      decision: 'HOLD_CROSS_APARTMENT_FOOTPRINT',
      ownershipInferred: false,
    });
  }
  return {
    ok: errors.length === 0, errors,
    sourceScene: 32,
    sourceZipSha256: evidenceAnchors.scene32ZipSha256,
    results, k14Held: held.length,
    // A source-evidence PASS never authorizes automatic D/BOTH or roof rendering.
    canApplyToViewer: false, canPublish: false,
    geometryVerifiedFromGlb: false, browserVerified: false,
    nextGate: 'Source-backed D-only roof submesh or non-destructive clipping + real GLB/browser QA',
  };
}

// Usage: node scripts/check-k14-roof-crossings.mjs candidate.json
// candidate.json must contain sourceZipSha256, scene, footprints.
// Deliberately no self-passing default JSON in command-line mode.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) {
    process.stderr.write('Usage: node scripts/check-k14-roof-crossings.mjs candidate.json\n');
    process.exitCode = 2;
  } else {
    try {
      const input = JSON.parse(readFileSync(process.argv[2], 'utf8'));
      const report = auditK14RoofCrossings(input);
      process.stdout.write(JSON.stringify(report, null, 2) + '\n');
      if (!report.ok) process.exitCode = 1;
    } catch (error) {
      process.stderr.write('Invalid candidate JSON: ' + error.message + '\n');
      process.exitCode = 2;
    }
  }
}
