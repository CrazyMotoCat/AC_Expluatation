# Lifecycle Registry — АС «Эксплуатация»

STATUS: WORKING SOURCE OF TRUTH
SOURCE_VERSION: 2026-09-19

## 1. Назначение

Этот файл фиксирует lifecycle/state machines бизнес-сущностей.

Он является source of truth для:

- допустимых статусов;
- переходов;
- actor restrictions;
- preconditions;
- side effects.

Нельзя менять status простым PATCH без выполнения перехода use case.

---

# 2. Territorial Zone

## States

```text
ACTIVE
INACTIVE
```

## Core transitions

```text
ACTIVE → INACTIVE
INACTIVE → ACTIVE
```

## Rules

- Creation starts in `ACTIVE`.
- Deactivation is the removal semantics; hard delete is forbidden.
- `code` is immutable after creation; `name` is mutable.
- Activate/deactivate commands use optimistic concurrency and preserve business history through the durable Audit obligation.

---

# 3. Asset

## States

```text
PLANNED
INSTALLED
COMMISSIONED
IN_OPERATION
RESERVE
REPAIR
DECOMMISSIONED
DISPOSED
```

`WAREHOUSE` может быть добавлен позднее при развитии складского контура.

## Core transitions

```text
PLANNED → INSTALLED
INSTALLED → COMMISSIONED
COMMISSIONED → IN_OPERATION
IN_OPERATION ↔ RESERVE
IN_OPERATION → REPAIR
REPAIR → IN_OPERATION
REPAIR → DECOMMISSIONED
IN_OPERATION → DECOMMISSIONED
RESERVE → DECOMMISSIONED
DECOMMISSIONED → DISPOSED
```

## Rules

- `DECOMMISSIONED` и `DISPOSED` не удаляют историю.
- Возврат из `DECOMMISSIONED` запрещён без отдельного correction process.
- Replacement старого актива не удаляет старый Asset.
- Technical condition хранится отдельно от lifecycle status.

---

# 3. Maintenance Template Version

## States

```text
DRAFT
REVIEW
APPROVED
ARCHIVED
```

## Transitions

```text
DRAFT → REVIEW
REVIEW → DRAFT
REVIEW → APPROVED
APPROVED → ARCHIVED
```

## Rules

- `APPROVED` immutable.
- Изменение утверждённого регламента = новая version.
- Нельзя `APPROVED → DRAFT`.

---

# 4. Asset Maintenance Plan

## States

```text
ACTIVE
PAUSED
CLOSED
```

## Transitions

```text
ACTIVE ↔ PAUSED
ACTIVE → CLOSED
PAUSED → CLOSED
```

## Rules

- `CLOSED` terminal.
- Due-date recalculation не является status transition.
- Любое изменение due date сохраняется в recalculation history.

---

# 5. WorkOrder

## States

```text
DRAFT
PLANNED
ASSIGNED
IN_PROGRESS
COMPLETED
COMPLETED_WITH_REMARKS
ACCEPTED
REJECTED
CANCELLED
```

## Core transitions

```text
DRAFT → PLANNED
PLANNED → ASSIGNED
ASSIGNED → IN_PROGRESS
IN_PROGRESS → COMPLETED
IN_PROGRESS → COMPLETED_WITH_REMARKS
COMPLETED → ACCEPTED
COMPLETED_WITH_REMARKS → ACCEPTED
COMPLETED → REJECTED
COMPLETED_WITH_REMARKS → REJECTED
REJECTED → IN_PROGRESS
DRAFT/PLANNED/ASSIGNED → CANCELLED
```

## Preconditions

### Start

- executor authorized;
- assignment valid;
- contractor contract valid if applicable;
- required qualifications valid.

### Complete

- required checklist rules satisfied;
- CRITICAL required step cannot be silently skipped;
- final technical condition proposed;
- evidence requirements satisfied.

### Accept

- customer-side reviewer if policy requires;
- optimistic concurrency passes;
- no forbidden self-approval.

## Side effects

`ACCEPTED` may publish:

```text
WorkOrderAccepted
```

Consumers may:

- recalculate Maintenance;
- update defect observations/results;
- generate notifications.

---

# 6. Defect

## States

```text
OPEN
ASSIGNED
IN_PROGRESS
RESOLVED
CLOSED
```

## Core transitions

```text
OPEN → ASSIGNED
OPEN → IN_PROGRESS
ASSIGNED → IN_PROGRESS
IN_PROGRESS → RESOLVED
RESOLVED → IN_PROGRESS
RESOLVED → CLOSED
```

## Rules

- CLOSED defect не reopen автоматически.
- Повтор после CLOSED = new Defect + recurrence link.
- Повтор открытого defect = Observation.
- `RESOLVED` означает техническое устранение, `CLOSED` — подтверждённое завершение.

---

# 7. Draft Asset from Inventory

## States

```text
DRAFT
SUBMITTED
APPROVED
REJECTED
```

## Transitions

```text
DRAFT → SUBMITTED
SUBMITTED → APPROVED
SUBMITTED → REJECTED
REJECTED → DRAFT
```

## Side effect

`APPROVED`:

```text
create official Asset
link Inventory source
generate/prepare QR
```

---

# 8. Inventory Session

## States

```text
DRAFT
PREPARED
IN_PROGRESS
SCAN_COMPLETED
REPORT_GENERATED
APPROVED
CANCELLED
```

## Core transitions

```text
DRAFT → PREPARED
PREPARED → IN_PROGRESS
IN_PROGRESS → SCAN_COMPLETED
SCAN_COMPLETED → REPORT_GENERATED
REPORT_GENERATED → APPROVED
DRAFT/PREPARED → CANCELLED
```

## Rules

- expected snapshot фиксируется до/при переходе в `IN_PROGRESS`;
- после старта expected snapshot immutable;
- APPROVED report immutable/versioned;
- Missing не меняет lifecycle Asset автоматически.

---

# 9. Identity Local User

## States

```text
ACTIVE
INACTIVE
```

## Core transitions

```text
ACTIVE ↔ INACTIVE
```

## Rules

- safe provisioning создаёт `ACTIVE` profile только из validated identity и trusted canonical `user_type`;
- `INACTIVE` profile не получает operational access даже при валидном OIDC token;
- token attribute synchronization не изменяет `UserStatus`;
- admin activation/deactivation use case, permission and audit реализуются отдельными Identity tasks.

## Access assignment state

`identity.access_assignments.is_active` создаётся `true` и может перейти только в `false` при отзыве. Отзыв сохраняет запись, `revoked_at` / `revoked_by` и увеличивает `row_version`; повторный отзыв идемпотентен. Истечение `valid_to` само по себе не меняет `is_active`, но немедленно прекращает eligibility. Для `DELEGATION` `valid_to` обязателен. Управление выдачей/отзывом через API и полноценный audit относятся к последующим Identity tasks.

## Working context availability

`identity.user_contexts.is_active` создаётся `true` и может стать `false`; повторная деактивация идемпотентна, переход защищён optimistic `row_version`. Интервал `[valid_from, valid_to)` проверяется на момент request, expiry не является отдельным status. Только owned, active и currently valid context доступен для self-service выбора. Для `DELEGATION` конечный `valid_to` обязателен. Административный lifecycle выдачи/отзыва contexts не входит в `TASK-01.03.02`; выбор не меняет `is_active` и не создаёт permission grant.

---

# 10. Contractor User Verification

## States

```text
PENDING_VERIFICATION
ACTIVE
SUSPENDED
REJECTED
```

## Core transitions

```text
PENDING_VERIFICATION → ACTIVE
PENDING_VERIFICATION → REJECTED
ACTIVE ↔ SUSPENDED
```

## Rules

- `ACTIVE` membership не заменяет contract assignment.
- Expired contract/assignment блокирует operational access независимо от membership state.

---

# 11. Contract

## States

```text
DRAFT
ACTIVE
SUSPENDED
EXPIRED
CLOSED
```

## Core transitions

```text
DRAFT → ACTIVE
ACTIVE ↔ SUSPENDED
ACTIVE/SUSPENDED → EXPIRED
ACTIVE/SUSPENDED → CLOSED
```

## Rules

- expiry может определяться датой без scheduler;
- `EXPIRED` не даёт operational rights;
- history scopes/assignments сохраняется.

---

# 12. Document Version

## States

```text
DRAFT
VERIFIED
CURRENT
ARCHIVED
REJECTED
```

Допускается упрощение реализации, если `VERIFIED/CURRENT` представлены flags.

## Rules

- текущая approved version не перезаписывается;
- новая версия создаёт новый immutable object/version row;
- physical object не меняется in-place.

---

# 13. Measurement

Measurement не имеет сложного lifecycle.

Evaluation status:

```text
NORMAL
WARNING
OUT_OF_RANGE
CRITICAL
UNKNOWN
```

Это classification, не lifecycle state.

Correction выполняется controlled operation, а не silent overwrite.

---

# 14. Provisional — Incident

MATURITY: PROVISIONAL

Candidate states:

```text
OPEN
INVESTIGATING
SERVICE_RESTORED
RESOLVED
REVIEW
CLOSED
```

Устойчивые правила:

- `actual_started_at`, `detected_at`, `service_restored_at`, `technical_resolved_at`, `closed_at` независимы;
- P1/P2 нельзя финально закрыть без review.

До реализации не считать candidate state list окончательным.

---

# 15. Provisional — Change

MATURITY: PROVISIONAL

Candidate states:

```text
DRAFT
RISK_ASSESSMENT
APPROVAL
SCHEDULED
IN_PROGRESS
COMPLETED
CLOSED
CANCELLED
ROLLED_BACK
```

Устойчивые правила:

- automatic/expert/final risk разделены;
- снижение final risk требует reason + audit;
- material edit после approval может требовать reapproval.

До реализации lifecycle не считать окончательным.

---

# 16. Правила изменения lifecycle

Любое изменение:

1. обновляет этот registry;
2. обновляет module doc;
3. обновляет context capsule;
4. обновляет tests;
5. проверяет DB status values;
6. проверяет API commands;
7. при фундаментальном изменении проходит ADR review.

---

# 17. Запрещено

- `PATCH {"status":"..."}` для сложного перехода;
- UI-only lifecycle validation;
- terminal state без business history;
- смешивать lifecycle status и technical condition;
- вводить новый status только ради одного экрана без domain need.
