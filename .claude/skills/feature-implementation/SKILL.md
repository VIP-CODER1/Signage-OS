---
name: feature-implementation
description: Implement a new feature end-to-end with scaffolding, tests, and docs, routing to the right references and scripts based on what the feature touches. Use this skill whenever the user asks to implement, build, add, create, scaffold, or ship a feature, endpoint, page, workflow, or integration — provided the work is bigger than a one-line change. Also trigger on "make it so X", "let's build Y", "can you add Z to the codebase", or after `/planning` hands off with an approved spec.
---

# Feature Implementation

This skill **routes**. It does not try to contain every detail. Load the reference for the area you're touching; run the script for the deterministic bits.

## When to invoke
- User asks to build/add/implement anything bigger than a trivial change.
- `/planning` just produced a spec and you're moving to execution.

## Routing

### Load references based on what you're touching

| If the feature touches... | Read before writing |
|---|---|
| Core domain logic | `references/architecture.md` |
| Tests (always) | `references/testing-strategy.md` |
| HTTP handlers / API | `references/api-conventions.md` |

### Run scripts for deterministic work

| Task | Script |
|---|---|
| Create a new component/module with boilerplate | `scripts/scaffold_component.py` |
| Validate a DB migration is reversible | `scripts/validate_migration.sh` |
| Check coverage after adding tests | `scripts/check_coverage.py` |

Scripts are bundled in `.claude/skills/feature-implementation/scripts/`. Claude executes them rather than re-deriving the logic each time.

## Procedure

1. **Confirm you have a plan.** If not, invoke `/planning` first. Don't implement without one.

2. **Load the right references.** Read the architecture and conventions docs relevant to what you're touching. Skip the ones that don't apply.

3. **Scaffold.** Run the scaffolding script for the component type you're building. This gives you the file layout, naming, and test skeleton.

4. **Implement iteratively.** One step of the plan at a time. Each step:
   - Small diff
   - Tests pass (the hook will enforce this on save)
   - Lint clean (the hook will enforce this)

5. **Tests.** For any new behavior, write tests via `/write-tests`. Regression tests for any bugfix via `/debug`.

6. **Docs.** Update CLAUDE.md, README, or relevant ADRs via `/write-docs` if the feature changes how the project is used or operated.

7. **Self-review before PR.** Dispatch the `reviewer` subagent (read-only) to do a first pass. Address its findings before asking a human.

8. **PR with structured description.** Include: what changed, why, how to verify, screenshots if UI, rollback plan.

## Anti-patterns to avoid
- Starting to implement without reading the code that's already there.
- "I'll write tests after." The post-write-test hook will flag this but the discipline matters too.
- Big-bang PRs. Multiple small PRs are almost always better than one huge one.
- Modifying adjacent code because "while I'm here". That's a separate PR.
- Skipping docs because "the code is self-explanatory" (it isn't, to anyone but you, today).
