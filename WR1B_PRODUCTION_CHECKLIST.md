# WR-1B Production Checklist

## Regression
- [x] One-command regression runner completes successfully.
- [x] Checklist engine, planner, persistence, event, diagnostics, reset, and Workspace-contract suites pass.
- [x] Loading, recovery, motion, component, performance, lifecycle, responsive, and interaction suites pass.
- [x] Static route and local-asset validation passes.
- [x] Fresh-package extraction validation passes.

## Accessibility
- [x] Keyboard navigation and focus restoration are regression-covered.
- [x] Reduced-motion behavior is regression-covered.
- [x] Live-region and accessible-state hooks remain present.
- [x] High-contrast and forced-colors CSS remains present.
- [ ] Manual VoiceOver and NVDA walkthroughs remain for WR-1C.

## Performance
- [x] Stable render signatures prevent unnecessary full surface rebuilds.
- [x] Progress values use targeted DOM updates.
- [x] Performance diagnostics expose render and skipped-render counts.
- [x] Motion cleanup replaces overlapping timers.
- [x] Workspace lifecycle teardown removes owned listeners, subscriptions, and timers.
- [ ] Real-device frame-rate profiling remains for WR-1C.

## Responsive
- [x] Desktop, ultrawide, compact-laptop, tablet, foldable, landscape, phone, and narrow-phone CSS ranges are covered.
- [x] Checklist scrolling and safe-area behavior are implemented.
- [x] Responsive regression checks pass.
- [ ] Real iPhone, Android, and tablet visual verification remains for WR-1C.

## Release
- [x] VERSION, CHANGELOG, ROADMAP, QA, and sprint documentation updated.
- [x] Known limitations documented.
- [x] WR-1B production-candidate ZIP created and verified.
- [ ] Cross-browser manual matrix and final release approval remain for WR-1C.
