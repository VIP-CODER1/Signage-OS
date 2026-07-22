#!/usr/bin/env bash
# PreToolUse hook — block reads/writes of sensitive files.
#
# Unlike the settings.json deny-list (which only sees exact tool args), this
# hook inspects the actual resolved file path AND shell pipeline contents, so
# it catches:
#   - Direct reads/edits of .env, *.pem, keys, cloud creds
#   - Shell pipelines like `find / -name .env | xargs cat`
#   - Reads of paths listed in .agentignore / .aiignore / .cursorignore
#
# Exit codes:
#   0 — allow
#   2 — block (and print a clear reason to stderr)
#
# Based on the claudekit file-guard pattern, simplified to pure bash so we
# don't carry a TypeScript runtime dependency into every target repo.

set -euo pipefail

INPUT=$(cat)

# ---------- parse input ----------
if command -v jq >/dev/null 2>&1; then
  TOOL_NAME=$(jq -r '.tool_name // empty' <<< "$INPUT" 2>/dev/null || true)
  FILE_PATH=$(jq -r '.tool_input.file_path // .tool_input.path // empty' <<< "$INPUT" 2>/dev/null || true)
  BASH_CMD=$(jq -r '.tool_input.command // empty' <<< "$INPUT" 2>/dev/null || true)
else
  TOOL_NAME=$(grep -oE '"tool_name"\s*:\s*"[^"]+"' <<< "$INPUT" | head -1 | sed -E 's/.*:\s*"([^"]+)".*/\1/' || true)
  FILE_PATH=$(grep -oE '"(file_path|path)"\s*:\s*"[^"]+"' <<< "$INPUT" | head -1 | sed -E 's/.*:\s*"([^"]+)".*/\1/' || true)
  BASH_CMD=$(grep -oE '"command"\s*:\s*"[^"]+"' <<< "$INPUT" | head -1 | sed -E 's/.*:\s*"([^"]+)".*/\1/' || true)
fi

# ---------- sensitive patterns (built-in) ----------
# Patterns use \b (word boundary) so they match both exact file paths and
# substrings inside shell command strings.
SENSITIVE_PATTERNS=(
  '\.env\b'
  '\.aws/credentials\b'
  '\.aws/config\b'
  '\.ssh/id_[a-z0-9_]+\b'
  '\.ssh/[a-z0-9_]+_rsa\b'
  '\.ssh/[a-z0-9_]+_ed25519\b'
  '\.pem\b'
  '\.key\b'
  '\.p12\b'
  '\.pfx\b'
  '\.jks\b'
  '\.keystore\b'
  '\bid_rsa\b'
  '\bid_ed25519\b'
  'gcloud/application_default_credentials\.json\b'
  'azure/accessTokens\.json\b'
  '/secrets?/'
  'docker/config\.json\b'
  'kube/config\b'
  '\bnetrc\b'
)

# ---------- load user ignore files ----------
# If any of these exist at the repo root, add their patterns.
load_ignore_file() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line; do
    # skip blanks and comments
    [[ -z "$line" || "$line" =~ ^# ]] && continue
    # glob-style → regex-style (very loose conversion)
    local pat="$line"
    pat="${pat//\./\\.}"
    pat="${pat//\*/.*}"
    SENSITIVE_PATTERNS+=("$pat")
  done < "$f"
}

for ignore in ".agentignore" ".aiignore" ".cursorignore" ".codeiumignore" ".aiexclude"; do
  load_ignore_file "$ignore"
done

# ---------- allowlist ----------
# Filenames that *look* sensitive but are the documented public conventions
# for env-var templates. Stripped from the scan target before matching so the
# deny patterns don't trip on e.g. `.env.example` (whose `.env` substring
# otherwise matches `\.env\b`).
ALLOWED_TOKEN_REGEX='\.env\.(example|sample|template|dist)'

sanitize_for_scan() {
  sed -E "s/${ALLOWED_TOKEN_REGEX}//g" <<< "$1"
}

# ---------- matcher ----------
match_sensitive() {
  local target
  target=$(sanitize_for_scan "$1")
  for pat in "${SENSITIVE_PATTERNS[@]}"; do
    if grep -qE "$pat" <<< "$target"; then
      return 0
    fi
  done
  return 1
}

# ---------- check the direct file arg (Read/Edit/Write) ----------
if [[ -n "${FILE_PATH:-}" ]]; then
  if match_sensitive "$FILE_PATH"; then
    echo "file-guard: blocked access to sensitive path: $FILE_PATH" >&2
    echo "file-guard: set FILE_GUARD_OVERRIDE=1 to bypass (not recommended)" >&2
    [[ "${FILE_GUARD_OVERRIDE:-0}" = "1" ]] || exit 2
  fi
fi

# ---------- check bash pipelines ----------
# Look for sensitive patterns anywhere in the command string. False positives
# are OK here — this is a guard, not a linter.
if [[ -n "${BASH_CMD:-}" ]]; then
  # Strip allowlisted tokens so e.g. a commit message or redirection targeting
  # `.env.example` doesn't match the generic `.env` pattern.
  BASH_CMD_SCAN=$(sanitize_for_scan "$BASH_CMD")

  for pat in "${SENSITIVE_PATTERNS[@]}"; do
    if grep -qE "$pat" <<< "$BASH_CMD_SCAN"; then
      echo "file-guard: blocked bash command touching sensitive path pattern: $pat" >&2
      echo "file-guard: command was: $BASH_CMD" >&2
      [[ "${FILE_GUARD_OVERRIDE:-0}" = "1" ]] || exit 2
    fi
  done

  # Heuristic: commands that read arbitrary file contents (cat, less, head, tail)
  # combined with find/xargs are classic exfiltration paths.
  if grep -qE '(cat|head|tail|less|more|xxd|base64|openssl\s+enc)\b.*\.(env|pem|key|p12|pfx)' <<< "$BASH_CMD_SCAN"; then
    echo "file-guard: blocked bash command that appears to read a sensitive file" >&2
    echo "file-guard: command was: $BASH_CMD" >&2
    [[ "${FILE_GUARD_OVERRIDE:-0}" = "1" ]] || exit 2
  fi
fi

exit 0
