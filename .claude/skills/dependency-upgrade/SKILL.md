---
name: dependency-upgrade
description: Safely upgrade one or more project dependencies — read changelogs for breaking changes, apply the upgrade, run the full test suite, check for deprecation warnings, commit. Use this whenever the user asks to upgrade, bump, update, or migrate a dependency, version, package, or framework — or says "get us to latest X", "what's our dep drift", "upgrade the app to Y", "migrate from version A to B".
---

# Dependency Upgrade

One-dependency-at-a-time discipline. Never bulk upgrade — you can't tell which upgrade broke what.

## When to invoke
User wants to bump a library, framework, or runtime. Distinct from routine "latest patch" sweeps (use the package manager's lockfile commands directly for that).

## Procedure — for each dependency

### 1. Baseline
- Tests must be green.
- Note the current version: `<name>@<current>`.
- Confirm there's a clean working tree (or stash first via `/checkpoint:create pre-upgrade-<name>`).

### 2. Find the target version
- Latest stable (not alpha/beta/rc unless user explicitly wants pre-release)
- Or: the version the user requested

### 3. Read the changelog
- Every major version bump: check CHANGELOG / release notes / migration guide. Don't skip this.
- List the **breaking changes** that apply to our usage.
- If our code uses any removed/renamed APIs, list which files.
- Minor versions: scan for behavior changes; usually safe but verify deprecation warnings.

### 4. Check for security advisories
- `npm audit` / `pip-audit` / `govulncheck` — is this an upgrade that fixes a CVE? Note it for the commit.

### 5. Apply the upgrade
- Update the version in the manifest.
- Regenerate the lockfile (`pnpm install`, `pip install -r requirements.txt`, `go mod tidy`, etc.).
- Commit the manifest + lockfile together: `chore(deps): bump <name> from <old> to <new>`.

### 6. Fix breaking changes
- Apply any code changes from the migration guide.
- Run the suite. If it's red, find the root cause before continuing.
- Each batch of migration fixes: a separate commit (`fix(X): adapt to <lib> v<N> breaking change Y`).

### 7. Suite + lint + build
- Full test suite passes
- Lint clean (new rules may have landed)
- Build succeeds
- No new deprecation warnings in the test output

### 8. Smoke test
If the upgrade touches a runtime dependency (framework, ORM, HTTP client, etc.), run the app locally and exercise the paths the dependency affects. Automated tests don't catch every regression.

### 9. Record the upgrade
- Update `.claude/memory-bank/<branch>/decisions/dependency-upgrades.md` (or a per-repo equivalent) with:
  - What bumped and why
  - What broke
  - What was changed to adapt
  - Any follow-up migration work still needed

## Rules

- **One dependency per PR.** Bulk upgrades hide root causes when things break.
- **Never upgrade a major version without reading the changelog.** "It compiled" is not enough.
- **Never silence deprecation warnings.** They're the API's way of telling you the next major will break — fix them now while the context is fresh.
- **Never downgrade to bypass a test failure.** The failure is real; the downgrade is debt.
- **Pin exact versions for critical deps** (frameworks, crypto, auth) — caret ranges allow silent upgrades.

## Risk levels

- **Patch (1.2.3 → 1.2.4)** — usually safe; still run the suite.
- **Minor (1.2 → 1.3)** — scan for deprecation warnings; often safe.
- **Major (1.x → 2.0)** — treat as a refactoring project. May need multiple PRs.
- **Ecosystem shift (e.g., webpack → vite, Express → Fastify)** — scope as `/spec` work, not a dependency upgrade.

## Output

Every upgrade produces:
- A PR titled `chore(deps): bump <name> from <old> to <new>` (or `fix(deps)` if it's a CVE fix, or `feat(deps)` if it enables a new feature we want)
- A PR body with: changelog highlights, what broke in our code, what was changed, CVE mentions if applicable, smoke-test results
- Optional: an entry in the memory-bank decisions log for the record
