# АС «Эксплуатация» — Development Environment

## 1. Назначение документа

Этот документ определяет стандарт локальной разработки АС «Эксплуатация».

Основной сценарий:

```text
Разработка: Windows
Deployment: Linux / VDS / корпоративная инфраструктура
```

Цель — сделать локальную разработку максимально близкой к production без необходимости разрабатывать непосредственно на Linux.

---

# 2. Базовый принцип

> Код не должен зависеть от операционной системы разработчика.

Windows используется как рабочая среда.

Linux остаётся целевой runtime-средой.

---

# 3. Рекомендуемая рабочая станция

Ориентир:

```text
Windows 11
16 GB RAM минимум
32 GB RAM предпочтительно
SSD
```

Для Docker + IDE + браузер + AI tools 32 GB удобнее.

---

# 4. Обязательные инструменты

- Git;
- .NET 10 SDK;
- Node.js LTS;
- npm/pnpm;
- Docker Desktop;
- WSL2;
- PostgreSQL client tools;
- IDE;
- PowerShell;
- optional Make/Task runner.

---

# 5. IDE

Варианты:

- Visual Studio;
- JetBrains Rider;
- VS Code.

Не привязывать проект к одной IDE.

---

# 6. WSL2

Рекомендуется установить WSL2 с актуальным Ubuntu.

Он полезен для:

- Linux shell;
- проверки scripts;
- Docker;
- production-like commands.

Но backend можно запускать непосредственно из Windows IDE.

---

# 7. Docker Desktop

Использовать WSL2 backend.

Локальная инфраструктура запускается через Docker Compose.

---

# 8. Локальная архитектура

```text
Windows
│
├── IDE
├── .NET API
├── React dev server
│
└── Docker Compose
    ├── PostgreSQL
    ├── Redis
    ├── RabbitMQ
    ├── SeaweedFS (DEV S3-compatible provider)
    └── Keycloak
```

---

# 9. Почему не ставить всё напрямую в Windows

Контейнеры позволяют:

- одинаковые версии;
- быстрый reset;
- меньше конфликтов;
- ближе к Linux deployment;
- удобнее Codex.

---

# 10. Repository structure

Рекомендуемо:

```text
/
├── src/
├── tests/
├── docs/
├── deploy/
├── scripts/
├── .github/ or .gitlab/
├── docker-compose.yml
├── .env.example
├── Directory.Build.props
├── README.md
└── global.json
```

---

# 11. Docs directory

```text
docs/
├── concept.md
├── roadmap.md
├── Q&A.md
├── architecture.md
├── coding-standards.md
├── database.md
├── api-guidelines.md
├── security.md
├── testing.md
├── deployment.md
├── dev-environment.md
└── adr/
```

---

# 12. .NET version pinning

Использовать:

```text
global.json
```

чтобы команда и CI использовали одинаковый SDK.

---

# 13. Node version

Фиксировать через:

- `.nvmrc`;
- Volta;
- package manager metadata.

---

# 14. Package manager

Выбрать один:

```text
pnpm
```

или:

```text
npm
```

Не смешивать lockfiles.

---

# 15. Local infrastructure compose

Текущий `docker-compose.yml` поднимает:

```text
PostgreSQL 18.6
Redis 8.10.1
RabbitMQ 4.3.5 + Management UI
Keycloak 26.7.3
SeaweedFS 4.47
```

По ADR-009 SeaweedFS используется только как local DEV provider для неизменного архитектурного контракта S3-compatible object storage. ADR-009 частично заменяет ADR-004 только в выборе DEV provider; production provider пока не выбран.

---

# 16. Ports

Пример локально:

```text
PostgreSQL 5432
Redis      6379
RabbitMQ   5672
Rabbit UI  15672
Keycloak   8081
S3         9000 (SeaweedFS DEV endpoint)
API        5000/5001
Web        5173
```

Конкретные порты фиксируются в repo.

SeaweedFS публикует только S3 endpoint на `127.0.0.1:9000`; master, filer, admin и прочие vendor-specific endpoints наружу не публикуются.

---

# 17. .env.example

В Git хранится только пример:

```text
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=
S3_ENDPOINT=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_REGION=
S3_BUCKET=
S3_FORCE_PATH_STYLE=true
```

Реальный `.env` в `.gitignore`.

---

# 18. Local secrets

Для .NET:

- user-secrets;
- `.env` только для local compose;
- никогда не commit.

---

# 19. Startup workflow

Целевой запуск:

```text
docker compose up -d
dotnet run
pnpm dev
```

Позже можно обернуть в одну команду.

---

# 20. One-command developer setup

Цель:

```text
./scripts/dev-up
```

или PowerShell:

```text
./scripts/dev-up.ps1
```

---

# 21. PowerShell + Bash parity

Если создаются project scripts, желательно иметь:

- PowerShell;
- либо cross-platform tool;
- либо Bash через WSL.

Не создавать критическую автоматизацию, работающую только вручную в IDE.

---

# 22. Local DB

Зафиксированный major baseline:

```text
PostgreSQL 18
```

Для DEV используется image `postgres:18.6-bookworm`. Patch/minor image tag может обновляться внутри major 18 отдельным проверенным изменением; смена major требует отдельного плана миграции. DEV и production должны использовать один major.

---

# 23. Local migrations

Типовой flow:

```text
dotnet ef database update
```

Но предпочтительно project wrapper script.

---

# 24. Database reset

Должна быть безопасная local-only команда:

```text
dev-db-reset
```

Она:

- удаляет local DB;
- создаёт;
- применяет migrations;
- загружает dev seed.

Никогда не должна работать на PROD connection string.

---

# 25. Safety check reset

Script обязан проверять environment:

```text
Environment == Development
```

и допустимый hostname.

---

# 26. Dev seed

Можно создавать:

- demo company;
- zones;
- regions;
- objects;
- sample assets;
- sample users;
- sample contracts;
- sample maintenance templates.

---

# 27. Dev seed не production seed

Реальные справочники production загружаются отдельно.

---

# 28. Test user profiles

Локально нужны типовые профили:

```text
Internal Engineer
Manager
Contractor A
Contractor B
Admin
Auditor
```

---

# 29. Keycloak local realm

Если Keycloak используется в dev:

- realm config можно экспортировать;
- хранить без secrets;
- автоматически импортировать.

---

# 30. Entra ID development

Если production использует Entra ID, local dev может:

- использовать dev tenant;
- либо Keycloak compatibility mode;
- либо отдельную test app registration.

Конкретное решение фиксируется ADR.

---

# 31. Frontend environment

Пример:

```text
VITE_API_BASE_URL=http://localhost:5000
```

Не hardcode URL в source files.

---

# 32. CORS local

Разрешить только известные dev origins.

Например:

```text
http://localhost:5173
```

---

# 33. HTTPS local

Не обязательно для всех dev операций.

Но auth flows могут потребовать HTTPS.

При необходимости использовать .NET dev certificates.

---

# 34. Local S3

Архитектурный контракт остаётся:

```text
S3-compatible object storage
```

По ADR-009 локальным DEV provider выбран SeaweedFS. ADR-009 частично заменяет ADR-004 только в выборе DEV provider из-за изменения distribution/support model MinIO Community Edition. Production provider не выбран.

Приложение использует только generic S3 configuration:

```text
S3_ENDPOINT
S3_ACCESS_KEY
S3_SECRET_KEY
S3_REGION
S3_BUCKET
S3_FORCE_PATH_STYLE
```

SeaweedFS-specific API и settings запрещены в application/domain layer. Local endpoint по умолчанию: `http://localhost:9000`, path-style addressing включён.

Default DEV bucket создаётся самим local provider из `S3_BUCKET`. Дополнительные buckets при необходимости должны создаваться стандартным S3 client, а не SeaweedFS-specific API.

Пример:

```text
documents
media
exports
```

---

# 35. Local RabbitMQ

Management UI полезен для:

- queue inspection;
- DLQ;
- debugging.

Local Compose фиксирует RabbitMQ hostname и nodename. Это необходимо, чтобы Mnesia использовала один и тот же каталог node data после `docker compose down` / `up` и durable queues сохранялись в named volume.

---

# 36. Local Redis

Использовать тот же major version, что планируется в deployment.

---

# 37. Running backend in container vs host

Оба режима допустимы.

Для разработки удобнее:

```text
API на Windows host
Infrastructure в Docker
```

Для production-like проверки:

```text
API также в Docker
```

---

# 38. Container build test

Каждый developer должен иметь возможность выполнить:

```text
docker build
```

локально.

---

# 39. Linux compatibility

Перед merge critical scripts/paths должны проходить CI на Linux.

---

# 40. File paths

Использовать cross-platform APIs.

Не hardcode:

```text
C:\...
```

---

# 41. Case sensitivity

Windows filesystem часто нечувствителен к регистру.

Linux — чувствителен.

Имена файлов/imports должны иметь точный регистр.

---

# 42. Line endings

Рекомендуется `.gitattributes`.

Пример:

```text
* text=auto
```

Для shell scripts:

```text
LF
```

---

# 43. Executable bits

Bash scripts должны иметь executable permission в Git.

---

# 44. Docker volume paths

Избегать Windows-specific absolute paths.

---

# 45. Timezone

Локальная машина может иметь любую timezone.

Все backend tests должны быть независимы от local timezone.

---

# 46. UTC

Backend хранит UTC.

Tests используют fake clock.

---

# 47. Locale

Не полагаться на Windows locale для:

- decimal separator;
- dates;
- sorting.

---

# 48. Decimal

JSON/API всегда culture-independent.

---

# 49. Development logging

Development:

```text
Debug/Information
```

Можно включать SQL logging адресно.

---

# 50. Sensitive logging local

Даже локально не логировать tokens/passwords.

---

# 51. Hot reload

Допустим:

- `dotnet watch`;
- Vite HMR.

---

# 52. Local OpenAPI

Swagger/OpenAPI доступен в DEV.

---

# 53. Local mail

Для email notifications использовать fake SMTP/mail catcher.

Например:

- MailHog;
- Mailpit.

Добавляется при появлении email-модуля.

---

# 54. Local antivirus

Не обязателен на первом dev этапе.

File scanner должен иметь mock/adapter.

---

# 55. External integrations

В dev использовать:

- sandbox;
- mocks;
- local stubs.

Не обращаться к production внешним системам.

---

# 56. Mock server

Для интеграций полезен WireMock/аналог.

---

# 57. Testcontainers

Integration tests сами поднимают нужные containers.

Они не должны зависеть от вручную запущенного compose, если это возможно.

---

# 58. Running tests

Целевая команда:

```text
dotnet test
```

Frontend:

```text
pnpm test
```

E2E:

```text
pnpm test:e2e
```

---

# 59. Unified validation command

Желательно:

```text
./scripts/check
```

выполняет:

- format/lint;
- build;
- tests;
- OpenAPI checks.

---

# 60. Format

Для C# использовать `dotnet format` или configured analyzers.

Для frontend — Prettier/ESLint.

---

# 61. EditorConfig

Обязателен `.editorconfig`.

---

# 62. Directory.Build.props

Централизованно задаёт:

- nullable;
- warnings;
- analyzers;
- language settings.

---

# 63. Warnings

Не вводить политику «все warnings = errors» хаотично.

Но собственный код должен стремиться к clean build.

---

# 64. Debug profiles

`launchSettings.json` может содержать только безопасные dev значения.

---

# 65. Database client

Можно использовать:

- DBeaver;
- DataGrip;
- pgAdmin.

Но schema changes только migrations.

---

# 66. Manual DB edits

Локально допустимы для исследования.

Но финальное изменение схемы обязательно оформляется migration.

---

# 67. API clients

Для ручного теста:

- Swagger UI;
- Bruno;
- Postman;
- HTTP files.

Предпочтительно version-control friendly формат.

---

# 68. HTTP files

Можно хранить:

```text
tests/http/
```

для типовых ручных запросов.

Без secrets.

---

# 69. Sample requests

Полезны:

- login;
- create site;
- create asset;
- create work order;
- execute inventory scan.

---

# 70. Local object cleanup

Dev script может очищать local S3 buckets при reset после выбора backend.

Только в Development.

---

# 71. Branch setup

После clone новый developer выполняет:

```text
git clone
copy .env.example → .env
docker compose up -d
run migrations
run seed
start app
```

---

# 72. README quick start

README должен содержать quick start не более чем на 10–15 шагов.

Детали — здесь.

---

# 73. Dependency updates

Не использовать floating dependencies.

Lockfiles обязательны.

---

# 74. NuGet central package management

Рекомендуется central package management для крупного solution.

---

# 75. Frontend lockfile

Commit:

```text
pnpm-lock.yaml
```

или npm equivalent.

---

# 76. Docker versions

Compose images pin major/minor версии.

Не использовать бесконтрольный `latest`.

---

# 77. Local performance

Большие seed datasets не должны запускаться всегда.

Разделить:

```text
seed-small
seed-medium
seed-large
```

---

# 78. Seed-small

Например:

```text
2 regions
5 sites
100 assets
10 users
```

---

# 79. Seed-medium

Для UI/performance разработки:

```text
50 sites
10 000 assets
```

---

# 80. Seed-large

Для локального/отдельного performance environment:

```text
5000 sites
500 000 assets
```

Не использовать каждый день.

---

# 81. Local backups

Не являются обязательными для disposable DEV DB.

Но developer может сделать dump перед сложным экспериментом.

---

# 82. Windows antivirus / Docker performance

Большие source trees лучше не размещать в медленных bind-mount сценариях без необходимости.

При проблемах использовать WSL filesystem или оптимизированные volumes.

---

# 83. Source location

Выбрать один стабильный подход:

- Windows filesystem + IDE;
- либо WSL filesystem + compatible IDE.

Не прыгать между копиями репозитория.

---

# 84. Recommended Windows scenario

Простой вариант:

```text
Repository on Windows NTFS
Rider/Visual Studio
Docker Desktop WSL2
Infrastructure containers
```

Если Docker bind mount становится узким местом — рассмотреть WSL repo.

---

# 85. Production parity checks

CI на Linux является обязательной проверкой переносимости.

---

# 86. Environment variables naming

Префикс:

```text
EXPLOITATION_
```

Пример:

```text
EXPLOITATION_DATABASE__CONNECTIONSTRING
```

---

# 87. Configuration sections

Пример:

```text
Database
Redis
RabbitMq
ObjectStorage
Authentication
Features
Observability
```

---

# 88. Config validation

Использовать strongly typed Options + validation.

---

# 89. Developer certificates

Если локальный HTTPS используется, инструкция должна содержать:

```text
dotnet dev-certs https --trust
```

---

# 90. Local auth fallback

Не создавать скрытый production-capable `AllowAllAuth`.

Если нужен fake auth для automated test — только в test host.

---

# 91. Development admin

Dev seed admin существует только в Development.

---

# 92. Environment guard

Приложение должно fail при попытке использовать dev-only auth/seed в Production.

---

# 93. Local database password

Может быть простой dev-only пароль.

Но `.env` всё равно не commit.

---

# 94. Codex working rules

Перед изменением Codex читает:

```text
docs/concept.md
docs/architecture.md
docs/coding-standards.md
docs/database.md
docs/api-guidelines.md
docs/security.md
docs/testing.md
```

---

# 95. Codex command safety

AI-агент не должен:

- удалять Docker volumes без необходимости;
- сбрасывать неизвестную БД;
- менять global machine config;
- устанавливать произвольные системные сервисы;
- запускать destructive scripts без environment guard.

---

# 96. Codex dependency rule

Перед добавлением библиотеки:

1. Проверить, нет ли уже решения.
2. Оценить maintenance.
3. Не добавлять библиотеку ради 10 строк кода.
4. Зафиксировать значимую зависимость.

---

# 97. Dev script safety

Каждый destructive script должен:

- явно называться;
- проверять environment;
- выводить target;
- отказываться от production host.

---

# 98. Local troubleshooting

Минимальные команды:

```text
docker compose ps
docker compose logs
dotnet --info
node --version
docker version
```

---

# 99. Common local failures

### DB unavailable

Проверить container + connection string.

### Migrations mismatch

Пересоздать local DB либо применить migrations.

### Keycloak unavailable

Проверить realm import/readiness.

### Local S3 access denied

Проверить `S3_ENDPOINT`, bucket credentials и `S3_FORCE_PATH_STYLE=true`.

### RabbitMQ queue stuck

Открыть management UI.

---

# 100. Development runbook

Создать:

```text
docs/runbooks/local-infrastructure-smoke-test.md
docs/runbooks/dev-reset.md
docs/runbooks/dev-auth.md
docs/runbooks/dev-database.md
```

по мере зрелости проекта.

---

# 101. Definition of Done — developer experience

Среда разработки считается настроенной правильно, если новый разработчик/AI-сессия может:

1. Клонировать репозиторий.
2. Поднять инфраструктуру.
3. Применить миграции.
4. Загрузить dev seed.
5. Запустить backend.
6. Запустить frontend.
7. Авторизоваться тестовым пользователем.
8. Выполнить tests.
9. Собрать Docker image.
10. Сделать это без ручной установки PostgreSQL/Redis/RabbitMQ в Windows.

---

# 102. Главный принцип

> Разработка на Windows не должна увеличивать стоимость переноса на Linux, если инфраструктура контейнеризована, пути и конфигурация кроссплатформенны, а CI постоянно проверяет Linux-сборку.

Для проекта рекомендуемый сценарий:

```text
Windows — удобная рабочая станция
Docker/WSL2 — локальная инфраструктура
Linux — целевая серверная среда
CI — постоянная проверка переносимости
```
