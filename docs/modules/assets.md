# Module: Assets

STATUS: STABLE
SOURCE_VERSION: 2026-09-17

## Purpose

Assets — центральный реестр оборудования, инженерных систем, моделей, составных компонентов, связей, ответственности и lifecycle history.

## Implementation status

`TASK-00.03.02` создаёт только базовый layer pattern `Domain` / `Application` / `Infrastructure` / `Contracts`, технический query о модуле и стандартную регистрацию `AddAssetsModule()`. Описанные ниже business entities, persistence, API, permissions, lifecycle и events ещё не реализованы этой задачей.

## Owns

- Asset
- AssetType
- Manufacturer
- AssetModel
- attributes
- AssetRelation
- AssetResponsibility
- AssetEvent
- AssetReplacement
- Warranty

## Database

Schema:

```text
assets
```

Core tables:

```text
asset_types
manufacturers
asset_models
attribute_definitions
asset_attribute_values
assets
asset_relation_types
asset_relations
responsibility_types
asset_responsibilities
asset_events
asset_replacements
warranties
```

## Rules

Основные:

- BR-AST-001 … BR-AST-012.
- Asset belongs to one Site.
- Location same Site.
- Model matches type.
- composite graph acyclic.
- responsibility multi-role.
- lifecycle/history never physically erased.

## Composite assets

Сервисно значимые компоненты — отдельные Assets.

Примеры:

```text
UPS → Battery Cabinet
VRF → Outdoor Unit → Indoor Units
Ventilation System → Fan/Filter/Heater
```

## Lifecycle

См. `lifecycle-registry.md`.

## Technical condition

Отдельно от lifecycle:

```text
NORMAL
ATTENTION
DEGRADED
FAULT
CRITICAL
UNKNOWN
```

## Replacement

Types:

- LIKE_FOR_LIKE
- FUNCTIONAL_EQUIVALENT
- CONFIGURATION_CHANGE

Replacement сохраняет old/new/reason/date/approval/link to work/change.

## Responsibilities

Типы см. `reference-data-registry.md`.

Каждая ответственность имеет validity.

## Permissions

См. `permissions-registry.md`.

Ключевые:

- assets.read
- assets.create
- assets.change
- assets.move
- assets.replace
- assets.decommission
- assets.manage_responsibility

## Public contracts

- AssetsModuleInfo (technical bootstrap contract; не содержит business data актива)
- AssetReference
- AssetMaintenanceContext
- AssetOperationalContext
- GetAssetContext
- ValidateAssetScope

## Events

Ключевые:

- AssetCreated
- AssetCommissioned
- AssetMoved
- AssetReplaced
- AssetDecommissioned
- AssetResponsibilityChanged

## Dependencies

Allowed:

- Sites.Contracts
- Documents.Contracts
- Identity authorization abstractions

Forbidden:

- Maintenance.Infrastructure
- WorkOrders.Infrastructure

## API examples

```text
POST /api/v1/assets
GET /api/v1/assets/{id}
GET /api/v1/assets
POST /api/v1/assets/{id}/move
POST /api/v1/assets/{id}/replace
POST /api/v1/assets/{id}/decommission
```

## History

- `assets.assets` — current state;
- `assets.asset_events` — business history;
- `audit.events` — who changed data.

## Tests

- site/location mismatch;
- model/type mismatch;
- parent-child cycle;
- unauthorized contractor;
- replacement preserves old history;
- decommission concurrency;
- responsibility validity.

## Forbidden

- physical delete;
- one generic responsible field;
- QR identity based on location;
- giant EAV for all core attributes;
- direct updates from WorkOrders/Maintenance.
