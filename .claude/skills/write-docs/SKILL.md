---
name: write-docs
description: Author or update READMEs, ADRs (architecture decision records), inline code docs, API references, runbooks, or onboarding guides. Use this skill whenever the user asks to document, write docs, update the README, write an ADR, explain how something works in writing, draft a runbook, add docstrings/JSDoc/godoc, or says things like "needs documentation", "write this up", "capture this decision", "add docs for". Also trigger after a feature is merged if docs haven't been updated.
---

# Write Docs

## When to invoke
User asks for written explanation of anything — code, architecture, process, decision, operational procedure. Also post-merge when CLAUDE.md, README, or relevant docs are now stale.

## Pick the right artifact

| User intent | Artifact | Lives at |
|---|---|---|
| "how do I use this project" | README.md | repo root |
| "why did we choose X over Y" | ADR | `/docs/adr/NNNN-title.md` |
| "how do I operate this in prod" | Runbook | `/docs/runbooks/` |
| "what does this function do" | Inline docstring/JSDoc | in source |
| "what does this API accept" | API reference | `/docs/api/` or OpenAPI spec |
| "how do new devs get started" | Onboarding guide | `/docs/onboarding.md` |

## Procedure

### 1. Identify the audience
- **README** — someone who just cloned the repo. Assume nothing.
- **ADR** — a future engineer wondering "why on earth is it this way". Capture context, not just decision.
- **Runbook** — on-call at 3am. Steps must be copy-pasteable and idempotent.
- **Inline docs** — someone reading the code. Explain WHY, not WHAT (the code shows what).
- **API reference** — an integrator. Every field, every error, every limit.

### 2. Read what exists before writing
- Don't duplicate. If there's a half-written doc, extend it.
- Match the repo's existing tone and format.

### 3. Structure

**README** must answer, in order:
1. What is this? (1-2 sentences)
2. Who is it for? (1 sentence)
3. How do I install it? (copy-pasteable)
4. How do I run it? (copy-pasteable)
5. How do I test it? (copy-pasteable)
6. Where do I go next? (links)

**ADR** template (Michael Nygard style):
```markdown
# NNNN. Title

## Status
Proposed | Accepted | Deprecated | Superseded by NNNN

## Context
What forces are at play? What's the constraint or pressure?

## Decision
What did we decide, in one paragraph?

## Consequences
What becomes easier? What becomes harder? What's the escape hatch?
```

**Runbook** template:
```markdown
# <Alert/Scenario name>

## Symptoms
How you know this is the problem (metric, log line, user report).

## Immediate actions
Numbered steps to stabilize. Each step is one command or one click.

## Diagnosis
How to confirm the root cause once stable.

## Remediation
How to permanently fix.

## Escalation
Who to page, when to give up.
```

### 4. Write tight
- Short sentences. One idea per sentence.
- Active voice. "The service validates input" not "Input is validated by the service".
- Link, don't duplicate. If something is explained elsewhere, link to it.
- Every code block must be runnable as shown.

### 5. Verify
- Run every command you included.
- Click every link.
- Have someone unfamiliar try the install steps if the docs are user-facing.

## Anti-patterns to avoid
- Tutorials that become outdated the moment code changes (prefer examples in tests).
- "See the code" as an explanation (the whole point of docs is to not have to).
- Documenting the obvious (`// increment i by 1`).
- ADRs written after the fact with the decision rationalized (write them during the decision).
- Doc sprawl — one source of truth per topic, everything else links to it.
