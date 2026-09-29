# SITE-API-01R final adversarial review

TASK: TASK-02.03.03
PHASE: SITE-API-01R — FINAL ADVERSARIAL REVIEW + MAIN INTEGRATION
BASELINE_SHA: 229887f9f5a1ac00c1ec6d2ddb0c586e774996d4
SOURCE_SITE_API_COMMIT: b4b5dbce2dbd1c344d1caf643c981f31b663f233
STATUS: INDEPENDENT_REVIEW_PASS / PREINTEGRATION_GATES_PASS

## Independent inspection

Primary review and a separate read-only adversarial reviewer inspected the
exact candidate and published Identity/Sites composition without relying on
earlier review conclusions. Candidate ownership: Site endpoints, narrowly
required DTO/handler/read projection/DI/error mapping, tests and related docs.
No schema, migration, frontend, capabilities, DEV bootstrap, contractor-positive
authorization, unrelated refactor or Zone/Region semantic change.

Actual EndpointDataSource enumeration and OpenAPI checks prove exactly seven
Site routes, no duplicate, DELETE or reparent mapping. All require authentication.
List/get: sites.read; create: sites.create; ordinary update and lifecycle:
sites.change; criticality: sites.change_criticality ONLY. There is no implication.
Subject is the canonical authenticated active local profile and owned validated
request working context. Body/query/header role, identity, scope or ancestry
values never become authorization evidence.

List invokes IAuthorizedSiteReadService with ordinary filters and canonical
user/context. It obtains fixed sites.read scopes internally, joins persisted
Region ancestry, and applies authorization AND business predicates before
count/order/page. Exact scope membership cannot become unrestricted access.
Direct/create checks load authoritative ancestry and obtain permission-specific
Identity scopes before invoking business handlers. No raw scoped store,
Identity persistence dependency, per-row evaluator, N+1 or Redis dependency.
Queries are bounded: canonical subject/context lookup(s), one effective-scope
query, Sites count/page; direct adds one hierarchy lookup and applicable business
operation. This is source/query-path inspection, not a load benchmark.

All five direct operations and create-parent conceal absent/inaccessible targets
with 403 GEOGRAPHY_ACCESS_DENIED. No target-existence 404 oracle. Business
eligibility follows authorization. Ordinary DTO binds only name, siteTypeId,
address, timezone and expectedRowVersion. Response has only the ten frozen
fields. Failed provider/hierarchy/list authorization throws or denies; no
unfiltered fallback exists. Unsupported/malformed scopes do not broaden access.
Canonical responses suppress persistence/constraint text and scope contents.

B1 command persistence remains intact: create reaches Region FOR UPDATE and
rechecks ACTIVE state; mutation uses optimistic row_version and atomic Site/audit
save. Existing inactive reference can be retained, a new inactive reference
cannot be assigned. Success leaves exactly one allowlisted obligation. HTTP
does not write audit independently. Normalized duplicate maps to sanitized
409 SITE_CODE_ALREADY_EXISTS. No new schema/model/migration.

## Findings and bounded remediation

ID: SITE-API-01R-PROOF-01
CLASSIFICATION: validation proof gap; no demonstrated security bypass
LOCATION: SiteHttpChecks.cs list matrix; RealProviderSiteAuthorizationChecks.cs fixture
ISSUE: the exact four-Site/three-Region matrix used a substituted scope provider;
the separate real-provider fixtures did not exercise all requested combinations.
EXPLOIT_PATH: none found; production SQL composition was correct by inspection.
IMPACT: incomplete evidence for the owner's publication gate, so no publication
PASS could be claimed before the matrix was rerun with the real provider.
MINIMAL_REMEDIATION: tests-only RealSiteListMatrixChecks plus invocation from
the existing realIdentity HTTP factory. Source implementation commit is preserved.
STATUS: CLOSED — runtime PASS and separate read-only review of assertions.

The new PostgreSQL/production-HTTP matrix checks Site A1, Region A1, Zone A,
Zone A + Site B1, Region B1, no scopes, sites.change-only and contractor. A ninth
Zone B-only attacker context tests forged Site/create-parent ancestry with correct
permissions through GET/create/update/activate/deactivate/criticality. Body,
query, headers and extra JSON authority values all fail with canonical 403;
persisted Site fields/row versions and obligation count stay unchanged.
All users/contexts/role memberships are distinct, so pre-existing grants cannot
contaminate this fixture. Unauthorized B1 sorts first to expose authorization
after pagination; exact IDs/count/pages and empty boundary are asserted. Shared
SiteType/criticality across both Zones, both statuses, unauthorized Region,
exact unauthorized code/name, combined filters and injected scopes are checked.

NOTE: pre-existing source-text assertions in ArchitectureChecks are brittle.
Security proof also uses public-signature/reflection checks, actual route
enumeration, real-provider HTTP and persisted PostgreSQL assertions; this is
nonblocking and does not require harness redesign.
OPEN_CRITICAL: 0
OPEN_HIGH: 0
OPEN_MEDIUM: 0
OPEN_LOW: 0
NOTES: 1 (source-text assertion robustness)

## Observed verification

- Full Release solution build: PASS, zero warnings/errors.
- dotnet test: PASS (exit 0); no VSTest discovery claim.
- All 11 explicit Release executable harnesses: PASS: SitesDomain,
  IdentityDomain, SitesPersistence, SitesApi, OrganizationPersistence,
  OrganizationApi, IdentityPersistence, Authentication, AuditPersistence,
  AuditDelivery, Architecture. SitesApi rerun after the final test extension.
- PostgreSQL HTTP checks: all seven routes, IDOR and 403/403 concealment,
  create-parent coverage/concealment, ordinary fields, inactive reference
  retention, lifecycle and criticality-only permission, stale versions,
  denied state/version/audit snapshots, successful obligation actions,
  normalized duplicate mapping, failure rollback and sanitized errors: PASS.
- B1 PostgreSQL checks: both Region create/deactivate race directions,
  eligibility, constraints, audit atomicity: PASS. HTTP uses that same locked
  path; no separate HTTP race harness is claimed.
- SITE-F1/SITE-F2 and original F1/F2, C1 Geography, OIDC/working-context,
  contractor fail-closed and public-contract/architecture regression: PASS.
- Site/Identity EF has-pending-model-changes with matching Release builds:
  no model drift. Initial option/configuration invocation failures were corrected;
  final commands succeeded with a nonconnecting model-only design-time connection.
- Four infrastructure/CI/migrator/smoke-contract scripts: PASS.
- Changed handwritten C# whitespace verification, diff check, Markdown local
  file references and scoped secret-pattern hygiene: PASS.

Docker was initially stopped: first HTTP attempt failed before any test ran.
Docker Desktop was started and the actual PostgreSQL tests subsequently passed.
Raw runtime logs are outside the repository in TEMP/site-api-01r-20260929;
the assertions and durable verification summary are version-controlled here.

## Publication gates and boundaries

INDEPENDENT_SITE_API_REVIEW: PASS
SITE_LIST: PASS
SITE_GET: PASS
SITE_CREATE: PASS
SITE_UPDATE: PASS
SITE_ACTIVATE: PASS
SITE_DEACTIVATE: PASS
SITE_CRITICALITY: PASS
SITE_DELETE: ABSENT
TARGET_CONCEALMENT: PASS
CREATE_PARENT_CONCEALMENT: PASS
CRITICALITY_PERMISSION_ISOLATION: PASS
DENIED_MUTATION_STATE_CHANGE: NONE
DENIED_MUTATION_ROW_VERSION: NONE
DENIED_MUTATION_AUDIT: NONE
COUNT_LEAKAGE: NONE
BUSINESS_FILTER_AUTH_COMPOSITION: PASS
ORDERING: code ASC, id ASC
PAGINATION: canonical page 1/default size 50/max 200; invalid 400; out-of-range empty
REFERENCE_ELIGIBILITY: PASS
REGION_SERIALIZATION: PASS
AUDIT_ATOMICITY: PASS
AUDIT_DELIVERY: PASS
DUPLICATE_CODE_MAPPING: PASS
CONTRACTOR: FAIL_CLOSED
SITE_F1: CLOSED
SITE_F2: CLOSED
F1_REGRESSION: PASS
F2_REGRESSION: PASS
C1_REGRESSION: PASS
RAW_STORE_HTTP_ENTRY: NONE
IDENTITY_DB_HTTP_DEPENDENCY: NONE
SERVER_SIDE_FILTERING: PASS
N_PLUS_ONE: NONE
SCHEMA_CHANGED: NO
MIGRATION_CREATED: NO
MODEL_DRIFT: NONE
FRONTEND: NOT_IMPLEMENTED
CAPABILITIES: NOT_IMPLEMENTED
DEV_BOOTSTRAP: NOT_IMPLEMENTED
CONTRACTOR_POSITIVE: NOT_SUPPORTED

Integration, post-integration reruns, publication docs, normal push and exact-final-SHA
hosted CI remain pending at this preintegration checkpoint. No preceding hosted run
is evidence for the candidate. Integration is fast-forward only; no amend, squash,
cherry-pick, merge commit or force push.
