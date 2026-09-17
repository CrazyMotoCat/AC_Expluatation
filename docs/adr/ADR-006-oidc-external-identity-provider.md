# ADR-006 — OIDC/OAuth2 и внешний Identity Provider

- **Статус:** Accepted
- **Дата:** 2026-09-16

## Контекст

Система рассчитана на:

- 10 000+ пользователей;
- внутренних сотрудников;
- подрядчиков;
- корпоративные политики MFA;
- потенциальную интеграцию с AD/Entra ID.

Хранение и самостоятельное обслуживание корпоративных паролей внутри АС создаёт ненужный security risk.

## Решение

Authentication строится через:

```text
OIDC / OAuth2
```

Предпочтение для корпоративной среды:

```text
Entra ID / Active Directory
```

Для автономной или development среды:

```text
Keycloak
```

## Локальный профиль

АС хранит собственную запись пользователя:

```text
identity.users
```

Она содержит:

- external subject ID;
- display name;
- email;
- user type;
- status;
- внутренние assignments/scopes.

Пароль в АС не хранится.

## Разделение

Identity Provider отвечает за:

- authentication;
- password policy;
- MFA;
- token issuance.

АС отвечает за:

- business roles;
- permissions;
- scope;
- contracts;
- working contexts;
- qualifications.

## Причины

- корпоративная SSO;
- MFA;
- централизованное управление identity;
- меньше security responsibility в приложении;
- удобная блокировка пользователя.

## Последствия

### Положительные

- SSO;
- централизованная security policy;
- отсутствие собственного password storage.

### Отрицательные

- зависимость от IdP availability;
- требуется mapping внешней identity в локальную business model.

## Ограничение

Нельзя автоматически считать группы IdP полной заменой business authorization.

Права АС остаются внутри АС.
