#!/usr/bin/env bash
# Stop hook — create a git stash checkpoint of the working tree.
#
# Behavior:
#   - If not a git repo: no-op.
#   - If tree clean: no-op.
#   - Otherwise: `git stash push -u -m "claude-checkpoint: <timestamp>"` then
#     immediately re-apply so the user's working tree is untouched.
#
# This means every Stop event leaves a labeled stash entry that can be
# restored with `/checkpoint:restore`. Combined with session-summary.sh
# (which also runs on Stop), you get a recoverable paper trail of every
# session.
#
# Exit codes: always 0 — checkpointing must never block.

set -uo pipefail

# If there's no git dir we can't checkpoint. No error.
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

# Skip if working tree is clean.
if [[ -z "$(git status --porcelain 2>/dev/null)" ]]; then
  exit 0
fi

TS=$(date -u +%Y-%m-%dT%H-%M-%SZ)
MSG="claude-checkpoint: $TS"

# `git stash push -u` includes untracked files. `--keep-index` would keep
# staged changes, but we want the stash to reflect the *full* working state,
# so we stash everything and pop it back.
if git stash push -u -q -m "$MSG" >/dev/null 2>&1; then
  # Re-apply (pop removes the stash, apply keeps it — we want to keep it)
  git stash apply --quiet stash@{0} >/dev/null 2>&1 || true
  echo "checkpoint: $MSG (git stash apply stash@{0} to restore)" >&2
fi

exit 0
