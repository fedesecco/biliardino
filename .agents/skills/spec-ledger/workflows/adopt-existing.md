# Adopt SpecLedger in an existing repository

Adoption is **non-destructive and incremental**. Its purpose is to recover and organize intended behavior without changing working functionality or erasing history. It applies to legacy systems, sparse/readme-only documentation, scattered or outdated specifications, existing ADRs/tests, libraries, and multi-application repositories.

Read [documentation-standard.md](../references/documentation-standard.md) and [requirement-template.md](../references/requirement-template.md) before authoring canonical specifications. Read [conflict-resolution.md](../references/conflict-resolution.md) when reconciling sources, and [testing-and-traceability.md](../references/testing-and-traceability.md) for the baseline. Do not load unrelated application areas merely to appear comprehensive.

## 1. Audit read-only first

Before creating or modifying documentation, inspect the repository's structure, languages/frameworks, entrypoints, package/module boundaries, manifests/build configuration, existing documentation and `AGENTS.md` scopes, tests, important architecture, and significant source behavior.

For a large repository, start with representative modules, important public entrypoints, security boundaries, and core workflows. Use targeted searches and expand as evidence requires. Record inspected versus uninspected scope; do not claim a complete audit from sampling. In a monorepo, identify applications/libraries, ownership, shared packages, and cross-package contracts before assigning prefixes.

Keep the initial audit read-only. Inspect commands before running them; do not trigger migrations, generate files in the working tree, modify databases, access production secrets, or install a new stack. Existing source and tests are evidence, not accepted specifications by default.

## 2. Ask where specifications exist

**Explicitly ask whether relevant documentation exists and where it can be found unless the user has already established this information.** Finding repository Markdown is not evidence that all documentation has been found. If none is discovered, ask whether external or undocumented specifications exist.

Combine this with all foreseeable material adoption questions in one organized batch: desired adoption scope, authoritative owners/sources, important unknowns, preservation constraints, and known behavior disputes. Read accessible sources first to avoid asking questions already answered. If contradictions emerge only after receiving new sources, a subsequent focused resolution batch is justified.

Possible locations include README/Markdown files anywhere, wikis, Notion, Confluence, Google Docs, issue trackers, technical/design documents, external repositories, and internal knowledge bases. Request a link, export, excerpt, or access path for a missing source; do not claim to review an inaccessible document. If an explicitly identified external source is unavailable, continue reachable non-conflicting inventory work and label the limitation; do not assert authoritative completeness.

## 3. Inventory discovered documentation

Produce a compact inventory, in the adoption report or a useful section linked from `docs/README.md`:

| Source/location | Subject and class | Completeness / freshness evidence | Conflicts | Code/test corroboration |
| --- | --- | --- | --- | --- |
| Actual path/URL and inspected scope | Architecture, shared rule, feature, historical, etc. | Apparent coverage; timestamp/version/contradictory details, not a guessed confidence | Exact other source or none found | Supporting symbol/test or not established |

Record access limitations and unresolved ownership. A recent timestamp does not prove accuracy; a green test does not establish intent. Preserve useful rationale and provenance. Do not discard or rewrite everything during inventory.

## 4. Reconstruct behavior with explicit evidence labels

Use accessible specifications, source, public APIs, data models, tests, configuration, and relevant history. For each significant behavior, distinguish:

| Evidence class | Meaning and treatment |
| --- | --- |
| Confirmed requirement | Explicitly agreed intent, with an identifiable agreement/source. May be accepted after conflict reconciliation. |
| Observed behavior | Supported by implementation or executed evidence, but intent is unconfirmed. Keep separate from accepted requirements. |
| Inferred behavior | Plausible interpretation requiring confirmation; explain the inference and evidence. |
| Unknown behavior | Insufficient evidence; record the material question and affected scope. |
| Conflicting behavior | Sources disagree; preserve both claims and their provenance pending resolution. |

Code inspection alone supports what the code appears to do; distinguish that from behavior actually exercised. Tests establish their assertions, not the completeness or correctness of those assertions. Existing documents may be stale, and long-lived behavior may be a bug.

Use evidence labels in the inventory or a `Proposed` specification with an evidence/source field. Do not use `Accepted` for observed/inferred behavior merely to fill the ledger, and do not treat implementation-state metadata as agreement. Record unknown architectural rationale as unknown rather than fabricating an explanation.

## 5. Detect and resolve contradictions

Compare documentation against documentation, code, and tests; shared conventions against local implementations; and architecture statements against actual dependency boundaries. Read the conflict-resolution reference and create a conflict report for significant disagreements, including exact IDs where available, statements, source locations, affected modules, migration-blocking impact, and available resolutions.

For example, “submitted votes cannot be edited” in a specification and editable submitted votes in code must not be resolved by assuming either source wins. Ask whether editing is forbidden (implementation defect), permitted (documentation obsolete), or conditional (a more specific rule is needed).

Group related conflicts into one organized clarification request. Explain what can migrate safely without resolving each conflict. Do not implement a disputed behavior change, accept a disputed requirement, or conceal a conflict with a vague description. An unresolved conflict may remain in an explicitly partial adoption.

## 6. Present the migration plan

Before significant edits, present:

- The target canonical documentation map, retaining compatible repository conventions.
- Existing documents to retain, adapt, link, or potentially archive later.
- Shared rules for `general.md` or a suitable shared domain document, versus feature-specific behavior.
- Existing stable identifiers to preserve and proposed globally unique prefix ownership.
- Uncertainties, conflicts, access gaps, and uninspected areas.
- Ordered migration increments and testing-baseline work.

Obtain approval for changing established conventions, resolving ambiguous intent, destructive changes, or risking historical context. Explicit adoption authorization can cover safe additive organization; it is not authorization to delete documents, overwrite external sources, or change application behavior.

Prefer the standard `docs/README.md`, `architecture.md`, `general.md`, and `features/` organization for new material. Where valuable existing canonical docs or ADRs have compatible locations, index them instead of forcing arbitrary moves or copying their full definitions. Explain the map so there is one authority per behavior.

## 7. Create or adapt canonical documentation

Migrate established information in approved increments. Preserve meaning, useful explanation, rationale, provenance, and sensible existing stable IDs. Keep old IDs stable across file moves. Register globally unique prefixes for genuinely new records; do not renumber legacy IDs just to match a template.

Reference canonical shared rules instead of repeating them. Create additional shared domain documents only for real cross-feature content. Prefer one feature document initially; split by actual complexity rather than one tiny file per requirement.

Use acceptance and implementation states independently. Keep unconfirmed behavior observed/proposed; identify unresolved questions and conflicting sources. Do not turn a feature's apparent implementation into automatic acceptance or mark all existing code verified. Preserve old requirements as deprecated/superseded records with valid replacement references when applicable.

The index must clearly identify adopted and not-yet-adopted areas and list remaining migration work. `general.md` remains the shared-rule entrypoint even when it links existing domain documents. If original architectural rationale is unavailable, state that limitation; do not invent historical decisions.

## 8. Preserve legacy knowledge without competing authorities

Do not delete legacy documentation by default. For overlap, propose the least disruptive option:

- Preserve the original as explicitly historical/non-authoritative with a canonical pointer.
- Replace it with a pointer while preserving historical access, when approved.
- Archive it in an agreed location, preserving identifiers and meaningful links.
- Leave it unchanged temporarily, with its authority status and pending review made explicit in the index.

A migration is incomplete if two documents still compete as authoritative definitions. Copying content into `docs/` without retiring or disambiguating authority does not solve duplication. Do not overwrite external documentation without explicit approval and an appropriate tool. Fix or preserve inbound links when moving approved documentation.

## 9. Integrate agent instructions

Create/adapt `AGENTS.md` using the [integration example](../references/documentation-standard.md#agentsmd-integration). Preserve compatible guidance and nested scopes. Point future agents to the canonical index, the global `$spec-ledger` skill, and the shared development sequence rather than embedding the entire methodology.

For partial adoption, state the documented boundary. New work in an unadopted area should first formalize the affected scope; it need not trigger an entire-repository migration. Never claim the ledger covers modules that were not examined.

## 10. Establish a testing baseline

Inspect existing automated checks and map their actual assertions to known requirements where possible. Identify:

- Fully or partially covered requirements and what the assertions establish.
- Tests with no known requirement association; retain them as evidence pending review.
- Important accepted testable requirements without automation.
- Assertions contradicting accepted intent or preserving obsolete behavior.
- Boundaries needing integration/E2E coverage or a dedicated environment.

Use the testing-and-traceability reference to distinguish coverage from execution. Run safe, relevant baseline commands when available and record actual results, environment limits, and known failures; a test's existence is not a passing execution. If none are run, say so.

Create an incremental testing plan. Do not rewrite every test, annotate every source line, add superficial metric-driven tests, or change working application code merely to adopt SpecLedger. A discrepancy requiring implementation changes becomes a separately agreed development task: documentation first, implementation second, new regression tests afterward. Existing working tests can remain unchanged if their expected behavior is still appropriate.

## 11. Migrate in usable increments

Prioritize shared architectural decisions, important shared behavior, authentication/security boundaries, core business modules, high-risk workflows, then secondary features. Adapt this order to actual repository risks and user scope.

Keep each increment usable. Validate its IDs, references, authority map, preserved knowledge, and evidence. New work follows SpecLedger while older areas remain explicitly undocumented. Do not label a migration complete because the directory structure exists.

## 12. Audit and report adoption honestly

Run the documentation-standard checklist and inspect the `AGENTS.md` integration. Reconcile accepted requirements with the evidence collected; keep conflicts and inferences visible. Documentation-only adoption must not introduce application functionality changes.

Report documents created, retained, or adapted; identified architectural decisions and feature requirements; accepted versus proposed/observed scope; unresolved conflicts; unconfirmed inferences; testing gaps and actual baseline execution; access limitations; remaining migration tasks in priority order. State whether adoption is partial and which areas remain outside it. Do not claim full adoption while significant areas are undocumented.
