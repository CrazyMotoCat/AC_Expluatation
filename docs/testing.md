# АС «Эксплуатация» — Testing Strategy

## 1. Назначение документа

Этот документ определяет стратегию тестирования АС «Эксплуатация».

Он обязателен для:

- разработчиков;
- Codex и AI-агентов;
- code review;
- CI/CD;
- QA;
- будущей команды сопровождения.

Документ применяется совместно с:

- `concept.md`;
- `roadmap.md`;
- `architecture.md`;
- `coding-standards.md`;
- `database.md`;
- `api-guidelines.md`;
- `security.md`.

---

# 2. Главный принцип

> Тестировать нужно не количество строк кода, а бизнес-риски системы.

Наибольший приоритет:

- права доступа;
- contractor isolation;
- история;
- lifecycle;
- ТО;
- дефекты;
- инвентаризация;
- изменения;
- инциденты;
- concurrency;
- миграции;
- offline/idempotency.

---

# 3. Пирамида тестирования

```text
E2E                мало, критические процессы
Integration        много
Unit               много
Static checks      всегда
```

Не строить проект только на E2E.

---

# 4. Категории тестов

Обязательные:

- unit;
- domain;
- integration;
- database;
- authorization;
- API contract;
- E2E;
- migration;
- concurrency;
- idempotency;
- performance;
- security;
- smoke.

Позднее:

- chaos;
- resilience;
- offline sync;
- penetration.

---

# 5. Unit tests

Тестируют чистую бизнес-логику без инфраструктуры.

Примеры:

- допустимость перехода статуса;
- вычисление следующего ТО;
- выбор frequency rule;
- evaluation измерения;
- risk calculation;
- warranty active;
- qualification validity.

---

# 6. Domain tests

Каждый aggregate должен иметь tests инвариантов.

Пример Asset:

```text
cannot decommission twice
cannot commission without required state
replacement keeps history
```

---

# 7. Maintenance tests

Критические сценарии:

```text
NORMAL + TO2 → 6 months
KVO2 + TO2 → 3 months
KVO1 + TO2 → 1 month
```

---

# 8. Maintenance hierarchy tests

Проверить:

```text
TO3 includes TO2/TO1
```

но lower-level cycle закрывается только если выполнен полный обязательный объём.

---

# 9. Unplanned maintenance tests

Сценарий:

```text
Unplanned work overlaps 80% of TO2
→ next TO2 must NOT reset
```

Если:

```text
full required scope confirmed
→ next due recalculated
```

---

# 10. Measurement tests

Проверить:

- normal range;
- warning;
- out of range;
- critical;
- unit correctness;
- null values;
- decimal precision.

---

# 11. Defect tests

Проверить:

- new defect;
- repeated observation;
- recurrence after closed defect;
- escalation after multiple maintenance cycles;
- component distinction.

---

# 12. Example defect distinction

```text
Battery #27 high resistance
≠
Battery #40 high resistance
```

---

# 13. Incident tests

Проверить:

- P1/P2 requires review;
- P3/P4 can close without review;
- timestamps independent;
- service restoration before final close allowed;
- technical resolution stored separately.

---

# 14. Change tests

Проверить:

- multi-direction expert risk;
- auto risk separate;
- final risk can differ;
- manual risk reduction requires reason;
- residual risk acceptance;
- rollback plan required only by policy.

---

# 15. Inventory tests

Проверить:

- found;
- wrong location;
- unknown asset;
- missing asset;
- parallel participants;
- final report;
- no auto decommission.

---

# 16. Contractor tests

Обязательные сценарии:

```text
contractor sees assigned object
contractor cannot see other region
contractor cannot see expired contract
contractor can have multiple organizations
context switch changes scope
```

---

# 17. Qualification tests

Проверить:

- valid qualification;
- expired qualification;
- required qualification missing;
- emergency exception;
- exception expiry;
- approval audit.

---

# 18. Unit test style

Формат:

```text
Given_When_Then
```

или:

```text
Method_State_Expected
```

Выбрать один стиль на проект.

---

# 19. Unit test isolation

Unit test:

- не использует PostgreSQL;
- не использует RabbitMQ;
- не использует S3;
- не вызывает network.

---

# 20. Integration tests

Использовать реальные infrastructure components в containers.

Минимум:

- PostgreSQL;
- при необходимости Redis;
- RabbitMQ для messaging tests;
- S3-compatible storage для file flow.

---

# 21. Testcontainers

Рекомендуется Testcontainers для .NET.

---

# 22. PostgreSQL integration

Не использовать SQLite как замену PostgreSQL для критичных persistence tests.

Причины:

- типы;
- constraints;
- JSONB;
- indexes;
- concurrency;
- SQL semantics.

---

# 23. Integration test DB lifecycle

Каждый test suite должен получать чистое предсказуемое состояние.

Варианты:

- transaction rollback;
- schema reset;
- Respawn;
- disposable DB container.

---

# 24. Repository tests

Проверяют:

- mapping;
- constraints;
- filters;
- persistence;
- optimistic concurrency.

---

# 25. API integration tests

Поднимать реальное ASP.NET Core test host.

Проверять:

- HTTP status;
- JSON contract;
- auth;
- validation;
- DB side effects;
- audit;
- outbox.

---

# 26. Authorization tests

Это отдельная обязательная категория.

Для каждого sensitive endpoint минимум:

```text
allowed → 2xx
no permission → 403
wrong scope → 403
wrong context → 403
expired contract → 403
```

---

# 27. IDOR tests

Получить ID чужого объекта и попробовать:

- GET;
- PATCH;
- command;
- document download.

Ожидается deny.

---

# 28. Document authorization tests

Проверить:

- model manual broad access;
- asset document scoped;
- critical document restricted;
- contractor visibility;
- signed URL only after authorization.

---

# 29. Audit tests

После критичного действия проверить:

- event exists;
- user correct;
- context correct;
- entity correct;
- before/after where required;
- correlation id.

---

# 30. Outbox tests

Команда:

```text
business data
+
outbox message
```

должна фиксироваться атомарно.

При rollback нет ни business change, ни outbox.

---

# 31. Idempotency tests

Повтор:

```text
same idempotency key + same payload
```

не создаёт дубликат.

---

# 32. Idempotency conflict

```text
same key + different payload
```

→ 409.

---

# 33. Concurrency tests

Сценарий:

```text
User A loads version 5
User B loads version 5
A saves → version 6
B saves → conflict
```

B не должен silently overwrite A.

---

# 34. WorkOrder concurrency

Особенно проверить:

- two executors complete;
- reviewer accepts while executor edits;
- duplicate completion retry.

---

# 35. Migration tests

CI должен проверять:

```text
empty DB → latest migration
```

и желательно:

```text
previous release DB → latest
```

---

# 36. Migration data preservation

Для risky migration создать fixture с историческими данными и проверить, что они сохранены.

---

# 37. Expand/contract tests

При breaking DB evolution проверить совместимость во время rollout.

---

# 38. Seed tests

System seed:

- permissions;
- roles;
- technical lookups.

Не должен дублироваться при повторном запуске.

---

# 39. API contract tests

Проверять OpenAPI.

Breaking changes должны выявляться автоматически.

---

# 40. Snapshot tests

Допускаются для:

- OpenAPI;
- report layout metadata;
- complex read models.

Не злоупотреблять snapshot tests для бизнес-логики.

---

# 41. Frontend unit tests

Тестировать:

- complex components;
- form validation;
- permission rendering;
- state transitions;
- offline queue logic.

---

# 42. Frontend integration tests

Проверять страницу с mocked API server или test backend.

---

# 43. Frontend E2E

Рекомендуется Playwright.

---

# 44. Critical E2E: asset

```text
Login
→ open site
→ add asset
→ assign location
→ add document
→ see timeline
```

---

# 45. Critical E2E: maintenance

```text
Create plan
→ scheduler generates work order
→ contractor opens work
→ fills checklist
→ adds measurement/photo
→ completes
→ customer reviews
→ accepts
→ next maintenance recalculated
```

---

# 46. Critical E2E: defect

```text
TO detects defect
→ defect created
→ repair
→ verification
→ close
→ history preserved
```

---

# 47. Critical E2E: recurrence

```text
defect closed
→ same manifestation later
→ new case
→ linked as recurrence
→ engineer review
```

---

# 48. Critical E2E: inventory

```text
start inventory
→ scan assets
→ wrong location
→ unknown asset
→ missing asset
→ finish
→ report
→ approve
```

---

# 49. Critical E2E: contractor isolation

```text
Contractor A
→ can see Contract A
→ cannot see Contract B
```

---

# 50. Critical E2E: expired contract

```text
contract active → access works
advance time beyond valid_to
→ access denied
```

---

# 51. Critical E2E: P1 incident

```text
create P1
→ add timeline
→ restore service
→ resolve cause
→ review
→ close
```

---

# 52. Critical E2E: KVO change

```text
create change
→ expert risk IT
→ expert risk exploitation
→ auto risk
→ coordinator final decision
→ residual risk
→ approvals
→ window
→ tasks
→ complete
```

---

# 53. Test clock

Использовать `IClock`.

Не использовать реальное текущее время в domain tests.

---

# 54. Time-dependent tests

Проверять:

- expired contract;
- expired qualification;
- due maintenance;
- warranty expiry;
- delegation expiry.

---

# 55. Property-based tests

Полезны для:

- schedule calculation;
- date ranges;
- measurement limits;
- hierarchy rules.

Не обязательны для всего проекта.

---

# 56. Performance tests

Проводить до промышленного rollout.

---

# 57. API performance targets

Ориентиры:

```text
common API p95 < 500 ms
asset search < 1 sec
card load < 2 sec
```

---

# 58. Performance datasets

Тестовый масштаб:

```text
5 000 sites
500 000+ assets
10 000 users
millions of work orders
tens of millions measurements
```

Не обязательно генерировать максимум в каждом CI.

---

# 59. Performance suites

Разделить:

- CI light;
- nightly;
- pre-release heavy.

---

# 60. Load tests

Проверить:

- login/session;
- asset search;
- dashboard;
- work order lists;
- inventory scan bursts;
- report queue;
- upload.

---

# 61. Tooling

Возможные инструменты:

- k6;
- NBomber;
- Playwright;
- Testcontainers.

---

# 62. Database performance tests

Для критичных запросов:

```text
EXPLAIN ANALYZE
```

и regression thresholds.

---

# 63. N+1 tests

Для API списков проверять число SQL queries там, где это риск.

---

# 64. Report tests

Проверять:

- correct filters;
- totals;
- scope;
- generation job;
- file availability;
- expiration.

---

# 65. File tests

Проверить:

- valid upload;
- invalid mime;
- oversized;
- malware/quarantine mock;
- duplicate checksum behavior;
- access denied download.

---

# 66. Security tests

Автоматизировать:

- auth required;
- forbidden access;
- IDOR;
- context spoof;
- upload validation;
- CORS config;
- security headers where testable.

---

# 67. Static analysis

CI:

- compiler warnings;
- analyzers;
- nullable;
- lint;
- dependency vulnerabilities;
- secret scan.

---

# 68. Backend analyzers

Использовать:

- .NET analyzers;
- StyleCop/аналог при необходимости;
- security analyzers.

Не превращать стиль в тысячи бесполезных warnings.

---

# 69. Frontend static checks

- TypeScript strict;
- ESLint;
- formatting;
- unused exports;
- dependency scan.

---

# 70. Mutation testing

Позднее для особо критичной domain logic.

Не обязательна на старте.

---

# 71. Resilience tests

Позднее проверить:

- Redis unavailable;
- RabbitMQ temporarily unavailable;
- S3 unavailable;
- worker retry;
- DB transient failure.

---

# 72. Redis outage

Core read/write path не должен без необходимости полностью падать из-за cache outage.

---

# 73. RabbitMQ outage

Business transaction может сохраниться с outbox, а публикация произойти позже.

---

# 74. S3 outage

Нельзя завершить процесс, если mandatory attachment не сохранён.

Но unrelated API должен продолжать работать.

---

# 75. Notification failure

Notification failure не должен откатывать успешно завершённое ТО.

---

# 76. Backup restore tests

Регулярно проверять restore.

Backup без проверенного восстановления не считается надёжным.

---

# 77. Smoke tests

После deploy:

- health;
- DB;
- login;
- basic authorized API;
- object storage;
- RabbitMQ path;
- critical read.

---

# 78. Production synthetic checks

Позднее:

- login service account;
- basic read;
- health;
- queue lag.

---

# 79. Test data builders

Создать reusable builders:

```text
SiteBuilder
AssetBuilder
UserBuilder
ContractBuilder
WorkOrderBuilder
```

---

# 80. Avoid giant fixtures

Тест должен создавать только данные, необходимые сценарию.

---

# 81. Deterministic tests

Запрещены случайные flaky waits:

```text
Thread.Sleep(5000)
```

Использовать polling/await condition с timeout.

---

# 82. Random data

Если используется randomization — seed сохранять при failure.

---

# 83. Parallel tests

Тесты должны быть безопасны при параллельном запуске либо явно изолированы.

---

# 84. Test naming

Название должно объяснять бизнес-правило.

Пример:

```text
CompleteUnplannedMaintenance_WhenFullScopeNotConfirmed_DoesNotResetPlan
```

---

# 85. Assertions

Проверять бизнес-результат, а не внутреннюю реализацию.

---

# 86. Mock policy

Mock внешние границы:

- IdP;
- email;
- external APIs.

Не mock:

- собственную domain model;
- PostgreSQL в persistence integration tests.

---

# 87. Test doubles for clock

Обязательно fake clock.

---

# 88. Feature flag tests

Проверять:

```text
flag off
flag on
```

для функций, меняющих поведение.

---

# 89. Permission matrix tests

Поддерживать table-driven tests.

Пример:

```text
role | context | site | action | expected
```

---

# 90. Master data tests

Проверить:

- duplicate manufacturer;
- model verification;
- inactive lookup;
- normalized search.

---

# 91. QR tests

Проверить:

- valid token;
- revoked token;
- unknown token;
- wrong context;
- no sensitive data leak.

---

# 92. Import tests

Проверить:

- valid file;
- partial invalid rows;
- preview;
- confirmation;
- duplicate import;
- rollback on fatal failure;
- report.

---

# 93. Export tests

Проверить:

- scope filtering;
- sensitive data;
- formula injection mitigation;
- expiration.

---

# 94. Localization tests

Не обязательно тестировать каждую строку.

Но важно проверить:

- error code independent from localized message;
- missing translation fallback.

---

# 95. Accessibility

Для основных web flows постепенно внедрить automated accessibility checks.

---

# 96. Browser support

Зафиксировать поддерживаемые браузеры.

Минимум Chromium-based corporate desktop.

При PWA — дополнительно мобильные target browsers.

---

# 97. Mobile/PWA tests

Позднее:

- offline open work order;
- edit checklist;
- capture photo;
- reconnect;
- sync;
- duplicate sync;
- conflict.

---

# 98. Offline authorization tests

Если scope истёк, пока устройство offline:

```text
sync → server denies unauthorized operation
```

Система должна показать пользователю конфликт/отказ.

---

# 99. Offline media tests

Проверить:

- interrupted upload;
- resume;
- duplicate;
- orphan cleanup.

---

# 100. Regression suites

Разделить:

```text
PR suite
nightly suite
release suite
```

---

# 101. PR suite

Должна быть достаточно быстрой.

Включает:

- unit;
- key integration;
- authorization;
- lint;
- migration smoke.

---

# 102. Nightly

Включает:

- broad integration;
- E2E;
- performance light;
- dependency scan;
- larger datasets.

---

# 103. Release suite

Включает:

- full E2E;
- migration from previous release;
- load test;
- restore check where feasible;
- security checks.

---

# 104. Flaky test policy

Flaky test — дефект.

Нельзя просто повторять его 10 раз и считать проблему решённой.

---

# 105. Quarantine

Временная quarantine допустима только:

- с issue;
- владельцем;
- сроком исправления.

---

# 106. Coverage

Coverage — индикатор, не цель.

Не устанавливать бессмысленный 100%.

---

# 107. Critical coverage

Высокое покрытие требуется для:

- domain rules;
- authorization;
- maintenance scheduling;
- risk;
- lifecycle.

---

# 108. Test documentation

Критические E2E сценарии должны быть описаны как business flows.

---

# 109. Acceptance criteria

Каждая задача в backlog должна иметь проверяемые acceptance criteria.

---

# 110. Bug regression test

Каждый серьёзный bug после исправления должен получить regression test, если технически возможно.

---

# 111. Production issue reproduction

Создавать минимальный reproducible fixture, а не копировать production DB.

---

# 112. Test observability

При failure сохранять:

- logs;
- correlation id;
- screenshots для E2E;
- trace;
- relevant DB state where safe.

---

# 113. CI artifacts

Хранить:

- test reports;
- coverage;
- screenshots;
- traces;
- OpenAPI diff;
- migration logs.

---

# 114. Database assertions

После command проверять не только HTTP response, но и:

- business state;
- history;
- audit;
- outbox.

---

# 115. Example: maintenance acceptance test

```text
Given:
KVO-2 object
DGU
TO-2 rule every 3 months

When:
TO completed and accepted

Then:
work order accepted
asset history contains event
measurements stored
next due = +3 months
schedule recalculation reason stored
audit exists
```

---

# 116. Example: incomplete maintenance

```text
Given:
TO-2 has critical oil replacement operation

When:
operation not performed

Then:
normal completion blocked
or completion follows configured critical workflow
defect/repair action required
```

---

# 117. Example: minor defect

```text
Given:
mechanical voltmeter defective
DGU electrical test normal

When:
maintenance completed

Then:
work may complete with remarks
asset remains operational
defect created
history preserved
```

---

# 118. Example: inventory missing

```text
Given:
asset expected at site

When:
not found after scan

Then:
discrepancy created
financial/property incident can be created
asset is NOT auto-decommissioned
```

---

# 119. Example: contractor verification

```text
Given:
contractor enters 6 labor hours

When:
work completed

Then:
labor entry status = pending verification

When:
customer engineer verifies

Then:
verified_at/by stored
```

---

# 120. Example: expired qualification

```text
Given:
executor qualification expired yesterday

When:
assignment attempted

Then:
assignment blocked or exception workflow required
```

---

# 121. Example: risk reduction

```text
Given:
auto risk HIGH
expert IT HIGH
expert exploitation MEDIUM

When:
coordinator sets final MEDIUM

Then:
reason required
audit event exists
decision marked manual reduction
```

---

# 122. AI-generated tests

Codex может генерировать tests, но обязан:

- следовать business rules;
- не подменять requirements реализацией;
- использовать существующие fixtures;
- проверять negative cases;
- не ослаблять assertions ради зелёного CI.

---

# 123. AI Agent Rules

Перед завершением задачи Codex должен проверить:

1. Unit tests нужны?
2. Integration tests нужны?
3. Authorization test нужен?
4. Migration test нужен?
5. Concurrency test нужен?
6. Audit проверен?
7. Outbox проверен?
8. E2E сценарий затронут?
9. Regression risk?
10. Docs обновлены?

---

# 124. Запрещённые практики

Не допускается:

- test only happy path;
- mock PostgreSQL everywhere;
- отключать failing test;
- менять expected value под баг;
- тестировать private methods вместо поведения;
- shared mutable global fixture;
- dependence on current real time;
- production credentials in tests;
- giant E2E suite вместо integration tests;
- brittle sleeps.

---

# 125. Definition of Done для тестирования

Функция готова, если:

1. Acceptance criteria проверены.
2. Domain rules покрыты.
3. Persistence проверена.
4. Authorization проверена.
5. Negative cases есть.
6. Audit/outbox проверены, если применимо.
7. Migration проверена, если менялась DB.
8. Concurrency проверена, если есть concurrent edit risk.
9. API contract обновлён.
10. CI зелёный.
11. Нет flaky tests.
12. Критический пользовательский flow не сломан.

---

# 126. Главный принцип тестирования

> Критичная бизнес-операция должна быть доказуемо корректной не только по HTTP-ответу, но и по изменению состояния, сохранённой истории, аудиту, правам доступа и побочным событиям.

Для АС «Эксплуатация» особенно важно проверять не просто:

```text
"запрос вернул 200"
```

а:

```text
"пользователь имел право,
операция была допустима,
состояние изменилось правильно,
история сохранилась,
аудит создан,
дубликат не появился,
и повторный запрос безопасен".
```
