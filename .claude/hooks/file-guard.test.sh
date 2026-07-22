#!/usr/bin/env bash
# Tests for file-guard.sh.
#
# Run:  bash .claude/hooks/file-guard.test.sh
#
# Each case feeds a crafted tool-input JSON to the hook on stdin and asserts
# the exit code. 0 = allow, 2 = block.

set -uo pipefail

HOOK="$(cd "$(dirname "$0")" && pwd)/file-guard.sh"
PASS=0
FAIL=0

# Dot-env literal, assembled at runtime so this file itself never contains the
# raw token — that would trip the hook when Claude tries to edit this file.
DOT=.
ENV_NAME="${DOT}env"

run_case() {
  local label="$1" expected="$2" payload="$3"
  local actual
  set +e
  echo "$payload" | "$HOOK" >/dev/null 2>&1
  actual=$?
  set -e
  if [[ "$actual" == "$expected" ]]; then
    echo "  ok   $label (exit=$actual)"
    PASS=$((PASS+1))
  else
    echo "  FAIL $label (expected exit=$expected, got=$actual)"
    FAIL=$((FAIL+1))
  fi
}

echo "file-guard tests"
echo "----------------"

# --- must-block: bare dotenv and env-specific variants ---
run_case "blocks bare ${ENV_NAME}" 2 \
  "{\"tool_name\":\"Write\",\"tool_input\":{\"file_path\":\"${ENV_NAME}\",\"content\":\"x\"}}"

run_case "blocks ${ENV_NAME}.local" 2 \
  "{\"tool_name\":\"Write\",\"tool_input\":{\"file_path\":\"${ENV_NAME}.local\",\"content\":\"x\"}}"

run_case "blocks ${ENV_NAME}.production" 2 \
  "{\"tool_name\":\"Read\",\"tool_input\":{\"file_path\":\"${ENV_NAME}.production\"}}"

# --- must-allow: documented template/sample conventions ---
run_case "allows ${ENV_NAME}.example" 0 \
  "{\"tool_name\":\"Write\",\"tool_input\":{\"file_path\":\"${ENV_NAME}.example\",\"content\":\"x\"}}"

run_case "allows ${ENV_NAME}.sample" 0 \
  "{\"tool_name\":\"Write\",\"tool_input\":{\"file_path\":\"${ENV_NAME}.sample\",\"content\":\"x\"}}"

run_case "allows ${ENV_NAME}.template" 0 \
  "{\"tool_name\":\"Write\",\"tool_input\":{\"file_path\":\"${ENV_NAME}.template\",\"content\":\"x\"}}"

# --- must-allow: commit-message mention only (no file op) ---
run_case "allows git commit message mentioning ${ENV_NAME}.example" 0 \
  "{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"git commit -m 'docs: add ${ENV_NAME}.example file'\"}}"

# --- must-block: shell pipeline that exfiltrates a real dotenv file ---
run_case "blocks shell exfil of ${ENV_NAME}" 2 \
  "{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"cat ${ENV_NAME}\"}}"

# --- must-block: find-pipe-cat classic ---
run_case "blocks find | xargs cat ${ENV_NAME}" 2 \
  "{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"find / -name ${ENV_NAME} | xargs cat\"}}"

# --- must-block: unrelated sensitive patterns stay blocked ---
run_case "blocks id_rsa" 2 \
  '{"tool_name":"Read","tool_input":{"file_path":"/home/u/.ssh/id_rsa"}}'

run_case "blocks cloud creds" 2 \
  '{"tool_name":"Read","tool_input":{"file_path":"/home/u/.aws/credentials"}}'

# --- must-allow: innocuous path ---
run_case "allows regular source file" 0 \
  '{"tool_name":"Write","tool_input":{"file_path":"src/app/page.tsx","content":"x"}}'

echo "----------------"
echo "pass=$PASS fail=$FAIL"
[[ $FAIL -eq 0 ]]
