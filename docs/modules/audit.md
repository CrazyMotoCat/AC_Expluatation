# Module: Audit

STATUS: FOUNDATION EXTENDED
SOURCE_VERSION: 2026-09-23 (TASK-02.01.01 Phase C3R)

## Purpose

Audit хранит доказуемые технические факты действий пользователя отдельно от business history (ADR-008). Минимальный foundation добавлен в `TASK-01.03.02`; `TASK-01.04.01` расширяет тот же механизм единым generic append contract.

## Ownership and database

Audit владеет `audit.events`, `AuditDbContext`, собственной migration и `audit.__ef_migrations_history` по ADR-010. Audit.Contracts владеет `IAuditWriter`, `AuditEventDraft`, а также canonical `AuditAction` и `AuditEntityType`; Identity использует typed adapter, не обращаясь к Audit DbContext/schema напрямую.

`audit.events` содержит event ID UUIDv7, timestamp, actor user ID, acting context ID, correlation ID, action, entity type/ID и optional before/after JSON, reason, IP/user agent. Persistent action/entity identifiers принадлежат Audit, case-sensitive и не выводятся из CLR names; каталог включает `WorkingContextSelected`, `WorkingContextApplied`, `UserContext` и `TerritorialZone` actions/entity. `IAuditWriter.AppendAsync` принимает обязательный caller-supplied UUIDv7 EventId, проверяет actor, correlation, каталог и structured JSON payload до INSERT; before/after ограничены 64 KiB UTF-8 без silent truncation. Повторная доставка с тем же EventId и тем же immutable content завершается no-op, конфликт content отклоняется. JWT, tokens, passwords и secrets не записываются. PostgreSQL triggers отклоняют UPDATE, DELETE и TRUNCATE; EF context также отвергает tracked update/delete. Migration `Down` запрещает автоматическое удаление истории без отдельного retention/archival плана. Durable business mutations follow ADR-011: the owning module commits a durable audit obligation in its own transaction, then Audit materialization is at-least-once and idempotent by stable event ID. UUIDv7 guard добавлен отдельной additive migration.

## Current writer contract

`IAuditWriter.AppendAsync(AuditEventDraft, CancellationToken)` — единый Audit-owned durable append contract. Draft требует UUIDv7 EventId, local user ID, correlation ID, canonical action/entity и entity ID для текущих entity-bound actions; acting context остаётся optional по существующей semantics. Повторный append с тем же EventId и идентичным immutable content безопасен, а другой content для существующего EventId является integrity conflict. Before/after optional, но для `UserContext` и `TerritorialZone` должны быть object JSON только с canonical allowlisted fields, соответствующим snapshot semantics, и не превышать 64 KiB UTF-8.

Territorial Zone obligations materialize through `Exploitation.AuditDelivery`, a technical component outside both module domains. It reads only the Sites Application delivery contract and calls only `IAuditWriter`; Audit Infrastructure remains private to Audit registration/persistence. Sites claims are short-lived and durable (`claim_token`, `lease_until`, `next_attempt_at`); Audit append runs outside the Sites claim transaction, and a conflicting same-ID event is rejected and never authorizes the source obligation to become processed. Delivery remains at-least-once, with stable EventId idempotency.

`IWorkingContextAuditWriter.WriteSelectedAsync` и `WriteAppliedAsync` сохранены как typed adapters и используют только `IAuditWriter`. `WorkingContextSelected` создаётся для POST body, `WorkingContextApplied` — для валидного request header. Оба содержат actor local user ID, `acting_context_id`/`entity_id`, occurred_at, after JSON с context ID и request correlation.

Контекст request-scoped, Identity selection state не мутирует. POST игнорирует header и аудирует выбор body ровно один раз. Другой запрос с `X-Work-Context-Id` аудирует применение до endpoint, включая первый запрос без POST. Контекст предоставляется endpoint только после `AuditDbContext.SaveChangesAsync`; при сбое Audit endpoint не выполняется. Cross-module transaction не требуется, поскольку в Identity нет изменяемого selection state.

## Critical command coverage

Текущий реализованный critical command — `POST /api/v1/me/context`; он проходит через canonical `IAuditWriter` и не возвращает success при ошибке durable audit. `WorkingContextApplied` остаётся security-sensitive audit event, но не command. Будущие state-changing critical commands должны подключаться к этому contract в своих backlog tasks. Generic writer не обещает cross-module atomicity; для первого command с durable business mutation atomicity определяется в его собственной Task.

## Tests

- пустая PostgreSQL → Audit migration → повторное применение без дубликатов;
- Audit-owned schema/history и append-only triggers;
- durable writer round-trip и запрещённые UPDATE/DELETE/TRUNCATE;
- automatic migration rollback rejected without loss of existing events;
- Identity self-service selection → реальный Audit event;
- first-use header → `WorkingContextApplied` до endpoint; POST → ровно один `WorkingContextSelected`;
- HTTP audit failure → 503, без успешного выбора.
- generic valid append with optional acting context;
- required metadata, unknown catalog identifiers, malformed/oversized JSON rejection;
- adapter payload contains only allowlisted context fields.
- Sites obligation delivery preserves stable EventId and immutable payload, survives restart/crash window, rejects conflicting content and remains correct with concurrent dispatchers.

## Deferred extension points

Retention, partitioning, query/admin API, UI, exports, reporting, analytics, search и system actor model остаются deferred. Application logs и business history не заменяют `audit.events`.
