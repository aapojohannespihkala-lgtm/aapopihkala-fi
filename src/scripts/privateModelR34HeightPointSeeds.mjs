// R34 original, opt-in point seeds. G1 glTF XYZ metres, Y is elevation.
// Source: High VIEWER-HEIGHT-POINTS, 26.11.2026, original GLB SHA below.
// Scene and node/mesh/primitive/triangle are source anchors, NOT as-built heights.
// No inferred N2000 conversion. The caller must check active source geometry.
export const R34_HEIGHT_POINT_SOURCE_SHA256 = "99210ea517c18cf24fa5f9702abe12ed2a8058a0c606d38b863e19802a270725";
export const R34_HEIGHT_POINT_SOURCE_SCENE = "__scene822";
const ANCHORS = Object.freeze([
  {
    "id": "r34-cd-ridge",
    "label": "CD harja",
    "position": [
      2.8875,
      7.73,
      -4.58
    ],
    "source": {
      "node": 13360,
      "mesh": 5111,
      "primitive": 1,
      "triangle": 1
    },
    "scenes": [
      "__scene822"
    ]
  },
  {
    "id": "r34-cd-north-eave",
    "label": "CD pohjoisräystäs",
    "position": [
      2.8875,
      6,
      -11.5
    ],
    "source": {
      "node": 13360,
      "mesh": 5111,
      "primitive": 0,
      "triangle": 0
    },
    "scenes": [
      "__scene822"
    ]
  },
  {
    "id": "r34-ab-ridge",
    "label": "AB harja",
    "position": [
      19.35,
      6.73,
      -4.58
    ],
    "source": {
      "node": 13361,
      "mesh": 5112,
      "primitive": 0,
      "triangle": 0
    },
    "scenes": [
      "__scene822"
    ]
  },
  {
    "id": "r34-ab-north-eave",
    "label": "AB pohjoisräystäs",
    "position": [
      19.35,
      5,
      -11.5
    ],
    "source": {
      "node": 13361,
      "mesh": 5112,
      "primitive": 0,
      "triangle": 1
    },
    "scenes": [
      "__scene822"
    ]
  },
  {
    "id": "r34-d-terrace",
    "label": "D-terassi, laudan pinta",
    "position": [
      2.22,
      -0.155,
      0.343
    ],
    "source": {
      "node": 8695,
      "mesh": 2164,
      "primitive": 0,
      "triangle": 6
    },
    "scenes": [
      "__scene822"
    ]
  },
  {
    "id": "r34-1f-wet-floor",
    "label": "1F pesuhuone, laatoitus",
    "position": [
      5.1273,
      0.0775,
      -2.4227
    ],
    "source": {
      "node": 12320,
      "mesh": 4630,
      "primitive": 0,
      "triangle": 54
    },
    "scenes": [
      "__scene822"
    ]
  },
  {
    "id": "r34-2f-plank-floor",
    "label": "2F vaalea lankku",
    "position": [
      2.8273,
      2.763,
      -8.2983
    ],
    "source": {
      "node": 9257,
      "mesh": 3271,
      "primitive": 2,
      "triangle": 151
    },
    "scenes": [
      "__scene822",
      "__scene824",
      "__scene825"
    ]
  },
  {
    "id": "r34-2f-wc-floor",
    "label": "2F WC, laatoitus",
    "position": [
      5.6163,
      2.843,
      -6.2247
    ],
    "source": {
      "node": 9911,
      "mesh": 3589,
      "primitive": 0,
      "triangle": 97
    },
    "scenes": [
      "__scene822",
      "__scene824",
      "__scene825"
    ]
  }
].map(point => Object.freeze({
  ...point,
  position: Object.freeze([...point.position]),
  source: Object.freeze({...point.source}),
  scenes: Object.freeze([...point.scenes]),
})));

// An exact SHA and explicit source scene are required. No fallback to "latest",
// nearby geometry, other model variants or unverified floor shells.
export function createR34HeightPointSeeds({ modelSha256, sceneName } = {}) {
  if (modelSha256 !== R34_HEIGHT_POINT_SOURCE_SHA256 || typeof sceneName !== "string") return [];
  return ANCHORS.filter(point => point.scenes.includes(sceneName)).map(point => ({
    id: point.id,
    label: point.label,
    position: { x: point.position[0], y: point.position[1], z: point.position[2] },
    source: { ...point.source },
    sourceSha256: R34_HEIGHT_POINT_SOURCE_SHA256,
    sourceScene: sceneName,
    evidence: "SOURCE_TRIANGLE_WORK_TEST_NOT_AS_BUILT",
  }));
}
