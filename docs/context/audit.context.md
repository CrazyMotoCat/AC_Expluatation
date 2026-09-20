# Audit Context Capsule

SOURCE_VERSION: 2026-09-20 (TASK-01.04.01)
MODULE: Audit

## PURPOSE

Audit хранит append-only технические факты действий отдельно от business history. Foundation из `TASK-01.03.02` расширен единым generic append contract для текущего critical command.

## OWNS

- AuditEvent persistence
- AuditDbContext и module-owned migrations
- `IAuditWriter`, `AuditEventDraft`, canonical `AuditAction`/`AuditEntityType`
- `IWorkingContextAuditWriter` typed adapters/implementation

## DB

- `audit.events`
- `audit.__ef_migrations_history`

## INVARIANTS

- Только INSERT; PostgreSQL запрещает UPDATE/DELETE/TRUNCATE.
- Автоматический migration rollback не может удалить `audit.events` без отдельного retention/archival плана.
- Успешный выбор context невозможен без durable audit INSERT.
- Обычный запрос с валидным `X-Work-Context-Id` записывает `WorkingContextApplied` до endpoint; предыдущий POST не обязателен. POST выбора игнорирует header и записывает ровно один `WorkingContextSelected` по body.
- Actor — local user ID; selected context и request correlation обязательны.
- Current critical command requires user ID, correlation ID, entity/action and entity ID; acting context follows request-scoped semantics and remains optional in the generic draft.
- Actions and entity types are Audit-owned canonical identifiers; unknown identifiers are rejected.
- before/after are optional structured JSON, limited to 64 KiB UTF-8 and never silently truncated.
- Нет JWT, passwords, secrets и лишних OIDC claims в событии.
- Audit не заменяет business history и не принадлежит Identity.

## LIFECYCLE

Audit event после вставки неизменяем. Retention, partitioning, query/admin API and system actor model are deferred extension points.

## PERMISSIONS

В текущем foundation нет query/admin endpoint. Audit writer вызывается только после own-context self-service validation; он сам не выдаёт permission.

## PUBLIC CONTRACTS

- `IAuditWriter.AppendAsync` — единый generic Audit-owned append contract.
- `IWorkingContextAuditWriter.WriteSelectedAsync` / `WriteAppliedAsync` — typed adapters для Identity поверх generic writer.

## EVENTS

- `WorkingContextSelected` и `WorkingContextApplied` — Audit actions, не integration events.
- `POST /api/v1/me/context` — текущий critical command, обязательная durable audit запись до success.

## DEPENDENCIES

- PostgreSQL through module-owned EF DbContext;
- `ConnectionStrings:Database` / `ConnectionStrings__Database`.

## FORBIDDEN

- Identity-owned audit table или прямые Identity writes в Audit schema;
- application log как замена audit;
- audit query/admin UI до соответствующей Task ID.
