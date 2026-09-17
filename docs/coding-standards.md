# АС «Эксплуатация» — Coding Standards

## 1. Назначение документа

Этот документ определяет обязательные стандарты разработки АС «Эксплуатация».

Он обязателен для:

- основного разработчика;
- Codex;
- AI-агентов;
- будущих разработчиков;
- code review;
- CI/CD проверок.

Документ применяется совместно с:

- `concept.md`;
- `roadmap.md`;
- `architecture.md`;
- `database.md`;
- `security.md`;
- `api-guidelines.md`;
- `testing.md`.

Главная цель — обеспечить единообразный код, предсказуемую архитектуру и минимизировать накопление технического долга при длительной разработке с активным использованием AI.

---

# 2. Базовые принципы

## 2.1. Читаемость важнее краткости

Код должен быть:

- очевидным;
- локально понятным;
- минимально магическим;
- удобным для сопровождения;
- удобным для AI-анализа.

Не использовать сложную абстракцию, если простое решение достаточно.

---

## 2.2. Явность важнее неявности

Предпочитать:

```csharp
if (asset.Status == AssetStatus.Decommissioned)
{
    throw new DomainException(...);
}
```

вместо скрытой логики в generic helper, которую сложно отследить.

---

## 2.3. Domain rules не должны жить в Controller

Controller отвечает за:

- HTTP;
- binding;
- auth boundary;
- mapping transport model;
- result.

Controller не реализует бизнес-правила.

---

## 2.4. Infrastructure не определяет domain

Бизнес-модель не должна зависеть от:

- EF Core;
- RabbitMQ;
- Redis;
- ASP.NET;
- S3;
- конкретного identity provider.

---

## 2.5. История не удаляется ради удобства

Код не должен физически удалять бизнес-критичные сущности, если это нарушает аудит и историю.

---

# 3. Язык и версия платформы

Основной backend:

```text
C#
.NET 10 LTS
ASP.NET Core
```

Frontend:

```text
TypeScript
React
```

SQL:

```text
PostgreSQL
```

---

# 4. Структура solution

Рекомендуемая структура:

```text
src/
├── Exploitation.Api/
├── Exploitation.Application/
├── Exploitation.Infrastructure/
├── Exploitation.Shared/
│
├── Modules/
│   ├── Assets/
│   │   ├── Assets.Domain/
│   │   ├── Assets.Application/
│   │   ├── Assets.Infrastructure/
│   │   └── Assets.Contracts/
│   ├── Maintenance/
│   ├── WorkOrders/
│   ├── Defects/
│   └── ...
│
tests/
├── Unit/
├── Integration/
├── Authorization/
└── E2E/
```

---

# 5. Dependency Rules

Разрешённое направление зависимостей:

```text
Api
↓
Application
↓
Domain

Infrastructure
→ Application / Domain

Contracts
← используются другими модулями
```

Запрещено:

```text
Domain → Infrastructure
Domain → ASP.NET
Domain → EF Core
Domain → RabbitMQ
```

---

# 6. Правило владения модулем

Каждый модуль владеет:

- своими сущностями;
- своими таблицами;
- своими use cases;
- своими миграциями;
- своими контрактами;
- своей валидацией.

Другой модуль не должен напрямую обновлять его таблицы.

---

# 7. Namespace conventions

Пример:

```csharp
Exploitation.Modules.Assets.Domain.Entities
Exploitation.Modules.Assets.Application.Commands
Exploitation.Modules.Assets.Application.Queries
Exploitation.Modules.Assets.Infrastructure.Persistence
Exploitation.Modules.Assets.Contracts
```

Namespace должен отражать физическое расположение кода.

---

# 8. Naming conventions C#

## Classes / records / enums

PascalCase:

```csharp
Asset
AssetService
CreateAssetCommand
AssetStatus
```

## Methods

PascalCase:

```csharp
CreateAsync()
ChangeLocation()
ApproveAsync()
```

## Properties

PascalCase:

```csharp
SerialNumber
CommissionedAt
```

## Local variables / parameters

camelCase:

```csharp
assetId
currentUser
```

## Private fields

```csharp
_repository
_clock
_logger
```

---

# 9. Entity naming

Использовать терминологию предметной области.

Хорошо:

```csharp
Asset
WorkOrder
Defect
InventorySession
```

Плохо:

```csharp
EquipmentItemData
ProcessObject
EntityRecord
```

---

# 10. ID naming

Во внешнем и внутреннем API:

```csharp
AssetId
WorkOrderId
DefectId
```

Не использовать:

```csharp
Id1
ObjectId
EntityId
```

если тип сущности известен.

---

# 11. UUIDv7

Основные бизнес-сущности используют UUIDv7.

Не генерировать ID внутри PostgreSQL sequence.

ID создаётся до сохранения сущности.

---

# 12. Date/time

Использовать:

```csharp
DateTimeOffset
```

или отдельный value object.

В БД хранить UTC.

Не использовать `DateTime.Now`.

Использовать abstraction:

```csharp
IClock.UtcNow
```

---

# 13. Enums

Enum допустим для действительно стабильных системных состояний.

Пример:

```csharp
public enum WorkOrderStatus
{
    Draft,
    Planned,
    Assigned,
    InProgress,
    Completed,
    CompletedWithRemarks,
    Accepted,
    Rejected,
    Cancelled
}
```

Если значения должны конфигурироваться бизнесом — использовать справочник БД.

---

# 14. Nullable reference types

Обязательно:

```xml
<Nullable>enable</Nullable>
```

Не подавлять warning без причины.

---

# 15. Records

Использовать `record` для:

- DTO;
- commands;
- queries;
- immutable value objects.

Пример:

```csharp
public sealed record CreateAssetCommand(
    Guid SiteId,
    Guid AssetTypeId,
    Guid? ModelId,
    string? SerialNumber);
```

---

# 16. Domain Entity

Entity должна:

- защищать свои инварианты;
- не иметь публичных setter без необходимости;
- менять состояние через методы.

Пример:

```csharp
public sealed class Asset
{
    public Guid Id { get; private set; }
    public AssetStatus Status { get; private set; }

    public void Decommission(...)
    {
        ...
    }
}
```

---

# 17. Value Objects

Использовать для значимых доменных значений.

Примеры:

```text
SerialNumber
AssetCode
Money
MeasurementValue
DateRange
EmailAddress
```

Не создавать value object для каждого string без пользы.

---

# 18. Domain invariants

Инварианты должны проверяться внутри domain layer.

Пример:

```text
Нельзя списать уже списанный актив.
Нельзя принять WorkOrder без завершения.
Нельзя активировать подрядчика вне действующего assignment.
```

---

# 19. Domain exceptions

Доменные ошибки должны иметь код.

Пример:

```csharp
throw new DomainException(
    "ASSET_ALREADY_DECOMMISSIONED",
    "Asset is already decommissioned.");
```

---

# 20. Application Layer

Application отвечает за use case:

```text
Command / Query
↓
Authorization
↓
Validation
↓
Domain
↓
Repository
↓
Events
```

---

# 21. Command naming

Формат:

```text
Verb + Entity + Command
```

Примеры:

```csharp
CreateAssetCommand
MoveAssetCommand
ApproveWorkOrderCommand
CloseDefectCommand
```

---

# 22. Query naming

Примеры:

```csharp
GetAssetByIdQuery
SearchAssetsQuery
GetMaintenanceCalendarQuery
```

---

# 23. Handler

Один handler — один use case.

Не создавать `AssetService` на 2000 строк.

---

# 24. Validation

Transport validation:

- формат;
- required;
- длина;
- тип.

Business validation:

- domain/application layer.

Не переносить все business rules во FluentValidation.

---

# 25. FluentValidation

Использовать для command/request validation.

Пример:

```csharp
RuleFor(x => x.SerialNumber)
    .MaximumLength(100);
```

---

# 26. Repository Pattern

Repository использовать для aggregate roots и business persistence.

Не создавать generic repository типа:

```csharp
IRepository<T>
```

для всей системы.

Предпочитать:

```csharp
IAssetRepository
IWorkOrderRepository
```

---

# 27. Query services

Для сложного чтения использовать query service / Dapper.

Пример:

```csharp
IAssetSearchQuery
IObjectDashboardQuery
```

Не заставлять EF Core грузить огромный aggregate ради read-only отчёта.

---

# 28. EF Core

Использовать:

- explicit configuration;
- migrations;
- no lazy loading;
- AsNoTracking для чтения;
- projection вместо Include, где возможно.

---

# 29. EF Entity Configuration

Каждая сущность — отдельный configuration class.

Пример:

```csharp
internal sealed class AssetConfiguration
    : IEntityTypeConfiguration<Asset>
```

Не собирать mapping всего модуля в одном файле.

---

# 30. Lazy Loading

Запрещён.

Причина:

- скрытые запросы;
- N+1;
- сложный performance debug.

---

# 31. Includes

Использовать осознанно.

Для API списка предпочитать projection:

```csharp
.Select(x => new AssetListItem(...))
```

---

# 32. Tracking

По умолчанию read-only запрос:

```csharp
.AsNoTracking()
```

Tracking только когда сущность будет изменяться.

---

# 33. Transactions

Use case, меняющий несколько сущностей одного модуля, выполняется в одной транзакции.

Межмодульная надёжность — через outbox/event.

---

# 34. Unit of Work

Не создавать отдельный абстрактный UoW поверх EF без необходимости.

`DbContext` уже является Unit of Work.

---

# 35. SaveChanges

Не вызывать `SaveChangesAsync()` в случайных repository methods.

Транзакционной границей управляет application use case.

---

# 36. Raw SQL

Допускается:

- тяжёлая аналитика;
- оптимизированные запросы;
- bulk operations.

Обязательно:

- параметризация;
- integration tests;
- документация причины.

---

# 37. Dapper

Использовать для:

- complex read models;
- dashboards;
- reports;
- large search result projections.

Не использовать Dapper как второй ORM для обычного CRUD без причины.

---

# 38. Database naming

PostgreSQL:

```text
snake_case
```

Пример:

```text
asset_id
created_at
work_order_status
```

---

# 39. Table naming

Предпочтительно множественное число:

```text
assets
asset_events
work_orders
defects
```

---

# 40. Foreign keys

Формат:

```text
<entity>_id
```

Пример:

```text
site_id
asset_id
created_by
```

---

# 41. Index naming

Формат:

```text
ix_<table>_<columns>
```

Пример:

```text
ix_assets_site_id_status
```

Unique:

```text
ux_assets_inventory_number
```

---

# 42. Constraints naming

Пример:

```text
fk_assets_sites_site_id
ck_measurements_value_valid
```

---

# 43. API Controllers

Controller должен быть тонким.

Не более:

- binding;
- call mediator/application;
- map result.

---

# 44. REST endpoints

Использовать resource oriented API.

Хорошо:

```text
POST /api/v1/assets
GET /api/v1/assets/{id}
POST /api/v1/work-orders/{id}/complete
```

Допустим action endpoint для бизнес-команды.

---

# 45. HTTP verbs

```text
GET    read
POST   create / command
PUT    full replace where applicable
PATCH  partial change
DELETE only where physical deletion допустимо
```

---

# 46. API DTO

Domain entity не возвращается напрямую в API.

Всегда transport DTO.

---

# 47. API versioning

URL:

```text
/api/v1/
```

Breaking changes требуют новой версии.

---

# 48. Pagination

Все потенциально большие списки:

```text
page
pageSize
```

или cursor pagination.

Не возвращать 100 000 assets одним запросом.

---

# 49. Default page size

Рекомендуемо:

```text
50
```

Maximum:

```text
200
```

Кроме специализированных export endpoints.

---

# 50. Filtering

Фильтры должны быть явными.

Пример:

```text
GET /assets?siteId=...&status=...
```

Не делать универсальный dynamic SQL filter DSL на старте.

---

# 51. Errors

Использовать единый error contract.

```json
{
  "code": "ASSET_NOT_FOUND",
  "message": "Актив не найден.",
  "correlationId": "..."
}
```

---

# 52. Error codes

Код ошибки стабилен.

Пользовательский текст может локализоваться.

---

# 53. Logging

Использовать structured logging.

Хорошо:

```csharp
_logger.LogInformation(
    "WorkOrder {WorkOrderId} completed by {UserId}",
    workOrderId,
    userId);
```

Плохо:

```csharp
_logger.LogInformation(
    $"WorkOrder {workOrderId} completed");
```

---

# 54. Не логировать секреты

Запрещено логировать:

- passwords;
- tokens;
- secrets;
- full authorization headers;
- персональные чувствительные данные без необходимости.

---

# 55. Correlation ID

Каждый HTTP request и background job имеет correlation ID.

Он передаётся:

- API;
- logs;
- outbox;
- RabbitMQ;
- workers.

---

# 56. Audit vs Log

Log:

- техническая диагностика.

Audit:

- бизнес-доказательство действия пользователя.

Нельзя заменять audit обычным application log.

---

# 57. Domain Events

Domain event описывает факт.

Хорошо:

```text
WorkOrderCompleted
AssetMoved
DefectClosed
```

Плохо:

```text
SendEmailEvent
UpdateDashboardEvent
```

---

# 58. Integration Events

Integration event создаётся из domain/application event через outbox.

---

# 59. Event naming

Past tense:

```text
AssetCommissioned
DefectCreated
WorkOrderAccepted
```

---

# 60. Event payload

Содержит только необходимые данные.

Не сериализовать целую EF entity.

---

# 61. Idempotency

Команды, которые могут быть повторно отправлены, должны поддерживать idempotency.

Особенно:

- mobile/offline;
- payments/cost later;
- imports;
- integrations;
- file completion;
- work completion.

---

# 62. Background workers

Worker должен быть:

- idempotent;
- retry-safe;
- observable;
- cancellable.

---

# 63. Retry

Использовать bounded retry.

Не создавать бесконечный retry loop.

---

# 64. Dead Letter Queue

Для RabbitMQ messages, которые невозможно обработать.

---

# 65. Redis

Redis не источник истины.

Если Redis удалён — система должна восстановиться.

---

# 66. Cache keys

Формат:

```text
<module>:<entity>:<id>:<version>
```

---

# 67. Frontend TypeScript

`strict` mode обязателен.

---

# 68. Frontend any

`any` запрещён без комментария/причины.

---

# 69. Frontend naming

Компоненты:

```text
AssetCard
WorkOrderChecklist
DefectBadge
```

Hooks:

```text
useAsset
useWorkOrder
```

---

# 70. Frontend API layer

Компоненты не вызывают `fetch()` хаотично.

Все API calls через единый client layer.

---

# 71. Server state

Использовать TanStack Query / React Query.

Не копировать server state без необходимости в global store.

---

# 72. Form handling

Использовать единый подход.

Например:

- React Hook Form;
- Zod.

---

# 73. Frontend permissions

Frontend permission checks нужны только для UX.

Backend — источник решения о доступе.

---

# 74. Component size

Если компонент > ~300 строк и содержит несколько независимых обязанностей — рассмотреть декомпозицию.

Это guideline, не абсолютное правило.

---

# 75. CSS

Использовать единый подход:

- CSS modules;
- Tailwind;
- либо component library.

Не смешивать пять подходов.

---

# 76. Localization

UI строки не должны быть размазаны по коду.

Предусмотреть i18n.

Первый язык — русский.

---

# 77. Testing

Каждый новый use case должен иметь tests.

Минимум:

- happy path;
- invalid state;
- authorization;
- important edge case.

---

# 78. Unit tests

Тестируют:

- domain rules;
- value objects;
- calculations;
- risk/maintenance rules.

---

# 79. Integration tests

Используют реальный PostgreSQL через container/test environment.

Не использовать SQLite вместо PostgreSQL для критичных persistence tests.

---

# 80. Authorization tests

Обязательны для:

- contractor scope;
- region scope;
- object scope;
- cross-context access;
- document access.

---

# 81. E2E

Минимальные критические сценарии перечислены в `architecture.md`.

---

# 82. Test naming

Формат:

```text
Method_State_ExpectedResult
```

или BDD-стиль:

```text
Given_When_Then
```

Главное — единый стиль проекта.

---

# 83. Test data

Не использовать production data без анонимизации.

---

# 84. Mocks

Mock только внешние границы.

Не mock'ать собственную domain logic.

---

# 85. Comments

Комментарий отвечает на вопрос:

```text
Почему?
```

а не:

```text
Что делает эта строка?
```

---

# 86. XML documentation

Обязательно для:

- public contracts;
- сложных domain abstractions;
- integration interfaces.

Не документировать очевидные private methods.

---

# 87. TODO

TODO должен содержать issue reference.

Плохо:

```csharp
// TODO fix later
```

Хорошо:

```csharp
// TODO EXP-214: move to background validation
```

---

# 88. Magic numbers

Запрещены.

Порог должен быть:

- config;
- rule;
- constant;
- domain value.

---

# 89. Configuration

Не хранить environment-specific значения в коде.

Использовать:

- appsettings;
- env vars;
- secret store.

---

# 90. Secrets

Никогда не commit:

- passwords;
- private keys;
- connection strings with secrets;
- tokens.

---

# 91. Feature Flags

Неприоритетный функционал включается через feature flags.

Примеры:

```text
AdvancedCostTracking
TravelTimeTracking
AdvancedRiskRules
```

---

# 92. Security first

Любая новая сущность должна отвечать на вопросы:

1. Кто может читать?
2. Кто может создавать?
3. Кто может изменять?
4. Кто может утверждать?
5. Кто может видеть историю?
6. Подрядчик это видит?

---

# 93. Upload validation

Любой upload проходит:

- size validation;
- mime validation;
- extension validation;
- hash;
- antivirus where configured.

---

# 94. File names

Не использовать пользовательский filename как physical storage key.

---

# 95. Sensitive data

Минимизировать хранение персональных данных.

Хранить только то, что нужно для процесса.

---

# 96. Performance

При добавлении списка/поиска разработчик обязан проверить:

- index;
- query plan;
- pagination;
- N+1.

---

# 97. Async

I/O методы — async.

Не использовать `.Result` и `.Wait()`.

---

# 98. CancellationToken

Все долгие async operations принимают `CancellationToken`.

---

# 99. LINQ

Не строить нечитабельные LINQ pipelines на десятки операций.

Разбивать на понятные шаги.

---

# 100. Collections

Возвращать read-only интерфейс, если изменение коллекции извне не требуется.

---

# 101. Validation of state transitions

Статусы меняются только через методы/use cases.

Не разрешать:

```csharp
workOrder.Status = ...
```

из случайного handler.

---

# 102. State machine

Для сложных lifecycle использовать явную таблицу допустимых переходов.

---

# 103. Status history

Каждый важный status change сохраняется отдельно.

---

# 104. Soft assumptions

Не кодировать предположения без документации.

Пример:

```text
"все ДГУ принадлежат эксплуатации"
```

должно быть справочником/правилом, а не hidden code.

---

# 105. Master Data

Производители, модели, типы оборудования и единицы измерения — справочники.

Не плодить свободный текст.

---

# 106. Search normalization

Для поиска:

- trim;
- normalized representation;
- indexes.

Но оригинальное значение сохранять.

---

# 107. Serial numbers

Не менять регистр/формат серийного номера необратимо.

Можно хранить normalized field для поиска.

---

# 108. Money

Если будет стоимость:

```text
amount + currency
```

Не использовать `double`.

Использовать `decimal`.

---

# 109. Measurements

Числовые измерения — `decimal` там, где нужна точность.

Не использовать float без причины.

---

# 110. Units

Значение всегда связано с unit.

Не хранить число `24.5` без понимания, что это V, °C, bar и т.д.

---

# 111. Import code

Импорт имеет стадии:

```text
parse
validate
preview
confirm
persist
report
```

Не писать raw Excel напрямую в domain tables.

---

# 112. Bulk operations

Для bulk import использовать специализированные механизмы, но сохранять audit/validation.

---

# 113. Migration discipline

Каждая schema change:

- migration;
- rollback strategy or forward fix;
- test;
- review.

---

# 114. Breaking DB changes

Использовать expand/contract.

Не удалять колонку в том же релизе, где приложение перестало её использовать.

---

# 115. ADR

Новый infrastructure component требует ADR.

Пример:

- Elasticsearch;
- Kafka;
- Kubernetes;
- second database.

---

# 116. PR size

Предпочтительно:

- один use case;
- один модуль;
- обозримый diff.

Не делать PR на десятки несвязанных изменений.

---

# 117. PR checklist

Каждый PR проверяет:

- architecture;
- business rules;
- tests;
- auth;
- audit;
- migration;
- performance;
- docs.

---

# 118. Commit messages

Рекомендуется Conventional Commits.

Пример:

```text
feat(assets): add asset replacement flow
fix(workorders): prevent duplicate completion
docs(architecture): clarify outbox usage
```

---

# 119. Branch naming

Пример:

```text
feature/EXP-123-asset-replacement
fix/EXP-214-workorder-status
```

---

# 120. AI Agent Rules

Codex/AI-агент перед изменением должен:

1. Прочитать `concept.md`.
2. Прочитать `architecture.md`.
3. Прочитать `coding-standards.md`.
4. Прочитать релевантный раздел `database.md`.
5. Найти существующие patterns.
6. Не создавать новый pattern без необходимости.
7. Сформировать план изменений.
8. Добавить tests.
9. Обновить docs при изменении поведения.

---

# 121. AI Agent запрещено

Без явного решения нельзя:

- менять domain boundaries;
- добавлять infrastructure;
- менять auth model;
- физически удалять history;
- вводить новый status;
- дублировать существующий aggregate;
- делать cross-module DB write;
- bypass audit;
- bypass authorization.

---

# 122. Если AI не уверен

AI должен:

- выбрать существующий pattern;
- минимизировать изменения;
- оставить вопрос/ADR;
- не изобретать новую архитектуру.

---

# 123. Definition of Done

Код считается готовым, если:

1. Собирается без warning критичного уровня.
2. Tests зелёные.
3. Есть authorization.
4. Есть audit, если нужен.
5. Есть migration, если изменена БД.
6. API документирован.
7. Нет N+1.
8. Ошибки используют общий формат.
9. Логи структурированы.
10. Документация обновлена.
11. Use case проверен вручную.
12. Не нарушены module boundaries.

---

# 124. Anti-patterns

Запрещённые практики:

- God Service;
- generic repository everywhere;
- generic CRUD controller for domain;
- business logic in controller;
- hidden DB writes;
- database triggers для основной business logic;
- shared mutable global state;
- static service locator;
- direct access to another module's tables;
- physical deletion of critical history;
- magic status strings;
- excessive reflection;
- unnecessary dynamic;
- premature microservices.

---

# 125. Финальный принцип

> Код должен быть настолько простым, насколько это возможно, но не проще предметной области.

Для проекта важнее:

```text
ясные правила
+
история
+
безопасность
+
тестируемость
+
предсказуемость
```

чем:

```text
минимальное количество строк
или
максимальное количество abstractions
```
