# Requirement and decision templates

Use these with [documentation-standard.md](documentation-standard.md). All worked examples are hypothetical: they illustrate form, not default product behavior to introduce into a project. Replace template markers with real agreed information; omit irrelevant optional fields and empty sections.

## Minimal implementable requirement

```md
## <PREFIX-NNN> — <Observable obligation>

Type: Requirement
Status: Proposed
Implementation: Not implemented

<Plain-language behavior, including important preconditions, outcomes,
permissions, errors, or boundaries. Understandable without reading code.>

Verification: <How the accepted obligation will be checked.>
```

Advance `Status` to `Accepted` only after intent is agreed. Set implementation state from evidence, not the plan. Existing legacy implementation may be observed without accepting it as intended behavior.

Use optional fields only when useful:

```md
Rationale: <Actual reason for the obligation; do not invent legacy rationale.>
Inherits: <Shared IDs applied unchanged.>
Depends on: <Direct behavioral dependencies.>
Architecture: <Governing ARCH IDs.>
Source / evidence: <Agreement, inspected source, observation, or inference.>
Code: <Repository path and symbol or module boundary.>
Tests: <File/case IDs or metadata query that identifies the assertions.>
Verification evidence: <Executed command/check, result, scope, date/revision.>
Change: <Material change and why; omit for trivial wording edits.>
```

Do not repeat a complete shared rule under `Inherits`. Verification strategy can precede implementation, but **new test code is written only afterward**. Planned assertions are not executed evidence.

## Decision

```md
## <ARCH-NNN or other owned prefix> — <Meaningful choice>

Type: Decision
Status: Proposed

Decision: <Choice and applicable scope.>
Rationale: <Known reasons and significant tradeoffs.>
Alternatives: <Material alternatives considered, only when useful.>
Verification: <Appropriate inspection, build, runtime check, or review.>
```

A decision chooses something; a requirement constrains observable behavior. They may refer to one another without duplicating the same obligation. Implementation state is useful for an enforceable architecture migration, but not necessary for every descriptive decision.

Hypothetical architecture example, not a prescribed application design:

```md
## ARCH-001 — Isolate external integrations

Type: Decision
Status: Accepted
Implementation: Not implemented

Application modules call external services through repository-owned adapters.
Provider-specific types do not cross the adapter boundary.

Rationale: Provider replacement must not force business modules to change.
Verification: Inspect dependency boundaries and exercise an adapter contract.
```

## Shared rule and inheriting feature

Define the reusable behavior once, in its owning document. Hypothetical `docs/general.md` example:

```md
## GEN-003 — Save procedure

Type: Requirement
Status: Accepted
Implementation: Not implemented

An explicit save validates the submitted data before persistence. Invalid data
is not persisted and the user receives actionable validation feedback.
Success is shown only after persistence is confirmed. A failed save preserves
the user's entered values and does not navigate away.

Verification: Exercise valid, invalid, and failed saves through the application
boundary, checking persistence, feedback, retained input, and navigation.
```

An inheriting hypothetical feature in `docs/features/events.md`:

```md
## EVT-012 — Save event

Type: Requirement
Status: Accepted
Implementation: Not implemented
Inherits: GEN-003 (docs/general.md)

Saving an event follows GEN-003.
Additional event-specific validation: the end instant must be later than the
start instant. Equal instants are invalid.

Verification: Check GEN-003 for event saving plus valid, reversed, and equal
start/end boundaries.
```

Refer to a canonical shared visual rule in the same way; do not restate its colors, sizing, or interaction details in every feature.

## Explicit scoped exception

Use only after an actual conflict has been resolved. Do not use an exception to hide an unresolved product decision. Hypothetical approved example:

```md
## EVT-016 — Save event during an interrupted connection

Type: Requirement
Status: Accepted
Implementation: Not implemented
Exceptions to: GEN-003
Scope: Event creation in the offline-capable client only.

Follows GEN-003, except that after local durable storage the client may leave
the editor while remote persistence is pending. It must show "Pending sync",
not "Saved", until remote persistence is confirmed.

Rationale: Event collection must continue during a connection interruption.
Approval: <Actual resolving user decision or agreed source.>
Verification: Exercise the offline transition, local durability, pending state,
and eventual success/failure without reporting unconfirmed remote success.
```

The exception changes only that scope. Do not silently apply it elsewhere or replace the global rule. If other features need the same exception, review whether a shared rule should change.

## Legacy uncertainty

Keep agreement separate from evidence:

```md
## <PREFIX-NNN> — <Candidate legacy behavior>

Type: Requirement
Status: Proposed
Implementation: <State supported by inspected evidence>
Evidence: Observed behavior; intended behavior unconfirmed.
Source: <Actual document/path/symbol/test and what was examined.>

<Precisely what appears to happen, without asserting that it is correct.>
Open question: <Material intent requiring confirmation.>
```

For inference, label `Inferred behavior` and explain the inference. For disagreement, label `Conflicting behavior`, preserve both claims, and link the conflict report. An unknown should remain a clear open question, not invented behavior. Do not allocate a requirement for every unknown unless tracking it as a meaningful proposed decision is useful.

## Deprecation and supersession

For deprecation, retain the ID and former meaning, record the reason and remaining consumers/transition if any. For substantial replacement, use a retained old record and a new ID:

```md
## <OLD-ID> — <Former title>

Type: Requirement
Status: Superseded
Superseded by: <NEW-ID>

<Former obligation or accessible historical definition with a concise meaning.>
Change: <What materially replaced it, why, and when/revision.>
```

```md
## <NEW-ID> — <Replacement obligation>

Type: Requirement
Status: Accepted
Implementation: Not implemented
Supersedes: <OLD-ID>

<Agreed replacement behavior and relevant verification strategy.>
```

Replacement targets must exist, link consistently, and not form self-links/cycles. Do not erase the old ID or give it a different meaning. Update active dependents deliberately, retaining legitimate historical references. A clarification that preserves meaning keeps the original ID and needs no supersession ceremony.
