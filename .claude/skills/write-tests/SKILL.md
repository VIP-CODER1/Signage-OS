---
name: write-tests
description: Author unit, integration, or end-to-end tests for existing or new code, with coverage of edge cases, error paths, and concurrency. Use this skill whenever the user asks to write tests, add tests, test a function/module/endpoint, improve coverage, TDD something, add regression tests, or says things like "cover this", "make sure this is tested", "add a test for", or "I need test cases for". Also trigger when the user has just implemented something and the next logical step is tests.
---

# Write Tests

## When to invoke
User asks for tests of any flavor, or has just written code that's untested and asks "what's next". Also after completing a `/debug` fix — a regression test is non-negotiable.

## Procedure

### 1. Identify what to test
- Read the target code in full. List behaviors, not implementation details.
- Ask: what does this promise to callers? What inputs change the output? What can go wrong?

### 2. Pick the right level
- **Unit** — pure logic, no I/O. Fast. Fine-grained.
- **Integration** — crosses module/service boundaries (DB, HTTP). Slower. Tests contracts.
- **E2E** — full stack. Slowest. Use sparingly, for critical user paths.
- Default to the lowest level that gives confidence. Don't E2E what a unit test covers.

### 3. Enumerate cases — happy path is the minimum
For each behavior, generate cases in this order:
- Happy path (1-2 cases).
- Boundary conditions — empty, zero, one, many, max size.
- Invalid inputs — null, undefined, wrong type, malformed.
- Error paths — timeouts, permission denied, downstream failure.
- Concurrency — if async: races, cancellation, retries.
- Time/locale — if time-sensitive: DST, leap seconds, non-UTC, non-ASCII.

### 4. Write the tests
- One assertion per test when practical — failures point straight at the bug.
- Names describe the behavior: `returns_empty_list_when_query_matches_nothing`, not `test1`.
- Arrange-Act-Assert structure, visually separated.
- No logic in tests (no loops, conditionals) — if you need them, the code under test is too complex.
- Use real fixtures over mocks where cheap. Mocks are for slow/external things, not for code you own.

### 5. Run and verify
- Run the full suite, not just the new tests.
- Check coverage if a tool is configured — but coverage is a floor, not a ceiling. 100% coverage of trivial code still misses real bugs.

### 6. Keep them fast
- Unit tests should run in under a second each. Integration under 10. If they're slower, something's wrong.
- Tests that need network, real DBs, or sleep() belong in a separate tier that CI can run selectively.

## Anti-patterns to avoid
- Mocking the code under test (the mock passes, the real code fails).
- Asserting on logs or internal state instead of behavior.
- Tests that pass because of order-dependent state from a previous test.
- Snapshot tests for things that change legitimately (they become rubber stamps).
- Copy-pasting a test and tweaking one value — use parameterized tests.

## Test runner
Use `$CLAUDE_SDLC_TEST_CMD` if set. Otherwise detect from the repo (package.json scripts, pyproject config, go test, etc.).
