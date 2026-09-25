# Module: Organization

STATUS: ORGANIZATIONAL UNIT VERTICAL SLICE IMPLEMENTED; PHASE C3 REVIEW PASS
SOURCE_VERSION: 2026-09-26 (TASK-02.02.01 Phase C4 traceability)

## Purpose

Organization хранит Company-owned организационную структуру как произвольное
дерево `OrganizationalUnit`. Географическая и организационная иерархии
остаются отдельными bounded contexts.

## Owns / Does not own

Organization owns:

- Company reference required by organizational units;
- OrganizationalUnit;
- OrganizationalUnitType;
- Organization-owned durable audit obligations.

Organization does not own:

- TerritorialZone, Region, Site or their tables;
- `audit.events`;
- Identity access-assignment evaluation;
- Company administration API in `TASK-02.02.01`.

## Database

Target schema:

```text
organization
```

Tables and phase status:

- `organization.companies` — B1 implemented prerequisite;
- `organization.organizational_unit_types` — B1 implemented configurable reference;
- `organization.organizational_units` — B2 implemented;
- `organization.organizational_unit_history` — B2 append-only business history;
- `organization.audit_obligations` — B2 durable source with C2 delivery through the Organization Application port.

Phase B1 implements a minimal Organization-owned Company persistence
prerequisite for future unit FKs. Company has required UUIDv7 `id`, globally
unique canonical immutable `code`, trimmed non-empty mutable `name`, and
`ACTIVE`/`INACTIVE` `status`; new units require an ACTIVE Company. It has no
administration API, lifecycle commands, permissions or audit in this task.
`OrganizationDbContext` owns schema `organization` and its
`organization.__ef_migrations_history`; the initial Organization migration
adds only the two B1 tables. DatabaseMigrator registers the module context.
The additive B2 migration adds units, business history, obligations and
restrictive FKs/checks. The Organization command store serializes hierarchy
mutations using the ADR-012 Company lock and recursive CTE after the lock.
Creation requires an ACTIVE Company; a Company row lock serializes concurrent
status changes. Type rows are held during create/update eligibility checks.
The type seed has exactly the seven registry codes, with `name` equal to the
canonical code because no separate display labels are approved. The existing
50-character canonical ASCII reference-code pattern is reused for type codes.

## Business rules

- Every unit has a mandatory `company_id`.
- Roots use `parent_id = null`; one Company may have multiple roots.
- Parent and child must belong to the same Company.
- Cross-company parenting and reparenting are forbidden.
- Reparenting within a Company is allowed only to an ACTIVE parent and only
  for an ACTIVE source unit.
- Self-parent and descendant-as-parent are forbidden.
- `code` is required, canonical uppercase, immutable, max 50 and unique by
  `(company_id, code)`.
- `name` is required, trimmed, non-empty, max 200 and mutable.
- `unit_type_id` references an Organization-owned configurable type.
- Inactive units remain queryable and retain history and existing descendants;
  they cannot receive new children or be selected as a new parent.
- No physical delete or cascade lifecycle exists.
- Reparent and lifecycle business history is append-only and separate from
  technical Audit (ADR-008).
- Structural operations use the transaction-safe per-Company serialization in
  ADR-012; simple row checks are not sufficient for cycle prevention.

## Lifecycle

`OrganizationalUnit` starts `ACTIVE` and supports only:

```text
ACTIVE → INACTIVE
INACTIVE → ACTIVE
```

Deactivation does not cascade. Deactivation takes the structural Company lock
because it changes parent/source eligibility; activation does not require that
lock. Hard delete is forbidden.

`OrganizationalUnitType` uses `ACTIVE`/`INACTIVE`; inactive types remain
queryable for history but cannot be selected for new units and cannot be
hard-deleted. A name-only update keeps an existing inactive historical type;
changing `unitTypeId` requires an ACTIVE target type.

## Permissions

- `organization.read`
- `organization.create`
- `organization.change`

There is no `organization.reparent`; reparent and lifecycle commands use
`organization.change`. Scope metadata is recorded for future Company/unit
scope evaluation, but `access_assignments` is not extended in this task and
production authorization remains deny-by-default. UserType, role name, JWT
claims, working context and entity ID do not grant access.

## Public contracts

Implemented transport/API contract:

- flat list `GET /api/v1/organizational-units` with required `companyId` and
  optional `parentId`, `unitTypeId`, `status`;
- get, create, PUT, activate, deactivate and dedicated reparent routes;
- no DELETE, generic PATCH or tree/children endpoint;
- stale mutations return `409 OPTIMISTIC_CONCURRENCY_CONFLICT`.

Future cross-module references use stable Organization-owned reference DTOs;
other modules must not query Organization tables directly.

## Audit

The canonical Audit entity is `OrganizationalUnit` with server-derived
actions `OrganizationalUnitCreated`, `OrganizationalUnitUpdated`,
`OrganizationalUnitReparented`, `OrganizationalUnitActivated` and
`OrganizationalUnitDeactivated`. Before/after payloads allow only
`companyId`, `parentId`, `unitTypeId`, `code`, `name` and `status`.

Each mutation atomically writes an Organization-owned durable obligation.
Delivery is generalized through explicit module ports to the single canonical
`IAuditWriter` with stable UUIDv7 EventId, at-least-once delivery and
idempotent materialization. Organization never writes Sites or Audit tables.
The same Organization transaction writes append-only business history for
every mutation. C2 claims Organization obligations in a short PostgreSQL
transaction, then calls `IAuditWriter` outside that transaction. Completion
and failure require the current claim token; expired leases recover after
restart and failed delivery persists bounded backoff and sanitized diagnostics.
The technical host polls Sites and Organization in independent bounded loops.

## Dependencies

- PostgreSQL through Organization-owned DbContexts;
- Identity authorization contracts;
- Organization Application delivery port; technical AuditDelivery calls Audit.Contracts `IAuditWriter`;
- no dependency on Sites Infrastructure or another module's DbContext.

## API surface

The seven Phase A routes are implemented in Phase C1:

```text
GET  /api/v1/organizational-units?companyId=...
GET  /api/v1/organizational-units/{id}
POST /api/v1/organizational-units
PUT  /api/v1/organizational-units/{id}
POST /api/v1/organizational-units/{id}/activate
POST /api/v1/organizational-units/{id}/deactivate
POST /api/v1/organizational-units/{id}/reparent
```

List is flat; `companyId` is required, while `parentId`, `unitTypeId` and
`status` are optional filters. Create accepts `companyId`, nullable
`parentId`, `unitTypeId`, `code` and `name`. PUT changes only `name` and
`unitTypeId` with `expectedRowVersion`; it cannot change ID, Company, parent,
code or status. Reparent accepts nullable `newParentId` plus
`expectedRowVersion`; lifecycle commands accept `expectedRowVersion`.

OpenAPI documents the required `companyId` filter, request/response schemas,
canonical error schema and Bearer security on all seven operations.
The public request and domain error set is 400/401/403/404/409. A dependency
failure returns a sanitized 503 without SQL, EF or provider details. Stale
mutation is `409 OPTIMISTIC_CONCURRENCY_CONFLICT`; duplicate, lifecycle and
cycle conflicts use deterministic 409 codes without internal DB/EF details.

## Tests

Phase B2 PostgreSQL checks cover domain constraints, audit atomicity and
ADR-012 concurrency races, including deep descendant cycles. Phase C1
PostgreSQL API checks cover all route authentication/authorization boundaries,
working context, public errors, mutations, obligations and OpenAPI; C3 adds
provider-failure sanitization and explicit over-posting/version-required cases.
Phase C2 PostgreSQL AuditDelivery checks cover retries, crash windows, stale
claims, source fairness and the Sites regression.

## Forbidden

- direct SQL writes to Sites, Audit or Identity schemas;
- hard delete or cascade deactivation;
- generic status PATCH;
- authorization from UserType, role name, claims, context or known IDs;
- application-only cycle checks without transactional serialization;
- a second audit writer or global DbContext;
- general Company CRUD in this task.
