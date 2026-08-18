# Evidence-Aware Consultation Handoff

## Purpose

ASMT-1.6 carries the evidence-quality contract created by ASMT-1.5 into the producer's existing consultation workflow. The handoff separates facts that were clearly reported, policy details that still require verification, and questions that remain unresolved so the licensed conversation can begin with the right level of certainty.

The feature organizes consultation work. It does not verify policy language, determine coverage adequacy, predict eligibility, or change the Protection Score or recommendation-ordering logic.

## Handoff groups

| Group | Source evidence state | Producer use |
| --- | --- | --- |
| Confirmed facts | `confirmed` | Treat as homeowner-reported context and briefly reconfirm material facts. |
| Verify against policy | `needs-verification` | Compare the reported understanding with declarations, endorsements, deductibles, exclusions, and carrier records. |
| Unresolved questions | `partial` or `missing` | Ask the saved follow-up question and resolve the missing detail before relying on the topic. |

A confirmed fact is still homeowner-reported. It is not a representation that CoverageFit inspected the issued policy.

## Shared handoff contract

Agent-facing consumers receive one normalized `evidenceHandoff` object from `workspace-data.js`:

- `schemaVersion`
- `handoffVersion`
- `available`
- `state`
- `completionState`
- `scoreIsFinal`
- `scoreFormulaChanged`
- summary counts for total, confirmed, verification, unresolved, and follow-up items
- `confirmedFacts`
- `verificationItems`
- `unresolvedQuestions`
- a policy-confirmation guardrail

Items preserve the assessment question key, category, reported answer, evidence label, follow-up question, priority relationship, and property or review-reason context where available.

## Agent Workspace

The existing Agent Workspace now includes one Assessment Evidence card with three columns. It shows the evidence state and counts before the recommendation timeline, gives the producer the first useful follow-up prompt, and preserves evidence labels on recommendation, checklist, and timeline items.

The card is not a second report or a parallel consultation workflow. It is rendered from the same selected consultation record and normalized snapshot already used by the workspace.

## Conversation plan and checklist

The Conversation Planner adds one bounded context step after property confirmation. The step summarizes the confirmed and open evidence counts, prompts the producer to resolve the first verification or unresolved item, and carries the complete handoff as metadata.

The Consultation Checklist is generated from that same plan. Evidence labels, answer context, and prompts remain attached to both the handoff step and recommendation topics so checklist state changes do not discard the assessment evidence.

## Consultation document

The certified Consultation Document carries the same handoff into the Coverage Conversation Guide. Page 3 includes:

- confirmed facts
- items to verify against the policy
- unresolved questions
- the evidence guardrail
- evidence status on each recommendation topic

This keeps the printable working document aligned with the live Agent Workspace.

## Scoring and recommendation boundary

ASMT-1.6 does not alter:

- assessment questions or answer choices
- evidence classification rules
- question weights or answer impacts
- weighted penalties or category scores
- the numeric Protection Score or score bands
- property-aware or review-reason-aware boosts
- recommendation priority calculations or topic ordering

The handoff explicitly records `scoreFormulaChanged: false`.

## Backward compatibility

Reports created before ASMT-1.5 do not contain evidence metadata. They receive a truthful `legacy` handoff state, an empty grouped summary, and a prompt to review saved answers manually. Existing consultation records, private reports, Cloudflare APIs, browser-local fallbacks, planner, checklist, and print routes remain usable.

## Limitations

Evidence groups are based on saved homeowner responses. CoverageFit does not inspect declarations pages, endorsements, exclusions, underwriting notes, carrier systems, or claim records. Resolving an item during the consultation is a producer workflow action and is not yet written back as a new evidence-resolution history. That bounded capability is deferred to ASMT-1.7.
