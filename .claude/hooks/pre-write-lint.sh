#!/usr/bin/env bash
# PreToolUse hook for Write|Edit — runs the project linter on the edited file.
#
# Claude Code passes the tool input as JSON on stdin. We extract the target
# file path, run the appropriate linter for its extension, and exit non-zero
# (with a useful message on stderr) to block the write if lint fails.
#
# Graceful by design:
# - If no linter is configured or found for this file type, it's a no-op.
# - If the file doesn't exist yet (brand-new file), we skip lint.
# - If $CLAUDE_SDLC_LINT_CMD is set, we use that; otherwise we detect.
#
# To disable: remove this hook from .claude/settings.json.

set -euo pipefail

INPUT=$(cat)

# Best-effort JSON parse — we try jq first, fall back to a naive grep.
if command -v jq >/dev/null 2>&1; then
  FILE_PATH=$(jq -r '.tool_input.file_path // .tool_input.path // empty' <<< "$INPUT" 2>/dev/null || true)
else
  FILE_PATH=$(grep -oE '"(file_path|path)"\s*:\s*"[^"]+"' <<< "$INPUT" | head -1 | sed -E 's/.*:\s*"([^"]+)".*/\1/' || true)
fi

# No file to lint → skip
[[ -z "${FILE_PATH:-}" ]] && exit 0

# Brand-new file (pre-write) won't exist yet. Skip linting new files; we'll
# catch them on the post-write hook if needed.
[[ ! -f "$FILE_PATH" ]] && exit 0

# Resolve to a relative path for tool compatibility.
REL_PATH="$FILE_PATH"
if [[ "$FILE_PATH" = /* ]]; then
  REL_PATH="${FILE_PATH#"$PWD/"}"
fi

ext="${FILE_PATH##*.}"

run_and_guard() {
  local cmd="$1"
  # Only run if the tool is actually installed.
  local tool="${cmd%% *}"
  if ! command -v "$tool" >/dev/null 2>&1; then
    return 0
  fi
  if ! eval "$cmd" >&2; then
    echo "" >&2
    echo "pre-write-lint: lint failed for $REL_PATH" >&2
    echo "pre-write-lint: fix the lint errors above, or edit .claude/hooks/pre-write-lint.sh to adjust policy" >&2
    exit 2  # exit code 2 → block tool use in Claude Code hooks
  fi
}

case "$ext" in
  ts|tsx|js|jsx|mjs|cjs)
    if [[ -f "package.json" ]]; then
      if command -v pnpm >/dev/null 2>&1 && [[ -f "pnpm-lock.yaml" ]]; then
        run_and_guard "pnpm exec eslint --no-error-on-unmatched-pattern \"$REL_PATH\""
      elif command -v npx >/dev/null 2>&1; then
        run_and_guard "npx --no-install eslint --no-error-on-unmatched-pattern \"$REL_PATH\""
      fi
    fi
    ;;
  py)
    if command -v ruff >/dev/null 2>&1; then
      run_and_guard "ruff check \"$REL_PATH\""
    elif command -v flake8 >/dev/null 2>&1; then
      run_and_guard "flake8 \"$REL_PATH\""
    fi
    ;;
  go)
    run_and_guard "gofmt -l \"$REL_PATH\" | ( ! grep -q . )"
    ;;
  rs)
    # Rust lints are best run at crate level; skip per-file lint.
    ;;
  sh|bash)
    if command -v shellcheck >/dev/null 2>&1; then
      run_and_guard "shellcheck \"$REL_PATH\""
    fi
    ;;
esac

exit 0
