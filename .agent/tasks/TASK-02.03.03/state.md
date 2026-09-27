# TASK-02.03.03 checkpoint

TASK: TASK-02.03.03 — Site CRUD
PHASE: A — OWNER DECISIONS / CONTRACT FREEZE
STATUS: CONTRACT_FROZEN
IMPLEMENTATION_STARTED: NO
BASELINE_SHA: 8bef135bf28be900325966257803d69c105ef11e
LAST_SAFE_COMMIT: 8bef135bf28be900325966257803d69c105ef11e
INITIAL_GIT_STATE: main == origin/main; clean, no staged or untracked files
HOSTED_CI_BASELINE: USER_REPORTED_PASS

OD_01: RESOLVED — required globally unique immutable Site code, trim +
invariant uppercase, max 50, `^[A-Z0-9][A-Z0-9_-]{0,49}$`.
OD_02: RESOLVED — exactly one required immutable Region; no move route or
cascade delete in this task.
OD_03: RESOLVED — ACTIVE/INACTIVE, create ACTIVE, activate/deactivate,
authorized reads of inactive Sites, no hard delete, CLOSED, closed_at or
commissioned_at in the first slice.
OD_04: RESOLVED — required SiteType, ACTIVE for creation/new assignment;
existing inactive reference retained; change under `sites.change`.
OD_05: RESOLVED — required criticality, ACTIVE for creation/new assignment;
existing inactive reference retained; separate command with only
`sites.change_criticality`, target coverage and expectedRowVersion; no
reason; rank remains in reference.
OD_06: RESOLVED — required explicit IANA Site timezone, mutable through
ordinary update; no dynamic Region inheritance.
OD_07: RESOLVED — required trimmed address_text max 500; no coordinates,
structured address or geocoding.
OD_08: RESOLVED — paginated Site list, filters regionId/siteTypeId/
criticalityClassId/status/q, code/name search, code/id ascending order.
Canonical repository page/pageSize convention applies: default 50, max 200,
items/page/pageSize/totalCount/totalPages response.
OD_09: RESOLVED — Site target authorization, Zone/Region/Site scope
coverage, scoped backend list/direct-ID checks, parent Region coverage for
create, INTERNAL-only first evaluator, contractor fail-closed. ADR-014
refines accepted ADR-013 without editing its decision text.
OD_10: RESOLVED — canonical Audit entity Site; SiteCreated, SiteUpdated,
SiteActivated, SiteDeactivated, SiteCriticalityChanged with allowlisted
before/after payloads and atomic Sites obligation. No SiteMoved or separate
SiteTypeChanged action; no second outbox.

API_CONTRACT: GET list and ID, POST create, PUT ordinary update, POST
activate/deactivate, PUT criticality; no DELETE. Base DTO has id/code/name/
regionId/siteTypeId/criticalityClassId/address/timezone/status/rowVersion.
All mutable commands require expectedRowVersion; stale writes return
409 OPTIMISTIC_CONCURRENCY_CONFLICT.

PERSISTENCE_CONTRACT: future additive Sites-owned `sites.sites` table,
required restrictive Region/SiteType/SiteCriticalityClass FKs, UUIDv7,
global code uniqueness, immutable id/code/region_id, ACTIVE/INACTIVE,
positive row_version. Site create must lock parent Region so it serializes
with deactivation. No speculative reference row locks while management APIs
are absent. Existing `sites.audit_obligations` later gains an additive
Site binding and entity/action/payload allowlist extension.

AUTH_SCOPE_B1: NOT_STARTED
SITE_TARGET_SCOPE: CONTRACT_FROZEN_NOT_IMPLEMENTED
PRODUCTION_POSITIVE_SITE_CRUD: BLOCKED_BY_AUTH_SCOPE_B1_AND_SITE_PROJECTION
CONTRACTOR_SUPPORT: DEFERRED_FAIL_CLOSED
FRONTEND: OUT_OF_SCOPE; TASK-02.03.04 remains separate

DOCS_IMPACT: YES
DOCUMENTATION_SYNC: contract recorded in backlog, Sites module/context,
database, API, lifecycle/business/reference/permission/event registries,
security, Audit module, architecture and ADR-014/index. No code, tests or
migrations were edited.
DOCUMENTATION_SYNC_GATE: PASS — task contract, Sites/database/API/security,
reference/lifecycle/business/permission/event, Audit and ADR index were
reconciled; no claim that Site runtime support is implemented.
VERIFIED: `git diff --check` PASS; new-file trailing whitespace PASS;
changed paths restricted to docs and this checkpoint PASS; secret-pattern
hygiene PASS. No Docker, build, runtime tests or migration execution were
required for this docs-only phase.
UNCOMMITTED: Phase A documentation, ADR-014 and this checkpoint only; no
task commit or push requested.

RECOMMENDED_NEXT_SEQUENCE: Phase B1 Site domain/persistence/additive migration/
parent/reference invariants/row_version/PostgreSQL checks/Site audit binding
can proceed independently after this freeze. AUTH-SCOPE-01 B1 and tested Site
target/scope projection must precede production-positive Phase C Site API.
Phase C then integrates CRUD, target checks and audit obligations, followed
by focused security review and final gates/docs/commit/push. No phase starts
automatically from this checkpoint.

NEXT_ACTION: On a separate explicit instruction, reconcile this checkpoint
with Git and start only the requested Phase B1 or AUTH-SCOPE prerequisite.
DO_NOT_REPEAT: Do not reopen OD-01…OD-10, redo preflight, start Site
implementation/API/migration, AUTH-SCOPE-01 B1/B2, Audit persistence,
frontend, TASK-02.03.04, or create a task commit in this Phase A run.

## Phase B1 resume checkpoint
TASK: TASK-02.03.03
PHASE: B1 — Site domain + persistence + additive migration + PostgreSQL/concurrency tests
STATUS: DONE
CHECKPOINT_STATUS: SAFE_WITH_CHECKPOINT
PHASE_A: CONTRACT_FROZEN
IMPLEMENTATION_STARTED: YES
AUTH_SCOPE_B1: NOT_STARTED
BASELINE_SHA: 8bef135bf28be900325966257803d69c105ef11e
LAST_SAFE_COMMIT: 8bef135bf28be900325966257803d69c105ef11e
REPOSITORY_STATE_GUARD: SAFE_WITH_CHECKPOINT / DIRTY_EXPECTED
TASK_RESUME: RESUME_SAFE — HEAD remains at baseline; exact dirty work is Phase A docs/ADR/checkpoint plus B1 Sites/Audit code, additive migration, tests and implementation docs. No unrelated files or staging.

COMPLETED:
- Phase A contract documentation is present across Sites/API/database/security/registries/Audit/ADR-014.
- Frozen contract is source of truth; backlog marks Site API deferred pending AUTH-SCOPE-01 and Site target projection.
- Existing Sites patterns inspected: Region/TerritorialZone parent locking, UTC timestamps/row_version, Sites audit obligations and generic AuditDelivery.
- Site aggregate, lifecycle and normalization; Sites EF configuration; internal atomic command store for create/update/activate/deactivate/criticality.
- Additive `20260926082056_AddSites` migration with `sites.sites`, restrictive FKs/indexes/checks, immutable identity/delete trigger and Site obligation binding/action constraints.
- Canonical Site Audit entity/actions, action/entity compatibility and action-specific payload checks; Site materializes through existing AuditDelivery.
- B1-specific documentation synchronized in Sites, Audit, database, context capsule and backlog.

VERIFIED:
- Repository resume/guard: main == origin/main at `8bef135bf28be900325966257803d69c105ef11e`; all dirty paths task-owned; unstaged only; no push/commit.
- `dotnet build Exploitation.sln -c Release --no-restore` PASS.
- `dotnet run --project tests/unit/Exploitation.SitesDomainChecks/Exploitation.SitesDomainChecks.csproj -c Release --no-restore` PASS.
- `dotnet run --project tests/integration/Exploitation.SitesPersistenceChecks/Exploitation.SitesPersistenceChecks.csproj -c Release` PASS: clean PostgreSQL migration + repeat, Site constraints/refs, duplicate code, immutable id/code/region/delete/audit binding, row_version/stale rollback, both Region race orderings, obligation-failure rollback, inactive-reference retention.
- `dotnet run --project tests/integration/Exploitation.AuditPersistenceChecks/Exploitation.AuditPersistenceChecks.csproj -c Release` PASS, including Site catalog/payload and invalid action pairing.
- `dotnet run --project tests/integration/Exploitation.AuditDeliveryChecks/Exploitation.AuditDeliveryChecks.csproj -c Release` PASS: Site materialization plus existing Region/TerritorialZone and retry regression.
- `dotnet run --project tests/integration/Exploitation.SitesApiChecks/Exploitation.SitesApiChecks.csproj -c Release` PASS: existing Region regression; no Site routes added.
- `dotnet run --project tests/architecture/Exploitation.ArchitectureChecks/Exploitation.ArchitectureChecks.csproj -c Release` PASS.
- `dotnet ef migrations has-pending-model-changes ... --context SitesDbContext` PASS: no pending model changes.
- Manual migration review: additive only; prior migrations unchanged; intended columns/FKs/delete actions/triggers/constraints; no coordinates or commissioning/closure fields.
- `git diff --check` and new-file trailing whitespace checks PASS; secret-pattern scan found no matches.
- `DOCS_IMPACT: YES`; `DOCUMENTATION_SYNC: PASS` for implementation truth only.
- HTTP/API: no `/api/v1/sites` routes; auth/evaluator/projection changes: none; frontend changes: none.
- Focused review findings: OPEN_CRITICAL 0, OPEN_HIGH 0, OPEN_MEDIUM 0.

UNCOMMITTED:
- Phase A docs and ADR-014; B1 domain/application/infrastructure and additive migration; Site/Audit tests; B1 docs; this checkpoint. No staged files, task commit, branch switch, worktree handoff or push.

DECISIONS:
- Only TASK-02.03.03 Phase B1; no Site HTTP/API, production auth, scope evaluator/projection, frontend, TASK-02.03.04, AUTH-SCOPE-01 B1, or push.
- B1 implementation uses Sites ownership and established Region/TerritorialZone/AuditDelivery patterns; no SiteType/criticality locks absent runtime deactivation commands.
- No Site API, OpenAPI, production-positive authorization, Site target evaluator/projection, frontend, or AUTH-SCOPE-01 implementation is included.

BLOCKERS: None for Phase B1. Repository has local feature-branch and frontend-worktree examples, but no documented convention for handing off an incomplete dirty task from main to a separate backlog task. Handoff remains intentionally unperformed per request.
HANDOFF_RECOMMENDATION: Preserve all Phase A+B1 task-owned paths on a dedicated local codex/ task branch/checkpoint commit using explicit staging; then provide AUTH-SCOPE a clean isolated worktree from the published baseline. Do not push the incomplete Site task. Current branch is main, so do not begin AUTH-SCOPE in this dirty worktree.
NEXT_ACTION: AUTH-SCOPE prerequisite after clean isolated handoff; do not start it automatically.
TASK_COMPLETE: NO
DO_NOT_REPEAT: Do not reopen OD-01…OD-10, repeat completed B1 work/gates, start Site HTTP/API/auth/frontend, implement AUTH-SCOPE-01 B1, start TASK-02.03.04, commit/push automatically, or switch task before a clean isolated handoff.

## Repository handoff checkpoint
TASK: TASK-02.03.03
PHASE: B1
STATUS: DONE
CONTRACT_FROZEN: YES
PHASE_B1: DONE
RESUME_SAFE: YES
HTTP_API: NOT_STARTED
AUTH_SCOPE_B1: NOT_STARTED
SITE_TARGET_SCOPE: NOT_IMPLEMENTED
TASK_COMPLETE: NO
PUBLISHED: NO
NEXT_ACTION: Resume TASK-02.03.03 only after AUTH-SCOPE prerequisites are complete.
HANDOFF: LOCAL_CHECKPOINT_BRANCH_PENDING

## RETURN-01B replay checkpoint — conflict reconciliation
TASK: TASK-02.03.03
PHASE: B1 — REPLAYED ON CURRENT BASELINE
STATUS: IN_PROGRESS / UNCOMMITTED
REPLAY_BASELINE: 1c7e93558bac453b0a5108798ae03565136fd605
RESUME_BRANCH: codex/task-02.03.03-site-resume
ORIGINAL_CHECKPOINT: 4d230e7c8192614954b7d106014bfaaf75669207
ORIGINAL_SITE_BRANCH: codex/task-02.03.03-site-b1 (unchanged)
AUTH_SCOPE_B1_B2_C1: PUBLISHED AND PRESERVED
SITE_AUTHORIZATION: NOT_STARTED
SITE_API: NOT_STARTED
CAPABILITIES: NOT_ADDED
FRONTEND: UNCHANGED

RETURN_01B_STEP_1: DONE
CHERRY_PICK_APPLIED: YES — git cherry-pick --no-commit, no replay commit yet
EXPECTED_CONFLICT_COUNT: 8 overlapping paths; 3 textual conflicts
ACTUAL_CONFLICT_PATHS: docs/adr/README.md; docs/context/sites.context.md; docs/modules/sites.md
EXPECTED_CONFLICTS_RECONCILED: YES
CURRENT_AUTH_CONTENT_PRESERVED: YES — ADR-015/016, C1 docs, Sites auth registrations and B2/C1 tests retained
SITE_B1_CONTENT_PRESERVED: YES — additive Site implementation/tests/migration and contract docs applied
UNEXPECTED_CONFLICTS: NONE

DOCS_IMPACT: YES
DOCUMENTATION_SYNC: IN_PROGRESS — aligned Site API/backlog/Sites context/module/security/permissions/architecture statements with published Zone/Region-only authorization and local-only B1 replay.
MIGRATION: NOT_YET_VERIFIED
MODEL_DRIFT: NOT_YET_VERIFIED
TESTS: NOT_YET_RUN
WORKTREE: staged replay application plus unstaged documentation/checkpoint reconciliation; no unrelated changes; no commit/push.
LAST_SAFE_COMMIT: 1c7e93558bac453b0a5108798ae03565136fd605
NEXT_ACTION: inspect reconciled diff/ownership, then run migration, PostgreSQL Site, Audit, auth/C1, architecture and build/test gates.
DO_NOT_REPEAT: Do not alter the historical Site branch; do not add Site authorization/API/capabilities/frontend; do not merge main or push; do not generate a replacement migration; do not commit until every RETURN-01B gate passes.

## RETURN-01B verification checkpoint — all local gates passed
RETURN_01B_STEP_1: DONE
RETURN_01B_STEP_2: DONE
RETURN_01B_STEP_3: DONE
RETURN_01B_STEP_4: DONE
CHERRY_PICK_MODE: NO_COMMIT
EXPECTED_OVERLAPPING_PATHS: 8
ACTUAL_TEXT_CONFLICTS: 3 (ADR index, Sites context capsule, Sites module)
UNEXPECTED_CONFLICTS: NONE
RECONCILED_PATHS: 8 expected overlaps reviewed; 3 resolved manually. Also updated OrganizationPersistenceChecks migration-count assertion from 4 to 5 because the migrator now applies historical AddSites.
CURRENT_AUTH_CONTENT_PRESERVED: YES — ADR-015/016, B2/C1 registrations, scoped Geography tests, F1/F2 and C1 routes retained.
HISTORICAL_SITE_CONTENT_PRESERVED: YES — Site model/store/mapping, AddSites migration/snapshot, audit bindings/actions, PostgreSQL and unit checks retained.
ADR_014_REFINEMENT_REQUIRED_AFTER_REPLAY: NO / MINOR_DOC_ALIGNMENT_ONLY — ownership is compatible; future Site support must follow exact Identity scopes and Sites-owned hierarchy coverage. ADR-014 left unchanged.

SITE_DOMAIN: PASS
SITE_PERSISTENCE: PASS — clean PostgreSQL migration/repeatability, constraints, Site create/reference eligibility, both Region race orders, audit atomicity.
SITE_MIGRATION: PASS — migration order/uniqueness and full DatabaseMigrator applied all five Sites migrations idempotently; no new migration created.
MODEL_DRIFT: NONE — EF reports no changes since last migration.
REFERENCE_ELIGIBILITY: PASS
REGION_SERIALIZATION: PASS
SITE_AUDIT_OBLIGATION: PASS — action/binding/payload checks, atomicity and AuditDelivery.
ZONE_REGION_REGRESSION: PASS
B2_REGRESSION: PASS
C1_REGRESSION: PASS — Sites API and Organization/API auth harnesses.
F1: CLOSED BY PASSING REGRESSION CHECKS
F2: CLOSED BY PASSING REGRESSION CHECKS

IDENTITY_SITES_DB_DEPENDENCY: NONE
SITES_IDENTITY_DB_DEPENDENCY: NONE
SITE_AUTHORIZATION: NOT_IMPLEMENTED
SITE_HTTP_API: NOT_IMPLEMENTED
CAPABILITIES: NOT_ADDED
DEV_BOOTSTRAP: NOT_ADDED
FRONTEND: UNCHANGED

POSTGRESQL_TESTS: PASS
MIGRATION_TESTS: PASS
AUDIT_TESTS: PASS
ARCHITECTURE_CHECKS: PASS
RELEASE_BUILD: PASS — zero warnings/errors
DOTNET_TEST: PASS — solution VSTest target returned 0; solution projects are executable harnesses, run explicitly below.
EXPLICIT_HARNESSES: PASS — SitesDomain, IdentityDomain, SitesPersistence, SitesApi, OrganizationPersistence, OrganizationApi, AuditPersistence, AuditDelivery, IdentityPersistence, Authentication, Architecture.
FORMATTING: PASS for changed handwritten C# files after scoped formatter fix. Full-solution formatter remains non-clean on pre-existing unrelated whitespace/charset findings; generated AddSites.cs has the same charset warning as existing generated migrations. No unrelated files were formatted.
DIFF_HYGIENE: PASS — git diff --check, conflict marker scan and scoped changed-file whitespace formatting.
DOCS_IMPACT: YES
DOCUMENTATION_SYNC: PASS — Site foundation marked local-only; API and Site auth explicitly unimplemented; published Zone/Region target-aware semantics and ADR-015/016 retained.
SECRET_HYGIENE: PASS — no private-key/cloud-key/token/password patterns found in replay diff.
SECURITY_REVIEW: PASS — focused source and regression review; no obsolete authorization plumbing or Site endpoint; no open findings.
OPEN_CRITICAL: 0
OPEN_HIGH: 0
OPEN_MEDIUM: 0
OPEN_LOW: 0

REPLAY_COMMIT: THIS SINGLE LOCAL REPLAY COMMIT (created after all gates)
PRECOMMIT_STATUS: 40 reviewed task-owned paths staged (39 historical checkpoint paths plus one required Organization migrator assertion update); no unrelated changes.
LAST_SAFE_COMMIT: 1c7e93558bac453b0a5108798ae03565136fd605
MAIN: unchanged at replay baseline
ORIGIN_MAIN: unchanged at replay baseline
HISTORICAL_SITE_BRANCH: unchanged at 4d230e7c8192614954b7d106014bfaaf75669207
PUSH: NONE
NEXT_ACTION: create the authorized local replay commit from the fully reviewed staged diff; then stop for independent replay review.
DO_NOT_REPEAT: Do not modify historical branch; do not add Site auth/API/capabilities/frontend; do not merge or push; do not regenerate migration; do not repeat passing harnesses unless a further source change requires them.

## RETURN-01B post-commit checkpoint
TASK: TASK-02.03.03
PHASE: B1 — REPLAYED ON CURRENT BASELINE
STATUS: LOCAL_VERIFIED_REPLAY_COMMIT
REPLAY_COMMIT: current HEAD on `codex/task-02.03.03-site-resume`; parent is `1c7e93558bac453b0a5108798ae03565136fd605`.
HISTORICAL_SITE_COMMIT: `4d230e7c8192614954b7d106014bfaaf75669207`.
HISTORICAL_SITE_BRANCH: `codex/task-02.03.03-site-b1` unchanged.
AUTH_SCOPE_B1_B2_C1: PUBLISHED AND PRESERVED.
SITE_AUTHORIZATION: NOT_STARTED / NOT_IMPLEMENTED.
SITE_API: NOT_STARTED / NOT_IMPLEMENTED.
CAPABILITIES: NOT_ADDED.
FRONTEND: UNCHANGED.
CHECKS: all local RETURN-01B checks recorded above passed; model drift NONE; open Critical/High/Medium/Low findings 0.
WORKTREE: clean after this checkpoint update is included in the replay commit.
MAIN: unchanged at `1c7e93558bac453b0a5108798ae03565136fd605`.
ORIGIN_MAIN: unchanged at `1c7e93558bac453b0a5108798ae03565136fd605`.
PUSH: NONE.
NEXT_ACTION: independent review of the replayed Site B1 commit before publication.
DO_NOT_REPEAT: Do not modify the historical branch, merge or push, begin Site authorization/API/capabilities/frontend, or regenerate the migration.

## RETURN-01C independent replay review and publication checkpoint
TASK: TASK-02.03.03
PHASE: RETURN-01C — independent B1 replay review and integration
STATUS: SITE_B1_PUBLISHED_LOCALLY; PUSH_PENDING
CHECKPOINT_STATUS: SAFE
SITE_PHASE_A: FROZEN
SITE_B1: PUBLISHED on local main by fast-forward
REPLAY: VERIFIED; local main contains `87777e5e4bc208cb074179893cf66030c02e4e3f`
HISTORICAL_SITE_CHECKPOINT: `4d230e7c8192614954b7d106014bfaaf75669207`; historical branch unchanged
AUTH_SCOPE_B1_B2_C1: PUBLISHED and regression-verified
SITE_AUTHORIZATION: NOT_STARTED
SITE_HTTP_API: NOT_STARTED
LAST_SAFE_COMMIT: `87777e5e4bc208cb074179893cf66030c02e4e3f` before this status-only publication commit

COMPLETED:
- Independent comparison of current main, historical Site checkpoint and final replay across all 40 paths and all eight overlap paths; three textual conflict files (`docs/adr/README.md`, `docs/context/sites.context.md`, `docs/modules/sites.md`) retain current AUTH-SCOPE content and add Site B1.
- Reviewed Site contract, reference eligibility, migration/snapshot, both Region race orderings, audit atomicity/delivery, B2/C1 trust boundaries and registrations; no open Critical/High/Medium findings.
- Fast-forwarded local main from `1c7e93558bac453b0a5108798ae03565136fd605` to replay commit; no merge commit, squash or new cherry-pick.
- `docs-impact`: YES; publication wording synchronized in architecture, API, backlog, Sites module/context and security. Accepted ADR-014 left unchanged.
DOCUMENTATION_SYNC: PASS — affected documents now describe the published B1 foundation and the pending Site authorization/API boundary.

VERIFIED:
- Before and after fast-forward: 11 explicit executable harnesses PASS, including Site PostgreSQL persistence/race/audit, Sites API, Identity persistence/authentication, Organization, Audit and architecture.
- Release solution build PASS with zero warnings/errors; `dotnet test` exit 0 (executable harnesses run separately); EF Sites model drift NONE; `git diff --check` PASS.
- Changed handwritten C# whitespace formatter PASS; replay secret-pattern scan 0; no Site API route or Identity/Sites DB cross-dependency added.
- Sites migration IDs, in order: InitialTerritorialZones, AddRegions, AddSiteTypes, AddSiteCriticalityClasses, AddSites. Organization harness count 4 to 5 JUSTIFIED.

UNCOMMITTED: Only narrow publication-status documentation and this checkpoint, to be committed explicitly on main.
DECISIONS: ADR-014 remains Accepted and compatible in ownership, but its context says AUTH-SCOPE Phase A/evaluator is not implemented; that historical status should be refined against ADR-016 before future Site authorization work, without changing this frozen Site contract now.
BLOCKERS: None for local integration. Push and exact-SHA hosted CI verification remain pending.
FILES_CHANGED: `docs/architecture.md`, `docs/api-guidelines.md`, `docs/backlog.md`, `docs/context/sites.context.md`, `docs/modules/sites.md`, `docs/security.md`, this checkpoint.
NEXT_ACTION: Commit only the publication-status files, fetch and verify origin/main is still the replay baseline, push main normally, then verify hosted CI for the final SHA.
DO_NOT_REPEAT: Do not repeat replay/cherry-pick or alter the historical branch; do not start Site authorization, Site HTTP API, capabilities or frontend.
