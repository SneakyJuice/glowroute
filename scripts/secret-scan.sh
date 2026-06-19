#!/bin/bash
# secret-scan.sh — Pre-commit / pre-push secret gate
# Scans STAGED diff (or a given range) for secret patterns. Blocks on match.
#
# Usage:
#   secret-scan.sh                 # scan staged changes (pre-commit mode)
#   secret-scan.sh --range A..B    # scan a commit range (pre-push / CI mode)
#   secret-scan.sh --files f1 f2   # scan specific files
#
# Exit 0 = clean, 1 = secret found (BLOCK), 2 = usage error.
# Lesson origin: GR-040 (2026-06-19) — hardcoded Supabase service-role key
# survived the build loop and was only caught at validation. Gate it at commit.

set -uo pipefail

MODE="staged"
RANGE=""
FILES=()

while [ $# -gt 0 ]; do
  case "$1" in
    --range) MODE="range"; RANGE="$2"; shift 2;;
    --files) MODE="files"; shift; while [ $# -gt 0 ] && [[ "$1" != --* ]]; do FILES+=("$1"); shift; done;;
    *) echo "unknown arg: $1"; exit 2;;
  esac
done

# Secret signatures (extend as new providers appear)
# Note: patterns target VALUES, not just var names, to avoid false positives on env refs.
declare -a PATTERNS=(
  'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'   # JWT (Supabase service-role, etc.)
  'sk-[A-Za-z0-9]{20,}'                                              # OpenAI / Anthropic style
  'sk-ant-[A-Za-z0-9_-]{20,}'                                        # Anthropic
  'ghp_[A-Za-z0-9]{36}'                                              # GitHub PAT
  'github_pat_[A-Za-z0-9_]{60,}'                                     # GitHub fine-grained PAT
  'gho_[A-Za-z0-9]{36}'                                              # GitHub OAuth
  'xox[baprs]-[A-Za-z0-9-]{10,}'                                     # Slack
  'AKIA[0-9A-Z]{16}'                                                 # AWS access key id
  'AIza[0-9A-Za-z_-]{35}'                                            # Google API key
  'r8_[A-Za-z0-9]{37}'                                               # Replicate
  '-----BEGIN [A-Z ]*PRIVATE KEY-----'                              # PEM private keys
)
# Note: bare 'service_role' is intentionally NOT a pattern — too noisy and self-matching.
# The JWT pattern above catches the actual Supabase service-role KEY value, which is what matters.

# Gather the diff text to scan
get_diff() {
  case "$MODE" in
    staged) git diff --cached --no-color --unified=0 ;;
    range)  git diff --no-color --unified=0 "$RANGE" ;;
    files)  for f in "${FILES[@]}"; do [ -f "$f" ] && git --no-pager diff --no-color --no-index /dev/null "$f" 2>/dev/null; done ;;
  esac
}

DIFF="$(get_diff)"
# Only inspect ADDED lines (start with + but not +++ header)
ADDED="$(echo "$DIFF" | grep -E '^\+' | grep -vE '^\+\+\+' || true)"

HITS=0
REPORT=""
for pat in "${PATTERNS[@]}"; do
  MATCH="$(echo "$ADDED" | grep -nE -e "$pat" || true)"
  if [ -n "$MATCH" ]; then
    HITS=$((HITS+1))
    # redact the matched secret value in the report
    REDACTED="$(echo "$MATCH" | sed -E -e "s/($pat)/<<REDACTED-SECRET>>/g" | head -5)"
    REPORT+=$'\n'"  ⛔ pattern /$pat/:"$'\n'"$REDACTED"
  fi
done

if [ "$HITS" -gt 0 ]; then
  echo "🔴 SECRET GATE: BLOCKED — $HITS secret pattern(s) in added lines"
  echo "$REPORT"
  echo ""
  echo "Fix: move the value to env (gopass / .keys.env), reference via process.env, then re-stage."
  echo "Override (DANGEROUS, logged): SECRET_SCAN_BYPASS=1 git commit ..."
  if [ "${SECRET_SCAN_BYPASS:-0}" = "1" ]; then
    echo "⚠️  SECRET_SCAN_BYPASS=1 set — allowing commit despite findings."
    exit 0
  fi
  exit 1
fi

echo "🟢 SECRET GATE: clean ($MODE)"
exit 0
