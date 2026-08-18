# WR-1C.3 Cross-Browser Certification

## Certification status

**Automated source and fallback compatibility baseline: PASS**

**Manual multi-browser sign-off: PENDING**

The package is certified at the source, fallback, and regression level. The installed Chromium binary was invoked, but page loading timed out during container environment initialization; therefore, this report does not claim a completed Chromium, Safari, Firefox, Edge, iOS, or Android browser run.

## Browser support matrix

| Browser | Supported baseline | Automated status | Manual status |
|---|---:|---|---|
| Google Chrome desktop | Current evergreen | Source/fallback audit passed; container execution inconclusive | Browser walkthrough pending |
| Microsoft Edge desktop | Current evergreen | Chromium-engine source compatibility passed | Edge walkthrough pending |
| Mozilla Firefox | Current and current ESR | Source/fallback audit passed | Firefox walkthrough pending |
| Safari macOS | 16.4+ | Source/fallback audit passed | Safari walkthrough pending |
| Safari iPhone/iPad | iOS/iPadOS 16.4+ | Responsive and safe-area audit passed | Real-device walkthrough pending |
| Chrome Android | Current evergreen | Responsive/source audit passed | Real-device walkthrough pending |

## Compatibility findings

### JavaScript

- No required `ResizeObserver`, `IntersectionObserver`, `structuredClone`, `requestIdleCallback`, `showModal()`, or `inert` dependency.
- `matchMedia` is guarded and supports both modern `addEventListener` and legacy Safari `addListener`.
- `requestAnimationFrame` has a timeout fallback.
- `scrollIntoView` options are protected by a no-options fallback.
- UUID generation now uses a guarded `window.crypto` lookup with a deterministic local fallback.
- Local and session storage access is wrapped where failure is expected.

### CSS

- `dvh` enhancements follow `vh` fallback declarations.
- `backdrop-filter`, `scrollbar-gutter`, and overscroll behavior are progressive enhancements rather than functional requirements.
- iOS momentum scrolling is enabled.
- Reduced-motion and forced-colors modes are supported.
- Safe-area footer spacing is included for modern iPhone layouts.

## Browser execution attempt

A local static server and the installed Chromium binary were used for an attempted headless Workspace load. Chromium did not produce a DOM before the container timeout and logged environment-level DBus/zygote initialization errors. This is recorded as **inconclusive**, not as an application failure and not as a browser certification pass. Static HTTP route verification remains covered by WR-1C.2.

## Known differences

- Browsers without `backdrop-filter` display an opaque/semitransparent surface instead of blur.
- Browsers without `scrollbar-gutter` may show a small width change when scrollbars appear.
- Browsers without `dvh` use the preceding `vh` maximum-height declaration.
- Native confirmation dialogs use the browser and operating system appearance.

## Final release gate

Before public certification, complete a manual matrix on Safari, Firefox, Edge, iPhone Safari, and Chrome Android, including keyboard navigation, checklist persistence, reset confirmation, responsive layouts, printing, and console-error review.
