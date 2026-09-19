# TASK-01.03.01 — access_assignments

STATUS: DONE
CHECKPOINT_STATUS: SAFE
PHASE: Final implementation, verification, independent review and documentation gates complete; task commit/push pending.
LAST_SAFE_COMMIT: 55a29d2f855fcb2e52f430c90bb8d65474e4b7de

TASK_CONTRACT:
- Persist `access_assignments` with zone, region, site, direction and asset-type scope.
- Assignment has validity; expired assignment does not grant access.
- Scope evaluation is unit-tested.

RISK: HIGH
PARALLELIZABLE: NO
MODEL_ESCALATION_RECOMMENDED: YES (Sol, High used for independent review)

COMPLETED:
- Repository guard confirmed clean `main...origin/main` at the last safe commit.
- Loaded exact backlog contract, Identity capsule/module docs, ADR-007/ADR-010, relevant DB/security rules, and authorization matrix.
- Added assignment scope/validity/revocation domain model and negative-first unit checks.
- Added IdentityDbContext mapping with scope, validity, revocation, FK, uniqueness and concurrency constraints.
- Generated `AddIdentityAccessAssignments` migration and updated Identity model snapshot.
- Added PostgreSQL persistence tests for migration, uniqueness, FK, role-permission-plus-assignment production deny, expiry, scope and concurrent revocation.
- Closed independent review finding: DELEGATION requires finite `valid_to` in Domain and PostgreSQL, with negative tests.
- Synced Identity module/context, database, lifecycle registry and traceability matrix.

VERIFIED:
- `git status --short --branch`: clean.
- `git rev-parse HEAD`: `55a29d2f855fcb2e52f430c90bb8d65474e4b7de`.
- Identity domain checks PASS.
- Identity Infrastructure Release build PASS (0 warnings/errors).
- `git diff --check` PASS.
- Identity PostgreSQL persistence checks PASS with Testcontainers PostgreSQL 18.6.
- Final Release solution build PASS (0 warnings/errors); `dotnet test` PASS.
- Final Identity domain, architecture, authentication and PostgreSQL checks PASS.
- DatabaseMigrator and CI workflow script checks PASS.
- EF `has-pending-model-changes`: no changes since migration.
- Independent read-only security review and final merged code/docs review PASS, no blocking findings.
- Traceability checker PASS: all three ACs and applicable BR-IDN rules covered.
- Documentation sync PASS: Identity module/context, database, lifecycle registry and traceability matrix.

UNCOMMITTED:
- This task state file; Identity Domain entity/scope/context type; EF configuration, migration/designer, DbContext and snapshot; unit/integration checks; Identity module/context/database/lifecycle/traceability docs.

PENDING:
- Preserve production permission-grant deny until working-context ownership and target-scope authorization can be completed in a later task.
- Inspect final staged diff/secret hygiene; create one task commit, run repository guard, and push `origin/main`.

DECISIONS:
- Scope is `TASK-01.03.01` only; no working-context selection, contractor chain, admin API, or seeded grants.
- Scope matching is an eligibility check, not final authorization. Missing target dimension cannot satisfy a constrained assignment.
- Use one implementation writer; independent security review is read-only.
- Partial uniqueness prevents exact duplicate active grants for the same `valid_from`; overlapping intervals with different starts are deferred to future issuance/revoke-all semantics, rather than conflating natural expiry with revocation.

BLOCKERS: NONE
FILES_CHANGED: `.agent/tasks/TASK-01.03.01/state.md`, Identity Domain authorization files, IdentityDbContext/configuration/migration/snapshot, IdentityDomainChecks, IdentityPersistenceChecks, `docs/database.md`, `docs/modules/identity.md`, `docs/context/identity.context.md`, `docs/lifecycle-registry.md`, `docs/traceability-matrix.md`.
NEXT_ACTION: Commit the staged TASK-01.03.01 diff, run repository-state-guard, then push `origin/main`.
DO_NOT_REPEAT:
- Do not re-discover the next backlog ID or reinterpret TASK-01.02.02.
- Do not turn an assignment match into an HTTP permission grant before context ownership exists; production `IPermissionGrantSource` remains deny.
- The migration has already been generated and PostgreSQL integration-verified; do not regenerate without a model change.
- Do not revise the overlapping-interval policy without a future issuance/admin Task Contract.
