# АС «Эксплуатация»

Корпоративная EAM/CMMS-система для технической эксплуатации объектов и оборудования.

Репозиторий организован как monorepo и развивается как модульный монолит. Архитектурные правила и порядок работы описаны в [AGENTS.md](AGENTS.md) и каталоге [docs](docs/).

## Текущее состояние

Создан минимальный repository skeleton и локальный Compose stack. Backend API, frontend и доменные модули добавляются последующими задачами backlog.

## Сборка

Требуется .NET SDK 10.

```powershell
dotnet build Exploitation.sln
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
