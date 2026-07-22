#!/usr/bin/env bash
# PostToolUse hook for Write|Edit — runs tests affected by the changed file.
#
# Policy: fast, opportunistic. We don't block the main session on slow tests.
# Instead we try to:
#   1. Find tests adjacent to the changed file ($FILE.test.* or test_$FILE.py).
#   2. Run those if found and the test runner is available.
#   3. Report result via stderr; never block the session unless TESTS_MUST_PASS=1.
#
# If the project uses a global test command and has no natural "affected tests"
# heuristic, we skip — use the reviewer subagent or CI for full runs.

set -euo pipefail

INPUT=$(cat)

if command -v jq >/dev/null 2>&1; then
  FILE_PATH=$(jq -r '.tool_input.file_path // .tool_input.path // empty' <<< "$INPUT" 2>/dev/null || true)
else
  FILE_PATH=$(grep -oE '"(file_path|path)"\s*:\s*"[^"]+"' <<< "$INPUT" | head -1 | sed -E 's/.*:\s*"([^"]+)".*/\1/' || true)
fi

[[ -z "${FILE_PATH:-}" ]] && exit 0
[[ ! -f "$FILE_PATH" ]] && exit 0

# Skip if the edit is to a test file itself — it'll get exercised by the dev loop.
case "$FILE_PATH" in
  *.test.ts|*.test.tsx|*.test.js|*.test.jsx|*.spec.ts|*.spec.tsx|*.spec.js|*_test.go|test_*.py|*_test.py)
    exit 0
    ;;
esac

dir=$(dirname "$FILE_PATH")
base=$(basename "$FILE_PATH")
stem="${base%.*}"
ext="${base##*.}"

fail_with_policy() {
  if [[ "${TESTS_MUST_PASS:-0}" = "1" ]]; then
    echo "post-write-test: tests failed, blocking (TESTS_MUST_PASS=1)" >&2
    exit 2
  else
    echo "post-write-test: tests failed (warning only; set TESTS_MUST_PASS=1 to block)" >&2
    exit 0
  fi
}

try_run() {
  local tool="${1%% *}"
  command -v "$tool" >/dev/null 2>&1 || return 0
  echo "post-write-test: running: $*" >&2
  if ! eval "$1"; then
    fail_with_policy
  fi
}

case "$ext" in
  ts|tsx|js|jsx|mjs|cjs)
    for candidate in "$dir/$stem.test.$ext" "$dir/$stem.spec.$ext" "$dir/__tests__/$stem.test.$ext"; do
      if [[ -f "$candidate" ]]; then
        if [[ -f "package.json" ]]; then
          if command -v pnpm >/dev/null 2>&1 && [[ -f "pnpm-lock.yaml" ]]; then
            try_run "pnpm exec vitest run \"$candidate\" || pnpm exec jest \"$candidate\""
          else
            try_run "npx --no-install vitest run \"$candidate\" || npx --no-install jest \"$candidate\""
          fi
        fi
        break
      fi
    done
    ;;
  py)
    for candidate in "$dir/test_$stem.py" "$dir/${stem}_test.py" "tests/test_$stem.py"; do
      if [[ -f "$candidate" ]]; then
        try_run "pytest \"$candidate\" -q"
        break
      fi
    done
    ;;
  go)
    pkg_dir="$dir"
    if ls "$pkg_dir"/*_test.go >/dev/null 2>&1; then
      try_run "go test -count=1 \"./$pkg_dir/...\""
    fi
    ;;
  rs)
    if [[ -f "Cargo.toml" ]]; then
      try_run "cargo test --quiet"
    fi
    ;;
esac

exit 0
