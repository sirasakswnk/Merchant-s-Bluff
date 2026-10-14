# Phase guide: table sign, sticky task bar and seat markers

14 October 2026. Players said the small phase text in the middle of the table was hard to notice, so they could not tell which phase they were in or what to do. Implemented the recommended set, the same on mobile and desktop, with only size differences:

- **Phase sign in the table center** for prepare, pack and round summary. It shows step x/5, the phase name in large type and a per-phase accent colour. It also shows "ถึงตาคุณ" or "รอคนอื่น" and progress dots for merchants done.
  - Desktop also shows the full personal task and a "ทำเลย ↓" button.
  - Phones keep the sign 128px wide so it fits between the side seats for 4/5/6 players. The full task stays available to screen readers, and the sticky bar right above shows it visually.
  - During negotiation and results, the table keeps the bag and offer, and the tag becomes a clearer ribbon ("กำลังเจรจา", "ให้ผ่าน", "เปิดตรวจ").
- **Sticky task bar** under the step track. It shows the phase, the viewer's task (or what the table waits for, with a count) and, on the viewer's move, a "ไปที่ไพ่และปุ่ม ↓" button. It stays at the top while scrolling down to cards and controls.
- **Step track** shows ✓ for finished steps, icons, and the current step filled gold.
- **Seat markers** on portraits: ✓ done, ⌛ still to act, ★ for the sheriff when the sheriff acts. The existing status text stays for screen readers.
- **Own controls label** turns into a gold "ถึงตาคุณ · <phase>" pill on the viewer's move.

`phase-guide.ts` is pure and reads only the public view: prepared, bagLocked, offer.submitted, decisionId, selectedMerchantId, result, roundIndex and totalRounds. It reveals nothing new. Engine, backend, commands and rules are unchanged. `tests/unit/phase-guide.test.ts` covers the role/phase outcomes and seat markers.

## Verification

- typecheck, lint, unit 97/97 passed.
- Preview E2E 12/12 passed. The first run caught horizontal overflow at 200% text from `nowrap` labels; fixed, then re-run.
- Checked 144 combinations (6 viewports × 6 scenes × 2 roles × 4/6 players) for WCAG A/AA violations, sign overlapping any seat, guide links under 44px, and horizontal overflow. Result: 0 for each. See [layout.json](layout.json).
- Not run: the real-player E2E and integration tests, because Firebase emulators are unavailable in this cloud session.
- Known limit: the embedded `/preview` iframe is as tall as its content, so the bar only sticks in the full-page preview or the real game.
