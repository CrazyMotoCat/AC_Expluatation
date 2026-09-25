# Context Capsules

Эта директория содержит короткие AI-контексты доменных модулей.

## Назначение

Capsule используется `skills/module-context/SKILL.md`, чтобы агент не перечитывал большие документы перед каждой задачей.

## Правило

Полные документы остаются Source of Truth.

Capsule — производный компактный индекс.

Если capsule конфликтует с Accepted ADR или полной документацией, действует полная документация.

## Целевой размер

```text
800–2500 tokens
```

Hard limit:

```text
3500 tokens
```

## Обязательные разделы

- PURPOSE
- OWNS
- DB
- INVARIANTS
- LIFECYCLE
- PERMISSIONS
- PUBLIC_CONTRACTS
- EVENTS
- DEPENDS_ON
- FORBIDDEN
- TOP_TEST_RISKS

## Когда обновлять

Обновить capsule, если изменены:

- core entities;
- lifecycle;
- permissions;
- public contracts;
- core domain invariants;
- events;
- module ownership.

Не обновлять после:

- cosmetic UI change;
- refactoring без изменения behavior;
- typo fixes.

## Первые capsules

- `identity.context.md`
- `sites.context.md`
- `assets.context.md`
- `maintenance.context.md`
- `workorders.context.md`

## Рекомендуемый следующий набор

- `measurements.context.md`
- `defects.context.md`
- `contractors.context.md`
- `documents.context.md`
- `inventory.context.md`
- `organization.context.md`
- `incidents.context.md`
- `changes.context.md`


## Extended capsules

Добавлены:

- `defects.context.md` — STABLE
- `inventory.context.md` — STABLE
- `contractors.context.md` — STABLE
- `documents.context.md` — STABLE
- `measurements.context.md` — STABLE
- `incidents.context.md` — PROVISIONAL
- `changes.context.md` — PROVISIONAL

### MATURITY

`STABLE` означает: основные domain rules достаточно зафиксированы для реализации.

`PROVISIONAL` означает: использовать capsule как текущую рабочую модель, но не превращать неоднозначные lifecycle/approval детали в новые жёсткие invariants без проверки полного module context/решения владельца.
