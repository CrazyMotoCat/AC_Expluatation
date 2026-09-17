# Module: Measurements

STATUS: STABLE
SOURCE_VERSION: 2026-09-16

## Purpose

Measurements хранит ручные/эксплуатационные измерения как отдельные исторические факты и обеспечивает evaluation/trend.

## Owns

- MeasurementParameterDefinition
- Measurement
- Evaluation result
- Trend read models

## Database

Schema:

```text
measurements
```

Tables:

```text
parameter_definitions
measurements
```

## Rules

- BR-MEA-001 … BR-MEA-006.
- raw value immutable/history-safe;
- norm snapshot reproducible;
- WorkOrder link explicit;
- telemetry separate later.

## Core fields

```text
asset_id
component_asset_id?
parameter_definition_id
work_order_id?
work_order_step_id?
value_numeric/value_text
unit_id
measured_at
measured_by
min_expected?
max_expected?
evaluation_status
```

## Evaluation

Canonical:

- NORMAL
- WARNING
- OUT_OF_RANGE
- CRITICAL
- UNKNOWN

## Permissions

- measurements.read
- measurements.create
- measurements.correct
- measurements.export

## Public contracts

- MeasurementReference
- MeasurementTrendPoint
- RecordMeasurement
- GetAssetHistory

## Events

- MeasurementRecorded
- MeasurementOutOfRange
- MeasurementCritical

## Dependencies

- Assets.Contracts
- WorkOrders.Contracts
- Units reference
- Identity/Audit

## API examples

```text
POST /api/v1/measurements
GET /api/v1/assets/{assetId}/measurements
GET /api/v1/assets/{assetId}/measurements/trend
```

## Tests

- decimal precision;
- min/max boundary;
- unit mismatch;
- norm snapshot after template change;
- duplicate offline submission;
- wrong component;
- contractor scope.

## Forbidden

- float for precision-critical values without reason;
- unit only as display text;
- old value changed when norm changes;
- telemetry flood in this table without architecture review.
