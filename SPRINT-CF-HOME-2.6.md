# CoverageFit v3.20.57 — HOME-2.6 Intent Reception

CoverageFit now receives the `/home/` engagement answers as a separate, bounded entry-intent context. It uses that context to acknowledge the visitor’s goal, housing situation, and timing during the secure transition and assessment opening.

The existing trusted handoff still removes identity, contact, property, consent, control, and engagement parameters from the visible URL; privately preserves the prospect profile and consent; confirms the transferred property once; and starts the existing assessment immediately after confirmation.

Completed local and server-backed consultation records retain the three bounded values inside the existing `prospectProfile` and `personalizationContext.journey` report context for Dylan. No parallel record schema was added. The separate receiver context has an explicit score policy and is never passed to question resolution or `CoverageFitProtectionScore.evaluate`. Assessment answers remain the only behavioral evidence used by Protection Score.
