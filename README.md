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

## API bootstrap

Запустите API в Development:

```powershell
dotnet run --project src/backend/Exploitation.Api --environment Development
```

Проверочные endpoints: `/health/live` и `/health/ready`. В Development OpenAPI document доступен по `/openapi/v1.json`.

## Frontend bootstrap

Установите зависимости и запустите Vite dev server:

```powershell
Set-Location src/frontend
npm ci
npm run dev
```

Frontend использует `/api/v1` по умолчанию. Для другого API origin скопируйте `src/frontend/.env.example` в `src/frontend/.env.local` и задайте `VITE_API_URL`. Переменные `VITE_*` публичны в browser bundle и не должны содержать secrets.

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
