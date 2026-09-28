# SITE-AUTH-01R independent security review and publication

TASK: TASK-02.03.03
PHASE: SITE-AUTH-01R — INDEPENDENT REVIEW + INTEGRATION
STATUS: REVIEW_PASS / INTEGRATED_ON_MAIN / PUSH_PENDING_AT_CHECKPOINT
EXECUTION_MODE: BALANCED / T3
BASELINE_SHA: 4307ac3412f2c7da73290b76e4ee5358d1f8053c
SOURCE_SITE_AUTH_COMMIT: cb05c9a61aac413bd3481802d04873fe9f36491b
FINAL_SITE_AUTH_SHA: 6ea9fe9a6b0628203a39d68d21c1644d483da87d
FINAL_MAIN_SHA: publication-status commit containing this report; resolve main

## Scope and independent assessment

The primary reviewed the exact baseline-to-candidate diff and surrounding
Identity/Sites composition. A separate gpt-6-sol/high read-only reviewer
independently assessed the same source and subsequently re-reviewed the
bounded five-file test/documentation remediation. The reviewer performed no
writes, commits or test runs; executed checks below are primary-agent evidence.
Initial main/origin/main, source HEAD and its parent matched the supplied
SHAs after fetch. Both registered worktrees were clean. The misspelled
abbreviated baseline in the request was replaced with the supplied full SHA.

DIFF_OWNERSHIP: PASS — SITE-AUTH-00 contract/docs plus SITE-AUTH-01
implementation/tests/docs and bounded review tests/docs only.
INDEPENDENT_SITE_AUTH_REVIEW: PASS
IDENTITY_SITE_SCOPE: PASS
SITE_SCOPE_EXACT: PASS
IDENTITY_HIERARCHY_EXPANSION: NONE
SITES_SITE_AUTH: PASS
SITE_HIERARCHY_SOURCE: authoritative Sites PostgreSQL Site/Region join
DIRECT_SITE_COVERAGE: exact Site OR persisted parent Region OR ancestor Zone
ZONE_TO_SITE: PASS
REGION_TO_SITE: PASS
SITE_TO_REGION: DENY
SITE_TO_ZONE: DENY
CREATE_PARENT_AUTH: PASS — fixed sites.create, persisted Region/Zone
SITE_SCOPE_CREATES_SIBLING: DENY
AUTHORIZED_SITE_LIST: PASS
LIST_PERMISSION: fixed sites.read acquired internally
RAW_SITE_STORE_PUBLIC_ENTRY: NONE — safe public interface, internal SQL service
REAL_PROVIDER_SITE_LIST_TEST: RealProviderSiteAuthorizationChecks.RunAsync
REAL_PROVIDER_SITE_LIST_RESULT: PASS — exact Site, Zone, Region, two Zones,
revoked read/wrong permission, count/page boundaries and narrowing filter
REAL_PROVIDER_CREATE_PARENT_TEST: RealProviderSiteAuthorizationChecks.RunAsync
REAL_PROVIDER_CREATE_PARENT_RESULT: PASS — real Zone create grant ALLOW,
different Zone DENY, otherwise sufficient contractor Zone grant DENY
SITE_LIST_SQL: Site IDs OR Region IDs OR authoritative Region Zone IDs;
authorization AND business filters precede Count/OrderBy/Skip/Take
EMPTY_SCOPE: NO_ACCESS
COUNT_LEAKAGE: NONE
SERVER_SIDE_FILTERING: PASS
N_PLUS_ONE: NONE — bounded provider query and Sites lookup/count/page
CHANGE_PERMISSION: sites.change
CRITICALITY_PERMISSION: sites.change_criticality
PERMISSION_ISOLATION: PASS — no permission implication
SITE_F1: CLOSED
SITE_F2: CLOSED
F1_REGRESSION: CLOSED
F2_REGRESSION: CLOSED
CONTRACTOR: FAIL_CLOSED
TARGET_CONCEALMENT_FOUNDATION: PASS — boolean false for missing/uncovered
IDENTITY_SITES_DB_DEPENDENCY: NONE
SITES_IDENTITY_DB_DEPENDENCY: NONE
SITE_B1_REGRESSION: PASS
C1_REGRESSION: PASS — production Zone/Region route sources unchanged
SCHEMA_CHANGED: NO
MIGRATION_CREATED: NO
MODEL_DRIFT: NONE — Identity and Sites EF checks
SITE_HTTP_API: NOT_STARTED / NOT_IMPLEMENTED

## Security findings

ID: SITE-REVIEW-DOC-01
SEVERITY: LOW
LOCATION: docs/backlog.md; docs/modules/identity.md;
docs/context/identity.context.md; docs/adr/README.md
ISSUE: stale current-status descriptions excluded Site or claimed the
authorization foundation was still unimplemented.
EXPLOIT: none demonstrated.
IMPACT: misleading documentation and task resume/integration instructions.
EVIDENCE: exact Site provider/evaluator support and registered authorized
Site list exist in the reviewed source commit.
MINIMAL_REMEDIATION: correct local implementation/publication status and
runtime scope contract bullets; preserve Accepted ADR decisions.
RESULT: CLOSED — independent remediation re-review PASS.

ID: SITE-REVIEW-TEST-01
SEVERITY: NOTE
LOCATION: tests/integration/Exploitation.SitesPersistenceChecks/
RealProviderSiteAuthorizationChecks.cs
ISSUE: original real integration tested only exact Site read across siblings;
positive create-parent, two-Zone list and revoked/wrong-permission read
evidence were missing. Contractor create negative used insufficient Site scope.
EXPLOIT: none demonstrated; production composition and stub tests correct.
IMPACT: incomplete full provider-to-Sites composition evidence.
EVIDENCE: original internal user had only Site sites.read assignment.
MINIMAL_REMEDIATION: expand the existing real PostgreSQL/DI test without
production or architecture changes.
RESULT: CLOSED — expanded test passed; independent remediation review PASS.

ID: SITE-REVIEW-STRUCTURE-01
SEVERITY: NOTE / NONBLOCKING
LOCATION: tests/architecture/Exploitation.ArchitectureChecks/Program.cs:525-548
ISSUE: some hierarchy/registration/route-absence assertions use source text;
route absence scans top-level API/Sites files and a literal route string.
EXPLOIT: a future grouped-prefix or nested route could evade that assertion;
no such route exists in the currently reviewed source.
IMPACT: future regression-test robustness limitation, no current bypass.
EVIDENCE: known public inputs/visibility/provider dependencies have reflection
checks; remaining query/DI/route assertions inspect substrings.
MINIMAL_REMEDIATION: optional future endpoint-metadata/DI inspection and wider
structural contract enumeration; no authorization contract change is needed.
RESULT: EXPLICIT_NONBLOCKING_NOTE — accepted current review limitation.

SECURITY_FINDINGS: one LOW closed; one coverage NOTE closed; one open NOTE
HIGHEST_SEVERITY: LOW initially; NOTE remaining
OPEN_CRITICAL: 0
OPEN_HIGH: 0
OPEN_MEDIUM: 0
OPEN_LOW: 0
NOTES: 1 nonblocking structural test robustness limitation

## Executed local gates before integration

POSTGRESQL_TESTS: PASS — real Testcontainers PostgreSQL, Identity and Sites
SECURITY_TESTS: PASS — exact scopes/eligibility, direct/create/list, Site and
original F1/F2, empty/unsupported scopes, permission isolation, contractor,
failure propagation, count/page and narrowing business filters
API_TESTS: PASS — SitesApiChecks and OrganizationApiChecks
OIDC_REGRESSION: PASS — AuthenticationChecks
WORKING_CONTEXT_REGRESSION: PASS — AuthenticationChecks
ARCHITECTURE_CHECKS: PASS
RELEASE_BUILD: PASS — zero warnings/errors
DOTNET_TEST: PASS — solution command exit 0; executable harnesses run explicitly
EXPLICIT_HARNESSES: PASS — all 11: SitesDomainChecks, IdentityDomainChecks,
SitesPersistenceChecks, IdentityPersistenceChecks, SitesApiChecks,
OrganizationApiChecks, OrganizationPersistenceChecks, AuthenticationChecks,
AuditPersistenceChecks, AuditDeliveryChecks, ArchitectureChecks
INFRASTRUCTURE_CONTRACT_CHECKS: PASS — DevScripts, CiWorkflow,
DatabaseMigrator, ApiBootstrapSmoke.Contract (PowerShell 7 for native stderr)
FORMATTING: PASS — changed C# whitespace --verify-no-changes
DIFF_HYGIENE: PASS — git diff --check
MARKDOWN_REFERENCES: PASS — changed-file Markdown links resolve; ADR IDs unique
SECRET_HYGIENE: PASS — scoped key/token pattern scan, no secret values printed
DOCS_IMPACT: YES
DOCUMENTATION_SYNC: PASS — published foundation, unimplemented Site HTTP API;
Identity/Sites modules and capsules, API/backlog/architecture/security, ADR index
and dated ADR-017 implementation status synchronized; ADR decisions unchanged

Initial PostgreSQL attempts failed because Docker Desktop was stopped.
Starting Docker Desktop restored the engine; both affected harnesses then
passed. EF drift checks use each Infrastructure design-time factory with a
synthetic local tooling connection string and matching Release build.

## Integration and hosted verification

INTEGRATION_METHOD: FAST_FORWARD_ONLY
FAST_FORWARD: PASS — exact baseline to 6ea9fe9a6b0628203a39d68d21c1644d483da87d
POST_INTEGRATION_GATES: PASS — all 11 explicit harnesses, Release build,
dotnet test, Identity/Sites drift and diff hygiene rerun on main; secret scan PASS
PUSHED: PENDING_AT_CHECKPOINT — ordinary push after final fetch guard
REMOTE_SHA: baseline until push; must equal final main after fetch
HOSTED_CI: NOT_YET_VERIFIED_AT_CHECKPOINT
HOSTED_CI_RUN: final-SHA run to verify after push; authenticated browser available
REPOSITORY_STATE: SAFE_WITH_CHECKPOINT; clean after publication-status commit
GIT_STATE: DIRTY_EXPECTED_PUBLICATION_DOCS_AT_CHECKPOINT

NEXT_ACTION: commit narrow publication-status docs, fetch and verify origin/main
still equals the exact baseline, push normally, then inspect hosted jobs for
the exact final main SHA. These fields describe the checkpoint before push;
the completion response must supply the actual final SHA and hosted run evidence.
After publication verification, implement Site HTTP API only in a separately
authorized task.

DO_NOT_REPEAT: no Site endpoints, frontend, capabilities, DEV bootstrap,
contractor-positive grants, schema/migrations, Zone/Region production-route
changes, ADR decision rewrite, squash, cherry-pick, merge commit or force push.
