# АС «Эксплуатация»

Корпоративная EAM/CMMS-система для технической эксплуатации объектов и оборудования.

Репозиторий организован как monorepo и развивается как модульный монолит. Архитектурные правила и порядок работы описаны в [AGENTS.md](AGENTS.md) и каталоге [docs](docs/).

## Текущее состояние

Созданы минимальный repository skeleton, локальный Compose stack, ASP.NET Core API bootstrap, базовый layer pattern модуля Assets и React/TypeScript frontend shell с TanStack Query для server state. Бизнес-функции доменных модулей добавляются последующими задачами backlog.

## Сборка

Требуются .NET SDK 10 и Node.js 20.19+.

```powershell
dotnet build Exploitation.sln
```

## CI

Единственный CI provider текущего этапа — GitHub Actions. Workflow [Build pipeline](.github/workflows/build.yml) воспроизводимо собирает и проверяет backend и frontend на чистом Linux runner, а логи jobs сохраняет как artifacts. Настройка обязательной проверки для private GitHub remote описана в [runbook](docs/runbooks/github-actions-build-pipeline.md).

## API bootstrap

Запустите API в Development:

```powershell
$env:ConnectionStrings__Database = '<local PostgreSQL connection string>'
dotnet run --project src/backend/Exploitation.DatabaseMigrator
dotnet run --project src/backend/Exploitation.Api --environment Development
```

Проверочные endpoints: `/health/live` и `/health/ready`. В Development OpenAPI document доступен по `/openapi/v1.json`.

API является OIDC resource server. Development defaults ожидают Keycloak realm `exploitation` по адресу `http://127.0.0.1:8081` и access-token audience `exploitation-api`. Настройте realm/client в локальном Keycloak; application passwords и client secret API не нужны. Для другого provider задайте:

```text
Authentication__Oidc__Authority
Authentication__Oidc__Audience
Authentication__Oidc__RequireHttpsMetadata
Authentication__Oidc__UserTypeClaim
```

После получения access token от IdP local profile доступен через `GET /api/v1/me` с `Authorization: Bearer <token>`. Для первого безопасного provisioning token должен содержать configured `user_type` claim (`INTERNAL`, `CONTRACTOR` или `SYSTEM`); этот тип не предоставляет business permissions.

OIDC security checks:

```powershell
dotnet run --project tests/integration/Exploitation.AuthenticationChecks --configuration Release
dotnet run --project tests/integration/Exploitation.IdentityPersistenceChecks --configuration Release
```

## Frontend bootstrap

Установите зависимости и запустите Vite dev server:

```powershell
Set-Location src/frontend
npm ci
npm run dev
```

Frontend использует `/api/v1` по умолчанию; dev Vite проксирует его на локальный API `http://localhost:5000`. Скопируйте `src/frontend/.env.example` в `src/frontend/.env.local` и задайте `VITE_OIDC_CLIENT_ID` зарегистрированного browser public client в dev Keycloak. Для другого API origin задайте `VITE_API_URL`. Переменные `VITE_*` публичны в browser bundle и не должны содержать secrets; подробности регистрации OIDC client находятся в `docs/dev-environment.md`.

Проверки frontend:

```powershell
npm run lint
npm run build
npm test
```

## Локальная инфраструктура

1. Создайте локальный `.env` на основе `.env.example`.
2. Запустите и дождитесь healthchecks одной командой:

   ```powershell
   ./scripts/dev/dev-up.ps1
   ```

3. Остановите stack, сохранив named volumes:

   ```powershell
   ./scripts/dev/dev-down.ps1
   ```

4. Только для локальной Development-среды можно удалить named volumes и заново поднять stack. Команда требует явное подтверждение; перед удалением данных используйте `-WhatIf` для проверки:

   ```powershell
   ./scripts/dev/dev-reset.ps1 -Environment Development -ConfirmReset -WhatIf
   ./scripts/dev/dev-reset.ps1 -Environment Development -ConfirmReset
   ```

   `dev-reset` отклоняет любой environment, отличный от `Development`, а также запуск при `ASPNETCORE_ENVIRONMENT` или `DOTNET_ENVIRONMENT`, отличном от `Development`. Все DEV scripts работают только с local Docker context; remote Docker endpoints отклоняются.

Текущий Compose запускает PostgreSQL, Redis, RabbitMQ, Keycloak и SeaweedFS. SeaweedFS используется только как локальный DEV provider для архитектурного контракта S3-compatible object storage; production provider пока не выбран. Для проверки окружения и сервисов выполните [runtime smoke-test](docs/runbooks/local-infrastructure-smoke-test.md).
