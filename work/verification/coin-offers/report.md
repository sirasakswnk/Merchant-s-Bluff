# Coin offer controls and public table display

13 October 2026. Implemented the user-approved proposal: a large numeric amount with −/+1 and +5/+10 shortcuts, a submit button showing its amount, confirmed offers beside every merchant, a tray for the selected merchant and a pass button showing the amount received.

`OfferAmountPicker` changes only the controlled private draft. Shortcuts clamp to cash availability; manual entry keeps the existing integer/nonnegative/available-cash validation. `MerchantControls` still owns draft persistence and sends the existing `setOffer` command/version only on explicit confirmation. No-offer confirms zero. Disabled submit is also guarded at the form handler.

`OfferDisplay` receives existing public offers, distinguishes unsubmitted from submitted zero and has bounded decorative coin artwork. Changed confirmed offers animate once for 360ms; initial mount and local editing do not. Reduced motion suppresses or cancels motion; listeners and animations are cleaned up. Offer labels replace redundant submitted-status labels for unresolved merchants. Extra table spacing keeps profiles clear of the controls.

## Final verification

- TypeScript, ESLint and isolated production build passed.
- E2E 6/6 passed together: three offer tests, two Preview tests and the existing game-table UI test.
- Picker: shortcuts, ceiling at available cash, decrement, manual keyboard submit, invalid/empty/fractional/over-budget values, explicit zero, private draft and confirmed updates passed. Instrumented animation calls confirm no initial/draft motion and no motion with reduced motion enabled.
- Offer UI: 18 cases (4/5/6 players × merchant/sheriff × 320/390/1280px); all merchant badges present, no overflow. Six axe audits have zero violations, visible buttons/inputs at least 44px. Readonly/busy/pending disable editing; offline allows private drafting and blocks submission. 200% text fits.
- Game-table regression: 30 layout cases, 60 sheriff transitions, 40 scene/role/size cases, 20 axe audits. Seat pins/order, non-overlapping profiles, private-control placement, keyboard, large text and PASS privacy passed.
- Four authenticated browser contexts used local Firebase Auth/RTDB Emulators and HTTP API/realtime views through a full round. An unselected merchant edits privately and retains draft on reload. Confirmed 10 then 15 synchronizes to all four screens. Changing an offer invalidates an open sheriff confirmation. PASS transfers exactly 15; INSPECT with an eight-coin offer only applies its fine/compensation, with no bribe transfer. Explicit no-offer is visibly submitted zero and can be decided.
- Five inventory checkpoints: 360 total/unique, exact approved product counts and initial IDs retained. Cleanup removed only the fixture room and four anonymous fixture users. No page errors.
- Locally served production build: 12 cases (4/5/6 × two roles × 390/1280px). Draft changes leave the public badge untouched, submit updates the badge/tray, sheriff confirmation shows the correct amount. No Preview API/Firebase requests. Temporary production server stopped afterward.
- React review: statically imported presentation components, controlled input, unchanged command/draft ownership, proper effect dependencies and cleanup, native accessible controls. Existing E2E action-name helpers now match the amount-bearing labels; M5's disabled-submit query was updated accordingly.

Evidence: [live-4-player.json](live-4-player.json), [accessibility.json](accessibility.json), [production.json](production.json), [game-table/accessibility.json](game-table/accessibility.json). Inspected screenshots are in this directory; build log is under ignored `work/runtime/coin-offers/`.

The first UI run caught insufficient table clearance after adding offer badges. Spacing and redundant status labels were corrected; the final six-test run above passed. Engine, backend, data access, Firebase Rules, prices/card counts and rulesVersion remain unchanged. No actual-phone/Safari or live Firebase production test, commit, push or deploy was performed in this step.
