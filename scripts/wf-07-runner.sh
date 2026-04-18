#!/bin/bash
# WF-07 Runner — Apollo Contact Enrichment
# Usage: ./wf-07-runner.sh [--test] [--batch 100] [--offset 0]
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."
source /home/anthony/.openclaw/workspace/.keys.env
echo "🚀 WF-07 Apollo Enrichment starting..."
node scripts/wf-07-apollo-enrich.js "$@"
