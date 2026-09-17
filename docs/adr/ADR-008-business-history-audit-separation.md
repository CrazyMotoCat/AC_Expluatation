# ADR-008 — Разделение бизнес-истории и технического аудита

- **Статус:** Accepted
- **Дата:** 2026-09-16

## Контекст

Для эксплуатации важны два разных вопроса:

1. **Что происходило с оборудованием?**
2. **Кто изменял данные в информационной системе?**

Если хранить это одной таблицей, смысл смешивается.

Пример:

```text
Asset moved to Server Room 2
```

— это эксплуатационный факт.

А:

```text
User Ivanov changed location_id from A to B
```

— audit fact.

## Решение

Использовать два независимых механизма.

## Business History

Пример:

```text
assets.asset_events
```

Содержит:

- commissioning;
- maintenance completed;
- repair;
- movement;
- replacement;
- inventory verification;
- decommissioning.

История ориентирована на пользователя и эксплуатацию.

## Audit Trail

Пример:

```text
audit.events
```

Содержит:

- user;
- context;
- action;
- entity;
- before;
- after;
- correlation ID;
- IP/user agent where required;
- reason.

Audit ориентирован на доказательство действий в системе.

## Важное правило

Ни один механизм не заменяет другой.

Нельзя считать обычный application log ни business history, ни audit trail.

## Consequences

### Положительные

- чистая предметная история;
- удобные timeline;
- сильный audit;
- проще разбирать инциденты и ошибки пользователей.

### Отрицательные

- часть событий записывается в оба механизма;
- требуется согласованность и дисциплина.

## Atomicity

Для критичных операций желательно сохранять:

```text
business state
+
business event
+
audit event
+
outbox
```

в согласованной транзакционной границе.

## Retention

Business history — обычно бессрочно.

Audit — долгосрочно согласно корпоративной политике.
