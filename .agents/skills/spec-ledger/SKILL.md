---
name: spec-ledger
description: "Use SpecLedger (Specification Ledger Development) to initialize or adopt specification-first development, or to implement, change, fix, and audit meaningful behavior in repositories that already follow SpecLedger. Maintains stable decision and requirement IDs with documentation, implementation, and test traceability. Supports explicit new/adopt requests and natural-language requests. Do not silently migrate an unrelated repository for a small code change."
---

# SpecLedger

**Decide → Document → Validate consistency → Implement → Test → Audit.**

SpecLedger is Specification Ledger Development: a language-, framework-, and repository-independent methodology. Accepted natural-language specifications govern intended behavior; code records the current implementation; tests provide evidence of conformance. This is specification-first development, **not TDD**: write new tests after implementation, deriving expectations independently from the accepted specification.

## Select the entrypoint

Inspect repository instructions and the documentation index before choosing a route. A `docs/` directory alone does not establish adoption. Look for an explicit SpecLedger declaration and a canonical specification map in `AGENTS.md` or `docs/README.md`; recognize partial adoption and its declared boundaries.

| Request / repository state | Required route |
| --- | --- |
| Explicit initialization of a new repository or light scaffold; `$spec-ledger new` | Read and follow [workflows/new-repository.md](workflows/new-repository.md). |
| Explicit adoption, migration, legacy documentation, or documentation organization; `$spec-ledger adopt` | Read and follow [workflows/adopt-existing.md](workflows/adopt-existing.md). |
| Meaningful development or consistency review in an adopted repository | Use the shared workflow below. |

If a repository has not adopted SpecLedger, do not create a ledger, migrate documents, or alter `AGENTS.md` merely because a small change was requested. Suggest initialization/adoption when useful; otherwise respect the original task. An explicit SpecLedger request in an unadopted repository warrants offering the appropriate route, not silently expanding the task.

Natural-language invocations work too: “Initialize this project with SpecLedger,” “Document this legacy codebase using SpecLedger,” “Implement EVT-012,” or “Review consistency between requirements and implementation.”

## Read supporting resources when relevant

- Before creating/adapting canonical documentation or changing IDs/lifecycles: read [references/documentation-standard.md](references/documentation-standard.md).
- Before authoring requirements, decisions, or exceptions: read [references/requirement-template.md](references/requirement-template.md).
- When intent is ambiguous, sources disagree, or accepted rules would be overridden: read [references/conflict-resolution.md](references/conflict-resolution.md) **before proceeding with the affected behavior**.
- Before assessing coverage, writing tests, or claiming verification: read [references/testing-and-traceability.md](references/testing-and-traceability.md).

Paths above are relative to this installed skill, not the target repository. Repository-specific conventions may refine the format without weakening these invariants.

## Shared invariants

1. **Authority is not observation.** In an adopted area, accepted specifications govern intended behavior. During legacy adoption, reconcile documentation, code, tests, and owner intent before accepting specifications. Keep confirmed, observed, inferred, unknown, and conflicting behavior distinct. A long-standing implementation or passing test is not proof of intended behavior.
2. **One definition per behavior.** Put reusable rules in `docs/general.md` or an appropriate canonical shared domain document. Features reference IDs rather than copy shared rules, including visual conventions. Exceptions name the overridden ID, exact difference, scope, rationale, and approval.
3. **Stable identities.** Assign repository-unique IDs to meaningful decisions and requirements. Never reuse or silently renumber IDs, including retired IDs. Preserve IDs across file moves and clarifications. Preserve a superseded record and link its replacement when substantially replacing an obligation.
4. **Separate agreement from delivery.** `Proposed`, `Accepted`, `Deprecated`, and `Superseded` describe agreement/lifecycle. `Not implemented`, `Partially implemented`, `Implemented`, and `Verified` describe implementation evidence. Never infer acceptance from implementation or verification from test presence.
5. **Trace impact before changing shared behavior.** Find incoming and outgoing references, inherited rules, exceptions, architectural constraints, implementations, and tests. Include cross-package and cross-document consumers. Do not silently update only the first caller.
6. **Proportionate process.** Record meaningful behavior and rationale, not every edit. Do not invent product choices, impose a technology stack, add a dependency graph service, or require a particular runtime or testing framework.

## Ongoing development workflow

Use these phases for meaningful changes. For a review-only request, inspect and report findings without treating the request as authorization to change behavior. Skip inapplicable mutations, not consistency or evidence checks.

### 1. Understand

Read the request, applicable `AGENTS.md` files, documentation index, relevant accepted specifications, implementation, and tests. Identify the requested outcome, exact governing IDs, shared and architectural rules, feature boundaries, dependencies, exceptions, and uncertainties. Inspect enough of each affected area to avoid treating a local convention as a global one.

For a bug, establish the discrepancy using existing evidence, an existing test, or a safe runtime reproduction. Do not author the new regression test yet. If intended behavior is undocumented, treat it as uncertain rather than blessing the current implementation.

### 2. Clarify

Resolve missing product intent before deciding behavior. Present all reasonably foreseeable material questions in **one organized batch**, grouping related options and tradeoffs. Read repository-provided answers first. A complete user specification needs no redundant interview; trivial implementation choices do not need product approval.

An explicit user decision can approve the corresponding specification. If a request conflicts with an accepted decision without explicitly resolving that conflict, expose the exact affected IDs and obtain resolution. Do not treat a vague request as approval to override an agreement.

### 3. Analyze consistency and impact

Search existing decisions before creating new ones. Check shared rules, feature behavior, architecture, permissions/security, exceptions, dependencies, and relevant tests for contradictions or duplication. Follow inbound references transitively where the behavioral impact propagates; inspect implementations and tests that may lack ID annotations too.

Use conflict-resolution guidance for disagreements. Explain affected modules and alternatives: preserve the rule, change it for all consumers, or approve a scoped exception. Block only the unresolved affected scope; proceed with independent agreed work when safe.

### 4. Formalize the specification

Translate agreed intent into natural-language requirements understandable without source code. State important preconditions, outcomes, errors, permissions, boundaries, and examples where useful. Keep observable obligations separate from internal implementation choices. Reuse canonical IDs and inherited behavior; create an ID only for a meaningful new obligation or substantial replacement.

### 5. Update documentation and validate the gate

**Update canonical documentation before changing implementation.** Keep proposals separate from accepted behavior. Record meaningful changes and rationale lightly; preserve historical IDs and supersession links. Update affected dependents and explicit exceptions rather than duplicating the new shared rule.

Validate the proposed documentation for consistency, ID uniqueness, resolved references, lifecycle correctness, and affected consumers using the documentation-standard checklist. Implementation may begin only for agreed, internally consistent scope. If an existing accepted requirement already specifies a bug fix completely, read and cite it; no artificial specification edit is needed.

### 6. Implement

Implement the accepted specification using the repository's architecture and simplest maintainable solution. Do not introduce undocumented behavior, unrelated refactoring, or unjustified dependencies. Update all in-scope consumers of changed shared behavior.

If implementation reveals a new ambiguity or contradiction, stop the affected behavior, resolve it, update the specification, and recheck consistency **before** continuing. Do not quietly make code the source of truth.

### 7. Write tests AFTER implementation

The order is **approved specification → implementation → new/updated automated tests → verification**. Existing tests may be inspected or run earlier; they do not change this ordering. Derive expected outcomes from the accepted requirements, not captured implementation output.

Read the testing-and-traceability reference. Use unit, integration, and E2E levels appropriate to the behavior; prefer meaningful integration coverage for functional requirements. Test names or metadata reference the relevant IDs. Add regression coverage for bugs when practical. One requirement may need several tests; one meaningful test may cover related IDs.

Testable requirements normally receive automated verification. For architectural/descriptive decisions or impractical automation, record a concrete alternative and its limitation rather than inventing superficial tests. Do not access production data or secrets.

### 8. Execute verification

Run relevant new and existing regression tests, integration/E2E checks, and applicable type, lint, build, and documentation checks using repository commands. Exercise the actual changed path with a safe smoke run; tests alone do not prove the end-to-end surface.

Separate newly introduced failures from established baseline failures. Fix regressions caused by this change. If infrastructure, credentials, or an environment are unavailable, record exactly what was not run and why; never report an unexecuted check as passing.

### 9. Audit and report

Check the intended behavior against the implementation and assertions, not just green test results. Audit shared-rule reuse, dependencies, resolved ID references, scoped exceptions, traceability, and unintended changes. Update implementation states from observed evidence; changed specifications invalidate affected old verification claims until rechecked.

Report concisely: created/modified/superseded IDs; implemented scope; tests added/updated; commands and observed verification results; unresolved conflicts, coverage gaps, or execution blockers. “Verified” applies only to the documented scope and evidence, not an unexamined repository.

## Scale the process to the change

| Change | Proportionate treatment |
| --- | --- |
| New feature / behavioral change | Full workflow; explicitly resolve changes to accepted decisions and shared consumers. |
| Bug against an accepted requirement | Cite the violated ID; fix implementation, then add/update regression tests. Change the specification only if intent was missing or genuinely wrong, never to excuse a bug. |
| Bug in undocumented legacy behavior | Establish intended behavior, document it, implement, then add regression coverage. Do not migrate the entire repository as a side effect. |
| Behavior-preserving refactor | Keep existing behavior and tests; update architecture only for a meaningful architectural decision. No new behavioral ID merely for moving code. |
| Minor text, layout, or cosmetic edit | Follow shared UI and accessibility conventions; smallest local change, no artificial requirement. A changed application-wide convention belongs in the shared specification. |
| Dependency update | Check compatibility and architectural/runtime constraints; update documentation only for meaningful changed decisions or contracts. |
| Exploration / prototype | Keep experimental work isolated and explicitly unaccepted. Before production incorporation, formalize intent and follow the normal sequence. |

Use the canonical index, stable references, and focused audits to prevent specification drift, duplicate rules, stale tests, hidden conflicts, false legacy certainty, and unbounded historical clutter without adding ceremony.
