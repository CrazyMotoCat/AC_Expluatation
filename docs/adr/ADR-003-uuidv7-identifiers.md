# ADR-003 — UUIDv7 для основных идентификаторов

- **Статус:** Accepted
- **Дата:** 2026-09-16

## Контекст

Система должна поддерживать:

- распределённое создание сущностей;
- будущий offline/PWA;
- импорт;
- интеграции;
- отсутствие зависимости от центральных integer sequence;
- удобную сортировку по времени создания.

Обычный UUIDv4 случайный и хуже для B-tree locality.

Integer sequence удобен в одной БД, но хуже подходит для offline/distributed generation.

## Решение

Для основных бизнес-сущностей использовать:

```text
UUIDv7
```

В PostgreSQL:

```text
uuid
```

ID создаётся приложением до persistence.

## Где применяется

- users;
- sites;
- locations;
- assets;
- work orders;
- defects;
- incidents;
- changes;
- documents;
- inventory sessions;
- events;
- другие core entities.

## Human-readable numbers

UUID не заменяет бизнес-номер.

Примеры:

```text
WO-2026-000001
DEF-2026-000001
INC-2026-000001
```

Бизнес-номер используется для интерфейса, UUID — как PK.

## Причины

- distributed generation;
- offline-friendly;
- низкий риск конфликтов;
- time ordering;
- лучшая locality, чем UUIDv4;
- не раскрывает простой последовательный объём объектов как integer PK.

## Последствия

### Положительные

- client может создать ID offline;
- проще batch/import;
- нет центральной зависимости на sequence;
- удобнее будущая синхронизация.

### Отрицательные

- UUID больше integer;
- human support требует отдельного бизнес-номера;
- нужно единообразное создание UUIDv7 во всех клиентах/сервисах.

## Ограничение

QR/public links не обязаны напрямую раскрывать внутренний UUID.

Для внешне доступных QR рекомендуется opaque/public token.
