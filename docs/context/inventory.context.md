# Inventory Context Capsule

SOURCE_VERSION: 2026-09-16
MODULE: Inventory
MATURITY: STABLE

## PURPOSE

Inventory управляет инвентаризационными сессиями, snapshot ожидаемого состава оборудования, параллельным сканированием, расхождениями, неизвестными активами, отсутствующими активами и формальным итоговым отчётом.

## OWNS

- InventorySession
- InventoryScope
- InventoryExpectedItem
- InventoryParticipant
- InventoryObservation
- InventoryDiscrepancy
- DraftAsset
- InventoryReport

## DB

Основные таблицы:

- `inventory.sessions`
- `inventory.scopes`
- `inventory.expected_items`
- `inventory.participants`
- `inventory.observations`
- `inventory.discrepancies`
- `inventory.draft_assets`
- `inventory.reports`

## INVARIANTS

- Inventory session создаёт immutable snapshot ожидаемых items на начало проверки.
- Expected state не должен «плыть» вслед за последующими изменениями master data.
- Несколько пользователей могут работать параллельно в одной session.
- Scan operation должна быть idempotent.
- FOUND и FOUND_WRONG_LOCATION различаются.
- Unknown asset не становится официальным Asset автоматически.
- Unknown asset сначала создаётся как DraftAsset.
- Missing expected asset не переводится автоматически в LOST/DECOMMISSIONED.
- Missing создаёт discrepancy и процесс расследования.
- Если missing asset найден позже, требуется подтверждение/верификация, история сохраняется.
- Inventory хранит факт проверки как историческое событие, а не только `last_inventory_at`.
- Итоговый report объединяет все результаты session.
- Report после approval immutable либо versioned.
- Участник/исполнитель каждого observation должен сохраняться.
- Scope может быть полным, выборочным, категорийным или специальным.
- QR payload должен использовать стабильный opaque/public token, не mutable location text.

## SESSION TYPES

- PLANNED_FULL
- SELECTIVE
- CATEGORY
- SPECIAL

## SESSION LIFECYCLE

Базово:

```text
DRAFT
→ PREPARED
→ IN_PROGRESS
→ SCAN_COMPLETED
→ REPORT_GENERATED
→ APPROVED
```

Точные названия можно уточнить при реализации.

Нельзя добавлять status без lifecycle review.

## EXPECTED SNAPSHOT

Для каждого expected item сохранять минимум:

- asset_id;
- expected_location_id;
- expected_model_id;
- expected_serial_number;
- initial status.

Snapshot нужен для доказуемости результата.

## OBSERVATION RESULTS

Минимум:

- FOUND
- FOUND_WRONG_LOCATION
- UNKNOWN_ASSET
- DATA_MISMATCH

Missing обычно определяется после завершения/checkpoint, а не отдельным scan observation.

## DISCREPANCY TYPES

- MISSING
- WRONG_LOCATION
- UNKNOWN
- ATTRIBUTE_MISMATCH

## UNKNOWN ASSET FLOW

```text
scan/nameplate/photo
→ DraftAsset
→ engineer review
→ approved Asset
→ QR generated
```

DraftAsset должен хранить:

- site/location;
- photo;
- manufacturer/model text;
- serial;
- description;
- submitter;
- review state.

## MISSING ASSET FLOW

```text
expected item not observed
→ discrepancy MISSING
→ investigation / financial-property incident if needed
→ no automatic decommission
```

Если найден:

```text
photo/verification
→ discrepancy resolved
→ history preserved
```

## PARALLEL INVENTORY

Session поддерживает:

- нескольких participants;
- разделение scope;
- одновременное сканирование;
- merge результатов.

Duplicate scan не должен повреждать session.

## PERMISSIONS

Типовые:

- `inventory.read`
- `inventory.create`
- `inventory.execute`
- `inventory.manage_scope`
- `inventory.finish_scan`
- `inventory.generate_report`
- `inventory.approve`
- `inventory.review_draft_asset`

Scope минимум:

- site;
- asset type / functional direction при выборочной проверке;
- working context.

## PUBLIC CONTRACTS

Полезные:

- `InventorySessionReference`
- `InventoryResultSummary`
- `IInventoryModule.GetLatestVerification(assetId)`
- `InventoryDiscrepancyReference`

## EVENTS

Основные:

- `InventorySessionStarted`
- `AssetObservedInInventory`
- `InventoryDiscrepancyCreated`
- `DraftAssetSubmitted`
- `DraftAssetApproved`
- `InventoryReportGenerated`
- `InventoryReportApproved`

## DEPENDS_ON

Допустимо:

- Assets.Contracts;
- Sites.Contracts;
- Documents contracts;
- Identity authorization;
- Incidents contract for missing-property incident if implemented;
- shared audit/outbox.

## REPORT

Итоговый report должен включать:

- found;
- missing;
- wrong location;
- unknown;
- changed attributes;
- who checked;
- unresolved discrepancies.

Approved report не перезаписывается молча.

## QR

QR должен быть стабильным и не содержать изменяемое location как identity.

При unexpected location создаётся discrepancy/change request, а не silent update.

## AUDIT

Критичные действия:

- session start;
- scope change;
- finish scan;
- approve draft asset;
- resolve missing discrepancy;
- approve report.

## FORBIDDEN

- авто-decommission missing Asset;
- создавать официальный Asset прямо при первом unknown scan;
- изменять expected snapshot после старта;
- делать session single-user only;
- хранить только финальный count без item-level history;
- QR, зависящий от текущей location;
- принимать report без trace участников/результатов.

## TOP_TEST_RISKS

- duplicate scan retry;
- two users scan same asset;
- wrong location;
- unknown asset approval;
- missing asset no auto-decommission;
- found-later resolution;
- wrong contractor/site scope;
- report generated with unresolved scans;
- approved report mutation;
- session expected snapshot changing after asset move.
