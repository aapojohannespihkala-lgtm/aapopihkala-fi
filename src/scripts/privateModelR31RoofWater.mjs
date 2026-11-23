// Roof-water continuations of the five-downpipe T12 system (R31 runtime / R32H baked), glTF
// world of the R31-family models (Y up = elevation above design datum +21.750).
// Owner 23.11.2026 07.27, field observations (the certain part):
//  - both west downpipes discharge near the SW corner: the SW pipe in a temporary gutter
//    along the terrace edge to the green area, the NW pipe via a gutter well in a pipe to an
//    outlet a few metres south of the other one;
//  - both east downpipes via gutter wells and pipes to the green area at the SE corner
//    (the NE discharge is still somewhat unclear).
// Owner 23.11.2026 07.02: best-knowledge assumption in the model, (un)certainty in the card.
// Assumed (common sense, generated 23.11.2026 over SCALGO n9007 + refill n6850):
//  - gutter wells D315, lid 20 mm above ground, bottom 0.4 m below the outlet pipe;
//  - buried pipes D110, top >= 0.15 m below ground, falls >= 1 % (outlets >= 0.5 %);
//    NE pipe runs east of the drains/PVK (x 26.7) into the SE gutter well;
//  - vertical D100 connectors from the east downpipe outlets down into the well lids;
//  - the SW temporary gutter: open half-round 150 mm on the ground at x -0.45 (west of the
//    terrace steps), the C/B south downpipe has no observed continuation (unchanged).

export const R31_ROOFWATER_SOURCE = Object.freeze({
  observation: 'OWNER_FIELD_OBSERVATION_20261123_0727',
  basis: 'OWNER_20261123_0702_BEST_KNOWLEDGE_ASSUMPTION_CARD_STATES_UNCERTAINTY',
  downpipes: 'T12 five-downpipe system at owner points (R31 runtime / R32H c26d99c1 baked)',
});

export const R31_ROOFWATER_PROFILE = Object.freeze({"wells": {"RK_NW": {"x": -0.35, "z": -10.685, "groundY": 0.034, "topY": 0.054, "bottomY": -0.805, "diameterM": 0.315, "downpipe": "T12_2026_CD_LANSI_POHJOINEN"}, "RK_NE": {"x": 25.75, "z": -10.685, "groundY": -0.903, "topY": -0.883, "bottomY": -1.563, "diameterM": 0.315, "downpipe": "T12_2026_AB_ITA_POHJOINEN"}, "RK_SE": {"x": 25.75, "z": 1.585, "groundY": -1.248, "topY": -1.228, "bottomY": -2.167, "diameterM": 0.315, "downpipe": "T12_2026_AB_ITA_ETELA"}}, "pipes": {"RK_NW_OUTLET": {"from": "RK_NW", "to": "OUTLET_W2", "points": [[-0.35, -0.35, -10.685], [-1.2, -0.354, -10.685], [-1.2, -0.422, 2.803], [-1.2, -0.441, 3.552], [-1.2, -0.448, 4.801], [-1.2, -0.461, 5.051], [-1.2, -0.506, 5.55], [-1.2, -0.521, 5.8], [-0.867, -0.526, 6.689], [-0.533, -0.625, 7.578], [-0.45, -0.629, 7.8]], "lengthM": 19.47, "slope": 0.005, "coverM": [0.15, 0.93], "endCoverM": 0.15}, "RK_NE_TO_RK_SE": {"from": "RK_NE", "to": "RK_SE", "points": [[25.75, -1.108, -10.685], [26.7, -1.119, -10.685], [26.7, -1.129, -9.695], [26.7, -1.137, -9.447], [26.7, -1.21, -8.952], [26.7, -1.232, -8.704], [26.7, -1.253, -6.971], [26.7, -1.288, -6.476], [26.7, -1.295, -6.228], [26.7, -1.305, -5.238], [26.7, -1.312, -4.99], [26.7, -1.35, -4.247], [26.7, -1.362, -3.009], [26.7, -1.406, -2.762], [26.7, -1.498, -2.019], [26.7, -1.508, -1.028], [26.7, -1.519, -0.781], [26.7, -1.618, -0.038], [26.7, -1.643, 0.21], [26.7, -1.653, 1.2], [25.95, -1.662, 1.585]], "lengthM": 13.68, "slope": 0.01, "coverM": [0.15, 0.37], "endCoverM": 0.37}, "RK_SE_OUTLET": {"from": "RK_SE", "to": "OUTLET_E", "points": [[25.75, -1.712, 1.585], [26.6, -1.717, 2.1], [27.2, -1.72, 2.3], [27.4, -1.748, 2.367], [27.6, -1.781, 2.433], [27.8, -1.782, 2.5]], "lengthM": 2.26, "slope": 0.005, "coverM": [0.15, 0.42], "endCoverM": 0.15}}, "gutters": {"SW_TEMP_GUTTER": {"from": "T12_2026_CD_LANSI_ETELA", "to": "OUTLET_W1", "widthM": 0.15, "points": [[-0.31, -0.338, 1.595], [-0.45, -0.339, 1.989], [-0.45, -0.34, 2.467], [-0.45, -0.341, 2.944], [-0.45, -0.342, 3.422], [-0.45, -0.343, 3.9], [-0.45, -0.344, 4.35], [-0.45, -0.344, 4.8]]}}, "connectors": {"NE": {"downpipe": "T12_2026_AB_ITA_POHJOINEN", "points": [[25.698, -0.614, -10.685], [25.698, -0.883, -10.685]], "radiusM": 0.05, "lengthM": 0.27}, "SE": {"downpipe": "T12_2026_AB_ITA_ETELA", "points": [[25.698, -0.614, 1.585], [25.698, -1.228, 1.585]], "radiusM": 0.05, "lengthM": 0.61}}});
