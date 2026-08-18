# CoverageFit Print Engine

## Purpose

`CoverageFitPrintEngine` converts existing immutable Workspace contracts into one reusable, deeply immutable document view model. It is the foundation for the Printable Consultation Sheet and future CoverageFit document outputs.

The engine does not render HTML and does not print. Rendering and browser-print integration belong to later AW-6 sprints.

## Source contracts

The engine consumes:

1. `CoverageFitWorkspaceData.getSnapshot()`
2. `CoverageFitConversationPlanner.getPlan(workspaceSnapshot)`
3. `CoverageFitConsultationChecklist.getWorkspaceState()`

Callers may also inject those source objects explicitly. Explicit injection supports deterministic tests and future Business, Landlord, and Life adapters without forking the engine.

## Public API

```js
const model = CoverageFitPrintEngine.buildModel();
```

Alias:

```js
const model = CoverageFitPrintEngine.getModel();
```

Optional injected sources:

```js
const model = CoverageFitPrintEngine.buildModel({
  workspaceSnapshot,
  conversationPlan,
  checklistState,
  notes,
  consultationDate,
  preparedBy,
  agency
});
```

## Model contract

```js
{
  schemaVersion,
  engineVersion,
  state,
  generatedAt,
  metadata,
  customer,
  assessment,
  executiveSummary,
  strengths,
  propertySummary,
  recommendations,
  consultationChecklist,
  timeline,
  notes,
  attribution,
  diagnostics
}
```

Every nested object and array is deeply frozen before it is returned.

## Ownership rules

- Workspace Data owns normalized customer, assessment, property, and recommendation inputs.
- Conversation Planner owns consultation order, prompts, objectives, and guardrails.
- Consultation Checklist owns mutable consultation progress before the engine takes its immutable snapshot.
- Print Engine owns only the normalized document view model.
- Future renderers must consume the model rather than reach back into engine internals.

## Versioning

- Print Engine version: `0.1.0`
- Print model schema: `1`
- Additive optional fields may be introduced in compatible minor releases.
- Removing or changing the meaning of required fields requires a schema-version change.
