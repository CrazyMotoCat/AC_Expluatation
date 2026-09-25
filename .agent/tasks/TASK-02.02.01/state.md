# TASK-02.02.01 checkpoint

TASK: TASK-02.02.01
TITLE: Organizational units
PHASE: C4
STATUS: C4_INCOMPLETE_HOSTED_CI_UNVERIFIED
CHECKPOINT_STATUS: SAFE
IMPLEMENTATION_STARTED: YES
PHASE_A: DONE
CONTRACT_FROZEN: YES
PHASE_B1: DONE
PHASE_B2: DONE
PHASE_C1: DONE
APPLICATION_USE_CASES: PASS
READ_MODEL: PASS
API: PASS
API_ROUTES: PASS (exactly seven)
AUTHORIZATION: PASS
PERMISSION_REGISTRY_IDENTITY_SEED: PASS (77 canonical; previous 74 unchanged)
PRODUCTION_GRANT_SOURCE: DENY
SCOPE_DEFERRAL: PASS
WORKING_CONTEXT: PASS
HTTP_CONCURRENCY: PASS
SAFE_STRUCTURAL_PATHS: PASS
WRITE_OUTBOX_INTEGRATION: PASS (Organization-owned durable obligations)
AUDIT_DELIVERY: PASS
PHASE_C2: DONE
PHASE_C3: DONE
PHASE_C4: LOCAL_GATES_PASS_HOSTED_CI_PENDING
TRACEABILITY: PASS
LOCAL_FINAL_GATES: PASS
HOSTED_CI: UNVERIFIED_REPOSITORY_ACTIONS_404
OPEN_CRITICAL: 0
OPEN_HIGH: 0
OPEN_MEDIUM: 0
ORGANIZATION_AUDIT_DELIVERY: PASS
MULTI_MODULE_DELIVERY: PASS
SITES_DELIVERY_REGRESSION: PASS
DELIVERY_MODEL: AT_LEAST_ONCE
IDEMPOTENCY: PASS
SOURCE_FAIRNESS: PASS
FAILURE_ISOLATION: PASS
MODULE_BOUNDARIES: PASS
ADR_REQUIRED_C2: NO
ADR_ACTION_C2: NONE
ORGANIZATION_FOUNDATION: PASS
ORGANIZATION_DB_CONTEXT: PASS
ORGANIZATION_SCHEMA: PASS
ORGANIZATION_MIGRATION_HISTORY: PASS
COMPANY_PREREQUISITE: RESOLVED_BY_OWNER_DECISION_AND_IMPLEMENTED
COMPANY_SCOPE_CREEP: NONE
UNIT_TYPE_REFERENCE: PASS
UNIT_TYPE_SEED: PASS
POSTGRESQL_TESTS: PASS
DATABASE_MIGRATOR: PASS
ARCHITECTURE: PASS
OPEN_HIGH_FINDINGS: 0
OPEN_MEDIUM_FINDINGS: 0
MIGRATION_STRATEGY: SEPARATE_ADDITIVE_B2_MIGRATION
MIGRATION: 20260925115638_AddOrganizationalUnitsAndAuditObligations
DOCS_IMPACT: YES
DOCUMENTATION_SYNC: PASS
ORGANIZATIONAL_UNIT_IMPLEMENTATION: PASS
ORGANIZATIONAL_UNIT_DOMAIN: PASS
ORGANIZATIONAL_UNIT_PERSISTENCE: PASS
HIERARCHY: PASS
CYCLE_PREVENTION: PASS
STRUCTURAL_SERIALIZATION: PASS
COMPANY_LOCK_ISOLATION: PASS
REPARENT: PASS
LIFECYCLE: PASS
UNIT_TYPE_ELIGIBILITY: PASS
OPTIMISTIC_CONCURRENCY: PASS
ORGANIZATION_AUDIT_OBLIGATIONS: PASS
ATOMICITY: PASS
IMPLEMENTATION_COMMIT: 2f8ba4e15f65d7cc6ce79bbd41f5778c23e329bb

LAST_SAFE_COMMIT: 2f8ba4e15f65d7cc6ce79bbd41f5778c23e329bb
BRANCH: main
ORIGIN_MAIN: 2f8ba4e15f65d7cc6ce79bbd41f5778c23e329bb
REPOSITORY_STATE_GUARD: SAFE_WITH_CHECKPOINT_PENDING_HOSTED_CI
GIT_STATE: CHECKPOINT_UPDATE_PENDING
WORKTREE_STATE: CHECKPOINT_UPDATE_PENDING (implementation committed and pushed; hosted CI unresolved)

COMPLETED:
- Repository state guard completed; HEAD and origin/main match the expected baseline.
- Exact backlog contract loaded: arbitrary organizational-unit hierarchy, parent/child, unit type, cycle prevention.
- Primary module routed to Organization; contract docs/capsule and B1/B2/C1 implementation exist.
- Repository evidence inspected for Organization schema, current authorization registry/Identity seed, Sites-owned audit delivery, and ADR-011.
- At the initial Phase A preflight, Organization production code had not yet started; B1/B2/C1 have since implemented their recorded scopes.
- B1 owner decision approved the minimal Company contract and resolved the
  earlier Company-schema blocker.
- B1 created Organization Domain and Infrastructure, OrganizationDbContext,
  module-owned initial migration/history, minimal Company persistence and the
  OrganizationalUnitType reference with exactly seven initial values.
- B1 registered Organization in API and DatabaseMigrator without endpoints.
- B1 added focused PostgreSQL and architecture checks; no unit hierarchy,
  Company CRUD, permissions, audit delivery or B2 implementation was started.
- B2 added OrganizationalUnit domain state and the five dedicated Organization
  command-store mutations. It added an additive Organization migration for
  units, append-only business history and module-owned audit obligations.
- All structural writes use the ADR-012 SHA-256 per-Company advisory key;
  current state is read after lock and reparent uses a recursive CTE. Company
  and type eligibility reads use PostgreSQL row locks through commit.
- Every successful unit mutation commits unit state, one history fact and one
  pending audit obligation atomically. C1 added API and C2 added delivery.
- C1 added Organization Application contracts and seven dedicated handlers,
  AsNoTracking read projection, seven HTTP routes, strict DTO validation,
  public error mapping, OpenAPI Bearer metadata and the required company filter.
- C1 added exactly three Organization permissions to the canonical Identity
  catalog, additive Identity seed migration, registry and focused PostgreSQL API checks.
- C2 added an Organization Application delivery port and Organization-owned PostgreSQL
  claim/lease/retry store. The technical AuditDelivery host now runs fixed,
  independent bounded Sites and Organization loops through one canonical Audit writer.
- C2 registered OrganizationalUnit action/entity identifiers and exact snapshot
  validation in Audit Contracts. Delivery preserves the stored EventId and payload;
  the writer remains globally idempotent by EventId.

VERIFIED:
- git status was clean before this checkpoint/documentation phase began
- HEAD == origin/main == 1d3b694f41b49491e3d96645ad58dd7ecd169d4f
- Organization module docs and context capsule reflect Phase C1.
- docs/database.md records the frozen Organization schema contract and Company persistence gap.
- Organization permission codes are documented and seeded in Identity by C1.
- ADR-012 is accepted and listed; ADR-011 remains the audit-obligation foundation.
- Documentation sync checks passed; no `src`/`tests` files changed.
- B1 Release solution build passed with zero warnings/errors.
- B1 PostgreSQL integration passed: clean DatabaseMigrator apply, second run
  zero migrations, Organization-owned history, Company/type constraints,
  canonical seed versus registry, inactive readability, hard-delete/identity
  guards and Organization rollback without changing Audit/Identity/Sites
  histories.
- Architecture checks and DatabaseMigrator configuration/registration script
  passed; `git diff --check` passed.
- EF Release model/snapshot check reports no pending model changes. A probe
  generated from an older Debug assembly was removed before the final Release
  build and PostgreSQL rerun; only the Organization initial migration remains.
- B1 documentation impact was checked against `database.md`, Organization
  module/context, reference-data registry, backlog and traceability matrix;
  these now identify B1 as implemented and OrganizationalUnit as pending.
- Focused B1 review found no open HIGH or MEDIUM findings.
- B2 Organization PostgreSQL checks passed: two migrations plus second-run
  idempotence/rollback, constraints, type/lifecycle/reparent/stale versions,
  24-level ancestry, direct and deep concurrent cycles, separate Company locks,
  six ordered reparent/create versus deactivation races, Company status race,
  exact audit actions, payload allowlist, append-only history and forced audit
  failure rollback for all five commands.
- B2 EF Release model reports no pending changes. DatabaseMigrator registration
  script, architecture checks, Release solution build and `git diff --check`
  passed. `dotnet test Exploitation.sln -c Release --no-build` exited 0 but
  reported no test discovery; the Organization console integration harness
  was run directly against PostgreSQL Testcontainers.
- B2 focused review found no open HIGH or MEDIUM findings; docs-impact YES and
  documentation-sync PASS for Organization module/context, database, backlog
  and traceability matrix.
- C1 Release solution/API build passed with zero warnings/errors. Organization
  Application, API, IdentityDomain, IdentityPersistence, OrganizationPersistence,
  OrganizationApi, SitesApi regression, architecture and DatabaseMigrator
  registration checks passed. The OrganizationApi test uses PostgreSQL
  Testcontainers and checks all seven auth boundaries, grants, context,
  mutations, filters, errors, obligations and OpenAPI schemas/security.
- C1 registry/seed exact equality passed in IdentityDomain and IdentityPersistence
  checks; additive migration inserts only three Organization rows. Previous 74
  catalog definitions are unchanged in Git diff.
- C1 `git diff --check` passed. docs-impact YES, documentation-sync PASS;
  no Accepted ADR conflict or open HIGH/MEDIUM C1 finding was found.
- C2 Release solution build passed with zero warnings/errors. PostgreSQL
  AuditDelivery checks passed for Organization materialization, exact payload,
  durable retry/backoff, lease reclaim, stale token, crash window, conflict,
  concurrent claims, both sources together, shared Audit failure, source
  failure isolation and blocked-source fairness. Existing Sites delivery
  regression in the same harness passed.
- C2 AuditPersistence, OrganizationPersistence, OrganizationApi and architecture
  checks passed. `dotnet test Exploitation.sln -c Release --no-build` exited 0
  without test discovery; console integration harnesses were run directly.
- C2 docs-impact YES and documentation-sync PASS for Organization/Audit module
  docs and capsules, database, backlog, project structure and deployment.
  `git diff --check`, conflict-marker check and production-source secret hygiene
  passed. No Organization or Audit schema migration was needed.
- C2 focused review: no open HIGH/MEDIUM findings. ADR-011 already covers
  module-owned obligations; ADR_REQUIRED NO, ADR_ACTION NONE.
- C3 independently inspected Organization domain, command/read stores, both
  migrations and DbContext guard, API/Identity authorization, Audit writer,
  Sites and Organization delivery ports/host, architecture boundaries and
  assertions in PostgreSQL integration checks. Prior PASS labels were not
  treated as proof. No open CRITICAL/HIGH/MEDIUM finding remains.
- C3 MEDIUM (remediated): Organization GET/list and pre-lock mutation queries
  could throw raw provider errors outside the endpoint's error mapper. The
  Development host could expose SQL/Npgsql details instead of a canonical
  response. The seven endpoint handlers now return sanitized 503 for unexpected
  non-cancellation failures, including local-profile lookup. PostgreSQL API
  regression renames the unit table temporarily and asserts sanitized 503 for
  a read and a structural mutation; it restores the table afterward.
- C3 test-quality remediation: PostgreSQL API checks now assert PUT rejects
  companyId/parentId/code over-posting and PUT/reparent/deactivate reject a
  missing expectedRowVersion. Existing direct/deep cycle, six ordered
  eligibility races, forced obligation rollback for all five commands,
  registry/seed equality, crash/retry/lease and multi-source fairness
  assertions were examined and found substantive.
- C3 LOW: permission middleware's 401/403 responses are status-only while
  Organization OpenAPI advertises the canonical error schema. This follows
  the existing shared permission boundary; align it in a separately scoped
  API contract change. No authorization grant or internal detail leaks.
- C3 NOTE: both source loops use the historical Sites:AuditDelivery options
  section. Processing and failure isolation are independent; the name can be
  clarified in a future configuration change.
- C3 verification: OrganizationApi, OrganizationPersistence, AuditDelivery,
  IdentityDomain and IdentityPersistence harnesses passed; architecture checks
  passed; Release solution build passed with zero warnings/errors; git diff
  --check and production-source secret scan passed. Docker 29.8.0 available.
- C3 docs-impact YES and documentation-sync PASS: Organization module API
  description now records the sanitized dependency-failure 503 already present
  in the route metadata and API guidelines; no contract or schema change.
- C4 task-resume: branch `main`, HEAD, `origin/main` and `LAST_SAFE_COMMIT`
  reconcile at `1d3b694f41b49491e3d96645ad58dd7ecd169d4f`; every dirty path is
  owned by TASK-02.02.01. No destructive recovery was used.
- C4 traceability PASS: backlog ACs, BR-ORG-001…009, owner decisions OD-001…007,
  ADR-012, Organization API/persistence, audit contracts and module ports,
  permission registry/Identity seed, lifecycle/reference-data/business rules,
  owned migration history, tests and current docs agree. Permission catalog
  and persisted seed are exactly equal at the repository-derived total; the
  three Organization permission rows are additive and the existing catalog
  entries are unchanged.
- C4 documentation-sync PASS: corrected stale Organization module/index status,
  refreshed Organization context capsule and traceability matrix; documented
  sanitized 503 and final C2/C3 verification. No architecture prose was
  rewritten beyond these inconsistencies.
- C4 surface check: exactly seven intended Organization routes; no DELETE,
  PATCH, tree, Company CRUD or OrganizationalUnitType CRUD endpoint.
- C4 audit/database checks: module-owned `organization.audit_obligations`,
  `sites.audit_obligations` and `audit.events`; independent Application ports,
  one canonical `IAuditWriter`, no cross-module DB write; exactly two
  Organization migrations and one additive Identity permission migration;
  no pending EF model changes in Audit, Identity, Organization or Sites.
- C4 local gates PASS: restore, full Release solution build, Organization API
  and persistence checks, Sites API/persistence regression, Audit persistence
  and delivery, Identity persistence/domain, authentication, architecture,
  infrastructure and API smoke checks, clean DatabaseMigrator apply and
  second-run idempotence, `git diff --check`, and source secret hygiene. The
  solution `dotnet test` command exits zero but discovers no test projects;
  repository console test harnesses above ran directly and passed.
- C4 CI gate coverage: hosted workflow now runs both Organization PostgreSQL
  harnesses, runs DatabaseMigrator twice, and API OpenAPI smoke checks the
  OrganizationalUnit routes. CI workflow and smoke-contract checks pass.
- C4 deferred items: LOW — shared permission middleware 401/403 status-only
  responses versus documented error schema (explicitly out of scope); NOTE —
  historical `Sites:AuditDelivery` configuration section name.
- C4 task commit and push have not yet been created; hosted CI is pending.

UNCOMMITTED:
- .agent/tasks/TASK-02.02.01/state.md
- .github/workflows/build.yml
- docs/adr/README.md
- docs/adr/ADR-012-organizational-hierarchy-concurrency.md
- docs/backlog.md
- docs/business-rules-registry.md
- docs/context/README.md
- docs/context/audit.context.md
- docs/context/identity.context.md
- docs/context/organization.context.md
- docs/database.md
- docs/deployment.md
- docs/lifecycle-registry.md
- docs/modules/README.md
- docs/modules/audit.md
- docs/modules/identity.md
- docs/modules/organization.md
- docs/permissions-registry.md
- docs/project-structure.md
- docs/reference-data-registry.md
- docs/traceability-matrix.md
- Exploitation.sln
- src/backend/Exploitation.Api/Program.cs and Exploitation.Api.csproj
- src/backend/Exploitation.DatabaseMigrator/Program.cs and Exploitation.DatabaseMigrator.csproj
- src/backend/Modules/Organization/ (new Domain, Infrastructure and initial migration)
- src/backend/Modules/Organization/Exploitation.Modules.Organization.Application/ (new)
- src/backend/Modules/Organization/Exploitation.Modules.Organization.Application/AuditDelivery/ (C2)
- src/backend/Modules/Organization/Exploitation.Modules.Organization.Infrastructure/Persistence/OrganizationAuditObligationDeliveryStore.cs (C2)
- src/backend/Exploitation.AuditDelivery/ (C2 dispatcher, host, outcome types and registration)
- src/backend/Modules/Audit/Exploitation.Modules.Audit.Contracts/ (C2 OrganizationalUnit identifiers and payload validation)
- src/backend/Modules/Sites/Exploitation.Modules.Sites.Application/AuditDelivery/AuditObligationDeliveryOutcome.cs (moved into technical host, no behavior change)
- src/backend/Exploitation.Api/Organization/ (new)
- src/backend/Modules/Identity/Exploitation.Modules.Identity.Domain/Authorization/SystemPermissionCatalog.cs
- src/backend/Modules/Identity/Exploitation.Modules.Identity.Infrastructure/Persistence/Migrations/20260925122254_AddOrganizationPermissions.cs (plus Designer and snapshot)
- tests/architecture/Exploitation.ArchitectureChecks/Program.cs
- tests/infrastructure/DatabaseMigrator.Tests.ps1
- tests/infrastructure/CiWorkflow.Tests.ps1
- tests/e2e/ApiBootstrapSmoke.Tests.ps1
- tests/e2e/ApiBootstrapSmoke.Contract.Tests.ps1
- tests/integration/Exploitation.IdentityPersistenceChecks/Program.cs
- tests/integration/Exploitation.OrganizationApiChecks/ (new)
- tests/integration/Exploitation.OrganizationPersistenceChecks/ (new)
- tests/integration/Exploitation.AuditDeliveryChecks/ (C2 PostgreSQL checks)
- B2 added unit/history/outbox Domain and Infrastructure files, generated
  `20260925115638_AddOrganizationalUnitsAndAuditObligations` migration, and
  expanded the Organization PostgreSQL and architecture checks.
- C1 added Organization Application, API routes and OpenAPI metadata, Identity
  `20260925122254_AddOrganizationPermissions` migration, and
  `tests/integration/Exploitation.OrganizationApiChecks/`; modified Identity
  persistence/domain and architecture checks plus affected docs/checkpoint.
- C2 added Organization Application AuditDelivery port and Infrastructure
  delivery store; added Organization dispatcher and moved technical delivery
  outcome types into Exploitation.AuditDelivery. Changed technical host,
  registration/project reference, Organization registration/obligation claim,
  canonical Audit action/entity/payload validation, AuditDelivery PostgreSQL
  checks/project reference, architecture checks, affected docs and checkpoint.

DECISIONS:
- Phase A is contract-only.
- Do not reopen completed TASK-02.01.01 or TASK-02.01.02.
- Phase C1, C2 and C3 are complete; C4 local gates are complete. Do not start
  another Task ID.
- Existing-unit Company lifecycle eligibility was not expanded beyond the
  frozen contract; creation alone requires ACTIVE Company. Structural commands
  hold a current Company row read through commit to serialize status changes.
- The B1 migration was preserved unchanged; B2 used a separate additive
  migration to keep the verified foundation boundary.

PENDING:
- Create the single task commit, push, verify all hosted CI jobs, then record
  final checkpoint state and synchronize it using the repository convention.

BLOCKERS:
- None for C2. The prior B1_BLOCKED_COMPANY_CONTRACT was resolved by the
  explicit owner decision before B1 implementation.

FILES_CHANGED:
- B2 new: OrganizationalUnit domain; Organization unit/history/obligation
  configurations, command store, additive migration and generated snapshot.
- B2 changed: OrganizationDbContext, OrganizationModuleRegistration,
  OrganizationPersistenceChecks, architecture checks, Organization module and
  context docs, database, backlog, traceability matrix, and this checkpoint.
- Phase A/B1/B2/C1 dirty files listed in UNCOMMITTED remain task-owned and uncommitted.
- C3 changed only Organization API exception mapping, its PostgreSQL API
  regression checks, Organization module API description, and this checkpoint.
  No migration or new functionality.
- C4 changed traceability/documentation summaries, hosted workflow coverage,
  API OpenAPI smoke coverage, CI migration idempotency gate, and this checkpoint.
  No user-facing functional scope was added.

C4_REPOSITORY_RECOVERY:
- RESUME_SAFE: YES.
- CHECKPOINT_MATCHES_GIT: YES; task commit 2f8ba4e15f65d7cc6ce79bbd41f5778c23e329bb is pushed to main.
- LOCAL_FINAL_GATES: PASS; HOSTED_CI: UNVERIFIED (Actions/API 404 in signed-out session; gh CLI unavailable).
- OPEN_CRITICAL/HIGH/MEDIUM: 0.
- STATUS: C4 incomplete until hosted CI evidence is available.
- NEXT_ACTION: verify required hosted checks for the implementation commit when Actions access is available.

C3_REPOSITORY_RECOVERY:
- RESUME_SAFE: YES.
- CHECKPOINT_MATCHES_GIT: YES; all dirty paths remain TASK-02.02.01-owned.
- GIT_STATE: DIRTY_EXPECTED; HEAD and origin/main remain
  1d3b694f41b49491e3d96645ad58dd7ecd169d4f on main.
- IMPLEMENTATION_COMMIT: NOT_CREATED; no push.
- BLOCKERS: NONE.
- NEXT_ACTION: PHASE C4 only after explicit instruction.

C2_REPOSITORY_RECOVERY:
- RESUME_SAFE: YES; checkpoint and Git match on `main`.
- CHECKPOINT_MATCHES_GIT: YES; all dirty paths remain TASK-02.02.01-owned.
- GIT_STATE: DIRTY_EXPECTED; HEAD and origin/main are both
  `1d3b694f41b49491e3d96645ad58dd7ecd169d4f`.
- IMPLEMENTATION_COMMIT: NOT_CREATED; no push.
- C2_ADR_REQUIRED: NO; C2_ADR_ACTION: NONE (ADR-011 is module-generic).
- NEXT_ACTION: PHASE C3 only after explicit instruction.

C1_REPOSITORY_RECOVERY:
- RESUME_SAFE: YES; HEAD and origin/main remain the B1/B2 baseline.
- CHECKPOINT_MATCHES_GIT: YES; all dirty paths belong to TASK-02.02.01.
- GIT_STATE: DIRTY_EXPECTED; task commit and push not created.
- LAST_SAFE_COMMIT: 1d3b694f41b49491e3d96645ad58dd7ecd169d4f.
- NEXT_ACTION: PHASE C2 only after explicit instruction.

B2_REPOSITORY_RECOVERY (historical):
- RESUME_SAFE: YES; branch and baseline still match the B1 checkpoint.
- CHECKPOINT_MATCHES_GIT: YES; dirty paths remain within TASK-02.02.01 ownership.
- GIT_STATE: DIRTY_EXPECTED.
- LAST_SAFE_COMMIT: 1d3b694f41b49491e3d96645ad58dd7ecd169d4f.
- IMPLEMENTATION_COMMIT: NOT_CREATED.
- NEXT_ACTION: PHASE C1 only after explicit instruction.

B1_REPOSITORY_RECOVERY:
- RESUME_SAFE: YES; checkpoint dirty-file list, branch and baseline match Git.
- CHECKPOINT_MATCHES_GIT: YES; HEAD and origin/main are both
  `1d3b694f41b49491e3d96645ad58dd7ecd169d4f`.
- ORGANIZATION_MODULE_PROJECTS_BEFORE: ABSENT.
- ORGANIZATION_DB_CONTEXT_BEFORE: ABSENT.
- ORGANIZATION_SCHEMA_RUNTIME_BEFORE: ABSENT (no production migration creates it;
  live database state was not queried).
- ORGANIZATION_MIGRATION_HISTORY_BEFORE: ABSENT.
- COMPANY_TABLE_IMPLEMENTED_BEFORE: NO.
- COMPANY_MIGRATION_EXISTED_BEFORE: NO.
- COMPANY_DOMAIN_EXISTED_BEFORE: NO.
- COMPANY_CRUD_EXISTED_BEFORE: NO.
- UNIT_TYPE_TABLE_IMPLEMENTED_BEFORE: NO.
- B1_IMPLEMENTATION: DONE after owner decision; the entries above describe
  the state before B1 writes.
- POSTGRESQL_TESTS: PASS.

ACCEPTED_DECISIONS:
- OD-001 RESOLVED: ACTIVE/INACTIVE lifecycle; creation ACTIVE; only ACTIVE↔INACTIVE transitions; hard delete forbidden; inactive units remain queryable; history and existing descendants remain; no descendant cascade; inactive units cannot receive new children or be selected as new reparent targets.
- OD-002 RESOLVED: company_id mandatory; roots use parent_id null and multiple roots per company are allowed; parent/child must share company; cross-company parenting/reparenting forbidden; in-company reparenting allowed only to an ACTIVE non-self, non-descendant parent; IDs/history preserved; root moves allowed; optimistic concurrency, audit and structural serialization required; no Company CRUD in this task; Phase B must inspect company persistence and record any minimal prerequisite.
- OD-003 RESOLVED: Organization-owned configurable organizational_unit_types with UUIDv7 id, immutable canonical uppercase code, mutable name, ACTIVE/INACTIVE lifecycle, no hard delete, inactive types queryable for history but forbidden for new units, OrganizationalUnit references type ID, and initial seeds DEPARTMENT, DIVISION, DIRECTION, SECTION, FRONT_OFFICE, BACK_OFFICE, MANAGEMENT; no generic reference platform.
- OD-004 RESOLVED: code required, trim plus invariant uppercase, regex ^[A-Z0-9][A-Z0-9_-]{0,49}$, max 50, immutable, unique within Company via UNIQUE(company_id, code); name required, trimmed, non-empty, max 200, mutable.
- OD-005 RESOLVED: flat list GET requires companyId and accepts optional parentId/unitTypeId/status; get, create, PUT, activate, deactivate and dedicated reparent routes are fixed; no tree/children, DELETE or generic PATCH; create/commands use the agreed fields and expectedRowVersion; ordinary PUT cannot change identity/parent/code/status; reparent requires ACTIVE source; standard 400/401/403/404/409 errors and OPTIMISTIC_CONCURRENCY_CONFLICT apply.
- OD-006 RESOLVED: canonical organization.read/create/change permissions; no organization.reparent; reparent and lifecycle use organization.change; registry and Identity seed must remain exactly synchronized; no sites.* reuse; no new Company/OrganizationalUnit access-assignment dimensions yet; production deny-by-default; full branch scope evaluation deferred.
- OD-007 RESOLVED: OrganizationalUnit audit entity with Created/Updated/Reparented/Activated/Deactivated actions; server-derived action; allowlisted before/after snapshots; Organization-owned atomic durable obligations; no direct Audit/Sites schema writes; generalized delivery ports to one canonical IAuditWriter with stable UUIDv7 EventId, at-least-once and idempotent materialization.
- STRUCTURAL_CONCURRENCY RESOLVED: transaction-scoped per-Company PostgreSQL advisory lock in a dedicated Organization hierarchy namespace; lock required for create-with-parent, reparent/root move and OrganizationalUnit deactivation; after lock reread state and run recursive CTE ancestry/cycle checks plus same-company, ACTIVE parent/source and self/descendant validation; mutation plus Organization audit obligation commits atomically; row_version remains separate; activation and ordinary name/type updates do not require the structural lock; different Companies do not block; stable lock-key derivation and allowed hash collisions (extra serialization only) must be documented; concurrency tests cover reparent/create versus parent/source deactivation in both orders.
- ADR_REQUIRED: YES, new ADR scope is transaction-safe per-company organizational hierarchy serialization, lifecycle eligibility synchronization and cycle prevention.

ADR_REQUIRED: YES
ADR_SCOPE: transaction-safe per-Company organizational hierarchy serialization, lifecycle eligibility synchronization and cycle prevention.

COMPANY_PERSISTENCE_PREREQUISITE: RESOLVED. Organization owns the minimal
`organization.companies` table with required UUIDv7 ID, canonical immutable
unique code, mutable trimmed name and ACTIVE/INACTIVE status. No Company CRUD.

PROPOSED_IMPLEMENTATION_PHASES:
- Phase B1: Organization module foundation, Company persistence gap verification/minimal prerequisite, DbContext/schema migration, OrganizationalUnitType reference persistence and seed.
- Phase B2: DONE — OrganizationalUnit domain/persistence, FKs/uniqueness/lifecycle, business history, ADR-012 lock/recursive CTE cycle safety, and Organization audit obligations.
- Phase C1: DONE — application handlers, DTOs/routes, Identity seed and organization.read/create/change policy gates.
- Phase C2: DONE — Organization delivery adapter and independent multi-source technical host through the existing canonical IAuditWriter.
- Phase C3: PostgreSQL, authorization, audit, concurrency and architecture review, including parent/source deactivation races and different-Company serialization.
- Phase C4: final docs/gates and implementation task commit in the later authorized phase.

DOCUMENTATION_SYNC: PASS

NEXT_ACTION:
Inspect the full staged task diff, create the one task commit, push main, and
verify hosted CI. Do not start another Task ID.

DO_NOT_REPEAT:
- Do not repeat C1 API/Identity migration or authorization implementation.
- Do not re-run the full B2 structural concurrency matrix without a C3 reason.
- Do not repeat broad read-only preflight.
- Do not repeat B1 Company foundation, migration or seed.
- Do not repeat B1/B2 foundation, migration or concurrency tests from scratch.
- Do not repeat C2 AuditDelivery port, host integration or PostgreSQL proof.
- Do not begin C3 from this checkpoint automatically.
- Do not update Identity production permission seed during B1.
- Do not create task implementation commit or push.


C4_FINALIZATION_CURRENT:
- Implementation task commit: 2f8ba4e15f65d7cc6ce79bbd41f5778c23e329bb; pushed to main.
- Remote main matches HEAD at the implementation commit; worktree was clean before this checkpoint/doc synchronization update.
- Local final gates, traceability and documentation sync PASS; open CRITICAL/HIGH/MEDIUM findings: 0.
- Hosted CI is UNVERIFIED: GitHub Actions page and unauthenticated API returned 404; browser session is signed out; gh CLI unavailable. Do not record PASS without run evidence.
- Deferred LOW: permission middleware 401/403 response body/OpenAPI schema consistency (per owner instruction, do not change middleware).
- Deferred NOTE: historical Sites:AuditDelivery config section name (per owner instruction, do not rename).
- NEXT_ACTION: verify required hosted CI for the pushed implementation commit when repository Actions access is available; update this checkpoint and reach CLEAN_BASELINE. Do not begin another Task ID.
