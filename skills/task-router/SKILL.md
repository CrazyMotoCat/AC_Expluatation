---
name: task-router
version: 1.0
purpose: Определить минимальный набор модулей, документов и skills для конкретной задачи.
recommended_max_context_tokens: 1200
---

# task-router

## Назначение

`task-router` — первый lightweight skill.

Он не решает задачу.

Он определяет:

- основной module owner;
- вторичные модули;
- нужные документы;
- нужные skills;
- нужен ли ADR;
- нужен ли DB/API/security контекст.

Главная цель:

> Не позволять агенту читать весь репозиторий и всю документацию перед каждой задачей.

---

# Когда использовать

Использовать, если задача касается:

- реализации;
- изменения бизнес-логики;
- API;
- БД;
- permissions;
- нового модуля;
- background jobs;
- архитектурного изменения.

Можно пропустить для:

- опечатки;
- простой правки текста;
- локальной UI-косметики без business behavior.

---

# Вход

Минимум:

```text
Task text
```

Если есть:

```text
Task ID
```

использовать его обязательно.

---

# Контекстный бюджет

Сначала разрешено читать только:

```text
AGENTS.md
docs/backlog.md — только релевантный Task/Epic
docs/project-structure.md — только module list при необходимости
```

Не читать автоматически:

```text
database.md целиком
architecture.md целиком
security.md целиком
testing.md целиком
```

---

# Карта модулей

Использовать следующую маршрутизацию.

## Identity

Ключевые слова:

```text
login
user
role
permission
context
access
authentication
authorization
```

## Organization

```text
territorial zone
region
department
direction
team
delegation
```

## Sites

```text
site
object
location
building
floor
room
criticality
KVO
```

## Assets

```text
asset
equipment
model
manufacturer
serial
component
replacement
responsibility
lifecycle
```

## Maintenance

```text
maintenance template
TO
ТО
regulation
frequency
schedule
maintenance plan
```

## WorkOrders

```text
work order
job
checklist
executor
completion
acceptance
labor
material usage
```

## Measurements

```text
measurement
voltage
resistance
temperature
norm
range
trend
```

## Defects

```text
defect
fault
observation
recurrence
escalation
```

## Repairs

```text
repair
component replacement
repair result
repair warranty
```

## Inventory

```text
inventory
QR
scan
missing
unknown asset
wrong location
```

## Incidents

```text
incident
P1
P2
P3
P4
service restored
post incident review
```

## Changes

```text
change
technical window
risk
approval
rollback
residual risk
```

## Documents

```text
document
file
photo
passport
manual
S3
attachment
```

## Contractors

```text
contractor
contract
external user
contract scope
```

## Qualifications

```text
qualification
certificate
admission
expiry
exception
```

---

# Алгоритм

## Step 1 — определить Task ID

Если Task ID указан:

```text
найти только соответствующий section в backlog.md
```

Если Task ID нет:

```text
сопоставить task text с module map
```

---

## Step 2 — определить primary module

Выбрать ровно один primary module, если возможно.

Пример:

```text
"закрытие дефекта"
→ Defects
```

---

## Step 3 — secondary modules

Добавлять только если изменение реально пересекает boundary.

Пример:

```text
"дефект создан из WorkOrder"
Primary: Defects
Secondary: WorkOrders
```

Не добавлять `Assets`, если нужен только `assetId` как ссылка и существующий contract уже достаточен.

---

## Step 4 — определить профиль задачи

Выбрать нужные категории:

```text
DOMAIN
DATABASE
API
AUTH
AUDIT
EVENTS
FILES
BACKGROUND
FRONTEND
TESTS
ADR
```

---

## Step 5 — назначить следующий skill

Правила:

### Task ID есть

```text
→ backlog-task-loader
```

### Нужны бизнес-правила модуля

```text
→ module-context
```

### Нужна новая вертикальная реализация

```text
→ vertical-slice-builder
```

### Есть permissions/scope/contractor

```text
→ authorization-matrix
```

---

# ADR gate

Пометить:

```text
ADR_REQUIRED = YES
```

только если задача:

- меняет modular monolith;
- меняет основную DB;
- меняет ID strategy;
- меняет storage strategy;
- меняет messaging;
- меняет identity provider;
- меняет authorization model;
- добавляет фундаментальный infrastructure component.

Иначе:

```text
ADR_REQUIRED = NO
```

---

# Stop conditions

Остановиться после маршрутизации.

Не:

- писать код;
- проектировать migration;
- читать все docs;
- придумывать API;
- разбирать tests подробно.

---

# Выход

Строго компактный формат:

```text
PRIMARY_MODULE: Assets

SECONDARY_MODULES:
- Sites

TASK_PROFILE:
- DOMAIN
- DATABASE
- API
- AUTH
- AUDIT
- TESTS

READ_NEXT:
1. backlog-task-loader
2. module-context: Assets
3. vertical-slice-builder
4. authorization-matrix

DOCS_IF_NEEDED:
- docs/database.md: Assets section
- docs/api-guidelines.md: create resource
- docs/security.md: scope authorization

ADR_REQUIRED: NO

CONTEXT_BUDGET:
~2500 tokens
```

Не добавлять длинные объяснения.

---

# Пример 1

Input:

```text
TASK-03.04.01 — Create Asset
```

Output:

```text
PRIMARY_MODULE: Assets

SECONDARY_MODULES:
- Sites

TASK_PROFILE:
- DOMAIN
- DATABASE
- API
- AUTH
- AUDIT
- EVENTS
- TESTS

READ_NEXT:
1. backlog-task-loader
2. module-context: Assets
3. vertical-slice-builder
4. authorization-matrix

ADR_REQUIRED: NO
```

---

# Пример 2

Input:

```text
"Заменить RabbitMQ на Kafka"
```

Output:

```text
PRIMARY_MODULE: Integrations

SECONDARY_MODULES:
- Workers

TASK_PROFILE:
- BACKGROUND
- EVENTS
- ADR

READ_NEXT:
- ADR-005
- architecture.md messaging section

ADR_REQUIRED: YES
```
