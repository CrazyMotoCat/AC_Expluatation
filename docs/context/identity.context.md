# Identity Context Capsule

SOURCE_VERSION: 2026-09-19
MODULE: Identity

## PURPOSE

Модуль Identity отвечает за локальный профиль пользователя, роли, permissions, access assignments и рабочие контексты. Authentication делегируется внешнему Identity Provider через OIDC/OAuth2; пароли в АС не хранятся.

## OWNS

- User
- Role
- Permission
- RolePermission
- AccessAssignment
- UserContext
- authentication mapping to external subject
- active working context

## DB

Реализовано:

- `identity.users`
- `identity.roles`
- `identity.permissions`
- `identity.role_permissions`

Module-owned `IdentityDbContext`, migrations и `identity.__ef_migrations_history` следуют ADR-010. Canonical unique index: `(external_issuer, external_subject)`.

Role/permission persistence добавлена `TASK-01.02.01`: unique codes, optimistic Role `row_version`, composite `(role_id, permission_id)`, restrictive FKs и migration-owned seed canonical permission catalog.

Планируется следующими задачами:

- `identity.access_assignments`
- `identity.user_contexts`

## CORE MODEL

Authorization:

```text
Authenticated Identity
+
Role
+
Permission
+
Scope
+
Working Context
+
Validity
```

Scope может включать:

- territorial zone;
- region;
- site;
- functional direction;
- asset type.

Working context:

- INTERNAL
- CONTRACT
- PROJECT
- DELEGATION
- TEAM

## INVARIANTS

- Пароли пользователей не хранятся в приложении.
- External identity уникальна по composite exact opaque `issuer + subject` без trim/case normalization; email не является ключом.
- Первый local profile требует trusted canonical `user_type`; отсутствие/невалидность fail closed.
- Синхронизация меняет только bounded optional display name/email и не меняет type/status; oversized claim игнорируется.
- `UserStatus`: `ACTIVE`, `INACTIVE`; inactive profile с валидным token получает deny.
- Frontend permission check не является security boundary.
- Любой backend endpoint проверяет permission и scope.
- Наличие UUID сущности не даёт право на доступ.
- Access assignment действует только в пределах `valid_from` / `valid_to`.
- Пользователь может иметь несколько рабочих контекстов.
- Активный контекст должен принадлежать пользователю.
- Contractor access не определяется только типом пользователя.
- Contractor access должен учитывать organization, contract, assignment, scope и validity.
- Expired contract/assignment не даёт operational access.
- Делегирование всегда ограничено сроком и scope.
- Административные права должны быть минимальными.
- Audit должен сохранять user + working context для критичных действий.
- Role только группирует permissions и не выдаёт доступ без assignment/scope/context/validity.
- Canonical permission code уникален, имеет lowercase формат `<module>.<action>` и совпадает с `permissions-registry.md`.
- Security-critical Role active state использует optimistic concurrency без silent overwrite.
- Permission policy принимает только canonical seeded code, требует active local profile и явный grant по canonical permission ID; token claims, `UserType` и имя роли не являются grants.
- До появления `access_assignments` production grant source всегда отказывает; permission-protected business endpoints не открываются без scope/context/validity evaluation.

## PERMISSIONS

Базовые naming conventions:

```text
<module>.<action>
```

Примеры:

- `assets.read`
- `assets.create`
- `assets.change`
- `maintenance.execute`
- `workorders.execute`
- `workorders.approve`
- `inventory.execute`
- `incidents.manage`

Identity не должен знать все бизнес-правила других модулей; он предоставляет механизм проверки permissions/scope.

## PUBLIC CONTRACTS

Реализованные runtime contracts:

- `ICurrentUser`
- `AuthenticatedUser`
- `ExternalIdentityKey` (`issuer + subject`)
- local profile result (`userId`, identity key, display name/email, user type/status) через `GET /api/v1/me`
- `IPermissionGrantSource` для явного grant; текущая production реализация deny-by-default
- API `RequirePermission` convention для canonical policy code; `GET /api/v1/me` остаётся authenticated self-profile bootstrap

Планируемые контракты последующих задач:

- `IWorkingContext`
- `IAuthorizationService`
- `UserReference`
- `AccessScope`
- `WorkingContextReference`

Другие модули не должны напрямую читать таблицы Identity ради бизнес-проверки доступа.

`ClaimsPrincipal`, JWT и `HttpContext` остаются на API boundary. Runtime contract не является persistence entity. API boundary извлекает configured trusted `user_type` claim в clean runtime input; Application/Domain не зависят от JWT, ASP.NET Core или Keycloak.

## EVENTS

Основные события:

- `UserActivated`
- `UserDeactivated`
- `RoleAssigned`
- `RoleRevoked`
- `WorkingContextActivated`
- `AccessAssignmentCreated`
- `AccessAssignmentExpired`

События добавляются только при реальной необходимости межмодульной реакции.

## DEPENDS_ON

Допустимо:

- external IdP abstraction;
- Organization contracts;
- Contractors contracts;
- shared clock/correlation abstractions.

Identity не должен зависеть от business infrastructure других модулей.

## AUTHORIZATION FLOW

Рекомендуемый порядок проверки:

```text
1. authenticated?
2. permission?
3. active working context?
4. context belongs to user?
5. scope covers target?
6. assignment valid?
7. contractor-specific restrictions?
8. separation-of-duties / critical policy?
```

## CONTRACTOR RULES

Для подрядчика обязательно учитывать:

```text
User
→ Contractor Organization
→ Contract
→ User Contract Assignment
→ Contract Scope
→ Validity
```

Одна external person identity может участвовать в нескольких организациях и договорах через разные контексты.

## AUDIT

Критичные изменения Identity должны создавать audit event:

- роль;
- permission assignment;
- activation/deactivation;
- contractor context;
- delegation;
- emergency access.

## FORBIDDEN

- хранить password hash в core app при использовании внешнего IdP;
- проверять доступ только по role;
- давать contractor broad access по `user_type`;
- доверять context ID без проверки ownership;
- использовать frontend как единственную проверку;
- физически удалять критичную историю access assignment;
- создавать скрытый `AllowAllAuth`;
- логировать access/refresh tokens.

## TOP_TEST_RISKS

- invalid token signature, issuer, audience or lifetime;
- missing trusted issuer or subject;
- accidental use of mutable email as identity key;
- missing/invalid trusted user type during first provisioning;
- token sync overwriting stored user type/status;
- concurrent first-login duplication or silent profile overwrite;
- wrong region but correct role;
- wrong site scope;
- wrong working context;
- expired assignment;
- expired contract;
- contractor cross-contract leakage;
- user switching to context they do not own;
- admin privilege escalation;
- duplicate or undocumented permission seed;
- duplicate role-permission relationship;
- destructive deletion of referenced roles/permissions;
- inactive user with valid token;
- authorization bypass by direct entity ID.
