import { readFile, writeFile } from 'node:fs/promises';

const file = 'README.md';
let source = await readFile(file, 'utf8');

const replacements = [
  [
    'tests/e2e/meshy-vol4-regression.spec.ts\n```',
    'tests/e2e/meshy-vol4-regression.spec.ts\ntests/e2e/morphing-topography-regression.spec.ts\n```',
  ],
  [
    '- etusivun topografiacanvasin renderöitymisen ja geometrian',
    '- etusivun topografiacanvasin renderöitymisen, geometrian, jatkuvan morph/auto-rotate-liikkeen ja drag-orbitoinnin',
  ],
  [
    '`PointBee.astro`, `PointButterfly.astro`, `SegmentedRing.astro`, `AccessibilityStep.astro`, `WaterDropMorph.astro`, `TreeField.astro`, `RiverFlow.astro`, `PhotogrammetryModel.astro`, `MeshyPixelatedPoise.astro` ja `MeshyPixelatedPoiseVol4.astro` käyttävät tätä yhteistä runtimea.',
    '`PointBee.astro`, `PointButterfly.astro`, `SegmentedRing.astro`, `AccessibilityStep.astro`, `WaterDropMorph.astro`, `TreeField.astro`, `RiverFlow.astro`, `PhotogrammetryModel.astro`, `MeshyPixelatedPoise.astro`, `MeshyPixelatedPoiseVol4.astro` ja `MorphingTopography.astro` käyttävät tätä yhteistä runtimea.',
  ],
];

for (const [before, after] of replacements) {
  if (source.includes(after)) continue;
  if (!source.includes(before)) throw new Error(`README pattern not found: ${before}`);
  source = source.replace(before, after);
}

await writeFile(file, source);
