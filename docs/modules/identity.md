# Module: Identity

STATUS: STABLE
SOURCE_VERSION: 2026-09-16

## Purpose

Identity связывает внешнюю authenticated identity с локальной бизнес-моделью доступа АС «Эксплуатация».

Authentication выполняется внешним IdP по OIDC/OAuth2. Модуль отвечает за пользователя, роли, permissions, access assignments и рабочие контексты.

## Owns

- User
- Role
- Permission
- RolePermission
- AccessAssignment
- UserContext
- Delegation access integration points

## Does not own

- Contractor contracts
- Site hierarchy
- Asset ownership
- Business workflows других модулей
- Password storage

## Database

Schema:

```text
identity
```

Core tables:

```text
users
roles
permissions
role_permissions
access_assignments
user_contexts
```

## Invariants

- BR-IDN-001 … BR-IDN-008.
- External subject unique.
- Inactive user не получает operational access.
- Context должен принадлежать пользователю.
- Access validity проверяется на момент запроса.
- Backend authorization authoritative.

## Authorization model

```text
Identity + Role + Permission + Scope + Working Context + Validity
```

Contractor request дополнительно проходит Contractors validation.

## Public contracts

- `ICurrentUser`
- `IWorkingContext`
- `IAuthorizationService`
- `UserReference`
- `AccessScope`
- `WorkingContextReference`

## Permissions owned

См. `permissions-registry.md`, секция Identity.

## Events

См. `events-registry.md`.

Основные:

- UserActivated
- UserDeactivated
- AccessAssignmentCreated

## API surface

Примеры:

```text
GET /api/v1/me
GET /api/v1/me/contexts
POST /api/v1/me/context
GET /api/v1/admin/users
POST /api/v1/admin/access-assignments
```

Точные admin routes фиксируются при реализации.

## Security

- no password storage;
- no token logging;
- context spoofing prevention;
- contractor access validated through contract chain;
- sensitive admin actions audited.

## Tests

Обязательно:

- wrong scope;
- wrong context;
- expired assignment;
- inactive user;
- contractor wrong contract;
- cross-context leakage;
- privilege escalation.

## Forbidden

- role-only authorization;
- global `admin.all` как повседневный permission;
- direct DB checks из business modules вместо shared authorization contract;
- frontend-only access control.
