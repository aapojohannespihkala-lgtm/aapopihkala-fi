#!/usr/bin/env python3
"""Drive queue -> WORK_TEST candidate automation helper (stdlib only).

Subcommands:
  list-queue            List GLB/ZIP files in the Drive queue folder (needs GDRIVE_ACCESS_TOKEN).
  recent-registrations  Auto candidates added to the registry within the publish window (from git).
  plan                  Decide this run's batch: which candidates to publish, which files to register.
  apply                 Add one auto candidate to the registry JSON and the Worker allowlist.
  apply-batch           Add several derived candidates in one change (one PR, one deploy).

Auto candidates always have ids starting with "auto-". The Worker still pins the
exact size and SHA-256 of the published GLB; this helper only writes those
values after the workflow has derived them from the downloaded Drive bytes.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time
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
MAX_BATCH = 15  # files registered per run: bounds run time and PR size
MAX_PUBLISH_FAILURES = 3  # a candidate that failed this often is skipped, not retried forever


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


def plan(registry, catalog_ids, queue, recent, failures, open_auto_pr, max_batch=MAX_BATCH):
    """Return this run's batch.

    recent maps auto candidate id -> seconds since the registry commit that added it,
    limited to the publish window. Publishing and registering are independent: a failed
    publish no longer holds back registration of new queue files.
    """
    publish, waiting, skipped = [], [], []
    for cid, age in sorted(recent.items(), key=lambda item: -item[1]):
        if cid not in registry["candidates"] or cid in catalog_ids or age >= PUBLISH_MAX_AGE:
            continue
        if failures.get(cid, 0) >= MAX_PUBLISH_FAILURES:
            skipped.append(cid)
        elif age < PUBLISH_MIN_AGE:
            waiting.append(cid)
        else:
            publish.append(cid)
    register = []
    if not open_auto_pr:
        known = {entry.get("driveFileId") for entry in registry["candidates"].values()}
        for item in sorted(queue, key=lambda f: f.get("createdTime", "")):
            if item["id"] not in known and len(register) < max_batch:
                known.add(item["id"])
                register.append({"file_id": item["id"], "name": item["name"]})
    return {"publish": publish, "waiting": waiting, "skipped": skipped, "register": register}


def recent_registrations(registry_path, window, now=None, git=None):
    """Map auto ids -> age (s) for registry commits inside the window.

    A commit whose parent is not available (shallow history boundary) is ignored, so a
    missing parent can never make every historical candidate look newly registered.
    """
    git = git or (lambda *a: subprocess.run(["git", *a], capture_output=True, text=True))
    now = int(time.time()) if now is None else now
    log = git("log", f"--since=@{now - window}", "--format=%H %ct", "--", registry_path)
    if log.returncode != 0:
        raise SystemExit("git log failed")
    result = {}
    for line in log.stdout.split("\n"):
        if not line.strip():
            continue
        sha, ts = line.split()
        if git("rev-parse", "--verify", "--quiet", f"{sha}^").returncode != 0:
            print(f"::warning::registry commit {sha} has no parent in history; ignored")
            continue
        current = git("show", f"{sha}:{registry_path}")
        previous = git("show", f"{sha}^:{registry_path}")
        if current.returncode != 0:
            continue
        before = set(json.loads(previous.stdout)["candidates"]) if previous.returncode == 0 else set()
        for cid in json.loads(current.stdout)["candidates"]:
            if cid.startswith(AUTO_PREFIX) and cid not in before:
                result[cid] = max(0, now - int(ts))
    return result


def cmd_recent(args):
    result = recent_registrations(args.registry, PUBLISH_MAX_AGE)
    with open(args.out, "w", encoding="utf-8") as handle:
        json.dump(result, handle)
    print(f"Recently registered auto candidates: {len(result)}")


def cmd_plan(args):
    registry = load_json(args.registry)
    catalog = load_json(args.catalog)
    catalog_ids = {c.get("id") for c in catalog.get("candidates", [])}
    queue = load_json(args.queue)
    recent = load_json(args.recent)
    failures = load_json(args.failures)
    result = plan(registry, catalog_ids, queue, recent, failures, args.open_auto_pr == "1")
    print(json.dumps(result, ensure_ascii=False))
    for cid in result["skipped"]:
        print(f"::warning::{cid} failed to publish {MAX_PUBLISH_FAILURES} times; skipped")
    # Lists go through files, never through shell interpolation of Drive names.
    with open(args.publish_out, "w", encoding="utf-8") as handle:
        handle.write("".join(f"{cid}\n" for cid in result["publish"]))
    with open(args.register_out, "w", encoding="utf-8") as handle:
        json.dump(result["register"], handle, ensure_ascii=False)
    with open(args.out, "a", encoding="utf-8") as handle:
        handle.write(f"publish_count={len(result['publish'])}\n")
        handle.write(f"register_count={len(result['register'])}\n")


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


def apply_batch(registry, worker, items, date):
    """Apply derived items in order; returns (ids, registry, worker)."""
    ids = []
    for item in items:
        cid, registry, worker = apply(
            registry, worker, item["file_id"], item["name"], int(item["size"]), item["sha256"], date
        )
        ids.append(cid)
    return ids, registry, worker


def cmd_apply_batch(args):
    registry = load_json(args.registry)
    items = load_json(args.items)
    if not items:
        raise SystemExit("no derived items to register")
    with open(args.worker, "r", encoding="utf-8") as handle:
        worker = handle.read()
    ids, registry, worker = apply_batch(registry, worker, items, args.date)
    with open(args.registry, "w", encoding="utf-8") as handle:
        json.dump(registry, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
    with open(args.worker, "w", encoding="utf-8") as handle:
        handle.write(worker)
    with open(args.ids_out, "w", encoding="utf-8") as handle:
        handle.write("".join(f"{cid}\n" for cid in ids))
    print("\n".join(ids))


def main(argv):
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("list-queue")
    p.add_argument("--folder", required=True)
    p.add_argument("--out", required=True)
    p.set_defaults(func=cmd_list_queue)

    p = sub.add_parser("recent-registrations")
    p.add_argument("--registry", required=True)
    p.add_argument("--out", required=True)
    p.set_defaults(func=cmd_recent)

    p = sub.add_parser("plan")
    p.add_argument("--registry", required=True)
    p.add_argument("--catalog", required=True)
    p.add_argument("--queue", required=True)
    p.add_argument("--recent", required=True)
    p.add_argument("--failures", required=True)
    p.add_argument("--open-auto-pr", choices=["0", "1"], required=True)
    p.add_argument("--publish-out", required=True)
    p.add_argument("--register-out", required=True)
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

    p = sub.add_parser("apply-batch")
    p.add_argument("--registry", required=True)
    p.add_argument("--worker", required=True)
    p.add_argument("--items", required=True)
    p.add_argument("--date", required=True)
    p.add_argument("--ids-out", required=True)
    p.set_defaults(func=cmd_apply_batch)

    args = parser.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main(sys.argv[1:])
