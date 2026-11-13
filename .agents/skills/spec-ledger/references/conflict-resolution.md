# Conflict resolution and clarification

Use this reference before changing a disputed obligation, accepting uncertain legacy intent, or introducing an exception to an accepted rule. A conflict is not resolved by choosing whichever source is newest, easiest to implement, or already covered by passing tests.

## Identify the disagreement precisely

Read the relevant canonical specifications and their dependencies, source, and tests. Search before creating another requirement. Distinguish:

- Missing intent versus two genuinely incompatible obligations.
- A stale or non-authoritative document versus a contradiction between accepted rules.
- An implementation defect versus a proposed change of intended behavior.
- A global rule versus a legitimate, already approved local exception.
- A product/architecture decision versus an internal implementation choice.

In adopted scope, accepted documentation governs intended behavior. If code or tests disagree, treat that as a conformance issue unless the user is explicitly proposing a change to the agreement. During legacy adoption, authority itself may need to be established: code, tests, and old documents are evidence, not automatic winners.

Never “fix” a failing implementation by rewriting requirements or weakening assertions without an actual decision to change intent. Conversely, do not impose a stale legacy document as accepted behavior without reconciliation.

## Make a compact conflict report

Use the repository's existing report convention, a clearly linked documentation section, or the current clarification response. A permanent separate conflict database is not required.

| Item | Required information |
| --- | --- |
| Identity | Exact affected requirement IDs, or source locations if no IDs exist yet. |
| Claims | The incompatible statements or behaviors, including relevant conditions. |
| Sources/evidence | Inspected path/symbol/test/document or actual user decision; distinguish observation from inference. |
| Impact | Affected modules/packages, dependent requirements, exceptions, and tests. |
| Blocking scope | What cannot safely be accepted/implemented, and what can proceed independently. |
| Options | Material resolution choices with behavior, consumer impact, and tradeoffs. |

Do not claim external material was inspected if it was inaccessible. Keep unknowns explicit. Include security, permission, privacy, or data-integrity consequences when they materially affect a choice.

## Ask one organized batch

Collect all reasonably foreseeable related questions before asking. Do not ask for facts available from repository instructions, specifications, or accessible source material. Group related conflicts and label the options clearly; ask only for decisions the user must make.

For a feature request contradicting `GEN-003`, explain the concrete contradiction and affected consumers, then offer:

1. **Preserve GEN-003:** adapt the requested feature to the existing behavior; no global contract change.
2. **Change GEN-003:** update the canonical shared rule and all affected dependent specifications, implementations, and tests. Explain the cross-feature impact before acceptance.
3. **Approve a scoped exception:** keep GEN-003 unchanged; document the exact overridden clause, difference, scope, rationale, and approval in the feature requirement.

Adapt the alternatives to the actual conflict. Do not imply an exception is automatically safe, or offer a global rule change without investigating its consumers. If the user already explicitly resolves the identified conflict and its scope, document that decision without asking for redundant confirmation.

A further clarification is justified when genuinely new information appears, not because an obvious question was postponed. If an answer does not settle an important point, explain what remains unresolved rather than guessing.

## Apply the resolution before implementation

1. Record the actual agreed behavior and rationale in the canonical specification. An explicit user decision is sufficient approval for its defined scope.
2. Update or create the correct IDs. Preserve identity for clarifications; use deprecation/supersession for substantial replacements according to [documentation-standard.md](documentation-standard.md).
3. For an exception, use the [exception template](requirement-template.md#explicit-scoped-exception): exact overridden ID/clause, specific difference, bounded scope, rationale, and approval. Do not change the global rule accidentally.
4. Reconcile affected dependencies, shared inheritance, architectural constraints, and active consumers. Preserve historical references deliberately, not by blind global replacement.
5. Check that the new documentation is internally consistent, references resolve, and no competing authoritative definition remains.
6. Only then implement the accepted change; write/update tests after implementation using [testing-and-traceability.md](testing-and-traceability.md).

An observed legacy behavior awaiting confirmation remains observed/proposed, even if fully implemented. It must not acquire `Accepted` merely because asking is inconvenient. Unknown historical rationale remains unknown.

## Preserve progress without hiding uncertainty

Block only the behavior whose intent cannot be established safely. Continue unrelated agreed work or a non-conflicting adoption increment when possible. Document unresolved questions and affected scope; do not claim a disputed feature is fully accepted, implemented to agreement, or verified.

For an adoption-only request, record implementation discrepancies and propose separate development tasks. Adoption is not authorization to change functionality, rewrite all tests, delete legacy documents, or overwrite external knowledge bases.

## Repeated exceptions and competing sources

If many features request the same exception, consider a new shared rule or an explicit change to the existing one. Inventory consumers first and obtain the needed decision; frequency alone does not authorize generalization.

When consolidating documents, preserve useful rationale and provenance. Declare one canonical authority and classify old sources as historical, pointers, or pending review. Do not silently overwrite accepted decisions or maintain two complete definitions that can drift independently.
