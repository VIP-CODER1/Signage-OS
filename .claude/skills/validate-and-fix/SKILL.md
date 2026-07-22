---
name: validate-and-fix
description: Discover and run every quality check in the repo (lint, typecheck, test, format, security scan), categorize results by severity, and fix everything that's fixable. Use this as a pre-commit / pre-PR sweep. Trigger on "validate", "fix everything", "run all the checks", "green the build", "what's broken", "lint and fix", "pre-commit check", or before opening a PR.
---

# Validate and Fix

One-shot quality gate. Finds everything the project can check, runs it in parallel where safe, categorizes the results, and fixes what's auto-fixable.

## When to invoke
- Before committing ("green the build")
- Before opening a PR
- After a large merge (make sure nothing broke)
- When the user is unsure if the repo is healthy

## Procedure

### 1. Discover checks
Scan the repo for every quality tool configured:

| Tool | Detection |
|---|---|
| ESLint | `.eslintrc*`, `eslint.config.*`, `"eslint"` in package.json |
| Prettier | `.prettierrc*`, `"prettier"` in package.json |
| TypeScript | `tsconfig.json` |
| Ruff | `pyproject.toml` with `[tool.ruff]`, `ruff.toml` |
| mypy / pyright | `mypy.ini`, `pyproject.toml` `[tool.mypy]`, `pyrightconfig.json` |
| gofmt / golangci-lint | `go.mod`, `.golangci.yml` |
| cargo clippy / fmt | `Cargo.toml` |
| test runner | `jest.config*`, `vitest.config*`, `pytest.ini`, `go.mod`, `Cargo.toml` |
| commit-msg | `.commitlintrc*`, `commitlint.config*` |
| dependency audit | lockfile presence |

Also honor `$CLAUDE_SDLC_LINT_CMD`, `$CLAUDE_SDLC_TEST_CMD`, `$CLAUDE_SDLC_BUILD_CMD` if set.

### 2. Run in parallel
- Lint + typecheck can run in parallel (read-only on source).
- Format can run after lint (often fixes lint).
- Tests run after everything else (slowest, and depend on the code being valid).
- Security scans run in parallel with tests.

### 3. Categorize findings
- **Critical** — can't merge: tests failing, typecheck errors, build broken, security vulns HIGH+
- **High** — should fix before merge: lint errors (non-style), new deprecation warnings, coverage drop
- **Medium** — fix in this PR if quick: format drift, lint warnings, outdated deps
- **Low** — backlog: style nits, low-severity lint, medium-severity deps

### 4. Fix auto-fixable
In this order (safest → most invasive):
1. `prettier --write` / `ruff format` / `gofmt -w` / `cargo fmt`
2. `eslint --fix` / `ruff check --fix` (auto-fixable rules only)
3. Type errors that are trivially fixable (unused imports, obvious missing types)
4. Failing tests that need obvious fixes (not flakiness — if flaky, flag and stop)

### 5. Report what remains
After the auto-fix pass, show the user:
- What was fixed (file-by-file diff summary)
- What's still broken (by category)
- For each remaining issue, a one-line "fix: <concrete action>"
- Whether the repo is now safe to commit/PR

## Rules

- **Never auto-fix failing tests by changing test expectations.** If a test is wrong, that's a decision, not an auto-fix.
- **Never auto-upgrade dependencies** as part of this skill — that's `/dependency-upgrade`.
- **Never commit the fixes** — show the diff, let the user stage and commit.
- **If a tool isn't installed, say so** — don't silently skip checks that should be running.
- **Order matters for output** — show Critical first, then High, then Medium, then Low. Users skim top-down.

## Output format

```markdown
## Validate & Fix

### Tools run
- ✓ eslint (fixed 12, 3 remaining)
- ✓ prettier (fixed 8)
- ✓ tsc (2 errors)
- ✓ vitest (47 passed, 2 failed)
- ✗ npm audit (not run: lockfile out of date)

### Fixed automatically (N)
- <file>: <what changed>

### Critical (N)
1. <file>:<line> — <issue>
   Fix: <action>

### High (N)
...

### Medium (N)
...

### Recommendation
✓ Safe to commit
✗ Fix Critical first — <top issue> is blocking merge
```
