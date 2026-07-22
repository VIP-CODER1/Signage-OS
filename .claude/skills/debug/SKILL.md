---
name: debug
description: Systematically debug a reported issue using a strict repro → minimal failing test → fix → regression loop. Use this skill whenever the user reports a bug, mentions a failing test, describes unexpected behavior, says something is broken/failing/wrong/crashing/hanging/flaky, asks "why is this happening", pastes an error message or stack trace, or says anything like "it's not working", "this used to work", "the tests pass locally but fail in CI", or "can you figure out what's going on".
---

# Debug

## When to invoke
Any signal of malfunction — error pasted, stack trace, "broken", "failing", "unexpected", "weird behavior", "only happens sometimes", "worked yesterday". Don't wait for the user to say "debug".

## The loop — follow strictly, do not skip steps

### 1. Reproduce
- Get a minimal script, command, or test that demonstrates the bug.
- If you can't reproduce, **STOP** and ask for: exact command, environment, logs, the value of key inputs. Do not guess.

### 2. Isolate
- Narrow to the smallest input/setup that still fails. Bisect files, flags, data.
- Confirm the failure is deterministic. If it's flaky, treat flakiness as the first bug to fix.

### 3. Write a failing test — before fixing
- This is non-negotiable. Without a failing test, you can't prove the fix works or that it won't regress.
- Commit the test in its own commit, with a `FAILING:` prefix or in a separate branch, so the history tells the story.
- If the bug is in code that's not test-covered at all, write the simplest possible test that exercises the broken path.

### 4. Fix
- Change the minimum code needed to make the failing test pass.
- Do not refactor surrounding code in the same change. If you see unrelated problems, file them.
- Keep the fix small and focused — this is what makes the `git blame` useful in 6 months.

### 5. Regression check
- Run the full test suite (`$CLAUDE_SDLC_TEST_CMD` if set, otherwise detect).
- If anything else broke, you have a second bug or the "fix" was wrong. Investigate before proceeding.

### 6. Root-cause summary
End every debug session with:
- **Root cause** — one sentence, precise.
- **Fix** — what you changed.
- **Why it won't recur** — the new test, or the invariant now enforced.
- **Blast radius** — what else might be affected by the same root cause (check those too).

## Anti-patterns to avoid
- "Fixing" by adding a try/catch that swallows the error.
- Changing test expectations to match buggy behavior.
- Multiple "maybe this?" edits without reproducing first.
- Declaring it fixed without running the full suite.
- Skipping the failing-test step because "it's obvious".

## When the bug is in someone else's code (a dependency)
- Reproduce against a pinned version.
- Check their issue tracker for existing reports.
- If you can work around it in your code, do so with a comment linking the upstream issue and the version that fixes it.
- Only patch the dependency locally as a last resort, and file the upstream issue.
