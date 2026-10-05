# TASK-02.04.02 — LOCATION-TREE-01R independent publication review

Date: 2026-10-06. Mode: BALANCED, directly on main.
BASELINE_SHA: 6b986f95fb431a31f7543696278f0910ac666be6
SOURCE_COMMIT: 02f2429644a8097148dd46b8ec86ed2d56961d0b
REMEDIATION_COMMIT: 8cbf2cbe899c97fa11998de5d2f657076a458202 (tests only)
REVIEW: PASS
DIFF_OWNERSHIP: PASS
UNRELATED_PATHS: NONE
OPEN_CRITICAL: 0
OPEN_HIGH: 0
OPEN_MEDIUM: 0
OPEN_LOW: 0
HIGHEST_SEVERITY: NONE

## Field contract gate

Pre-implementation accepted source is docs/database.md at exact published baseline, section 7.4, lines 883-898: description at 894, created_at at 896, updated_at at 897. These fields were not inferred from generic practice or candidate documentation. OD-LOCATION-05 permits existing metadata. Optional description follows the established bounded trim/max500 pattern. Timestamps are pre-existing schema metadata, server-maintained DateTimeOffset UTC at PostgreSQL microsecond precision. Private setters and all successful Domain mutations preserve CreatedAt and advance UpdatedAt; Move and lifecycle use the same Advance method. HTTP/OpenAPI exposes nine fields, no timestamps; mutation DTOs accept neither timestamp. No timestamp contract remediation required.

## Tree, persistence and transaction review

Sites-owned adjacency list, multiple null-parent roots, no type matrix/depth limit. Same-Site composite parent FK, Site/type FKs all RESTRICT; UNIQUE(site_id,code), no global/sibling-only uniqueness. UUIDv7, status, positive bigint row version and canonical code checks; DB trigger prevents ID/Site/code changes and DELETE. Query index (site_id,parent_location_id,code,id) supports roots/children/recursive child lookup; no speculative indexes added. Migration only extends Sites Location/audit binding; generated model matches it. Empty rollback allowed; populated rollback blocked pending archival plan.

LocationCommandStore acquires pg_advisory_xact_lock(hashtextextended(CAST(@site_id AS text),746219)) after BeginTransaction on the DbContext's same Npgsql connection/current transaction. PostgreSQL computes the deterministic key, not process-randomized GetHashCode. Hash collisions only add serialization. Create, update, move, activate and deactivate share this key. Immutable stored Site permits preliminary target-Site lookup; authoritative target/parent/version are reread after locking. READ COMMITTED statements see earlier serialized commits. Recursive CTE uses parameterized UNION over IDs, so corrupted cycles terminate. Checks, expected version, mutation and durable audit obligation commit together. ACTIVE type FOR SHARE protects changed assignments; unchanged inactive historical type remains valid.

Domain code trim/invariant uppercase/max50 has no regex; spaces, punctuation and hyphen remain allowed. Name trim/max200/nonunique. Code/Site never mutate. Move reason trim/nonempty/max500 is retained in canonical Audit; null parent creates root and subtree links remain attached. No cascade lifecycle, cross-Site transfer, DELETE, Location scope or LocationMoved integration emission. All successful mutations retain optimistic version independently of structural locking. Audit snapshot is bounded nine-field allowlist with actor/context/correlation and authoritative ancestry; technical Audit is not business history.

## Independent security/API closure

Read-only security_review independently inspected exact candidate and test additions, returning PASS with no implementation findings. Fixed sites.read vs sites.manage_locations have no implication. Stored Location -> Site -> Region -> Zone facts feed Sites coverage through Identity Application contracts; no cross-module DbContext access. INTERNAL active user/owned valid INTERNAL context/current assignment/exact permission required. Contractor and external Contract context deny; foreign context gets canonical WORKING_CONTEXT_UNAVAILABLE before endpoint. Missing/inaccessible Site/Location and missing/foreign parent share 403 GEOGRAPHY_ACCESS_DENIED. Query/header/body ancestry, scopes and permissions cannot grant access. Mutation result is the contracted nine-field operation response, not an implied read grant.

Lazy read returns roots or direct children only; default page1/size50/max200, code/id ASC, Site/parent filtering before count/page. Offset handles integer overflow safely. Seven authenticated routes and exact OpenAPI schema asserted; update accepts name/type/description/version only. No frontend or Site-card placeholder changes.

## Review findings and bounded closure

NOTE R-01: candidate evidence covered opposing moves and create/deactivate but omitted separate move/deactivate and child-activate/parent-deactivate races and explicit corrupted-graph cases. Closed by 8cbf2cb: real PostgreSQL lock contention, one winner/expected loser, persisted invariant/version/subtree and success-audit assertions, inactive intermediate child with active grandchild, corrupted cycle termination with timeout, and server timestamp assertion.

NOTE R-02: focused HTTP evidence omitted foreign context, Contract context, authority headers and manage-only update/move/lifecycle. Closed by 8cbf2cb through real production Identity provider. UserType has no External enum; external case is an INTERNAL user in Contract context, while Contractor user denial is separately tested. Zone and Region manage-only users execute all five mutations and still cannot GET. No existing assertions weakened or removed.

## Independently rerun validation

Release solution build PASS, zero warnings/errors. All 11 executable harnesses PASS after test changes: ArchitectureChecks, AuditDeliveryChecks, AuditPersistenceChecks, AuthenticationChecks, IdentityPersistenceChecks, OrganizationApiChecks, OrganizationPersistenceChecks, SitesApiChecks, SitesPersistenceChecks, IdentityDomainChecks, SitesDomainChecks. Location checks are included in Sites harnesses. Real Testcontainers PostgreSQL covers recursive queries, unique constraint, advisory lock waiters/opposing moves/three lifecycle races, version checks, audit atomic rollback and delivery. Existing Sites/reference/Geography/auth/Audit/Organization regressions retained.

dotnet test Release --no-build exit0, no discovered cases; explicit harnesses are functional evidence. Central migrator isolated smoke: 16 migrations, Sites7; second run0. Model drift NONE. Infrastructure DevScripts/CiWorkflow/DatabaseMigrator, bootstrap contract and runtime smoke PASS. Changed-file C# whitespace verify PASS; diff check PASS; secret-pattern scan zero matches. Isolated smoke container stopped; Testcontainers dispose their databases. Logs: artifacts/logs/location-tree-01r (ignored).

DOCS_IMPACT: YES (publication state and validation evidence)
DOCUMENTATION_REVIEW: PASS; Sites/Audit module and context, database, security/permissions/events, backlog and generated OpenAPI align with OD-LOCATION-01..08. Accepted ADR-003/008/011/017 preserved; no new ADR/index change required.
DOCUMENTATION_SYNC: PASS
HOSTED_CI: pending publication, never inferred from local tests.

NEXT_BACKLOG_TASK: no separate Location UI Task ID currently exists in backlog; later LOCATION-UI phase follows owner task definition. Do not invent a Task ID.
NEXT_ACTION: fetch baseline guard, normal push main and verify exact HEAD hosted backend/frontend/required checks. Then STOP.

## Exact candidate path ownership (53 paths)

- task checkpoint/review: `.agent/tasks/TASK-02.04.02/agents/location_api.md`
- task checkpoint/review: `.agent/tasks/TASK-02.04.02/agents/location_persistence.md`
- task checkpoint/review: `.agent/tasks/TASK-02.04.02/security-review.md`
- task checkpoint/review: `.agent/tasks/TASK-02.04.02/state.md`
- task checkpoint/review: `.agent/tasks/TASK-02.04.02/validation.md`
- task contract documentation: `docs/architecture.md`
- task contract documentation: `docs/backlog.md`
- task contract documentation: `docs/context/audit.context.md`
- task contract documentation: `docs/context/sites.context.md`
- task contract documentation: `docs/database.md`
- task contract documentation: `docs/events-registry.md`
- task contract documentation: `docs/modules/audit.md`
- task contract documentation: `docs/modules/sites.md`
- task contract documentation: `docs/permissions-registry.md`
- task contract documentation: `docs/security.md`
- Location HTTP/OpenAPI/composition: `src/backend/Exploitation.Api/Program.cs`
- Location HTTP/OpenAPI/composition: `src/backend/Exploitation.Api/Sites/LocationEndpoints.cs`
- Location HTTP/OpenAPI/composition: `src/backend/Exploitation.Api/Sites/LocationOpenApi.cs`
- Location HTTP/OpenAPI/composition: `src/backend/Exploitation.Api/Sites/SiteOpenApi.cs`
- canonical Location audit extension: `src/backend/Modules/Audit/Exploitation.Modules.Audit.Contracts/AuditAction.cs`
- canonical Location audit extension: `src/backend/Modules/Audit/Exploitation.Modules.Audit.Contracts/AuditEntityType.cs`
- canonical Location audit extension: `src/backend/Modules/Audit/Exploitation.Modules.Audit.Contracts/AuditPayloadValidator.cs`
- canonical Location audit extension: `src/backend/Modules/Audit/Exploitation.Modules.Audit.Infrastructure/Persistence/AuditEvent.cs`
- Location Application/read ports: `src/backend/Modules/Sites/Exploitation.Modules.Sites.Application/Locations/AuthorizedLocationReadService.cs`
- Location Application/read ports: `src/backend/Modules/Sites/Exploitation.Modules.Sites.Application/Locations/IAuthorizedLocationReadService.cs`
- Location Application/read ports: `src/backend/Modules/Sites/Exploitation.Modules.Sites.Application/Locations/ILocationCommandStore.cs`
- Location Application/read ports: `src/backend/Modules/Sites/Exploitation.Modules.Sites.Application/Locations/ILocationReadStore.cs`
- Location Application/read ports: `src/backend/Modules/Sites/Exploitation.Modules.Sites.Application/Locations/LocationCommandErrors.cs`
- Location Application/read ports: `src/backend/Modules/Sites/Exploitation.Modules.Sites.Application/Locations/LocationCommandHandlers.cs`
- Location Application/read ports: `src/backend/Modules/Sites/Exploitation.Modules.Sites.Application/Locations/LocationReadModel.cs`
- Location Domain: `src/backend/Modules/Sites/Exploitation.Modules.Sites.Domain/Locations/Location.cs`
- Location Domain: `src/backend/Modules/Sites/Exploitation.Modules.Sites.Domain/Locations/LocationStatus.cs`
- Sites persistence/configuration/audit: `src/backend/Modules/Sites/Exploitation.Modules.Sites.Infrastructure/Persistence/AuditObligation.cs`
- Sites persistence/configuration/audit: `src/backend/Modules/Sites/Exploitation.Modules.Sites.Infrastructure/Persistence/Configurations/AuditObligationConfiguration.cs`
- Sites persistence/configuration/audit: `src/backend/Modules/Sites/Exploitation.Modules.Sites.Infrastructure/Persistence/Configurations/LocationConfiguration.cs`
- Sites persistence/configuration/audit: `src/backend/Modules/Sites/Exploitation.Modules.Sites.Infrastructure/Persistence/LocationAuditSnapshot.cs`
- Sites persistence/configuration/audit: `src/backend/Modules/Sites/Exploitation.Modules.Sites.Infrastructure/Persistence/LocationCommandStore.cs`
- Sites persistence/configuration/audit: `src/backend/Modules/Sites/Exploitation.Modules.Sites.Infrastructure/Persistence/LocationReadStore.cs`
- one Location migration/generated EF model: `src/backend/Modules/Sites/Exploitation.Modules.Sites.Infrastructure/Persistence/Migrations/20261002095936_AddLocations.Designer.cs`
- one Location migration/generated EF model: `src/backend/Modules/Sites/Exploitation.Modules.Sites.Infrastructure/Persistence/Migrations/20261002095936_AddLocations.cs`
- one Location migration/generated EF model: `src/backend/Modules/Sites/Exploitation.Modules.Sites.Infrastructure/Persistence/Migrations/SitesDbContextModelSnapshot.cs`
- Sites persistence/configuration/audit: `src/backend/Modules/Sites/Exploitation.Modules.Sites.Infrastructure/Persistence/SitesDbContext.cs`
- Sites persistence/configuration/audit: `src/backend/Modules/Sites/Exploitation.Modules.Sites.Infrastructure/SitesModuleRegistration.cs`
- targeted harness/regression: `tests/architecture/Exploitation.ArchitectureChecks/Program.cs`
- targeted harness/regression: `tests/integration/Exploitation.AuditDeliveryChecks/Program.cs`
- targeted harness/regression: `tests/integration/Exploitation.AuditPersistenceChecks/Program.cs`
- targeted harness/regression: `tests/integration/Exploitation.OrganizationPersistenceChecks/Program.cs`
- targeted harness/regression: `tests/integration/Exploitation.SitesApiChecks/LocationHttpChecks.cs`
- targeted harness/regression: `tests/integration/Exploitation.SitesApiChecks/Program.cs`
- targeted harness/regression: `tests/integration/Exploitation.SitesApiChecks/SiteHttpChecks.cs`
- targeted harness/regression: `tests/integration/Exploitation.SitesPersistenceChecks/LocationChecks.cs`
- targeted harness/regression: `tests/integration/Exploitation.SitesPersistenceChecks/Program.cs`
- targeted harness/regression: `tests/unit/Exploitation.SitesDomainChecks/Program.cs`
