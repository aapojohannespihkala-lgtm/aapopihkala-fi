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
    "P160 exact Drive file": 'drive_file_id="18W_u9Le8oaL_jujXK7Gocot6t53vDMcM"',
    "P160 exact candidate": "p160-d-composite-architecture",
    "P160 exact size": 'expected_size="1559168"',
    "P160 exact sha": 'expected_sha256="773b64f6413237111c9abf6420ccdf52ee5f61f90717618a1fe855f85000f3d7"',
    "P159 exact Drive file": 'drive_file_id="1XDasCVRBx-hzXOx0fjJ7qLhtbSR0zcXQ"',
    "P159 exact candidate": "p159-whole-building-storage-context",
    "P159 exact size": 'expected_size="1992656"',
    "P159 exact sha": 'expected_sha256="085877147e8ee50b69d8fa932bdb6d25bece04be187ec5453e9f73de50d1a5d0"',
    "P161 exact Drive file": 'drive_file_id="1tnLYRipsRBLfgNMLKN4NIBPO2IzCENdV"',
    "P161 exact candidate": "p161-multisource-systems-carrier",
    "P161 exact size": 'expected_size="1858948"',
    "P161 exact sha": 'expected_sha256="7413fa57b423260cfff9554fae96a8167fba48d03a7c570806a509e58e3ca65d"',
    "P170A exact Drive file": 'drive_file_id="17kAhyGrN7qFGtdtcyEU18VO1dQbGzlPY"',
    "P170A exact candidate": "p170a-p161-review-visibility",
    "P170A exact size": 'expected_size="1877872"',
    "P170A exact sha": 'expected_sha256="447e587b9903ec36056df2fa414620086a601bbfb5f3fcdd89a9cb9928e86368"',
    "P170D-R2 exact Drive file": 'drive_file_id="1Hojb8wbz_qvXGwdyHzNfK1WuzIKL5H3D"',
    "P170D-R2 exact candidate": "p170d-p161-review-visibility-correction",
    "P170D-R2 exact size": 'expected_size="1887248"',
    "P170D-R2 exact sha": 'expected_sha256="7f2bb6a65617e81f05c58b4d732e3c96c781f890ea5c3364e28cdaa996c6520e"',
    "P171C exact Drive file": 'drive_file_id="1gpe5tQS7vAlXM9J46VP6bxNLMIz7-EKe"',
    "P171C exact candidate": "p171c-d-stair-opening-guard-lowwall-junction",
    "P171C exact size": 'expected_size="2110432"',
    "P171C exact sha": 'expected_sha256="ccacc928d7913886755dba7bb04d3dd3cc9f84e5a03dbd63170c29622b64e706"',
    "P173D exact Drive file": 'drive_file_id="1msAIG-GsO4Z-e4RD2I_1BObyTUb-H4tL"',
    "P173D exact candidate": "p173d-whole-building-d-wall-hr67-rebase",
    "P173D exact size": 'expected_size="2119784"',
    "P173D exact sha": 'expected_sha256="3d7144b0ea1841be6b9ef790e02ad807287d22c1b2a1e45fafae0f193c61ed7f"',
    "P164B exact Drive file": 'drive_file_id="1HlOBrziBhX1uyawKI5eIzZZEzt7wsgDc"',
    "P164B exact candidate": "p164b-d-corrected-stair",
    "P164B exact size": 'expected_size="1583912"',
    "P164B exact sha": 'expected_sha256="db35b42575f1e287905d97d89483982b9354e60b1a8fe806ab29fb26d6103ca9"',
    "P166F exact Drive file": 'drive_file_id="1dDxcJFkLIn7JU_6msVgQVQYOurqv_L4c"',
    "P166F exact candidate": "p166f-lightwell-proxies",
    "P166F exact size": 'expected_size="2030604"',
    "P166F exact sha": 'expected_sha256="3b1e2158408937be1f11a27b16eae605204d5aa2184c7d513f6883d92a430f0a"',
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
    r"^\s{10}- (p150g-whole-building-end-plinth|p154c-d-wall-cutouts|p160-d-composite-architecture|p159-whole-building-storage-context|p161-multisource-systems-carrier|p170a-p161-review-visibility|p170d-p161-review-visibility-correction|p171c-d-stair-opening-guard-lowwall-junction|p173d-whole-building-d-wall-hr67-rebase|p164b-d-corrected-stair|p166f-lightwell-proxies|p167f-whole-building-precise-stair|p168a-whole-building-roof-eave-correction|p169a-whole-building-ac-storage-visible|p169f-whole-building-ac-storage-doors)\s*$",
    text,
    re.MULTILINE,
)
if option_lines != [
    "p150g-whole-building-end-plinth",
    "p154c-d-wall-cutouts",
    "p160-d-composite-architecture",
    "p159-whole-building-storage-context",
    "p161-multisource-systems-carrier",
    "p170a-p161-review-visibility",
    "p170d-p161-review-visibility-correction",
    "p171c-d-stair-opening-guard-lowwall-junction",
    "p173d-whole-building-d-wall-hr67-rebase",
    "p164b-d-corrected-stair",
    "p166f-lightwell-proxies",
    "p167f-whole-building-precise-stair",
    "p168a-whole-building-roof-eave-correction",
    "p169a-whole-building-ac-storage-visible",
    "p169f-whole-building-ac-storage-doors",
]:
    raise SystemExit("publish-work-test candidate choices must match the exact bounded WORK_TEST allowlist")

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
