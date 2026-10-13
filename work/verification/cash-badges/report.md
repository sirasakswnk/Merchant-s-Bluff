# Table cash badges

13 October 2026. The approved update replaces small plain cash text beneath each name with a cream badge, thin leather edge/stitching, decorative coin, dark bold amount and small unit. Amounts are 18px on mobile and 20px on desktop. The viewer's badge has an extra gold border. All post-start scenes share the same rendering, including the sheriff viewpoint and the table behind the final popup. The existing gold offer badges retain their explicit offer labels.

The amount still reads `PublicPlayer.cash`, which the existing server projection supplies from `game.finances.cash`. No local balance calculation, state, effect or network action was introduced. A hidden “เงินคงเหลือ” prefix and visible unit identify the amount for screen readers; the decorative coin is hidden from accessibility APIs.

## Verification

- TypeScript, ESLint and isolated production build passed. CSS remained scoped to the game table. The generated development type imports were restored after isolated verification.
- The first existing E2E layout run found overlapping profiles with five players at 360px. Increasing vertical seat clearance and space before the personal controls fixed the overlap, including six-player and resolved/summary profiles. Desktop receives extra room below the seats; mobile also increases their vertical radius. Seat ordering and self/sheriff pins are unchanged.
- The corrected existing table UI regression passed: 30 layouts, 60 sheriff transitions, 40 scene/viewpoint layouts, 20 axe audits without violations, keyboard interaction, reduced motion and 200% text.
- Existing local four-player Auth/RTDB Emulator flow passed: exchange three, pack five, PASS and INSPECT, advance sheriff, reload, abort and rematch. Inventory checkpoints retained 360 total/unique cards, approved product counts and original IDs. Cleanup removed only its fixture room and four anonymous fixture users. This flow and the two existing Preview tests passed in the first run; the layout regression passed after the CSS spacing repair.
- Additional badge inspection: 36 negotiation/summary layouts (4/5/6 players × both roles × 320/390/1280px), plus nine other-scene/200%-text cases. Badges fit seats, cash digits are not clipped, profiles do not overlap, personal controls start below profiles and there is no horizontal overflow.
- Twelve locally served production layouts (4/5/6 × both roles × 390/1280px): expected amount sizes, cash text, cream/leather treatment and own gold border. Mobile and desktop screenshots were visually inspected. Preview had no page errors or API/Firebase requests. Temporary production server stopped after inspection.

Evidence: [layout.json](layout.json), [extra-scenes.json](extra-scenes.json), [production.json](production.json), [table accessibility](game-table/accessibility.json), [local game](game-table/live-4-player.json). Captures `production-390.png`, `production-1280.png` and `text-200.png` stay local; build log is under ignored `work/runtime/cash-badges/`.

No game engine, backend, data access, Rules, rulesVersion, prices or card counts changed. No physical-phone/Safari or live Firebase production test, commit, push or deploy was performed for this step.
