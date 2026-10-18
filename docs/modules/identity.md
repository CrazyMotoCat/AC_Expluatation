# Module: Identity

STATUS: IN DEVELOPMENT
SOURCE_VERSION: 2026-10-19; published baseline b3599a4acc29fc21a6f48327f88385bbb280799c; MODEL-PROPOSAL-01 permission extension LOCAL_IMPLEMENTED_PENDING_R1

## Purpose

Identity связывает внешнюю authenticated identity с локальной бизнес-моделью доступа АС «Эксплуатация».

Authentication выполняется внешним IdP по OIDC/OAuth2. Модуль отвечает за пользователя, роли, permissions, access assignments и рабочие контексты.

## Owns

- User
- Role
- Permission
- RolePermission
- AccessAssignment
- UserContext
- Delegation access integration points

## Does not own

- Contractor contracts
- Site hierarchy
- Asset ownership
- Business workflows других модулей
- Password storage

## Database

Schema:

```text
identity
```

Implemented:

```text
users
roles
permissions
role_permissions
access_assignments
user_contexts
```

`identity.users` и его migration history принадлежат `IdentityDbContext`. Canonical unique key — `(external_issuer, external_subject)`. Профиль хранит UUIDv7 ID, optional display name/email, `UserType`, `UserStatus`, timestamps и optimistic `row_version`.

`identity.roles` хранит UUIDv7 ID, unique role code, name/description, system/active flags и optimistic `row_version`. `identity.permissions` хранит immutable canonical permission catalog с unique code и module owner. `identity.role_permissions` использует composite PK и restrictive foreign keys. Canonical permissions из `permissions-registry.md` seed-ятся module-owned migration; provisional codes не seed-ятся.

`TASK-02.02.01` Phase C1 seeds the three frozen Organization permissions:
`organization.read`, `organization.create` and `organization.change`. The
previous 74 catalog entries retain their IDs and metadata. Scope dimensions
remain deferred; the production grant source denies Organization routes.
Registry and Identity seed must be changed together with exact equality of
code, module, name and scope metadata. The implementation seed is deferred to
the Organization implementation/authorization phase; current production grant
evaluation remains deny-by-default and `access_assignments` has no new
Company/OrganizationalUnit dimensions.

`identity.user_contexts` добавлена в `TASK-01.03.02`: owned local context, type/entity reference, display name, `[valid_from, valid_to)`, active flag и optimistic `row_version`. PostgreSQL проверяет validity, конечный срок delegation и restrictive FK к user. `context_entity_id` пока не является доказательством membership/contract; административного API создания/отзыва нет.

`identity.access_assignments` добавлена `TASK-01.03.01` в module-owned migration. Она связывает локального User с Role, контекстной ссылкой и scope по territorial zone / region / site / functional direction / asset type. Для non-global требуется хотя бы одно concrete ограничение scope; constrained dimension сравнивается с authoritative target attribute без автоматического вывода иерархии. Validity — `[valid_from, valid_to)`; для `DELEGATION` конечный `valid_to` обязателен. Отзыв сохраняет запись и actor/time, блокирует дальнейшую eligibility и защищён optimistic `row_version`. PostgreSQL обеспечивает restrictive FK, проверки scope/validity/revocation и уникальность точных активных назначений с одинаковым `valid_from` (nullable scope считается равным). Семантика перекрывающихся интервалов/полного отзыва при будущей выдаче доступа ещё не определена.

## Invariants

- BR-IDN-001 … BR-IDN-008.
- Canonical external identity unique as exact opaque `issuer + subject` without trimming/case normalization; одинаковый subject от разных trusted issuers означает разные identities.
- Новый профиль создаётся только при наличии trusted `user_type` claim со значением `INTERNAL`, `CONTRACTOR` или `SYSTEM`.
- Синхронизация bounded optional display name/email не меняет сохранённые user type/status; oversized claim игнорируется и не затирает сохранённое значение.
- Inactive user не получает operational access.
- Context должен принадлежать пользователю.
- Self-service list/select допускается только для authenticated + ACTIVE local user и только для собственных активных и действующих contexts; это не permission grant.
- Context request-scoped; header `X-Work-Context-Id` на обычном `/api/v1` запросе перепроверяется и аудируется как применение до endpoint. Ни выбор, ни применение не расширяют доступные contexts или effective permissions.
- Access validity проверяется на момент запроса.
- Assignment имеет explicit GLOBAL или существующий concrete scope с хотя бы одним измерением; concrete composites сохраняют conjunctive semantics. GLOBAL + concrete IDs запрещён; NULL/missing/unknown scope не означает GLOBAL. Missing или неверный target dimension не удовлетворяет concrete assignment.
- Expired, not-yet-valid и revoked assignment не подходят для доступа; delegation не может быть бессрочным.
- Backend authorization authoritative.
- Role является группой permissions и сама по себе не обходит scope, working context, validity или contractor restrictions.
- Canonical permission code имеет lowercase формат `<module>.<action>` и уникален.
- Изменение active state Role защищено optimistic concurrency и не допускает silent overwrite.

## Authorization model

```text
Identity + Role + Permission + Scope + Working Context + Validity
```

Contractor request дополнительно проходит Contractors validation.

`TASK-01.02.02` добавила permission policy boundary: endpoint может объявить canonical permission code через `RequirePermission`, а API регистрирует policies только для migration-seeded catalog. Policy требует authenticated principal, активный локальный профиль и явный grant для canonical permission ID; отсутствие любого условия возвращает 403 после authentication. Невалидный или отсутствующий bearer token возвращает 401. `UserType`, имя роли и claims токена не выдают права.

`access_assignments` хранятся и проверяются на matching scope/validity как кандидаты. Self-service context ownership/availability реализованы. B1 evaluator проверяет внутреннюю цепочку Identity и доверенный Zone/Region descriptor. C1 Geography routes используют Sites authoritative target coverage; target-blind production grant source остаётся deny-all для других маршрутов, contractor chain также остаётся будущей dependency. Assignment, role-permission mapping и выбранный context сами по себе не открывают permission-protected endpoint.

`AUTH-SCOPE-01` B1 / ADR-013 ввёл Identity `IEffectiveGrantEvaluator`; B2-B1 добавил `IEffectiveScopeProvider` с общей Identity eligibility query для immutable distinct permission-specific `TerritorialZone`/`Region` descriptors. Provider не принимает target и не читает Sites hierarchy; composite/unsupported assignments не преобразуются в более широкий descriptor. Исходный B2-B2 передавал Identity trusted Region projection из Sites resolver и публиковал scoped read store; этот handoff заменён B2-R1 по ADR-016. C1 подключил provider через Sites к Zone/Region HTTP routes; production `IPermissionGrantSource` остаётся deny-by-default для остальных маршрутов. SITE-AUTH-01 публикует расширение того же provider/evaluator до exact `Site/siteId` с общей eligibility query и существующим `access_assignments.site_id`; Identity не вычисляет Sites hierarchy. PostgreSQL проверки и независимый SITE-AUTH-01R review прошли; Site foundation опубликован. Site HTTP routes, capabilities, Development bootstrap и contractor grants не реализованы.

ADR-016 / B2-R1 реализует уточнение после review F1/F2: Identity остаётся источником точных effective scopes для permission; Sites решает покрытие своей иерархии. Публичный Identity evaluator теперь принимает только target kind + один ID и проверяет exact Zone/Region scope, без Region parent или Zone → Region expansion. Sites direct service получает business target ID, читает Region parent из Sites и запрашивает `IEffectiveScopeProvider`. Exact eligibility B1 сохраняется; composite Zone+Region assignment не упрощается до exact scope. Финальная проверка B2 прошла, foundation интегрирован на main; C1 интегрировал Geography HTTP routes.

`GET /api/v1/me/contexts` и `POST /api/v1/me/context` — узкий own-context bootstrap alongside `GET /api/v1/me`: authenticated + ACTIVE local profile + strict owner/availability. `identity.contexts.read` не требуется в этих self-service маршрутах из-за bootstrap circular dependency; canonical permission сохранён для будущего permission-controlled доступа к contexts. Исключение не применяется к admin/other Identity endpoints.

`AccessAssignment.IsApplicableTo` — только Identity Domain eligibility по exact user/context, пяти scope dimensions и validity; это не межмодульный authorization contract и не grant source.

## Public contracts

### Correlated assignment scope handoff — 2026-10-09

Current effective-scope results contain exact geographic descriptors only;
composites, FunctionalDirection and AssetType are excluded, although persisted.
[ASSET-TYPE-SCOPE-00](../../.agent/tasks/AUTH-SCOPE-01/asset-type-scope-state.md)
records additive `IEffectiveScopeProvider.GetCurrentAssignmentScopesAsync`
returning immutable complete concrete assignment tuples for a trusted current
subject/context and canonical permission. It is **published at faa09a7**
under [ADR-019](../adr/ADR-019-correlated-assignment-scope-facts.md). It reuses
Identity current eligibility without a target evaluator and preserves all five
dimensions together. No tables/IQueryable are exported. Existing geographic
results stay unchanged; explicit GLOBAL stays on `IGlobalGrantProvider`. Assets
owns taxonomy coverage and INTERNAL consumer policy. No Identity schema change
is required. `EffectiveScopeRequest` is reused; the result is
`ImmutableArray<EffectiveAssignmentScopeFacts>`, one sealed immutable record
per current qualifying non-global assignment. Duplicate complete tuples are
preserved; all-null/empty-UUID shapes are rejected. Invalid requests return empty;
storage errors and cancellation propagate, with no permissive fallback.
No domain reference existence/ancestry is resolved in Identity. This foundation
does not expose an HTTP endpoint or alter seeds/roles/assignments. Published
ASSET-TYPE-01 consumes it at baseline `4dd9aea7c8ba940d3d8715a5d54fb7a5e3c16724`
(hosted CI run `38028823398` passed). Consumers evaluate concrete facts before the
terminal GLOBAL decision because GLOBAL false also represents provider failure.

`TASK-03.02.01` adds the canonical `assets.manage_manufacturers` permission
through a data-only Identity migration. The permission is explicitly GLOBAL and
INTERNAL, but its row alone grants no user access: this phase adds no role grant,
assignment, or GLOBAL grant. Manufacturer and AssetModel prerequisites are published
in baseline `b3599a4acc29fc21a6f48327f88385bbb280799c`.

TASK-03.02.03 / MODEL-PROPOSAL-01 adds exactly canonical `assets.propose_models`,
name `Предложение моделей оборудования`, module Assets, stable ID
`0199f3b0-0000-7000-8000-000000000050`. Identity-owned permission-only migration
`20261018134809_AddModelProposalPermission` inserts this definition and updates the
HasData snapshot/designer. No schema, role, role-permission, assignment or GLOBAL
grant changes are made; defining it authorizes nobody. Current exact providers retain
ACTIVE INTERNAL/owned current INTERNAL context, role/assignment/revocation/validity
semantics. Assets resolves persisted Proposal author/type/revision and interprets
correlated tuples. It never reads Identity DbContext. The new permission grants only
author actions, independently from existing assets.manage_models review/management.
Local Proposal validation passed; independent review remains pending.

- `ICurrentUser` exposes the validated runtime `AuthenticatedUser` for the current request.
- `AuthenticatedUser` contains an `ExternalIdentityKey` (`issuer + subject`) and optional display name/email.
- `AuthenticatedUser` carries an optional provisioning input from the configured trusted `user_type` claim; it is not a permission.
- `IPermissionGrantSource` принимает локальный user ID и canonical permission ID; текущая production реализация deny-by-default.
- `IGlobalGrantProvider.HasGlobalGrantAsync(GlobalGrantRequest)` checks an explicit current GLOBAL assignment for trusted `CanonicalPermission`, local user and owned context. It reuses current canonical INTERNAL eligibility, denies invalid/provider/storage failures and propagates cancellation. HTTP input supplies no grant evidence. GLOBAL is excluded from concrete effective-scope results.
- `IEffectiveGrantEvaluator` checks exact Zone/Region/Site target IDs only; it cannot accept parent evidence. `IEffectiveScopeProvider` returns immutable exact permission-specific Zone/Region/Site data, reusing shared Identity eligibility semantics. Sites derives target coverage from its own persistence. C1 Geography HTTP routes use the Sites services; the Site foundation is published after independent SITE-AUTH-01R review, and Site HTTP routes remain absent. Unrelated routes remain on target-blind denial.
- `IWorkingContextAuditWriter` — Audit-owned cross-module contract для durable `WorkingContextSelected` и `WorkingContextApplied`; Identity не пишет в Audit schema напрямую.

Planned subsequent contracts: `IWorkingContext`, `IAuthorizationService`, `UserReference`, `WorkingContextReference`. Текущий Domain `AccessScope` не является публичным контрактом для business modules.

## Permissions owned

См. `permissions-registry.md`, секция Identity.

## Events

См. `events-registry.md`.

Основные:

- UserActivated
- UserDeactivated
- AccessAssignmentCreated

`WorkingContextSelected` и `WorkingContextApplied` в текущей Task ID — Audit actions, не integration events/outbox messages.

## API surface

Реализовано:

```text
GET /api/v1/me
GET /api/v1/me/contexts
POST /api/v1/me/context
```

Планируемые admin routes:

```text
GET /api/v1/admin/users
POST /api/v1/admin/access-assignments
```

Точные admin routes фиксируются при реализации.

`GET /api/v1/me` требует валидный bearer token, безопасно создаёт или синхронизирует локальный профиль и возвращает `userId`, canonical identity key, optional display name/email, `userType` и `status`. Для первого создания обязателен configured trusted `user_type` claim. Missing/invalid provisioning type и inactive local profile возвращают 403; повторный concurrency conflict возвращает 409. Permission catalog и assignment persistence не расширяют этот response.

`GET /api/v1/me/contexts` возвращает только собственные доступные contexts и optional `appliedContextId` из валидированного и аудированного request header. `POST /api/v1/me/context` принимает body `contextId`, проверяет owner/availability, пишет ровно один durable `WorkingContextSelected` до 200 и возвращает ID в body и `X-Work-Context-Id`; header в POST игнорируется. Клиент передаёт header в последующих `/api/v1` запросах; backend перепроверяет его и записывает `WorkingContextApplied` до endpoint, даже если предшествующего POST не было. Нет server-global selected flag/session и нет permission grant. Unknown/inactive local user, чужой/неизвестный/недоступный context и неверный header обычного запроса fail closed. Неуспешный audit write возвращает 503 без выполнения endpoint.

Frontend browser session использует Authorization Code + PKCE через public OIDC client. Один session provider загружает `/me` и own contexts, а общий API client передаёт Bearer и выбранный request-scoped context. Выбор через POST сохраняется только в browser session и повторно сверяется со списком доступных contexts после перезагрузки. Смена context сбрасывает TanStack Query cache, включая будущие capabilities. Frontend не выводит grant из `userType`, JWT claims или role names; capabilities API пока не реализован.

Permission-protected business routes добавлены для Sites и Organization, но production grant source продолжает deny-by-default. `TASK-01.02.02` также проверяет policy на изолированном integration test endpoint. Для открытия scoped grant одного permission policy недостаточно: потребуются context, scope, validity и contractor restrictions по ADR-007.

`TASK-01.03.01` не добавляет admin route для выдачи/отзыва access assignment и не активирует grants. `identity.access.manage` остаётся canonical permission для будущего административного use case, а не основанием для bypass.

`AUTH-GLOBAL-01` / ADR-018 adds explicit `AccessScope.IsGlobal`, the `Global`
factory and persisted `AccessAssignment.IsGlobal` (`is_global` default false).
GLOBAL excludes all five concrete IDs; non-global validation retains existing
composites. Legacy rows retain their IDs, context and validity without widening.
The canonical domain `Assign` path supports bootstrap creation; no admin
application/HTTP mutation path, consumer or permission seed is added. Future
assignment administration must use canonical Audit with explicit scope facts.
The provider reads PostgreSQL per request; no authorization cache is introduced.
Rollback refuses all GLOBAL rows, including revoked history, until an explicit
owner-approved disposition is archived; migration never discards that history.

## Security

- no password storage;
- no token logging;
- JWT signature, issuer, audience and lifetime are validated by ASP.NET Core JWT Bearer;
- `issuer + subject`, а не email, является стабильным external identity key;
- missing display name/email не приводит к authentication failure;
- отсутствие trusted user type не ломает token authentication, но fail-closed запрещает создание нового local profile;
- token profile synchronization не может изменить сохранённый user type/status;
- context spoofing prevention;
- self-service не использует `identity.contexts.read` как operational grant и не открывает другие Identity endpoints;
- successful context selection requires durable Audit before success; failed selection creates no success audit;
- contractor access требует contract chain; до её реализации production grant source остаётся deny;
- sensitive admin actions audited.

## Tests

Обязательно:

- wrong scope;
- wrong context;
- expired assignment;
- inactive user;
- contractor wrong contract;
- cross-context leakage;
- privilege escalation.
- duplicate role/permission code;
- duplicate role-permission mapping;
- deletion of a referenced role/permission;
- permission seed drift from the canonical registry;
- assignment без scope, wrong/missing target dimension, wrong user/context, future/expired/revoked validity;
- бессрочное delegation, duplicate active assignment, FK integrity и concurrent revocation;
- role-permission plus persisted assignment не открывают production permission source без working context.
- own-context list/select 401/403/400 negative cases, cross-user IDOR, inactive/expired/future contexts, audit failure and unchanged production deny;
- Identity/Audit PostgreSQL migrations and append-only audit event persistence.

## Forbidden

- role-only authorization;
- global `admin.all` как повседневный permission;
- direct DB checks из business modules вместо shared authorization contract;
- frontend-only access control.
