# Desktop side rails beside the game table

14 October 2026. On viewports 1180px and wider, the game page becomes three columns once a game exists (PLAYING or FINISHED, not ABORTED). The left rail holds the round heading, phase steps, and a ledger (สมุดบันทึกด่าน) of the public decision history, newest round first. The center holds the larger round table (`min(64cqw, 520px)`), your controls, the result panel, and the rules. The right rail holds a player aid (การ์ดช่วยจำ) with value/compensation/fine from the game's rules snapshot, the viewer's own warehouse (โกดังของฉัน: stash per product and goods value from the private view), and debt notes (บัญชีหนี้) from public debts. Both rails are sticky and scroll on their own. On desktop, the three collapsible panels they replace (hand/stash, public merchant info, history) are hidden. Narrower screens keep the earlier single column: the rail wrappers use `display: contents`, and the ledger and right rail are hidden.

Privacy is unchanged. The ledger reads `PublicDecision` only. PASS shows only the bag count, the offer paid and the existing public contraband boolean. INSPECT shows what the server already reveals. The warehouse reads only the viewer's own `PrivateRoomView`. Engine, backend, Rules, commands, prices, card counts and rulesVersion are not touched.

Preview generates earlier rounds (up to two before the current round; every merchant is resolved through the pure `resolveBag`). They use a separate sample ledger, so the current scene's sample money stays as before. A 1440px width option was added.

## Verification

- `npm run typecheck`, `npm run lint`, `npm test` (89 unit tests) passed.
- Preview E2E: 12/12 passed in `preview`, `final-score-popup`, `game-table`, `sheriff-popup`, `offers`, `merchant-hand` and `lobby`. They include axe checks of offers at all sizes and the scroll-region keyboard rule that first flagged the rails before `tabIndex` was added.
- The real-player E2E/integration tests that need Firebase emulators could not run in this environment, because firebase-tools sends its emulator requests through the outbound proxy and ignores `NO_PROXY`. They were not run, so they are not evidence for this change.
- Ran axe (WCAG A/AA tags) on 84 desktop combinations: 1440/1280/1180 × 7 scenes × 2 roles × 4/6 players. Result: 0 violations, all four rails visible, 0px horizontal overflow. At 1179/900/390px no rail is visible and the original four collapsible panels remain. See [layout.json](layout.json).
- Screenshots at 1440/1280/1180/1100/390 were inspected visually. Captures stay local.
