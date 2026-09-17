---
name: backlog-task-loader
version: 1.0
purpose: Загрузить одну конкретную backlog-задачу и преобразовать её в компактный исполнимый task contract.
recommended_max_context_tokens: 1800
---

# backlog-task-loader

## Назначение

Этот skill нужен, чтобы агенту можно было сказать:

```text
Реализуй TASK-03.04.01
```

без копирования длинного backlog section вручную.

---

# Вход

Обязательно:

```text
Task ID
```

Пример:

```text
TASK-03.04.01
```

---

# Источник

Основной:

```text
docs/backlog.md
```

Читать только:

1. соответствующий `TASK-*`;
2. parent `FEATURE-*`;
3. parent `EPIC-*`;
4. dependency section, если он непосредственно влияет на задачу.

Не читать весь backlog.

---

# Алгоритм

## Step 1

Найти exact Task ID.

Если Task ID отсутствует:

```text
STATUS: TASK_NOT_FOUND
```

Не придумывать задачу.

---

## Step 2

Извлечь:

- Task title;
- Priority;
- Goal;
- Dependencies;
- Acceptance Criteria;
- соседние rules, относящиеся именно к этому task.

---

## Step 3

Нормализовать в task contract.

---

# Выход

```text
TASK_ID: TASK-03.04.01
TITLE: Create Asset

EPIC:
EPIC-03 Assets & Master Data

FEATURE:
FEATURE-03.04 Core asset registry

PRIORITY:
P0

GOAL:
Создать актив в master registry.

DEPENDENCIES:
- EPIC-02
- AssetType exists
- Site exists
- Location exists

BUSINESS_RULES:
- asset belongs to one site
- location must belong to same site
- asset type must be active
- model, if supplied, must belong to asset type
- create business history event
- create audit event

ACCEPTANCE_CRITERIA:
- ...
- ...

LIKELY_MODULE:
Assets

LIKELY_SECONDARY:
- Sites

OUT_OF_SCOPE:
- maintenance plan generation unless explicitly part of task
- inventory
- telemetry
```

---

# Дополнительное сжатие

Если acceptance criteria длинные:

не пересказывать их литературно.

Сохранять их как короткие проверяемые пункты.

---

# Task completeness check

Пометить:

```text
TASK_READY: YES
```

если есть:

- понятная цель;
- module;
- acceptance criteria;
- нет фундаментальной неопределённости.

Иначе:

```text
TASK_READY: PARTIAL
MISSING:
- ...
```

---

# Не делать

Skill не должен:

- дополнять business rules из головы;
- проектировать API;
- проектировать таблицы;
- писать tests;
- читать весь concept.

Это делают следующие skills.

---

# Token economy rule

Если task contract помещается в 400–900 tokens, не расширять его до 1800 только ради полноты.

---

# Example

Input:

```text
TASK-10.03.01
```

Output:

```text
TASK_ID: TASK-10.03.01
TITLE: Scan known asset

EPIC:
Inventory

PRIORITY:
P0

GOAL:
Зафиксировать обнаружение известного актива в inventory session.

BUSINESS_RULES:
- сохранить user
- сохранить timestamp
- сохранить actual location
- FOUND or WRONG_LOCATION
- operation must be idempotent

ACCEPTANCE_CRITERIA:
- duplicate retry does not duplicate observation
- wrong location is preserved as discrepancy
- scan is bound to current session
- authorization/scope checked

TASK_READY: YES
```
