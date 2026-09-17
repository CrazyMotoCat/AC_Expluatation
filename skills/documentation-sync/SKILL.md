---
name: documentation-sync
version: 1.0
purpose: Поддерживать документацию АС «Эксплуатация» синхронной с кодом, миграциями, API, ADR и backlog после каждого существенного изменения.
recommended_max_context_tokens: 3200
---

# documentation-sync

## Назначение

`documentation-sync` — обязательный завершающий skill для существенных изменений проекта.

Его задача:

> После изменения кода убедиться, что документация описывает текущее состояние системы, а не первоначальный замысел.

Skill должен:

- определить затронутые документы;
- обновить их минимально и точно;
- обновить context capsules;
- обновить ADR index при необходимости;
- обнаружить противоречия;
- не дублировать один и тот же факт в десятках файлов;
- не переписывать документы без причины.

---

# Когда использовать

Обязательно после изменений:

- business rules;
- entities;
- DB schema;
- API;
- permissions;
- lifecycle/status;
- module contracts;
- domain/integration events;
- architecture;
- deployment;
- security model;
- testing standards;
- backlog acceptance criteria;
- project structure.

Можно пропустить при:

- typo;
- formatting;
- comments;
- internal refactor без observable behavior;
- test refactor без изменения requirements.

---

# Предварительный skill

Перед ним рекомендуется:

```text
docs-impact
```

Если `DOCS_IMPACT: NO` — documentation-sync можно завершить сразу.

---

# Source of Truth hierarchy

При конфликте использовать:

```text
1. Явное текущее решение владельца проекта
2. Accepted ADR
3. Фактически реализованный и протестированный business behavior
4. concept.md
5. architecture.md
6. database.md / api-guidelines.md / security.md
7. module docs
8. context capsules
9. backlog.md
```

ВАЖНО:

Фактический код не имеет права самовольно отменять Accepted ADR.

Если код конфликтует с ADR:

```text
DOC_CONFLICT
```

а не переписывать ADR под код молча.

---

# Основное правило

Документация делится на уровни.

## Level A — stable system intent

```text
concept.md
architecture.md
security.md
coding-standards.md
testing.md
deployment.md
project-structure.md
Accepted ADR
```

Менять редко.

---

## Level B — detailed technical truth

```text
database.md
api/module contracts
docs/modules/*.md
```

Менять при соответствующей реализации.

---

## Level C — execution planning

```text
backlog.md
roadmap.md
```

Backlog меняется часто.

Roadmap — только при стратегическом изменении.

---

## Level D — AI cache / derived context

```text
docs/context/*.context.md
```

Всегда производный слой.

Capsule никогда не является source of truth.

---

# Required documentation map

## Global docs

```text
docs/concept.md
docs/roadmap.md
docs/architecture.md
docs/coding-standards.md
docs/database.md
docs/api-guidelines.md
docs/security.md
docs/testing.md
docs/deployment.md
docs/dev-environment.md
docs/project-structure.md
docs/backlog.md
```

## Module docs

```text
docs/modules/<module>.md
```

## AI capsules

```text
docs/context/<module>.context.md
```

## Decisions

```text
docs/adr/*.md
docs/adr/README.md
```

---

# Step 1 — получить change summary

Из diff/task result извлечь только фактические изменения.

Пример:

```text
- added POST /assets/{id}/decommission
- added lifecycle transition IN_OPERATION → DECOMMISSIONED
- added decommissioned_at
- added AssetDecommissioned event
- added assets.decommission permission
```

Не использовать планы того, что "хотели сделать", если это не реализовано.

---

# Step 2 — классифицировать изменение

Категории:

```text
BUSINESS_RULE
ENTITY
DATABASE
API
PERMISSION
LIFECYCLE
EVENT
CONTRACT
ARCHITECTURE
SECURITY_MODEL
DEPLOYMENT
TEST_STANDARD
BACKLOG
REPOSITORY_STRUCTURE
```

---

# Step 3 — определить affected docs

Использовать результат `docs-impact`.

Не открывать остальные документы без причины.

---

# Step 4 — проверить существующий текст

Для каждого affected document:

1. Найти существующий раздел.
2. Проверить, является ли изменение:
   - добавлением;
   - уточнением;
   - заменой;
   - устареванием.
3. Изменить минимальный участок.

Не append'ить новую секцию, если правильнее исправить старую.

---

# Step 5 — устранить противоречия

Искать:

- старый status;
- старое имя endpoint;
- старую таблицу;
- старый permission;
- старый lifecycle;
- старый architectural choice.

Если найдено противоречие:

```text
заменить/пометить deprecated
```

а не оставить обе версии как будто они актуальны.

---

# Step 6 — module docs

Если `docs/modules/<module>.md` существует:

обновить соответствующие разделы:

```text
Purpose
Entities
Invariants
Lifecycle
Permissions
API
Events
Dependencies
Tables
```

Если module уже существенный, но module doc отсутствует:

```text
DOC_GAP: MODULE_DOC_MISSING
```

Можно создать его, если задача включает documentation maintenance.

---

# Step 7 — context capsule

После изменения module-level истины обновить:

```text
docs/context/<module>.context.md
```

Обязательно обновить capsule при изменении:

- owned entities;
- core DB tables;
- invariants;
- lifecycle;
- permissions;
- public contracts;
- events;
- dependencies;
- top test risks.

Не обновлять capsule для cosmetic/internal implementation details.

---

# Step 8 — SOURCE_VERSION

Каждая capsule должна иметь:

```text
SOURCE_VERSION: <git SHA>
```

предпочтительно.

Если Git SHA недоступен:

```text
SOURCE_VERSION: YYYY-MM-DD
```

При обновлении capsule обновить SOURCE_VERSION.

---

# Step 9 — ADR consistency

Если есть новый ADR:

1. Добавить файл.
2. Обновить `docs/adr/README.md`.
3. Если новый ADR supersedes старый:
   - старый ADR → `Superseded`;
   - указать ссылку на новый ADR.
4. Обновить связанные global docs.

Нельзя переписывать исторический Accepted ADR так, будто старого решения никогда не существовало, если решение реально было заменено.

---

# Step 10 — backlog sync

Если task реализован:

не обязательно автоматически ставить `DONE`, если backlog является product-management source и статус ведётся отдельно.

Но:

- acceptance criteria должны соответствовать фактическому behavior;
- устаревшие будущие требования необходимо исправить;
- если implementation осознанно отличается — зафиксировать решение.

---

# Step 11 — database sync

Если есть migration/schema change:

проверить `database.md` на:

- table;
- column;
- type;
- nullability;
- FK;
- lifecycle;
- index;
- ownership.

Не вставлять каждый EF internal detail.

Документировать бизнес-значимую схему.

---

# Step 12 — API sync

Новый endpoint обычно НЕ требует изменения глобального `api-guidelines.md`.

Он требует:

```text
OpenAPI
module docs
```

`api-guidelines.md` меняется только при изменении общего стандарта.

---

# Step 13 — security sync

Новый permission обычно обновляет:

```text
module docs
context capsule
permission catalog/seed
```

`security.md` меняется только при изменении модели безопасности/общего правила.

---

# Step 14 — test docs sync

Добавленный test обычно не меняет `testing.md`.

`testing.md` менять, если появился новый обязательный класс тестирования или изменена общая стратегия.

---

# Step 15 — README / onboarding

Проверить README/dev docs только если изменение влияет на:

- setup;
- dependencies;
- commands;
- environment variables;
- local infra;
- run/deploy workflow.

---

# Step 16 — documentation freshness report

После обновления выдать компактный отчёт.

Формат:

```text
DOCUMENTATION_SYNC: PASS

UPDATED:
- docs/database.md
- docs/modules/assets.md
- docs/context/assets.context.md

CHECKED_NO_CHANGE:
- docs/architecture.md
- docs/security.md

ADR:
NO

CONFLICTS:
NONE

CAPSULE_REFRESHED:
assets.context.md @ <sha>

DOC_GAPS:
NONE
```

---

# Если есть конфликт

Формат:

```text
DOCUMENTATION_SYNC: BLOCKED

CONFLICT:
ADR-007 says contractor authorization requires contract scope,
but current implementation grants access by user_type only.

DO_NOT_UPDATE_DOCS_TO_MATCH_CODE.

REQUIRED_ACTION:
Fix implementation or explicitly replace ADR via new decision.
```

---

# Documentation gate

Задача не считается полностью завершённой, если:

```text
DOCS_IMPACT: YES
```

и:

```text
DOCUMENTATION_SYNC != PASS
```

Это правило рекомендуется включить в `AGENTS.md` и PR checklist.

---

# Token economy

Основные правила:

1. Сначала `docs-impact`.
2. Читать только affected documents.
3. Использовать exact heading search.
4. Не перечитывать global docs полностью.
5. Module capsule обновлять последней — как derived summary.
6. Не цитировать/копировать длинные sections между документами.
7. Ссылаться на Source of Truth вместо дублирования деталей.

---

# Avoid documentation duplication

Пример:

Не надо одновременно подробно описывать 30 полей `assets.assets` в:

```text
architecture.md
database.md
modules/assets.md
context/assets.context.md
```

Правильно:

### database.md
полная техническая модель.

### modules/assets.md
только business-relevant data.

### context capsule
короткий список core fields/invariants.

### architecture.md
только architectural ownership/pattern.

---

# Detect stale capsule

Capsule считается подозрительно устаревшей, если:

- изменён module public contract после SOURCE_VERSION;
- изменена migration после SOURCE_VERSION;
- изменён lifecycle;
- изменён permission;
- изменён module doc.

Тогда:

```text
CAPSULE_STALE: YES
```

и она должна быть регенерирована.

---

# Optional documentation manifest

Рекомендуется вести:

```text
docs/documentation-map.md
```

Содержит:

```text
document
owner
source_of_truth_for
derived_from
update_triggers
```

Это позволяет агенту быстро определять impact без чтения файлов.

---

# CI integration idea

Позднее можно добавить lightweight check:

```text
if files changed under:
Modules/Assets/
and public/schema files changed
but docs/context/assets.context.md unchanged
→ warning
```

Hard fail вводить осторожно, чтобы не создавать ложные блокировки.

---

# PR checklist integration

Добавить:

```text
[ ] docs-impact выполнен
[ ] documentation-sync PASS
[ ] module capsule актуальна
[ ] ADR index обновлён, если нужен ADR
[ ] OpenAPI актуален
```

---

# What not to do

Запрещено:

- обновлять docs под buggy code;
- менять Accepted ADR молча;
- копировать одну и ту же схему во все документы;
- обновлять все docs после каждой мелкой задачи;
- оставлять старый endpoint/status рядом с новым без отметки deprecated;
- делать capsule source of truth;
- ставить новую дату/SOURCE_VERSION без фактической проверки содержимого;
- заявлять `PASS`, не проверив affected docs.

---

# Example 1 — Create Asset

Изменение:

```text
new create endpoint
new permission
new event
existing DB schema already supports fields
```

Ожидаемо:

```text
UPDATED:
- docs/modules/assets.md
- docs/context/assets.context.md
- OpenAPI

CHECK:
- docs/backlog.md

NO CHANGE:
- architecture.md
- database.md
- security.md
```

---

# Example 2 — Add asset warranty table

Ожидаемо:

```text
UPDATED:
- docs/database.md
- docs/modules/assets.md
- docs/context/assets.context.md

CHECK:
- backlog.md

ADR:
NO
```

---

# Example 3 — Replace RabbitMQ with Kafka

Ожидаемо:

```text
DOCUMENTATION_SYNC: BLOCKED UNTIL ADR

AFFECTED:
- architecture.md
- deployment.md
- dev-environment.md
- testing.md
- security.md
- ADR-005
- AGENTS.md
- module integration docs
```

Нельзя просто отредактировать `ADR-005` как будто RabbitMQ никогда не выбирался.

---

# Final principle

> Документация должна описывать текущую согласованную систему, а не быть архивом случайных первоначальных идей.

При этом:

> История архитектурных решений сохраняется через ADR, а не путём оставления противоречащих друг другу актуальных инструкций.
