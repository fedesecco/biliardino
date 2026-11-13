# Testing, verification, and traceability

## Contents

- Sequence and independent test expectations
- Appropriate verification levels
- Lightweight traceability
- Coverage versus execution
- Legacy testing baseline
- Change-impact audit and evidence

## Sequence and independent test expectations

SpecLedger is **not Test-Driven Development**. The sequence for each agreed implementation increment is:

1. Accepted specification and consistency gate.
2. Implementation of that scope.
3. New or updated automated test code.
4. Executed verification and final audit.

Before implementation, inspect/run existing tests or reproduce a bug safely with existing checks or a manual/runtime probe. This does not authorize writing the new regression/feature test first. Define a verification strategy in documentation beforehand, but author new assertions only after implementing. If the implementation is already present in a legacy project, tests may be added after the affected intended behavior has been reconciled and documented; rewriting working code merely to satisfy the sequence is unnecessary.

After implementing, derive expected outcomes independently from the accepted requirements, inherited shared rules, approved exceptions, boundaries, and errors. Inspect the implementation to locate seams and interactions, **not** to decide what the output ought to be. Do not snapshot current output as expected behavior without specification support.

For a bug, identify the violated ID. If intended behavior was undefined, clarify it and document it before correcting code. Add a practical regression test after the fix; when safe and useful, demonstrate it would fail against the prior implementation without disturbing the user's working state. Do not rewrite requirements merely to excuse an existing bug.

If existing tests pass while code contradicts accepted documentation, passing tests do not settle the disagreement. Identify missing/incorrect assertions, correct the implementation to the agreement, then update the tests. A genuine change of intent must be explicitly resolved and documented first.

## Appropriate verification levels

Choose the smallest set that establishes consumer-visible behavior and important boundaries:

| Level | Useful evidence |
| --- | --- |
| Unit | Isolated rules, calculations, state transitions, boundaries, and errors. |
| Integration | Real interactions across modules, persistence, APIs, adapters, permission boundaries, or application entrypoints. Prefer this for functional requirements when it gives meaningful confidence. |
| E2E | Critical user workflows through the actual application surface, in a safe dedicated environment. |
| Architecture/operational check | Dependency inspection, build constraints, deployment/configuration validation, or a documented review when behavioral tests are not suitable. |

A testable accepted requirement normally has corresponding automated verification. One requirement may need several tests; one test may cover multiple related requirements. Do not create duplicate tests solely to manufacture a one-to-one ID mapping.

Architectural/descriptive decisions may not need behavioral tests. If meaningful automation is impractical, record the actual verification approach and limitation, not an empty test or unsupported `Verified` status. Some external integrations require realistic mocks/contracts or a dedicated environment: state what was simulated and what remains unverified.

Tests must be deterministic, isolated, safe for the full suite, and independent of production data/secrets. Do not introduce a test framework solely because an example uses it. Test behavior, error contracts, permissions, precedence, boundary values, and relevant transitions; avoid assertions on incidental implementation details, copied constants, forwarding-only mocks, or bare “did not throw” checks. Remove obsolete behavior-pinning assertions when an agreed change makes them invalid; do not simply repin accidental output.

For trivial copy/layout edits, use existing checks and a surface smoke rather than adding wording-only, source-text, or incidental-style tests. Remove such brittle assertions when encountered in the affected scope instead of repinning them. If a cosmetic request changes a real accessibility or interaction constraint, verify that constraint rather than the exact label or implementation markup.

A safe smoke run must exercise the actual changed path in addition to applicable automated checks: launch the application/CLI/library scenario, act through the relevant interface, and observe the outcome/state. For UI work inspect the actual surface. If no target runtime is available, use the closest safe executable probe and state the end-to-end/visual limitation rather than implying full validation.

## Lightweight traceability

Use stable IDs in test names or framework-supported metadata. This is illustrative syntax, not a required language/framework:

```text
"EVT-012: rejects an event whose end equals its start"
"EVT-012, GEN-003: preserves entered values after persistence fails"
```

For each implemented requirement, another developer must be able to locate:

- Its authoritative definition and governing dependencies/exception.
- The implementation path(s), symbol(s), or owning module boundary.
- The tests/checks and what they establish, including an explicit gap if none exist.
- Execution evidence when the implementation is claimed `Verified`.

Use concise `Code`, `Tests`, and `Verification` fields in the record when useful. A feature-level implementation map or module index can serve several requirements if the association is unambiguous. Keep test references discoverable through ID search; add source ID comments only at useful boundaries or non-obvious decisions, not every implementation line.

For shared behavior, trace to a canonical rule's tests plus representative consumer/integration checks; do not copy the complete shared specification into each feature or duplicate every test in every consumer. Explicit feature exceptions need verification of their different behavior. Review unannotated implementations too when a global rule changes.

For existing tests, a documentation link to a known case can establish provisional traceability without rewriting every test during adoption. Add ID names/metadata incrementally as those tests are substantively changed. A requirement-to-tests table is optional for complex/high-risk areas, not a mandatory separate database. Keep links current when moving or renaming files.

## Coverage versus execution

Treat these as independent questions:

| Question | Evidence |
| --- | --- |
| Is the requirement covered? | Assertions actually check its conditions/outcomes; an ID in a name alone proves nothing. |
| Was coverage executed? | A recorded command/run, environment/scope, and observed result. |
| Does passing evidence match current intent? | Assertions reviewed against the current accepted specification and implementation. |

A test file that exists but was not run is **coverage present, execution not established**, not “missing coverage.” A green unrelated suite is **execution present, requirement coverage not established**. One partial assertion does not verify all boundaries of a broad requirement. Avoid treating raw coverage percentages as proof of conformance.

Record verification scope, command/check, result, and date/revision in the repository's existing evidence location or a concise linked note. An environment matrix is useful only when multiple targets materially differ. Do not duplicate full logs into every requirement or commit secrets/artifacts with sensitive data.

## Legacy testing baseline

During adoption, inventory existing tests and their assertions without changing application behavior. Separate:

- Known requirements with full/partial coverage.
- Important accepted testable requirements without automation.
- Tests with no confirmed specification; these are evidence to reconcile, not automatically wrong.
- Tests contradicting accepted behavior or preserving obsolete assumptions.
- Missing integration/E2E boundaries and unavailable environments.

Run safe relevant baseline commands where available, recording actual results and failures. Reuse established user-reported failures as facts rather than rerunning merely to confirm them. Never claim a passing baseline that was not executed.

Plan incremental coverage by business/security risk, not a target count of superficial tests. Do not rewrite the whole suite, change working functionality, or delete unassociated tests solely to adopt the methodology. Resolve ambiguous intent first. Behavior changes resulting from the baseline belong to separately agreed development work; test additions follow implementation when implementation must change.

## Change-impact audit and evidence

When a specification changes, search its ID and dependent IDs across documents, tests, code, public contracts, and shared consumers. Inspect assertions even when their names do not contain IDs. Follow inherited behavior and explicit exceptions. Identify tests that must change, tests that remain valid, and newly uncovered boundaries **before claiming the change complete**.

Execute applicable new tests and existing regressions, integration/E2E checks, type/lint/build commands, documentation checks, and a safe smoke. Record newly introduced failures separately from established pre-existing failures; fix regressions caused by the change. Do not suppress a failing check or relax assertions simply to obtain a green run.

If execution is blocked, name the unavailable environment, credentials, dependency, or command and the exact unverified scope. State actual attempted commands and results; do not claim unexecuted checks passed. Missing execution need not mean missing test coverage.

At final audit, compare the code and assertions with the agreed behavior, check dependency/reference consistency, and update implementation states. `Implemented` is not `Verified`; old passing evidence becomes stale when its governing behavior changes. Use `Partially implemented` when conditions/modules are missing, not a blanket complete claim.

A concise final change report includes created/modified/superseded IDs, implemented behavior, tests added/updated, executed commands and outcomes, smoke evidence, and unresolved conflicts/coverage/execution gaps. Reference existing artifacts instead of creating a heavyweight traceability system.
