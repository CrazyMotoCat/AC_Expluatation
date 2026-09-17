# Module: WorkOrders

STATUS: STABLE
SOURCE_VERSION: 2026-09-16

## Purpose

WorkOrders управляет фактическим выполнением работ: assignment, checklist snapshot, evidence, participants, labor, materials, completion и customer review.

## Owns

- WorkOrder
- WorkOrderStep
- Participant
- StatusHistory
- AssetStateSnapshot
- LaborEntry
- MaterialUsage

## Database

Schema:

```text
workorders
```

Core tables:

```text
work_orders
work_order_steps
participants
status_history
asset_state_snapshots
labor_entries
material_usage
```

## Business rules

- BR-WO-001 … BR-WO-013.
- snapshot immutable;
- command-based lifecycle;
- critical required steps enforced;
- technical condition separate from WorkOrder status;
- contractor verification rules;
- idempotent completion/acceptance.

## Lifecycle

См. `lifecycle-registry.md`.

## Execution flow

```text
Create
→ Assign
→ Start
→ Execute Steps
→ Complete
→ Customer Review
→ Accept / Reject
```

## Step snapshot

Stores:

- operation name/description;
- type;
- requirement type;
- criticality;
- norm snapshot;
- result;
- evidence requirements.

## Final technical condition

Canonical values in `reference-data-registry.md`.

## Permissions

- workorders.read
- workorders.create
- workorders.assign
- workorders.execute
- workorders.complete
- workorders.review
- workorders.approve
- workorders.cancel

## Public contracts

- WorkOrderReference
- WorkOrderResult
- WorkOrderAcceptedEvent
- GetWorkResult

## Events

- WorkOrderCreated
- WorkOrderAssigned
- WorkOrderStarted
- WorkOrderCompleted
- WorkOrderAccepted
- WorkOrderRejected
- WorkOrderCancelled

## Dependencies

Allowed:

- Maintenance.Contracts
- Assets.Contracts
- Measurements contracts
- Documents
- Contractors
- Qualifications
- Identity

No direct writes to foreign schemas.

## Measurements

Stored by Measurements module as separate facts.

## Defects

Creation through Defects contract/application use case.

## Materials

Usage fact only; not stock ledger.

## API examples

```text
GET /api/v1/work-orders
GET /api/v1/work-orders/{id}
POST /api/v1/work-orders/{id}/assign
POST /api/v1/work-orders/{id}/start
PUT /api/v1/work-orders/{id}/steps/{stepId}
POST /api/v1/work-orders/{id}/complete
POST /api/v1/work-orders/{id}/accept
POST /api/v1/work-orders/{id}/reject
```

## Tests

- template changed after creation;
- critical required step missing;
- duplicate complete retry;
- wrong contractor;
- expired contract;
- self-review violation;
- optimistic concurrency;
- WorkOrderAccepted emitted once.

## Forbidden

- PATCH status;
- live mutable template;
- direct Assets/Maintenance/Defects writes;
- measurements only in JSON;
- silent concurrent overwrite.
