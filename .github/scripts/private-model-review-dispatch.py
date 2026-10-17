"""Trusted request-only bridge to the existing main-only P186E browser probe.

No viewer credentials are read here. The canonical child workflow owns them.
"""
import json
import os
from pathlib import Path
import re
import subprocess
import sys

REQUEST_PATH = ".github/private-model-review-request.json"
REPOSITORY = "aapojohannespihkala-lgtm/aapopihkala-fi"
REQUEST_REF = "refs/heads/ops/private-model-review"
ACTOR = "aapojohannespihkala-lgtm"
ACTOR_ID = "322566438"
SHA = re.compile(r"[0-9a-f]{40}")


def require(condition, code):
    if not condition:
        raise ValueError("P186E_DISPATCH_" + code)


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, "DUPLICATE_KEY")
        result[key] = value
    return result


def validate_request(payload, trusted_main_sha):
    require(isinstance(payload, dict) and set(payload) == {
        "probeMode", "requestId", "expectedMainSha",
    }, "REQUEST_KEYS")
    require(payload["probeMode"] == "p186e-labels-render", "FIXED_PROBE_MODE")
    request_id = payload["requestId"]
    require(isinstance(request_id, str) and
            re.fullmatch(r"[A-Za-z0-9._:-]{1,128}", request_id), "REQUEST_ID")
    require(isinstance(trusted_main_sha, str) and SHA.fullmatch(trusted_main_sha)
            and trusted_main_sha != "0" * 40
            and payload["expectedMainSha"] == trusted_main_sha, "TRUSTED_MAIN")
    return {"ref": "main", "inputs": {"probe_mode": "p186e-labels-render"}}


def git(*args):
    return subprocess.run(["git", *args], check=True, capture_output=True).stdout


def prepare_dispatch(env):
    require(env.get("EVENT_NAME") == "push" and
            env.get("REPOSITORY") == REPOSITORY and
            env.get("REF_FULL") == REQUEST_REF and
            env.get("ACTOR") == ACTOR and env.get("ACTOR_ID") == ACTOR_ID,
            "TRUSTED_EVENT")
    before, after = env.get("BEFORE_SHA", ""), env.get("AFTER_SHA", "")
    require(all(SHA.fullmatch(value) and value != "0" * 40
                for value in (before, after)), "REQUEST_COMMIT")
    trusted_main = git("rev-parse", "HEAD").decode().strip()
    # Only the final pushed tree is executed. It must be identical to trusted
    # main except for the inert request, even when the previous request branch
    # predates newer main commits. Preserve both histories without force.
    git("merge-base", "--is-ancestor", before, after)
    git("merge-base", "--is-ancestor", trusted_main, after)
    changed = git("diff", "--name-only", "--no-renames", trusted_main, after).decode().splitlines()
    require(changed == [REQUEST_PATH], "REQUEST_ONLY_TREE")
    raw = git("show", after + ":" + REQUEST_PATH)
    require(0 < len(raw) <= 4096, "REQUEST_SIZE")
    payload = json.loads(raw, object_pairs_hook=unique_object)
    return validate_request(payload, trusted_main)


def main():
    try:
        require(len(sys.argv) == 2, "OUTPUT_ARGUMENT")
        dispatch = prepare_dispatch(os.environ)
        Path(sys.argv[1]).write_text(json.dumps(dispatch) + "\n", encoding="utf-8")
        print("P186E trusted request verified. Canonical main dispatch prepared.")
    except (ValueError, OSError, subprocess.CalledProcessError):
        # Do not serialize request contents, environment, remote errors or tokens.
        print("P186E_DISPATCH_REQUEST_REJECTED", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
