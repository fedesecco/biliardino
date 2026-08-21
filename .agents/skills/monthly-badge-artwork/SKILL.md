---
name: monthly-badge-artwork
description: "Validate, optimize, register, and verify a new monthly badge artwork. USE WHEN a user provides a candidate image for a monthly badge or asks to add/update a monthly trophy image in the app."
---

# Monthly Badge Artwork

Use this skill whenever a new monthly badge image must be added to the Biliardino app.

## Required workflow

1. Locate the candidate file. The user may provide a file or a directory; resolve the actual image path before editing.
2. Run the repository helper from the workspace root:

   ```bash
   npm run badge:prepare -- --source "<path-to-image>" --month YYYY-MM
   ```

3. The helper validates the source and writes both optimized WebP variants:
   - `apps/web/public/trophies/YYYY-MM-1024.webp` for the hero artwork;
   - `apps/web/public/trophies/YYYY-MM-256.webp` for thumbnails.
4. The helper registers the month in `TROPHY_IMAGE_BY_MONTH` in `apps/web/src/app/core/trophy-artwork.ts`. It is idempotent: rerunning it for an already registered month does not duplicate the registry entry.
5. Verify the artwork in both consumers:
   - the monthly ranking card (`size="hero"`);
   - the player trophy board (`size="thumbnail"`).
6. Run the focused Nx checks:

   ```bash
   npx nx test web
   npx nx lint web
   npx nx build web
   ```

7. Add a user-facing entry to the current pending release in `CHANGELOG.md`. Do not create a second pending version. If the current pending release is already a feature/minor release, fold the badge entry into it.

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

Do not replace the legacy fallback artwork. Unknown months must continue to use the existing SVG fallback, while registered months use the generated assets. When the current month has no registered exclusive artwork, the monthly card must say `Non c'è ancora un premio per questo mese` instead of `Badge esclusivo <mese>`.

## Delivery checklist

- [ ] Candidate passes validation.
- [ ] Hero and thumbnail WebP files exist under `apps/web/public/trophies`.
- [ ] Registry contains exactly one entry for the month.
- [ ] Monthly card and player trophy board render the new artwork.
- [ ] `npx nx test web`, `npx nx lint web`, and `npx nx build web` pass.
- [ ] Current pending changelog entry describes the new badge.
