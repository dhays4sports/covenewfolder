# AW-UI-2.6 Regression Report

## Authoritative release gate

| Suite | Result |
| --- | ---: |
| AW-UI-2.6 focused accessibility/regression | 60/60 passed |
| AW-UI-2.5 Mobile Agent Console | 49/49 passed |
| AW-UI-2.4 Sticky Snapshot and Quick Actions | 42/42 passed |
| AW-UI-2.3 Guided Consultation Focus Mode | 40/40 passed |
| AW-UI-2.2 Inbox-First Agent Navigation | 37/37 passed |
| AW-UI-2.1 Simplified Workspace Architecture | 26/26 passed |
| WR-1C.3 cross-browser source/fallback | 19/19 passed |
| Static release and local references | 16/16 passed; 25 HTML files; 555 references |
| Cloudflare deployment structure | 83/83 passed |
| Frozen API baseline | 36/36 passed |
| Agent Workspace JavaScript syntax | Passed |
| Protected backend equivalence | Passed |

## Historical aggregate comparison

The repository-wide runner discovers every root-level historical `*_QA.js` and `*_QA.mjs` milestone, including old suites that pin exact obsolete version numbers.

| Run | Total | Passed | Pre-existing failures |
| --- | ---: | ---: | ---: |
| Attached 3.20.65 baseline | 168 | 97 | 71 |
| Completed 3.20.66 candidate | 169 | 98 | 71 |

- New failures: **0**
- Resolved historical failures: **0**
- Difference: the added `AW_UI_2_6_QA.mjs` suite passed.

The 71 retained failures are not treated as a current release gate because they were present before this sprint and are dominated by milestone scripts that assert obsolete exact versions. They remain packaged for historical traceability.

## Protected release boundary

The following are byte-for-byte identical to the attached certified 3.20.65 baseline:

- `functions/`
- `server/`
- `migrations/`
- `assets/js/consultation-progress.js`
- `assets/js/consultation-checklist.js`
- `assets/js/recommendation-builder.js`
- `assets/js/consultation-completion.js`

The existing 3.20.65 baseline was successfully compiled by Cloudflare Pages. A Wrangler executable was not available in the local certification container, so no fresh local Functions compilation is claimed. Byte equivalence, the 83-check deployment suite, and the 36-check frozen API suite provide the release evidence for the unchanged backend surface.

## Regression decision

**Pass.** AW-UI-2.6 introduces no new historical aggregate failure, preserves all current Workspace UI contracts, and leaves the protected backend and persistence boundary unchanged.
