# Compact final ranking popup

13 October 2026. Replaced the detailed final-score panel with an automatically opening `FinalScorePopup`. Each row contains only server rank, selected character avatar, name and remaining cash (`score.cash`). Server standings/ranks are preserved, including shared ranks. Rankings are not calculated from the displayed cash. Goods, bonuses, debts and aggregate score details are omitted from the final ranking UI.

The native modal uses the existing canvas/leather material, inerts its background and locks background scrolling. The close button and Escape restore focus to “ดูอันดับอีกครั้ง”; Tab/Shift+Tab cycle through enabled popup buttons. Reopening is available without remounting. Only the host has the existing rematch action, disabled by the caller's connection/control state. Cleanup closes the modal when leaving the finished game. Ordinary prop/revision updates do not reopen a dismissed popup; reloading the finished game opens it anew. Preview frames place the popup at their top because they expand to the room's full content height.

## Verification

- TypeScript, ESLint and isolated production build passed.
- Combined E2E 5/5 passed: three popup tests plus two Preview tests. UI-only 4/4 recheck passed after the Preview positioning adjustment.
- Thirty layout cases: 4/5/6 players × merchant/sheriff × 320/390/430/740 landscape/1280px. Rank/order/cash match the model; names/avatars match public player profiles. One ranking list, no detailed score breakdown, no horizontal overflow, popup fits the viewport and scrolls vertically when needed. Buttons are at least 44px; initial focus is on close. Ten axe audits have zero violations.
- Keyboard closure, focus restoration, reopening, modal focus containment, 200% text, host rematch and disabled readonly/offline/pending/busy rematch states passed. Close remains usable in disabled states.
- Preview remains isolated from live APIs/Firebase.
- Four authenticated browser contexts completed a local Firebase Auth/RTDB Emulator game through eight rounds. All automatically opened matching ranking popups; rows matched the committed authoritative standings/ranks/cash. Escape/reload and host rematch returned everyone to the lobby and removed the dialogs. Nine inventory checkpoints preserve 360 total/unique cards, exact approved counts and original IDs. Cleanup removed only the created fixture room and four anonymous fixture users. No page errors.
- Twelve locally served production cases: player counts × viewpoints × 390/1280px. Auto-open, correct row counts, compact content, 7px leather/stitching, closure/focus restoration/reopening passed. Temporary server stopped after inspection.
- Embedded Preview check: popup begins 12px below iframe top, making the result immediately visible.
- React review: presentation-only typed props, unchanged scoring/rematch ownership, keyed finished-game lifetime, native modal plus scoped keyboard handling, effect cleanup and no new network/storage actions.

Evidence: [layout.json](layout.json), [live-4-player.json](live-4-player.json), [production.json](production.json), inspected [mobile popup](popup-390.png) and [desktop popup](popup-1280.png). Build log is under ignored `work/runtime/final-score-popup/`.

The first test run identified keyboard cycling beyond the popup; explicit edge cycling fixed it. The live test's snapshot capture was moved after the committed GAME_OVER view to avoid reading the previous round summary. Final verification above passed. This step does not change engine/backend/data access, Rules, prices/card counts or rulesVersion. No actual-phone/Safari, live Firebase production test, commit, push or deploy was performed.
