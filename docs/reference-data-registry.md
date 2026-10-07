# Reference Data Registry — АС «Эксплуатация»

STATUS: WORKING SOURCE OF TRUTH
SOURCE_VERSION: 2026-10-08 (TASK-02.02.02 FunctionalDirection owner decisions through OD-06)

## 1. Назначение

Реестр определяет:

- какие значения являются системными enum/status;
- какие должны быть настраиваемыми справочниками;
- кто владеет справочником;
- можно ли деактивировать значение;
- допускается ли расширение без изменения кода.

## 2. Категории

### SYSTEM_ENUM

Сильно влияет на код/lifecycle.

Изменение требует разработки/tests.

### CONFIGURABLE_REFERENCE

Хранится в БД.

Можно добавлять/деактивировать через master-data process.

### HYBRID

Код знает семантическую категорию, но display/reference данные могут храниться в БД.

---

# 3. Registry

| Reference | Owner | Type | Initial values / examples | Extensible |
|---|---|---|---|---|
| UserType | Identity | SYSTEM_ENUM | INTERNAL, CONTRACTOR, SYSTEM | limited |
| UserStatus | Identity | SYSTEM_ENUM | ACTIVE, INACTIVE | controlled |
| WorkingContextType | Identity | SYSTEM_ENUM | INTERNAL, CONTRACT, PROJECT, DELEGATION, TEAM | code change |
| SiteType | Sites | CONFIGURABLE_REFERENCE | RETAIL_OFFICE, ADMIN_BUILDING, WAREHOUSE, TECHNICAL_SITE | yes |
| SiteCriticality | Sites | CONFIGURABLE_REFERENCE/HYBRID | NORMAL, KVO3, KVO2, KVO1 | yes, with rank |
| LocationType | Sites | CONFIGURABLE_REFERENCE | BUILDING, FLOOR, ROOM, RACK, AREA | yes |
| OrganizationalUnitType | Organization | CONFIGURABLE_REFERENCE | DEPARTMENT, DIVISION, DIRECTION, SECTION, FRONT_OFFICE, BACK_OFFICE, MANAGEMENT | yes |
| FunctionalDirection | Organization | CONFIGURABLE_REFERENCE | IT, EXPLOITATION, SECURITY, CYBERSECURITY, REAL_ESTATE, INFRASTRUCTURE_DEVELOPMENT, RETAIL | yes |
| AssetType | Assets | CONFIGURABLE_REFERENCE | UPS, DGU, AC, panel, server, switch, fire detector | yes |
| Manufacturer | Assets | CONFIGURABLE_REFERENCE | vendor names | yes |
| AssetModel | Assets | CONFIGURABLE_REFERENCE | model catalog | yes |
| AssetLifecycleStatus | Assets | SYSTEM_ENUM | PLANNED, INSTALLED, COMMISSIONED, IN_OPERATION, RESERVE, REPAIR, DECOMMISSIONED, DISPOSED | controlled |
| AssetTechnicalCondition | Assets | HYBRID | NORMAL, ATTENTION, DEGRADED, FAULT, CRITICAL, UNKNOWN | controlled |
| AssetRelationType | Assets | CONFIGURABLE_REFERENCE/HYBRID | POWERS, COOLS, CONTROLS, SENDS_DATA, DEPENDS_ON, PARENT_CHILD | yes |
| ResponsibilityType | Assets | CONFIGURABLE_REFERENCE | OWNER, BALANCE_HOLDER, FUNCTIONAL_OWNER, TECHNICAL_OWNER, SERVICE_PROVIDER, ASSIGNED_USER, CURATOR, APPROVER | yes |
| ReplacementType | Assets | SYSTEM_ENUM | LIKE_FOR_LIKE, FUNCTIONAL_EQUIVALENT, CONFIGURATION_CHANGE | controlled |
| DocumentType | Documents | CONFIGURABLE_REFERENCE | PASSPORT, MANUAL, SCHEME, ACT, WARRANTY, REPORT | yes |
| DocumentClassification | Documents | SYSTEM_ENUM/HYBRID | PUBLIC, INTERNAL, RESTRICTED, CRITICAL | controlled |
| AttachmentType | Documents | SYSTEM_ENUM | GENERAL, BEFORE, AFTER, NAMEPLATE, DEFECT, MEASUREMENT, DOCUMENT | controlled |
| MaintenanceLevel | Maintenance | CONFIGURABLE_REFERENCE/HYBRID | TO1, TO2, TO3, SEASONAL, MAJOR | yes, with rank |
| MaintenanceOperationType | Maintenance | SYSTEM_ENUM | CHECK, BOOLEAN, NUMBER, TEXT, SELECT, PHOTO, MEASUREMENT | code change |
| OperationRequirementType | Maintenance | SYSTEM_ENUM | REQUIRED, CONDITIONAL, RECOMMENDED, CONTROL | code change |
| OperationCriticality | Maintenance | SYSTEM_ENUM | MINOR, IMPORTANT, CRITICAL | controlled |
| FrequencyRuleType | Maintenance | SYSTEM_ENUM | CALENDAR initially | future: METER, COMBINED, SEASONAL, EVENT |
| WorkOrderStatus | WorkOrders | SYSTEM_ENUM | see lifecycle-registry | controlled |
| WorkOrderParticipantRole | WorkOrders | CONFIGURABLE_REFERENCE/HYBRID | OWNER, EXECUTOR, REVIEWER, APPROVER, COORDINATOR | controlled |
| FinalTechnicalCondition | WorkOrders | SYSTEM_ENUM | IN_OPERATION, REPAIR_REQUIRED, FAILED, IN_OPERATION_WITH_NON_BLOCKING_DEFECTS | controlled |
| MeasurementEvaluation | Measurements | SYSTEM_ENUM | NORMAL, WARNING, OUT_OF_RANGE, CRITICAL, UNKNOWN | controlled |
| UnitOfMeasure | Shared/Measurements | CONFIGURABLE_REFERENCE | V, A, Ohm, kOhm, °C, bar, %, h | yes |
| DefectSeverity | Defects | CONFIGURABLE_REFERENCE/HYBRID | project-defined levels | yes with rank |
| DefectStatus | Defects | SYSTEM_ENUM | OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED | controlled |
| InventorySessionType | Inventory | SYSTEM_ENUM | PLANNED_FULL, SELECTIVE, CATEGORY, SPECIAL | controlled |
| InventoryObservationResult | Inventory | SYSTEM_ENUM | FOUND, FOUND_WRONG_LOCATION, UNKNOWN_ASSET, DATA_MISMATCH | controlled |
| InventoryDiscrepancyType | Inventory | SYSTEM_ENUM | MISSING, WRONG_LOCATION, UNKNOWN, ATTRIBUTE_MISMATCH | controlled |
| DraftAssetStatus | Inventory | SYSTEM_ENUM | DRAFT, SUBMITTED, APPROVED, REJECTED | controlled |
| ContractStatus | Contractors | SYSTEM_ENUM | DRAFT, ACTIVE, SUSPENDED, EXPIRED, CLOSED | controlled |
| ContractorMembershipStatus | Contractors | SYSTEM_ENUM | PENDING_VERIFICATION, ACTIVE, SUSPENDED, REJECTED | controlled |
| QualificationType | Qualifications | CONFIGURABLE_REFERENCE | electrical safety, manufacturer certification, etc. | yes |
| IncidentSeverity | Incidents | SYSTEM_ENUM/HYBRID | P1, P2, P3, P4 | controlled |
| ChangeRiskLevel | Changes | PROVISIONAL HYBRID | LOW, MEDIUM, HIGH, CRITICAL candidate | not yet canonical |

## 4. Functional Directions

Owner: Organization

Type:

```text
CONFIGURABLE_REFERENCE
```

TASK-02.02.02 / OD-FUNCTIONAL-DIRECTION-01..06: local candidate with local validation PASS, pending
independent review and publication. Exactly seven ACTIVE seeds,
each name == code:

| Code | Stable UUIDv7 seed ID |
|---|---|
| IT | 0199e3b0-0000-7000-8000-000000000001 |
| EXPLOITATION | 0199e3b0-0000-7000-8000-000000000002 |
| SECURITY | 0199e3b0-0000-7000-8000-000000000003 |
| CYBERSECURITY | 0199e3b0-0000-7000-8000-000000000004 |
| REAL_ESTATE | 0199e3b0-0000-7000-8000-000000000005 |
| INFRASTRUCTURE_DEVELOPMENT | 0199e3b0-0000-7000-8000-000000000006 |
| RETAIL | 0199e3b0-0000-7000-8000-000000000007 |

Runtime IDs are UUIDv7. Code is required, trim + invariant uppercase,
immutable, globally unique, max 50, regex `^[A-Z0-9][A-Z0-9_-]{0,49}$`.
Name is required, trimmed, mutable, non-unique, max 200. The sole lifecycle
field is status ACTIVE/INACTIVE; create ACTIVE, no description/is_active or
hard delete. Inactive values remain resolvable for existing references but
cannot be selected for new references. The Organization Application reference
provider returns immutable trusted facts and null for missing; it is not
an end-user authorization service.

GET `/api/v1/reference/functional-directions` returns both statuses, unpaged,
ordered code/id. OD-05 currently requires a current explicit GLOBAL
`organization.read` OR GLOBAL `organization.manage_functional_directions`,
canonical ACTIVE INTERNAL local user and owned current INTERNAL context.
Concrete/composite assignments are insufficient. Management detail/create/
name-only update/activate/deactivate require GLOBAL management only. The new
canonical permission seeds no assignments or grants. Company/unit scoped
Organization reads remain deferred. See `modules/organization.md`.

Не hardcode в authorization/business logic.

## 4.1. Organizational Unit Types

Owner: Organization

Type:

```text
CONFIGURABLE_REFERENCE
```

The reference uses UUIDv7 `id`, immutable canonical uppercase `code`, mutable
`name` and `ACTIVE`/`INACTIVE` lifecycle. Inactive values remain available for
history but cannot be selected for new OrganizationalUnits and are never
hard-deleted. Initial controlled values are:

```text
DEPARTMENT
DIVISION
DIRECTION
SECTION
FRONT_OFFICE
BACK_OFFICE
MANAGEMENT
```

The Phase B1 migration seeds exactly these codes with stable UUIDv7 IDs.
Until separate display labels are approved, each initial `name` equals its
canonical registry code; future names remain mutable reference data.

## 4.2. Site Types

Owner: Sites. `SiteType` is a database-backed configurable reference, separate
from `SiteCriticality`. The initial seed is exactly:

| Code | Name |
|---|---|
| RETAIL_OFFICE | Торговый офис |
| ADMIN_BUILDING | Административное здание |
| WAREHOUSE | Склад |
| TECHNICAL_SITE | Технический объект |

`CUSTOM` and any other values are not part of the initial seed. These four
codes are not an exhaustive enum; business logic must not branch on them as
the complete set. New values can be stored in the same Sites-owned reference
model. UUIDv7 `id`, immutable globally unique canonical `code`, mutable
`name`, and `ACTIVE`/`INACTIVE` status follow the existing reference pattern.
Creation starts `ACTIVE`; hard delete is forbidden. `INACTIVE` values remain
readable and valid for existing historical references. Eligibility of an
inactive type for a new or changed Site assignment is forbidden by the
`TASK-02.03.03` Phase A contract; an existing Site may retain it.

`TASK-02.03.01` supplies persistence, deterministic seed and a read endpoint
under SITE-REF-AUTH-01 catalog authorization (Sites module contract). A management API, mutation permissions and audit
obligations for SiteType are deferred to a separate future task.

## 4.3. Site Criticality

Owner: Sites. `SiteCriticalityClass` is an extensible database reference in
`sites.site_criticality_classes`, independent of SiteType. PostgreSQL is its
source of truth. The initial seed is exactly:

| Code | Name | Rank | Initial status | Fixed UUIDv7 seed ID |
|---|---|---:|---|---|
| NORMAL | Обычный | 0 | ACTIVE | `0199d36e-0000-7001-8000-000000000001` |
| KVO3 | КВО-3 | 10 | ACTIVE | `0199d36e-0000-7001-8000-000000000002` |
| KVO2 | КВО-2 | 20 | ACTIVE | `0199d36e-0000-7001-8000-000000000003` |
| KVO1 | КВО-1 | 30 | ACTIVE | `0199d36e-0000-7001-8000-000000000004` |

Higher persisted integer rank means higher criticality. Rank is non-negative
and unique across this catalog, including inactive rows. Code is canonical
uppercase, immutable and unique; fixed UUIDv7 seed IDs use the SiteType
mechanism with a distinct `7001` namespace. Names are required and mutable
only through a future management capability. Description is optional; initial descriptions
may be NULL. These seeds are not a closed enum, and code/ordinal ordering is
not a business comparison rule.

Lifecycle is `ACTIVE`/`INACTIVE`, with no hard delete or cascade. Inactive
classes remain valid for existing references and visible in the read catalog;
new Site assignments reject them under the `TASK-02.03.03` Phase A contract.
`TASK-02.03.02`
implements a read-only `GET /api/v1/reference/site-criticality-classes` under
SITE-REF-AUTH-01 catalog authorization (Sites module contract), returning both statuses. Runtime management, mutation audit
actions and mutation permissions are not included. Extensions require an
explicit future migration/release or separate management task. Phase B
persistence and migration are implemented; the read API is implemented in Phase C.

## 4.4. Location Types

Owner: Sites. `LocationType` is a global database-backed configurable reference
in `sites.location_types`, separate from Site-owned Location instances and their
tree. LOCATION-TYPE-01 seeds exactly these five ACTIVE values with fixed UUIDv7
IDs; they are an initial set, not a closed enum:

| Code | Name | Fixed UUIDv7 seed ID |
|---|---|---|
| BUILDING | Здание | `0199d36e-0000-7002-8000-000000000001` |
| FLOOR | Этаж | `0199d36e-0000-7002-8000-000000000002` |
| ROOM | Помещение | `0199d36e-0000-7002-8000-000000000003` |
| RACK | Стойка | `0199d36e-0000-7002-8000-000000000004` |
| AREA | Зона | `0199d36e-0000-7002-8000-000000000005` |

`PLATFORM` is not seeded. ID is UUIDv7. Code is required, trimmed, uppercase,
immutable, globally unique, at most 50 characters and matches
`^[A-Z][A-Z0-9_]{0,49}$`. Name is required, trimmed and at most 200;
description is optional, trimmed and at most 500. Status is ACTIVE/INACTIVE;
hard delete is forbidden. A required `row_version` is stored for future
management concurrency. Generic creation/update timestamps and a parent type
are not part of this model. Inactive values remain readable for existing
historical references; future new/changed Location assignments require ACTIVE.

The published slice has only `GET /api/v1/reference/location-types`, returning
the complete global catalog ordered by code then ID. Runtime create/update,
activate/deactivate, mutation audit and management permission are deferred to
a separate contract. Catalog read has the fixed permission union described in
the Sites module and security docs; it grants no Location or Site operation.

## 5. Units of Measure

Units должны иметь минимум:

- code;
- symbol;
- quantity type;
- scale/conversion metadata if conversion supported.

Не использовать display string как единственный identity.

Пример:

```text
V
mV
A
mA
Ohm
mOhm
kOhm
°C
bar
kPa
%
h
min
```

## 6. Deactivation

Для CONFIGURABLE_REFERENCE:

- запись обычно не удаляется;
- lifecycle field follows the accepted module contract: `status` ACTIVE/INACTIVE
  for FunctionalDirection and other references documented above; `is_active`
  only where that field is explicitly specified;
- исторические записи продолжают ссылаться на inactive value;
- inactive value нельзя выбирать для новых объектов.

## 7. Localization

Canonical code хранится независимо от display name.

Пример:

```text
code = KVO1
display_ru = КВО-1
```

## 8. Правило enum vs reference

Использовать SYSTEM_ENUM, если значение:

- влияет на code branching;
- является частью lifecycle;
- требует обязательных tests при расширении.

Использовать CONFIGURABLE_REFERENCE, если:

- бизнесу нужно добавлять значения без deploy;
- значение в основном классификационное;
- код не должен знать конкретный список.

## 9. Запрещено

- свободный текст там, где нужен справочник;
- hardcoded functional directions по проекту;
- удаление reference value, на которое ссылается история;
- хранить display name вместо canonical code;
- превращать every lookup в compile-time enum.
