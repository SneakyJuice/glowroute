#!/usr/bin/env bash
set -euo pipefail
SITE=${1:-https://glowroute.io}
urls=("/" "/clinics" "/articles" "/insights" "/guides")
STATUS=0
for u in "${urls[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$SITE$u")
  if [[ "$code" != "200" && "$code" != "307" ]]; then
    echo "QA FAIL: $SITE$u -> $code"
    STATUS=1
  else
    echo "QA OK: $SITE$u -> $code"
  fi
done
exit $STATUS
