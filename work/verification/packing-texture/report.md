# Packing panel — canvas and stitched leather

13 October 2026. User approved the canvas-sack and stitched-leather proposal.

The PACK_AND_DECLARE form now has a sandy canvas weave, a 7px leather edge, decorative stitching and subtle depth. The declaration field and confirmation button sit on a lighter surface. CSS is scoped in `src/components/merchant-controls.module.css`; the existing `MerchantControls` remains shared by real rooms and Preview. Decorative pseudo-elements ignore pointer input. Mobile hand bleed includes the thicker border so the arc hand still spans the viewport.

## Verification

- TypeScript, ESLint and isolated production build passed.
- Existing UI E2E suite: 10/10 passed (`merchant-hand`, `mobile-hand`, `preview`, excluding the existing four-real-player emulator flow).
- Touch selection: 24 combinations of 4/5/6 players, prepare/pack, 360/390/430/1280px. Selection limits, keyboard, reduced motion, 200% text, readonly/busy/pending/offline and Preview isolation passed.
- Arc gesture checks: prepare/pack × 320/390/430px; observed positions follow a circle, swiping does not select, vertical scrolling and edge-card taps remain usable.
- Packing panel checked directly at 320/360/390/430/1280px: 7px edge, dashed stitching, no page overflow, visible form controls at least 44px, zero scoped axe violations. Keyboard focus remains visible and 200% text fits. Prepare has no packing texture.
- Production build served locally at 390/1280px: merged CSS preserves the leather and stitching; selection, legal-product declaration and confirmation availability passed with no page errors. Server stopped after inspection. No game/API writes were made.

Machine-readable evidence: [browser.json](browser.json), [production.json](production.json), [touch.json](touch.json), plus mobile gesture JSONs in this directory. Screenshots and build log are in ignored `work/runtime/packing-texture/`.

This is a presentation change. Commands, draft state, card IDs, selection limits and approved game configuration are unchanged. No live Firebase multiplayer test, actual-phone/Safari test, commit, push or deploy was performed in this step.
