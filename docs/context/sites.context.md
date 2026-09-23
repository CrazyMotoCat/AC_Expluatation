# Sites Context Capsule

SOURCE_VERSION: 2026-09-23 (TASK-02.01.01 Phase C3R)
MODULE: Sites

## PURPOSE

Модуль Sites хранит физическую географию эксплуатации: территориальные зоны, регионы, объекты и внутреннюю иерархию locations. Тип объекта и его критичность являются независимыми характеристиками.

## OWNS

- Site
- TerritorialZone
- SiteType
- SiteCriticalityClass
- Location
- LocationType
- future SiteOperatingSchedule
- future SiteServiceWindow

Territorial Zone в текущем backlog contract принадлежит Sites; Region и Site строятся поверх этой иерархии. Organization остаётся отдельной границей для будущих организационных связей.

## DB

Основные таблицы:

- `sites.site_types`
- `sites.site_criticality_classes`
- `sites.sites`
- `sites.territorial_zones`
- `sites.audit_obligations`
- `sites.location_types`
- `sites.locations`
- future `sites.site_operating_schedules`
- future `sites.site_service_windows`

TerritorialZone IDs and Sites audit event IDs are UUIDv7. Zone command persistence derives the canonical action and allowlisted before/after payload from the operation; audit obligation binding is `territorial_zone_id` → `sites.territorial_zones.id`.

Phase C1 implements read/list/create/rename/activate/deactivate use cases and an unpersisted query DTO. All successful writes atomically leave exactly one matching `PENDING` obligation. The technical hosted dispatcher adds restart-safe at-least-once delivery: Sites persistence claims bounded batches with `FOR UPDATE SKIP LOCKED`, persists `claim_token`/bounded `lease_until`, commits before canonical Audit append, and uses token-checked completion/failure updates. A lease-expired claim is reclaimable; failed delivery persists bounded `next_attempt_at` backoff so poison rows do not starve newer obligations. Canonical Audit append preserves the stored payload/EventId, and only append success/idempotent success permits `PROCESSED`.

Failed delivery stays `PENDING`; `attempt_count` counts failed canonical append attempts and `last_error` is a bounded diagnostic code without exception messages, tokens or connection strings. PostgreSQL remains the durable source of truth; RabbitMQ is not in this correctness path.

## HIERARCHY

Физическая структура:

```text
Company
→ Territorial Zone
→ Region
→ Site
→ Location tree
```

Location tree может содержать:

```text
BUILDING
FLOOR
ROOM
RACK
AREA
PLATFORM
```

## SITE TYPES

Примеры:

- RETAIL_OFFICE
- ADMIN_BUILDING
- WAREHOUSE
- TECHNICAL_SITE

Тип объекта не определяет его критичность.

## CRITICALITY

Примеры:

- NORMAL
- KVO3
- KVO2
- KVO1

Критичность должна быть справочником с `rank`, а не hardcoded if/else по строкам.

## INVARIANTS

- Site принадлежит одному Region.
- Region принадлежит одной Territorial Zone.
- Site имеет один основной timezone.
- Site type и criticality — разные измерения.
- Location принадлежит ровно одному Site.
- Parent Location должен принадлежать тому же Site.
- Location tree не должен содержать циклы.
- Inactive location нельзя использовать для новых placements без специального процесса.
- Inactive/closed Site нельзя использовать для новых Assets/Work Orders.
- Territorial Zone creation starts `ACTIVE`; lifecycle removal is deactivation, not hard delete.
- Territorial Zone code is trimmed, invariant-uppercase, unique and immutable; name is trimmed, non-empty, maximum 200 and mutable.
- Перемещение Location не должно разрушать историю размещения Asset.
- Критичность объекта влияет на maintenance frequency/risk, но не должна дублироваться в каждом модуле как свободный текст.
- Working/service windows архитектурно поддерживаются, но не являются обязательным P0 функционалом.

## PERMISSIONS

Типовые:

- `sites.read`
- `sites.create`
- `sites.change`
- `sites.manage_locations`
- `sites.change_criticality`

Изменение criticality должно быть более ограничено, чем обычное редактирование карточки.

Territorial Zone API maps permissions exactly: list/get → `sites.read`, create → `sites.create`, rename/activate/deactivate → `sites.change`. Production grant evaluation remains deny-by-default; UserType, role name, JWT claims and working context do not grant permission. A validated request context may be copied only to obligation `acting_context_id` metadata. Mutations require explicit `expectedRowVersion`; stale writes fail with the standard 409 concurrency contract.

## PUBLIC CONTRACTS

Предпочтительные contracts:

- `SiteReference`
- `LocationReference`
- `SiteOperationalContext`
- `ISitesModule.GetSiteContext(siteId)`
- `ISitesModule.ValidateLocation(siteId, locationId)`

Другие модули не должны напрямую писать в `sites.*`.

## EVENTS

Полезные события:

- `SiteCreated`
- `SiteStatusChanged`
- `SiteCriticalityChanged`
- `LocationCreated`
- `LocationMoved`
- `LocationDeactivated`

## DEPENDS_ON

Допустимо:

- Organization contracts;
- Identity authorization abstractions;
- shared clock/audit abstractions.

## USED_BY

- Assets — site/location placement;
- Maintenance — site criticality and future service windows;
- Inventory — expected/actual location;
- Changes — site risk context;
- Incidents — incident site;
- Contractors — contract scopes.

## KVO RULE

Если операция затрагивает KVO:

- не придумывать автоматически дополнительные approvals;
- проверить documented policy;
- пометить `KVO_EXTRA_POLICY: CHECK_REQUIRED`, если правило ещё не определено.

## HISTORY

Изменение адреса, criticality или структуры location при необходимости должно сохранять audit/history. Не заменять историю только текущим значением, если изменение влияет на эксплуатационные решения.

## FORBIDDEN

- кодировать criticality строковыми if по всему проекту;
- смешивать SiteType и criticality;
- создавать asset location вне Site;
- допускать cyclic location tree;
- удалять Site с историческими Assets/WorkOrders;
- хранить working hours как случайный JSON внутри Site без модели;
- давать module прямой write access в `sites` schema.

## TOP_TEST_RISKS

- location from another site;
- cyclic location move;
- create asset on inactive site;
- wrong region scope;
- contractor access to site outside contract;
- KVO criticality change without permission;
- timezone-sensitive scheduling;
- inactive location selected by UI but rejected backend.
