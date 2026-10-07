from pathlib import Path

publish_path = Path(".github/workflows/publish-current-model.yml")
trigger_path = Path(".github/workflows/trigger-current-model-publish.yml")

publish = publish_path.read_text(encoding="utf-8")
trigger = trigger_path.read_text(encoding="utf-8")

required_publish = {
    "manual dispatch": "workflow_dispatch:",
    "drive input": "drive_file_id:",
    "trusted main": '[[ "$GITHUB_REF" == "refs/heads/main" ]]',
    "trusted repo": '[[ "$GITHUB_REPOSITORY" == "aapojohannespihkala-lgtm/aapopihkala-fi" ]]',
    "Drive readonly": "https://www.googleapis.com/auth/drive.readonly",
    "publisher secret": "secrets.CF_ACCESS_PUBLISHER_CLIENT_ID",
    "readback secret": "secrets.CF_ACCESS_READBACK_CLIENT_ID",
    "machine publish endpoint": "/private-model/work-test/publish/current-model.glb",
    "machine verify endpoint": "/private-model/work-test/verify/current-model.glb",
    "publish HTTP status diagnostic": 'CURRENT publish HTTP status=',
    "publish content type diagnostic": 'CURRENT publish Content-Type=',
    "publish location diagnostic": 'CURRENT publish Location=',
    "publish JSON gate": 'CURRENT publish returned non-JSON content type',
    "CURRENT candidate stage": '"ModelStage": "CURRENT_CANDIDATE"',
    "no current distribution flip": '"currentDistribution": False',
    "no canonical flip": '"Canonical": False',
    "no as-built flip": '"asBuiltClaim": False',
    "no publish flag flip": '"publishToCURRENT": False',
    "object-level no-promotion": '"objectLevelNoPromotionPreserved": True',
    "whole-building opening": '"normalOpeningMode": "WHOLE_BUILDING_FREE_ORBIT"',
    "raw sha derivation": "hashlib.sha256(data).hexdigest()",
    "binary PUT": '--data-binary "@$model"',
    "full readback": 'sha256sum "$readback"',
    "bounded readback": "--max-time 60",
}
missing = [label for label, needle in required_publish.items() if needle not in publish]
if missing:
    raise SystemExit("publish-current-model contract missing: " + ", ".join(missing))

for forbidden in ("pull_request:", "push:", "schedule:", "actions/upload-artifact", "actions/cache"):
    if forbidden in publish:
        raise SystemExit(f"publish-current-model contains forbidden contract element: {forbidden}")

required_trigger = {
    "dedicated branch": "- ops/current-publish",
    "request path": "- .github/current-model-publish-request.json",
    "trusted actor": '[[ "$ACTOR" == "aapojohannespihkala-lgtm" ]]',
    "trusted actor id": '[[ "$ACTOR_ID" == "322566438" ]]',
    "request-only guard": '.github/current-model-publish-request.json',
    "bounded keys": 'set(payload) != {"driveFileId", "requestId"}',
    "canonical workflow": "actions/workflows/publish-current-model.yml/dispatches",
    "hard-coded main": '{"ref": "main", "inputs": {"drive_file_id": drive_file_id}}',
}
missing = [label for label, needle in required_trigger.items() if needle not in trigger]
if missing:
    raise SystemExit("trigger-current-model-publish contract missing: " + ", ".join(missing))

for forbidden in ("workflow_dispatch:", "pull_request:", "schedule:", "id-token: write"):
    if forbidden in trigger:
        raise SystemExit(f"trigger-current-model-publish contains forbidden contract element: {forbidden}")

print("publish-current-model workflow contract: PASS")
print("trigger-current-model-publish workflow contract: PASS")
