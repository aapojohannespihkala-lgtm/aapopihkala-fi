"""Extract one glTF scene from a GLB into a new GLB whose default (and only) scene it is.

Keeps every node reachable from the chosen scene, and the meshes, materials,
cameras, accessors and bufferViews they use. Geometry bytes are copied verbatim;
only indices are remapped. Supports the feature set present in the Ylisrinne
models (no textures/images/skins/animations/sparse) and refuses anything else.

usage: python3 -I work-test-extract-scene.py IN.glb SCENE_INDEX OUT.glb

Deterministic: the same input bytes and scene index always give the same output
bytes, so the Worker's expectedSize/expectedSha256 can be pinned in advance.
"""
import json
import struct
import sys

UNSUPPORTED = ("textures", "images", "samplers", "skins", "animations")


def read_glb(path):
    data = open(path, "rb").read()
    magic, version, length = struct.unpack_from("<4sII", data, 0)
    assert magic == b"glTF" and version == 2 and length == len(data)
    jlen, jtype = struct.unpack_from("<II", data, 12)
    assert jtype == 0x4E4F534A
    gltf = json.loads(data[20 : 20 + jlen])
    off = 20 + jlen
    blen, btype = struct.unpack_from("<II", data, off)
    assert btype == 0x004E4942
    return gltf, data[off + 8 : off + 8 + blen]


def write_glb(path, gltf, binary):
    js = json.dumps(gltf, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    js += b" " * ((4 - len(js) % 4) % 4)
    binary += b"\0" * ((4 - len(binary) % 4) % 4)
    total = 12 + 8 + len(js) + 8 + len(binary)
    with open(path, "wb") as f:
        f.write(struct.pack("<4sII", b"glTF", 2, total))
        f.write(struct.pack("<II", len(js), 0x4E4F534A) + js)
        f.write(struct.pack("<II", len(binary), 0x004E4942) + binary)


def main(src, scene_index, dst):
    g, binary = read_glb(src)
    for key in UNSUPPORTED:
        assert not g.get(key), f"unsupported glTF feature present: {key}"
    assert len(g["buffers"]) == 1 and "uri" not in g["buffers"][0]
    assert not any("sparse" in a for a in g.get("accessors", []))

    scene = g["scenes"][scene_index]

    # 1. reachable nodes, in deterministic DFS order
    node_order, seen = [], set()
    stack = list(reversed(scene["nodes"]))
    while stack:
        n = stack.pop()
        if n in seen:
            continue
        seen.add(n)
        node_order.append(n)
        stack.extend(reversed(g["nodes"][n].get("children", [])))

    def collect(kind, ids):
        out, s = [], set()
        for i in ids:
            if i is not None and i not in s:
                s.add(i)
                out.append(i)
        return out

    meshes = collect("meshes", (g["nodes"][n].get("mesh") for n in node_order))
    cameras = collect("cameras", (g["nodes"][n].get("camera") for n in node_order))
    prims = [p for m in meshes for p in g["meshes"][m]["primitives"]]
    materials = collect("materials", (p.get("material") for p in prims))
    accessors = collect(
        "accessors",
        (a for p in prims for a in [*p["attributes"].values(), p.get("indices"), *[v for t in p.get("targets", []) for v in t.values()]]),
    )
    views = collect("bufferViews", (g["accessors"][a].get("bufferView") for a in accessors))

    remap = {
        "nodes": {o: i for i, o in enumerate(node_order)},
        "meshes": {o: i for i, o in enumerate(meshes)},
        "cameras": {o: i for i, o in enumerate(cameras)},
        "materials": {o: i for i, o in enumerate(materials)},
        "accessors": {o: i for i, o in enumerate(accessors)},
        "bufferViews": {o: i for i, o in enumerate(views)},
    }

    # 2. rebuild binary: copy each kept bufferView verbatim, 4-byte aligned
    new_bin = bytearray()
    new_views = []
    for v in views:
        bv = dict(g["bufferViews"][v])
        start = bv.get("byteOffset", 0)
        chunk = binary[start : start + bv["byteLength"]]
        while len(new_bin) % 4:
            new_bin += b"\0"
        bv["byteOffset"] = len(new_bin)
        bv["buffer"] = 0
        new_bin += chunk
        new_views.append(bv)

    def remap_node(n):
        node = dict(g["nodes"][n])
        if "children" in node:
            node["children"] = [remap["nodes"][c] for c in node["children"]]
        if "mesh" in node:
            node["mesh"] = remap["meshes"][node["mesh"]]
        if "camera" in node:
            node["camera"] = remap["cameras"][node["camera"]]
        return node

    def remap_mesh(m):
        mesh = json.loads(json.dumps(g["meshes"][m]))
        for p in mesh["primitives"]:
            p["attributes"] = {k: remap["accessors"][v] for k, v in p["attributes"].items()}
            if "indices" in p:
                p["indices"] = remap["accessors"][p["indices"]]
            if "material" in p:
                p["material"] = remap["materials"][p["material"]]
            if "targets" in p:
                p["targets"] = [{k: remap["accessors"][v] for k, v in t.items()} for t in p["targets"]]
        return mesh

    def remap_accessor(a):
        acc = dict(g["accessors"][a])
        if "bufferView" in acc:
            acc["bufferView"] = remap["bufferViews"][acc["bufferView"]]
        return acc

    out = {k: v for k, v in g.items() if k not in ("scenes", "scene", "nodes", "meshes", "cameras", "materials", "accessors", "bufferViews", "buffers")}
    new_scene = dict(scene)
    new_scene["nodes"] = [remap["nodes"][n] for n in scene["nodes"]]
    out["scene"] = 0
    out["scenes"] = [new_scene]
    out["nodes"] = [remap_node(n) for n in node_order]
    out["meshes"] = [remap_mesh(m) for m in meshes]
    if cameras:
        out["cameras"] = [g["cameras"][c] for c in cameras]
    out["materials"] = [g["materials"][m] for m in materials]
    out["accessors"] = [remap_accessor(a) for a in accessors]
    out["bufferViews"] = new_views
    out["buffers"] = [{"byteLength": len(new_bin)}]
    asset = dict(out["asset"])
    asset["generator"] = f"work-test-extract-scene.py: scene {scene_index} of {len(g['scenes'])} extracted verbatim (geometry bytes unchanged)"
    out["asset"] = asset

    write_glb(dst, out, bytes(new_bin))
    print(json.dumps({
        "sourceScene": scene_index, "sourceSceneName": scene.get("name"),
        "nodes": len(node_order), "meshes": len(meshes), "materials": len(materials),
        "cameras": len(cameras), "accessors": len(accessors), "bufferViews": len(views),
        "binBytes": len(new_bin),
    }, indent=1))


if __name__ == "__main__":
    main(sys.argv[1], int(sys.argv[2]), sys.argv[3])
