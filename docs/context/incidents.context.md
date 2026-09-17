# Incidents Context Capsule

SOURCE_VERSION: 2026-09-16
MODULE: Incidents
MATURITY: PROVISIONAL

## PURPOSE

Incidents описывает значимые эксплуатационные события с отдельным lifecycle, severity P1–P4, timeline, affected assets, восстановлением сервиса, техническим устранением и обязательным review для тяжёлых уровней.

Capsule PROVISIONAL: основные принципы устойчивы, но конкретные lifecycle/approval детали ещё могут уточняться при реализации.

## OWNS

- Incident
- IncidentSeverityLevel
- IncidentAffectedAsset
- IncidentTimelineEvent
- IncidentParticipant
- IncidentReview

## DB

Основные таблицы:

- `incidents.severity_levels`
- `incidents.incidents`
- `incidents.affected_assets`
- `incidents.timeline`
- `incidents.participants`
- `incidents.reviews`

## INVARIANTS

- Incident является отдельной сущностью, не разновидностью Defect.
- Severity: P1/P2/P3/P4.
- Actual start time и detection time — разные timestamps.
- Service restored и technical resolved — разные timestamps.
- Closure происходит отдельно от восстановления сервиса.
- P1/P2 требуют post-incident review.
- P3/P4 могут закрываться после resolution без обязательного formal review.
- Business impact на первом этапе хранится как text + severity, не финансовая модель.
- Один Incident может затрагивать несколько Assets.
- Timeline является append-oriented business history.
- Participant roles/history должны сохраняться.
- Root cause resolution time не подменяет service restoration.
- Incident не должен автоматически закрывать Defect или Change.
- Corrective/preventive actions архитектурно предусмотрены позже, но не обязательны MVP.
- Audit критичных incident actions обязателен.

## SEVERITY

Минимум:

- P1
- P2
- P3
- P4

Severity level может иметь:

- rank;
- `requires_review`.

Не добавлять отдельную `Accident` сущность — используется один Incident type/model.

## TIMESTAMPS

Минимум:

- `actual_started_at` optional;
- `detected_at`;
- `service_restored_at` optional;
- `technical_resolved_at` optional;
- `closed_at` optional.

## LIFECYCLE

PROVISIONAL вариант:

```text
OPEN
→ INVESTIGATING
→ SERVICE_RESTORED
→ RESOLVED
→ REVIEW
→ CLOSED
```

Реализация может упростить статусы, сохранив независимые timestamps.

Не hardcode этот список без module review.

## REVIEW

P1/P2 review должен содержать минимум:

- summary;
- what happened;
- actions taken;
- what worked;
- what failed;
- lessons learned;
- reviewer;
- reviewed_at.

Approval review может уточняться позже.

## PERMISSIONS

Типовые:

- `incidents.read`
- `incidents.create`
- `incidents.update`
- `incidents.manage_timeline`
- `incidents.restore_service`
- `incidents.resolve`
- `incidents.review`
- `incidents.close`

Scope минимум:

- site;
- functional direction;
- working context.

## PUBLIC CONTRACTS

Полезные:

- `IncidentReference`
- `IncidentImpactReference`
- `IIncidentsModule.CreateIncident(...)`
- `IIncidentsModule.GetActiveIncidents(siteId)`

## EVENTS

Основные:

- `IncidentCreated`
- `IncidentSeverityChanged`
- `IncidentServiceRestored`
- `IncidentTechnicalResolved`
- `IncidentReviewCompleted`
- `IncidentClosed`

## DEPENDS_ON

Допустимо:

- Sites.Contracts;
- Assets.Contracts;
- Documents;
- Identity authorization;
- Notifications;
- Changes contracts optional.

## TIMELINE

Timeline хранит:

- event_time;
- event_type;
- description;
- recorded_by;
- recorded_at.

Timeline не должна редактироваться как один общий текстовый блок.

## BUSINESS IMPACT

MVP:

```text
impact_description
+
severity
```

Не строить количественную модель потерь без отдельного решения.

## P1/P2 RULE

Final close должен проверять наличие review.

Это одно из устойчивых правил несмотря на PROVISIONAL lifecycle.

## FORBIDDEN

- смешивать Incident и Defect;
- использовать только один `resolved_at` для всех этапов;
- закрывать P1/P2 без review;
- создавать отдельную Accident entity без нового решения;
- перезаписывать timeline;
- строить сложную financial impact model в MVP;
- автоматически считать service restored = root cause fixed.

## TOP_TEST_RISKS

- P1/P2 close without review;
- service restored before technical resolved;
- actual start before detection;
- multiple affected assets;
- wrong site scope;
- timeline ordering;
- concurrent severity/timeline updates;
- closed incident mutation.
