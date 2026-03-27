#!/usr/bin/env bash
set -euo pipefail
SITE="https://glowroute.io"
LAST_GOOD_FILE=".last-good-build"
if [[ -f "$LAST_GOOD_FILE" ]]; then
  LAST_GOOD_COMMIT=$(cat "$LAST_GOOD_FILE")
else
  LAST_GOOD_COMMIT=$(git rev-parse HEAD)
  echo "$LAST_GOOD_COMMIT" > "$LAST_GOOD_FILE"
fi
CURRENT_COMMIT=$(git rev-parse HEAD)

echo "Starting build..."
if npm ci && npm run build; then
  echo "Build succeeded. Deploying..."
else
  echo "Build failed. Rolling back to $LAST_GOOD_COMMIT"; git reset --hard "$LAST_GOOD_COMMIT"; exit 1
fi

if vercel --prod; then
  echo "Deploy triggered. Running smoke QA..."
else
  echo "Deploy failed. Rolling back to $LAST_GOOD_COMMIT"; git reset --hard "$LAST_GOOD_COMMIT"; exit 1
fi

if /bin/bash -lc "/root/.openclaw/workspace/glowroute/scripts/smoke-qa.sh"; then
  echo "QA passed. Keeping current build: $CURRENT_COMMIT"
  echo "$CURRENT_COMMIT" > "$LAST_GOOD_FILE"
else
  echo "QA failed. Rolling back to last good: $LAST_GOOD_COMMIT"
  git reset --hard "$LAST_GOOD_COMMIT"
  exit 1
fi
