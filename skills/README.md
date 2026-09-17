# Skills для AI-агентов АС «Эксплуатация»

Этот каталог содержит специализированные skills для Codex и других AI-агентов.

Цель skills:

- уменьшить объём загружаемого контекста;
- давать агенту только релевантные документы;
- заставлять его переиспользовать существующие паттерны;
- сохранять архитектурные границы;
- сокращать повторное чтение больших `.md`;
- делать задачи воспроизводимыми.

## Структура

```text
skills/
├── README.md
├── task-router/
│   └── SKILL.md
├── module-context/
│   └── SKILL.md
├── backlog-task-loader/
│   └── SKILL.md
├── vertical-slice-builder/
│   └── SKILL.md
└── authorization-matrix/
    └── SKILL.md
```

## Рекомендуемый конвейер

Для обычной задачи:

```text
1. task-router
2. backlog-task-loader
3. module-context
4. vertical-slice-builder
5. authorization-matrix
```

Не все skills должны запускаться всегда.

Пример:

```text
Задача:
"Реализуй TASK-03.04.01"

backlog-task-loader
→ получает acceptance criteria

task-router
→ определяет Assets

module-context
→ подаёт компактный контекст Assets

vertical-slice-builder
→ формирует план файлов/слоёв/tests

authorization-matrix
→ добавляет security cases
```

## Главный принцип экономии токенов

Skill не должен читать документ полностью, если нужное решение уже можно получить из:

1. Task ID;
2. module context capsule;
3. существующего аналогичного use case;
4. Accepted ADR;
5. конкретного раздела документа.

Полные документы используются как fallback, а не как default.

## Источники истины

Приоритет:

```text
1. Явное текущее решение владельца проекта
2. Accepted ADR
3. concept.md
4. architecture.md
5. database.md / api-guidelines.md / security.md
6. coding-standards.md / project-structure.md / testing.md
7. backlog.md
8. существующий код
```

## Контекстные капсулы

Рекомендуется создать:

```text
docs/context/
├── identity.context.md
├── sites.context.md
├── assets.context.md
├── maintenance.context.md
├── workorders.context.md
├── defects.context.md
└── ...
```

Одна капсула должна быть ориентировочно:

```text
800–2500 tokens
```

и содержать только:

- module purpose;
- entities;
- invariants;
- public contracts;
- permissions;
- owned tables;
- events;
- lifecycle;
- dependencies;
- top pitfalls.

Полные документы остаются source of truth.

## Формат skill

Каждый `SKILL.md` имеет:

- назначение;
- когда применять;
- вход;
- ограничение контекста;
- алгоритм;
- stop-conditions;
- формат выхода;
- примеры.

## Важно

Skills не заменяют `AGENTS.md`.

`AGENTS.md` задаёт глобальные правила поведения.

Skills дают короткие специализированные рабочие процедуры.


## Traceability gate

Для значимых задач перед documentation sync:

```text
implementation/tests
→ multi-agent-review (if applicable)
→ traceability-checker
→ docs-impact
→ documentation-sync
```

`traceability-checker` проверяет:

```text
Task
→ Acceptance Criteria
→ BR-*
→ Permission
→ Lifecycle
→ Event
→ Persistence/API
→ Tests
→ Docs
```

Не каждый элемент обязателен для каждой задачи. Неприменимые элементы помечаются `N/A`.

# Resumability Skills Pack

Содержит:

- `task-checkpoint` — сохраняет безопасный checkpoint незавершённой задачи;
- `task-resume` — восстанавливает задачу после нового сеанса/лимита/handoff;
- шаблоны task/agent state;
- addendum для `AGENTS.md`.

Рекомендуемый flow:

```text
task start
→ implementation phase
→ checks
→ task-checkpoint
→ next phase
```

После обрыва:

```text
task-resume TASK-ID
→ reconcile Git/state
→ minimum check
→ continue NEXT_ACTION
```

Главный принцип:

```text
Repository state > chat memory
```
