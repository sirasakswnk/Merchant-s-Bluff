# Desktop wings beside the round table (user's mockup)

14 October 2026. This replaces the first-version desktop rails with the layout from the user's HTML mockup. On viewports 1180px and wider, while a game exists (PLAYING or FINISHED, not ABORTED), the round heading and phase steps span the full width. Two 260px wings flank the round table in the same row, and the player's controls span the full width below it.

- Left wing, top: price board (pinned parchment). Legal and contraband goods are grouped separately. Value/compensation/fine come from the game's rules snapshot.
- Left wing, bottom: supply and sheriff order (wood tray). Shows draw/discard pile art, supply count, round, current sheriff and next sheriff. The next sheriff is the next seat after the current sheriff, as in the engine.
- Right wing, top: my warehouse. Card-art thumbnails with ×count (optimised via `sizes="3.5rem"`), cards passed, goods value, and the closed bag, all read from the viewer's own private view.
- Right wing, bottom: checkpoint ledger and IOUs. Public debts plus `PublicDecision` history, newest first, in a keyboard-scrollable list. PASS entries do not reveal goods.

The mockup's emoji avatars and flat card row were not copied. The real CharacterAvatar and the existing MerchantHand fan are used instead. Mobile is unchanged.

## Backend

`PublicRoomView.supplyCount = deck.length + discard.length`, computed by `supplyCount()` in the engine. Separate pile sizes are deliberately not published. Exchanges are secret and draw then discard the same number, so live pile sizes would reveal how many cards each merchant exchanged; the combined total does not move. `tests/unit/supply.test.ts` covers conservation for 4/5/6 players and shows the total stays constant through mixed 0–3 card exchanges and packing. Views stored before this field omit it, so the UI hides that line.

## Verification

- typecheck, lint, unit 92/92 passed.
- Preview E2E 11/12 passed. `preview.spec.ts:46` failed intermittently with "Execution context was destroyed". It also failed 1 in 4 runs on the pre-change source (`d7625f5`), so it is not caused by this change.
- Ran axe (WCAG A/AA) on 84 desktop combinations: 1440/1280/1180 × 7 scenes × 2 roles × 4/6 players. Result: 0 violations, all four wings visible, 0px horizontal overflow. At 1179/900/390px no wing is visible and the original collapsible panels remain. See [layout.json](layout.json).
- Real-player E2E and Firebase integration tests (including the PASS privacy comparison, which now also covers `supplyCount`) were not run. They need the Firebase emulators, which cannot run in this cloud session.
