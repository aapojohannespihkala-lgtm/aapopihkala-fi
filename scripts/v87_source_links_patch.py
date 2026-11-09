#!/usr/bin/env python3
"""Exact-V87 metadata-only sourceLinks patch candidate, not a production publisher.

Usage: python scripts/v87_source_links_patch.py V87__scene297.zip candidate.glb

Refuses wrong GLB SHA, existing target sourceLinks, wrong nodes and output overwrite.
Preserves every scene, node order, original extras except the five added sourceLinks,
all meshes, parent links, transforms, materials, accessors and every non-JSON GLB chunk
byte-for-byte. New GLB SHA and any viewer profile need separate approval.
Historical plans and product references are *not* evidence of installed geometry.
"""

import argparse
import copy
import hashlib
import json
from pathlib import Path
import struct
import zipfile

V87_SHA256 = '438d5bcace7b66a2ca08100ff56e56989b11139035696258900aa5043d988c1e'
GLB_MAGIC = b'glTF'
JSON_CHUNK = b'JSON'

TARGET_NAMES = {
    11298: 'V85_D2F_ISLAND_PLINTH_100MM_DARK_RECESSED_30MM',
    11304: 'V85_D2F_ROOM3_WARDROBE_RESTORED_K1_500_PLUS_1000',
    11311: 'V86_SAUNA_HARVIA_CILINDRO_PC90_HPC900400_FROM_R1_PRODUCT_MODEL',
    11315: 'V86_D1F_WALKIN_CLOSET_EXHAUST_VALVE_ON_WALL_AT_DUCT_END',
    11319: 'V87_D2F_IV_RISER_SHAFT_BOXING_WORK_ASSUMPTION',
}

SOURCE_LINKS = {
    11298: [{
        'docId': 'DOC:1uSSl1kAUP3OmMQ64U3DqEAd3huGW_p_iHla9pT9IUto',
        'link': 'https://docs.google.com/document/d/1uSSl1kAUP3OmMQ64U3DqEAd3huGW_p_iHla9pT9IUto/edit',
        'role': 'ownerMeasurement',
        'supports': '2026 owner-measured island plinth height 100mm only; not recess30mm or installed XYZ',
    }],
    11311: [{
        'docId': 'DRIVE:1sc5v-OhixMjUXGqIK_y8yclhD1XDGl7A',
        'link': 'https://drive.google.com/file/d/1sc5v-OhixMjUXGqIK_y8yclhD1XDGl7A/view',
        'role': 'productGeometryReference',
        'supports': 'Harvia Cilindro PC90 HPC900400 source model only; installation and clearances HOST_HOLD',
    }],
    11315: [{
        'docId': 'DRIVE:1cbo8g7mcs9zAWgUE9w2EOm_t9R1vIl1X',
        'link': 'https://drive.google.com/file/d/1cbo8g7mcs9zAWgUE9w2EOm_t9R1vIl1X/view',
        'role': 'historicalPlan2015',
        'supports': 'IV 3001D schematic only; 2026 wall placement and exact host remain WORK_TEST/HOST_HOLD',
    }],
    11319: [{
        'docId': 'DRIVE:1gb4mEwhOgxIkgxH9kXOecUxjs8eN7XF9',
        'link': 'https://drive.google.com/file/d/1gb4mEwhOgxIkgxH9kXOecUxjs8eN7XF9/view',
        'role': 'historicalPlan2015',
        'supports': 'IV 3002D riser symbols only; boxing dimensions, host and current installation NOT VERIFIED',
    }],
}


def read_glb(data: bytes):
    if len(data) < 20 or data[:4] != GLB_MAGIC:
        raise ValueError('not a GLB')
    version, declared = struct.unpack_from('<II', data, 4)
    if version != 2 or declared != len(data):
        raise ValueError('GLB version/length mismatch')
    offset, chunks = 12, []
    while offset < len(data):
        if offset + 8 > len(data):
            raise ValueError('truncated chunk header')
        length, chunk_type = struct.unpack_from('<I4s', data, offset)
        end = offset + 8 + length
        if length % 4 or end > len(data):
            raise ValueError('invalid chunk length')
        chunks.append((chunk_type, data[offset + 8:end]))
        offset = end
    if len(chunks) < 1 or chunks[0][0] != JSON_CHUNK:
        raise ValueError('first GLB chunk is not JSON')
    document = json.loads(chunks[0][1].decode('utf-8'))
    return document, chunks


def patch_document(document):
    result = copy.deepcopy(document)
    nodes = result.get('nodes', [])
    for index, expected_name in TARGET_NAMES.items():
        if index >= len(nodes) or nodes[index].get('name') != expected_name:
            raise ValueError(f'node {index} identity mismatch')
        extras = nodes[index].get('extras')
        if not isinstance(extras, dict) or 'sourceLinks' in extras:
            raise ValueError(f'node {index} extras/sourceLinks not in expected state')

    # The original 2015-PAX/G2 references are already structured on node 7335.
    # They cover historical dimensions and context, NOT the restored 2026 cabinet placement.
    source = nodes[7335].get('extras', {}).get('sourceLinks')
    if nodes[7335].get('name') != 'ROOM3_TWO_DOOR_CABINET_EAST_1000MM_OWNER_ESTIMATE_K1_V8':
        raise ValueError('original wardrobe source node 7335 identity mismatch')
    if not isinstance(source, list) or not source:
        raise ValueError('original wardrobe node 7335 has no structured sources')

    patches = {**SOURCE_LINKS, 11304: source}
    for index in TARGET_NAMES:
        links = copy.deepcopy(patches[index])
        for record in links:
            if not all(isinstance(record.get(k), str) and record[k] for k in ('docId', 'link', 'role', 'supports')):
                raise ValueError('incomplete source record')
            if not record['link'].startswith(('https://drive.google.com/', 'https://docs.google.com/')):
                raise ValueError('unsupported source URL')
        nodes[index]['extras']['sourceLinks'] = links
    return result


def encode_glb(document, chunks):
    encoded = json.dumps(document, separators=(',', ':'), ensure_ascii=False).encode('utf-8')
    encoded += b' ' * (-len(encoded) % 4)
    new_chunks = [(JSON_CHUNK, encoded), *chunks[1:]]
    body = b''.join(struct.pack('<I4s', len(payload), kind) + payload for kind, payload in new_chunks)
    return struct.pack('<4sII', GLB_MAGIC, 2, 12 + len(body)) + body


def patch_glb(source_glb: bytes, expected_sha=V87_SHA256):
    digest = hashlib.sha256(source_glb).hexdigest()
    if digest != expected_sha:
        raise ValueError(f'exact GLB SHA mismatch: {digest}')
    document, chunks = read_glb(source_glb)
    repaired = patch_document(document)
    output = encode_glb(repaired, chunks)
    verified, new_chunks = read_glb(output)
    if verified != repaired or new_chunks[1:] != chunks[1:]:
        raise ValueError('postwrite document/BIN mismatch')
    old_nodes, new_nodes = document['nodes'], verified['nodes']
    for index in range(len(old_nodes)):
        if index not in TARGET_NAMES and old_nodes[index] != new_nodes[index]:
            raise ValueError('unrelated GLB node changed')
    for index in TARGET_NAMES:
        baseline = copy.deepcopy(new_nodes[index])
        baseline['extras'].pop('sourceLinks')
        if baseline != old_nodes[index]:
            raise ValueError('non-sourceLinks content changed')
    return output


def get_source(path: Path):
    if path.suffix.lower() != '.zip':
        return path.read_bytes()
    with zipfile.ZipFile(path) as container:
        members = [name for name in container.namelist() if name.lower().endswith('.glb')]
        if len(members) != 1 or container.testzip() is not None:
            raise ValueError('source ZIP must contain exactly one intact GLB')
        return container.read(members[0])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path, help='exact original V87 GLB or ZIP')
    parser.add_argument('output', type=Path, help='new standalone candidate .glb, no overwrite')
    args = parser.parse_args()
    if args.output.exists() or args.input.resolve() == args.output.resolve():
        parser.error('refusing to overwrite input or existing output')
    original = get_source(args.input)
    patched = patch_glb(original)
    args.output.write_bytes(patched)
    print(json.dumps({
        'status': 'METADATA_ONLY_WORK_TEST_HOST_HOLD_NOT_PUBLISHED',
        'source_sha256': V87_SHA256,
        'candidate_sha256': hashlib.sha256(patched).hexdigest(),
        'source_bin_chunks_preserved': True,
        'patched_node_indices': list(TARGET_NAMES),
        'output': str(args.output),
    }))


if __name__ == '__main__':
    main()
