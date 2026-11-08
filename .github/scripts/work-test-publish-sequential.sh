#!/usr/bin/env bash
# Dispatch publish-work-test for each candidate id in $1, one at a time, and wait
# for each run. publish-work-test shares one concurrency group and GitHub cancels
# an already pending run when another one is queued, so this must stay sequential.
# Prints the number of failed publishes on the last line. Needs GH_TOKEN.
set -euo pipefail
failed=0
while IFS= read -r candidate; do
  [[ -n "$candidate" ]] || continue
  [[ "$candidate" =~ ^auto-[a-z0-9-]{1,123}$ ]] || { echo "::error::invalid id"; exit 1; }
  since="$(date -u -d '-10 seconds' +%Y-%m-%dT%H:%M:%SZ)"
  gh api --method POST \
    "/repos/${GITHUB_REPOSITORY}/actions/workflows/publish-work-test.yml/dispatches" \
    -f ref=main -f "inputs[candidate]=$candidate"
  result=""
  for _ in $(seq 1 36); do
    sleep 10
    run="$(gh api "/repos/${GITHUB_REPOSITORY}/actions/workflows/publish-work-test.yml/runs?event=workflow_dispatch&created=%3E%3D${since}&per_page=20" \
      --jq "[.workflow_runs[] | select(.display_title == \"Publish WORK_TEST - ${candidate}\")][0] // {} | \"\(.status // \"\") \(.conclusion // \"\")\"")"
    read -r status conclusion <<<"$run" || true
    if [[ "$status" == "completed" ]]; then result="$conclusion"; break; fi
  done
  if [[ "$result" == "success" ]]; then
    echo "Published $candidate."
  else
    failed=$((failed + 1))
    echo "::warning::Publish of $candidate ended: ${result:-timeout}. Retried in a later run (skipped after 3 failures)."
  fi
done < "$1"
echo "Publish failures this run: $failed"
