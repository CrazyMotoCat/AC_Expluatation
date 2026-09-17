---
name: module-context
version: 1.0
purpose: Сформировать компактную капсулу контекста одного доменного модуля вместо загрузки больших документов.
recommended_max_context_tokens: 2500
---

# module-context

## Назначение

`module-context` подаёт агенту минимально достаточный контекст конкретного модуля.

Он должен заменить чтение:

- `concept.md` целиком;
- `architecture.md` целиком;
- `database.md` целиком;
- `api-guidelines.md` целиком;
- `security.md` целиком.

---

# Когда использовать

После `task-router`, когда primary module уже определён.

Пример:

```text
module-context Assets
```

---

# Preferred source

Сначала искать:

```text
docs/context/<module>.context.md
```

Пример:

```text
docs/context/assets.context.md
```

Если капсула существует и актуальна — использовать её как основной источник.

---

# Fallback

Если context capsule отсутствует:

читать только релевантные sections из:

```text
docs/concept.md
docs/architecture.md
docs/database.md
docs/api-guidelines.md
docs/security.md
docs/testing.md
docs/project-structure.md
```

Не читать документы полностью, если можно выбрать section по module name.

---

# Обязательный состав капсулы

Капсула должна содержать ровно эти разделы.

## 1. Purpose

1–3 предложения.

## 2. Owned entities

Короткий список.

## 3. Owned DB schema/tables

Только основные таблицы.

## 4. Invariants

5–15 наиболее важных правил.

## 5. Lifecycle

Если есть.

## 6. Permissions

Ключевые permission codes.

## 7. Public contracts

Что может использовать другой module.

## 8. Domain/Application events

Основные события.

## 9. Dependencies

Разрешённые зависимости.

## 10. Forbidden shortcuts

Типичные ошибки агента.

---

# Контекстный бюджет

Цель:

```text
800–2500 tokens
```

Hard limit:

```text
3500 tokens
```

Если контекст выходит за limit:

1. убрать примеры;
2. убрать второстепенные поля;
3. сохранить invariants;
4. сохранить contracts;
5. сохранить security rules.

---

# Приоритет информации

Если приходится сокращать:

```text
1. Invariants
2. Permissions / scope
3. Owned data
4. Public contracts/events
5. Lifecycle
6. Examples
```

---

# Формат выхода

```text
MODULE: Assets

PURPOSE:
...

OWNS:
- Asset
- AssetType
- AssetModel
- AssetRelation
- AssetResponsibility

DB:
- assets.assets
- assets.asset_types
- assets.asset_models
- assets.asset_relations
- assets.asset_responsibilities
- assets.asset_events

INVARIANTS:
- ...
- ...

LIFECYCLE:
...

PERMISSIONS:
- assets.read
- assets.create
- assets.change
- ...

PUBLIC_CONTRACTS:
- AssetReference
- GetAssetMaintenanceContext
- ...

EVENTS:
- AssetCommissioned
- AssetMoved
- AssetReplaced

DEPENDS_ON:
- Sites.Contracts
- Identity/authorization abstractions

FORBIDDEN:
- direct Maintenance DB writes
- physical delete of asset history
- returning EF entity from API

SOURCE_VERSION:
<git sha or doc timestamp if available>
```

---

# Capsule freshness

Если `docs/context/<module>.context.md` содержит:

```text
SOURCE_VERSION
```

и он явно старее существенного изменения module docs/code:

пометить:

```text
CONTEXT_STALE: YES
```

и использовать fallback.

---

# Правило обновления капсулы

После существенного изменения:

- entities;
- lifecycle;
- permissions;
- contracts;
- module events;
- core invariants;

обновить capsule.

Не обновлять её после косметических изменений.

---

# Минимальная капсула Assets — пример

```text
MODULE: Assets

PURPOSE:
Единый реестр оборудования и составных инженерных систем.

OWNS:
Asset, AssetType, Manufacturer, AssetModel,
AssetRelation, AssetResponsibility, AssetEvent,
AssetReplacement, Warranty.

INVARIANTS:
- Asset belongs to one Site.
- Location must belong to same Site.
- Model must match AssetType.
- Business-critical history is never physically deleted.
- Replacement preserves old Asset history.
- Responsibility is multi-role, not one "responsible" field.
- Parent/child graph must be acyclic.
- Asset timeline is separate from Audit.

EVENTS:
AssetCreated, AssetCommissioned, AssetMoved,
AssetReplaced, AssetDecommissioned.

FORBIDDEN:
- WorkOrders changing assets tables directly.
- Maintenance querying assets tables directly.
- storing photos in PostgreSQL.
```

---

# Stop conditions

Skill не должен:

- проектировать конкретный use case;
- генерировать код;
- делать полный code review;
- загружать secondary modules без запроса.

Secondary context загружается отдельным вызовом только при необходимости.
