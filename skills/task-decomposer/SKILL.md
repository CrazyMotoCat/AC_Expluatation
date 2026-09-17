---
name: task-decomposer
version: 1.0
purpose: Решить, выгодно ли распараллеливать backlog-задачу между агентами, и построить безопасный граф работ без конфликтов файлов и ответственности.
recommended_max_context_tokens: 1800
---

# task-decomposer

## Назначение

Используется после `task-router` и `backlog-task-loader`, но до реализации. Определяет, стоит ли использовать несколько агентов, какие workstreams независимы, кто какими файлами владеет, зависимости, merge order и необходимость независимого review.

## Главный принцип

Параллелить нужно независимые зоны ответственности, а не просто разные куски одного файла.

Главное правило:

```text
ONE FILE → ONE WRITING AGENT PER PARALLEL PHASE
```

Если два агента должны менять один файл — объединить workstream, выполнить последовательно или назначить одному write ownership, второму read/review only.

## Когда PARALLELIZABLE: YES

- 2+ независимых workstreams с небольшим общим контрактом;
- implementation и независимый authorization/test stream;
- backend и frontend после фиксации API contract;
- implementation и ADR/docs без общего write surface;
- большой объём независимой проверки;
- полезен отдельный read-only reviewer.

## Когда PARALLELIZABLE: NO

- задача маленькая;
- всё сосредоточено в 1–3 тесно связанных файлах;
- доменная модель/API contract ещё нестабильны;
- агенты будут ждать решений друг друга;
- merge cost выше выигрыша;
- один центральный файл нужен всем.

## Максимум по умолчанию

```text
2–4 writing agents + 0–1 review agent
```

## Вход

- Task Contract;
- Primary/Secondary Modules;
- Task Profile;
- при необходимости git status и структура файлов.

## Минимальный контекст

Читать только:

```text
AGENTS.md
exact backlog task
primary module capsule
secondary capsule only if needed
relevant project-structure section
```

Registry — только по task profile. Не читать все global docs.

## Workstream roles

```text
DOMAIN_APPLICATION
DATABASE
API
AUTHORIZATION
FRONTEND
TESTS
DOCUMENTATION
INFRASTRUCTURE
SECURITY_REVIEW
ARCHITECTURE_REVIEW
READ_ONLY_REVIEW
```

## File ownership

Для каждого агента задать:

```text
WRITE_ALLOW
READ_ALLOW
DO_NOT_TOUCH
```

Shared file имеет ровно одного OWNER, остальные READ_ONLY.

## Dependency graph

Всегда строить DAG, например:

```text
A → B
A → C
B,C → REVIEW
```

Циклические зависимости запрещены.

## Contract-first

Если workstream зависит от контракта другого, сначала зафиксировать минимальный контракт: DTO/event/command/result. Только затем параллелить consumers.

## Database rule

Migration имеет одного владельца. Не отделять migration от постоянно меняющейся модели.

## API/frontend rule

Frontend можно параллелить после фиксации route/request/response/error codes/permission expectations.

## Authorization rule

Authorization stream может стартовать после фиксации permission code, target scope и use-case contract. Использовать `authorization-matrix`.

## Test rule

Test agent не придумывает requirements. Он проверяет Task AC, BR-*, lifecycle, permissions, negative cases, concurrency/idempotency. При неоднозначности вернуть `REQUIREMENT_GAP`.

## Documentation rule

`documentation-sync` выполняется одним финальным владельцем после merge. Registry-файлы также имеют одного writer на task.

## Risk

`HIGH` если затронуты security, contractor isolation, migration existing data, KVO, lifecycle, destructive action, cross-module event, concurrency, offline sync. HIGH обычно требует независимый review.

## Output

```text
PARALLELIZABLE: YES | NO

REASON:
...

RISK:
LOW | MEDIUM | HIGH

AGENTS:
- ID: A
  ROLE:
  GOAL:
  WRITE_ALLOW:
  READ_ALLOW:
  DO_NOT_TOUCH:
  INPUTS:
  OUTPUTS:

DEPENDENCIES:
A -> B
...

SHARED_FILES:
- path:
  OWNER:
  OTHERS: READ_ONLY

PHASES:
1. ...

MERGE_ORDER:
1. ...

FINAL_REVIEW_REQUIRED:
YES | NO

DOCUMENTATION_OWNER:
...

CONTEXT_BUDGET:
...
```

Если распараллеливать невыгодно, явно вернуть `PARALLELIZABLE: NO` и `RECOMMENDED_MODE`.

## Stop condition

После decomposition остановиться. Не реализовывать задачу, если вызван только `task-decomposer`.
