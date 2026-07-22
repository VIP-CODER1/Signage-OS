#!/usr/bin/env bash
# Stop hook — append a per-branch session summary to the memory bank.
#
# Complements session-summary.sh (which writes to a single daily log) by
# writing branch-scoped records under:
#
#   .claude/memory-bank/<branch>/sessions.md
#
# so every feature branch has its own structured trail of what landed there.
# Subdirs in branch names (e.g. "feat/auth-redesign") are created as real
# directories via `mkdir -p`.
#
# Deterministic fields only. Narrative (branch purpose, decisions, handoff)
# stays in CLAUDE-*.md at the repo root, or in sibling notes-*.md files under
# .claude/memory-bank/<branch>/ — ownership boundary is: this hook writes
# sessions.md; humans/Claude write everything else.

set -euo pipefail

MB_DIR=".claude/memory-bank"

# Only meaningful inside a git repo.
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)
# Detached-HEAD case — record the commit rather than "HEAD".
if [[ "$branch" == "HEAD" ]]; then
  branch="detached-$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
fi

changed=$(git diff --name-only HEAD 2>/dev/null | sort -u | tr '\n' ' ' || true)
staged=$(git diff --name-only --staged 2>/dev/null | sort -u | tr '\n' ' ' || true)
commits=""
if git show-ref --verify --quiet refs/heads/main; then
  commits=$(git log --oneline main..HEAD 2>/dev/null | head -20 || true)
fi

# Skip noop Stop events so the file doesn't accumulate empty blocks.
if [[ -z "${changed// }" && -z "${staged// }" && -z "$commits" ]]; then
  exit 0
fi

target_dir="$MB_DIR/$branch"
mkdir -p "$target_dir"
target_file="$target_dir/sessions.md"

NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
head_sha=$(git rev-parse --short HEAD 2>/dev/null || echo unknown)
head_msg=$(git log -1 --format='%s' HEAD 2>/dev/null || echo unknown)
# Most recent Claude checkpoint stash, if any (set by create-checkpoint.sh).
checkpoint_ref=$(git stash list 2>/dev/null | grep -m1 'claude-checkpoint:' | awk -F: '{print $1}' || true)

{
  if [[ ! -f "$target_file" ]]; then
    cat <<EOF
# Session log — \`$branch\`

Auto-appended by \`.claude/hooks/session-memory-bank.sh\` on every Claude
session Stop event with real activity (files changed, staged, or commits
ahead of main). Structured fields only — narrative for this branch lives
in sibling \`notes-*.md\` files under this directory or in the repo-root
\`CLAUDE-*.md\` companions.

EOF
  fi

  echo "## session_end: $NOW"
  echo "- head: \`$head_sha\` — $head_msg"
  echo "- files_changed: ${changed:-<none>}"
  echo "- files_staged: ${staged:-<none>}"
  if [[ -n "$commits" ]]; then
    echo "- commits_vs_main:"
    echo "$commits" | sed 's/^/  - /'
  fi
  [[ -n "$checkpoint_ref" ]] && echo "- checkpoint: $checkpoint_ref"
  echo ""
} >> "$target_file"

exit 0
