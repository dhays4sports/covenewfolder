# AW-6 Print Data Adapters

## Purpose

Print adapters isolate product-specific Workspace data from the module-agnostic Print Engine.

## Runtime

`assets/js/print-adapters.js` exposes the frozen `CoverageFitPrintAdapterRegistry` API.

Public methods:

- `registerAdapter(type, adapter, options)`
- `getAdapter(type)`
- `hasAdapter(type)`
- `listAdapters()`
- `resolveType(input)`
- `createSnapshot(type, context)`

The registry ships with `HomePrintAdapter` registered as `home`.

## Adapter contract

An adapter must provide:

- `id`
- `version`
- `contractVersion`
- `createSnapshot(context)`

The returned snapshot must include product-specific source values normalized to:

- `workspaceSnapshot`
- `conversationPlan`
- `checklistState`
- adapter identity metadata

The Print Engine consumes only this adapted boundary and remains responsible for the shared print-model schema.

## Compatibility

The legacy direct-source path remains available when no adapter registry is supplied. Existing AW-6A.1 through AW-6A.3 callers therefore continue to work.
