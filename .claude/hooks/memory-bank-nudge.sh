#!/usr/bin/env bash
# Stop hook — nudges to update CLAUDE-*.md memory-bank companion files when
# source changed in this session but none of the memory-bank files were touched.
#
# Why this exists:
#   The four CLAUDE-*.md files (activeContext, decisions, patterns,
#   troubleshooting) carry knowledge across sessions. They can't be updated by
#   a hook automatically — that takes judgment ("was this decision worth
#   recording?"). This hook just nudges when it looks like an update was missed,
#   so the omission is caught before the session ends.
#
# Behavior:
#   - Advisory only. Exits 0 unconditionally — never blocks a Stop event.
#   - Output goes to stderr (visible to the user / Claude in the transcript).
#
# Heuristic for "this session":
#   - Uncommitted changes (git diff HEAD), AND/OR
#   - The most recent commit IF it landed within the last 30 minutes.
#   If the union of those changed paths includes at least one source-ish file
#   (anything that isn't pure doc/config) but NONE of the four CLAUDE-*.md
#   files, emit the nudge.
#
# Disable: set CLAUDE_SDLC_MEMORY_NUDGE=0 in your shell or in settings.json env.

set -euo pipefail

# Disabled?
[[ "${CLAUDE_SDLC_MEMORY_NUDGE:-1}" = "0" ]] && exit 0

# Not a git repo? Nothing to compare against.
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

# Files changed in working tree (staged + unstaged, vs HEAD).
uncommitted=$(git diff --name-only HEAD 2>/dev/null || true)

# Files in the most recent commit, but only if it's within the last 30 minutes.
recent_commit_files=""
if last_ts=$(git log -1 --format=%ct 2>/dev/null); then
  now=$(date +%s)
  if (( now - last_ts < 1800 )); then
    recent_commit_files=$(git show --name-only --format= HEAD 2>/dev/null || true)
  fi
fi

# Union, deduped, no blank lines.
changed=$(printf "%s\n%s\n" "$uncommitted" "$recent_commit_files" | sort -u | sed '/^$/d')

# Nothing changed → nothing to nudge about.
[[ -z "$changed" ]] && exit 0

# Did any CLAUDE-*.md memory-bank file get touched? Match basename only.
if echo "$changed" | grep -qE '(^|/)CLAUDE-(activeContext|patterns|decisions|troubleshooting)\.md$'; then
  exit 0
fi

# Treat these as "doc/config only" and don't nudge if all changes are these.
# Anything NOT in this allowlist is considered "real source/spec/migration".
DOC_PATTERN='(^|/)(README|DEMO|CHANGELOG|CONTRIBUTING|LICENSE|NOTICE|CODE_OF_CONDUCT|SECURITY|HISTORY|AUTHORS)(\.md|\.rst|\.txt)?$|(^|/)\.(gitignore|gitattributes|prettierignore|prettierrc[^/]*|editorconfig|nvmrc|node-version|tool-versions)$|(^|/)docs/.*\.md$'

real_changes=$(echo "$changed" | grep -vE "$DOC_PATTERN" || true)
[[ -z "$real_changes" ]] && exit 0

# At least one real source change happened, but no memory-bank file was touched.
# Surface the nudge.
cat >&2 <<'EOF'

⏶ memory-bank-nudge ─────────────────────────────────────────────────────────
Source changed this session, but no CLAUDE-*.md memory-bank file was updated.
These four files carry knowledge across sessions — keep them current:

  • CLAUDE-activeContext.md   — current focus / in-flight branches / blockers
  • CLAUDE-decisions.md       — medium-weight ADR-lite log
  • CLAUDE-patterns.md        — patterns adopted twice (worth recording on the third)
  • CLAUDE-troubleshooting.md — weird bugs and their fixes

Trigger an update by saying "update memory bank", or append inline as you go.
Disable this nudge: env CLAUDE_SDLC_MEMORY_NUDGE=0
─────────────────────────────────────────────────────────────────────────────

EOF

exit 0
