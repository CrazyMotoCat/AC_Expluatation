# Sites Context Capsule

SOURCE_VERSION: 2026-09-29 (SITE-UI-01 locally implemented)
MODULE: Sites

## PURPOSE

Модуль Sites хранит физическую географию эксплуатации: территориальные зоны, регионы, объекты и внутреннюю иерархию locations. Тип объекта и его критичность являются независимыми характеристиками.

## OWNS

- Site
- TerritorialZone
- Region
- SiteType
- SiteCriticalityClass
- Location
- LocationType
- future SiteOperatingSchedule
- future SiteServiceWindow

Territorial Zone в текущем backlog contract принадлежит Sites; Region и Site строятся поверх этой иерархии. Organization остаётся отдельной границей для будущих организационных связей.

## DB

Основные таблицы:

- `sites.site_types`
- `sites.site_criticality_classes`
- `sites.sites`
- `sites.territorial_zones`
- `sites.regions`
- `sites.audit_obligations`
- `sites.location_types`
- `sites.locations`
- future `sites.site_operating_schedules`
- future `sites.site_service_windows`

TerritorialZone IDs and Sites audit event IDs are UUIDv7. Zone command persistence derives the canonical action and allowlisted before/after payload from the operation; audit obligation binding is `territorial_zone_id` → `sites.territorial_zones.id`.

Region is Sites-owned. `sites.regions.territorial_zone_id` is a restrictive, immutable parent reference. Region IDs are UUIDv7; code is canonical uppercase and unique within the parent zone; name is mutable; timezone is a canonical IANA identifier string limited to 100 characters. The approved local timezone provider/list validates values without network access.

Phase C1 implements read/list/create/rename/activate/deactivate use cases and an unpersisted query DTO. All successful writes atomically leave exactly one matching `PENDING` obligation. The technical hosted dispatcher adds restart-safe at-least-once delivery: Sites persistence claims bounded batches with `FOR UPDATE SKIP LOCKED`, persists `claim_token`/bounded `lease_until`, commits before canonical Audit append, and uses token-checked completion/failure updates. A lease-expired claim is reclaimable; failed delivery persists bounded `next_attempt_at` backoff so poison rows do not starve newer obligations. Canonical Audit append preserves the stored payload/EventId, and only append success/idempotent success permits `PROCESSED`.

Failed delivery stays `PENDING`; `attempt_count` counts failed canonical append attempts and `last_error` is a bounded diagnostic code without exception messages, tokens or connection strings. PostgreSQL remains the durable source of truth; RabbitMQ is not in this correctness path.

## HIERARCHY

Физическая структура:

```text
Company
→ Territorial Zone
→ Region
→ Site
→ Location tree
```

Location tree может содержать:

```text
BUILDING
FLOOR
ROOM
RACK
AREA
PLATFORM
```

## SITE TYPES

Approved initial seed:

- RETAIL_OFFICE
- ADMIN_BUILDING
- WAREHOUSE
- TECHNICAL_SITE

Тип объекта не определяет его критичность.

SiteType is a Sites-owned configurable database reference, not a closed enum.
The four codes above have the exact Russian names in `reference-data-registry.md`.
Its UUIDv7 ID and canonical immutable code identify the type; name is mutable.
`ACTIVE`/`INACTIVE` replaces the earlier provisional `is_active` column;
creation starts ACTIVE, hard delete is forbidden, and inactive rows remain
readable for history. The current API is only
`GET /api/v1/reference/site-types` under SITE-REF-AUTH-01 catalog authorization, ordered by code.
Mutation API, mutation permissions and audit obligations are deferred to a
separate management task. `TASK-02.03.03` Phase A now requires ACTIVE type
for a new or changed Site assignment; existing Site references remain valid.

## CRITICALITY

Approved initial seed: NORMAL/Обычный/0, KVO3/КВО-3/10,
KVO2/КВО-2/20, KVO1/КВО-1/30. This is an extensible Sites-owned reference;
its Sites persistence and additive migration are implemented in Phase B;
the public API is implemented in Phase C.
Rank is non-negative, unique across the catalog and compared from persisted
data; higher means more critical. Fixed UUIDv7 seed IDs follow the SiteType
mechanism. Code is canonical, immutable and unique; nullable description
follows SiteType. ACTIVE/INACTIVE classes are both readable, with no hard
delete; `TASK-02.03.03` Phase A rejects inactive classes for new assignments.
The global GET `/api/v1/reference/site-criticality-classes` uses
SITE-REF-AUTH-01 catalog authorization, returns id/code/name/rank/description/status,
and orders by rank then code. It has no geographic target filtering. No runtime
catalog management or mutation audit is included in TASK-02.03.02.

## REFERENCE CATALOG AUTHORIZATION

SITE-REF-OD-01: both global catalogs require ACTIVE INTERNAL local user,
valid owned INTERNAL context and any current effective assignment for one of
sites.read / sites.create / sites.change / sites.change_criticality with exact
TerritorialZone, Region or Site scope. Empty scopes, contractor/external,
wrong context and future/expired/revoked assignments deny (403); authentication
failure is 401. Both ACTIVE and INACTIVE catalog entries remain globally readable.
SITE-REF-OD-02: catalog access grants no Site operation or geographic visibility;
permissions remain independent. New reference assignments require ACTIVE values.
SITE-REF-OD-03: Sites Application ISiteReferenceCatalogAuthorizationService accepts
only authenticated local user/context IDs; fixed permissions are requested internally
via Identity IEffectiveScopeProvider (sequential, maximum four, stop at first match).
No caller permission/scope/target evidence, hierarchy expansion or cross-schema access.
Provider exception denies; cancellation propagates. Only the two reference GETs
switch composition; global grants and existing Site/Zone/Region authorization stay unchanged.

## INVARIANTS

- Site принадлежит одному Region.
- Region принадлежит одной Territorial Zone.
- Site имеет один основной timezone.
- Site type и criticality — разные измерения.
- Location принадлежит ровно одному Site.
- Parent Location должен принадлежать тому же Site.
- Location tree не должен содержать циклы.
- Inactive location нельзя использовать для новых placements без специального процесса.
- Inactive Site нельзя использовать для новых Assets/Work Orders; enforcement
  belongs to the future Assets/WorkOrders use cases. CLOSED is not a
  TASK-02.03.03 Site lifecycle state.
- Territorial Zone creation starts `ACTIVE`; lifecycle removal is deactivation, not hard delete.
- Territorial Zone code is trimmed, invariant-uppercase, unique and immutable; name is trimmed, non-empty, maximum 200 and mutable.
- Region belongs to exactly one Territorial Zone; its code is trimmed, invariant-uppercase, immutable and unique within that parent; its name is trimmed, non-empty, maximum 200 and mutable.
- Region lifecycle is `ACTIVE`/`INACTIVE`; create starts `ACTIVE`, hard delete is forbidden, and existing references remain valid and queryable after deactivation.
- A Region may be created only under an `ACTIVE` Territorial Zone; parent reassignment is forbidden after creation.
- New children cannot be created under an inactive Region; no automatic child deactivation occurs.
- Region updates and lifecycle commands require optimistic `expectedRowVersion`; stale writes return `OPTIMISTIC_CONCURRENCY_CONFLICT`.
- Перемещение Location не должно разрушать историю размещения Asset.
- Критичность объекта влияет на maintenance frequency/risk, но не должна дублироваться в каждом модуле как свободный текст.
- Working/service windows архитектурно поддерживаются, но не являются обязательным P0 функционалом.

## PERMISSIONS

Типовые:

- `sites.read`
- `sites.create`
- `sites.change`
- `sites.manage_locations`
- `sites.change_criticality`

Изменение criticality — отдельная команда с `sites.change_criticality` и
Site target scope; дополнительный `sites.change` не требуется.

Territorial Zone API maps permissions exactly: list/get → `sites.read`, rename/activate/deactivate → `sites.change`; root create remains closed pending a separate authority model. C1 Geography grants are target-aware; the global target-blind grant source remains deny-by-default. UserType, role name, JWT claims and working context do not grant permission. A validated request context may be copied only to obligation `acting_context_id` metadata. Mutations require explicit `expectedRowVersion`; stale authorized writes fail with the standard 409 concurrency contract.

Region API uses the same permission keys: list/get → `sites.read`, create → `sites.create`, PUT/activate/deactivate → `sites.change`. Region and parent scope checks must not be inferred from an entity ID, role, UserType, JWT claim or working context. C1 routes call Sites-owned direct coverage and an authorized list service that obtains `sites.read` scopes through Identity and filters in Sites PostgreSQL.

`AUTH-SCOPE-01` Phase A / ADR-013 freezes target-aware geographic authorization; B2-A / ADR-015 freezes the list-scope provider and exact list rules. Zone queries match only Zone scope IDs; Region queries match exact Region IDs or the persisted parent Zone scope IDs. Coverage is downward Zone → Region only; Region does not cover a parent Zone. Empty scopes return no rows. Unsupported kinds add no IDs, duplicates do not multiply rows, and the hierarchy predicate is applied in Sites SQL. Sites loads persisted Zone/Region facts and the Region's DB-owned parent without an ACTIVE filter, then evaluates coverage using Identity effective scopes. C1 integrates Geography routes only. Root Zone creation remains closed; SITE-API-01 Site HTTP routes are published after SITE-API-01R; capabilities, Development bootstrap and contractor grants remain unimplemented. SITE-AUTH-01 Site scope and coverage are published after independent SITE-AUTH-01R review.

ADR-016 / B2-R1 implements the public boundary after F1 HIGH/F2 MEDIUM review. Sites direct authorization accepts only business Zone/Region IDs, loads authoritative Region parent from Sites persistence, requests effective scopes for the exact permission and evaluates coverage locally. Region creation loads the parent Zone and requires exact `sites.create` Zone coverage. Public `IAuthorizedGeographyReadService` lists request fixed `sites.read` scopes internally; SQL filtering is private in an internal Sites Infrastructure implementation. No public scope-bearing read request/store remains. Identity derives scopes; Sites maps them to targets. C1 enables Zone/Region routes while unrelated routes retain target-blind denial. C1-OD-01 returns uniform 403 for absent and out-of-scope direct targets or Region-create parents; no list scopes yield 200 `[]`.

`TASK-02.03.03` Phase A / ADR-014, refined by ADR-017, freezes Site as the next target level. A
Site target has authoritative zone, region and site dimensions. Zone scope
covers descendant Sites, Region scope covers that Region's Sites, and Site
scope covers only the exact Site. Zone/Region HTTP authorization is published;
Site HTTP authorization is published by SITE-API-01 after SITE-API-01R. SITE-AUTH-01 publishes exact
Identity Site scopes and Sites-owned Site → Region → Zone coverage; Site
HTTP routes are published by SITE-API-01 after independent review. Persisted `access_assignments.site_id` already
exists, so no schema change or migration was needed. Site list scopes are obtained
internally for `sites.read` and filtered in Sites SQL before count/page;
empty scopes return an empty page. Direct Site and create-parent absence is
concealed like C1 Geography, with `403 GEOGRAPHY_ACCESS_DENIED` for both
missing and out-of-scope targets. Denied commands have no state, version or
audit-obligation effects.
Scoped list filtering occurs in the backend; create checks `sites.create`
over the existing parent Region. Site authorization foundation is published
after independent SITE-AUTH-01R review; Site HTTP CRUD is published after SITE-API-01R
and verified using this foundation and the existing B1 mutation paths.
The first slice serves INTERNAL users/contexts; contractors fail closed.

Site contract: UUIDv7 ID, global immutable canonical code, immutable Region,
required name, SiteType, SiteCriticalityClass, trimmed address_text and own
IANA timezone. Creation starts ACTIVE and requires ACTIVE parent/references;
SiteType and timezone can change by ordinary update, while criticality has a
separate command. Existing inactive parent/reference associations remain
valid. ACTIVE/INACTIVE transitions and all mutable commands use optimistic
`expectedRowVersion`. No Site move, DELETE, CLOSED status, coordinates or
commissioning/closure timestamps are included. Creation serializes with
Region deactivation by locking the Region row. See `modules/sites.md` and
`api-guidelines.md` for the frozen API contract. Phase B1 domain/persistence
foundation, Site authorization and HTTP/API are published on main after their
independent reviews. SITE-UI-01 implements local Site management views for
list, detail, create, ordinary edit, lifecycle and separate criticality change.
It uses the shared authenticated client and user/context-scoped query keys;
the backend remains authoritative for every authorization decision. Capabilities
and DEV bootstrap remain unimplemented; contractor-positive authorization is
not supported. SITE-UI-01 awaits independent review before push.

## PUBLIC CONTRACTS

Предпочтительные contracts:

- `SiteReference`
- `LocationReference`
- `SiteOperationalContext`
- `ISitesModule.GetSiteContext(siteId)`
- `ISitesModule.ValidateLocation(siteId, locationId)`

Другие модули не должны напрямую писать в `sites.*`.

## EVENTS

Полезные события:

- `SiteCreated`
- `SiteStatusChanged`
- `SiteCriticalityChanged`
- `LocationCreated`
- `LocationMoved`
- `LocationDeactivated`

## DEPENDS_ON

Допустимо:

- Organization contracts;
- Identity Application authorization contracts only (`IEffectiveScopeProvider` for published direct/list Sites coverage; `IEffectiveGrantEvaluator` only for exact checks if retained); no Identity Infrastructure, `IdentityDbContext`, or `identity.*` SQL access;
- shared clock/audit abstractions.

## USED_BY

- Assets — site/location placement;
- Maintenance — site criticality and future service windows;
- Inventory — expected/actual location;
- Changes — site risk context;
- Incidents — incident site;
- Contractors — contract scopes.

## KVO RULE

Если операция затрагивает KVO:

- не придумывать автоматически дополнительные approvals;
- проверить documented policy;
- пометить `KVO_EXTRA_POLICY: CHECK_REQUIRED`, если правило ещё не определено.

## HISTORY

Изменение адреса, criticality или структуры location при необходимости должно сохранять audit/history. Не заменять историю только текущим значением, если изменение влияет на эксплуатационные решения.

## FORBIDDEN

- кодировать criticality строковыми if по всему проекту;
- смешивать SiteType и criticality;
- создавать asset location вне Site;
- допускать cyclic location tree;
- удалять Site с историческими Assets/WorkOrders;
- хранить working hours как случайный JSON внутри Site без модели;
- давать module прямой write access в `sites` schema.

## TOP_TEST_RISKS

- location from another site;
- cyclic location move;
- create asset on inactive site;
- wrong region scope;
- contractor access to site outside contract;
- KVO criticality change without permission;
- timezone-sensitive scheduling;
- inactive location selected by UI but rejected backend.
