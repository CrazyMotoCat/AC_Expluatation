# Module: Defects

STATUS: STABLE
SOURCE_VERSION: 2026-09-16

## Purpose

Defects управляет неисправностями, observations, recurrence links, escalation и lifecycle подтверждённого дефекта.

## Owns

- Defect
- DefectType
- DefectObservation
- StatusHistory
- RecurrenceLink
- Escalation state

## Database

Schema:

```text
defects
```

Tables:

```text
defect_types
defects
observations
status_history
recurrence_links
```

## Business rules

- BR-DEF-001 … BR-DEF-007.
- same open condition → observation;
- closed recurrence → new defect + link;
- recurrence evaluated by engineer;
- unresolved across cycles escalates.

## Lifecycle

См. `lifecycle-registry.md`.

## Identity of defect

Определяется комбинацией business context:

- Asset;
- component;
- condition/symptom;
- open state;
- engineering judgement.

Нельзя использовать только title string.

## Permissions

- defects.read
- defects.create
- defects.assign
- defects.update
- defects.resolve
- defects.close
- defects.review_recurrence

## Public contracts

- DefectReference
- DefectSummary
- CreateDefect
- AddObservation
- GetOpenDefects

## Events

- DefectCreated
- DefectObserved
- DefectAssigned
- DefectResolved
- DefectClosed
- DefectRecurrenceLinked
- DefectEscalated

## Sources

Possible source:

- WorkOrder;
- Inventory;
- Incident;
- Manual.

## Repairs

Repair process owned by Repairs. Defects links via contract/event.

## API examples

```text
POST /api/v1/defects
GET /api/v1/defects/{id}
POST /api/v1/defects/{id}/observations
POST /api/v1/defects/{id}/resolve
POST /api/v1/defects/{id}/close
POST /api/v1/defects/{id}/recurrence-review
```

## Tests

- duplicate open condition;
- same symptom different components;
- recurrence after close;
- escalation after maintenance cycle;
- contractor scope;
- close concurrency.

## Forbidden

- auto reopen CLOSED;
- new defect every maintenance visit for same unresolved problem;
- delete history;
- direct Asset update.
