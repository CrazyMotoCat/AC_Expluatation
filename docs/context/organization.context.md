# Organization Context Capsule

SOURCE_VERSION: 2026-09-26 (TASK-02.02.01 Phase C4 traceability)
MODULE: Organization

## PURPOSE

Organization хранит Company-owned произвольное дерево OrganizationalUnit.
Организационная иерархия не объединяется с физической географией Sites.

## OWNS

- Company prerequisite/reference
- OrganizationalUnit
- OrganizationalUnitType
- Organization-owned durable audit obligations

## DB

- `organization.companies` (B1 implemented)
- `organization.organizational_unit_types` (B1 implemented and seeded)
- `organization.organizational_units` (B2 implemented)
- `organization.organizational_unit_history` (B2 append-only)
- `organization.audit_obligations` (B2 persistence, C2 delivery implemented)

Phase B1 adds the minimal Organization-owned Company persistence prerequisite
and module DbContext/migration. General Company CRUD is outside
`TASK-02.02.01`.
The Organization migration history is `organization.__ef_migrations_history`;
DatabaseMigrator executes it alongside other module-owned migrations.
The B2 additive migration adds the unit tree, business timeline and durable
audit source. Structural commands use the ADR-012 advisory lock, current-state
checks and recursive CTE. Unit and type/Company eligibility reads are held in
the mutation transaction.

## INVARIANTS

- `company_id` обязателен; roots используют `parent_id = null`.
- Несколько roots в одной Company разрешены.
- Parent и child должны иметь одинаковый Company.
- Cross-company parent/reparent запрещён.
- Reparent разрешён только для ACTIVE source к ACTIVE parent.
- Self-parent и descendant-as-parent запрещены.
- Code: trim + invariant uppercase, regex `^[A-Z0-9][A-Z0-9_-]{0,49}$`, immutable, max 50, unique `(company_id, code)`.
- Name: trim, non-empty, max 200, mutable.
- Inactive unit queryable; history/descendants сохраняются; new child/new parent запрещены; no cascade.
- Type — Organization-owned configurable reference; inactive type нельзя выбирать новым unit.
- Structural mutations use ADR-012 per-Company transaction-scoped advisory lock plus recursive CTE.
- Business history is append-only and separate from technical Audit under ADR-008.

## LIFECYCLE

OrganizationalUnit: `ACTIVE` ↔ `INACTIVE`, create `ACTIVE`, no hard delete.
Deactivation takes structural lock; activation does not. Type lifecycle is
`ACTIVE`/`INACTIVE`, no hard delete.

## PERMISSIONS

- `organization.read`
- `organization.create`
- `organization.change`

No `organization.reparent`; scope evaluation is deferred, assignments are not
extended, and production authorization is deny-by-default.

## PUBLIC_CONTRACTS

- implemented flat organizational-unit list/get/create/PUT/lifecycle/reparent API; seven permission-gated routes
- dependency failures return sanitized 503 responses without database/provider details
- future stable Organization reference DTOs
- no direct table access by other modules

## EVENTS

Audit actions (not integration events):

- `OrganizationalUnitCreated`
- `OrganizationalUnitUpdated`
- `OrganizationalUnitReparented`
- `OrganizationalUnitActivated`
- `OrganizationalUnitDeactivated`

## DEPENDS_ON

- PostgreSQL
- Identity authorization contracts
- Organization Application delivery port; technical AuditDelivery depends on Audit.Contracts

## FORBIDDEN

- direct writes to Sites/Audit/Identity schemas
- hard delete, cascade lifecycle, generic PATCH status
- UserType/role/claims/context/ID authorization shortcuts
- application-only cycle prevention
- second audit writer or global DbContext

## TOP_TEST_RISKS

- deep descendant cycle and self-parent rejection
- concurrent reparent/create versus parent/source deactivation in both orders
- different Company mutations do not share a global lock
- same-company code uniqueness and restrictive FKs
- atomic Organization mutation plus durable audit obligation
- C2 Organization-owned claim/lease/retry store and Application delivery port; one canonical Audit writer, stable EventId and at-least-once materialization
- C3 API error, authorization, concurrency, audit-delivery and module-boundary review passed; PostgreSQL provider-failure responses are sanitized
