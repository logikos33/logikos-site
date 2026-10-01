#!/usr/bin/env bash
# Opens the issues drafted in docs/issues/ (front matter: title + labels).
# Usage: ./scripts/open-issues.sh <owner/repo> [file ...]
set -euo pipefail
repo="${1:?usage: open-issues.sh owner/repo [files...]}"
shift
files=("$@")
if [ ${#files[@]} -eq 0 ]; then
  mapfile -t files < <(ls docs/issues/[0-9]*.md)
fi
for f in "${files[@]}"; do
  title=$(sed -n "s/^title: '\(.*\)'$/\1/p" "$f" | head -1)
  labels=$(sed -n 's/^labels: \[\(.*\)\]$/\1/p' "$f" | head -1 | tr -d ' ')
  for label in ${labels//,/ }; do gh label create "$label" --repo "$repo" --force >/dev/null 2>&1 || true; done
  body=$(awk 'BEGIN{n=0} /^---$/{n++; next} n>=2{print}' "$f")
  gh issue create --repo "$repo" --title "$title" --label "$labels" --body "$body"
done
