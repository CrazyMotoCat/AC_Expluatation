# AGENTS.md — правила работы AI-агентов с проектом АС «Эксплуатация»

## 1. Назначение

Этот файл обязателен для Codex и других AI-агентов, работающих с репозиторием АС «Эксплуатация».

Цель:

- не допускать архитектурного дрейфа;
- не ломать бизнес-правила;
- не создавать дублирующие паттерны;
- не обходить безопасность;
- не портить историю данных;
- сохранять единый стиль разработки.

Если указания в задаче противоречат этому файлу или архитектурной документации, агент должен явно отметить конфликт и выбрать более безопасный вариант до тех пор, пока решение не будет изменено человеком или новым ADR.

---

# 2. Обязательный порядок чтения

Перед существенным изменением прочитать:

```text
1. docs/concept.md
2. docs/architecture.md
3. docs/coding-standards.md
4. docs/project-structure.md
5. docs/database.md
6. docs/api-guidelines.md
7. docs/security.md
8. docs/testing.md
9. docs/backlog.md
10. relevant docs/modules/*
11. relevant docs/adr/*
```

Если задача касается конкретного backlog item — найти его ID и acceptance criteria.

---

# 3. Source of Truth

Приоритет источников:

```text
1. Явное текущее решение владельца проекта
2. Accepted ADR
3. concept.md
4. architecture.md
5. database.md / api-guidelines.md / security.md
6. coding-standards.md / project-structure.md / testing.md
7. backlog.md
8. существующий код
```

Существующий код не является достаточным основанием нарушать документированную архитектуру.

---

# 4. Главные архитектурные инварианты

Агент обязан сохранять:

```text
Modular Monolith
PostgreSQL as core source of truth
UUIDv7 for core business entities
S3-compatible object storage for files
Transactional Outbox for reliable async events
OIDC/OAuth2 external identity provider
RBAC + Scope/ABAC + Working Context
Separate Business History and Audit
```

Не менять эти решения без нового ADR.

---

# 5. Доменные границы

Основные модули:

```text
Identity
Organization
Sites
Assets
Maintenance
WorkOrders
Measurements
Defects
Repairs
Inventory
Incidents
Changes
Documents
Contractors
Qualifications
Notifications
Audit
Reports
Integrations
```

Каждый модуль владеет своими:

- сущностями;
- таблицами;
- use cases;
- validation;
- migrations;
- contracts.

---

# 6. Запрещённые зависимости

Нельзя:

```text
Module A → Module B.Infrastructure
Domain → Infrastructure
Domain → EF Core
Domain → ASP.NET
Domain → RabbitMQ
Domain → Redis
```

Cross-module interaction:

```text
Contract
или
Event
или
явный application-level interface
```

---

# 7. Не писать напрямую в чужую schema

Пример запрещённого поведения:

```text
Defects handler
→ UPDATE assets.assets
```

Правильно:

```text
Defects
→ contract/event
→ Assets module
```

---

# 8. Shared не является свалкой

В `Shared` можно размещать только действительно общие технические примитивы.

Нельзя переносить туда:

- Asset;
- WorkOrder;
- Defect;
- business DTO;
- module-specific validator;
- module-specific service.

---

# 9. Работать вертикальными use cases

Предпочтительно:

```text
Assets/Create/
Assets/Move/
Assets/Decommission/
```

а не глобальные папки:

```text
Commands/
Handlers/
Validators/
```

для всего модуля.

---

# 10. Перед созданием нового файла

Ответить на пять вопросов:

```text
1. Какой module owner?
2. Какой layer?
3. Какой use case?
4. Это internal type или public contract?
5. Уже существует аналогичный pattern?
```

Если ответ неясен — сначала изучить существующий код и документацию.

---

# 11. Не создавать новый pattern без необходимости

Если в проекте уже есть:

- endpoint pattern;
- validator pattern;
- repository pattern;
- error pattern;
- audit pattern;
- event pattern;

использовать его.

Не добавлять альтернативный способ решения той же задачи без ADR или явной причины.

---

# 12. Domain rules

Бизнес-правила должны находиться:

- в Domain;
- либо в Application use case, если правило orchestration-level.

Нельзя помещать бизнес-логику в:

- Controller;
- endpoint mapping;
- EF configuration;
- React component;
- SQL migration.

---

# 13. Domain entities

Entity должна:

- защищать invariants;
- не иметь публичных setter без причины;
- менять состояние через методы;
- не зависеть от infrastructure.

---

# 14. Статусы

Нельзя добавлять новый business status молча.

Перед добавлением:

1. проверить существующий lifecycle;
2. проверить docs;
3. обновить module docs;
4. добавить tests переходов;
5. при существенном изменении — ADR/решение владельца.

---

# 15. История

Нельзя физически удалять бизнес-критичную историю ради удобства.

Предпочитать:

```text
status
valid_from
valid_to
history
event
```

вместо:

```text
DELETE
```

---

# 16. Business History ≠ Audit

Если операция меняет бизнес-состояние, определить:

- нужен ли business event/history;
- нужен ли audit event.

Обычно критичные операции требуют оба механизма.

---

# 17. Audit

Для критичных изменений сохранять:

- кто;
- когда;
- context;
- entity;
- action;
- before/after при необходимости;
- reason;
- correlation ID.

Нельзя отключать audit ради упрощения задачи.

---

# 18. Permissions

Каждый изменяющий endpoint должен иметь:

```text
permission
+
scope
+
working context
```

Если есть подрядчик — проверить contract validity и assignment.

---

# 19. Frontend не является security boundary

Скрытие кнопки не заменяет backend authorization.

Каждый backend endpoint проверяет доступ самостоятельно.

---

# 20. Contractor isolation

Особенно внимательно проверять:

- region;
- site;
- contract;
- asset type;
- action;
- validity;
- context.

Недопустима утечка данных между подрядчиками.

---

# 21. Validation

Разделять:

### Transport validation

- required;
- format;
- length;
- parse.

### Business validation

- domain state;
- permissions;
- lifecycle;
- relationships;
- business rules.

---

# 22. API style

Основной API:

```text
REST + JSON
/api/v1
```

Для сложных бизнес-действий использовать command endpoints:

```text
POST /work-orders/{id}/complete
POST /assets/{id}/decommission
POST /changes/{id}/approve
```

Не менять сложный lifecycle простым `PATCH status`.

---

# 23. Error contract

Использовать единый формат:

```json
{
  "code": "ERROR_CODE",
  "message": "Пользовательский текст",
  "correlationId": "...",
  "details": null
}
```

Не возвращать stack trace пользователю.

---

# 24. Error codes

Код:

- стабилен;
- машиночитаем;
- не зависит от языка.

Не придумывать новый формат ошибок для отдельного модуля.

---

# 25. DTO

Не возвращать Domain Entity напрямую из API.

Использовать transport DTO.

---

# 26. Database

Core DB:

```text
PostgreSQL
```

Именование:

```text
snake_case
```

Core identifiers:

```text
UUIDv7
```

---

# 27. EF Core

Правила:

- no lazy loading;
- `AsNoTracking()` для read-only;
- explicit configurations;
- projection вместо огромных Include;
- migrations version-controlled;
- `SaveChangesAsync` контролируется use case boundary.

---

# 28. Generic Repository запрещён как default

Не создавать:

```text
IRepository<T>
```

для всей системы.

Использовать:

```text
IAssetRepository
IWorkOrderRepository
```

где repository действительно нужен.

---

# 29. Dapper

Использовать для:

- сложных read models;
- dashboards;
- отчётов;
- performance-critical query.

Не использовать как второй ORM без причины.

---

# 30. JSONB

Допустим для:

- metadata;
- snapshots;
- integration payload;
- configuration/rules.

Не использовать JSONB вместо нормальной модели core сущностей.

---

# 31. Files

Binary content хранится в S3-compatible storage.

В PostgreSQL только metadata.

Нельзя:

- хранить пользовательский filename как storage key;
- делать bucket public;
- загружать файл без validation.

---

# 32. Events

Domain event описывает факт:

```text
AssetCommissioned
WorkOrderAccepted
DefectCreated
```

Не:

```text
SendEmailEvent
UpdateDashboardEvent
```

---

# 33. Outbox

Если async side effect должен быть надёжным:

```text
business change
+
outbox message
```

в одной транзакции.

---

# 34. RabbitMQ

Использовать для:

- background processing;
- notifications;
- reports;
- integrations.

Не использовать для обычного CRUD.

---

# 35. Idempotency

Обязательна для операций, которые могут повторяться:

- offline sync;
- integration messages;
- complete command;
- inventory scans;
- imports.

Повтор не должен создавать duplicate business effect.

---

# 36. Concurrency

Критичные редактируемые сущности используют optimistic concurrency.

Silent overwrite запрещён.

---

# 37. Time

Использовать:

```text
UTC in database
DateTimeOffset in backend
IClock in domain/application
```

Не использовать напрямую:

```csharp
DateTime.Now
```

в бизнес-логике.

---

# 38. Measurements

Не хранить важные измерения только внутри JSON WorkOrder.

Measurement — отдельный исторический факт.

---

# 39. Maintenance rules

Особенно не нарушать:

- период зависит от оборудования + уровня ТО + класса объекта;
- higher TO может включать lower TO;
- внеплановое ТО сбрасывает цикл только при подтверждении полного объёма;
- операции имеют requirement type и criticality;
- нормативные диапазоны сохраняются вместе со snapshot.

---

# 40. WorkOrder snapshot

После создания WorkOrder изменение Maintenance Template не должно менять уже созданную работу.

Всегда использовать snapshot операций.

---

# 41. Defects

Не плодить новый defect, если тот же дефект остаётся открытым.

Добавлять observation.

Если дефект был закрыт и появился снова:

- новый case;
- recurrence link;
- инженерная оценка.

---

# 42. Inventory

Нельзя автоматически:

- списывать;
- переводить в LOST;
- decommission;

актив только потому, что он не найден.

Создаётся discrepancy/incident и процесс проверки.

---

# 43. Contractor labor

Трудозатраты подрядчика требуют customer verification, если это предусмотрено процессом.

---

# 44. Change risk

Автоматический risk и expert assessments хранятся отдельно.

Если coordinator снижает итоговый риск:

- reason mandatory;
- audit mandatory.

---

# 45. Approved data immutability

Не редактировать approved version напрямую.

Примеры:

- Maintenance Template version;
- approved inventory report;
- approved review;
- critical decision.

Создавать новую version/correction.

---

# 46. Migrations

Каждое изменение schema:

- migration;
- test;
- review;
- ownership;
- backward compatibility analysis.

Не делать destructive migration без плана.

---

# 47. Cross-module migration

Требует особого review.

Обычно module migration изменяет свою schema.

---

# 48. Testing requirements

Для нового use case минимум рассмотреть:

```text
Unit
Integration
Authorization
Migration
Concurrency
Idempotency
Audit
Outbox
E2E impact
```

Не все нужны всегда, но решение должно быть осознанным.

---

# 49. Authorization tests обязательны

Для sensitive endpoint:

```text
allowed → success
no permission → 403
wrong scope → 403
wrong context → 403
expired contract → 403
```

---

# 50. PostgreSQL tests

Persistence integration tests должны использовать PostgreSQL.

Не заменять его SQLite там, где важны:

- constraints;
- JSONB;
- migrations;
- PostgreSQL semantics.

---

# 51. Не ослаблять тест ради зелёного CI

Запрещено:

- удалять assertion;
- менять expected value под неправильную реализацию;
- skip failing test без issue;
- убирать negative case.

---

# 52. Bug fix

Для серьёзного bug сначала по возможности добавить regression test, затем исправление.

---

# 53. Architecture tests

Новые project references должны проходить architecture tests.

Не обходить их через `InternalsVisibleTo`, reflection или копирование типов.

---

# 54. Security

Нельзя:

- логировать secrets/tokens;
- wildcard CORS в production;
- public S3 bucket;
- bypass permissions;
- использовать production secrets локально;
- отключать expiry checks;
- создавать скрытый `AllowAllAuth`.

---

# 55. Dependencies

Перед добавлением NuGet/npm package:

1. проверить, нужен ли он;
2. проверить, нет ли уже аналога;
3. оценить maintenance/security;
4. не добавлять библиотеку ради нескольких строк кода.

Новая фундаментальная зависимость может требовать ADR.

---

# 56. Infrastructure

Нельзя самостоятельно добавлять без ADR:

- Kafka;
- Elasticsearch/OpenSearch как обязательный core;
- Kubernetes;
- вторую основную БД;
- новый identity provider;
- service mesh;
- workflow engine.

---

# 57. Feature Flags

Неприоритетные/поэтапные функции желательно закрывать feature flag, если код уже присутствует, но rollout должен быть контролируемым.

---

# 58. Logging

Использовать structured logging.

Хорошо:

```csharp
_logger.LogInformation(
    "Asset {AssetId} moved to {LocationId}",
    assetId,
    locationId);
```

Не использовать string interpolation в log message template.

---

# 59. Correlation ID

Сохранять и передавать:

- HTTP;
- logs;
- audit;
- outbox;
- messages;
- workers.

---

# 60. Comments

Комментарий объясняет:

```text
почему
```

а не очевидное:

```text
что делает строка
```

---

# 61. TODO

TODO только с issue/task reference.

Пример:

```text
TODO EXP-214
```

---

# 62. Frontend

TypeScript strict.

`any` без причины запрещён.

API calls через единый client layer.

Server state — через TanStack Query.

---

# 63. Frontend structure

Использовать:

```text
pages
widgets
features
entities
shared
```

Domain-specific UI не переносить в `shared`.

---

# 64. Generated code

Generated API/client files:

- лежат в `Generated`/`generated`;
- не редактируются вручную;
- перегенерируются script'ом.

---

# 65. Documentation update

Если изменение затрагивает:

- business rule;
- status;
- module boundary;
- DB model;
- API contract;
- security model;
- deployment;
- architecture;

соответствующий документ должен быть обновлён в том же PR.

---

# 66. ADR rule

Если решение:

- затрагивает несколько модулей;
- трудно откатить;
- меняет fundamental architecture;
- добавляет infrastructure component;

создать новый ADR.

Нельзя тихо переписывать Accepted ADR.

---

# 67. Работа по backlog task

Перед началом задачи:

1. Найти Task ID.
2. Прочитать Goal.
3. Прочитать Acceptance Criteria.
4. Определить dependencies.
5. Определить out-of-scope.
6. Найти похожую реализацию.

---

# 68. План изменений

Перед крупной задачей сформировать короткий план:

```text
Files to change
DB migration
Domain changes
Application use case
API
Permissions
Audit
Tests
Docs
```

---

# 69. Минимизировать diff

Не делать параллельно:

- unrelated refactor;
- mass rename;
- formatting всего repository;
- dependency upgrade;

если задача этого не требует.

---

# 70. Не переписывать рабочий код без причины

Если существующий код соответствует архитектуре и tests — не заменять его «более красивой» абстракцией только по вкусу.

---

# 71. Изменения должны быть локальными

Один PR/agent task — один понятный use case или связанный набор изменений.

---

# 72. Не создавать преждевременную абстракцию

Правило:

> Три явных понятных реализации лучше одного generic framework, смысл которого ещё не стабилизирован.

---

# 73. Не создавать premature microservices

Даже если module выглядит отдельным, он остаётся частью modular monolith, пока не принято другое ADR.

---

# 74. Не создавать BPM/workflow engine

Простые approvals и lifecycle моделировать явно.

Сложный workflow engine — только отдельное архитектурное решение.

---

# 75. Не строить DWH раньше времени

Reporting сначала:

- PostgreSQL;
- read models;
- materialized views;
- read replica позже.

---

# 76. Не подключать телеметрию в core asset table

Будущая telemetry — отдельный module/schema.

---

# 77. Не строить warehouse в material_usage

`material_usage` — факт расхода.

Это не складской остаток.

---

# 78. Не превращать стоимость в обязательное поле MVP

Cost tracking архитектурно предусмотрен, но ранний функционал не должен требовать его везде.

---

# 79. Не перегружать первый релиз

Если функция отмечена:

```text
P1
P2
ARCH_HOOK
```

не превращать её в обязательную часть P0 без решения владельца.

---

# 80. Работа с неопределённостью

Если не хватает мелкой детали:

- выбрать наиболее консервативный existing pattern;
- не расширять scope;
- явно указать assumption в итоговом отчёте.

Если неопределённость фундаментальная:

- не принимать архитектурное решение молча;
- создать вопрос/ADR proposal.

---

# 81. После реализации

Проверить:

```text
dotnet build
dotnet test
frontend lint/build/tests
migration smoke
architecture tests
```

в пределах затронутой задачи.

---

# 82. Итоговый отчёт агента

После задачи кратко сообщить:

- что сделано;
- какие файлы изменены;
- какие migrations добавлены;
- какие tests добавлены;
- что не сделано/out of scope;
- есть ли риски/следующие шаги.

---

# 83. Стандарт постановки задачи для агента

Предпочтительный формат:

```text
Task ID:
Goal:
Business context:
Relevant docs:
Module:
Required DB changes:
API:
Permissions:
Audit:
Acceptance Criteria:
Tests:
Out of scope:
```

---

# 84. Пример

```text
Task ID:
TASK-03.04.01

Goal:
Добавить создание актива.

Module:
Assets

Permission:
assets.create

Business rules:
- location belongs to site;
- asset type active;
- model belongs to asset type;
- create AssetEvent;
- create AuditEvent.

API:
POST /api/v1/assets

Tests:
- success;
- invalid site/location;
- inactive type;
- model/type mismatch;
- forbidden;
- wrong scope;
- audit;
- event.
```

---

# 85. Критерий качественной реализации

Хорошее изменение:

- минимально;
- очевидно;
- тестируемо;
- безопасно;
- документировано;
- сохраняет историю;
- уважает module ownership;
- не усложняет архитектуру без необходимости.

---

# 86. Главный принцип для AI

> Не пытайся «улучшить весь проект». Решай конкретную задачу так, чтобы после твоего изменения архитектура оставалась понятнее или такой же понятной, но никогда не становилась менее предсказуемой.

---

# 87. Если существует конфликт

При конфликте между:

- запросом;
- существующим кодом;
- ADR;
- docs;

не маскировать его.

Зафиксировать:

```text
какое правило конфликтует
почему
какой вариант выбран
что требуется решить человеку
```

---

# 88. Нельзя выдавать предположение за принятое решение

Если бизнес-правило не утверждено — не превращать его в hardcoded invariant без явного основания.

---

# 89. Приоритет сохранности данных

Если есть выбор между:

```text
удобством
и
сохранением истории/аудита
```

приоритет имеет сохранность истории и возможность объяснить, что произошло.

---

# 90. Финальная установка

АС «Эксплуатация» — долгоживущая корпоративная система.

Любое изменение должно оцениваться не только по критерию:

```text
"работает сейчас"
```

но и:

```text
"понятно ли это через 3 года,
безопасно ли это для 10 000 пользователей,
сохраняет ли это историю,
можно ли это протестировать,
можно ли это расширить без переписывания ядра".
```
## 91. Documentation Sync Gate

После любого существенного изменения агент обязан выполнить:

```text
docs-impact
→ documentation-sync
```

Если `DOCS_IMPACT: YES`, задача не считается полностью завершённой до:

```text
DOCUMENTATION_SYNC: PASS
```

Обязательно проверять актуальность:

- relevant `docs/modules/<module>.md`;
- relevant `docs/context/<module>.context.md`;
- `database.md` при schema change;
- OpenAPI/module docs при API change;
- ADR index при architectural decision.

Нельзя обновлять документацию под реализацию, которая противоречит Accepted ADR. В таком случае задача блокируется до исправления реализации или принятия нового ADR.

## 92. Resumability and Checkpoints

Every substantial task must be resumable from repository state alone.

The agent must not rely on hidden conversational context as the only record of unfinished work.

For an incomplete substantial task maintain:

```text
.agent/tasks/<TASK-ID>/state.md
```

For multi-agent workstreams:

```text
.agent/tasks/<TASK-ID>/agents/<agent-id>.md
```

After every safe implementation phase, before a long/risky phase, before handoff, and before stopping an incomplete task:

```text
task-checkpoint
```

The checkpoint must record:

- completed work;
- verified checks;
- uncommitted changes;
- decisions;
- blockers;
- last safe commit;
- one concrete NEXT_ACTION;
- DO_NOT_REPEAT items.

A new session or agent must begin unfinished work with:

```text
task-resume <TASK-ID>
```

The resumed agent must inspect Git and task state before making changes.

Never automatically use destructive recovery commands such as:

```text
git reset --hard
git clean -fd
docker compose down -v
```

unless explicitly required and the impact is understood.

Repository/Git state is the factual source of truth; state files are resumability metadata and must be reconciled with Git when they drift.

## 93. Codex orchestration integration snippet

If your project already has an `AGENTS.md`, do not overwrite it blindly.
Merge the following section into the existing file.

## 94. Codex orchestration

For non-trivial development tasks use:
1. `efficient-orchestrator` for general budget-aware execution policy;
2. `as-exploitation-orchestrator` for project-specific domain and parallelization rules.

Default mode: **BALANCED**.

The primary agent owns architecture, shared contracts, decomposition,
integration, migration ordering, and final verification.

In BALANCED mode prefer at most:
- 2 concurrent implementation writers;
- 1–2 narrow scout/test helpers when useful.

Before parallel backend/frontend implementation, freeze:
- data model;
- shared types/enums;
- API/DTO contract;
- state semantics;
- acceptance criteria.

Do not parallelize overlapping changes to:
- DB schema;
- migration sequence;
- shared DTO/types;
- organization hierarchy;
- responsibility model;
- event/history base model;
- reserve/availability semantics;
- global authorization rules.

Measurements must preserve historical observations as a time series.

Preserve extension points, but do not prematurely implement:
- operating schedules;
- maintenance windows;
- dependency solver;
- minimum viable configuration engine;
- reserve sufficiency engine;
- automatic availability-state calculation.

## 95. Repository safety gate

Before T2/T3 work, multi-agent writes, migrations, infrastructure changes, or resuming an interrupted task, run `repository-state-guard`.

If meaningful project files exist but Git has no commits, treat the repository as `BASELINE_REQUIRED` before another substantial write phase.

Do not automatically use destructive recovery commands (`git reset --hard`, `git clean -fd`, `git restore .`, `docker compose down -v`). Preserve unknown changes until ownership is understood.
