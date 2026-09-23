# АС «Эксплуатация» — Deployment & Operations

## 1. Назначение документа

Этот документ определяет базовые правила развёртывания, обновления и эксплуатации АС «Эксплуатация».

Документ применяется совместно с:

- `concept.md`;
- `roadmap.md`;
- `architecture.md`;
- `coding-standards.md`;
- `database.md`;
- `api-guidelines.md`;
- `security.md`;
- `testing.md`;
- `dev-environment.md`.

Он предназначен для:

- разработчиков;
- DevOps;
- администраторов;
- DBA;
- специалистов ИБ;
- Codex и других AI-агентов;
- будущей команды эксплуатации.

Основная цель — обеспечить одинаково предсказуемое развёртывание от локальной разработки до промышленной среды.

---

# 2. Базовый принцип

> Приложение должно собираться один раз и разворачиваться одинаковым образом во всех средах.

Различия между средами должны задаваться конфигурацией, а не отдельными ветками кода.

---

# 3. Целевая модель окружений

Минимальный набор:

```text
DEV
TEST
STAGE
PROD
```

Дополнительно при необходимости:

```text
PERF
SECURITY
TRAINING
```

---

# 4. DEV

Назначение:

- локальная разработка;
- быстрые изменения;
- отладка;
- Codex/AI-разработка;
- локальные integration tests.

Допускается:

- Docker Compose;
- локальный PostgreSQL container;
- локальный SeaweedFS как DEV-only S3-compatible backend по ADR-009;
- локальный RabbitMQ;
- локальный Redis;
- локальный Keycloak.

---

# 5. TEST

Назначение:

- общие интеграционные проверки;
- QA;
- автоматические тесты;
- тест миграций;
- тест API.

TEST не должен использовать production credentials или реальные чувствительные данные.

---

# 6. STAGE

Назначение:

- максимально близкая копия PROD по архитектуре;
- pre-release проверка;
- миграции;
- smoke;
- performance light;
- business acceptance.

STAGE должен повторять:

- reverse proxy;
- количество ключевых сервисов;
- auth;
- object storage;
- очередь;
- DB extensions;
- network policy.

---

# 7. PROD

Назначение:

- промышленная эксплуатация.

PROD отличается от остальных сред:

- жёсткими правами;
- backup;
- monitoring;
- HA там, где необходимо;
- контролируемыми релизами;
- change management;
- запретом ручных изменений БД.

---

# 8. Базовый deployment первого этапа

Рекомендуемая схема:

```text
                    Internet / Corporate Network
                              │
                              ▼
                       Reverse Proxy
                      Nginx / Traefik
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
             API #1                     API #2
                 │                         │
                 └────────────┬────────────┘
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
        PostgreSQL          Redis          RabbitMQ
             │
             ▼
       Object Storage
       S3-compatible

Workers:
- Scheduler
- Notifications
- Reports
- Media
```

На ранней стадии допускается один API instance.

---

# 9. Контейнеризация

Все сервисы приложения должны запускаться в containers.

Минимум:

- backend;
- frontend;
- workers.

Инфраструктура может быть:

- containerized;
- managed service;
- отдельным сервером.

---

# 10. Docker images

Каждый release получает immutable tag.

Пример:

```text
exploitation-api:1.4.2
exploitation-web:1.4.2
exploitation-worker:1.4.2
```

Не использовать в production только:

```text
latest
```

---

# 11. Image tagging

Рекомендуется:

```text
semantic version
+
git SHA
```

Пример:

```text
1.4.2
sha-4f3a21c
```

---

# 12. Build once

Artifact/image, прошедший STAGE, должен быть тем же artifact, который идёт в PROD.

Не пересобирать код специально для PROD.

---

# 13. Container security

Production container:

- non-root;
- read-only filesystem where feasible;
- minimal base image;
- no development tools;
- no secrets baked into image.

---

# 14. Runtime configuration

Передаётся через:

- environment variables;
- mounted secrets;
- configuration provider;
- secret manager.

Не хранить production values в Git.

---

# 15. Configuration hierarchy

Пример:

```text
appsettings.json
appsettings.<Environment>.json
environment variables
secret provider
```

Secrets имеют самый высокий приоритет.

---

# 16. Feature Flags

Неприоритетные функции включаются через feature flags.

Примеры:

```text
AdvancedCostTracking
OfflineSync
AdvancedRiskRules
KnowledgeBase
Telemetry
```

---

# 17. Reverse Proxy

Рекомендуется:

- Nginx;
- Traefik.

Функции:

- TLS termination;
- routing;
- security headers;
- upload size limits;
- access logs;
- compression;
- optional rate limiting.

---

# 18. TLS

PROD:

```text
HTTPS only
```

HTTP:

```text
redirect → HTTPS
```

Внутренние service connections также защищаются при требованиях корпоративной ИБ.

---

# 19. DNS

Использовать стабильные DNS names.

Пример:

```text
exploitation.company.local
api.exploitation.company.local
```

Не hardcode IP в приложении.

---

# 20. PostgreSQL

Для PROD предпочтительно:

- отдельный сервер/cluster;
- managed PostgreSQL, если доступно;
- либо dedicated VM.

Не размещать production DB внутри того же disposable Compose stack, что и API.

---

# 21. PostgreSQL version

Фиксировать major version.

Текущий зафиксированный major:

```text
PostgreSQL 18
```

DEV image pin: `postgres:18.6-bookworm`.

Обновление major PostgreSQL — отдельное изменение и отдельный план миграции.

---

# 22. PostgreSQL extensions

Каждое расширение должно быть документировано.

Возможные:

```text
pg_trgm
pg_stat_statements
```

Не добавлять extension без причины.

---

# 23. Connection pooling

Использовать Npgsql pooling.

Настройки:

- max pool size;
- command timeout;
- connection lifetime;

подбираются по load test.

---

# 24. PostgreSQL HA

Для раннего пилота может быть один primary с надёжным backup.

Для промышленной эксплуатации рассмотреть:

- primary + replica;
- automatic failover;
- managed HA.

Решение зависит от RPO/RTO.

---

# 25. Redis

Используется как cache/coordination layer.

Потеря Redis не должна означать потерю бизнес-данных.

---

# 26. RabbitMQ

Используется для:

- background jobs;
- notifications;
- reports;
- media;
- integrations.

Не использовать RabbitMQ как primary data store.

---

# 27. RabbitMQ durability

Production queues/messages:

- durable where business-critical;
- persistent messages;
- retry;
- DLQ.

---

# 28. Object Storage

Используется для:

- документов;
- фото;
- отчётов;
- export files;
- import files.

Production bucket не public.

Архитектурный контракт — S3-compatible object storage. SeaweedFS выбран только для local DEV по ADR-009; production provider пока не выбран и должен определяться отдельным решением.

---

# 29. Object Storage lifecycle

Отдельные правила для:

- permanent documents;
- photos;
- temporary exports;
- temporary uploads.

Пример:

```text
exports → delete after 30 days
temporary upload → delete after 24 hours
```

---

# 30. Keycloak / Entra ID

Если используется корпоративный Entra ID:

- приложение регистрируется отдельно;
- роли/claims документируются;
- secrets/certificates ротируются.

Если Keycloak:

- отдельный realm;
- backup realm configuration;
- admin access ограничен.

---

# 31. Worker processes

Workers логически разделены.

Примеры:

```text
SchedulerWorker
ReportWorker
NotificationWorker
MediaWorker
IntegrationWorker
```

На старте допускается один executable с разными hosted services.

---

# 32. Scheduler singleton

Некоторые scheduler jobs должны выполняться только одним worker instance.

Использовать:

- distributed lock;
- PostgreSQL advisory lock;
- Redis lock с осторожностью.

---

# 33. Stateless API

API instance не хранит локальное критичное состояние.

Это позволяет horizontal scaling.

---

# 34. Sticky sessions

Не должны требоваться.

---

# 35. Frontend deployment

Frontend:

- static build;
- отдаётся через Nginx/CDN/internal web server.

Runtime API URL должен задаваться предсказуемо.

---

# 36. CI/CD pipeline

Базовый pipeline:

```text
Checkout
↓
Restore dependencies
↓
Lint
↓
Build
↓
Unit tests
↓
Integration tests
↓
Authorization tests
↓
Migration check
↓
Security scan
↓
Build images
↓
Push registry
↓
Deploy TEST/STAGE
↓
Smoke
↓
Approval
↓
Deploy PROD
↓
Smoke
```

---

# 37. Pull Request gate

Merge запрещён при:

- failed build;
- failed tests;
- breaking OpenAPI без решения;
- migration failure;
- critical vulnerability;
- lint errors agreed as blocking.

---

# 38. Branch strategy

Рекомендуемый вариант:

```text
main
feature/*
fix/*
```

`main` всегда deployable.

Не создавать сложный GitFlow без необходимости.

---

# 39. Release strategy

Рекомендуется:

```text
Semantic Versioning
```

Пример:

```text
1.3.0
```

---

# 40. Release notes

Каждый релиз содержит:

- новые функции;
- fixes;
- DB migrations;
- feature flags;
- known issues;
- deployment notes;
- rollback notes.

---

# 41. Database migrations

Миграции применяются контролируемо.

Не запускать рискованные DDL автоматически одновременно на всех production nodes без анализа.

---

# 42. Migration process

Типовой flow:

```text
1. Backup / restore point
2. Maintenance/readiness check
3. Apply migration
4. Validate schema
5. Start new app version
6. Smoke
```

---

# 43. Expand/Contract

Для несовместимых изменений:

Release A:

```text
добавить новое поле
старое оставить
```

Release B:

```text
переключить код
```

Release C:

```text
удалить старое поле
```

---

# 44. Long migrations

Не выполнять огромный backfill в одной блокирующей migration.

Использовать:

- new nullable column;
- background backfill;
- batches;
- final constraint later.

---

# 45. Migration locking

Перед production migration оценивать:

- lock type;
- table size;
- expected duration;
- rollback/forward fix.

---

# 46. Rollback philosophy

Кодовый rollback должен быть возможен.

DB rollback не всегда безопасен.

Поэтому основной подход:

```text
forward-compatible migrations
+
forward fix
```

---

# 47. Blue/Green

Позднее возможно для API/frontend.

Для начала достаточно rolling/restart deployment.

---

# 48. Zero-downtime

Не обязательное требование самого первого пилота.

Но архитектура должна к нему стремиться.

---

# 49. Health checks

Минимум:

```text
/health/live
/health/ready
```

---

# 50. Liveness

Проверяет:

- процесс жив;
- event loop/runtime работает.

Не должен зависеть от всех внешних систем.

---

# 51. Readiness

Проверяет возможность обслуживать запросы:

- DB connectivity;
- критичные dependencies.

---

# 52. Startup check

На старте:

- config validation;
- DB schema compatibility;
- required secrets presence.

Fail fast при критичной ошибке.

---

# 53. Monitoring

Основные метрики:

```text
HTTP latency
HTTP errors
request rate
DB pool
DB latency
queue depth
failed messages
worker lag
cache hit ratio
storage failures
upload failures
disk usage
CPU
RAM
```

---

# 54. Business metrics

Полезно мониторить технически:

- scheduler last success;
- overdue generation job;
- report queue age;
- notification failure count;
- outbox backlog.

---

# 55. Logging

Structured logs.

Обязательные поля:

```text
timestamp
level
service
environment
correlationId
message
```

Где применимо:

```text
userId
workContextId
entityId
```

---

# 56. Centralized logs

Production logs собираются централизованно.

Варианты:

- Loki;
- OpenSearch;
- корпоративная SIEM.

---

# 57. Tracing

OpenTelemetry.

Полезные spans:

- HTTP request;
- DB;
- RabbitMQ;
- S3;
- external integration.

---

# 58. Alerting

Алерт должен означать необходимость действия.

Не создавать сотни шумных алертов.

---

# 59. Critical alerts

Примеры:

- API unavailable;
- DB unavailable;
- DB disk critical;
- outbox backlog growing;
- RabbitMQ queue stuck;
- S3 errors;
- backup failed;
- restore validation failed;
- authentication provider unavailable.

---

# 60. Backup policy

PostgreSQL:

- регулярные full/base backups;
- WAL archiving;
- PITR.

---

# 61. Backup frequency

Конкретно определяется RPO.

Для пилота допустим более простой режим.

Для PROD — согласованный RPO.

---

# 62. Backup encryption

Обязательно.

---

# 63. Backup retention

Примерная схема определяется политикой:

```text
daily
weekly
monthly
```

Не фиксировать срок без корпоративных требований.

---

# 64. Restore testing

Не реже согласованного периода выполнять реальное восстановление в отдельную среду.

---

# 65. Object storage backup

Нужны:

- versioning;
- replication;
- backup/lifecycle strategy.

---

# 66. Configuration backup

Сохранять:

- infrastructure configs;
- reverse proxy configs;
- Keycloak realm export if used;
- deployment manifests.

Secrets отдельно.

---

# 67. Disaster Recovery

Документировать:

```text
RPO
RTO
primary failure
DB restore
storage restore
identity failure
```

---

# 68. RPO

Определяется бизнесом.

Архитектура должна позволять снижать RPO по мере зрелости.

---

# 69. RTO

Определяется бизнесом и критичностью самой АС.

---

# 70. Maintenance mode

Желательно иметь controlled maintenance mode.

UI показывает:

- сервис временно недоступен;
- read-only, если реализовано.

---

# 71. Read-only mode

Позднее полезен при:

- maintenance;
- incident;
- DB failover.

---

# 72. Deployment permissions

Production deployment имеет отдельные права.

Разработчик не должен использовать личный superuser-доступ для обычного deploy.

---

# 73. Production DB access

Прямой write access людям — максимально ограничен.

Все изменения данных:

- через приложение;
- либо formal DBA procedure.

---

# 74. Manual SQL

Если emergency manual SQL необходим:

- ticket/change;
- peer review;
- backup;
- script saved;
- audit;
- result validation.

---

# 75. Secrets rotation

Поддерживать ротацию:

- DB credentials;
- S3 keys;
- RabbitMQ credentials;
- integration secrets;
- signing secrets.

---

# 76. Certificates

Контролировать expiry TLS/client certificates.

---

# 77. Infrastructure as Code

Желательно постепенно перейти к IaC.

Варианты:

- Ansible;
- Terraform;
- deployment manifests.

Для одного VDS на старте можно начать проще, но конфигурация должна быть воспроизводимой.

---

# 78. Docker Compose production

Для пилота/небольшого deployment допустим.

Но:

- отдельные volumes;
- backup;
- restart policies;
- logs;
- monitoring.

---

# 79. Kubernetes

Не является обязательным.

Переход только при реальной необходимости:

- много сервисов;
- сложное horizontal scaling;
- HA orchestration;
- корпоративный стандарт.

---

# 80. Single VDS pilot

Возможная схема пилота:

```text
VDS / Linux
├── reverse proxy
├── API
├── Web
├── Worker
├── Redis
├── RabbitMQ
└── S3-compatible Object Storage (provider not selected)

PostgreSQL:
лучше отдельный managed/dedicated instance,
но на раннем пилоте может быть на том же сервере при осознанном риске.
```

---

# 81. Production separation

По мере роста желательно разделить:

```text
App nodes
DB
Object storage
Messaging/cache
```

---

# 82. Sizing — стартовый ориентир

Не является финальным sizing.

Для пилота:

```text
4–8 vCPU
16–32 GB RAM
SSD/NVMe
```

Точное значение — после load test.

---

# 83. DB sizing

Зависит сильнее всего от:

- количества assets;
- work order history;
- measurements;
- audit;
- reporting.

---

# 84. Object storage sizing

Фото и документы могут стать крупнейшим объёмом.

Нужно отслеживать:

- average photo size;
- photos per work order;
- retention;
- previews.

---

# 85. Capacity planning

Ежемесячно/ежеквартально отслеживать:

```text
DB growth
S3 growth
queue volume
request volume
users
work orders
measurements
```

---

# 86. Deploy smoke tests

После deploy:

1. `/health/ready`.
2. Login/auth.
3. Read reference data.
4. Open site.
5. Open asset.
6. Basic write in non-prod.
7. Queue test.
8. S3 access.
9. Scheduler status.

---

# 87. Canary

Позднее можно использовать canary deploy.

На первом этапе необязательно.

---

# 88. Rollback trigger

Rollback/stop rollout при:

- elevated 5xx;
- auth failures;
- migration corruption;
- critical permission regression;
- severe latency regression.

---

# 89. Feature rollback

Если проблема локальна функции — предпочтительно отключить feature flag, а не откатывать весь release.

---

# 90. Background job compatibility

При rolling deploy old/new workers могут кратко сосуществовать.

Message contracts должны быть backward compatible.

---

# 91. Queue versioning

Для breaking message changes:

- новый event version;
- либо новая queue/routing key.

---

# 92. Scheduled jobs

Документировать:

- имя;
- частоту;
- owner;
- timeout;
- retry;
- locking.

---

# 93. Example scheduled jobs

```text
maintenance-plan-recalculate
maintenance-workorder-generate
qualification-expiry-check
contract-expiry-check
temporary-file-cleanup
outbox-publish
```

---

# 94. Cron timezone

Внутренние scheduler times хранить/исполнять осознанно.

Бизнес-задачи учитывают timezone объекта.

Infrastructure cron предпочтительно UTC.

---

# 95. Data migration deployment

Для массового legacy import:

- отдельный import job;
- не блокировать release;
- staging tables;
- validation report.

---

# 96. Monitoring migrations

После релиза проверить:

- error rate;
- slow queries;
- index usage;
- deadlocks.

---

# 97. DB statistics

Включить `pg_stat_statements` при возможности.

---

# 98. Vacuum / Analyze

Следить за autovacuum на крупных таблицах:

- audit;
- measurements;
- work_order_steps.

---

# 99. Partition operations

Создание будущих partitions должно быть автоматизировано до достижения даты.

---

# 100. Storage cleanup

Запускать controlled cleanup только для данных с retention policy.

Никогда не удалять business history общей cleanup-задачей.

---

# 101. Security updates

OS/container/runtime patches должны устанавливаться регулярно.

---

# 102. Major framework upgrades

.NET/React/PostgreSQL major upgrade — отдельная planned task с regression tests.

---

# 103. Environment drift

STAGE и PROD не должны расходиться вручную.

Конфигурация должна быть version-controlled, кроме secrets.

---

# 104. Configuration validation

Каждый config option должен иметь:

- default где безопасно;
- validation;
- startup failure при критичном отсутствии.

Sites audit delivery использует валидируемую секцию `Sites:AuditDelivery` (environment prefix form `Sites__AuditDelivery__*`): `Enabled`, `PollIntervalSeconds`, `BatchSize`, `MaxAttemptsPerObligationPerCycle`, `RetryDelayMilliseconds`, `LeaseDurationSeconds`, `InitialBackoffSeconds`, `MaximumBackoffSeconds`. Version-controlled Development-safe defaults находятся в API `appsettings.json`; secrets и connection strings в этой секции запрещены. Claim transaction is short and commits `claim_token`/`lease_until` before Audit calls; stale claims recover after lease expiry, and failures persist bounded `next_attempt_at` backoff. Dispatcher не блокирует startup ожиданием delivery и при временной недоступности БД оставляет PostgreSQL obligations retryable.

---

# 105. Logging level

PROD:

```text
Information
```

по умолчанию.

Debug/Trace включаются временно и адресно.

---

# 106. PII in logs

Не включать body requests по умолчанию.

Особенно:

- документы;
- comments;
- personal data.

---

# 107. Operational runbooks

По мере появления PROD создать:

```text
runbooks/
├── api-down.md
├── database-down.md
├── rabbitmq-backlog.md
├── storage-failure.md
├── backup-restore.md
├── auth-provider-down.md
└── failed-migration.md
```

---

# 108. Release checklist

Перед PROD:

- release notes;
- tests green;
- migration reviewed;
- backup healthy;
- rollback/forward plan;
- feature flags checked;
- monitoring ready;
- approver.

---

# 109. Post-release checklist

После PROD:

- smoke;
- metrics;
- logs;
- queue;
- DB;
- user critical flow;
- no permission regression.

---

# 110. Codex rules

Codex не должен:

- менять production deployment вручную;
- добавлять infrastructure dependency без ADR;
- помещать secrets в repository;
- менять DB migration strategy без review;
- добавлять public port без необходимости;
- использовать `latest` как единственный production tag;
- отключать health checks;
- делать destructive migration без отдельного плана.

---

# 111. Definition of Done — Deployment

Новый компонент готов к deployment, если:

1. Есть Dockerfile.
2. Есть health checks.
3. Есть config validation.
4. Secrets вынесены.
5. Logs structured.
6. Metrics предусмотрены.
7. CI build есть.
8. Rollout описан.
9. Migration strategy есть.
10. Backup impact рассмотрен.
11. Security review выполнен.
12. Smoke test есть.

---

# 112. Главный принцип эксплуатации

> Простота эксплуатации — часть архитектуры.

На раннем этапе предпочтительнее:

```text
несколько хорошо понятных компонентов
+
автоматизированные backup/deploy
+
хороший monitoring
```

чем сложная Kubernetes-инфраструктура, которая не даёт реальной ценности проекту.
