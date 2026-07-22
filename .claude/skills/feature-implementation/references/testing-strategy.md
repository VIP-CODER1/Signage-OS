# Testing strategy reference

Loaded by `feature-implementation` whenever tests are in scope (almost always).

## The test pyramid, honestly
- **Unit** — most of your tests. Fast. Pure. No I/O. Target: ms per test.
- **Integration** — fewer. Cross module/service boundaries. Hit a real (ephemeral) DB. Target: seconds per test.
- **E2E** — very few. Critical user journeys only. Target: tens of seconds.

If you have 10 E2E tests and 50 unit tests, your pyramid is upside down — fix it.

## What to test
- Every new public function/method/endpoint — at least happy path + one edge case.
- Every bugfix — a regression test that fails without the fix.
- Every invariant — document it as a test ("users can never see other tenants' data").

## What NOT to test
- Third-party libraries (they have their own tests).
- Pure framework glue (routes that just call a handler — test the handler).
- Private implementation details (tests that fail when you refactor without behavior change).
- Getters/setters with no logic.

## Test naming
`<subject>_<condition>_<expected>`

Good:
- `parsePrice_whenInputIsNegative_throwsInvalidPriceError`
- `createUser_whenEmailExists_returnsConflict`
- `retryQueue_afterThreeFailures_movesToDeadLetter`

Bad:
- `test1`
- `testParsePrice`
- `shouldWork`

## Fixtures vs mocks
- **Prefer real fixtures** for code you own. Cheap, accurate.
- **Mock** external services (APIs, third-party SDKs) — they're slow and flaky.
- **Never mock the subject** — if you need to, the subject is doing too much.

## Coverage
Coverage is a signal, not a goal. 100% coverage of trivial code doesn't mean your logic is tested. Ship what you believe covers the behavior; use coverage reports to find gaps.
