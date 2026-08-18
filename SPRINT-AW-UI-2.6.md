# AW-UI-2.6 — Accessibility and Regression Certification

Status: Complete  
Release: 3.20.66

## Outcome

The complete Agent Workspace UI 2 program is approved for controlled production deployment. The Workspace now preserves keyboard focus across view changes, supports direct keyboard movement through Focus Mode, exposes clearer screen-reader relationships, and carries consistent focus, contrast, motion, forced-colors, and zoom-reflow safeguards from narrow phones through desktop.

## Accessibility corrections

- Added Left/Right Arrow, Home, and End operation to the Focus Mode stage strip with one roving tab stop and polite stage announcements.
- Repaired an inherited extra closing section between Recommendation Builder and consultation closeout so the document tree remains balanced.
- Moves focus to the selected Workspace tab when opening a consultation or returning to Inbox so focus never remains inside newly hidden content.
- Connected the main landmark to its operating instructions and documented keyboard behavior for both primary tabs and Focus Mode stages.
- Removed misleading “Open” disclosure naming and retained native `details`/`summary` expanded-state semantics.
- Labeled the mobile More panel as a selected-homeowner region and associated its required availability guardrail.
- Extended visible focus to every interactive HTML control class, including inverse focus treatment in the dark header.
- Raised warning-token contrast, added `prefers-contrast: more`, expanded system-color forced-colors behavior, and made disabled states explicit without color alone.
- Applied comprehensive reduced-motion suppression and removed the fixed 320-pixel document minimum to support reflow at 400-percent zoom.
- Added a dedicated 256-to-320-CSS-pixel safeguard without hiding professional, evidence, recommendation, completion, or action guardrails.

## Certification boundary

The sprint performs a source-level screen-reader semantics review and a supported-browser fallback audit. It does not claim an unperformed universal device or assistive-technology laboratory run. Physical Safari/VoiceOver, macOS keyboard/zoom, Windows screen-reader, and production-network walkthroughs are retained as post-deploy operational evidence.

## Preserved architecture

- No assessment, Protection Score, finding order, evidence, recommendation, completion, disposition, follow-up, consultation, inbox, pipeline, document, SMS, authorization, D1, or Cloudflare Functions behavior changed.
- No storage key, API route, migration, or parallel accessibility state was added.
- The existing tabs, native disclosures, live regions, progress models, labels, selected-record actions, and teardown-aware listener architecture remain authoritative.
- The archive remains directly deployable from its root to the existing GitHub-connected Cloudflare Pages project.

## Release decision

Approved for controlled production deployment with no open code blocker. See `AW_UI_2_6_ACCESSIBILITY_REGRESSION_CERTIFICATION.md` and `AW_UI_2_6_RELEASE_CERTIFICATION.json` for evidence and boundaries.
