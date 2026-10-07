# FUNCTIONAL-DIRECTION-01R independent review and publication

BASELINE_SHA: 800ba9153868e9f33fd9af9c23c9c3ecc424ed3f
SOURCE_COMMIT: 99c86c046a2893b9a33b98c24350b4e54e112a1a
REMEDIATION_COMMITS: 8f2a9bfaca232d694b79973fd1b16610efaeb661 (tests only)
REVIEW_STATUS_COMMIT: containing first review/status commit; resolve from Git
STATUS: REVIEWED_LOCAL_PENDING_PUBLICATION

Two independent read-only reviewers (`fd01r_auth`, `fd01r_data`, user-requested
gpt-6-sol/high) inspected the exact baseline/source range and separately reviewed
the bounded test remediation. Prior precommit PASS reports were not used as proof.
Primary reconciled their conclusions against code and fresh runtime checks.

## Ownership and contract

DIFF_OWNERSHIP: PASS; all 53 source paths classified in `review-paths.tsv`.
UNRELATED_PATHS: NONE. Remediation changes three Organization test files only.
No source candidate amendment, branch/worktree, Identity schema/global evaluator,
role/assignment mutation, Assets, Sites/Location business or frontend production
change. Downstream checkpoint SHA256 remains
`9AB72D3C68678954ECB5B57F20565E8482E2C02B1ADA70D21685A2EB7A96F218`.

OD-FUNCTIONAL-DIRECTION-01..06: ACCEPTED; unchanged.
FIELDS: Id/Code/Name/Status/CreatedAt/UpdatedAt/RowVersion only.
CODE_RULE: required trim/invariant uppercase max50; `^[A-Z0-9][A-Z0-9_-]{0,49}$`.
CODE_UNIQUENESS: globally unique PostgreSQL index; duplicate race produces one
commit and stable business conflict. CODE_MUTABILITY: immutable domain/API/EF/DB.
NAME_RULE: required trim max200 mutable nonunique. STATUS_MODEL: ACTIVE/INACTIVE;
create ACTIVE, explicit versioned lifecycle. HARD_DELETE: NO, guarded DB trigger.
ROW_VERSION: positive long, create1, expected version required for all existing-row
mutations, optimistic EF token, stale409 with no retry/audit. TIMESTAMPS: server
IClock/UTC DateTimeOffset, immutable creation, advanced successful-update instant.
EXACT_SEEDS: PASS; IT/EXPLOITATION/SECURITY/CYBERSECURITY/REAL_ESTATE/
INFRASTRUCTURE_DEVELOPMENT/RETAIL, name=code, ACTIVE, fixed UUIDv7 ...001..007.

REFERENCE_PROVIDER: PASS; Organization.Application owns
IFunctionalDirectionReferenceProvider; immutable Id/Code/Name/Status/
IsSelectableForNewReference. ACTIVE selectable=true; INACTIVE resolves with false;
MISSING_REFERENCE=null. EF_ENTITY_EXPOSED/DBCONTEXT_EXPOSED/IQueryable: NO.
Provider authorizes no end user; consuming operation owns authorization.

## Security and Identity permission

CANONICAL_MANAGEMENT_PERMISSION: organization.manage_functional_directions.
CATALOG_READ_RULE: explicit current GLOBAL organization.read OR management.
GLOBAL_ORGANIZATION_READ/GLOBAL_MANAGEMENT_READ: ALLOW.
CONCRETE_ORGANIZATION_READ/COMPOSITE_ORGANIZATION_READ: DENY.
MANAGEMENT_RULE: only explicit current GLOBAL management.
CONCRETE_MANAGEMENT_GRANT: DENY; organization.read/create/change never substitute.
INTERNAL_ONLY/CONTEXT_BOUND/VALIDITY_BOUND/FAIL_CLOSED: YES.
Canonical authenticated ACTIVE INTERNAL persisted local user and owned current
INTERNAL context; fixed server constants through published Identity GLOBAL
provider; exact GLOBAL shape and assignment/role validity. Caller permissions,
scope/global/user/role inputs are not evidence. Authorization precedes management
lookup and prevents missing/existing target probes.

READ_ROUTE: GET /api/v1/reference/functional-directions (both statuses, code/id sort).
MANAGEMENT_DETAIL_ROUTE: GET /api/v1/functional-directions/{id} (latest rowVersion).
CREATE_ROUTE: POST /api/v1/functional-directions (code/name only).
UPDATE_ROUTE: PUT /api/v1/functional-directions/{id} (name/expectedRowVersion only).
ACTIVATE_ROUTE/DEACTIVATE_ROUTE: POST same id /activate and /deactivate.
DELETE_ROUTE: NONE. Strict unknown-member rejection; canonical sanitized errors.

IDENTITY_DATA_MIGRATION: 20261007141653_AddFunctionalDirectionManagementPermission.
IDENTITY_SEED_DELTA: organization.manage_functional_directions only (stable ...004e).
IDENTITY_SCHEMA_DELTA/relational model delta: NONE.
IDENTITY_TABLE_CREATED/COLUMN_ADDED/INDEX_ADDED/CONSTRAINT_CHANGED: NO.
ACCESS_ASSIGNMENT_CHANGED/IS_GLOBAL_CHANGED: NO.
ROLE_CREATED/ROLE_CHANGED/ROLE_PERMISSION_CREATED/ASSIGNMENT_CREATED/
GLOBAL_GRANT_CREATED/USER_GRANT_CREATED/OTHER_PERMISSION_CHANGED: NO.
PERMISSION_ROW_ALONE_GRANTS_ACCESS: NO.
Up sole canonical HasData InsertData; snapshot sole added seed; Down sole DeleteData.
Existing RESTRICT FK refuses referenced Down with SQLSTATE23001 and preserves
permission/link/history; unreferenced Down removes sole row and preserves baseline.

## Audit, migrations and adversarial evidence

AUDIT_MODEL: business mutation + durable Organization obligation in one transaction;
canonical Audit-owned materialization, no direct cross-module schema write.
AUDIT_ACTIONS: FunctionalDirectionCreated/Updated/Activated/Deactivated.
AUDIT_ATOMICITY/AUDIT_DELIVERY: PASS. Successful exact snapshots/actor/context/
correlation; rejected/read/stale/invalid/duplicate operations have no successful
mutation audit; stable EventId idempotency, claim/lease/retry/Unit regressions.
ORGANIZATION_MIGRATION: 20261007091435_AddFunctionalDirections only; owned table,
seeds and existing Organization audit binding/allowlists, restrictive FKs/no cascade.
Live-history Down guard is exercised by existing harness Program.cs:151-182.

Publication-critical 24 attacks are covered by reviewed implementation and real
PostgreSQL harnesses: no/default/unrelated permission grants; concrete/composite
read/manage widening; other Organization permission substitution; caller fields,
headers, queries and JWT role; canonical context/profile/time failures; target
concealment; duplicate race/stale writes; sanitized errors; mandatory atomic Audit;
hard-delete/identity protection; inactive/missing provider; architecture/schema
isolation; unchanged downstream checkpoint.

## Findings and bounded remediation

FD-R-01 — MEDIUM, CLOSED:
LOCATION: tests/integration/Exploitation.OrganizationPersistenceChecks/FunctionalDirectionChecks.cs
ISSUE: source tested success-path atomic audit but omitted forced obligation-insert failure.
FAILURE_PATH/IMPACT: an atomicity regression could evade tests; no production bug observed.
EVIDENCE: no injected Audit insert failure in source; command store transaction is correct.
MINIMAL_REMEDIATION: real PostgreSQL test trigger rejects only FD obligation inserts
with P0001 for create/update/deactivate/activate; assert typed failure and exact
directions/obligations snapshots unchanged; retry same store with original versions
after removing test trigger; verify final states/version and exact audit counts.
RETEST: PASS; independently re-reviewed and closed.

FD-R-N01 — coverage NOTE, CLOSED: explicit GLOBAL organization.create/change denial
added for catalog and every management route. FD HTTP matrix now retains production
IUserProfileRepository/IUserContextRepository/IPermissionGrantSource with PostgreSQL
fixtures instead of in-memory substitutes; real GLOBAL provider retained. JWT signing
configuration and working-context Audit writer remain controlled harness substitutes;
canonical FD mutation Audit has independent real PostgreSQL delivery tests.

Retracted reviewer hypothesis: live-history rollback test was initially overlooked;
primary pointed to existing Program.cs:151-182, reviewer withdrew the finding after
inspection. No remediation or unsupported defect claim was retained for that test.

SECURITY_FINDINGS: one MEDIUM test gap closed; coverage notes closed; no product defect.
HIGHEST_SEVERITY: MEDIUM_CLOSED.
OPEN_CRITICAL/OPEN_HIGH/OPEN_MEDIUM/OPEN_LOW: 0/0/0/0.
FROZEN_CONTRACT_CHANGE_REQUIRED: NO.

## Fresh local validation

All 11 backend executable harnesses PASS: IdentityDomain, SitesDomain, Architecture,
Authentication, IdentityPersistence, OrganizationPersistence, OrganizationAPI,
AuditPersistence, AuditDelivery, SitesPersistence, SitesAPI. Includes exact seeds,
provider, actual persisted Identity read/manage attacks, injected atomicity failure,
permission no-grant/rollback, AUTH-GLOBAL and Company/Unit/Sites/Location regressions.
Release build PASS (0 warnings/errors); dotnet test exit0 (console harnesses carry
actual evidence). Frontend lint/build PASS; 8 files/71 tests PASS. Infrastructure
DevScripts/CiWorkflow/DatabaseMigrator/API bootstrap contract and runtime PASS.
Empty-db central migration19 then0; full published-baseline central upgrade2 then0.
Organization/Identity/Sites/Audit model drift NONE. Scoped changed-file formatting,
diff check, credential-pattern hygiene PASS; legacy OrgAPI whitespace preserved.
Ignored logs: artifacts/fd01r-*.log. Required gates PASS after bounded remediation;
no assertion weakened, skipped or fabricated.

DOCS_IMPACT: YES (review/publication status only).
DOCUMENTATION_REVIEW/DOCUMENTATION_SYNC: PASS.
CHECKPOINT_UPDATED: YES. Accepted ADRs, API/data/security semantics unchanged.
TASK_03_01_01_CHANGED: NO; it remains gated until exact-SHA hosted CI PASS.

NEXT_ACTION: normal push of reviewed main, exact-SHA Build pipeline backend/frontend/
required checks, then published metadata finalization and exact final-SHA CI. Do not
start TASK-03.01.01; STOP after publication.
