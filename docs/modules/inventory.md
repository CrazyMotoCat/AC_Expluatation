# Module: Inventory

STATUS: STABLE
SOURCE_VERSION: 2026-09-16

## Purpose

Inventory проводит контролируемую проверку фактического наличия и размещения активов, поддерживает параллельный scan и формирует формальный report.

## Owns

- InventorySession
- InventoryScope
- ExpectedItem
- Participant
- Observation
- Discrepancy
- DraftAsset
- InventoryReport

## Database

Schema:

```text
inventory
```

Tables:

```text
sessions
scopes
expected_items
participants
observations
discrepancies
draft_assets
reports
```

## Business rules

- BR-INV-001 … BR-INV-010.
- expected snapshot immutable after start;
- parallel users;
- scan idempotent;
- unknown → DraftAsset;
- missing ≠ automatic loss/decommission.

## Session types

- PLANNED_FULL
- SELECTIVE
- CATEGORY
- SPECIAL

## Lifecycle

См. `lifecycle-registry.md`.

## Scan results

- FOUND
- FOUND_WRONG_LOCATION
- UNKNOWN_ASSET
- DATA_MISMATCH

Missing вычисляется по отсутствию observation после checkpoint/finish.

## Permissions

- inventory.read
- inventory.create
- inventory.execute
- inventory.manage_scope
- inventory.finish_scan
- inventory.generate_report
- inventory.approve
- inventory.review_draft_asset

## Public contracts

- InventorySessionReference
- InventoryResultSummary
- GetLatestVerification

## Events

- InventorySessionStarted
- AssetObservedInInventory
- InventoryDiscrepancyCreated
- DraftAssetSubmitted
- DraftAssetApproved
- InventoryReportGenerated
- InventoryReportApproved

## Dependencies

- Assets.Contracts
- Sites.Contracts
- Documents
- Identity
- Incidents optional/provisional

## API examples

```text
POST /api/v1/inventory/sessions
POST /api/v1/inventory/sessions/{id}/start
POST /api/v1/inventory/sessions/{id}/scan
POST /api/v1/inventory/sessions/{id}/finish-scan
POST /api/v1/inventory/sessions/{id}/report
POST /api/v1/inventory/sessions/{id}/approve
```

## Tests

- duplicate scan;
- parallel same asset scan;
- wrong location;
- unknown asset approval;
- missing not decommissioned;
- expected snapshot unchanged after Asset move;
- report immutability.

## Forbidden

- mutate expected snapshot after start;
- official Asset from unknown scan without review;
- single-user-only architecture;
- auto LOST/DECOMMISSIONED.
