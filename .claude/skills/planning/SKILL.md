---
name: planning
description: Produce a concrete implementation plan before writing any code — files to touch, order of operations, risks, rollout. Use this skill whenever the user asks to plan, design, spec, scope, break down, figure out how to approach, or strategize a feature, refactor, migration, or bugfix. Also trigger on "where do I start", "how should we tackle this", "what's the approach", "game plan for", "break this down", or when the user describes something larger than a single-file change.
---

# Planning

## When to invoke
Anything bigger than a single-file change. Migrations, refactors, new features, cross-cutting changes, incidents with unclear scope. Don't invoke for trivial edits.

## Procedure

### 1. Restate the goal
- One sentence, in the user's words, then your words. Confirm they match.
- If you can't state the goal crisply, you don't understand it yet — ask.

### 2. Find the relevant surface
- Grep/glob for every file that could be affected. Don't trust memory.
- Read the entry points (routes, CLI, handlers) to understand flow.
- Note existing abstractions you can reuse — don't re-invent.

### 3. Identify constraints
- Performance targets (latency, throughput)
- Compatibility (API versions, DB schema, client versions in the wild)
- Deadlines, freezes, dependencies on other teams
- Security/compliance requirements
- What must NOT change (public APIs, data formats, behavior clients depend on)

### 4. Enumerate approaches
- List 2-3 options, even if one is obvious. The obvious one is often wrong.
- For each: rough effort, main risk, what it forecloses.
- Pick one. State why the others lose.

### 5. Decompose into steps
- Each step is independently mergeable — it compiles, tests pass, it's not a half-state.
- Each step has: files touched, what changes, how to verify, estimated size (LOC or hours).
- Order matters: dependencies, risk up front, reversibility.

### 6. Call out risks explicitly
- What could go wrong? What's the blast radius if it does?
- What's the rollback plan for each step?
- What external signal tells you it's working in prod?

### 7. Validation plan
- How do you know it worked? Unit tests, integration tests, metrics, manual check.
- What's the acceptance criterion — the specific observation that proves done.

## Output format

```markdown
## Plan: <goal>

### Goal
<one sentence>

### Surface area
- <file or module 1>
- <file or module 2>

### Constraints
- <constraint 1>
- <constraint 2>

### Chosen approach
<approach name>. Considered <alt 1> (rejected because X), <alt 2> (rejected because Y).

### Steps
1. **<step name>** (~<size>)
   - Files: <paths>
   - Change: <what>
   - Verify: <how>
   - Rollback: <how>
2. ...

### Risks
- <risk>: <mitigation>

### Done when
- <observable criterion>
```

## Anti-patterns to avoid
- Plans that are just "I'll figure it out as I go."
- Skipping the surface-area step because "I know this code" — you don't, not this week.
- Bundling everything into one giant step to "save time" — it loses reviewability.
- Planning in the abstract without reading actual file paths and function names.
- Not stating what you're NOT doing. Scope cuts are part of the plan.

## Hand-off
Once the plan is approved by the user, implementation is `/feature-implementation` (or just do it inline for small plans). Keep the plan open as a reference — tick off steps as they land.
