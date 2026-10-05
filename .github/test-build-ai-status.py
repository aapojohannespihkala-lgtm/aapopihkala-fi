#!/usr/bin/env python3
import json
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

SCRIPT = Path(__file__).with_name("build-ai-status.py")


def _column_name(index):
    value = index + 1
    letters = ""
    while value:
        value, remainder = divmod(value - 1, 26)
        letters = chr(ord("A") + remainder) + letters
    return letters


def write_xlsx(path, values):
    workbook = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="AI-passiloki" sheetId="1" r:id="rId1"/></sheets>
</workbook>"""
    relationships = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
   Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"
   Target="worksheets/sheet1.xml"/>
</Relationships>"""

    rows = []
    for row_index, row in enumerate(values, start=1):
        cells = []
        for column_index, value in enumerate(row):
            ref = f"{_column_name(column_index)}{row_index}"
            escaped = (
                str(value)
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
            )
            cells.append(f'<c r="{ref}" t="inlineStr"><is><t>{escaped}</t></is></c>')
        rows.append(f'<row r="{row_index}">{"".join(cells)}</row>')

    sheet = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f'<sheetData>{"".join(rows)}</sheetData>'
        '</worksheet>'
    )
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("xl/workbook.xml", workbook)
        archive.writestr("xl/_rels/workbook.xml.rels", relationships)
        archive.writestr("xl/worksheets/sheet1.xml", sheet)


def run_case(handoff_text, ai_log, generated_at="2026-10-05T19:00:00Z", log_format="json"):
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        handoff = tmp_path / "handoff.txt"
        output = tmp_path / "status.json"
        log = tmp_path / ("ai-pass-log.xlsx" if log_format == "xlsx" else "ai-pass-log.json")
        handoff.write_text(handoff_text, encoding="utf-8")
        if log_format == "xlsx":
            write_xlsx(log, ai_log["values"])
        else:
            log.write_text(json.dumps(ai_log, ensure_ascii=False), encoding="utf-8")
        subprocess.run(
            [
                sys.executable,
                str(SCRIPT),
                str(handoff),
                str(output),
                "2026-10-05T18:58:00Z",
                "123",
                generated_at,
                str(log),
            ],
            check=True,
        )
        return json.loads(output.read_text(encoding="utf-8"))


def main():
    instruction = (
        'Käyttäjän voimassa oleva raportointisääntö: viimeinen rivi on joko '
        '"EI TOIMIA IHMISELLE" tai "TOIMENPIDE IHMISELLE: <yksi täsmällinen seuraava tehtävä>".'
    )
    compacted_handoff = "\n".join(
        [
            instruction,
            "VALMIS / VARAUS VAPAUTETTU - näkyvä live-00 passi | kaista: OPS8 PROCESS_INTEGRITY | "
            "ajo-ID: 2026-10-05T18:30:00+03:00-test | päättyi: 2026-10-05T18:35:00+03:00 | "
            "tulos: PASS | tila: VALMIS / VARAUS VAPAUTETTU.",
        ]
    )
    ai_log = {
        "range": "AI-passiloki!A1:U8",
        "majorDimension": "ROWS",
        "values": [
            ["Ylisrinne - AI-passiloki"],
            ["Prosessitelemetria"],
            ["Ajo-ID on lokiavain"],
            ["Ajo-ID", "Passi", "Emo", "Passityyppi", "Käynnistystapa", "Passin aloitus", "Lopetus", "Passiaika min", "Tulos"],
            ["a", "Pass A", "", "", "", "", "2026-10-05T10:00:00+03:00", "", "PASS"],
            ["b", "Pass B", "", "", "", "", "2026-10-05T18:00:00Z", "", "PASS"],
            ["c", "Pass C", "", "", "", "", "2026-10-05T23:59:59+03:00", "", "PASS"],
            ["d", "Blocked", "", "", "", "", "2026-10-05T12:00:00+03:00", "", "ESTYNYT"],
            ["e", "Yesterday", "", "", "", "", "2026-10-04T23:59:59+03:00", "", "PASS"],
        ],
    }

    result = run_case(compacted_handoff, ai_log)
    assert result["summary"]["passesToday"] == 3, result
    assert result["humanAction"] is None, result

    xlsx_result = run_case(compacted_handoff, ai_log, log_format="xlsx")
    assert xlsx_result["summary"]["passesToday"] == 3, xlsx_result
    assert xlsx_result["humanAction"] is None, xlsx_result

    with_action = compacted_handoff + "\nTOIMENPIDE IHMISELLE: Avaa yksi review-linkki."
    action_result = run_case(with_action, ai_log)
    assert action_result["summary"]["passesToday"] == 3, action_result
    assert action_result["humanAction"] == {
        "title": "Sinulta tarvitaan",
        "detail": "Avaa yksi review-linkki",
    }, action_result

    print("PASS: compacted handoff uses JSON/XLSX AI-passiloki count and ignores instruction markers")


if __name__ == "__main__":
    main()
