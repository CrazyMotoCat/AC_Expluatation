# TASK-03.01.01 — ASSET-TYPE-00 contract freeze checkpoint

STATUS: OWNER_DECISIONS_REQUIRED
PHASE: ASSET-TYPE-00 — DOMAIN CONTRACT FREEZE / OWNER DECISION GATE
MODE: READ / ANALYZE / DOCUMENT ONLY; DIRECTLY ON MAIN

## Baseline and repository guard

- `git fetch` completed successfully.
- Branch: `main`.
- `HEAD == origin/main == d07f48699410a1da8b938655b4d63605dc44d19f`.
- Worktree was clean before this checkpoint; one primary worktree exists.
- No prior `.agent/tasks/TASK-03.01.01/state.md` existed. No resume drift was found.
- `LAST_SAFE_COMMIT`: `d07f48699410a1da8b938655b4d63605dc44d19f`.

## Exact backlog contract and boundaries

`docs/backlog.md`, EPIC-03 / FEATURE-03.01:

TASK-03.01.01 “Asset type hierarchy” acceptance criteria:

- parent/child;
- functional direction;
- system/component flags;
- inactive type cannot be selected for a new Asset.

EPIC-03 depends on EPIC-02, which the task request identifies as completed. `docs/modules/assets.md` and `docs/context/assets.context.md` state that TASK-00.03.02 only created the Assets layer/bootstrap; business entities, persistence, API, permissions and events remain unimplemented.

Explicit non-goals from the task request: Manufacturer, AssetModel and proposal workflow, dynamic attributes, Asset entity/create, composite Asset instances, responsibilities, Asset lifecycle, Asset timeline. No Assets implementation, Site/Location changes, or other EPIC-03 task is included.

## Repository evidence

- Owner/module: Assets (`docs/modules/assets.md`, `docs/context/assets.context.md`).
- `docs/reference-data-registry.md` calls AssetType an extensible `CONFIGURABLE_REFERENCE` and lists examples (UPS, DGU, AC, panel, server, switch, fire detector). These are examples, not an approved seed list.
- `docs/database.md` §9.1 sketches `assets.asset_types` with `id`, nullable `parent_id`, `code`, `name`, `functional_direction_id`, boolean `is_system_type`, boolean `is_component_type`, and `is_active`. The sketch provides no constraints, field rules, indexes, FK/delete policy, or detailed lifecycle semantics.
- `docs/context/assets.context.md` says AssetType must be active for a new Asset. `docs/business-rules-registry.md` says AssetModel must correspond to AssetType. No leaf-only Asset assignment rule is stated.
- `docs/api-guidelines.md` includes `GET /reference/asset-types` among generic reference API examples. It does not freeze an AssetType route, DTO, paging, authorization, or management operations.
- `docs/permissions-registry.md` declares `assets.manage_types` with typical `global/direction` scope and CRITICAL sensitivity; it declares no separate AssetType read permission. `assets.read` is described with `region/site/asset_type` scope. These registry entries do not establish which operations this task implements.
- Identity persists `asset_type_id` and `functional_direction_id` assignment dimensions (`AccessScope`, Identity migration/configuration). However, current `AuthorizationScopeCoverage.Covers` rejects assignments constrained by either dimension for target authorization. The schema dimensions therefore exist, but current production target evaluation does not support them as scope coverage. Assets has no AssetType authorization target/provider implementation.
- `docs/reference-data-registry.md` identifies FunctionalDirection as Organization-owned configurable reference data with examples. `docs/database.md` sketches `organization.functional_directions` (`id`, `code`, `name`, `description`, `is_active`). No FunctionalDirection domain/application contract or persistence implementation was found in the current Organization module; no AssetType-to-direction cardinality, inheritance, or active-value rule is documented.
- Current Assets source contains only the four-layer projects, module info bootstrap, and `AddAssetsModule()` registration. No AssetType domain type, DB context, migration, API, or runtime management exists.
- Relevant accepted architecture: ADR-001 modular monolith, ADR-003 UUIDv7 for core entities, ADR-007 RBAC + Scope/ABAC + context/validity, ADR-010 module-owned migrations with central execution. No AssetType-specific ADR was found.

## Task scope classification

| Capability | Classification | Evidence / boundary |
|---|---|---|
| Persistence for hierarchy, direction and flags | IN_SCOPE at the data/domain level | These are explicit acceptance concepts; exact schema waits on owner decisions. |
| Read API | UNRESOLVED | Generic reference route example exists, but no task API contract. |
| Management API | UNRESOLVED | Registry says configurable and declares `assets.manage_types`, but runtime management is not specified by acceptance criteria. |
| Lifecycle | IN_SCOPE only for active/inactive selection semantics; lifecycle commands UNRESOLVED | Acceptance explicitly excludes inactive types from new Asset selection; create/deactivate/activate behavior is not stated. |
| Hierarchy reparent/move | UNRESOLVED | Parent/child is required; mutation operations and parent mutability are not defined. |
| Frontend | OUT_OF_SCOPE | No UI acceptance criterion or UI task in this task contract. |
| Seeds | OUT_OF_SCOPE by default; no approved seeds | Registry values are examples only; the request says do not turn examples into seeds. |

## AssetType fields and candidate contract

| Field | Classification | Evidence / unresolved point |
|---|---|---|
| `id` | REQUIRED_NOW | `docs/database.md` lists it; ADR-003 requires UUIDv7 for core entities. |
| `parent_id` / proposed API `parentAssetTypeId` | REQUIRED_NOW | Parent/child is explicit; DB sketch uses nullable `parent_id`. Root count and field/API naming are not frozen. |
| `code` | REQUIRED_NOW | DB sketch lists it; requiredness, normalization, format, uniqueness and mutability are unresolved. |
| `name` | REQUIRED_NOW | DB sketch lists it; requiredness, trimming, length and uniqueness are unresolved. |
| `description` | NOT_SUPPORTED in current AssetType sketch | Not listed in `assets.asset_types`; may be deferred unless owner adds it. |
| `functional_direction_id` | REQUIRED_NOW as a relationship concept | Explicit acceptance and DB sketch; required/optional, cardinality, inheritance, ACTIVE validation, and cross-module validation method are unresolved. Organization owns FunctionalDirection. |
| `is_system_type` | REQUIRED_NOW, boolean | DB sketch explicitly says boolean; allowed combinations and behavior are unresolved. |
| `is_component_type` | REQUIRED_NOW, boolean | DB sketch explicitly says boolean; allowed combinations and behavior are unresolved. |
| `is_active` | REQUIRED_NOW for acceptance semantics | DB sketch uses boolean; initial state, lifecycle commands, inactive reads, deletion and parent/child interaction are unresolved. |
| `row_version` | DEFERRED unless mutability is included | Not in AssetType DB sketch. If mutable operations are in scope, concurrency contract is required. |
| `created_at`, `updated_at` | DEFERRED | Not in AssetType DB sketch; no AssetType-specific timestamp contract. |

## Provisional contract recommendations (not accepted)

- Multiple roots, nullable parent, arbitrary business depth, and no synthetic root. Protect against self-parent and descendant cycles. If reparenting is included, make it a separate command; decide structural concurrency only after mutation scope is confirmed.
- Treat `is_system_type` and `is_component_type` as independent booleans unless the owner establishes allowed combinations or structural implications.
- Require a direct FunctionalDirection reference on each type, with no implicit inheritance, only if the owner confirms exactly-one semantics; current docs do not establish this.
- Let any ACTIVE AssetType be assignable to a new Asset unless a leaf-only/business distinction is explicitly chosen. Acceptance alone does not establish leaf-only selection.
- No business maximum depth. Do not seed example types. Use a status representation consistent with the current DB sketch (`is_active`) unless an approved shared reference contract changes it.
- Prefer immutable canonical `code`, globally unique, required trimmed `name`, and no hard deletion as conservative reference-data defaults; these are not accepted AssetType rules.
- If runtime writes are included, use optimistic concurrency and the canonical durable Audit obligation pattern. A structural move additionally needs safe serialization/revalidation. Do not add an independent history subsystem absent a business-history requirement.
- Validate an Organization-owned FunctionalDirection through an explicit application contract/reference lookup; do not add direct Assets.Infrastructure → Organization.Infrastructure dependency or cross-module writes.

## Owner decisions required

### OD-ASSET-TYPE-01 — hierarchy roots, depth, and reparenting

QUESTION: Are multiple roots allowed; is there any business depth limit; and may a type be reparented after creation?
OPTIONS: (A) multiple roots, arbitrary depth, reparent through a dedicated command; (B) multiple roots/arbitrary depth, parent immutable; (C) one root or bounded depth; (D) owner-defined.
RECOMMENDED_DEFAULT: (A), because the acceptance criterion requires hierarchy and no type taxonomy/depth rule is documented.
WHY / IMPACT: Determines nullable parent, cycle invariants, mutation API, concurrency and future selectors.

### OD-ASSET-TYPE-02 — FunctionalDirection relation

QUESTION: Is direction required and exactly one per AssetType, optional one, many-to-many, or inherited from parent? Must it be ACTIVE, and can a child use a different direction?
OPTIONS: (A) exactly one direct ACTIVE direction per type, no inheritance; (B) optional one direct direction, no inheritance; (C) many-to-many; (D) inherited/direct combination; (E) owner-defined.
RECOMMENDED_DEFAULT: (A) only if every type must belong to one operating direction; otherwise (B). No repository evidence chooses between them.
WHY / IMPACT: Determines nullability/cardinality, API shape, direction-scoped management and validation against Organization.

### OD-ASSET-TYPE-03 — system/component flags

QUESTION: Can both flags be false, both true, and do either flag impose parent/child rules?
OPTIONS: (A) independent booleans with all combinations allowed and no structural effect; (B) mutually exclusive; (C) both true allowed but at least one must be true; (D) owner-defined.
RECOMMENDED_DEFAULT: (A), preserving the explicitly sketched booleans without inventing structural rules.
WHY / IMPACT: Determines DB checks, domain validation, type selectors and future composite modeling.

### OD-ASSET-TYPE-04 — Asset assignment eligibility

QUESTION: May a new Asset use any ACTIVE AssetType, only an ACTIVE leaf type, or a type marked separately as assignable?
OPTIONS: (A) any ACTIVE type; (B) ACTIVE leaf only; (C) add an explicit assignable flag; (D) flag/eligibility derived from system/component semantics; (E) owner-defined.
RECOMMENDED_DEFAULT: (A), as only inactivity is named in the acceptance criteria.
WHY / IMPACT: Directly constrains TASK-03.04.01 and whether AssetType needs more schema than the current sketch.

### OD-ASSET-TYPE-05 — code, name, and descriptive fields

QUESTION: Freeze `code` and `name` requiredness, normalization, maximum lengths, uniqueness and mutability; should `description` be added?
OPTIONS: (A) required immutable trimmed canonical code globally unique; required trimmed non-unique name; no description in this slice; (B) required code/name with owner-defined canonical/length rules; (C) owner-defined alternative.
RECOMMENDED_DEFAULT: (A) with normalization/format/max length specified by owner; do not copy SiteType/LocationType rules automatically.
WHY / IMPACT: Determines column constraints/indexes, update contract, integrations and stable labels.

### OD-ASSET-TYPE-06 — lifecycle and parent/child lifecycle

QUESTION: Confirm initial active state, whether inactive types remain readable, whether hard delete is forbidden, how to deactivate/activate, and whether active descendants may remain below an inactive parent.
OPTIONS: (A) create ACTIVE; keep inactive readable; no hard delete; reject deactivation with active descendants and reactivate top-down; (B) allow active descendants; no cascade; (C) cascade descendants inactive; (D) owner-defined.
RECOMMENDED_DEFAULT: (A), consistent with preserving reference history; not established for AssetType by current docs.
WHY / IMPACT: Determines constraints, lifecycle API, selector behavior and restoration semantics.

### OD-ASSET-TYPE-07 — exact task deliverables and configurability

QUESTION: Does TASK-03.01.01 include persistence only, a read catalog, runtime management (create/update/reparent/lifecycle), or UI? Are any initial seeds required?
OPTIONS: (A) domain + persistence + global read catalog; no management API/UI; (B) persistence + read and runtime management API; no UI; (C) include UI; (D) owner-defined. Seeds: none unless an exact approved list is supplied.
RECOMMENDED_DEFAULT: (A), with no seeds; it satisfies a reusable hierarchy/read foundation without assuming runtime management from “configurable”.
WHY / IMPACT: Sets the Task boundary, migration/API/audit/concurrency requirements and backlog dependencies.

### OD-ASSET-TYPE-08 — read/manage authorization and direction scope

QUESTION: What permission authorizes catalog reads, and does `assets.manage_types` management use global grants or direction-scoped grants? Is runtime asset-type scope support required in this task?
OPTIONS: (A) globally readable reference catalog; manage by `assets.manage_types` with global grant only; (B) read via `assets.read`; manage globally; (C) direction-scoped manage after trusted direction target authorization exists; (D) owner-defined.
RECOMMENDED_DEFAULT: Defer runtime management/auth until OD-07 confirms management. For a catalog, choose a read permission/authorization contract explicitly before API implementation; do not infer that permission seeding is enforcement.
WHY / IMPACT: Existing permissions registry differs from implemented Identity target evaluation: exact asset-type/direction scoped grants are stored but current coverage rejects them. Enabling direction scope requires a trusted target/evaluator contract; do not extend Identity schema or bypass this gap here.

## Conditional model/API sketch (not frozen)

- Candidate table: `assets.asset_types`; `id` UUIDv7 PK; nullable self parent reference (current DB name `parent_id`); `code`; `name`; direction reference ID; two booleans; `is_active`. Restrictive self-FK/no hard delete, unique code, parent index, and any direction constraint depend on owner decisions and accepted cross-module design.
- Candidate reference read route: `GET /api/v1/reference/asset-types` is only a generic API example, not an accepted endpoint. If approved, likely needs parent, direction, both flags and active status; active/inactive inclusion and paging are unresolved.
- Do not freeze mutation routes until OD-07 confirms runtime management.

## Compatibility with later tasks

- TASK-03.02.02 requires models to reference AssetType; existing BR-AST-003 requires model/type correspondence. Stable AssetType IDs and historical inactive reads are compatible; parent-vs-leaf model association is unspecified.
- TASK-03.03.01 needs type-specific attribute definitions. Whether definitions inherit through the type hierarchy is not stated and remains a later-task contract question.
- TASK-03.04.01 directly depends on active/assignable selection; OD-04 must be answered before implementing Asset creation.
- TASK-03.04.03 can filter by type; chosen hierarchy/direction must not imply unapproved descendant expansion.
- Maintenance templates later bind to AssetType; no current conflict found, but direction/inheritance semantics should be frozen consistently before that contract.

## Checkpoint outcome

- `OWNER_DECISIONS_REQUIRED`: 8 genuine implementation blockers recorded above.
- Product docs unchanged. Recommendations remain provisional and have not been written into product contracts.
- No code, schema, migration, AssetType entity, Asset entity, branch, worktree, or push created.
- No build/tests run; this phase is read/analyze/checkpoint only.
- `DOCS_IMPACT: NO` for this checkpoint-only contract analysis; product documentation sync is not applicable before decisions are accepted.

FILES_CHANGED: `.agent/tasks/TASK-03.01.01/state.md` only.
LAST_SAFE_COMMIT: `d07f48699410a1da8b938655b4d63605dc44d19f`.
NEXT_ACTION: Owner resolves OD-ASSET-TYPE-01..08; record accepted semantics, then implement only TASK-03.01.01 on `main`.
DO_NOT_REPEAT: Do not rerun completed backlog/module/schema/permission/source scan unless relevant docs or implementation change; do not treat registry examples or recommendations as accepted seeds/rules; do not implement downstream EPIC-03 tasks, create code/schema/migrations/API/UI, create branch/worktree, commit or push in ASSET-TYPE-00.

## ASSET-TYPE-01 resume — owner decisions accepted; contract gate blocked

REPOSITORY_STATE_GUARD: SAFE_WITH_CHECKPOINT
RESUME_SAFE: YES
STATE_DRIFT: NONE

- `git fetch` completed.
- Branch: `main`.
- `HEAD == origin/main == d07f48699410a1da8b938655b4d63605dc44d19f`.
- Expected local change remains this checkpoint only; no code or product docs are changed.
- `LAST_SAFE_COMMIT`: `d07f48699410a1da8b938655b4d63605dc44d19f`.

### Accepted owner decisions

The explicit owner decisions in the ASSET-TYPE-01 task request supersede the provisional options/recommendations above. All eight are accepted:

- OD-ASSET-TYPE-01 ACCEPTED: adjacency list, nullable `parent_asset_type_id`, multiple roots, no synthetic root/business depth limit; dedicated reparent with nullable parent, required reason and expected row version; reject self/descendant parent; preserve descendant subtree; serialize hierarchy mutations transactionally across processes.
- OD-ASSET-TYPE-02 ACCEPTED: exactly one required direct `functional_direction_id`; immutable after create; no inheritance; parent and child directions must match; validate through Organization-owned application/module contract; do not invent FunctionalDirection lifecycle semantics.
- OD-ASSET-TYPE-03 ACCEPTED: persist independent `is_system_type` and `is_component_type` booleans; all four combinations allowed; classification only, with no hierarchy or Asset-composition rules; mutable through ordinary update.
- OD-ASSET-TYPE-04 ACCEPTED: any ACTIVE type is assignable, including non-leaf; inactive types remain readable and historical references resolvable, but cannot be selected for new Asset or future type-change targets. No Asset entity/selector in this task.
- OD-ASSET-TYPE-05 ACCEPTED: required trimmed invariant-uppercase code, max 50, regex `^[A-Z0-9][A-Z0-9_-]{0,49}$`, globally unique and immutable; required trimmed name max 200, mutable/non-unique; no description.
- OD-ASSET-TYPE-06 ACCEPTED: ACTIVE/INACTIVE; create ACTIVE; no hard delete/cascade; inactive readable; deactivate rejected while any ACTIVE descendant exists; activate root or child only under ACTIVE direct parent; create/reparent child only under ACTIVE parent; ACTIVE child implies all ancestors ACTIVE.
- OD-ASSET-TYPE-07 ACCEPTED: domain, persistence, one additive migration, hierarchy/lifecycle, read and runtime management APIs, dedicated reparent, authorization, canonical technical Audit, tests/harnesses and docs sync. No seeds, frontend, Asset, Manufacturer, AssetModel, attributes or composite Asset relations.
- OD-ASSET-TYPE-08 ACCEPTED: read eligibility is `assets.read` OR `assets.manage_types`; management requires `assets.manage_types` only; INTERNAL-only; no permission implication; global catalog after eligibility, no geographic filtering. Management grants may be global, direction-scoped, type-subtree-scoped, or their intersection; geography-only narrowing never grants global taxonomy management. Caller-supplied permission, scopes, ancestry and direction authority are untrusted. Stop if trusted Identity facts cannot support these rules.

### Required contract gate — FunctionalDirection

STATUS: `ASSET_TYPE_FUNCTIONAL_DIRECTION_CONTRACT_GAP`

OWNER_MODULE: Organization.

CURRENT_AVAILABLE_CONTRACT: None found. Repository scan of `src/backend/Modules/Organization` found no FunctionalDirection domain/application entity, reference contract, persistence or read-validation use case. The only current evidence is a planned schema sketch in `docs/database.md` and a registry entry in `docs/reference-data-registry.md`; neither is an implemented authoritative validation source. The existing Organization contracts/application code cover OrganizationalUnits, not FunctionalDirection.

MISSING_CONTRACT: An Organization-owned application-level operation that lets Assets validate a `functional_direction_id` authoritatively without accessing Organization.Infrastructure/DbContext, and exposes the applicability/lifecycle evidence needed to reject an invalid or unselectable direction. The task explicitly says not to invent a FunctionalDirection ACTIVE model, so its valid/selectable semantics must come from that owner contract.

WHY_BLOCKING: Every AssetType requires a direction, every parent/child branch must be direction-homogeneous, and reparent/create must validate the referenced direction. Accepting caller-provided IDs without owner validation or reading another module's DbContext would violate the accepted owner decision and module boundaries. Creating the migration/domain/API now would encode an unvalidated cross-module reference.

MINIMAL_SAFE_EXTENSION: Establish a narrow Organization-owned published application reference-validation contract for FunctionalDirection, including its owner-defined selectability semantics; compose it into Assets.Application and test its trusted result. This prerequisite is outside the current AssetType implementation gate until the contract exists. Do not add direct cross-module Infrastructure references or a cross-module database FK.

STOP_POINT: Stop before AssetType code, schema/migration, API, or documentation product updates. The task request explicitly makes this a pre-migration gate.

### Authorization gate status

OD-ASSET-TYPE-08 is accepted. The prior repository evidence remains: Identity stores direction/type scope dimensions but current `AuthorizationScopeCoverage` rejects them for target coverage, and Identity's current trusted-target contract only models geographic target kinds. The implementation task requires further contract verification before authorization work. This was not implemented or weakened; the earlier FunctionalDirection gate is already blocking all implementation. Recheck the exact Identity trust contract after the Organization prerequisite is resolved and before Assets authorization code.

### Phase checkpoint

- `OWNER_DECISIONS`: RESOLVED (OD-ASSET-TYPE-01..08 accepted).
- `STATUS`: BLOCKED at `ASSET_TYPE_FUNCTIONAL_DIRECTION_CONTRACT_GAP`; do not mark implementation complete.
- `APPLICATION_CODE_CHANGED`: NO.
- `SCHEMA_CHANGED`: NO.
- `MIGRATION_CREATED`: NO.
- `ASSET_TYPE_ENTITY_CREATED`: NO.
- `ASSET_ENTITY_CREATED`: NO.
- `FILES_CHANGED`: `.agent/tasks/TASK-03.01.01/state.md` only.
- `DOCS_IMPACT`: NO product-doc changes; documentation sync is pending implementation after the prerequisite contract is published.
- No tests/builds were run; phase stopped at the mandatory pre-migration contract gate.
- No branch/worktree, commit or push created.

NEXT_ACTION: Establish/publish the minimal Organization-owned FunctionalDirection application validation contract and its lifecycle/selectability semantics; then resume TASK-03.01.01, rerun the repository guard, and verify both cross-module and Identity authorization trust contracts before writing code or migration.
DO_NOT_REPEAT: Do not repeat the completed TASK/backlog/AssetType source scan unless sources change. Do not access Organization/Identity/Sites DbContexts from Assets. Do not add a fallback that accepts arbitrary direction IDs. Do not begin migration/domain/API/auth implementation until the prerequisite contracts pass. Do not start other EPIC-03 tasks, create Asset or seeds, create branch/worktree, commit or push from this blocked phase.

## ASSET-TYPE-01 implementation resume — 2026-10-09

STATUS: IN_PROGRESS
CHECKPOINT_STATUS: SAFE_IMPLEMENTATION_BUILD_ONLY
LAST_SAFE_COMMIT: faa09a7b77d8d9bfb5f416a1d00ce6070bbd61f6
REPOSITORY_STATE_GUARD: SAFE_WITH_CHECKPOINT / DIRTY_EXPECTED
RESUME_SAFE: YES; previous prerequisite blockers are superseded by published FunctionalDirection and ADR-019 code at exact user baseline.
BASELINE: main == origin/main == faa09a7b77d8d9bfb5f416a1d00ce6070bbd61f6 after fetch; one primary worktree, no branch/worktree creation.
PRESERVED_PRIOR_NOTES: AUTH-SCOPE-01/state.md, asset-type-scope-state.md, agents/asset-scope-01-security-review.md, TASK-02.02.02/state.md. Known publication/review metadata only, not task-owned staging candidates.
PREREQUISITE_GATE: PASS. Organization IFunctionalDirectionReferenceProvider; Identity IGlobalGrantProvider and GetCurrentAssignmentScopesAsync with immutable correlated tuples; canonical current local user/validated context; module-owned DbContext and atomic audit patterns; permissions registry.
PERMISSION_SEED_PREFLIGHT: assets.read (...000e) and assets.manage_types (...0015) present in SystemPermissionCatalog/PermissionConfiguration.HasData/initial applied Identity migration. No Identity migration/schema/grant/role change.
FROZEN_CONTRACTS: OD-ASSET-TYPE-01..08 / 08A..08E; no owner decisions reopened.
TAXONOMY_LOCK: pg_advisory_xact_lock(1095980121, 1), two-int namespace ASCII ASTY/id1; disjoint PostgreSQL keyspace from Sites/Organization bigint advisory locks. READ COMMITTED -> lock -> clear tracked facts -> reread hierarchy/Identity facts -> authorization -> validation/version -> mutation + module-owned audit -> commit. All mutations including root create/update use same lock.
PLAN / PRIMARY_OWNERSHIP: Assets Application contracts/authorization, Persistence/DbContext/one Assets migration, Audit canonical AssetType actions/payload allowlist and durable delivery wiring, integration, docs and final gates. Domain/unit helper owns only frozen Domain implementation; API helper owns HTTP adapter/HTTP harness. No frontend production changes. No Asset entity/seeds/business history.
COMPLETED: domain model and unit harness; Application DTO/ports and correlated authorization; locked command store/recursive PostgreSQL read store; module audit obligations/config/delivery and canonical Audit extensions; API adapter/wiring drafted.
VERIFIED: Domain console harness PASS; API Release build PASS (0 warnings/errors); git diff --check PASS. Full functional/PG/security/docs gates still pending.
UNCOMMITTED: current task source/tests + relevant production wiring/Audit contracts + this checkpoint/agents; prior notes preserved. No staged paths, no commit/push.
BLOCKERS: NONE; candidate incomplete and not reviewed.
NEXT_ACTION: Generate the single Assets migration, verify model drift and real PostgreSQL/adversarial authorization+Audit tests before full local validation and one atomic local main commit.
DO_NOT_REPEAT: no Identity permission migration (both seeded), prerequisite rewrite, caller-trusted authorization, cross-module DbContext, no branch/worktree/push, unrelated prior-note staging, destructive recovery or downstream phase.

## ASSET-TYPE-01 final local validation gate — 2026-10-10

STATUS: LOCAL_VALIDATED_READY_FOR_ONE_ATOMIC_COMMIT
CHECKPOINT_STATUS: SAFE
LAST_SAFE_COMMIT / BASELINE_SHA / EXPECTED_ORIGIN_MAIN_SHA: faa09a7b77d8d9bfb5f416a1d00ce6070bbd61f6
CURRENT_BRANCH: main
RESUME_SAFE: YES; post-interruption fetch confirms exact baseline, known task-owned diff plus four preserved operational notes, one primary worktree. No unknown source edits.
CONTRACT_RECORD: contract.md stores the exact authorized user request; accepted owner decisions remain frozen.
COMPLETED: complete AssetType backend vertical slice; Domain/private invariant methods; Organization reference validation; correlated Identity read/management composition; global two-int taxonomy serialization and fresh recursive facts; bounded read/management HTTP API; optimistic versions; AssetsDbContext/write guard; canonical Audit actions/payload allowlist; atomic Assets obligations and durable claim/fenced dispatcher; one Assets migration; all task-owned tests/docs/CI wiring.
ASSETS_MIGRATION: 20261009093315_AddAssetTypes (only type and required module-owned audit-obligation tables); immutable/no-delete/version database guard; data-bearing Down refuses history loss. No type seeds.
IDENTITY_MIGRATION / SCHEMA_CHANGE / PERMISSION_CHANGE / GRANTS: NONE. Both assets.read and assets.manage_types preexist in canonical HasData/initial migration.
TAXONOMY_LOCK: pg_advisory_xact_lock(1095980121,1), two-int ASTY/taxonomy1, separate PG keyspace from existing module bigint locks; begin READ COMMITTED -> lock -> discard stale tracking -> authoritative hierarchy/Identity facts -> authorize whole tuple -> business/version -> entity+Audit obligation -> commit.
AUTHORIZATION: explicit GLOBAL management; exact direction; type root+persisted descendants; direction/type intersect in one complete assignment; all geography-containing tuples ineligible for management. Complete valid grants union without synthetic dimensions. Reparent source/destination covered by one tuple; type-only root creation/root escape/root destination denied. Provider exceptions terminal denial even when GLOBAL exists. Catalog global after exact assets.read OR assets.manage_types INTERNAL/current eligibility; geographic reads do not filter or manage.
AUDIT: five registered AssetType actions; server actor/context/UTC/correlation and allowlisted before/after including parenting/version; reparent reason required. All successful changes and obligations commit together; denials/validation/duplicates/stale/cycles/no-op create no successful obligation. SKIP LOCKED claims, leased tokens, fenced completion, stable event ID/idempotent canonical Audit append and bounded sanitized retries.

VERIFIED_LOCAL_GATES:
- Release solution build PASS, 0 warnings/errors in final build.
- All 14 executable backend harnesses PASS: IdentityDomain, SitesDomain, AssetsDomain, Architecture, Authentication, IdentityPersistence (GLOBAL and correlated scopes), AuditPersistence, SitesPersistence (Site/Location authorization), SitesApi, AuditDelivery, OrganizationPersistence (central five-context migrator apply/reapply), OrganizationApi, AssetsPersistence, AssetsApi.
- Final expanded Assets PostgreSQL18.6 Testcontainers PASS: migration/idempotency/model drift; UUIDv7/uniqueness/self-FK; duplicate race; arbitrary-depth authoritative CTE/cycle/lifecycle; correlated security matrix; within-subtree positive and escape negatives; two real-connection serialized auth/reparent orderings with pg_locks waiter evidence; concurrent opposite reparents; stale versions; atomic Audit insert-failure rollback; canonical dispatcher retry/idempotency/lease crash recovery; immutable/delete guards; data-bearing rollback refusal; active/inactive/missing Organization references and no cascade.
- Final real-host PostgreSQL HTTP harness PASS: roots/children/detail/pagination/order, every mutation, 401/403/404/400/409, wrong/foreign context/non-internal, strict caller-field rejection including scopes/ancestry/actor, no DELETE and OpenAPI bodies.
- dotnet test Release/no-build PASS; console harnesses are explicitly run, not inferred from test discovery.
- Infrastructure DevScripts/CiWorkflow/DatabaseMigrator/API bootstrap contract+runtime smoke PASS. Five contexts and one new Assets migration; central clean apply/idempotent second run PASS via OrganizationPersistence.
- Assets EF has-pending-model-changes PASS/no changes; formatting scoped to task C# PASS; git diff --check PASS; task text secret scan PASS (only ephemeral test credentials/signing fixtures); frontend production diff empty.
- Frontend lint/build/tests PASS, 8 files / 71 tests; production unchanged.
- Independent LOCAL security/contract check PASS; OPEN_CRITICAL/HIGH/MEDIUM/LOW: 0/0/0/0; agents/security-review.md. Later immutable publication review is separate.

DOCS_IMPACT: YES
DOCUMENTATION_SYNC: PASS
UPDATED_DOCS: Assets module/capsule, backlog, database, reference/permission registries, security, Audit module/capsule, relevant Identity publication status/capsule, ADR index publication provenance (Accepted ADR contents untouched), CI runbook. New routes have OpenAPI metadata and HTTP contract checks. Documentation describes local/unpublished candidate, not completed Asset/UI.
AGENT_WORKSTREAMS: Domain/unit helper COMPLETE; API/HTTP helper COMPLETE; PG test-only helper COMPLETE; independent read-only reviewer PASS; primary integration/validation COMPLETE. Helpers used gpt-6-sol/high as requested; primary owns schema/shared contracts/authorization/integration.
OPERATIONAL_NOTE_PRESERVATION: AUTH-SCOPE-01/state.md, asset-type-scope-state.md, agents/asset-scope-01-security-review.md and TASK-02.02.02/state.md unchanged by this task and excluded from staging.
UNCOMMITTED: task-owned complete source/tests/docs/CI/checkpoint/contract/agent records; staging to be explicit; no commit/push yet.
LIMITS: all database evidence uses disposable real PostgreSQL, not target production inventory. UserType has Internal/Contractor/System, no separate External enum; non-internal Contractor is denied/tested. Hosted CI for this unpublished candidate is UNVERIFIED.
OUT_OF_SCOPE: frontend production, Asset entity, Manufacturer/Model, attributes/composites, business history, permission/role/assignment administration, grants, push and publication.
BLOCKERS: NONE for local implementation/commit.
NEXT_ACTION: Verify main/origin exact baseline, inspect deliberately staged task-owned diff, create ONE atomic feat(assets) local commit, verify parent/ahead1 and preserve prior notes; then STOP for separate independent immutable-commit security/contract review and publication gate.
DO_NOT_REPEAT: no broad regression repeat absent new relevant changes; no Identity migration/grants, previous prerequisites rewrite, Accepted ADR rewrite, unrelated note staging, branch/worktree/push/amend/second commit or destructive recovery; do not claim hosted CI for local candidate.
