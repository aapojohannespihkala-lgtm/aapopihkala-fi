from pathlib import Path
import re

workflow_path = Path(".github/workflows/publish-work-test.yml")
text = workflow_path.read_text(encoding="utf-8")

required = {
    "manual dispatch": "workflow_dispatch:",
    "read-only repository permission": "contents: read",
    "GitHub OIDC permission": "id-token: write",
    "trusted main guard": '[[ "$GITHUB_REF" == "refs/heads/main" ]]',
    "trusted repository guard": '[[ "$GITHUB_REPOSITORY" == "aapojohannespihkala-lgtm/aapopihkala-fi" ]]',
    "Google auth v3": "google-github-actions/auth@v3",
    "Drive readonly scope": "https://www.googleapis.com/auth/drive.readonly",
    "exact Drive file": "1A2qXM12S7Fx0H9UPUM6lWuAXFB0YqEB6",
    "exact candidate": "p150g-whole-building-end-plinth",
    "exact size": 'EXPECTED_SIZE: "1986004"',
    "exact sha": "a17fdc1cbc29c4ecfcab3e94554b5ea5860c9a19db33e21f24c324acf70d6d89",
    "machine publish path": "/private-model/work-test/publish/p150g-whole-building-end-plinth.glb",
    "catalog readback": "/private-model/work-test/catalog.json",
    "full GLB readback": "/private-model/work-test/p150g-whole-building-end-plinth.glb",
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
):
    if forbidden in text:
        raise SystemExit(f"publish-work-test contains forbidden contract element: {forbidden}")

if text.count("workflow_dispatch:") != 1:
    raise SystemExit("publish-work-test must expose exactly one manual dispatch trigger")

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

if "create_credentials_file: false" not in text:
    raise SystemExit("Google auth must not persist a credentials file")

print("publish-work-test workflow contract: PASS")
