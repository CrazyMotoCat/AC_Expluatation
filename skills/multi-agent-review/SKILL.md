---
name: multi-agent-review
version: 1.0
purpose: Независимо проверить объединённый результат нескольких агентов на полноту, конфликты, архитектурные нарушения, regression и рассинхронизацию документации.
recommended_max_context_tokens: 2400
---

# multi-agent-review

## Назначение

Запускается после объединения workstreams, но до финального `DONE`. Проверяет целостный merged result, а не отчёты отдельных агентов.

## Режим

По умолчанию `READ_ONLY`. Сначала findings, затем targeted fixes владельцами. Автоисправления допустимы только для trivial formatting/typos при явном разрешении.

## Когда обязателен

- multi-agent implementation;
- HIGH-risk task;
- authorization/security;
- cross-module event;
- lifecycle change;
- DB migration;
- contractor access;
- concurrency/idempotency;
- infrastructure change;
- task с ADR.

## Вход

- original Task Contract;
- decomposition output;
- merged diff;
- tests/checks;
- agent completion reports;
- relevant capsules/registries.

Отчёт агента — не доказательство. Проверять merged state.

## Review dimensions

### 1. Scope
Проверить Acceptance Criteria, scope creep и premature future work.

### 2. Merge integrity
Искать duplicate DTO/classes/migrations/registrations, competing permissions/events, merge markers, conflicting conventions.

### 3. Architecture
- modular monolith preserved;
- no cross-module DB writes;
- no `ModuleA -> ModuleB.Infrastructure`;
- Shared not dumping ground;
- Domain no EF/HTTP/Rabbit/Redis;
- public contracts respected.

### 4. Business rules
Для каждого применимого `BR-*`:

```text
COVERED | PARTIAL | MISSING | CONFLICT
```

### 5. Lifecycle
Переход есть в registry, валидируется use case, terminal states защищены, side effects выполнены, arbitrary PATCH status отсутствует.

### 6. Authorization
Проверить permission + scope + working context + validity + contractor restrictions + separation of duties и negative paths.

### 7. Database
Schema ownership, constraints, indexes, nullability, migration order/safety, PostgreSQL-specific tests.

### 8. API
Semantics, DTO, errors, idempotency, concurrency, HTTP status, no EF/domain leakage, OpenAPI impact.

### 9. Events/Outbox
Canonical event name, correct publisher, outbox where required, retry/idempotency, minimal payload, version.

### 10. Tests
Map:

```text
Acceptance Criterion → test
BR-* → test
permission negative case → test
lifecycle invalid transition → test
concurrency/idempotency → test if applicable
```

### 11. Security
Secrets, IDOR, auth bypass, contractor leakage, upload/injection/logging/export/audit.

### 12. Documentation
Проверить `docs-impact`, `documentation-sync`, module doc, capsule, registries, database/OpenAPI/ADR index.

### 13. Agent boundary violations
Сравнить фактический diff с `WRITE_ALLOW`, shared ownership и decomposition.

## Severity

```text
BLOCKER
HIGH
MEDIUM
LOW
NOTE
```

BLOCKER: нельзя завершать task. HIGH: не рекомендуется merge/release до исправления.

## Output

```text
MULTI_AGENT_REVIEW: PASS | FAIL
TASK:
RISK:

SCOPE: PASS | FAIL
ARCHITECTURE: PASS | FAIL
BUSINESS_RULES:
- BR-...: COVERED
AUTHORIZATION: PASS | FAIL | NOT_APPLICABLE
DATABASE: PASS | FAIL | NOT_APPLICABLE
API: PASS | FAIL | NOT_APPLICABLE
EVENTS: PASS | FAIL | NOT_APPLICABLE
TESTS: PASS | FAIL
SECURITY: PASS | FAIL
DOCUMENTATION: PASS | FAIL
AGENT_BOUNDARIES: PASS | FAIL

FINDINGS:
1. [BLOCKER] ...

FIX_OWNERS:
- Finding 1 → Agent A

RETEST_REQUIRED:
- ...

FINAL_DECISION:
READY_TO_COMPLETE | FIX_REQUIRED
```

## PASS condition

Нет unresolved BLOCKER/HIGH, Acceptance Criteria покрыты, required tests pass, architecture/security intact, documentation synchronized.

## Fix cycle

```text
FAIL → targeted fixes → required tests → re-run review
```

Не запускать повторную разработку целиком.

## Token economy

Читать Task Contract, Decomposition, merged diff, relevant capsule/registries, test output. Не перечитывать весь repository.

## Stop condition

Не начинать следующую backlog task. После PASS задача может пройти completion/documentation gate.
