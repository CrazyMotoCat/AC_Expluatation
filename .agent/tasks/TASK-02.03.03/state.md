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

## SITE-AUTH-00 contract refinement checkpoint

TASK: TASK-02.03.03
PHASE: SITE-AUTH-00 — Site authorization contract refinement
STATUS: CONTRACT_FROZEN
BASELINE_SHA: 4307ac3412f2c7da73290b76e4ee5358d1f8053c
BRANCH: codex/task-02.03.03-site-auth (local, from exact clean main)
REPOSITORY_GUARD: `git fetch`; main == origin/main == baseline SHA; initial worktree clean
SITE_B1: PUBLISHED
ADR_014: ACCEPTED / REFINED_BY_ADR_017; historical file unchanged
ADR_017: ACCEPTED / contract only
IDENTITY_SITE_SCOPE: NOT_IMPLEMENTED
SITES_SITE_AUTH: NOT_IMPLEMENTED
SITE_LIST_AUTH: NOT_IMPLEMENTED
SITE_HTTP_API: NOT_IMPLEMENTED
SCHEMA_CHANGE_EXPECTED: NO; existing `identity.access_assignments.site_id`
MIGRATION_REQUIRED: NO

CONTRACT: Identity returns exact permission-specific Site/Region/Zone scopes
for eligible INTERNAL user/context; Sites resolves authoritative Site →
Region → Zone and applies downward coverage. Site list obtains `sites.read`
scopes internally and filters in SQL before count/page. Create requires
`sites.create` on parent Region or ancestor Zone; direct changes require
their independent permission and Site coverage. No upward coverage or
caller-supplied parent/effective-scope evidence. Empty list scopes return a
200 empty page. Direct Site and create-parent absence/out-of-scope share
403 GEOGRAPHY_ACCESS_DENIED; denied commands leave Site/version/audit unchanged.
Contractor-positive access remains closed. No Site move or DELETE.

DOCS_IMPACT: YES
DOCUMENTATION_SYNC: ADR-017/index, Site API/backlog/module/context,
Identity module, security, and this checkpoint.
VERIFICATION: `git diff --check` PASS; ADR-017 trailing whitespace none;
ADR numbering unique; references to ADR-014/015/016/017 and C1 concealment
checked; scoped secret-pattern scan found no matches; changed paths are docs
and this checkpoint only. No runtime tests required for contract-only phase.
WORKTREE: task-owned documentation edits only; no commit or push
NEXT_ACTION: SITE-AUTH-01A Identity exact Site scopes; SITE-AUTH-01B Sites
authoritative target/list; SITE-AUTH-01C PostgreSQL/security/architecture
review and independent publication review. Site API only after publication.
DO_NOT_REPEAT: Do not implement Site auth/API, migration, capabilities,
frontend or Development bootstrap in SITE-AUTH-00; do not start next phase
automatically.

## SITE-AUTH-01 atomic checkpoint 1

TASK: TASK-02.03.03
PHASE: SITE-AUTH-01 — Site authorization foundation
BASELINE_SHA: 4307ac3412f2c7da73290b76e4ee5358d1f8053c
BRANCH: codex/task-02.03.03-site-auth
REPOSITORY_GUARD: SAFE_WITH_CHECKPOINT / DIRTY_EXPECTED_DOCS_ONLY at start;
`git fetch` confirmed main == origin/main == HEAD == baseline; dirty paths
matched SITE-AUTH-00 docs and this checkpoint.
SITE_AUTH_01_STEP_1: DONE
IDENTITY_SITE_SCOPE: IMPLEMENTED
SITE_SCOPE_EXACT: PASS
IDENTITY_HIERARCHY_EXPANSION: NONE
IDENTITY_POSTGRESQL_TESTS: PASS — IdentityPersistenceChecks Release/Testcontainers
IDENTITY_BUILD: PASS — Identity Infrastructure Release, zero warnings/errors
SCHEMA_CHANGED: NO
MIGRATION_CREATED: NO
WORKTREE: SITE-AUTH-00 docs plus task-owned Identity source/tests/checkpoint;
uncommitted, no push.
NEXT_ACTION: Extend Sites-owned target authorization and verify with
PostgreSQL before checkpoint 2.

## SITE-AUTH-01 atomic checkpoints 2 and 3

SITE_AUTH_01_STEP_2: DONE
SITES_SITE_TARGET: IMPLEMENTED through existing SitesTargetGrantChecks
SITE_AUTHORITATIVE_HIERARCHY: PASS — one Sites Site/Region join
DIRECT_SITE_COVERAGE: PASS — exact Site, parent Region, ancestor Zone
CREATE_PARENT_COVERAGE: PASS — fixed sites.create, parent Region/Zone;
Site-only, sibling, wrong Zone and missing parent deny. Inactive parent
coverage is separate from B1 create lifecycle eligibility.
FORGED_SITE_HIERARCHY: DENIED — public direct API accepts siteId only;
PostgreSQL test proves wrong Region/Zone cannot authorize.
SITE_AUTH_01_STEP_3: DONE
AUTHORIZED_SITE_LIST: PASS — public IAuthorizedSiteReadService obtains
fixed sites.read scopes internally; no caller-supplied scopes/permission.
SERVER_SIDE_FILTERING: PASS — EF IQueryable joins Sites-owned Region and
applies scope predicate before CountAsync and ordered Skip/Take.
EMPTY_SCOPE: EMPTY_RESULT, zero totalCount/totalPages
COUNT_LEAKAGE: NONE — unauthorized rows excluded before count and page.
N_PLUS_ONE: NONE — one bounded provider scope query plus Sites count/page.
POSTGRESQL_TESTS: SitesPersistenceChecks Release/Testcontainers PASS,
including direct/create/list union, filters, count/page, permission isolation,
contractor with real Identity provider and Site B1 regressions.
ARCHITECTURE_CHECKS: PASS at this checkpoint.
WORKTREE: task-owned source/tests/docs/checkpoint; uncommitted, no push.
NEXT_ACTION: Full regressions, cumulative security review, documentation
status and local commit only after all gates pass.

## SITE-AUTH-01 atomic checkpoint 4 and local handoff

SITE_AUTH_01_STEP_4: DONE
F1: CLOSED — existing Zone/Region forged-parent PostgreSQL/architecture cases pass
F2: CLOSED — existing public geography list boundary remains enforced
SITE_F1: CLOSED — only siteId/parent Region business ID accepted; persisted
Site/Region lookup supplies hierarchy, wrong Region/Zone tests deny
SITE_F2: CLOSED — public Site list accepts only subject/business filters;
service obtains fixed sites.read scopes; concrete SQL service is internal
SECURITY_REVIEW: PASS — separate cumulative branch diff review of forged
ancestry/scopes, permission reuse, upward coverage, cross-region/zone,
empty scope, count leakage, contractor, provider failure, public store and
cross-module database access. No open Critical/High/Medium/Low findings.
OPEN_CRITICAL: 0
OPEN_HIGH: 0
OPEN_MEDIUM: 0
OPEN_LOW: 0
NOTES: Independent publication review remains the next action. No Site
mutation HTTP integration or positive contractor path was added.

VALIDATION:
- Identity Infrastructure Release build PASS; Sites Infrastructure Release
  build PASS; full Release solution build PASS with zero warnings/errors.
- IdentityPersistenceChecks and SitesPersistenceChecks real PostgreSQL/
  Testcontainers PASS, including exact Site, direct/create/list, inactive
  target, permission isolation, contractor, fail-closed and count/page cases.
- All 11 explicit executable harnesses PASS: SitesDomain, IdentityDomain,
  SitesPersistence, SitesApi, OrganizationPersistence, OrganizationApi,
  IdentityPersistence, Authentication, AuditPersistence, AuditDelivery,
  Architecture. Zone/Region C1, B2 F1/F2, Site B1 persistence/races/audit,
  OIDC and working-context regressions are included.
- `dotnet test Exploitation.sln -c Release --no-build` PASS (exit 0; solution
  uses executable harnesses rather than VSTest discovery).
- Identity and Sites EF `has-pending-model-changes` PASS: no model drift.
- Changed handwritten C# `dotnet format whitespace --verify-no-changes`
  PASS; `git diff --check` and changed-file trailing whitespace PASS.
- ADR numbering/index and affected Markdown/reference status PASS; scoped
  secret-pattern scan found no matches.

SCHEMA_CHANGED: NO
MIGRATION_CREATED: NO
MODEL_DRIFT: NONE
SITE_HTTP_API: NOT_IMPLEMENTED
CAPABILITIES: NOT_ADDED
DEV_BOOTSTRAP: NOT_ADDED
FRONTEND: UNCHANGED
CONTRACTOR_POSITIVE: NONE
ZONE_REGION_C1: PUBLISHED / ROUTES UNCHANGED
SITE_B1: PUBLISHED
SITE_AUTH_FOUNDATION: IMPLEMENTED_LOCALLY_VERIFIED / NOT_PUBLISHED
DOCS_IMPACT: YES
DOCUMENTATION_SYNC: Site/Identity modules and contexts, security and
non-normative ADR-017 implementation status updated; ADR decision unchanged;
Site API still marked unimplemented.
LOCAL_COMMIT: one task-owned standalone commit after staged diff review
MAIN: 4307ac3412f2c7da73290b76e4ee5358d1f8053c (unchanged)
ORIGIN_MAIN: same
PUSH: NONE
NEXT_ACTION: Independent SITE-AUTH-01 security/integration review before
publication; do not start Site HTTP API, merge or push automatically.

## SITE-AUTH-01R independent review and bounded remediation checkpoint

TASK: TASK-02.03.03
PHASE: SITE-AUTH-01R — independent review and main integration
STATUS: REVIEW_PASS / PREINTEGRATION_GATES_PASS
CHECKPOINT_STATUS: SAFE
BASELINE_SHA: 4307ac3412f2c7da73290b76e4ee5358d1f8053c
SOURCE_SITE_AUTH_COMMIT: cb05c9a61aac413bd3481802d04873fe9f36491b
LAST_SAFE_COMMIT: cb05c9a61aac413bd3481802d04873fe9f36491b
COMPLETED: exact cumulative diff review; separate read-only adversarial review;
bounded real-provider two-Zone list/revocation/create-parent test expansion;
stale current runtime/status docs corrected; independent remediation re-review.
VERIFIED: all 11 explicit Release harnesses PASS; Release solution build zero
warnings/errors; dotnet test exit 0; Identity/Sites model drift NONE; four
infrastructure/smoke-contract scripts PASS; changed-C# whitespace, diff,
Markdown references/ADR uniqueness and scoped secret hygiene PASS.
DOCS_IMPACT: YES
DOCUMENTATION_SYNC: PASS for local foundation; publication status pending.
SITE_F1: CLOSED
SITE_F2: CLOSED
F1: CLOSED
F2: CLOSED
OPEN_CRITICAL: 0
OPEN_HIGH: 0
OPEN_MEDIUM: 0
OPEN_LOW: 0
NOTES: source-scan portions of structural regression tests have a documented
nonblocking robustness limitation; current code inspected directly.
UNCOMMITTED: expanded RealProviderSiteAuthorizationChecks, four affected
current-status docs, review report, reviewer handoff and this checkpoint only.
DECISIONS: ADR-017 frozen contract unchanged; remediation is tests/docs only.
BLOCKERS: NONE
PENDING: reviewed remediation commit; re-fetch/fast-forward; post-integration
gates; final publication docs/checkpoint; normal push; exact-SHA hosted CI.
FILES_CHANGED: see .agent/tasks/TASK-02.03.03/site-auth-01r-review.md and git diff.
NEXT_ACTION: commit only the bounded reviewed test/docs remediation, then
re-fetch and integrate with --ff-only if origin/main is still the exact baseline.
DO_NOT_REPEAT: no Site HTTP API, frontend, capabilities, DEV bootstrap,
contractor-positive access, migration, production Zone/Region route changes,
ADR decision rewrite, amend, squash, cherry-pick, merge commit or force push.

## SITE-AUTH-01R publication checkpoint

TASK: TASK-02.03.03
PHASE: SITE-AUTH-01R — independent review and integration
STATUS: SITE_AUTH_PUBLISHED_ON_LOCAL_MAIN / PUSH_AND_HOSTED_CI_PENDING
CHECKPOINT_STATUS: SAFE
BRANCH: main
BASELINE_SHA: 4307ac3412f2c7da73290b76e4ee5358d1f8053c
SOURCE_SITE_AUTH_COMMIT: cb05c9a61aac413bd3481802d04873fe9f36491b
REMEDIATION_COMMIT: 6ea9fe9a6b0628203a39d68d21c1644d483da87d
LAST_SAFE_COMMIT: 6ea9fe9a6b0628203a39d68d21c1644d483da87d
SITE_B1: PUBLISHED
SITE_AUTH_00: CONTRACT_FROZEN
SITE_AUTH_01: PUBLISHED on local main by fast-forward
ADR_017: IMPLEMENTED
IDENTITY_SITE_SCOPE: PUBLISHED
SITES_SITE_AUTH: PUBLISHED
AUTHORIZED_SITE_LIST: PUBLISHED
SITE_HTTP_API: NOT_STARTED / NOT_IMPLEMENTED
COMPLETED: independent review and bounded test/docs remediation; main
fast-forward; final publication documentation sync.
VERIFIED: on main all 11 explicit Release harnesses PASS, including Identity
Site exact scopes, real provider direct/create/list, SITE-F1/SITE-F2 and
original F1/F2, C1 API, Site B1 persistence/Region races/audit, OIDC/contexts;
Release build zero warnings/errors, dotnet test exit 0, Identity/Sites EF
drift NONE, changed-C# formatting/diff/Markdown/secret hygiene PASS.
OPEN_CRITICAL: 0
OPEN_HIGH: 0
OPEN_MEDIUM: 0
OPEN_LOW: 0
NOTES: one nonblocking structural-test source-scan robustness limitation.
DOCS_IMPACT: YES
DOCUMENTATION_SYNC: PASS — foundation published, Site HTTP absent; no
Accepted ADR decision change, no schema/migration/frontend/route changes.
UNCOMMITTED: narrow publication docs/checkpoint/report only; clean after
the publication-status commit containing this checkpoint.
DECISIONS: source commit preserved; separate remediation commit; --ff-only;
contract ADR-017 unchanged; ordinary push only if baseline remote unchanged.
BLOCKERS: NONE — authenticated GitHub Actions browser access verified.
PENDING: ordinary main push and exact-final-SHA hosted CI; do not infer PASS
from the earlier baseline run or from local tests.
HOSTED_CI: NOT_YET_VERIFIED_AT_CHECKPOINT
FILES_CHANGED: publication status in architecture/API/backlog/security,
Identity/Sites module docs and capsules, ADR index/non-normative ADR-017
status, review report and this checkpoint.
NEXT_ACTION: commit publication-status docs, fetch/verify origin/main remains
the exact baseline, push main normally and verify backend/frontend/required
checks for the exact final SHA; then STOP. After completion, the next separate
task is to implement Site HTTP API using this published authorization foundation.
DO_NOT_REPEAT: no new Site HTTP API work in this session; no refactor,
migration, capabilities, DEV bootstrap, frontend, positive contractor path,
Zone/Region production-route change, accepted contract rewrite or force push.

## SITE-API-01 atomic checkpoint 1
TASK: TASK-02.03.03
PHASE: SITE-API-01 — PRODUCTION SITE HTTP API
STATUS: IN_PROGRESS / UNCOMMITTED
BASELINE_SHA: 229887f9f5a1ac00c1ec6d2ddb0c586e774996d4
LAST_SAFE_COMMIT: 229887f9f5a1ac00c1ec6d2ddb0c586e774996d4
BRANCH: codex/task-02.03.03-site-api
REPOSITORY_GUARD: PASS — fetch; HEAD/main/origin/main exact baseline; initial clean
TASK_RESUME: SAFE — prior published checkpoint is historical; actual published Git baseline matches owner request
SITE_B1: PUBLISHED
SITE_AUTHORIZATION: PUBLISHED
SITE_API_01_STEP_1: DONE
SITE_LIST_ROUTE: PASS
SITE_GET_ROUTE: PASS
LIST_IDOR: PASS
DIRECT_IDOR: PASS
COUNT_LEAKAGE: NONE
VERIFIED: affected API Release build zero warnings/errors; SitesApiChecks PostgreSQL HTTP harness PASS including original C1 and focused Site list/GET/filter/count/paging/DTO checks
UNCOMMITTED: Site endpoint/read handler/read projection/registrations; additive canonical request authorization methods; Site HTTP tests and architecture boundary assertion; this checkpoint
SCHEMA_CHANGED: NO
MIGRATION_CREATED: NO
NEXT_ACTION: implement create and ordinary update through B1 command store and Application handlers
DO_NOT_REPEAT: no contract redesign, ADR change, Zone/Region behavior change, frontend, capabilities, DEV bootstrap, contractor-positive path, merge or push

## SITE-API-01 atomic checkpoint 2
SITE_API_01_STEP_2: DONE
SITE_CREATE_ROUTE: PASS
SITE_UPDATE_ROUTE: PASS
CREATE_PARENT_CONCEALMENT: PASS
DENIED_MUTATION_SIDE_EFFECTS: NONE
VERIFIED: affected API Release build PASS; PostgreSQL HTTP Site create/update matrix PASS, including normalized global duplicate, missing/inactive references, immutable fields, inactive-reference retention, invalid DTO, stale version and state/version/audit snapshots
UNCOMMITTED: checkpoint 1 paths plus create/update Application handlers, SiteReferenceKind for exact frozen HTTP error mapping, two corresponding Criticality exceptions in B1 store, expanded HTTP tests
LAST_SAFE_COMMIT: 229887f9f5a1ac00c1ec6d2ddb0c586e774996d4
NEXT_ACTION: implement and verify lifecycle and independent criticality permission routes
DO_NOT_REPEAT: frozen contracts/B1/auth architecture remain unchanged; no migrations/frontend/capabilities/DEV bootstrap/merge/push

## SITE-API-01 atomic checkpoint 3
SITE_API_01_STEP_3: DONE
SITE_ACTIVATE: PASS
SITE_DEACTIVATE: PASS
SITE_CRITICALITY: PASS
CRITICALITY_PERMISSION_ISOLATION: PASS
VERIFIED: PostgreSQL HTTP harness PASS for all seven routes, no DELETE/duplicates, DTO/OpenAPI fields, lifecycle/criticality concealment, stale/invalid versions, failed transaction effects and frozen before/after audit payloads. Separate real Identity provider HTTP factory PASS for direct/list/create/criticality, revocation, contractor, JWT/role/UserType/context-only, foreign context and forged DTO/query authority.
UNCOMMITTED: all SITE-API-01 source/tests/registrations/checkpoint paths only; logs are in TEMP
LAST_SAFE_COMMIT: 229887f9f5a1ac00c1ec6d2ddb0c586e774996d4
NEXT_ACTION: independent read-only Site HTTP security review; full Release/harness/model-drift/formatting/docs gates
DO_NOT_REPEAT: do not redo published authorization review or contracts; no schema/migration/frontend/capabilities/DEV bootstrap/positive contractors/merge/push

## SITE-API-01 atomic checkpoint 4 and local commit handoff
TASK: TASK-02.03.03
PHASE: SITE-API-01 — PRODUCTION SITE HTTP API
STATUS: IMPLEMENTED_LOCALLY_VERIFIED / LOCAL_COMMIT_READY
SITE_API_01_STEP_4: DONE
ATOMIC_CHECKPOINT_1: DONE
ATOMIC_CHECKPOINT_2: DONE
ATOMIC_CHECKPOINT_3: DONE
ATOMIC_CHECKPOINT_4: DONE
BASELINE_SHA: 229887f9f5a1ac00c1ec6d2ddb0c586e774996d4
BRANCH: codex/task-02.03.03-site-api
LAST_SAFE_COMMIT: 229887f9f5a1ac00c1ec6d2ddb0c586e774996d4 before the single local implementation commit containing this checkpoint
SITE_B1: PUBLISHED
SITE_AUTHORIZATION: PUBLISHED
SITE_HTTP_API: IMPLEMENTED LOCALLY / VERIFIED; NOT_PUBLISHED
SITE_LIST: PASS
SITE_GET: PASS
SITE_CREATE: PASS
SITE_UPDATE: PASS
SITE_ACTIVATE: PASS
SITE_DEACTIVATE: PASS
SITE_CRITICALITY: PASS
SITE_DELETE: ABSENT
PERMISSIONS: list/get sites.read; create sites.create; update/lifecycle sites.change; criticality sites.change_criticality only
LIST_FILTERS: regionId/siteTypeId/criticalityClassId/status/q
LIST_ORDER: code ASC, id ASC
PAGINATION: page 1 default; pageSize 50 default/max 200; canonical items/page/pageSize/totalCount/totalPages
TARGET_CONCEALMENT: PASS — missing/out-of-scope 403 GEOGRAPHY_ACCESS_DENIED on all five direct routes
CREATE_PARENT_CONCEALMENT: PASS — same 403 for missing/inaccessible Region
IDOR: DENIED
FORGED_PARENT: IMPOSSIBLE via published target service
FORGED_ANCESTOR: IMPOSSIBLE via authoritative Site/Region join
FORGED_SCOPES: IMPOSSIBLE at HTTP/list public boundary
EMPTY_SCOPE: EMPTY_RESULT
COUNT_LEAKAGE: NONE
BUSINESS_FILTER_AUTH_COMPOSITION: PASS
DENIED_MUTATION_STATE_CHANGE: NONE
DENIED_MUTATION_ROW_VERSION: NONE
DENIED_MUTATION_AUDIT: NONE
OPTIMISTIC_CONCURRENCY: PASS
DUPLICATE_CODE_MAPPING: PASS — 409 SITE_CODE_ALREADY_EXISTS
REFERENCE_ELIGIBILITY: PASS
REGION_SERIALIZATION: PASS — unchanged B1 locked path and both PostgreSQL race orderings
AUDIT_ATOMICITY: PASS — B1 and HTTP injected-failure rollback
CONTRACTOR: FAIL_CLOSED — list empty/direct commands denied with real persisted assignments
SITE_F1: CLOSED / REGRESSION_PASS
SITE_F2: CLOSED / REGRESSION_PASS
F1: CLOSED / REGRESSION_PASS
F2: CLOSED / REGRESSION_PASS
C1_REGRESSION: PASS
SERVER_SIDE_FILTERING: PASS
QUERY_SHAPE: unchanged published one scope query + authorized SQL count/bounded page; direct hierarchy + scope query; canonical request-level subject/context queries additionally
N_PLUS_ONE: NONE by source/SQL inspection; no load benchmark claimed
IDENTITY_SITES_DB_DEPENDENCY: NONE
SITES_IDENTITY_DB_DEPENDENCY: NONE
SCHEMA_CHANGED: NO
MIGRATION_CREATED: NO
MODEL_DRIFT: NONE — Sites and Identity
POSTGRESQL_TESTS: PASS
API_TESTS: PASS — production HTTP/PostgreSQL and separate real Identity factory
OIDC_REGRESSION: PASS
WORKING_CONTEXT_REGRESSION: PASS
ARCHITECTURE_CHECKS: PASS
RELEASE_BUILD: PASS — zero warnings/errors
DOTNET_TEST: PASS — exit 0, executable harnesses explicitly run; no discovery claim
EXPLICIT_HARNESSES: PASS — all 11
FORMATTING: PASS — changed handwritten C# only
MARKDOWN_REFERENCES: PASS
DIFF_HYGIENE: PASS
SECRET_HYGIENE: PASS
SECURITY_REVIEW: PASS — independent read-only source review and final reconciliation, see site-api-01-review.md
SECURITY_FINDINGS: NONE_ACTIONABLE
HIGHEST_SEVERITY: NONE
OPEN_CRITICAL: 0
OPEN_HIGH: 0
OPEN_MEDIUM: 0
OPEN_LOW: 0
NOTES: reviewer did not independently rerun harnesses; primary runtime evidence above; existing source-scan robustness limitation unchanged; no hosted CI for local-only work
DOCS_IMPACT: YES
DOCUMENTATION_SYNC: PASS
CHECKPOINT_UPDATED: YES
COMPLETED: all seven HTTP routes through published subject/target/list and B1 handlers; negative/security/business/audit/route regressions; independent review; full local gates; docs sync
UNCOMMITTED: only reviewed SITE-API-01 source/tests/docs/checkpoint/review paths; explicit staging and one authorized local commit next
LOCAL_COMMIT: the single local implementation commit containing this checkpoint, parent exact BASELINE_SHA; resolve actual SHA with git rev-parse HEAD
POST_COMMIT_EXPECTED: clean codex/task-02.03.03-site-api; main/origin/main unchanged at BASELINE_SHA; no push
FRONTEND: NOT_IMPLEMENTED
CAPABILITIES: NOT_IMPLEMENTED
DEV_BOOTSTRAP: NOT_IMPLEMENTED
CONTRACTOR_POSITIVE: NOT_SUPPORTED
MAIN_MODIFIED: NO
PUSH: NONE
BLOCKERS: NONE for local implementation; publication requires separate owner-authorized review
NEXT_ACTION: Independent SITE-API-01 security/integration review before publication
RECOMMENDED_MODEL_NEXT: gpt-6-sol
RECOMMENDED_EFFORT_NEXT: high
DO_NOT_REPEAT: do not reopen frozen contracts or repeat passing gates without a source change; no migration/schema/ADR-017 change, frontend, capabilities, DEV bootstrap, positive contractors, Zone/Region production semantics, merge or push

## SITE-API-01 single-commit checkpoint
STATUS: LOCAL_VERIFIED_IMPLEMENTATION_COMMIT
CHECKPOINT_STATUS: SAFE
LOCAL_COMMIT: current HEAD on codex/task-02.03.03-site-api containing this checkpoint; parent 229887f9f5a1ac00c1ec6d2ddb0c586e774996d4
LAST_SAFE_COMMIT: current implementation HEAD on codex/task-02.03.03-site-api; resolve git rev-parse HEAD and verify parent against BASELINE_SHA
UNCOMMITTED: NONE after the single authorized implementation commit
WORKTREE: CLEAN after commit (post-commit Git assertion required and reported to owner)
MAIN: 229887f9f5a1ac00c1ec6d2ddb0c586e774996d4 unchanged
ORIGIN_MAIN: same, no push
NEXT_ACTION: Independent SITE-API-01 security/integration review before publication
DO_NOT_REPEAT: Then STOP; no merge/push/frontend or adjacent phase

## SITE-API-01R preintegration checkpoint

TASK: TASK-02.03.03
PHASE: SITE-API-01R — FINAL ADVERSARIAL REVIEW + MAIN INTEGRATION
STATUS: INDEPENDENT_REVIEW_PASS / PREINTEGRATION_GATES_PASS
CHECKPOINT_STATUS: SAFE
BASELINE_SHA: 229887f9f5a1ac00c1ec6d2ddb0c586e774996d4
SOURCE_SITE_API_COMMIT: b4b5dbce2dbd1c344d1caf643c981f31b663f233
LAST_SAFE_COMMIT: b4b5dbce2dbd1c344d1caf643c981f31b663f233
BRANCH: codex/task-02.03.03-site-api
REPOSITORY_STATE_GUARD: SAFE / CLEAN_BASELINE before review; both worktrees clean
TASK_RESUME: SAFE — latest implementation checkpoint matches exact SHA/parent and clean Git
COMPLETED: exact candidate inspection; independent read-only security review;
tests-only real-provider full matrix/count/filter/forged body-query-header extension.
VERIFIED: all 11 explicit Release harnesses PASS; Site HTTP rerun after final extension;
full Release build zero warnings/errors; dotnet test exit 0; Site/Identity EF drift NONE;
four infrastructure/smoke-contract scripts PASS; changed-C# formatting/diff/Markdown
references/scoped secret hygiene PASS. See site-api-01r-review.md for evidence.
DECISIONS: frozen contract/ADR/auth architecture unchanged; no production defect;
separate tests-only remediation commit without amending source; --ff-only integration.
OPEN_CRITICAL: 0
OPEN_HIGH: 0
OPEN_MEDIUM: 0
OPEN_LOW: 0
NOTES: nonblocking source-text assertion robustness; runtime proof is independent.
UNCOMMITTED: RealSiteListMatrixChecks.cs; invocation in RealSiteHttpChecks.cs;
this checkpoint, review report and reviewer handoff only.
DOCS_IMPACT: YES — review/test evidence and later publication status
DOCUMENTATION_SYNC: PASS for preintegration truth; publication status pending integration
BLOCKERS: NONE — Docker running; authenticated GitHub Actions access verified
PENDING: commit remediation; fetch/ff main; post-integration gates; publication docs;
normal push and exact-final-SHA hosted CI.
NEXT_ACTION: commit reviewed tests/evidence, fetch and fast-forward only if origin/main
still equals exact BASELINE_SHA.
DO_NOT_REPEAT: no frontend/capabilities/DEV bootstrap/contractor-positive work,
schema/migration/ADR contract or Zone/Region semantics change, amend/squash/cherry-pick,
merge commit/force push; do not start another product phase after publication.

## SITE-API-01R publication checkpoint

TASK: TASK-02.03.03
PHASE: SITE-API-01R — FINAL ADVERSARIAL REVIEW + MAIN INTEGRATION
STATUS: SITE_API_PUBLISHED_ON_LOCAL_MAIN / PUSH_AND_HOSTED_CI_PENDING
CHECKPOINT_STATUS: SAFE
BRANCH: main
BASELINE_SHA: 229887f9f5a1ac00c1ec6d2ddb0c586e774996d4
SOURCE_SITE_API_COMMIT: b4b5dbce2dbd1c344d1caf643c981f31b663f233
REMEDIATION_COMMIT: d2714658ffbe2c6c6f7d5ed2357a89032eabf079
FINAL_SITE_API_SHA: d2714658ffbe2c6c6f7d5ed2357a89032eabf079
LAST_SAFE_COMMIT: d2714658ffbe2c6c6f7d5ed2357a89032eabf079
FINAL_MAIN_SHA: publication-status commit containing this checkpoint; resolve git rev-parse HEAD
SITE_B1: PUBLISHED
SITE_AUTH_00: CONTRACT_FROZEN
SITE_AUTH_01: PUBLISHED
SITE_API_01: PUBLISHED on local main by fast-forward
SITE_ROUTES: PUBLISHED — exactly seven authenticated operations
SITE_DELETE: ABSENT
COMPLETED: independent adversarial review; separate tests-only proof remediation;
main fast-forward; all required post-integration gates; publication documentation sync.
VERIFIED: on main full Release build zero warnings/errors; dotnet test exit 0;
all 11 explicit executable harnesses PASS, including real-provider HTTP matrix,
Site IDOR/403 concealment/criticality-only/denied persisted effects/concurrency/audit,
SITE-F1/SITE-F2/original F1/F2/C1, B1 Region races, OIDC and working contexts;
Site/Identity model drift NONE; changed-C# formatting/diff/Markdown/secret hygiene PASS.
OPEN_CRITICAL: 0
OPEN_HIGH: 0
OPEN_MEDIUM: 0
OPEN_LOW: 0
NOTES: one nonblocking brittle source-text assertion robustness note
DOCS_IMPACT: YES
DOCUMENTATION_SYNC: PASS — publication status synchronized; accepted contracts unchanged
UNCOMMITTED: narrow publication docs/review report/this checkpoint only; clean after commit
DECISIONS: source preserved; bounded tests-only remediation; fast-forward only; normal push
BLOCKERS: NONE
PENDING: final publication docs commit, normal push, exact-final-SHA hosted CI
HOSTED_CI: NOT_YET_VERIFIED_AT_CHECKPOINT
FILES_CHANGED: architecture/API/backlog/security/Sites module/capsule/ADR index and
non-normative ADR-017 implementation status, review report and state only
FRONTEND: NOT_IMPLEMENTED
CAPABILITIES: NOT_IMPLEMENTED
DEV_BOOTSTRAP: NOT_IMPLEMENTED
CONTRACTOR_POSITIVE: NOT_SUPPORTED
NEXT_ACTION: fetch/verify expected remote ancestor and push main normally; verify
exact final SHA backend/frontend/required hosted checks, then STOP. Plan Site frontend /
next TASK-02.03.03 product phase only after publication is fully verified.
DO_NOT_REPEAT: no frontend, capabilities, DEV bootstrap, contractor-positive access,
new backend feature, schema/migration or accepted ADR rewrite; no force push.

## SITE-API-01R final publication reconciliation

TASK: TASK-02.03.03
PHASE: SITE-API-01R — FINAL ADVERSARIAL REVIEW + MAIN INTEGRATION
STATUS: SITE_API_PUBLISHED
CHECKPOINT_STATUS: SAFE
SITE_B1: PUBLISHED
SITE_AUTH_00: CONTRACT_FROZEN
SITE_AUTH_01: PUBLISHED
SITE_API_01: PUBLISHED
SITE_ROUTES: PUBLISHED
SITE_DELETE: ABSENT
SOURCE_SITE_API_COMMIT: b4b5dbce2dbd1c344d1caf643c981f31b663f233
REMEDIATION_COMMIT: d2714658ffbe2c6c6f7d5ed2357a89032eabf079
FINAL_SITE_API_SHA: d2714658ffbe2c6c6f7d5ed2357a89032eabf079
PUBLICATION_STATUS_COMMIT: be914f30cac4594cd7c4961c066991a28d857f90
LAST_SAFE_COMMIT: be914f30cac4594cd7c4961c066991a28d857f90
COMPLETED: review, remediation, fast-forward, post-integration gates, docs sync,
normal push and exact-publication-SHA hosted CI.
VERIFIED: main == origin/main at be914f30cac4594cd7c4961c066991a28d857f90;
both worktrees clean; Build pipeline #28 backend/frontend/Verify required checks PASS.
HOSTED_CI_VERIFIED_SHA: be914f30cac4594cd7c4961c066991a28d857f90
HOSTED_CI_RUN: https://github.com/CrazyMotoCat/AC_Expluatation/actions/runs/36515499758
FINAL_MAIN_SHA: this final reconciliation metadata commit; resolve main with Git
FINAL_METADATA_CI: must be checked for this exact commit after its normal push;
authoritative evidence is the matching GitHub Actions run, not this prior-SHA PASS.
UNCOMMITTED: only this reconciliation and review-report status; clean after commit
DECISIONS: no production/test changes after post-integration gates; no skip-CI flag
BLOCKERS: NONE
OPEN_CRITICAL: 0
OPEN_HIGH: 0
OPEN_MEDIUM: 0
OPEN_LOW: 0
NOTES: one nonblocking source-text assertion robustness note
DOCUMENTATION_SYNC: PASS
FRONTEND: NOT_IMPLEMENTED
CAPABILITIES: NOT_IMPLEMENTED
DEV_BOOTSTRAP: NOT_IMPLEMENTED
CONTRACTOR_POSITIVE: NOT_SUPPORTED
NEXT_ACTION: determine the next TASK-02.03.03 product phase only after the exact
final main SHA has passed hosted CI; no next phase is authorized in SITE-API-01R.
DO_NOT_REPEAT: implementation/review/local gates are complete; do not rerun them
without new source changes, start frontend/capabilities/DEV bootstrap or another
backend feature. If resuming only final metadata verification, inspect Git and
the exact current-SHA hosted run, then STOP.


## SITE-REF-AUTH-01 backend checkpoint

TASK: TASK-02.03.03
PHASE: SITE-REF-AUTH-01
STATUS: PASS / LOCALLY_COMPLETE / PUBLICATION_PENDING
CHECKPOINT_STATUS: SAFE
BASELINE_SHA: e099be23554c34b9d668b5297437a5f54af9d8d5
LAST_SAFE_COMMIT: e099be23554c34b9d668b5297437a5f54af9d8d5
BRANCH: codex/task-02.03.03-site-ref-auth
WORKSPACE: C:/Users/mvideo/.codex/worktrees/site-ref-auth/АС Эксплуатация
REPOSITORY_STATE_GUARD: SAFE / CLEAN_BASELINE at branch creation
TASK_RESUME: SAFE; historical final metadata resolves to baseline; separate backend phase authorized
EXECUTION_MODE: BALANCED; primary implementation; independent read-only security reviewer before commit
COMPLETED: fixed-set Sites catalog authorization service; narrow two-route integration;
real-provider PostgreSQL/HTTP authorization matrix and service failure/bounded query checks
VERIFIED: full Release build PASS (zero warnings/errors); all 11 explicit harnesses PASS;
dotnet test exit 0; Sites/Identity EF model drift NONE; formatting/diff/Markdown/secret hygiene PASS.
See site-ref-auth-01-validation.md for commands and catalog/negative/regression mapping.
DOCS_IMPACT: YES
DOCUMENTATION_SYNC: PASS
UNCOMMITTED: NONE after the single local commit containing this checkpoint.
FILES_CHANGED: Sites Application authorization service/interface; two catalog endpoints;
API/module DI; catalog test matrix and adapted reference scope/context assertions; architecture checks;
Sites module/context, API/security/reference registry docs; validation/security reports; this checkpoint
PENDING: independent publication review; no push/merge authorized
DECISIONS: SITE-REF-OD-01 global catalogs need any one current exact Sites assignment;
SITE-REF-OD-02 no permission implication or Site-operation grant;
SITE-REF-OD-03 only user/context input; fixed four permissions through existing Identity provider.
No new ADR: bounded Sites composition under existing Identity contracts; no model/boundary/schema change.
Provider exception denies immediately; cancellation propagates. ACTIVE/INACTIVE catalog DTO/data unchanged.
BLOCKERS: NONE
SECURITY_REVIEW: PASS; independent read-only review, OPEN_CRITICAL/HIGH/MEDIUM/LOW = 0
LOCAL_COMMIT: the single commit containing this checkpoint; resolve git rev-parse HEAD
COMMIT_PARENT: e099be23554c34b9d668b5297437a5f54af9d8d5
WORKTREE: CLEAN after the single local commit; Git status is authoritative
MAIN_MODIFIED: NO
SITE_UI_BRANCH: preserved unchanged in original checkout with its six expected documentation paths
PUSH: NONE
HOSTED_CI: not run for this local branch; no new hosted-CI PASS claimed
NEXT_ACTION: Independent review/publication of SITE-REF-AUTH-01, then resume SITE-UI-01 from the published baseline.
DO_NOT_REPEAT: no SITE-UI changes; no global grant-source enablement, Site/Zone/Region semantics,
schema/migrations, contractor-positive access, capabilities, reference CRUD, push or merge.

## SITE-REF-AUTH-01R final review and integration checkpoint

TASK: TASK-02.03.03
PHASE: SITE-REF-AUTH-01R — FINAL SECURITY REVIEW + MAIN INTEGRATION
STATUS: SITE_REF_AUTH_01_PUBLISHED
CHECKPOINT_STATUS: SAFE
BASELINE_SHA: e099be23554c34b9d668b5297437a5f54af9d8d5
SOURCE_COMMIT: 563ab4d2f83a8213b7da793e50496db077a48f08
REMEDIATION_COMMITS: NONE
FINAL_REF_AUTH_SHA: 563ab4d2f83a8213b7da793e50496db077a48f08
FINAL_MAIN_SHA: this final metadata commit; resolve main with Git
LAST_SAFE_COMMIT: this final metadata commit; resolve Git HEAD
INTEGRATION_METHOD: fast-forward only
COMPLETED: independent final source review; exact candidate diff review; fast-forward;
post-integration verification on main; publication checkpoint and documentation sync.
VERIFIED: main advanced from the exact baseline to the exact candidate; Release build,
all 11 explicit harnesses, dotnet test command, changed-file formatting, diff check,
Sites and Identity model drift checks PASS. See site-ref-auth-01-validation.md.
REFERENCE_ENDPOINTS: GET site-types and GET site-criticality-classes only
FIXED_PERMISSIONS: sites.read; sites.create; sites.change; sites.change_criticality
SITE_TYPE_REFERENCE_AUTH: PASS
SITE_CRITICALITY_REFERENCE_AUTH: PASS
ZONE_SCOPE: PASS
REGION_SCOPE: PASS
SITE_SCOPE: PASS
SITES_READ: catalog allowed; Site operation semantics unchanged
SITES_CREATE: catalog allowed; Site operation semantics unchanged
SITES_CHANGE: catalog allowed; Site operation semantics unchanged
SITES_CHANGE_CRITICALITY: catalog allowed; Site operation semantics unchanged
NO_SITE_PERMISSION: DENIED
UNRELATED_PERMISSION: DENIED
FUTURE_ASSIGNMENT: DENIED
EXPIRED_ASSIGNMENT: DENIED
WRONG_CONTEXT: DENIED
CONTRACTOR: DENIED
UNAUTHENTICATED: 401
CALLER_PERMISSION_INPUT: NONE
CALLER_SCOPE_INPUT: NONE
F2_STYLE_INJECTION: DENIED
PERMISSION_IMPLICATION: NONE
SITE_OPERATION_ESCALATION: NONE
GLOBAL_GRANT_SOURCE_CHANGED: NO
SITE_AUTH_CHANGED: NO
GEOGRAPHY_AUTH_CHANGED: NO
SITE_F1/SITE_F2/F1/F2/C1_REGRESSION: PASS
IDENTITY_SITES_DB_DEPENDENCY: NONE
SITES_IDENTITY_DB_DEPENDENCY: NONE
SCHEMA_CHANGED: NO
MIGRATION_CREATED: NO
MODEL_DRIFT: NONE
SECURITY_FINDINGS: OPEN_CRITICAL=0; OPEN_HIGH=0; OPEN_MEDIUM=0; OPEN_LOW=0
DOCS_IMPACT: YES
DOCUMENTATION_SYNC: PASS
SITE_UI_01: BLOCKER_RESOLVED / NOT_RESUMED
SITE_B1: PUBLISHED
SITE_AUTH_01: PUBLISHED
SITE_API_01: PUBLISHED
FRONTEND: NOT_IMPLEMENTED
PUSHED: YES, normal push
REMOTE_SHA: this final metadata commit after push; resolve origin/main with Git
HOSTED_CI_VERIFIED_SHA: 61d3774fe5a64b7663ee2ae8abafdd74a7b09dda
HOSTED_CI_RUN: https://github.com/CrazyMotoCat/AC_Expluatation/actions/runs/36519320502
FINAL_METADATA_CI: verify exact SHA of this checkpoint commit after its normal push
SITE_UI_BRANCH: unchanged; preserved dirty contract-gap checkpoint remains in its original worktree
NEXT_ACTION: verify exact-SHA hosted CI for this final metadata commit; then stop this phase.
NEXT_PRODUCT_ACTION: resume SITE-UI-01 from the clean published baseline in its preserved branch.
STOP: do not resume SITE-UI-01 in this phase.
DO_NOT_REPEAT: no frontend work, schema/migration, permission or geography semantic changes,
grant-source change, capabilities, DEV bootstrap, force push, squash or merge commit.
