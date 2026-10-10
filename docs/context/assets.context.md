# Assets Context Capsule

SOURCE_VERSION: faa09a7b77d8d9bfb5f416a1d00ce6070bbd61f6 + ASSET-TYPE-01 local candidate (2026-10-09)
MODULE: Assets

## PURPOSE

Assets — основной реестр оборудования и инженерных систем. Модуль хранит текущее состояние актива, его модель, состав, функциональные связи, ответственности, замены и бизнес-историю.

## IMPLEMENTATION STATUS

TASK-03.01.01 / ASSET-TYPE-01 implements AssetType backend locally, unpublished.
Asset, Manufacturer/Model, attributes, composites, events/history and frontend
remain planned. Registration uses AddAssetsModule(configuration) and AssetsDbContext.

TASK-03.01.01 owner decisions are accepted; FunctionalDirection reference and
selectability and Identity handoff under ADR-019 are published prerequisites.
[ASSET-TYPE-SCOPE-00](../../.agent/tasks/AUTH-SCOPE-01/asset-type-scope-state.md)
summarizes the module doc: read via current `assets.read` OR `assets.manage_types`
is global after INTERNAL eligibility. Management uses exact `assets.manage_types`,
explicit GLOBAL or non-geographic direction/type scopes. Both intersect within
one assignment; complete assignments union. Geography composites cannot manage.
Assets owns direction/ancestry and obtains trusted facts internally. Type-only
root creation/root escape is denied; reparent covers both ends under one grant;
every mutation locks then rereads. READ COMMITTED uses the global two-int advisory
key (1095980121,1), distinct from existing module bigint locks, retained until
atomic Assets-owned Audit obligation commit. Recursive PostgreSQL CTE validates
coverage/cycles/active descendants; expectedRowVersion protects every existing-row write.

AssetType stores explicit immutable direction and code, nullable parent, name,
independent flags, ACTIVE/INACTIVE, UTC times and positive rowVersion. Code:
trim/invariant uppercase/regex50/global unique; name trim/max200/non-unique.
Multiple roots/arbitrary depth/same-direction parenting; no inherited direction.
Create ACTIVE; create/reparent/activate child require ACTIVE parent; deactivation
rejects any active descendant. Any ACTIVE type including non-leaf is selectable;
inactive remains resolvable. IAssetTypeReferenceProvider exposes immutable scalar facts.
Organization Application validates new directions as selectable; inactive existing
direction references remain resolvable without cascading type status.

GET /api/v1/asset-types: null parent roots or explicit parent direct children,
optional status, page1/size50/max200, code/id order, both statuses. GET /{id} exposes
rowVersion after catalog eligibility. POST base creates, PUT /{id} updates name/flags,
POST /{id}/reparent requires parent?/reason1..500/version; activate/deactivate require
version. No DELETE. 401/403 eligibility precedes target disclosure; scoped missing
mutation target403, independently GLOBAL-covered missing target404. Duplicate/stale409.
Successful mutations use five registered AssetType Audit actions; reads/failures
emit no successful mutation Audit. Canonical dispatcher claims with SKIP LOCKED,
leases/fencing and stable idempotent event IDs. One migration20261009093315 creates
type/Audit obligation tables and immutable/no-delete guard; Down refuses business
or Audit history. Both permissions preexist; no Identity mutation/grants. Next gate:
independent publication review, then separately authorized exact-SHA hosted CI.

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

- `AssetsModuleInfo` — technical bootstrap contract, не содержит business data актива;
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
