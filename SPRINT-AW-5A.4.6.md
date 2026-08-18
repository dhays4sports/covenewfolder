# Sprint AW-5A.4.6 — Release Stabilization

## Goal

Close AW-5A with a portable, trustworthy release baseline before Consultation Checklist UI development begins.

## Changes

- Replaced stale checklist-engine version assertions in AW-5A.2 and AW-5A.3 tests with forward-compatible semantic-version checks.
- Converted the B.2A recommendation test to resolve project files relative to the repository root.
- Normalized additional QA file paths so tests run from any extracted project location.
- Added `RUN_REGRESSION_SUITE.js` as the one-command Node regression runner.
- Added `STATIC_RELEASE_QA.js` for required-route, local-asset, HTML-reference, and release-version checks.
- Reordered the changelog so the newest release appears first.
- Normalized Agent Workspace roadmap statuses and removed the stale AW-5A.4.3C unchecked entry.
- Updated the platform version to 3.13.0.

## Run the suite

```bash
node RUN_REGRESSION_SUITE.js
```

## Regression notes

- No customer-facing runtime logic changed.
- No checklist calculations, persistence behavior, event names, planner behavior, or Workspace UI changed.
- All included JavaScript QA suites must pass from the extracted project root.
- The static release check must confirm required routes and local HTML references resolve.

## Completion criteria

- One-command regression runner passes.
- All included QA files use portable paths.
- Static release checks pass.
- Changelog and roadmap accurately describe the current release.
- Deployable ZIP remains structurally valid.
