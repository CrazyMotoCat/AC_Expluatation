# Events Registry — АС «Эксплуатация»

STATUS: WORKING SOURCE OF TRUTH
SOURCE_VERSION: 2026-10-07 (TASK-02.02.02 FunctionalDirection Audit distinction)

## 1. Назначение

Этот файл является каталогом canonical domain/integration events.

Он предотвращает появление дублей вроде:

```text
AssetChanged
AssetUpdated
AssetModified
```

без различимого бизнес-смысла.

## 2. Типы событий

### Domain Event

Внутри module transaction/use case.

Не обязан уходить в RabbitMQ.

### Integration Event

Cross-module/asynchronous contract.

Для надёжной публикации:

```text
transactional outbox
```

## 3. Naming

Событие — факт в прошедшем времени:

```text
AssetCommissioned
WorkOrderAccepted
DefectCreated
```

Не:

```text
SendNotification
UpdateAsset
```

## 4. Canonical events

| Event | Publisher | Typical consumers | Integration | Outbox |
|---|---|---|---|---|
| `UserActivated` | Identity | Notifications/Audit | optional | if async |
| `UserDeactivated` | Identity | Notifications | optional | if async |
| `AccessAssignmentCreated` | Identity | Audit/Notifications | optional | if async |
| `SiteCreated` | Sites | Reports | optional | if async |
| `SiteCriticalityChanged` | Sites | Maintenance/Changes | yes | yes |
| `LocationMoved` | Sites | Assets/Inventory read models | optional | yes if async |
| `AssetCreated` | Assets | Reports/Search | optional | yes if async |
| `AssetCommissioned` | Assets | Maintenance | yes | yes |
| `AssetMoved` | Assets | Inventory/Reports | yes | yes |
| `AssetConditionChanged` | Assets | Reports/Notifications | optional | yes if async |
| `AssetReplaced` | Assets | Maintenance/Reports | yes | yes |
| `AssetDecommissioned` | Assets | Maintenance/Reports | yes | yes |
| `AssetResponsibilityChanged` | Assets | Notifications | optional | yes if async |
| `DocumentCreated` | Documents | Search/Audit | optional | yes if async |
| `DocumentVersionAdded` | Documents | Notifications/Search | optional | yes if async |
| `DocumentVersionVerified` | Documents | business module/read model | optional | yes if async |
| `AttachmentAdded` | Documents | owning module | optional | yes if async |
| `MaintenanceTemplateApproved` | Maintenance | Work planning | yes | yes |
| `MaintenancePlanCreated` | Maintenance | Reports | optional | yes if async |
| `MaintenancePlanRecalculated` | Maintenance | Reports/Notifications | yes | yes |
| `MaintenanceDueChanged` | Maintenance | Notifications/Reports | optional | yes |
| `MaintenanceWorkScheduled` | Maintenance | WorkOrders | yes | yes |
| `WorkOrderCreated` | WorkOrders | Notifications/Reports | optional | yes |
| `WorkOrderAssigned` | WorkOrders | Notifications | yes | yes |
| `WorkOrderStarted` | WorkOrders | Reports | optional | yes if async |
| `WorkOrderCompleted` | WorkOrders | Notifications | optional | yes |
| `WorkOrderAccepted` | WorkOrders | Maintenance/Defects/Reports | yes | yes |
| `WorkOrderRejected` | WorkOrders | Notifications | optional | yes |
| `WorkOrderCancelled` | WorkOrders | Maintenance/Notifications | yes | yes |
| `MeasurementRecorded` | Measurements | Reports | optional | usually no |
| `MeasurementOutOfRange` | Measurements | Defects/Notifications | optional | yes if cross-module |
| `MeasurementCritical` | Measurements | Defects/Notifications | yes | yes |
| `DefectCreated` | Defects | Notifications/Reports | yes | yes |
| `DefectObserved` | Defects | Reports | optional | no/optional |
| `DefectAssigned` | Defects | Notifications | yes | yes |
| `DefectResolved` | Defects | Work/Reports | optional | yes |
| `DefectClosed` | Defects | Reports | optional | yes |
| `DefectRecurrenceLinked` | Defects | Reports/Notifications | optional | yes |
| `DefectEscalated` | Defects | Notifications | yes | yes |
| `InventorySessionStarted` | Inventory | Notifications/Reports | optional | yes |
| `AssetObservedInInventory` | Inventory | Reports | usually no | no |
| `InventoryDiscrepancyCreated` | Inventory | Notifications/Incidents* | optional | yes |
| `DraftAssetSubmitted` | Inventory | Assets/Notifications | yes | yes |
| `DraftAssetApproved` | Inventory | Assets/Reports | yes | yes |
| `InventoryReportGenerated` | Inventory | Documents/Reports | yes | yes |
| `InventoryReportApproved` | Inventory | Reports/Audit | yes | yes |
| `ContractCreated` | Contractors | Notifications | optional | yes |
| `ContractActivated` | Contractors | Identity/Notifications | yes | yes |
| `ContractExpired` | Contractors | Identity/Notifications | yes | yes |
| `ContractScopeChanged` | Contractors | Identity/Auth cache invalidation | yes | yes |
| `ContractorUserVerified` | Contractors | Identity | yes | yes |
| `UserAssignedToContract` | Contractors | Identity | yes | yes |
| `ContractAssignmentExpired` | Contractors | Identity/Notifications | yes | yes |

`TASK-02.03.03` Phase A separately freezes Site Audit entity/actions in
`modules/audit.md`. Matching names in this domain/integration event catalog
do not register an Audit action or imply publication of an event for every
Site update. Integration event publication follows its own approved contract
and outbox requirements; the Site Audit obligation is a separate ADR-011
mechanism.

`Incidents*` означает future/provisional consumer.

TASK-02.04.02 / LOCATION-TREE-01 registers Location technical Audit actions
in `modules/audit.md`. The optional `LocationMoved` domain/integration event
above remains provisional for runtime emission; this slice does not publish
it. Durable technical audit is not Location or Asset placement business history.

TASK-02.02.02 registers FunctionalDirection technical Audit actions in
`modules/audit.md`, pending independent review/publication. These identifiers
are not domain/integration events; this reference task adds neither an
integration-event publication nor a separate business-history store.

## 5. Event envelope

Рекомендуемый integration envelope:

```json
{
  "eventId": "uuidv7",
  "eventType": "AssetCommissioned",
  "eventVersion": 1,
  "occurredAt": "2026-09-16T10:00:00Z",
  "correlationId": "uuid",
  "causationId": "uuid-or-null",
  "producer": "Assets",
  "payload": {}
}
```

## 6. Event versioning

Breaking payload change:

- increment `eventVersion`;
- либо introduce new event contract.

Consumer должен явно поддерживать version.

## 7. Idempotency

Каждый integration consumer должен сохранять/process `eventId` idempotently.

Использовать inbox pattern там, где duplicate side effect критичен.

## 8. Delivery semantics

Предполагать:

```text
at-least-once
```

а не exactly-once.

Поэтому consumer обязан быть retry-safe.

## 9. Что не должно становиться event

Не публиковать event ради каждого CRUD поля:

```text
AssetNameChanged
AssetDescriptionChanged
```

если нет реального cross-module/business reaction.

## 10. Event payload rule

Payload должен содержать минимум для реакции, но не копировать целый aggregate.

Предпочтительно:

```text
entity id
business-relevant facts
occurred_at
```

Consumer может запросить актуальный контекст через public contract/API, если это допустимо.

## 11. Outbox required

Outbox обязателен, если потеря event может привести к:

- несозданной работе;
- неправильному maintenance schedule;
- пропущенному security/access effect;
- пропущенному critical notification;
- несогласованной интеграции.

## 12. Правила добавления event

1. Проверить registry.
2. Определить publisher owner.
3. Определить domain vs integration.
4. Определить consumers.
5. Решить outbox.
6. Решить idempotency.
7. Обновить module doc/context capsule.
