# АС «Эксплуатация» — Security

## 1. Назначение документа

Этот документ определяет базовую модель информационной безопасности АС «Эксплуатация».

Он применяется совместно с:

- `concept.md`;
- `roadmap.md`;
- `architecture.md`;
- `coding-standards.md`;
- `database.md`;
- `api-guidelines.md`;
- `testing.md`.

Документ обязателен для:

- backend-разработки;
- frontend-разработки;
- DevOps;
- DBA;
- архитекторов;
- Codex и других AI-агентов;
- code review;
- эксплуатации системы.

Главная цель — встроить безопасность в архитектуру, а не добавлять её после разработки.

---

# 2. Базовый принцип

> Каждый пользователь, сервис и интеграция получают только минимально необходимые права на ограниченный срок и в ограниченном контексте.

Ключевая модель:

```text
Identity
+
Role
+
Permission
+
Scope
+
Working Context
+
Validity Period
```

---

# 3. Защищаемые активы

Критичные категории данных:

- сведения об объектах;
- инженерная инфраструктура;
- состав оборудования;
- критичность объектов;
- эксплуатационная документация;
- схемы;
- технические характеристики;
- дефекты;
- инциденты;
- изменения;
- сведения о резервировании;
- фото оборудования;
- документы подрядчиков;
- сведения о пользователях;
- квалификации;
- история действий;
- договорные данные;
- данные интеграций;
- API credentials;
- audit trail.

---

# 4. Уровни чувствительности

Рекомендуемая классификация:

```text
PUBLIC
INTERNAL
RESTRICTED
CRITICAL
```

Пример:

### INTERNAL

- общие инструкции;
- типовые регламенты;
- справочники.

### RESTRICTED

- конкретные карточки оборудования;
- акты;
- дефекты;
- внутренние отчёты.

### CRITICAL

- схемы критичных объектов;
- security systems;
- детали КВО;
- аварийные планы;
- чувствительные документы.

Классификация должна использоваться для документов и отдельных read models.

---

# 5. Основные угрозы

Система должна учитывать:

- несанкционированный доступ;
- cross-region leakage;
- contractor data leakage;
- privilege escalation;
- expired contract access;
- подмену рабочего контекста;
- массовую выгрузку данных;
- обход backend authorization;
- компрометацию токена;
- вредоносные файлы;
- подделку или удаление истории;
- изменение критичных данных без согласования;
- replay команд;
- duplicate offline operations;
- SQL injection;
- XSS;
- CSRF where applicable;
- SSRF;
- insecure direct object reference;
- path traversal;
- secrets leakage;
- insecure logging;
- compromised dependencies;
- несанкционированные интеграции.

---

# 6. Authentication

Основной подход:

```text
OIDC / OAuth2
```

Предпочтительно:

- корпоративный Entra ID / AD;
- Keycloak в автономном контуре.

Backend не хранит пользовательские пароли.

API работает как OAuth2 resource server и использует стандартный ASP.NET Core JWT Bearer handler. Обязательная token validation включает signature, issuer, audience, expiration и наличие `iss`/`sub`. Canonical external identity определяется парой `issuer + subject`; `name` и `email` являются optional profile attributes.

Конфигурация задаётся через:

```text
Authentication__Oidc__Authority
Authentication__Oidc__Audience
Authentication__Oidc__RequireHttpsMetadata
Authentication__Oidc__UserTypeClaim
```

API client secret не требуется и не должен добавляться для resource-server validation.

Local profile provisioning выполняется поверх validated principal. Canonical key остаётся `issuer + subject`; оба claim сохраняются как opaque exact values без trim/case normalization, а значение, не представимое в bounded persistence columns, fail closed до DB lookup. Новый профиль создаётся только при наличии configured trusted `user_type` claim с canonical значением `INTERNAL`, `CONTRACTOR` или `SYSTEM`; отсутствующее/невалидное значение fail closed. Этот тип классифицирует профиль, но сам по себе не выдаёт permission/scope. Последующая синхронизация token attributes может менять только optional display name/email и не может активировать пользователя или изменить его type. Oversized optional claims игнорируются и не стирают уже сохранённое значение. `INACTIVE` local profile блокируется даже при валидном token.

---

# 7. MFA

Для внутренних сотрудников — по политике корпоративного IdP.

Для критичных административных ролей MFA должен быть обязательным.

Для внешних подрядчиков MFA рекомендуется как обязательный режим при промышленной эксплуатации.

---

# 8. Session security

Требования:

- короткоживущие access tokens;
- refresh token rotation;
- secure storage;
- revoke support;
- logout invalidation where supported;
- token audience validation;
- issuer validation.

---

# 9. Authorization model

Используется сочетание:

```text
RBAC
+
ABAC / Scope
```

Пример:

```text
Role: Engineer
Permission: workorders.execute
Region: R03
Direction: Exploitation
Asset Type: UPS
```

---

# 10. Проверка доступа

Проверка выполняется на backend.

Frontend:

- скрывает недоступные действия;
- улучшает UX.

Но frontend не является security boundary.

---

# 11. Working Context

Каждое действие выполняется в рабочем контексте.

Примеры:

```text
Internal role
Contract
Project
Delegation
Team
```

Backend проверяет:

```text
user owns context
context active
context valid
scope matches target entity
```

С `TASK-01.03.02` получение списка и выбор только собственных available contexts — узкий self-service/bootstrap boundary: validated OIDC principal + ACTIVE local user + проверка ownership/active/validity. Он не требует operational grant `identity.contexts.read`, поскольку context нужен до полной authorization evaluation. Permission остаётся canonical для будущих permission-controlled context use cases. Выбранный context не является grant: production permission source остаётся deny; role name, UserType, JWT claims и DEV environment не расширяют права. Клиентский `X-Work-Context-Id` проверяется на backend при каждом `/api/v1` запросе, если передан. CONTRACT context selection не заменяет будущую проверку membership/contract/scope/validity при operational access.

ADR-013 / `AUTH-SCOPE-01` B1 реализует Identity effective-grant evaluator для INTERNAL пользователя в собственном действующем INTERNAL context, с действующим assignment, active role-permission и доверенным Zone/Region target descriptor. Evaluator пока не подключён к production grant source: geography routes и списки остаются deny-by-default до следующих фаз. Site projection, capabilities и contractor grants не реализованы; capabilities в дальнейшей фазе будут подсказкой для UX, не источником авторизации.

Успешный `POST /api/v1/me/context` возможен только после durable Audit-owned `WorkingContextSelected` по context ID из body; заголовок на этом POST игнорируется. На остальных `/api/v1` запросах валидный `X-Work-Context-Id` означает request-scoped применение context и требует durable `WorkingContextApplied` до endpoint, даже без предшествующего POST. Отказ в validation или сбой Audit не позволяет endpoint выполниться. Audit-событие не является authorization state. Identity grant/state не мутирует, поэтому cross-module transaction не требуется.

---

# 12. Contractor isolation

Подрядчик не должен видеть:

- другие договоры;
- другие организации;
- чужие объекты;
- внутреннюю аналитику;
- лишнюю документацию;
- внутренние согласования вне scope.

Права подрядчика вычисляются по:

```text
User
→ Membership
→ Contract
→ Assignment
→ Scope
→ Validity
```

---

# 13. Expiry enforcement

Проверки срока обязательны для:

- договоров;
- делегирования;
- квалификаций;
- временных доступов;
- специальных исключений.

Expired access должен прекращаться автоматически.

---

# 14. Least privilege

По умолчанию:

```text
deny
```

Разрешение появляется только при явном assignment.

---

# 15. Sensitive actions

Усиленный контроль для:

- списания актива;
- изменения критичности;
- изменения ownership;
- утверждения ТО;
- принятия риска;
- закрытия P1/P2;
- публикации model-level документа;
- изменения permissions;
- изменения contractor scope;
- выдачи emergency exception.

---

# 16. Separation of duties

Для критичных сценариев желательно разделять:

```text
executor
reviewer
approver
```

Один и тот же пользователь не должен автоматически выполнять все роли, если процесс требует независимой проверки.

---

# 17. Critical object policy

Для КВО возможно усиление:

- обязательный approver;
- mandatory audit reason;
- tighter document access;
- stricter download logging;
- stricter contractor scope;
- mandatory residual risk acceptance.

---

# 18. Row-Level Security

PostgreSQL RLS может использоваться как дополнительная защита.

Особенно для:

- contractor-facing data;
- sensitive documents;
- restricted site data.

RLS не заменяет application authorization.

---

# 19. IDOR prevention

Нельзя считать, что UUID защищает ресурс.

Каждый:

```text
GET /assets/{id}
```

обязан проверять scope.

---

# 20. API authorization tests

Каждый critical endpoint должен иметь tests:

```text
allowed user → success
wrong region → 403
wrong contract → 403
expired contract → 403
wrong context → 403
no permission → 403
```

---

# 21. Admin roles

Административные права разделять:

- system admin;
- identity admin;
- master data admin;
- security/audit reviewer;
- business admin.

Не создавать один `SUPER_ADMIN` для повседневной работы.

---

# 22. Break-glass access

Для аварийных случаев можно предусмотреть emergency access.

Обязательно:

- причина;
- срок;
- согласование;
- усиленный audit;
- notification responsible person;
- автоматическое истечение.

Не включать в MVP без необходимости, но архитектурно предусмотреть.

---

# 23. Audit

Audit trail должен быть append-only.

Хранит:

- user;
- context;
- action;
- entity;
- timestamp;
- before;
- after;
- reason;
- correlation id;
- IP;
- user agent where relevant.

Все state-changing critical commands, реализованные в repository, используют единый Audit-owned generic append contract. Для текущего `POST /api/v1/me/context` обязательны local user ID, request correlation, canonical entity/action и durable INSERT до успешного ответа; сбой audit приводит к fail closed. `WorkingContextApplied` остаётся security-sensitive audit event, но не command.

Action/entity identifiers не принимаются как произвольные persistent strings: они проходят Audit-owned catalog validation. Before/after payloads optional, structured, allowlisted, ограничены 64 KiB UTF-8 и не содержат JWT, tokens, passwords или secrets.

---

# 24. Audit protection

Application runtime не должен иметь обычное UPDATE/DELETE право на audit events.

---

# 25. Audit retention

Audit хранится долгосрочно.

Конкретный срок определяется корпоративной политикой и требованиями законодательства/ИБ.

---

# 26. Business history vs audit

Не смешивать:

```text
AssetEvent
```

и:

```text
AuditEvent
```

Первое — эксплуатационный факт.

Второе — кто изменил данные системы.

---

# 27. Logging

Технические логи не должны содержать:

- пароли;
- токены;
- cookies;
- private keys;
- full authorization headers;
- чувствительные документы;
- лишние персональные данные.

---

# 28. Security logging

Отдельно логировать:

- repeated access denied;
- invalid context;
- expired contract use;
- suspicious upload;
- unusual bulk export;
- admin role changes;
- permission changes;
- failed MFA if exposed by IdP;
- suspicious integration behavior.

---

# 29. Secrets management

Secrets не хранятся:

- в Git;
- в appsettings committed to repo;
- в Dockerfile;
- в frontend bundle.

Использовать:

- environment secrets;
- secret manager;
- Kubernetes secrets later if K8s used.

---

# 30. Encryption in transit

Все внешние соединения:

```text
TLS
```

В production plain HTTP запрещён.

---

# 31. Encryption at rest

Обеспечивается:

- storage encryption;
- DB volume encryption;
- object storage encryption;
- backup encryption.

---

# 32. Application-level encryption

Использовать только для действительно чувствительных полей.

Не шифровать весь бизнес-слой без необходимости.

---

# 33. Passwords

Если Keycloak используется локально:

- современные password hashing algorithms;
- password policy;
- brute-force protection;
- MFA policy.

Но предпочтительно delegate authentication IdP.

---

# 34. CSRF

Если authentication использует cookies — CSRF protection обязательна.

Если bearer token в Authorization header и нет auth cookies — риск ниже, но архитектура должна быть проверена отдельно.

---

# 35. XSS

Frontend обязан:

- не рендерить raw HTML без sanitize;
- экранировать пользовательские данные;
- осторожно работать с Markdown/HTML документами.

---

# 36. Content Security Policy

Для web production рекомендуется CSP.

---

# 37. SQL Injection

Только:

- EF parameterization;
- Dapper parameters;
- parameterized raw SQL.

Строковая конкатенация SQL с пользовательским вводом запрещена.

---

# 38. SSRF

Интеграционные URL нельзя принимать и вызывать без allowlist/validation.

Особенно для:

- document links;
- webhook targets;
- future telemetry adapters.

---

# 39. File upload security

Каждый файл проходит:

- size limit;
- content type validation;
- extension validation;
- checksum;
- malware scanning where available;
- quarantine;
- authorization before linking.

---

# 40. File name security

Пользовательский filename:

- хранится как metadata;
- не используется как storage path;
- очищается для отображения.

---

# 41. Object storage access

Buckets не должны быть public.

Скачивание:

```text
backend authorization
→ short-lived signed URL
```

---

# 42. Signed URL

Срок минимально необходимый.

Например:

```text
5–15 минут
```

---

# 43. Document classification

Каждый документ может иметь classification.

Access решается по:

```text
classification
+
entity scope
+
role
+
context
```

---

# 44. Download audit

Для RESTRICTED/CRITICAL документов рекомендуется сохранять факт скачивания.

---

# 45. Media EXIF

Фото с мобильных устройств могут содержать EXIF.

Нужно определить политику:

- сохранять ли GPS;
- очищать ли лишние metadata.

По умолчанию лучше удалять ненужные EXIF данные.

---

# 46. Location privacy

Точные координаты объектов должны возвращаться только пользователям, которым они нужны.

---

# 47. PII minimization

Хранить минимум персональных данных:

- имя;
- корпоративный идентификатор;
- рабочий email;
- рабочая роль;
- квалификации.

Не превращать систему эксплуатации в HR-систему.

---

# 48. Qualifications documents

Сертификаты могут содержать персональные данные.

Ограничить доступ:

- сам пользователь;
- ответственный;
- руководитель;
- authorized reviewer.

---

# 49. Data export

Mass export требует отдельного permission.

Пример:

```text
reports.export
assets.bulk_export
```

---

# 50. Export controls

Для больших выгрузок:

- background job;
- audit;
- optional reason;
- file expiry;
- access-limited download.

---

# 51. Rate limiting

Обязателен для:

- login-related endpoints if local;
- search;
- exports;
- uploads;
- integration endpoints;
- public QR endpoints.

---

# 52. Public QR

Если QR открывает общедоступную страницу:

- использовать opaque token;
- не раскрывать критичные данные;
- rate limit;
- revocation support.

---

# 53. External integration auth

Поддерживаемые варианты:

- client credentials OAuth2;
- mTLS;
- signed API keys only if necessary.

---

# 54. Integration scopes

Внешней системе выдаётся только минимально необходимый API scope.

---

# 55. Webhook security

Если появятся webhooks:

- HMAC signature;
- timestamp;
- replay protection;
- retry policy;
- secret rotation.

---

# 56. Outbox security

Payload outbox не должен содержать secrets.

---

# 57. RabbitMQ security

Production:

- TLS where feasible;
- separate credentials;
- least privilege;
- separate vhost;
- no guest account;
- queue permissions.

---

# 58. Redis security

Production:

- private network;
- auth;
- TLS where required;
- no public exposure.

Redis не хранит долговременные secrets.

---

# 59. PostgreSQL security

Application role:

- no superuser;
- no DDL;
- limited schema privileges.

Migration role отдельно.

---

# 60. Database roles

Минимум:

```text
app_rw
app_ro
migration
reporting_ro
backup
```

---

# 61. Backup security

Backups:

- encrypted;
- access-controlled;
- restore tested;
- separated from primary environment.

---

# 62. Production data in non-prod

Запрещено копировать production DB в DEV/TEST без анонимизации.

---

# 63. Data anonymization

Если production-like data нужна:

- replace names;
- emails;
- identifiers;
- sensitive notes;
- documents.

---

# 64. Environment separation

DEV/TEST/STAGE/PROD имеют:

- разные credentials;
- разные DB;
- разные storage;
- разные queues;
- разные secrets.

---

# 65. CI/CD security

Pipeline должен:

- не выводить secrets;
- использовать short-lived credentials где возможно;
- иметь branch protection;
- dependency scanning;
- image scanning;
- secret scanning.

---

# 66. Dependency management

Регулярно проверять:

- NuGet;
- npm;
- container images.

Критичные CVE исправляются приоритетно.

---

# 67. Container security

Production images:

- minimal base;
- non-root user;
- no shell tools без необходимости;
- immutable image;
- fixed versions;
- scan.

---

# 68. Reverse proxy

Обеспечивает:

- TLS;
- security headers;
- request size limit;
- rate limiting where needed;
- forwarding headers validation.

---

# 69. Security headers

Рекомендуются:

- HSTS;
- CSP;
- X-Content-Type-Options;
- Referrer-Policy;
- frame restrictions.

---

# 70. CORS

Allowlist конкретных origins.

Не:

```text
*
```

для authenticated production API.

---

# 71. Input validation

Каждый внешний input валидируется.

Не доверять:

- route ID;
- query;
- JSON;
- filename;
- QR payload;
- import rows;
- webhook data.

---

# 72. Import security

Excel/CSV import:

- size limit;
- format validation;
- formula injection mitigation for export;
- staging;
- preview;
- permission check.

---

# 73. CSV/Excel formula injection

При export значения, начинающиеся с:

```text
=
+
-
@
```

должны безопасно экранироваться там, где это необходимо.

---

# 74. DoS considerations

Ограничивать:

- page size;
- date ranges;
- report scope;
- upload size;
- batch size;
- concurrent exports.

---

# 75. Heavy query protection

Тяжёлые отчёты:

```text
queue → worker
```

не исполняются синхронно без контроля.

---

# 76. Offline security

PWA offline storage должен содержать только данные, необходимые пользователю.

---

# 77. Offline device loss

Архитектурно предусмотреть:

- short offline retention;
- encrypted browser/device storage where possible;
- logout purge;
- remote session revocation.

---

# 78. Offline sync authorization

Каждая синхронизируемая операция повторно авторизуется на сервере.

Offline permission на момент выполнения не гарантирует permission на момент sync.

---

# 79. Replay protection

Использовать:

- operationId;
- idempotency key;
- inbox table for integrations.

---

# 80. Concurrency security

Optimistic concurrency предотвращает silent overwrite критичных решений.

---

# 81. Approval integrity

Approval хранит:

- approver;
- timestamp;
- decision;
- version/snapshot объекта;
- comment where needed.

Approval не должен автоматически переноситься на существенно изменённую сущность.

---

# 82. Change after approval

Если после approval изменены критичные поля:

- approval invalidated;
- требуется повторное согласование.

---

# 83. Risk decision audit

Снижение риска вручную обязательно хранит:

- исходный уровень;
- итоговый уровень;
- пользователя;
- причину;
- время.

---

# 84. Emergency exception audit

Нельзя удалять или скрывать emergency override.

---

# 85. Critical event notifications

Желательно уведомлять security/audit ответственным при:

- расширении contractor scope;
- создании break-glass доступа;
- изменении admin role;
- снижении риска;
- массовой выгрузке критичных данных.

---

# 86. Security monitoring

На промышленном этапе мониторить:

- abnormal login;
- access denied spikes;
- download spikes;
- upload malware;
- repeated 404/403 enumeration;
- admin activity.

---

# 87. Incident response for platform

Нужен отдельный эксплуатационный процесс для самой АС:

- security incident;
- outage;
- data corruption;
- credential leak.

Это не то же самое, что эксплуатационные Incident внутри предметной области.

---

# 88. Vulnerability management

Периодически:

- SAST;
- dependency scan;
- container scan;
- DAST;
- penetration test.

---

# 89. Threat modeling

Перед крупными новыми модулями:

- telemetry;
- external API;
- mobile;
- warehouse;
- financial module;

проводить отдельный threat review.

---

# 90. Security ADR

Значимые решения оформлять ADR:

```text
authentication provider
token strategy
RLS
public QR
document classification
break-glass
```

---

# 91. Security code review checklist

При каждом PR проверить:

1. Новый permission?
2. Scope проверяется?
3. Contractor boundary?
4. Sensitive data?
5. Audit нужен?
6. Input validated?
7. File upload?
8. Secret leakage?
9. Rate limit?
10. Cross-module access?
11. New external URL?
12. Concurrency?

---

# 92. Security tests

Обязательны:

- authorization matrix;
- IDOR;
- expired scope;
- context spoofing;
- document access;
- upload validation;
- API validation;
- role escalation;
- audit integrity.

---

# 93. Security Definition of Done

Функция готова, если:

1. Определены permissions.
2. Определён scope.
3. Backend проверяет access.
4. Contractor isolation проверена.
5. Audit добавлен, если нужен.
6. Sensitive data минимизированы.
7. Input validation есть.
8. Security tests есть.
9. Secrets не добавлены.
10. Logs безопасны.
11. File security учтена.
12. Threats для функции рассмотрены.

---

# 94. Правила для Codex

Codex не имеет права самостоятельно:

- ослаблять permission checks;
- добавлять bypass;
- отключать audit;
- делать bucket public;
- добавлять wildcard CORS;
- хранить token в логах;
- использовать production secrets;
- давать contractor broader scope;
- отменять expiry checks;
- внедрять public endpoint без threat review.

Если задача требует исключения — оформить явное решение/ADR.

---

# 95. Главный принцип безопасности

> В АС «Эксплуатация» доступ определяется не тем, знает ли пользователь ID объекта, а тем, имеет ли он право выполнить конкретное действие над конкретной сущностью в конкретном рабочем контексте и в конкретный момент времени.
