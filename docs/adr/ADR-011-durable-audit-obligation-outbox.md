# ADR-011 — Durable audit obligation for module-owned business mutations

- **Статус:** Accepted
- **Дата:** 2026-09-22
- **Связь:** уточняет ADR-005, ADR-008 и ADR-010

## Контекст

Критичная бизнес-операция может менять состояние в одном module-owned schema и одновременно требовать обязательного технического Audit. Модульные `DbContext` не объединяются глобальным Unit of Work, а Audit владеет своей `audit.events` таблицей.

## Решение

Модуль, владеющий бизнес-состоянием, в одной своей PostgreSQL-транзакции сохраняет:

```text
business mutation
+
module-owned durable audit obligation/outbox
```

Только после успешного commit команда может вернуть SUCCESS. Обязательство содержит все неизменяемые данные, необходимые для последующей материализации Audit event, включая заранее созданный UUIDv7 `audit_event_id`.

Отдельный delivery component позже передаёт obligation через canonical Audit contract в Audit-owned `audit.events`.
Canonical contract принимает заранее созданный `EventId`; materialization с тем же EventId и идентичным immutable content является idempotent no-op, а конфликт content отклоняется. Retry не генерирует новый ID.

## Гарантии

- SUCCESS гарантирует durable audit obligation, но не синхронную видимость строки в `audit.events`.
- Delivery semantics — at-least-once.
- Повторная доставка идемпотентна по стабильному `audit_event_id`; retry не создаёт новый event ID.
- PostgreSQL является durable source of truth; pending obligation переживает crash/restart и остаётся observable/retryable.
- Глобальный порядок событий не гарантируется; сохраняются `occurred_at` и стабильные идентификаторы для ordering внутри команды/entity.

## Delivery claim and retry policy

The Sites delivery adapter uses a short PostgreSQL claim transaction with `FOR UPDATE SKIP LOCKED`. It persists a UUIDv7 `claim_token` and bounded `lease_until`, commits, and releases Sites row locks before calling Audit or waiting between attempts. Completion and failure updates validate the claim token, so a stale worker cannot mutate a later owner's state. A crashed claim becomes eligible after lease expiry. Failed delivery increments `attempt_count`, stores only a bounded diagnostic, and schedules a persisted `next_attempt_at` using bounded exponential backoff; this prevents poison obligations from monopolizing a batch while preserving durable retryability. The guarantee remains at-least-once, not exactly-once.

## Владение и ограничения

- Business module владеет своей mutation и своей obligation/outbox таблицей.
- Audit владеет `audit.events`, canonical writer и validation canonical identifiers.
- Module не пишет напрямую в чужую schema.
- Audit не пишет business state module.
- Не создаются global DbContext, global Unit of Work, distributed transaction, shared cross-module transaction или второй audit mechanism.
- RabbitMQ не является обязательным для корректности этого пути.

## Последствия

Положительные:

- business mutation и обязательство не могут разделиться при commit;
- отказ Audit delivery не теряет требование аудита;
- module ownership и ADR-010 сохраняются.

Отрицательные:

- `audit.events` становится eventual;
- требуется idempotent delivery, retry и наблюдаемость pending/failed obligations;
- каждая module-owned obligation требует собственного persistence review.
