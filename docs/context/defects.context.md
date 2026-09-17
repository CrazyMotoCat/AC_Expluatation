# Defects Context Capsule

SOURCE_VERSION: 2026-09-16
MODULE: Defects
MATURITY: STABLE

## PURPOSE

Модуль Defects отвечает за фиксацию неисправностей, повторные наблюдения, рецидивы после закрытия, эскалацию затянувшихся проблем и связь дефектов с работами, измерениями и последующим ремонтом.

## OWNS

- Defect
- DefectType
- DefectObservation
- DefectStatusHistory
- DefectRecurrenceLink
- escalation state/rules for unresolved defects

## DB

Основные таблицы:

- `defects.defect_types`
- `defects.defects`
- `defects.observations`
- `defects.status_history`
- `defects.recurrence_links`

## INVARIANTS

- Defect всегда относится к Site и Asset.
- Component Asset optional, но используется для различения дефектов разных компонентов.
- Один и тот же unresolved defect не должен дублироваться новой карточкой без причины.
- Повторное обнаружение открытого дефекта должно оформляться observation.
- Если закрытый defect появляется снова, создаётся новый defect и recurrence link на предыдущий.
- Закрытый defect не должен автоматически reopen без инженерной оценки.
- Один symptom на разных компонентах может означать разные defects.
- Источник дефекта должен сохраняться: WorkOrder, Inventory, Incident, manual.
- Severity и lifecycle status — разные характеристики.
- Defect aging должен измеряться от first_detected_at.
- Если один и тот же unresolved condition сохраняется дольше одного maintenance cycle, система должна поддерживать escalation.
- Закрытие defect не удаляет observations/history.
- Root cause на первом этапе может быть минимальным текстовым полем; полноценный RCA позже.
- Business history и audit должны сохраняться отдельно.
- Defect не должен напрямую менять Asset status через чужую schema.

## EXAMPLE IDENTITY RULE

```text
Battery #27 high internal resistance
≠
Battery #40 high internal resistance
```

Но:

```text
Battery #27 high resistance observed again next TO
```

обычно является observation того же открытого defect.

## LIFECYCLE

Точный status set может уточняться, но базово нужен путь:

```text
OPEN
→ ASSIGNED
→ IN_PROGRESS
→ RESOLVED
→ CLOSED
```

Допустимы дополнительные состояния типа `REJECTED/DUPLICATE`, если они будут явно утверждены.

Не добавлять новые статусы без lifecycle review.

## SEVERITY

Должна быть независима от status.

Severity может учитывать:

- влияние на функцию;
- критичность объекта;
- безопасность;
- необходимость срочного ремонта.

Точная шкала должна быть отдельным справочником/enum по принятому решению.

## PERMISSIONS

Типовые:

- `defects.read`
- `defects.create`
- `defects.assign`
- `defects.update`
- `defects.resolve`
- `defects.close`
- `defects.review_recurrence`

Scope минимум:

- site;
- asset;
- functional direction;
- working context;
- contract for contractor.

## PUBLIC CONTRACTS

Полезные:

- `DefectReference`
- `DefectSummary`
- `IDefectsModule.CreateDefect(...)`
- `IDefectsModule.AddObservation(...)`
- `IDefectsModule.GetOpenDefects(assetId)`

Другие модули не должны писать напрямую в `defects.*`.

## EVENTS

Основные:

- `DefectCreated`
- `DefectObserved`
- `DefectAssigned`
- `DefectResolved`
- `DefectClosed`
- `DefectRecurrenceLinked`
- `DefectEscalated`

## DEPENDS_ON

Допустимо:

- Assets.Contracts;
- WorkOrders.Contracts/Application;
- Measurements contracts;
- Documents contracts;
- Identity authorization abstractions;
- shared audit/outbox/correlation.

## CREATED_FROM_WORKORDER

При обнаружении во время WorkOrder:

- сохранить `source_type = WORK_ORDER`;
- сохранить `source_id`;
- при возможности связь со step;
- привязать relevant measurement/photo;
- проверить, нет ли уже открытого дефекта того же компонента/условия.

## OBSERVATION

Observation должна хранить:

- defect;
- observed_at;
- observed_by;
- source;
- description;
- optional measurement link.

Observation не меняет автоматически root defect identity.

## RECURRENCE

Если previous defect CLOSED и проявление снова возникло:

```text
new defect
+
recurrence_link(previous → current)
+
review_status
```

Ответственный инженер оценивает, является ли это системной проблемой.

## ESCALATION

Если open defect пережил один или несколько maintenance cycles:

- зафиксировать новый observation;
- повысить visibility;
- потребовать причину отсутствия устранения;
- при необходимости уведомить ответственного/руководителя.

Не закрывать автоматически.

## REPAIR LINK

Ремонт принадлежит модулю Repairs.

Defects хранит связь/результат через contract/event, но не реализует repair workflow у себя.

## AUDIT / HISTORY

Критичные действия:

- severity change;
- assignment;
- resolve;
- close;
- recurrence decision;
- escalation override.

Должны иметь audit.

## FORBIDDEN

- reopen старого CLOSED defect автоматически;
- создавать новый duplicate при каждом ТО для уже открытой проблемы;
- считать symptom string единственным ключом идентичности;
- физически удалять defect history;
- Defects напрямую UPDATE `assets.assets`;
- хранить recurrence только текстовым комментарием;
- закрывать defect без фиксированного результата/основания.

## TOP_TEST_RISKS

- duplicate open defect creation;
- same symptom on different component;
- recurrence after close;
- unresolved defect survives maintenance cycle;
- wrong site/contractor scope;
- close without permission;
- recurrence review missing;
- history lost after status change;
- concurrent close/update.
