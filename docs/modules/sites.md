# Module: Sites

STATUS: STABLE
SOURCE_VERSION: 2026-09-26 (TASK-02.03.01 SiteType)

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

Territorial Zone lifecycle is `ACTIVE`/`INACTIVE`; hard delete is forbidden. Zone code is canonicalized by trim + invariant uppercase, unique and immutable. Phase C1 exposes a query DTO over Sites persistence and six `/api/v1/territorial-zones` operations: list/get require `sites.read`, create requires `sites.create`, and rename/activate/deactivate require `sites.change`. Mutation bodies carry `expectedRowVersion`; stale writes return `409 OPTIMISTIC_CONCURRENCY_CONFLICT`. No DELETE route exists.

Sites persists a durable audit obligation in the same transaction as a zone mutation. Operation-specific command methods derive the canonical action, zone binding and allowlisted snapshots; IDs are UUIDv7 and UpdatedAt is strictly monotonic at PostgreSQL timestamp precision. ADR-011 delivery is implemented by a technical hosted dispatcher through the Sites Application delivery port and canonical `IAuditWriter`; Sites never writes the Audit table directly.

`X-Work-Context-Id` remains request-scoped: the existing middleware validates and audits it before the endpoint, and Sites records the validated context only as `acting_context_id` obligation metadata. Context, UserType, role name and token claims do not grant any `sites.*` permission. Production authorization remains deny-by-default.

The technical dispatcher claims bounded batches in a short Sites-owned PostgreSQL transaction using `FOR UPDATE SKIP LOCKED`, persists `claim_token` and bounded `lease_until`, commits, and releases row locks before calling Audit or waiting for retry backoff. A successful or identical idempotent Audit append is followed by token-checked `PROCESSED`/`processed_at`; failures remain `PENDING`, increment failed-attempt count, clear the claim, and persist bounded `next_attempt_at` scheduling with a sanitized diagnostic. Lease expiry recovers crashed workers, stale tokens cannot overwrite a later owner's state, and poison obligations cannot monopolize newer work. This provides restart-safe at-least-once delivery without RabbitMQ, a global DbContext or cross-module SQL.

Region is Sites-owned and belongs to exactly one Territorial Zone. Its canonical table is `sites.regions`; `territorial_zone_id` is immutable and uses a restrictive foreign key. Region lifecycle is `ACTIVE`/`INACTIVE`, starts `ACTIVE`, forbids hard delete, and leaves existing children and historical references valid when inactive. New Regions require an `ACTIVE` parent; new Sites/objects under an inactive Region are forbidden, while existing references remain queryable. Region code is trimmed and invariant-uppercase, matches `^[A-Z0-9][A-Z0-9_-]{0,49}$`, is immutable, and is unique within its parent zone. Name is trimmed, non-empty, maximum 200 and mutable. Timezone is a canonical IANA identifier string (maximum 100), validated deterministically against the approved local timezone provider/list; UTC offsets are not authoritative.

Region API routes are `GET /api/v1/regions`, `GET /api/v1/regions/{id}`, `POST /api/v1/regions`, `PUT /api/v1/regions/{id}`, and explicit `activate`/`deactivate` commands. List supports an optional `territorialZoneId` filter. PUT changes only `name` and `timezone` and requires `expectedRowVersion`; parent, code and status are immutable through PUT. Reads use `sites.read`, creation uses `sites.create`, and update/lifecycle commands use `sites.change`; scope evaluation remains deny-by-default and is deferred to the authorization scope evaluation task where not yet implemented.
The C1 HTTP response is a transport DTO containing only `id`, `territorialZoneId`, `code`, `name`, `timezone`, `status`, `createdAt`, `updatedAt`, and `rowVersion`; no DELETE route is exposed. Stale update and lifecycle writes return `OPTIMISTIC_CONCURRENCY_CONFLICT`.

Region mutations create exactly one Sites-owned durable audit obligation atomically with the business change. The canonical Audit entity is `Region`; actions are `RegionCreated`, `RegionUpdated`, `RegionActivated`, and `RegionDeactivated`. The existing obligation/delivery mechanism is generalized additively with entity/action/payload allowlists and a Region binding; no second outbox or direct write to `audit.events` is introduced.

SiteType is a Sites-owned configurable reference in `sites.site_types`, separate
from SiteCriticality. The additive migration seeds exactly the four approved
codes and Russian names in `reference-data-registry.md` with stable UUIDv7
IDs. The values are an initial set, not an enum. Code is immutable and
globally unique; `ACTIVE`/`INACTIVE` replaces the earlier provisional
`is_active` column. Creation starts ACTIVE, hard delete is blocked by the
database, and inactive rows remain readable for historical references.
`GET /api/v1/reference/site-types` requires `sites.read`, returns all types
ordered by code, and exposes only id, code, name, description and status.
No SiteType mutation API, additional permission or audit obligation exists in
this task. Full administration is deferred to a separate future task; the
new-Site eligibility rule for inactive types is deferred to `TASK-02.03.03`
or a separate owner decision.

## Permissions

- sites.read
- sites.create
- sites.change
- sites.manage_locations
- sites.change_criticality

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
