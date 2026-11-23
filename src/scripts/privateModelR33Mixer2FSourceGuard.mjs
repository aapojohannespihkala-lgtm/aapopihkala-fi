/**
 * Source-only receiver for R33 2F kitchen mixer connector COW scenes 822/823.
 * The source ZIP is a G2b TYÖ artifact, NOT the deployed R33 GLB.
 * PASS permits source review only. It never authorizes registry updates, a
 * production scene switch, physical connection claims, CURRENT, or as-built.
 */
export const R33_MIXER_2F_SOURCE = Object.freeze({
  sourceDriveId: '13Wb5Og60oBFl_gWoEcAqXL22gy7MZZFg',
  sourceGlbSha256: '3a226f987d5605eff523029d580b760167ae4a32f13ddd51248fe933d913c54c',
  candidateDriveId: '11pZ-J8DeOzrpvNfiJcUVwl8xSKRrGwQ3',
  candidateZipSha256: 'f6baca441398aabf2ba001ec0d5248c0a11114c5be18d34d6062b00cd70b3f74',
  candidateGlbSha256: 'dd33b283971cb039f0fc01982f5fce3e304647be331077913239e9a806fd0135',
  sceneIndices: Object.freeze([822, 823]),
  sourceSceneIndices: Object.freeze([820, 821]),
  connectorRoot: 13472,
  kvNode: 13470,
  lvNode: 13471,
  kvMesh: 5160,
  lvMesh: 5161,
});

/** Return a fail-closed source-only result for a parsed, authenticated GLB. */
export function verifyR33Mixer2FSourceOptIn({
  explicitOptIn,
  glbSha256,
  sourceGlbSha256,
  sceneIndex,
  gltf,
} = {}) {
  const issues = [];
  const expect = (condition, reason) => { if (!condition) issues.push(reason); };
  const contract = R33_MIXER_2F_SOURCE;
  const sourceIndex = sceneIndex === 822 ? 820 : sceneIndex === 823 ? 821 : null;
  const scene = gltf?.scenes?.[sceneIndex];
  const oldScene = gltf?.scenes?.[sourceIndex];
  const root = gltf?.nodes?.[contract.connectorRoot];
  const kv = gltf?.nodes?.[contract.kvNode];
  const lv = gltf?.nodes?.[contract.lvNode];
  const asset = gltf?.asset?.extras;
  const binding = scene?.extras?.mixer2FConnectorSourceCOW;

  expect(explicitOptIn === true, 'EXPLICIT_OPT_IN_REQUIRED');
  expect(glbSha256 === contract.candidateGlbSha256, 'CANDIDATE_GLB_SHA_MISMATCH');
  expect(sourceGlbSha256 === contract.sourceGlbSha256, 'R33_PARENT_SHA_MISMATCH');
  expect(sourceIndex !== null, 'WRONG_SCENE_INDEX');
  expect(gltf?.scenes?.length === 824 && gltf?.nodes?.length === 13846 &&
    gltf?.meshes?.length === 5237 && gltf?.scene === 292, 'GLTF_PREFIX_COUNTS_OR_DEFAULT_MISMATCH');
  expect(asset?.ModelStage === 'WORK_TEST' && asset?.current === false &&
    asset?.asBuilt === false && asset?.HUMAN_REVIEW === 'NOT_RUN', 'ASSET_WORK_TEST_GATE');
  expect(root?.name === 'D2F_MIXER_HOSE_CONNECTOR_ROOT_NO_HYDRAULIC_PROOF' &&
    Array.isArray(root?.children) && root.children.length === 2 &&
    root.children[0] === contract.kvNode && root.children[1] === contract.lvNode &&
    root?.extras?.role === '2F_AND_BOTH_OPTIN_ONLY' &&
    root?.extras?.physicalInstallationVerified === false &&
    root?.extras?.current === false && root?.extras?.asBuilt === false,
    'CONNECTOR_SOURCE_ROOT_MISMATCH');
  expect(kv?.name === 'D2F_KV_BLUE_MIXER_UNDERSIDE_WORK_ASSUMPTION_CONNECTOR' &&
    kv?.mesh === contract.kvMesh && kv?.extras?.physicalConnectionVerified === false &&
    kv?.extras?.current === false && kv?.extras?.asBuilt === false, 'KV_SOURCE_NODE_MISMATCH');
  expect(lv?.name === 'D2F_LV_RED_MIXER_UNDERSIDE_WORK_ASSUMPTION_CONNECTOR' &&
    lv?.mesh === contract.lvMesh && lv?.extras?.physicalConnectionVerified === false &&
    lv?.extras?.current === false && lv?.extras?.asBuilt === false, 'LV_SOURCE_NODE_MISMATCH');

  for (const oldIndex of [818, 819, 820, 821]) {
    const legacy = gltf?.scenes?.[oldIndex];
    const shouldHaveConnector = oldIndex < 820;
    expect(legacy?.name?.endsWith('__scene' + oldIndex) &&
      Array.isArray(legacy?.nodes) &&
      legacy.nodes.includes(contract.connectorRoot) === shouldHaveConnector,
      'R33_LEGACY_SCENE_GATE_' + oldIndex);
  }

  const expectedName = sceneIndex === 822
    ? 'Ylisrinne_R33_D2F_KITCHEN_MIXER_CONNECTORS_2F_NORMAL_WORK_TEST_HOST_HOLD__scene822'
    : 'Ylisrinne_R33_D2F_KITCHEN_MIXER_CONNECTORS_2F_SERVICE_WORK_TEST_HOST_HOLD__scene823';
  expect(scene?.name === expectedName, 'COW_SCENE_NAME_MISMATCH');
  expect(Array.isArray(oldScene?.nodes) && Array.isArray(scene?.nodes) &&
    scene.nodes.length === oldScene.nodes.length + 1 &&
    scene.nodes[scene.nodes.length - 1] === contract.connectorRoot &&
    oldScene.nodes.every((id, index) => scene.nodes[index] === id),
    'COW_SCENE_ROOT_PARITY_MISMATCH');
  expect(binding?.originalR33GLBSHA256 === contract.sourceGlbSha256 &&
    binding?.originalScene === sourceIndex &&
    binding?.existingSourceRootNode === contract.connectorRoot &&
    JSON.stringify(binding?.sourceNodeIndices) === '[13470,13471]' &&
    JSON.stringify(binding?.meshIndices) === '[5160,5161]' &&
    binding?.kind === 'WORK_TEST_VISUAL_CONNECTOR' &&
    binding?.physicalConnectionVerified === false &&
    binding?.current === false && binding?.asBuilt === false &&
    binding?.sourceLinksOutputShaBound === false &&
    binding?.humanReview === 'NOT_RUN' && binding?.productionWebGL === 'NOT_RUN',
    'COW_SOURCE_PROVENANCE_OR_SAFETY_GATE');
  expect(scene?.extras?.hostHold === true &&
    scene?.extras?.canonical === false &&
    scene?.extras?.modelStage === 'WORK_TEST', 'COW_HOST_HOLD_GATE');

  return Object.freeze({
    sourceOnlyPass: issues.length === 0,
    issues: Object.freeze(issues),
    requestedScene: sceneIndex ?? null,
    published: false,
    productionWebGLVerified: false,
    physicalConnectionVerified: false,
    currentOrAsBuilt: false,
  });
}
