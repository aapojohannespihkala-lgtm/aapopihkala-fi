#!/usr/bin/env python3
"""Fail-closed, byte-preserving GLB extraction for the WORK_TEST publisher.

Drive remains the immutable source. A ZIP is only a transport wrapper: source
identity and production readback always use the resulting GLB bytes, never ZIP.
"""
import argparse
import json
import shutil
import struct
import sys
import zipfile
from pathlib import Path, PurePosixPath

MAX_TRANSPORT_BYTES = 64 * 1024 * 1024
MAX_GLB_BYTES = 64 * 1024 * 1024
MAX_ARCHIVE_UNCOMPRESSED_BYTES = 128 * 1024 * 1024

class InvalidSource(ValueError):
    pass

def validate_glb(path: Path) -> None:
    size = path.stat().st_size
    if size < 20 or size > MAX_GLB_BYTES or size % 4:
        raise InvalidSource("GLB size is invalid")
    with path.open("rb") as handle:
        header = handle.read(20)
        magic, version, declared, chunk_length, chunk_type = struct.unpack("<4sIIII", header)
        if magic != b"glTF" or version != 2 or declared != size:
            raise InvalidSource("GLB header identity is invalid")
        if chunk_type != 0x4E4F534A or not chunk_length or chunk_length > size - 20:
            raise InvalidSource("GLB first chunk must be a bounded JSON chunk")
        try:
            gltf = json.loads(handle.read(chunk_length).decode("utf-8"))
        except (UnicodeError, ValueError) as exc:
            raise InvalidSource("GLB JSON chunk is invalid") from exc
        if not isinstance(gltf, dict) or not isinstance(gltf.get("asset"), dict) or gltf["asset"].get("version") != "2.0":
            raise InvalidSource("GLB asset schema is invalid")

def _safe_zip_member(info: zipfile.ZipInfo) -> bool:
    name = info.filename.replace("\\", "/")
    path = PurePosixPath(name)
    if not name or name.startswith("/") or ".." in path.parts or ":" in name:
        return False
    if (info.external_attr >> 16) & 0o170000 == 0o120000:
        return False
    if info.flag_bits & 1:
        return False
    return True

def extract_single_glb(source: Path, destination: Path) -> str:
    if source.resolve() == destination.resolve():
        raise InvalidSource("source and destination must differ")
    if not source.is_file() or source.stat().st_size > MAX_TRANSPORT_BYTES:
        raise InvalidSource("source missing or exceeds transport size cap")
    with source.open("rb") as handle:
        magic = handle.read(4)
    if magic == b"glTF":
        shutil.copyfile(source, destination)
        mode = "raw-glb"
    elif zipfile.is_zipfile(source):
        with zipfile.ZipFile(source) as archive:
            members = archive.infolist()
            if not members or any(not _safe_zip_member(item) for item in members):
                raise InvalidSource("ZIP contains unsafe member metadata")
            if sum(item.file_size for item in members) > MAX_ARCHIVE_UNCOMPRESSED_BYTES:
                raise InvalidSource("ZIP uncompressed payload exceeds size cap")
            glb_entries = [item for item in members if not item.is_dir() and item.filename.lower().endswith(".glb")]
            if len(glb_entries) != 1:
                raise InvalidSource("ZIP must contain exactly one GLB entry")
            item = glb_entries[0]
            if item.file_size < 20 or item.file_size > MAX_GLB_BYTES:
                raise InvalidSource("ZIP GLB entry outside size bounds")
            with archive.open(item, "r") as incoming, destination.open("wb") as outgoing:
                copied = 0
                while chunk := incoming.read(1024 * 1024):
                    copied += len(chunk)
                    if copied > item.file_size or copied > MAX_GLB_BYTES:
                        raise InvalidSource("ZIP inflated beyond declared safe bounds")
                    outgoing.write(chunk)
            if copied != item.file_size:
                raise InvalidSource("ZIP GLB length mismatch")
        mode = "zip-single-glb"
    else:
        raise InvalidSource("Drive source must be a GLB or a ZIP with one GLB")
    try:
        validate_glb(destination)
    except Exception:
        destination.unlink(missing_ok=True)
        raise
    return mode

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    try:
        mode = extract_single_glb(args.source, args.destination)
    except (InvalidSource, OSError, zipfile.BadZipFile, RuntimeError, EOFError) as exc:
        args.destination.unlink(missing_ok=True)
        print(f"WORK_TEST source rejected: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1
    print(f"WORK_TEST transport accepted: {mode}; GLB byte identity will be derived independently")
    return 0

if __name__ == "__main__":
    sys.exit(main())
