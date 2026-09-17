# Maintenance Context Capsule

SOURCE_VERSION: 2026-09-16
MODULE: Maintenance

## PURPOSE

Maintenance управляет регламентами ТО, версиями операций, периодичностью, maintenance plans и пересчётом будущего графика. Он определяет, что и когда нужно выполнять, но фактическое исполнение принадлежит WorkOrders.

## OWNS

- MaintenanceLevel
- MaintenanceTemplate
- MaintenanceTemplateVersion
- OperationDefinition
- TemplateInclusion
- FrequencyRule
- AssetMaintenancePlan
- ScheduleRecalculation

## DB

Основные таблицы:

- `maintenance.levels`
- `maintenance.templates`
- `maintenance.template_versions`
- `maintenance.operation_definitions`
- `maintenance.template_inclusions`
- `maintenance.frequency_rules`
- `maintenance.asset_plans`
- `maintenance.schedule_recalculations`

## INVARIANTS

- Template представляет логический регламент; содержание живёт в версиях.
- APPROVED версия immutable.
- Любое изменение утверждённого регламента создаёт новую version.
- WorkOrder использует snapshot версии и не меняется после публикации новой версии Template.
- Периодичность зависит минимум от AssetType + MaintenanceLevel + SiteCriticality.
- Custom per-asset interval архитектурно возможен позже, но не является обязательным MVP.
- Higher maintenance level может включать lower levels.
- Inclusion graph не должен содержать циклы.
- Выполнение higher level закрывает lower cycle только если выполнен полный обязательный объём.
- Unplanned work сбрасывает planned cycle только при подтверждении полного scope.
- Partial overlap не должен сбрасывать цикл.
- Изменение due date никогда не должно быть silent overwrite; сохраняется recalculation history.
- Conditional operations должны использовать простые прозрачные правила, не тяжёлый rules engine.
- Component-aware template composition должна учитывать фактическую конфигурацию Asset/System.
- Site service windows поддерживаются архитектурно, но не должны усложнять P0.

## LEVELS

Базовые:

- TO1
- TO2
- TO3
- SEASONAL
- MAJOR

Level имеет `rank`.

## OPERATION TYPES

- CHECK
- BOOLEAN
- NUMBER
- TEXT
- SELECT
- PHOTO
- MEASUREMENT

## REQUIREMENT TYPES

- REQUIRED
- CONDITIONAL
- RECOMMENDED
- CONTROL

## CRITICALITY

- MINOR
- IMPORTANT
- CRITICAL

Operation criticality влияет на closure behavior в WorkOrders.

## MEASUREMENT NORMS

Operation может задавать:

- parameter code;
- unit;
- min/max;
- warning min/max;
- severity behavior.

Фактическое значение хранится в Measurements, а не внутри Template.

## FREQUENCY RULES

Минимальный MVP:

```text
CALENDAR
```

Future:

- METER
- COMBINED
- SEASONAL
- EVENT

Rule resolution должен быть детерминированным и учитывать specificity/priority.

## EXAMPLE

Для одного MaintenanceLevel:

```text
DGU / TO2 / NORMAL → 6 months
DGU / TO2 / KVO2   → 3 months
DGU / TO2 / KVO1   → 1 month
```

Это должно проверяться unit tests.

## LIFECYCLE

Template Version:

- DRAFT
- REVIEW
- APPROVED
- ARCHIVED

Maintenance Plan:

- ACTIVE
- PAUSED
- CLOSED/INACTIVE

Точные статусы plan можно уточнить при реализации.

## PERMISSIONS

Типовые:

- `maintenance.read`
- `maintenance.manage_templates`
- `maintenance.approve_template`
- `maintenance.manage_plans`
- `maintenance.recalculate`
- `maintenance.schedule`

## PUBLIC CONTRACTS

Полезные:

- `MaintenancePlanReference`
- `MaintenanceWorkPackage`
- `IMaintenanceModule.ResolvePlan(assetContext)`
- `IMaintenanceModule.RecalculatePlan(...)`

WorkOrders получает готовый work package/snapshot source, а не читает таблицы template напрямую.

## EVENTS

Основные:

- `MaintenanceTemplateApproved`
- `MaintenancePlanCreated`
- `MaintenancePlanRecalculated`
- `MaintenanceDueChanged`
- `MaintenanceWorkScheduled`

Maintenance может слушать:

- `AssetCommissioned`
- `AssetReplaced`
- `WorkOrderAccepted`
- `RepairCompleted`

## DEPENDS_ON

Допустимо:

- Assets.Contracts;
- Sites.Contracts;
- WorkOrders.Contracts для accepted work result;
- shared clock/outbox/audit abstractions.

Не зависеть от Assets.Infrastructure/WorkOrders.Infrastructure.

## SCHEDULER

Scheduler должен быть:

- idempotent;
- retry-safe;
- deterministic;
- protected from duplicate generation;
- observable.

Repeated run не создаёт duplicate WorkOrders.

## RECALCULATION REASONS

Минимум:

- COMMISSIONING
- REPAIR
- REPLACEMENT
- UNPLANNED_MAINTENANCE
- MANUAL_CORRECTION

Сохраняются old/new due dates.

## FORBIDDEN

- редактировать APPROVED version;
- хранить только текущую due date без history;
- сбрасывать cycle после любого внепланового ремонта;
- закрывать lower ТО автоматически без полного scope;
- строить generic BPM/rules engine на MVP;
- генерировать WorkOrder напрямую из mutable Template без snapshot;
- кодировать KVO intervals в frontend;
- напрямую писать в WorkOrders tables.

## TOP_TEST_RISKS

- wrong frequency for KVO class;
- two rules same specificity;
- scheduler duplicate generation;
- template version mutation;
- cyclic template inclusion;
- higher TO incompletely closes lower cycle;
- unplanned partial work incorrectly resets due date;
- replacement triggers wrong recalculation;
- timezone/date boundary around due dates.
