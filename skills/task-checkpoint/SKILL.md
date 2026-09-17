---
name: task-checkpoint
version: 1.0
purpose: Зафиксировать безопасное состояние незавершённой задачи так, чтобы другой сеанс или агент мог продолжить её без скрытого контекста.
recommended_max_context_tokens: 1400
---

# task-checkpoint

## Назначение

`task-checkpoint` сохраняет минимальное, но достаточное состояние незавершённой задачи.

Главный принцип:

> Repository state, а не история чата, является источником истины о незавершённой работе.

Checkpoint нужен:

- после завершённой атомарной фазы;
- перед длинной/рискованной фазой;
- перед остановкой;
- при приближении usage limit;
- перед handoff другому агенту;
- после завершения workstream в multi-agent задаче.

---

# Файл состояния

Основной файл:

```text
.agent/tasks/<TASK-ID>/state.md
```

Для multi-agent:

```text
.agent/tasks/<TASK-ID>/agents/<agent-id>.md
```

---

# Что читать

Минимум:

```text
AGENTS.md
exact task contract
git status
git diff --stat
git diff
git log --oneline -10
current test/check results
```

Не перечитывать все docs.

---

# Safe checkpoint condition

Checkpoint помечается `SAFE`, только если текущая завершённая фаза:

- синтаксически целостна;
- relevant build/check проходит;
- нет известных partially-written files;
- known migrations/config changes находятся в понятном состоянии.

Если это не так:

```text
CHECKPOINT_STATUS: UNSAFE
```

и нужно явно описать, что именно незавершено.

---

# Git rule

Предпочтительно после безопасной фазы иметь commit.

Пример:

```text
checkpoint(TASK-03.04.01): create asset application slice
```

Но skill НЕ обязан создавать commit сам, если политика репозитория запрещает auto-commit.

В state всегда фиксировать:

```text
LAST_SAFE_COMMIT:
<sha | NONE>
```

---

# State contents

Обязательно:

```text
TASK
STATUS
CHECKPOINT_STATUS
PHASE
LAST_SAFE_COMMIT
COMPLETED
VERIFIED
UNCOMMITTED
PENDING
DECISIONS
BLOCKERS
FILES_CHANGED
NEXT_ACTION
DO_NOT_REPEAT
```

---

# COMPLETED

Только фактически завершённое.

Не писать:

```text
"API почти готов"
```

Писать:

```text
- POST route added
- request DTO added
- handler compiles
```

---

# VERIFIED

Только реально выполненные проверки:

```text
- dotnet build PASS
- Assets integration tests PASS
- docker compose config PASS
```

Не писать предположения.

---

# UNCOMMITTED

Кратко описать рабочий diff:

```text
- modified CreateAssetHandler.cs
- new migration not yet committed
```

Если dirty tree содержит unrelated user changes — отметить отдельно и не присваивать их себе.

---

# DECISIONS

Только решения, которые будущему агенту нельзя заново придумывать.

Например:

```text
- use existing assets.create permission
- no new ADR
- AssetCreated is integration event v1
```

---

# DO_NOT_REPEAT

Это экономия токенов и защита от повторной работы.

Примеры:

```text
- migration already generated and validated
- do not redesign CreateAsset DTO
- SeaweedFS already chosen for DEV
```

---

# NEXT_ACTION

Должно быть одно конкретное следующее действие.

Хорошо:

```text
Add wrong-scope authorization test, then run Assets authorization suite.
```

Плохо:

```text
Continue task.
```

---

# Multi-agent checkpoint

Для каждого агента:

```text
AGENT:
ROLE:
STATUS:
WRITE_SCOPE:
SAFE_COMMIT:
OUTPUT:
VERIFIED:
HANDOFF:
OPEN_ISSUES:
```

Статусы:

```text
NOT_STARTED
IN_PROGRESS
COMPLETE
BLOCKED
```

---

# Checkpoint update algorithm

1. Inspect Git.
2. Compare task contract with current phase.
3. Identify completed work.
4. Run minimum relevant checks if not already run.
5. Determine SAFE/UNSAFE.
6. Record last safe commit.
7. Record dirty files.
8. Record decisions/blockers.
9. Set one NEXT_ACTION.
10. Write/update state file.

---

# Usage-limit behavior

Если usage limit близок и это достоверно известно:

- не начинать новую большую фазу;
- завершить текущую атомарную часть;
- выполнить минимальный check;
- обновить checkpoint;
- остановиться.

Если точное состояние лимита неизвестно — просто соблюдать обычную checkpoint discipline.

---

# Forbidden

- использовать chat history как единственный handoff;
- писать в COMPLETED то, что не проверено;
- скрывать dirty tree;
- автоматически делать rollback незнакомых изменений;
- помечать checkpoint SAFE при failing build текущей фазы;
- писать длинный пересказ всей задачи;
- дублировать module docs в state.md.

---

# Output

```text
CHECKPOINT_WRITTEN: YES

TASK:
TASK-XX.YY.ZZ

CHECKPOINT_STATUS:
SAFE | UNSAFE

PHASE:
...

LAST_SAFE_COMMIT:
...

DIRTY_FILES:
...

VERIFIED:
...

NEXT_ACTION:
...

RESUME_FILE:
.agent/tasks/TASK-XX.YY.ZZ/state.md
```

После checkpoint остановиться, если вызов был только для handoff/limit protection.
