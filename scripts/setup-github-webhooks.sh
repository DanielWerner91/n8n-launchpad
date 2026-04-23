#!/usr/bin/env bash
# Wire up the LaunchPad GitHub webhook on every repo that appears in
# launchdeck_projects.links.github_url.
#
# Prereqs:
#   - gh CLI authed (`gh auth status`)
#   - GITHUB_WEBHOOK_SECRET exported (same value as in Vercel env)
#   - LAUNCHPAD_URL exported (defaults to https://launchpad-six-tau.vercel.app)
#
# Events tracked: push, pull_request, release.

set -euo pipefail

LAUNCHPAD_URL="${LAUNCHPAD_URL:-https://launchpad-six-tau.vercel.app}"
WEBHOOK_URL="${LAUNCHPAD_URL%/}/api/integrations/github"

if [[ -z "${GITHUB_WEBHOOK_SECRET:-}" ]]; then
  echo "Error: GITHUB_WEBHOOK_SECRET not set" >&2
  exit 1
fi

# Read repos from a list; pass them as args or paste into stdin.
# Format: owner/repo per line.
REPOS=("$@")
if [[ ${#REPOS[@]} -eq 0 ]]; then
  echo "Paste owner/repo lines (one per line), then Ctrl-D:" >&2
  while IFS= read -r line; do
    [[ -n "$line" ]] && REPOS+=("$line")
  done
fi

for repo in "${REPOS[@]}"; do
  echo "→ $repo"
  gh api -X POST "/repos/${repo}/hooks" \
    -f name=web \
    -F active=true \
    -F 'events[]=push' -F 'events[]=pull_request' -F 'events[]=release' \
    -f config[url]="$WEBHOOK_URL" \
    -f config[content_type]=json \
    -f config[secret]="$GITHUB_WEBHOOK_SECRET" \
    -f config[insecure_ssl]=0 \
    --silent && echo "  ✓ webhook created" || echo "  ✗ failed (maybe already exists)"
done
