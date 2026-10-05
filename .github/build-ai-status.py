#!/usr/bin/env python3
import json
import posixpath
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

HANDOFF_DOCUMENT_ID = "1MmJdjTZSUXiDS308bLNasdenyPJeXXZe4otwxHX62Go"
HELSINKI = ZoneInfo("Europe/Helsinki")

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


def _xlsx_column_index(cell_ref):
    letters = "".join(character for character in cell_ref if character.isalpha())
    if not letters:
        return 0
    value = 0
    for character in letters.upper():
        value = value * 26 + (ord(character) - ord("A") + 1)
    return value - 1


def _xlsx_sheet_values(path, sheet_name):
    spreadsheet_ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
    office_rel_ns = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    package_rel_ns = "http://schemas.openxmlformats.org/package/2006/relationships"
    ns = {"m": spreadsheet_ns, "r": office_rel_ns}

    try:
        archive = zipfile.ZipFile(path)
    except (OSError, zipfile.BadZipFile) as error:
        raise SystemExit(f"invalid AI pass log workbook: {error}") from error

    with archive:
        try:
            workbook = ET.fromstring(archive.read("xl/workbook.xml"))
            relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        except (KeyError, ET.ParseError) as error:
            raise SystemExit(f"invalid AI pass log workbook metadata: {error}") from error

        relationship_id = None
        for sheet in workbook.findall("m:sheets/m:sheet", ns):
            if sheet.get("name") == sheet_name:
                relationship_id = sheet.get(f"{{{office_rel_ns}}}id")
                break
        if not relationship_id:
            raise SystemExit(f"AI pass log sheet not found: {sheet_name}")

        target = None
        for relationship in relationships.findall(f"{{{package_rel_ns}}}Relationship"):
            if relationship.get("Id") == relationship_id:
                target = relationship.get("Target")
                break
        if not target:
            raise SystemExit("AI pass log sheet relationship missing")

        if target.startswith("/"):
            sheet_path = target.lstrip("/")
        else:
            sheet_path = posixpath.normpath(posixpath.join("xl", target))
        try:
            sheet_xml = ET.fromstring(archive.read(sheet_path))
        except (KeyError, ET.ParseError) as error:
            raise SystemExit(f"invalid AI pass log sheet XML: {error}") from error

        shared_strings = []
        try:
            shared_xml = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            for item in shared_xml.findall(f"{{{spreadsheet_ns}}}si"):
                shared_strings.append(
                    "".join(
                        node.text or ""
                        for node in item.iter(f"{{{spreadsheet_ns}}}t")
                    )
                )
        except KeyError:
            pass
        except ET.ParseError as error:
            raise SystemExit(f"invalid AI pass log shared strings: {error}") from error

        values = []
        for row in sheet_xml.findall(".//m:sheetData/m:row", ns):
            output_row = []
            for cell in row.findall("m:c", ns):
                cell_ref = cell.get("r", "A1")
                column_index = _xlsx_column_index(cell_ref)
                while len(output_row) <= column_index:
                    output_row.append("")

                cell_type = cell.get("t", "")
                if cell_type == "inlineStr":
                    inline = cell.find("m:is", ns)
                    value = (
                        "".join(
                            node.text or ""
                            for node in inline.iter(f"{{{spreadsheet_ns}}}t")
                        )
                        if inline is not None
                        else ""
                    )
                else:
                    value_node = cell.find("m:v", ns)
                    raw_value = value_node.text if value_node is not None and value_node.text is not None else ""
                    if cell_type == "s" and raw_value:
                        try:
                            value = shared_strings[int(raw_value)]
                        except (ValueError, IndexError):
                            value = raw_value
                    else:
                        value = raw_value
                output_row[column_index] = value
            values.append(output_row)
        return values


def _ai_pass_values(path):
    if zipfile.is_zipfile(path):
        return _xlsx_sheet_values(path, "AI-passiloki")
    try:
        payload = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise SystemExit(f"invalid AI pass log payload: {error}") from error
    values = payload.get("values")
    if not isinstance(values, list):
        raise SystemExit("AI pass log payload is missing values")
    return values


def _parse_log_time(value):
    parsed = parse_time(value)
    if parsed is not None:
        return parsed
    try:
        excel_serial = float(value)
    except (TypeError, ValueError):
        return None
    if not 20000 <= excel_serial <= 100000:
        return None
    return datetime(1899, 12, 30, tzinfo=HELSINKI) + timedelta(days=excel_serial)


def pass_count_from_ai_log(path, local_today):
    values = _ai_pass_values(path)

    header_index = None
    header = None
    for index, row in enumerate(values):
        if not isinstance(row, list):
            continue
        names = [str(value) for value in row]
        if all(name in names for name in ("Ajo-ID", "Lopetus", "Tulos")):
            header_index = index
            header = names
            break

    if header_index is None or header is None:
        raise SystemExit("AI pass log header not found")

    end_index = header.index("Lopetus")
    result_index = header.index("Tulos")
    count = 0

    for row in values[header_index + 1:]:
        if not isinstance(row, list):
            continue
        result = str(row[result_index]).strip() if result_index < len(row) else ""
        end_value = str(row[end_index]).strip() if end_index < len(row) else ""
        end_time = _parse_log_time(end_value)
        if result != "PASS" or end_time is None:
            continue
        if end_time.astimezone(HELSINKI).date() == local_today:
            count += 1

    return count


def main():
    if len(sys.argv) != 7:
        raise SystemExit(
            "usage: build-ai-status.py INPUT OUTPUT SOURCE_MODIFIED SOURCE_VERSION GENERATED_AT AI_PASS_LOG_JSON"
        )

    input_path, output_path, source_modified, source_version, generated_at, ai_pass_log_path = sys.argv[1:]
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

        if line.startswith("DISPATCH-CLAIM -") and data.get("tila", "").rstrip(".") == "CLAIMED":
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

        terminal_prefix = next(
            (prefix for prefix in ("VALMIS /", "KESKEYTYNYT /", "ESTYNYT /") if line.startswith(prefix)),
            None,
        )
        if terminal_prefix:
            run_id = data.get("ajo-ID") or data.get("alkuperäinen ajo-ID")
            removed = active.pop(run_id, None) if run_id else None
            if terminal_prefix == "VALMIS /":
                lane_code = clean(data.get("kaista", removed.get("laneCode", "") if removed else ""), 120)
                if event_time:
                    title = clean(line.split(" - ", 1)[1].split(" | ", 1)[0] if " - " in line else "Valmistunut passi", 320)
                    events.append({
                        "time": event_time,
                        "state": "PASS",
                        "lane": lane_name(lane_code),
                        "title": title,
                        "detail": clean(data.get("tulos", ""), 600),
                    })
            continue

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

    local_today = now.astimezone(HELSINKI).date()
    passes_today = pass_count_from_ai_log(ai_pass_log_path, local_today)

    human_action = None
    marker = "TOIMENPIDE IHMISELLE:"
    for line in lines[-250:]:
        if line == "EI TOIMIA IHMISELLE":
            human_action = None
            continue
        if line.startswith(marker):
            detail = clean(line[len(marker):], 600)
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
