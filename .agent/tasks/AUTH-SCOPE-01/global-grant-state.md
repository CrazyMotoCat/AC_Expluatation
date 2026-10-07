# AUTH-SCOPE-01 — AUTH-GLOBAL-01 checkpoint

TASK: AUTH-SCOPE-01
PHASE: AUTH-GLOBAL-01 — EXPLICIT GLOBAL GRANT IMPLEMENTATION
STATUS: PUBLISHED
CHECKPOINT_STATUS: SAFE
BASELINE_SHA: d07f48699410a1da8b938655b4d63605dc44d19f
LAST_SAFE_COMMIT: f3218e5b6c1bb5ded30718d141b86696a4692242 (published, exact-SHA CI PASS; final status commit pending)
BRANCH: main
REPOSITORY_STATE_GUARD: SAFE_WITH_ONLY_EXPECTED_DOWNSTREAM_UNTRACKED_CHECKPOINTS
RESUME_SAFE: YES
STATE_DRIFT: NONE

## Accepted decisions

OD-AUTH-GLOBAL-01..08 remain accepted, subject to explicit OD-AUTH-GLOBAL-09 refinement.
OD-AUTH-GLOBAL-09: ACCEPTED. The former AUTH_GLOBAL_EXISTING_DATA_CONTRACT_GAP is resolved by preserving published composite concrete scopes. Exactly-one concrete dimension is NOT an accepted invariant. Concrete assignments retain conjunction semantics across all present dimensions; unsupported composites remain excluded from geographic effective descriptors.
GLOBAL is explicit, permission-specific, context-bound, mutually exclusive with all five concrete dimensions. Null/empty/unknown never implies GLOBAL. Legacy assignments remain false; no split, reinterpretation, widening, normalization or seed changes.

## Current schema and read-only target preflight

CONCRETE_SCOPE_FIELDS: territorial_zone_id, region_id, site_id, functional_direction_id, asset_type_id (nullable UUID).
COMPOSITE_SCOPES_SUPPORTED: YES, stored domain/database conjunction semantics.
CURRENT_AT_LEAST_ONE_SCOPE_RULE: non-global requires at least one non-null concrete dimension; domain also rejects empty UUID values.
CURRENT_SCOPE_DB_CONSTRAINT: ck_access_assignments_scope_present, OR of five non-null fields; no exactly-one check.
TARGET_DATA_PREFLIGHT: UNAVAILABLE
TARGET_DATABASE: local exploitation_dev PostgreSQL; read-only to_regclass probe found identity.access_assignments absent.
TOTAL_ASSIGNMENTS: UNKNOWN
ROWS_WITH_ZERO_CONCRETE_SCOPES: UNKNOWN
ROWS_WITH_ONE_CONCRETE_SCOPE: UNKNOWN
ROWS_WITH_MULTIPLE_CONCRETE_SCOPES: UNKNOWN
DISTINCT_SCOPE_SHAPES: UNKNOWN
ROWS_VIOLATING_CURRENT_MODEL_EXPECTATIONS: UNKNOWN
SCHEMA_COMPATIBILITY_PROOF: PASS — for is_global=false the new presence constraint is exactly the old expression; exclusivity adds no restriction to concrete rows. Existing validated presence CHECK prevents all-null rows. No target data PASS is claimed. Empty UUID domain-invalid persisted values remain non-global and excluded from geographic projections; no new concrete DB restriction is added.

## Completed implementation

- Identity domain AccessScope.IsGlobal/Global and AccessAssignment.IsGlobal; canonical Assign rejects GLOBAL plus concrete fields and preserves non-global validation. Concrete Covers/IsApplicableTo never treats GLOBAL as a concrete match.
- Identity-owned IGlobalGrantProvider / GlobalGrantRequest returns a boolean using the shared current user/context/role/permission/assignment query. Existing canonical INTERNAL-only runtime eligibility is inherited, not built into generic GLOBAL scope representation. HTTP consumers must compose trusted current identity/context and fixed server-side permission; no HTTP authorization input/route is introduced.
- Geographic query retains exact old scope shape with explicit !IsGlobal; target-blind IPermissionGrantSource remains deny-all.
- Migration 20261007081640_AddExplicitGlobalAccessAssignments adds is_global BOOLEAN NOT NULL DEFAULT FALSE; old presence OR is_global plus separate global-exclusive CHECK. No data rewriting/seed/index change.
- Down takes an exclusive table lock and refuses every GLOBAL row, including revoked history. No grants/history are silently deleted. Prefer forward repair; owner-approved archival/disposition required before incompatible rollback. Test fixture deletion occurs only inside disposable Testcontainers DB.
- New ADR-018 and Identity module/context/database/security/index docs synchronized.
- No production assignment-admin mutation path exists. Canonical domain Assign is the existing creation/bootstrap path and now accepts explicit Global scope. No unrelated application/admin HTTP API or audit subsystem invented. Future runtime administration must write canonical audit with explicit scope and revoke/reissue changes, preserving history.
- No authorization cache exists; PostgreSQL reads remain per request, no Redis correctness dependency.

## Verified

- Release solution build: PASS (0 warnings/errors).
- Identity domain and architecture executable harnesses: PASS.
- Identity PostgreSQL harness: PASS, including upgrade from published last Identity migration, full legacy-field equality, default false, composite preservation, every GLOBAL+dimension DB rejection, scope-empty DB rejection, refused rollback retains GLOBAL and safe rollback restores exact legacy schema/data.
- Global provider: permission P/Q, concrete and composites vs separate Global, wrong/foreign context, ownership, user/type/role/context/assignment active and validity, revocation, unsupported/noncanonical permission, storage failure fail-closed, cancellation propagation, unchanged concrete scopes/general source: PASS.
- Global HTTP Site/Location regression tests: PASS after rebuilt Release harness.

## Pending / ownership

TASK_OWNED_CHANGES: Identity domain/application/infrastructure/migration/snapshot, Identity domain/persistence tests, RealSiteHttpChecks, six product docs, checkpoint and phase handoff/agent records are included in the atomic local commit described below. Pre-existing downstream TASK-02.02.02 and TASK-03.01.01 state files stay untracked, preserved and excluded.
PRIMARY_OWNER: contracts/schema/provider/integration/checkpoint and final gates.
HELPERS: docs (six authorized docs); http_tests (RealSiteHttpChecks only); independent review completed.
BLOCKERS: NONE; all local gates and independent security review complete.
ORGANIZATION_CODE_CHANGED: NO
ASSETS_CODE_CHANGED: NO
TASK_02_02_02_STATUS: READY_TO_RESUME
TASK_03_01_01_STATUS: STILL_BLOCKED_ON_FUNCTIONAL_DIRECTION
PUSH: PASS — see publication checkpoint below.
NEXT_ACTION: See publication checkpoint below.
DO_NOT_REPEAT: Do not reopen OD01..09, infer GLOBAL from null/unknown, split composites, widen Sites scopes, add admin routes/permissions/consumer implementation/cache, apply migrations to local exploitation_dev, commit downstream checkpoint ownership, create branch/worktree, or start downstream implementation in this phase.

## Final local gates (2026-10-07)

ALL_LOCAL_GATES: PASS
EXPLICIT_HARNESSES: 11/11 PASS — IdentityDomainChecks, SitesDomainChecks, ArchitectureChecks, AuthenticationChecks, IdentityPersistenceChecks, SitesPersistenceChecks, SitesApiChecks, AuditPersistenceChecks, AuditDeliveryChecks, OrganizationPersistenceChecks, OrganizationApiChecks.
DOTNET_TEST: PASS (console harnesses executed separately; dotnet test is not discovery evidence).
RELEASE_BUILD: PASS, zero warnings/errors.
MODEL_DRIFT: PASS, Identity Release has-pending-model-changes reports none.
MIGRATION_SMOKE: PASS — isolated task-only PostgreSQL container; central migrator applied 17 module migrations, second execution 0; container stopped/removed, local exploitation_dev not mutated.
INFRASTRUCTURE_SCRIPTS: PASS — DevScripts, CiWorkflow, DatabaseMigrator, ApiBootstrapSmoke.Contract; live API bootstrap smoke PASS.
FORMATTING: PASS — scoped dotnet format whitespace verify-no-changes; only changed C# files.
DIFF_CHECK: PASS; one checkpoint EOF newline corrected.
SECRET_SCAN: PASS — changed-file private-key/provider-token credential patterns, suppressed values; fixed disposable PostgreSQL test credentials only, no production secrets.
DOCS_IMPACT: YES — entity/database/security/contract/ADR.
DOCUMENTATION_SYNC: PASS — ADR018/index, Identity module/context, database/security inspected against final implementation; no route/OpenAPI/registry/seed changes, no architecture pattern changes.
INDEPENDENT_SECURITY_REVIEW: PASS — security_review read-only inspected actual domain/provider/shared query/EF migration snapshot/designer, migration tests/provider tests/HTTP tests and docs.
OPEN_CRITICAL: 0
OPEN_HIGH: 0
OPEN_MEDIUM: 0
OPEN_LOW: 0
HOSTED_CI: PASS for review SHA `f3218e5b6c1bb5ded30718d141b86696a4692242`; see publication checkpoint. Publication-status SHA requires its own final verification.

## Atomic local commit protocol

All task-owned paths are staged explicitly and inspected; pre-existing downstream task checkpoints stay untracked and excluded. Commit subject: feat(identity): add explicit global assignment scope. Commit parent must be d07f48699410a1da8b938655b4d63605dc44d19f. Resolve the resulting local SHA via Git; a checkpoint inside its own commit cannot embed that self-referential SHA. The recorded baseline remains the last safe pre-task commit. Branch stays main, origin/main stays baseline, exactly one local task commit, no push.

AUTH-GLOBAL-01R: Independent publication review PASS; see `auth-global-publication-review.md` for the schema proof, attack matrix and rerun evidence. The exact source candidate remains unchanged. Hosted CI is unverified until the review-status commit is pushed and its exact SHA passes.

## Publication checkpoint (2026-10-07)

The source commit `0e2ea20f01d29841faaf3eb275d21103571e857b` and independent review commit `f3218e5b6c1bb5ded30718d141b86696a4692242` were pushed normally to main. GitHub Actions [run 37595225191](https://github.com/CrazyMotoCat/AC_Expluatation/actions/runs/37595225191) succeeded for exact review SHA `f3218e5b6c1bb5ded30718d141b86696a4692242`: Backend build and tests PASS, Frontend build and tests PASS, Verify required checks PASS. Backend's Apply module migrations step PASS. Final publication-status commit and its own exact-SHA hosted CI must be verified before final closure; its SHA cannot be embedded in its own commit.

AUTH-GLOBAL-01: PUBLISHED after exact review-SHA hosted CI PASS.
TASK-02.02.02: READY_TO_RESUME on the published AUTH-GLOBAL baseline.
TASK-03.01.01: STILL_BLOCKED_ON_FUNCTIONAL_DIRECTION.
NEXT_ACTION: Verify publication-status commit exact-SHA hosted CI, then resume TASK-02.02.02 / FUNCTIONAL-DIRECTION-01 in a separate task. Do not implement either downstream task in this review.
