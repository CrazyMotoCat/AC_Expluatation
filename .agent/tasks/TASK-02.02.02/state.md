# TASK-02.02.02 — FUNCTIONAL-DIRECTION-01 checkpoint

STATUS: IMPLEMENTED_LOCALLY_PENDING_INDEPENDENT_COMMIT_REVIEW_AND_PUBLICATION
PHASE: FUNCTIONAL-DIRECTION-01 — RESUME AFTER READ AUTH DECISION
MODE: IMPLEMENT DIRECTLY ON MAIN; NO PUSH

Current authoritative resume result is the final section below.
Earlier sections retain historical findings and superseded blockers.

## Baseline and repository guard

- `git fetch` completed successfully.
- Branch: `main`.
- `HEAD == origin/main == d07f48699410a1da8b938655b4d63605dc44d19f`.
- The only pre-existing local task change is `.agent/tasks/TASK-03.01.01/state.md`; it is intentionally preserved and remains blocked.
- One primary worktree exists. No other dirty paths or state drift found.
- `LAST_SAFE_COMMIT`: `d07f48699410a1da8b938655b4d63605dc44d19f`.

## Exact backlog contract

`docs/backlog.md`, TASK-02.02.02 “Functional directions”:

- create a configurable reference;
- mandatory initial codes: `IT`, `EXPLOITATION`, `SECURITY`, `CYBERSECURITY`, `REAL_ESTATE`, `INFRASTRUCTURE_DEVELOPMENT`, `RETAIL`;
- values are not hardcoded in business logic;
- new values can be added.

The phase request establishes the delivery boundary as a production read and runtime management contract, plus a narrow Organization-owned application contract for other modules. The listed initial codes are required seeds, not examples. UI is not required by the backlog/phase request and remains out of scope unless separately authorized.

## Repository findings

- Owner is Organization. `docs/modules/organization.md` and `docs/context/organization.context.md` document Organization ownership of Company, OrganizationalUnit, and OrganizationalUnitType; no FunctionalDirection entity/table/API/application contract is implemented.
- `docs/database.md` §6.5 sketches `organization.functional_directions` as `id`, `code`, `name`, `description`, `is_active` and lists the seven codes. It does not define nullability, constraints, names, mutability, timestamps, concurrency, seeds, or lifecycle semantics.
- The only FunctionalDirection registry entry (`docs/reference-data-registry.md` §4) says Organization-owned `CONFIGURABLE_REFERENCE`, gives the same seven codes as initial examples, and says not to hardcode directions. The backlog upgrades those codes to mandatory seed values.
- The existing Organization-owned `OrganizationalUnitType` is the closest implemented configurable-reference contract: UUIDv7 ID; required, immutable, canonical uppercase code (trim + invariant uppercase, max 50, regex `^[A-Z0-9][A-Z0-9_-]{0,49}$`, globally unique); required mutable trimmed name (max 200, non-unique); ACTIVE/INACTIVE; creation ACTIVE; inactive remains queryable but cannot be selected for new units; hard delete forbidden. Its table stores `status`, `created_at`, `updated_at`, but no `description` or `row_version`. Seeds use stable UUIDv7 IDs and names equal to codes when no display labels are approved.
- `OrganizationReferenceStatus`, `ReferenceCode`, and `OrganizationalUnitType` implement this pattern. It is a strong same-owner precedent but is not yet explicitly declared the FunctionalDirection contract.
- The Organization layer is already bootstrapped with `OrganizationDbContext`, module-owned migrations, `Organization.Application`, and `Organization.Infrastructure`. The planned `organization.functional_directions` table is not in the current model or migration history. No Organization Contracts project exists today.
- FunctionalDirection is absent from all current Organization application/domain/source files. No other module may read/write its future Organization table directly.
- Existing `organization.read`, `organization.create`, and `organization.change` permissions are defined for OrganizationalUnit operations with deferred `company/organizational-unit` scopes. No FunctionalDirection/catalog-specific permission exists; reusing these codes for global reference access is not established.
- Identity stores `functional_direction_id` on access assignments and in `AccessScope`, but it is not production-evaluated: `EffectiveAuthorizationScopeKind` only supports TerritorialZone/Region/Site; `IEffectiveScopeProvider` returns only those kinds; the trusted target/evaluator is geographic; `EffectiveAuthorizationQueries.ValidGeographicScopeShape` requires `functional_direction_id` and `asset_type_id` to be null. Current Organization unit API authorization is documented as deny-by-default while Organization scopes remain deferred. A global catalog grant model is not present either.
- Existing Site global catalogs use explicit permission unions and require at least one effective supported geographic scope; that pattern cannot be copied as-is for Organization directions because `organization.*` scopes are not currently effective, and geography-only permission must not become global master-data authority.
- Runtime Organization mutations use a module-owned durable Audit obligation and the one canonical Audit writer under ADR-011. Existing OrganizationalUnit actions are explicitly cataloged; no FunctionalDirection entity/actions are registered. No separate business-history requirement for this reference was found.
- Relevant architecture: ADR-001 modular monolith, ADR-007 RBAC + scope/context/validity, ADR-008 business history vs technical Audit, ADR-010 module-owned migrations/central execution, ADR-011 durable Audit obligations. No FunctionalDirection-specific ADR exists.

## Deliverable classification

| Deliverable | Classification | Evidence / scope |
|---|---|---|
| Organization-owned persistence | IN_SCOPE | Configurable reference and existing schema sketch. |
| Seven deterministic seeds | IN_SCOPE | Exact codes mandated by backlog; use stable UUIDv7 seed IDs per current Organization seed convention. |
| Read API | IN_SCOPE | Required by this phase’s production read contract; exact authorization requires owner resolution. |
| Runtime management API | IN_SCOPE | “New values can be added” plus explicit phase goal. Minimum candidate operations: create, rename/display-name update, activate, deactivate. |
| Lifecycle | IN_SCOPE | Required to publish whether a direction is selectable for new references; Organization reference precedent exists, but must be accepted for FunctionalDirection. |
| Authorization | IN_SCOPE | Required for production read/management; current permission/scope contract is insufficient. |
| Audit | IN_SCOPE for successful mutations | Reuse Organization durable obligation + ADR-011 canonical Audit delivery. |
| Cross-module application contract | IN_SCOPE | Explicit phase goal; stable DTO/application contract only, no EF entity or DbContext. |
| Frontend | OUT_OF_SCOPE | No UI acceptance criterion or UI requirement in this task. |

## Candidate field classification

| Field | Classification | Evidence / open point |
|---|---|---|
| `id` | REQUIRED | Core entity convention requires UUIDv7; seeds require stable UUIDv7 IDs. |
| `code` | REQUIRED | Existing Organization configurable-reference pattern supplies canonical format, global uniqueness and immutability; apply only after owner accepts the pattern for FunctionalDirection. |
| `name` | REQUIRED | Existing Organization reference pattern supplies required, trimmed, max 200, mutable, non-unique name. Seed display text is unresolved below. |
| `description` | OWNER_DECISION_REQUIRED | Present in FunctionalDirection DB sketch; absent in implemented OrganizationalUnitType. Do not add without decision. |
| lifecycle `status` / `is_active` | OWNER_DECISION_REQUIRED to reconcile schema name; semantics have a strong Organization reference precedent | FD DB sketch uses `is_active`; current Organization reference implementation uses `status` with ACTIVE/INACTIVE. |
| `row_version` | OWNER_DECISION_REQUIRED | Not in FD DB sketch or current OrganizationalUnitType table; mutable Organization business entities use optimistic row versions, but reference-specific management has no implemented concurrency precedent. |
| `created_at`, `updated_at` | OWNER_DECISION_REQUIRED to reconcile field set | Current OrganizationalUnitType stores both; FD DB sketch does not list them. |

## Cross-module application contract proposal (not implemented)

- Publish a narrow Organization-owned application contract; consumers must not reference Organization.Infrastructure or its DbContext. A dedicated `Organization.Contracts` boundary is the clearest existing-architecture fit because Assets.Application currently depends on its own Contracts/Domain, not Organization.Application. Confirm project-reference architecture checks during implementation.
- Conceptual contract: `IFunctionalDirectionReferenceProvider.GetReferenceAsync(id, cancellationToken)` returning `FunctionalDirectionReference?` with stable `Id`, `Code`, `Name`, lifecycle fact, and an owner-derived `SelectableForNewReferences` fact. Missing ID returns null; inactive direction remains resolvable with `SelectableForNewReferences=false`.
- Do not make a boolean-only existence check; do not return an EF entity, DbContext, IQueryable, or caller-controlled authorization proof. This lookup is not an authorization operation.
- Implement the provider in Organization’s application composition over an Organization-owned read port/store; validate all consumer-supplied IDs by reading Organization-owned current state. Provider failure is fail-closed for an attempted new reference.
- This contract is the prerequisite for TASK-03.01.01’s FunctionalDirection validation. It does not itself satisfy identity/authorization for Organization management or grant Assets broader access.

## Seeds and display labels

Required exact codes: `IT`, `EXPLOITATION`, `SECURITY`, `CYBERSECURITY`, `REAL_ESTATE`, `INFRASTRUCTURE_DEVELOPMENT`, `RETAIL`.

No Russian or other display labels are defined in the backlog, registry, or current code. Existing OrganizationalUnitType seed precedent sets `name == code` when no display labels are approved; that is a recommendation, not an accepted FunctionalDirection label decision. Use stable UUIDv7 seed IDs following existing Organization seed convention; exact immutable IDs can be assigned in implementation and need not be an owner business decision.

## Current authorization and scope result

- READ permission candidates in the registry: `organization.read`; management candidates: `organization.create` for create and `organization.change` for rename/lifecycle. Their published semantics are OrganizationalUnit-specific and scoped to deferred Company/unit dimensions.
- No dedicated direction-management permission, global master-data assignment, Organization trusted scope API, or evaluated FunctionalDirection assignment scope exists today.
- Do not allow a geographic-only grant to become global direction administration. Do not accept role name, JWT claims, caller permission, caller scope, or target IDs as authorization evidence.
- A production authorization design requires an owner decision on permission codes and global/direction scope semantics, then a compatible trusted Identity application contract/evaluator (or explicit proof that a safe existing integration supports it). Do not silently expand Identity within this analysis phase.

## Owner decisions still required

### OD-FUNCTIONAL-DIRECTION-01 — seed display names

QUESTION: What user-visible `name` should each mandatory seed code receive?
REPOSITORY_EVIDENCE: The backlog/registry specify codes only. The existing Organization reference seed convention uses `name == code` when no labels are approved.
OPTIONS: (A) use each canonical code as its name; (B) provide seven owner-approved display names; (C) another explicit mapping.
RECOMMENDED_DEFAULT: (A), matching the current Organization seed precedent and avoiding invented translations.
IMPACT_ON_TASK_03_01_01: Assets consumes stable ID/code/name facts; display name is presentation, not the selectability rule.
SCHEMA_IMPACT: None.
API_IMPACT: Seed response names only.

### OD-FUNCTIONAL-DIRECTION-02 — exact fields and concurrency shape

QUESTION: Reconcile the FD schema sketch (`description`, `is_active`, no timestamps/version) with the implemented Organization reference pattern (`status`, timestamps, no description/version): which fields belong in the production table/API, and should mutable operations use `row_version`/`expectedRowVersion`?
REPOSITORY_EVIDENCE: Both variants are present in current repository sources; no accepted FD-specific decision selects one.
OPTIONS: (A) adopt the current OrganizationalUnitType shape `id, code, name, status, created_at, updated_at`, no description, add row_version for safe mutation; (B) retain FD sketch `id, code, name, description, is_active`, omit timestamps/version; (C) owner-defined hybrid.
RECOMMENDED_DEFAULT: (A), except row_version should be included only if the owner accepts it as the concurrency contract; it prevents silent lost updates for mutable management.
IMPACT_ON_TASK_03_01_01: Stable reference DTO can expose status/selectability without exposing storage naming.
SCHEMA_IMPACT: Directly selects columns, checks, indexes and concurrency token.
API_IMPACT: Selects response fields and mutation precondition shape.

### OD-FUNCTIONAL-DIRECTION-03 — lifecycle/selectability acceptance

QUESTION: Explicitly adopt for FunctionalDirection the existing Organization reference semantics: create ACTIVE; inactive remains resolvable/readable but is not selectable for new references; no hard delete; explicit activate/deactivate?
REPOSITORY_EVIDENCE: OrganizationalUnitType already implements these semantics in the same owner module; FunctionalDirection itself has no lifecycle contract, and the FD DB sketch only says `is_active`.
OPTIONS: (A) adopt the OrganizationReferenceStatus ACTIVE/INACTIVE pattern as-is; (B) owner-defined lifecycle/selectability variant.
RECOMMENDED_DEFAULT: (A), which gives Assets a stable `SelectableForNewReferences` contract and preserves historical resolution.
IMPACT_ON_TASK_03_01_01: Direct prerequisite; Assets must reject an inactive direction for new AssetType while still resolving existing references.
SCHEMA_IMPACT: Status representation and lifecycle checks.
API_IMPACT: Create starts ACTIVE; inactive included in read; activate/deactivate operations.

### OD-FUNCTIONAL-DIRECTION-04 — read/manage permission and scope model

QUESTION: Which canonical permissions govern global reference read and management, and are FunctionalDirection management grants global-only or direction-scoped? Does the task include the needed Identity authorization contract/evaluator work?
REPOSITORY_EVIDENCE: `organization.read/create/change` currently cover OrganizationalUnits with deferred company/unit scopes; Identity supports neither global master-data grants nor effective FunctionalDirection scopes. Its current scope provider exposes only geographic kinds, and its current target grant evaluator rejects `functional_direction_id` assignments.
OPTIONS: (A) reuse existing organization permissions with explicitly approved global/direction semantics and include the minimal Identity trust-contract/evaluator extension; (B) add dedicated FunctionalDirection read/manage permission codes and corresponding Identity authorization support; (C) owner-defined model. A permission-code choice without the trusted Identity capability is insufficient.
RECOMMENDED_DEFAULT: (B), with global read and global-only internal management for the first slice, unless direction-scoped management is an actual operational requirement. If direction scope is selected, make the Identity prerequisite explicit and test no geographic escalation.
IMPACT_ON_TASK_03_01_01: Production read/management cannot safely ship until authorization can prove eligible internal user/context/assignment and global or exact direction coverage.
SCHEMA_IMPACT: Identity schema change may not be needed, but trusted scope/evaluator support is; verify before implementation.
API_IMPACT: Defines endpoint permission union, global catalog read, management policy, 401/403 behavior and OpenAPI.

## Proposed implementation phases after owner decisions

1. FunctionalDirection B1: Organization domain/reference persistence, stable seven UUIDv7 seeds, additive module-owned migration, lifecycle and application reference provider/contract.
2. FunctionalDirection API/auth: global read catalog, runtime management, authorization using the accepted Identity contract, durable Organization audit obligations and canonical Audit action registration. Combine with B1 only if a focused reviewable vertical slice and all prerequisites are available.
3. No frontend in TASK-02.02.02.
4. After persistence, application reference contract and selectability semantics are published, resume TASK-03.01.01 and verify its separate Identity asset-type/direction scope requirements before Assets authorization implementation.

## Checkpoint outcome

- `OWNER_DECISIONS_REQUIRED`: 4 genuine decisions (seed names; exact schema/concurrency fields; explicit lifecycle adoption; global/direction permission and Identity authorization capability).
- Backlog codes, Organization ownership, backend read/management scope, no UI, existing code/name convention and seed ID convention are established; they are not open decisions.
- Product docs unchanged; recommendations have not been promoted to accepted product rules.
- `APPLICATION_CODE_CHANGED`: NO.
- `SCHEMA_CHANGED`: NO.
- `MIGRATION_CREATED`: NO.
- `FUNCTIONAL_DIRECTION_ENTITY_CREATED`: NO.
- `ASSET_TYPE_CODE_CHANGED`: NO.
- No tests/builds run; analysis/checkpoint only.
- `DOCS_IMPACT: NO` for this checkpoint-only phase; product documentation sync is pending accepted decisions and implementation.
- No branch/worktree, commit or push created.

FILES_CHANGED: `.agent/tasks/TASK-02.02.02/state.md` only. The prior `.agent/tasks/TASK-03.01.01/state.md` remains preserved and blocked.
LAST_SAFE_COMMIT: `d07f48699410a1da8b938655b4d63605dc44d19f`.
NEXT_ACTION: Resolve OD-FUNCTIONAL-DIRECTION-01..04; record accepted decisions, then implement/publish only TASK-02.02.02. Return to TASK-03.01.01 only after FunctionalDirection persistence, reference contract and selectability semantics are published.
DO_NOT_REPEAT: Do not repeat the completed TASK/backlog/Organization reference/permissions/Identity scope scan unless sources change. Do not treat recommendations as accepted. Do not modify `.agent/tasks/TASK-03.01.01/state.md` as complete. Do not create product code, migration, API, branch/worktree, commit or push during FUNCTIONAL-DIRECTION-00.

## FUNCTIONAL-DIRECTION-01 resume — owner decisions accepted; global grant gate blocked

REPOSITORY_STATE_GUARD: SAFE_WITH_CHECKPOINT
RESUME_SAFE: YES
STATE_DRIFT: NONE

- `git fetch` completed successfully.
- Branch: `main`.
- `HEAD == origin/main == d07f48699410a1da8b938655b4d63605dc44d19f`.
- The two pre-existing local task checkpoints remain the only dirty paths: `.agent/tasks/TASK-02.02.02/state.md` and `.agent/tasks/TASK-03.01.01/state.md`.
- `LAST_SAFE_COMMIT`: `d07f48699410a1da8b938655b4d63605dc44d19f`.

### Accepted owner decisions

All four explicit owner decisions in the FUNCTIONAL-DIRECTION-01 task request are accepted and supersede the provisional options above:

- OD-FUNCTIONAL-DIRECTION-01 ACCEPTED: seed exactly `IT`, `EXPLOITATION`, `SECURITY`, `CYBERSECURITY`, `REAL_ESTATE`, `INFRASTRUCTURE_DEVELOPMENT`, `RETAIL`; each seed name equals code; each starts ACTIVE; fixed stable IDs per repository seed convention; no extra direction.
- OD-FUNCTIONAL-DIRECTION-02 ACCEPTED: fields are `id`, `code`, `name`, `status`, `created_at`, `updated_at`, `row_version`; runtime IDs UUIDv7; no `description` or `is_active`; code required, trimmed, uppercase, max 50, regex `^[A-Z0-9][A-Z0-9_-]{0,49}$`, globally unique and immutable; name required, trimmed, max 200, mutable and non-unique; timestamps server-managed UTC; row_version follows project optimistic concurrency convention.
- OD-FUNCTIONAL-DIRECTION-03 ACCEPTED: create ACTIVE; ACTIVE/INACTIVE; inactive remains readable/resolvable but cannot be selected for new references; no hard delete; explicit activate/deactivate; no cascade.
- OD-FUNCTIONAL-DIRECTION-04 ACCEPTED: add `organization.manage_functional_directions`; read permission union is `organization.read` OR `organization.manage_functional_directions`; management requires only `organization.manage_functional_directions`; global master-data scope; no geographic widening and no direction-scoped self-management; caller cannot provide permission/scope/global/direction authority. Management requires a trusted current GLOBAL assignment.

### STEP 3 — Identity global-grant capability result

STATUS: `FUNCTIONAL_DIRECTION_GLOBAL_AUTH_CONTRACT_GAP`

CURRENT_ASSIGNMENT_MODEL: `AccessAssignment` requires `AccessScope.ValidateConstraint()` to find at least one non-empty dimension. `AccessScope` contains only `territorialZoneId`, `regionId`, `siteId`, `functionalDirectionId`, and `assetTypeId`; there is no explicit global scope kind or global marker. Identity's database check `ck_access_assignments_scope_present` likewise requires one of those five columns to be non-null.

CURRENT_TRUSTED_PROVIDER: `IEffectiveScopeProvider` accepts user/context/permission and returns `EffectiveAuthorizationScope`; its enum has only TerritorialZone, Region, Site. `IEffectiveGrantEvaluator` evaluates a `TrustedAuthorizationScope`; `EffectiveGrantTargetKind` likewise has only TerritorialZone, Region, Site. The persisted FunctionalDirection/AssetType dimensions are not emitted as effective scopes and current query/coverage excludes them.

WHY_GLOBAL_CANNOT_BE_PROVEN: There is no persisted explicit GLOBAL assignment representation, no trusted global scope result/target, and no accepted semantics saying an empty/unsupported scope means global (in fact, empty scope is rejected). A geographic assignment cannot be widened into global authority. Merely seeding the new permission or checking role-permission membership would not prove the required current, valid, owned INTERNAL-context global grant.

MINIMAL_IDENTITY_EXTENSION: Identity must own an explicit, non-caller-forgeable global assignment representation for the exact permission, plus an application-level trusted evaluator/provider that verifies active INTERNAL user, owned valid INTERNAL context, current active assignment, role-permission link, validity/revocation and explicit GLOBAL scope with no geographic/direction/type narrowing. The contract must return a trusted allow/deny result or opaque evidence; Organization must not query IdentityDbContext directly. Identity security/authorization tests must prove the global assignment and reject geo/direction/type scopes and caller-supplied global claims.

SCHEMA_CHANGE_REQUIRED: YES — the current access_assignment table/check/domain model cannot represent a true unscoped GLOBAL assignment. The exact Identity extension schema is not designed or implemented in this phase.

STOP_POINT: Stop before Organization schema, application, read/management API, permission-seed migration or code that could expose under-authorized management. The task request explicitly requires STOP when trusted GLOBAL assignment cannot be represented/evaluated.

### Phase checkpoint

- `OWNER_DECISIONS`: RESOLVED (OD-FUNCTIONAL-DIRECTION-01..04 accepted).
- `STATUS`: BLOCKED at `FUNCTIONAL_DIRECTION_GLOBAL_AUTH_CONTRACT_GAP`.
- `APPLICATION_CODE_CHANGED`: NO.
- `SCHEMA_CHANGED`: NO.
- `MIGRATION_CREATED`: NO.
- `FUNCTIONAL_DIRECTION_ENTITY_CREATED`: NO.
- `ASSET_TYPE_CODE_CHANGED`: NO.
- `TASK-03.01.01`: remains blocked; its checkpoint was not changed.
- Product docs unchanged; no tests/builds were run because the mandatory pre-schema authorization gate failed.
- No branch/worktree, commit or push created.

FILES_CHANGED: `.agent/tasks/TASK-02.02.02/state.md` only in this phase; `.agent/tasks/TASK-03.01.01/state.md` is preserved unchanged.
NEXT_ACTION: Define and publish the minimal Identity-owned GLOBAL assignment persistence and trusted evaluation contract for `organization.manage_functional_directions`; then resume TASK-02.02.02, rerun the repository guard, and re-verify the authorization gate before Organization schema/application work.
DO_NOT_REPEAT: Do not repeat the completed FunctionalDirection backlog, Organization reference, permission, or Identity source scan unless sources change. Do not interpret missing/unsupported scope as global. Do not weaken the accepted global-only authorization rule. Do not implement Organization entity/migration/API/permission seed before the Identity global grant gate passes. Do not modify TASK-03.01.01 as complete; do not create branch/worktree, commit or push.

## 2026-10-07 — published AUTH-GLOBAL resume; mandatory read gate

REPOSITORY_STATE_GUARD: SAFE_WITH_CHECKPOINT
RESUME_SAFE: YES
STATE_DRIFT: HISTORICAL_BASELINE_RECONCILED_WITH_EXPLICIT_CURRENT_REQUEST
BASELINE_SHA: 800ba9153868e9f33fd9af9c23c9c3ecc424ed3f
LAST_SAFE_COMMIT: 800ba9153868e9f33fd9af9c23c9c3ecc424ed3f
CURRENT_BRANCH: main
HEAD_EQUALS_ORIGIN_MAIN: YES

`git fetch` succeeded. HEAD and origin/main equal the exact requested published
baseline. One primary worktree exists. `git ls-files --others --exclude-standard`
lists exactly this checkpoint and `.agent/tasks/TASK-03.01.01/state.md`.
The earlier d07f486 baseline is historical and is superseded by the explicit
current task request; no unknown code changes were found or discarded.

OWNER_DECISIONS: OD-FUNCTIONAL-DIRECTION-01..04 ACCEPTED, unchanged from the
accepted decision section above; current request further requires explicit
GLOBAL management through published IGlobalGrantProvider and the STEP 21 read gate.

AUTH_GLOBAL_PREREQUISITE: PUBLISHED at the requested baseline.
PREVIOUS_BLOCKER: FUNCTIONAL_DIRECTION_GLOBAL_AUTH_CONTRACT_GAP RESOLVED.
Verified ADR-018, IdentityModuleRegistration, GlobalGrantProvider,
GlobalGrantRequest and EffectiveAuthorizationQueries. Explicit `is_global`
excludes all concrete IDs; exact permission, INTERNAL eligibility, owned/current
context and validity are evaluated by the published provider. Provider failure
denies. No second global evaluator is needed or authorized.

STATUS: FUNCTIONAL_DIRECTION_READ_AUTH_CONTRACT_GAP

### CURRENT_ORGANIZATION_READ_CONTRACT

- `docs/permissions-registry.md` section 5.1 and the Organization module/context
  documents define organization.read for OrganizationalUnit with deferred
  Company/OrganizationalUnit scope; production evaluation remains deny-by-default.
- `OrganizationalUnitEndpoints` applies RequirePermission("organization.read").
  `PermissionAuthorizationHandler` resolves an ACTIVE canonical local profile,
  then calls IPermissionGrantSource. Production IdentityModuleRegistration binds
  this port to NoAccessAssignmentPermissionGrantSource, whose result is always false.
- OrganizationApiChecks' positive read cases replace this production port with
  TestPermissionGrantSource. They establish transport behavior under a test grant,
  not a published effective production organization.read assignment contract.
- IEffectiveScopeProvider returns TerritorialZone/Region/Site only. Its query
  excludes GLOBAL, direction/type scopes and unsupported geographic shapes.
  Those facts do not define Company/unit scope coverage or Organization global
  reference read eligibility. Checking any returned scope would invent semantics.
- ADR-018 explicitly preserves general permission-source behavior and geographic
  coverage; it defines future fixed organization.manage_functional_directions
  GLOBAL composition, without establishing the organization.read branch.

### MISSING_TRUSTED_FACT

A published decision for whether the current canonical user and owned INTERNAL
context have an eligible organization.read assignment for a global Organization
reference catalog, including exactly which persisted scope shapes qualify.
The generic GLOBAL provider can prove an explicit GLOBAL for an exact permission;
its existence does not approve replacing branch A with GLOBAL-only organization.read,
or treating arbitrary geographic/direction/type assignments as catalog eligibility.
Implementing only the GLOBAL management read branch would omit required branch A.

### MINIMAL_SAFE_EXTENSION

Obtain an explicit owner decision for organization.read catalog eligibility,
including supported scopes. If the decision is explicit GLOBAL-only for this
catalog, trusted server composition can reuse IGlobalGrantProvider with fixed
organization.read and canonical user/context, without a new evaluator. If concrete
Organization scopes are required, publish the minimal Identity/Organization
application trust contract and owner scope evaluation first. In either case prove
eligible read success plus wrong permission/context, future/expired assignment,
unsupported scope, external/inactive user and provider failure denial; preserve
existing OrganizationalUnit and geographic authorization behavior.

STOP_POINT: Mandatory STEP 21 of the current task request explicitly requires
STOP when no trusted published read evaluator exists. Stop before product code,
schema, migration, API or permission seed changes. Management GLOBAL prerequisite
is resolved; the new blocker concerns the required organization.read branch only.

### Current phase verification and preservation

APPLICATION_CODE_CHANGED: NO
SCHEMA_CHANGED: NO
MIGRATION_CREATED: NO
PERMISSION_SEEDED: NO
FUNCTIONAL_DIRECTION_REFERENCE_PROVIDER: NOT_IMPLEMENTED
FRONTEND_PRODUCTION_CODE_CHANGED: NO
ASSET_TYPE_CODE_CHANGED: NO
TASK_03_01_01_CHECKPOINT_CHANGED: NO
TASK_03_01_01_PREREQUISITE: NOT_IMPLEMENTED_PENDING_READ_CONTRACT_AND_PUBLICATION
DOWNSTREAM_CHECKPOINT_SHA256: 9AB72D3C68678954ECB5B57F20565E8482E2C02B1ADA70D21685A2EB7A96F218
BUILD_TESTS: NOT_RUN; mandatory pre-implementation read gate failed.
INDEPENDENT_IMPLEMENTATION_REVIEW: NOT_RUN; no implementation/commit exists.
DOCS_IMPACT: NO; checkpoint-only blocked phase, product contracts not changed.
DOCUMENTATION_SYNC: NOT_APPLICABLE; implementation documentation gate remains pending.
CHECKPOINT_UPDATED: YES
COMMIT: NONE
PUSH: NONE
LOCAL_MAIN_AHEAD_BY: 0
WORKTREE: ONLY_TWO_EXPECTED_UNTRACKED_CHECKPOINTS
FILES_CHANGED_THIS_PHASE: `.agent/tasks/TASK-02.02.02/state.md` only.

NEXT_ACTION: Owner freezes the eligible organization.read assignment/scope rule
for this global reference catalog and publishes any necessary trusted composition;
then resume TASK-02.02.02 with repository guard and recheck STEP 21 before implementation.
DO_NOT_REPEAT: Do not reopen OD-FUNCTIONAL-DIRECTION-01..04 or the resolved
AUTH-GLOBAL foundation. Do not infer read eligibility from any permission assignment,
geography, role, JWT, UserType, context or scope absence. Do not silently substitute
GLOBAL-only organization.read for the requested existing read semantics. Preserve
TASK-03.01.01 checkpoint byte-for-byte. No downstream implementation, branch/worktree,
commit or push while this explicit read-contract STOP gate remains unresolved.

## 2026-10-07 — OD-FUNCTIONAL-DIRECTION-05 accepted; implementation resume

REPOSITORY_STATE_GUARD: SAFE_WITH_CHECKPOINT
RESUME_SAFE: YES
STATE_DRIFT: NONE
BASELINE_SHA: 800ba9153868e9f33fd9af9c23c9c3ecc424ed3f
LAST_SAFE_COMMIT: 800ba9153868e9f33fd9af9c23c9c3ecc424ed3f
OWNER_DECISIONS: OD-FUNCTIONAL-DIRECTION-01..05 ACCEPTED
PREVIOUS_BLOCKER: FUNCTIONAL_DIRECTION_READ_AUTH_CONTRACT_GAP RESOLVED
DECISION: OD-05 requires explicit current GLOBAL organization.read OR GLOBAL
organization.manage_functional_directions for catalog read, via IGlobalGrantProvider.
Concrete and composite assignments deny. Management requires GLOBAL manage only.
Existing OrganizationalUnit production authorization remains deferred.
COMPLETED: Git fetch/branch/SHA/status/worktree verification; read decision accepted.
VERIFIED: main == origin/main == baseline; exactly two expected untracked checkpoints;
downstream checkpoint SHA256 unchanged from preceding section.
UNCOMMITTED: this checkpoint; downstream checkpoint preserved and excluded.
PENDING: implementation, migration, tests, documentation sync, local commit, review.
OPEN_DECISION: PermissionConfiguration seeds through EF HasData; adding a permission
requires data-only Identity migration for canonical seed/model parity. Prior request
forbids Identity migration. Owner clarification requested before permission persistence
changes; independent Organization implementation may proceed.
NEXT_ACTION: Implement frozen FunctionalDirection domain/application/persistence while
awaiting owner clarification of permission-seeding migration constraint.
DO_NOT_REPEAT: Do not reopen OD-01..05; do not widen concrete scopes; no downstream
checkpoint modification, branch/worktree or push; only one final atomic local commit.

## FUNCTIONAL-DIRECTION-01 implementation checkpoint — permission seed decision pending

STATUS: IMPLEMENTED_LOCALLY_PENDING_INDEPENDENT_COMMIT_REVIEW_AND_PUBLICATION
CHECKPOINT_STATUS: UNSAFE (required full validation incomplete; no partial syntax files)
CURRENT_BRANCH: main
LAST_SAFE_COMMIT: 800ba9153868e9f33fd9af9c23c9c3ecc424ed3f
HEAD_EQUALS_ORIGIN_MAIN: YES
LOCAL_MAIN_AHEAD_BY: 0
OWNER_DECISIONS: OD-FUNCTIONAL-DIRECTION-01..05 ACCEPTED
AUTH_GLOBAL_PREREQUISITE: PUBLISHED
READ_AUTH_CONTRACT_GAP: RESOLVED_BY_OD_05

### Completed candidate

- FunctionalDirection Domain: UUIDv7, existing ReferenceCode normalization,
  mutable trimmed name, ACTIVE/INACTIVE, immutable code/creation timestamp,
  advancing UTC updated_at and positive long row_version; no delete.
- Organization Application read/command ports, FunctionalDirectionService and
  immutable IFunctionalDirectionReferenceProvider; inactive resolvable/non-selectable,
  missing null; no EF/DbContext/IQueryable or authorization facts crossing boundary.
- Organization persistence, seven exact deterministic seeds, unique code,
  optimistic concurrency and transactional durable Audit obligation.
- One migration: 20261007091435_AddFunctionalDirections; extends existing audit
  binding to exact-one nullable Unit/FD FKs, preserves old checks/data/history.
  Trigger protects id/code/created_at and runtime hard delete. Down refuses FD
  audit history; separately tested pristine/seeds-only rollback succeeds.
- Six HTTP routes + OpenAPI, strict DTO unmapped-member rejection. Exact fixed
  GLOBAL read OR GLOBAL manage for catalog; only GLOBAL manage for detail/mutations;
  canonical active INTERNAL profile/context and published fail-closed provider.
- Canonical Audit entity/actions/payload validator extended; tested delivery of
  all four FD actions, immutable payload/metadata and idempotent redelivery.
- Added tests in existing Organization/AuditDelivery/architecture harnesses.
  Docs updated as partial candidate, not completed/publication/unblocked status.

### Verified checks

- Release solution build PASS (0 errors/0 warnings), including interrupted helpers' files.
- OrganizationPersistenceChecks PASS, independently rerun by primary: domain,
  exact seeds, constraints, duplicate race, stale write, audit atomicity, provider,
  old Unit hierarchy regressions, empty/upgrade/idempotency/model snapshot,
  preserved Unit history/audit, pristine rollback and guarded history rollback.
- AuditDeliveryChecks PASS after adding actual FD materialization, before/after,
  canonical metadata, invalid payload/action rejection and stable EventId idempotency.
- ArchitectureChecks PASS, including narrow FD reference contract assertion.
- IdentityPersistenceChecks/AUTH-GLOBAL real PostgreSQL regressions PASS.
- AuthenticationChecks, AuditPersistenceChecks, SitesPersistenceChecks and
  SitesApiChecks (including Location/reference auth) PASS.
- SitesDomainChecks PASS.
- DevScripts, CiWorkflow, DatabaseMigrator, ApiBootstrapSmoke.Contract PASS.
- Frontend lint/build PASS; 8 files/71 tests PASS; frontend production unchanged.
- dotnet test Release --no-build exit 0 (no discovered test output; executable
  harnesses remain the meaningful proof).
- Organization EF has-pending-model-changes: NONE.
- Scoped changed-file whitespace formatting and git diff --check PASS.
- .env remains untracked/ignored; no task secret/configuration changes made.
- Downstream TASK-03.01.01 SHA256 remains
  9AB72D3C68678954ECB5B57F20565E8482E2C02B1ADA70D21685A2EB7A96F218.

### Required gate still failing (not weakened)

IdentityDomainChecks FAIL: canonical catalog expected 78 entries, but registry
still has 77. OrganizationApiChecks' existing Unit checks complete, then FD
fixture fails at SystemPermissionCatalog.All.Single for the new management code.
New FD HTTP matrix is implemented/compiles but full runtime validation has NOT
passed; do not report read/auth/management/API PASS. Permission is intentionally
not fabricated or manually inserted by tests to hide the missing production seed.

BLOCKER: Prior explicit phase instructions prohibit any Identity migration, but
PermissionConfiguration uses HasData(SystemPermissionCatalog.All). Adding the
canonical permission requires a data-only Identity migration for PostgreSQL
seed and model/snapshot parity. There is no published runtime seed synchronizer.
The current resume prohibits Identity schema changes and resumes the original
plan; silently introducing a new seed mechanism or assuming the previous
migration prohibition is waived would exceed the explicit boundary.

OWNER_QUESTION_PENDING: allow one data-only Identity permission migration
(recommended, no schema/role/assignment/grant changes), or retain migration
prohibition and explicitly authorize an Identity-owned seed synchronizer.
The user's later "Продолжи там где остановился" authorizes continuation but
does not select one of these boundary-changing choices. Independent work was
continued and completed through the above gates while the decision is pending.

### Review/docs and preserved scope

PRE_COMMIT_REVIEW: independent read-only reviewer found a P2 rollback test
contradiction and missing canonical FD Audit delivery coverage; both addressed
and relevant tests PASS. No actionable production security defect found in its
static review. Exact final-commit review remains pending (no commit exists).
HELPERS: fd_docs/fd_tests later exhausted available usage; primary completed
Audit delivery/architecture verification and reconciled partial docs/checkpoint.
DOCS_IMPACT: YES
DOCUMENTATION_SYNC: PARTIAL_PENDING_PERMISSION_SEED_AND_FULL_VALIDATION
FRONTEND_PRODUCTION_CODE_CHANGED: NO
ASSET_TYPE_CODE_CHANGED: NO
ASSETS_DB_CHANGED: NO
TASK_03_01_01_CHECKPOINT_CHANGED: NO
TASK_03_01_01_PREREQUISITE: LOCAL_CANDIDATE_PENDING_COMPLETION_AND_PUBLICATION
UNCOMMITTED: all task-owned production/tests/docs/current checkpoint/agent records;
downstream checkpoint is pre-existing and unchanged, excluded from task ownership.
FILES_CHANGED: use actual git diff --name-only plus untracked task-owned paths;
all are Organization/API/Audit/tests/relevant docs/.agent/tasks/TASK-02.02.02.
COMMIT: NONE (not authorized by success-gated commit step until all gates PASS)
STAGED: NONE
PUSH: NONE
WORKTREE: TASK_OWNED_UNCOMMITTED_CHANGES_PLUS_EXPECTED_DOWNSTREAM_CHECKPOINT
HOSTED_CI: NOT_RUN; no push/publication.

NEXT_ACTION: Resolve permission seeding boundary with owner; implement the selected
Identity-owned mechanism, then rerun failed IdentityDomain/OrganizationAPI and
affected Identity/model checks before one atomic local commit and independent review.
DO_NOT_REPEAT: Do not rewrite completed Domain/persistence/provider/API or rerun
all regression suites without a new change/failure; do not suppress required tests.
Preserve OD-01..05, migration sequence and Audit history; do not create a second
evaluator, automatic assignment or grant. No branch/worktree/push/downstream changes.

## OD-06 resume — 2026-10-08
OD-FUNCTIONAL-DIRECTION-06: ACCEPTED
Previous permission-seed blocker: RESOLVED subject to migration implementation and validation.
Repository guard: main HEAD=origin/main=800ba9153868e9f33fd9af9c23c9c3ecc424ed3f; expected dirty paths; no staged changes.
Scope: exactly one canonical Identity HasData data-only migration; no schema/roles/assignments/grants.
NEXT_ACTION: Add canonical permission, generate and inspect data-only migration, prove safe rollback and rerun full gates.

## Final safe candidate checkpoint — 2026-10-08

CHECKPOINT_STATUS: SAFE_VERIFIED_CANDIDATE_FOR_AUTHORIZED_ATOMIC_COMMIT
PHASE: FUNCTIONAL-DIRECTION-01
LAST_SAFE_COMMIT: 800ba9153868e9f33fd9af9c23c9c3ecc424ed3f (published parent)
CANDIDATE_COMMIT: the containing implementation commit; resolve from Git after commit, no self-referential SHA stored.
DECISIONS: OD-FUNCTIONAL-DIRECTION-01..06 ACCEPTED; all previous permission-seed blockers superseded.
BLOCKERS: NONE for local implementation/commit. Independent exact-commit review and publication remain gated.
COMPLETED: Organization FunctionalDirection domain/reference provider/persistence/six API routes/GLOBAL auth/canonical durable Audit; seven exact seeds; strict DTO/concurrency/history protection.
IDENTITY: canonical HasData permission sequence78 stable ...004e; generated 20261007141653_AddFunctionalDirectionManagementPermission; sole data-only InsertData/DeleteData. Schema/GLOBAL model unchanged; no role, link, assignment, user/global grant.
ROLLBACK: real PG unreferenced seed rollback removes only new permission; referenced role link triggers existing RESTRICT SQLSTATE23001, retaining data and applied migration. No contract gap/destructive cleanup.
VERIFIED: complete rerun after OD06: Release build 0errors/0warnings; all11 executable backend harnesses PASS (IdentityDomain, SitesDomain, Architecture, Authentication, IdentityPersistence, OrganizationPersistence, OrganizationAPI, AuditPersistence, AuditDelivery, SitesPersistence, SitesAPI). FD domain/exactseeds/provider/read+manage attacks/Audit atomicity/delivery and AUTH-GLOBAL/Unit/Sites/Location regressions PASS.
VERIFIED: DevScripts/CiWorkflow/DatabaseMigrator/API bootstrap contract and runtime PASS; disposable PostgreSQL central migration first19/second0 PASS; Identity/Organization/Sites/Audit EF model drift NONE; frontend lint/build and8files71tests PASS; dotnet test Release exit0 (console harnesses actual proof).
VERIFIED: scoped changed C# whitespace format/verify PASS; pre-existing legacy OrgAPI harness whitespace preserved to avoid unrelated mass formatting (new call reviewed and runtime PASS); git diff --check PASS; candidate credential-pattern scan PASS; .env/runtime artifacts ignored.
REVIEW: fd_seed_review independent read-only integrated precommit PASS; prior P2 rollback contradiction and Audit delivery gaps fixed/retested; OPEN_CRITICAL/HIGH/MEDIUM/LOW=0. Exact containing-commit review is pending and distinct.
DOCS_IMPACT: YES
DOCUMENTATION_SYNC: PASS; module/capsule/database/permission/reference/Audit/events/security/backlog updated; no ADR change required; no downstream unblock.
FILES_CHANGED: exact containing implementation commit file list; task-owned Organization/API/Audit/Identity sole seed/tests/10docs/current checkpoint and agent records/final-report. No frontend/Assets production changes.
UNCOMMITTED: before commit, all verified task-owned candidate files; stage deliberate path list and inspect complete cached diff. After containing atomic commit, only pre-existing downstream untracked checkpoint should remain.
TASK_03_01_01_CHECKPOINT_CHANGED: NO
DOWNSTREAM_CHECKPOINT_SHA256: 9AB72D3C68678954ECB5B57F20565E8482E2C02B1ADA70D21685A2EB7A96F218
TASK_03_01_01_PREREQUISITE: IMPLEMENTED_LOCALLY_PENDING_PUBLICATION
COMMIT_GATE: all local gates PASS; owner authorizes ONE atomic commit feat(organization): add Functional Direction reference directly main; parent800ba915; expected ahead1; no push.
PENDING: independent review of complete local commit; publication/exact-SHA hosted CI not authorized in this phase.
NEXT_ACTION: Independent review of the complete TASK-02.02.02 local commit before push. Then STOP.
DO_NOT_REPEAT: no implementation rewrite, new evaluator, automatic grants, branch/worktree, push, downstream edits, unrelated cleanup or migration; do not repeat full gates without new changes/failures. Preserve guarded Audit and permission rollback. Use actual Git as factual state and this last section as authoritative resume metadata.
