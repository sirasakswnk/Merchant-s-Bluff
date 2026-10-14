# Final score: total and breakdown instead of coins only

14 October 2026. Players read the final ranking as "decided by coins". The engine already scores by the rules: `scoreGame` adds cash, stash goods value, the legal majority bonus and receivables, minus debts. It ranks by that total, then by legal goods count. The popup, however, showed only cash. This is a UI change, approved by the user; engine, backend and rules are unchanged.

- New unit test (`scoring.test.ts`): a merchant with 20 coins and 54 goods value plus an 8 bonus (82) beats a merchant with 80 coins and no goods.
- Final popup rows: rank, avatar, name, a large total score, and "เงินสด · สินค้า · โบนัส" (receivables/debts only when non-zero).
  - A tie note appears when equal totals were split by legal goods count.
  - A "เจ้าตลาด" section lists each legal product's leaders, their counts and the bonus each receives.
  - The scoring formula is shown at the bottom.
  - Rematch, focus handling and reopen are unchanged.
- In game: the warehouse tile now reads "คะแนนจากสินค้า"; the price board has a note that goods value counts as score at the end; the mobile stash summary wording matches.
- Preview game-over: the sample cash is 80/0/70 for seats 1–3. The 80-coin player wins with none of 4/5/6 players, and with 4 players there is a tie decided by legal goods (`preview-standings.txt`).

## Verification

- typecheck, lint, unit 98/98 passed.
- Preview E2E 12/12 passed. The updated final-score test checks totals and breakdown for 4/5/6 players × 2 roles × 5 sizes, that the top coin holder is not automatically first, the leaders section and formula, viewport fit, 44px targets and axe.
- `lobby.spec.ts:11` failed once on a strict `getByRole('alert')` match against Next's route announcer, then passed 3/3. The lobby is untouched by this change.
- The 6-player popup on a 390×844 phone is taller than the screen and scrolls inside the dialog. The close button stays at the top and rematch is at the bottom.
- Real-player E2E and integration tests were not run, because Firebase emulators are unavailable in this cloud session.
