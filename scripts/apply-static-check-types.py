from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    text = file_path.read_text(encoding="utf-8")
    if new in text:
        return
    if old not in text:
        raise RuntimeError(f"Expected snippet not found in {path}: {old!r}")
    file_path.write_text(text.replace(old, new, 1), encoding="utf-8")


def replace_all(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    text = file_path.read_text(encoding="utf-8")
    if old not in text and new in text:
        return
    if old not in text:
        raise RuntimeError(f"Expected snippet not found in {path}: {old!r}")
    file_path.write_text(text.replace(old, new), encoding="utf-8")


bee = "src/components/PointBee.astro"
replace_once(
    bee,
    "  import { THREE, OrbitControls } from '../scripts/threeRuntime';\n",
    "  import { THREE, OrbitControls } from '../scripts/threeRuntime';\n  import type { BufferGeometry, Material, Vector3 } from 'three';\n",
)
replace_once(bee, "    const roots = document.querySelectorAll('[data-point-bee]');", "    const roots = document.querySelectorAll<HTMLElement>('[data-point-bee]');")
replace_once(bee, "      const canvas = root.querySelector('[data-point-bee-canvas]');", "      const canvas = root.querySelector<HTMLCanvasElement>('[data-point-bee-canvas]');")
replace_once(bee, "        const bodyPositions = [];", "        const bodyPositions: number[] = [];")
replace_once(bee, "        const bandPositions = [];", "        const bandPositions: number[] = [];")
replace_once(bee, "        const bodyGeometries = [];", "        const bodyGeometries: BufferGeometry[] = [];")
replace_once(bee, "        const lineGeometries = [];", "        const lineGeometries: BufferGeometry[] = [];")
replace_once(
    bee,
    "        const addEllipsoidPoints = (\n          center,\n          radiusX,\n          radiusY,\n          radiusZ,\n          latSteps,\n          lonSteps,\n          target = bodyPositions\n        ) => {",
    "        const addEllipsoidPoints = (\n          center: Vector3,\n          radiusX: number,\n          radiusY: number,\n          radiusZ: number,\n          latSteps: number,\n          lonSteps: number,\n          target: number[] = bodyPositions\n        ) => {",
)
replace_once(bee, "        const makeLine = (points, material = appendageMaterial) => {", "        const makeLine = (points: Vector3[], material: Material = appendageMaterial) => {")
replace_once(bee, "        const makeWingSurface = (side, rear = false) => {", "        const makeWingSurface = (side: number, rear = false) => {")
replace_once(bee, "          const positions = [];", "          const positions: number[] = [];")
replace_once(bee, "          const outline = [];", "          const outline: Vector3[] = [];")
replace_once(bee, "          const centerVein = [];", "          const centerVein: Vector3[] = [];")
replace_once(bee, "        const animate = (time) => {", "        const animate = (time: number) => {")

butterfly = "src/components/PointButterfly.astro"
replace_once(
    butterfly,
    "  import { THREE, OrbitControls } from '../scripts/threeRuntime';\n",
    "  import { THREE, OrbitControls } from '../scripts/threeRuntime';\n  import type { BufferGeometry, Group, Material, Vector3 } from 'three';\n",
)
replace_once(butterfly, "    const roots = document.querySelectorAll('[data-point-butterfly]');", "    const roots = document.querySelectorAll<HTMLElement>('[data-point-butterfly]');")
replace_once(butterfly, "      const canvas = root.querySelector('[data-point-butterfly-canvas]');", "      const canvas = root.querySelector<HTMLCanvasElement>('[data-point-butterfly-canvas]');")
replace_once(butterfly, "        const outerRadius = (theta) => {", "        const outerRadius = (theta: number) => {")
replace_once(butterfly, "        const wingCamber = (radiusFraction, theta) => {", "        const wingCamber = (radiusFraction: number, theta: number) => {")
replace_once(butterfly, "        const makeWing = (side) => {", "        const makeWing = (side: number) => {")
replace_once(butterfly, "          const positions = [];", "          const positions: number[] = [];")
replace_once(butterfly, "          const makeLine = (points, material = veinMaterial) => {", "          const makeLine = (points: Vector3[], material: Material = veinMaterial) => {")
replace_all(butterfly, "            const linePoints = [];", "            const linePoints: Vector3[] = [];")
replace_once(butterfly, "          const edgePoints = [];", "          const edgePoints: Vector3[] = [];")
replace_once(butterfly, "        const bodyPositions = [];", "        const bodyPositions: number[] = [];")
replace_once(butterfly, "        const antennaGeometries = [];", "        const antennaGeometries: BufferGeometry[] = [];")
replace_once(butterfly, "        const animate = (time) => {", "        const animate = (time: number) => {")
replace_once(
    butterfly,
    "          leftWing.veinGroup.children.forEach((child) => child.geometry.dispose());\n          rightWing.veinGroup.children.forEach((child) => child.geometry.dispose());",
    "          const disposeVeinGeometries = (group: Group) => {\n            group.children.forEach((child) => {\n              if (child instanceof THREE.Line) {\n                child.geometry.dispose();\n              }\n            });\n          };\n\n          disposeVeinGeometries(leftWing.veinGroup);\n          disposeVeinGeometries(rightWing.veinGroup);",
)

topography = "src/components/Topography.astro"
replace_once(topography, "    document.querySelectorAll(\n      '[data-topography]'\n    );", "    document.querySelectorAll<HTMLCanvasElement>(\n      '[data-topography]'\n    );")
replace_once(
    topography,
    "  const terrain = (\n    x,\n    y,\n    phase\n  ) => {",
    "  const terrain = (\n    x: number,\n    y: number,\n    phase: number\n  ) => {",
)
replace_once(
    topography,
    "  const interpolate = (\n    a,\n    b,\n    level\n  ) => {",
    "  const interpolate = (\n    a: number,\n    b: number,\n    level: number\n  ) => {",
)
replace_once(
    topography,
    "  const drawContour = (\n    ctx,\n    values,\n    level,\n    width,\n    height\n  ) => {",
    "  const drawContour = (\n    ctx: CanvasRenderingContext2D,\n    values: Float32Array,\n    level: number,\n    width: number,\n    height: number\n  ) => {",
)
replace_once(
    topography,
    "    const point = (\n      edge,\n      x,\n      y,\n      tl,\n      tr,\n      br,\n      bl\n    ) => {",
    "    const point = (\n      edge: number,\n      x: number,\n      y: number,\n      tl: number,\n      tr: number,\n      br: number,\n      bl: number\n    ): [number, number] => {",
)
replace_once(
    topography,
    "    const connect = (\n      edgeA,\n      edgeB,\n      x,\n      y,\n      tl,\n      tr,\n      br,\n      bl\n    ) => {",
    "    const connect = (\n      edgeA: number,\n      edgeB: number,\n      x: number,\n      y: number,\n      tl: number,\n      tr: number,\n      br: number,\n      bl: number\n    ) => {",
)
replace_once(topography, "  const setupCanvas = (\n    canvas\n  ) => {", "  const setupCanvas = (\n    canvas: HTMLCanvasElement\n  ) => {")
replace_once(topography, "    const animate = (\n      time\n    ) => {", "    const animate = (\n      time: number\n    ) => {")
