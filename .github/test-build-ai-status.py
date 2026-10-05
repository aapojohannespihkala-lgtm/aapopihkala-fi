#!/usr/bin/env python3
import json
import subprocess
import sys
import tempfile
from pathlib import Path

SCRIPT = Path(__file__).with_name("build-ai-status.py")


def run_case(handoff_text, ai_log, generated_at="2026-10-05T19:00:00Z"):
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        handoff = tmp_path / "handoff.txt"
        output = tmp_path / "status.json"
        log = tmp_path / "ai-pass-log.json"
        handoff.write_text(handoff_text, encoding="utf-8")
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

    with_action = compacted_handoff + "\nTOIMENPIDE IHMISELLE: Avaa yksi review-linkki."
    action_result = run_case(with_action, ai_log)
    assert action_result["summary"]["passesToday"] == 3, action_result
    assert action_result["humanAction"] == {
        "title": "Sinulta tarvitaan",
        "detail": "Avaa yksi review-linkki",
    }, action_result

    print("PASS: compacted handoff uses AI-passiloki count and ignores instruction markers")


if __name__ == "__main__":
    main()
