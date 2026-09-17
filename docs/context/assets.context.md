# Assets Context Capsule

SOURCE_VERSION: 2026-09-16
MODULE: Assets

## PURPOSE

Assets — основной реестр оборудования и инженерных систем. Модуль хранит текущее состояние актива, его модель, состав, функциональные связи, ответственности, замены и бизнес-историю.

## OWNS

- Asset
- AssetType
- Manufacturer
- AssetModel
- AttributeDefinition
- AssetAttributeValue
- AssetRelation
- ResponsibilityType
- AssetResponsibility
- AssetEvent
- AssetReplacement
- Warranty

## DB

Основные таблицы:

- `assets.asset_types`
- `assets.manufacturers`
- `assets.asset_models`
- `assets.attribute_definitions`
- `assets.asset_attribute_values`
- `assets.assets`
- `assets.asset_relation_types`
- `assets.asset_relations`
- `assets.responsibility_types`
- `assets.asset_responsibilities`
- `assets.asset_events`
- `assets.asset_replacements`
- `assets.warranties`

## CORE FIELDS

Asset должен иметь как минимум:

- `id` UUIDv7;
- `site_id`;
- `location_id`;
- `asset_type_id`;
- `model_id` optional;
- `parent_asset_id` optional;
- `asset_code`;
- `inventory_number` optional;
- `serial_number` optional;
- lifecycle status;
- technical condition;
- availability status;
- commissioning/decommissioning dates;
- audit/concurrency fields.

## INVARIANTS

- Asset принадлежит одному Site.
- Location Asset должен принадлежать тому же Site.
- AssetType должен быть активен для нового актива.
- Model, если указан, должен соответствовать AssetType.
- Manufacturer/Model являются master data, а не случайным свободным текстом в каждом Asset.
- Значимые дочерние компоненты имеют собственный lifecycle.
- Parent/child graph не должен содержать циклы.
- Asset может иметь несколько responsibility roles одновременно.
- Нельзя сводить ownership к одному полю `responsible_user_id`.
- Lifecycle history нельзя физически удалять.
- Asset replacement сохраняет старый Asset как историческую сущность.
- Equivalent replacement не должен автоматически считаться полной configuration change.
- Business timeline и audit trail — разные механизмы.
- QR не должен зависеть от изменяемой Location.
- Asset deletion из production lifecycle обычно запрещён; использовать status/decommission.
- Model-level docs принадлежат модели, asset-specific docs — конкретному Asset.

## COMPOSITE MODEL

Примеры:

```text
UPS
→ Battery Cabinet

VRF System
→ Outdoor Unit
→ Indoor Units

Ventilation System
→ Fan
→ Filter
→ Heater
```

Отдельным Asset становится компонент, если он:

- имеет собственный lifecycle;
- обслуживается отдельно;
- имеет serial/model/history;
- влияет на конфигурацию/ТО.

## RELATIONS

Категории:

- STRUCTURAL
- FUNCTIONAL
- REDUNDANCY

Примеры functional relations:

- powers;
- cools;
- controls;
- sends data;
- depends on.

## RESPONSIBILITY TYPES

Базовые:

- OWNER
- BALANCE_HOLDER
- FUNCTIONAL_OWNER
- TECHNICAL_OWNER
- SERVICE_PROVIDER
- ASSIGNED_USER
- CURATOR
- APPROVER

Responsibility имеет validity period.

## LIFECYCLE

Примерные состояния:

- PLANNED
- WAREHOUSE
- INSTALLED
- COMMISSIONED
- IN_OPERATION
- RESERVE
- REPAIR
- DECOMMISSIONED
- DISPOSED

Точные allowed transitions должны быть явными.

## TECHNICAL CONDITION

Минимум:

- NORMAL
- ATTENTION
- DEGRADED
- FAULT
- CRITICAL
- UNKNOWN

Не смешивать с WorkOrder status.

## PERMISSIONS

Типовые:

- `assets.read`
- `assets.create`
- `assets.change`
- `assets.move`
- `assets.decommission`
- `assets.manage_responsibility`
- `assets.replace`

Все permissions дополнительно ограничиваются scope.

## PUBLIC CONTRACTS

Полезные контракты:

- `AssetReference`
- `AssetMaintenanceContext`
- `AssetOperationalContext`
- `IAssetsModule.GetAssetContext(assetId)`
- `IAssetsModule.ValidateAssetScope(...)`

Не отдавать EF Entity как контракт.

## EVENTS

Основные:

- `AssetCreated`
- `AssetInstalled`
- `AssetCommissioned`
- `AssetMoved`
- `AssetConditionChanged`
- `AssetReplaced`
- `AssetDecommissioned`
- `AssetResponsibilityChanged`

## DEPENDS_ON

Допустимо:

- Sites.Contracts;
- Identity authorization abstractions;
- Documents contracts;
- shared audit/clock/correlation abstractions.

Assets не должен напрямую зависеть от Maintenance/WorkOrders infrastructure.

## REPLACEMENT

Типы:

- LIKE_FOR_LIKE
- FUNCTIONAL_EQUIVALENT
- CONFIGURATION_CHANGE

Replacement должен фиксировать:

- old asset;
- new asset;
- reason;
- performed_at;
- approval;
- links to WorkOrder/Change if applicable.

## HISTORY

`assets.assets` = current state.

`assets.asset_events` = business timeline.

`audit.events` = кто изменил данные.

Все три слоя различны.

## FORBIDDEN

- физически удалять Asset с историей;
- хранить всё оборудование в одной гигантской JSON/EAV модели;
- WorkOrders напрямую UPDATE `assets.assets`;
- Maintenance напрямую читать/писать infrastructure Assets;
- хранить фото в PostgreSQL;
- возвращать EF entity через API;
- использовать только один generic `responsible`;
- менять Site/Location без истории/audit;
- привязывать QR к location text.

## TOP_TEST_RISKS

- location belongs to different site;
- model/type mismatch;
- parent-child cycle;
- unauthorized cross-region create;
- contractor wrong contract;
- duplicate asset code;
- normalized serial search;
- decommission with active critical work;
- replacement loses old history;
- responsibility validity overlap/incorrect subject.
