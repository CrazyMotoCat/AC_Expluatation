# ADR-005 — Transactional Outbox + RabbitMQ для надёжных фоновых событий

- **Статус:** Accepted
- **Дата:** 2026-09-16

## Контекст

После бизнес-операций системе нужно запускать побочные процессы:

- уведомления;
- генерацию отчётов;
- обработку медиа;
- интеграции;
- пересчёты;
- будущую синхронизацию.

Нельзя допустить ситуацию:

```text
DB transaction committed
но message publish failed
```

или наоборот.

## Решение

Использовать:

```text
Transactional Outbox
+
RabbitMQ
```

## Поток

```text
Business transaction
├── business changes
└── integrations.outbox_messages

COMMIT

Outbox Publisher
→ RabbitMQ
→ Consumer/Worker
```

## Гарантия

Business change и запись outbox сохраняются атомарно в PostgreSQL.

Публикация выполняется позже.

## Где использовать

- notifications;
- report generation;
- media processing;
- integration events;
- long-running tasks;
- telemetry/integration adapters в будущем.

## Где не использовать

Обычный CRUD не должен превращаться в message workflow.

## Consumer requirements

Consumer должен быть:

- idempotent;
- retry-safe;
- observable;
- иметь bounded retry;
- иметь DLQ для необрабатываемых сообщений.

## Причины выбора RabbitMQ

- достаточно для command/event workloads системы;
- проще Kafka;
- зрелый routing;
- хорош для work queues;
- понятен для небольшой команды.

## Альтернативы

### Kafka

Отклонён на старте как избыточный.

Может быть рассмотрен для крупного telemetry/event streaming в будущем.

### Только background jobs в БД

Недостаточно удобно для интеграций и независимых workers.

## Последствия

### Положительные

- надёжная доставка;
- decoupling;
- retry;
- масштабируемые workers.

### Отрицательные

- eventual consistency;
- необходимость idempotency;
- дополнительная инфраструктура.

## Правило

> RabbitMQ не является source of truth. Source of truth остаётся PostgreSQL.
