# TASK-02.01.01 — Territorial Zones

STATUS: PHASE_C3RR_COMPLETE_AWAITING_C4

CURRENT_PHASE: C3RR

OWNER_DECISIONS:

- Module owner: Sites
- Hierarchy: Territorial Zone → Region → Site
- Status: ACTIVE / INACTIVE
- Create = ACTIVE
- Hard delete forbidden
- Deactivation represents delete semantics
- code canonicalization: trim + uppercase invariant
- code immutable
- name mutable
- permissions:
  - sites.read
  - sites.create
  - sites.change
- production authorization remains deny-by-default
- no DEV/admin bypass
- read model is query DTO, not persisted projection
- API:
  - GET /api/v1/territorial-zones
  - GET /api/v1/territorial-zones/{id}
  - POST /api/v1/territorial-zones
  - PUT /api/v1/territorial-zones/{id}
  - POST /api/v1/territorial-zones/{id}/activate
  - POST /api/v1/territorial-zones/{id}/deactivate
- no DELETE endpoint
- Audit entity: TerritorialZone
- Audit actions:
  - TerritorialZoneCreated
  - TerritorialZoneRenamed
  - TerritorialZoneActivated
  - TerritorialZoneDeactivated
- optimistic concurrency required
- Sites owns schema/migrations
- expected table: sites.territorial_zones
- UUIDv7
- no global DbContext/UoW
- Atomicity option: Option B — Sites-owned transactional audit obligation/outbox
- SUCCESS requires the Sites mutation and durable audit obligation to commit atomically in the same Sites-owned PostgreSQL transaction
- `audit.events` visibility before SUCCESS is not required
- delivery is at-least-once and PostgreSQL is the durable source of truth
- final audit event UUIDv7 is generated before the Sites transaction commits and remains stable across delivery retries
- Audit materialization is idempotent by `audit_event_id`
- pending obligations survive restart and remain observable/retryable; permanent failure is never silently discarded
- RabbitMQ is not required for this Task
- no shared Sites/Audit transaction, global Unit of Work, distributed transaction, or direct cross-module table writes
- code syntax confirmed: `^[A-Z0-9][A-Z0-9_-]{0,49}$`, maximum 50 characters
- name contract confirmed: trimmed, non-empty, mutable, maximum 200 characters

KNOWN_ARCHITECTURAL_RISK:

Mandatory audit atomicity for durable business mutation.

INITIAL_NEXT_ACTION:

PHASE_A:
Analyze minimal atomicity mechanism compatible with:

- module-owned DbContexts;
- same PostgreSQL database;
- ADR-008;
- ADR-010;
- existing Audit writer;
- no global UoW;
- no distributed transaction;
- no second audit mechanism.

If new architectural decision is required:
STOP and request owner decision before write-command implementation.

PHASE_A_RESULT:

- Current `IAuditWriter.AppendAsync` uses a separately registered scoped `AuditDbContext` and calls `SaveChangesAsync`; it owns its own local EF/Npgsql transaction boundary.
- Current Sites persistence does not exist yet. There is no approved cross-context transaction coordinator, shared connection contract, or implemented audit outbox/dispatcher.
- Therefore the current contract cannot atomically guarantee both `sites.territorial_zones` and `audit.events` before a successful command response.
- Atomic presence in `audit.events` before SUCCESS is stronger than a durable eventual obligation. The fixed requirement is not satisfied by an untracked background publish; it requires either same-transaction audit INSERT or an atomically persisted, retryable obligation whose loss is impossible and whose delivery is observable/idempotent.

OPTION_A_SHARED_POSTGRES_TRANSACTION:

- Mechanism: explicitly share one PostgreSQL connection/transaction between SitesDbContext and AuditDbContext, with Audit writer participating through an infrastructure contract; commit once after both writes.
- Guarantees: business INSERT and audit INSERT commit or roll back together; no SUCCESS after one committed without the other.
- Failure behavior: any audit/business/connection/cancellation failure rolls back the shared transaction; retry must create a new transaction and use command/idempotency/concurrency rules.
- Coupling/cost: requires a new cross-module transaction participation contract, connection lifetime/orchestration, and careful EF `UseTransaction` handling; current DI registrations cannot do this.
- ADR compatibility: can preserve module-owned schemas/contexts, but is new cross-module infrastructure and risks becoming a hidden global UoW; owner decision required.

OPTION_B_SITES_TRANSACTIONAL_AUDIT_OBLIGATION:

- Mechanism: atomically persist the zone mutation plus a Sites-owned durable audit obligation/outbox record, then a reliable idempotent dispatcher calls the canonical Audit writer.
- Guarantees: durable obligation cannot be silently lost; audit.events is eventual, not present before response. SUCCESS is valid only if the accepted contract explicitly permits this eventual guarantee and exposes/reconciles delivery failures.
- Failure behavior: mutation and obligation roll back together; crash/timeout after commit is recoverable by dispatcher; Audit failure retries with bounded retry/DLQ and idempotency; no direct Sites write to audit.events.
- Coupling/cost: adds obligation model, dispatcher, retry/idempotency/observability and likely integration/outbox ownership decisions; larger than this CRUD task.
- ADR compatibility: aligns with ADR-005/008/010 if formally extended, but it is a second durable record shape for audit delivery and must not become a second audit trail.

OPTION_C:

- No existing repository mechanism provides the required cross-module guarantee. Sequential calls to the current writer are not an acceptable Option C.

FAILURE_CASE_ANALYSIS:

- Option A: Sites INSERT, Audit INSERT failure; Audit INSERT, Sites failure; process crash; timeout/cancellation; or DB failure all roll back one shared transaction. Retry uses a new transaction. Duplicate requests and optimistic conflicts require idempotency/concurrency checks before commit; otherwise a retried successful command could create duplicate business/audit pairs. No SUCCESS is returned for an uncommitted pair.
- Option B: mutation and obligation either both commit or both roll back. Crash/timeout after commit leaves a recoverable pending obligation, not a silent loss. Audit delivery retries must be idempotent; duplicate commands need business idempotency, while duplicate delivery must use a stable obligation/event key. Optimistic conflict prevents the mutation/obligation pair. A dispatcher outage delays audit.events, so this option cannot claim presence-before-SUCCESS.

ATOMICITY_DECISION_REQUIRED: NO

RECOMMENDED_OPTION_SUPERSEDED:

Owner should choose explicitly between Option A (preferred for the stated presence-before-SUCCESS invariant, with a narrowly scoped transaction-participation contract) and Option B (only if eventual durable audit delivery is accepted as the command guarantee). Do not implement either until approved.

CONTRACT_RECOMMENDATIONS:

- Code: trim, invariant uppercase, ASCII canonical syntax `^[A-Z0-9][A-Z0-9_-]{0,49}$`, maximum 50 characters, unique persisted canonical value, immutable after creation. Confirmed by owner decision.
- Name: trim, non-empty, maximum 200 characters, mutable.
- Status: ACTIVE/INACTIVE; create ACTIVE; activate/deactivate commands only; no DELETE.
- Concurrency: bigint `row_version` optimistic concurrency, exposed through the existing API version/ETag or If-Match convention; stale writes return 409 `OPTIMISTIC_CONCURRENCY_CONFLICT`.
- API: fixed `/api/v1/territorial-zones` routes; list/get use `sites.read`, create uses `sites.create`, rename/activate/deactivate use `sites.change`; unauthenticated 401, denied 403, missing 404, validation 400, duplicate/state/concurrency 409, mandatory-audit failure 503 only if the selected mechanism cannot complete safely. Responses are DTOs, never domain entities.
- Audit: entity `TerritorialZone`; actions `TerritorialZoneCreated`, `TerritorialZoneRenamed`, `TerritorialZoneActivated`, `TerritorialZoneDeactivated`; register them in the canonical Audit catalog during implementation, without a second writer.

OWNER_DECISION_BLOCKER_RESOLVED:

Resolved by approval of Option B, the durable-obligation SUCCESS guarantee, and the proposed code/name constraints.

OWNER_DECISION:

- Approved Option B.
- Sites owns the business mutation and transactional audit-obligation persistence.
- Audit owns `audit.events`, the canonical writer, and canonical audit validation.
- The command may report SUCCESS only after the Sites mutation and its mandatory obligation commit together.
- The final `audit.events` row may be materialized asynchronously.
- Delivery is at-least-once; retries reuse the pre-generated UUIDv7 `audit_event_id`.
- Failed delivery remains durable, observable, and retryable.
- An in-process/background dispatcher is acceptable when it recovers persisted pending obligations after restart.
- No global ordering guarantee; preserve `occurred_at` and stable IDs.

ADR_REQUIRED: SATISFIED

ADR_CREATED: ADR-011

ADR-011 records the reusable pattern: atomic module-owned business transaction plus module-owned durable audit obligation/outbox plus eventual idempotent delivery to Audit-owned `audit.events`.

USAGE_BEFORE:

- 5H remaining: 97% (telemetry used 3%)
- Weekly remaining: 30% (telemetry used 70%)

USAGE_AFTER:

- 5H remaining: 90% (telemetry used 10%)
- Weekly remaining: 29% (telemetry used 71%)
- TOKEN_COUNT: UNAVAILABLE

RECOMMENDED_NEXT_MODEL: Sol

RECOMMENDED_NEXT_EFFORT: High
RECOMMENDED_MINIMUM_5H_BUDGET: 70%

GIT_STATE: DIRTY_IMPLEMENTATION_UNCOMMITTED; Phase B implementation and checkpoint changes are uncommitted; main matches origin/main

LAST_SAFE_COMMIT: 0d94ce3e7244671ead0658080db545dd8b852f6f

PHASE_B_STATUS: COMPLETE

PHASE_B4_MIGRATION_DECISION:

- `InitialTerritorialZones` is untracked and absent from Git history; revise/regenerate it in place.
- Existing Audit migration is committed/shared; do not rewrite it. Add an additive Audit migration for the event-ID database guard.

PHASE_B4_PLAN:

- Enforce UUIDv7 in Domain and PostgreSQL for Sites IDs, audit obligations and Audit event IDs.
- Derive TerritorialZone obligations from operation-specific mutation methods with typed allowlisted payloads.
- Add relational zone binding and DB immutability/state-coherence guards for Sites obligations.
- Extend canonical Audit writer for caller-supplied stable IDs and same-content idempotent retries.
- Enforce strict monotonic TerritorialZone UpdatedAt at PostgreSQL timestamp precision.
- Reconcile stale schema documentation and add focused negative/runtime tests.

PHASE_B_DOMAIN_MODEL:

- Sites-owned `TerritorialZone` with UUIDv7 ID, ACTIVE/INACTIVE lifecycle, canonical immutable code, mutable name, timestamps and bigint row_version.
- Domain transitions reject redundant activation/deactivation and preserve row-version semantics.

PHASE_B_PERSISTENCE:

- `SitesDbContext` owns schema `sites` and migration history `sites.__ef_migrations_history`.
- `sites.territorial_zones` stores the canonical zone model and unique code constraint.
- `sites.audit_obligations` stores immutable audit payload data and PENDING/PROCESSED delivery state.
- `ITerritorialZoneCommandStore` persists the business mutation and obligation in one Sites DbContext SaveChanges transaction.

PHASE_B_MIGRATION:

- `InitialTerritorialZones` migration generated and included in the Sites Infrastructure assembly.
- DatabaseMigrator and API composition register the Sites module; no API endpoints were added.

PHASE_B_ADR:

- ADR-011 created for durable module-owned audit obligations and at-least-once idempotent eventual delivery.

PHASE_B_TESTS_RUN:

- Release solution build: PASS
- Sites domain checks: PASS
- Architecture checks: PASS
- Existing Identity domain checks: PASS
- CI workflow checks: PASS
- DatabaseMigrator registration checks: PASS
- `git diff --check`: PASS

PHASE_B2:

- DOCKER_STATUS: PASS — Docker Desktop Linux engine started normally; Docker Server 29.8.0 available.
- POSTGRESQL_RUNTIME_VALIDATION: PASS — `Exploitation.SitesPersistenceChecks` completed against PostgreSQL 18.6 Testcontainers.
- MIGRATION_RUNTIME_VERIFIED: YES — clean Sites database reported one pending migration, first migration applied, second execution reported zero pending migrations.
- ATOMICITY_RUNTIME_VERIFIED: YES — duplicate audit obligation rolled back the zone mutation; duplicate zone identity rolled back the audit obligation.
- CONCURRENCY_RUNTIME_VERIFIED: YES — stale writer raised `DbUpdateConcurrencyException`.
- UNIQUE_CODE_RUNTIME_VERIFIED: YES — equivalent canonical code was rejected by `ux_territorial_zones_code`.
- SCHEMA_ISOLATION_RUNTIME_VERIFIED: YES — Sites tables and Sites-owned migration history exist; Audit and Identity marker tables remained intact.
- FILES_CHANGED_DURING_B2: `.agent/tasks/TASK-02.01.01/state.md` only.
- IMPLEMENTATION_CHANGES_REQUIRED: NO.
- PHASE_B2_COMPLETE: YES.

PHASE_B3:

- INDEPENDENT_REVIEW: FAIL — no CRITICAL findings, but HIGH findings remain.
- PHASE_B: NOT_COMPLETE.
- REVIEW_FILES: Phase-B Sites Domain/Application/Infrastructure/migration, Audit Contracts/Writer, ADR-011, relevant docs and tests.

FINDINGS:

- ID: B3-HIGH-001
  SEVERITY: HIGH
  LOCATION: `src/backend/Modules/Sites/Exploitation.Modules.Sites.Domain/TerritorialZones/TerritorialZone.cs:24-27,57-62`; `20260921222656_InitialTerritorialZones.cs:52-58`
  ISSUE: `TerritorialZone.Create` rejects only `Guid.Empty`; any non-empty GUID version can be created and persisted. The Sites migration has no UUIDv7 enforcement.
  IMPACT: A core entity can violate the mandatory UUIDv7 identity invariant.
  EVIDENCE: Domain constructor checks only emptiness; the unit test covers only a UUIDv7 happy path; the database column is plain `uuid`.
  MINIMAL_REMEDIATION: Enforce `Guid.Version == 7` in the domain factory and add a negative test; add a database-side safeguard if the selected PostgreSQL strategy can enforce it safely.

- ID: B3-HIGH-002
  SEVERITY: HIGH
  LOCATION: `src/backend/Modules/Sites/Exploitation.Modules.Sites.Infrastructure/Persistence/TerritorialZoneCommandStore.cs:9-23`; `AuditObligation.cs:37-47,64-68`
  ISSUE: The command store accepts an arbitrary valid TerritorialZone audit draft without binding `auditObligation.EntityId` to `zone.Id` or validating action/state correspondence.
  IMPACT: A zone mutation can commit atomically with an obligation for a different or nonexistent entity, making the durable audit fact incorrect.
  EVIDENCE: Only the action/entity catalog membership is checked; no entity-ID equality or operation-specific transition check exists. Independent review reproduced this path statically.
  MINIMAL_REMEDIATION: Use operation-specific command contracts or at minimum enforce entity-ID equality and validate action against the mutation transition, with negative tests.

- ID: B3-HIGH-003
  SEVERITY: HIGH
  LOCATION: `src/backend/Modules/Audit/Exploitation.Modules.Audit.Contracts/AuditEventDraft.cs:3-14`; `AuditWriter.cs:7-12`; `AuditEvent.cs:91-92`
  ISSUE: The durable obligation stores a stable `audit_event_id`, but the canonical Audit contract cannot accept it; `AuditEvent.Create` generates a fresh UUIDv7 on every append.
  IMPACT: A future at-least-once delivery retry cannot materialize the obligation idempotently by the stored event ID and can create duplicate Audit events, violating ADR-011 readiness.
  EVIDENCE: `IAuditWriter.AppendAsync` accepts only `AuditEventDraft`; `AuditWriter` calls `AuditEvent.Create`, which unconditionally creates a new ID.
  MINIMAL_REMEDIATION: Add an Audit-owned explicit-ID/idempotent append contract and tests; keep dispatcher implementation out of B3.

- ID: B3-MEDIUM-001
  SEVERITY: MEDIUM
  LOCATION: `TerritorialZoneConfiguration.cs:11-18,22-46`; `20260921222656_InitialTerritorialZones.cs`
  ISSUE: Database constraints enforce length, status, nonblank name, positive row version and uniqueness, but not canonical uppercase/code syntax or code immutability; `audit_obligations.entity_id` has no FK to the Sites zone table.
  IMPACT: An alternate SQL/administrative path can persist noncanonical or later-mutated codes, and an obligation can reference a nonexistent zone.
  EVIDENCE: Migration has no code-format/immutability check and no relationship constraint for `entity_id`; domain-only normalization is not a database invariant.
  MINIMAL_REMEDIATION: Add an ownership-safe write boundary and justified database constraints/FK, preserving module ownership and avoiding destructive migration.

- ID: B3-MEDIUM-002
  SEVERITY: MEDIUM
  LOCATION: `AuditObligationConfiguration.cs:10-14,38-48`
  ISSUE: Database checks do not enforce coherence between `delivery_status` and `processed_at`, and the immutable audit payload has no guarded transition/update boundary.
  IMPACT: A future delivery implementation could expose inconsistent processed/pending state or mutate the payload while retaining the same event ID.
  EVIDENCE: Only status enum and nonnegative attempt count are constrained; payload and metadata are mapped as ordinary updateable columns.
  MINIMAL_REMEDIATION: Add explicit delivery transition methods and justified state checks/constraints before Phase C delivery; do not add a dispatcher in B3.

- ID: B3-MEDIUM-003
  SEVERITY: MEDIUM
  LOCATION: `docs/database.md:421-429` and MVP references around `docs/database.md:3923-3927`, compared with `docs/modules/sites.md:10-59` and `docs/context/sites.context.md`
  ISSUE: Documentation still lists `organization.territorial_zones` while the accepted owner decision and implementation place the table under `sites`.
  IMPACT: Future migrations or module work can target the wrong schema; Documentation Sync Gate is not satisfied.
  EVIDENCE: Conflicting schema descriptions exist in repository documentation.
  MINIMAL_REMEDIATION: Remove or explicitly mark the stale Organization entries and retain Sites ownership before Phase C.

- ID: B3-NOTE-001
  SEVERITY: NOTE
  LOCATION: `AuditObligation.cs:54-62,98-108`; `AuditEvent.cs:102-148`
  ISSUE: TerritorialZone before/after JSON is only checked as a JSON object and size-limited; no entity-specific allowlist or secret redaction exists.
  IMPACT: Caller discipline is required to avoid persisting tokens, passwords or other secrets. This is a Phase-C contract concern, not a new B3 writer.
  EVIDENCE: Audit validation special-cases UserContext only; TerritorialZone payload fields are not restricted.
  MINIMAL_REMEDIATION: Define and enforce a canonical TerritorialZone payload allowlist before delivery integration.

- ID: B3-NOTE-002
  SEVERITY: NOTE
  LOCATION: `TerritorialZone.cs:123-132`
  ISSUE: `UpdatedAt` is not monotonic; a caller can supply an earlier timestamp on a later mutation.
  IMPACT: Lower-risk temporal ordering ambiguity for history/audit correlation.
  EVIDENCE: `ApplyChange` validates only `default`, not ordering against `UpdatedAt`.
  MINIMAL_REMEDIATION: Decide and test timestamp monotonicity if required by the canonical history contract.

PHASE_B4:

- B3-HIGH-001: FIXED / VERIFIED — TerritorialZone factory requires UUIDv7; Sites migration rejects non-v7 IDs.
- B3-HIGH-002: FIXED / VERIFIED — operation-specific command methods derive entity/action/snapshots; relational binding and negative DB checks reject mismatches.
- B3-HIGH-003: FIXED / VERIFIED — canonical Audit draft carries caller-supplied UUIDv7 EventId; writer preserves it, same-content retries are no-op, conflicting content fails closed, concurrent retry is covered.
- B3-MEDIUM-001: FIXED / VERIFIED — canonical code DB check, code immutability trigger, UUIDv7 guards and territorial-zone FK/entity binding are present and tested.
- B3-MEDIUM-002: FIXED / VERIFIED — PENDING/PROCESSED coherence checks, immutable obligation payload trigger and one-way delivery methods are present and tested.
- B3-MEDIUM-003: FIXED / VERIFIED — stale Organization territorial-zone documentation was reconciled to Sites ownership.
- NOTES: RESOLVED — TerritorialZone payloads use an explicit id/code/name/status allowlist; UpdatedAt advances strictly at PostgreSQL microsecond precision.
- MIGRATION_STRATEGY: Sites `InitialTerritorialZones` was regenerated in place because it was untracked/unshared; Audit UUIDv7 guard was added as a separate additive migration because Audit history is committed.
- TARGETED_TESTS: Sites domain PASS; Sites PostgreSQL PASS; Audit PostgreSQL PASS; architecture PASS; CI workflow PASS; DatabaseMigrator checks PASS; Release build PASS; solution test command PASS; `git diff --check` PASS; secret hygiene PASS.
- IMPLEMENTATION_CHANGES_DURING_B4: production, migration, tests and documentation changed; no HTTP API or dispatcher was added.

PHASE_C1_STATUS: DONE

PHASE_C1_RESUME_2026_09_23:

- C1_RESUME_SAFE: YES — main and origin/main remain at `0d94ce3e7244671ead0658080db545dd8b852f6f`; the dirty worktree is the preserved TASK-02.01.01 implementation.
- CHECKPOINT_MATCHES_GIT: YES after this reconciliation; no staged changes exist.
- C1_IMPLEMENTATION_PRESENT: YES — six application handlers, read model/store, module registration and API endpoint mapping are present.
- API_ROUTES_IMPLEMENTED: YES in source; runtime/OpenAPI verification is pending.
- APPLICATION_USE_CASES_IMPLEMENTED: YES in source; targeted runtime verification is pending.
- AUTHORIZATION_WIRED: YES in source through canonical `RequirePermission`; negative/positive C1 matrix is pending runtime verification.
- TESTS_ALREADY_RUN_AFTER_INITIAL_C1_CODE: API project Release build PASS and architecture checks PASS before the latest SitesApiChecks edits.
- TESTS_PENDING: SitesApiChecks build/runtime, Sites domain, Sites PostgreSQL, authorization matrix, OpenAPI, Release build, relevant regression, diff check and secret hygiene.
- LAST_TEST_RESULT: All C1 targeted and relevant regression checks pass after the final C1 source changes.
- UNCOMMITTED_FILES: all TASK-02.01.01 Phase B/C1 implementation remains intentionally unstaged and uncommitted; no unrelated ownership change was detected.

PHASE_C1_PLAN:

- Define Sites application read model, command inputs and use-case handlers without HTTP/Identity/EF dependencies.
- Add module-owned query and lookup adapters over SitesDbContext.
- Map six Territorial Zone routes with canonical permissions, request-scoped working context metadata and project error contract.
- Add focused HTTP tests with PostgreSQL-backed Sites persistence and a test-only explicit grant source.

PHASE_C1_DECISIONS:

- API resolves validated local actor identity at the boundary; Sites Application receives only clean actor/context/correlation/time metadata.
- `rowVersion` is carried explicitly in mutation request bodies; stale or concurrent writes map to `OPTIMISTIC_CONCURRENCY_CONFLICT`.
- C1 only persists Sites-owned obligations; no dispatcher and no direct `audit.events` write.

PHASE_C1_VERIFICATION:

- PHASE_C1: DONE
- APPLICATION_USE_CASES: PASS — list/get/create/rename/activate/deactivate handlers use clean Application inputs and module-owned ports.
- API: PASS — all six fixed routes, DTO/error schemas and Development OpenAPI operations are runtime-verified; no DELETE route exists.
- AUTHORIZATION: PASS — canonical `sites.read`, `sites.create`, `sites.change` isolation is negative-first verified; unauthenticated is 401, missing grant is 403, and UserType/role/context are not grants.
- CONCURRENCY_HTTP_MODEL: PASS — explicit `expectedRowVersion`; stale rename/activate/deactivate return `409 OPTIMISTIC_CONCURRENCY_CONFLICT`.
- WORKING_CONTEXT_INTEGRATION: PASS — middleware validation/audit remains intact; validated context is obligation metadata only and grants nothing.
- WRITE_OUTBOX_INTEGRATION: PASS — every successful mutation commits exactly one correct `PENDING` Sites obligation; failed validation, duplicate, stale and redundant commands create none.
- AUDIT_DELIVERY: NOT_STARTED — no dispatcher, background delivery or direct `audit.events` write exists in C1.
- POSTGRESQL_TESTS: PASS — Sites persistence and PostgreSQL-backed Sites API checks pass.
- TARGETED_TESTS: PASS — Sites domain, Sites API/application/authorization, existing authentication/working-context regression, architecture and solution test command pass.
- OPENAPI_CHECK: PASS — component schemas and all six operations are checked by SitesApiChecks; bootstrap smoke checks the route paths.
- RELEASE_BUILD: PASS — `dotnet build Exploitation.sln --configuration Release --no-restore`, zero warnings/errors.
- CI_WORKFLOW_CHECK: PASS — hosted workflow includes the Sites API integration runner and static workflow check passes.
- DOCUMENTATION_SYNC: PASS — Sites module doc and context capsule describe C1 API, permission, concurrency, context and pending-obligation boundaries.
- GIT_DIFF_CHECK: PASS — no whitespace errors; only existing line-ending conversion warnings were reported.
- SECRET_HYGIENE: PASS — no secret signatures in C1 paths; test-only credentials remain non-production fixtures.
- TASK_COMMIT: NOT_CREATED — C1 checkpoint is intentionally uncommitted with the ongoing TASK-02.01.01 worktree.

NEXT_ACTION: PHASE_C3 — focused security/architecture review of the complete C1+C2 slice.
NEXT_ACTION_AFTER_VALIDATION: PHASE_C3 — focused security/architecture review of the complete C1+C2 slice.

PHASE_B5:

- INDEPENDENT_REVIEW: PASS
- B3-HIGH-001: CLOSED — UUIDv7 is enforced in the domain and Sites PostgreSQL migration; negative runtime coverage passed.
- B3-HIGH-002: CLOSED — operation-specific command methods bind entity, action and lifecycle snapshot; relational and negative checks passed.
- B3-HIGH-003: CLOSED — caller-supplied UUIDv7 EventId is preserved; identical retries are no-op, conflicts fail closed, and concurrent retry coverage passed.
- B3-MEDIUM-001: CLOSED — canonical code constraint, immutable-code trigger, UUIDv7 guards and territorial-zone FK are present and covered by negative PostgreSQL checks.
- B3-MEDIUM-002: CLOSED — PENDING/PROCESSED coherence, immutable payload protection and one-way delivery transitions are enforced and tested.
- B3-MEDIUM-003: CLOSED — documentation consistently assigns `sites.territorial_zones` to Sites; no stale `organization.territorial_zones` reference remains.
- AUDIT_PAYLOAD_NOTE: CLOSED — TerritorialZone payloads are restricted to the canonical `id`, `code`, `name`, `status` allowlist.
- UPDATED_AT_NOTE: CLOSED — UpdatedAt advances strictly at PostgreSQL microsecond precision and has focused regression coverage.
- ADR_011_REVIEW: PASS — implementation matches approved Option B and stable-ID at-least-once delivery contract.
- MIGRATION_REVIEW: PASS — Sites initial migration and additive Audit UUIDv7 migration are consistent with module ownership and runtime migration checks.
- MODULE_BOUNDARY_REVIEW: PASS — Sites owns its schema/obligations; Audit remains the canonical event owner; no direct cross-module table write was added.
- NEW_FINDINGS: NONE
- TARGETED_RUNTIME_EVIDENCE: Sites domain, Sites PostgreSQL persistence and Audit PostgreSQL persistence checks passed during B5 verification.
- PHASE_B5_COMPLETE: YES
- PHASE_B_COMPLETE: YES

PHASE_C2_START_CHECKPOINT_2026_09_23:

- CHECKPOINT_STATUS: SAFE — repository-state-guard and task-resume reconciled Git with this checkpoint before any C2 production edit.
- REPOSITORY_STATE: DIRTY_EXPECTED; `main` and `origin/main` remain at `0d94ce3e7244671ead0658080db545dd8b852f6f`; all current dirty files belong to the preserved TASK-02.01.01 Phase B/C1 slice.
- MINIMUM_CHECK: Release solution build PASS with zero warnings/errors; architecture checks PASS; `git diff --check` reports no whitespace errors.
- C2_CONTRACT: PostgreSQL-backed, bounded, cancellation-aware at-least-once delivery through canonical `IAuditWriter`; no RabbitMQ correctness dependency and no direct cross-module database write.
- DISPATCHER_LOCATION: dedicated technical host component outside Sites Domain, depending only on a Sites Application delivery port and Audit Contracts.
- CONCURRENCY_DECISION: Sites Infrastructure owns `FOR UPDATE SKIP LOCKED` batch selection and retains the Sites transaction/row locks through canonical Audit append and the subsequent delivery-state update.
- SCHEMA_DECISION: no new migration planned; the existing untracked Sites initial migration already contains the required PENDING/PROCESSED, attempt_count, last_error and processed_at fields.
- RETRY_DECISION: bounded attempts per obligation per polling cycle; failed append attempts remain PENDING with a bounded non-secret diagnostic; successful/idempotent append is followed by PROCESSED persistence.
- BLOCKERS: NONE.
- NEXT_ACTION: implement the Sites delivery port/store and technical Audit delivery dispatcher, then add focused PostgreSQL integration coverage.

PHASE_C2_COMPLETION_2026_09_23:

- CHECKPOINT_STATUS: SAFE — final repository-state-guard found no checkpoint/Git drift, no staged changes, no conflict markers and no whitespace errors; `main` and `origin/main` remain at `0d94ce3e7244671ead0658080db545dd8b852f6f`.
PHASE_C2: DONE

AUDIT_DELIVERY: PASS

DELIVERY_MODEL: AT_LEAST_ONCE

IDEMPOTENCY: PASS

RESTART_SAFETY: PASS

CONCURRENT_DISPATCH: PASS

OUTBOX_TO_AUDIT: PASS

- IDEMPOTENCY_EVIDENCE: every obligation reuses its stable `audit_event_id`; identical canonical appends are no-op and a conflicting event fails closed.
- RESTART_EVIDENCE: a persisted PENDING obligation is delivered after rebuilding the host/provider, while a crash-window retry with an already materialized canonical event produces no duplicate.
- CONCURRENCY_EVIDENCE: PostgreSQL `FOR UPDATE SKIP LOCKED` claims bounded ordered batches and two concurrent dispatchers process disjoint obligations.
- DELIVERY_BOUNDARY_EVIDENCE: `sites.audit_obligations` is delivered only through canonical `IAuditWriter`; the dispatcher does not write `audit.events` directly.
- FAILURE_SEMANTICS: PASS — failed canonical appends remain PENDING, increment `attempt_count`, retain bounded sanitized `last_error`, and retry on a later polling cycle; PROCESSED is recorded only after append success/idempotent success.
- HOSTED_SERVICE: PASS — polling and per-cycle retries are bounded and cancellation-aware; startup is non-blocking; shutdown is clean; a failed cycle is isolated and retried after the configured interval.
- SCHEMA_CHANGED: NO — existing Phase B schema fields were sufficient.
- MIGRATION_CREATED: NO
- RELEASE_BUILD: PASS — Release solution build completed with zero warnings and zero errors after final C2 formatting.
- TARGETED_TESTS: PASS — delivery, Sites domain/API/persistence, Audit persistence, authentication/working-context regression, architecture, CI workflow and solution test commands passed.
- POSTGRESQL_TESTS: PASS — delivery behavior, retry, conflict, concurrency, crash window and restart use real PostgreSQL containers.
- API_BOOTSTRAP_SMOKE: PASS — liveness, readiness, OpenAPI and API process shutdown pass with the delivery hosted service registered.
- NARROW_FORMAT_CHECK: PASS — all C2 production/test source paths pass `dotnet format --verify-no-changes`.
- FULL_SOLUTION_FORMAT_NOTE: NOT_CLEAN_PRE_EXISTING — whole-solution verification still reports pre-existing formatting/charset findings in Identity, existing migrations and earlier Sites API files; no unrelated file was reformatted.
- DOCUMENTATION_SYNC: PASS — Sites, Audit, database, project-structure and deployment documentation records the C2 delivery, locking, failure, configuration and ownership boundaries; no ADR change is required.
- GIT_DIFF_CHECK: PASS — no whitespace errors; only existing line-ending conversion warnings were reported.
- SECURITY_HYGIENE: PASS — production delivery paths contain no token/password/connection-string material and persistence diagnostics never store raw exception messages.
- UNCOMMITTED_CHANGES: all TASK-02.01.01 Phase B/C1/C2 source, tests, docs and checkpoint files remain intentionally unstaged and uncommitted; no task commit was created.
- DECISIONS: technical delivery project outside Sites Domain; Sites Application owns the delivery port; Sites Infrastructure owns PostgreSQL claiming/state transitions; Audit Contracts remains the only append dependency; RabbitMQ is not a correctness dependency.
- BLOCKERS: NONE
NEXT_ACTION: PHASE_C3 — focused security/architecture review of complete C1+C2 slice.
- TASK_COMMIT: NOT_CREATED

DO_NOT_REPEAT:

- backlog discovery
- module ownership discussion
- status decision
- code normalization decision
- permission decision
- API shape decision
- audit action decision
- atomicity option decision
- code syntax and maximum length decision
- name maximum length decision
- Docker availability blocker
- PostgreSQL runtime validation
- B3 independent review findings
- B4 remediation findings and targeted verification
- B5 focused read-only re-review
- C1 application/API/authorization implementation and targeted verification

PHASE_C3_REVIEW_2026_09_23:

- CHECKPOINT_STATUS: SAFE — read-only review changed no production code, tests, migrations or documentation; only this checkpoint was updated.
- REPOSITORY_STATE: DIRTY_EXPECTED; `main` and `origin/main` remain at `0d94ce3e7244671ead0658080db545dd8b852f6f`; the preserved TASK-02.01.01 Phase B/C1/C2 diff still matches task ownership, with no staged changes or conflict markers.
- PHASE_C3: FINDINGS
- INDEPENDENT_REVIEW: FINDINGS
- PHASE_C: NOT_COMPLETE
- AUTHORIZATION_REVIEW: PASS — all six Territorial Zone routes use the intended canonical permission; unauthenticated, UserType, role-name and validated-context non-grant behavior is enforced by the shared authorization path.
- WORKING_CONTEXT_REVIEW: PASS — middleware validates ownership/availability and audits `WorkingContextApplied` before setting request-scoped context; Sites consumes only `RequestWorkingContext.Selected`, never the raw header.
- API_DOMAIN_REVIEW: PASS — transport DTOs do not expose EF/domain entities; callers cannot independently set audit action/type/event ID/payload/status; code is immutable and mutation requests require a positive expected row version.
- ATOMICITY_REVIEW: PASS — every successful create/rename/activate/deactivate performs the business mutation and exactly one Sites-owned obligation in one `SitesDbContext.SaveChangesAsync`; failure cannot return SUCCESS and no synchronous Audit append occurs in the command transaction.
- OBLIGATION_INTEGRITY_REVIEW: PASS — operation-specific factories bind zone/action/snapshots, stable UUIDv7 EventId, actor, validated context, correlation and occurrence time; private setters plus PostgreSQL trigger protect immutable payload.
- DISPATCH_CONCURRENCY_REVIEW: FINDINGS — `FOR UPDATE SKIP LOCKED` gives disjoint claims, but the whole batch transaction remains open across serial Audit calls and retry delays under multiplicatively unsafe option bounds.
- CRASH_WINDOW_REVIEW: PASS — pre-append failure rolls back to PENDING; post-append/pre-Sites-commit retry reuses EventId; committed PROCESSED rows are excluded; failed metadata persistence rolls back without losing the obligation.
- AUDIT_IDEMPOTENCY_REVIEW: PASS WITH FINDING — identical same-ID content is a no-op, conflicting content fails closed and concurrent insert races are handled; however a `SaveChangesAsync` failure other than a unique violation leaves the failed candidate tracked and makes the configured same-cycle retry unreliable.
- RETRY_FAILURE_REVIEW: FINDINGS — diagnostics are bounded/sanitized and failures remain PENDING, but poison PENDING rows can permanently monopolize the ordered LIMIT batch and starve later deliverable obligations.
- BACKGROUND_SERVICE_REVIEW: PASS WITH FINDING — startup is non-blocking, cancellation/polling/concurrency are bounded and cycle failures are isolated; unsafe compound lock duration is recorded below.
- MODULE_BOUNDARY_REVIEW: PASS — Sites Domain has no Audit dependency; Sites does not depend on Audit Infrastructure or write `audit.events`; the technical delivery component uses Sites Application plus Audit Contracts; no global DbContext/UoW, distributed transaction, RabbitMQ dependency or hidden cross-module SQL exists.
- DATABASE_REVIEW: PASS — no C2 migration is required; polling and ownership indexes are reasonable; Sites coherence/immutability triggers and Audit append-only/UUIDv7 protections remain intact under module-owned histories.
- ADR_011_REVIEW: PASS — command SUCCESS means committed mutation plus durable obligation, materialization is eventual at-least-once and idempotent, and PostgreSQL remains the durable source of truth.

FINDINGS:

- ID: C3-MEDIUM-001
  SEVERITY: MEDIUM
  LOCATION: `src/backend/Modules/Audit/Exploitation.Modules.Audit.Infrastructure/Persistence/AuditWriter.cs:24-31`; `src/backend/Exploitation.AuditDelivery/AuditObligationDispatcher.cs:31-66`
  ISSUE: After a `SaveChangesAsync` failure other than a unique violation, `AuditWriter` does not detach/reset the added candidate before rethrowing. The dispatcher retries with the same scoped writer/`AuditDbContext`, so the stale Added entity can make the next attempt fail with an EF tracking `InvalidOperationException` and be misclassified as a non-retryable conflict.
  IMPACT: `MaxAttemptsPerObligationPerCycle > 1` is unreliable for transient append failures; retries and diagnostics do not reflect actual canonical append attempts, and an ambiguous post-commit failure can also poison later appends in the same scoped batch. The durable obligation survives for a later cycle, so this is not data loss.
  EVIDENCE: Only the unique-violation catch detaches `candidate`; every other append failure is caught outside the writer and retried against the same scoped `IAuditWriter`. Current failure coverage substitutes a stateless `ThrowingAuditWriter`, so it does not exercise this EF state transition.
  MINIMAL_REMEDIATION: Ensure every failed append attempt uses a clean Audit persistence state (for example, detach/reset after any failed save or create a fresh writer/DbContext per attempt) and add a focused transient-save-failure same-cycle retry test.

- ID: C3-MEDIUM-002
  SEVERITY: MEDIUM
  LOCATION: `src/backend/Modules/Sites/Exploitation.Modules.Sites.Infrastructure/Persistence/AuditObligationDeliveryStore.cs:21-59`; `src/backend/Exploitation.AuditDelivery/AuditObligationDispatcher.cs:31-65`; `src/backend/Exploitation.AuditDelivery/AuditDeliveryRegistration.cs:18-30`
  ISSUE: One Sites transaction locks the entire claimed batch while Audit appends and configured retry delays execute serially. Individual option bounds are validated, but their product is not: batch 100, five attempts and four 60-second delays permit at least 6 hours 40 minutes of deliberate delay while the Sites connection/row locks remain held, excluding Audit call latency.
  IMPACT: A slow or failing Audit store can create very long transactions, retain obligation locks and consume one Sites pool connection per API replica, causing avoidable blocking, transaction bloat and delivery starvation pressure.
  EVIDENCE: The transaction begins before the `LIMIT ... FOR UPDATE SKIP LOCKED` query and commits only after the complete foreach; retry `Task.Delay` runs inside the callback before that commit. No per-batch duration/attempt timeout constrains the compound lock interval.
  MINIMAL_REMEDIATION: Bound total lock-held work rather than only each knob: process smaller claim transactions/per-item commits or use a short durable claim/lease, cap compound retry delay, and cover slow-Audit cancellation/lock duration.

- ID: C3-MEDIUM-003
  SEVERITY: MEDIUM
  LOCATION: `src/backend/Modules/Sites/Exploitation.Modules.Sites.Infrastructure/Persistence/AuditObligationDeliveryStore.cs:22-30,47-53`; `src/backend/Exploitation.AuditDelivery/AuditObligationDispatcher.cs:55-69`
  ISSUE: Every failure remains `PENDING`, while each cycle always selects the oldest PENDING rows by `created_at, id` with a fixed LIMIT. Once permanently failing/conflicting rows fill the batch, the dispatcher reclaims the same rows forever and never reaches newer valid obligations.
  IMPACT: Later successful HTTP mutations retain durable obligations but can remain unmaterialized in `audit.events` indefinitely even after Audit is otherwise healthy. Failed rows remain observable, but the normal dispatcher has deterministic head-of-line starvation.
  EVIDENCE: Conflict is classified non-retryable only inside the current cycle; the persisted status is still PENDING with no `next_attempt_at`, lease, terminal/quarantine state or fair ordering dimension, so the next poll selects it again ahead of newer rows.
  MINIMAL_REMEDIATION: Preserve durable/observable failure without requiring a dead-letter subsystem, but add fair/backoff scheduling (for example, a reviewed next-attempt/claim policy or attempt-aware selection) so poison rows cannot monopolize the batch; add a test with at least one full poison batch followed by a deliverable obligation.

HIGHEST_SEVERITY: MEDIUM

PHASE_C3_COMPLETE: NO

PHASE_C_COMPLETE: NO

VERIFIED_DURING_C3:

- `dotnet run --project tests/integration/Exploitation.SitesApiChecks/Exploitation.SitesApiChecks.csproj --configuration Release --no-build` — PASS.
- `dotnet run --project tests/integration/Exploitation.AuditDeliveryChecks/Exploitation.AuditDeliveryChecks.csproj --configuration Release --no-build` — PASS.
- `dotnet run --project tests/architecture/Exploitation.ArchitectureChecks/Exploitation.ArchitectureChecks.csproj --configuration Release --no-build` — PASS.
- `git diff --check` — PASS with only pre-existing line-ending conversion warnings.

LAST_SAFE_COMMIT: `0d94ce3e7244671ead0658080db545dd8b852f6f`

UNCOMMITTED: complete TASK-02.01.01 Phase B/C1/C2 implementation plus this C3 checkpoint; intentionally unstaged and uncommitted.

BLOCKERS: C3 MEDIUM findings require evaluation/remediation before task finalization.

NEXT_ACTION: PHASE_C3R — bounded remediation of C3-MEDIUM-001 through C3-MEDIUM-003, followed by focused re-review; do not start C4.

PHASE_C3R_RESUME_2026_09_23:

- RESUME_SAFE: YES — `main` and `origin/main` remain at `0d94ce3e7244671ead0658080db545dd8b852f6f`; no staged files, unmerged index entries or unknown out-of-task files were found. The dirty worktree is the preserved TASK-02.01.01 implementation.
- CHECKPOINT_MATCHES_GIT: YES after this reconciliation. The previous checkpoint lagged the interrupted C3R production/test edits and did not identify C3R as the current phase.
- C3R_PRODUCTION_CODE: PRESENT, NOT YET VERIFIED — Audit uses `IDbContextFactory<AuditDbContext>` and creates a fresh context per append; delivery uses a short durable claim followed by token-checked completion/failure outside the claim transaction.
- AUDIT_FRESH_CONTEXT_FIX: PRESENT, NOT YET VERIFIED.
- CLAIM_LEASE_MODEL: PRESENT, NOT YET VERIFIED — `claim_token`, `lease_until` and lease-expiry eligibility are implemented.
- BACKOFF_MODEL: PRESENT, NOT YET VERIFIED — `next_attempt_at` and bounded exponential backoff are implemented.
- SITES_INITIAL_MIGRATION: REGENERATED — Git history contains no committed/shared `InitialTerritorialZones` migration, and the current untracked initial migration plus snapshot include `claim_token`, `lease_until`, `next_attempt_at` and the required delivery index/coherence constraints. Committed Audit migration history was not rewritten.
- TEST_REMEDIATION: PARTIAL / UNKNOWN — interrupted edits exist in Audit delivery/persistence checks; the required C3R matrix has not yet been reconciled or run from this resume.
- LAST_VERIFIED_BUILD: UNKNOWN in repository evidence for the interrupted C3R state; a narrow affected Release build is the next action.
- POSTGRESQL_REMEDIATION_TESTS: NOT_RUN in this resume.
- C3-MEDIUM-001: OPEN — implementation present; verification pending.
- C3-MEDIUM-002: OPEN — implementation present; verification pending.
- C3-MEDIUM-003: OPEN — implementation present; verification pending.
- LAST_SAFE_COMMIT: `0d94ce3e7244671ead0658080db545dd8b852f6f`.
- UNCOMMITTED: all TASK-02.01.01 Phase B/C1/C2/C3R source, tests, migrations, docs and checkpoint files remain intentionally unstaged and uncommitted.
- BLOCKERS: NONE at resume; build and targeted PostgreSQL verification remain pending.
- NEXT_ACTION: run the narrow affected C3R Release build, then reconcile and complete only the missing C3R tests.
- DO_NOT_REPEAT: Phase A/B/C1/C2 analysis; task discovery; atomicity, API, permission and module-boundary decisions; C3 finding discovery.

PHASE_C3R_COMPLETION_2026_09_23:

- CURRENT_PHASE: C3R
- STATUS: PHASE_C3R_COMPLETE_AWAITING_C3RR
- RESUME_SAFE: YES — repository remains intentionally dirty for TASK-02.01.01; no staged files, merge conflicts or task commit were created.
- CHECKPOINT_MATCHES_GIT: YES after this completion record.
- C3R_PRODUCTION_BUILD: PASS — API and DatabaseMigrator affected Release builds and full solution Release build completed with 0 warnings/errors.
- AUDIT_FRESH_CONTEXT_FIX: FIXED / VERIFIED — `AuditWriter` creates a fresh `AuditDbContext` through `IDbContextFactory` for every append attempt; real PostgreSQL transient `SaveChangesAsync` failure followed by same-cycle retry succeeded and produced exactly one semantic `audit.events` row.
- CLAIM_LEASE_MODEL: FIXED / VERIFIED — short Sites claim transaction persists UUIDv7 `claim_token` and bounded `lease_until`, commits before Audit work, and lease expiry permits reclaim.
- STALE_WORKER_PROTECTION: FIXED / VERIFIED — token-checked completion/failure prevents stale workers from marking processed or overwriting retry metadata.
- BACKOFF_MODEL: FIXED / VERIFIED — failed delivery persists bounded `next_attempt_at` exponential backoff; poison obligations no longer hot-loop or starve a newer healthy obligation.
- CRASH_RECOVERY: FIXED / VERIFIED — persisted pending obligations survive provider/process recreation; expired claims are reclaimable; stable EventId retry remains idempotent.
- C3-MEDIUM-001: FIXED / VERIFIED.
- C3-MEDIUM-002: FIXED / VERIFIED.
- C3-MEDIUM-003: FIXED / VERIFIED.
- SCHEMA_CHANGED: YES — regenerated unshared Sites initial migration retains `claim_token`, `lease_until`, `next_attempt_at`, delivery index/coherence constraints, and restored previously required immutable code/payload PostgreSQL triggers. Committed Audit migration history was not rewritten.
- MIGRATION_CHANGED: YES — only uncommitted/unshared Sites initial migration was changed; no committed Audit migration rewrite.
- TARGETED_TESTS: PASS — `Exploitation.AuditDeliveryChecks`, `Exploitation.SitesPersistenceChecks`, `Exploitation.AuditPersistenceChecks`, `Exploitation.SitesApiChecks`, `Exploitation.AuthenticationChecks`, architecture checks and Sites domain checks.
- POSTGRESQL_TESTS: PASS — real Testcontainers PostgreSQL covered transient clean-context retry, short claim/slow Audit, retry delay, lease takeover, stale token, fairness/backoff, restart persistence, crash-window/idempotency, immutable payload and concurrent dispatch.
- REGRESSION_CHECKS: PASS — Sites API/authentication/working-context and Audit persistence regressions.
- ARCHITECTURE_CHECKS: PASS.
- RELEASE_BUILD: PASS — `dotnet build Exploitation.sln --configuration Release --no-restore`.
- SOLUTION_TEST_COMMAND: PASS — `dotnet test Exploitation.sln --configuration Release --no-build --no-restore`.
- DOCUMENTATION_SYNC: PASS — ADR-011, database, Sites/Audit module/context docs and deployment/configuration docs reconcile short claims, token/lease ownership, backoff and at-least-once semantics.
- NARROW_FORMAT_CHECK: PASS — AuditDelivery production and C3R test project verify clean. Full Sites/Audit infrastructure format remains NOT_CLEAN_PRE_EXISTING due existing migration line endings/charset and unrelated configuration whitespace; no broad formatting rewrite performed.
- GIT_DIFF_CHECK: PASS — no whitespace errors; only known line-ending conversion warnings.
- SECRET_HYGIENE: PASS — no production secret material; test-only sanitized secret strings are intentional fixtures for diagnostic redaction coverage.
- UNCOMMITTED: complete TASK-02.01.01 Phase B/C1/C2/C3R implementation, tests, migration, docs and checkpoint remain intentionally unstaged and uncommitted.
- LAST_SAFE_COMMIT: `0d94ce3e7244671ead0658080db545dd8b852f6f`.
- BLOCKERS: NONE for C3R. C3RR is explicitly not started.
- USAGE_BEFORE: 5H used 1% / remaining 99%; weekly used 28% / remaining 72%.
- USAGE_AFTER: 5H used 31% / remaining 69%; weekly used 32% / remaining 68%.
- TOKEN_COUNT: UNAVAILABLE.
- NEXT_ACTION: PHASE_C3RR — focused read-only re-review only of C3-MEDIUM-001..003 and directly introduced claim/lease risks. Do not start automatically.

PHASE_C3RR_COMPLETION_2026_09_23:

- PHASE_C3RR: DONE
- C3_REMEDIATION_REVIEW: PASS
- PHASE_C3_COMPLETE: YES
- PHASE_C_COMPLETE: YES
- RESUME_SAFE: YES — read-only review changed no production code, tests, migrations or docs; only this checkpoint was updated.
- CHECKPOINT_MATCHES_GIT: YES — `main` and `origin/main` remain at `0d94ce3e7244671ead0658080db545dd8b852f6f`; worktree remains task-owned `DIRTY_EXPECTED`, with no staged files, unmerged entries or task commit.
- C3-MEDIUM-001: CLOSED — each `AuditWriter.AppendAsync` creates/disposes a fresh context from `IDbContextFactory`; stable caller EventId is preserved; transient same-cycle retry, identical retry idempotency and conflicting-content fail-closed behavior are covered by the current PostgreSQL checks.
- C3-MEDIUM-002: CLOSED — Sites `FOR UPDATE SKIP LOCKED` is confined to the claim transaction; claim commit precedes Audit append/retry delay; completion/failure are separate conditional updates; cancellation leaves only a bounded lease to expire.
- C3-MEDIUM-003: CLOSED — eligibility includes `PENDING`, `next_attempt_at <= now`, and unclaimed/expired lease; failure releases claim and persists bounded backoff; poison-batch fairness is covered by current PostgreSQL checks.
- AUDIT_RETRY_CONTEXT_REVIEW: PASS — no tracked persistence state crosses append attempts; disposal is scoped to each fresh context; stable EventId and canonical idempotency remain intact.
- CLAIM_MODEL_REVIEW: PASS — short durable claim transaction, bounded batch and `SKIP LOCKED`; no Audit call is awaited inside the Sites transaction.
- CLAIM_TOKEN_REVIEW: PASS — completion/failure predicates require the current token; zero updated rows are returned as lost ownership, not success.
- LEASE_REVIEW: PASS — persisted nullable lease is bounded/configured (default 120 seconds, allowed 10..900), compared against UTC clock, and expired claims are reclaimable without cleanup.
- FAIRNESS_REVIEW: PASS — persisted `next_attempt_at` prevents poison hot-loop/head-of-line starvation.
- BACKOFF_REVIEW: PASS — initial/max bounds are validated; exponent is clamped; checked arithmetic prevents silent overflow; resulting delay is bounded.
- STALE_WORKER_REVIEW: PASS — stale workers cannot mark processed, alter attempt metadata, clear a later claim, or overwrite retry state.
- CRASH_RECOVERY_REVIEW: PASS — claim remains durable if delivery/failure-state persistence fails; lease expiry exposes it to later workers; stable EventId handles the Audit-commit/Sites-update crash window.
- CONCURRENCY_REVIEW: PASS — PostgreSQL row locking yields disjoint claims; correctness does not depend on an in-memory global lock; at-least-once/idempotency remains the guarantee.
- MIGRATION_REVIEW: PASS — unshared Sites initial migration/snapshot contain claim/lease/backoff columns, indexes, coherence/UUIDv7/entity constraints and immutable code/payload triggers; committed Audit migration history is untouched.
- ADR_011_REVIEW: PASS — module mutation plus durable obligation remain atomic; Audit materialization is eventual at-least-once; PostgreSQL is source of truth; no exactly-once, RabbitMQ, global UoW or distributed transaction claim was introduced.
- NEW_FINDINGS:
  - NOTE-C3RR-001 (non-blocking): `lease_until` has a bounded default/max, but `IAuditWriter.AppendAsync` has no per-attempt timeout. An unusually slow external Audit call can outlive the lease and allow concurrent at-least-once delivery. Stable EventId idempotency and token-checked completion preserve semantic correctness; this does not block C4, but C4 may consider aligning lease duration with an explicit delivery timeout if operational duplicate work becomes material.
- HIGHEST_SEVERITY: NOTE
- NARROW_FORMAT_NOISE: OUT OF SCOPE — previously documented migration line-ending/charset and unrelated whitespace findings were not introduced by C3RR and do not alter executable semantics.
- NEXT_ACTION: PHASE_C4 — final gates, traceability/docs reconciliation, task commit, repository-state-guard, push and hosted-CI handoff. Do not start automatically.
- RECOMMENDED_MODEL_NEXT: Sol
- RECOMMENDED_EFFORT_NEXT: High

PHASE_C4_COMPLETION_2026_09_23:

- STATUS: READY_TO_COMMIT
- CURRENT_PHASE: C4
- PHASE_A: COMPLETE
- PHASE_B: COMPLETE
- PHASE_C1: COMPLETE
- PHASE_C2: COMPLETE
- PHASE_C3/C3R/C3RR: COMPLETE
- PHASE_C4_GATES: PASS
- OPEN_HIGH_FINDINGS: 0
- OPEN_MEDIUM_FINDINGS: 0
- NOTE-C3RR-001: NON_BLOCKING — default lease is 120 seconds and bounded to 10..900; normal configured delivery retry work is short (two attempts, 250 ms retry delay). No per-attempt external Audit timeout is introduced in C4; stable EventId idempotency and token-checked completion preserve correctness if an abnormal external call outlives the lease.
- TRACEABILITY: PASS — Sites task rows added for canonical code/lifecycle, authorization, concurrency and durable audit paths.
- DOCUMENTATION: SYNCED — business-rules, lifecycle, traceability, Sites/Audit module/context, database, deployment, API/security references and ADR index reconcile the implementation.
- VERIFIED: Release build; solution tests; Sites domain, Sites persistence, Sites API, Audit persistence, Audit delivery, Authentication, Architecture, DatabaseMigrator, API smoke/contract, frontend lint/build/tests, format and diff checks all passed. No orphan Exploitation.Api process remains.
- SECURITY_SCAN: NOT_CONFIGURED — repository has no executable dependency/secret scan gate; production-path secret hygiene was manually reviewed and test-only redaction fixtures are intentional.
- UNCOMMITTED: task-owned implementation, tests, docs and checkpoint are intentionally unstaged pending the single final task commit.
- LAST_SAFE_COMMIT: `0d94ce3e7244671ead0658080db545dd8b852f6f`.
- BLOCKERS: NONE.
- DECISIONS: No new integration event was added; Territorial Zone audit actions remain Audit-owned canonical actions, not cross-module events. No architecture redesign for lease timeout was required.
- FILES_CHANGED: task-owned files listed by `git status --short`; no unrelated files detected.
- NEXT_ACTION: CREATE_TASK_COMMIT — deliberate stage, staged diff review, one commit, post-commit repository-state-guard, push `origin/main`, verify remote SHA, report hosted CI status.
- DO_NOT_REPEAT: Do not restart C3 review, redesign lease/timeout, add RabbitMQ, or use destructive Git recovery commands.
