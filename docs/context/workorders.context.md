# WorkOrders Context Capsule

SOURCE_VERSION: 2026-09-16
MODULE: WorkOrders

## PURPOSE

WorkOrders управляет фактическим выполнением работ: назначением, checklist snapshot, исполнителями, результатами операций, трудозатратами, материалами, статусами и приёмкой заказчиком. WorkOrder является исторически фиксированным экземпляром работы.

## OWNS

- WorkOrder
- WorkOrderStep
- WorkOrderParticipant
- WorkOrderStatusHistory
- AssetStateSnapshot
- LaborEntry
- MaterialCatalog
- MaterialUsage

## DB

Основные таблицы:

- `workorders.work_orders`
- `workorders.work_order_steps`
- `workorders.participants`
- `workorders.status_history`
- `workorders.asset_state_snapshots`
- `workorders.labor_entries`
- `workorders.material_catalog`
- `workorders.material_usage`

## INVARIANTS

- WorkOrder получает immutable snapshot операций из Maintenance Template Version.
- Позднее изменение Template не меняет существующий WorkOrder.
- Lifecycle transitions должны быть явными.
- Status нельзя менять произвольным `PATCH status`.
- Critical required step не может молча считаться выполненным.
- Operation result должен соответствовать operation type.
- Required photo/comment rules должны проверяться backend.
- Executor предлагает итоговый technical condition, но customer reviewer может подтвердить/скорректировать.
- Work status и Asset technical condition — разные измерения.
- Contractor не должен сам подтверждать свою работу, если требуется customer verification.
- Labor подрядчика хранит verification state.
- Material usage является фактом расхода, но не складским остатком.
- `used_at` для расходного материала обязателен.
- Completion/acceptance должны быть idempotent при повторной отправке.
- Critical concurrent edits защищаются optimistic concurrency.
- Before/After snapshots сохраняются как исторические факты.
- Accepted work может инициировать maintenance recalculation через contract/event.
- WorkOrder не должен напрямую менять таблицы Assets/Maintenance/Defects.

## INITIAL LIFECYCLE

Пример:

- DRAFT
- PLANNED
- ASSIGNED
- IN_PROGRESS
- COMPLETED
- COMPLETED_WITH_REMARKS
- ACCEPTED
- REJECTED
- CANCELLED

Точные allowed transitions должны быть закреплены в Domain tests.

## EXECUTION FLOW

```text
Create from maintenance snapshot
→ Assign
→ Start
→ Execute Steps
→ Record Measurements/Photos/Materials/Labor
→ Executor Complete
→ Customer Review
→ Accept / Reject
```

## WORK ORDER STEP

Step хранит snapshot:

- name;
- description;
- operation type;
- requirement type;
- criticality;
- parameter/unit;
- normative ranges;
- result;
- completed_by/at;
- comment.

## FINAL ASSET CONDITION

Минимум:

- IN_OPERATION
- REPAIR_REQUIRED
- FAILED
- IN_OPERATION_WITH_NON_BLOCKING_DEFECTS

Исполнитель предлагает состояние.

Ответственный сотрудник заказчика проверяет.

Для KVO/FAILURE может требоваться escalation — не придумывать точную policy без решения.

## PARTICIPANT ROLES

- OWNER
- EXECUTOR
- REVIEWER
- APPROVER
- COORDINATOR

## PERMISSIONS

Типовые:

- `workorders.read`
- `workorders.assign`
- `workorders.execute`
- `workorders.complete`
- `workorders.review`
- `workorders.approve`
- `workorders.cancel`

Scope зависит от site/asset/contract/context.

## PUBLIC CONTRACTS

Полезные:

- `WorkOrderReference`
- `WorkOrderResult`
- `WorkOrderAcceptedEvent`
- `IWorkOrdersModule.GetWorkResult(...)`

Другие модули не должны читать `workorders.*` напрямую ради бизнес-решений.

## EVENTS

Основные:

- `WorkOrderCreated`
- `WorkOrderAssigned`
- `WorkOrderStarted`
- `WorkOrderCompleted`
- `WorkOrderAccepted`
- `WorkOrderRejected`
- `WorkOrderCancelled`

`WorkOrderAccepted` особенно важен для Maintenance recalculation.

## DEPENDS_ON

Допустимо:

- Maintenance.Contracts;
- Assets.Contracts;
- Measurements.Contracts/Application;
- Documents contracts;
- Contractors contracts;
- Qualifications contracts;
- Identity authorization abstractions.

Не использовать infrastructure других модулей.

## MEASUREMENTS

Фактические измерения сохраняются в `measurements.measurements`, а WorkOrderStep содержит связь/result context.

Не прятать измерения только в JSON step result.

## DEFECT CREATION

WorkOrder может инициировать создание Defect через Defects contract/application command.

Он не вставляет строку в `defects.defects`.

Если тот же defect уже открыт, process должен позволить добавить observation вместо duplicate.

## MATERIALS

MVP:

- suggested catalog;
- custom material allowed;
- quantity;
- unit;
- used_at;
- optional manufacturer/batch/serial.

Это не warehouse.

## LABOR

Для каждого участника:

- start/end;
- duration;
- role/context.

Contractor labor:

```text
PENDING_VERIFICATION
→ VERIFIED
```

по customer verification.

## IDEMPOTENCY

Особенно:

- complete;
- accept;
- offline batch step update;
- repeated mobile sync.

Повтор команды не должен создавать duplicate history/material/measurements.

## CONCURRENCY

Проверять:

- два исполнителя редактируют один step;
- два complete request;
- reviewer принимает, пока executor ещё редактирует;
- retry after network timeout.

## AUDIT / HISTORY

Status change:

- status history;
- audit event.

Critical action:

- correlation ID;
- user;
- working context;
- reason/comment where required.

## FORBIDDEN

- mutable link to live Template instead of snapshot;
- generic PATCH status;
- contractor self-approval при customer review policy;
- direct UPDATE Assets/Maintenance/Defects;
- storing measurements only inside WorkOrder JSON;
- accepting incomplete CRITICAL required step as normal completion;
- silently overwriting concurrent edits;
- converting material usage into pseudo warehouse stock.

## TOP_TEST_RISKS

- template changed after WorkOrder creation;
- incomplete required critical step;
- duplicate completion retry;
- unauthorized contractor;
- expired contract;
- wrong site scope;
- reviewer/executor separation;
- concurrency conflict;
- accepted work recalculation emitted twice;
- contractor labor marked verified without customer verification.
