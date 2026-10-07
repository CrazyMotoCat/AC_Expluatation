# Audit Context Capsule

SOURCE_VERSION: 800ba9153868e9f33fd9af9c23c9c3ecc424ed3f + TASK-02.02.02 local changes (2026-10-07)
MODULE: Audit

## PURPOSE

Audit хранит append-only технические факты действий отдельно от business history. Foundation из `TASK-01.03.02` расширен единым generic append contract для текущего critical command.

## OWNS

- AuditEvent persistence
- AuditDbContext и module-owned migrations
- `IAuditWriter`, `AuditEventDraft`, canonical `AuditAction`/`AuditEntityType`
- `IWorkingContextAuditWriter` typed adapters/implementation
- canonical `TerritorialZone` entity and lifecycle action identifiers
- canonical `FunctionalDirection` entity and FunctionalDirectionCreated/Updated/Activated/Deactivated actions, code/name/status snapshots; local implementation review PASS; publication pending
- canonical `Location` entity and LocationCreated/Updated/Moved/Activated/Deactivated actions with fixed allowlisted before/after snapshots; move reason retained

## DB

- `audit.events`
- `audit.__ef_migrations_history`

## INVARIANTS

- Только INSERT; PostgreSQL запрещает UPDATE/DELETE/TRUNCATE.
- Автоматический migration rollback не может удалить `audit.events` без отдельного retention/archival плана.
- Успешный выбор context невозможен без durable audit INSERT.
- Обычный запрос с валидным `X-Work-Context-Id` записывает `WorkingContextApplied` до endpoint; предыдущий POST не обязателен. POST выбора игнорирует header и записывает ровно один `WorkingContextSelected` по body.
- Actor — local user ID; selected context и request correlation обязательны.
- Current critical command requires UUIDv7 event ID, user ID, correlation ID, entity/action and entity ID; acting context follows request-scoped semantics and remains optional in the generic draft. Same event ID plus identical immutable content is an idempotent no-op; conflicting content fails closed.
- For durable business mutations, ADR-011 requires the owning module to commit a durable audit obligation atomically with its business state; `audit.events` materialization is at-least-once and eventual. Territorial Zone delivery is implemented by the technical `Exploitation.AuditDelivery` component through the Sites Application port and canonical `IAuditWriter`.
- Organization C2 delivers its own durable obligations through its Application port and Organization-owned claim/lease/retry store. The technical host polls Sites and Organization independently through one canonical `IAuditWriter`; no direct cross-schema business write or second writer is used.
- Actions and entity types are Audit-owned canonical identifiers; unknown identifiers are rejected.
- before/after are optional structured JSON, limited to 64 KiB UTF-8 and never silently truncated; UserContext, TerritorialZone, Region and OrganizationalUnit payloads use canonical allowlists.
- Нет JWT, passwords, secrets и лишних OIDC claims в событии.
- Audit не заменяет business history и не принадлежит Identity.
- FunctionalDirection mutations atomically create Organization-owned durable
  obligations and reuse canonical delivery; reads/denied/failed/stale/duplicate
  commands have no successful mutation audit; no separate business-history store.
- Location mutations use the existing Sites durable obligation atomically with state, then the same AuditDelivery writer/idempotency. No Location-specific business-history store or optional integration-event emission is implemented by TASK-02.04.02.

## LIFECYCLE

Audit event после вставки неизменяем. Retention, partitioning, query/admin API and system actor model are deferred extension points.

## PERMISSIONS

В текущем foundation нет query/admin endpoint. Audit writer вызывается только после own-context self-service validation; он сам не выдаёт permission.

## PUBLIC CONTRACTS

- `IAuditWriter.AppendAsync` — единый generic Audit-owned append contract.
- `IWorkingContextAuditWriter.WriteSelectedAsync` / `WriteAppliedAsync` — typed adapters для Identity поверх generic writer.
- `Exploitation.AuditDelivery` — technical orchestrator/hosted service consumer of `IAuditWriter`; it does not own Audit persistence or define another writer.

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
