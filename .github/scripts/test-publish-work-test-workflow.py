from pathlib import Path
import re

workflow_path = Path(".github/workflows/publish-work-test.yml")
text = workflow_path.read_text(encoding="utf-8")

required = {
    "manual dispatch": "workflow_dispatch:",
    "candidate choice input": "type: choice",
    "candidate input binding": "REQUESTED_CANDIDATE: ${{ inputs.candidate }}",
    "read-only repository permission": "contents: read",
    "GitHub OIDC permission": "id-token: write",
    "trusted main guard": '[[ "$GITHUB_REF" == "refs/heads/main" ]]',
    "trusted repository guard": '[[ "$GITHUB_REPOSITORY" == "aapojohannespihkala-lgtm/aapopihkala-fi" ]]',
    "bounded candidate resolver": 'case "$REQUESTED_CANDIDATE" in',
    "unsupported candidate deny": 'echo "Unsupported WORK_TEST candidate" >&2',
    "P150G exact Drive file": 'drive_file_id="1A2qXM12S7Fx0H9UPUM6lWuAXFB0YqEB6"',
    "P150G exact candidate": "p150g-whole-building-end-plinth",
    "P150G exact size": 'expected_size="1986004"',
    "P150G exact sha": 'expected_sha256="a17fdc1cbc29c4ecfcab3e94554b5ea5860c9a19db33e21f24c324acf70d6d89"',
    "P154C exact Drive file": 'drive_file_id="13s4JHivX9Be154vVeo8_q_cgElryXF5u"',
    "P154C exact candidate": "p154c-d-wall-cutouts",
    "P154C exact size": 'expected_size="1535172"',
    "P154C exact sha": 'expected_sha256="0653be4435879acb479ca272dc8fd4a3c7299c863c0082797236d4c5c20167c0"',
    "derived candidate id": 'echo "CANDIDATE_ID=$REQUESTED_CANDIDATE"',
    "derived expected path": 'echo "EXPECTED_PATH=/private-model/work-test/$REQUESTED_CANDIDATE.glb"',
    "derived publish URL": 'echo "PUBLISH_URL=https://aapopihkala.fi/private-model/work-test/publish/$REQUESTED_CANDIDATE.glb"',
    "machine catalog readback": "/private-model/work-test/verify/catalog.json",
    "derived machine full GLB readback": 'echo "GLB_URL=https://aapopihkala.fi/private-model/work-test/verify/$REQUESTED_CANDIDATE.glb"',
    "Google auth v3": "google-github-actions/auth@v3",
    "Drive readonly scope": "https://www.googleapis.com/auth/drive.readonly",
    "binary PUT": '--data-binary "@$model"',
    "size verification": "stat -c '%s'",
    "sha verification": "sha256sum",
    "publisher client ID secret": "secrets.CF_ACCESS_PUBLISHER_CLIENT_ID",
    "publisher client secret": "secrets.CF_ACCESS_PUBLISHER_CLIENT_SECRET",
    "readback client ID secret": "secrets.CF_ACCESS_READBACK_CLIENT_ID",
    "readback client secret": "secrets.CF_ACCESS_READBACK_CLIENT_SECRET",
    "WIF provider variable": "vars.GDRIVE_WIF_PROVIDER",
    "service account variable": "vars.GDRIVE_PUBLISHER_SERVICE_ACCOUNT",
    "cleanup": "rm -f",
    "catalog readback timeout": "--max-time 30",
    "full GLB readback timeout": "--max-time 60",
    "serialized publisher concurrency": "group: publish-work-test",
}

missing = [label for label, needle in required.items() if needle not in text]
if missing:
    raise SystemExit("publish-work-test contract missing: " + ", ".join(missing))

for forbidden in (
    "pull_request:",
    "push:",
    "schedule:",
    "actions/upload-artifact",
    "actions/cache",
    "oaiusercontent.com",
    "workTestImport",
    "CATALOG_URL: https://aapopihkala.fi/private-model/work-test/catalog.json",
    "inputs.drive",
    "inputs.file",
    "inputs.sha",
    "inputs.hash",
    "inputs.size",
    "inputs.path",
    "inputs.url",
):
    if forbidden in text:
        raise SystemExit(f"publish-work-test contains forbidden contract element: {forbidden}")

if text.count("workflow_dispatch:") != 1:
    raise SystemExit("publish-work-test must expose exactly one manual dispatch trigger")

input_names = set(re.findall(r"\$\{\{\s*inputs\.([A-Za-z0-9_-]+)\s*\}\}", text))
if input_names != {"candidate"}:
    raise SystemExit(f"publish-work-test inputs must be candidate-only, got: {sorted(input_names)}")

option_lines = re.findall(
    r"^\s{10}- (p150g-whole-building-end-plinth|p154c-d-wall-cutouts)\s*$",
    text,
    re.MULTILINE,
)
if option_lines != [
    "p150g-whole-building-end-plinth",
    "p154c-d-wall-cutouts",
]:
    raise SystemExit("publish-work-test candidate choices must be exactly P150G + P154C")

secret_echo = re.compile(
    r"echo[^\n]*(?:GDRIVE_ACCESS_TOKEN|CLIENT_SECRET|CF_ACCESS_[A-Z_]*CLIENT_ID)",
    re.IGNORECASE,
)
for match in secret_echo.finditer(text):
    line = match.group(0)
    if "Missing " not in line:
        raise SystemExit("publish-work-test may expose an auth value in logs")

if "export_environment_variables: false" not in text:
    raise SystemExit("Google auth must not export credentials globally")

if text.count("--connect-timeout 10") < 2:
    raise SystemExit("production readback calls must use bounded connection timeouts")

if "create_credentials_file: false" not in text:
    raise SystemExit("Google auth must not persist a credentials file")

print("publish-work-test workflow contract: PASS")
