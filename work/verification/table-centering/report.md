# Center the game table between complete player profiles

13 October 2026. After the cash badge update, seats still anchored the portrait center while their names/cash/declarations/statuses extended downward. The table content also used phase-specific offsets. This made the table look above the center of the complete player profiles.

The game stage now uses one 50% vertical center for the table surface, its central content and seat positions. Seats translate by half of their entire profile block, rather than half of the portrait size. Normal/offer/mobile layouts retain their distinct seat radii and space before the private controls. The viewer remains at the bottom, another player's sheriff remains at the top, and seat ordering/swaps are unchanged. Narrow/enlarged-text layouts retain their existing flow layout.

## Verification

- TypeScript, ESLint and isolated production build passed.
- Fifty-four geometry inspections: pack/negotiate/summary × 4/5/6 players × merchant/sheriff × 360/390/1280px. The table center matches the midpoint of the top/bottom profile centers within 0.008px; horizontal and table-content centers match exactly. No overlapping profiles, horizontal overflow or personal-controls overlap. No page errors or Preview API/Firebase requests.
- Existing table UI E2E passed: 30 layouts, 60 sheriff transitions, 40 scene/viewpoint/size cases, 20 axe audits with zero violations, keyboard, reduced motion and 200% text.
- Twelve locally served production layouts: 4/5/6 players × both roles × 390/1280px. The same centering measurements and separation checks passed. Mobile/desktop screenshots were visually inspected. Temporary production server stopped and generated development type imports restored.

Evidence: [layout.json](layout.json), [production.json](production.json), [existing UI regression](game-table/accessibility.json). Local captures include `production-390.png` and `production-1280.png`; build log is in ignored `work/runtime/table-centering/`.

This correction changes only the game table CSS layout. It preserves the preceding cash badge work and changes no rules, balances, card counts, rulesVersion, backend or data access. No additional live Firebase/physical-phone test, commit, push or deploy was performed.
