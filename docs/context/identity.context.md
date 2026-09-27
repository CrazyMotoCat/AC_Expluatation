# Identity Context Capsule

SOURCE_VERSION: 2026-09-27 (AUTH-SCOPE-01 C1 publication; FRONTEND-AUTH-01)
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
- `identity.access_assignments`
- `identity.user_contexts`

Module-owned `IdentityDbContext`, migrations и `identity.__ef_migrations_history` следуют ADR-010. Canonical unique index: `(external_issuer, external_subject)`.

Role/permission persistence добавлена `TASK-01.02.01`: unique codes, optimistic Role `row_version`, composite `(role_id, permission_id)`, restrictive FKs и migration-owned seed canonical permission catalog.

`TASK-01.03.01` добавила assignment persistence: пять nullable scope dimensions (хотя бы одно обязательно), exact-match eligibility, validity `[valid_from, valid_to)`, обязательный конечный срок `DELEGATION`, отзыв без удаления с actor/time и optimistic `row_version`, restrictive FK и unique index для точных активных дубликатов при одинаковом `valid_from`.

`TASK-01.03.02` добавила owned `user_contexts` с `[valid_from, valid_to)`, active flag, finite delegation, restrictive User FK и optimistic `row_version`. Выбор context request-scoped, не persisted grant/selected flag.

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
- Assignment без scope не допускается; missing/wrong target dimension и чужой user/context не удовлетворяют assignment; target ancestry должен поступать из authoritative данных.
- Delegation всегда имеет конечный `valid_to`; revoked assignment не восстанавливается неявно и сохраняется как история.
- Пользователь может иметь несколько рабочих контекстов.
- Активный контекст должен принадлежать пользователю.
- Own-context list/select — отдельный self-service bootstrap для authenticated + ACTIVE local user; canonical `identity.contexts.read` остаётся для будущих permission-controlled сценариев.
- POST выбора подтверждается durable Audit-owned `WorkingContextSelected` по body и игнорирует header. На других `/api/v1` запросах `X-Work-Context-Id` перепроверяется и аудируется как `WorkingContextApplied` до endpoint. Оба действия не выдают permission.
- Contractor access не определяется только типом пользователя.
- Contractor access должен учитывать organization, contract, assignment, scope и validity.
- Expired contract/assignment не даёт operational access.
- Делегирование всегда ограничено сроком и scope.
- Административные права должны быть минимальными.
- Audit должен сохранять user + working context для критичных действий.
- Role только группирует permissions и не выдаёт доступ без assignment/scope/context/validity.
- Canonical permission code уникален, имеет lowercase формат `<module>.<action>` и совпадает с `permissions-registry.md`.
- `TASK-02.02.01` Phase C1 seeds Organization permission codes `organization.read`, `organization.create` and `organization.change` with registry-matched module and names; Company/OrganizationalUnit scope evaluation and access-assignment dimensions remain deferred and production remains deny-by-default.
- Security-critical Role active state использует optimistic concurrency без silent overwrite.
- Permission policy принимает только canonical seeded code, требует active local profile и явный grant по canonical permission ID; token claims, `UserType` и имя роли не являются grants.
- Target-blind production grant source всё ещё отказывает для остальных маршрутов: self-service ownership не является operational evaluation, а assignment match не проверяет authoritative target ancestry и contractor chain. C1 Geography routes используют Sites target-aware evaluation.
- `AUTH-SCOPE-01` B1 / ADR-013 ввёл `IEffectiveGrantEvaluator`; B2-B1 добавил Identity `IEffectiveScopeProvider` для exact permission-specific Zone/Region scopes через общую Identity eligibility query. Исходный B2-B2 trusted-target/scoped-store handoff заменён B2-R1 по ADR-016. Composite/unsupported assignment scopes не flatten-ятся, если это сбрасывает ограничение. C1 интегрировал Zone/Region HTTP routes через Sites services.
- ADR-016 / B2-R1 исправляет F1: публичный Identity target содержит только kind + exact ID; Region parent больше не принимается и Zone → Region expansion в Identity отсутствует. Sites загружает Region parent и проверяет покрытие через effective scopes от `IEffectiveScopeProvider`. B1 eligibility и exact scope сохранены. F2 scope-bearing public store удалён; финальная проверка B2 прошла и foundation интегрирован на main. C1-OD-01 задаёт единый 403 для отсутствующей и недоступной прямой цели.

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
- Implemented `IEffectiveScopeProvider` for immutable, distinct, permission-specific `TerritorialZone`/`Region` descriptors; C1 Geography routes consume it only through Sites application services
- API `RequirePermission` convention для canonical policy code; `GET /api/v1/me` остаётся authenticated self-profile bootstrap
- `GET /api/v1/me/contexts`, `POST /api/v1/me/context` для собственных available contexts; request header `X-Work-Context-Id` validated by API
- Browser frontend использует public OIDC Authorization Code + PKCE, единый session provider и Bearer/context pipeline; выбранный context browser-session scoped, повторно сверяется со списком available contexts; capabilities API пока не реализован
- `IWorkingContextAuditWriter` из Audit.Contracts для durable selection audit

Планируемые контракты последующих задач:

- `IWorkingContext` для будущего operational consumer (текущая request selection не является grant)
- `IAuthorizationService`
- `UserReference`
- `WorkingContextReference`

Другие модули не должны напрямую читать таблицы Identity ради бизнес-проверки доступа.

`IEffectiveScopeProvider` принимает local user, validated working context и один canonical permission. Identity owns the eligibility query and returns exact scopes only; it does not resolve the Zone/Region relationship. Permission scopes cannot be reused between actions. Effective scope DTOs are data, not capability tokens; Sites public application operations must acquire them internally. Empty scope means no authorized targets; contractors/external contexts return no scopes. Role name, UserType alone, JWT claims and context existence alone never grant.

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

`WorkingContextSelected` и `WorkingContextApplied` в текущем срезе — Audit actions, не integration events.

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
- требовать operational grant для own-context bootstrap или распространять self-service exception на admin endpoints;
- считать selected context permission grant;
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
- unbounded delegation, missing scope dimension, duplicate active assignment, stale concurrent revocation;
- expired contract;
- contractor cross-contract leakage;
- user switching to context they do not own;
- malformed/unknown/expired/inactive context header or selection, audit write failure and cross-user IDOR;
- admin privilege escalation;
- duplicate or undocumented permission seed;
- duplicate role-permission relationship;
- destructive deletion of referenced roles/permissions;
- inactive user with valid token;
- authorization bypass by direct entity ID.
