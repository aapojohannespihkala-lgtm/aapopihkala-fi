"""Prove the extracted GLB renders the same geometry as the source scene.

Walks SRC scene S and the OUT default scene in the same depth-first order and
hashes, per node: name, extras, the chain of local transforms; per primitive:
mode, full material JSON and the raw element bytes + metadata of every
accessor. Equal digests mean the same renderable content. Mismatch -> exit 1.

usage: python3 -I work-test-verify-scene-equal.py SRC.glb SCENE OUT.glb
"""
import hashlib
import json
import struct
import sys

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from importlib import import_module
read_glb = import_module("work-test-extract-scene").read_glb  # noqa: E402

COMP = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}
NCOMP = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT2": 4, "MAT3": 9, "MAT4": 16}


def accessor_bytes(g, b, a):
    acc = g["accessors"][a]
    bv = g["bufferViews"][acc["bufferView"]]
    elem = COMP[acc["componentType"]] * NCOMP[acc["type"]]
    stride = bv.get("byteStride", elem)
    base = bv.get("byteOffset", 0) + acc.get("byteOffset", 0)
    out = bytearray()
    for i in range(acc["count"]):
        out += b[base + i * stride : base + i * stride + elem]
    meta = {k: acc[k] for k in ("componentType", "type", "count", "normalized", "min", "max") if k in acc}
    return json.dumps(meta, sort_keys=True).encode() + bytes(out)


def walk(g, b, roots):
    h = hashlib.sha256()
    count = 0
    stack = [(n, ()) for n in reversed(roots)]
    while stack:
        n, path = stack.pop()
        node = g["nodes"][n]
        tf = {k: node.get(k) for k in ("matrix", "translation", "rotation", "scale")}
        here = path + (json.dumps(tf, sort_keys=True),)
        h.update(json.dumps([node.get("name"), node.get("extras"), here], sort_keys=True).encode())
        if "mesh" in node:
            for p in g["meshes"][node["mesh"]]["primitives"]:
                count += 1
                h.update(str(p.get("mode", 4)).encode())
                if "material" in p:
                    h.update(json.dumps(g["materials"][p["material"]], sort_keys=True).encode())
                for k in sorted(p["attributes"]):
                    h.update(k.encode() + accessor_bytes(g, b, p["attributes"][k]))
                if "indices" in p:
                    h.update(b"IDX" + accessor_bytes(g, b, p["indices"]))
        if "camera" in node:
            h.update(json.dumps(g["cameras"][node["camera"]], sort_keys=True).encode())
        stack.extend((c, here) for c in reversed(node.get("children", [])))
    return h.hexdigest(), count


src_g, src_b = read_glb(sys.argv[1])
out_g, out_b = read_glb(sys.argv[3])
s = int(sys.argv[2])
assert out_g["scene"] == 0 and len(out_g["scenes"]) == 1
a = walk(src_g, src_b, src_g["scenes"][s]["nodes"])
o = walk(out_g, out_b, out_g["scenes"][0]["nodes"])
print("source scene", s, "digest", a[0], "primitives", a[1])
print("output default digest", o[0], "primitives", o[1])
print("IDENTICAL" if a == o else "DIFFERENT")
sys.exit(0 if a == o else 1)
