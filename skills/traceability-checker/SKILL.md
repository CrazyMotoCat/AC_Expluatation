---
name: traceability-checker
version: 1.0
purpose: Проверить полноту трассируемости задачи от backlog и business rules до permission, lifecycle, events, tests и документации перед переводом задачи в DONE.
recommended_max_context_tokens: 2200
---

# traceability-checker

## Назначение

`traceability-checker` — финальный quality gate перед завершением существенной backlog-задачи.

Он отвечает на вопрос:

> Каждое требование задачи действительно доведено до реализации, проверки и актуальной документации?

Основная цепочка:

```text
TASK
→ Acceptance Criteria
→ Business Rules (BR-*)
→ Permission / Scope
→ Lifecycle Transition
→ Event / Side Effect
→ Persistence / API
→ Tests
→ Documentation
```

Не каждая задача обязана использовать все элементы цепочки.
Если элемент неприменим — использовать `N/A`, а не создавать искусственный permission/event/status.

## Когда использовать

Обязательно перед `DONE`, если задача затрагивает:

- бизнес-логику;
- permissions/scope;
- lifecycle;
- database schema;
- API contract;
- integration/domain events;
- contractor access;
- audit/history;
- concurrency/idempotency;
- cross-module interaction;
- ADR;
- multi-agent implementation.

Можно пропустить для typo, formatting и чистого internal refactor без behavior change.

## Место в workflow

Single-agent:

```text
task-router
→ backlog-task-loader
→ module-context
→ implementation
→ tests
→ traceability-checker
→ docs-impact
→ documentation-sync
→ DONE
```

Multi-agent:

```text
task-decomposer
→ parallel work
→ merge
→ multi-agent-review
→ traceability-checker
→ docs-impact
→ documentation-sync
→ DONE
```

Если `documentation-sync` меняет requirement-bearing документы, допускается короткий повторный traceability check.

## Источники

Использовать только релевантные источники:

```text
exact backlog task
docs/business-rules-registry.md
docs/permissions-registry.md
docs/lifecycle-registry.md
docs/events-registry.md
docs/reference-data-registry.md
docs/modules/<module>.md
docs/context/<module>.context.md
merged diff
test results
OpenAPI / migrations when applicable
```

Не читать весь repository.

## 1. TASK TRACE

Получить:

```text
TASK_ID
TITLE
GOAL
ACCEPTANCE_CRITERIA
OUT_OF_SCOPE
```

Каждый Acceptance Criterion получает временный ID:

```text
AC-01
AC-02
AC-03
```

Если backlog уже имеет IDs — использовать их.

## 2. BUSINESS RULE TRACE

Для каждого AC определить применимые `BR-*`.

Пример:

```text
AC-02
→ BR-AST-002
→ BR-AST-003
```

Если реализация вводит новое бизнес-правило, которого нет в registry:

```text
RULE_GAP
```

Не придумывать BR ID молча.
Если существующий BR больше не соответствует решению:

```text
RULE_CONFLICT
```

## 3. PERMISSION TRACE

Для каждого write/sensitive action определить:

- permission code;
- required scope;
- working context;
- validity;
- contractor restrictions.

Пример:

```text
Create Asset
→ assets.create
→ site + asset_type scope
→ INTERNAL / CONTRACT*
```

Если permission не требуется: `N/A`.
Если код использует permission, отсутствующий в registry: `PERMISSION_GAP`.

## 4. LIFECYCLE TRACE

Если задача меняет состояние сущности, проверить:

- source state;
- target state;
- transition зарегистрирован;
- preconditions;
- side effects;
- invalid transition test.

Если код разрешает переход, которого нет в lifecycle registry:

```text
LIFECYCLE_CONFLICT
```

## 5. EVENT TRACE

Для каждого значимого side effect определить:

- нужен ли event;
- canonical event name;
- publisher;
- consumers;
- outbox requirement;
- idempotency requirement.

Не требовать event для каждого CRUD change.
Если side effect cross-module и event потеря недопустима: `OUTBOX_REQUIRED`.

## 6. DATA TRACE

Если задача меняет persistence, проверить связь:

```text
Business requirement
→ Entity/field
→ DB table/column
→ constraint/index
→ migration
→ integration test
```

Если schema change отсутствует в migration: `MIGRATION_GAP`.

## 7. API TRACE

Если задача предоставляет API:

```text
Use Case
→ Route
→ Request DTO
→ Response DTO
→ Error codes
→ Permission
→ Tests
```

Проверить:

- OpenAPI актуален;
- lifecycle action не реализован generic status PATCH;
- error codes стабильны;
- EF/domain entity не выходит наружу.

## 8. TEST TRACE

Для каждого Acceptance Criterion должен существовать минимум один meaningful verification.

Классификация:

```text
UNIT
INTEGRATION
AUTHORIZATION
NEGATIVE
CONCURRENCY
IDEMPOTENCY
MIGRATION
E2E
```

Не требовать каждый тип для каждой задачи. Но если риск применим — test должен существовать либо быть явно обоснован как `NOT_REQUIRED`.

## 9. BUSINESS RULE TEST TRACE

Каждый применимый `BR-*` должен иметь:

```text
COVERED_BY_TEST
COVERED_BY_EXISTING_TEST
DOCUMENTATION_ONLY
```

Если BR влияет на runtime behavior и не тестируется: `BR_TEST_GAP`.

## 10. AUTHORIZATION NEGATIVE TRACE

Для sensitive/write operations проверить минимум:

```text
allowed actor
no permission
wrong scope
wrong context
expired validity
wrong contract (if contractor applicable)
```

## 11. SIDE EFFECT TRACE

Проверить эффекты, которые легко забываются:

- audit;
- business history;
- outbox;
- notification;
- recalculation;
- cache invalidation;
- read-model update.

Не добавлять их автоматически; сопоставлять с documented behavior.

## 12. DOCUMENTATION TRACE

Проверить, какие источники истины затронуты:

```text
module doc
context capsule
business-rules registry
permissions registry
lifecycle registry
events registry
reference-data registry
database.md
OpenAPI
ADR
backlog
```

Если изменение документа требуется: `DOC_UPDATE_REQUIRED`.
Actual update выполняет `documentation-sync`.

## 13. Traceability matrix row

Минимальная строка:

```text
TASK
AC
BR
PERMISSION
LIFECYCLE
EVENT
IMPLEMENTATION
TESTS
DOCS
STATUS
```

Пример:

```text
TASK-03.04.01
AC-02
BR-AST-002
assets.create
N/A
AssetCreated
CreateAssetHandler
CreateAsset_LocationFromAnotherSite_ReturnsError
assets.md + assets.context.md
COVERED
```

## 14. Status values

```text
COVERED
PARTIAL
MISSING
CONFLICT
N/A
```

## 15. Findings severity

### BLOCKER

- Acceptance Criterion MISSING;
- required BR not implemented;
- permission bypass;
- lifecycle conflict;
- required migration missing;
- critical side effect missing;
- required integration test failing.

### HIGH

- runtime BR without test;
- contractor negative path missing;
- outbox missing where event loss corrupts consistency;
- documentation contradicts implementation.

### MEDIUM

- incomplete docs impact;
- weak test trace;
- missing non-critical negative test.

### LOW

- trace clarity;
- optional E2E enhancement.

## 16. Output

```text
TRACEABILITY_CHECK: PASS | FAIL

TASK:
TASK-XX.YY.ZZ

ACCEPTANCE_CRITERIA:
- AC-01: COVERED
- AC-02: COVERED
- AC-03: MISSING

BUSINESS_RULES:
- BR-...: COVERED

PERMISSIONS:
- assets.create: COVERED

LIFECYCLE:
N/A

EVENTS:
- AssetCreated: COVERED

DATA:
- migration: COVERED
- constraints: COVERED

API:
- POST /api/v1/assets: COVERED

TESTS:
- AC-01 → ...
- BR-AST-002 → ...
- authorization wrong scope → ...

DOCUMENTATION:
- docs/modules/assets.md: UPDATE_REQUIRED
- docs/context/assets.context.md: UPDATE_REQUIRED

FINDINGS:
1. [BLOCKER] AC-03 has no implementation/test.

FINAL_DECISION:
READY_FOR_DOCUMENTATION_SYNC | FIX_REQUIRED
```

## 17. PASS condition

PASS только если:

- все Acceptance Criteria COVERED;
- все runtime BR covered;
- permissions/lifecycle/events согласованы с registries;
- mandatory tests проходят;
- нет unresolved BLOCKER/HIGH;
- documentation impact определён.

`PASS` означает `READY_FOR_DOCUMENTATION_SYNC`, а не завершённую синхронизацию docs.

## 18. Matrix persistence policy

Не обязательно добавлять каждую task в вечный giant matrix.

Рекомендуется:

- хранить persistent trace для significant business tasks;
- infrastructure/bootstrap task может ограничиваться финальным checker report;
- milestone/release traceability агрегировать отдельно.

Persistent matrix:

```text
docs/traceability-matrix.md
```

обновляет только один documentation owner.

## 19. Запрещено

- считать green suite доказательством покрытия AC;
- создавать fake events/permissions ради заполнения matrix;
- считать N/A без причины;
- придумывать BR вместо registry;
- менять requirements в test agent;
- ставить PASS при unresolved HIGH/BLOCKER;
- дублировать всю business documentation в matrix.

## Stop condition

После traceability report:

- FAIL → targeted fixes;
- PASS → `docs-impact` / `documentation-sync`.

Не начинать следующую backlog task.
