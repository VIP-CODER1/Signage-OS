---
name: code-review
description: Perform a thorough code review focused on correctness, security, maintainability, and test coverage. Use this skill whenever the user asks to review, audit, check, inspect, critique, sanity-check, give feedback on, go through, or eyeball code, a diff, a branch, a commit, or a PR — even if the exact word "review" isn't used. Also trigger on phrases like "does this look right", "anything I'm missing", "second opinion", "before I merge", or "ready to ship".
---

# Code Review

## When to invoke
The moment the user asks for feedback, a check, or a sanity-pass on changes. Do not wait for the literal word "review".

## Procedure

1. **Scope the review.** Run `git diff origin/main...HEAD` (or `git diff <base>`) to see exactly what changed. If the user named a specific file/PR/commit, scope to that instead. If scope is ambiguous, ask once.

2. **Read every changed file in full.** Not just the diff hunks — you need surrounding context to judge correctness. Note the language, framework, and conventions already in use.

3. **Check each file against these axes**, in this order:
   - **Correctness** — does it do what it claims? Off-by-one, null/undefined, empty collections, concurrency, time zones, unicode.
   - **Security** — injection (SQL, shell, HTML), auth/authz holes, secrets in code/logs, unsafe deserialization, SSRF, path traversal.
   - **Error handling** — is failure the same as success? Swallowed exceptions? Retries without backoff? Partial writes?
   - **Test coverage** — is the change tested? Are edge cases covered or just the happy path?
   - **Consistency** — does it match existing conventions (naming, layering, error types, log format)?
   - **Readability** — will a teammate understand this in 3 months? Dead code, misleading names, premature abstraction.
   - **Performance** — only flag if there's a concrete concern (N+1, unbounded loop, missing index). Don't speculate.

4. **Group findings by severity**. Use these exact labels:
   - **BLOCKER** — must fix before merge (bugs, security, data loss)
   - **MAJOR** — should fix before merge (missing tests, poor error handling, API contract issues)
   - **MINOR** — should fix soon (readability, consistency, small refactors)
   - **NIT** — optional (style, naming preferences)

5. **Every finding needs**: file and line, what's wrong, why it matters, and a concrete fix (not "consider refactoring this").

6. **End with a go/no-go recommendation**: `APPROVE`, `REQUEST CHANGES`, or `NEEDS DISCUSSION`. If BLOCKER or MAJOR items exist, you cannot approve.

## Anti-patterns to avoid
- Vague advice ("this could be cleaner") — always propose the specific change.
- Style nits masquerading as blockers.
- Skipping files because the diff "looks trivial" — trivial-looking changes hide bugs.
- Reviewing only the diff without reading the surrounding file.

## Output format

```markdown
## Review: <scope>

### BLOCKER (N)
1. `path/to/file.ts:42` — <issue>
   **Why:** <impact>
   **Fix:** <concrete change>

### MAJOR (N)
...

### MINOR (N)
...

### NIT (N)
...

### Recommendation: APPROVE | REQUEST CHANGES | NEEDS DISCUSSION
<one-sentence rationale>
```
