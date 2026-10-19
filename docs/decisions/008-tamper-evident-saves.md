# 008 — Tamper-evident saves, not tamper-proof ones

## Context

Progress lives on the player's phone ([005](005-privacy-enforced.md)). Anyone could export their save, change `"gold": 50` to `"gold": 999999` and import it, or edit the browser's storage directly. For solo play that only cheats yourself, but a future leaderboard has to know which saves can be trusted.

## Options

- **Encrypt or obfuscate the save.** The key has to ship inside the app, so anyone who reads the code can recover it. It only looks like protection.
- **Do nothing.** Cheap, but casual edits go unnoticed and nothing marks a save as untrustworthy.
- **Make edits evident.** Sign every save, rebuild what can be derived, check everything else against what could possibly have been earned, and mark a save that fails as edited.

## Decision

Make edits evident ([integrity.js](../../integrity.js)):

- **Signature.** Every save carries a checksum, so a save changed outside the app no longer matches. Saves from before signing existed are not blamed; they're signed on first load.
- **Rebuild.** Total reps come from the daily log, and the pushups/squats split from that total. Editing those fields directly does nothing.
- **Plausibility.** Gold, XP, progress through the realm, item strength, reps per day, rep pace and dates are checked against the best case for the reps recorded. The bounds are deliberately generous: a false "edited" on an honest save is worse than missing a small edit.
- **Consequence.** A flagged save still plays normally. It carries an "Edited save" badge, and importing an edited file asks first.

## Consequences

- Casual edits are caught, both in the browser's storage and in an exported file. Tests cover the honest path and each kind of edit ([tests/integrity.test.js](../../tests/integrity.test.js)).
- It is not proof against someone who reads the code: they can recompute the checksum and stay inside the bounds. No client-side scheme can stop that, and web apps have no equivalent of App Store app attestation.
- A leaderboard must therefore never trust a phone's totals. It needs the server to add up individual sets and check them (layer 2), and ideally to recount uploaded joint positions with the same `counter.js` (layer 3, opt-in).
