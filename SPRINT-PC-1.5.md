# PC-1.5 — Live Producer Pilot Readiness

## Objective

Make the existing consultation system operationally ready for a controlled live producer pilot without creating another workflow, storing a synthetic pilot result, or claiming that deployed-device validation has already occurred.

## Implemented capability

The Agent Workspace now includes one Live pilot preflight between Current Focus and the Consultation Command Center. Its central, immutable readiness model derives five checks from the existing production path:

1. a saved homeowner consultation and completed assessment are selected;
2. the existing conversation plan and recoverable checklist are prepared;
3. the server-backed consultation is connected and the PC-1.3 checkpoint is securely saved;
4. the existing consultation-specific document route is available; and
5. the producer confirms every page in Print Preview on the current device.

The preflight shows the first incomplete gate, provides one useful setup action, and changes to Ready for pilot only when all five checks pass. The Print Preview confirmation is held only in memory for the selected consultation and current open Workspace session. Refreshing the page requires another device check.

## Operational boundary

PC-1.5 supplies the preflight and runbook needed to conduct a truthful deployed pilot. It does not fabricate a browser, macOS, Safari, physical-printer, or live-conversation result in the build environment. Actual Dylan-led pilot evidence, defect disposition, and the production release decision belong to PC-1.6.

## Preserved architecture

- Consultation Progress remains the only six-stage workflow model.
- Consultation Checklist remains the only working-progress and recovery engine.
- The secure producer inbox and PC-1.3 checkpoint remain the only cross-device synchronization path.
- The existing Consultation Document route and PC-1.4 readiness profile remain unchanged.
- Assessment, Protection Score, Recommendation Builder, Explanation Assist, Consultation Completion, producer/consumer story, attribution, zero-repeat handoff, FLOW, and RC-SMS architecture remain unchanged.
- 408FARMERS requires no runtime change.

## Verification

Dedicated PC-1.5 QA covers all readiness combinations, immutability, session-only device confirmation, Workspace integration, responsive presentation, semantic guardrails, and preserved architecture hashes. Complete CoverageFit regression, static, deployment, cross-browser, API, Cloudflare build, cross-project contract, archive-integrity, and clean-room checks are required before Deployable status.

PC-1.6 Production Release Certification remains deferred until the real producer pilot is performed and its evidence is reviewed.
