#!/usr/bin/env bash
# PostToolUse hook — catch lazy-edit failure modes that lint won't catch.
#
# The three classic Claude regressions:
#   1. Replacing real code with a placeholder comment ("// ..." or "# ...")
#   2. Adding `any` / `unknown` in TypeScript to silence a type error
#   3. Renaming an "unused parameter" to `_foo` instead of removing it
#
# This hook diffs the file against HEAD (if in git) and flags these patterns.
# Exit code 2 blocks only if STRICT_QUALITY=1; otherwise it warns on stderr
# so the user sees it without the session getting stuck.

set -uo pipefail

INPUT=$(cat)

if command -v jq >/dev/null 2>&1; then
  FILE_PATH=$(jq -r '.tool_input.file_path // .tool_input.path // empty' <<< "$INPUT" 2>/dev/null || true)
else
  FILE_PATH=$(grep -oE '"(file_path|path)"\s*:\s*"[^"]+"' <<< "$INPUT" | head -1 | sed -E 's/.*:\s*"([^"]+)".*/\1/' || true)
fi

[[ -z "${FILE_PATH:-}" || ! -f "$FILE_PATH" ]] && exit 0

# Only meaningful in a git repo
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

# Skip if file isn't tracked (new file → no HEAD baseline)
if ! git ls-files --error-unmatch "$FILE_PATH" >/dev/null 2>&1; then
  exit 0
fi

DIFF=$(git diff --unified=0 HEAD -- "$FILE_PATH" 2>/dev/null || true)
[[ -z "$DIFF" ]] && exit 0

# Use character class [+] and fixed-string grep for portability across GNU
# grep / BSD grep / ugrep.
ADDED=$(echo "$DIFF" | grep -E '^[+]' | grep -vF '+++')

WARNINGS=()

# 1. Placeholder comments replacing real code — detect both standalone and inline
if echo "$ADDED" | grep -qE '^[+].*(//\s*\.\.\.|#\s*\.\.\.|/\*\s*\.\.\.\s*\*/|//\s*TODO:?\s*(implement|fill|fix)|#\s*TODO:?\s*(implement|fill|fix))'; then
  WARNINGS+=("placeholder comment detected in additions (// ..., # ..., // TODO: implement). Did you replace real code with a stub?")
fi

# 2. \`any\` in TypeScript
case "$FILE_PATH" in
  *.ts|*.tsx)
    if echo "$ADDED" | grep -qE '^[+].*(:\s*any\b|as\s+any\b|<any>)'; then
      WARNINGS+=("\`any\` type added. Prefer specific types or \`unknown\` with a narrowing check.")
    fi
    ;;
esac

# 3. Underscored "unused" params
# Flag additions like (_foo: string) where there was a real name before.
if echo "$ADDED" | grep -qE '^[+].*\(\s*_[a-zA-Z][a-zA-Z0-9]*\s*[,:)]'; then
  WARNINGS+=("underscored parameter name added (_foo). If it's truly unused, remove it; if it's used, don't rename it.")
fi

if [[ ${#WARNINGS[@]} -gt 0 ]]; then
  echo "" >&2
  echo "check-code-quality: concerns in $FILE_PATH:" >&2
  for w in "${WARNINGS[@]}"; do
    echo "  - $w" >&2
  done
  echo "" >&2
  if [[ "${STRICT_QUALITY:-0}" = "1" ]]; then
    echo "check-code-quality: blocking (STRICT_QUALITY=1). Fix or revert." >&2
    exit 2
  fi
fi

exit 0
