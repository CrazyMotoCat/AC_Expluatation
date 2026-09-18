# Traceability Matrix — АС «Эксплуатация»

STATUS: WORKING / OPTIONAL PERSISTENT TRACE
SOURCE_VERSION: 2026-09-18

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
