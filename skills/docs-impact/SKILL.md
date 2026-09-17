---
name: docs-impact
version: 1.0
purpose: По изменению кода или task plan определить минимальный набор документации, который потенциально требует обновления.
recommended_max_context_tokens: 1000
---

# docs-impact

## Назначение

`docs-impact` — дешёвый pre-check перед полноценным обновлением документации.

Он отвечает только на вопрос:

> Какие документы могут стать устаревшими из-за этого изменения?

Skill НЕ переписывает документы.

Он маршрутизирует изменение в `documentation-sync`.

---

# Когда использовать

Использовать:

- перед завершением любого feature/bugfix;
- после изменения DB/API/security/business rules;
- после нового module contract/event;
- после ADR-level решения;
- после изменения deployment/dev environment;
- после изменения backlog scope.

Можно пропустить только для:

- typo;
- formatting;
- comments без изменения смысла;
- internal refactor без observable behavior.

---

# Вход

Один из вариантов:

```text
git diff / list of changed files
```

или:

```text
implementation plan
```

или:

```text
Task ID + краткое описание изменений
```

---

# Контекстный бюджет

Разрешено читать:

```text
AGENTS.md
docs/project-structure.md — только map документации
changed files
related module context capsule
```

Не читать все docs.

---

# Карта изменений → документация

## Business rule / invariant

Обновить или проверить:

```text
docs/concept.md
docs/modules/<module>.md
docs/context/<module>.context.md
docs/backlog.md
```

`concept.md` менять только если правило системного уровня, а не локальная деталь реализации.

---

## Entity / table / relationship / index

Проверить:

```text
docs/database.md
docs/modules/<module>.md
docs/context/<module>.context.md
```

---

## API contract / route / DTO / error code

Проверить:

```text
docs/api-guidelines.md — только если меняется общий API стандарт
docs/modules/<module>.md
OpenAPI generated/current spec
docs/context/<module>.context.md — если меняется public contract
```

Не редактировать `api-guidelines.md` из-за каждого нового endpoint.

---

## Permission / scope / authorization

Проверить:

```text
docs/security.md — если меняется security model
docs/modules/<module>.md
docs/context/<module>.context.md
permission registry / seed docs
```

---

## Lifecycle / status

Проверить:

```text
docs/modules/<module>.md
docs/context/<module>.context.md
docs/database.md
docs/backlog.md
```

Если изменение фундаментальное — ADR check.

---

## Cross-module contract / event

Проверить:

```text
docs/architecture.md — если меняется pattern
docs/modules/<source>.md
docs/modules/<target>.md
docs/context/<source>.context.md
docs/context/<target>.context.md
```

---

## New infrastructure / architectural pattern

Проверить:

```text
docs/architecture.md
docs/deployment.md
docs/dev-environment.md
docs/security.md
docs/testing.md
docs/adr/*
AGENTS.md
```

ADR обычно обязателен.

---

## Testing strategy

Проверить:

```text
docs/testing.md
```

только если меняется общий testing standard.

Новый test case сам по себе не требует изменения `testing.md`.

---

## Deployment/runtime

Проверить:

```text
docs/deployment.md
docs/dev-environment.md
README.md
runbooks/*
```

---

## Repository structure

Проверить:

```text
docs/project-structure.md
AGENTS.md
README.md
```

---

## Backlog / scope

Проверить:

```text
docs/backlog.md
docs/roadmap.md
```

`roadmap.md` только если меняется этап/стратегическая последовательность.

---

# Алгоритм

1. Классифицировать diff.
2. Определить primary module.
3. Отметить только документы, которым изменение реально меняет смысл.
4. Не обновлять global docs ради локальной реализации.
5. Передать список в `documentation-sync`.

---

# Выход

```text
DOCS_IMPACT: YES

PRIMARY_MODULE:
Assets

REQUIRED:
- docs/modules/assets.md
- docs/context/assets.context.md

CHECK:
- docs/database.md
- docs/backlog.md

NO_CHANGE_EXPECTED:
- docs/architecture.md
- docs/security.md
- docs/deployment.md

ADR_CHECK:
NO

REASON:
Added asset replacement lifecycle field and new business event.
```

или:

```text
DOCS_IMPACT: NO

REASON:
Internal refactor only; no contract, behavior, schema or architecture change.
```

---

# Правило минимальности

Нельзя отвечать:

```text
"обновить всю документацию"
```

без конкретной причины.

Цель skill — уменьшить контекст, а не увеличить его.

---

# Stop condition

После определения impact остановиться.

Обновление выполняет `documentation-sync`.
