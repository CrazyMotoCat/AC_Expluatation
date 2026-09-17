# Changes Context Capsule

SOURCE_VERSION: 2026-09-16
MODULE: Changes
MATURITY: PROVISIONAL

## PURPOSE

Changes управляет планируемыми техническими изменениями и техническими окнами: parent Change, межфункциональные tasks, оценки риска, итоговое решение координатора, остаточный риск, approvals и rollback plan.

Capsule PROVISIONAL: фундаментальные принципы зафиксированы, но точные lifecycle/approval policy будут уточняться на этапе реализации.

## OWNS

- Change
- ChangeWindow
- ChangeTask
- RiskAssessment
- RiskDecision
- ResidualRiskAcceptance
- RollbackPlan
- ChangeApproval

## DB

Основные таблицы:

- `changes.changes`
- `changes.windows`
- `changes.tasks`
- `changes.risk_assessments`
- `changes.risk_decisions`
- `changes.residual_risk_acceptances`
- `changes.rollback_plans`
- `changes.approvals`

## INVARIANTS

- Один parent Change объединяет несколько departmental/tasks.
- У Change один coordinator from initiating direction.
- Affected directions дают независимые expert risk assessments.
- Automatic risk и expert risk хранятся отдельно.
- Final risk не должен просто перезаписывать auto/expert values.
- Coordinator может снизить final risk, но reason и audit обязательны.
- Residual risk acceptance поддерживается отдельно.
- Rollback plan обязателен не всегда, а по policy/risk/site criticality.
- KVO/critical changes требуют более строгого процесса, но конкретные approvals не придумываются без policy.
- Technical window является отдельной сущностью/атрибутом Change.
- Child tasks могут выполняться разными departments/contractors.
- Contractor не получает право на весь Change только из-за одной assigned task.
- Approved decision не должен silently survive существенного изменения critical fields без reapproval.
- Change не должен напрямую выполнять business updates других модулей; он координирует tasks/approvals.
- Compensating measures на первом этапе могут быть contextual hints, не heavy rules engine.

## CHANGE TYPE

Точный справочник может быть уточнён.

Минимально различать:

- routine/standard;
- normal;
- emergency;
- configuration-affecting.

Не hardcode окончательный набор без module review.

## LIFECYCLE

PROVISIONAL вариант:

```text
DRAFT
→ RISK_ASSESSMENT
→ APPROVAL
→ SCHEDULED
→ IN_PROGRESS
→ COMPLETED
→ CLOSED
```

Могут потребоваться:

- CANCELLED
- FAILED
- ROLLED_BACK

Точный lifecycle не фиксировать без отдельной реализации/tests.

## CHANGE TASK

Child task хранит:

- functional direction;
- assigned team/user/contract;
- status;
- planned/actual dates;
- sequence.

Task может соответствовать WorkOrder или отдельному action process через contract.

## RISK MODEL

Минимальные automatic factors:

- Site criticality;
- System/Asset criticality;
- Redundancy;
- Downtime;
- Affected users;
- Business impact;
- Dependencies;
- Change type.

На первом этапе rule set должен быть прозрачным и versionable.

## EXPERT RISK

Каждая affected direction может дать:

- risk level;
- optional numeric score;
- assessment text;
- assessor;
- timestamp.

Оценки не схлопываются в одну строку.

## FINAL RISK DECISION

Хранить:

- auto risk;
- max/summary expert risk;
- final risk;
- decided_by;
- decided_at;
- `is_risk_reduced`;
- reduction_reason.

Если final < auto/expert according to scale:

```text
reduction_reason mandatory
```

## RESIDUAL RISK

Отдельная запись:

- level;
- accepted_by;
- accepted_at;
- reason.

Для критичных изменений acceptance может быть policy-required.

## ROLLBACK

RollbackPlan:

- `is_required`;
- plan text;
- validated_by/at optional.

Low-risk routine change может не требовать rollback.

## COMPENSATING MEASURES

На раннем этапе:

- contextual recommendations;
- non-blocking hints.

Примеры:

- physical guard;
- temporary generator;
- temporary cooling.

Полный rule engine позже.

## PERMISSIONS

Типовые:

- `changes.read`
- `changes.create`
- `changes.manage_tasks`
- `changes.assess_risk`
- `changes.decide_risk`
- `changes.approve`
- `changes.accept_residual_risk`
- `changes.start`
- `changes.complete`
- `changes.cancel`

Separation of duties может применяться к final risk/approval.

## PUBLIC CONTRACTS

Полезные:

- `ChangeReference`
- `ChangeRiskContext`
- `IChangesModule.GetActiveChange(assetId/siteId)`
- `IChangesModule.LinkWorkResult(...)`

## EVENTS

Основные:

- `ChangeCreated`
- `RiskAssessmentAdded`
- `FinalRiskDecided`
- `ResidualRiskAccepted`
- `ChangeApproved`
- `ChangeStarted`
- `ChangeCompleted`
- `ChangeRolledBack`

## DEPENDS_ON

Допустимо:

- Sites.Contracts;
- Assets.Contracts;
- WorkOrders.Contracts;
- Identity;
- Contractors;
- Documents;
- Notifications;
- shared audit/outbox.

## APPROVAL INTEGRITY

Если после approval изменены materially significant fields:

- risk;
- scope;
- affected asset/system;
- timing;
- rollback conditions;

approval может потребовать invalidation/reapproval.

Точный перечень fields уточнить при реализации.

## FORBIDDEN

- хранить только один risk field;
- coordinator lowering risk without reason;
- contractor seeing all Change tasks outside assignment;
- mandatory rollback для любой мелочи;
- отсутствие rollback для critical/KVO, если policy требует;
- heavy BPMN/rules engine на MVP;
- approvals surviving material change без проверки;
- прямой cross-module DB write.

## TOP_TEST_RISKS

- auto HIGH → final MEDIUM without reason;
- multiple direction assessments;
- contractor task scope leakage;
- approval invalidation after material edit;
- KVO stricter policy hook;
- residual risk required but missing;
- rollback requirement calculation;
- concurrent final risk decisions;
- task completion after Change cancelled.
