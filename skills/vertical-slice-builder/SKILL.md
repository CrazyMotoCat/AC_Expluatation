---
name: vertical-slice-builder
version: 1.0
purpose: Преобразовать готовую business task в минимальный план вертикальной реализации по слоям, файлам и тестам.
recommended_max_context_tokens: 2600
---

# vertical-slice-builder

## Назначение

Skill превращает:

```text
Task Contract
+
Module Context
```

в конкретный implementation plan.

Он не должен писать весь код сразу.

Главная задача:

> Показать минимальный вертикальный срез, который полностью реализует use case от Domain до tests.

---

# Предварительные условия

Должны быть известны:

```text
PRIMARY_MODULE
Task contract
Module context
```

Если нет — сначала использовать:

```text
task-router
backlog-task-loader
module-context
```

---

# Читаемый контекст

Разрешено:

```text
docs/project-structure.md — только правила нужного module/layer
1–3 наиболее похожих существующих use cases
релевантная module context capsule
```

Не читать весь repository.

---

# Step 1 — определить тип изменения

Один или несколько:

```text
NEW_USE_CASE
MODIFY_USE_CASE
NEW_ENTITY
DB_CHANGE
API_CHANGE
EVENT_CHANGE
BACKGROUND_JOB
FRONTEND_CHANGE
```

---

# Step 2 — Domain impact

Ответить:

```text
Нужна новая Entity?
Новый method?
Новый invariant?
Новый Domain Event?
Новый status?
```

Если новый status:

```text
FLAG: LIFECYCLE_CHANGE
```

---

# Step 3 — Database impact

Ответить:

```text
Нужна migration?
Какая owned schema?
Какие таблицы?
Нужен index?
Нужен constraint?
```

Не проектировать чужие schemas.

---

# Step 4 — Application use case

Определить:

```text
Command/Query
Validator
Handler
Authorization
Repository/query calls
Events
Transaction boundary
```

---

# Step 5 — API impact

Определить:

```text
route
method
request
response
errors
permission
scope
idempotency
concurrency
```

---

# Step 6 — Audit/history/outbox

Проверить отдельно:

```text
BUSINESS_HISTORY
AUDIT
OUTBOX
```

Для каждого:

```text
YES / NO + короткая причина
```

---

# Step 7 — Frontend impact

Только если task реально требует UI.

Определить:

```text
page
feature
entity hook
form
query invalidation
permission rendering
```

---

# Step 8 — Tests

Минимальный набор:

```text
UNIT
INTEGRATION
AUTHORIZATION
CONCURRENCY
IDEMPOTENCY
MIGRATION
E2E_IMPACT
```

Для ненужных:

```text
NO
```

---

# Выход

Строгий формат:

```text
SLICE: CreateAsset

MODULE:
Assets

CHANGE_TYPE:
- NEW_USE_CASE
- DB_CHANGE
- API_CHANGE

FILES_TO_ADD:
- Modules/Assets/.../Application/Assets/Create/CreateAssetCommand.cs
- Modules/Assets/.../Application/Assets/Create/CreateAssetHandler.cs
- Modules/Assets/.../Application/Assets/Create/CreateAssetValidator.cs
- Modules/Assets/.../Api/Endpoints/CreateAssetEndpoint.cs
- tests/backend/Integration/Assets/CreateAssetTests.cs
- tests/backend/Authorization/Assets/CreateAssetAuthorizationTests.cs

FILES_TO_MODIFY:
- AssetsDbContext.cs
- AssetConfiguration.cs
- module endpoint registration

DOMAIN:
- use existing Asset.Create(...)
- invariants: site/location/model consistency

DATABASE:
- migration required: YES/NO
- schema: assets
- indexes: ...

API:
POST /api/v1/assets

PERMISSION:
assets.create

SCOPE:
site + asset type + working context

BUSINESS_HISTORY:
YES — AssetCreated

AUDIT:
YES — creation is business-critical master data

OUTBOX:
NO — unless downstream reaction required

IDEMPOTENCY:
NO/OPTIONAL/REQUIRED

CONCURRENCY:
NO for create

TESTS:
UNIT:
- ...

INTEGRATION:
- ...

AUTHORIZATION:
- ...

MIGRATION:
- ...

OUT_OF_SCOPE:
- ...
```

---

# Минимальность

Не добавлять файл/слой, если он не нужен.

Пример:

Если use case — read-only query:

не создавать Domain Event и Repository aggregate без причины.

---

# Similar pattern rule

Перед предложением структуры найти максимум 3 похожих use cases.

Формат:

```text
REFERENCE_PATTERNS:
- Assets/Move
- Sites/Create
```

Не читать 20 аналогов.

---

# Architecture gate

Если implementation plan требует:

- нового infrastructure component;
- нового cross-module direct reference;
- нового status;
- обхода existing contract;

пометить:

```text
ARCH_REVIEW_REQUIRED: YES
```

---

# Stop conditions

После implementation plan остановиться.

Не начинать массовую реализацию, если skill используется только для планирования.

Если вызывающий агент явно просит сразу реализовать task — после плана можно переходить к коду.
