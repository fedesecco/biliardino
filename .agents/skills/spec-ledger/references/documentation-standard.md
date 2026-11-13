# Documentation standard

## Contents

- Canonical document map and scope
- Identifiers and prefix ownership
- Requirement records and evidence
- Lifecycle and change history
- Dependencies, inheritance, and exceptions
- AGENTS.md integration
- Runtime-independent validation checklist

## Canonical document map and scope

The standard initial structure is:

```text
docs/
  README.md
  architecture.md
  general.md
  features/
    <feature>.md
```

`docs/README.md` declares SpecLedger adoption and its boundaries. It indexes canonical specifications, explains how to locate an ID, registers prefixes, states lifecycle/reference conventions, and points to implementation/test navigation and repository verification commands. For incremental adoption, distinguish documented, partially documented, and unexamined areas plus remaining work. Do not present an inventory as proof of complete conformance.

`docs/architecture.md` owns meaningful architectural choices: languages/frameworks, package boundaries, storage, hosting/deployment, authentication architecture, security strategy, testing strategy, and significant technology tradeoffs. Use `ARCH-001`-style IDs and record real reasons. Do not invent a rationale for an inherited choice; mark it unknown when necessary.

`docs/general.md` is essential: it owns reusable cross-feature rules such as saving/deletion, validation, errors, loading, navigation, shared workflows, UI appearance, and component interaction. Use `GEN-001`-style IDs. It may point to substantial shared domain documents rather than contain their full rules. A reusable domain may instead own `docs/authentication.md`, `permissions.md`, `notifications.md`, or `database.md` with a registered prefix; those example files are not mandatory.

`docs/features/` owns feature-specific behavior. Prefer one document per feature, such as `events.md` with `EVT` or `messaging.md` with `MSG`. Split a large feature into subdirectories only when justified. A feature references canonical shared IDs and adds only its own behavior or approved exceptions; it must not copy global save procedures, button colors, dimensions, or interaction rules.

Preserve compatible existing ADR/document locations through the index instead of duplicating their decisions or forcing arbitrary moves. The initial structure is a default organization, not permission to destroy a working documentation system. Do not create meaningless empty domain files. For new initialization, architecture/general files can truthfully identify known scope and unresolved choices when no decisions exist yet. A known future feature may have a clearly labeled planning-only placeholder, never fabricated accepted requirements.

## Identifiers and prefix ownership

For new IDs, use `PREFIX-NNN`: uppercase letters/digits in the prefix, starting with a letter, followed by a hyphen and a positive number padded to at least three digits. Examples: `ARCH-001`, `GEN-003`, `AUTH-004`, `EVT-012`; after `999`, use `1000`, not a new numbering scheme. Do not create alternate spellings such as `GEN-3` for `GEN-003`.

Register each prefix once in the documentation index:

| Prefix | Owning subject / canonical document scope |
| --- | --- |
| ARCH | Repository architecture / `architecture.md` or indexed ADRs |
| GEN | Application-wide reusable behavior / `general.md` |
| EVT | Events / `features/events.md` |

These are examples, not prescribed domains. A prefix may span multiple files belonging to one declared subject; splitting/moving a document never changes an ID. Distinguish subject ownership from optional team/person ownership. Avoid ambiguous overlapping prefixes for the same responsibility. In monorepos, use one repository-wide namespace and distinguish packages when necessary; do not independently allocate the same ID in two applications.

Before allocating, search all canonical definitions and retired records, plus accessible historical allocations when needed. Choose an unused number; never fill a retired gap. Concurrent authors must reserve disjoint IDs or reconcile allocations before merging. Preserve sensible existing stable IDs on adoption, even if their historical format differs: document that legacy format and scope, and validate it accordingly instead of silently renumbering it.

Every meaningful requirement or decision receives one ID and one authoritative definition, normally a heading such as `## GEN-003 — Save procedure`. ID mentions in links, examples, code, and tests are references, not additional definitions. A substantial decision's rationale can remain inside its record; it needs no second ID merely for the explanation.

## Requirement records and evidence

Read [requirement-template.md](requirement-template.md) when authoring records. Use the fields that carry information, not every optional heading.

- **Type: Decision** records a meaningful choice about architecture, product behavior, design, or conventions.
- **Type: Requirement** records an observable behavior or enforceable constraint.
- **Status** records agreement/lifecycle, not implementation.
- **Implementation** records delivery evidence for implementable records, not approval.
- Description and rationale state what and why; references identify governing relationships.
- Code/verification locations make implemented behavior findable without annotating every line.

For legacy reconstruction, add provenance and evidence class when needed: confirmed requirement, observed behavior, inferred behavior, unknown behavior, or conflicting behavior. These are evidence labels, **not agreement statuses**. An observed behavior can be implemented but remain `Proposed`; an accepted requirement can be `Not implemented`. Avoid redundant evidence metadata on every ordinary accepted record when the source of agreement is already clear.

Testable requirements should explain their verification strategy. Descriptive/architectural decisions may use dependency inspection, a build, operational checks, or a documented review rather than behavioral tests. Omit meaningless implementation fields for non-implementable descriptive records and explain a verification limitation when material.

## Lifecycle and change history

Agreement/lifecycle states:

| Status | Meaning |
| --- | --- |
| Proposed | Not yet agreed, including unconfirmed legacy candidates. Not authorization for production behavior. |
| Accepted | Agreed intended behavior. Explicit user intent or an established authoritative agreement supplies approval. |
| Deprecated | Retired or being phased out; preserve its definition, reason, consumers, and any transition plan. |
| Superseded | Substantially replaced; preserve its definition/history and reference its replacement ID(s). |

Implementation states for implementable records:

| State | Meaning |
| --- | --- |
| Not implemented | No implementation of this obligation is established. |
| Partially implemented | State precisely which conditions/areas are implemented and which are missing. |
| Implemented | Source/current behavior supports the obligation; verification is incomplete, stale, or not executed. |
| Verified | Implementation checked against the agreed scope with identifiable, current verification evidence. |

“Verified” is not permanent certification. Record the relevant command/check, result, scope, and date or revision once, linked from the record if useful. Test presence alone is not execution evidence. On an affected specification or implementation change, reassess the state: reduce to `Implemented`, `Partially implemented`, or `Not implemented` according to actual conformance until the changed obligation is verified. Do not leave a stale green claim. Agreement status never advances automatically because a state becomes verified.

Keep the ID for clarifications that do not change meaning and for evolution of the same obligation within its established identity/scope. Record meaningful changes briefly, including what changed and why. When substantially replacing the obligation or changing its identity/scope, allocate a new ID, mark the old record `Superseded`, and link both directions using `Superseded by` / `Supersedes`. Do not create an ID for trivial wording edits.

Never reuse a deprecated/superseded ID for a new or revived obligation. Never erase or silently renumber old IDs. A compact retained record may link to accessible version history for its earlier full text, but must retain its identity, former meaning, status, retirement reason, and replacement links. Archiving is allowed if the index and incoming references still resolve. Do not reactivate a retired ID as a different requirement to avoid allocating a new one.

A short dated/revisioned change note on materially changed records, or an existing repository change log linked to the IDs, is enough. Do not require a separate approval database, a second per-ID ledger, or a changelog entry for punctuation.

## Dependencies, inheritance, and exceptions

Use stable ID mentions with resolvable file links where useful. The index must make every ID locatable; do not rely on a renderer-specific generated heading anchor alone. State relationship types when they affect meaning:

- `Depends on`: a direct precondition or related obligation.
- `Inherits`: a canonical shared rule applied without restating it.
- `Architecture`: a governing architectural decision.
- `Exceptions to`: an explicitly overridden rule, with precise differences, scope, rationale, and approval.
- `Supersedes` / `Superseded by`: lifecycle replacement, not ordinary dependency.

Before changing a rule, search incoming references throughout documentation, source, and tests; follow indirect dependents where behavior propagates. Search relevant modules too because not every implementation contains IDs. Review local exceptions, architectural dependencies, and test expectations. Update all affected contracts rather than adding a contradictory feature-local copy.

An exception changes only its declared scope, not the global rule. Consider promoting repeated exceptions into a shared rule only through an explicit decision and consumer review. Do not silently generalize them. Ordinary mutual references need not be banned, but investigate semantic circular obligations that cannot be satisfied. Supersession must not be self-referential or cyclic.

Historical references to deprecated/superseded IDs are legitimate. Active dependencies on retired rules need a deliberate transition or compatibility explanation; do not blindly rewrite every historical mention to the replacement.

## AGENTS.md integration

Adapt this concise example to the repository's actual canonical index and existing instructions:

```md
## SpecLedger

This repository follows SpecLedger (Specification Ledger Development).
Read docs/README.md for canonical specifications and adoption scope.
Accepted specifications govern intended behavior; code and tests are evidence.
Before functional changes, read the relevant requirements, shared rules, and
architectural decisions. Use the globally installed $spec-ledger skill.
Update documentation before meaningful behavior changes; implement the agreed
specification, then write/update tests for testable requirements and verify.
Reference requirement IDs in tests or metadata and preserve stable IDs.
Do not silently contradict accepted decisions: resolve conflicts or document
an explicitly approved, scoped exception first.
```

Preserve compatible existing instructions. Respect nested `AGENTS.md` scopes; expose genuine conflicts instead of overwriting them. For partial adoption, add one short scope statement and point to the index for details. Do not copy this entire skill into repository instructions.

## Runtime-independent validation checklist

Run this before implementation at the documentation gate and again at final audit. Use repository search, the editor, existing Markdown tooling, and accessible history; no new runtime is required. For a change, inspect changed definitions plus their dependency closure, while retaining a repository-wide uniqueness/reference scan. State any scope/access limitation.

1. **Map and authority:** Resolve index paths; check one canonical definition per behavior, meaningful document contents, declared partial-adoption boundaries, and legacy sources clearly distinguished from current authority. Check internal Markdown links, especially after moves.
2. **ID syntax and uniqueness:** Enumerate canonical definition headings and registered legacy formats. Check formatting and duplicate definitions repository-wide, including retired records and multiple packages. Distinguish references and illustrative examples from definitions. Flag malformed ID-like references, not just well-formed tokens.
3. **Ownership and allocation:** Check every prefix's single declared subject, no ambiguous owners, stable IDs after moves, and no accidental numeric alias. Compare changed allocations/statuses against retained retired records and accessible prior versions to catch reuse, removed IDs, or silent renumbering. A static snapshot cannot prove an ID was never used; report unavailable history rather than claiming it can.
4. **References:** Resolve every actual ID reference from documentation and affected source/tests to a defined ID, including cross-document and monorepo references. Treat intentionally literal examples or external IDs as such explicitly; do not invent specifications merely to satisfy a naive token scan.
5. **Lifecycle:** Check allowed statuses, retained deprecated/superseded identities, existing replacement targets, matching replacement direction, and no supersession self-links/cycles. Investigate an old retired ID reappearing as a new active definition. Active dependencies on retired rules require an explicit migration explanation.
6. **Consistency:** Compare shared behavior and inherited feature rules, permissions/security and architecture, exceptions, and changed requirements with their consumers. Ensure no competing copied definition or unresolved contradiction was accepted.
7. **Delivery and traceability:** Check implementation states against actual inspected code, missing cases, test/assertion locations, and recorded execution evidence. Distinguish absent coverage from tests not run. Do not require behavioral tests for a non-testable decision; require an appropriate alternative where material.
8. **Instructions and evidence:** Check `AGENTS.md` routing and preserved instructions. Report which checks actually ran, unresolved conflicts, uninspected scope, and environment limitations. Do not call a partial/manual review an exhaustive automated proof.

This skill deliberately ships no runtime-dependent repository validator: syntax scans cannot establish historical non-reuse, semantic consistency, or test adequacy by themselves. Existing repository automation may enforce parts of this checklist, but does not replace the intent/evidence audit. Add optional automation only when repeated project-specific work justifies it, without imposing a language or framework solely for SpecLedger.
