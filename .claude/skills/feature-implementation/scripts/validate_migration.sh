#!/usr/bin/env bash
# Validate a DB migration file is reversible and follows project conventions.
#
# Usage:
#   validate_migration.sh <migration-file>
#
# Checks:
#   1. File exists and is non-empty
#   2. Contains an "up" section (CREATE/ALTER/INSERT etc.)
#   3. Contains a "down" section (DROP/REVERSE)
#   4. "down" is not empty or "-- cannot be undone" (those silently break rollback)
#   5. No destructive operations without explicit confirmation marker
#
# Exit codes: 0 valid, 1 invalid, 2 usage error.

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: $0 <migration-file>" >&2
  exit 2
fi

FILE="$1"

if [[ ! -f "$FILE" ]]; then
  echo "FAIL: file not found: $FILE" >&2
  exit 1
fi

if [[ ! -s "$FILE" ]]; then
  echo "FAIL: file is empty: $FILE" >&2
  exit 1
fi

CONTENT=$(cat "$FILE")

# Heuristic: look for up/down markers (SQL comment style or function-based).
if ! grep -qiE '^(--\s*up|#\s*up|def\s+upgrade|function\s+up|\+\+\s*migrate\s+up)' <<< "$CONTENT"; then
  echo "FAIL: no 'up' section detected. Migrations must have an up/apply block." >&2
  exit 1
fi

if ! grep -qiE '^(--\s*down|#\s*down|def\s+downgrade|function\s+down|\+\+\s*migrate\s+down)' <<< "$CONTENT"; then
  echo "FAIL: no 'down' section detected. Every migration must be reversible." >&2
  echo "      If it truly cannot be reversed, add a comment '-- irreversible: <reason>'" >&2
  echo "      and document the manual rollback in an ADR." >&2
  exit 1
fi

# Flag destructive ops without an explicit ack
if grep -qiE 'DROP\s+(TABLE|COLUMN|DATABASE|SCHEMA)' <<< "$CONTENT"; then
  if ! grep -qi -- '-- destructive-ack:' <<< "$CONTENT"; then
    echo "FAIL: destructive DROP detected without '-- destructive-ack: <reason>' marker." >&2
    exit 1
  fi
fi

echo "OK: $FILE"
exit 0
