---
name: spec
description: Three-stage feature workflow — create a detailed spec, decompose it into discrete executable tasks with the actual code context copied in (not summarized), then execute tasks one by one. Use this skill for any feature, refactor, or change that's larger than a single-file edit and would benefit from being broken into steps. Trigger on "spec this out", "break this into tasks", "create a spec for X", "decompose this feature", "let's spec then build", or when the user describes work that's too big for `/feature-implementation` to handle in one shot.
---

# Spec

Three commands, one workflow. Use them in order for big changes.

## When to invoke
Anything that can't fit cleanly in a single `/feature-implementation` session — multi-module features, cross-cutting refactors, migrations, anything estimated at > half a day. For smaller work, `/planning` + `/feature-implementation` is enough.

## The three stages

### `/spec:create <feature name>`

Produces a detailed spec in `.claude/memory-bank/<branch>/specs/<feature>.md` with:

1. **Goal** — one sentence, plus the user's underlying need (the "why").
2. **Non-goals** — what we're explicitly not doing. Most spec fights come from unclear non-goals.
3. **Surface area** — every file, module, service touched. Grep the repo; don't guess.
4. **Constraints** — performance targets, compatibility, deadlines, security/compliance requirements.
5. **Chosen approach** — plus 1-2 alternatives considered and why they lost.
6. **Risks** — what could go wrong, blast radius, rollback plan.
7. **Open questions** — anything unclear the user needs to answer before decomposition.

Stop. Confirm the spec with the user before moving on.

### `/spec:decompose <feature name>`

Reads the spec, produces a task list in `.claude/memory-bank/<branch>/tasks/<feature>.md` where **each task**:

- Has a specific deliverable ("endpoint returns 201 with Location header on success")
- Lists the files it touches
- Copies the **actual current code** of the functions it will modify, inline in the task (not a summary, not a path — the real code, for context continuity when the task is executed later)
- Lists the files it creates with a short description
- Names its acceptance criterion (the observable test)
- Notes its dependencies on other tasks
- Is independently mergeable — not a half-state

Tasks are **small**: each should take 20 min – 2 hours to execute. If you're writing tasks that sound like a day of work, split further.

Stop. Confirm the decomposition with the user.

### `/spec:execute <feature name> [task number]`

Executes one task at a time:

1. Load the task from the task file.
2. Check dependencies — earlier tasks completed?
3. Baseline: tests green, branch clean.
4. Execute the task: read the copied code, make the specific change, run tests, lint.
5. Commit with a message linking to the task (`feat(auth): implement email verification token — task 2.3`).
6. Mark the task done in the task file.
7. Stop. Don't auto-advance to the next task — give the user a checkpoint.

If `task number` is omitted, show progress and ask which to execute.

## Output locations

Everything lives under `.claude/memory-bank/<branch>/`:
- `specs/<feature>.md` — the spec
- `tasks/<feature>.md` — the task list with inline code
- `sessions/<date>.md` — work log (written by session-summary hook)

Branch-aware: switching git branches gives you a fresh memory bank. Feature branches don't cross-contaminate.

## Hard rules

- **Never summarize code when decomposing** — copy the real function bodies. The whole point is that the task carries its own context.
- **Never execute multiple tasks at once without user approval** — each task is a checkpoint.
- **Never let a spec grow past what fits on one screen** — if it's larger, it's really two features; split.
- **Never skip the decompose stage** — jumping from spec to execute hides complexity the user should see first.
- **Tasks are not reviews or documentation** — don't pad the list with "write docs" as a separate task unless docs are genuinely a distinct unit of work. Docs are part of the implementing task.

## Anti-patterns

- Specs that list implementation details in the goal section. Goal is WHY; approach is HOW.
- Tasks named "refactor X" without specifying the refactoring pattern. Use `refactoring-expert` subagent.
- Tasks with "and" in the name ("implement API and write tests") — split them.
- Auto-executing all tasks sequentially without pausing. Always checkpoint.
