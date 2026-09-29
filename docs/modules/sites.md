# Module: Sites

STATUS: STABLE
SOURCE_VERSION: 2026-09-29 (SITE-UI-01 locally implemented)

## Purpose

Sites моделирует физические объекты эксплуатации и их внутреннюю location hierarchy.

## Owns

- Site
- SiteType
- SiteCriticalityClass
- Location
- LocationType
- TerritorialZone
- Region
- future operating/service windows

## Database

Schema:

```text
sites
```

Core tables:

```text
site_types
site_criticality_classes
territorial_zones
regions
audit_obligations
sites
location_types
locations
```

## Business rules

- BR-SIT-001 … BR-SIT-005.
- SiteType и criticality независимы.
- Location tree acyclic.
- Location принадлежит одному Site.
- Site timezone — часть operational context.

## Hierarchy

```text
Territorial Zone
→ Region
→ Site
→ Building/Floor/Room/Rack/Area
```

Territorial Zone lifecycle is `ACTIVE`/`INACTIVE`; hard delete is forbidden. Zone code is canonicalized by trim + invariant uppercase, unique and immutable. Six `/api/v1/territorial-zones` operations remain published: list/get use `sites.read`, rename/activate/deactivate use `sites.change`, and root create stays closed pending a root authority contract. Mutation bodies carry `expectedRowVersion`; stale authorized writes return `409 OPTIMISTIC_CONCURRENCY_CONFLICT`. No DELETE route exists.

Sites persists a durable audit obligation in the same transaction as a zone mutation. Operation-specific command methods derive the canonical action, zone binding and allowlisted snapshots; IDs are UUIDv7 and UpdatedAt is strictly monotonic at PostgreSQL timestamp precision. ADR-011 delivery is implemented by a technical hosted dispatcher through the Sites Application delivery port and canonical `IAuditWriter`; Sites never writes the Audit table directly.

`X-Work-Context-Id` remains request-scoped: the existing middleware validates and audits it before the endpoint, and Sites records the validated context only as `acting_context_id` obligation metadata. Context, UserType, role name and token claims do not grant any `sites.*` permission. C1 Geography routes require OIDC, an ACTIVE local profile, a selected validated working context and target-aware Sites authorization. The target-blind production grant source remains deny-by-default for unrelated routes.

The technical dispatcher claims bounded batches in a short Sites-owned PostgreSQL transaction using `FOR UPDATE SKIP LOCKED`, persists `claim_token` and bounded `lease_until`, commits, and releases row locks before calling Audit or waiting for retry backoff. A successful or identical idempotent Audit append is followed by token-checked `PROCESSED`/`processed_at`; failures remain `PENDING`, increment failed-attempt count, clear the claim, and persist bounded `next_attempt_at` scheduling with a sanitized diagnostic. Lease expiry recovers crashed workers, stale tokens cannot overwrite a later owner's state, and poison obligations cannot monopolize newer work. This provides restart-safe at-least-once delivery without RabbitMQ, a global DbContext or cross-module SQL.

Region is Sites-owned and belongs to exactly one Territorial Zone. Its canonical table is `sites.regions`; `territorial_zone_id` is immutable and uses a restrictive foreign key. Region lifecycle is `ACTIVE`/`INACTIVE`, starts `ACTIVE`, forbids hard delete, and leaves existing children and historical references valid when inactive. New Regions require an `ACTIVE` parent; new Sites/objects under an inactive Region are forbidden, while existing references remain queryable. Region code is trimmed and invariant-uppercase, matches `^[A-Z0-9][A-Z0-9_-]{0,49}$`, is immutable, and is unique within its parent zone. Name is trimmed, non-empty, maximum 200 and mutable. Timezone is a canonical IANA identifier string (maximum 100), validated deterministically against the approved local timezone provider/list; UTC offsets are not authoritative.

Region API routes are `GET /api/v1/regions`, `GET /api/v1/regions/{id}`, `POST /api/v1/regions`, `PUT /api/v1/regions/{id}`, and explicit `activate`/`deactivate` commands. List supports an optional `territorialZoneId` filter. PUT changes only `name` and `timezone` and requires `expectedRowVersion`; parent, code and status are immutable through PUT. Reads use `sites.read`, creation uses `sites.create` on the authoritative parent Zone, and update/lifecycle commands use `sites.change`. C1 integrates Sites-owned direct target coverage and authorized lists using Identity `IEffectiveScopeProvider` plus Sites SQL filtering.

Under the frozen B2-A list contract, Territorial Zone rows match only effective TerritorialZone IDs. Region rows match effective Region IDs or have a persisted `territorial_zone_id` in the effective TerritorialZone set. This is downward Zone → Region coverage only; Region scope never returns its parent Zone. An empty or unsupported scope set returns an empty result or contributes no IDs, never an unfiltered query; duplicate scope inputs do not duplicate business rows. Filtering occurs in Sites PostgreSQL queries. Sites does not query Identity persistence. The target resolver reads Zone existence or the Region's persisted parent without an ACTIVE filter and does not authorize. Direct target checks combine these facts with Identity effective scopes inside Sites. C1 enables only Zone/Region HTTP route integration; SITE-AUTH-01 publishes Site authorization services without HTTP routes.
The C1 HTTP response is a transport DTO containing only `id`, `territorialZoneId`, `code`, `name`, `timezone`, `status`, `createdAt`, `updatedAt`, and `rowVersion`; no DELETE route is exposed. Stale authorized update and lifecycle writes return `OPTIMISTIC_CONCURRENCY_CONFLICT`. C1-OD-01 makes absent and out-of-scope direct Zone/Region targets and Region-create parent Zones indistinguishable as 403; unauthenticated requests return 401. Lists with no effective scopes return 200 `[]`.

ADR-016 / B2-R1 implements the remediation boundary after F1/F2 review. Public Sites direct operations accept user/context, canonical permission and only a Zone or Region ID; Sites loads the authoritative Region parent and obtains exact scopes through Identity `IEffectiveScopeProvider` before evaluating coverage. Region creation uses the Zone ID as business input and requires `sites.create` Zone coverage. Public `IAuthorizedGeographyReadService` lists obtain fixed `sites.read` scopes internally, then apply normalized IDs in Sites SQL. The raw SQL methods and concrete service are internal to Sites Infrastructure; no public scope-bearing read request/store or permission-string evidence remains. C1 integrates these services into Geography HTTP routes, without changing the global target-blind grant source.

Region mutations create exactly one Sites-owned durable audit obligation atomically with the business change. The canonical Audit entity is `Region`; actions are `RegionCreated`, `RegionUpdated`, `RegionActivated`, and `RegionDeactivated`. The existing obligation/delivery mechanism is generalized additively with entity/action/payload allowlists and a Region binding; no second outbox or direct write to `audit.events` is introduced.

SiteType is a Sites-owned configurable reference in `sites.site_types`, separate
from SiteCriticality. The additive migration seeds exactly the four approved
codes and Russian names in `reference-data-registry.md` with stable UUIDv7
IDs. The values are an initial set, not an enum. Code is immutable and
globally unique; `ACTIVE`/`INACTIVE` replaces the earlier provisional
`is_active` column. Creation starts ACTIVE, hard delete is blocked by the
database, and inactive rows remain readable for historical references.
`GET /api/v1/reference/site-types` uses the catalog authorization below, returns all types
ordered by code, and exposes only id, code, name, description and status.
No SiteType mutation API, additional permission or audit obligation exists in
that reference task. Full administration is deferred to a separate future
task. `TASK-02.03.03` Phase A requires ACTIVE SiteType for a new or changed
Site assignment; an existing Site may retain an INACTIVE type.

SiteCriticalityClass is implemented by `TASK-02.03.02` Phase B as a Sites-owned
extensible reference in
`sites.site_criticality_classes`, separate from SiteType. The approved initial
codes, Russian names and ranks are in `reference-data-registry.md`. Higher
persisted integer rank means higher criticality; rank is non-negative and
unique across active and inactive classes. Business logic must not compare
code strings or enum ordinals. Seed IDs use the established SiteType fixed
UUIDv7 mechanism, with separate values; code is canonical uppercase,
immutable and unique. Description is nullable. Lifecycle is
`ACTIVE`/`INACTIVE`, with ACTIVE seeds, no hard delete and no cascade.
Inactive classes remain valid for existing references and visible through
the read API; `TASK-02.03.03` Phase A rejects them for new assignments.
Migration `20260926064400_AddSiteCriticalityClasses` creates the table,
constraints, identity/delete guard and four migration-owned seed rows.

The implemented `GET /api/v1/reference/site-criticality-classes` uses the catalog
authorization below. It returns `id`, `code`, `name`, `rank`, `description`,
`status` for both statuses, ordered by rank ASC then code ASC, without paging
or geographic filtering. Expected responses are 200, 401 and 403.
No management route or mutation audit action is in this task; future management
must define audit actions using the established durable Sites obligation.

## Permissions

- sites.read
- sites.create
- sites.change
- sites.manage_locations
- sites.change_criticality

### Site reference catalog authorization — SITE-REF-AUTH-01

SITE-REF-OD-01: SiteType and SiteCriticalityClass are global Sites-owned
reference catalogs, not geographic targets. Reading either requires an ACTIVE
INTERNAL local user, a valid owned INTERNAL working context and at least one
current effective assignment for any one of `sites.read`, `sites.create`,
`sites.change`, `sites.change_criticality`, with exact TerritorialZone, Region
or Site scope. All four empty results, unsupported/composite assignments,
contractor/external users or contexts, wrong context and expired/future/revoked
assignments deny access. Authentication failure is 401; catalog denial is 403
with the existing error envelope. Invalid context headers keep their existing
validation response. Authorized reads return the complete existing catalog,
including INACTIVE values for history labels. New assignments still require ACTIVE values.

SITE-REF-OD-02: Catalog access implies no Site permission. `sites.create`,
`sites.change` and `sites.change_criticality` do not imply `sites.read`; no
Site/Region/Zone visibility or mutation authorization changes.

SITE-REF-OD-03: `ISiteReferenceCatalogAuthorizationService.CanReadAsync` accepts
only authenticated local user ID and working context ID (plus cancellation).
It requests the fixed four permissions sequentially through the existing
Identity `IEffectiveScopeProvider`, stops at the first supported non-empty
result and performs at most four checks. No caller-provided permission,
effective scope collection or geographic ID is accepted as catalog evidence.
Provider exceptions deny immediately; request cancellation propagates. No
hierarchy expansion or cross-module DB access occurs. Only these two GET routes
replace the legacy permission wiring; the global production grant source
remains deny-by-default. No schema/migration, new grant engine, capability or
reference mutation route is introduced. This bounded composition uses the
existing authorization model/contracts and does not require a new ADR.


## Site CRUD — TASK-02.03.03 contract and Phase B1 foundation

Owner decisions OD-01 through OD-10 are frozen. The Phase B1 foundation is
published on main: Site domain aggregate, Sites-owned table and additive
migration, and internal atomic command persistence. SITE-AUTH-01
implements exact Identity Site scope, Sites authoritative Site target/create
coverage and a SQL-filtered paginated Site list. PostgreSQL and architecture
checks and independent SITE-AUTH-01R review pass; the foundation is published.
SITE-API-01 publishes the seven Site HTTP routes after independent
SITE-API-01R security/integration review. Published Zone/Region routes are unchanged.
Site is the Sites-owned child of exactly one
Region. Site ID is UUIDv7. Required code is trimmed, invariant-uppercase,
globally unique, immutable, at most 50 characters and matches
`^[A-Z0-9][A-Z0-9_-]{0,49}$`. `region_id` is required and immutable; no
reparent route or cascade delete exists. Name is trimmed, non-empty and at
most 200 characters. Address is required trimmed `address_text` of at most
500 characters. Site stores its own required IANA timezone; it never
dynamically inherits Region timezone. Region timezone changes do not mutate
existing Sites.

Exactly one SiteType and one SiteCriticalityClass are required. Create needs
an existing ACTIVE Region, SiteType and criticality class. Changing SiteType
uses ordinary update and requires an ACTIVE new type; changing criticality
uses a separate command and requires an ACTIVE new class. Existing Sites
retain references if a parent/reference later becomes INACTIVE. Criticality
rank remains only in the reference table. Site creation takes a PostgreSQL
row lock on Region so it serializes with Region deactivation; there is no
speculative reference-row locking while reference management APIs are absent.

Site lifecycle is `ACTIVE`/`INACTIVE`, creation ACTIVE, both explicit
transitions allowed. Inactive Sites remain readable with authorization.
There is no DELETE, CLOSED status, `closed_at`, `commissioned_at`, coordinate,
geocoding, structured address or Site move in this slice. Later Assets and
WorkOrders use cases enforce their own inactive-Site rules. Ordinary update
changes only name, SiteType, address and timezone. Every mutable command
requires `expectedRowVersion`; stale writes return
`409 OPTIMISTIC_CONCURRENCY_CONFLICT`.

The published Site API uses `GET /api/v1/sites` (paginated),
`GET /api/v1/sites/{siteId}`, `POST /api/v1/sites`,
`PUT /api/v1/sites/{siteId}`, explicit `activate`/`deactivate` POST commands
and `PUT /api/v1/sites/{siteId}/criticality`. List filters are `regionId`,
`siteTypeId`, `criticalityClassId`, `status`, and `q` over code/name. Stable
order is code ASC then id ASC. It uses the existing `page`/`pageSize`
convention: default 50, maximum 200, with `items`, `page`, `pageSize`,
`totalCount`, `totalPages`. The base Site response contains only `id`,
`code`, `name`, `regionId`, `siteTypeId`, `criticalityClassId`, `address`,
`timezone`, `status`, `rowVersion`.

SITE-UI-01 adds frontend Site management at `/sites`, `/sites/new` and
`/sites/{siteId}`. The list delegates filters and pagination to the published
API and resolves Region, SiteType and criticality labels from backend data.
Create and ordinary edit use separate field sets; lifecycle and criticality
are separate commands. Catalogs and Site data are scoped in the shared query
cache by user and working context. The frontend does not decide authorization;
403 remains a neutral unavailable response. This UI has local verification
only pending independent review and is not a hosted publication claim.

ADR-014, as refined by ADR-017 under ADR-015/016, freezes Site target
authorization. Zone scope covers descendant Sites, Region scope covers Sites
in that Region, and Site scope covers only
that Site. List/get need effective `sites.read` and backend target filtering;
create needs `sites.create` covering the existing parent Region. Ordinary
update/lifecycle need `sites.change` covering the Site; criticality change
needs `sites.change_criticality` covering the Site without additionally
requiring `sites.change`. First production support is INTERNAL user/context
only; contractors remain fail-closed. The authorization foundation is
published after independent SITE-AUTH-01R review and post-integration gates;
SITE-API-01 HTTP CRUD uses this published foundation. Identity keeps scopes exact; Sites
resolves Site → Region → Zone. Site is a published exact effective-scope kind. The existing
Identity assignment schema already has `site_id`; no migration was needed.
The published authorized list obtains fixed `sites.read` scopes internally and
filters in Sites SQL before count/pagination: exact Site, parent Region or
ancestor Zone. Empty scopes yield a `200` empty page. Missing and out-of-scope
direct Sites or create parent Regions share `403 GEOGRAPHY_ACCESS_DENIED`;
denied mutations change no state, row version or audit obligation. See
ADR-017 for the contract and SITE-AUTH-01 sequence.

Canonical Audit entity `Site` has actions `SiteCreated`, `SiteUpdated`,
`SiteActivated`, `SiteDeactivated`, `SiteCriticalityChanged`. `SiteUpdated`
covers a SiteType change with field-level before/after; criticality is a
separate action. Each successful mutation atomically records one Sites-owned
durable audit obligation, using an additive Site binding in the existing
`sites.audit_obligations` and the established AuditDelivery path. Domain or
integration event names in `events-registry.md` are separate from Audit
identifiers; no extra event is invented for every ordinary update.

The B1 table enforces UUIDv7, canonical global code uniqueness, immutable
`id`/`code`/`region_id`, restrictive reference FKs, lifecycle/address/name
checks and positive optimistic `row_version`. The PostgreSQL trigger also
rejects Site hard delete. Create locks the parent Region row and checks active
Region/SiteType/SiteCriticalityClass; update checks only a newly assigned
SiteType, and criticality change checks only a newly assigned class. Existing
inactive references remain valid. Each internal mutation stores the Site and
one allowlisted audit obligation atomically. The obligation is delivered by
the existing AuditDelivery; no second outbox is introduced. B1 adds no
authorization implementation or HTTP surface.

## Public contracts

- SiteReference
- LocationReference
- SiteOperationalContext
- ValidateLocation(siteId, locationId)

## Events

- SiteCreated
- SiteCriticalityChanged
- LocationMoved

## Consumers

- Assets
- Maintenance
- Inventory
- Incidents
- Changes
- Contractors

## API examples

```text
GET /api/v1/territorial-zones
GET /api/v1/territorial-zones/{id}
POST /api/v1/territorial-zones
PUT /api/v1/territorial-zones/{id}
POST /api/v1/territorial-zones/{id}/activate
POST /api/v1/territorial-zones/{id}/deactivate

GET /api/v1/sites
POST /api/v1/sites
GET /api/v1/sites/{id}
GET /api/v1/sites/{id}/locations
POST /api/v1/sites/{id}/locations
```

## History

Criticality/location structural changes auditируются. Исторические Asset placements не теряются.

## Tests

- cross-site parent location;
- cyclic location move;
- inactive site;
- KVO criticality permission;
- region scope;
- timezone boundaries.

## Forbidden

- mixing SiteType and criticality;
- deleting a Site with operational history;
- location references across Sites;
- hardcoding KVO behavior in UI.
