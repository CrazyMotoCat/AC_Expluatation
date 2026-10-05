# LOCATION-TREE-01 validation record

Date: 2026-10-02. Baseline: 6b986f95fb431a31f7543696278f0910ac666be6 on main. All evidence is local; no push or hosted-CI claim.

- dotnet build Exploitation.sln --configuration Release --no-restore: PASS, zero warnings/errors.
- dotnet run --project <named harness .csproj> -c Release --no-build: IdentityDomainChecks, SitesDomainChecks, ArchitectureChecks, AuthenticationChecks, IdentityPersistenceChecks, SitesPersistenceChecks, SitesApiChecks, AuditPersistenceChecks, AuditDeliveryChecks, OrganizationPersistenceChecks, OrganizationApiChecks all PASS.
- PostgreSQL persistence/API harnesses use real Testcontainers PostgreSQL, not SQLite or in-memory providers. Tree concurrency uses observed pg_locks contention under the exact Site advisory lock, releases simultaneous contenders and checks the persisted graph/state. Depth >32, unique per-Site code, same-Site parent FK, immutable identity/no delete, version conflicts and failed-audit rollback covered.
- Central DatabaseMigrator against an isolated ephemeral PostgreSQL container: initial smoke PASS (16 total, Sites seven); repeat PASS (zero applied). No user database or volumes modified.
- dotnet ef migrations has-pending-model-changes --project src/backend/Modules/Sites/Exploitation.Modules.Sites.Infrastructure --context SitesDbContext --configuration Release --no-build: PASS, no changes.
- dotnet test Exploitation.sln -c Release --no-build: exit 0; no discovered cases. Executable harnesses supply the functional verification.
- tests/infrastructure DevScripts.Tests.ps1, CiWorkflow.Tests.ps1, DatabaseMigrator.Tests.ps1, ApiBootstrapSmoke.Contract.Tests.ps1 and tests/e2e/ApiBootstrapSmoke.Tests.ps1: PASS.
- Changed-file dotnet format whitespace --verify-no-changes: PASS. git diff --check: PASS. Changed-file private-key/token pattern scan: PASS.
- Exact seven Location operations and OpenAPI schemas/security/concealment descriptions verified in the HTTP harness. Existing seven Site operations preserved.
- Independent read-only security closure: PASS, all open severity counts zero. Docs impact YES; documentation sync PASS. Frontend/Site card unchanged.

Ignored execution logs: artifacts/logs/location-tree-01/{release-build-final,sites-persistence-final,sites-api-final,audit-persistence-final,audit-delivery-final,identity-persistence,authentication,organization-persistence-final,organization-api-final,migration-smoke,migration-idempotency,api-bootstrap-smoke,dotnet-test}.log. Logs are local evidence and intentionally not included in the task commit.

The task-owned temporary migration smoke container is stopped before final delivery. Testcontainers dispose their databases. Passing gates need no repetition unless the implementation changes. Final staged check/stat/full diff inspection and factual commit/parent/ahead/clean checks occur after this record is saved.
