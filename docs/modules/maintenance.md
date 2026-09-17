# Module: Maintenance

STATUS: STABLE
SOURCE_VERSION: 2026-09-16

## Purpose

Maintenance отвечает за нормативную часть ТО: уровни, шаблоны, версии, операции, inclusions, frequency rules, планы и пересчёт будущего графика.

Execution belongs to WorkOrders.

## Owns

- MaintenanceLevel
- MaintenanceTemplate
- MaintenanceTemplateVersion
- OperationDefinition
- TemplateInclusion
- FrequencyRule
- AssetMaintenancePlan
- ScheduleRecalculation

## Database

Schema:

```text
maintenance
```

Core tables:

```text
levels
templates
template_versions
operation_definitions
template_inclusions
frequency_rules
asset_plans
schedule_recalculations
```

## Business rules

- BR-MNT-001 … BR-MNT-014.
- Approved version immutable.
- WorkOrder snapshot immutable.
- rule resolution deterministic.
- unplanned reset only full scope.
- higher level closes lower only full mandatory scope.

## Levels

Initial:

```text
TO1
TO2
TO3
SEASONAL
MAJOR
```

Stored as configurable reference with rank.

## Operations

Types:

- CHECK
- BOOLEAN
- NUMBER
- TEXT
- SELECT
- PHOTO
- MEASUREMENT

Requirement:

- REQUIRED
- CONDITIONAL
- RECOMMENDED
- CONTROL

Criticality:

- MINOR
- IMPORTANT
- CRITICAL

## Frequency

MVP:

```text
CALENDAR
```

Rule dimensions include:

- AssetType
- MaintenanceLevel
- SiteCriticality

## Scheduler

Must be:

- idempotent;
- deterministic;
- retry-safe;
- duplicate-safe;
- observable.

## Lifecycle

Template Version lifecycle in `lifecycle-registry.md`.

## Permissions

- maintenance.read
- maintenance.manage_templates
- maintenance.approve_template
- maintenance.manage_plans
- maintenance.recalculate
- maintenance.schedule

## Public contracts

- MaintenancePlanReference
- MaintenanceWorkPackage
- ResolvePlan
- RecalculatePlan

## Events

Publishes:

- MaintenanceTemplateApproved
- MaintenancePlanRecalculated
- MaintenanceDueChanged
- MaintenanceWorkScheduled

Consumes:

- AssetCommissioned
- AssetReplaced
- WorkOrderAccepted
- RepairCompleted (future)

## API examples

```text
GET /api/v1/maintenance/templates
POST /api/v1/maintenance/templates
POST /api/v1/maintenance/templates/{id}/versions/{versionId}/approve
GET /api/v1/assets/{assetId}/maintenance-plan
POST /api/v1/assets/{assetId}/maintenance-plan/recalculate
```

## Tests

- KVO interval selection;
- equal-specificity conflict;
- cyclic inclusion;
- partial higher-level scope;
- unplanned partial work;
- duplicate scheduler run;
- template immutability.

## Forbidden

- live Template linked to historical WorkOrder;
- silent due date overwrite;
- generic rules engine in MVP;
- direct WorkOrders table writes.
