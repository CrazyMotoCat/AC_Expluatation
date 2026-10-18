# АС «Эксплуатация» — API Guidelines

## 1. Назначение документа

Этот документ определяет обязательные правила проектирования HTTP API АС «Эксплуатация».

Он применяется совместно с:

- `concept.md`;
- `roadmap.md`;
- `architecture.md`;
- `coding-standards.md`;
- `database.md`;
- `security.md`;
- `testing.md`.

Документ обязателен для:

- backend-разработки;
- frontend-разработки;
- мобильного/PWA клиента;
- интеграций;
- Codex и других AI-агентов;
- code review.

Главная цель — обеспечить единый, предсказуемый и расширяемый API-контракт.

---

# 2. Общий стиль API

Основной внешний API:

```text
REST + JSON
```

Базовый префикс:

```text
/api/v1
```

Примеры:

```text
GET    /api/v1/sites
GET    /api/v1/sites/{siteId}
POST   /api/v1/assets
GET    /api/v1/assets/{assetId}
POST   /api/v1/work-orders/{workOrderId}/complete
```

---

# 3. Версионирование

Используется URL versioning:

```text
/api/v1
/api/v2
```

Breaking change требует новой версии.

Не является breaking change:

- добавление нового optional поля;
- добавление нового endpoint;
- расширение enum только если клиент обязан корректно обрабатывать неизвестные значения;
- добавление нового optional filter.

Breaking change:

- удаление поля;
- переименование поля;
- изменение семантики;
- изменение типа;
- изменение обязательности;
- несовместимое изменение статуса/ошибки.

---

# 4. JSON conventions

JSON naming:

```text
camelCase
```

Пример:

```json
{
  "assetId": "019...",
  "serialNumber": "ABC-123",
  "commissionedAt": "2026-09-16T10:30:00Z"
}
```

---

# 5. Форматы данных

## UUID

Строка стандартного UUID.

## DateTime

ISO 8601 UTC:

```text
2026-09-16T10:30:00Z
```

## Date

```text
2026-09-16
```

## Decimal

JSON number.

## Money

```json
{
  "amount": 12500.50,
  "currency": "RUB"
}
```

---

# 6. Null semantics

`null` означает отсутствие значения.

Не использовать:

```text
""
0
"unknown"
```

как универсальную замену `null`.

---

# 7. Resource endpoints

Стандарт:

```text
GET    /resources
GET    /resources/{id}
POST   /resources
PATCH  /resources/{id}
```

`DELETE` допускается только для технических/черновых сущностей, где физическое удаление разрешено.

Для бизнес-сущностей предпочтительны команды жизненного цикла.

---

# 8. Command endpoints

Для доменных действий использовать явные action endpoints.

Примеры:

```text
POST /api/v1/work-orders/{id}/start
POST /api/v1/work-orders/{id}/complete
POST /api/v1/work-orders/{id}/accept
POST /api/v1/assets/{id}/decommission
POST /api/v1/defects/{id}/close
POST /api/v1/changes/{id}/approve
```

Не использовать generic:

```text
PATCH status = "COMPLETED"
```

для сложного бизнес-перехода.

---

# 9. Create response

При создании:

```text
201 Created
```

Response:

```json
{
  "id": "..."
}
```

И `Location` header, где уместно.

---

# 10. Successful commands

Если команда возвращает обновлённый ресурс:

```text
200 OK
```

Если response body не нужен:

```text
204 No Content
```

---

# 11. Ошибки

Единый формат:

```json
{
  "code": "ASSET_NOT_FOUND",
  "message": "Актив не найден.",
  "correlationId": "6c67...",
  "details": null
}
```

---

# 12. Validation error

```text
400 Bad Request
```

Пример:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Запрос содержит ошибки.",
  "correlationId": "...",
  "details": {
    "serialNumber": [
      "Длина серийного номера не должна превышать 100 символов."
    ]
  }
}
```

---

# 13. Error codes

Коды должны быть:

- стабильными;
- машиночитаемыми;
- документированными;
- независимыми от языка UI.

Примеры:

```text
ASSET_NOT_FOUND
WORK_ORDER_ALREADY_COMPLETED
ACCESS_DENIED
CONTRACT_EXPIRED
QUALIFICATION_REQUIRED
OPTIMISTIC_CONCURRENCY_CONFLICT
```

---

# 14. HTTP status mapping

Рекомендуемый mapping:

```text
400 validation/business request error
401 unauthenticated
403 forbidden
404 entity not found
409 conflict / concurrency / duplicate
422 semantic business validation if нужно
429 rate limit
500 unexpected
503 dependency unavailable
```

Не использовать `200 OK` для ошибок.

Для Zone/Region direct GET и mutation, а также parent Zone при Region create,
`AUTH-SCOPE-01` C1-OD-01 устанавливает одинаковый `403 Forbidden` для
отсутствующей и существующей вне разрешённого scope цели. Оба случая имеют
один код `GEOGRAPHY_ACCESS_DENIED`; различие существования не раскрывается.
Без bearer authentication ответ остаётся `401`. После успешной target
authorization сохраняются действующие business/lifecycle и optimistic
concurrency responses. Пустой scoped Zone/Region list возвращает `200 []`.

---

# 15. Correlation ID

Каждый response содержит correlation ID:

Header:

```text
X-Correlation-Id
```

Если клиент прислал допустимый ID — можно сохранить.

Иначе сервер генерирует новый.

---

# 16. Pagination

Для больших списков обязательна пагинация.

Стандартный вариант:

```text
?page=1&pageSize=50
```

Default:

```text
50
```

Maximum:

```text
200
```

---

# 17. Paginated response

Пример:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 50,
  "totalCount": 1240,
  "totalPages": 25
}
```

Для очень больших потоков позже допускается cursor pagination.

---

# 18. Sorting

Формат:

```text
?sort=createdAt
?sort=-createdAt
```

`-` означает descending.

Разрешённые поля задаются явно.

Нельзя передавать arbitrary DB column.

---

# 19. Filtering

Пример:

```text
GET /api/v1/assets?siteId=...&status=IN_OPERATION&assetTypeId=...
```

Фильтры:

- явные;
- типизированные;
- documented.

Не делать универсальный filter expression language на первом этапе.

---

# 20. Search

Свободный поиск:

```text
?q=fg%20wilson
```

Search должен быть отделён от фильтров.

---

# 21. Include/expand

На первом этапе избегать универсального:

```text
?include=everything
```

Если нужен сложный read model — создать специализированный endpoint.

Пример:

```text
GET /api/v1/assets/{id}/details
```

или обычный resource DTO с достаточным набором данных.

---

# 22. List DTO vs Details DTO

Список:

```text
AssetListItem
```

Карточка:

```text
AssetDetails
```

Не возвращать огромную карточку для каждой строки списка.

---

# 23. IDs in nested resources

Пример:

```text
GET /sites/{siteId}/assets
```

допустим, если parent scope принципиален.

Но основной canonical endpoint:

```text
GET /assets?siteId=...
```

может оставаться предпочтительным для универсальных выборок.

---

# 24. Resource ownership

Каждый endpoint принадлежит одному модулю.

Другие модули не должны создавать дублирующий endpoint над той же сущностью.

---

# 25. Authorization

Каждый endpoint обязан явно определять permission.

Пример:

```text
assets.read
assets.create
assets.change
workorders.execute
workorders.approve
```

---

# 26. Scope authorization

Проверяется не только permission, но и scope:

```text
region
site
functional direction
asset type
contract
working context
```

---

# 27. Contractor context

Для внешнего пользователя request должен выполняться в конкретном активном контексте.

Варианты:

- context ID в access token claims;
- либо явный header/selection, проверенный backend.

Пример:

```text
X-Work-Context-Id
```

Backend обязан проверить принадлежность контекста пользователю.

С `TASK-01.03.02` context request-scoped: `X-Work-Context-Id` означает применение context только к текущему `/api/v1` request. Backend проверяет ACTIVE local user, ownership и availability, затем записывает durable `WorkingContextApplied` до передачи управления endpoint. Предшествующий POST не требуется. На `POST /api/v1/me/context` заголовок игнорируется: body определяет выбор и создаёт ровно один `WorkingContextSelected`. Ни выбор, ни применение не выдаёт permission и не заменяет future contractor/scope authorization.

ADR-013 фиксирует для будущих фаз `AUTH-SCOPE-01` отдельный `POST /api/v1/capabilities/evaluate` с target-specific DTO и scope-aware Sites geography authorization. Phase A не добавляет route: пока production permission source отказывает. Capabilities не заменяют проверку на business endpoint.

---

# 28. Context audit

Каждая изменяющая операция сохраняет:

- user;
- work context;
- contractor;
- contract;
- role/scope where required.

Для текущего critical command `POST /api/v1/me/context` durable `WorkingContextSelected` записывается через canonical Audit contract до успешного ответа. `WorkingContextApplied` на обычном request остаётся отдельным security-sensitive audit event; оба события используют Audit-owned action/entity identifiers.

---

# 29. Idempotency

Для потенциально повторяемых POST-команд:

Header:

```text
Idempotency-Key
```

Обязателен для:

- offline sync;
- complete work order;
- inventory scan submission при нестабильной связи;
- bulk import confirm;
- внешних интеграций.

---

# 30. Idempotency semantics

Повторный request с тем же key и тем же payload:

- не выполняет операцию второй раз;
- возвращает тот же логический результат.

Тот же key с другим payload:

```text
409 Conflict
```

---

# 31. Optimistic concurrency

Для редактирования критичных сущностей клиент передаёт version.

Варианты:

```text
If-Match / ETag
```

или:

```json
{
  "version": 7
}
```

Предпочтительно ETag для HTTP semantics, но можно начать с явного `version`.

---

# 32. Concurrency conflict

```text
409 Conflict
```

Пример:

```json
{
  "code": "OPTIMISTIC_CONCURRENCY_CONFLICT",
  "message": "Запись была изменена другим пользователем.",
  "correlationId": "..."
}
```

---

# 33. PATCH

Использовать для простых безопасных изменений.

Пример:

```text
PATCH /assets/{id}
```

для:

- description;
- optional metadata;
- minor editable fields.

Не использовать PATCH для lifecycle transition.

---

# 34. WorkOrder lifecycle API

Пример:

```text
POST /work-orders/{id}/start
POST /work-orders/{id}/pause
POST /work-orders/{id}/complete
POST /work-orders/{id}/review
POST /work-orders/{id}/accept
POST /work-orders/{id}/reject
```

Точный lifecycle фиксируется отдельно.

---

# 35. WorkOrder completion

Request может содержать:

```json
{
  "proposedAssetCondition": "IN_OPERATION_WITH_MINOR_DEFECTS",
  "comment": "...",
  "version": 12
}
```

Все steps уже должны быть сохранены до final completion.

---

# 36. WorkOrder steps

Пример:

```text
GET   /work-orders/{id}/steps
PATCH /work-orders/{id}/steps/{stepId}
```

Для offline допускается batch endpoint:

```text
POST /work-orders/{id}/steps/batch
```

---

# 37. Measurements API

Измерение может создаваться через контекст работы:

```text
POST /work-orders/{id}/measurements
```

или domain endpoint:

```text
GET /assets/{id}/measurements
```

---

# 38. Measurement history

Пример:

```text
GET /assets/{id}/measurements
    ?parameterCode=battery.internal_resistance
    &from=...
    &to=...
```

---

# 39. Defects API

Пример:

```text
POST /defects
GET  /defects/{id}
POST /defects/{id}/observations
POST /defects/{id}/assign
POST /defects/{id}/resolve
POST /defects/{id}/close
```

---

# 40. Recurring defect

Не использовать:

```text
POST /defects/{id}/reopen
```

автоматически для уже закрытого дефекта.

Создаётся новый defect + recurrence relation после инженерной оценки.

---

# 41. Inventory API

Пример:

```text
POST /inventory-sessions
POST /inventory-sessions/{id}/start
GET  /inventory-sessions/{id}/summary
POST /inventory-sessions/{id}/observations
POST /inventory-sessions/{id}/finish-scan
GET  /inventory-sessions/{id}/missing-items
POST /inventory-sessions/{id}/complete
POST /inventory-sessions/{id}/approve
```

---

# 42. Inventory scan

Request:

```json
{
  "assetToken": "...",
  "actualLocationId": "...",
  "scannedAt": "...",
  "operationId": "..."
}
```

`operationId` нужен для offline/idempotency.

---

# 43. Unknown asset during inventory

```text
POST /inventory-sessions/{id}/draft-assets
```

Создаёт только draft.

Официальный asset создаётся после approval.

---

# 44. Missing asset

После завершения scan system формирует discrepancy.

Не переводить asset автоматически в LOST/DECOMMISSIONED.

---

# 45. Incident API

```text
POST /incidents
POST /incidents/{id}/timeline
POST /incidents/{id}/restore-service
POST /incidents/{id}/resolve
POST /incidents/{id}/close
POST /incidents/{id}/review
```

---

# 46. Change API

```text
POST /changes
POST /changes/{id}/tasks
POST /changes/{id}/risk-assessments
POST /changes/{id}/approve
POST /changes/{id}/accept-residual-risk
POST /changes/{id}/start
POST /changes/{id}/complete
```

---

# 47. Risk API

Автоматический risk score не перезаписывает expert assessment.

Read model:

```json
{
  "autoRisk": "HIGH",
  "expertAssessments": [
    {
      "direction": "IT",
      "risk": "HIGH"
    },
    {
      "direction": "EXPLOITATION",
      "risk": "MEDIUM"
    }
  ],
  "finalRisk": "MEDIUM",
  "wasReducedManually": true
}
```

---

# 48. Documents API

Metadata:

```text
POST /documents
GET  /documents/{id}
POST /documents/{id}/versions
POST /documents/{id}/make-current
```

---

# 49. Upload flow

Рекомендуемый процесс:

```text
1. POST /uploads
2. получить upload URL/session
3. загрузить файл
4. POST /uploads/{id}/complete
5. server validation
6. create/link document or attachment
```

---

# 50. Direct binary through API

Допускается на раннем этапе для небольших файлов.

Но архитектурно предпочтителен direct-to-object-storage upload через signed URL.

---

# 51. Download

API выдаёт:

- authorization check;
- temporary signed URL;
- либо proxy stream.

Для больших файлов предпочтителен signed URL.

---

# 52. File metadata

Response:

```json
{
  "id": "...",
  "fileName": "passport.pdf",
  "contentType": "application/pdf",
  "sizeBytes": 234234,
  "sha256": "...",
  "uploadedAt": "..."
}
```

---

# 53. Batch endpoints

Batch допустим, если:

- mobile/offline;
- import;
- массовое подтверждение.

Не создавать generic batch CRUD.

---

# 54. Batch response

Каждый элемент имеет результат:

```json
{
  "results": [
    {
      "operationId": "1",
      "status": "success"
    },
    {
      "operationId": "2",
      "status": "failed",
      "errorCode": "..."
    }
  ]
}
```

---

# 55. Bulk import API

Поток:

```text
POST /imports
POST /imports/{id}/file
POST /imports/{id}/validate
GET  /imports/{id}/preview
POST /imports/{id}/confirm
GET  /imports/{id}/result
```

---

# 56. Long-running operations

Не держать HTTP request открытым для:

- отчётов;
- массовых импортов;
- больших exports;
- пересчётов.

Использовать job resource.

---

# 57. Job API

```text
POST /reports
→ 202 Accepted
```

Response:

```json
{
  "jobId": "...",
  "status": "queued"
}
```

Проверка:

```text
GET /jobs/{id}
```

---

# 58. Async status

```text
QUEUED
RUNNING
COMPLETED
FAILED
CANCELLED
```

---

# 59. Export API

Пример:

```text
POST /reports/maintenance
GET  /jobs/{jobId}
GET  /jobs/{jobId}/result
```

---

# 60. Rate limiting

Особенно:

- auth-sensitive endpoints;
- search;
- uploads;
- exports;
- external integrations.

---

# 61. API limits

Документировать:

- max page size;
- max upload;
- max batch size;
- max date range for heavy queries.

---

# 62. Search query limits

Не разрешать безлимитный поиск по нескольким миллионам строк без ограничения.

---

# 63. ETags

Для GET details можно отдавать:

```text
ETag
```

Полезно для:

- concurrency;
- caching.

---

# 64. Caching headers

Для справочников возможно:

```text
Cache-Control
ETag
```

Для пользовательских/чувствительных данных — осторожно.

---

# 65. OpenAPI

Каждый endpoint должен быть в OpenAPI.

Обязательно:

- summary;
- description;
- permissions where possible;
- request;
- response;
- error codes.

---

# 66. Client generation

Frontend типы могут генерироваться из OpenAPI.

Но generated files не редактируются вручную.

---

# 67. Deprecation

Deprecated endpoint:

- документируется;
- получает срок удаления;
- по возможности возвращает deprecation headers;
- удаляется только в новой API version при breaking change.

---

# 68. Naming endpoints

Использовать существительные во множественном числе:

```text
/assets
/work-orders
/inventory-sessions
```

Не:

```text
/getAssets
/doMaintenance
```

---

# 69. Boolean naming

JSON:

```text
isActive
isRequired
hasWarranty
```

---

# 70. Enum serialization

Строковые значения:

```json
{
  "status": "IN_PROGRESS"
}
```

Не numeric enum.

---

# 71. Unknown enum handling

Клиенты должны по возможности устойчиво обрабатывать неизвестное значение.

---

# 72. Localized labels

API возвращает код как source of truth.

UI получает label:

- либо из справочника;
- либо отдельным displayName.

Не делать локализованный текст единственным идентификатором.

---

# 73. Reference DTO

Для lookup:

```json
{
  "id": "...",
  "code": "UPS",
  "name": "ИБП"
}
```

---

# 74. Avoid deep nesting

Не возвращать:

```text
Site
→ 500 assets
→ 20 defects each
→ 100 measurements
```

в одном response.

Использовать отдельные endpoints/read models.

---

# 75. Dashboard endpoints

Допускаются специализированные read endpoints:

```text
GET /sites/{id}/dashboard
GET /regions/{id}/maintenance-summary
```

Они являются query/read models, а не CRUD ресурсами.

---

# 76. Timeline endpoint

Для актива:

```text
GET /assets/{id}/timeline
```

Response унифицирован:

```json
{
  "items": [
    {
      "type": "MAINTENANCE_COMPLETED",
      "occurredAt": "...",
      "title": "...",
      "entityId": "..."
    }
  ]
}
```

---

# 77. Audit endpoint

Доступ ограничен.

```text
GET /audit/events
```

Не смешивать с business timeline.

---

# 78. Reference data API

```text
GET /reference/asset-types
GET /reference/site-types
GET /reference/site-criticality-classes
GET /reference/location-types
GET /reference/units
```

Или module-owned resource endpoints.

`TASK-02.03.01` implements the module-owned read route
`GET /api/v1/reference/site-types`. It uses Sites catalog authorization and returns an
array ordered by canonical code. Each row exposes `id`, `code`, `name`,
`description` and `status`; inactive rows remain visible for historical
references. No SiteType mutation route is included in this task.

`TASK-02.03.02` implements `GET /api/v1/reference/site-criticality-classes`
under Sites catalog authorization. It returns an unpaged array of both ACTIVE and
INACTIVE classes, ordered by rank ASC then code ASC. Each row contains only
`id`, `code`, `name`, `rank`, nullable `description` and `status`. This is a
global reference list with no Zone/Region filtering. The route has no runtime
management operations; a working context does not grant permission.

SITE-REF-AUTH-01 / SITE-REF-OD-01 through OD-03 authorize these two global
catalog GETs for an ACTIVE INTERNAL user in a valid owned INTERNAL context
with a current effective exact TerritorialZone/Region/Site assignment for any
one of sites.read, sites.create, sites.change, sites.change_criticality.
The Sites application service accepts only authenticated user/context IDs and
queries that fixed set through Identity (maximum four sequential checks).
Authentication failure returns 401; denied catalog access returns 403, never
200 with an empty catalog. Existing context-header validation is unchanged.
Successful catalog arrays, DTO fields, ordering and inactive inclusion are
unchanged. Catalog access grants no Site operation or geographic visibility;
no permission implication, geographic filtering or global grant-source change.

`TASK-02.04.01` publishes `GET /api/v1/reference/location-types` as a global
read-only Sites catalog. It returns an unpaged array of both ACTIVE and
INACTIVE rows ordered by code ASC then ID ASC; each row contains only `id`,
`code`, `name`, nullable `description`, `status`. Authentication failure is
401; catalog eligibility failure is 403 with the canonical error envelope.
The fixed read permission union is `sites.read` or `sites.manage_locations`
with a current supported geographic scope for an ACTIVE INTERNAL user in a
valid owned INTERNAL context. The catalog is not filtered by that scope, and
read access implies no other operation. No LocationType mutation endpoint is
included; Location instances/tree remain TASK-02.04.02 scope.

## TASK-02.03.03 — Site API contract (frozen; SITE-API-01 published)

SITE-API-01 publishes the seven production Site routes using the
frozen DTO contract below after independent SITE-API-01R review. The B1 domain/persistence
foundation and SITE-AUTH-01 authorization foundation are published on main.
Identity supports exact Site scopes; Sites owns authoritative Site → Region
→ Zone coverage, create-parent checks and authorized SQL lists. These were
verified independently under ADR-017. Site HTTP integration uses the same
canonical authenticated subject/context resolution as Zone/Region, the
published Sites target/create-parent checks and authorized list service.
Mutations call Application handlers and the existing atomic B1 command store.
SITE-UI-01 implements the Site management frontend locally; independent
review is pending. Capabilities, DEV bootstrap and contractor-positive access
remain unimplemented. No schema change or migration is included.

| Operation | Route | Permission and target | Body | Success |
|---|---|---|---|---|
| List | `GET /api/v1/sites` | `sites.read`; backend-filtered Site targets | Query below | `200` page |
| Get | `GET /api/v1/sites/{siteId}` | `sites.read`; Site target | — | `200` Site DTO |
| Create | `POST /api/v1/sites` | `sites.create`; existing parent Region coverage | `code`, `name`, `regionId`, `siteTypeId`, `criticalityClassId`, `address`, `timezone` | `201` Site DTO |
| Update | `PUT /api/v1/sites/{siteId}` | `sites.change`; Site target | `name`, `siteTypeId`, `address`, `timezone`, `expectedRowVersion` | `200` Site DTO |
| Activate | `POST /api/v1/sites/{siteId}/activate` | `sites.change`; Site target | `expectedRowVersion` | `200` Site DTO |
| Deactivate | `POST /api/v1/sites/{siteId}/deactivate` | `sites.change`; Site target | `expectedRowVersion` | `200` Site DTO |
| Change criticality | `PUT /api/v1/sites/{siteId}/criticality` | `sites.change_criticality`; Site target; no extra `sites.change` | `criticalityClassId`, `expectedRowVersion` | `200` Site DTO |

No Site DELETE, Region move, SiteType management, reference catalog mutation
or Site card UI route is included. Ordinary update cannot change `code`,
`regionId`, `criticalityClassId` or `status`. Criticality needs no reason in
this first slice. The Site DTO fields are `id`, `code`, `name`, `regionId`,
`siteTypeId`, `criticalityClassId`, `address`, `timezone`, `status`,
`rowVersion`. No coordinates, timestamps or duplicated reference labels are
required. `address` maps to Sites-owned `address_text` persistence.

List query supports `regionId`, `siteTypeId`, `criticalityClassId`, `status`,
`q` (code/name), `page` and `pageSize`. It intersects all filters with the
effective authorized Site set on the backend; filters never widen scope and
`totalCount` counts only authorized filtered rows. Order is `code` ASC, then
`id` ASC. The existing pagination convention above applies: page starts at
1, default pageSize 50, maximum 200, response `items`, `page`, `pageSize`,
`totalCount`, `totalPages`. No full-text engine or advanced sorting API.

Validation: Site code is required, trim + invariant uppercase, max 50,
`^[A-Z0-9][A-Z0-9_-]{0,49}$`; name is required, trimmed, non-empty, max
200; address is required, trimmed, non-empty, max 500; timezone is a valid
IANA identifier stored explicitly; Region/type/criticality IDs are required
valid UUIDs and new assignments must reference ACTIVE rows. A created Site
ID is UUIDv7. Every mutable request carries `expectedRowVersion` and stale
writes return `409 OPTIMISTIC_CONCURRENCY_CONFLICT`.

Reuse the existing error envelope and established Region code pattern. ADR-017
refines the historical draft for authorization concealment: absent and
out-of-scope direct Site targets, and absent and out-of-scope create parent
Regions, return the same `403 GEOGRAPHY_ACCESS_DENIED` used by C1 Geography.
They do not return `SITE_NOT_FOUND`, `REGION_NOT_FOUND` or a separate
`ACCESS_DENIED` code before authorization succeeds. The remaining business
errors retain their canonical responses after authorization:
`VALIDATION_FAILED` (400),
`SITE_TYPE_NOT_FOUND`/
`SITE_CRITICALITY_CLASS_NOT_FOUND` (404 after authorization permits
disclosure), `SITE_CODE_ALREADY_EXISTS` (409),
`REGION_STATE_CONFLICT`/`SITE_TYPE_STATE_CONFLICT`/
`SITE_CRITICALITY_CLASS_STATE_CONFLICT`/`SITE_STATE_CONFLICT` (409), and
`OPTIMISTIC_CONCURRENCY_CONFLICT` (409). Missing authentication is 401.
An inaccessible Site ID returns no Site DTO; it never becomes accessible
through knowledge of its UUID. Preserve the repository's correlation ID and
do not return stack traces.

---

# 79. Master data mutation

Не разрешать всем пользователям напрямую создавать производителя/модель.

Поток:

```text
proposal
→ verification
→ publication
```

API:

```text
POST /api/v1/asset-model-proposals
```

TASK-03.02.03 / MODEL-PROPOSAL-01 implements the accepted OD-12/14 boundary locally;
mandatory local validation passed; independent review remains pending. The author base above requires
`assets.propose_models`; `/api/v1/asset-model-proposals/management` independently
requires `assets.manage_models`. Each supports GET list/detail/revision list/detail.
Author commands are create, `/{id}/revisions` (full snapshot, response and
expectedRowVersion), and `/{id}/withdraw`. Management commands are
`/{id}/request-information`, `/accept`, `/reject`, `/cancel`, `/promote`.
Decision bodies use expectedRowVersion and required/optional `text`; Promote uses
only expectedRowVersion. There is no generic PATCH or DELETE.

Proposal acceptance does not create or verify a Model. Separate first Promote returns
201 with one ACTIVE+UNVERIFIED Model; existing explicit Model Verify controls general
reference publication. Same trusted promoter/original-version replay, currently
authorized in an owned valid context, returns 200 without new writes or Audit; no
Idempotency-Key is added. Other authorized post-success retries conflict.

Lists use exactly items/page/pageSize/totalCount, defaults 1/50/max 200 and
updatedAt DESC,id ASC. Detail uses `{ proposal, history }`. Exact IDs/status and
normalized exact/prefix code/name filters run after SQL ownership/scope restrictions,
before count/page; percent/underscore/backslash are escaped literally. Canonical 409
codes are OPTIMISTIC_CONCURRENCY_CONFLICT, MODEL_PROPOSAL_STATE_CONFLICT,
MODEL_CODE_ALREADY_EXISTS and MODEL_CODE_RESERVED_BY_PROPOSAL. The last also applies
to direct AssetModel Create and normalized-code-changing Update destination reservations.
See [Assets module contract](modules/assets.md) for the full workflow/route contract.

---

# 80. Work context switching

Self-service для собственного context:

```text
GET /api/v1/me/contexts
POST /api/v1/me/context { "contextId": "..." }
```

Требуются validated bearer token, ACTIVE local profile и owner/active/validity check; отсутствующий local profile не создаётся этим endpoint. `GET` возвращает только доступные собственные contexts и `appliedContextId` из валидированного и аудированного request header, если он передан. `POST` записывает ровно один durable `WorkingContextSelected` в Audit до ответа, возвращает выбранный ID в body и `X-Work-Context-Id`; заголовок в POST игнорируется. При ошибке обязательного audit — 503 без успешного действия. Неверный UUID заголовка на обычном request — 400; неизвестный/чужой/недоступный context — 403 без раскрытия владельца.

Own-context self-service не требует operational `identity.contexts.read` и не расширяет исключение на admin/other Identity endpoints. Canonical permission остаётся для будущих permission-controlled сценариев. Выбор не создаёт server-global session и не предоставляет grant.

Но сервер не должен полагаться только на состояние UI.

Каждый request должен быть проверяем в контексте.

---

# 81. Current user

```text
GET /api/v1/me
```

Response:

- user;
- active context;
- roles;
- scopes;
- feature flags;
- preferences.

Не возвращать огромный permission graph без необходимости.

После `TASK-01.01.02` endpoint безопасно создаёт или синхронизирует local profile поверх validated runtime identity:

```json
{
  "userId": "019...",
  "identityKey": {
    "issuer": "http://127.0.0.1:8081/realms/exploitation",
    "subject": "external-subject"
  },
  "displayName": "Optional name",
  "email": "optional@example.test",
  "userType": "INTERNAL",
  "status": "ACTIVE"
}
```

Для первого provisioning нужен configured trusted `user_type` claim со значением `INTERNAL`, `CONTRACTOR` или `SYSTEM`. Missing/invalid claim, не представимый в persistence external identity и inactive local profile возвращают 403; повторный optimistic concurrency conflict возвращает 409. `issuer`/`subject` возвращаются и сохраняются как exact opaque values. Email/display name не являются identity key и не могут изменить сохранённые type/status; oversized optional claim игнорируется. `GET /api/v1/me` остаётся self-profile bootstrap без active-context field; собственные contexts и request-scoped selection доступны через отдельные маршруты выше. Roles/scopes/preferences добавляются последующими Identity tasks.

Stable error codes:

```text
LOCAL_USER_EXTERNAL_IDENTITY_INVALID
LOCAL_USER_PROVISIONING_TYPE_REQUIRED
LOCAL_USER_PROVISIONING_TYPE_INVALID
LOCAL_USER_INACTIVE
OPTIMISTIC_CONCURRENCY_CONFLICT
```

---

# 82. Health endpoints

```text
/health/live
/health/ready
```

Не под `/api/v1`.

---

# 83. Metrics

Не публиковать Prometheus metrics через пользовательский API.

---

# 84. Internal API

Если появятся внутренние service endpoints:

```text
/internal/...
```

Они должны иметь отдельную auth model.

---

# 85. External integrations

Предпочитать отдельные integration contracts.

Не открывать весь внутренний REST API внешним системам без необходимости.

---

# 86. Webhooks

Позднее можно поддержать:

```text
incident.created
workorder.completed
asset.changed
```

Каждый webhook:

- signed;
- retryable;
- idempotent.

---

# 87. Offline sync API

Поздний этап.

Вариант:

```text
POST /sync/push
GET  /sync/pull?cursor=...
```

---

# 88. Sync push

```json
{
  "operations": [
    {
      "operationId": "...",
      "entityType": "workOrderStep",
      "entityId": "...",
      "operationType": "update",
      "baseVersion": 5,
      "occurredAt": "...",
      "payload": {}
    }
  ]
}
```

---

# 89. Sync conflict response

```json
{
  "operationId": "...",
  "status": "conflict",
  "serverVersion": 7,
  "conflictType": "SAME_FIELD_CHANGED"
}
```

---

# 90. Audit metadata

Для изменяющих endpoint желательно передавать reason, если операция требует объяснения.

Пример:

```json
{
  "reason": "Замена по гарантии"
}
```

---

# 91. Approval endpoints

Не использовать универсальный:

```text
POST /approve?entityType=...
```

на старте.

Лучше domain-specific:

```text
POST /work-orders/{id}/accept
POST /changes/{id}/approve
POST /inventory-sessions/{id}/approve
```

---

# 92. Generic workflow engine

Не строить в первой версии.

---

# 93. API security logging

Логировать:

- denied access;
- invalid context;
- expired contract attempt;
- suspicious upload;
- repeated forbidden requests.

Не логировать secrets.

---

# 94. PII

Не отдавать больше персональных данных, чем требуется endpoint.

---

# 95. Contractor user listing

Подрядчик видит только пользователей своей организации/доступного контекста.

---

# 96. User activation

Поток:

```text
POST contractor creates user
→ status PENDING_VERIFICATION
→ customer verifies
→ ACTIVE
```

---

# 97. Qualifications API

```text
GET  /users/{id}/qualifications
POST /users/{id}/qualifications
POST /qualifications/{id}/verify
```

Доступ строго ограничен.

---

# 98. Assignment validation

При назначении исполнителя API проверяет:

- scope;
- contract;
- qualification;
- validity;
- site access.

---

# 99. Emergency qualification override

Явный command endpoint:

```text
POST /work-orders/{id}/qualification-exceptions
```

Обязательны:

- reason;
- approver;
- expiry.

---

# 100. Feature flags in API

Если feature выключен:

```text
404
```

или:

```text
403/409
```

в зависимости от semantics.

Не раскрывать неактивный внутренний functionality без необходимости.

---

# 101. API compatibility tests

OpenAPI diff должен входить в CI для контроля breaking changes.

---

# 102. Contract tests

Критичные frontend/backend DTO должны иметь contract tests.

---

# 103. Example Asset API

## Create

```text
POST /api/v1/assets
```

Request:

```json
{
  "siteId": "...",
  "locationId": "...",
  "assetTypeId": "...",
  "modelId": "...",
  "serialNumber": "ABC123",
  "commissionedAt": "2026-09-16"
}
```

Response:

```text
201 Created
```

```json
{
  "id": "..."
}
```

---

# 104. Example Asset details

```text
GET /api/v1/assets/{id}
```

Response:

```json
{
  "id": "...",
  "assetCode": "DGU-0001",
  "site": {
    "id": "...",
    "name": "Объект №125"
  },
  "location": {
    "id": "...",
    "name": "ДГУ-площадка"
  },
  "type": {
    "id": "...",
    "code": "DGU",
    "name": "ДГУ"
  },
  "manufacturer": {
    "id": "...",
    "name": "FG Wilson"
  },
  "model": {
    "id": "...",
    "name": "P635P5"
  },
  "serialNumber": "ABC123",
  "lifecycleStatus": "IN_OPERATION",
  "technicalCondition": "NORMAL",
  "version": 7
}
```

---

# 105. Example business error

Попытка списать актив с активной критичной работой:

```text
409 Conflict
```

```json
{
  "code": "ASSET_HAS_ACTIVE_CRITICAL_WORK",
  "message": "Актив нельзя вывести из эксплуатации до завершения активной критичной работы.",
  "correlationId": "..."
}
```

---

# 106. API anti-patterns

Запрещено:

- `/getAllAssets`;
- generic `/entities`;
- raw SQL parameters in query;
- arbitrary sort column;
- entity serialization напрямую;
- stack trace в response;
- permission только на frontend;
- status update через generic PATCH для сложного workflow;
- upload без validation;
- long report generation inside HTTP request;
- undocumented error codes;
- hidden breaking changes.

---

# 107. Правила для Codex

Перед созданием endpoint Codex обязан:

1. Определить module owner.
2. Найти существующий API pattern.
3. Определить permission.
4. Определить scope.
5. Определить request DTO.
6. Определить response DTO.
7. Определить error codes.
8. Учесть concurrency.
9. Учесть audit.
10. Добавить tests.
11. Обновить OpenAPI.
12. Не менять business semantics без документации.

---

# 108. Definition of Done для endpoint

Endpoint готов, если:

1. Есть route.
2. Есть OpenAPI.
3. Есть validation.
4. Есть authorization.
5. Есть scope check.
6. Есть domain/business validation.
7. Есть единый error format.
8. Есть audit при необходимости.
9. Есть structured logs.
10. Есть unit/integration tests.
11. Есть authorization tests.
12. Нет N+1.
13. Нет breaking change без версии.
14. Есть idempotency там, где требуется.

---

# 109. Главный принцип API

> API должен выражать бизнес-действия и бизнес-ресурсы, а не структуру таблиц PostgreSQL.

Хороший API позволяет клиенту сказать:

```text
"Завершить ТО"
"Подтвердить инвентаризацию"
"Принять остаточный риск"
"Зафиксировать дефект"
```

а не:

```text
"Изменить поле status в таблице work_orders"
```
