# TASK-02.02.02 — FUNCTIONAL-DIRECTION-01 local candidate

This report belongs to the single local implementation commit. Its immutable
commit identity is the Git commit containing this file (resolve with `git log -1
--format=%H -- .agent/tasks/TASK-02.02.02/final-report.md`); its parent is the
published baseline below. Exact-commit independent review and publication remain
separate gates. No push or hosted-CI claim is made.

```text
TASK: TASK-02.02.02
PHASE: FUNCTIONAL-DIRECTION-01
STATUS: IMPLEMENTED_LOCALLY_PENDING_INDEPENDENT_COMMIT_REVIEW_AND_PUBLICATION
BASELINE_SHA: 800ba9153868e9f33fd9af9c23c9c3ecc424ed3f
COMMIT_PARENT: 800ba9153868e9f33fd9af9c23c9c3ecc424ed3f
COMMIT: containing commit; feat(organization): add Functional Direction reference
LOCAL_MAIN_SHA: containing commit, to be verified after commit
OWNER_DECISIONS: OD-FUNCTIONAL-DIRECTION-01..06 ACCEPTED
MODULE_OWNER: Organization
FIELDS: Id, Code, Name, Status, CreatedAt, UpdatedAt, RowVersion
CODE_RULE: required trim/invariant uppercase; max50; ^[A-Z0-9][A-Z0-9_-]{0,49}$
CODE_UNIQUENESS: GLOBAL, PostgreSQL unique index
CODE_MUTABILITY: IMMUTABLE
NAME_RULE: required trim; max200; mutable; nonunique
DESCRIPTION: NONE
STATUS_MODEL: ACTIVE / INACTIVE
CREATE_STATUS: ACTIVE
INACTIVE_READ: INCLUDED
SELECTABLE_FOR_NEW_REFERENCE: ACTIVE only
HARD_DELETE: PROHIBITED (domain/API absent; persistence and database guarded)
TIMESTAMP_MODEL: server IClock; DateTimeOffset; UTC; UpdatedAt advances
ROW_VERSION: positive long; create1; increment successful mutation
OPTIMISTIC_CONCURRENCY: mandatory expectedRowVersion for mutations except create
SEEDS: IT, EXPLOITATION, SECURITY, CYBERSECURITY, REAL_ESTATE, INFRASTRUCTURE_DEVELOPMENT, RETAIL
SEED_COUNT: 7
SEED_NAMES: equal codes
SEED_IDS_STABLE: YES; 0199e3b0-0000-7000-8000-000000000001 through 007
REFERENCE_PROVIDER: IFunctionalDirectionReferenceProvider.GetReferenceAsync(Guid, CancellationToken)
REFERENCE_PROVIDER_OWNER: Organization.Application
REFERENCE_FACTS: Id, Code, Name, Status, IsSelectableForNewReference
ACTIVE_SELECTABLE: true
INACTIVE_SELECTABLE: false; reference still resolves
MISSING_REFERENCE: null
EF_ENTITY_EXPOSED: NO
DBCONTEXT_EXPOSED: NO
CANONICAL_PERMISSION: organization.manage_functional_directions
PERMISSION_SEEDED: YES
GLOBAL_ASSIGNMENT_SEEDED: NO
READ_ROUTE: GET /api/v1/reference/functional-directions
MANAGEMENT_DETAIL_ROUTE: GET /api/v1/functional-directions/{id}
CREATE_ROUTE: POST /api/v1/functional-directions
UPDATE_ROUTE: PUT /api/v1/functional-directions/{id}
ACTIVATE_ROUTE: POST /api/v1/functional-directions/{id}/activate
DEACTIVATE_ROUTE: POST /api/v1/functional-directions/{id}/deactivate
DELETE_ROUTE: NONE
READ_PERMISSION: explicit GLOBAL organization.read OR organization.manage_functional_directions
MANAGEMENT_PERMISSION: organization.manage_functional_directions
MANAGEMENT_SCOPE: explicit GLOBAL only
GLOBAL_GRANT_PROVIDER: published Identity IGlobalGrantProvider, unchanged
GEOGRAPHIC_SCOPE_MANAGEMENT: DENIED
FUNCTIONAL_DIRECTION_SCOPE_MANAGEMENT: DENIED
ASSET_TYPE_SCOPE_MANAGEMENT: DENIED
COMPOSITE_SCOPE_MANAGEMENT: DENIED
INTERNAL_ONLY: YES; canonical active local profile
CONTEXT_BOUND: YES; owned current INTERNAL context
VALIDITY_BOUND: YES
FAIL_CLOSED: YES
CALLER_PERMISSION_INPUT: NOT TRUSTED; strict DTO rejects extra fields
CALLER_SCOPE_INPUT: NOT TRUSTED
CALLER_GLOBAL_INPUT: NOT TRUSTED
AUDIT_MODEL: Organization durable obligation in mutation transaction; canonical Audit delivery
AUDIT_ACTIONS: FunctionalDirectionCreated/Updated/Activated/Deactivated
AUDIT_ATOMICITY: PASS; failed/denied/duplicate/stale/read creates no mutation Audit
SCHEMA_CHANGED: Organization only
MIGRATION_CREATED: YES
MIGRATION_NAME: 20261007091435_AddFunctionalDirections
MODEL_DRIFT: NONE (Organization, Identity, Sites, Audit)
MIGRATION_SMOKE: PASS
OD-FUNCTIONAL-DIRECTION-06: ACCEPTED
IDENTITY_MIGRATION_CREATED: YES
IDENTITY_MIGRATION_TYPE: DATA_ONLY_PERMISSION_SEED
IDENTITY_MIGRATION_NAME: 20261007141653_AddFunctionalDirectionManagementPermission
IDENTITY_SCHEMA_CHANGED: NO
ACCESS_ASSIGNMENT_SCHEMA_CHANGED: NO
GLOBAL_AUTH_MODEL_CHANGED: NO
PERMISSION_INSERTED: organization.manage_functional_directions
ROLE_CREATED: NO
ROLE_CHANGED: NO
ROLE_PERMISSION_GRANTED: NO
ACCESS_ASSIGNMENT_CREATED: NO
GLOBAL_GRANT_CREATED: NO
USER_GRANT_CREATED: NO
PERMISSION_ROW_ALONE_GRANTS_ACCESS: NO
PERMISSION_SEED_TESTS: PASS
IDENTITY_MIGRATION_SMOKE: PASS
IDENTITY_MODEL_DRIFT: NONE
IDENTITY_PERMISSION_ROLLBACK: unreferenced removes sole seed; referenced RESTRICT refuses SQLSTATE23001 and preserves data/history
POSTGRESQL_TESTS: PASS
DOMAIN_TESTS: PASS
SEED_TESTS: PASS
REFERENCE_CONTRACT_TESTS: PASS
API_TESTS: PASS
READ_AUTH_TESTS: PASS
MANAGEMENT_AUTH_TESTS: PASS
AUTH_TESTS: PASS
AUDIT_TESTS: PASS
AUTH_GLOBAL_REGRESSION: PASS
IDENTITY_REGRESSION: PASS
ORGANIZATION_REGRESSION: PASS
SITES_AUTH_REGRESSION: PASS
LOCATION_AUTH_REGRESSION: PASS
ARCHITECTURE_CHECKS: PASS
RELEASE_BUILD: PASS; 0 warnings/errors
DOTNET_TEST: exit0; console harnesses carry actual test evidence
EXPLICIT_HARNESSES: all 11 backend executable harnesses PASS
INFRASTRUCTURE_CHECKS: PASS; DevScripts, CiWorkflow, DatabaseMigrator, API bootstrap contract/runtime
CENTRAL_MIGRATION_SMOKE: PASS; disposable PostgreSQL18.6, first19 migrations, second0
FRONTEND_LINT_BUILD_TESTS: PASS; 8 test files, 71 tests
FORMATTING: PASS scoped changed C# files; preserved existing legacy OrgAPI harness whitespace, checked new call manually
DIFF_CHECK: PASS
SECRET_SCAN: PASS candidate credential-pattern scan; .env/runtime artifacts ignored
FRONTEND_PRODUCTION_CODE_CHANGED: NO
ASSET_TYPE_CODE_CHANGED: NO
ASSETS_DB_CHANGED: NO
TASK_03_01_01_CHECKPOINT_CHANGED: NO
TASK_03_01_01_CHECKPOINT_SHA256: 9AB72D3C68678954ECB5B57F20565E8482E2C02B1ADA70D21685A2EB7A96F218
TASK_03_01_01_PREREQUISITE: IMPLEMENTED_LOCALLY_PENDING_PUBLICATION
SECURITY_FINDINGS: prior two P2 test gaps addressed and verified; no open actionable findings
HIGHEST_SEVERITY: NONE_OPEN
OPEN_CRITICAL: 0
OPEN_HIGH: 0
OPEN_MEDIUM: 0
OPEN_LOW: 0
PRECOMMIT_SECURITY_REVIEW: PASS; independent read-only review of integrated candidate and OD06
EXACT_COMMIT_REVIEW: PENDING; NEXT_ACTION
CHECKPOINT_UPDATED: YES
DOCS_IMPACT: YES
DOCUMENTATION_SYNC: PASS
CURRENT_BRANCH: main
ORIGIN_MAIN_SHA: 800ba9153868e9f33fd9af9c23c9c3ecc424ed3f
LOCAL_MAIN_AHEAD_BY: 1 after authorized commit
WORKTREE: ONLY_EXPECTED_DOWNSTREAM_UNTRACKED_CHECKPOINT after authorized commit
DOWNSTREAM_UNTRACKED_CHECKPOINT: .agent/tasks/TASK-03.01.01/state.md
PUSH: NONE
HOSTED_CI: NOT_RUN
NEXT_ACTION: Independent review of the complete TASK-02.02.02 local commit before push. Then STOP.
```

Task-owned changed paths are the containing commit's file list. Two module-owned
migrations were added: Organization schema/reference/audit binding and Identity
data-only permission seed. No role grant or downstream implementation is included.

The real PostgreSQL checks cover baseline upgrade, exact seeds, immutable facts,
constraints, duplicate races, optimistic concurrency, provider inactive/missing
semantics, Audit atomicity/delivery/idempotency and safe rollback. HTTP checks
exercise every route against no grant, unrelated GLOBAL, all concrete scopes,
composites, context/validity/profile violations, overposting and provider failure.
Local evidence is in ignored `artifacts/fd-*.log` files; the committed harnesses
make the checks reproducible.
