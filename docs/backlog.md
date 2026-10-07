# АС «Эксплуатация» — Product / Engineering Backlog

## 1. Назначение документа

Этот документ превращает концепцию, архитектуру и roadmap АС «Эксплуатация» в последовательный инженерный backlog.

Документ предназначен для:

- владельца продукта;
- архитектора;
- основного разработчика;
- Codex и других AI-агентов;
- будущей команды разработки;
- QA;
- DevOps.

Документ используется совместно с:

- `Q&A.md`;
- `concept.md`;
- `roadmap.md`;
- `architecture.md`;
- `coding-standards.md`;
- `database.md`;
- `api-guidelines.md`;
- `security.md`;
- `testing.md`;
- `deployment.md`;
- `dev-environment.md`.

Главная цель:

> Каждая задача должна быть достаточно конкретной, чтобы её можно было реализовать отдельно, проверить по acceptance criteria и безопасно объединить с остальной системой.

---

# 2. Правила работы с backlog

## 2.1. Уровни

Используется иерархия:

```text
Epic
└── Feature
    └── Task
```

---

## 2.2. Приоритеты

```text
P0 — обязательно для MVP
P1 — следующий приоритет
P2 — позднее развитие
```

---

## 2.3. Статусы

Рекомендуемые статусы:

```text
BACKLOG
READY
IN_PROGRESS
REVIEW
TESTING
DONE
BLOCKED
```

---

## 2.4. Definition of Ready

Задача готова к разработке, если:

- понятна бизнес-цель;
- известен module owner;
- определены основные сущности;
- понятны permissions;
- определены acceptance criteria;
- нет неизвестного архитектурного решения;
- если требуется новый инфраструктурный компонент — есть ADR.

---

## 2.5. Definition of Done

Задача завершена, если:

- реализация соответствует `coding-standards.md`;
- есть migration при изменении БД;
- есть API/OpenAPI при необходимости;
- есть authorization;
- есть audit при необходимости;
- есть unit/integration tests;
- есть authorization tests для чувствительных операций;
- обновлена документация;
- нет критичных TODO;
- acceptance criteria проверены.

---

# 3. Рекомендуемый порядок MVP

```text
EPIC-00 Repository & Foundation
EPIC-01 Identity & Access
EPIC-02 Organization & Sites
EPIC-03 Assets & Master Data
EPIC-04 Documents & Files
EPIC-05 Maintenance Templates & Scheduling
EPIC-06 Work Orders & Execution
EPIC-07 Measurements
EPIC-08 Defects & Repairs
EPIC-09 Contractors & Qualifications
EPIC-10 Inventory
EPIC-11 Incidents
EPIC-12 Changes & Risks
EPIC-13 Reporting
EPIC-14 PWA / Offline
EPIC-15 Production Hardening
```

---

# EPIC-00. Repository & Foundation

Priority: P0

Goal:

Создать воспроизводимый технический фундамент проекта.

Dependencies:

```text
none
```

---

## FEATURE-00.01. Repository structure

### TASK-00.01.01. Создать структуру репозитория

Создать:

```text
/src
/tests
/docs
/scripts
/deploy
```

И базовые solution/project файлы.

Acceptance Criteria:

- repository собирается;
- структура соответствует `architecture.md`;
- docs directory существует;
- нет production secrets;
- `.gitignore`, `.gitattributes`, `.editorconfig` добавлены.

---

### TASK-00.01.02. Добавить solution-level configuration

Создать:

```text
global.json
Directory.Build.props
Directory.Packages.props
```

Acceptance Criteria:

- .NET SDK version зафиксирован;
- nullable включён;
- единые analyzers применяются;
- build одинаков на Windows/Linux.

---

## FEATURE-00.02. Local infrastructure

### TASK-00.02.01. Создать docker-compose.yml

Сервисы:

```text
PostgreSQL
Redis
RabbitMQ
SeaweedFS (DEV S3-compatible provider; ADR-009)
Keycloak
```

Acceptance Criteria:

- `docker compose up -d` запускает инфраструктуру;
- health каждого сервиса проверяем;
- данные хранятся в named volumes;
- пароли берутся из `.env`;
- `.env.example` добавлен.

---

### TASK-00.02.02. Создать dev-up/dev-down scripts

Создать cross-platform команды или:

```text
scripts/dev-up.ps1
scripts/dev-down.ps1
scripts/dev-reset.ps1
```

Acceptance Criteria:

- среда поднимается одной командой;
- destructive reset работает только в Development;
- script не может удалить production DB.

---

## FEATURE-00.03. Backend bootstrap

### TASK-00.03.01. Создать ASP.NET Core API

Acceptance Criteria:

- `/health/live`;
- `/health/ready`;
- OpenAPI доступен в Development;
- structured logging;
- correlation ID middleware;
- configuration validation.

---

### TASK-00.03.02. Создать base module pattern

Реализовать шаблон одного модуля:

```text
Domain
Application
Infrastructure
Contracts
```

Acceptance Criteria:

- зависимости соответствуют architecture;
- Domain не зависит от Infrastructure;
- пример command/query реализован;
- module registration стандартизирован.

---

## FEATURE-00.04. Frontend bootstrap

### TASK-00.04.01. Создать React + TypeScript приложение

Acceptance Criteria:

- TypeScript strict;
- router настроен;
- API client abstraction существует;
- базовый layout существует;
- environment API URL configurable.

---

### TASK-00.04.02. Подключить TanStack Query

Acceptance Criteria:

- server state не хранится вручную в global store;
- общий query client настроен;
- ошибки API нормализуются.

---

## FEATURE-00.05. CI

### TASK-00.05.01. Build pipeline

Pipeline:

```text
backend build
frontend build
lint
unit tests
integration tests
```

Acceptance Criteria:

- работает на Linux runner;
- failed tests блокируют merge;
- artifacts/logs сохраняются.

---

### TASK-00.05.02. Migration smoke test

Acceptance Criteria:

- CI создаёт пустую PostgreSQL;
- применяет все migrations;
- API запускается после migrations.

---

# EPIC-01. Identity & Access

Priority: P0

Goal:

Обеспечить authentication, roles, permissions, scope и working context.

Dependencies:

```text
EPIC-00
```

---

## FEATURE-01.01. Authentication

### TASK-01.01.01. Интеграция OIDC

Первый dev вариант:

```text
Keycloak
```

Production-compatible abstraction должна позволять Entra ID.

Acceptance Criteria:

- login работает;
- backend validates issuer/audience;
- passwords не хранятся в приложении;
- authenticated user mapped to a non-persistent application runtime profile;
- canonical external identity key is `issuer + subject`.

Task boundary: durable `identity.users` persistence, provisioning and profile synchronization belong to `TASK-01.01.02`.

---

### TASK-01.01.02. Local user profile

Создать:

```text
identity.users
```

Acceptance Criteria:

- canonical external identity (`issuer + subject`) уникальна;
- user type хранится и для первого provisioning поступает только из configured trusted claim;
- status (`ACTIVE` / `INACTIVE`) хранится; inactive profile блокируется;
- profile создаётся/синхронизируется идемпотентно, optional attributes не меняют type/status, concurrent update не выполняет silent overwrite.

---

## FEATURE-01.02. Permissions

### TASK-01.02.01. Реализовать roles/permissions

Acceptance Criteria:

- roles;
- permissions;
- role_permissions;
- базовый seed системных permissions;
- permission codes documented.

Task boundary: authorization policies, user access assignments, scope, working contexts and administrative role-management API belong to subsequent Identity tasks.

---

### TASK-01.02.02. Authorization policies

Acceptance Criteria:

- endpoint может требовать конкретный permission;
- backend возвращает 403 при отсутствии permission;
- authorization tests есть.

---

## FEATURE-01.03. Scope model

### TASK-01.03.01. Реализовать access_assignments

Scope:

```text
territorial zone
region
site
functional direction
asset type
```

Acceptance Criteria:

- assignment имеет validity;
- expired assignment не даёт доступ;
- scope evaluation unit-tested.

---

### TASK-01.03.02. Working contexts

Acceptance Criteria:

- пользователь видит свои contexts;
- может выбрать active context;
- backend проверяет ownership;
- context записывается в audit.

Owner decision для этой Task ID: чтение и выбор только собственных доступных contexts являются узким authenticated + ACTIVE local user self-service boundary, а не operational permission grant. `identity.contexts.read` сохраняется для будущих permission-controlled сценариев. Selection не включает production grant source. Минимальный Audit-owned append-only `audit.events` foundation разрешён здесь как prerequisite для durable `WorkingContextSelected`; полный Audit foundation остаётся `TASK-01.04.01`.

Уточнение owner decision: POST body создаёт ровно один `WorkingContextSelected` и игнорирует `X-Work-Context-Id`; на других `/api/v1` запросах header применяет context только к текущему request и требует durable `WorkingContextApplied` до endpoint. Оба действия остаются без permission grant.

---

### AUTH-SCOPE-01. Production authorization evaluation + capabilities

Cross-cutting Identity/Sites/API security task discovered by frontend
integration preflight. Phase A owner decisions OD-01…OD-06 are frozen in
`docs/adr/ADR-013-target-aware-production-authorization.md` and
`.agent/tasks/AUTH-SCOPE-01/phase-a-contract.md`. Phase A changes no runtime
authorization. Implementation phases B1/B2/C1…C4 require an explicit
follow-up request; the current production grant source remains deny-by-default.

The B2-A effective-scope contract is frozen in
`.agent/tasks/AUTH-SCOPE-01/phase-b2a-effective-scope-contract.md` and refined
by ADR-015. B2-B1 implements the Identity `IEffectiveScopeProvider` and shared
Identity eligibility query. The initial B2-B2 implementation used a trusted
Zone/Region projection, direct-target composition with the B1 evaluator, and
permission-specific scoped Zone/Region PostgreSQL stores; B2-R1 superseded
those public authorization handoffs under ADR-016.
Focused PostgreSQL, security, architecture and Release build gates pass.
Geography route integration was deferred to C1; B2-B3 remains not started.

B2 independent review blocked integration on F1 HIGH (caller-forgeable Region
parent at the public Identity evaluator) and F2 MEDIUM (caller-forgeable scopes
and permission at the public Sites read store). B2-R0 freezes ADR-016 and
`.agent/tasks/AUTH-SCOPE-01/phase-b2r0-trust-boundary-contract.md` as the
remediation contract. B2-R1 implements exact Identity targets, Sites-owned
direct coverage and an authorized list service with internal SQL filtering.
Final adversarial review closed F1/F2 with no open HIGH/MEDIUM findings. A
PostgreSQL test composes the real Identity provider with the public Sites list
service. B2 is integrated on main. C1 integrates only Zone/Region
production routes through Sites target-aware services. C1-OD-01 makes absent
and out-of-scope direct targets or Region-create parents uniformly 403;
empty scoped lists remain 200 `[]`. Root Zone create stays closed. Independent
C1 review passed and the Geography routes are integrated on main.

---

## FEATURE-01.04. Audit foundation

### TASK-01.04.01. Создать audit.events

Минимальная Audit-owned таблица и writer для `WorkingContextSelected` / `WorkingContextApplied` уже закладываются в `TASK-01.03.02`; эта задача расширяет foundation, не создавая второй audit mechanism.

Acceptance Criteria:

- append-only model;
- correlation ID;
- user ID;
- context ID;
- entity/action;
- critical commands создают audit event.

Owner decision для этой Task ID: существующий `POST /api/v1/me/context` является текущим critical command и обязан использовать единый canonical Audit append contract; `WorkingContextApplied` остаётся обязательным security-sensitive event, но не command. Другие state-changing critical commands интегрируются в Audit в своих backlog tasks. Retention, partitioning, query/admin API, system actor model и cross-module durable-command atomicity остаются deferred extension points.

---

# EPIC-02. Organization & Sites

Priority: P0

Goal:

Создать географическую, организационную и объектовую основу.

Dependencies:

```text
EPIC-01
```

---

## FEATURE-02.01. Geographic hierarchy

### TASK-02.01.01. Territorial Zones

CRUD + read model.

Acceptance Criteria:

- code unique;
- status;
- permissions;
- audit изменений.

---

### TASK-02.01.02. Regions

Acceptance Criteria:

- region принадлежит territorial zone;
- timezone хранится;
- inactive region нельзя использовать для новых объектов.

Phase A contract freeze: Region is owned by Sites and is persisted in
`sites.regions` under an immutable Territorial Zone parent. Lifecycle is
`ACTIVE`/`INACTIVE`; hard delete and parent reassignment are forbidden.
Code is canonical uppercase, immutable and unique within the parent zone;
name is trimmed, non-empty, maximum 200 and mutable; timezone is a
canonical IANA identifier string. API uses `sites.read`, `sites.create`
and `sites.change` with optimistic `expectedRowVersion` writes. Region
mutations create one matching durable Sites audit obligation atomically;
canonical Audit entity/actions are `Region` and
`RegionCreated`/`RegionUpdated`/`RegionActivated`/`RegionDeactivated`.

---

## FEATURE-02.02. Organizational model

### TASK-02.02.01. Organizational units

Acceptance Criteria:

- произвольная иерархия;
- parent/child;
- тип подразделения;
- cycle prevention.

Phase A contract freeze (2026-09-25): Organization owns
`OrganizationalUnit` and `OrganizationalUnitType`; geographic hierarchy
remains Sites-owned and separate. Units belong to a mandatory Company, roots
use nullable `parent_id`, multiple roots are allowed, and parent/child must
share Company. Reparenting is allowed within Company only, preserves ID and
history, requires ACTIVE source and ACTIVE target parent, permits moving to
root, rejects self/descendant targets, and uses optimistic concurrency,
server-derived audit and ADR-012 structural serialization. Cross-company
parenting and Company transfer are forbidden. `ACTIVE`/`INACTIVE` is the unit
lifecycle; creation starts ACTIVE, hard delete and descendant cascade are
forbidden, inactive units remain queryable but cannot receive new children or
become new parents. Deactivation participates in structural serialization.

Unit types are Organization-owned configurable reference data with UUIDv7 ID,
immutable canonical uppercase code, mutable name, ACTIVE/INACTIVE lifecycle,
no hard delete and initial seeds `DEPARTMENT`, `DIVISION`, `DIRECTION`,
`SECTION`, `FRONT_OFFICE`, `BACK_OFFICE`, `MANAGEMENT`.

Code is required, canonical uppercase, immutable, max 50, matches
`^[A-Z0-9][A-Z0-9_-]{0,49}$` and is unique by `(company_id, code)`. Name is
trimmed, non-empty, max 200 and mutable.

Frozen API surface: flat list with required `companyId`, get, create, PUT,
activate, deactivate and dedicated reparent routes under
`/api/v1/organizational-units`; no DELETE, generic PATCH or tree/children
endpoint. `organization.read`, `organization.create` and
`organization.change` are the canonical permissions; scope evaluation remains
deny-by-default and is deferred to the authorization-scope task.

Every master-data mutation creates one Organization-owned durable audit
obligation for canonical entity `OrganizationalUnit` and server-derived
Created/Updated/Reparented/Activated/Deactivated actions. Organization does
not write Sites or Audit tables directly; delivery uses the canonical
`IAuditWriter` and ADR-011 at-least-once/idempotent materialization.

Phase B1 verified that `organization.companies` was absent and implemented
the owner-approved minimal Company persistence prerequisite, Organization
DbContext/migration history, and seven OrganizationalUnitType seed values.
General Company CRUD remains out of scope. Phase B2 implements
OrganizationalUnit domain/persistence, append-only business history,
transaction-safe hierarchy commands and Organization-owned durable audit
obligations. Phase C1 adds Application handlers, seven HTTP routes,
`organization.*` permission gates and the synchronized Identity permission
seed. Phase C2 adds Organization-owned delivery through the technical host
and canonical Audit writer, with independent bounded Sites/Organization polls.
Phase C3 review and C4 traceability/documentation plus local final gates passed;
hosted CI verification is pending because repository Actions status is not
accessible in the current session.

Proposed implementation split after Phase A:

- **Phase B1:** Organization module foundation, Company persistence gap
  verification/minimal prerequisite, module-owned DbContext/schema migration,
  and `organizational_unit_types` reference persistence/seed.
- **Phase B2:** OrganizationalUnit domain/persistence, restrictive FKs and
  uniqueness, lifecycle/reparent invariants, ADR-012 structural concurrency,
  and Organization durable audit obligation persistence.
- **Phase C1:** application use cases, transport DTOs/routes and canonical
  `organization.*` permission policies.
- **Phase C2:** generalized AuditDelivery adapters for Organization-owned
  obligations through the existing `IAuditWriter`.
- **Phase C3:** DONE — independent security, concurrency, audit-delivery,
  module-boundary and test-quality review; no open Critical/High/Medium findings.
- **Phase C4:** local documentation and final gates DONE; implementation commit
  pushed to `main`; hosted CI verification pending repository access.

---

### TASK-02.02.02. Functional directions

Status: **IMPLEMENTED_LOCALLY_PENDING_REVIEW_AND_PUBLICATION**
(FUNCTIONAL-DIRECTION-01, OD-FUNCTIONAL-DIRECTION-01..06 accepted).
TASK-03.01.01 prerequisite remains pending publication; local implementation
does not unblock downstream work.

Domain/persistence/provider/API/Audit candidate is present locally. OD-06
accepts exactly one Identity HasData data-only migration,
`20261007141653_AddFunctionalDirectionManagementPermission`, for the canonical
management permission. It changes no Identity schema and creates no role,
assignment or GLOBAL grant; the permission row alone gives no access. Local
validation passed; independent commit review and publication remain pending.

Organization-owned GLOBAL configurable reference; runtime UUIDv7, immutable
globally unique canonical code (trim/uppercase, max 50, existing ReferenceCode
regex), mutable trimmed non-unique name (max 200), ACTIVE/INACTIVE status,
created_at/updated_at/row_version. No description, is_active or hard delete.

Начальные значения:

```text
IT
EXPLOITATION
SECURITY
CYBERSECURITY
REAL_ESTATE
INFRASTRUCTURE_DEVELOPMENT
RETAIL
```

Acceptance Criteria:

- не hardcoded в business logic;
- можно добавлять новые значения.
- exactly seven deterministic ACTIVE seeds, name == code;
- stable cross-module reference provider: ACTIVE selectable, INACTIVE resolvable
  but not selectable, missing distinct; no EF/DbContext/IQueryable/auth facts;
- unpaged inactive-inclusive GET `/api/v1/reference/functional-directions`,
  sorted code/id; management detail, create, name-only PUT, activate/deactivate;
- OD-05: catalog requires explicit current GLOBAL `organization.read` OR
  GLOBAL `organization.manage_functional_directions`; management requires
  only GLOBAL `organization.manage_functional_directions`;
- canonical ACTIVE INTERNAL user + owned current INTERNAL context; fixed
  permissions through published Identity `IGlobalGrantProvider`, fail closed;
- concrete/composite scopes never satisfy either GLOBAL rule; read does not
  imply management; Company/OrganizationalUnit scopes remain deferred;
- current expectedRowVersion required for updates/lifecycle; duplicate code,
  unchanged name, repeated lifecycle and stale writes conflict;
- successful mutations atomically create canonical Organization-owned durable
  FunctionalDirection audit obligations; no business-history store added;
- one narrow Organization migration and one Identity permission data-only
  migration; no Identity/Assets schema change, role, access assignment or
  GLOBAL grant seed; no frontend/Assets implementation.

Contract, routes and audit: `modules/organization.md`; seed IDs:
`reference-data-registry.md`; exact GLOBAL authorization:
`permissions-registry.md` and `security.md`. Independent review and publication
are separate gates after local verification/commit.

---

### TASK-02.02.03. Teams

Acceptance Criteria:

- рабочая группа;
- участники;
- validity;
- direction optional;
- history membership.

---

### TASK-02.02.04. Delegations

Acceptance Criteria:

- from/to user;
- scope;
- valid_from/valid_to;
- expired delegation ignored;
- audit.

---

## FEATURE-02.03. Sites

### TASK-02.03.01. Site types

Implementation: DONE — Sites-owned persistence, deterministic four-type seed
and `sites.read` reference read API. Build pipeline #17 passed for `be970e9`.
Management API is deferred to a separate future task.

Acceptance Criteria:

- configurable reference;
- базовые типы seed/dev data;
- type separate from criticality.

---

### TASK-02.03.02. Site criticality

DONE / COMMITTED / PUBLISHED at `8bef135bf28be900325966257803d69c105ef11e`.
Sites domain/reference model, persistence, additive migration, seeds,
PostgreSQL checks, and the read-only `sites.read` GET reference API are
implemented. Local gates and hosted CI passed.
Site CRUD and runtime catalog management are outside this task.

Acceptance Criteria:

- NORMAL;
- KVO3;
- KVO2;
- KVO1;
- rank хранится;
- можно расширить справочник.

---

### TASK-02.03.03. Site CRUD

Phase A: owner decisions OD-01 through OD-10 are frozen in Sites module,
  database/API/security documentation and ADR-014. Phase B1 foundation is
  published on main: Site domain and persistence, additive migration,
  parent/reference invariants and durable Site Audit binding/delivery
  compatibility. SITE-AUTH-01 exact Site scopes and Sites-owned authorization
  foundation are also published. SITE-API-01 Site HTTP/API is published
  after independent SITE-API-01R review and post-integration verification;
  management frontend is published by SITE-UI-01 after independent review
  in baseline `70d78d7`. Capabilities and DEV bootstrap remain
  unimplemented.
Sites owns `sites.sites` in the Territorial Zone → Region → Site hierarchy.
The first backend slice has required immutable globally unique canonical code,
required name/Region/SiteType/SiteCriticalityClass/address/timezone,
`ACTIVE`/`INACTIVE` lifecycle, no move or DELETE, optimistic row version,
paginated scoped reads, explicit criticality command and durable Site audit
obligations. Published production HTTP routes support Zone/Region; the seven
Site routes are published by SITE-API-01 after SITE-API-01R review.
Site CRUD may now use the published exact Site-scope and Sites-owned
target/list foundation; contractor grants stay closed.
SITE-AUTH-00 / ADR-017 freezes that extension under ADR-015/016: Identity
returns exact Site scopes; Sites resolves Site → Region → Zone and performs
direct coverage and SQL-filtered lists. The existing assignment schema has
`site_id`, so no migration was needed. SITE-AUTH-01 implements the exact
Identity Site scopes and Sites-owned direct/create/list foundation, published
after SITE-AUTH-01R independent review and regression gates. Site HTTP routes
are published by SITE-API-01 after independent SITE-API-01R publication review.
TASK-02.03.04 continues to own the broader Site card UI (locations, assets
summary and responsible-directions placeholder); SITE-UI-01 is the management
surface for the published Site CRUD API.

Acceptance Criteria:

- code;
- name;
- region;
- type;
- criticality;
- address;
- timezone;
- status;
- scope authorization.

---

### TASK-02.03.04. Site card UI

Acceptance Criteria:

- общая информация;
- criticality;
- region;
- locations;
- assets summary;
- responsible directions placeholder/read model.

Accepted owner decisions for SITE-CARD-UI-01 (2026-09-30; no ADR required):
the Locations section may show a clearly labeled availability placeholder.
LOCATION-TREE-01 now supplies its backend read contract; OD-LOCATION-08 keeps
placeholder replacement in the later LOCATION-UI phase. The Asset
summary may show a clearly labeled availability placeholder until EPIC-03
provides its read contract. These placeholders must not imply empty results
or show fabricated rows, IDs, counts, statuses, or categories. The responsible
directions section remains a presentation placeholder/read model only; this
task does not add assignment behavior, APIs, or permissions.

---

## FEATURE-02.04. Locations

### TASK-02.04.01. Location types

Acceptance Criteria:

- configurable;
- BUILDING/FLOOR/ROOM/RACK/AREA supported.

LOCATION-TYPE-01 owner decisions OD-LOCATION-TYPE-01..04 freeze this slice as
Sites-owned LocationType persistence with exactly five stable ACTIVE seeds and
a production read-only global catalog at `GET /api/v1/reference/location-types`.
The catalog uses its own fixed authorization union: `sites.read` or
`sites.manage_locations` with a current supported geographic scope in an ACTIVE
INTERNAL user/context. Runtime reference management, Location instances/tree
(TASK-02.04.02), UI and Assets remain outside this task. See Sites module,
reference registry, database and security docs for the exact contract.

---

### TASK-02.04.02. Location tree

STATUS: PUBLISHED (backend, LOCATION-TREE-01R). Reviewed SHA `f114661affdb6df6015852eb85bfd597538f3dac`,
[hosted CI 37339001540](https://github.com/CrazyMotoCat/AC_Expluatation/actions/runs/37339001540)
backend/frontend/required checks PASS. Final publication metadata commit is
independently checked at its exact SHA before delivery. Location UI remains
NOT_IMPLEMENTED; Site-card Location placeholder remains. Asset dependency:
LOCATION_BACKEND_AVAILABLE. No separate Location UI Task ID is currently listed.

Acceptance Criteria:

- arbitrary depth;
- one site;
- cycle prevented;
- move location supported with validation.

LOCATION-TREE-01 owner decisions OD-LOCATION-01..08 are ACCEPTED. This slice
is backend only: Sites-owned multiple-root adjacency list, arbitrary depth,
same-Site immutable ownership/code, database-unique `(site_id, code)`, explicit
move and ACTIVE/INACTIVE commands without cascade or delete. PostgreSQL
Site-scoped transaction serialization and recursive validation protect cycle
and active-tree invariants under concurrency. Any ACTIVE LocationType may be
used anywhere; unchanged inactive historical references remain valid.

List/get require only `sites.read`; every mutation requires only
`sites.manage_locations`, independently, on authoritative Site ancestry with
Zone/Region/Site coverage. Missing/inaccessible targets are concealed as 403.
Lazy roots/direct children use `GET /api/v1/sites/{siteId}/locations` and
`parentLocationId`, bounded pages (1/50/max200), code/id order. Direct get is
`GET /api/v1/locations/{locationId}`. Mutations retain optimistic row version
and durable atomic Sites audit obligations. See module/database/security
contracts for full fields and routes. Location UI and Site-card placeholder
replacement remain a later LOCATION-UI phase; no Location scope, type matrix,
cross-Site transfer or provisional LocationMoved emission is included.

---

# EPIC-03. Assets & Master Data

Priority: P0

Goal:

Создать основной реестр оборудования и составных систем.

Dependencies:

```text
EPIC-02
```

---

## FEATURE-03.01. Asset types

### TASK-03.01.01. Asset type hierarchy

Acceptance Criteria:

- parent/child;
- functional direction;
- system/component flags;
- inactive type cannot be selected for new asset.

---

## FEATURE-03.02. Manufacturers & Models

### TASK-03.02.01. Manufacturers

Acceptance Criteria:

- normalized uniqueness;
- verified status;
- search.

---

### TASK-03.02.02. Asset models

Acceptance Criteria:

- manufacturer;
- asset type;
- model code/name;
- verified status;
- duplicate prevention.

---

### TASK-03.02.03. Model proposal workflow

Priority: P1

Acceptance Criteria:

- user can propose missing model;
- responsible employee verifies;
- only verified model becomes general reference.

---

## FEATURE-03.03. Asset attributes

### TASK-03.03.01. Attribute definitions

Acceptance Criteria:

- type-specific attributes;
- TEXT/NUMBER/BOOLEAN/DATE/REFERENCE;
- unit optional;
- required/searchable/reportable.

---

### TASK-03.03.02. Asset attribute values

Acceptance Criteria:

- validation by definition;
- history/validity where required;
- key core fields remain real columns.

---

## FEATURE-03.04. Core asset registry

### TASK-03.04.01. Create asset

Acceptance Criteria:

- site;
- location;
- type;
- model optional;
- serial number;
- asset code;
- status;
- permission + scope;
- audit;
- asset event CREATED.

---

### TASK-03.04.02. Asset details API/UI

Acceptance Criteria:

- main fields;
- parent;
- children;
- responsibilities;
- documents summary;
- defects summary;
- maintenance summary;
- timeline.

---

### TASK-03.04.03. Asset search

Filters:

```text
site
region
type
manufacturer
model
status
serial
inventory number
```

Acceptance Criteria:

- paginated;
- indexed;
- p95 target checked on medium seed;
- scope-filtered.

---

## FEATURE-03.05. Composite assets

### TASK-03.05.01. Parent-child relations

Acceptance Criteria:

- UPS → battery cabinet;
- VRF system → blocks;
- ventilation system → functional blocks;
- cycle prevention.

---

### TASK-03.05.02. Generic asset relations

Acceptance Criteria:

- relation types;
- source/target;
- validity;
- structural vs functional distinction.

---

## FEATURE-03.06. Responsibilities

### TASK-03.06.01. Responsibility types

Seed/reference:

```text
OWNER
BALANCE_HOLDER
FUNCTIONAL_OWNER
TECHNICAL_OWNER
SERVICE_PROVIDER
ASSIGNED_USER
CURATOR
APPROVER
```

---

### TASK-03.06.02. Assign responsibility

Acceptance Criteria:

- user/team/org/contractor subject;
- validity;
- history;
- one field "responsible" не используется.

---

## FEATURE-03.07. Asset lifecycle

### TASK-03.07.01. Commission asset

Acceptance Criteria:

- commissioned_at;
- event;
- required docs optional by policy;
- maintenance plan can be initiated.

---

### TASK-03.07.02. Move asset

Acceptance Criteria:

- old/new location;
- reason;
- audit;
- event;
- inventory expectations use new location.

---

### TASK-03.07.03. Decommission asset

Acceptance Criteria:

- lifecycle transition validated;
- active critical processes considered;
- no physical delete;
- event + audit.

---

### TASK-03.07.04. Asset replacement

Acceptance Criteria:

- old/new asset;
- LIKE_FOR_LIKE / FUNCTIONAL_EQUIVALENT / CONFIGURATION_CHANGE;
- reason;
- serial/document updates;
- old asset history preserved;
- maintenance recalculation event prepared.

---

## FEATURE-03.08. Asset timeline

### TASK-03.08.01. Unified timeline API/UI

Acceptance Criteria:

- commissioning;
- movement;
- maintenance;
- defect;
- repair;
- inventory;
- replacement;
- pagination;
- business history separate from audit.

---

# EPIC-04. Documents & Files

Priority: P0

Goal:

Создать безопасную систему документов и фотографий.

Dependencies:

```text
EPIC-00
EPIC-01
EPIC-03
```

---

## FEATURE-04.01. Object storage

### TASK-04.01.01. S3 abstraction

Acceptance Criteria:

- SeaweedFS dev по ADR-009;
- S3-compatible interface;
- bucket private;
- storage key opaque;
- no filename path usage.

---

### TASK-04.01.02. Upload session

Acceptance Criteria:

- create upload;
- upload;
- complete;
- validate;
- create storage object;
- orphan cleanup path defined.

---

## FEATURE-04.02. Documents

### TASK-04.02.01. Document types

Acceptance Criteria:

- passport;
- manual;
- scheme;
- act;
- commissioning;
- warranty;
- extensible.

---

### TASK-04.02.02. Logical documents + versions

Acceptance Criteria:

- versions;
- current version;
- archived versions;
- approved version immutable;
- checksum stored.

---

### TASK-04.02.03. Document links

Acceptance Criteria:

- asset;
- model;
- work order;
- defect/repair;
- incident/change later;
- scope authorization.

---

## FEATURE-04.03. Photos

### TASK-04.03.01. Typed attachments

Types:

```text
GENERAL
BEFORE
AFTER
NAMEPLATE
DEFECT
MEASUREMENT
DOCUMENT
```

Acceptance Criteria:

- metadata;
- entity link;
- access controlled;
- preview support architecture.

---

## FEATURE-04.04. File security

### TASK-04.04.01. Validation pipeline

Acceptance Criteria:

- max size;
- mime;
- extension;
- SHA-256;
- quarantine/scanner adapter;
- invalid upload rejected.

---

### TASK-04.04.02. Secure download

Acceptance Criteria:

- authorization before download;
- temporary signed URL;
- restricted/critical download can be audited.

---

# EPIC-05. Maintenance Templates & Scheduling

Priority: P0

Goal:

Создать конструктор регламентов и автоматический календарь ТО.

Dependencies:

```text
EPIC-03
```

---

## FEATURE-05.01. Maintenance levels

### TASK-05.01.01. Level reference

Initial:

```text
TO1
TO2
TO3
SEASONAL
MAJOR
```

Acceptance Criteria:

- rank;
- configurable;
- no business hardcode.

---

## FEATURE-05.02. Maintenance templates

### TASK-05.02.01. Template CRUD

Acceptance Criteria:

- asset type;
- maintenance level;
- draft status;
- permissions.

---

### TASK-05.02.02. Template versioning

Acceptance Criteria:

- DRAFT;
- REVIEW;
- APPROVED;
- ARCHIVED;
- approved version immutable;
- new edits create new version.

---

## FEATURE-05.03. Operations

### TASK-05.03.01. Operation editor

Types:

```text
CHECK
BOOLEAN
NUMBER
TEXT
SELECT
PHOTO
MEASUREMENT
```

Acceptance Criteria:

- sequence;
- name;
- description;
- target component;
- estimated time.

---

### TASK-05.03.02. Requirement type

Support:

```text
REQUIRED
CONDITIONAL
RECOMMENDED
CONTROL
```

Acceptance Criteria:

- stored in snapshot;
- business rules tested.

---

### TASK-05.03.03. Operation criticality

Support:

```text
MINOR
IMPORTANT
CRITICAL
```

Acceptance Criteria:

- closure behavior can depend on criticality;
- no hardcoded UI-only logic.

---

### TASK-05.03.04. Measurement norms

Acceptance Criteria:

- parameter;
- unit;
- min/max;
- warning ranges;
- critical evaluation architecture.

---

## FEATURE-05.04. Composed regulations

### TASK-05.04.01. Template inclusions

Acceptance Criteria:

- TO2 can include TO1;
- TO3 can include lower levels;
- circular inclusion rejected.

---

### TASK-05.04.02. Component-based modules

Acceptance Criteria:

- UPS base;
- external battery cabinet module;
- bypass module;
- conditions stored;
- generated operation list deterministic.

---

## FEATURE-05.05. Frequency rules

### TASK-05.05.01. Calendar interval rules

Acceptance Criteria:

- asset type;
- maintenance level;
- site criticality;
- interval;
- validity;
- priority.

---

### TASK-05.05.02. Rule resolution

Acceptance Criteria:

- most specific applicable rule selected;
- deterministic priority;
- unit tests for NORMAL/KVO2/KVO1.

---

## FEATURE-05.06. Asset maintenance plans

### TASK-05.06.01. Attach plan to asset

Acceptance Criteria:

- template;
- frequency;
- anchor date;
- last completed;
- next due.

---

### TASK-05.06.02. Sliding horizon scheduler

Acceptance Criteria:

- future horizon configurable;
- generates planned works;
- rerun does not duplicate;
- idempotent.

---

### TASK-05.06.03. Recalculation history

Reasons:

```text
COMMISSIONING
REPAIR
REPLACEMENT
UNPLANNED_MAINTENANCE
MANUAL_CORRECTION
```

Acceptance Criteria:

- old/new date;
- reason;
- entity link;
- never silently overwrite due date.

---

### TASK-05.06.04. Full-scope reset rule

Acceptance Criteria:

- partial unplanned maintenance does not reset cycle;
- full scope confirmed resets according to rule;
- regression test exists.

---

# EPIC-06. Work Orders & Execution

Priority: P0

Goal:

Провести реальное ТО полностью внутри системы.

Dependencies:

```text
EPIC-05
EPIC-04
EPIC-01
```

---

## FEATURE-06.01. Work Order core

### TASK-06.01.01. WorkOrder entity/lifecycle

Initial statuses:

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

Acceptance Criteria:

- allowed transitions explicit;
- status history;
- optimistic concurrency.

---

### TASK-06.01.02. WorkOrder numbering

Acceptance Criteria:

- unique human-readable number;
- UUID remains PK;
- safe concurrency.

---

## FEATURE-06.02. Snapshot

### TASK-06.02.01. Generate work order from template

Acceptance Criteria:

- current approved version copied;
- operations copied;
- norms copied;
- requirement/criticality copied;
- later template change does not mutate work order.

---

## FEATURE-06.03. Assignment

### TASK-06.03.01. Assign team/user

Acceptance Criteria:

- scope checked;
- contractor contract checked;
- qualification hook available;
- audit.

---

## FEATURE-06.04. Checklist execution

### TASK-06.04.01. Start work

Acceptance Criteria:

- only assigned/authorized;
- actual_start_at;
- status transition;
- audit.

---

### TASK-06.04.02. Complete operation step

Acceptance Criteria:

- type-specific result;
- comment/photo requirement enforced;
- concurrent edit protected.

---

### TASK-06.04.03. Critical step behavior

Acceptance Criteria:

- CRITICAL incomplete cannot silently close as normal;
- configured path produces defect/remark/repair requirement;
- tests exist.

---

## FEATURE-06.05. Completion

### TASK-06.05.01. Executor proposes final equipment condition

States at minimum:

```text
IN_OPERATION
REPAIR_REQUIRED
FAILED
IN_OPERATION_WITH_NON_BLOCKING_DEFECTS
```

Acceptance Criteria:

- proposed status stored separately from approved;
- comment possible.

---

### TASK-06.05.02. Customer review

Acceptance Criteria:

- reviewer can approve/correct;
- contractor cannot self-approve if policy requires customer;
- KVO/failure escalation hook available.

---

### TASK-06.05.03. State snapshots before/after

Acceptance Criteria:

- technical condition;
- open defects;
- measurements summary;
- current status;
- saved as immutable snapshot.

---

## FEATURE-06.06. Materials

### TASK-06.06.01. Material catalog by asset type

Acceptance Criteria:

- suggested materials;
- custom material possible;
- no stock balances.

---

### TASK-06.06.02. Record material usage

Acceptance Criteria:

- quantity;
- unit;
- used_at mandatory;
- optional batch/manufacturer/serial;
- linked to work order.

---

## FEATURE-06.07. Labor

### TASK-06.07.01. Labor entries

Acceptance Criteria:

- participant;
- start/end/duration;
- actual person-hours;
- contractor flag/context.

---

### TASK-06.07.02. Contractor labor verification

Acceptance Criteria:

- contractor entry pending verification;
- customer reviewer verifies;
- verified_by/at saved.

---

## FEATURE-06.08. Planned labor

### TASK-06.08.01. Template estimated labor

Acceptance Criteria:

- estimated minutes per operation;
- planned executors optional;
- plan/fact report ready later.

---

# EPIC-07. Measurements

Priority: P0

Goal:

Сделать измерения отдельным историческим фактом и основой будущего анализа состояния.

Dependencies:

```text
EPIC-06
```

---

## FEATURE-07.01. Parameter definitions

### TASK-07.01.01. Measurement parameters

Acceptance Criteria:

- code;
- name;
- quantity type;
- default unit;
- unique code.

---

## FEATURE-07.02. Capture

### TASK-07.02.01. Save measurement from work step

Acceptance Criteria:

- asset;
- component optional;
- parameter;
- value;
- unit;
- measured_at;
- measured_by;
- work order/step.

---

### TASK-07.02.02. Evaluate range

Acceptance Criteria:

- NORMAL;
- WARNING;
- OUT_OF_RANGE;
- CRITICAL;
- actual raw value always preserved.

---

## FEATURE-07.03. History

### TASK-07.03.01. Asset measurement timeline

Acceptance Criteria:

- parameter filter;
- date range;
- pagination;
- chart-ready DTO;
- source/work link.

---

# EPIC-08. Defects & Repairs

Priority: P0/P1

Goal:

Создать контролируемый цикл неисправностей.

Dependencies:

```text
EPIC-06
EPIC-07
```

---

## FEATURE-08.01. Defect core

### TASK-08.01.01. Create defect

Acceptance Criteria:

- asset;
- component optional;
- severity;
- source;
- title/description;
- detected time;
- audit/event.

---

### TASK-08.01.02. Create defect from work order

Acceptance Criteria:

- work order link;
- source step;
- photo/measurement links;
- no duplicate if existing open defect intentionally reused.

---

## FEATURE-08.02. Observations

### TASK-08.02.01. Add repeat observation

Acceptance Criteria:

- open defect receives observation;
- observation timestamp/source;
- defect identity remains same.

---

## FEATURE-08.03. Recurrence

### TASK-08.03.01. Link new defect to previous closed defect

Acceptance Criteria:

- previous/current;
- engineer review status;
- no automatic reopen of old defect.

---

## FEATURE-08.04. Escalation

### TASK-08.04.01. Detect unresolved across maintenance cycles

Acceptance Criteria:

- repeat count;
- reason required;
- escalation flag;
- manager notification hook.

---

## FEATURE-08.05. Repair core

Priority: P1

### TASK-08.05.01. Repair entity

Acceptance Criteria:

- asset;
- defect optional;
- status;
- contractor/team;
- dates;
- result.

---

### TASK-08.05.02. Component replacement during repair

Acceptance Criteria:

- old/new component;
- replacement type;
- lifecycle history preserved.

---

## FEATURE-08.06. Warranty

Priority: P1

### TASK-08.06.01. Asset/component/work warranty

Acceptance Criteria:

- scope;
- start/end;
- provider;
- document;
- overlapping warranties supported.

---

# EPIC-09. Contractors & Qualifications

Priority: P0/P1

Goal:

Полноценно отделить внешних исполнителей и контролировать допуски.

Dependencies:

```text
EPIC-01
EPIC-02
```

---

## FEATURE-09.01. Contractor organizations

### TASK-09.01.01. Contractor registry

Acceptance Criteria:

- organization;
- status;
- customer-only management permission.

---

## FEATURE-09.02. Contracts

### TASK-09.02.01. Contract core

Acceptance Criteria:

- number;
- organization;
- valid_from/to;
- status;
- responsible customer user.

---

### TASK-09.02.02. Contract scopes

Acceptance Criteria:

- region/site;
- direction;
- asset type;
- action;
- validity.

---

## FEATURE-09.03. Contractor users

### TASK-09.03.01. Contractor creates subordinate user

Acceptance Criteria:

- created as PENDING;
- no operational permissions yet.

---

### TASK-09.03.02. Customer verifies contractor user

Acceptance Criteria:

- verified_by/at;
- assignment required;
- activation audited.

---

### TASK-09.03.03. Multi-organization user

Acceptance Criteria:

- one account;
- multiple contractor memberships;
- context switch;
- no cross-context leakage.

---

## FEATURE-09.04. Qualifications

Priority: P1

### TASK-09.04.01. Qualification types

Acceptance Criteria:

- expiry property;
- category;
- configurable.

---

### TASK-09.04.02. User qualifications

Acceptance Criteria:

- certificate;
- validity;
- document;
- verification.

---

### TASK-09.04.03. Work requirements

Acceptance Criteria:

- template/work type requirement;
- mandatory/recommended;
- assignment validation.

---

### TASK-09.04.04. Qualification expiry scheduler

Acceptance Criteria:

- warning before expiry;
- expired qualification no longer valid;
- notifications hook.

---

### TASK-09.04.05. Emergency exception

Acceptance Criteria:

- reason;
- approver;
- expiry;
- audit;
- no permanent bypass.

---

# EPIC-10. Inventory

Priority: P0

Goal:

Проводить реальные инвентаризации без Excel.

Dependencies:

```text
EPIC-03
EPIC-04
EPIC-01
```

---

## FEATURE-10.01. QR identification

### TASK-10.01.01. Public/opaque asset token

Acceptance Criteria:

- QR does not depend on mutable location;
- token revocable;
- no sensitive data leak.

---

### TASK-10.01.02. QR label generation

Acceptance Criteria:

- QR;
- asset code;
- manufacturer/model;
- serial;
- printable output.

---

## FEATURE-10.02. Inventory session

### TASK-10.02.01. Create session

Types:

```text
PLANNED_FULL
SELECTIVE
CATEGORY
SPECIAL
```

Acceptance Criteria:

- site;
- scope;
- participants;
- status.

---

### TASK-10.02.02. Snapshot expected items

Acceptance Criteria:

- expected asset;
- expected location;
- model;
- serial;
- immutable for session history.

---

## FEATURE-10.03. Scanning

### TASK-10.03.01. Scan known asset

Acceptance Criteria:

- user;
- timestamp;
- actual location;
- FOUND or WRONG_LOCATION;
- idempotent operation.

---

### TASK-10.03.02. Parallel participants

Acceptance Criteria:

- multiple users same session;
- no duplicate corruption;
- executor trace retained.

---

## FEATURE-10.04. Unknown asset

### TASK-10.04.01. Draft asset

Acceptance Criteria:

- nameplate photo;
- manufacturer/model;
- serial;
- actual location;
- comment;
- not official asset yet.

---

### TASK-10.04.02. Approve draft asset

Acceptance Criteria:

- engineer review;
- official asset created;
- QR generated;
- link to source inventory.

---

## FEATURE-10.05. Missing asset

### TASK-10.05.01. Generate missing discrepancy

Acceptance Criteria:

- only after scan completion/checkpoint;
- asset status unchanged;
- no auto-loss/decommission.

---

### TASK-10.05.02. Found later verification

Acceptance Criteria:

- photo;
- responsible confirmation;
- discrepancy resolved;
- history preserved.

---

## FEATURE-10.06. Inventory report

### TASK-10.06.01. Generate formal report

Includes:

```text
found
missing
wrong location
unknown
attribute mismatch
who checked
```

Acceptance Criteria:

- immutable generated version;
- approval;
- downloadable document.

---

# EPIC-11. Incidents

Priority: P1

Goal:

Создать отдельный контур аварийных/значимых событий.

Dependencies:

```text
EPIC-03
EPIC-01
EPIC-04
```

---

## FEATURE-11.01. Incident core

### TASK-11.01.01. Severity levels

Initial:

```text
P1
P2
P3
P4
```

Acceptance Criteria:

- rank;
- requires_review flag.

---

### TASK-11.01.02. Create incident

Acceptance Criteria:

- site;
- severity;
- description;
- business impact text;
- actual start optional;
- detected_at mandatory.

---

## FEATURE-11.02. Timeline

### TASK-11.02.01. Incident timeline

Acceptance Criteria:

- timestamp;
- event type;
- author;
- chronological view.

---

## FEATURE-11.03. Restoration states

### TASK-11.03.01. Record service restored

Acceptance Criteria:

- separate from technical resolution;
- timestamp immutable after close except controlled correction.

---

### TASK-11.03.02. Record technical resolution

Acceptance Criteria:

- technical_resolved_at separate;
- close can occur later.

---

## FEATURE-11.04. Post-incident review

### TASK-11.04.01. P1/P2 mandatory review

Acceptance Criteria:

- P1/P2 cannot final-close without review;
- P3/P4 can close after resolution;
- review stores lessons/actions text.

---

# EPIC-12. Changes & Risks

Priority: P1

Goal:

Поддержать межфункциональные изменения и технические окна.

Dependencies:

```text
EPIC-01
EPIC-03
EPIC-11 optional
```

---

## FEATURE-12.01. Change core

### TASK-12.01.01. Change entity

Acceptance Criteria:

- coordinator;
- site;
- title/description;
- planned dates;
- lifecycle;
- audit.

---

## FEATURE-12.02. Change tasks

### TASK-12.02.01. Child task per direction

Acceptance Criteria:

- IT/exploitation/security etc.;
- assigned team/user/contractor;
- independent status;
- linked parent change.

---

## FEATURE-12.03. Technical window

### TASK-12.03.01. Change window

Acceptance Criteria:

- start/end;
- status;
- approvals;
- one coordinator.

---

## FEATURE-12.04. Automatic risk

### TASK-12.04.01. Risk factors

Initial factors:

```text
site criticality
system criticality
redundancy placeholder
downtime
affected users
business impact
change type
```

Acceptance Criteria:

- deterministic calculation;
- versionable rule;
- result stored separately from expert risk.

---

## FEATURE-12.05. Expert risk

### TASK-12.05.01. Direction-specific assessments

Acceptance Criteria:

- multiple directions;
- independent scores;
- comments;
- assessor identity.

---

## FEATURE-12.06. Final decision

### TASK-12.06.01. Coordinator final risk

Acceptance Criteria:

- can differ from auto/max expert;
- if reduced → reason mandatory;
- audit explicitly marks reduction.

---

## FEATURE-12.07. Residual risk

### TASK-12.07.01. Formal acceptance

Acceptance Criteria:

- level;
- approver;
- timestamp;
- reason;
- policy can require for critical change.

---

## FEATURE-12.08. Rollback plan

### TASK-12.08.01. Conditional rollback requirement

Acceptance Criteria:

- mandatory according to risk/KVO policy;
- not required for trivial low-risk work;
- policy tested.

---

## FEATURE-12.09. Compensating hints

### TASK-12.09.01. Contextual recommendations

Priority: P1

Acceptance Criteria:

- non-blocking;
- shown during change/work planning;
- examples: physical guard/temp generator/temp cooling;
- no complex rule engine yet.

---

# EPIC-13. Reporting & Dashboards

Priority: P1

Goal:

Дать операционные и управленческие данные без ручного Excel.

Dependencies:

```text
EPIC-05
EPIC-06
EPIC-08
EPIC-10
```

---

## FEATURE-13.01. Operational dashboards

### TASK-13.01.01. Maintenance dashboard

Acceptance Criteria:

- today;
- overdue;
- upcoming;
- site/region filters;
- scope applied.

---

### TASK-13.01.02. Defect dashboard

Acceptance Criteria:

- open;
- severity;
- age;
- recurrence;
- region/site/type filters.

---

### TASK-13.01.03. Inventory dashboard

Acceptance Criteria:

- sessions;
- progress;
- discrepancies;
- missing count.

---

## FEATURE-13.02. Management reports

### TASK-13.02.01. Plan/fact maintenance

Acceptance Criteria:

- planned;
- completed;
- overdue;
- accepted;
- region/site drilldown.

---

### TASK-13.02.02. Labor plan/fact

Acceptance Criteria:

- planned person-hours;
- actual;
- contractor verification;
- filters.

---

## FEATURE-13.03. Export

### TASK-13.03.01. XLSX export

Acceptance Criteria:

- background job for large report;
- permission;
- scope;
- temporary file expiry;
- formula injection protection.

---

### TASK-13.03.02. PDF report

Acceptance Criteria:

- formal inventory/maintenance reports as required;
- generated asynchronously if heavy.

---

# EPIC-14. PWA / Offline

Priority: P1/P2

Goal:

Поддержать полевые работы без стабильного интернета.

Dependencies:

```text
stable EPIC-06
stable EPIC-10
```

---

## FEATURE-14.01. Offline work package

### TASK-14.01.01. Download assigned work orders

Acceptance Criteria:

- only authorized data;
- snapshot;
- expiration/retention;
- local storage.

---

## FEATURE-14.02. Offline checklist

### TASK-14.02.01. Save steps locally

Acceptance Criteria:

- results;
- measurements;
- comments;
- operation IDs;
- no data loss on refresh/app restart.

---

## FEATURE-14.03. Offline media

### TASK-14.03.01. Local photo queue

Acceptance Criteria:

- file queue;
- retry;
- upload progress;
- duplicate protection.

---

## FEATURE-14.04. Sync

### TASK-14.04.01. Push operations

Acceptance Criteria:

- operationId;
- idempotent;
- authorization rechecked;
- result per operation.

---

### TASK-14.04.02. Conflict handling

Acceptance Criteria:

- same-field conflict detected;
- no silent overwrite;
- UI offers resolution path.

---

## FEATURE-14.05. Offline inventory

### TASK-14.05.01. Offline scan queue

Acceptance Criteria:

- QR scan;
- location;
- timestamp;
- eventual sync;
- duplicates safe.

---

# EPIC-15. Production Hardening

Priority: P0 before broad rollout

Goal:

Подготовить систему к реальному масштабу.

Dependencies:

```text
MVP functional complete
```

---

## FEATURE-15.01. Observability

### TASK-15.01.01. Metrics

Acceptance Criteria:

- HTTP;
- DB;
- queue;
- workers;
- outbox;
- storage.

---

### TASK-15.01.02. Central logs

Acceptance Criteria:

- structured;
- correlation ID;
- no secrets;
- searchable.

---

### TASK-15.01.03. Tracing

Acceptance Criteria:

- HTTP → DB;
- HTTP → queue;
- worker spans;
- external dependency spans.

---

## FEATURE-15.02. Backup/restore

### TASK-15.02.01. PostgreSQL backup

Acceptance Criteria:

- automated;
- encrypted;
- retention configured;
- alerts on failure.

---

### TASK-15.02.02. Restore drill

Acceptance Criteria:

- documented;
- tested;
- measured restore time.

---

## FEATURE-15.03. Performance

### TASK-15.03.01. Medium dataset performance suite

Dataset:

```text
50 sites
10k assets
```

Acceptance Criteria:

- target API latency measured;
- query plans reviewed;
- no obvious N+1.

---

### TASK-15.03.02. Large dataset load suite

Target:

```text
5000 sites
500k+ assets
millions work records
```

Acceptance Criteria:

- search;
- dashboards;
- work list;
- inventory bursts;
- scheduler.

---

## FEATURE-15.04. Database scaling

### TASK-15.04.01. Index review

Acceptance Criteria:

- key filters indexed;
- redundant indexes reviewed;
- pg_stat_statements used if available.

---

### TASK-15.04.02. Partition high-volume tables

Only when measurements justify.

Candidates:

```text
measurements
audit
asset_events
```

Acceptance Criteria:

- migration tested;
- queries still correct;
- partition maintenance automated.

---

## FEATURE-15.05. Security hardening

### TASK-15.05.01. Permission matrix review

Acceptance Criteria:

- internal;
- manager;
- contractor A/B;
- auditor;
- admin;
- KVO documents.

---

### TASK-15.05.02. Security scanning

Acceptance Criteria:

- dependency scan;
- container scan;
- secret scan;
- critical CVE gate.

---

### TASK-15.05.03. Penetration test readiness

Acceptance Criteria:

- test environment;
- documented scope;
- logging enabled;
- known issues documented.

---

# EPIC-16. Notifications

Priority: P1

Goal:

Создать общий механизм уведомлений без жёсткой привязки бизнес-модулей к email.

Dependencies:

```text
EPIC-01
outbox
```

---

## FEATURE-16.01. In-app notifications

### TASK-16.01.01. Notification inbox

Acceptance Criteria:

- create;
- read/unread;
- entity link;
- user-specific scope.

---

## FEATURE-16.02. Notification rules

### TASK-16.02.01. Recipient resolver

Events:

```text
maintenance overdue
qualification expiring
contract expiring
critical defect
P1/P2 incident
risk acceptance required
```

Acceptance Criteria:

- domain module emits event;
- notification module resolves recipient;
- sender module remains decoupled.

---

# EPIC-17. Architecture Hooks — Implement Later

Priority: P2

Goal:

Зафиксировать будущие расширения, не реализуя их преждевременно.

---

## FEATURE-17.01. Redundancy model

Future entities:

```text
redundancy_groups
redundancy_members
required_configuration
```

Use cases:

```text
N+1
2N
loss of reserve
degraded state
```

---

## FEATURE-17.02. Business services

Future model:

```text
business service
asset dependency
service impact
```

---

## FEATURE-17.03. Impact Analysis

Future:

```text
asset
→ dependencies
→ redundancy
→ service
→ impact
```

---

## FEATURE-17.04. Knowledge Base

Future:

- articles;
- failures;
- diagnostics;
- model links;
- defect links;
- repair links.

---

## FEATURE-17.05. Telemetry

Future:

- source;
- point;
- reading;
- Modbus;
- SNMP;
- SCADA;
- API adapters.

Не смешивать высокочастотную телеметрию с ручными measurements.

---

## FEATURE-17.06. Warehouse

Future:

- stock;
- movements;
- reservations;
- ZИП.

Текущий material_usage остаётся фактом потребления.

---

## FEATURE-17.07. Finance

Future:

- tariffs;
- regional rates;
- contract rates;
- historical validity;
- work/material costs.

---

## FEATURE-17.08. RCA

Future:

- symptom;
- immediate cause;
- root cause;
- systemic relationships.

---

# 4. First Development Slice

Рекомендуемый первый вертикальный срез:

```text
Login
→ Site
→ Location
→ Asset Type
→ Manufacturer
→ Model
→ Asset
→ Asset Card
→ Asset Timeline
```

Он должен быть полностью production-quality по:

- permissions;
- audit;
- migrations;
- tests;
- API;
- UI.

Не делать сначала 50 таблиц без рабочего пользовательского потока.

---

# 5. Second Development Slice

```text
Maintenance Template
→ Frequency Rule
→ Asset Plan
→ Scheduler
→ WorkOrder
→ Checklist
→ Customer Acceptance
```

Это первый настоящий бизнес-MVP.

---

# 6. Third Development Slice

```text
Measurement
→ Out-of-range
→ Defect
→ Repair
→ Close
→ Asset History
```

---

# 7. Fourth Development Slice

```text
Inventory Session
→ QR
→ Scan
→ Wrong Location
→ Unknown Asset
→ Missing Asset
→ Report
```

---

# 8. Fifth Development Slice

```text
Contractor
→ Contract
→ Scope
→ Contractor User
→ Work Assignment
→ Execute Work
→ Customer Verification
```

---

# 9. Sixth Development Slice

```text
Incident P1/P2
+
Change
+
Risk
+
Technical Window
```

---

# 10. Recommended Codex Task Size

Одна задача для Codex должна обычно занимать один логический use case.

Хорошо:

```text
Implement CreateAsset command, endpoint, migration mappings and tests.
```

Плохо:

```text
Implement all asset management.
```

---

# 11. Standard Codex Task Template

Каждая задача, передаваемая Codex, должна содержать:

```text
Task ID
Goal
Business context
Module owner
Relevant docs
Existing entities
Required DB changes
API changes
Permissions
Audit requirements
Acceptance criteria
Tests
Out of scope
```

---

# 12. Example Codex Task

```text
TASK-03.04.01 — Create Asset

Goal:
Добавить создание оборудования.

Read first:
docs/concept.md
docs/architecture.md
docs/coding-standards.md
docs/database.md
docs/api-guidelines.md
docs/security.md
docs/testing.md

Business rules:
- asset belongs to one site;
- location must belong to same site;
- asset type must be active;
- model, if supplied, must belong to asset type;
- create AssetEvent CREATED;
- create audit event;
- contractor may create only if scope explicitly permits.

Required API:
POST /api/v1/assets

Required permission:
assets.create

Tests:
- success;
- wrong site/location;
- inactive type;
- model/type mismatch;
- no permission;
- wrong scope;
- audit created;
- event created.
```

---

# 13. MVP Release Criteria

MVP считается функционально готовым, когда на пилотном объекте можно:

1. Войти в систему.
2. Открыть объект.
3. Вести locations.
4. Добавить оборудование.
5. Связать составные активы.
6. Назначить ответственность.
7. Загрузить документы.
8. Создать регламент.
9. Автоматически получить план ТО.
10. Получить WorkOrder.
11. Выполнить чек-лист.
12. Добавить измерения.
13. Добавить фото.
14. Зафиксировать дефект.
15. Проверить работу заказчиком.
16. Провести инвентаризацию.
17. Получить историю актива.
18. Разделить внутреннего пользователя и подрядчика.
19. Проверить scope.
20. Получить базовый отчёт.

---

# 14. Pilot Exit Criteria

Пилот можно расширять, когда:

- нет критичных permission leaks;
- нет потери истории;
- backup восстановлен минимум один раз;
- основные E2E стабильны;
- пользователи могут провести ТО без Excel;
- инвентаризация проходит без ручного параллельного реестра;
- contractor scope работает;
- p95 ключевых API приемлем;
- monitoring работает;
- critical bugs имеют regression tests.

---

# 15. Что сознательно не входит в MVP

Не включать без отдельного решения:

- полноценный склад;
- predictive maintenance;
- SCADA;
- Modbus;
- SNMP;
- сложный DWH;
- Kubernetes;
- автоматический RCA;
- сложный BPMN;
- финансовый ERP;
- автоматическое влияние на бизнес-сервисы;
- автоматические блокирующие compensating rules;
- полную модель SLA договора;
- развитую knowledge base;
- детальную логистику инженеров.

---

# 16. Product Debt Register

Во время разработки решения категории:

```text
"архитектурно заложить, реализовать позже"
```

должны попадать в отдельный backlog с меткой:

```text
ARCH_HOOK
```

Примеры:

- site service windows;
- redundancy;
- impact analysis;
- cost tracking;
- travel time;
- RCA;
- telemetry;
- warehouse.

Это предотвращает их потерю, но не перегружает MVP.

---

# 17. Decision Rule

Если новая идея:

- не нужна для первого реального эксплуатационного цикла;
- не закрывает security/data integrity risk;
- не блокирует будущее расширение;

то она обычно:

```text
не входит в текущий sprint
```

а фиксируется как P1/P2.

---

# 18. Финальный принцип backlog

> Мы строим систему вертикальными законченными пользовательскими сценариями, а не слоями «сначала вся база, потом весь API, потом весь интерфейс».

Правильная последовательность:

```text
маленький бизнес-сценарий
→ БД
→ domain
→ API
→ permissions
→ audit
→ UI
→ tests
→ пользовательская проверка
```

После этого переходить к следующему сценарию.
