# LOCATION-TREE-01 API/Application checkpoint

Status: CODE_READY; targeted Release build and real PostgreSQL SitesApiChecks PASS.

Baseline: main/origin/main `6b986f95fb431a31f7543696278f0910ac666be6`; no branch, worktree, commit or push made by this agent. Owner decisions OD-LOCATION-01..08 accepted; backend only.

Owned implementation:
- `Sites.Application/Locations`: `LocationReadModel`, `LocationPage`, `ILocationReadStore`, `IAuthorizedLocationReadService`, concrete authorized read service, and create/update/move/activate/deactivate command handlers. The fixed permissions are internal: `sites.read` for list/get and `sites.manage_locations` for mutations. Public authorization methods accept user/context and target IDs only; location ownership is read from stored Location. Create pre-resolves a supplied parent to conceal missing/cross-Site targets; command store repeats the check under Site lock.
- `Sites.Infrastructure/Persistence/LocationReadStore.cs`: `AsNoTracking` projections, roots/direct-children filters, code/id ordering, bounded paging.
- `SitesModuleRegistration.cs`: Location read/command ports, authorization service and handlers.
- API `LocationEndpoints.cs`, `LocationOpenApi.cs`, `Program.cs`: `GET/POST /api/v1/sites/{siteId}/locations`, `GET/PUT /api/v1/locations/{locationId}`, `POST /api/v1/locations/{locationId}/move|activate|deactivate`. Route Site is authoritative for create; body has no Site field. Direct mutations derive Site from stored Location. Current user/context resolution uses GeographyRequestAuthorization. Denial is 403 `GEOGRAPHY_ACCESS_DENIED`; Location business conflicts, validation, reference and persistence errors are mapped to stable codes.
- `SitesApiChecks/LocationHttpChecks.cs` and runner call: real PostgreSQL/Identity HTTP coverage for Zone/Region/Site scopes on separate read/manage permissions, manage-only/read-only negative routes, contractor/future/expired/wrong-context denial, forged body/query authority, missing v4/v7 and cross-Site parent concealment, roots/direct-child ordering/page, get, create/update/move/lifecycle, immutable fields, duplicate code, stale version, cycle and active descendant rejection, retained historical inactive type, server-attributed audit obligations and unchanged state/audit on rejected requests.

Verified: `git diff --check` on owned tracked paths passed. First build raced migration regeneration and reported CS2001 for transient old AddLocations migration filenames; persistence agent regenerated migration as `20261002095936_AddLocations`. The later targeted Release build and PostgreSQL harness passed after migration stabilization.

Follow-up after primary Release build passed: existing Site route assertion captured the new nested Location paths. `SiteHttpChecks.AssertSiteRoutesAsync` now excludes `/locations` and still asserts exactly seven Site operations. `SiteOpenApi` likewise excludes the nested Location path so `LocationOpenApi` alone adds its Bearer/403 metadata. `LocationOpenApi` matches the nested path independent of `{siteId:guid}` route-constraint formatting. `LocationHttpChecks` asserts exactly seven approved Location operations (no DELETE), all request/response DTO field sets, and each generated operation's single Bearer requirement plus Location concealment 403 description.

Final targeted verification: `dotnet build tests/integration/Exploitation.SitesApiChecks/Exploitation.SitesApiChecks.csproj -c Release --no-restore` PASS, zero warnings/errors. `dotnet run --project tests/integration/Exploitation.SitesApiChecks/Exploitation.SitesApiChecks.csproj -c Release --no-build` PASS (exit 0), including real PostgreSQL `LOCATION-TREE-01` HTTP checks and all existing Sites API checks.

NEXT_ACTION: Primary integrates final review/docs/architecture results; API/Application code is frozen unless a concrete final finding requires a focused repair.

DO_NOT_REPEAT: Do not regenerate migration or modify persistence agent files. Do not run concurrent MSBuild. Do not start frontend, branch/worktree, commit or push.
