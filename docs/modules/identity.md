# Module: Identity

STATUS: IN DEVELOPMENT
SOURCE_VERSION: 2026-09-18

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

Implemented:

```text
users
roles
permissions
role_permissions
```

`identity.users` и его migration history принадлежат `IdentityDbContext`. Canonical unique key — `(external_issuer, external_subject)`. Профиль хранит UUIDv7 ID, optional display name/email, `UserType`, `UserStatus`, timestamps и optimistic `row_version`.

`identity.roles` хранит UUIDv7 ID, unique role code, name/description, system/active flags и optimistic `row_version`. `identity.permissions` хранит immutable canonical permission catalog с unique code и module owner. `identity.role_permissions` использует composite PK и restrictive foreign keys. Canonical permissions из `permissions-registry.md` seed-ятся module-owned migration; provisional codes не seed-ятся.

Planned subsequent tables:

```text
access_assignments
user_contexts
```

## Invariants

- BR-IDN-001 … BR-IDN-008.
- Canonical external identity unique as exact opaque `issuer + subject` without trimming/case normalization; одинаковый subject от разных trusted issuers означает разные identities.
- Новый профиль создаётся только при наличии trusted `user_type` claim со значением `INTERNAL`, `CONTRACTOR` или `SYSTEM`.
- Синхронизация bounded optional display name/email не меняет сохранённые user type/status; oversized claim игнорируется и не затирает сохранённое значение.
- Inactive user не получает operational access.
- Context должен принадлежать пользователю.
- Access validity проверяется на момент запроса.
- Backend authorization authoritative.
- Role является группой permissions и сама по себе не обходит scope, working context, validity или contractor restrictions.
- Canonical permission code имеет lowercase формат `<module>.<action>` и уникален.
- Изменение active state Role защищено optimistic concurrency и не допускает silent overwrite.

## Authorization model

```text
Identity + Role + Permission + Scope + Working Context + Validity
```

Contractor request дополнительно проходит Contractors validation.

## Public contracts

- `ICurrentUser` exposes the validated runtime `AuthenticatedUser` for the current request.
- `AuthenticatedUser` contains an `ExternalIdentityKey` (`issuer + subject`) and optional display name/email.
- `AuthenticatedUser` carries an optional provisioning input from the configured trusted `user_type` claim; it is not a permission.
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

`GET /api/v1/me` требует валидный bearer token, безопасно создаёт или синхронизирует локальный профиль и возвращает `userId`, canonical identity key, optional display name/email, `userType` и `status`. Для первого создания обязателен configured trusted `user_type` claim. Missing/invalid provisioning type и inactive local profile возвращают 403; повторный concurrency conflict возвращает 409. Permission catalog persistence не расширяет этот response; user assignments, scopes and contexts добавляются следующими Identity tasks.

## Security

- no password storage;
- no token logging;
- JWT signature, issuer, audience and lifetime are validated by ASP.NET Core JWT Bearer;
- `issuer + subject`, а не email, является стабильным external identity key;
- missing display name/email не приводит к authentication failure;
- отсутствие trusted user type не ломает token authentication, но fail-closed запрещает создание нового local profile;
- token profile synchronization не может изменить сохранённый user type/status;
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
- duplicate role/permission code;
- duplicate role-permission mapping;
- deletion of a referenced role/permission;
- permission seed drift from the canonical registry.

## Forbidden

- role-only authorization;
- global `admin.all` как повседневный permission;
- direct DB checks из business modules вместо shared authorization contract;
- frontend-only access control.
