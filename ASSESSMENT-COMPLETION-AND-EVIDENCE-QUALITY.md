# Assessment Completion and Evidence Quality

## Purpose

ASMT-1.5 adds a transparent evidence-quality layer to the existing CoverageFit assessment. It distinguishes a clear homeowner response from partial knowledge, an item that still needs policy confirmation, and a missing required response. The layer organizes the licensed follow-up; it does not decide whether coverage is adequate and it does not change the Protection Score formula.

## Evidence states

| State | Meaning | Finalization effect |
| --- | --- | --- |
| `confirmed` | The response is clear enough to carry into the licensed conversation as reported. | Counts as clear evidence. |
| `partial` | The response provides useful context, but a material detail or decision remains incomplete. | Assessment may complete, with a follow-up item. |
| `needs-verification` | The homeowner selected an uncertainty state or reported that policy details have not been confirmed. | Assessment may complete, with a policy-verification item. |
| `missing` | No response was recorded. | A missing required response prevents finalization; an optional skipped response does not. |

Evidence quality describes the clarity of the recorded response, not the truth of a policy term. A clearly reported gap can therefore be `confirmed`, while a positive-sounding policy assumption can still be `needs-verification`.

## Completion states

- `complete`: every required question is answered and no response requires follow-up confirmation.
- `complete-with-verification`: every required question is answered, but at least one response is partial or needs verification.
- `incomplete`: one or more required responses are missing.

The completion summary records question counts, evidence counts, missing and follow-up keys, completion rate, and whether the numeric score is final. `scoreFormulaChanged` remains `false`.

## User experience

The assessment adds no questions, document-upload requests, or policy-detail forms. After each selected answer, the existing feedback area now also shows an evidence-quality status. If a required answer is missing because the active question set changed or the state was otherwise incomplete, CoverageFit returns the homeowner to the first missing question with a plain-language prompt. The completed Snapshot shows clear responses, items needing confirmation, and unanswered required items.

## Report and handoff contract

Each finding and answer can include:

- `evidenceQuality`
- `evidenceLabel`
- `evidenceSufficient`
- `evidenceBasis`
- `evidencePrompt`
- `answered`
- `required`

Completed reports include `assessmentCompletion` with the evidence methodology, active and unanswered question keys, evidence counts, completion state, completion rate, and final-score marker. Agent Workspace normalization preserves this summary. Private prospect report creation rejects a payload explicitly marked incomplete while remaining backward compatible with reports created before ASMT-1.5.

## Scoring boundary

ASMT-1.5 does not alter question weights, answer impacts, finding types, weighted penalties, category scores, score bands, property boosts, review-reason boosts, or priority ordering. Missing responses retain the existing score-engine behavior for diagnostic compatibility, but the assessment and private report services prevent an explicitly incomplete result from being treated as final.

## Limitations

Evidence status is based on the homeowner's selected response. CoverageFit does not inspect declarations pages, endorsements, carrier systems, underwriting files, or claim records. A `confirmed` status means the answer is clear enough to carry forward as homeowner-reported context; it is not independent verification of policy wording.
