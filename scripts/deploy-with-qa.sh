#!/usr/bin/env bash
set -euo pipefail
# ============================================================
# GlowRoute Deploy-with-QA
# ============================================================
# GitHub → Vercel auto-deploy is ACTIVE (connected Mar 2026).
# DO NOT call `vercel --prod` — it creates a duplicate deploy
# that races with the GitHub-triggered one.
#
# This script: build locally → push to GitHub → wait for
# Vercel auto-deploy → run smoke QA.
# ============================================================

SITE="https://glowroute.io"
LAST_GOOD_FILE=".last-good-build"
VERCEL_POLL_INTERVAL=15   # seconds between status checks
VERCEL_TIMEOUT=300        # max wait for deploy (5 min)

if [[ -f "$LAST_GOOD_FILE" ]]; then
  LAST_GOOD_COMMIT=$(cat "$LAST_GOOD_FILE")
else
  LAST_GOOD_COMMIT=$(git rev-parse HEAD)
  echo "$LAST_GOOD_COMMIT" > "$LAST_GOOD_FILE"
fi
CURRENT_COMMIT=$(git rev-parse HEAD)

echo "=== Step 1: Local build check ==="
if npm ci && npm run build; then
  echo "✅ Build succeeded locally."
else
  echo "❌ Build failed. Rolling back to $LAST_GOOD_COMMIT"
  git reset --hard "$LAST_GOOD_COMMIT"
  exit 1
fi

echo "=== Step 2: Push to GitHub (triggers Vercel auto-deploy) ==="
git push origin main

echo "=== Step 3: Wait for Vercel deploy to complete ==="
echo "GitHub → Vercel auto-deploy is handling this. Polling for READY state..."
ELAPSED=0
while [ $ELAPSED -lt $VERCEL_TIMEOUT ]; do
  sleep $VERCEL_POLL_INTERVAL
  ELAPSED=$((ELAPSED + VERCEL_POLL_INTERVAL))
  
  # Check if the site is serving the new commit (via build ID or response)
  HTTP_STATUS=$(curl -sI "$SITE/clinics" -o /dev/null -w "%{http_code}" 2>/dev/null || echo "000")
  if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Site responding 200 after ${ELAPSED}s"
    break
  fi
  echo "  Waiting... (${ELAPSED}s elapsed, status=$HTTP_STATUS)"
done

if [ $ELAPSED -ge $VERCEL_TIMEOUT ]; then
  echo "⚠️ Timed out waiting for deploy. Check Vercel dashboard."
  exit 1
fi

echo "=== Step 4: Smoke QA ==="
if /bin/bash -lc "/root/.openclaw/workspace/glowroute/scripts/smoke-qa.sh"; then
  echo "✅ QA passed. Keeping current build: $CURRENT_COMMIT"
  echo "$CURRENT_COMMIT" > "$LAST_GOOD_FILE"
else
  echo "❌ QA failed. Rolling back to last good: $LAST_GOOD_COMMIT"
  git reset --hard "$LAST_GOOD_COMMIT"
  git push origin main --force
  exit 1
fi
