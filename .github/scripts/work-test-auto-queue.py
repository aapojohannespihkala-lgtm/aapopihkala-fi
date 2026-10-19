#!/usr/bin/env python3
"""Drive queue -> WORK_TEST candidate automation helper (stdlib only).

Subcommands:
  list-queue  List GLB/ZIP files in the Drive queue folder (needs GDRIVE_ACCESS_TOKEN).
  plan        Decide the next action: publish | register | wait | none.
  apply       Add one auto candidate to the registry JSON and the Worker allowlist.

Auto candidates always have ids starting with "auto-". The Worker still pins the
exact size and SHA-256 of the published GLB; this helper only writes those
values after the workflow has derived them from the downloaded Drive bytes.
"""

import argparse
import json
import os
import re
import sys
import urllib.parse
import urllib.request

AUTO_PREFIX = "auto-"
RUNTIME_MARKER = "const PRIVATE_WORK_TEST_RUNTIME_CANDIDATES = ["
END_MARKER = "] as const satisfies readonly PrivateWorkTestCandidate[]"
SCENE_TOKEN = re.compile(r"__scene(\d{1,4})(?=$|[_.\- ])", re.IGNORECASE)
ID_RE = re.compile(r"[a-z0-9][a-z0-9-]{0,127}")
DRIVE_ID_RE = re.compile(r"[A-Za-z0-9_-]{10,128}")
QUEUE_EXTENSIONS = (".glb", ".zip")
PUBLISH_MIN_AGE = 15 * 60  # let the Cloudflare deploy of the merged allowlist finish
PUBLISH_MAX_AGE = 6 * 60 * 60  # stop retrying a failed publish so the queue keeps moving


def split_name(name):
    """Return (stem without extension and scene token, extractScene or None)."""
    stem = re.sub(r"\.(glb|zip)$", "", name, flags=re.IGNORECASE)
    match = SCENE_TOKEN.search(stem)
    scene = int(match.group(1)) if match else None
    stem = SCENE_TOKEN.sub("", stem)
    return stem, scene


def candidate_id(name, file_id, existing):
    stem, _ = split_name(name)
    slug = re.sub(r"[^a-z0-9]+", "-", stem.lower()).strip("-") or "malli"
    suffix = re.sub(r"[^a-z0-9]", "", file_id.lower())[:8]
    base = f"{AUTO_PREFIX}{slug[:100].strip('-')}-{suffix}"
    result, n = base, 2
    while result in existing:
        result = f"{base}-{n}"
        n += 1
    if not ID_RE.fullmatch(result):
        raise SystemExit("derived candidate id is invalid")
    return result


def candidate_label(name):
    stem, scene = split_name(name)
    text = re.sub(r"[_]+", " ", stem)
    text = re.sub(r"[^0-9A-Za-zÅÄÖåäö ().,+-]", "", text)
    text = re.sub(r"\s+", " ", text).strip()[:110] or "malli"
    scene_text = f" (scene{scene})" if scene is not None else ""
    return f"Auto: {text}{scene_text} - WORK_TEST"


def load_json(path):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def cmd_list_queue(args):
    token = os.environ.get("GDRIVE_ACCESS_TOKEN", "")
    if not token:
        raise SystemExit("GDRIVE_ACCESS_TOKEN missing")
    if not DRIVE_ID_RE.fullmatch(args.folder):
        raise SystemExit("invalid queue folder id")
    query = f"'{args.folder}' in parents and trashed = false"
    params = urllib.parse.urlencode({
        "q": query,
        "fields": "files(id,name,mimeType,createdTime,size)",
        "orderBy": "createdTime",
        "pageSize": "100",
        "supportsAllDrives": "true",
        "includeItemsFromAllDrives": "true",
    })
    request = urllib.request.Request(
        f"https://www.googleapis.com/drive/v3/files?{params}",
        headers={"Authorization": f"Bearer {token}"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = json.load(response)
    files = [
        {"id": f["id"], "name": f["name"], "createdTime": f.get("createdTime", "")}
        for f in payload.get("files", [])
        if f.get("name", "").lower().endswith(QUEUE_EXTENSIONS)
        and DRIVE_ID_RE.fullmatch(f.get("id", ""))
    ]
    with open(args.out, "w", encoding="utf-8") as handle:
        json.dump(files, handle)
    print(f"Queue files: {len(files)}")


def plan(registry, catalog_ids, queue, registry_age, open_auto_pr):
    candidates = registry["candidates"]
    auto_ids = [cid for cid in candidates if cid.startswith(AUTO_PREFIX)]
    if auto_ids:
        latest = auto_ids[-1]
        if latest not in catalog_ids and registry_age < PUBLISH_MAX_AGE:
            if registry_age < PUBLISH_MIN_AGE:
                return {"action": "wait", "candidate": latest}
            return {"action": "publish", "candidate": latest}
    if open_auto_pr:
        return {"action": "none", "reason": "auto PR already open"}
    known = {entry.get("driveFileId") for entry in candidates.values()}
    for item in sorted(queue, key=lambda f: f.get("createdTime", "")):
        if item["id"] not in known:
            return {"action": "register", "file_id": item["id"], "name": item["name"]}
    return {"action": "none", "reason": "queue empty"}


def cmd_plan(args):
    registry = load_json(args.registry)
    catalog = load_json(args.catalog)
    catalog_ids = {c.get("id") for c in catalog.get("candidates", [])}
    queue = load_json(args.queue)
    result = plan(registry, catalog_ids, queue, args.registry_age, args.open_auto_pr == "1")
    print(json.dumps(result, ensure_ascii=False))
    with open(args.out, "a", encoding="utf-8") as handle:
        handle.write(f"action={result['action']}\n")
        if result.get("candidate"):
            handle.write(f"candidate={result['candidate']}\n")
        if result["action"] == "register":
            _, scene = split_name(result["name"])
            handle.write(f"file_id={result['file_id']}\n")
            handle.write(f"extract_scene={'' if scene is None else scene}\n")
            # Name goes through a file, never through shell interpolation.
            with open(args.name_out, "w", encoding="utf-8") as name_handle:
                name_handle.write(result["name"])


def apply(registry, worker, file_id, name, size, sha256, date):
    if not DRIVE_ID_RE.fullmatch(file_id):
        raise SystemExit("invalid Drive file id")
    if not re.fullmatch(r"[0-9a-f]{64}", sha256) or size <= 0:
        raise SystemExit("invalid size or sha256")
    candidates = registry["candidates"]
    if any(entry.get("driveFileId") == file_id for entry in candidates.values()):
        raise SystemExit("Drive file already registered")
    cid = candidate_id(name, file_id, set(candidates))
    _, scene = split_name(name)
    entry = {"driveFileId": file_id}
    if scene is not None:
        entry["extractScene"] = scene
    candidates[cid] = entry

    if RUNTIME_MARKER not in worker:
        raise SystemExit("Worker runtime marker missing")
    head, tail = worker.split(RUNTIME_MARKER, 1)
    if END_MARKER not in tail:
        raise SystemExit("Worker runtime end marker missing")
    runtime_body, rest = tail.split(END_MARKER, 1)
    symbol = re.sub(r"[^A-Z0-9]+", "_", cid.upper()) + "_CANDIDATE"
    label = candidate_label(name).replace("\\", "").replace("'", "")
    const = (
        f"// Auto-registered {date} from Drive queue file {file_id}\n"
        f"// by auto-publish-work-test. WORK_TEST, never as-built.\n"
        f"const {symbol} = {{\n"
        f"  id: '{cid}',\n"
        f"  label: '{label}',\n"
        f"  path: `${{PRIVATE_WORK_TEST_PREFIX}}/{cid}.glb`,\n"
        f"  objectKey: 'work-test/{cid}.glb',\n"
        f"  expectedSize: {size},\n"
        f"  expectedSha256: '{sha256}',\n"
        f"}} as const satisfies PrivateWorkTestCandidate;\n\n"
    )
    runtime_body = runtime_body.rstrip("\n") + f"\n  {symbol},\n"
    new_worker = head + const + RUNTIME_MARKER + runtime_body + END_MARKER + rest
    return cid, registry, new_worker


def cmd_apply(args):
    registry = load_json(args.registry)
    with open(args.worker, "r", encoding="utf-8") as handle:
        worker = handle.read()
    with open(args.name_file, "r", encoding="utf-8") as handle:
        name = handle.read().strip()
    cid, registry, worker = apply(
        registry, worker, args.file_id, name, args.size, args.sha256, args.date
    )
    with open(args.registry, "w", encoding="utf-8") as handle:
        json.dump(registry, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
    with open(args.worker, "w", encoding="utf-8") as handle:
        handle.write(worker)
    with open(args.out, "a", encoding="utf-8") as handle:
        handle.write(f"candidate={cid}\n")
    print(cid)


def main(argv):
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("list-queue")
    p.add_argument("--folder", required=True)
    p.add_argument("--out", required=True)
    p.set_defaults(func=cmd_list_queue)

    p = sub.add_parser("plan")
    p.add_argument("--registry", required=True)
    p.add_argument("--catalog", required=True)
    p.add_argument("--queue", required=True)
    p.add_argument("--registry-age", type=int, required=True)
    p.add_argument("--open-auto-pr", choices=["0", "1"], required=True)
    p.add_argument("--name-out", required=True)
    p.add_argument("--out", required=True)
    p.set_defaults(func=cmd_plan)

    p = sub.add_parser("apply")
    p.add_argument("--registry", required=True)
    p.add_argument("--worker", required=True)
    p.add_argument("--file-id", required=True)
    p.add_argument("--name-file", required=True)
    p.add_argument("--size", type=int, required=True)
    p.add_argument("--sha256", required=True)
    p.add_argument("--date", required=True)
    p.add_argument("--out", required=True)
    p.set_defaults(func=cmd_apply)

    args = parser.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main(sys.argv[1:])
