# Audit Context Capsule

SOURCE_VERSION: 2026-09-20
MODULE: Audit

## PURPOSE

Audit хранит append-only технические факты действий отдельно от business history. Текущий minimal foundation обслуживает `WorkingContextSelected` и `WorkingContextApplied` для `TASK-01.03.02`.

## OWNS

- AuditEvent persistence
- AuditDbContext и module-owned migrations
- `IWorkingContextAuditWriter` contract/implementation

## DB

- `audit.events`
- `audit.__ef_migrations_history`

## INVARIANTS

- Только INSERT; PostgreSQL запрещает UPDATE/DELETE/TRUNCATE.
- Автоматический migration rollback не может удалить `audit.events` без отдельного retention/archival плана.
- Успешный выбор context невозможен без durable audit INSERT.
- Обычный запрос с валидным `X-Work-Context-Id` записывает `WorkingContextApplied` до endpoint; предыдущий POST не обязателен. POST выбора игнорирует header и записывает ровно один `WorkingContextSelected` по body.
- Actor — local user ID; selected context и request correlation обязательны.
- Нет JWT, passwords, secrets и лишних OIDC claims в событии.
- Audit не заменяет business history и не принадлежит Identity.

## LIFECYCLE

Audit event после вставки неизменяем. Retention/partitioning deferred to `TASK-01.04.01`.

## PERMISSIONS

В текущем foundation нет query/admin endpoint. Audit writer вызывается только после own-context self-service validation; он сам не выдаёт permission.

## PUBLIC CONTRACTS

- `IWorkingContextAuditWriter.WriteSelectedAsync` / `WriteAppliedAsync` — narrow cross-module writer для Identity.

## EVENTS

- `WorkingContextSelected` и `WorkingContextApplied` — Audit actions, не integration events.

## DEPENDENCIES

- PostgreSQL through module-owned EF DbContext;
- `ConnectionStrings:Database` / `ConnectionStrings__Database`.

## FORBIDDEN

- Identity-owned audit table или прямые Identity writes в Audit schema;
- application log как замена audit;
- audit query/admin UI до соответствующей Task ID.
