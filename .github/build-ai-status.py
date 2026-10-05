#!/usr/bin/env python3
import json
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

HANDOFF_DOCUMENT_ID = "1MmJdjTZSUXiDS308bLNasdenyPJeXXZe4otwxHX62Go"

LANES = {
    "M1 ENVELOPE": "3D - rakennuksen vaippa",
    "M2 BUILDING_GROUND": "3D - rakennus ja maasto",
    "M3 D_ARCH": "3D - D arkkitehtuuri",
    "M4 D_DETAIL": "3D - D detaljit",
    "M5 SYSTEMS": "3D - järjestelmät",
    "V1 CAMERA_NAV": "Viewer - kamera",
    "V2 VIEWER_QA_RELEASE": "Viewer - julkaisu",
    "V3 UI_INTERACTION": "Viewer - käyttöliittymä",
    "V4 INTEGRATION_QA": "Viewer - integraatio",
    "V5 RELEASE_LIVE": "Viewer - tuotanto",
    "OPS8 PROCESS_INTEGRITY": "Prosessi - eheys",
    "OPS9 STATUS_DASHBOARD": "Tilannepaneeli",
}

FIELD_RE = re.compile(r"(?:^|\|\s*)([^|:]+):\s*([^|]+)")
ISO_RE = re.compile(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})")

def clean(value, limit=600):
    value = re.sub(r"\s+", " ", (value or "").replace("`", "")).strip(" .")
    return value[:limit]

def fields(line):
    return {key.strip(): value.strip() for key, value in FIELD_RE.findall(line)}

def parse_time(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None

def timestamp(line, data):
    for key in ("päättyi", "checkpoint-aika", "claim-aika"):
        if key in data:
            match = ISO_RE.search(data[key])
            if match:
                return match.group(0)
    match = ISO_RE.search(line)
    return match.group(0) if match else None

def lane_name(code):
    if code in LANES:
        return LANES[code]
    if code.startswith("M"):
        return "3D - " + code
    if code.startswith("V"):
        return "Viewer - " + code
    return code or "Muu työlinja"

def after_prefix(line, prefix):
    return clean(line[len(prefix):].split(" | ", 1)[0], 320)

def main():
    if len(sys.argv) != 6:
        raise SystemExit("usage: build-ai-status.py INPUT OUTPUT SOURCE_MODIFIED SOURCE_VERSION GENERATED_AT")

    input_path, output_path, source_modified, source_version, generated_at = sys.argv[1:]
    text = Path(input_path).read_text(encoding="utf-8")
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    now = parse_time(generated_at)
    if now is None:
        raise SystemExit("invalid generated_at")

    active = {}
    events = []

    for line in lines:
        data = fields(line)
        event_time = timestamp(line, data)

        if line.startswith("DISPATCH-CLAIM -") and data.get("tila") == "CLAIMED":
            run_id = data.get("claim-ID")
            if not run_id or not event_time:
                continue
            lane_code = clean(after_prefix(line, "DISPATCH-CLAIM -"), 120)
            active[run_id] = {
                "id": clean(run_id, 180),
                "scope": clean(data.get("scope-key", run_id), 180),
                "laneCode": lane_code,
                "lane": lane_name(lane_code),
                "title": clean(data.get("scope-key", lane_code), 320),
                "goal": clean(data.get("tarkoitus", "Tavoite on kirjattu aktiiviseen handoff-varaukseen."), 600),
                "state": "CLAIMED",
                "updatedAt": event_time,
            }
            events.append({
                "time": event_time,
                "state": "CLAIM",
                "lane": lane_name(lane_code),
                "title": clean(data.get("scope-key", lane_code), 320),
                "detail": clean(data.get("tarkoitus", ""), 600),
            })
            continue

        if line.startswith("VARAUS -"):
            run_id = data.get("ajo-ID")
            if not run_id or not event_time:
                continue
            previous = active.get(run_id, {})
            lane_code = clean(data.get("kaista", previous.get("laneCode", "Muu työlinja")), 120)
            title = after_prefix(line, "VARAUS -")
            goal = previous.get("goal") or clean(data.get("output", data.get("valmis kun", "Aktiivinen työpaketti.")), 600)
            active[run_id] = {
                "id": clean(run_id, 180),
                "scope": clean(data.get("scope-key", previous.get("scope", run_id)), 180),
                "laneCode": lane_code,
                "lane": lane_name(lane_code),
                "title": title,
                "goal": goal,
                "state": "ACTIVE",
                "updatedAt": event_time,
            }
            continue

        if line.startswith("CHECKPOINT -"):
            run_id = data.get("ajo-ID")
            if run_id in active and event_time:
                active[run_id]["updatedAt"] = event_time
                next_step = clean(data.get("seuraava", ""), 600)
                if next_step:
                    active[run_id]["goal"] = next_step
                events.append({
                    "time": event_time,
                    "state": "CHECKPOINT",
                    "lane": active[run_id]["lane"],
                    "title": active[run_id]["title"],
                    "detail": next_step,
                })
            continue

        if line.startswith("VALMIS /"):
            run_id = data.get("ajo-ID") or data.get("alkuperäinen ajo-ID")
            removed = active.pop(run_id, None) if run_id else None
            lane_code = clean(data.get("kaista", removed.get("laneCode", "") if removed else ""), 120)
            if event_time:
                prefix_end = line.find(" |")
                title = clean(line.split(" - ", 1)[1][:prefix_end] if " - " in line and prefix_end > 0 else "Valmistunut passi", 320)
                events.append({
                    "time": event_time,
                    "state": "PASS",
                    "lane": lane_name(lane_code),
                    "title": title,
                    "detail": clean(data.get("tulos", ""), 600),
                })

    # Same scope can be reclaimed after an expired lease. Show only its latest live owner.
    latest_by_scope = {}
    for entry in sorted(active.values(), key=lambda item: parse_time(item["updatedAt"]) or datetime.min.replace(tzinfo=timezone.utc)):
        latest_by_scope[entry["scope"]] = entry

    active_items = []
    for entry in latest_by_scope.values():
        updated = parse_time(entry["updatedAt"])
        if entry["state"] == "CLAIMED" and updated and now - updated.astimezone(timezone.utc) > timedelta(minutes=15):
            continue
        entry = {key: value for key, value in entry.items() if key != "scope"}
        active_items.append(entry)

    active_items.sort(key=lambda item: parse_time(item["updatedAt"]) or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
    active_items = active_items[:32]

    events = [event for event in events if parse_time(event["time"]) is not None]
    events.sort(key=lambda item: parse_time(item["time"]), reverse=True)
    recent = events[:30]

    local_today = now.astimezone().date()
    passes_today = sum(
        1
        for event in events
        if event["state"] == "PASS" and parse_time(event["time"]).astimezone().date() == local_today
    )

    human_action = None
    for line in lines[-250:]:
        if "EI TOIMIA IHMISELLE" in line:
            human_action = None
        marker = "TOIMENPIDE IHMISELLE:"
        if marker in line:
            detail = clean(line.split(marker, 1)[1], 600)
            if detail:
                human_action = {"title": "Sinulta tarvitaan", "detail": detail}

    payload = {
        "version": 1,
        "generatedAt": generated_at,
        "source": {
            "documentId": HANDOFF_DOCUMENT_ID,
            "modifiedTime": source_modified,
            "version": str(source_version),
        },
        "summary": {
            "activePackages": len(active_items),
            "activeLines": len({item["lane"] for item in active_items}),
            "passesToday": passes_today,
        },
        "active": active_items,
        "recent": recent,
        "humanAction": human_action,
    }

    Path(output_path).write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

if __name__ == "__main__":
    main()
