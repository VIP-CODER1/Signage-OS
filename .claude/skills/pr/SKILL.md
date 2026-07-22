---
name: pr
description: Open a pull request with a well-written title, body, test plan, and rollback notes — after running lint and tests to confirm it's shippable. Use this whenever the user asks to open a PR, create a pull request, push this for review, ship this, or says "PR this", "pull-request this", "open the PR", "ready for review".
---

# PR

Turns a ready branch into a reviewable pull request.

## When to invoke
Branch has the work done and the user is ready for review.

## Procedure

### 1. Pre-flight checks (non-negotiable)
Before writing any PR body, confirm:

- **Branch is ahead of the base** — `git log base..HEAD` shows commits
- **Branch is not behind the base** — rebase or merge first if it is
- **Lint passes** — run `$CLAUDE_SDLC_LINT_CMD` or detected equivalent
- **Tests pass** — run `$CLAUDE_SDLC_TEST_CMD` or detected equivalent
- **Build passes** (if project has a build step)
- **No uncommitted changes** — `git status` should be clean

If any fail, **stop** and tell the user what's failing. Do not open a PR with known issues unless the user explicitly says "open it anyway, I know".

### 2. Understand the full change
Read every commit since divergence: `git log base..HEAD` and `git diff base...HEAD`.

The PR describes the **cumulative change**, not the latest commit.

### 3. Draft the title
- Short: ≤ 70 characters
- Specific: names what changes, not the file
- Matches the repo's PR title style (check recent merged PRs: `gh pr list --state merged --limit 10`)

Good:
- `feat(auth): add email verification to signup`
- `fix(payments): retry Stripe on 429 with exponential backoff`
- `refactor(orders): extract fulfillment into its own module`

Bad:
- `updates`
- `Fix bug`
- `Lots of changes to make things better`

### 4. Draft the body
Standard sections, in this order:

```markdown
## Summary
<1-3 bullets: what changed and the user/business-facing result>

## Why
<1-2 sentences: the motivation. Link issue or ADR if applicable.>

## Changes
<file-level or module-level list of what's in this PR, grouped logically>

## Test plan
- [ ] <specific thing to check, with command or URL>
- [ ] <another thing>
- [ ] <etc>

## Screenshots / recordings
<Include for any UI change. Dimensions: mobile + desktop if responsive.>

## Rollback plan
<How to revert if this goes bad. Often "git revert", but sometimes requires feature-flag flip, DB migration rollback, etc.>

## Risks
<What could break? What did we consider and reject?>
```

Omit sections that don't apply (no UI changes → no screenshots section).

### 5. Create the PR
Use `gh pr create` with a HEREDOC for the body:

```bash
gh pr create --title "..." --body "$(cat <<'EOF'
## Summary
...
EOF
)"
```

Open the PR URL when done so the user sees it.

### 6. Add labels and reviewers if the repo convention calls for it
Check `.github/CODEOWNERS` or recent PRs for the pattern.

## Rules

- Never open a PR with failing tests/lint without the user explicitly overriding.
- Never force-push to a branch that already has review comments — it erases context.
- Never open a PR that's > ~400 LOC without flagging it and offering to split.
- Every test plan item must be runnable by the reviewer — "check it works" is not a test plan.
- Screenshots go in the body, not as separate comments.

## Anti-patterns

- Empty or one-word descriptions
- "Please review" as the entire body
- Stack-of-commits PRs that bundle unrelated changes
- PRs whose test plan says "tested locally" with no specifics
- PR titles that describe the commit message of the latest commit instead of the overall change
