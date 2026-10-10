# Module: Assets

STATUS: STABLE
SOURCE_VERSION: 4dd9aea7c8ba940d3d8715a5d54fb7a5e3c16724; AssetType published, Manufacturer local candidate (2026-10-10)

## Purpose

Assets — центральный реестр оборудования, инженерных систем, моделей, составных компонентов, связей, ответственности и lifecycle history.

## Implementation status

`TASK-03.01.01 / ASSET-TYPE-01` is published in baseline
`4dd9aea7c8ba940d3d8715a5d54fb7a5e3c16724`; hosted CI run `38028823398` passed.
`TASK-03.02.01 / MANUFACTURER-01` is a local backend implementation candidate on
that baseline and remains unpublished pending independent review. Asset, AssetModel,
attributes, composites, UI and business-history remain out of this implementation.
Module registration is `AddAssetsModule(configuration)`.

ASSET-TYPE-01F1 remediates SEC-01 from the immutable review and is part of the
published AssetType baseline.
Public `CanManageExistingAsync(context, assetTypeId, operation, destinationParentAssetTypeId?)`
accepts business IDs only, resolving target/destination and the parent chain from the
same scoped Assets read store. Missing direction/target/ancestor, cycles, mixed direction
or ACTIVE-under-INACTIVE ancestry deny, including GLOBAL. Caller-created read DTOs
cannot supply authorization facts; policy fact objects remain private. Commands invoke
this composition after the existing taxonomy lock in their own transaction.
`CanCreateAsync(context, parentAssetTypeId?, requestedFunctionalDirectionId)` resolves
an existing parent authoritatively; root direction is desired business input resolved
through Organization. Selectability/ACTIVE parent/direction homogeneity are still
separate command business validation. `HasGlobalManagementAsync` is exact-permission
eligibility only for concealed missing-target404 handling, never existing-target ALLOW.
The original DTO-based CanManageAsync overload is removed. HTTP/schema/permissions,
lock identity and Audit mechanism remain as published in the baseline.

### AssetType backend contract — 2026-10-09

TASK-03.01.01 accepted OD-ASSET-TYPE-01..08; FunctionalDirection reference and
selectability and the ADR-019 correlated Identity handoff are published. The frozen
[ASSET-TYPE-SCOPE-00 contract](../../.agent/tasks/AUTH-SCOPE-01/asset-type-scope-state.md)
records accepted 08A..08E. These contracts are enforced by the Assets Application
authorization service and locked Assets command store.

Catalog eligibility requires ACTIVE INTERNAL user, valid owned INTERNAL context
and current exact `assets.read` OR `assets.manage_types` assignment. Recognized
concrete/composite or explicit GLOBAL can qualify; the eligible catalog is global,
without row filtering. Management requires only `assets.manage_types`: explicit
GLOBAL via `IGlobalGrantProvider`, or a non-geographic complete assignment.
Direction matches the authoritative direction; type covers its persisted subtree;
both intersect within that assignment. Geographic-containing assignments cannot
manage taxonomy. Complete assignments union authority; dimensions from separate
assignments never form a synthetic grant.

Assets owns type/direction/hierarchy facts and resolves Organization references
through its Application provider. Identity supplies current permission/context-bound
facts, without querying Assets. HTTP supplies business target IDs, never grant
evidence. Type-only scope cannot create a root, move to root or move its scope root
outside the boundary. Reparent requires one complete assignment covering both
ends. Every hierarchy-dependent mutation locks then rereads ancestry before
authorization. Concrete evaluation precedes terminal GLOBAL evaluation; dependency
errors deny. See the frozen contract for the full matrix and security tests.

AssetType is an Assets-owned UUIDv7 adjacency-list node. Multiple roots and arbitrary
depth are supported without synthetic roots. Every node explicitly stores exactly
one immutable FunctionalDirection ID; parent and child must share it. Organization
Application `IFunctionalDirectionReferenceProvider` validates a new reference as
existing and selectable (ACTIVE). Existing references to INACTIVE directions remain
resolvable; direction deactivation does not cascade to types. There is no cross-schema FK.

Fields: id, parent_asset_type_id (nullable), functional_direction_id, code, name,
is_system_type, is_component_type, status, created_at, updated_at, row_version.
Code is required, trimmed, invariant uppercase, max50, regex
`^[A-Z0-9][A-Z0-9_-]{0,49}$`, immutable and globally unique across all statuses.
The database unique constraint decides duplicate races. Name is required, trimmed,
max200, mutable and non-unique. Both classification flags are independently mutable;
all four combinations are valid and imply no Asset topology or hierarchy restrictions.
No description, inherited direction, seeds or business-history subsystem is included.

Create is ACTIVE/version1. Status is ACTIVE/INACTIVE; no hard delete or lifecycle
cascade. Any ACTIVE type is selectable, including non-leaf types. INACTIVE is readable
and resolvable but not selectable. Deactivation rejects any ACTIVE descendant at any
depth. Create child, activate child and reparent require ACTIVE direct parent; therefore
ACTIVE descendants retain ACTIVE ancestors. Reparent requires a trimmed reason1..500,
same direction, and rejects self/descendant parents via authoritative PostgreSQL CTE.
The entire subtree follows the node; moving to root is permitted by GLOBAL/direction
authority and denied by any tuple with an AssetType restriction.

All mutations, including root create and ordinary updates, run READ COMMITTED:
begin transaction -> acquire `pg_advisory_xact_lock(1095980121, 1)` -> clear tracked
facts -> reread target/destination/subtree/current Identity assignment facts ->
evaluate whole assignments -> validate business rules/expected rowVersion ->
persist entity plus Assets-owned Audit obligation -> commit. The key is the two-int
namespace ASCII ASTY, taxonomy1; PostgreSQL separates this keyspace from existing
Sites/Organization bigint locks. It is global for the complete AssetType taxonomy.
The lock remains held through atomic Audit commit. Concurrent scope-changing reparent
cannot leave a waiting mutation authorized by stale ancestry. No automatic retry of
stale versions occurs; all existing-row mutations require expectedRowVersion.

API (authenticated, ACTIVE INTERNAL, owned current INTERNAL context):

| Method | Path | Input / result |
|---|---|---|
| GET | `/api/v1/asset-types` | parentAssetTypeId nullable: roots/direct children; optional ACTIVE/INACTIVE status; page1/pageSize50/max200; code/id order; items/page/pageSize/totalCount |
| GET | `/api/v1/asset-types/{id}` | global catalog detail including current rowVersion |
| POST | `/api/v1/asset-types` | parentAssetTypeId?, functionalDirectionId, code, name, isSystemType, isComponentType; 201 |
| PUT | `/api/v1/asset-types/{id}` | name, both flags, expectedRowVersion |
| POST | `/api/v1/asset-types/{id}/reparent` | newParentAssetTypeId?, reason, expectedRowVersion |
| POST | `/api/v1/asset-types/{id}/activate` | expectedRowVersion |
| POST | `/api/v1/asset-types/{id}/deactivate` | expectedRowVersion |

No DELETE route exists. Unauthenticated is401; ineligible/unauthorized is403
ACCESS_DENIED, never empty200. Eligibility precedes target parsing; locked target
coverage precedes target-specific errors. Catalog-authorized detail may return404;
missing mutation target is404 only when a GLOBAL grant independently covers it,
otherwise403. Duplicate code is409 ASSET_TYPE_CODE_ALREADY_EXISTS; stale version is409
OPTIMISTIC_CONCURRENCY_CONFLICT; hierarchy/reference/state rejection uses stable409
codes. Transport validation is400 and unavailable dependencies produce sanitized503.
Unmapped JSON members (permission/scope/ancestry/actor/timestamps) are rejected.

`IAssetTypeReferenceProvider.GetReferenceAsync` returns immutable scalar facts,
null for missing and IsSelectableForNewReference solely from ACTIVE status. It exposes
no EF entity and grants no end-user access. Future Asset consumers are not implemented.

Every successful mutation adds one `assets.audit_obligations` row with canonical
AssetTypeCreated/Updated/Reparented/Activated/Deactivated action, server actor/context,
UTC time, correlation, exact before/after facts (including old/new parent) and reparent
reason. Denied/invalid/duplicate/stale/no-op commands commit neither entity nor success
Audit. No direct Audit DbContext access: Assets claim/lease port and technical dispatcher
reuse SKIP LOCKED, stable auditEventId, idempotent Audit append, fenced completion,
bounded retries/backoff and sanitized diagnostics. Claim state survives restart.

Migration `20261009093315_AddAssetTypes` is the published AssetType foundation.
MANUFACTURER-01 adds the single follow-up Assets migration
`20261010074714_AddManufacturers`, extending the local durable Audit-obligation
contract while preserving AssetType constraints. Rollback refuses Manufacturer data
or Audit history. The separate Identity migration `20261010074801_AddManufacturerManagementPermission`
only materializes the canonical permission row; it changes no Identity schema, roles,
assignments or grants. Neither task creates Manufacturer values; production contains
no Manufacturer seed data. Frontend production is unchanged.

## Manufacturer backend contract — MANUFACTURER-01 local candidate, 2026-10-10

Manufacturer is an Assets-owned configurable reference. This local implementation is
not published. Its contract uses UUIDv7 `id`; required trimmed display `name` (at most
200 Unicode scalar values); server-derived `normalized_name`; independent
`verification_status` (`UNVERIFIED`/`VERIFIED`) and `lifecycle_status` (`ACTIVE`/
`INACTIVE`); nullable `verified_by`/`verified_at`; UTC `created_at`/`updated_at`; and
positive optimistic `row_version`. There is no code, description, alias, merge, seed,
hard delete or proposal workflow.

The deterministic key pipeline collapses Unicode White_Space runs to ASCII space,
trims boundary whitespace, applies NFC, Unicode Default Full Case Folding, then NFC.
Tables are pinned to Unicode 17.0.0 and embedded with SHA-256
`d416472fd51d6a0ac065deb3dcfc90b97ff839971888d2c442f54e54ff8d8079`. Case folding
is locale independent; punctuation, suffixes and visual lookalikes are preserved.
The display spelling is stored separately. Output bounds are 600 Unicode scalars and
2,400 UTF-8 bytes. Unicode source and table licensing is included in the domain data
folder; see [Unicode 17.0.0 UCD](https://www.unicode.org/Public/17.0.0/ucd/) and
[Unicode License v3](https://www.unicode.org/license.txt).

`normalized_name` is globally unique for ACTIVE and INACTIVE rows under PostgreSQL
`C` collation. `ux_manufacturers_normalized_name` is authoritative under concurrent
creates and renames; duplicates map to 409 `MANUFACTURER_NAME_ALREADY_EXISTS`.
`ix_manufacturers_normalized_name_id` supports normalized prefix search and stable
`normalized_name,id` ordering. Search is database-side and literal-prefix escaped;
it supports verification/lifecycle filters, page default 1, size default 50, max 200.

Create is ACTIVE + UNVERIFIED. Only an explicit command verifies an ACTIVE,
UNVERIFIED row, deriving actor/time from trusted server context. Revocation requires a
trimmed 1..500 reason, is allowed while INACTIVE and clears current metadata. A real
display-name change resets VERIFIED to UNVERIFIED and clears current metadata; an
unchanged name is a state conflict. Activation/deactivation do not change verification.
`IManufacturerReferenceProvider` returns scalar facts or null when missing and marks
only ACTIVE + VERIFIED as selectable for a new AssetModel; inactive/unverified rows
remain resolvable. AssetModel is not implemented here.

All APIs require an ACTIVE INTERNAL local user and owned current INTERNAL context.
`assets.read` or `assets.manage_manufacturers` through published Identity providers
allows the global unfiltered catalog. A recognized concrete/composite assignment
can establish read eligibility but never filters rows or grants management.
Management requires an explicit effective GLOBAL grant for the exact
`assets.manage_manufacturers` permission; concrete scopes and `assets.manage_types`/
`assets.manage_models` do not qualify. Permission existence alone grants nobody access.

| Method | Path | Contract |
|---|---|---|
| GET | `/api/v1/manufacturers` | Optional normalized prefix `q`, verification/lifecycle filters; page/pageSize |
| GET | `/api/v1/manufacturers/{id}` | Authorized detail includes `rowVersion`; omits verified actor/time |
| POST | `/api/v1/manufacturers` | `{ name }`; creates ACTIVE + UNVERIFIED |
| PUT | `/api/v1/manufacturers/{id}` | `{ name, expectedRowVersion }` |
| POST | `/api/v1/manufacturers/{id}/verify` | `{ expectedRowVersion }` |
| POST | `/api/v1/manufacturers/{id}/revoke-verification` | `{ reason, expectedRowVersion }` |
| POST | `/api/v1/manufacturers/{id}/activate` | `{ expectedRowVersion }` |
| POST | `/api/v1/manufacturers/{id}/deactivate` | `{ expectedRowVersion }` |

No DELETE exists. Unknown/caller-supplied normalized, status, actor, permission or
scope fields are rejected. Stale writes return 409 `OPTIMISTIC_CONCURRENCY_CONFLICT`;
invalid transitions return 409 `MANUFACTURER_STATE_CONFLICT`. Unauthorized management
is denied before target lookup. PostgreSQL persists each entity mutation and matching
Assets Audit obligation in one transaction using canonical
ManufacturerCreated/Updated/Verified/VerificationRevoked/Activated/Deactivated
actions, server actor/context, before/after snapshots and revocation reason. Audit
delivery uses the existing canonical dispatcher and remains idempotent.

The current implementation references [ADR-001](../adr/ADR-001-modular-monolith.md),
[ADR-003](../adr/ADR-003-uuidv7-identifiers.md),
[ADR-008](../adr/ADR-008-business-history-audit-separation.md),
[ADR-011](../adr/ADR-011-durable-audit-obligation-outbox.md),
[ADR-018](../adr/ADR-018-explicit-global-assignment-scope.md) and
[ADR-019](../adr/ADR-019-correlated-assignment-scope-facts.md); no accepted ADR body
was changed.

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
