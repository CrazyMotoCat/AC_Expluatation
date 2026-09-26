# Traceability Matrix — АС «Эксплуатация»

STATUS: WORKING / OPTIONAL PERSISTENT TRACE
SOURCE_VERSION: 2026-09-26 (TASK-02.03.02 SiteCriticality traceability)

## Назначение

Матрица связывает значимые backlog-задачи с требованиями, бизнес-правилами, permissions, lifecycle, events, реализацией, тестами и документацией.

Она не должна дублировать полные требования.

Основной формат:

| Task | AC | BR | Permission | Lifecycle | Event | Implementation | Tests | Docs | Status |
|---|---|---|---|---|---|---|---|---|---|

## Status

- `COVERED`
- `PARTIAL`
- `MISSING`
- `CONFLICT`
- `N/A`

## Правила

1. Одна строка — один meaningful trace path.
2. Не создавать строки для trivial formatting/refactor.
3. Ссылаться на `BR-*`, а не копировать текст правил.
4. Permission брать только из `permissions-registry.md`.
5. Lifecycle брать только из `lifecycle-registry.md`.
6. Event брать только из `events-registry.md`.
7. Test указывать конкретным test name/path, когда он существует.
8. Docs перечислять только реально затронутые source-of-truth файлы.
9. Matrix обновляет один documentation owner.
10. Если task не нуждается в persistent trace, достаточно отчёта `traceability-checker`.

## Example

| Task | AC | BR | Permission | Lifecycle | Event | Implementation | Tests | Docs | Status |
|---|---|---|---|---|---|---|---|---|---|
| `TASK-03.04.01` | `AC-01` | `BR-AST-001` | `assets.create` | N/A | `AssetCreated` | `CreateAsset` use case | `CreateAsset_WithValidData_CreatesAsset` | `modules/assets.md`, `context/assets.context.md` | COVERED |
| `TASK-03.04.01` | `AC-02` | `BR-AST-002` | `assets.create` | N/A | N/A | site/location validation | `CreateAsset_LocationFromAnotherSite_Fails` | `modules/assets.md` | COVERED |
| `TASK-03.04.01` | `AC-03` | `BR-AST-003` | `assets.create` | N/A | N/A | model/type validation | `CreateAsset_ModelTypeMismatch_Fails` | `modules/assets.md` | COVERED |

## Bootstrap / Infrastructure

Для `EPIC-00` persistent trace обычно не обязателен.

Использовать checker report для:

- architecture constraints;
- security checks;
- infrastructure acceptance criteria;
- documentation consistency.

Persistent строки добавлять только если появляется долгоживущее архитектурное требование.

## Identity

| Task | AC | BR | Permission | Lifecycle | Event | Implementation | Tests | Docs | Status |
|---|---|---|---|---|---|---|---|---|---|
| `TASK-01.01.02` | `AC-01 canonical issuer + subject unique` | N/A | N/A — own-profile bootstrap | N/A | N/A | `IdentityDbContext`, `UserConfiguration`, `UserProfileRepository` | `Exploitation.IdentityPersistenceChecks`: repeat provisioning and same subject with different issuers | `database.md`, `modules/identity.md`, `context/identity.context.md` | COVERED |
| `TASK-01.01.02` | `AC-02 user type stored from trusted claim` | N/A | N/A — type grants no permission | N/A | N/A | `GetOrProvisionCurrentUserHandler`, `OidcAuthenticationOptions.UserTypeClaim` | `Exploitation.AuthenticationChecks`: missing/invalid type; `Exploitation.IdentityPersistenceChecks`: immutable stored type | `security.md`, `api-guidelines.md`, `reference-data-registry.md` | COVERED |
| `TASK-01.01.02` | `AC-03 ACTIVE/INACTIVE stored and inactive blocked` | N/A | N/A — status is a deny gate | `Identity Local User` | N/A — admin transition out of scope | `UserStatus`, `UserConfiguration`, `GetOrProvisionCurrentUserHandler` | `Exploitation.IdentityDomainChecks`: transitions; `Exploitation.AuthenticationChecks`: inactive denial | `lifecycle-registry.md`, `modules/identity.md`, `security.md` | COVERED |
| `TASK-01.01.02` | `AC-04 idempotent synchronization without silent overwrite` | N/A | N/A — own-profile bootstrap | `Identity Local User` | N/A | unique-key retry plus optimistic `row_version` concurrency | `Exploitation.IdentityPersistenceChecks`: concurrent provisioning and stale-write rejection; `Exploitation.AuthenticationChecks`: repeated conflict returns 409 | `database.md`, `modules/identity.md`, `context/identity.context.md` | COVERED |
| `TASK-01.02.01` | `AC-01 roles persisted` | `BR-IDN-002` — role alone is insufficient | N/A — no role-management use case/API in this task | Role active flag is persisted; administrative lifecycle is out of scope | N/A | `Role`, `RoleConfiguration`, optimistic `row_version`, `AddIdentityRolesAndPermissions` | `Exploitation.IdentityDomainChecks`: invariants/active flag; `Exploitation.IdentityPersistenceChecks`: unique role code and stale-writer rejection | `database.md`, `modules/identity.md`, `context/identity.context.md` | COVERED |
| `TASK-01.02.01` | `AC-02 permissions persisted` | `BR-IDN-002` | N/A — catalog persistence only | N/A | N/A | `Permission`, `PermissionConfiguration`, unique `code` | `Exploitation.IdentityDomainChecks`: canonical code format; `Exploitation.IdentityPersistenceChecks`: unique code | `permissions-registry.md`, `database.md` | COVERED |
| `TASK-01.02.01` | `AC-03 role_permissions persisted` | `BR-IDN-002` | N/A — assignment/enforcement follows in later tasks | N/A | N/A | `RolePermission`, composite PK, restrictive FKs | `Exploitation.IdentityPersistenceChecks`: duplicate mapping and referenced role/permission deletion rejected | `database.md`, `modules/identity.md` | COVERED |
| `TASK-01.02.01` | `AC-04 canonical system permission seed` | `BR-IDN-001`, `BR-IDN-002` | Canonical catalog; no roles or mappings are seeded | N/A | N/A | `SystemPermissionCatalog`, migration seed | `Exploitation.IdentityPersistenceChecks`: exact tuple seed, zero grants, idempotent migration, previous-release user preserved | `permissions-registry.md`, `context/identity.context.md` | COVERED |
| `TASK-01.02.01` | `AC-05 permission codes documented` | N/A | Canonical codes documented; provisional codes excluded | N/A | N/A | registry-to-catalog consistency contract | `Exploitation.IdentityDomainChecks`: documented codes equal seeded catalog | `permissions-registry.md` | COVERED |
| `TASK-01.02.02` | `AC-01 endpoint can require specific permission` | `BR-IDN-001`, `BR-IDN-002` | Canonical catalog code and ID only; scope/context/validity deferred with production deny | N/A | N/A | `PermissionEndpointExtensions`, registered ASP.NET Core policies, `PermissionAuthorizationHandler` | `Exploitation.AuthenticationChecks`: test endpoint with canonical policy and explicit test grant; unknown code rejected | `modules/identity.md`, `context/identity.context.md` | COVERED |
| `TASK-01.02.02` | `AC-02 backend 403 without permission` | `BR-IDN-001`, `BR-IDN-002` | No profile/grant, inactive profile, wrong permission and forged claims deny; no production grants before assignments | N/A | N/A | `PermissionAuthorizationHandler`, `NoAccessAssignmentPermissionGrantSource` | `Exploitation.AuthenticationChecks`: 401 unauthenticated; 403 missing profile/grant, inactive, forged claims, wrong permission and revoked grant; 200 explicit test grant | `modules/identity.md`, `context/identity.context.md` | COVERED |
| `TASK-01.02.02` | `AC-03 authorization tests` | `BR-IDN-001`, `BR-IDN-002` | Negative-first HTTP matrix; scope/context/contract rows deferred to subsequent tasks | N/A | N/A | test-host permission-protected route with validated JWT and explicit test grant source | `Exploitation.AuthenticationChecks`: permission authorization checks | `modules/identity.md`, `context/identity.context.md` | COVERED |
| `TASK-01.03.01` | `AC-01 assignment has validity` | `BR-IDN-002`, `BR-IDN-008` | N/A — no assignment-management API; production grant source remains deny | Access assignment active/revoked; time expiry is not status | N/A — no issuing use case in this task | `AccessAssignment`, `AccessAssignmentConfiguration`, `AddIdentityAccessAssignments` with `[valid_from, valid_to)` and finite delegation | `Exploitation.IdentityDomainChecks`: time boundaries/unbounded delegation denied; `Exploitation.IdentityPersistenceChecks`: migration, DB delegation check and concurrent revocation | `database.md`, `modules/identity.md`, `context/identity.context.md`, `lifecycle-registry.md` | COVERED |
| `TASK-01.03.01` | `AC-02 expired assignment does not grant access` | `BR-IDN-004`, `BR-IDN-002` | No operational grant before owned working context and contractor checks | Revoked or expired assignment ineligible | N/A | `AccessAssignment.IsApplicableTo`; unchanged `NoAccessAssignmentPermissionGrantSource` | `Exploitation.IdentityDomainChecks`: expiry/revocation negative; `Exploitation.IdentityPersistenceChecks`: persisted expiry and role-permission-plus-assignment still denied | `modules/identity.md`, `context/identity.context.md` | COVERED |
| `TASK-01.03.01` | `AC-03 scope evaluation unit-tested` | `BR-IDN-002`, `BR-IDN-003` | Five exact-match dimensions; target ancestry must be authoritative; no context grant yet | N/A | N/A | `AccessScope.Covers` and assignment eligibility, at-least-one-scope PostgreSQL check | `Exploitation.IdentityDomainChecks`: wrong zone/region/site/direction/asset type, missing dimension, wrong user/context and matching scope; `Exploitation.IdentityPersistenceChecks`: scope round-trip and active duplicate rejection | `database.md`, `modules/identity.md`, `context/identity.context.md` | COVERED |
| `TASK-01.03.02` | `AC-01 user sees own contexts` | `BR-IDN-001`, `BR-IDN-003`, `BR-IDN-007` | N/A — owner-approved own-context self-service; `identity.contexts.read` remains canonical for future permission-controlled use cases | UserContext active + `[valid_from, valid_to)` availability | N/A | `UserContext`, `UserContextRepository`, `WorkingContextSelfService.ListAsync`, `GET /api/v1/me/contexts` | `Exploitation.AuthenticationChecks`: 401, unknown/inactive profile, own-only list, expired/future/inactive filtering; `Exploitation.IdentityPersistenceChecks`: owner query | `modules/identity.md`, `context/identity.context.md`, `api-guidelines.md`, `security.md` | COVERED |
| `TASK-01.03.02` | `AC-02 select active context` | `BR-IDN-002`, `BR-IDN-007` | N/A — selected/applied context is not operational grant; production source DENY | Request-scoped context; unavailable/future/expired/inactive rejected | Audit actions `WorkingContextSelected` / `WorkingContextApplied` | `WorkingContextSelfService.SelectAsync` from POST body and `ApplyAsync` from ordinary request header; `appliedContextId` response | `Exploitation.AuthenticationChecks`: first header without POST audited before endpoint, POST exactly one Selected, malformed/unknown/unavailable, audit-failure 503 and unchanged deny; `Exploitation.AuditPersistenceChecks`: action round-trips | `modules/identity.md`, `database.md`, `api-guidelines.md` | COVERED |
| `TASK-01.03.02` | `AC-03 backend verifies ownership` | `BR-IDN-001`, `BR-IDN-003` | Own-context boundary only; contractor operational chain deferred | Owned active context required for body/header | N/A | owner-filtered repository plus Domain `IsAvailableTo`; request header middleware | `Exploitation.AuthenticationChecks`: foreign body/header IDOR; `Exploitation.IdentityPersistenceChecks`: foreign owner lookup denied | `modules/identity.md`, `context/identity.context.md`, `security.md` | COVERED |
| `TASK-01.03.02` | `AC-04 context recorded in audit` | ADR-008; N/A BR | N/A | AuditEvent append-only | Distinct `WorkingContextSelected` / `WorkingContextApplied` | Audit.Contracts writer, `AuditDbContext`, `InitialAuditEvents` migration/trigger and guarded `Down`; context exposed only after INSERT | `Exploitation.AuthenticationChecks`: header Applied before endpoint, POST exactly one Selected, failure 503; `Exploitation.AuditPersistenceChecks`: durable actions/actor/context/correlation, update/delete/truncate and destructive rollback rejection; migrator first/second run | `modules/audit.md`, `context/audit.context.md`, `database.md`, `backlog.md` | COVERED |
| `TASK-01.04.01` | `AC-01 append-only model` | ADR-008 | N/A — Audit is not an authorization source | Immutable `AuditEvent` after INSERT | `audit.events` remains one append-only table; generic writer uses INSERT only | `AuditDbContext` mutation guard, PostgreSQL UPDATE/DELETE/TRUNCATE rejection, rollback preservation in `Exploitation.AuditPersistenceChecks` | `modules/audit.md`, `context/audit.context.md`, `database.md` | COVERED |
| `TASK-01.04.01` | `AC-02 correlation/user/context metadata` | ADR-008 | N/A | Actor/correlation/context semantics preserved | `IAuditWriter.AppendAsync`, `AuditEventDraft`, typed working-context adapters | `Exploitation.AuditPersistenceChecks`: valid generic append, required user/correlation, selected/applied round-trip; `Exploitation.AuthenticationChecks`: audit failure blocks command | `modules/audit.md`, `context/audit.context.md`, `database.md`, `security.md` | COVERED |
| `TASK-01.04.01` | `AC-03 entity/action` | ADR-008 | N/A | Audit-owned stable identifiers | Canonical `AuditAction` / `AuditEntityType`; unknown identifiers rejected; existing persistent names unchanged | `Exploitation.AuditPersistenceChecks`: catalog rejection and durable action/entity assertions | `modules/audit.md`, `context/audit.context.md`, `database.md` | COVERED |
| `TASK-01.04.01` | `AC-04 critical commands create audit event` | ADR-008 | N/A — current context self-service boundary remains unchanged | `POST /api/v1/me/context` success follows durable audit | `WorkingContextAuditWriter` typed adapter → `IAuditWriter` → `AuditEvent` | `Exploitation.AuthenticationChecks`: audit failure → 503; `Exploitation.AuditPersistenceChecks`: canonical selected event and adapter allowlist | `modules/audit.md`, `context/audit.context.md`, `api-guidelines.md`, `security.md`, `backlog.md` | COVERED |

## Sites

| Task | AC | BR | Permission | Lifecycle | Event | Implementation | Tests | Docs | Status |
|---|---|---|---|---|---|---|---|---|---|
| `TASK-02.01.01` | `AC-01 code unique and canonical` | `BR-SIT-006` | `sites.create`, `sites.change` | Territorial Zone `ACTIVE`/`INACTIVE` | N/A — Audit action catalog is tracked in Audit module docs | `TerritorialZone` domain invariant and Sites unique index | `Exploitation.SitesDomainChecks`; `Exploitation.SitesPersistenceChecks` | `modules/sites.md`, `context/sites.context.md`, `business-rules-registry.md`, `lifecycle-registry.md` | COVERED |
| `TASK-02.01.01` | `AC-02 lifecycle and no hard delete` | `BR-SIT-007` | `sites.change` | `ACTIVE → INACTIVE`, `INACTIVE → ACTIVE`; creation starts `ACTIVE` | N/A — command state change is durably audited, not an integration event | activate/deactivate command endpoints; no DELETE route; immutable history constraints | `Exploitation.SitesDomainChecks`; `Exploitation.SitesApiChecks`; `Exploitation.SitesPersistenceChecks` | `modules/sites.md`, `context/sites.context.md`, `lifecycle-registry.md` | COVERED |
| `TASK-02.01.01` | `AC-03 authorization and scope boundary` | `BR-IDN-001`, `BR-IDN-002`, `BR-IDN-003` | `sites.read`, `sites.create`, `sites.change` | N/A | N/A | endpoint policies plus production deny-by-default grant source and request-scoped working context | `Exploitation.SitesApiChecks`; `Exploitation.AuthenticationChecks` | `permissions-registry.md`, `modules/sites.md`, `context/sites.context.md`, `security.md`, `api-guidelines.md` | COVERED |
| `TASK-02.01.01` | `AC-04 optimistic concurrency` | `BR-SIT-008` | `sites.change` | N/A | N/A | `expectedRowVersion` command precondition and standard 409 error contract | `Exploitation.SitesApiChecks`; `Exploitation.SitesPersistenceChecks` | `modules/sites.md`, `context/sites.context.md`, `api-guidelines.md`, `database.md` | COVERED |
| `TASK-02.01.01` | `AC-05 audit changes durably` | `BR-SIT-008` | N/A — audit is not an authorization source | N/A | N/A — canonical Audit actions are not domain/integration events | atomic Sites mutation + `audit_obligations`, technical at-least-once dispatcher, stable EventId idempotency | `Exploitation.SitesApiChecks`; `Exploitation.AuditDeliveryChecks`; `Exploitation.AuditPersistenceChecks` | `adr/ADR-011-durable-audit-obligation-outbox.md`, `modules/sites.md`, `modules/audit.md`, `context/sites.context.md`, `context/audit.context.md` | COVERED |
| `TASK-02.03.01` | configurable SiteType reference; four approved initial seed values; separation from criticality | `BR-SIT-001`, `BR-SIT-014` | `sites.read` for reference list; no mutation permissions | `ACTIVE`/`INACTIVE`, no hard delete, inactive remains readable | N/A — no SiteType mutation API | Sites-owned domain, `sites.site_types` additive migration, deterministic seed, read model and `GET /api/v1/reference/site-types` | Sites PostgreSQL persistence and API checks; Release build; architecture checks; hosted Build #17 | `reference-data-registry.md`, `database.md`, `modules/sites.md`, `context/sites.context.md`, `lifecycle-registry.md`, `api-guidelines.md`, `backlog.md` | COVERED |
| `TASK-02.03.02` | `AC-01` extensible SiteCriticality catalog; Sites ownership; UUIDv7; no hard delete; immutable identity; `ACTIVE`/`INACTIVE` lifecycle | `BR-SIT-015` | N/A — no management routes | `SiteCriticalityClass ACTIVE/INACTIVE`; no hard delete; inactive remains readable | N/A — no runtime mutation audit | `SiteCriticalityClass`, Sites EF configuration, `sites.site_criticality_classes`, generic code/status constraints and identity/delete trigger | `Exploitation.SitesDomainChecks`; `Exploitation.SitesPersistenceChecks`: extensible insert, constraints, identity and delete guards | `reference-data-registry.md`, `database.md`, `modules/sites.md`, `context/sites.context.md`, `lifecycle-registry.md`, `backlog.md` | COVERED |
| `TASK-02.03.02` | `AC-02` canonical NORMAL/KVO3/KVO2/KVO1 seeds with stable IDs, names and persisted ranks; rank unique and non-negative | `BR-SIT-015` | N/A | All initial rows `ACTIVE` | N/A | `20260926064400_AddSiteCriticalityClasses` seeds and rank/code indexes | `Exploitation.SitesPersistenceChecks`: exact seed tuples, unique/non-negative rank; `Exploitation.SitesApiChecks`: rank-ordered list | `reference-data-registry.md`, `database.md`, `modules/sites.md`, `backlog.md` | COVERED |
| `TASK-02.03.02` | `AC-03` global read-only reference GET, exact six-field DTO, persisted rank ordering, both statuses visible and no target filtering | `BR-SIT-015` | `sites.read`; no production grant implied | `ACTIVE` + `INACTIVE` visible | N/A — read-only | `GET /api/v1/reference/site-criticality-classes`, Sites read store orders by rank then code | `Exploitation.SitesApiChecks`: 200/401/403, UserType/role/JWT/context non-grants, seeds, order, inactive visibility, no target filtering or management routes, OpenAPI; SiteType regression | `api-guidelines.md`, `reference-data-registry.md`, `modules/sites.md`, `context/sites.context.md`, `backlog.md` | COVERED |

## Organization

| Task | AC | BR | Permission | Lifecycle | Event | Implementation | Tests | Docs | Status |
|---|---|---|---|---|---|---|---|---|---|
| `TASK-02.02.01` | arbitrary hierarchy, parent/child and cycle prevention | `BR-ORG-001`…`BR-ORG-009` | `organization.read`, `organization.create`, `organization.change`; scope deferred, deny-by-default | OrganizationalUnit `ACTIVE`/`INACTIVE`; no hard delete; type `ACTIVE`/`INACTIVE` | N/A — canonical Audit actions are not integration events | B1/B2 persistence, history, locked hierarchy commands and obligations; C1 Application handlers, seven HTTP routes and Identity seed; C2 dual-source AuditDelivery through module-owned ports | Organization persistence/API PostgreSQL checks, concurrency and atomicity; AuditDelivery crash/retry/fairness/Sites regression; Identity domain/persistence registry-seed equality; C3 API failure sanitization and architecture review | `adr/ADR-012-organizational-hierarchy-concurrency.md`, `database.md`, `modules/organization.md`, `context/organization.context.md`, `business-rules-registry.md`, `lifecycle-registry.md`, `permissions-registry.md`, `reference-data-registry.md`, `events-registry.md`, `backlog.md` | COVERED |
