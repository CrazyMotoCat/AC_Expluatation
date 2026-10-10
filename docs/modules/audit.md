# Module: Audit

STATUS: FOUNDATION EXTENDED
SOURCE_VERSION: 2026-10-10 (published AssetType + local Manufacturer canonical extension)

## Purpose

Audit хранит доказуемые технические факты действий пользователя отдельно от business history (ADR-008). Минимальный foundation добавлен в `TASK-01.03.02`; `TASK-01.04.01` расширяет тот же механизм единым generic append contract.

## Ownership and database

Audit владеет `audit.events`, `AuditDbContext`, собственной migration и `audit.__ef_migrations_history` по ADR-010. Audit.Contracts владеет `IAuditWriter`, `AuditEventDraft`, а также canonical `AuditAction` и `AuditEntityType`; Identity использует typed adapter, не обращаясь к Audit DbContext/schema напрямую.

`audit.events` содержит event ID UUIDv7, timestamp, actor user ID, acting context ID, correlation ID, action, entity type/ID и optional before/after JSON, reason, IP/user agent. Persistent action/entity identifiers принадлежат Audit, case-sensitive и не выводятся из CLR names; каталог включает `WorkingContextSelected`, `WorkingContextApplied`, `UserContext` и `TerritorialZone` actions/entity. `IAuditWriter.AppendAsync` принимает обязательный caller-supplied UUIDv7 EventId, проверяет actor, correlation, каталог и structured JSON payload до INSERT; before/after ограничены 64 KiB UTF-8 без silent truncation. Повторная доставка с тем же EventId и тем же immutable content завершается no-op, конфликт content отклоняется. JWT, tokens, passwords и secrets не записываются. PostgreSQL triggers отклоняют UPDATE, DELETE и TRUNCATE; EF context также отвергает tracked update/delete. Migration `Down` запрещает автоматическое удаление истории без отдельного retention/archival плана. Durable business mutations follow ADR-011: the owning module commits a durable audit obligation in its own transaction, then Audit materialization is at-least-once and idempotent by stable event ID. UUIDv7 guard добавлен отдельной additive migration.

## Current writer contract

TASK-02.04.02 adds canonical entity `Location` and five actions:
`LocationCreated`, `LocationUpdated`, `LocationMoved`, `LocationActivated`,
`LocationDeactivated`. Payloads use the fixed allowlisted Location snapshot
fields: locationId, siteId, parentLocationId, locationTypeId, code, name,
description, status and rowVersion. Create has no before snapshot; mutations
retain before/after snapshots, and move retains its required reason. Actor, context, timestamp,
correlation and stable EventId remain canonical metadata. Each successful
mutation commits exactly one Sites-owned durable obligation with its state;
the existing AuditDelivery claim/lease/idempotency path materializes it.
No Location business-history store or integration-event publication is added.

Region is a canonical Audit entity. Its actions are `RegionCreated`, `RegionUpdated`, `RegionActivated`, and `RegionDeactivated`; Region before/after payloads use an explicit allowlist. Region obligations use the same Sites-owned durable obligation and `Exploitation.AuditDelivery` path as Territorial Zone.

`TASK-02.03.03` Phase B1 registers canonical Audit entity `Site` and
actions `SiteCreated`, `SiteUpdated`, `SiteActivated`, `SiteDeactivated`,
`SiteCriticalityChanged` in the runtime Audit catalog. `SiteCreated` has no before payload and permits siteId, code,
name, regionId, siteTypeId, criticalityClassId, addressText, timezone and
status in after. `SiteUpdated` records changed fields only from name,
siteTypeId, addressText and timezone in matching before/after objects; a
SiteType change uses this action. Lifecycle before/after objects record
previousStatus/newStatus respectively; criticality before/after objects
record previousCriticalityClassId/newCriticalityClassId respectively. The
established immutable
Audit actor, context, timestamp, correlation, entity ID and EventId fields
remain separate. Secrets and infrastructure metadata are excluded. Each
successful Site mutation must atomically commit one Sites-owned obligation;
an additive `site_id` binding and allowlist extension will reuse
`Exploitation.AuditDelivery`, with no second outbox. Audit validates Site
action/entity pairing and per-action payload field shapes. PostgreSQL protects
the Site binding and immutable obligation payload while delivery metadata
continues to follow the existing claim/lease/retry protocol.

The runtime action/entity compatibility catalog now includes the canonical
Region and Site action sets. Site payload validation is action-specific;
SiteCreated, SiteUpdated, lifecycle and criticality events each accept only
their frozen field shape.

`IAuditWriter.AppendAsync(AuditEventDraft, CancellationToken)` — единый Audit-owned durable append contract. Draft требует UUIDv7 EventId, local user ID, correlation ID, canonical action/entity и entity ID для текущих entity-bound actions; acting context остаётся optional по существующей semantics. Повторный append с тем же EventId и идентичным immutable content безопасен, а другой content для существующего EventId является integrity conflict. Before/after optional, но для `UserContext`, `TerritorialZone`, `Region` и `OrganizationalUnit` должны быть object JSON только с canonical allowlisted fields, соответствующим snapshot semantics, и не превышать 64 KiB UTF-8.

Sites, Organization and Assets obligations materialize through `Exploitation.AuditDelivery`,
a technical component outside their domains. It reads each Application delivery port
and calls the same `IAuditWriter`; Audit Infrastructure remains private to Audit
registration/persistence. Claims are short-lived and durable (`claim_token`, `lease_until`,
`next_attempt_at`); Audit append runs outside each source claim transaction, and a
conflicting same-ID event is rejected and never authorizes processed acknowledgement.
Three independently bounded polling loops give every module a processing opportunity
when another source fails. Delivery remains at-least-once with stable EventId idempotency.

Published ASSET-TYPE-01 adds canonical entity AssetType and actions AssetTypeCreated,
AssetTypeUpdated, AssetTypeReparented, AssetTypeActivated, AssetTypeDeactivated.
Assets owns durable obligations and commits them atomically with type mutation;
`IAssetsAuditObligationDeliveryStore` and `AssetsAuditObligationDispatcher` reuse
the published claim/lease/fencing/backoff pattern. Snapshot JSON has only id,
parentAssetTypeId, functionalDirectionId, code, name, isSystemType, isComponentType,
status and rowVersion, validated by Audit-owned allowlist/UUIDv7/shape rules.
Before/after record authoritative old/new parenting; reason is required for reparent.
No read/failed mutation success Audit or business-history subsystem is added.
This canonical contract extension requires no Audit schema/migration change.

MANUFACTURER-01 adds canonical entity Manufacturer and actions ManufacturerCreated,
ManufacturerUpdated, ManufacturerVerified, ManufacturerVerificationRevoked,
ManufacturerActivated and ManufacturerDeactivated. Audit.Contracts validates the
allowlisted snapshot fields id, name, normalizedName, verificationStatus,
lifecycleStatus, verifiedBy, verifiedAt, createdAt, updatedAt and rowVersion.
Assets owns each durable obligation and commits it atomically with Manufacturer
state; the existing Assets delivery port, leases/fencing and canonical Audit writer
materialize it idempotently. This is a local unpublished contract extension and adds
no Audit schema/migration, second delivery mechanism or business-history store.

`TASK-02.02.01` Phase A freezes the additive Organization extension: the
canonical entity is `OrganizationalUnit`, with actions
`OrganizationalUnitCreated`, `OrganizationalUnitUpdated`,
`OrganizationalUnitReparented`, `OrganizationalUnitActivated` and
`OrganizationalUnitDeactivated`. Organization owns its durable obligations
and commits each obligation atomically with the business mutation; it never
writes `sites.audit_obligations` or `audit.events`. C2 implements an
explicit Organization Application delivery port, an Organization-owned
PostgreSQL claim/lease/retry store and the Audit canonical action/entity and
payload allowlists. The same writer retains global EventId conflict semantics.

TASK-02.02.02 publishes canonical entity `FunctionalDirection` and
actions `FunctionalDirectionCreated`, `FunctionalDirectionUpdated`,
`FunctionalDirectionActivated`, `FunctionalDirectionDeactivated`; independent
review PASS, published after exact-SHA hosted CI PASS. Before/after snapshots allow only code, name
and status; ID, actor, context, time, correlation and stable EventId remain
canonical metadata. Organization commits a matching durable obligation
atomically with each successful mutation and reuses its existing Application
delivery port/claim/lease/retry store and the same canonical IAuditWriter.
Reads and denied/failed/stale/duplicate commands create no successful mutation
audit. No FunctionalDirection business-history store or integration event is added.

`IWorkingContextAuditWriter.WriteSelectedAsync` и `WriteAppliedAsync` сохранены как typed adapters и используют только `IAuditWriter`. `WorkingContextSelected` создаётся для POST body, `WorkingContextApplied` — для валидного request header. Оба содержат actor local user ID, `acting_context_id`/`entity_id`, occurred_at, after JSON с context ID и request correlation.

Контекст request-scoped, Identity selection state не мутирует. POST игнорирует header и аудирует выбор body ровно один раз. Другой запрос с `X-Work-Context-Id` аудирует применение до endpoint, включая первый запрос без POST. Контекст предоставляется endpoint только после `AuditDbContext.SaveChangesAsync`; при сбое Audit endpoint не выполняется. Cross-module transaction не требуется, поскольку в Identity нет изменяемого selection state.

## Critical command coverage

Текущий реализованный critical command — `POST /api/v1/me/context`; он проходит через canonical `IAuditWriter` и не возвращает success при ошибке durable audit. `WorkingContextApplied` остаётся security-sensitive audit event, но не command. Будущие state-changing critical commands должны подключаться к этому contract в своих backlog tasks. Generic writer не обещает cross-module atomicity; для первого command с durable business mutation atomicity определяется в его собственной Task.

## Tests

- пустая PostgreSQL → Audit migration → повторное применение без дубликатов;
- Audit-owned schema/history и append-only triggers;
- durable writer round-trip и запрещённые UPDATE/DELETE/TRUNCATE;
- automatic migration rollback rejected without loss of existing events;
- Identity self-service selection → реальный Audit event;
- first-use header → `WorkingContextApplied` до endpoint; POST → ровно один `WorkingContextSelected`;
- HTTP audit failure → 503, без успешного выбора.
- generic valid append with optional acting context;
- required metadata, unknown catalog identifiers, malformed/oversized JSON rejection;
- adapter payload contains only allowlisted context fields.
- Sites obligation delivery preserves stable EventId and immutable payload, survives restart/crash window, rejects conflicting content and remains correct with concurrent dispatchers.

## Deferred extension points

Retention, partitioning, query/admin API, UI, exports, reporting, analytics, search и system actor model остаются deferred. Application logs и business history не заменяют `audit.events`.
