// Roof-water continuations of the five-downpipe T12 system (R31 runtime / R32H baked), glTF
// world of the R31-family models (Y up = elevation above design datum +21.750).
// Owner 23.11.2026 07.27, field observations (the certain part):
//  - both west downpipes discharge near the SW corner: the SW pipe in a temporary gutter
//    along the terrace edge to the green area, the NW pipe via a gutter well in a pipe to an
//    outlet a few metres south of the other one;
//  - both east downpipes via gutter wells and pipes to the green area at the SE corner
//    (the NE discharge is still somewhat unclear).
// Owner 23.11.2026 08.37: NE, SE and NW each have their own gutter well with its own pipe;
//  the SW corner has for now only the gutter at the terrace step; wells are "Melika"
//  (photo 2026-04-25 of NW well: open tall-sided circular bowl, flat perforated grate,
//   downpipe elbow discharging freely inside; not a conical/closed hood).
//  Merika AvantGarde 1780RS 110/315 is a photo/product match, NOT a verified SKU;
//  manufacturer states D310 splash plate, D110 outlet, fits D315 collector.
//  East wells NE/SE have no individual photo validation. Keep their shape provisional.
// Owner 23.11.2026 07.02: best-knowledge assumption in the model, (un)certainty in the card.
// Assumed (common sense, generated 23.11.2026 over SCALGO n9007 + refill n6850):
//  - gutter well: D315 collector to ~0.8 m below ground (depth ASSUMED), open D310 bowl
//    modelled ~0.20 m above ground (mounting height ASSUMED), removable perforated grate
//    and free downpipe outlet inside it. No unverified D460 skirt/solid cone hood;
//    east-side vertical connectors remain work-test assumptions.
//  - pipes D110, top >= 0.15 m below ground, falls >= 1 % (NW outlet pipe 0.5 %);
//    NE pipe east of the drains/PVK (x 26.7) to its own outlet at the SE corner, SE pipe to
//    its own outlet south of the SE corner, NW pipe along the west side ~3.4 m south of the
//    SW gutter outlet;
//  - SW temporary gutter: open half-round 150 mm on the ground along the outer face of the
//    terrace step (x -0.23), off the step end onto the green area. The C/B south downpipe has
//    no observed continuation (unchanged).

export const R31_ROOFWATER_SOURCE = Object.freeze({
  observation: 'OWNER_FIELD_OBSERVATION_20261123_0727_0837',
  wellProduct: 'Melika (omistaja) – Merika AvantGarde 1780RS 110/315 kuvan perusteella todennäköinen (ei SKU-varmistus)',
  wellPhotoNw: 'https://drive.google.com/file/d/1Hbw4Ir3c7WHg2PDU58KcN6v1W_uunuS8/view',
  wellCatalog: 'https://meriser.fi/tuote/merika-avantgarde-sv-kaivo-110-315/',
  wellEvidence: 'RK_NW: 2026-04-25 owner photo of open bowl, perforated horizontal strainer and free elbow; RK_NE/RK_SE model shape assumed pending photos',
  basis: 'OWNER_20261123_0702_BEST_KNOWLEDGE_ASSUMPTION_CARD_STATES_UNCERTAINTY',
  downpipes: 'T12 five-downpipe system at owner points (R31 runtime / R32H c26d99c1 baked)',
});

export const R31_ROOFWATER_PROFILE = Object.freeze({"wells": {"RK_NW": {"x": -0.35, "z": -10.685, "groundY": 0.034, "hoodTopY": 0.234, "bottomY": -0.766, "diameterM": 0.315, "hoodDiameterM": 0.31, "skirtDiameterM": 0.315, "strainerDiameterM": 0.31, "strainerHoleDiameterM": 0.024, "downpipe": "T12_2026_CD_LANSI_POHJOINEN"}, "RK_NE": {"x": 25.75, "z": -10.685, "groundY": -0.903, "hoodTopY": -0.703, "bottomY": -1.703, "diameterM": 0.315, "hoodDiameterM": 0.31, "skirtDiameterM": 0.315, "strainerDiameterM": 0.31, "strainerHoleDiameterM": 0.024, "downpipe": "T12_2026_AB_ITA_POHJOINEN"}, "RK_SE": {"x": 25.75, "z": 1.585, "groundY": -1.248, "hoodTopY": -1.048, "bottomY": -2.048, "diameterM": 0.315, "hoodDiameterM": 0.31, "skirtDiameterM": 0.315, "strainerDiameterM": 0.31, "strainerHoleDiameterM": 0.024, "downpipe": "T12_2026_AB_ITA_ETELA"}}, "pipes": {"RK_NW_OUTLET": {"from": "RK_NW", "to": "OUTLET_NW", "points": [[-0.35, -0.35, -10.685], [-1.2, -0.354, -10.685], [-1.2, -0.422, 2.803], [-1.2, -0.441, 3.552], [-1.2, -0.448, 4.801], [-1.2, -0.461, 5.051], [-1.2, -0.506, 5.55], [-1.2, -0.521, 5.8], [-0.867, -0.526, 6.689], [-0.533, -0.625, 7.578], [-0.45, -0.629, 7.8]], "lengthM": 19.47, "slope": 0.005, "coverM": [0.15, 0.93], "endCoverM": 0.15}, "RK_NE_OUTLET": {"from": "RK_NE", "to": "OUTLET_NE", "points": [[25.75, -1.108, -10.685], [26.7, -1.119, -10.685], [26.7, -1.129, -9.702], [26.7, -1.136, -9.457], [26.7, -1.208, -8.965], [26.7, -1.231, -8.719], [26.7, -1.239, -8.474], [26.7, -1.253, -7.0], [26.7, -1.267, -6.754], [26.7, -1.286, -6.508], [26.7, -1.295, -6.262], [26.7, -1.31, -5.034], [26.7, -1.337, -4.543], [26.7, -1.347, -4.297], [26.7, -1.36, -3.068], [26.7, -1.397, -2.823], [26.7, -1.49, -2.085], [26.7, -1.498, -1.84], [26.7, -1.509, -0.857], [26.7, -1.64, 0.126], [26.7, -1.656, 1.6], [26.883, -1.658, 1.75], [27.067, -1.677, 1.9], [27.25, -1.738, 2.05], [27.433, -1.776, 2.2], [27.8, -1.784, 2.5]], "lengthM": 14.66, "slope": 0.01, "coverM": [0.15, 0.25], "endCoverM": 0.15}, "RK_SE_OUTLET": {"from": "RK_SE", "to": "OUTLET_SE", "points": [[25.75, -1.453, 1.585], [26.02, -1.459, 2.194], [26.11, -1.466, 2.397], [26.2, -1.486, 2.6], [26.267, -1.495, 3.467], [26.283, -1.501, 3.683], [26.3, -1.543, 3.9]], "lengthM": 2.41, "slope": 0.01, "coverM": [0.15, 0.17], "endCoverM": 0.15}}, "gutters": {"SW_TEMP_GUTTER": {"from": "T12_2026_CD_LANSI_ETELA", "to": "OUTLET_SW", "widthM": 0.15, "points": [[-0.31, -0.343, 1.595], [-0.23, -0.343, 1.7], [-0.23, -0.343, 1.928], [-0.23, -0.343, 2.156], [-0.23, -0.343, 2.384], [-0.23, -0.343, 2.612], [-0.23, -0.343, 2.84], [-0.23, -0.343, 3.068], [-0.23, -0.343, 3.296], [-0.23, -0.343, 3.524], [-0.23, -0.343, 3.752], [-0.23, -0.343, 3.98], [-0.265, -0.343, 4.19], [-0.3, -0.343, 4.4]]}}, "connectors": {"NE": {"downpipe": "T12_2026_AB_ITA_POHJOINEN", "points": [[25.698, -0.614, -10.685], [25.698, -0.703, -10.685]], "radiusM": 0.05, "lengthM": 0.09}, "SE": {"downpipe": "T12_2026_AB_ITA_ETELA", "points": [[25.698, -0.614, 1.585], [25.698, -1.048, 1.585]], "radiusM": 0.05, "lengthM": 0.43}}});
