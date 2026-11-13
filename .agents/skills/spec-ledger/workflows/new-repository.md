# Initialize a new repository

Use this workflow only for an explicit SpecLedger initialization request in an empty repository or a light application scaffold. This initializes a methodology; it does not implicitly authorize building an application.

Before writing specifications, read [documentation-standard.md](../references/documentation-standard.md) and [requirement-template.md](../references/requirement-template.md). Use the shared invariants in [SKILL.md](../SKILL.md).

## 1. Inspect before mutation

Inspect the actual repository root, directory structure, existing source/scaffold, manifests/build configuration, documentation, applicable `AGENTS.md` files, and repository conventions. Do not infer emptiness from a short root listing or overwrite an existing document without reading it.

Determine whether this is genuinely new, a light scaffold with decisions already made, or substantial existing work. For substantial behavior, scattered documentation, or legacy uncertainties, explain why [adopt-existing.md](adopt-existing.md) fits better and use that route when the user's request authorizes adoption. Do not force an existing application through a blank-project template.

A generated scaffold is evidence of a technology choice, not permission to invent product behavior. Preserve compatible instructions and existing stable identifiers.

## 2. Gather only missing decisions

Use information already supplied by the user and repository. Ask all necessary material questions in **one organized batch**, with sensible options and tradeoffs where helpful. Consider, only when relevant:

- Purpose, primary users, and the initial scope to document or implement.
- Known features and the most important user outcomes.
- Technologies already selected versus genuinely undecided choices.
- Hosting, operational, cost, integration, and deployment constraints.
- Security, permissions, privacy, and data-retention obligations.
- Whether application scaffolding is explicitly requested, or documentation setup only.

Do not conduct a questionnaire for facts unnecessary to the requested initialization. A documentation-only request need not settle a stack or every future feature. If the supplied specification is complete, proceed without redundant approval. Preserve unresolved choices as open questions, not accepted defaults.

If answers reveal conflicting intent, read [conflict-resolution.md](../references/conflict-resolution.md) and resolve the affected scope before accepting it. Do not repeatedly ask predictable follow-ups that could have been batched.

## 3. Establish the documentation system

Create/adapt the standard starting structure:

```text
docs/
  README.md
  architecture.md
  general.md
  features/
    <known-feature>.md
```

Create feature documents only for known features; create additional shared domain documents only when they have real content. Prefer one file per feature initially. Do not create speculative directories or an empty document per imagined subsystem.

Use the documentation standard to establish:

- A `docs/README.md` index declaring SpecLedger adoption and its scope, canonical document locations, prefix ownership, lifecycle conventions, cross-reference conventions, and how to find implementations/tests.
- `architecture.md` for agreed architectural decisions and their real rationale, not an invented stack.
- `general.md` for reusable rules, including shared UI/interaction rules when applicable. It is the essential shared-rule entrypoint, not a dumping ground for feature details.
- Feature specifications with stable IDs, references to shared behavior, important boundaries, agreement status, and implementation state where applicable.

Record only decisions actually made. If there are no accepted architectural or shared rules yet, say so and record the known scope and material open questions rather than filling files with arbitrary rules or empty headings. A known but unspecified feature may have a clearly labeled planning placeholder: it has no accepted requirements and is not implemented. Future ideas remain separate from accepted behavior.

Allocate IDs from registered prefixes after searching for existing and retired IDs. Apply the requirement templates without copying all optional fields into every record. Distinguish product decisions from observable requirements and agreement from implementation. Do not mark planned features as implemented.

Document approval by reference to the supplied user decision or the resolved clarification. No additional sign-off ceremony is needed for an already explicit, consistent instruction.

## 4. Integrate repository instructions

Create/update the appropriate root `AGENTS.md` using the concise integration example in [documentation-standard.md](../references/documentation-standard.md#agentsmd-integration). Read existing instructions first; preserve compatible repository guidance and respect nested scopes. Do not replace unrelated instructions or duplicate the whole skill.

The integration must declare SpecLedger, link `docs/README.md`, identify accepted specifications as the source of intended behavior, require relevant specifications before functional changes, require documentation updates before meaningful behavior changes, reference the globally installed `$spec-ledger` skill, require tests for testable requirements after implementation, and prohibit silent contradictions.

If existing instructions genuinely conflict with the requested methodology, expose the conflict instead of silently rewriting their meaning.

## 5. Initialize the application only if requested

For documentation-only initialization, stop application mutations here. Do not install packages, generate a framework scaffold, create business logic, or choose a stack merely to demonstrate SpecLedger.

If application scaffolding was explicitly requested, use the agreed stack and follow the shared development sequence: accepted documentation and consistency gate first, scaffold/implementation second, new tests third. Record actual architectural choices and distinguish scaffold availability from completed feature behavior. Ask for a material missing technology decision rather than selecting an entire stack without justification or approval.

Read [testing-and-traceability.md](../references/testing-and-traceability.md) before writing tests or claiming verification. Keep all new test expectations tied to accepted requirements, not scaffolder output.

## 6. Verify and report

Run the documentation-standard validation checklist against the created/adapted files. Check canonical document routing, unique IDs and prefix ownership, resolved references, lifecycle/implementation consistency, and the `AGENTS.md` integration. Check that no speculative rule became accepted and no shared specification was duplicated into a feature.

If an application was initialized, run its applicable build/test/type/lint commands and a safe smoke of the initialized surface. If setup was documentation-only, validate the documentation and integration; do not claim application verification.

Report the documents and integration created/adapted, accepted and proposed IDs, open questions, initialized application scope if any, actual verification results, and the next actionable work. Do not describe an unimplemented plan as a working application.
