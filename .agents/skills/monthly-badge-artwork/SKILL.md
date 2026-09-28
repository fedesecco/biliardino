---
name: monthly-badge-artwork
description: "Validate, optimize, register, and verify a new monthly badge artwork. USE WHEN a user provides a candidate image for a monthly badge or asks to add/update a monthly trophy image in the app."
---

# Monthly Badge Artwork

Use this skill whenever a new monthly badge image must be added to the Biliardino app.

## Required workflow

Use the fast path for a normal artwork-only addition: the candidate, generated WebP files, and one registry entry change. Do not start a dev server or browser for this path; the existing component tests and production build are the deterministic consumer checks. Use browser verification only when `TrophyArtwork`, a consumer template/style, or image layout code also changes.

1. Locate the candidate file directly. If the user gives a Downloads filename or directory, resolve that path once; do not scan the whole repository.
2. Run the repository helper from the workspace root:

   ```bash
   npm run badge:prepare -- --source "<path-to-image>" --month YYYY-MM
   ```

3. The helper validates the source, writes both optimized WebP variants, and registers the month:
   - `apps/web/public/trophies/YYYY-MM-1024.webp` for the hero artwork;
   - `apps/web/public/trophies/YYYY-MM-256.webp` for thumbnails;
   - `TROPHY_IMAGE_BY_MONTH` in `apps/web/src/app/core/trophy-artwork.ts`.

   It is idempotent: rerunning it for an already registered month does not duplicate the registry entry.
4. Before running checks, inspect existing specs for fixtures that intentionally use the new month as an unregistered month. Move those fixtures to the next unregistered month; otherwise the expected fallback test will fail after a valid registration.
5. Update the current pending release in `CHANGELOG.md`. Do not create a second pending version. If the current pending release is already a feature/minor release, fold the badge entry into it.
6. Verify the generated files exist and the registry contains exactly one entry for `YYYY-MM-01`. Then run the focused Nx checks once, after all edits:

   ```bash
   npx nx test web && npx nx lint web && npx nx build web
   ```

7. Confirm consumer coverage through the existing monthly-card and trophy-board specs. If either `size="hero"` or `size="thumbnail"` is not covered, add a small deterministic assertion rather than launching the dev server for every monthly asset.

## Source requirements

The helper rejects an image unless it is:

- PNG or WebP;
- square;
- at least 1024×1024 pixels;
- RGBA with actual transparent pixels;
- transparent in all four corners;
- no larger than 4096×4096 pixels.

Keep the original candidate outside the application asset tree. Commit only the generated WebP assets and the registry/source changes.

## Naming and accessibility

Use the calendar month key `YYYY-MM`; the registry key is `YYYY-MM-01`. Keep the existing `TrophyArtwork` component and its Italian month label; do not hardcode a second label in a page template.

Do not replace the legacy fallback artwork. Unknown months must continue to use the existing SVG fallback, while registered months use the generated assets. When the current month has no registered exclusive artwork, the monthly card must say `Non c'è ancora un premio per questo mese` instead of `Premio esclusivo <mese>`.

## Delivery checklist

- [ ] Candidate passes validation.
- [ ] Hero and thumbnail WebP files exist under `apps/web/public/trophies`.
- [ ] Registry contains exactly one entry for the month.
- [ ] Monthly-card and trophy-board specs cover the registered hero and thumbnail paths.
- [ ] `npx nx test web && npx nx lint web && npx nx build web` pass after all edits.
- [ ] Current pending changelog entry describes the new monthly prize.
