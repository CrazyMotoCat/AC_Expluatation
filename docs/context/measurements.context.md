# Measurements Context Capsule

SOURCE_VERSION: 2026-09-16
MODULE: Measurements
MATURITY: STABLE

## PURPOSE

Measurements хранит исторические эксплуатационные измерения оборудования и компонентов: числовые/текстовые значения, единицы, нормативные границы, оценку результата и связь с WorkOrder/operation.

Это foundation для trend/degradation analysis.

## OWNS

- MeasurementParameterDefinition
- Measurement
- measurement evaluation result
- measurement history/read models

## DB

Основные таблицы:

- `measurements.parameter_definitions`
- `measurements.measurements`

## INVARIANTS

- Measurement является отдельным историческим фактом.
- Важное измерение нельзя хранить только внутри JSON WorkOrder.
- Measurement относится к Asset.
- Component Asset optional.
- ParameterDefinition определяет тип физической величины.
- Unit обязателен для числового measurement.
- Raw measured value сохраняется независимо от evaluation.
- Normative min/max snapshot желательно сохранять вместе с measurement, чтобы будущие изменения нормативов не переписывали историю.
- `measured_at` и `measured_by` обязательны для ручного измерения.
- WorkOrder/step links optional, но обязательны если measurement сделан в рамках работы.
- Decimal используется там, где нужна точность.
- Unit conversion не должен silently менять original value без trace.
- Telemetry high-frequency readings в будущем отделяются в отдельный telemetry module.
- Measurements history должна поддерживать trend queries.
- Evaluation status не заменяет Defect автоматически; out-of-range может предложить/потребовать defect по business rule.

## PARAMETER DEFINITION

Минимум:

- code;
- name;
- quantity_type;
- default_unit_id;
- description.

Примеры:

- battery_voltage;
- battery_internal_resistance;
- oil_pressure;
- coolant_temperature;
- line_voltage.

## MEASUREMENT FIELDS

Минимум:

- asset_id;
- component_asset_id optional;
- parameter_definition_id;
- work_order_id optional;
- work_order_step_id optional;
- value_numeric/value_text;
- unit_id;
- measured_at;
- measured_by;
- min_expected;
- max_expected;
- evaluation_status;
- source_type;
- source_external_id optional.

## EVALUATION STATUS

Минимум:

- NORMAL
- WARNING
- OUT_OF_RANGE
- CRITICAL
- UNKNOWN

Правило evaluation должно быть детерминированным.

## NORMS

Norms могут зависеть от:

- AssetType;
- Model;
- Site criticality;
- MaintenanceLevel;
- operation definition.

WorkOrder snapshot должен хранить актуальные нормы для конкретной работы.

## PERMISSIONS

Типовые:

- `measurements.read`
- `measurements.create`
- `measurements.correct`
- `measurements.export`

Correction существующего historical measurement должна быть controlled; предпочтительнее correction record/version, если это требуется аудитом.

## PUBLIC CONTRACTS

Полезные:

- `MeasurementReference`
- `MeasurementTrendPoint`
- `IMeasurementsModule.RecordMeasurement(...)`
- `IMeasurementsModule.GetAssetHistory(...)`

## EVENTS

Основные:

- `MeasurementRecorded`
- `MeasurementOutOfRange`
- `MeasurementCritical`

Не публиковать каждое normal measurement в RabbitMQ без реальной необходимости.

## DEPENDS_ON

Допустимо:

- Assets.Contracts;
- WorkOrders.Contracts;
- shared Units reference;
- Identity/current user;
- Audit.

## TREND

Read model должен поддерживать:

```text
asset
parameter
from
to
```

и возвращать chronologically ordered series.

## PARTITIONING

При росте таблица является кандидатом на RANGE partitioning по `measured_at`.

Не включать partitioning до фактической необходимости.

## MANUAL VS TELEMETRY

`measurements.measurements`:

- ручные;
- эксплуатационные;
- WorkOrder-derived;
- occasional external readings.

`telemetry.readings` future:

- высокочастотные автоматические потоки.

Не смешивать их без причины.

## OUT-OF-RANGE FLOW

```text
record raw value
→ evaluate against snapshot norm
→ mark status
→ optional business action:
   comment / remark / defect proposal
```

Measurement не должен исчезать даже если later defect rejected.

## FORBIDDEN

- хранить единицу измерения только в label;
- использовать float без причины для точных значений;
- изменять старое значение из-за нового норматива;
- прятать measurement только в WorkOrder JSON;
- автоматически создавать Defect для любого отклонения без rule;
- хранить telemetry stream в core measurement table без отдельного review.

## TOP_TEST_RISKS

- decimal precision;
- unit mismatch;
- exact boundary min/max;
- norm changed after work;
- wrong asset/component;
- duplicate offline measurement;
- out-of-range evaluation;
- unauthorized contractor recording;
- trend ordering/timezone.
