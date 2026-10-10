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

Protected frontend query data is cancelled and cleared when a session ends.
Site management mutation callbacks are bound to the session generation that
started them, so a delayed response from an older login cannot repopulate Site
data after the same user signs in again.

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

ADR-013 / `AUTH-SCOPE-01` B1 реализует Identity `IEffectiveGrantEvaluator` для прямой проверки одного доверенного Zone/Region target. B2-B1 / ADR-015 реализует отдельный `IEffectiveScopeProvider` для permission-specific list scopes, без передачи бизнес-иерархии в Identity. Оба используют общий Identity eligibility query: ACTIVE INTERNAL local user, собственный текущий INTERNAL context, active/current assignment, active role, точное canonical role-permission и supported persisted scope. Published C1 provider возвращает точные `TerritorialZone`/`Region` descriptors; SITE-AUTH-01 публикует exact `Site/siteId` без Global/wildcard и без расширения иерархии в Identity.

Для Zone/Region scoped query пустой effective-scope set означает ноль разрешённых целей; пустой набор никогда не означает all rows или fallback access. Sites SQL filtering применяет Zone scope только к Zone и её дочерним Regions; Region scope не покрывает parent Zone и открывает только соответствующий Region. Unsupported scopes не расширяют результат, duplicate scopes не дублируют rows. List composition получает scopes из Identity с фиксированным `sites.read`; scopes другой permission не используются. Прямые target checks получают authoritative Zone/Region facts из Sites persistence и отдельно запрашивают effective scopes для точного permission, не полагаясь на list result. C1 включает только Geography HTTP routes; target-blind production grant source остаётся deny-by-default для прочих маршрутов. SITE-API-01 Site HTTP routes реализованы локально; contractor grants и capabilities не реализованы; Site scope/coverage опубликованы после SITE-AUTH-01R review.

AUTH-GLOBAL-01 / ADR-018 adds explicit permission-specific GLOBAL through
`identity.access_assignments.is_global` (default false). GLOBAL excludes every
concrete ID; existing non-global conjunctive composites remain valid. Legacy
rows never widen; NULL, empty and unknown scope never mean GLOBAL.
`IGlobalGrantProvider` evaluates the exact trusted server-side permission with
shared canonical ACTIVE INTERNAL user/owned current INTERNAL context, role,
assignment, revocation and validity rules. Concrete grants and another
permission's GLOBAL deny; multiple concrete assignments cannot create GLOBAL.
Invalid input/provider/storage failure denies; cancellation propagates. HTTP
permission/scope/global/ownership input is not authorization evidence. GLOBAL
never enters geographic effective scopes or changes Sites/Location coverage.
Generic representation adds no new eligibility policy; AUTH-GLOBAL-01 itself
adds no consumer, assignment/grant seed, admin mutation endpoint or cache.
Future GLOBAL administration must
use canonical Audit with actor/context/correlation and explicit scope facts.
Rollback refuses even revoked GLOBAL rows pending archived owner disposition.

TASK-02.02.02 / OD-FUNCTIONAL-DIRECTION-04/05/06 implements a narrow Organization
consumer published after local validation, independent review and exact-SHA hosted CI PASS.
FunctionalDirection is GLOBAL master data: catalog read requires an explicit
current GLOBAL grant for `organization.read` OR
`organization.manage_functional_directions`.
Management detail/create/name update/activate/deactivate require only explicit
current GLOBAL `organization.manage_functional_directions`. Organization
uses fixed trusted permission codes through Identity-owned `IGlobalGrantProvider`
and canonical authenticated ACTIVE INTERNAL local user + current owned INTERNAL
context eligibility. Published assignment/role/revocation/validity semantics
remain unchanged. Concrete/composite Zone/Region/Site/FunctionalDirection/AssetType
assignments for either permission do not satisfy this GLOBAL rule; no non-empty
effective-scope fallback, geographic widening or read-to-management implication
exists. External/contractor, wrong context, future/expired assignment and provider
failure deny. HTTP permission/scope/global parameters are not evidence.
Authorization precedes management target lookup so denied callers cannot learn
existence. OD-06 accepts one Identity HasData data-only migration
`20261007141653_AddFunctionalDirectionManagementPermission` for canonical
`organization.manage_functional_directions`; its permission row alone grants
no access. No Identity schema, role, assignment or GLOBAL grant seed is added.
Company/OrganizationalUnit scoped reads remain deferred and deny-by-default.
Successful mutations and Organization-owned durable FunctionalDirection audit
obligations commit
atomically; failed/denied/stale/duplicate commands have no successful audit
effect. No grant-management API or change to Sites/Location coverage is added.

ADR-016 / `AUTH-SCOPE-01` B2-R1 исправляет границу доверия после независимой проверки B2: Identity evaluator принимает только exact Zone/Region target ID без caller-supplied Region parent; Zone → Region coverage вычисляется Sites по сохранённой иерархии. Публичный Sites direct service принимает бизнес-цель, authenticated local user и validated context, затем сам запрашивает `IEffectiveScopeProvider` для точного permission. Публичный list service запрашивает фиксированный `sites.read`; SQL-фильтрация скрыта внутри Sites Infrastructure, без публичного scope-bearing store или permission-string evidence. B1 exact-scope eligibility сохраняется. Финальная проверка F1/F2 прошла, B2 интегрирован на main. C1-OD-01: отсутствующая и недоступная прямая Zone/Region цель либо parent Zone для Region create одинаково возвращают 403, без раскрытия существования; authentication failure остаётся 401, а пустой scoped list возвращает 200 `[]`.

ADR-014, уточнённый ADR-017 после ADR-015/016, закрепляет контракт для Site:
authoritative target включает Site, Region и Territorial Zone; Zone scope покрывает потомков, Region scope
покрывает Sites своего Region, Site scope — только эту Site. Site list
фильтруется на backend, direct ID и mutations проверяются по сохранённой
иерархии. Создание требует `sites.create` и effective coverage существующего
parent Region. Ordinary update/lifecycle используют `sites.change`, а
criticality command — `sites.change_criticality` без дополнительного
`sites.change`. Этот Phase A contract не открывает production grants.
Published AUTH-SCOPE supports exact Zone/Region scopes and target-aware
Zone/Region routes. SITE-AUTH-01 publishes exact Site scope and
Sites-owned Site target/list coverage after independent SITE-AUTH-01R review,
without Site HTTP routes in that publication. SITE-API-01 now publishes
Site HTTP routes over the safe composition after SITE-API-01R review. The B1
domain/persistence foundation is published on main.
Contractors remain fail-closed.

SITE-AUTH-01 реализует exact `Site/siteId` через общий Identity
eligibility/provider. `site_id` уже есть в assignment schema;
миграция не потребовалась. Sites самостоятельно загружает Site → Region → Zone,
вычисляет direct coverage и SQL list predicate для `sites.read` до count и
pagination. Пустой scope set даёт пустую страницу. Отсутствующий Site и
вне-scope Site, а также отсутствующий/вне-scope parent Region для Site create,
возвращают одинаковый `403 GEOGRAPHY_ACCESS_DENIED`; `401` остаётся для
authentication. Denied mutations не меняют Site, row_version и audit
obligation. Site authorization foundation опубликован после независимого
SITE-AUTH-01R review; SITE-API-01 HTTP routes опубликованы после SITE-API-01R и проверены
PostgreSQL HTTP harness, включая real Identity provider. List получает
фиксированные sites.read scopes только через authorized service; direct
routes вызывают Sites-owned проверки до Application mutation handlers.
Criticality требует только sites.change_criticality. Независимый security/integration
review и post-integration gates пройдены. SITE-UI-01 добавляет локально
проверенный Site management frontend; независимый review ожидает выполнения
до push. Frontend не определяет authorization. Capabilities и DEV bootstrap
не реализованы; contractor-positive access не поддерживается.

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


## Sites global reference catalogs — SITE-REF-AUTH-01

SITE-REF-OD-01: SiteType and SiteCriticalityClass are global Sites-owned
catalogs, not geographic targets. Both reference GETs require an ACTIVE
INTERNAL local user, valid owned INTERNAL context and a current effective
assignment for any one of sites.read, sites.create, sites.change,
sites.change_criticality with exact TerritorialZone/Region/Site scope.
Absence of a relevant assignment, unsupported/composite scope, future/expired/revoked
assignment, wrong context, contractor/external user/context and provider failure
all deny access. Authentication failure is 401; catalog denial is 403.

SITE-REF-OD-02: catalog access grants no Site operation and no geographic
visibility. Permissions remain independent; a tiny Site scope intentionally
permits the same complete catalog, including inactive historical labels.
New reference assignments still require ACTIVE values.

SITE-REF-OD-03: the Sites Application catalog service accepts only local user
and context IDs, requests its fixed four permissions from IEffectiveScopeProvider
sequentially, and stops at the first supported non-empty scope set. At most
four checks; no arbitrary permission API, raw scope injection, target evidence,
hierarchy evaluator or cross-module DB access. Provider exceptions deny without
trying fallback permissions; cancellation propagates. Only the two catalog
GET routes replace legacy wiring. No production grant-source enablement,
Site/Zone/Region policy change, contractor-positive access, schema or migration.

## LocationType global catalog — TASK-02.04.01 / OD-LOCATION-TYPE-04

`GET /api/v1/reference/location-types` uses a separate Sites authorization
composition. It requires an ACTIVE INTERNAL local user, a valid owned INTERNAL
working context and a current effective assignment for either fixed permission
`sites.read` or `sites.manage_locations` with a non-empty exact
TerritorialZone, Region or Site scope. Any such scope opens the complete global
catalog, including INACTIVE labels, without geographic filtering. This does
not grant Site read/change, Location management or LocationType mutation.

The public service accepts only authenticated local user ID and working
context ID. It requests the fixed two permissions internally via Identity
`IEffectiveScopeProvider`, stopping on the first supported scope. No caller
permission, scope list or geographic ID is authorization evidence. Empty or
unsupported scopes, unrelated permissions, wrong context, future/expired
assignment, contractor/external user/context and provider failure deny (403);
unauthenticated requests return 401. Provider failure denies without trying
another permission. SITE-REF-AUTH-01 remains limited to SiteType and
SiteCriticalityClass with its original four-permission set.

## Location tree — TASK-02.04.02 / OD-LOCATION-06

Location list/get use fixed `sites.read`; create, ordinary update, move and
lifecycle use fixed `sites.manage_locations`, with no implication between
them. Sites resolves stored Location Site and Site Region/Zone hierarchy;
route Site is target input only. Effective scopes come from Identity through
existing Sites composition; callers supply no scopes or ancestry evidence.
Exact scopes remain TerritorialZone, Region and Site, with downward coverage
to Locations. No Location assignment schema or contractor-positive grant is
introduced. Wrong context, contractor, expired/future assignment and missing
permission deny; authentication remains 401.

Missing/inaccessible Location or list/create Site uses uniform
`403 GEOGRAPHY_ACCESS_DENIED`. Missing/cross-Site parent is concealed by the
same response; no existence or cross-Site detail is disclosed. Denial never
returns `200 []`. Mutation Site/code ownership is immutable; no DELETE or
cross-Site transfer route exists. Site-scoped PostgreSQL transaction locks
serialize structural/lifecycle checks, while expectedRowVersion independently
prevents stale writes. State and durable audit obligation commit together;
failed/denied mutation has no successful business or audit effect.

## AssetType taxonomy authorization — ASSET-TYPE-01 local candidate, 2026-10-09

Accepted OD-ASSET-TYPE-08A..08E require ACTIVE INTERNAL subject, owned current
INTERNAL context and exact permission. Catalog read accepts current `assets.read`
OR `assets.manage_types` recognized assignments, including concrete/composite and
explicit GLOBAL, then returns the global catalog without row filtering.
Management accepts only `assets.manage_types`: explicit GLOBAL, or non-geographic
direction/type subtree authority. Both dimensions intersect within one assignment;
complete assignments union. Any geographic-containing composite is ineligible for
mutation. HTTP cannot supply permission/scope/ancestry as grant evidence. Identity
owns current assignment facts; Assets owns authoritative hierarchy/direction and
coverage, without cross-module DbContexts. Type-only scope-root escape is denied;
reparent requires one complete assignment covering both ends. All hierarchy-dependent
mutations lock then reread before evaluation. Concrete evaluation precedes terminal
GLOBAL evaluation because GLOBAL false can also represent provider failure.

[Frozen contract and attack matrix](../.agent/tasks/AUTH-SCOPE-01/asset-type-scope-state.md).
The Identity runtime handoff is published in AUTH-ASSET-SCOPE-01 under
[ADR-019](adr/ADR-019-correlated-assignment-scope-facts.md).
`GetCurrentAssignmentScopesAsync` returns one immutable complete tuple per current
exact-permission non-global assignment, preserving duplicates and all geographic
restrictions. All-null or any empty UUID denies that assignment. Invalid requests
return empty; storage exceptions/cancellation propagate and must abort consumer
authorization. Taxonomy existence/ancestry is a consumer responsibility.
CALLER_PERMISSION_INPUT: NONE through transport; LocalUserId and WorkingContextId
remain trusted current server-composition facts, with Identity revalidation.
No scope evidence is bound through HTTP. Published geographic and GLOBAL provider
semantics are unchanged. ASSET-TYPE-01 implements the local Assets backend candidate;
no Identity schema/seed/grant mutation is required. Independent publication review
and exact-SHA hosted CI remain separate.

All Assets mutations begin READ COMMITTED, acquire global two-int taxonomy lock
`pg_advisory_xact_lock(1095980121,1)`, clear tracked facts and obtain fresh target,
destination, recursive ancestry and current correlated assignment facts before
authorization. That separate keyspace cannot collide with existing bigint module
locks. The lock covers validation, expected version, business+Audit save and commit.
An update waiting behind reparent must authorize the target in its new subtree.
Create-child and lifecycle operations use the same protocol; inactive ancestors cannot
be bypassed by concurrent deactivation. Source and destination coverage never borrow
dimensions or grants from different assignments. Missing/stale taxonomy references
make that assignment unusable; dependency exceptions abort authorization and never
fall back to GLOBAL. Existing inactive scope references remain resolvable.

Canonical request composition resolves authenticated issuer/subject to ACTIVE INTERNAL
local profile and validated owned INTERNAL context. Fixed assets.read OR assets.manage_types
establish global catalog eligibility; geographic read eligibility applies no row filter
and grants no management. Management requires assets.manage_types and whole matching
non-geographic tuple or explicit GLOBAL. Transport accepts only business fields and
expectedRowVersion; unknown JSON members including permission, scope, ancestry,
timestamps and audit actor are rejected. Eligibility precedes direct target parsing;
locked coverage precedes target-specific errors. Unauthorized existing/missing targets
return403; catalog-authorized missing detail and GLOBAL-covered missing mutation may404.
Raw PostgreSQL/dependency details are replaced by stable409 or sanitized503 responses.

Every success persists a module-owned durable Audit obligation in the business
transaction. Denials, invalid state/cycles, duplicate code and stale versions produce
no successful mutation obligation; a failed obligation insert rolls back the business
change. AssetsDbContext rejects ordinary direct entity writes without the command
boundary. Database trigger enforces immutable identity/code/direction and forbids
delete. Reference APIs expose immutable scalar DTOs, no entities/DbContext. There is
no DELETE API, caller-provided grants, Asset entity or frontend change.

ASSET-TYPE-01F1 remediates SEC-01 at the public Application boundary: existing-target
authorization accepts only business target/destination IDs and operation, resolving
direction/parent/ancestry from Assets persistence internally. Read DTOs and supplied
ancestry/scope roots cannot act as evidence. The scoped resolver shares the command's
AssetsDbContext/READ COMMITTED transaction after the same taxonomy advisory lock;
missing or inconsistent authoritative facts and lookup/provider failures deny.
Root-create direction remains desired business input, resolved through Organization,
with selectability and parent homogeneity separately enforced by command validation.
Explicit GLOBAL, geographic denial and whole-assignment intersection are unchanged.
Independent global permission eligibility preserves missing-target404 handling without
turning absent targets into ALLOW. Local remediation tests do not supersede the
original immutable review: SEC-01 closure requires separate ASSET-TYPE-01R2 verification.
