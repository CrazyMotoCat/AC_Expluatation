---
name: task-resume
version: 1.0
purpose: Безопасно восстановить незавершённую задачу после нового сеанса, лимита, перезапуска или handoff на основании Git и task state.
recommended_max_context_tokens: 1800
---

# task-resume

## Назначение

`task-resume` восстанавливает фактическое состояние незавершённой задачи.

Главный принцип:

> Не доверять памяти чата. Сначала сверить state file с Git и текущим рабочим деревом.

---

# Вход

```text
TASK-ID
```

Пример:

```text
task-resume TASK-03.04.01
```

---

# Читать сначала

```text
AGENTS.md
.agent/tasks/<TASK-ID>/state.md
git status
git log --oneline -10
git diff --stat
git diff
```

Затем:

```text
primary module context capsule
exact task contract
```

Дополнительные docs — только если NEXT_ACTION требует их.

---

# Step 1 — validate task state

Проверить:

- state file существует;
- TASK ID совпадает;
- LAST_SAFE_COMMIT существует в Git, если указан;
- файлы из UNCOMMITTED соответствуют реальному diff;
- completed work действительно присутствует;
- нет новых неожиданных изменений.

---

# Step 2 — classify repository state

Статус:

```text
CLEAN_AT_SAFE_COMMIT
DIRTY_EXPECTED
DIRTY_UNEXPECTED
DIVERGED
PARTIALLY_WRITTEN
```

## CLEAN_AT_SAFE_COMMIT

Можно продолжать по NEXT_ACTION.

## DIRTY_EXPECTED

Diff совпадает с checkpoint.

Можно продолжать после минимальной проверки.

## DIRTY_UNEXPECTED

Есть неизвестные изменения.

Не удалять и не откатывать их.

Сначала определить ownership.

## DIVERGED

Git history ушла дальше checkpoint или branch изменён.

Нужно построить новое фактическое состояние.

## PARTIALLY_WRITTEN

Есть признаки оборванной генерации:

- синтаксически неполный файл;
- unresolved merge markers;
- truncated JSON/YAML/XML;
- migration partially generated.

Сначала repair current state, затем продолжать.

---

# Step 3 — verify before editing

Перед новым изменением выполнить минимальную проверку текущей фазы.

Например:

```text
dotnet build
targeted tests
docker compose config
```

Не обязательно запускать полный regression suite до каждого resume.

---

# Step 4 — rebuild context cheaply

Использовать:

```text
state.md
+
module capsule
+
exact task
+
relevant registry only
```

Не загружать всю архитектурную документацию.

---

# Step 5 — determine resume safety

```text
RESUME_SAFE: YES
```

если:

- state и Git согласованы;
- нет неизвестного destructive diff;
- NEXT_ACTION понятен;
- minimum check не показывает corrupted state.

Иначе:

```text
RESUME_SAFE: NO
```

с причиной.

---

# Step 6 — continue only from factual state

Не повторять работу из `COMPLETED`.

Не менять решения из `DECISIONS`, если не обнаружен конфликт с source of truth.

Не выполнять пункты из `DO_NOT_REPEAT`.

Начать с `NEXT_ACTION`.

---

# Multi-agent resume

Прочитать:

```text
.agent/tasks/<TASK-ID>/agents/*.md
```

Построить состояние DAG:

```text
A COMPLETE
B COMPLETE
C IN_PROGRESS
D BLOCKED_BY_C
```

Повторно запускать только незавершённые/invalidated workstreams.

Не перезапускать COMPLETE agent без причины.

---

# If agent state conflicts with merged Git

Git является фактическим источником истины.

Но:

- не считать незнакомый diff своим;
- не удалять изменения;
- пометить `STATE_DRIFT`;
- обновить checkpoint после reconciliation.

---

# Special recovery cases

## Migration interruption

Проверить:

- migration file;
- model snapshot;
- database migration history;
- whether migration was applied.

Не предполагать состояние БД.

## Docker interruption

Проверить:

```text
docker compose ps
```

Работать от фактического состояния containers/volumes.

## File generation interruption

Проверить синтаксис/compile только затронутого участка.

Исправить partial file, не откатывая всю задачу.

## Documentation interruption

Сравнить affected docs с implementation diff и повторно запустить docs-impact/documentation-sync позже.

---

# Output

```text
RESUME_SAFE: YES | NO

TASK:
TASK-XX.YY.ZZ

REPOSITORY_STATE:
DIRTY_EXPECTED

LAST_SAFE_COMMIT:
...

COMPLETED:
...

UNCOMMITTED:
...

STATE_DRIFT:
NONE

MINIMUM_CHECK:
PASS

READ_NEXT:
- ...

NEXT_ACTION:
...

DO_NOT_REPEAT:
- ...
```

---

# After successful resume

Работа продолжается обычным workflow.

После следующей завершённой фазы снова вызвать:

```text
task-checkpoint
```

---

# Forbidden

- `git reset --hard` автоматически;
- удалять unknown files;
- повторять всю задачу с нуля;
- доверять state.md без проверки Git;
- доверять Git diff без понимания ownership;
- восстанавливать архитектурные решения из памяти чата;
- продолжать при `RESUME_SAFE: NO` без reconciliation.

---

# Stop condition

Если skill был вызван только для диагностики resume:

выдать resume plan и остановиться.

Если агенту явно поручено продолжить задачу:

после `RESUME_SAFE: YES` начать с NEXT_ACTION.
