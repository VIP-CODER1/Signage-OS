---
name: git-commit
description: Create a well-crafted git commit — read the repo's existing commit style, group staged hunks by logical change, write a commit message that matches the convention (conventional commits, imperative, specific). Use this whenever the user asks to commit, make a commit, write a commit message, or says "commit this", "git commit", "check in my changes", "commit what's staged".
---

# Git Commit

Produces a commit that matches the repo's existing style — not a generic template, not "update files".

## When to invoke
User wants to commit staged or unstaged changes and wants the message and grouping to be good.

## Procedure

### 1. Read the repo's commit style
Run `git log --oneline -20` and note:
- Conventional commits? (`feat:`, `fix:`, `chore:`, etc. with optional scopes)
- Imperative vs past tense? ("Add" vs "Added")
- Emoji? (`:sparkles:`, gitmoji)
- Scope conventions? (`feat(auth):`, `fix(api):`)
- Line length? Subject length cap?
- Body format? References to issues/PRs?

Match what you see. Don't impose a different style.

### 2. Assess what's staged
`git diff --staged --stat` — is this one logical change or several?

If several logical changes are staged together, **stop** and ask: "This looks like N distinct changes — <list>. Should I split into separate commits?" Atomic commits are better than bundled ones.

If nothing is staged but there are unstaged changes, offer to stage specific hunks — do not blanket `git add -A`.

### 3. Understand what changed
`git diff --staged` — read the full diff, not just filenames.

Articulate in one sentence: what behavior changed, or what structure changed, or what was fixed. If you can't articulate it crisply, ask.

### 4. Write the commit
Subject line (first line):
- Imperative mood ("Add", not "Added" or "Adds")
- ≤ 72 characters (ideally ≤ 50)
- Matches the convention observed in step 1
- Names the change, not the file ("Add email verification to signup", not "Update auth.ts")

Body (optional, but include when non-trivial):
- Wrap at 72 chars
- Explain the WHY (the what is in the diff)
- Reference issues/PRs if the repo's convention does

No fluff, no self-praise, no "updated code to be better". Every line earns its place.

### 5. Preview and commit
Show the message to the user. Let them edit.
Then run `git commit -m "..."` or use a HEREDOC for multi-line.

## Anti-patterns

- "Update X" — update means nothing. What specifically about X?
- Generic AI attribution at the end of every commit (unless the repo convention has it)
- Stacking multiple changes into one commit to "move faster" — commits are the unit of review, not productivity metric
- Force-pushing over published commits — never, unless user explicitly asks

## Examples of good vs bad for a repo using conventional commits

Bad:
```
Update auth
Fixed stuff
WIP
```

Good:
```
feat(auth): add email verification to signup flow

Signup now sends a verification email and requires confirmation
before the account is activated. Implements RFC-0012.

Closes #347
```

## Hard rules

- Never commit secrets (check for `.env`, keys, tokens in the diff).
- Never commit `node_modules`, `__pycache__`, build artifacts — warn if staged.
- Never use `git add -A` without showing the user what's being added first.
- Never skip pre-commit hooks with `--no-verify` unless the user explicitly asks and acknowledges the risk.
