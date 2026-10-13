# Final-score panel theme

13 October 2026. The final-score section now uses the existing `GamePanel`: sand canvas, 7px leather, stitching and depth. Inner score entries retain their light surface for readable numbers. Winner, ranks, totals, product counts, score breakdowns, section labels and rematch callback are unchanged.

- Captured score content before editing for 4/5/6 players and merchant/sheriff viewpoints. All six baselines match after the change.
- Browser checks: 30 combinations of player count, viewpoint and 320/360/390/430/1280px. No horizontal page overflow, expected score-entry count and material present.
- Scoped axe: 12 audits at 320/1280px, zero violations.
- Host rematch button: visible keyboard focus, target at least 44px, Enter returns the Preview to the lobby. Offline/readonly/busy/pending keep the button disabled.
- Text at 200% fits horizontally with all six score entries present.
- Existing Preview E2E: 2/2 passed. TypeScript, ESLint and isolated production build passed.
- Locally served production build: 12 combinations of 4/5/6 players, both viewpoints and 390/1280px. Merged CSS preserves the leather and stitches, all score content matches the baseline. Temporary server stopped after inspection.

Evidence: [browser.json](browser.json), [production.json](production.json). Baselines, screenshots and build log are in ignored `work/runtime/final-score-theme/`.

Presentation change only; engine/backend/data/Rules and approved game configuration remain unchanged. This step did not run live multiplayer, physical-phone or Safari tests, or commit/push/deploy.
