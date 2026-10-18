# Assets Context Capsule

SOURCE_VERSION: 2026-10-19; published AssetModel baseline b3599a4acc29fc21a6f48327f88385bbb280799c; MODEL-PROPOSAL-01 LOCAL_IMPLEMENTED_PENDING_R1
MODULE: Assets

## PURPOSE

Assets — основной реестр оборудования и инженерных систем. Модуль хранит текущее состояние актива, его модель, состав, функциональные связи, ответственности, замены и бизнес-историю.

## IMPLEMENTATION STATUS

TASK-03.01.01 / ASSET-TYPE-01 and TASK-03.02.01 / MANUFACTURER-01 are published in
baseline 949b74c1c645e5abfbfbcf2c96e65778b891f14e. TASK-03.02.02 / ASSET-MODEL-01 is
published at b3599a4acc29fc21a6f48327f88385bbb280799c, including reviewed F1/F2 fixes.
TASK-03.02.03 / MODEL-PROPOSAL-01 is a separately authorized local implementation
with all mandatory local checks passed; independent review/publication remain pending. Asset creation,
attributes, composites and frontend remain out of scope. Registration uses
AddAssetsModule(configuration) and AssetsDbContext.

The published ASSET-TYPE-01F1 SEC-01 remediation removes public caller-created target facts.
CanManageExistingAsync accepts context/targetID/operation/destinationID only and
resolves persisted direction/parent/ancestry in the same scoped Assets store, after
the existing command taxonomy lock. Missing direction/target/ancestor, cycles,
cross-direction or ACTIVE-under-INACTIVE ancestry deny even with GLOBAL. CanCreateAsync
resolves the existing parent; requested root direction is business intent, with
Organization selectability and homogeneity validated by the command. A separate
HasGlobalManagementAsync eligibility check preserves missing-target404 concealment;
it never authorizes an existing target. No public fact-bearing overload remains.
Real Identity/PostgreSQL public-contract negatives and retained lifecycle races guard
the change. The fix is part of the published baseline; Manufacturer does not change
AssetType schema/HTTP/permissions/lock/Audit semantics.

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
leases/fencing and stable idempotent event IDs. Published migration
20261009093315_AddAssetTypes created type/Audit obligation tables and immutable/no-delete
guard; Down refuses business or Audit history. Published hosted CI: run 38028823398.

## MANUFACTURER-01 PUBLISHED IMPLEMENTATION

Assets owns Manufacturer. The published implementation stores UUIDv7 id, trimmed display name
(1..200 Unicode scalar values), derived normalized_name, verification_status
UNVERIFIED/VERIFIED, lifecycle_status ACTIVE/INACTIVE, nullable verified_by/verified_at,
created_at/updated_at and positive row_version. Unicode 17.0.0 is pinned in the
embedded normalizer table (SHA-256 `d416472fd51d6a0ac065deb3dcfc90b97ff839971888d2c442f54e54ff8d8079`):
collapse Unicode White_Space, trim, NFC, default full locale-independent case fold,
NFC. Punctuation and display spelling are preserved; no transliteration, aliases or
seeds. The globally unique normalized_name index covers every lifecycle state and
resolves duplicate races as MANUFACTURER_NAME_ALREADY_EXISTS. PostgreSQL collation is
`C`; normalized storage bounds are 600 scalars/2400 UTF-8 bytes.

Create gives ACTIVE + UNVERIFIED. Only explicit verify transitions an ACTIVE
UNVERIFIED row and derives actor/time server-side. Revoke requires a trimmed 1..500
reason, works while inactive and clears current verified metadata. Actual name change
resets verification; no-op name update is a conflict. Activation/deactivation leave
verification unchanged. Existing rows remain resolvable; only ACTIVE + VERIFIED is
eligible for AssetModel creation.

Read requires ACTIVE INTERNAL local user + owned current INTERNAL context and current
`assets.read` or `assets.manage_manufacturers` through published Identity providers.
Recognized concrete/composite or explicit GLOBAL assignment may establish read
eligibility; the result is the global unfiltered catalog. Management requires exact
explicit GLOBAL `assets.manage_manufacturers`. Concrete/geographic/direction/type
scopes and `assets.manage_types`/`assets.manage_models` never manage Manufacturers.
Routes are GET collection/detail, POST create/verify/revoke-verification/activate/
deactivate, and PUT name update under `/api/v1/manufacturers`; no DELETE. Search is
normalized prefix, filters both independent statuses, page 1/size 50/max 200,
`normalized_name,id` order, database-side and escaped. Detail includes rowVersion but
not verified actor/time.

Every mutation and one Assets-owned Manufacturer Audit obligation commit atomically.
Registered actions are ManufacturerCreated, ManufacturerUpdated, ManufacturerVerified,
ManufacturerVerificationRevoked, ManufacturerActivated and ManufacturerDeactivated.
Migration `20261010074714_AddManufacturers` owns the table/index/check/FK/guard and
narrow Audit extension; Down refuses Manufacturer data/history. Identity migration
`20261010074801_AddManufacturerManagementPermission` is data-only, creates no grants,
roles or assignments. Manufacturer backend is published in baseline 949b74c1.

## ASSET-MODEL-01 PUBLISHED IMPLEMENTATION

AssetModel is an Assets-owned UUIDv7 row with exactly one immutable ManufacturerId and
AssetTypeId, required `model_code` (max 100 Unicode scalar values), required
`model_name` (max 200 scalars), server-derived normalized keys, independent
UNVERIFIED/VERIFIED and ACTIVE/INACTIVE statuses, server verification actor/time,
timestamps and positive rowVersion. Model-code normalization pins Unicode 17.0.0:
Unicode trim, NFC, full case fold, NFC; internal whitespace and punctuation remain
significant. Model-name search uses the existing Manufacturer normalization.
`UNIQUE(manufacturer_id, asset_type_id, normalized_model_code)` covers all statuses;
concurrent duplicates return `MODEL_CODE_ALREADY_EXISTS`.

Create starts ACTIVE + UNVERIFIED. Explicit verify requires the Model UNVERIFIED,
Manufacturer ACTIVE + VERIFIED and AssetType ACTIVE. Code/name change invalidates
verification; explicit revoke requires a trimmed reason 1..500. Lifecycle is independent,
uses explicit activate/deactivate commands and does not change verification. Parent state
changes do not cascade; historical references remain readable. New Asset selection also
requires Model ACTIVE + VERIFIED and exact AssetType equality, with no descendant
inheritance; Asset persistence is not implemented here.

Management requires exact `assets.manage_models`, ACTIVE INTERNAL user and owned valid
INTERNAL context. Explicit GLOBAL or persisted AssetType subtree coverage is allowed;
subtree root is included, optional direction intersects within the same assignment,
geography and direction-only assignments are ineligible, and assignments never
synthesize a combined scope. `assets.manage_models` does not imply `assets.read`.
General catalog uses exact `assets.read` and Models' own ACTIVE + VERIFIED statuses,
independent of parent state; parent eligibility still gates new Asset selectability.
Management catalog exposes all Model states. Authorized catalog roots are defensively
copied into an immutable server-created snapshot. Search is PostgreSQL exact/
normalized-prefix only, literal wildcard escaped, ordered by normalized code/id, page
1/size 50/max 200.

Every command acquires exclusive transaction-scoped ASTY `(1095980121,1)` under READ
COMMITTED. Parent validation acquires Manufacturer `FOR SHARE` after ASTY and before
trusted Identity authorization; the locks and Model+Audit mutation remain through commit.
Future Asset creation uses shared ASTY plus compatible Manufacturer locking. Canonical
Audit actions are ModelCreated/ModelUpdated/ModelVerified/ModelVerificationRevoked/
ModelActivated/ModelDeactivated. Migration `20261018023154_AddAssetModels` extends the
Assets schema and Audit obligation; Down refuses Assets master-data/Audit history to
prevent partial multi-migration rollback. No Identity
permission, seed, frontend, Asset create, proposal workflow or production Model seed is
added by the published Model phase. Published SHA is b3599a4acc29fc21a6f48327f88385bbb280799c.
The Proposal phase extends direct Model Create and normalized-code-changing Update
with reserved-destination 409 MODEL_CODE_RESERVED_BY_PROPOSAL under existing ASTY.

## MODEL-PROPOSAL-01 LOCAL_IMPLEMENTED_PENDING_R1

Assets owns ModelProposal/current state, immutable ModelProposalRevision and append-only
ModelProposalHistory in three assets.model_proposal* tables. Accepted OD-01..14 fix
SUBMITTED -> NEEDS_INFORMATION/ACCEPTED/REJECTED/WITHDRAWN; NEEDS_INFORMATION ->
SUBMITTED correction/WITHDRAWN; ACCEPTED -> CANCELLED/PROMOTED. Every transition
increments version once, appends history and Proposal obligation; only create/correction
add full revisions. Required request/response/reject/cancel text has 500 Unicode scalars;
accept/withdraw text optional. Code/name retain pinned Unicode17 Model semantics.

Exact assets.propose_models requires original author for reads/correction/withdraw,
even GLOBAL. assets.manage_models independently permits management reads and non-author
review/cancel/Promote; no GLOBAL self-decision exception. ACTIVE INTERNAL/owned current
INTERNAL context and valid exact permission are mandatory. Concrete scope requires
persisted type subtree, optional same-tuple direction at every recursive step and no
geography. Correction authorizes old/new types independently; no dimension synthesis
or caller-created targets/scopes. Historical reads use owning current Proposal scope.

SUBMITTED/NEEDS_INFORMATION/ACCEPTED reserve Manufacturer+type+normalized code.
Partial UNIQUE plus exclusive ASTY covers Proposal changes and Model Create/code Update.
Submit/correction/review need existing parents only; first Promote checks Manufacturer
ACTIVE+VERIFIED/type ACTIVE under ASTY then Manufacturer FOR SHARE. Dedicated strict
Proposal save boundary atomically writes transition/history/required revision, optional
ACTIVE+UNVERIFIED Model and Proposal plus ModelCreated obligations. Existing guards stay.
Failures preserve old state/reservation. Promote 201; same trusted user/original version,
currently authorized (possibly new owned context), replays 200 without writes/Audit or
parent selectability recheck. Other post-success authorized retries are state conflicts.

Author base /api/v1/asset-model-proposals; management base appends /management.
Both GET list/detail/revisions/revision detail; author POST create/revisions/withdraw;
management POST request-information/accept/reject/cancel/promote. Full correction uses
response; decisions use text; Promote only expectedRowVersion. Detail {proposal,history};
page {items,page,pageSize,totalCount}, defaults 1/50/max 200, updatedAt DESC,id ASC.
SQL author/scope precedes count/page; exact/prefix filters escape LIKE literally.
Assets migration 20261018135619_AddModelProposals; permission-only Identity migration
20261018134809_AddModelProposalPermission; no grants, business seeds, new advisory key
or delivery mechanism. Local full race/security/migration/HTTP validation passed;
independent review/publication remain pending. Detailed contract: docs/modules/assets.md.

## OWNS

- Asset
- AssetType
- Manufacturer
- AssetModel
- ModelProposal, ModelProposalRevision, ModelProposalHistory
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
- `assets.model_proposals`
- `assets.model_proposal_revisions`
- `assets.model_proposal_history`
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
