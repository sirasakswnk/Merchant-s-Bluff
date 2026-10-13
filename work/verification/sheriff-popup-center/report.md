# Center the sheriff popup in the visible viewport

13 October 2026. Removed the Preview-only top margin override from the sheriff dialog. The native fixed dialog now uses its existing automatic margins to center horizontally and vertically in all contexts.

Embedded Preview uses the viewer's viewport height while the sheriff popup component is present, including temporary dismissal/reopening. This avoids centering within an iframe as tall as the whole game. Other phases retain content-height fitting. The existing modal observer updates the fit on phase/open changes; window resize refreshes it and its listener is cleaned up. Preview continues to reveal newly opened modals without reacting to ordinary offer changes.

Verification: popup/Preview E2E 4/4 passed, including the two-step flow, closure/reopen, keyboard, disabled/retry states, responsive resize, 200% text and touch landscape. TypeScript, ESLint and isolated production build passed. Twenty-four locally served production geometry cases cover 4/5/6 players, direct/embedded views and choose/detail/inspection-result/summary steps. Maximum center error was 0.211px; all dialogs fit the viewport. No page errors or Preview API/Firebase requests. Mobile 390×844 and embedded 1280×844 screenshots were visually inspected. Temporary server stopped; generated development type imports restored.

Evidence: [production.json](production.json). Captures and `work/runtime/sheriff-popup-center/build.log` remain local under existing ignore rules.

No game rules, commands, confirmation state, backend, data access, prices, card counts or rulesVersion changed. No additional live Firebase/physical-phone test, commit, push or deploy was performed.
