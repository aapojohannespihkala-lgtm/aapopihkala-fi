#!/usr/bin/env python3
"""Fail closed on stale scene-root references in the noncanonical D1F ODENSVIK GLB.

Used only after private Drive download and before machine PUT. Never writes GLB.
Structural proof does not replace full source SHA, WebGL pixels or HUMAN_REVIEW.
"""
import json
import struct
import sys
from pathlib import Path

VARIANTS = ("WEST_ANCHOR_725_895_740", "WEST_ANCHOR_740_895_725",
            "EAST_ANCHOR_725_895_740", "EAST_ANCHOR_740_895_725")
SURFACES = ("KPH_FLOOR", "SAUNA_FLOOR", "ORDINARY_FLOOR", "KPH_CEILING", "SAUNA_CEILING")
THEMOS = ("THEMO_LOBBY", "THEMO_BEDROOM", "THEMO_BATHROOM")
WC_SHA = "43d2a17e3f551afb552adbc87d05618e1d22aacd5cbbdd0ffa15625e588264ab"

def fail(code):
    raise ValueError("ODENSVIK_WINDING_40_SOURCE_GATE_REJECTED:" + code)

def index(value, maximum, key):
    if isinstance(value, bool) or not isinstance(value, int) or not 0 <= value < maximum:
        fail(key + ":invalid-node-index")
    return value

def parse_glb(data):
    if not isinstance(data, bytes) or len(data) < 28:
        fail("missing-source-GLB")
    magic, version, length = struct.unpack_from("<4sII", data)
    if magic != b"glTF" or version != 2 or length != len(data) or length % 4:
        fail("invalid-GLB-header-or-size")
    pos, parsed, binary_seen = 12, None, False
    while pos < len(data):
        if pos + 8 > len(data):
            fail("truncated-GLB-chunk")
        size, kind = struct.unpack_from("<I4s", data, pos)
        pos += 8
        if size % 4 or pos + size > len(data):
            fail("invalid-GLB-chunk")
        if kind == b"JSON":
            if parsed is not None:
                fail("duplicate-GLB-JSON")
            try:
                parsed = json.loads(data[pos:pos + size].decode("utf8").rstrip(" \r\n\t\x00"))
            except (ValueError, UnicodeError):
                fail("invalid-GLB-JSON")
        elif kind == b"BIN\x00":
            if binary_seen:
                fail("duplicate-GLB-BIN")
            binary_seen = True
        else:
            fail("unknown-GLB-chunk")
        pos += size
    if pos != len(data) or not isinstance(parsed, dict) or not binary_seen:
        fail("incomplete-source-GLB")
    return parsed

def reachable(nodes, root):
    seen, remaining = set(), [root]
    while remaining:
        i = index(remaining.pop(), len(nodes), "tree")
        if i in seen:
            continue
        node = nodes[i]
        if not isinstance(node, dict) or not isinstance(node.get("children", []), list):
            fail("invalid-source-tree")
        seen.add(i)
        remaining.extend(node.get("children", []))
    return seen

def validate(payload):
    scenes, nodes = payload.get("scenes"), payload.get("nodes")
    if not isinstance(scenes, list) or len(scenes) != 116 or not isinstance(nodes, list):
        fail("expected-116-corrected-source-scenes")
    if payload.get("scene") != 112:
        fail("expected-default-corrected-scene112")
    meshes = payload.get("meshes")
    if not isinstance(meshes, list) or len(meshes) <= 768:
        fail("missing-original-and-corrected-meshes")
    try:
        old_prim = meshes[765]["primitives"][0]
        new_prim = meshes[768]["primitives"][0]
        if (len(meshes[765]["primitives"]) != 1 or len(meshes[768]["primitives"]) != 1 or
            old_prim["attributes"]["POSITION"] != new_prim["attributes"]["POSITION"] or
            old_prim["attributes"]["NORMAL"] == new_prim["attributes"]["NORMAL"] or
            old_prim["indices"] == new_prim["indices"] or old_prim["material"] != new_prim["material"] or
            new_prim.get("mode", 4) != 4):
            fail("corrected-counter-mesh-not-source-preserving")
    except (KeyError, IndexError, TypeError):
        fail("corrected-counter-mesh-malformed")
    for v, variant in enumerate(VARIANTS):
        scene_index = 112 + v
        scene = scenes[scene_index]
        if not isinstance(scene, dict) or not isinstance(scene.get("nodes"), list) or len(scene["nodes"]) != 1:
            fail(f"scene{scene_index}:missing-source-root")
        root_id = index(scene["nodes"][0], len(nodes), "root")
        root = nodes[root_id]
        sx, rx = scene.get("extras"), root.get("extras") if isinstance(root, dict) else None
        if not isinstance(sx, dict) or not isinstance(rx, dict):
            fail(f"scene{scene_index}:missing-source-extras")
        if (variant not in str(scene.get("name", "")) or "ODENSVIK 00193937" not in str(scene.get("name", "")) or
            variant not in str(root.get("name", "")) or "ODENSVIK00193937_WORK_TEST" not in str(root.get("name", "")) or
            sx.get("sourceScene") != scene_index - 8 or sx.get("productNumber") != "001.939.37" or
            sx.get("parentApprovedWCModelSha256") != WC_SHA):
            fail(f"scene{scene_index}:wrong-source-or-WC-provenance")
        for flags in (sx, rx):
            if (flags.get("WORK_TEST_ONLY") is not True or flags.get("current") is not False or
                flags.get("Canonical") is not False or flags.get("asBuilt") is not False or
                flags.get("publishToCURRENT") is not False or flags.get("HUMAN_REVIEW") != "NOT_RUN"):
                fail(f"scene{scene_index}:noncanonical-gate-failed")
        original_scene = scenes[108 + v]
        if (not isinstance(original_scene, dict) or not isinstance(original_scene.get("nodes"), list) or
            len(original_scene["nodes"]) != 1 or not isinstance(original_scene.get("extras"), dict)):
            fail(f"scene{scene_index}:original-scene-missing")
        original_id = index(original_scene["nodes"][0], len(nodes), "original-root")
        original_root = nodes[original_id]
        if (not isinstance(original_root, dict) or not isinstance(original_root.get("extras"), dict) or
            not isinstance(original_root.get("children"), list) or
            not isinstance(root.get("children"), list)):
            fail(f"scene{scene_index}:original-root-missing")
        source_extras = original_root["extras"]
        original_counter = index(source_extras.get("counterNode"), len(nodes), "original-counter")
        corrected_counter = index(rx.get("counterNode"), len(nodes), "corrected-counter")
        old_children, new_children = original_root["children"], root["children"]
        if (sx.get("sourceScenePreserved") != 108 + v or
            sx.get("counterFaceWindingCorrected") is not True or
            sx.get("sourceCounterMesh") != 765 or sx.get("correctedCounterMesh") != 768 or
            "WINDING_CORRECTED" not in str(scene.get("name", "")) or
            "WINDING_CORRECTED" not in str(root.get("name", "")) or
            rx.get("sourceRootNodePreserved") != original_id or
            rx.get("sourceCounterNodePreserved") != original_counter or
            rx.get("counterFaceWindingSourceMesh") != 765 or
            rx.get("counterFaceWindingNewMesh") != 768 or
            rx.get("counterFaceWindingCorrected") is not True or
            rx.get("onlyCounterWindingChanged") is not True or
            nodes[original_counter].get("mesh") != 765 or
            nodes[corrected_counter].get("mesh") != 768 or
            original_counter == corrected_counter or
            new_children != [corrected_counter if x == original_counter else x for x in old_children]):
            fail(f"scene{scene_index}:counter-only-winding-lineage")
        for old_flags in (original_scene["extras"], source_extras):
            if (old_flags.get("WORK_TEST_ONLY") is not True or old_flags.get("current") is not False or
                old_flags.get("Canonical") is not False or old_flags.get("asBuilt") is not False or
                old_flags.get("publishToCURRENT") is not False or
                old_flags.get("HUMAN_REVIEW") != "NOT_RUN"):
                fail(f"scene{scene_index}:source-promotion-forbidden")
        surfaces, themos = rx.get("surfaceNodes"), rx.get("themoNodes")
        if (not isinstance(surfaces, dict) or set(surfaces) != set(SURFACES) or
            not isinstance(themos, dict) or set(themos) != set(THEMOS)):
            fail(f"scene{scene_index}:incomplete-10-target-roster")
        targets = [("counterNode", rx.get("counterNode"), "D1F_COUNTER_"),
                   ("cabinetNode", rx.get("cabinetNode"), "D1F_SINGLE_CABINET_")]
        targets += [(k, surfaces[k], k + "_") for k in SURFACES]
        targets += [(k, themos[k], "P137E_" + k + "_") for k in THEMOS]
        descendants, hits = reachable(nodes, root_id), []
        for label, raw_idx, prefix in targets:
            idx = index(raw_idx, len(nodes), f"scene{scene_index}:{label}")
            if idx not in descendants or idx == root_id:
                fail(f"scene{scene_index}:{label}:outside-current-scene")
            name = nodes[idx].get("name", "") if isinstance(nodes[idx], dict) else ""
            if not isinstance(name, str) or not name.startswith(prefix) or variant not in name:
                fail(f"scene{scene_index}:{label}:wrong-source-node-name")
            hits.append(idx)
        if len(hits) != 10 or len(set(hits)) != 10:
            fail(f"scene{scene_index}:duplicate-or-missing-target")
    return True

def main():
    if len(sys.argv) != 2:
        fail("expected-one-local-GLB-path")
    path = Path(sys.argv[1])
    if not path.is_file() or path.is_symlink():
        fail("source-GLB-path-unavailable")
    validate(parse_glb(path.read_bytes()))
    print("D1F ODENSVIK corrected-winding scene semantic gate: PASS 4 scenes / 40 targets; WORK_TEST only")

if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError) as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
