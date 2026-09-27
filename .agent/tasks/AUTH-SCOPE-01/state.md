## Current checkpoint — Phase B2-B2 implementation and verification (2026-09-27)

TASK: AUTH-SCOPE-01
PHASE: B2-B2 — SITES TRUSTED TARGET RESOLVER + SCOPED SQL QUERY FOUNDATION
STATUS: IMPLEMENTED — verification and independent review passed; recorded in the local B2 commit
BASELINE_SHA: a3167e85115875c48737f7af10007366e2beaa69
BRANCH: codex/auth-scope-01-b2
LAST_SAFE_COMMIT: a3167e85115875c48737f7af10007366e2beaa69
REPOSITORY_STATE_GUARD: SAFE_WITH_CHECKPOINT / DIRTY_EXPECTED
RESUME_SAFE: YES — HEAD, main, origin/main and live origin/main match baseline;
  dirty paths contain B2-A/B2-B1 plus B2-B2 task-owned code, tests and docs.
SITE_CHECKPOINT_BRANCH: `codex/task-02.03.03-site-b1` at
  `4d230e7c8192614954b7d106014bfaaf75669207`; verified read-only, unchanged

PREFLIGHT_VERIFIED:
- Reconciled `state.md`, branch, HEAD, main, origin/main, live origin/main,
  expected dirty paths and existing B2-A/B2-B1 changes before edits.
- No unrelated paths or baseline drift found. No Site checkpoint checkout or
  write occurred. B2-B2 changes contain no schema or migration files.
- Read the complete B2-B2 request, frozen B2-A contract, ADR-015, B1/B2-B1
  contracts, Sites module/context, security docs, Sites DbContext, Zone/Region
  persistence and the PostgreSQL Sites harness.
- B2-B1 review and validation remain accepted; do not repeat them wholesale.
- Sites persistence harness uses Testcontainers PostgreSQL and its four
  existing Sites migrations; B2-B2 adds only query/resolver checks.
- Verified B2-B2 production dependency edges: Sites Application and
  Infrastructure reference Identity Application contracts only; no module
  reads the other module's DbContext/schema.

DECISIONS:
- Keep current Geography HTTP route mapping and behavior unchanged.
- Add a narrowly scoped Sites Application query composition that requests
  `sites.read`; retain canonical permission alongside scopes in the read
  request and fail closed for other permission values.
- Expose direct target checks that resolve Sites-owned trusted target facts
  before calling the Identity B1 evaluator.
- Resolve Zone/Region facts only through Sites persistence; Region parent is
  projected from the persisted row.
- No persistence schema or migration is needed.

ATOMIC_CHECKPOINT_0: PASS — branch/baseline/site-ref/dirty-path reconciliation.
ATOMIC_CHECKPOINT_1: PASS — trusted Zone and Region projection; unknown targets
  return null, inactive targets resolve, and Region parent is DB-owned.
ATOMIC_CHECKPOINT_2: PASS — PostgreSQL Zone/Region scope matrix, empty and
  unsupported scopes, duplicate inputs, downward-only coverage and no leakage.
ATOMIC_CHECKPOINT_3: PASS — `sites.read` composition, permission association,
  real B1 evaluator composition, create-parent Zone projection and architecture.
ATOMIC_CHECKPOINT_4: PASS — focused/full verification and independent read-only
  security/integration review; open findings zero at all severities.
B2_B1_REGRESSION: PASS — Identity provider and B1 matrix through real PG harness.
TARGET_RESOLVER: PASS — Zone/Region trusted projections from Sites persistence.
AUTHORITATIVE_HIERARCHY: PASS — Region target uses persisted Zone parent;
  resolver exposes no caller-supplied parent input.
ZONE_SCOPED_QUERY: PASS — exact Zone IDs only; Region scope grants no parent.
REGION_SCOPED_QUERY: PASS — exact Region IDs OR persisted parent Zone IDs.
EMPTY_SCOPE: EMPTY_RESULT — includes contractor provider result with no scopes.
UNSUPPORTED_SCOPE: FAIL_CLOSED — ignored and cannot widen results.
PERMISSION_ISOLATION: PASS — list composition requests `sites.read`; store
  rejects scopes labeled with another canonical permission.
DIRECT_TARGET_FOUNDATION: PASS — actual B1 evaluator: wrong Zone denied,
  persisted covering Zone allowed, ID alone denied, wrong permission denied.
CREATE_PARENT_FOUNDATION: PASS — `sites.create` evaluates resolved Zone.
SERVER_SIDE_FILTERING: PASS — Sites EF predicates execute against PostgreSQL;
  no entity enumeration or per-row authorization call.
N_PLUS_ONE_AUTHORIZATION: NONE — one scope-provider call per list and one
  bounded Sites query when scopes exist.
PRODUCTION_ROUTE_INTEGRATION_CHANGED: NO
SITE_TARGET_SCOPE: NOT_IMPLEMENTED
SCHEMA_CHANGED: NO
MIGRATION_CREATED: NO
MODEL_DRIFT: NOT_APPLICABLE — Sites/Identity EF mappings unchanged.
POSTGRESQL_TESTS: PASS — Sites query/resolver matrix and Identity provider/B1
  composition matrix.
GEOGRAPHY_REGRESSION: PASS — Sites persistence and Sites API harnesses.
AUTH_REGRESSION: PASS — Identity persistence, Authentication and working-context
  harnesses; pure Identity and Sites checks.
ARCHITECTURE_CHECKS: PASS
RELEASE_BUILD: PASS — full solution, 0 warnings/errors.
SOLUTION_DOTNET_TEST: PASS — exits 0; executable repository harnesses run directly.
FORMAT: PASS — changed C# whitespace verification.
MARKDOWN_REFERENCES: PASS — changed Markdown whitespace/local links and ADR index.
DIFF_CHECK: PASS
SECRET_HYGIENE: PASS — changed tracked/untracked paths scanned.
SECURITY_FINDINGS: NONE
HIGHEST_SEVERITY: NONE
OPEN_CRITICAL: 0
OPEN_HIGH: 0
OPEN_MEDIUM: 0
OPEN_LOW: 0
B2_COMMIT_CONTENT: B2-A contract/ADR, B2-B1 Identity implementation/tests/docs,
  and B2-B2 Sites contracts/resolver/scoped queries/tests/docs are recorded in
  this single local commit. No migrations.
LOCAL_B2_COMMIT: THIS COMMIT; exact SHA is repository HEAD and is reported in
  the final response.
WORKTREE_AFTER_COMMIT: CLEAN
MAIN_MODIFIED: NO
SITE_CHECKPOINT_BRANCH: UNCHANGED
PUSH: NONE
MERGE: NONE
NEXT_ACTION: Independent B2 security/integration review before C1 route integration.
DO_NOT_REPEAT: Do not redo B2-B1 review; do not reopen B2-A; do not modify
  Site checkpoint branch or start B2-B3/C1, routes, Site authorization,
  capabilities, DEV bootstrap, contractor-positive grants, push or merge.

---

## Current checkpoint — Phase B2-B1 preflight (2026-09-27)

TASK: AUTH-SCOPE-01
PHASE: B2-B1 — IDENTITY EFFECTIVE SCOPE PROVIDER
STATUS: DONE — B2-B1 IDENTITY EFFECTIVE SCOPE PROVIDER
BASELINE_SHA: a3167e85115875c48737f7af10007366e2beaa69
BRANCH: codex/auth-scope-01-b2
LAST_SAFE_COMMIT: a3167e85115875c48737f7af10007366e2beaa69
REPOSITORY_STATE_GUARD: SAFE_WITH_CHECKPOINT / DIRTY_EXPECTED
RESUME_SAFE: YES — HEAD, main, origin/main and live origin/main match baseline;
  dirty paths match the B2-A docs/checkpoint listed below.
SITE_CHECKPOINT_BRANCH: `codex/task-02.03.03-site-b1` at
  `4d230e7c8192614954b7d106014bfaaf75669207`; unchanged
B1: DONE / PUBLISHED; Identity evaluator is present in baseline
B2-A: CONTRACT_FROZEN; ADR-015; retained as uncommitted docs

PREFLIGHT_VERIFIED:
- Reconciled this checkpoint and actual Git state before edits. No unrelated
  files, implementation changes, partial files, or baseline drift found.
- Read the frozen B2-A contract, ADR-015, Identity module/context, security
  docs, published B1 evaluator and Identity PostgreSQL harness/model.
- Current B1 evaluator duplicates its eligible-user/context/assignment/
  role/permission query inline; B2-B1 must extract shared Identity-owned query
  semantics before adding the provider. Keep direct-target behavior intact.
- Live `git ls-remote origin refs/heads/main` matched the baseline.
- No Site branch checkout or write occurred.

B2_B1_STEP_1: DONE
EFFECTIVE_SCOPE_INTERFACE: IMPLEMENTED
SHARED_AUTH_SEMANTICS: IMPLEMENTED — one Identity Infrastructure eligible-assignment query
PURE_TESTS: PASS
B2_B1_STEP_2: DONE
POSTGRESQL_PROVIDER: PASS
PERMISSION_SPECIFIC: PASS
VALIDITY: PASS
DISTINCT_SCOPES: PASS
EMPTY_SCOPE: NO_ACCESS
B2_B1_STEP_3: DONE
B1_REGRESSION: PASS
SITES_DB_DEPENDENCY: NONE
ARCHITECTURE: PASS
CONTRACTOR: FAIL_CLOSED
B2_B1_STEP_4: DONE
SECURITY_REVIEW: PASS — independent read-only review; no semantic drift,
  widening, fallback, cross-module dependency, or schema change
OPEN_CRITICAL: 0
OPEN_HIGH: 0
OPEN_MEDIUM: 0
OPEN_LOW: 0
SCHEMA_CHANGED: NO
MIGRATION_CREATED: NO
IMPLEMENTATION_STARTED: YES
EFFECTIVE_SCOPE_PROVIDER: PASS
SUPPORTED_SCOPES: TerritorialZone / Region
PERMISSION_SPECIFIC: PASS
EMPTY_SCOPE: NO_ACCESS
DISTINCT_SCOPES: PASS
SHARED_WITH_B1: PASS
USER_ELIGIBILITY: PASS
CONTEXT_VALIDATION: PASS
ASSIGNMENT_VALIDITY: PASS — same `[valid_from, valid_to)` and active semantics
ROLE_NAME_GRANT: NONE
USERTYPE_GRANT: NONE
JWT_CLAIM_GRANT: NONE — no JWT input in provider contract
WORKING_CONTEXT_ALONE_GRANT: NONE
CONTRACTOR: FAIL_CLOSED
QUERY_SHAPE: one PostgreSQL query bounded to eligible user/context/permission assignments
N_PLUS_ONE: NONE
SITES_DB_DEPENDENCY: NONE
CROSS_MODULE_DEPENDENCY: NONE
SCHEMA_CHANGED: NO
MIGRATION_CREATED: NO
MODEL_DRIFT: NOT_APPLICABLE — Identity EF model/mappings unchanged
POSTGRESQL_TESTS: PASS — Testcontainers provider matrix and B1 evaluator regressions
SECURITY_TESTS: PASS
AUTHENTICATION_REGRESSION: PASS
WORKING_CONTEXT_REGRESSION: PASS
AUTHORIZATION_REGRESSION: PASS
ARCHITECTURE_CHECKS: PASS
RELEASE_BUILD: PASS — full solution, Release, 0 warnings/errors
SOLUTION_DOTNET_TEST: PASS — exits 0; repository executable check harnesses run separately
FORMAT: PASS — changed C# files via `dotnet format whitespace --verify-no-changes`
DIFF_CHECK: PASS
SECRET_HYGIENE: PASS — changed paths scanned; no secrets found
DOCUMENTATION_IMPACT: YES
DOCUMENTATION_SYNC: PASS — Identity module/context, security, backlog
SECURITY_FINDINGS: NONE
HIGHEST_SEVERITY: NONE

ATOMIC_CHECKPOINT_1_VERIFIED:
- Identity Infrastructure Release build — PASS, 0 warnings/errors.
- Identity pure checks — PASS, including exact Zone/Region descriptor
  construction and malformed/unsupported descriptor rejection.
- B1 direct-target evaluator now composes the shared eligibility/supported
  scope query; target-specific matching remains in the evaluator.
- Provider query narrows shared eligible assignments to exactly one Zone or
  Region dimension and emits immutable distinct descriptors.
- Schema/migration remain unchanged.

ATOMIC_CHECKPOINT_2_VERIFIED:
- Identity Testcontainers PostgreSQL provider matrix — PASS. Covers exact
  Zone/Region scopes, multiple assignments, duplicate paths, permission
  isolation, missing/inactive/contractor profile, missing/foreign/external/
  inactive/future/expired context, no assignment, role-name-only, wrong or
  missing permission, future/expired/revoked assignment, unsupported and
  composite scopes, malformed empty scope ID, and `[valid_from, valid_to)`
  boundaries.
- Emitted exact Zone/Region scopes agree with the published B1 evaluator;
  permission mismatch is absent from provider output and denied by B1.
- Existing Identity PostgreSQL harness also re-ran the published B1 matrix;
  all existing direct-target cases passed.

ATOMIC_CHECKPOINT_3_VERIFIED:
- Existing B1 evaluator regression matrix — PASS, including exact Zone/Region,
  trusted Zone-to-Region coverage, wrong Zone, sibling Region, Region-to-parent
  denial, permission mismatch, validity boundaries, contractor fail-closed,
  and role-name/UserType/context non-grants.
- Architecture checks — PASS; Identity Infrastructure has no Sites project,
  persistence, or schema dependency, and no circular module edge was added.
- Authentication/permission-policy and working-context regression harness —
  PASS.

ATOMIC_CHECKPOINT_4_VERIFIED:
- Independent read-only security review — PASS; no B1 drift, scope widening,
  permission contamination, eligibility shortcut, contractor access, fail-open
  path, Sites dependency, or schema change. OPEN findings: 0 at every severity.
- Cancellation behavior is covered: a valid provider request with a cancelled
  token propagates `OperationCanceledException`; database failures likewise
  propagate by direct-await/no-catch implementation.
- Full solution Release build — PASS, 0 warnings/errors; solution `dotnet test`
  exits 0. Identity pure, Testcontainers PostgreSQL provider/B1, architecture,
  authentication, permission-policy and working-context harnesses — PASS.
- Changed C# whitespace verification, `git diff --check`, Markdown whitespace
  and reference consistency, and secret hygiene — PASS.
- No Identity EF model/mapping changes; schema/model drift check is not
  applicable. No migration was created.

FILES_ADDED_OR_UPDATED_BY_B2_B1:
- `src/backend/Modules/Identity/Exploitation.Modules.Identity.Application/Authorization/EffectiveScopeRequest.cs`
- `src/backend/Modules/Identity/Exploitation.Modules.Identity.Application/Authorization/EffectiveAuthorizationScopeKind.cs`
- `src/backend/Modules/Identity/Exploitation.Modules.Identity.Application/Authorization/EffectiveAuthorizationScope.cs`
- `src/backend/Modules/Identity/Exploitation.Modules.Identity.Application/Authorization/IEffectiveScopeProvider.cs`
- `src/backend/Modules/Identity/Exploitation.Modules.Identity.Infrastructure/Authorization/EffectiveAuthorizationQueries.cs`
- `src/backend/Modules/Identity/Exploitation.Modules.Identity.Infrastructure/Authorization/EffectiveScopeProvider.cs`
- `src/backend/Modules/Identity/Exploitation.Modules.Identity.Infrastructure/Authorization/EffectiveGrantEvaluator.cs`
- `src/backend/Modules/Identity/Exploitation.Modules.Identity.Infrastructure/IdentityModuleRegistration.cs`
- `tests/unit/Exploitation.IdentityDomainChecks/EffectiveAuthorizationScopeChecks.cs`
- `tests/unit/Exploitation.IdentityDomainChecks/Program.cs`
- `tests/integration/Exploitation.IdentityPersistenceChecks/Program.cs`
- `docs/modules/identity.md`
- `docs/context/identity.context.md`
- `docs/security.md`
- `docs/backlog.md`

UNCOMMITTED: B2-A contract/ADR/reference docs plus B2-B1 Identity Application
contract, shared Identity Infrastructure query/provider/evaluator registration,
Identity pure/PostgreSQL regression checks, synchronized Identity/security/
backlog docs, and this checkpoint. No schema or migration files changed.
DOCUMENTATION_IMPACT: YES
DOCUMENTATION_SYNC: PASS — implementation status and unimplemented Sites
integration are explicit.
CHECKPOINT_UPDATED: YES
WORKTREE_STATE: DIRTY_EXPECTED — B2-A docs plus B2-B1 implementation/tests/docs only.
PUSH: NONE
MERGE: NONE
SITE_CHECKPOINT_BRANCH: unchanged at
  `4d230e7c8192614954b7d106014bfaaf75669207`
NEXT_ACTION: B2-B2 — Sites trusted Zone/Region target resolver and scoped SQL
queries; proceed only under a separate explicit phase request.
RECOMMENDED_MODEL_NEXT: gpt-6-sol
RECOMMENDED_EFFORT_NEXT: high
DO_NOT_REPEAT: Do not redo B1 architecture review or reopen B2-A. Do not start
B2-B2/B2-B3/C1, Geography routes, Site target scope, capabilities, DEV
bootstrap, contractor-positive authorization, push, or merge.

---

## Current checkpoint — Phase B2-A (2026-09-27)

TASK: AUTH-SCOPE-01
PHASE: B2-A — EFFECTIVE SCOPE CONTRACT FREEZE
STATUS: CONTRACT_FROZEN
CHECKPOINT_STATUS: SAFE — docs-only phase complete; no partial files
BASELINE_SHA: a3167e85115875c48737f7af10007366e2beaa69
BRANCH: codex/auth-scope-01-b2
LAST_SAFE_COMMIT: a3167e85115875c48737f7af10007366e2beaa69
REPOSITORY_STATE_GUARD: SAFE — clean baseline before edits; expected docs-only diff now
RESUME_SAFE: YES — branch/HEAD/origin/main matched baseline before edits
B1: DONE / PUBLISHED; source `fb3d5648caceecb1668f84bc0823e12d3de43f8b`
B2_COMMIT: NONE
PUSH: NONE
SITE_CHECKPOINT_BRANCH: `codex/task-02.03.03-site-b1` at `4d230e7c8192614954b7d106014bfaaf75669207`; unchanged

COMPLETED:
- Froze the separate Identity `IEffectiveScopeProvider` list contract while
  retaining B1 `IEffectiveGrantEvaluator` for direct target checks.
- Froze exact Zone/Region scope semantics, permission-specific eligibility,
  no-empty-means-all, Zone-to-Region-only Sites filtering, and module DB
  boundaries in `.agent/tasks/AUTH-SCOPE-01/phase-b2a-effective-scope-contract.md`.
- Added ADR-015 to refine ADR-013's conflicting empty-list response rule;
  ADR-013 itself was not modified.
- Reconciled numbering: ADR-014 is reserved for Site target authorization;
  the B2 effective-scope ADR is ADR-015. ADR-014's Site record was verified
  read-only in the separate Site checkpoint commit.
- Synchronized Identity/Sites module and context docs, security guidance,
  ADR index, and AUTH-SCOPE-01 backlog pointer.
- No production code, tests, schema, migration, cache, Site scope, or route
  integration was changed.

VERIFIED:
- Initial repo guard: `HEAD`, `origin/main`, live `git ls-remote origin main`,
  and requested baseline all matched `a3167e85115875c48737f7af10007366e2beaa69`.
- Initial worktree was clean. Requested AUTH branch was at the published
  baseline; Site checkpoint branch was read-only and unchanged.
- ADR number/reference reconciliation: PASS — current branch references
  ADR-014 only for Site target authorization/reservation and ADR-015 for B2
  effective scopes. The Site commit contains the ADR-014 Site title and index.
- DOCUMENTATION_IMPACT: YES; DOCUMENTATION_SYNC: PASS — contract, ADR, Identity/Sites module/context, security and backlog references synchronized.
- `git diff --check`: PASS; untracked Markdown whitespace check: PASS.
- Secret hygiene on task-owned changed docs: PASS.
- Runtime build/tests/migration checks: NOT_REQUIRED for this docs-only phase.
- No push, B2 implementation, or C1 work started.

EFFECTIVE_SCOPE_PROVIDER_CONTRACT: FROZEN
SUPPORTED_SCOPE_KINDS: TerritorialZone, Region
EMPTY_SCOPE: NO_ACCESS — `200 []` for these future list operations
ZONE_TO_REGION: DOWNWARD_COVERAGE_IN_SITES
REGION_TO_ZONE: NO_UPWARD_COVERAGE
DIRECT_TARGET_AUTH: `IEffectiveGrantEvaluator` — ALLOW/DENY for one trusted target
LIST_AUTH: `IEffectiveScopeProvider`
PROVIDER_INPUT: localUserId, workingContextId, exact canonical permission
PROVIDER_OUTPUT: immutable bounded distinct `(kind, scopeId)` descriptors
PERMISSION_SPECIFIC: YES — no wildcard or cross-permission reuse
DUPLICATE_BEHAVIOR: distinct by pair; deterministic kind/scopeId order preferred
ZONE_LIST_RULE: zone.id in effective TerritorialZone scope IDs
REGION_LIST_RULE: region.id in Region IDs OR authoritative parent Zone ID in Zone IDs
B1_SEMANTICS_REUSE: REQUIRED — shared Identity-owned eligibility rules
IDENTITY_RESPONSIBILITY: user/context/assignment/permission eligibility and exact scopes; no hierarchy lookup
SITES_RESPONSIBILITY: authoritative hierarchy, SQL filtering, direct target projection
CROSS_MODULE_DB_ACCESS: FORBIDDEN
N_PLUS_ONE_POLICY: FORBIDDEN
CONTRACTOR: FAIL_CLOSED — no effective scopes
FAILURE: ambiguity/no valid scope fails closed; infrastructure errors never widen
SCHEMA_CHANGE_EXPECTED: NO
MIGRATION_EXPECTED: NO
CACHE_REQUIRED: NO
SITE_TARGET: NOT_IMPLEMENTED
C1: NOT_STARTED
ADR-014_RESERVED_FOR_SITE_TARGET: YES
B2_EFFECTIVE_SCOPE_ADR: ADR-015
ADR_NUMBER_RECONCILIATION: PASS
ADR_REQUIRED: YES — ADR-015 refines ADR-013 §4 empty-list response semantics; ADR-013 unchanged
DOCUMENTATION_UPDATED: YES — contract, ADR/index, Identity/Sites module/context, security, backlog pointer
CHECKPOINT_UPDATED: YES
IMPLEMENTATION_STARTED: NO

UNCOMMITTED:
- B2-A contract, ADR-015, ADR index, backlog pointer, Identity/Sites
  module/context docs, security guidance, and this state checkpoint.

FILES_CHANGED:
- `.agent/tasks/AUTH-SCOPE-01/phase-b2a-effective-scope-contract.md`
- `.agent/tasks/AUTH-SCOPE-01/state.md`
- `docs/adr/ADR-015-effective-scope-provider-for-geographic-lists.md`
- `docs/adr/README.md`
- `docs/backlog.md`
- `docs/context/identity.context.md`
- `docs/context/sites.context.md`
- `docs/modules/identity.md`
- `docs/modules/sites.md`
- `docs/security.md`

BLOCKERS: None for B2-A.
WORKTREE_STATE: DIRTY_EXPECTED — only the listed docs/checkpoint paths are uncommitted.
IMPLEMENTATION_STARTED: NO
NEXT_ACTION: B2-B1 — implement Identity effective-scope provider after an explicit phase request.
DO_NOT_REPEAT: Do not redo Phase A/B1. Do not start B2-B1, B2-B2, B2-B3, C1,
Site scope, capabilities, Development bootstrap, or contractor-positive grants.

---

TASK: AUTH-SCOPE-01
STATUS: DONE — Phase A contract only
CONTRACT_FROZEN: YES
OD-01: RESOLVED
OD-02: RESOLVED
OD-03: RESOLVED
OD-04: RESOLVED
OD-05: RESOLVED
OD-06: RESOLVED
ADR_013: ACCEPTED
PRODUCTION_IMPLEMENTATION_STARTED: NO
MIGRATION_REQUIRED_PHASE_A: NO
BUILD_RUNTIME_TESTS: NOT_REQUIRED — documentation/contract phase only
CHECKPOINT_STATUS: SAFE
PHASE: A
LAST_SAFE_COMMIT: 693f54b980d66a51246b714fadecce4c12741134

COMPLETED:
- Verified repository implementation for JWT, `/api/v1/me`, Identity
  assignments/role permissions/contexts, production deny grant source,
  target-blind `HasGrantAsync`, and Sites geography permissions.
- Received owner approval for OD-01 through OD-06, one question at a time.
- Recorded exact Phase A contract in `phase-a-contract.md` and Accepted
  ADR-013, which clarifies ADR-007 without replacing it.
- Synchronized ADR index, backlog, Identity/Sites context and module docs,
  security and API guidance with the future contract and current runtime state.

VERIFIED:
- Initial Git guard: main at LAST_SAFE_COMMIT, clean against origin/main.
- Exact `AUTH-SCOPE-01` task absent from pre-existing backlog; owner-provided
  task text is the task contract. No attached preflight file found in repo.
- ADR-007 and current code inspected; no runtime implementation was changed.
- Documentation impact: YES; documentation sync covers ADR index, backlog,
  Identity/Sites capsules, security and API guidance.
- `git diff --check`, untracked Markdown whitespace check and final
  changed-file review: PASS; only task documentation/checkpoint files changed.
- Task documentation/reference consistency: PASS; no claim that the planned
  evaluator, capabilities route or Development fixture is implemented.
- Secret hygiene on task-owned changed files: PASS.
- No canonical repository Markdown lint or ADR link-check script was found.
- Build/runtime tests and migrations: NOT_APPLICABLE for documentation-only
  Phase A. Hosted CI is checked separately after publishing.

UNCOMMITTED: None expected after the Phase A documentation commit. The
preceding `LAST_SAFE_COMMIT` is the parent baseline; the task commit is the
commit containing this checkpoint and ADR-013.

DECISIONS:
- OD-01: scope-filtered Zone/Region lists.
- OD-02: Region create by effective `sites.create` and parent Zone scope;
  root Zone creation closed.
- OD-03: separate context/target-aware application authorization contract;
  Sites owns authoritative geographic target.
- OD-04: separate target-specific backend capabilities endpoint for UX only.
- OD-05: explicit, repeatable, limited Development OIDC/Identity bootstrap.
- OD-06: INTERNAL user/context evaluator first; contractor chain fail-closed.

BLOCKERS: None for Phase A. Phase B is not authorized in this request.
PENDING: B1/B2/C1/C2/C3/C4 implementation and verification, only after an
explicit next-phase request.
FILES_CHANGED: `.agent/tasks/AUTH-SCOPE-01/phase-a-contract.md`,
`.agent/tasks/AUTH-SCOPE-01/state.md`, `docs/adr/ADR-013-target-aware-production-authorization.md`,
`docs/adr/README.md`, `docs/backlog.md`, `docs/modules/identity.md`,
`docs/context/identity.context.md`, `docs/context/sites.context.md`,
`docs/security.md`, `docs/api-guidelines.md`.
NEXT_ACTION: PHASE B1 — Identity evaluator (NOT STARTED). On an explicit B1
request, run task-resume/repository-state-guard, reconcile this checkpoint
with Git, then implement only B1 from the frozen contract.
DO_NOT_REPEAT: Do not re-ask OD-01…OD-06; do not treat the Approved ADR as
implemented; do not open root Zone, Organization or contractor grants; do not
start B1 under the Phase A finalization request.

## Phase B1 resume checkpoint — 2026-09-26

TASK: AUTH-SCOPE-01
PHASE: B1 — INTERNAL EFFECTIVE-GRANT EVALUATOR
STATUS: IN_PROGRESS — PREFLIGHT COMPLETE; IMPLEMENTATION NOT STARTED
AUTH_BRANCH: codex/auth-scope-01-b1
BASELINE_SHA: 8bef135bf28be900325966257803d69c105ef11e
LAST_SAFE_COMMIT: 8bef135bf28be900325966257803d69c105ef11e

VERIFIED:
- `git fetch` completed. Manual repository guard equivalent passed:
  `main`, `HEAD` and `origin/main` all equal BASELINE_SHA; worktree was clean
  before creating the AUTH branch.
- Site checkpoint branch remains at
  `4d230e7c8192614954b7d106014bfaaf75669207`; it was not checked out or changed.
- Created `codex/auth-scope-01-b1` directly from the published clean `main`.
- Reconciled this checkpoint with Git; Phase A commit is in the existing
  history and there were no pre-existing B1 changes to recover.
- Read the frozen Phase A contract, ADR-007, ADR-013, Identity docs,
  permissions registry, and security guidance. Inspected the existing User,
  UserContext, AccessAssignment, AccessScope, Role, RolePermission,
  permission grant source, IdentityDbContext and EF mappings.
- Existing Identity schema represents user, owned context, context type/id,
  role/permission, active/revoked assignment, validity and five scope
  dimensions. No schema gap is currently evident; expected migration is none.
- No runtime, test, migration, frontend or Sites files were changed.
- Repository wrapper commands `repository-state-guard` and `task-resume` are
  unavailable in this shell; their checks were performed manually.

UNCOMMITTED: This checkpoint update only; expected changed path is this file.
DECISIONS: Preserve OD-01…OD-06; B1 is INTERNAL user + INTERNAL context only;
contractors remain fail-closed; Sites target hierarchy remains caller-supplied
trusted projection and is not resolved by Identity.
BLOCKERS: None found during preflight. Implementation and required validation
remain outstanding.
NEXT_ACTION: Resume on `codex/auth-scope-01-b1`; reconcile this checkpoint and
the single expected state.md change with Git, inspect the current Identity
Application/test conventions, then implement the B1 evaluator and focused
PostgreSQL/security/architecture verification only.
DO_NOT_REPEAT: Do not repeat Phase A owner decisions or use the Site branch.
Do not start B2, Sites projection/route integration, capabilities, Development
bootstrap, frontend or contractor authorization.

## Phase B1 implementation checkpoint — atomic step 1

TASK: AUTH-SCOPE-01
PHASE: B1 — INTERNAL EFFECTIVE-GRANT EVALUATOR
STATUS: IN_PROGRESS — SCOPE CONTRACT IMPLEMENTED
BASELINE_SHA: 8bef135bf28be900325966257803d69c105ef11e
LAST_SAFE_COMMIT: 8bef135bf28be900325966257803d69c105ef11e

COMPLETED:
- Reconciled the resume state against Git: AUTH branch, HEAD, `main` and
  `origin/main` match the frozen baseline; the only pre-implementation dirty
  path was this checkpoint. Site checkpoint remains at the recorded commit.
- Added the Identity Application effective-grant request/interface and
  trusted target descriptor for Territorial Zone and Region only.
- Added pure scope coverage with fail-closed validation for unsupported,
  malformed and incomplete targets and unsupported assignment dimensions.
- Added pure coverage checks for exact Zone/Region, Zone-to-Region coverage,
  sibling/ancestor mismatch, different Zone, and malformed descriptors.

VERIFIED:
- `dotnet run --project tests/unit/Exploitation.IdentityDomainChecks/Exploitation.IdentityDomainChecks.csproj --configuration Release` — PASS.
- Existing model confirms active rows and validity interval `[valid_from, valid_to)`.
- No schema or migration changes made.

B1_ATOMIC_STEP_1: DONE
EVALUATOR_CONTRACT: IMPLEMENTED
SCOPE_MODEL: IMPLEMENTED
PURE_SCOPE_TESTS: PASS

UNCOMMITTED:
- B1 implementation, unit checks, and this checkpoint update.

FILES_CHANGED:
- `.agent/tasks/AUTH-SCOPE-01/state.md`
- `src/backend/Modules/Identity/Exploitation.Modules.Identity.Application/Authorization/`
- `tests/unit/Exploitation.IdentityDomainChecks/Exploitation.IdentityDomainChecks.csproj`
- `tests/unit/Exploitation.IdentityDomainChecks/Program.cs`
- `tests/unit/Exploitation.IdentityDomainChecks/EffectiveGrantScopeChecks.cs`

DECISIONS: Identity evaluates only trusted Zone/Region descriptors; Sites
hierarchy facts remain caller-owned. Contractors remain fail-closed.
BLOCKERS: None.
NEXT_ACTION: Implement the single-query PostgreSQL evaluator using Identity
profile/context/assignment/role-permission rows and the injectable clock; add
the persisted positive/negative matrix, then checkpoint atomic step 2.
DO_NOT_REPEAT: Do not redo Phase A or the completed pure scope checks. Do not
start B2, Site projection, route integration, capabilities, bootstrap or
contractor-positive authorization. Do not modify the Site checkpoint branch.

## Phase B1 implementation checkpoint — atomic step 2

TASK: AUTH-SCOPE-01
PHASE: B1 — INTERNAL EFFECTIVE-GRANT EVALUATOR
STATUS: IN_PROGRESS — IDENTITY PERSISTENCE EVALUATOR IMPLEMENTED
BASELINE_SHA: 8bef135bf28be900325966257803d69c105ef11e
LAST_SAFE_COMMIT: 8bef135bf28be900325966257803d69c105ef11e

COMPLETED:
- Implemented `IEffectiveGrantEvaluator` in Identity Application and a
  single-query PostgreSQL implementation in Identity Infrastructure.
- Query requires ACTIVE INTERNAL local user, owned/available ACTIVE INTERNAL
  context, ACTIVE and currently valid INTERNAL assignment, ACTIVE role,
  persisted exact role-permission relation, exact canonical permission code,
  and supported target scope coverage.
- Wired the evaluator for internal consumers while retaining the existing
  production deny-all `IPermissionGrantSource` unchanged.
- Added PostgreSQL allow/deny coverage for Zone/Region scopes, exact
  `[valid_from, valid_to)` boundaries, missing profile/context/assignment,
  inactive profile/context/role/assignment, wrong permission, role-name-only,
  contractor user/context, cross-user context, and assignment user binding.

VERIFIED:
- Identity pure scope checks — PASS.
- `docker info` — Docker daemon available.
- `dotnet run --project tests/integration/Exploitation.IdentityPersistenceChecks/Exploitation.IdentityPersistenceChecks.csproj --configuration Release` — PASS against Testcontainers PostgreSQL.
- No schema/model change or migration created.

B1_ATOMIC_STEP_1: DONE
B1_ATOMIC_STEP_2: DONE
IDENTITY_QUERY: IMPLEMENTED
INTERNAL_POSITIVE_PATH: PASS
CONTEXT_VALIDATION: PASS
ASSIGNMENT_VALIDITY: PASS
PERMISSION_EVALUATION: PASS

UNCOMMITTED: Identity contract/evaluator, scope/persistence checks,
architecture check under verification, and this checkpoint.
FILES_CHANGED: See `git status --short`; all current changes are AUTH-SCOPE-01
B1 Identity/test/checkpoint paths.
DECISIONS: Query evaluates the persisted Identity grant chain only. The
production permission grant source stays deny-all for later B2/C integration.
BLOCKERS: None.
NEXT_ACTION: Run and inspect the architecture check that blocks Identity to
Sites persistence dependency; update atomic step 3 only after it passes.
DO_NOT_REPEAT: Do not repeat passing pure or PostgreSQL scope/matrix checks.
Do not start B2, Site projection, route integration, capabilities, bootstrap
or contractor-positive authorization. Do not modify the Site checkpoint branch.

## Phase B1 implementation checkpoint — atomic step 3

VERIFIED:
- `dotnet run --project tests/architecture/Exploitation.ArchitectureChecks/Exploitation.ArchitectureChecks.csproj --configuration Release` — PASS.
- Architecture guard scans Identity Infrastructure sources and project
  references for Sites persistence/context/schema dependencies — NONE.
- Identity evaluator has no Sites persistence dependency.
- Contractor user and non-INTERNAL context PostgreSQL cases deny.

B1_ATOMIC_STEP_3: DONE
POSTGRESQL_TESTS: PASS
SITES_DB_DEPENDENCY: NONE
CONTRACTOR: FAIL_CLOSED
ARCHITECTURE: PASS

NEXT_ACTION: Run focused authentication, working-context and permission/policy
regressions; complete independent security review and remediation if needed.
DO_NOT_REPEAT: Do not rerun the completed B1 PostgreSQL matrix or architecture
check unless a related implementation change is made. Do not start B2 or any
later phase listed in prior checkpoints.

## Phase B1 implementation checkpoint — atomic step 4

SECURITY_REVIEW: PASS — independent read-only second pass of the complete B1
diff. Confirmed no implicit allow, role-name/UserType/JWT/context-only grant,
missing active/local eligibility, missing validity/ownership, scope widening,
Region-to-parent grant, contractor path, Sites persistence dependency,
fail-open exception behavior, broad assignment materialization, or cache.
The review found that permission keys should be checked against the canonical
catalog before persistence lookup; the evaluator now enforces this and the
PostgreSQL matrix and authentication regression passed again.

B1_ATOMIC_STEP_4: DONE
SECURITY_REVIEW: PASS
OPEN_CRITICAL: 0
OPEN_HIGH: 0
OPEN_MEDIUM: 0

DOCUMENTATION_IMPACT: YES
DOCUMENTATION_SYNC: PASS — Identity module/context and security status now
describe the B1 evaluator while keeping routes/source deny-by-default and all
later-phase capabilities out of scope.

NEXT_ACTION: Finish full Release/build/test, formatting, secret hygiene and
diff/path review; finalize checkpoint; stage explicit AUTH-SCOPE-01 B1 files,
create one local commit, verify clean worktree and frozen branch refs, then stop.
DO_NOT_REPEAT: Do not repeat the closed canonical-code review finding or
already passing Identity PostgreSQL/authentication regressions unless related
implementation changes are made. Do not start B2 or any later phase.

## Phase B1 final checkpoint — ready for local commit

TASK: AUTH-SCOPE-01
PHASE: B1 — EFFECTIVE GRANT EVALUATOR
STATUS: DONE
PHASE_A: PUBLISHED
BASELINE_SHA: 8bef135bf28be900325966257803d69c105ef11e
AUTH_BRANCH: codex/auth-scope-01-b1
LAST_SAFE_COMMIT: 8bef135bf28be900325966257803d69c105ef11e

EFFECTIVE_GRANT_EVALUATOR: PASS
IDENTITY_OWNS_EVALUATION: YES
INTERNAL_USER: SUPPORTED
INTERNAL_CONTEXT: SUPPORTED
ASSIGNMENT_VALIDITY: PASS — inclusive valid_from, exclusive valid_to; active state required
PERMISSION_EVALUATION: PASS — exact persisted role-permission and canonical catalog code
SCOPE_MODEL: TerritorialZone, Region
SCOPE_EVALUATION: PASS
ZONE_TO_REGION_COVERAGE: PASS — trusted Region projection only
ROLE_NAME_GRANT: NONE
USERTYPE_GRANT: NONE — INTERNAL is eligibility only
JWT_CLAIM_GRANT: NONE
WORKING_CONTEXT_ALONE_GRANT: NONE
CONTRACTOR: FAIL_CLOSED
SITES_DB_DEPENDENCY: NONE
CROSS_MODULE_DEPENDENCY: NONE
PRODUCTION_GRANT_SOURCE_CHANGED: NO
CAPABILITIES: NOT_IMPLEMENTED
DEV_BOOTSTRAP: NOT_IMPLEMENTED
SITE_TARGET_SCOPE: NOT_IMPLEMENTED
GEOGRAPHY_ROUTE_INTEGRATION: NOT_IMPLEMENTED
SCHEMA_CHANGED: NO
MIGRATION_CREATED: NO
MODEL_DRIFT: NOT_APPLICABLE — EF model unchanged

POSTGRESQL_TESTS: PASS — Testcontainers PostgreSQL evaluator matrix and existing Identity persistence suite
SECURITY_TESTS: PASS — Identity deny/allow matrix and pure Zone/Region coverage
AUTHENTICATION_REGRESSION: PASS
WORKING_CONTEXT_REGRESSION: PASS
PERMISSION_POLICY_REGRESSION: PASS
SITES_API_REGRESSION: PASS — existing route behavior remains deny-by-default
ARCHITECTURE_CHECKS: PASS — Identity to Sites persistence dependency prohibited
RELEASE_BUILD: PASS — full solution, Release, zero warnings/errors
APPLICABLE_BACKEND_CHECKS: PASS — Identity/Sites domain; Identity/authentication; Sites API/persistence; Audit persistence/delivery; Organization API/persistence
DOTNET_TEST: PASS — solution command exits successfully; executable check suites are run separately in this repository
FORMAT: PASS for changed C# files; solution-wide formatter reports pre-existing unrelated whitespace/line-ending/charset diagnostics
DIFF_CHECK: PASS
SECRET_HYGIENE: PASS
DOCUMENTATION_IMPACT: YES
DOCUMENTATION_SYNC: PASS — Identity module/context and security status synchronized

SECURITY_FINDINGS: Internal second pass found and fixed a MEDIUM concern:
reject permission codes outside the canonical catalog before persistence
evaluation. Independent reviewer PASS; one LOW observation notes the source
scan in the architecture guard uses literal fragments (the exact direct
project-reference set is also asserted), and one NOTE records that B2/C callers
must construct trusted target descriptors from Sites-owned facts.
HIGHEST_SEVERITY: LOW
OPEN_CRITICAL: 0
OPEN_HIGH: 0
OPEN_MEDIUM: 0
OPEN_LOW: 1 — architecture-check source scanner robustness observation
SECURITY_REVIEW: PASS — no remaining implicit allow, shortcut grant, invalid
context/assignment, scope widening, contractor access, fail-open, broad
assignment load, cache issue, or Sites persistence dependency. Independent
review found no CRITICAL, HIGH or MEDIUM issue.

B1_ATOMIC_STEP_1: DONE
B1_ATOMIC_STEP_2: DONE
B1_ATOMIC_STEP_3: DONE
B1_ATOMIC_STEP_4: DONE

FILES_CHANGED:
- `.agent/tasks/AUTH-SCOPE-01/state.md`
- `docs/context/identity.context.md`
- `docs/modules/identity.md`
- `docs/security.md`
- `src/backend/Modules/Identity/Exploitation.Modules.Identity.Application/Authorization/AuthorizationScopeCoverage.cs`
- `src/backend/Modules/Identity/Exploitation.Modules.Identity.Application/Authorization/EffectiveGrantRequest.cs`
- `src/backend/Modules/Identity/Exploitation.Modules.Identity.Application/Authorization/EffectiveGrantTargetKind.cs`
- `src/backend/Modules/Identity/Exploitation.Modules.Identity.Application/Authorization/IEffectiveGrantEvaluator.cs`
- `src/backend/Modules/Identity/Exploitation.Modules.Identity.Application/Authorization/TrustedAuthorizationScope.cs`
- `src/backend/Modules/Identity/Exploitation.Modules.Identity.Infrastructure/Authorization/EffectiveGrantEvaluator.cs`
- `src/backend/Modules/Identity/Exploitation.Modules.Identity.Infrastructure/IdentityModuleRegistration.cs`
- `tests/architecture/Exploitation.ArchitectureChecks/Program.cs`
- `tests/integration/Exploitation.IdentityPersistenceChecks/Program.cs`
- `tests/unit/Exploitation.IdentityDomainChecks/Exploitation.IdentityDomainChecks.csproj`
- `tests/unit/Exploitation.IdentityDomainChecks/EffectiveGrantScopeChecks.cs`
- `tests/unit/Exploitation.IdentityDomainChecks/Program.cs`

AUTH_COMMIT: This local B1 commit; parent is BASELINE_SHA
LOCAL_B1_COMMIT: CREATED
UNCOMMITTED: None
WORKTREE: CLEAN
CHECKPOINT_UPDATED: YES
MAIN_MODIFIED: NO
SITE_CHECKPOINT_BRANCH: codex/task-02.03.03-site-b1 at 4d230e7c8192614954b7d106014bfaaf75669207 — unchanged
PUSH: NONE
USAGE_BEFORE: NOT_CAPTURED
USAGE_AFTER: 5-hour used 80% (20% remaining); weekly used 66%
TOKEN_COUNT: NOT_AVAILABLE
NEXT_ACTION: Stop for independent B1 security/integration review and main
integration. Do not start that work in this task.
DO_NOT_REPEAT: Do not reimplement or repeat passing gates without a related
code change. Do not begin B2, Site projection, route integration, capabilities,
Development bootstrap, contractor-positive authorization, merge or push.

## B1 independent integration checkpoint — 2026-09-27

TASK: AUTH-SCOPE-01
PHASE: B1 — INDEPENDENT REVIEW + MAIN INTEGRATION
STATUS: INTEGRATED — ready to push
BASELINE_SHA: 8bef135bf28be900325966257803d69c105ef11e
SOURCE_AUTH_COMMIT: fb3d5648caceecb1668f84bc0823e12d3de43f8b
AUTH_BRANCH_SHA: fb3d5648caceecb1668f84bc0823e12d3de43f8b
MAIN_FAST_FORWARD_SHA: fb3d5648caceecb1668f84bc0823e12d3de43f8b
COMMIT_PARENT_VERIFIED: YES — baseline SHA
AUTH_SCOPE_ONLY: YES
INDEPENDENT_INTEGRATION_REVIEW: PASS
OPEN_CRITICAL: 0
OPEN_HIGH: 0
OPEN_MEDIUM: 0
OPEN_LOW: 1 — test-tool source scanner checks literal fragments; exact project-reference assertions and current project files independently exclude Identity-to-Sites project dependency; no material bypass.
NOTE: Future callers must construct TrustedAuthorizationScope from authoritative facts owned by Sites. No caller was implemented in B1.
EFFECTIVE_GRANT_EVALUATOR: PASS
IDENTITY_OWNS_EVALUATION: YES
INTERNAL_USER_AND_CONTEXT: PASS
ASSIGNMENT_VALIDITY: PASS
PERMISSION_EVALUATION: PASS
SCOPE_EVALUATION: PASS — exact Zone/Region and trusted Zone-to-Region projection
CONTRACTOR: FAIL_CLOSED
SITES_DB_DEPENDENCY: NONE
PRODUCTION_GRANT_SOURCE_CHANGED: NO
SCHEMA_CHANGED: NO
MIGRATION_CREATED: NO
SITE_TARGET_SCOPE: NOT_IMPLEMENTED
GEOGRAPHY_ROUTE_INTEGRATION: NOT_IMPLEMENTED
CAPABILITIES: NOT_IMPLEMENTED
DEV_BOOTSTRAP: NOT_IMPLEMENTED
PRE_INTEGRATION_GATES: PASS for unit evaluator, authentication/context/policy, architecture, solution Release build (0 warnings/errors), solution dotnet test exit 0, diff check, secret hygiene. PostgreSQL/Testcontainers gate is recorded PASS in the prior B1 checkpoint for this exact unchanged commit; this turn's rerun was unavailable because Docker daemon was stopped and Windows refused service access.
POST_INTEGRATION_GATES: PASS for evaluator unit, authentication/context/policy, architecture, solution Release build (0 warnings/errors), solution dotnet test exit 0, diff check, secret hygiene.
POSTGRESQL_RERUN: NOT_YET_VERIFIED — Docker service unavailable; prior B1 PASS retained for unchanged source.
MAIN_FAST_FORWARD: PASS — no merge commit
SITE_CHECKPOINT_BRANCH: unchanged at 4d230e7c8192614954b7d106014bfaaf75669207
PUSH: PENDING
HOSTED_CI: NOT_YET_VERIFIED
UNCOMMITTED: this checkpoint update only, to be committed separately
NEXT_ACTION: commit this checkpoint update, push main without force, fetch and verify local main equals origin/main, then inspect hosted CI availability. Stop before B2.
DO_NOT_REPEAT: Do not amend source B1 commit; do not change Site checkpoint; do not start B2, Site scope, Geography routes, capabilities, DEV bootstrap, contractor-positive grants, or another business task.

## B1 publication completion checkpoint — 2026-09-27

TASK: AUTH-SCOPE-01
PHASE: B1 — INDEPENDENT REVIEW + MAIN INTEGRATION
STATUS: DONE — published
SOURCE_AUTH_COMMIT: fb3d5648caceecb1668f84bc0823e12d3de43f8b
MAIN_FAST_FORWARD_SHA: fb3d5648caceecb1668f84bc0823e12d3de43f8b
PUSH_VERIFIED_SHA_BEFORE_THIS_CHECKPOINT: e7814db81861cb731cd2a75a464c491b5fd0a874
PUSH_VERIFICATION: PASS — local main, origin/main, and git ls-remote matched e7814db81861cb731cd2a75a464c491b5fd0a874 after fetch.
HOSTED_CI: NOT_YET_VERIFIED — GitHub Actions API returned 404 without authenticated access; gh CLI is unavailable in this environment.
POSTGRESQL_RERUN: NOT_YET_VERIFIED — Docker daemon unavailable; the prior B1 checkpoint records PASS for the unchanged source commit.
SITE_CHECKPOINT_BRANCH: unchanged at 4d230e7c8192614954b7d106014bfaaf75669207
B2: NOT_STARTED
SITE_TARGET_SCOPE: NOT_STARTED
CAPABILITIES: NOT_STARTED
DEV_BOOTSTRAP: NOT_STARTED
NEXT_ACTION: none for B1. Stop here; B2 requires a separate task and planning.
DO_NOT_REPEAT: Do not start B2 or another business task in this continuation.
