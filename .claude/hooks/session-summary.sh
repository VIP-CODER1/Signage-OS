#!/usr/bin/env bash
# Stop hook — writes a structured summary of the session to .claude/logs/.
#
# We capture:
#   - Timestamp
#   - Files changed during the session (from git)
#   - Commits made
#   - Which skills were referenced (best-effort grep from transcript if available)
#
# The log is append-only. Rotate with logrotate or trim manually; the installer
# gitignores .claude/logs/ so these don't pollute commits.

set -euo pipefail

LOG_DIR=".claude/logs"
mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/session-$(date +%Y%m%d).log"
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)

{
  echo "---"
  echo "session_end: $NOW"

  if git rev-parse --git-dir >/dev/null 2>&1; then
    # Branch name — `HEAD` if detached, `unknown` if git can't resolve.
    branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)
    # Changes since HEAD (unstaged + staged but uncommitted)
    changed=$(git diff --name-only HEAD 2>/dev/null | sort -u | tr '\n' ' ' || true)
    staged=$(git diff --name-only --staged 2>/dev/null | sort -u | tr '\n' ' ' || true)
    # Commits on current branch not on main (if main exists)
    commits=""
    if git show-ref --verify --quiet refs/heads/main; then
      commits=$(git log --oneline main..HEAD 2>/dev/null | head -20 || true)
    fi

    echo "branch: ${branch:-unknown}"
    echo "files_changed: ${changed:-<none>}"
    echo "files_staged: ${staged:-<none>}"
    if [[ -n "$commits" ]]; then
      echo "commits:"
      echo "$commits" | sed 's/^/  - /'
    fi
  else
    echo "git_repo: no"
  fi

  echo ""
} >> "$LOG_FILE"

exit 0
