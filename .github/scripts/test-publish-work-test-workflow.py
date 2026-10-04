from pathlib import Path
import json
import re

workflow_path = Path(".github/workflows/publish-work-test.yml")
registry_path = Path(".github/work-test-candidates.json")
trigger_path = Path(".github/workflows/trigger-work-test-publish.yml")
routing_path = Path("src/scripts/privateModelWorkTest.ts")

text = workflow_path.read_text(encoding="utf-8")
registry = json.loads(registry_path.read_text(encoding="utf-8"))
trigger = trigger_path.read_text(encoding="utf-8")
routing = routing_path.read_text(encoding="utf-8")

required = {
    "manual dispatch": "workflow_dispatch:",
    "candidate string input": "type: string",
    "candidate input binding": "REQUESTED_CANDIDATE: ${{ inputs.candidate }}",
    "release registry checkout": "uses: actions/checkout@v7",
    "release registry path": '.github/work-test-candidates.json',
    "read-only repository permission": "contents: read",
    "GitHub OIDC permission": "id-token: write",
    "trusted main guard": '[[ "$GITHUB_REF" == "refs/heads/main" ]]',
    "trusted repository guard": '[[ "$GITHUB_REPOSITORY" == "aapojohannespihkala-lgtm/aapopihkala-fi" ]]',
    "registry envelope guard": 'set(payload) != {"version", "candidates"}',
    "registry entry guard": 'set(entry) != {"driveFileId"}',
    "unsupported candidate deny": 'raise SystemExit("Unsupported WORK_TEST candidate")',
    "derived candidate id": '"CANDIDATE_ID": candidate_id',
    "derived expected path": '"EXPECTED_PATH": f"/private-model/work-test/{candidate_id}.glb"',
    "derived publish URL": '"PUBLISH_URL": f"https://aapopihkala.fi/private-model/work-test/publish/{candidate_id}.glb"',
    "machine catalog readback": "/private-model/work-test/verify/catalog.json",
    "derived machine full GLB readback": '"GLB_URL": f"https://aapopihkala.fi/private-model/work-test/verify/{candidate_id}.glb"',
    "Google auth v3": "google-github-actions/auth@v3",
    "Drive readonly scope": "https://www.googleapis.com/auth/drive.readonly",
    "raw size derivation": 'actual_size="$(stat -c \'%s\' "$model")"',
    "raw sha derivation": 'actual_sha="$(sha256sum "$model" | awk \'{print $1}\')"',
    "GLB magic guard": '[[ "$(head -c 4 "$model")" == "glTF" ]]',
    "derived expected size": 'echo "EXPECTED_SIZE=$actual_size"',
    "derived expected sha": 'echo "EXPECTED_SHA256=$actual_sha"',
    "binary PUT": '--data-binary "@$model"',
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
    "type: choice",
    'case "$REQUESTED_CANDIDATE" in',
    'expected_size="',
    'expected_sha256="',
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

if set(registry) != {"version", "candidates"} or registry.get("version") != 1:
    raise SystemExit("WORK_TEST candidate registry envelope must be exact version 1")

candidates = registry.get("candidates")
if not isinstance(candidates, dict) or len(candidates) < 21:
    raise SystemExit("WORK_TEST candidate registry lost migrated candidates")

sentinels = {
    "p150g-whole-building-end-plinth",
    "p169f-whole-building-ac-storage-doors",
    "p178b-d-stair-guard-lowwall-junction-closure",
}
if not sentinels.issubset(candidates):
    raise SystemExit("WORK_TEST candidate registry lost required migration sentinels")

drive_ids = []
for candidate_id, entry in candidates.items():
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,127}", candidate_id):
        raise SystemExit(f"invalid candidate id in registry: {candidate_id!r}")
    if not isinstance(entry, dict) or set(entry) != {"driveFileId"}:
        raise SystemExit(f"candidate registry entry must contain only driveFileId: {candidate_id}")
    drive_file_id = entry.get("driveFileId")
    if not isinstance(drive_file_id, str) or not re.fullmatch(r"[A-Za-z0-9_-]{10,128}", drive_file_id):
        raise SystemExit(f"invalid Drive file id in registry: {candidate_id}")
    drive_ids.append(drive_file_id)

if len(drive_ids) != len(set(drive_ids)):
    raise SystemExit("WORK_TEST candidate registry contains duplicate Drive file ids")

registry_text = registry_path.read_text(encoding="utf-8").lower()
for forbidden_identity_field in ("sha256", '"sha"', '"size"', "expected_size", "expected_sha"):
    if forbidden_identity_field in registry_text:
        raise SystemExit(
            "WORK_TEST registry must not duplicate raw-byte size/SHA identity: "
            + forbidden_identity_field
        )

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
if text.count("--connect-timeout 10") < 2:
    raise SystemExit("production readback calls must use bounded connection timeouts")

trigger_required = {
    "dedicated request branch": "- ops/machine-publish",
    "request file path filter": "- .github/work-test-publish-request.json",
    "read-only contents permission": "contents: read",
    "actions dispatch permission": "actions: write",
    "push event guard": '[[ "$EVENT_NAME" == "push" ]]',
    "trusted repository guard": '[[ "$REPOSITORY" == "aapojohannespihkala-lgtm/aapopihkala-fi" ]]',
    "dedicated ref guard": '[[ "$REF_FULL" == "refs/heads/ops/machine-publish" ]]',
    "trusted actor guard": '[[ "$ACTOR" == "aapojohannespihkala-lgtm" ]]',
    "trusted actor id guard": '[[ "$ACTOR_ID" == "322566438" ]]',
    "request-only diff guard": '.github/work-test-publish-request.json',
    "bounded request keys": 'set(payload) != {"candidate", "requestId"}',
    "canonical publisher endpoint": "actions/workflows/publish-work-test.yml/dispatches",
    "hard-coded main dispatch": '{"ref": "main", "inputs": {"candidate": candidate}}',
}
trigger_missing = [label for label, needle in trigger_required.items() if needle not in trigger]
if trigger_missing:
    raise SystemExit("trigger-work-test-publish contract missing: " + ", ".join(trigger_missing))

for forbidden in (
    "workflow_dispatch:",
    "pull_request:",
    "schedule:",
    "id-token: write",
    "drive_file_id=",
    "expected_size=",
    "expected_sha256=",
):
    if forbidden in trigger:
        raise SystemExit(f"trigger-work-test-publish contains forbidden contract element: {forbidden}")

if trigger.count("actions/workflows/publish-work-test.yml/dispatches") != 1:
    raise SystemExit("trigger must dispatch the canonical publisher exactly once")

routing_required = {
    "conventional suffix": "const conventionalReviewSuffix = '-review';",
    "conventional id guard": "/^[a-z0-9][a-z0-9-]*-review$/",
    "legacy-first fallback": "reviewCandidateById[reviewId] ?? getConventionalReviewCandidateId(reviewId)",
    "legacy P183 alias": "[p183P160ClosureReviewId]: p178bCandidateId",
    "legacy P143D alias": "[p143dReviewId]: p143aCandidateId",
}
routing_missing = [label for label, needle in routing_required.items() if needle not in routing]
if routing_missing:
    raise SystemExit("private model review routing contract missing: " + ", ".join(routing_missing))

print(
    "publish-work-test workflow contract: PASS "
    f"({len(candidates)} registry candidates; raw size/SHA derived at publish time)"
)
print("trigger-work-test-publish workflow contract: PASS")
print("private model conventional review routing contract: PASS")
