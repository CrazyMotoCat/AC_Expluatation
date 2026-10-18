# TASK-03.02.02 — ASSET-MODEL-01

DATE: 2026-10-18 (Asia/Vladivostok)
STATUS: IMPLEMENTATION_COMPLETE_LOCAL_PENDING_REVIEW
MODE: IMPLEMENTATION
PHASE: ASSET-MODEL-01 — BACKEND IMPLEMENTATION
BASELINE_SHA: 949b74c1c645e5abfbfbcf2c96e65778b891f14e
LAST_SAFE_COMMIT: current single local ASSET-MODEL-01 commit on main; resolve exact SHA from Git HEAD; parent is the published baseline
CURRENT_BRANCH: main
HEAD: current single local task commit; resolve exact SHA with git rev-parse HEAD
ORIGIN_MAIN: 949b74c1c645e5abfbfbcf2c96e65778b891f14e
REPOSITORY_STATE_GUARD: SAFE_WITH_CHECKPOINT
RESUME_SAFE: YES
IMPLEMENTATION_READY: YES
IMPLEMENTATION_AUTHORIZATION: GRANTED
IMPLEMENTATION_STATUS: IN_PROGRESS (local commit complete; independent ASSET-MODEL-01R remains a separate gate)

## Scope and safety boundary

Historical ASSET-MODEL-00 gate record, written 2026-10-13 before the separate implementation authorization: at that point this checkpoint contained contract analysis only, no implementation, migration or permission seed, and no authorization to start ASSET-MODEL-01. OD-ASSET-MODEL-01 through OD-ASSET-MODEL-08 and the real PostgreSQL Manufacturer row-lock prerequisite evidence are recorded below. The owner granted separate backend implementation authorization on 2026-10-18; the authorization and current implementation status below supersede the historical `IMPLEMENTATION_AUTHORIZATION: NONE` statement.

Initial repository guard was reconciled against the task's published baseline: fetch succeeded; current branch is main; HEAD equals origin/main at the expected SHA; staging is empty; one worktree is present. No branch or worktree was created. Existing dirty operational/review notes were preserved byte-for-byte; exact initial paths are recorded below. The only new path in this phase is this checkpoint.

## Backlog and dependency review

| Backlog item | Published scope | Dependency/boundary result |
|---|---|---|
| TASK-03.02.01 Manufacturers | Manufacturer reference, normalized uniqueness, verification and search | Required predecessor; implementation and migration exist in the pinned baseline. Backlog's LOCAL_IMPLEMENTED_UNPUBLISHED label is stale documentation. |
| TASK-03.02.02 Asset models | Manufacturer, AssetType, model code/name, verified status, duplicate prevention | This phase defines a contract only; no implementation starts. |
| TASK-03.02.03 Model proposal workflow | User proposes missing Model; responsible employee verifies; only verified Model becomes general reference; P1 | Separate downstream workflow. No proposal/queue/approval/notification behavior belongs in this phase or the Model master-data entity by default. |
| TASK-03.04.01 Create asset | Site, location, type, optional model, serial, asset code, status, permission/scope, audit, CREATED event | Downstream consumer. Must use authoritative Model selectability and exact AssetType compatibility; not implemented here. |
| TASK-03.04.03 Asset search | Site, region, type, manufacturer, model, status, serial, inventory number | Downstream consumer. Model ID/reference must support these filters; no Asset search implementation here. |

No contradictory sequencing was found: Manufacturer precedes AssetModel, the proposal workflow is a later P1, and Asset creation treats Model as optional. Backlog acceptance for AssetModel is intentionally brief and does not settle the decisions in this checkpoint.

### Documentation status drift

At this SHA, the following documents still describe Manufacturer as local/unpublished or repeat an older source version: docs/backlog.md, docs/modules/assets.md, docs/context/assets.context.md, docs/modules/identity.md, and docs/context/identity.context.md. In contrast, the pinned baseline contains the Manufacturer implementation and migrations, the canonical assets.manage_manufacturers permission, and the task's supplied publication evidence. This is documentation drift, not a reason to alter any existing file in this phase. No docs-impact synchronization was attempted because the permitted output is only this new analysis checkpoint.

## Repository evidence and frozen prerequisites

Evidence paths are repository-relative.

| Contract | Repository evidence and conclusion |
|---|---|
| Assets ownership | docs/reference-data-registry.md lists AssetModel as an Assets-owned CONFIGURABLE_REFERENCE. docs/modules/assets.md identifies Assets as owner of AssetType and Manufacturer too. All three therefore share Assets ownership and schema; no cross-module DbContext/FK is required. AssetModel implementation is absent from src/backend/Modules/Assets. |
| Manufacturer identity/selectability | Domain/Manufacturers/Manufacturer.cs: UUIDv7 ID; IsSelectableForNewModel iff lifecycle ACTIVE and verification VERIFIED. Create is ACTIVE+UNVERIFIED. Name change invalidates verification. Revocation clears actor/time; activation/deactivation do not change verification. Existing references remain resolvable; no cascade or hard delete. ManufacturerReadStore returns scalar reference facts. |
| Manufacturer normalization/uniqueness | Domain/Manufacturers/Unicode17NameNormalizer.cs uses pinned Unicode 17.0.0 NFC, Default Full Case Folding, Unicode White_Space collapse and NFC. Pinned data SHA-256 is d416472fd51d6a0ac065deb3dcfc90b97ff839971888d2c442f54e54ff8d8079. It preserves punctuation and script, with display bound 200 scalars and normalized bound 600 scalars / 2400 UTF-8 bytes. The database's globally unique ux_manufacturers_normalized_name is authoritative. These semantics are frozen for Manufacturer name only, not automatically for model codes. |
| AssetType identity/lifecycle/selectability | Domain/AssetTypes/AssetType.cs, AssetType configuration and docs/modules/assets.md: UUIDv7; stable FunctionalDirection; nullable parent; arbitrary depth and multiple roots; code immutable/global unique; name mutable. ACTIVE/INACTIVE. Any ACTIVE node, root/non-leaf/leaf, is selectable; inactive remains readable/resolvable. Deactivation rejects active descendants; no cascade/delete. FunctionalDirection is immutable; parent and child must share direction. |
| AssetType serialization | Persistence/AssetTypeCommandStore.cs starts READ COMMITTED, acquires the published transaction-scoped advisory lock namespace/id (1095980121, 1) (ASCII ASTY, taxonomy 1), clears tracked state, rereads target/hierarchy and authorization facts, then persists and commits. All hierarchy mutations use the same key. This is the only published Assets taxonomy lock identity; do not invent another. |
| Manufacturer mutation transaction | Persistence/ManufacturerCommandStore.cs uses READ COMMITTED transactions, version checks, and persists each Manufacturer mutation with its durable Audit obligation. It has no explicit shared/read lock protocol for consumers validating a Manufacturer reference. PostgreSQL UPDATE itself takes a conflicting row lock; a consumer that needs to serialize eligibility reads must acquire a row lock before reading and retain it to commit. |
| Identity GLOBAL handoff | Application/Authorization/IGlobalGrantProvider.cs accepts a server-composed GlobalGrantRequest; it evaluates an explicit current exact-permission GLOBAL grant. GLOBAL is not inferred from missing scope. See accepted ADR-018 and Identity Infrastructure GlobalGrantProvider. |
| Identity correlated tuples | Application/Authorization/IEffectiveScopeProvider.GetCurrentAssignmentScopesAsync returns immutable EffectiveAssignmentScopeFacts tuples for current exact permission/context, preserving each non-GLOBAL assignment and all five nullable dimensions. Do not flatten dimensions or synthesize a grant across assignments. See accepted ADR-019 and Identity Infrastructure EffectiveScopeProvider. |
| Canonical Model permission | SystemPermissionCatalog.cs defines assets.manage_models (Assets, catalog ordinal 22); 20260918133533_AddIdentityRolesAndPermissions.cs contains its seeded permission row; docs/permissions-registry.md declares scope global/asset_type, user kind INTERNAL, sensitivity SENSITIVE. It exists already: no permission seed is needed for this task. Permission existence alone grants no caller access. |
| Assets authorization boundary | Published AssetType public authorization accepts IDs/operation only and resolves target, direction and ancestry through Assets-owned persistence; the AssetType SEC-01 review/remediation and .agent/tasks/AUTH-SCOPE-01/asset-type-scope-state.md prohibit caller-supplied authorization DTO facts and tuple flattening. This is a required pattern to preserve, not a frozen AssetModel policy. |
| Durable Audit | Persistence/AssetsAuditObligation.cs, AssetsAuditObligationConfiguration.cs, AssetsDbContext.cs, Audit.Contracts AuditEntityType.cs, AuditAction.cs, AuditPayloadValidator.cs, and migrations implement Assets-owned obligation + business mutation in one transaction. Existing canonical entities/actions cover AssetType and Manufacturer only. ADR-008 separates Business History from technical Audit; ADR-011 requires atomic durable obligation and idempotent delivery. AssetModel will require a narrow canonical extension; no direct Audit DbContext write. |
| Schema sketch | docs/database.md §9.3 is a sketch, not an accepted AssetModel contract. It suggests Manufacturer + AssetType + model code/name and a possible uniqueness tuple, but does not settle lengths, normalization, lifecycle, verification, API or permission semantics. |

Accepted relevant architecture decisions include ADR-001, ADR-003, ADR-007, ADR-008, ADR-010, ADR-011, ADR-012, ADR-013, ADR-015, ADR-018 and ADR-019. No ADR body is changed or overridden here.

### Prerequisite status

- Manufacturer prerequisite: PASS — published reference provider and IsSelectableForNewModel contract exist.
- AssetType prerequisite: PASS — published persisted hierarchy, lifecycle, reference provider and taxonomy lock exist.
- Identity primitives: PASS — canonical permission and trusted GLOBAL/correlated-scope providers exist.
- AssetModel authorization mapping: OWNER DECISION ACCEPTED — OD-06 freezes management, general-read and management-view coverage; implementation remains future work.
- Assets Audit mechanism: PASS as infrastructure pattern; AssetModel canonical entity/actions/payload/schema extension remains future implementation work.
- Safe transaction strategy: technically feasible with published Assets PostgreSQL storage and lock conventions; exact consistency guarantee/order is OWNER DECISION REQUIRED, not proven by tests in this phase.
- No technical impossibility in the published prerequisites was found. Do not call an unimplemented AssetModel policy “already frozen.”

## Candidate identity, associations and schema

**Owner-accepted identity:** Assets owns AssetModel; each record has exactly one required ManufacturerId and one required AssetTypeId; both references are immutable after creation. A Manufacturer and an AssetType may each be referenced by many AssetModels. Different manufacturer/type associations require separate AssetModel records. No update, verification or lifecycle command may change either association. Existing references remain resolvable for history. Duplicate identity and normalization remain pending OD-ASSET-MODEL-02. The UUIDv7 ID and local RESTRICT FK shape remain proposed schema details, not separately accepted here.

Candidate fields only:

- id, manufacturer_id, asset_type_id
- model_code, model_name
- normalized_model_code, optionally a name search key if a concrete search need justifies it
- verification_status (UNVERIFIED/VERIFIED)
- lifecycle_status (ACTIVE/INACTIVE)
- verified_by, verified_at
- created_at, updated_at, positive row_version

Avoid aliases, description, merge, model proposal state, classification flags and seeds absent a decided requirement. A normalized name is not needed for uniqueness if names may duplicate; add it only for deterministic prefix search.

### Accepted OD-ASSET-MODEL-02 code/name and duplicate contract

- model_code is required and limited to 100 Unicode scalar values. model_name is a required display name limited to 200 Unicode scalar values.
- normalized_model_code is derived by the server; clients cannot submit the canonical key.
- Code normalization is Unicode White_Space trim at the boundaries -> NFC -> full Unicode case folding -> NFC, using the published Unicode 17.0.0 tables. Internal whitespace is significant and is neither removed nor collapsed. Punctuation is significant and preserved.
- Therefore UPS-20 and ups-20 collide; Straße-10 and STRASSE-10 collide; UPS-20, UPS/20 and UPS 20 are distinct; UPS 20 and UPS  20 are distinct.
- Normalize model_name using the existing Manufacturer name rule for search. Name uniqueness is not required.
- Database identity is exactly UNIQUE (manufacturer_id, asset_type_id, normalized_model_code). The constraint applies across every record, including INACTIVE and UNVERIFIED. The same normalized code is allowed for a different Manufacturer or AssetType.
- PostgreSQL uniqueness is authoritative under concurrent inserts; map this duplicate to canonical HTTP 409 MODEL_CODE_ALREADY_EXISTS. An application precheck is only UX and cannot replace the unique constraint.
- Code/name mutability after creation and the effect of changes on VERIFIED status are explicitly deferred to OD-ASSET-MODEL-03; OD-02 accepts no rule on them.

No second normalization engine is authorized. Future implementation should reuse the published Unicode 17 tables while preserving this code-specific rule (in particular, without Manufacturer's internal whitespace collapse). Any future Unicode version change requires collision preflight and an explicit contract/migration review.

Do not introduce a second Unicode engine merely to reproduce Manufacturer behavior. Reuse/refactor only after approved code/name algorithms and bounds are frozen. If tables or normalization version change later, add collision preflight before migration and preserve the deterministic algorithm/version needed to interpret stored keys.

## Verification (OD-03 accepted), lifecycle and selectability candidates

- Every new AssetModel is ACTIVE + UNVERIFIED. No caller may submit VERIFIED or verification metadata.
- Verification is an explicit command and requires a currently UNVERIFIED Model, Manufacturer ACTIVE+VERIFIED, AssetType ACTIVE, an authorized actor and expectedRowVersion. verified_by and verified_at are derived by the server. Exact permission authority remains OD-06; transactional/race enforcement remains OD-08.
- Revocation is an explicit command with a required trimmed reason of at most 500 characters. It clears current verified_by/verified_at and preserves verification history through Audit.
- Any actual model_code or model_name change invalidates VERIFIED, clears current verification metadata and requires explicit re-verification. ManufacturerId and AssetTypeId are immutable under OD-01. Manufacturer/AssetType status changes never automatically change Model verification_status.
- Parent status changes do not cascade into Model verification or lifecycle.
- Lifecycle is ACTIVE/INACTIVE and independent from verification. Lifecycle changes use explicit activate/deactivate commands with expectedRowVersion, an authorized actor and atomic Audit. They do not change verification status. Reactivation neither re-verifies nor invalidates an already verified Model. No physical delete and no lifecycle cascades from Manufacturer/AssetType or to other records.
- The general reference catalog contains only ACTIVE + VERIFIED AssetModels. The management catalog may contain all verification and lifecycle statuses, subject to authorization. Historical references remain resolvable regardless of status, subject to applicable read permissions.
- Accepted new Asset selectability requires all of: Model lifecycle ACTIVE; Model verification VERIFIED; Manufacturer lifecycle ACTIVE; Manufacturer verification VERIFIED; AssetType lifecycle ACTIVE; and the new Asset's asset_type_id exactly equal to AssetModel.asset_type_id. There is no hierarchy inheritance.
- Parent status changes dynamically affect Model selectability without modifying Model lifecycle/verification. Restoring parent eligibility restores selectability when Model itself remains ACTIVE+VERIFIED. Existing Assets and historical references are not changed or deleted by catalog status changes.
- Catalog selection is not authorization to persist a new Asset. The backend must revalidate selectability using authoritative current Assets data at Asset creation. Exact transaction/race protection remains pending OD-08.

No AssetModel reference provider currently exists. A future immutable scalar provider should return persisted Model/Manufacturer/AssetType facts, return missing separately from nonselectable, and expose no EF entity. IsSelectableForNewAsset must implement the accepted predicate from persisted facts.

## Authorization and trust boundary candidates

**Canonical existing facts:** assets.manage_models already exists, was initially seeded, and registry metadata says GLOBAL/AssetType scope. Manufacturer management is separate and GLOBAL-only; its policy must not be copied to AssetModel without a decision.

**Recommended default, not accepted:**

1. Require authenticated ACTIVE INTERNAL user and owned current INTERNAL working context for reference management, aligned with existing Assets catalog management. Contractor/external read eligibility must be explicitly decided; do not infer it from a UI route.
2. General catalog read requires a current exact assets.read assignment (or exact assets.manage_models for authorized management view) through trusted Identity providers. Because models are global master data, eligibility may authorize an unfiltered reference catalog rather than filtering rows by AssetType; decide whether scoped assets.read should qualify. Management results can expose UNVERIFIED/INACTIVE; ordinary reference results cannot.
3. Management requires exact assets.manage_models. Align with registry metadata: explicit GLOBAL or a complete non-geographic assignment with AssetType scope whose persisted subtree covers the model's exact AssetType. A direction restriction, if present in the same tuple, is an additional AND condition against the persisted AssetType FunctionalDirection. A direction-only grant is not accepted by current global/asset_type metadata unless owner deliberately changes that contract. Any geographic dimension denies model management; it never converts to global authority.
4. Creation authorizes the requested persisted AssetType under the same complete tuple; update/verify/revoke/lifecycle authorize the persisted current Model target, not caller-supplied facts. If classification is immutable, there is no destination scope transition.
5. Preserve tuple correlation and published terminal GLOBAL rules. Never union dimension sets across assignments.

Target-aware code must accept only stable IDs and operation (plus intended business command fields). It resolves Model, Manufacturer status, AssetType, direction and ancestry through Assets persistence; it obtains grants only via trusted Identity provider request composed with authenticated user/context/exact permission. Caller cannot supply target DTO, ancestry/direction, parent status, permission, GLOBAL flag, actor, verified metadata, scope, or row version as authorization evidence. The public application authorization contract must remain secure when invoked outside HTTP.

## Transaction and concurrency analysis

Race-sensitive checks cannot be ordinary unlocked reads followed by later writes.

| Race | Required future order and outcome candidate |
|---|---|
| Model create/verify against Manufacturer revoke/deactivate | In the same Assets READ COMMITTED transaction, lock the persisted Manufacturer row with PostgreSQL SELECT ... FOR SHARE before reading its eligibility; keep lock to commit. Manufacturer UPDATE waits if Model holds it. If revocation commits first, the locked reread sees ineligible and command conflicts. |
| Model verify/create/update against AssetType deactivate/reparent | Acquire the existing taxonomy advisory transaction lock (1095980121, 1) before rereading type, ancestry and scope facts. AssetType mutation uses the same exclusive lock, so the command is authorized/validated against a serialized current tree. Do not create another taxonomy lock key. |
| Type-scoped Model management vs reparent out of scope | Same taxonomy lock before target/ancestor resolution and authorization; load current complete Identity tuples after lock; evaluate persisted ancestry under that lock, then write state + Audit and commit. |
| Duplicate model creation or rename | Unique DB index is final authority; deterministic constraint-to-409 mapping. Never rely on an unlocked “exists” query. |
| Stale concurrent edit/verify | Compare positive expected rowVersion; no silent retry/overwrite; one mutation succeeds and the stale one conflicts. |
| Audit failure | Business row and durable Audit obligation share one transaction; either both commit or neither does. Dispatcher later delivers idempotently using stable auditEventId. |

Recommended lock order for future Model mutations: begin READ COMMITTED transaction -> acquire existing ASTY taxonomy lock -> acquire referenced Manufacturer row lock(s), in stable UUID order if more than one -> reread Model and references -> fetch/evaluate current trusted authorization -> validate state and expected rowVersion -> persist Model + obligation -> commit. Future Asset creation that validates/selects a Model must use a compatible order and lock/validation protocol. Manufacturer-only updates need no new lock identity: PostgreSQL row UPDATE locks conflict with consumer FOR SHARE locks.

This protocol is feasible within the published Assets schema and PostgreSQL; it is a candidate, not a frozen contract or verified race proof. Freeze lock order, whether all Model mutations take the taxonomy lock, and the future Asset consumer behavior before implementation. Cross-module DbContext access is neither needed nor allowed. Identity grant revocation concurrent with a request follows the trusted provider's current-assignment evaluation; do not claim a cross-context serializable grant lock not supplied by the contract.

## Bounded API, search, persistence and Audit candidates

All routes below are proposals only:

- Management: GET /api/v1/asset-models, GET /api/v1/asset-models/{id}, POST /api/v1/asset-models, PUT /api/v1/asset-models/{id}, explicit verify, revoke-verification, activate and deactivate command routes.
- General reference: a separately authorized reference read surface, or a visibility-filtered GET. Choose one response boundary; ordinary callers must not receive unverified metadata by accident.
- Every existing-row mutation carries expectedRowVersion. No DELETE. Server derives actor, timestamps, normalized values and verification/lifecycle states. Use the standard API error envelope; map stale version, invalid state and exact duplicate constraint to stable 409 codes; sanitize database errors and unauthorized target disclosure.
- Proposed paging: page=1, pageSize=50, max 200, stable tie-break by id. Candidate filters: manufacturerId, assetTypeId, normalized code exact/prefix, normalized name prefix, verification and lifecycle (management only). No substring/fuzzy/trigram without accepted requirement. Exact/prefix escapes are literal. Add indexes only for accepted filters and measured query shape.

Future Assets-owned persistence candidate: assets.asset_models, UUIDv7 PK; required local RESTRICT FKs to Manufacturer and AssetType; normalized code and status/metadata checks; positive row_version; UTC timestamps; unique composite index selected in OD-02; search indexes only as needed. No cross-module FK, no delete cascade, no seeds, no migration in this phase.

Future durable Audit must extend canonical Audit.Contracts and Assets obligation mechanism with entity AssetModel, validator payload schema and canonical actions following repository naming (recommended AssetModelCreated, AssetModelUpdated, AssetModelVerified, AssetModelVerificationRevoked, AssetModelActivated, AssetModelDeactivated). Each successful mutation commits exactly one matching obligation atomically with actor, context, correlation, UTC time, expected before/after identity/status facts, row version and revocation reason where applicable. Verification metadata is server-derived. Parent status changes must not silently update Model or create Model Audit. Business-history events are separate from technical Audit; TASK-03.02.02 acceptance does not by itself require an Asset operational-history subsystem.

No new Identity permission seed, role, assignment, grant, Manufacturer seed or Model seed is required by the current bounded task.

### Model proposal workflow boundary

TASK-03.02.03 stays P1 and separate. A proposal is a user-submitted request, not automatically an AssetModel row and not a pre-verified Model. Future workflow may create/promote a master Model only after responsible verification using the accepted Model contract. This phase adds no queue, approval chain, notification, workflow engine, proposal entity, or frontend.

## Risk matrix for future implementation evidence

| Risk | Prevention contract candidate | Required future evidence |
|---|---|---|
| Duplicate code across manufacturers/types | Explicit composite unique key; no accidental global code uniqueness | PostgreSQL inserts demonstrate allowed cross-manufacturer/type cases and rejected same-key case |
| Unicode/punctuation collisions | Pinned deterministic normalizer; punctuation preserved; C collation | Unit vectors for NFC/casefold/space and UPS-20 vs UPS/20 vs UPS 20; DB key equality tests |
| Concurrent duplicate create/rename | Unique index authoritative; exact constraint mapping | Two concurrent PostgreSQL commands; exactly one succeeds |
| Caller creates VERIFIED Model or supplies actor/normalized fields | Strict DTO binding; domain factory defaults; server-derived facts | Public API and direct public application contract forged-input tests |
| Verify without authority / unauthorized target disclosure | Exact permission, trusted context, target-aware ID authorization and concealed errors | Allowed/no permission/wrong scope/wrong context/contractor/missing target cases |
| Unverified/inactive Manufacturer or inactive AssetType bypass | Persisted reference facts; lock then eligibility validation | Create/verify attempts with each invalid parent state |
| Manufacturer revocation/deactivation race | Consumer FOR SHARE row lock held to commit | PostgreSQL interleaving tests for create/verify vs revoke/deactivate |
| AssetType deactivate/reparent race | Shared published taxonomy advisory lock; fresh hierarchy read | PostgreSQL interleaving tests including type-scoped authorization escape |
| Synthetic cross-assignment grant / forged direction | Immutable correlated Identity tuples; persisted target facts; no caller DTO facts | Direct public auth helper invoked with forged facts and crossed assignment tuples |
| Classification changed while VERIFIED | Immutable associations; code/name edit resets verification or is blocked | Domain/API transition tests including stale rowVersion |
| Audit omission/rollback | Model + obligation in one transaction; canonical validator | PostgreSQL commit, rollback, Audit payload and idempotent delivery tests |
| Raw DB error / unsafe uniqueness race response | Map named constraint only; sanitized error envelope | Duplicate, FK, DB-unavailable API tests with no provider detail leakage |
| Hard delete or orphaned history | RESTRICT references; no DELETE; inactive historical record | Migration/constraint tests and command surface assertion |
| Cross-module persistence violation | Model and both catalogs owned by Assets; no foreign DbContext | Architecture test and migration ownership check |

## Owner decisions (OD-01 through OD-05 accepted; all remaining recommendations are NOT accepted)

### OD-ASSET-MODEL-01 — identity and association cardinality

**STATUS:** ACCEPTED by the owner on 2026-10-13. No implementation authorization is implied.

**QUESTION:** Is one AssetModel exactly one Manufacturer + one AssetType, with those associations immutable after creation, or may it be reused across several types/manufacturers or reclassified in place?

**REPOSITORY_FACT:** Backlog uses singular Manufacturer and AssetType. The database sketch has one manufacturer_id and one asset_type_id. Both references are Assets-owned. No AssetModel aggregate exists.

**OPTIONS:** A) one required Manufacturer and one required AssetType, immutable association; B) one Manufacturer and many AssetTypes; C) many-to-many; D) associations mutable with mandatory reverification and full before/after Audit.

**ACCEPTED_DECISION:** One AssetModel belongs to Assets and has exactly one required ManufacturerId and one required AssetTypeId. Both are immutable after creation and cannot be changed through update, verification or lifecycle commands. Each Manufacturer and AssetType may have many AssetModels. A different manufacturer/type association requires a separate AssetModel record. Existing references remain resolvable for history. Duplicate identity and normalization are deferred to OD-ASSET-MODEL-02.

**RECOMMENDED_DEFAULT:** A — accepted by the owner as stated above.

**RATIONALE:** Matches backlog singular fields and the database sketch, preserves the meaning of verified classification, and keeps Asset selection deterministic.

**SECURITY_IMPACT:** Prevents relabeling a verified model into a type scope the actor cannot manage; authorization uses the persisted type.

**MIGRATION_IMPACT:** Requires single local Manufacturer and AssetType references, with no join table. Exact constraints and duplicate identity remain unresolved under OD-02.

**DOWNSTREAM_IMPACT:** Asset stores optional Model ID and requires exact AssetType match in TASK-03.04.01; Asset search joins through one stable association.

### OD-ASSET-MODEL-02 — fields, normalization and uniqueness

**STATUS:** ACCEPTED by the owner on 2026-10-13. Code/name mutability and verification invalidation remain deferred to OD-03.

**QUESTION:** Are code and name mandatory, what are their limits/equivalence rules, and which tuple uniquely identifies a Model?

**REPOSITORY_FACT:** Backlog requires code/name and duplicate prevention but gives no exact rules. Manufacturer name has a pinned Unicode 17 whitespace-collapse/NFC/full-casefold key and global uniqueness. Database sketch suggests Manufacturer + AssetType + normalized code. Technical codes may include significant punctuation and mixed scripts.

**OPTIONS:** A) required code/name, unique Manufacturer+AssetType+normalized code; B) code unique per Manufacturer across types; C) unique normalized name per Manufacturer+type; D) composite code+name; E) optional code with separate name fallback. Choose code normalization separately from name normalization and specify bounds.

**ACCEPTED_DECISION:** Both code and name are required; code max 100 Unicode scalar values, name max 200. The server derives normalized_model_code by Unicode 17.0.0 Unicode White_Space boundary trim -> NFC -> full case folding -> NFC, with published tables. Internal spaces and punctuation are significant and preserved. model_name uses the existing Manufacturer rule for search only and need not be unique. Enforce UNIQUE (manufacturer_id, asset_type_id, normalized_model_code) across every status, including INACTIVE and UNVERIFIED. Same normalized code under a different Manufacturer or AssetType is allowed. Concurrent duplicate requests result in one insert and one HTTP 409 MODEL_CODE_ALREADY_EXISTS. Code/name mutability and VERIFIED consequences are deferred to OD-03.

**RECOMMENDED_DEFAULT:** Accepted in full, with the code normalization clarifications recorded above.

**RATIONALE:** Avoids unsupported global code uniqueness and avoids conflating punctuation. Manufacturer+type+code follows the sketch; the owner has accepted the proposed bounds and equivalence rules.

**SECURITY_IMPACT:** Deterministic server-derived key + database unique index prevents Unicode/race bypass; no caller-provided normalized value; cross-manufacturer/type duplicates are explicitly accepted.

**MIGRATION_IMPACT:** Defines normalized column, collation, unique/search indexes and collision preflight. Changing equivalence or bounds later may require data repair/migration.

**DOWNSTREAM_IMPACT:** Asset selector and Asset search consume stable model code/name keys; no code-missing matching ambiguity.

### OD-ASSET-MODEL-03 — verification

**STATUS:** ACCEPTED by the owner on 2026-10-13. Permission details, parent-state selectability and transaction/race behavior remain deferred to OD-06, OD-05 and OD-08 respectively.

**QUESTION:** Does direct Model creation start UNVERIFIED; who can verify/revoke; what identity change invalidates verification; must parent references be eligible at verify time?

**REPOSITORY_FACT:** Backlog requires verified status. Manufacturer verification is separate and does not verify a future Model. Manufacturer name changes invalidate Manufacturer verification. No Model verification contract exists.

**OPTIONS:** A) direct create as UNVERIFIED; authorized explicit verify/revoke; code/name change resets verification; immutable associations; verify only with ACTIVE+VERIFIED Manufacturer and ACTIVE AssetType. B) auto-verify on create. C) allow verified identity edits without reset. D) parent changes cascade Model verification.

**ACCEPTED_DECISION:** Statuses are UNVERIFIED/VERIFIED. Every new Model is UNVERIFIED. Verification is explicit and requires Manufacturer ACTIVE+VERIFIED, AssetType ACTIVE, currently UNVERIFIED Model, authorized actor and expectedRowVersion. Server derives verified_by/verified_at. Revocation is explicit; reason is required, trimmed and max 500; current verification metadata is cleared and history is preserved through Audit. Any actual model_code/model_name change invalidates VERIFIED, clears current metadata and requires explicit re-verification. ManufacturerId and AssetTypeId remain immutable under OD-01. Manufacturer/AssetType status changes do not automatically modify Model verification_status. Authorization details are OD-06; parent-state selectability is OD-05; transaction/race consistency is OD-08.

**RECOMMENDED_DEFAULT:** Accepted in full as clarified above.

**RATIONALE:** Makes “verified” evidence about the Model's own identity/classification and avoids inheriting upstream verification.

**SECURITY_IMPACT:** Prevents caller-forged VERIFIED state and verification against an invalid parent; exact actor permission is OD-06.

**MIGRATION_IMPACT:** Status + nullable verification actor/time, checks enforcing metadata/status consistency, canonical Audit actions and payload validation.

**DOWNSTREAM_IMPACT:** Proposal workflow can later request verification without conflating proposal with master Model; Asset selector filters unverified rows.

### OD-ASSET-MODEL-04 — lifecycle and general-reference publication

**STATUS:** ACCEPTED by the owner on 2026-10-13. Parent-state-dependent Asset selectability remains deferred to OD-05.

**QUESTION:** Does Model need independent ACTIVE/INACTIVE lifecycle, and what states are visible to management vs general reference callers?

**REPOSITORY_FACT:** Manufacturer has independent lifecycle and verification, no hard delete, and existing rows remain resolvable. TASK-03.02.03 says only verified model becomes general reference. Model lifecycle is not stated in backlog.

**OPTIONS:** A) independent lifecycle, no delete, management sees all, general catalog only ACTIVE+VERIFIED; B) verification only; C) lifecycle cascades from parent; D) hard delete.

**ACCEPTED_DECISION:** Model lifecycle is ACTIVE/INACTIVE and independent of verification. New AssetModel is ACTIVE + UNVERIFIED. General reference catalog includes only ACTIVE + VERIFIED Models. Management catalog may include all verification/lifecycle states subject to authorization. Historical references remain resolvable regardless of status subject to applicable read permissions. Activate/deactivate are explicit commands requiring expectedRowVersion, authorized actor and atomic Audit. Lifecycle commands do not modify verification. Reactivation neither automatically re-verifies nor invalidates existing verification. No physical delete; no automatic lifecycle cascades from Manufacturer or AssetType and no cascading lifecycle changes to other records. Parent-state-dependent new Asset selectability remains OD-05.

**RECOMMENDED_DEFAULT:** Accepted as stated above.

**RATIONALE:** Preserves history and keeps lifecycle independent from correctness/verification.

**SECURITY_IMPACT:** Avoids accidental publication of unverified or retired rows and preserves existing links.

**MIGRATION_IMPACT:** Adds lifecycle column/check and explicit activate/deactivate Audit actions; no delete path.

**DOWNSTREAM_IMPACT:** TASK-03.02.03 promotes only after responsible verification; Asset creation requires active Model.

### OD-ASSET-MODEL-05 — new Asset selectability and parent-state changes

**STATUS:** ACCEPTED by the owner on 2026-10-13. Cross-catalog transaction/race safety remains deferred to OD-08.

**QUESTION:** Is a Model selectable only for its exact AssetType and only while Model ACTIVE+VERIFIED, Manufacturer ACTIVE+VERIFIED and AssetType ACTIVE; what happens when parent eligibility changes and later returns?

**REPOSITORY_FACT:** Manufacturer's published IsSelectableForNewModel is ACTIVE+VERIFIED; existing references remain resolvable after parent state changes. Any ACTIVE AssetType, root/non-leaf/leaf, can be selected by future Asset consumers. No Model provider exists.

**OPTIONS:** A) dynamic gate by Model, Manufacturer and AssetType current states plus exact AssetType match; no cascade and eligibility returns when parents do; B) model stays selectable after parent change; C) permanently invalidate Model; D) inherit to descendant AssetTypes.

**ACCEPTED_DECISION:** New Asset selectability requires ALL: AssetModel.lifecycle_status ACTIVE; AssetModel.verification_status VERIFIED; Manufacturer.lifecycle_status ACTIVE; Manufacturer.verification_status VERIFIED; AssetType.lifecycle_status ACTIVE; New Asset.asset_type_id exactly equals AssetModel.asset_type_id. No inheritance across AssetType descendants. Parent status changes dynamically affect selectability without modifying Model lifecycle/verification. Restoring parent eligibility restores selectability while Model remains ACTIVE+VERIFIED. Existing Assets and historical references are unchanged and not deleted by catalog status changes. Catalog selection is not authorization to persist an Asset; selectability must be revalidated against authoritative Assets data when the Asset is created. Transaction/race safety remains OD-08.

**RECOMMENDED_DEFAULT:** Accepted in full as stated above.

**RATIONALE:** Separates Model correctness from current ability to create a new Asset and follows each published catalog's resolvability/selectability split.

**SECURITY_IMPACT:** Prevents stale/inactive manufacturer/type references from being used for new assets while avoiding hidden destructive cascades.

**MIGRATION_IMPACT:** No cascading schema update; future provider/query must atomically read authoritative parent state and follow OD-08 locking.

**DOWNSTREAM_IMPACT:** TASK-03.04.01 enforces the predicate at backend command boundary; TASK-03.04.03 filters by Model association.

### OD-ASSET-MODEL-06 — read, management and verification authorization

**STATUS:** ACCEPTED by the owner on 2026-10-13. Hierarchy races and lock ordering remain deferred to OD-08.

**QUESTION:** Who can read general/management catalogs and perform create/update/verify/revoke/lifecycle; does management use GLOBAL only or AssetType scope; how are direction, geography, contractors and missing targets handled?

**REPOSITORY_FACT:** assets.manage_models exists in canonical catalog and seed migration; registry scope is GLOBAL/AssetType and user kind INTERNAL. Manufacturer management is separately GLOBAL-only. Identity provides exact GLOBAL and correlated current tuple facts. AssetType policy demonstrates persisted target-aware authorization but does not define AssetModel authorization.

**OPTIONS:** A) exact GLOBAL only; B) GLOBAL or AssetType subtree; C) GLOBAL/direction/type scope with same-tuple intersections; D) copy Manufacturer GLOBAL-only. Decide read eligibility and contractor context independently.

**ACCEPTED_DECISION:** Management uses exact `assets.manage_models`; caller and context must be ACTIVE INTERNAL with a valid owned INTERNAL context. Management is allowed by explicit effective GLOBAL for the exact permission, or valid AssetType subtree coverage in one complete assignment. For scoped management, `asset_type_id` is required and the subtree root is included. An optional `functional_direction_id` is conjunctive within the same tuple. Geographic fields make an assignment ineligible; direction-only assignment is insufficient; scopes from different assignments are never synthesized. Create authorization uses the server-loaded requested AssetType; existing-target authorization uses the persisted `AssetModel.AssetTypeId`. Persisted Assets hierarchy is authoritative.

General catalog access requires exact `assets.read` and includes only ACTIVE+VERIFIED Models. GLOBAL read is unfiltered. Scoped read is filtered by valid AssetType subtree coverage; geography-containing and direction-only tuples do not authorize Model catalog reads. Management view requires exact `assets.manage_models` and exposes all Model statuses only within authorized scope; management permission does not imply general `assets.read`.

Contractors and EXTERNAL contexts are denied. `assets.manage_types` and `assets.manage_manufacturers` do not grant Model management. Authorization uses trusted `IGlobalGrantProvider` and `IEffectiveScopeProvider`; caller-forgeable authorization facts are prohibited and evaluation fails closed. Unauthorized direct targets are hidden under the canonical API policy. Hierarchy races and lock ordering remain OD-08.

**RATIONALE:** Uses existing permission and its declared scope without silently borrowing Manufacturer's unrelated GLOBAL-only policy or treating a concrete/geographic scope as global.

**SECURITY_IMPACT:** High. Scope, target facts, contractor eligibility and target concealment are publication-critical. No caller-supplied facts and no cross-assignment synthesis.

**MIGRATION_IMPACT:** No permission seed. If accepted policy exceeds current registry metadata, update permission registry/docs and possibly permission scope metadata in an explicitly authorized later phase; do not silently broaden.

**DOWNSTREAM_IMPACT:** Controls Model administration, general/management catalog reads and future Asset creation. All scope checks use persisted target facts and the accepted trusted providers; no consumer may treat management permission as general read permission.

### OD-ASSET-MODEL-07 — API, search, Audit and seed boundary

**STATUS:** ACCEPTED by the owner on 2026-10-13. Exact route paths and response metadata remain to be aligned with existing Assets API conventions before implementation; they are not frozen by OD-07. Cross-catalog transaction/race policy remains OD-08.

**QUESTION:** Which management/general-reference routes and filters are required, what metadata is visible, what Audit action/payload set is canonical, and are any seeds required?

**REPOSITORY_FACT:** Candidate routes in task are explicitly proposals. Manufacturer/AssetType use paginated APIs, rowVersion, command endpoints, no DELETE and durable canonical Audit obligations. No AssetModel route/entity/action exists. Existing assets.manage_models seed exists.

**OPTIONS:** A) separate management and filtered general reference surfaces; exact/prefix search and bounded pagination; six mutation Audit actions; no seeds. B) one permission-dependent response; additional fuzzy/substring search or aliases; add seed values.

**ACCEPTED_DECISION:** Provide separate general-reference and management catalog surfaces, both constrained by OD-06 scopes. General reference includes only ACTIVE+VERIFIED Models and requires exact `assets.read`. Management catalog includes all states within authorized scope and requires exact `assets.manage_models`.

Commands are create, update, verify, revoke-verification, activate and deactivate. No physical DELETE. Exact route paths and response metadata must follow existing Assets API conventions before implementation and are not frozen by OD-07.

Search supports exact `manufacturer_id` and `asset_type_id` filters, plus exact and normalized-prefix search for `model_code` and `model_name`. Status filters are management-only. Execute search in PostgreSQL and escape LIKE metacharacters so prefix matching treats them literally. Do not add fuzzy, substring or full-text search. Sort by `normalized_model_code ASC, id ASC`. Pagination defaults to page 1 and size 50, with maximum size 200.

Canonical Audit action categories are `ModelCreated`, `ModelUpdated`, `ModelVerified`, `ModelVerificationRevoked`, `ModelActivated` and `ModelDeactivated`. Actor and context are server-derived. Audit captures before/after facts and revocation reason; verification invalidation is captured by `ModelUpdated`. Persist the durable Audit obligation atomically with the business mutation. Add no AssetModel production seeds or permission seeds. Proposal workflow and frontend are out of scope.

**RATIONALE:** Reuses existing Assets patterns and limits information exposure and unnecessary indexing.

**SECURITY_IMPACT:** Avoids leaking UNVERIFIED/INACTIVE status/metadata; stable errors avoid raw DB disclosure; Audit is mandatory for mutations.

**MIGRATION_IMPACT:** Future migration extends Assets table and audit obligation checks/indexes; canonical Audit.Contracts and docs require synchronized updates. No migration now.

**DOWNSTREAM_IMPACT:** Proposal workflow remains separate; Asset creation uses a selectability reference contract; Asset search can filter by stable IDs.

### OD-ASSET-MODEL-08 — cross-catalog consistency and lock order

**STATUS:** ACCEPTED by the owner on 2026-10-13. The real PostgreSQL Manufacturer row-lock compatibility check is a final prerequisite gate; failure requires `PREREQUISITE_CONTRACT_GAP` and stop.

**QUESTION:** Accept a transaction-scoped ASTY taxonomy lock plus Manufacturer row FOR SHARE protocol for Model validation/authorization, held through Model+Audit commit, and require compatible locking in future Asset creation?

**REPOSITORY_FACT:** AssetType commands use READ COMMITTED and the exclusive transaction-scoped advisory lock `(1095980121, 1)` before rereading target/hierarchy facts. Manufacturer commands use READ COMMITTED and optimistic rowVersion; they do not take a consumer reference lock. A real PostgreSQL 18.6 Testcontainers check confirmed that their UPDATE writes conflict with a consumer `FOR SHARE` lock in both transaction orderings. Manufacturer, AssetType and future AssetModel share Assets PostgreSQL storage. Future Asset creation must revalidate the complete OD-05 predicate at its commit boundary.

**OPTIONS:** A) One READ COMMITTED transaction; AssetType and AssetModel mutations take the existing exclusive ASTY lock; future Asset creation takes the shared form of the same key; acquire Manufacturer `FOR SHARE`; reread authoritative facts and authorization; persist the business write and Audit obligation atomically. B) validate via unlocked reads and accept stale-reference races. C) introduce a different lock identity. D) cascade parent state changes into Model.

**ACCEPTED_DECISION:** PostgreSQL isolation is `READ COMMITTED`. Reuse the common taxonomy advisory key `(1095980121, 1)`. AssetType and AssetModel hierarchy-dependent mutations take the exclusive transaction-scoped ASTY lock. Future Asset creation takes the shared transaction-scoped ASTY lock. Global lock order is: (1) ASTY advisory lock; (2) Manufacturer `SELECT FOR SHARE` where parent-state validation is required; (3) authoritative persisted Assets reads; (4) trusted Identity authorization; (5) business validation and mutation; (6) durable Assets Audit obligation; (7) COMMIT. All locks remain held through commit.

Manufacturer writes use the existing PostgreSQL row-level UPDATE locking protocol. Confirm in real PostgreSQL integration tests that Manufacturer writes conflict with consumer `FOR SHARE`; if they do not participate correctly, record `PREREQUISITE_CONTRACT_GAP` and STOP. Do not introduce a new advisory-lock key. AssetType hierarchy and scoped management use fresh persisted facts after ASTY acquisition. Do not trust pre-lock cached ancestry, target DTO facts, caller-supplied scope or authorization evidence. No automatic lifecycle or verification cascades. AssetModel changes and durable Audit obligation are atomic in one Assets transaction. Every existing-target mutation requires `expectedRowVersion`. Lock inversion is forbidden; acquire multiple Manufacturer locks in deterministic ID order.

Controlled PostgreSQL concurrency coverage required for implementation includes both orderings of: Model create vs Manufacturer deactivate; Model verify vs Manufacturer verification revoke; Model create vs AssetType deactivate; scoped Model update vs AssetType reparent; Model verify vs Model rename; and Model deactivate vs Model verify. Future Asset creation must recheck Model, Manufacturer and AssetType selectability while holding the shared ASTY lock and compatible Manufacturer row lock. Asset creation is not part of TASK-03.02.02. No code implementation until the final prerequisite gate passes and separate ASSET-MODEL-01 authorization is granted.

**RATIONALE:** Reuses the published AssetType lock identity, permits compatible concurrent Asset creates, serializes them against type/model mutations, and makes Manufacturer status changes wait or be observed before mutation. The Manufacturer row-lock interaction is confirmed against real PostgreSQL. The accepted Model-specific race matrix remains to be exercised during the separately authorized implementation phase.

**SECURITY_IMPACT:** Critical. Prevents authorization against stale hierarchy and use/verification against stale parent eligibility.

**MIGRATION_IMPACT:** No schema change inherently; future implementation must use transaction-bound PostgreSQL commands, deterministic lock order, constraints and real PostgreSQL concurrency tests.

**DOWNSTREAM_IMPACT:** TASK-03.04.01 must use compatible Model/Manufacturer/AssetType locking or prove an equivalent predicate-at-commit guarantee. No safe consumer may trust a previously cached selectability boolean.

## Definition of Ready

- BACKLOG: VERIFIED (scope and ordering consistent; documentation status drift recorded)
- MODULE_OWNER: Assets
- ENTITY: AssetModel
- MANUFACTURER_PREREQUISITE: PASS
- ASSETTYPE_PREREQUISITE: PASS
- IDENTITY_AUTH_PREREQUISITE: CONTRACT ACCEPTED for AssetModel-specific scope/read mapping; trusted provider implementation remains future work
- AUDIT_PREREQUISITE: PASS for durable obligation pattern; Model contract extension remains implementation work
- CONCURRENCY_CONTRACT: READY — OD-08 accepted; real PostgreSQL Manufacturer `FOR SHARE`/UPDATE prerequisite validation PASS; AssetModel-specific race matrix remains required in ASSET-MODEL-01
- PERMISSION_REGISTRY: READY for existing assets.manage_models; accepted OD-06 policy uses its declared scope metadata
- OWNER_DECISIONS: NONE (OD-ASSET-MODEL-01..08 accepted)
- IMPLEMENTATION_READY: YES (contract/prerequisite readiness only; implementation authorization remains NONE)

## Independent analysis review (read-only)

A separate final checklist pass was made against backlog fidelity, dependency boundaries, Manufacturer selectability, AssetType lifecycle/selectability, permission registry/seed, GLOBAL and correlated tuple APIs, caller-forgeable target facts, normalization/unique-race semantics, parent-state races, proposal workflow separation, durable Audit and the requested owner-decision template.

Findings: no backlog sequencing conflict; Manufacturer and AssetType prerequisites are present; OD-06 and OD-08 now freeze AssetModel authorization and transaction policies; punctuation and cross-assignment constraints remain explicit; proposal workflow stays separate. No AssetModel implementation security review or AssetModel race tests were performed. The final prerequisite gate separately exercised the existing Manufacturer command store against PostgreSQL row locks as recorded below.

## Final prerequisite gate — post OD-08

- OWNER_DECISIONS: NONE; OD-ASSET-MODEL-01..08 ACCEPTED on 2026-10-13.
- MANUFACTURER_ROW_LOCK_CHECK: PASS using a disposable PostgreSQL 18.6 Testcontainers database and the actual `IManufacturerCommandStore`.
- Scenario 1: consumer transaction acquired Manufacturer `SELECT FOR SHARE`; actual `DeactivateAsync` UPDATE waited. `pg_stat_activity` and `pg_blocking_pids` confirmed the lock wait/blocker; after consumer commit, the Manufacturer command committed.
- Scenario 2: actual `RevokeVerificationAsync` persisted its UPDATE while its transaction remained open; a consumer `SELECT FOR SHARE` waited on that writer. PostgreSQL confirmed the blocker; after writer commit, the consumer observed `UNVERIFIED`.
- This validates both lock orderings against existing Manufacturer UPDATE writes. The disposable database/container were removed. No repository test or production source was changed.
- The six accepted Model/Manufacturer/AssetType concurrency races remain implementation acceptance tests for separately authorized ASSET-MODEL-01; AssetModel does not yet exist and those cases were not executed here.
- FINAL_PREREQUISITE_GATE: PASS. If future production Manufacturer writes stop participating in PostgreSQL row-level UPDATE locks, stop with `PREREQUISITE_CONTRACT_GAP`.
- IMPLEMENTATION_AUTHORIZATION: NONE. No ASSET-MODEL-01 code work is authorized by this checkpoint.

## Change boundary and checkpoint

Initial known modified paths preserved:

- .agent/tasks/AUTH-SCOPE-01/asset-type-scope-state.md
- .agent/tasks/AUTH-SCOPE-01/state.md
- .agent/tasks/TASK-02.02.02/state.md
- .agent/tasks/TASK-03.01.01/asset-type-f1-state.md
- .agent/tasks/TASK-03.01.01/state.md
- .agent/tasks/TASK-03.02.01/state.md

Initial known untracked review/operational paths preserved:

- .agent/tasks/AUTH-SCOPE-01/agents/asset-scope-01-security-review.md
- .agent/tasks/TASK-03.01.01/asset-type-review-r2.md
- .agent/tasks/TASK-03.01.01/asset-type-review.md
- .agent/tasks/TASK-03.02.01/manufacturer-01f1-state.md
- .agent/tasks/TASK-03.02.01/manufacturer-review-r2.md
- .agent/tasks/TASK-03.02.01/manufacturer-review.md

SHA-256 values for all 12 pre-existing dirty paths were compared before and after checkpoint creation; every hash matched. Existing checkpoints remain untouched byte-for-byte.

Final repository reconciliation:

- CURRENT_BRANCH: main
- HEAD: 949b74c1c645e5abfbfbcf2c96e65778b891f14e
- ORIGIN_MAIN: 949b74c1c645e5abfbfbcf2c96e65778b891f14e
- STAGING: EMPTY
- WORKTREE: one primary worktree at the repository root
- GIT_STATUS: the 12 known pre-existing dirty paths above plus only .agent/tasks/TASK-03.02.02/state.md
- DIFF_CHECK: PASS; git diff --check reported no whitespace errors, and the new untracked checkpoint was separately checked for trailing whitespace

APPLICATION_CODE_CHANGED: NO
SCHEMA_CHANGED: NO
MIGRATION_CREATED: NO
PERMISSION_SEEDS_CHANGED: NO
FRONTEND_CHANGED: NO
EXISTING_CHECKPOINTS_CHANGED: NO
BRANCH_CREATED: NO
WORKTREE_CREATED: NO
COMMIT: NONE
PUSH: NONE

CHECKPOINT_CREATED: .agent/tasks/TASK-03.02.02/state.md
NEXT_ACTION: Wait for separate ASSET-MODEL-01 authorization. Do not implement AssetModel or Asset creation under ASSET-MODEL-00.
STOP.

## ASSET-MODEL-01 implementation authorization and resume checkpoint

Owner authorization was granted on 2026-10-18 for backend AssetModel implementation under accepted OD-ASSET-MODEL-01..08. This supersedes the earlier ASSET-MODEL-00 authorization status above. The implementation must remain on `main`, preserve all pre-existing operational/review files, create one local commit only after all authorized local checks PASS, never push, and stop before independent ASSET-MODEL-01R.

Pre-implementation repository guard:

- CURRENT_BRANCH: `main`
- HEAD: `949b74c1c645e5abfbfbcf2c96e65778b891f14e`
- ORIGIN_MAIN: `949b74c1c645e5abfbfbcf2c96e65778b891f14e`
- STAGING: EMPTY
- WORKTREE: one primary worktree at repository root
- Pre-existing modified and untracked operational/review files: preserved; see the exact lists in the ASSET-MODEL-00 checkpoint above.
- No source files had been changed at authorization start.

Authorized scope: AssetModel Domain, Application, Infrastructure, Assets migration, API, scoped authorization, Unicode normalization, verification, lifecycle, search, atomic Audit, and PostgreSQL race tests.

Forbidden scope: Asset creation, Model proposal workflow, frontend production features, new Identity permissions, and unrelated Manufacturer/AssetType changes.

NEXT_ACTION: Finish persistence guards, AssetModel migration, controlled PostgreSQL tests and API authorization checks; synchronize documentation, run all required local checks, then create one explicit-path local commit on main. Do not push or start ASSET-MODEL-01R.

### Safe implementation checkpoint — 2026-10-18

- Completed: AssetModel domain entity/statuses and Unicode 17 model-code key normalization; Application commands/read contracts and target-aware scope authorization; PostgreSQL read store; transactional command store with the shared ASTY lock and Manufacturer `FOR SHARE`; canonical Audit entity/actions/payload schema; API endpoints and registration.
- Early check: `dotnet build src/backend/Exploitation.Api/Exploitation.Api.csproj -c Release --no-restore` PASS (zero warnings/errors).
- This is an implementation-in-progress checkpoint, not a review or publication checkpoint. PostgreSQL migration and race tests, broader API checks, documentation sync, full local checks, and the authorized commit remain outstanding.
- Current task changes are uncommitted and unstaged. Pre-existing operational/review files remain preserved. `LAST_SAFE_COMMIT` remains the published baseline `949b74c1c645e5abfbfbcf2c96e65778b891f14e`.
- No Asset creation, proposal workflow, frontend, Identity permission, or unrelated Manufacturer/AssetType product behavior has been added.

NEXT_ACTION: Complete AssetModel database/Audit configuration and generate the Assets migration; then add deterministic PostgreSQL persistence/race and HTTP authorization coverage before documentation and final checks.

### Safe implementation checkpoint — 2026-10-18 (resume)

- Repository resume guard reconciled: `main`, `HEAD` and `origin/main` remain at `949b74c1c645e5abfbfbcf2c96e65778b891f14e`; index remains empty. Existing operational/review paths remain present and unstaged.
- The `ASSET-MODEL-01` implementation and migration now exist in the working tree. The generated EF migration is `20261018023154_AddAssetModels`; its down migration refuses to remove model or Audit history.
- `dotnet build src/backend/Exploitation.Api/Exploitation.Api.csproj -c Release --no-restore`: PASS, zero warnings/errors.
- `dotnet build tests/integration/Exploitation.AssetsApiChecks/Exploitation.AssetsApiChecks.csproj -c Release --no-restore`: PASS, zero warnings/errors.
- `dotnet build tests/integration/Exploitation.AssetsPersistenceChecks/Exploitation.AssetsPersistenceChecks.csproj -c Release --no-restore`: PASS, zero warnings/errors after removing the redundant early race-only top-level return; AssetModel persistence/races remain in the full harness.
- Contract reconciliation changed AssetModel Audit action IDs to the accepted OD-07 names: `ModelCreated`, `ModelUpdated`, `ModelVerified`, `ModelVerificationRevoked`, `ModelActivated`, `ModelDeactivated`.
- Runtime PostgreSQL harnesses, HTTP AssetModel authorization/search/commands, audit rollback, documentation sync, final checks and the single authorized local commit remain outstanding.
- No changes have been staged or committed; `LAST_SAFE_COMMIT` remains `949b74c1c645e5abfbfbcf2c96e65778b891f14e`. No push.

NEXT_ACTION: Add AssetModel HTTP integration coverage and persistence assertions for verification invalidation, parent selectability restoration, atomic Audit failure, and concurrent duplicate creation; then synchronize module/context/database/Audit documentation.

### Safe implementation checkpoint — 2026-10-18 (local checks complete)

- IMPLEMENTATION_AUTHORIZATION: GRANTED. IMPLEMENTATION_STATUS: IN_PROGRESS; implementation and documentation are complete locally, with the authorized single local commit remaining.
- Repository guard still reconciles to `main`; `HEAD` and `origin/main` are `949b74c1c645e5abfbfbcf2c96e65778b891f14e`; staging is empty. No branch or worktree was created.
- `dotnet build Exploitation.sln -c Release --no-restore`: PASS, zero warnings/errors.
- `dotnet run --project tests/unit/Exploitation.AssetsDomainChecks/Exploitation.AssetsDomainChecks.csproj -c Release`: PASS.
- `dotnet run --no-build --project tests/integration/Exploitation.AssetsPersistenceChecks/Exploitation.AssetsPersistenceChecks.csproj -c Release`: PASS against disposable PostgreSQL/Testcontainers; AssetModel persistence, migration/constraints, atomic Audit rollback, duplicate uniqueness, and all 12 ordered PostgreSQL race cases passed. Concurrent normalized duplicate creation yielded one success, one canonical conflict, one row and one Audit obligation.
- `dotnet run --no-build --project tests/integration/Exploitation.AssetsApiChecks/Exploitation.AssetsApiChecks.csproj -c Release`: PASS against disposable PostgreSQL/Testcontainers; authorization, general/management catalogs, search, commands, immutable associations, no descendant inheritance, and HTTP duplicate race passed (`201` + canonical `409`).
- `dotnet run --no-build --project tests/integration/Exploitation.AuditPersistenceChecks/Exploitation.AuditPersistenceChecks.csproj -c Release`: PASS.
- `dotnet run --no-build --project tests/architecture/Exploitation.ArchitectureChecks/Exploitation.ArchitectureChecks.csproj -c Release`: PASS.
- DOCS_IMPACT: YES — schema, API, authorization, Unicode, lifecycle, Audit, concurrency and backlog status changed. DOCUMENTATION_SYNC: PASS — Assets/Audit module docs, context capsules, database contract and backlog are synchronized to the local candidate and clearly mark independent review/publication as pending.
- `git diff --check`: PASS; new task-owned files have no trailing whitespace. The one API-check build collision observed while separate projects wrote the shared `obj` directory was immediately rerun serially and passed; no code failure remains.
- All existing operational/review paths remain unstaged and unmodified by this implementation. Only task-owned AssetModel source, migration, tests, docs and this checkpoint are to be included in the commit. Forbidden adjacent work (Asset creation, proposal workflow, frontend production, new Identity permissions/seeds, unrelated Manufacturer/AssetType behavior) remains absent.
- No independent ASSET-MODEL-01R review, push or hosted publication has started. `LAST_SAFE_COMMIT` remains the published baseline until the next action completes.

NEXT_ACTION: Stop after ASSET-MODEL-01. Wait for separate ASSET-MODEL-01R authorization; do not push or begin independent review in this phase.

### Final safe checkpoint — 2026-10-18 (single local commit complete)

- Exactly one local TASK-03.02.02 commit is present on `main`, with the published baseline as its parent. Resolve the exact commit SHA from `git rev-parse HEAD`; the task checkpoint cannot embed its own commit hash.
- Post-commit guard: `main`; `origin/main` remains `949b74c1c645e5abfbfbcf2c96e65778b891f14e`; one worktree; no staged changes. The six pre-existing modified operational checkpoints and six pre-existing untracked review files remain untouched and outside the commit.
- All task-owned implementation, migration, tests, documentation and checkpoint files are committed. No Asset creation, proposal workflow, frontend production, new Identity permission/seed or unrelated Manufacturer/AssetType product changes were added.
- Local checks remain PASS as recorded in the preceding safe checkpoint. No push or independent ASSET-MODEL-01R review has started.

NEXT_ACTION: Stop. Continue only in the separate ASSET-MODEL-01R review phase; do not push.
