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
2. Проверьте конфигурацию: `docker compose config`.
3. Запустите сервисы: `docker compose up -d`.

Текущий Compose запускает PostgreSQL, Redis, RabbitMQ, Keycloak и SeaweedFS. SeaweedFS используется только как локальный DEV provider для архитектурного контракта S3-compatible object storage; production provider пока не выбран. Для проверки окружения и сервисов выполните [runtime smoke-test](docs/runbooks/local-infrastructure-smoke-test.md).
