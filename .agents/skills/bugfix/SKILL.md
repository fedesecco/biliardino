---
name: bugfix
description: "Diagnose and fix product defects end to end. USE WHEN a user reports broken behavior, an error, a regression, or asks to repair an existing feature. Also enforces changelog and semantic-version delivery rules."
---

# Bugfix Delivery

Fix defects at the source and verify the reported scenario end to end.

## Workflow

1. Reproduce or establish the failure from direct evidence such as logs, a failing request, or the affected scenario.
2. Identify the root cause before editing. Do not suppress the symptom.
3. Implement the smallest complete correction and migrate every affected caller.
4. Smoke-test the reported scenario. For database changes, verify the deployed database behavior as well as the local migration.
5. After the fix works, add a user-facing entry to `CHANGELOG.md` and update the application version.

## Versioning and changelog

Every completed implementation task must be represented in `CHANGELOG.md`. Every commit represents exactly one application version, so all uncommitted implementation work belongs to one pending release.

- If the pending release contains only bug fixes or regressions, increment the patch version from the last committed version.
- If any user-visible feature is added before the work is committed, promote the entire pending release to the next minor version from the last committed version and reset patch to zero.
- When promoting a pending patch release to minor, move all earlier uncommitted fixes into the minor release and remove the intermediate patch heading. Never keep multiple versions for work that will ship in one commit.
- After a commit, the next implementation task starts a new pending version.
- Example: with committed version `1.0.1`, two fixes initially form pending `1.0.2`; adding a feature before committing changes the single pending release to `1.1.0`, containing both fixes and the feature.
- Update every repository-owned version source, including `package.json` and its lockfile.
- Use only the section headings demonstrated by the current project changelog:
  - `### Features` for new user-visible capabilities.
  - `### Changes` for visible changes to existing behavior, placement, wording, appearance, fixes, or refinements that do not add a new capability.
  - `### Chores` for strictly internal structural or maintenance work with no user-visible effect.
- Never place a user-visible change under `### Chores`.
- Whenever practical, begin an entry with the affected product area in bold followed by a colon, for example: `- **Storico:** ora carica 25 risultati alla volta...`.
- Use the current pending release in `CHANGELOG.md` as the canonical example for heading names, language, tone, and formatting.
- Write entries in user-facing language and describe observable behavior, not implementation details.

Changelog and version updates happen only after the behavioral change has been smoke-tested successfully.