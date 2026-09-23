# АС «Эксплуатация» — Project Structure

## 1. Назначение документа

Этот документ определяет физическую структуру репозитория АС «Эксплуатация».

Он отвечает на практические вопросы:

- где лежит backend;
- где лежит frontend;
- как устроены доменные модули;
- где размещать contracts;
- где размещать migrations;
- где хранить tests;
- где хранить scripts;
- где хранить deployment manifests;
- куда Codex должен добавлять новый код;
- какие зависимости между проектами разрешены.

Документ применяется совместно с:

- `concept.md`;
- `architecture.md`;
- `coding-standards.md`;
- `database.md`;
- `api-guidelines.md`;
- `security.md`;
- `testing.md`;
- `deployment.md`;
- `dev-environment.md`;
- `backlog.md`;
- `adr/*`.

---

# 2. Главный принцип структуры

> Структура репозитория должна отражать доменную архитектуру, а не технические слои всего приложения.

То есть не:

```text
Controllers/
Services/
Repositories/
Entities/
```

на весь проект.

А:

```text
Modules/
  Assets/
  Maintenance/
  WorkOrders/
  Defects/
```

и внутри каждого модуля уже свои слои.

---

# 3. Корневая структура репозитория

Рекомендуемая структура:

```text
/
├── src/
│   ├── backend/
│   └── frontend/
│
├── tests/
│   ├── backend/
│   ├── frontend/
│   └── e2e/
│
├── docs/
│   ├── adr/
│   ├── modules/
│   ├── runbooks/
│   └── diagrams/
│
├── deploy/
│   ├── docker/
│   ├── compose/
│   ├── nginx/
│   └── environments/
│
├── scripts/
│   ├── dev/
│   ├── db/
│   ├── ci/
│   └── maintenance/
│
├── tools/
│
├── .github/
│   └── workflows/
│
├── .editorconfig
├── .gitattributes
├── .gitignore
├── .env.example
├── global.json
├── Directory.Build.props
├── Directory.Packages.props
├── docker-compose.yml
├── README.md
└── Exploitation.sln
```

---

# 4. Backend structure

```text
src/backend/
├── Exploitation.Api/
├── Exploitation.AuditDelivery/
├── Exploitation.Bootstrap/
├── Exploitation.Shared/
│
├── Modules/
│   ├── Identity/
│   ├── Organization/
│   ├── Sites/
│   ├── Assets/
│   ├── Maintenance/
│   ├── WorkOrders/
│   ├── Measurements/
│   ├── Defects/
│   ├── Repairs/
│   ├── Inventory/
│   ├── Incidents/
│   ├── Changes/
│   ├── Documents/
│   ├── Contractors/
│   ├── Qualifications/
│   ├── Notifications/
│   ├── Audit/
│   ├── Reports/
│   └── Integrations/
│
└── Workers/
    ├── Exploitation.Workers/
    └── Exploitation.Workers.Contracts/
```

---

# 5. Exploitation.Api

Назначение:

- HTTP host;
- middleware;
- OpenAPI;
- authentication;
- global exception handling;
- route registration;
- health checks.

Структура:

```text
Exploitation.Api/
├── Middleware/
│   ├── CorrelationIdMiddleware.cs
│   ├── ExceptionHandlingMiddleware.cs
│   └── WorkingContextMiddleware.cs
│
├── OpenApi/
├── Health/
├── Filters/
├── Extensions/
│   ├── AuthenticationExtensions.cs
│   ├── AuthorizationExtensions.cs
│   ├── OpenApiExtensions.cs
│   └── HealthCheckExtensions.cs
│
├── Program.cs
└── Exploitation.Api.csproj
```

В `Api` не должна жить бизнес-логика.

---

# 6. Exploitation.Bootstrap

Назначение:

- регистрация модулей;
- композиция Dependency Injection;
- запуск migrations/checks;
- общая конфигурация приложения.

Пример:

```text
Exploitation.Bootstrap/
├── ModuleRegistration.cs
├── InfrastructureRegistration.cs
├── OptionsRegistration.cs
└── Exploitation.Bootstrap.csproj
```

---

# 7. Exploitation.Shared

Только действительно общие примитивы.

Пример:

```text
Exploitation.Shared/
├── Domain/
│   ├── Entity.cs
│   ├── AggregateRoot.cs
│   ├── DomainEvent.cs
│   └── DomainException.cs
│
├── Application/
│   ├── Result.cs
│   ├── Error.cs
│   ├── IClock.cs
│   └── Pagination.cs
│
├── Contracts/
│   └── CorrelationContext.cs
│
└── Exploitation.Shared.csproj
```

---

# 8. Что запрещено помещать в Shared

Нельзя превращать Shared в:

```text
SharedEverything/
```

Не класть туда:

- Asset;
- User;
- WorkOrder;
- Defect;
- generic business services;
- module-specific validators;
- module-specific DTO.

Правило:

> Если тип нужен только двум модулям, это ещё не значит, что он должен быть Shared.

---

# 9. Структура одного модуля

Пример `Assets`:

```text
Modules/Assets/
├── Exploitation.Modules.Assets.Domain/
├── Exploitation.Modules.Assets.Application/
├── Exploitation.Modules.Assets.Infrastructure/
├── Exploitation.Modules.Assets.Contracts/
└── Exploitation.Modules.Assets.Api/
```

`Api`-проект модуля необязателен как отдельная assembly.

Можно использовать folders/endpoints внутри main API, но для крупного проекта модульный API layer полезен.

---

# 10. Assets.Domain

```text
Exploitation.Modules.Assets.Domain/
├── Assets/
│   ├── Asset.cs
│   ├── AssetId.cs
│   ├── AssetStatus.cs
│   ├── AssetCondition.cs
│   └── Events/
│       ├── AssetCreatedDomainEvent.cs
│       ├── AssetMovedDomainEvent.cs
│       └── AssetDecommissionedDomainEvent.cs
│
├── AssetTypes/
├── AssetModels/
├── Relations/
├── Responsibilities/
├── Replacements/
├── Warranties/
│
├── Exceptions/
├── Services/
└── Exploitation.Modules.Assets.Domain.csproj
```

---

# 11. Domain project rules

Domain содержит:

- aggregates;
- entities;
- value objects;
- domain events;
- domain services;
- invariants.

Domain не содержит:

- DbContext;
- EF configuration;
- HTTP;
- JSON DTO;
- RabbitMQ;
- Redis;
- S3;
- controller;
- OpenAPI.

---

# 12. Assets.Application

```text
Exploitation.Modules.Assets.Application/
├── Assets/
│   ├── Create/
│   │   ├── CreateAssetCommand.cs
│   │   ├── CreateAssetHandler.cs
│   │   ├── CreateAssetValidator.cs
│   │   └── CreateAssetResult.cs
│   │
│   ├── Move/
│   ├── Decommission/
│   ├── GetById/
│   └── Search/
│
├── Relations/
├── Responsibilities/
├── Replacements/
│
├── Abstractions/
│   ├── IAssetRepository.cs
│   ├── IAssetQueryService.cs
│   └── IUnitOfWork.cs
│
├── Authorization/
├── Mapping/
└── Exploitation.Modules.Assets.Application.csproj
```

---

# 13. Application organization by use case

Предпочтительно:

```text
Assets/Create/
Assets/Move/
Assets/Decommission/
```

а не:

```text
Commands/
Queries/
Handlers/
Validators/
```

на весь модуль.

Причина:

Use case должен быть локализован в одном месте.

---

# 14. Vertical slice inside module

Один use case:

```text
CreateAsset/
├── CreateAssetCommand.cs
├── CreateAssetValidator.cs
├── CreateAssetHandler.cs
├── CreateAssetResult.cs
└── CreateAssetAuthorization.cs
```

Это облегчает работу:

- разработчику;
- code review;
- Codex.

---

# 15. Assets.Infrastructure

```text
Exploitation.Modules.Assets.Infrastructure/
├── Persistence/
│   ├── AssetsDbContext.cs
│   ├── Configurations/
│   │   ├── AssetConfiguration.cs
│   │   ├── AssetModelConfiguration.cs
│   │   └── AssetRelationConfiguration.cs
│   │
│   ├── Repositories/
│   │   └── AssetRepository.cs
│   │
│   └── Migrations/
│
├── Queries/
│   ├── AssetSearchQuery.cs
│   └── AssetDetailsQuery.cs
│
├── Services/
└── Exploitation.Modules.Assets.Infrastructure.csproj
```

---

# 16. Infrastructure rules

Infrastructure реализует interfaces из Application/Domain.

Например:

```text
IAssetRepository
    ↓
AssetRepository
```

Domain/Application не знают, что используется PostgreSQL.

---

# 17. Assets.Contracts

```text
Exploitation.Modules.Assets.Contracts/
├── Queries/
│   ├── AssetSummary.cs
│   └── AssetReference.cs
│
├── Events/
│   ├── AssetCommissionedIntegrationEvent.cs
│   └── AssetReplacedIntegrationEvent.cs
│
├── Services/
│   └── IAssetsModule.cs
│
└── Exploitation.Modules.Assets.Contracts.csproj
```

---

# 18. Contracts purpose

Contracts используются другими модулями.

Пример:

```text
Maintenance
→ Assets.Contracts
```

Но:

```text
Maintenance
→ Assets.Infrastructure
```

запрещено.

---

# 19. Module API layer

Пример:

```text
Exploitation.Modules.Assets.Api/
├── Endpoints/
│   ├── CreateAssetEndpoint.cs
│   ├── GetAssetEndpoint.cs
│   ├── SearchAssetsEndpoint.cs
│   └── MoveAssetEndpoint.cs
│
├── Requests/
├── Responses/
└── AssetsApiModule.cs
```

---

# 20. Controllers vs Minimal API

Допустимы оба варианта.

Для проекта рекомендуется один стиль на весь backend.

Предпочтительный вариант:

```text
ASP.NET Core Minimal API
+
module endpoint registration
```

Причина:

- меньше ceremony;
- удобно vertical slices;
- проще локализовать endpoint рядом с use case.

Если команда позже выберет Controllers — решение фиксируется и применяется единообразно.

---

# 21. Endpoint naming

Пример:

```text
CreateAssetEndpoint
GetAssetByIdEndpoint
SearchAssetsEndpoint
MoveAssetEndpoint
```

---

# 22. Backend dependency graph

```text
Api
↓
Module.Api
↓
Module.Application
↓
Module.Domain

Module.Infrastructure
→ Module.Application
→ Module.Domain

Module.Application
→ OtherModule.Contracts (при необходимости)
```

---

# 23. Запрещённые references

Запрещено:

```text
Assets.Domain
→ Maintenance.Application

Assets.Application
→ WorkOrders.Infrastructure

Defects.Infrastructure
→ Assets.Infrastructure
```

---

# 24. DbContext strategy

На старте рекомендуется отдельный DbContext на модуль.

Пример:

```text
IdentityDbContext
SitesDbContext
AssetsDbContext
MaintenanceDbContext
WorkOrdersDbContext
```

Все используют одну PostgreSQL database, но разные schemas.

---

# 25. Почему несколько DbContext

Плюсы:

- ownership виден в коде;
- migrations локализованы;
- сложнее случайно писать в чужую schema;
- проще будущее выделение модуля.

---

# 26. DbContext limitation

Один модуль не inject'ит DbContext другого модуля.

---

# 27. Migrations

Каждый Infrastructure проект владеет своими migrations.

Пример:

```text
Assets.Infrastructure/
└── Persistence/
    └── Migrations/
```

---

# 28. Migration naming

Пример:

```text
20260916_InitialAssets
20260918_AddAssetResponsibilities
```

Фактический EF migration ID будет системным, но readable name обязателен.

---

# 29. Cross-schema FK

Допустим на этапе modular monolith.

Но создаётся только при ясной необходимости.

Application ownership при этом не меняется.

---

# 30. WorkOrders module structure

```text
Modules/WorkOrders/
├── Domain/
│   ├── WorkOrders/
│   ├── Steps/
│   ├── Participants/
│   ├── Labor/
│   └── Materials/
│
├── Application/
│   ├── CreateFromMaintenance/
│   ├── Assign/
│   ├── Start/
│   ├── UpdateStep/
│   ├── Complete/
│   ├── Review/
│   └── Accept/
│
├── Infrastructure/
├── Contracts/
└── Api/
```

---

# 31. Maintenance module structure

```text
Modules/Maintenance/
├── Domain/
│   ├── Templates/
│   ├── TemplateVersions/
│   ├── Operations/
│   ├── FrequencyRules/
│   └── Plans/
│
├── Application/
│   ├── CreateTemplate/
│   ├── PublishVersion/
│   ├── ResolveFrequency/
│   ├── RecalculatePlan/
│   └── GenerateSchedule/
│
├── Infrastructure/
├── Contracts/
└── Api/
```

---

# 32. Defects module structure

```text
Modules/Defects/
├── Domain/
│   ├── Defects/
│   ├── Observations/
│   ├── Recurrence/
│   └── Escalation/
│
├── Application/
│   ├── Create/
│   ├── AddObservation/
│   ├── LinkRecurrence/
│   ├── Assign/
│   ├── Resolve/
│   └── Close/
│
├── Infrastructure/
├── Contracts/
└── Api/
```

---

# 33. Inventory module structure

```text
Modules/Inventory/
├── Domain/
│   ├── Sessions/
│   ├── ExpectedItems/
│   ├── Observations/
│   ├── Discrepancies/
│   └── Reports/
│
├── Application/
│   ├── CreateSession/
│   ├── Start/
│   ├── Scan/
│   ├── CreateDraftAsset/
│   ├── FinishScan/
│   ├── GenerateReport/
│   └── Approve/
│
├── Infrastructure/
├── Contracts/
└── Api/
```

---

# 34. Changes module structure

```text
Modules/Changes/
├── Domain/
│   ├── Changes/
│   ├── Tasks/
│   ├── Windows/
│   ├── Risk/
│   ├── Approvals/
│   └── RollbackPlans/
│
├── Application/
│   ├── Create/
│   ├── AddTask/
│   ├── AddRiskAssessment/
│   ├── DecideRisk/
│   ├── AcceptResidualRisk/
│   ├── Approve/
│   └── Complete/
│
├── Infrastructure/
├── Contracts/
└── Api/
```

---

# 35. Frontend root structure

Рекомендуемая структура:

```text
src/frontend/
├── src/
│   ├── app/
│   ├── pages/
│   ├── widgets/
│   ├── features/
│   ├── entities/
│   ├── shared/
│   └── modules/
│
├── public/
├── tests/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── eslint.config.js
```

---

# 36. Frontend app

```text
src/app/
├── App.tsx
├── router/
├── providers/
│   ├── AuthProvider.tsx
│   ├── QueryProvider.tsx
│   └── FeatureFlagsProvider.tsx
│
├── layout/
└── config/
```

---

# 37. Frontend pages

Page — route-level composition.

Пример:

```text
pages/
├── SitesPage/
├── SiteDetailsPage/
├── AssetDetailsPage/
├── MaintenanceCalendarPage/
├── WorkOrderPage/
└── InventorySessionPage/
```

Page не должна содержать всю business logic.

---

# 38. Frontend entities

Пример:

```text
entities/
├── asset/
├── site/
├── workOrder/
├── defect/
└── user/
```

Содержит:

- types;
- read hooks;
- display components;
- formatters.

---

# 39. Frontend features

Feature — пользовательское действие.

Пример:

```text
features/
├── createAsset/
├── moveAsset/
├── completeWorkOrder/
├── addDefect/
├── scanInventoryAsset/
└── switchWorkContext/
```

---

# 40. Frontend widgets

Крупные composite UI blocks:

```text
widgets/
├── AssetTimeline/
├── SiteAssetTree/
├── WorkOrderChecklist/
├── InventoryProgress/
└── DefectSummary/
```

---

# 41. Frontend shared

Допустимо:

```text
shared/
├── api/
├── ui/
├── lib/
├── hooks/
├── config/
└── types/
```

Не складывать туда domain-specific компоненты.

---

# 42. Frontend API organization

Пример:

```text
shared/api/
├── client.ts
├── errors.ts
└── generated/
```

Module-specific:

```text
entities/asset/api/
features/createAsset/api/
```

---

# 43. Generated API code

Если OpenAPI генерирует client/types:

```text
shared/api/generated/
```

Generated code:

- не редактировать вручную;
- перегенерировать командой/script.

---

# 44. Tests root

```text
tests/
├── backend/
│   ├── Unit/
│   ├── Integration/
│   ├── Authorization/
│   ├── Architecture/
│   └── Performance/
│
├── frontend/
│   ├── Unit/
│   └── Integration/
│
└── e2e/
    └── Playwright/
```

---

# 45. Backend unit tests

Рекомендуется зеркалить module structure.

```text
tests/backend/Unit/
├── Assets/
├── Maintenance/
├── WorkOrders/
├── Defects/
└── Changes/
```

---

# 46. Integration tests

```text
tests/backend/Integration/
├── Assets/
├── Maintenance/
├── WorkOrders/
├── Inventory/
└── Fixtures/
```

---

# 47. Authorization tests

Отдельно:

```text
tests/backend/Authorization/
├── Assets/
├── Documents/
├── Contractors/
├── WorkOrders/
└── Helpers/
```

Почему отдельно:

security boundary — отдельная зона риска.

---

# 48. Architecture tests

Создать автоматические tests на dependency rules.

Примеры:

- Domain не зависит от Infrastructure;
- module не зависит от чужого Infrastructure;
- Shared не зависит от modules;
- Contracts не зависят от Infrastructure.

Можно использовать:

- NetArchTest;
- ArchUnitNET;
- собственные reflection tests.

---

# 49. Architecture test examples

```text
Assets.Domain
must not reference
EntityFrameworkCore
```

```text
Maintenance.Application
must not reference
Assets.Infrastructure
```

---

# 50. E2E structure

```text
tests/e2e/Playwright/
├── auth/
├── assets/
├── maintenance/
├── defects/
├── inventory/
├── incidents/
└── changes/
```

---

# 51. Docs structure

```text
docs/
├── Q&A.md
├── concept.md
├── roadmap.md
├── architecture.md
├── coding-standards.md
├── database.md
├── api-guidelines.md
├── security.md
├── testing.md
├── deployment.md
├── dev-environment.md
├── project-structure.md
├── backlog.md
│
├── adr/
├── modules/
├── diagrams/
└── runbooks/
```

---

# 52. Module docs

Каждый зрелый модуль получает:

```text
docs/modules/assets.md
docs/modules/maintenance.md
docs/modules/workorders.md
```

Содержимое:

- purpose;
- ownership;
- entities;
- lifecycle;
- permissions;
- API;
- events;
- invariants.

---

# 53. Diagrams

```text
docs/diagrams/
```

Можно хранить:

- Mermaid source;
- PlantUML;
- exported images при необходимости.

Source diagram preferred.

---

# 54. Runbooks

```text
docs/runbooks/
```

Например:

```text
database-restore.md
failed-migration.md
rabbitmq-backlog.md
object-storage-failure.md
dev-reset.md
```

---

# 55. ADR structure

```text
docs/adr/
├── README.md
├── ADR-001-modular-monolith.md
...
```

---

# 56. Scripts structure

```text
scripts/
├── dev/
│   ├── dev-up.ps1
│   ├── dev-down.ps1
│   └── dev-reset.ps1
│
├── db/
│   ├── migrate.ps1
│   ├── reset.ps1
│   └── seed.ps1
│
├── ci/
│   ├── check.ps1
│   └── verify-openapi.ps1
│
└── maintenance/
    └── generate-partitions.ps1
```

Cross-platform alternative допустим.

---

# 57. Deploy structure

```text
deploy/
├── docker/
│   ├── api.Dockerfile
│   ├── web.Dockerfile
│   └── worker.Dockerfile
│
├── compose/
│   ├── docker-compose.dev.yml
│   ├── docker-compose.test.yml
│   └── docker-compose.stage.yml
│
├── nginx/
│   └── nginx.conf
│
└── environments/
    ├── dev/
    ├── test/
    ├── stage/
    └── prod/
```

Secrets в `deploy/environments` не хранятся.

---

# 58. Tools directory

Только внутренние утилиты проекта.

Пример:

```text
tools/
├── ImportTool/
├── DataGenerator/
└── MigrationInspector/
```

Не создавать tool, если задача нормально решается script'ом.

---

# 59. Namespaces

Backend namespace должен соответствовать module/layer.

Пример:

```text
Exploitation.Modules.Assets.Domain.Assets
Exploitation.Modules.Assets.Application.Assets.Create
Exploitation.Modules.Assets.Infrastructure.Persistence
Exploitation.Modules.Assets.Contracts.Events
```

---

# 60. Project naming

Формат:

```text
Exploitation.Modules.<Module>.<Layer>
```

Пример:

```text
Exploitation.Modules.Inventory.Application
```

---

# 61. Test project naming

Формат:

```text
Exploitation.Modules.Assets.UnitTests
Exploitation.Modules.Assets.IntegrationTests
```

или centralized test projects с module folders.

Выбрать один стиль и придерживаться.

Для первого этапа проще centralized test assemblies, чтобы не получить десятки csproj слишком рано.

---

# 62. Recommended initial csproj count

Не создавать по 5 projects на 18 модулей в первый день.

Начальный компромисс:

```text
Exploitation.Api
Exploitation.Shared

Assets.Domain
Assets.Application
Assets.Infrastructure
Assets.Contracts

Sites.Domain
Sites.Application
Sites.Infrastructure
Sites.Contracts

Identity...
```

Добавлять module assemblies по мере начала реализации модуля.

---

# 63. Avoid empty architecture

Не создавать сотню пустых папок/classes только ради будущего.

Структура растёт по roadmap.

---

# 64. Module registration

Каждый модуль предоставляет registration extension.

Пример:

```csharp
services.AddAssetsModule(configuration);
services.AddMaintenanceModule(configuration);
```

---

# 65. Endpoint registration

Пример:

```csharp
app.MapAssetsEndpoints();
app.MapMaintenanceEndpoints();
```

---

# 66. Module startup contract

Желательно стандартизировать:

```text
Add<Module>Module
Map<Module>Endpoints
```

---

# 67. Module-specific settings

Пример:

```text
MaintenanceOptions
DocumentsOptions
InventoryOptions
```

Strongly typed options + validation.

---

# 68. Event placement

Domain event:

```text
Domain/.../Events/
```

Integration/public event:

```text
Contracts/Events/
```

Не путать.

---

# 69. DTO placement

HTTP request/response DTO:

```text
Module.Api
```

Application command/query result:

```text
Module.Application
```

Cross-module DTO:

```text
Module.Contracts
```

---

# 70. Repository interface placement

Repository interface:

```text
Application/Abstractions
```

или Domain, если repository является частью domain model.

Implementation:

```text
Infrastructure/Persistence/Repositories
```

---

# 71. Query model placement

Complex read query:

```text
Application/Queries abstraction
Infrastructure/Queries implementation
```

или полностью Application vertical slice + Infrastructure implementation.

---

# 72. Validators

Use-case validator рядом с use case.

Не создавать giant:

```text
Validators/
```

для всего модуля.

---

# 73. Authorization placement

Use-case-specific authorization:

```text
Application/<UseCase>/
```

Общие module policies:

```text
Application/Authorization/
```

---

# 74. Mapping

Избегать огромного AutoMapper profile на весь проект.

Допустимы:

- explicit mapping;
- локальные mapping functions;
- source generators.

Для критичных DTO explicit mapping предпочтителен.

---

# 75. MediatR

Не является обязательным.

Если используется mediator pattern — его необходимость фиксируется ADR.

Можно реализовать application handlers без внешнего mediator framework.

---

# 76. Generic abstractions

Не создавать заранее:

```text
IGenericService
IGenericRepository
IEntityManager
```

Domain-specific interfaces preferred.

---

# 77. Common result type

Допустим единый:

```text
Result<T>
Error
```

в Shared.

Но business error codes определяются модулем.

---

# 78. Module error codes

Пример:

```text
AssetsErrors.AssetNotFound
WorkOrdersErrors.AlreadyCompleted
```

HTTP mapping выполняется на API boundary.

---

# 79. Configuration files

Root:

```text
src/backend/Exploitation.Api/
├── appsettings.json
├── appsettings.Development.json
└── appsettings.Test.json
```

Production secrets не хранятся в этих файлах.

---

# 80. Feature flags placement

Central infrastructure:

```text
Exploitation.Shared/Application/Features
```

или отдельный feature management adapter.

Business module только запрашивает named feature.

---

# 81. Outbox placement

Общая infrastructure capability.

Можно реализовать:

```text
Exploitation.Infrastructure.Messaging
```

или Shared Infrastructure project.

Но сами event contracts принадлежат модулям.

---

# 82. Suggested shared infrastructure

Если общих infrastructure компонентов станет много, добавить:

```text
Exploitation.Infrastructure/
├── Persistence/
├── Messaging/
├── Caching/
├── ObjectStorage/
├── Observability/
└── Security/
```

Но этот проект не должен знать domain сущности всех модулей.

---

# 83. Object storage abstraction

Интерфейс:

```text
IObjectStorage
```

может быть общей application abstraction.

Documents module строит поверх него business semantics.

---

# 84. Clock

`IClock` — общий примитив.

Implementation:

```text
SystemClock
```

Tests:

```text
FakeClock
```

---

# 85. Current user abstraction

Общий abstraction:

```text
ICurrentUser
IWorkingContext
```

Но бизнес permissions проверяются в application authorization layer.

---

# 86. Correlation context

Общий:

```text
ICorrelationContext
```

используется:

- logging;
- audit;
- outbox;
- messaging.

---

# 87. Worker project

На старте один:

```text
Exploitation.Workers
```

До выделения standalone worker текущий `TASK-02.01.01` запускает Sites audit-obligation polling как hosted service API-процесса. Оркестрация изолирована в technical library `Exploitation.AuditDelivery`: она зависит от Sites Application delivery port и Audit Contracts, но не имеет доступа к `SitesDbContext` или `AuditDbContext`. PostgreSQL obligation остаётся source of truth, поэтому перезапуск или несколько API instances безопасны в модели at-least-once.

Hosted services:

```text
OutboxPublisher
MaintenanceScheduler
NotificationDispatcher
MediaProcessor
ReportWorker
```

---

# 88. Когда разделять workers

Разделять executable только если:

- нагрузка существенно разная;
- нужна независимая масштабируемость;
- failure isolation даёт пользу.

---

# 89. Background job folder

```text
Workers/
├── Outbox/
├── Maintenance/
├── Notifications/
├── Reports/
└── Media/
```

---

# 90. Worker business access

Worker не должен напрямую делать cross-module SQL.

Использует application services/contracts.

---

# 91. Frontend route organization

Пример:

```text
/sites
/sites/:siteId
/assets/:assetId
/maintenance/calendar
/work-orders/:workOrderId
/defects/:defectId
/inventory/:inventorySessionId
/incidents/:incidentId
/changes/:changeId
```

---

# 92. Route permissions

Router может скрывать routes, но API остаётся authoritative.

---

# 93. Frontend module boundaries

Не допускать:

```text
features/createAsset
→ import private internals of defects feature
```

Общие данные идут через `entities`/public API feature.

---

# 94. Frontend public API per feature

Можно использовать:

```text
features/createAsset/index.ts
```

и экспортировать только public surface.

---

# 95. Barrel files

Использовать умеренно.

Не создавать огромный `index.ts`, реэкспортирующий весь frontend.

---

# 96. Naming files

C#:

```text
CreateAssetCommand.cs
```

React component:

```text
AssetCard.tsx
```

Hooks:

```text
useAsset.ts
```

---

# 97. Documentation comments

Кодовая структура не должна требовать комментария на каждую папку.

Сложная архитектурная причина фиксируется в docs/ADR.

---

# 98. README per module

При достижении существенной сложности добавить:

```text
Modules/Assets/README.md
```

с коротким:

- purpose;
- dependencies;
- public contracts.

Полная документация остаётся в `/docs/modules`.

---

# 99. Module dependency map

Начальная рекомендуемая логика:

```text
Identity
  ↓
Organization
  ↓
Sites
  ↓
Assets
  ↓
Maintenance
  ↓
WorkOrders
  ↓
Measurements / Defects
```

Но это не означает жёсткую линейную зависимость всех assembly.

---

# 100. Key module contracts

Примеры:

### Assets exposes

- asset reference;
- asset details needed by other modules;
- events asset commissioned/replaced/moved.

### Maintenance exposes

- maintenance plan reference;
- scheduled maintenance event.

### WorkOrders exposes

- work result;
- completion event.

### Defects exposes

- defect summary/state.

---

# 101. Prevent cyclic module dependencies

Недопустимо:

```text
Assets.Application
→ Maintenance.Application
→ Assets.Application
```

Решение:

- contract;
- event;
- orchestration layer.

---

# 102. Orchestration

Если use case затрагивает несколько модулей, использовать application orchestration.

Например:

```text
CompleteMaintenanceWorkflow
```

может:

- завершить WorkOrder;
- записать Measurements;
- инициировать Defect;
- уведомить Maintenance о пересчёте.

Но ownership каждого изменения остаётся у своего модуля.

---

# 103. Saga/process manager

Не вводить сложную saga framework на старте.

Если появляется долгий multi-step process — отдельный ADR.

---

# 104. Repository root README

README должен содержать:

1. Что это за проект.
2. Requirements.
3. Quick Start.
4. Как запустить infra.
5. Как запустить backend.
6. Как запустить frontend.
7. Как выполнить tests.
8. Где документация.

---

# 105. CONTRIBUTING.md

После появления второго разработчика или активного agent workflow добавить:

```text
CONTRIBUTING.md
```

Содержит:

- branch;
- PR;
- standards;
- test requirements;
- ADR rules.

---

# 106. AGENTS.md

Рекомендуется создать root:

```text
AGENTS.md
```

Это будет краткая инструкция для Codex/AI.

В ней не дублировать 500 страниц документации.

Указать:

```text
Read docs in order
Architecture invariants
How to run checks
How to choose task
Forbidden changes
```

---

# 107. Suggested AGENTS.md reading order

```text
1. docs/concept.md
2. docs/architecture.md
3. docs/coding-standards.md
4. docs/project-structure.md
5. docs/database.md
6. docs/api-guidelines.md
7. docs/security.md
8. docs/testing.md
9. relevant docs/modules/*
10. relevant backlog task
```

---

# 108. Codex file placement algorithm

Перед созданием файла Codex должен определить:

```text
1. Какой module?
2. Какой layer?
3. Какой use case?
4. Это public contract или internal?
5. Есть ли уже аналогичный pattern?
```

Только после этого создавать файл.

---

# 109. Example: Create Asset task placement

```text
Domain:
Modules/Assets/...Domain/Assets/Asset.cs

Application:
Modules/Assets/...Application/Assets/Create/

Infrastructure:
Modules/Assets/...Infrastructure/Persistence/

API:
Modules/Assets/...Api/Endpoints/CreateAssetEndpoint.cs

Tests:
tests/backend/Integration/Assets/CreateAssetTests.cs
tests/backend/Authorization/Assets/CreateAssetAuthorizationTests.cs
```

---

# 110. Example: Maintenance rule

```text
Modules/Maintenance/
  Domain/FrequencyRules/
  Application/ResolveFrequency/
  Infrastructure/Persistence/Configurations/
```

---

# 111. Example: Inventory scan

```text
Modules/Inventory/
  Application/Scan/
  Domain/Observations/
  Api/Endpoints/ScanInventoryAssetEndpoint.cs
```

---

# 112. Example: S3 implementation

Business document logic:

```text
Modules/Documents/
```

Generic S3 adapter:

```text
Exploitation.Infrastructure/ObjectStorage/
```

---

# 113. Example: Audit

Audit contract/interface:

```text
Modules/Audit/Contracts
```

Implementation/table:

```text
Modules/Audit/Infrastructure
```

Other modules не вставляют SQL напрямую в `audit.events`.

---

# 114. Code generation

Generated code хранить явно:

```text
Generated/
```

и помечать:

```text
// <auto-generated />
```

---

# 115. Build output

Никогда не commit:

```text
bin/
obj/
dist/
node_modules/
coverage/
playwright-report/
```

---

# 116. Generated reports

Не хранить runtime-generated PDF/XLSX в repository.

---

# 117. Sample data

Dev fixtures:

```text
tests/fixtures/
```

или seed project.

Не смешивать с production master data.

---

# 118. SQL files

Если raw SQL действительно нужен:

```text
Module.Infrastructure/Persistence/Sql/
```

или:

```text
scripts/db/
```

в зависимости от назначения.

Каждый SQL должен иметь owner/use case.

---

# 119. Performance SQL

Complex report query:

```text
Reports.Infrastructure/Queries/
```

а не случайный файл в root.

---

# 120. Migrations responsibility

Миграция должна изменять преимущественно schema своего модуля.

Cross-module migration требует review.

---

# 121. Shared database bootstrap

Migration ownership остаётся внутри module Infrastructure projects. Для исполнения используется отдельный technical host:

```text
Exploitation.DatabaseMigrator
```

Он регистрирует modules, обнаруживает зарегистрированные `DbContext` и последовательно применяет их migrations. Host не содержит собственного `DbContext`, business entities, schemas или central migrations collection. Zero registered contexts является валидным состоянием. См. `ADR-010`.

---

# 122. Schema creation

Пример:

```text
CREATE SCHEMA assets
CREATE SCHEMA maintenance
...
```

должно быть воспроизводимо migrations.

---

# 123. Architecture validation in CI

Добавить stage:

```text
ArchitectureTests
```

который проверяет project references.

---

# 124. Solution filters

Для удобства большой solution можно использовать `.slnf`.

Пример:

```text
Assets.slnf
Maintenance.slnf
```

Позднее, если solution станет тяжёлым.

---

# 125. Build graph

Избегать сотен транзитивных dependencies.

Contracts должны быть лёгкими.

---

# 126. Package references

Infrastructure packages не должны попадать в Domain transitively.

---

# 127. Internal visibility

Использовать `internal`, если тип не является public contract.

Не делать всё `public`.

---

# 128. Friend assemblies

`InternalsVisibleTo` допускается главным образом для tests, но не как обход module boundaries.

---

# 129. Strong module boundary

Если другой модуль начал регулярно использовать internal domain types — это архитектурный запах.

---

# 130. Refactoring rule

При росте use case:

```text
one large handler
```

не дробить автоматически на generic services.

Сначала выделить понятные domain/application concepts.

---

# 131. Folder depth

Не создавать глубину папок ради формальности.

Обычно:

```text
Module
→ Layer
→ Aggregate/UseCase
```

достаточно.

---

# 132. File size

Большой файл сам по себе не дефект.

Но классы с несколькими обязанностями должны быть разделены.

---

# 133. Circular business processes

Если Assets и Maintenance взаимно влияют:

- не создавать cyclic project refs;
- взаимодействовать через events/contracts.

---

# 134. Example event flow

```text
Assets:
AssetCommissioned
        ↓
Maintenance event handler:
create/recalculate maintenance plan
```

---

# 135. Example work completion flow

```text
WorkOrders:
WorkOrderAccepted
        ↓
Maintenance:
recalculate next due

Measurements:
already persisted as facts

Defects:
may receive explicit creation command/event
```

---

# 136. Cross-module transaction caution

Пока одна БД — технически возможна общая транзакция.

Но не строить бизнес-код на предположении, что все модули навсегда будут одной БД.

---

# 137. Public contracts versioning

Cross-module contracts должны эволюционировать backward-compatible насколько возможно.

---

# 138. Contract naming

Не использовать:

```text
CommonAssetDto
```

Лучше:

```text
AssetReference
AssetMaintenanceContext
```

по назначению.

---

# 139. Query ownership

Если Maintenance нужен Asset data:

```text
Assets.Contracts
→ GetAssetMaintenanceContext
```

а не query таблиц assets напрямую.

---

# 140. Frontend/backend independence

Frontend folder structure не должна зеркалить EF entities.

Frontend отражает пользовательские сценарии.

---

# 141. Feature folder lifecycle

Если feature становится крупным module:

```text
features/inventory
```

может получить собственный module folder.

Не делать migration структуры без пользы.

---

# 142. Monorepo decision

Проект рекомендуется вести как monorepo:

```text
backend + frontend + docs + deploy
```

Причины:

- один продукт;
- единые changes;
- Codex видит контекст;
- проще атомарные PR;
- проще документация.

---

# 143. Когда пересматривать monorepo

Только если:

- команды полностью независимы;
- release cycles разошлись;
- repository scale создаёт реальную проблему.

---

# 144. Root versioning

На раннем этапе backend/frontend можно релизить одной product version.

---

# 145. Module versioning

Отдельное module semver внутри монолита не требуется.

---

# 146. Initial implementation subset

Для `TASK-00.01.01` достаточно минимального собираемого skeleton:

```text
Exploitation.sln
src/
  backend/
    Exploitation.Shared/
  frontend/
tests/
docs/
deploy/
scripts/
```

`Exploitation.Api`, frontend application, workers и module assemblies добавляются соответствующими задачами backlog. Пустые проекты будущих модулей заранее не создаются.

---

# 147. Recommended solution tree as initial modules are implemented

Это целевое дерево первых реализуемых модулей, а не обязательный состав `TASK-00.01.01`:

```text
Exploitation.sln
│
├── Exploitation.Api
├── Exploitation.Shared
│
├── Identity.Domain
├── Identity.Application
├── Identity.Infrastructure
├── Identity.Contracts
│
├── Sites.Domain
├── Sites.Application
├── Sites.Infrastructure
├── Sites.Contracts
│
├── Assets.Domain
├── Assets.Application
├── Assets.Infrastructure
├── Assets.Contracts
│
└── Exploitation.Workers
```

---

# 148. First vertical slice files

Первый настоящий use case `CreateAsset` должен привести к появлению примерно:

```text
Assets.Domain/
  Assets/Asset.cs

Assets.Application/
  Assets/Create/
    CreateAssetCommand.cs
    CreateAssetValidator.cs
    CreateAssetHandler.cs

Assets.Infrastructure/
  Persistence/
    AssetsDbContext.cs
    Configurations/AssetConfiguration.cs
    Repositories/AssetRepository.cs

Assets.Api/
  Endpoints/CreateAssetEndpoint.cs

tests/
  Unit/Assets/...
  Integration/Assets/CreateAssetTests.cs
  Authorization/Assets/CreateAssetAuthorizationTests.cs
```

---

# 149. Definition of structure compliance

Новый код считается размещённым правильно, если:

1. Имеет module owner.
2. Находится в корректном layer.
3. Не создаёт запрещённую dependency.
4. Не загрязняет Shared.
5. Use case локализован.
6. Infrastructure изолирована.
7. Cross-module interaction идёт через Contract/Event.
8. Tests находятся рядом по смыслу.
9. Docs обновлены при новом architectural concept.
10. Architecture tests проходят.

---

# 150. Главный принцип

> По имени папки и namespace разработчик должен понимать, к какой части предметной области относится код и какую ответственность он несёт.

Структура должна помогать системе оставаться модульной даже через несколько лет разработки и тысячи файлов.
