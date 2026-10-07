# Organization Context Capsule

SOURCE_VERSION: 04da073538be60a54bdd2e548768a21aa4c5ff34 + FUNCTIONAL-DIRECTION-01R publication metadata (2026-10-08)
MODULE: Organization

## PURPOSE

Organization хранит Company-owned произвольное дерево OrganizationalUnit.
Организационная иерархия не объединяется с физической географией Sites.

## OWNS

- Company prerequisite/reference
- OrganizationalUnit
- OrganizationalUnitType
- FunctionalDirection GLOBAL configurable reference (published; local validation, independent review and exact-SHA hosted CI PASS)
- Organization-owned durable audit obligations

## DB

- `organization.companies` (B1 implemented)
- `organization.organizational_unit_types` (B1 implemented and seeded)
- `organization.organizational_units` (B2 implemented)
- `organization.organizational_unit_history` (B2 append-only)
- `organization.functional_directions` (TASK-02.02.02, one narrow Organization migration)
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
- FunctionalDirection: runtime UUIDv7; immutable globally unique ReferenceCode
  (trim/uppercase, max 50, existing regex), mutable non-unique trimmed name max
  200, status/created_at/updated_at/row_version; no description/is_active.
- Exact seven ACTIVE deterministic seeds with name == code; IDs in reference registry.
- FunctionalDirection expectedRowVersion required; duplicate code, unchanged
  name, repeated lifecycle and stale write conflict without successful audit.

## LIFECYCLE

OrganizationalUnit: `ACTIVE` ↔ `INACTIVE`, create `ACTIVE`, no hard delete.
Deactivation takes structural lock; activation does not. Type lifecycle is
`ACTIVE`/`INACTIVE`, no hard delete.

FunctionalDirection: ACTIVE ↔ INACTIVE, create ACTIVE, no hard delete; inactive
remains resolvable but not selectable for a new reference.

## PERMISSIONS

- `organization.read`
- `organization.create`
- `organization.change`
- `organization.manage_functional_directions`

No `organization.reparent`; Company/unit scope evaluation remains deferred and
OrganizationalUnit production authorization is deny-by-default. OD-05 requires
explicit current GLOBAL organization.read OR GLOBAL management for the
FunctionalDirection catalog, GLOBAL management only for detail/commands.
Fixed trusted permissions use Identity IGlobalGrantProvider with canonical
ACTIVE INTERNAL user/owned current INTERNAL context and assignment validity.
Concrete/composite grants, external/contractor, wrong context, future/expired
assignment and provider failure deny; no permission implication or grant seed.
OD-06 accepts exactly one Identity HasData data-only migration
`20261007141653_AddFunctionalDirectionManagementPermission` for canonical
management permission ID `0199f3b0-0000-7000-8000-00000000004e`; no schema,
role or assignment change. The permission row alone grants no access.

## PUBLIC_CONTRACTS

- implemented flat organizational-unit list/get/create/PUT/lifecycle/reparent API; seven permission-gated routes
- dependency failures return sanitized 503 responses without database/provider details
- FunctionalDirection catalog/detail/create/PUT/activate/deactivate routes;
  catalog unpaged includes both statuses sorted code/id; detail includes version
- Organization.Application.FunctionalDirections IFunctionalDirectionReferenceProvider
  GetReferenceAsync returns immutable Id/Code/Name/Status/IsSelectableForNewReference;
  null missing, ACTIVE selectable, INACTIVE resolvable/non-selectable; no auth facts
- no direct table access by other modules

## EVENTS

Audit actions (not integration events):

- `OrganizationalUnitCreated`
- `OrganizationalUnitUpdated`
- `OrganizationalUnitReparented`
- `OrganizationalUnitActivated`
- `OrganizationalUnitDeactivated`
- `FunctionalDirectionCreated`
- `FunctionalDirectionUpdated`
- `FunctionalDirectionActivated`
- `FunctionalDirectionDeactivated`

FunctionalDirection snapshots code/name/status; existing Organization durable
obligation and canonical AuditDelivery path, atomically with successful mutation.
No read audit, separate business-history store or integration event is added.

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
- OD-05 concrete/composite-to-GLOBAL escalation, permission independence,
  context/validity/provider failure, existence concealment, duplicate-code race,
  stale overwrite, exact seed/provider semantics and audit atomicity

TASK-02.02.02 is PUBLISHED.
TASK-03.01.01 is READY_TO_RESUME; frontend/Assets remain unimplemented in this task.
