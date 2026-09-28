# SITE-API-01 independent security review and verification

BASELINE: `229887f9f5a1ac00c1ec6d2ddb0c586e774996d4`
BRANCH: `codex/task-02.03.03-site-api`
STATUS: LOCAL_IMPLEMENTATION_VERIFIED; independent publication review next

## Independent read-only review

Reviewer: `site_api_security_review` subagent; reviewed complete implementation
diff including new files, then reconciled final tests/docs and formatting.
No files edited by reviewer. SECURITY_REVIEW: PASS. No actionable findings;
OPEN_CRITICAL/HIGH/MEDIUM/LOW: 0. HIGHEST_SEVERITY: NONE.

Reviewed exact authenticated seven-route set, no DELETE, canonical local
subject/context resolution, fixed permission matrix and criticality isolation,
Site and create-parent concealment, authorization before mutation, immutable
DTO fields, authorized list boundary, contractor/JWT/context/input denial,
absence of raw scope/store/DB access, B1 parent locking and atomic audit paths.
Subject/grant resolution exceptions cannot reach mutation handlers; no
fail-open fallback is introduced. Identity/Sites cross-infrastructure or
cross-schema access is absent. Accepted ADR-017 and Zone/Region endpoints
are unchanged. The only B1 store change distinguishes criticality reference
exceptions for the frozen 404/409 HTTP codes; no business rule changes.

## Runtime evidence

- Full `dotnet build Exploitation.sln -c Release --no-restore`: PASS, zero warnings/errors.
- SitesApiChecks: PASS on PostgreSQL 18.6/Testcontainers and production API
  host. Complete original C1 suite plus Site exact/Region/Zone list and GET,
  union/empty/permission isolation, filter/count/page ordering, overflow,
  concealment, create/update/lifecycle/criticality, normalized global duplicate,
  references, immutable input, stale/invalid versions and denied durable effects.
- Separate HTTP factory retains real Identity user/context repositories and
  effective provider: persisted assignments, direct/list/create/criticality,
  revocation, contractor with broad persisted assignments, forged JWT/role/
  UserType/query/body authority, context ownership/isolation and denied effects PASS.
- Every successful Site HTTP mutation produces one durable obligation;
  Created, Updated field-level before/after, lifecycle and criticality payloads
  retain the frozen shapes. Four-field update and inactive-reference retention PASS.
- Injected audit persistence failure: sanitized 503 and rollback of Site,
  version and obligation count PASS; transient test trigger/function removed in finally.
- EndpointDataSource: exactly seven Site operations, no duplicate or DELETE;
  HTTP DELETE 405; frozen DTO/OpenAPI schemas and all-route authentication 401 PASS.
- All 11 executable Release harnesses PASS: SitesDomain, IdentityDomain,
  SitesPersistence, SitesApi, OrganizationPersistence, OrganizationApi,
  IdentityPersistence, Authentication, AuditPersistence, AuditDelivery, Architecture.
- SitesPersistence includes B1 migration/constraints, both Region create/deactivate
  race orderings, audit atomicity, Site authorization, real provider list/create,
  SITE-F1/SITE-F2 and original F1/F2 regressions. C1/OIDC/working-context regressions PASS.
- `dotnet test Exploitation.sln -c Release --no-build`: PASS (exit 0); harnesses
  are executables, so this does not claim VSTest case discovery.
- Sites and Identity EF `has-pending-model-changes --configuration Release --no-build`:
  NONE. Design-time tooling uses a non-secret model-only connection string;
  no database access is needed for model comparison.
- Changed handwritten C# whitespace formatting, diff hygiene, Markdown relative
  references/conflict markers, ADR numbering and scoped secret hygiene PASS.

## Query and implementation boundaries

Published authorized list SQL service is unchanged: one effective-scope query
for fixed sites.read, then authorized filtered SQL count and bounded page query;
empty scopes short-circuit. Direct checks use a bounded authoritative Site/Region
join and one effective-scope query. Canonical authentication/context lookups are
additional request-level checks. No per-Site query/evaluator or Redis dependency.
Query-shape conclusion is based on source/SQL inspection, not a load benchmark.

DOCS_IMPACT: YES. DOCUMENTATION_SYNC: PASS for API guidelines, Sites module and
context capsule, architecture, security, backlog and task checkpoint. B1 and
authorization remain PUBLISHED; Site HTTP is IMPLEMENTED LOCALLY / VERIFIED.
No schema, migration, model snapshot, frontend, capabilities, DEV bootstrap,
positive contractor access or Accepted ADR changes. No merge/push.

## Limits and handoff

Runtime gates were run by the primary agent; reviewer independently inspected
source and coverage but did not rerun harnesses. WorkingContext audit uses the
established recording test seam in the HTTP factory; the separate existing
working-context/audit harnesses pass. Existing structural source-scan robustness
limitation in the published foundation is unchanged and does not indicate a
runtime finding. No hosted CI run for this local commit; no publication claim.

NEXT_ACTION: Independent SITE-API-01 security/integration review before publication.
RECOMMENDED_MODEL_NEXT: gpt-6-sol
RECOMMENDED_EFFORT_NEXT: high
