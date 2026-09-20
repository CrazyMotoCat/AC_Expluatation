# Module: Audit

STATUS: MINIMAL FOUNDATION
SOURCE_VERSION: 2026-09-20

## Purpose

Audit хранит доказуемые технические факты действий пользователя отдельно от business history (ADR-008). Минимальный foundation добавлен в `TASK-01.03.02` для durable выбора и применения рабочего контекста; полный `TASK-01.04.01` расширит этот же механизм.

## Ownership and database

Audit владеет `audit.events`, `AuditDbContext`, собственной migration и `audit.__ef_migrations_history` по ADR-010. Identity использует `IWorkingContextAuditWriter` из Audit.Contracts, не обращаясь к Audit DbContext/schema напрямую.

`audit.events` содержит event ID UUIDv7, timestamp, actor user ID, acting context ID, correlation ID, action, entity type/ID и optional before/after JSON, reason, IP/user agent. Текущий writer поддерживает только `WorkingContextSelected` и `WorkingContextApplied`; JWT и secrets не записываются. PostgreSQL triggers отклоняют UPDATE, DELETE и TRUNCATE; EF context также отвергает tracked update/delete. Migration `Down` запрещает автоматическое удаление истории без отдельного retention/archival плана. Текущий foundation не partitioned, retention/partitioning и расширенный audit model остаются `TASK-01.04.01`.

## Current writer contract

`IWorkingContextAuditWriter.WriteSelectedAsync` создаёт append-only `WorkingContextSelected` для POST body. `WriteAppliedAsync` создаёт `WorkingContextApplied` для валидного request header. Оба содержат actor local user ID, `acting_context_id`/`entity_id`, occurred_at, `after_json` с context ID и request correlation; previous context в текущем API не известен, `before_json` отсутствует.

Контекст request-scoped, Identity selection state не мутирует. POST игнорирует header и аудирует выбор body ровно один раз. Другой запрос с `X-Work-Context-Id` аудирует применение до endpoint, включая первый запрос без POST. Контекст предоставляется endpoint только после `AuditDbContext.SaveChangesAsync`; при сбое Audit endpoint не выполняется. Cross-module transaction не требуется, поскольку в Identity нет изменяемого selection state.

## Tests

- пустая PostgreSQL → Audit migration → повторное применение без дубликатов;
- Audit-owned schema/history и append-only triggers;
- durable writer round-trip и запрещённые UPDATE/DELETE/TRUNCATE;
- automatic migration rollback rejected without loss of existing events;
- Identity self-service selection → реальный Audit event;
- first-use header → `WorkingContextApplied` до endpoint; POST → ровно один `WorkingContextSelected`;
- HTTP audit failure → 503, без успешного выбора.

## Out of scope until TASK-01.04.01

Audit query/admin API, UI, exports, retention subsystem, partitioning, reporting, analytics и общий writer для других действий. Application logs и business history не заменяют `audit.events`.
