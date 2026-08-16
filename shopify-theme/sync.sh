#!/usr/bin/env bash
# One command to ship theme changes without stomping on Customize edits.
#
#   ./sync.sh            pull editor JSON from live -> commit -> check -> push live -> commit -> git push
#   ./sync.sh --pull     just capture live editor edits into git (run after someone used Customize)
#
# Why: anything changed in Shopify's theme editor (Customize) lives only in the live theme's
# templates/*.json, sections/*-group.json and config/settings_data.json. A plain `shopify theme push`
# from git overwrites them with git's older copy. Pulling first keeps both sides honest.

set -euo pipefail
cd "$(dirname "$0")"
STORE=hduc6n-nk
THEME=157749575835

# 0. be on latest git
git pull -q --rebase origin main || true

# 1. capture Customize edits (JSON only) from the live theme
shopify theme pull --store "$STORE" --theme "$THEME" \
  --only "templates/*.json" --only "templates/customers/*.json" \
  --only "sections/*.json" --only "config/settings_data.json" >/dev/null
if ! git diff --quiet -- . ; then
  git add -A .
  git commit -q -m "Theme: capture Customize edits from live" || true
  echo "captured Customize edits from live"
fi
[ "${1:-}" = "--pull" ] && { git push -q origin main; echo "done (pull only)"; exit 0; }

# 2. lint, push code + JSON together, record it
shopify theme check --fail-level error >/dev/null || { echo "theme check failed — fix before pushing"; shopify theme check --fail-level error | tail -20; exit 1; }
shopify theme push --store "$STORE" --theme "$THEME" --allow-live >/dev/null
git add -A . ; git commit -q -m "Theme: push to live" 2>/dev/null || true
git push -q origin main
echo "live + on GitHub"
