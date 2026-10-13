# Shared canvas and stitched-leather game panels

13 October 2026. Extended the approved packing material to prepare, negotiation/offers, waiting for friends/results/next round, sheriff controls, and public result panels.

`GamePanel` and its scoped CSS share the exact canvas, leather, stitching and shadow across these sections. `merchant-controls.module.css` now only styles the selection count and lighter action/form surface. The wrapper forwards existing section attributes, including `aria-labelledby` and `data-result-id`. Mobile hand bleed accounts for the 7px edge in both prepare and pack.

## Verified

- TypeScript, ESLint and isolated production build passed.
- Existing UI suites: 10/10 passed (`merchant-hand`, `mobile-hand`, `preview`, excluding the existing four-real-player emulator test). Includes 24 touch-selection combinations for 4/5/6 players, six native mobile arc gesture cases, keyboard, 200% text, reduced motion, disabled/offline states and Preview isolation.
- Direct panel inspection: 80 cases across eight scenes, merchant/sheriff roles and 320/360/390/430/1280px. Computed canvas/leather/stitching styles match across all panels; no horizontal page overflow. Form/button targets are at least 44px and decorative layers ignore pointer input. Prepare and pack hands span the mobile viewport.
- Scoped axe audits: 32 cases at 320/1280px, zero violations.
- Offer form: negative amount disables submit; Enter submits seven coins; no-offer action updates the same form. Offline/readonly/busy/pending disable both offer actions.
- Sheriff confirmation: open, cancel, reopen and confirm inspection; resulting public panel retains its content, section attributes and material.
- Large text: prepare/negotiate/summary/inspection at 200% fit horizontally.
- PASS result panels do not reveal contraband product names; INSPECT still shows revealed goods. No page errors or API/Firebase requests from Preview.
- Production build served locally: 24 cases across six scenes, two roles and 390/1280px. Merged CSS preserves the 7px leather and stitching; offer form submits successfully. Server stopped after inspection.
- React Best Practices review: stateless wrapper, direct imports, no added hooks/effects/network work, existing keys/drafts/handlers retained, native sections/forms/controls and forwarded accessibility attributes.

Evidence: [browser.json](browser.json), [production.json](production.json), [touch.json](touch.json) and gesture JSONs in this directory. Inspected screenshots and build log are under ignored `work/runtime/game-panel-theme/`.

This step changes presentation only. Engine, backend, data access, Firebase Rules, approved prices/card inventory and rulesVersion are unchanged. No live multiplayer test, physical-phone/Safari test, commit, push or deploy was performed in this step.
