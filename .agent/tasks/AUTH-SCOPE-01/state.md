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
