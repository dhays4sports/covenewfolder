# AW-UI-2.6 Accessibility and Regression Certification

## Decision

**APPROVED FOR CONTROLLED PRODUCTION DEPLOYMENT**

CoverageFit 3.20.66 completes the Agent Workspace UI 2 program. No open code blocker remains within the Workspace UI 2 release boundary.

This is a source, interaction-contract, fallback, regression, and deployment certification. It is not a claim that every browser, physical device, or assistive-technology combination has been laboratory tested.

## Accessibility review

| Area | Result | Evidence |
| --- | --- | --- |
| Landmarks and bypass | Pass | Language, responsive viewport, visible skip link, focusable main landmark, and main instructions relationship |
| Primary tabs | Pass | Tablist/tab/tabpanel relationships, one tab stop, Arrow/Home/End operation, selected-state announcements |
| Focus Mode | Pass | Described stage navigator, roving tab stop, Arrow/Home/End operation, selected/current distinction, polite stage status |
| View focus | Pass | Opening Consultation and returning to Inbox move focus to the selected tab before prior content is hidden |
| Native disclosures | Pass | Balanced `details`/`summary`, no stale “Open” name, native expanded-state semantics retained |
| Mobile actions | Pass | Named navigation landmark, labeled secondary-action region, explicit close/Escape/outside dismissal, guardrail association |
| Forms and status | Pass | Existing labels, required semantics, busy states, status/alert regions, disabled-action removal from tab order |
| Visible focus | Pass | Links, buttons, inputs, selects, text areas, summaries, and custom focus targets; inverse header and forced-colors rings |
| Contrast | Pass | Normal text tokens meet AA pairs used by the shell; warning token strengthened; increased-contrast preference included |
| Motion | Pass | JavaScript honors the existing reduced-motion preference and CSS reduces all animation, transition, and smooth scrolling |
| Zoom and reflow | Pass | Fixed document minimum removed; 256-to-320-CSS-pixel safeguards; no viewport zoom restriction |
| Forced colors | Pass | System surfaces, selected states, focus, borders, and disabled controls remain perceivable |
| Guardrails | Pass | Professional, evidence, recommendation, completion, and mobile-action guardrails remain visible and text-based |

## Browser and layout compatibility matrix

| Target | Certification result |
| --- | --- |
| 256–320 CSS px / 400% zoom reflow | Source and responsive contract passed |
| 360–430 CSS px phones | Mobile dock, stage strip, forms, safe areas, and long-content contract passed |
| 600–900 CSS px tablets | Compact snapshot, stage navigation, touch controls, and bounded action panel passed |
| 901–1180 CSS px compact desktop/tablet landscape | Non-sticky compact snapshot and full Workspace navigation passed |
| 1181–1440+ CSS px desktop | Wide sticky snapshot, Focus Mode, and full record contract passed |
| Short landscape | Dynamic-viewport and guardrail-preservation contract passed |
| Safari macOS 16.4+ | Source/fallback compatibility passed |
| Safari iOS/iPadOS 16.4+ | Source, safe-area, viewport, momentum-scroll, and fallback compatibility passed |
| Current Chromium/Edge | Source/fallback compatibility passed |
| Current Firefox and Firefox ESR | Source/fallback compatibility passed |

Safari compatibility uses native disclosures, guarded `matchMedia`, the legacy MediaQueryList listener fallback, `vh` declarations before `dvh`, safe-area environment variables, iOS momentum scrolling, and progressive-only blur/overscroll enhancements.

## Defect disposition

| Finding | Disposition |
| --- | --- |
| Focus lost when a cross-view action hid its initiating control | Fixed |
| Focus Mode stage strip lacked direct arrow-key movement | Fixed |
| Workspace Tools disclosure retained an inaccurate “Open” name after expansion | Fixed |
| Focus/forced-colors coverage did not include every native form class | Fixed |
| Fixed 320-pixel page minimum could force horizontal reflow below 320 CSS px | Fixed |
| Warning token was marginal against its soft background for small text | Fixed |
| Extra closing section made the recommendation/closeout document tree depend on browser error recovery | Fixed |

Open code blockers: **0**.

## Regression boundary

The authoritative release gate consists of AW-UI-2.1 through AW-UI-2.6 focused suites, static route/reference validation, Cloudflare deployment validation, the frozen API baseline, cross-browser source/fallback checks, JavaScript syntax, protected-backend byte comparison, secret hygiene, and fresh root-archive validation.

All authoritative checks passed: AW-UI-2.6 60/60, AW-UI-2.5 49/49, AW-UI-2.4 42/42, AW-UI-2.3 40/40, AW-UI-2.2 37/37, AW-UI-2.1 26/26, cross-browser fallback 19/19, static release 16/16, deployment 83/83, and frozen API 36/36.

The repository-wide historical runner is retained for trend comparison but includes legacy milestone tests that intentionally pin obsolete exact release numbers. Its baseline and final results are compared separately so those pre-existing version-pin failures cannot be misrepresented as new product regressions.

## Post-deploy operational evidence

Complete these checks on the live protected Workspace after deployment:

1. Physical iPhone and iPad Safari walkthrough with VoiceOver.
2. macOS Safari keyboard and 200/400-percent zoom walkthrough.
3. Windows NVDA or JAWS walkthrough of Inbox, selected consultation, forms, and closeout.
4. Production Cloudflare binding, secure inbox, print preview, and network smoke test.

These are operational verification items, not unresolved source defects.
