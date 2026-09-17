# Reference Data Registry — АС «Эксплуатация»

STATUS: WORKING SOURCE OF TRUTH
SOURCE_VERSION: 2026-09-16

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
| WorkingContextType | Identity | SYSTEM_ENUM | INTERNAL, CONTRACT, PROJECT, DELEGATION, TEAM | code change |
| SiteType | Sites | CONFIGURABLE_REFERENCE | retail office, admin building, warehouse, technical | yes |
| SiteCriticality | Sites | CONFIGURABLE_REFERENCE/HYBRID | NORMAL, KVO3, KVO2, KVO1 | yes, with rank |
| LocationType | Sites | CONFIGURABLE_REFERENCE | BUILDING, FLOOR, ROOM, RACK, AREA | yes |
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

Initial examples:

- IT
- EXPLOITATION
- SECURITY
- CYBERSECURITY
- REAL_ESTATE
- INFRASTRUCTURE_DEVELOPMENT
- RETAIL

Не hardcode в authorization/business logic.

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
- используется `is_active`;
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
