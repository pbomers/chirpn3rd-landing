#!/usr/bin/env bash
# One command to ship theme changes without stomping on Customize edits.
#
#   ./sync.sh            merge live editor JSON with git -> theme check -> push live -> git push
#   ./sync.sh --pull     just capture live editor edits into git (run after someone used Customize)
#
# Why: anything changed in Shopify's theme editor (Customize) lives only in the live theme's
# templates/*.json, sections/*-group.json and config/settings_data.json. A plain `shopify theme push`
# from git overwrites them. But a plain pull overwrites JSON you edited in git. So this does a
# 3-way merge per JSON file against the last state we pushed (git tag `theme-live`):
#   - changed on live only  -> take live (someone used Customize)
#   - changed in git only   -> keep git (someone edited the file)
#   - changed on both       -> keep live, print a warning so a human looks
#
# Requires: shopify CLI logged in with Themes access, git remote `origin`.

set -euo pipefail
cd "$(dirname "$0")"
STORE=hduc6n-nk
THEME=157749575835
TAG=theme-live
JSON_GLOBS=("templates/*.json" "templates/customers/*.json" "sections/*.json" "config/settings_data.json")

git pull -q --rebase origin main || true

# --- 1. pull live JSON into a scratch dir
TMP=$(mktemp -d)
shopify theme pull --store "$STORE" --theme "$THEME" --path "$TMP" \
  --only "templates/*.json" --only "templates/customers/*.json" \
  --only "sections/*.json" --only "config/settings_data.json" >/dev/null

# --- 2. merge each JSON file
have_base=0; git rev-parse -q --verify "refs/tags/$TAG" >/dev/null && have_base=1
captured=0; conflicts=0
while IFS= read -r -d '' live; do
  rel=${live#"$TMP"/}
  [ -f "$rel" ] || { mkdir -p "$(dirname "$rel")"; cp "$live" "$rel"; captured=$((captured+1)); continue; }
  if cmp -s "$live" "$rel"; then continue; fi
  if [ $have_base -eq 1 ] && git cat-file -e "$TAG:$rel" 2>/dev/null; then
    base=$(mktemp); git show "$TAG:$rel" > "$base"
    if cmp -s "$base" "$rel"; then            # git untouched since last push -> live wins
      cp "$live" "$rel"; captured=$((captured+1))
    elif cmp -s "$base" "$live"; then         # live untouched since last push -> git wins
      :
    else                                       # both moved -> live wins, shout
      cp "$live" "$rel"; captured=$((captured+1)); conflicts=$((conflicts+1))
      echo "CONFLICT: $rel changed in git AND in Customize since last push; kept the live (Customize) copy. Re-apply your git edit in Customize or re-run after checking."
    fi
    rm -f "$base"
  else                                         # no base known -> behave like a plain pull
    cp "$live" "$rel"; captured=$((captured+1))
  fi
done < <(find "$TMP/templates" "$TMP/sections" "$TMP/config" -name '*.json' -print0 2>/dev/null)
rm -rf "$TMP"

if [ $captured -gt 0 ] && ! git diff --quiet -- . ; then
  git add -A .
  git commit -q -m "Theme: capture Customize edits from live" || true
  echo "captured $captured Customize edit(s) from live"
fi
if [ "${1:-}" = "--pull" ]; then git push -q origin main; echo "done (pull only)"; exit 0; fi

# --- 3. lint, push everything, record the pushed state
shopify theme check --fail-level error >/dev/null || { echo "theme check failed — fix before pushing"; shopify theme check --fail-level error | tail -20; exit 1; }
shopify theme push --store "$STORE" --theme "$THEME" --allow-live >/dev/null
git add -A . ; git commit -q -m "Theme: push to live" 2>/dev/null || true
git tag -f "$TAG" >/dev/null
git push -q origin main
git push -q -f origin "$TAG"
[ $conflicts -gt 0 ] && echo "live + on GitHub, with $conflicts conflict(s) noted above" || echo "live + on GitHub"
