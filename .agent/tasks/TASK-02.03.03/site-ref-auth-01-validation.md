# SITE-REF-AUTH-01 validation evidence

Task: TASK-02.03.03. Baseline and commit parent: `e099be23554c34b9d668b5297437a5f54af9d8d5`.
Branch: `codex/task-02.03.03-site-ref-auth`. All commands run in the isolated backend worktree.
Local checks only; no new hosted CI run, push or merge. Owner-reported baseline CI #29 was not reverified.

## Implementation and scope

Only GET `/api/v1/reference/site-types` and GET `/api/v1/reference/site-criticality-classes`
switch from legacy target-blind RequirePermission to HTTP authentication/context validation,
Sites-owned fixed-set catalog authorization, then their unchanged reference handlers/DTO projections.
`ISiteReferenceCatalogAuthorizationService.CanReadAsync(userId, contextId, cancellationToken)`
requests sites.read, sites.create, sites.change, sites.change_criticality sequentially through
IEffectiveScopeProvider; maximum four calls, stopping at the first supported non-empty scope set.
No caller permission, scope collection or geographic evidence. Provider exceptions deny immediately;
cancellation propagates. Existing Identity eligibility enforces ACTIVE INTERNAL user, owned valid
INTERNAL context, role/permission, current effective assignment and representable exact geographic scope.
Global catalogs include ACTIVE and INACTIVE values and are never geographically filtered.
No Site permission implication or escalation; global grant source and existing geographic/Site checks unchanged.

## Runtime and static gates

- Full `dotnet build Exploitation.sln --configuration Release`: PASS; 0 warnings/errors.
- `dotnet test Exploitation.sln --configuration Release --no-build`: exit 0; no standard test discovery.
  Explicit executable harnesses below provide the substantive test evidence.
- IdentityDomainChecks, SitesDomainChecks, ArchitectureChecks: PASS.
- IdentityPersistenceChecks (real PostgreSQL, effective scopes/exact grants/context/validity): PASS.
- AuthenticationChecks (OIDC/session and working contexts): PASS.
- SitesPersistenceChecks (catalog persistence, Sites/Geography scope composition, SITE-F1/SITE-F2,
  original F1/F2, locked parent/concurrency/audit): PASS.
- SitesApiChecks: PASS after final test delta and formatting. Existing C1/Site/permission-isolation,
  real-provider Site HTTP/list matrices and new reference matrix all execute in this harness.
- AuditPersistenceChecks, AuditDeliveryChecks: PASS.
- OrganizationPersistenceChecks, OrganizationApiChecks: PASS.
- All 11 explicit solution executable check harnesses: PASS.
- Sites and Identity `dotnet ef migrations has-pending-model-changes`, Release/no-build,
  module Infrastructure as both project/startup: PASS, no pending model changes.
  Design-time connection uses local nonproduction model-check settings; no schema write.
- `dotnet format Exploitation.sln --no-restore --verify-no-changes --include <changed C# paths>`: PASS.
- `git diff --check`: PASS.
- Changed-file Markdown local links, conflict markers and secret-pattern hygiene: PASS.
- No frontend, schema/migration, dependency, DTO/data/query ordering or Accepted ADR diff.

## Catalog acceptance matrix

Both paths use real Identity and PostgreSQL with production DI and JWT authentication:
read Zone/Region/Site, create-only, change-only, criticality-only and multiple permissions → 200;
no permission, unrelated canonical permission, future/expired/revoked assignment, wrong context,
contractor, external context, inactive user/role and composite scope → 403;
unauthenticated → 401. Authorized users without context or with unknown context → 403.
Denied users cannot bypass via permission/effectiveScopes/siteId/regionId/zoneId/userId query strings.
All allowed subjects receive identical four-row catalogs, including isolated INACTIVE fixtures;
existing DTO field/order/seed assertions retained. Real-provider requests do not override global grants.
Tiny exact Site scope exposes only its Site and no parent Region/Zone or sibling Site after catalog access.
Criticality-only cannot read/create/ordinarily update Sites; create-only cannot read Sites.
Denied Site commands and catalog reads leave Site/version/audit-obligation state unchanged.
HTTP provider fault with configured valid scope → canonical 403 ACCESS_DENIED on both paths.
Service probes verify bounded fixed permission order, short-circuit, empty results, malformed scope,
provider failure without fallback and cancellation. Structural checks forbid caller evidence in contract.

## Documentation impact and synchronization

DOCS_IMPACT: YES (API authorization and Sites public application composition).
DOCUMENTATION_SYNC: PASS. Sites module/context, security, existing API catalog descriptions and
reference-data registry synchronized with SITE-REF-OD-01/02/03; task checkpoint updated.
Database/model, permission seeds, paths, DTOs, catalog values and ADR index remain unchanged.
No new ADR: bounded Sites-owned catalog policy using existing Identity Application scope contract,
without changing the authorization model, module ownership or fundamental architecture.
Independent review is recorded separately before the one authorized local commit.

## Next action

Independent publication review of SITE-REF-AUTH-01; then publish only with new authorization.
Resume SITE-UI-01 from the published baseline in its preserved branch. No frontend work in this phase.

## SITE-REF-AUTH-01R final review and main integration

Final review revalidated the exact diff `e099be23554c34b9d668b5297437a5f54af9d8d5..563ab4d2f83a8213b7da793e50496db077a48f08`.
Scope is limited to the two read-only reference GET authorizers, the fixed Sites authorization composition,
tests, and corresponding task/API/Sites/security/reference documentation. No Site CRUD, Zone/Region,
global grant source, frontend, schema, migration, dependency, or unrelated route changes were found.
Final classification: OPEN_CRITICAL=0, OPEN_HIGH=0, OPEN_MEDIUM=0, OPEN_LOW=0.

The candidate was fast-forwarded to local `main` from the exact expected baseline. The post-integration
verification was repeated on `main` and passed: Release build (0 warnings/errors), `dotnet test` command
(exit 0; executable harnesses are the substantive checks), all 11 explicit executable harnesses,
including real PostgreSQL/HTTP catalog, Site, Geography, F1/F2, SITE-F1/SITE-F2 and C1 regressions;
OIDC/working-context and architecture checks; Sites and Identity pending-model-change checks (none);
changed-file formatting and `git diff --check`. A first architecture harness invocation used the other
checkout as its source-scan root; it was rerun from this worktree and passed before integration, then passed
again from `main`.

No remediation commit was required. No medium-or-higher finding blocks publication. Main push and hosted CI
are separate gates; this checkpoint does not claim either until the exact final main SHA is directly verified.
