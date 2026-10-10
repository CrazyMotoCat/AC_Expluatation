# TASK-03.02.01 — MANUFACTURER-00 contract and prerequisite gate

STATUS: OWNER_DECISIONS_REQUIRED
PHASE: MANUFACTURER-00 — READ / ANALYZE / DOCUMENT ONLY
BASELINE_SHA: 4dd9aea7c8ba940d3d8715a5d54fb7a5e3c16724
CURRENT_BRANCH: main
HEAD: 4dd9aea7c8ba940d3d8715a5d54fb7a5e3c16724
ORIGIN_MAIN: 4dd9aea7c8ba940d3d8715a5d54fb7a5e3c16724
REPOSITORY_STATE_GUARD: PASS; fetched origin, branch/HEAD/origin match, no local-only commits, one primary worktree, no staged paths.
TASK_RESUME: new task; no prior TASK-03.02.01 checkpoint existed.

## Scope and authoritative backlog

Verified current docs/backlog.md:
- TASK-03.02.01 Manufacturers acceptance: normalized uniqueness, verified status, search.
- TASK-03.02.02 Asset models acceptance: manufacturer, asset type, model code/name, verified status, duplicate prevention.
- TASK-03.02.03 Model proposal workflow is P1: user proposes a missing model, responsible employee verifies, only verified model becomes general reference.
- TASK-03.04.01 Create asset makes Model optional and requires permission/scope, audit, and AssetCreated business event.

The IDs and order match the task request. Backlog does not define a Manufacturer-specific proposal workflow, normalization rules, API, permissions, statuses, or dependency edge. TASK-03.02.03 is explicitly a Model proposal workflow; it is not evidence that a Manufacturer proposal object belongs in this task.

In scope: prepare the Manufacturer contract/prerequisite analysis and proposed owner decisions. Out of scope: implementation, AssetModel, Model proposals, Asset, migrations, permission seeds, frontend, Manufacturer proposal workflow, aliases/merge, imports, and external registry integration.

## Published foundation and repository facts

- Assets is the authoritative module owner. docs/architecture.md and docs/modules/assets.md place manufacturers and asset_models in Assets; the reference-data registry classifies Manufacturer as an Assets-owned configurable reference (vendor names). No Organization, Site, FunctionalDirection, or per-Site Manufacturer ownership is documented.
- Manufacturer, AssetModel, routes, and persistence do not exist in src/backend/Modules/Assets. Current Assets persistence is AssetType plus the Assets audit-obligation path. There is no reusable Unicode manufacturer normalizer or master-data framework.
- docs/database.md calls itself a logical target model, not a required first-release schema. Its Manufacturer sketch (docs/database.md 1182-1198) lists id, code, name, normalized_name, status, verified_at, verified_by and a unique normalized_name; it defines no field semantics, canonicalization, collation, uniqueness scope, state transitions, or permission. Treat every field there as a candidate, not an accepted contract. The Model sketch has a candidate manufacturer_id + asset_type_id + normalized model_code uniqueness tuple.
- docs/reference-data-registry.md lists Manufacturer as a configurable reference with example value vendor names; it does not specify an initial list or lifecycle/verification policy. No production manufacturer values are specified in the backlog or registry.
- docs/architecture.md (Data Quality) says master-data changes follow proposal -> verification -> publication. The Manufacturer backlog only says verified status; it does not define whether direct authorized entry as UNVERIFIED is the proposal stage or whether a separate proposal/publication lifecycle is required. This is an owner-decision conflict, not permission to create a proposal workflow in this phase.
- The canonical permissions assets.read, assets.manage_types, and assets.manage_models exist; the latter is described as model management with global/asset_type scope and INTERNAL context. assets.manage_manufacturers is absent from code and docs. Do not infer Manufacturer authority from manage_models or manage_types.
- Identity's published Application contracts include IEffectiveScopeProvider.GetCurrentAssignmentScopesAsync and IGlobalGrantProvider. ADR-018 makes GLOBAL explicit, exact-permission and context-bound; concrete, missing, null, or geographic/direction/type scope must never be treated as global. ADR-019 preserves complete correlated assignment tuples; consumers obtain them through trusted server composition, not caller-supplied scope facts.
- Existing AssetType catalog policy is a useful Assets-local pattern, not an automatically accepted Manufacturer rule: current Active INTERNAL user + owned current INTERNAL context, fixed exact permission eligibility, global unfiltered catalog after eligibility. AssetType uses assets.read OR assets.manage_types for catalog read, while management uses exact assets.manage_types; authorized reads do not imply mutation.
- AssetType establishes patterns for UUIDv7 IDs, required trimmed bounded names, explicit ACTIVE/INACTIVE status, global unique database constraints, positive row_version, database-enforced duplicate races mapped to a stable 409, REST /api/v1, DTOs, and expected-row-version updates. AssetType's uppercase ASCII code normalization is not a Manufacturer-name normalization pattern.
- API guidelines specify list pagination page=1, pageSize=50, max 200, a typed paginated response, separate q search and filters, explicit deterministic sort, and a shared error envelope. These are reusable API conventions; they do not settle Manufacturer search matching.
- If runtime management is approved, ADR-011 requires the Assets-owned business mutation and durable Audit obligation to commit in one module-owned PostgreSQL transaction, with canonical Audit materialization/idempotency. ADR-008 keeps Business History separate from Audit. No operational Asset event is justified for a Manufacturer master-data edit by current backlog.
- Audit contracts currently register AssetType and its five actions only (AuditEntityType, AuditAction, AuditPayloadValidator); the current Assets obligation entity/configuration and FK/check constraints are AssetType-specific. Manufacturer runtime writes therefore require explicit canonical Audit action/entity/payload registration and bounded Assets persistence/delivery adaptation; do not create a second Audit store or bypass the canonical dispatcher.
- ADR-001 preserves modular-monolith ownership and prohibits another module's Infrastructure/DbContext. Manufacturer and AssetModel are both Assets-owned, so an Assets-internal Application/domain reference is preferred. No cross-module Manufacturer reference contract is currently required.
- ADR-003 requires UUIDv7 for the core Manufacturer identifier. A vendor code is not required by backlog and has no defined source/meaning.
- Documentation-status drift: docs/modules/assets.md and docs/context/assets.context.md still describe TASK-03.01.01/SEC-01 as an unpublished/local candidate and call Manufacturer planned, even though this checkout is the exact published 4dd9aea baseline. This phase forbids product-doc edits; record for a later authorized documentation-sync gate.

## Candidate contract analysis (not accepted)

### Identity, fields, and normalized uniqueness

Recommended minimal candidate:
- id: application-created UUIDv7, immutable stable reference.
- name: display name, required, trimmed; candidate max 200 characters following local reference conventions.
- normalized_name: persisted canonical key, computed by one version-pinned Domain normalizer.
- verification_status: candidate UNVERIFIED or VERIFIED.
- lifecycle_status: candidate ACTIVE or INACTIVE, independent of verification.
- created_at, updated_at, row_version; actor/context/correlation for mutations are server-derived and recorded in Audit. verified_at and verified_by are server-derived metadata if the owner accepts verification.

No business code, description, alias list, or external IDs are required by accepted backlog criteria. UUIDv7 is sufficient for identity unless a real source-system or operator use case for a stable code is accepted. Do not fabricate canonical vendor codes. Aliases/merging are deferred; name similarity is not proof that two legal/trading names identify the same manufacturer.

Recommended deterministic name key:
1. Reject null/empty names, controls and invalid Unicode; trim and collapse each Unicode White_Space run to one ASCII space in the display input.
2. Normalize to Unicode NFC (canonical equivalence only), apply locale-independent Unicode Default Full Case Folding from a pinned Unicode data version, then normalize the folded output to NFC.
3. Preserve punctuation, dots, hyphens, apostrophes, ampersands, legal suffixes, and trademark/copyright symbols. Do not transliterate, remove legal suffixes, strip punctuation, or merge aliases/confusable Latin and Cyrillic characters.
4. Persist the resulting key and enforce a global exact unique B-tree constraint on normalized_name independent of lifecycle; use byte/exact deterministic comparison (e.g. explicit C collation) rather than locale-dependent case-insensitive collation. The database uniqueness check runs for every create/update and is authoritative under concurrency. Application prechecks are UX only. Map the named unique-constraint violation to a stable 409 such as MANUFACTURER_NAME_ALREADY_EXISTS; never return PostgreSQL details.
5. Keep shared golden vectors and PostgreSQL race/constraint tests. A Unicode algorithm/version change needs a collision preflight and explicit disposition before rewriting stored keys.

Expected equivalence under this recommendation: Schneider Electric, case variants, and repeated/leading/trailing whitespace collide. ABB vs A.B.B., LG vs LG Electronics, Schneider vs Schneider Electric, Latin A vs Cyrillic А, and names with distinct punctuation/symbols remain distinct. NFC avoids compatibility-folding marks; full case-fold has intentional edge equivalences (for example ß/ss) that the owner must accept. NFKC/NFKC_Casefold is an alternative with broader compatibility equivalences and a larger risk of collapsing distinct registered names. Nothing in the repository settles these choices.

### Verification and lifecycle

Verification and lifecycle must remain separate dimensions; ACTIVE must not imply VERIFIED, and VERIFIED must not imply ACTIVE. Minimal status candidates are binary (UNVERIFIED/VERIFIED, ACTIVE/INACTIVE); do not silently add PENDING, REJECTED, verification expiry, or a workflow engine.

Recommended consumer rule for the later Model task: a new AssetModel may reference only a persisted Manufacturer that is both ACTIVE and VERIFIED. Existing Model/Asset references keep the immutable Manufacturer UUID and can still resolve/display it after deactivation or verification revocation; no cascade, rewrite, or physical delete. The exact interaction between Manufacturer status and Model status remains a TASK-03.02.02 decision. The future relationship is Assets-local (asset_models.manufacturer_id to assets.manufacturers.id, restrictive delete behavior), not a cross-module foreign key or EF entity contract.

Proposed verification meaning: verified means the canonical manufacturer identity has been reviewed, not that every model/product or its certification has been verified. New records begin UNVERIFIED; verification/revocation are explicit commands. Derive actor and UTC time from trusted server composition; reject caller verified_by/verified_at. Prefer re-verification after a canonical-name change. Keep current verification metadata coherent with current state and preserve prior transitions in Audit. Whether verification can be revoked, who may verify, whether a reason/evidence is mandatory, whether author and verifier must differ, and how the architecture's proposal -> verification -> publication applies require owner decisions.

Lifecycle recommendation: keep ACTIVE/INACTIVE independent. A new record may be ACTIVE+UNVERIFIED for administrators to complete verification, but it is not selectable for new Models until both conditions hold. Inactive remains resolvable for historical references and is never hard-deleted. Deactivation does not cascade to Model records. Reactivation does not automatically verify. This mapping to the architecture's publication stage must be explicitly accepted.

### Authorization and reference reads

Management of a global manufacturer catalog is not geographic, FunctionalDirection-, or AssetType-scoped. Recommended candidate permission is a distinct canonical assets.manage_manufacturers, INTERNAL-only, with all mutations requiring the exact explicit GLOBAL grant through IGlobalGrantProvider and a valid owned current INTERNAL context. assets.manage_types authorizes taxonomy management only; assets.manage_models is model-specific; neither concrete AssetType, direction, site, region, zone, nor another permission's GLOBAL may authorize Manufacturer changes. No request DTO may accept a permission, scope, GLOBAL flag, actor, verification actor, or timestamp.

Catalog read is unresolved. Candidate policies:
- any current eligible assets.read assignment (read whole unfiltered global catalog; geographic scope does not row-filter it);
- explicit GLOBAL assets.read only;
- an explicit read/manage union, matching the Assets AssetType catalog pattern while keeping management exact-permission-only.

Recommended default is the third policy: active INTERNAL + owned current INTERNAL context, fixed trusted assets.read scope facts OR explicit GLOBAL assets.read OR explicit GLOBAL assets.manage_manufacturers; return the global reference catalog with no geographic filtering. This is least surprising for internal master-data maintenance and existing Assets pattern reuse, but broadens row visibility beyond the requester's geographic/direction/type data scope. Contractor/external catalog reads remain denied until an owner-approved use case requires otherwise. Read never grants mutation. Do not implement this recommendation before approval.

### Search, API, management, and Audit

Recommended runtime scope is a backend-managed reference catalog with create, bounded name correction, explicit verification/revocation, and activate/deactivate operations; no frontend. This best satisfies configurable data + verified status + search, but management and verification authority are not frozen. No physical DELETE or generic status PATCH.

Candidate routes following existing conventions:
- GET /api/v1/manufacturers?q=...&verificationStatus=...&lifecycleStatus=...&page=1&pageSize=50 and GET /api/v1/manufacturers/{id}.
- POST /api/v1/manufacturers, PUT /api/v1/manufacturers/{id} with expectedRowVersion, and explicit /{id}/verify, /{id}/revoke-verification, /{id}/activate, /{id}/deactivate commands if those transitions are accepted.
- Search only canonical name/normalized name; normalize q using the same versioned function; recommend case-insensitive prefix matching, DB-side filtering, order by normalized_name ASC, id ASC, page 1/default 50/max 200. Exact/equality and filter inclusion must be frozen. A unique B-tree on normalized_name can serve uniqueness, prefix, and deterministic order with compatible collation. Substring search needs a trigram index/extension and has a larger write/storage cost; require an explicit UX need before choosing it. Never load all rows to filter in memory.
- Use transport DTOs and the repository error envelope. Duplicate -> stable 409, stale version -> 409 OPTIMISTIC_CONCURRENCY_CONFLICT, unauthenticated -> 401, unauthorized -> 403, bounded transport errors -> 400; authorize before target lookup and do not leak database errors.
- Every successful management/verification/lifecycle mutation records canonical before/after, server actor, current context, UTC time and correlation in the same Assets transaction as a durable Audit obligation. Stale, duplicate, denied, invalid, or no-op changes do not create a success Audit obligation. Existing row_version pattern protects all existing-row mutations. No separate Manufacturer business timeline is justified by current operational backlog; if the owner considers verification a distinct business-history stream, decide it before implementation rather than treating Audit as that stream.

### Seeds and downstream boundary

No production Manufacturer seed values are defined; add no mandatory vendor seed. Tests can create manufacturers as test data. Out of scope remains TASK-03.02.02 AssetModel, TASK-03.02.03 Model proposal workflow, Asset, attributes, alias/merge, mass import, external registry, frontend UI, and workflow engine. Do not combine backlog tasks.

## Proposed owner decisions — none accepted by this checkpoint

### OD-MANUFACTURER-01 — canonical name and normalization

QUESTION: What exact Unicode/whitespace/case equivalence defines normalized_name, and which punctuation, legal suffixes, marks, and cross-script lookalikes remain distinct?
CURRENT_REPOSITORY_FACT: Backlog requires normalized uniqueness; the logical database sketch only names normalized_name. No algorithm or version exists. Existing name handlers mostly trim; AssetType codes use invariant uppercase but are ASCII identifiers.
OPTIONS: exact display/byte identity; NFC + Unicode White_Space collapse + pinned locale-independent full casefold (recommended); broader NFKC_Casefold; manual alias/canonical-entity resolution (deferred).
RECOMMENDED_DEFAULT: the NFC/whitespace/full-casefold algorithm above; retain punctuation/legal suffixes/trademark symbols and script identity; no transliteration or aliases.
RATIONALE: deterministic cross-locale behavior while minimizing semantic merges; explicit examples avoid silently identifying ABB with A.B.B. or a short name with a legal/trading name.
SECURITY_OR_MIGRATION_IMPACT: confusables remain distinct and require manual curation; broader normalization may merge legitimate vendors. Freeze Unicode data/version and run collision preflight before any algorithm/key migration.

### OD-MANUFACTURER-02 — fields and uniqueness scope

QUESTION: Is a Manufacturer code required; which metadata is core; is normalized uniqueness global across all lifecycle states?
CURRENT_REPOSITORY_FACT: Database sketch has id, code, name, normalized_name, status, verified_at, verified_by; backlog supplies no code and no field constraints.
OPTIONS: opaque UUIDv7 only or an explicitly sourced code; persisted vs computed normalized key; uniqueness across all rows vs active-only partial unique; optional description/aliases.
RECOMMENDED_DEFAULT: UUIDv7 is the immutable reference; no code/description/alias; display name, persisted normalized_name, independent verification/lifecycle statuses, created/updated timestamps, positive row_version, server-derived verification metadata. Unique normalized key globally across ACTIVE and INACTIVE.
RATIONALE: smallest schema satisfying actual acceptance while preserving stable references and preventing reactivation/name-reuse ambiguity.
SECURITY_OR_MIGRATION_IMPACT: a global unique index prevents concurrent duplicates and reserves identity through deactivation; changing code/key or flipping to active-only uniqueness later needs collision inventory and migration. Keep Identity actor IDs as scalar audit metadata, not cross-schema FK.

### OD-MANUFACTURER-03 — verification and publication semantics

QUESTION: What does verified assert; who verifies/revokes; are verification metadata/reason/evidence and separation of duties mandatory; how does the generic proposal -> verification -> publication rule apply without a Manufacturer proposal workflow?
CURRENT_REPOSITORY_FACT: Backlog says verified status only; DB sketch has verified_at/by; architecture says master data changes proposal -> verification -> publication. The P1 proposal task is specifically for Models.
OPTIONS: binary review flag; direct admin create as UNVERIFIED then verify/publish; separate Manufacturer proposal entity/workflow (would need separately scoped task); separate verification permission/segregation-of-duties.
RECOMMENDED_DEFAULT: two states only; creation is UNVERIFIED; explicit exact-global admin verification means canonical identity reviewed; verified+active is the general-reference publication/selectability condition. Allow audited revocation with mandatory reason; identity-name change revokes verification and requires re-verification. No product/model certification claim, evidence store, expiry, or proposal entity.
RATIONALE: satisfies the backlog's verified status and architecture lifecycle while keeping the Model proposal workflow separate; recommendation must be owner-confirmed because publication semantics are not explicit.
SECURITY_OR_MIGRATION_IMPACT: state and timestamps are server-derived; only approved verifier authority can transition; before/after and revocation reason are audited. New enum/metadata and any future workflow affect schema and permissions; no implementation until accepted.

### OD-MANUFACTURER-04 — independent lifecycle and Model selectability

QUESTION: Does Manufacturer have independent ACTIVE/INACTIVE lifecycle; initial state; how do verification and lifecycle jointly govern new references and historical resolution?
CURRENT_REPOSITORY_FACT: DB sketch has status plus verification metadata; generic lifecycle rules preserve historical references. Neither document defines Manufacturer states or Model selectability.
OPTIONS: verification only; independent ACTIVE/INACTIVE; combine verification and lifecycle into one status; cascade/deactivate children vs preserve historical Model links.
RECOMMENDED_DEFAULT: independent ACTIVE/INACTIVE and UNVERIFIED/VERIFIED; create ACTIVE+UNVERIFIED; new AssetModel selection requires both ACTIVE and VERIFIED; existing model/asset IDs remain readable after deactivation/revocation; no cascade and no hard delete; reactivation does not auto-verify.
RATIONALE: each dimension answers a different question, prevents unverified or inactive use for new Models, and preserves history.
SECURITY_OR_MIGRATION_IMPACT: downstream Model write must re-resolve the persisted Manufacturer in Assets and fail closed on missing/ineligible facts. FK uses restrictive deletion; status changes never rewrite history. TASK-03.02.02 must accept the consumer rule.

### OD-MANUFACTURER-05 — read and global management permissions

QUESTION: Which trusted permission/context opens the global catalog, and which exact authority may mutate or verify it?
CURRENT_REPOSITORY_FACT: assets.read, assets.manage_types, assets.manage_models exist. The latter is scoped global/asset_type and INTERNAL. There is no manufacturer permission. ADR-018/019 require exact trusted permission and explicit GLOBAL for global management; geography/type/direction do not imply global authority.
OPTIONS: reuse assets.manage_models; broaden assets.manage_types; create exact assets.manage_manufacturers; use current assets.read, explicit GLOBAL assets.read, or their union with the new manager permission for catalog read.
RECOMMENDED_DEFAULT: add a distinct INTERNAL assets.manage_manufacturers; all mutation/verify/lifecycle commands require its exact explicit GLOBAL grant via IGlobalGrantProvider. For read, use trusted eligible assets.read OR explicit GLOBAL assets.read OR explicit GLOBAL assets.manage_manufacturers; global catalog is not row-filtered. No contractor access in this task.
RATIONALE: scopes and permission names retain their existing meaning; global master-data mutation requires explicit permission-bound global authority. Read policy follows the Assets catalog pattern without granting mutation.
SECURITY_OR_MIGRATION_IMPACT: callers supply no permission/scope/global/actor evidence. New permission, if accepted, needs canonical Identity catalog/permission seed migration and documentation in a later implementation phase; concrete geographic/direction/type assignments and assets.manage_models never authorize Manufacturer mutation.

### OD-MANUFACTURER-06 — runtime/API/search/audit boundary

QUESTION: Does this task deliver backend runtime management or only a searchable read reference; what exact matching/filter/API and Audit obligations apply?
CURRENT_REPOSITORY_FACT: Backlog says configurable data, verified status, search; API guidelines provide /api/v1, q, typed filters, page 1/default 50/max 200 and shared errors. No Manufacturer endpoint or audit registration exists.
OPTIONS: read-only seeded/reference endpoint; internal backend management (recommended); add frontend or a full proposal workflow (explicitly out of scope).
RECOMMENDED_DEFAULT: backend runtime CRUD/lifecycle/verification plus search, no frontend and no DELETE; exact routes/filters as described above; name-prefix search with normalized key; B-tree first, trigram only if substring is accepted; rowVersion on every existing-row mutation. Extend canonical Audit entity/action/payload and Assets-owned durable-obligation path atomically; no separate business-history stream unless accepted.
RATIONALE: configurable Manufacturer data and its verified state require a controlled write path; minimal prefix search covers the stated acceptance and uses ordinary PostgreSQL indexing.
SECURITY_OR_MIGRATION_IMPACT: permission and Audit contract changes are prerequisites; mutation/audit atomicity, unique-race mapping, PostgreSQL search semantics, and stale-write negatives require real PostgreSQL/API tests. Read-only scope would not satisfy a defined verification/write workflow unless another existing admin path is explicitly named.

### OD-MANUFACTURER-07 — seeds and downstream exclusion

STATUS: REPOSITORY_FROZEN by the current task boundary; no unresolved decision requested.
QUESTION: None unless the owner changes this phase's explicit scope.
CURRENT_REPOSITORY_FACT: Backlog/reference registry name no initial vendors; task request says no production seeds and excludes Model, proposal workflow, Asset, aliases/merge, imports, external integration, frontend, and workflow engine.
OPTIONS: test fixtures only or introduce a separately accepted canonical list later.
RECOMMENDED_DEFAULT: no production seeds; retain all stated downstream exclusions.
RATIONALE: vendor catalog is configurable; examples are not mandatory canonical values.
SECURITY_OR_MIGRATION_IMPACT: test data stays isolated. A future import/registry workflow requires its own validation, provenance, idempotency, and Audit contract.

## Security attack analysis

1. Case-only duplicate: prevented only after OD-01 canonical function plus database unique index; application precheck alone is race-prone.
2. Unicode normalization/case duplicate: unresolved until pinned algorithm; golden vectors and stored-key uniqueness required.
3. Whitespace duplicate: collapse Unicode whitespace before key; do not rely on ordinary Trim alone.
4. Concurrent duplicate insert: PostgreSQL global unique constraint is authority; map named 23505 to stable 409.
5. Unverified used as verified: fail closed; Model consumer checks persisted verified status, not caller input or display.
6. Inactive selected for new Model: fail closed on persisted lifecycle; continue historical ID resolution.
7. Geographic grant used for global mutation: deny; only exact explicit GLOBAL manager permission.
8. FunctionalDirection/AssetType scope used for Manufacturer mutation: deny; no scope flattening or target synthesis.
9. Caller injects permission/GLOBAL flag: never bind authorization evidence from transport; use current trusted Identity composition.
10. Spoofed verified_by/verified_at: reject unknown transport fields; derive actor/time from authenticated server facts and IClock.
11. Unauthorized verification/revocation: verify fixed exact manager permission and current owned context for each command; no Model proposal reviewer implication.
12. Stale overwrite: expectedRowVersion on every existing-row write; stable 409 and no success audit on conflict.
13. Hard delete with historical references: no DELETE; restrictive Manufacturer-to-Model FK; status transitions only.
14. Unauthorized target-existence probe: authorization before target lookup; stable concealed/consistent 403/404 per accepted API policy.
15. Raw DB error leak: only known named unique/concurrency errors map to public codes; other dependency failures sanitized, correlated, and deny/fail closed.
16. Audit bypass: command boundary requires one matching durable Audit obligation in same Assets transaction; database/context guards protect direct writes.
17. Cross-module DbContext/schema access: forbidden; Manufacturer/Model are Assets-owned; use an Assets-local provider and scalar contracts only if another module later needs them.
18. Normalizer-version drift: key recalculation can merge records; pin Unicode version and require preflight collision disposition before migration.
19. Global catalog read leakage: resolve via OD-05; if approved unfiltered catalog semantics, require exact read eligibility and do not claim geographic filtering.

## Prerequisite and implementation plan

Foundation dependencies are published and present: exact 4dd9aea includes AssetType; Identity contains correlated non-GLOBAL assignment facts and explicit GLOBAL provider; PostgreSQL/Assets module and durable Audit patterns exist. No cross-module persistence prerequisite is missing. However owner decisions OD-MANUFACTURER-01..06 must be accepted before Definition of Ready. If OD-05 is accepted as a new permission, Identity permission catalog/seed migration is a later implementation prerequisite (forbidden now). Canonical Audit registration/payload and Assets obligation constraints require a bounded implementation plan and docs sync. Current docs publication metadata must be reconciled in an authorized documentation-sync phase.

After owner acceptance, proposed MANUFACTURER-01 plan only: Domain name normalizer/entity/invariants; Application read/create/update/verify/revoke/lifecycle contracts and trusted authorization; Assets-owned EF config/migration with global unique key/FK/no-delete/concurrency constraints; API DTO/endpoints/search; canonical Audit contract and atomic durable Assets obligation; PostgreSQL duplicate race/normalizer vectors/idempotent status/update tests; authorization wrong-context/permission/GLOBAL/scope negatives; search/pagination/API contract; docs module/context/database/permissions/security/OpenAPI and docs-impact/documentation-sync. Do not begin it in this phase.

## Independent analysis review (separate read-only pass)

RESULT: PASS for backlog fidelity, Assets ownership, normalization/index race analysis, verification/lifecycle separation, authorization trust boundaries, search feasibility, Model reference compatibility, owner-decision coverage, and scope discipline. No contradictory accepted Manufacturer rule was found. Review confirms OWNER_DECISIONS_REQUIRED; recommendations are not accepted decisions. Generic architecture's proposal -> verification -> publication rule and stale Assets publication-status docs are explicitly retained as open/conflict notes, not rewritten here.

## Phase gate and preservation

IMPLEMENTATION_READY: NO; OD-MANUFACTURER-01..06 unresolved.
APPLICATION_CODE_CHANGED: NO.
SCHEMA_CHANGED: NO.
MIGRATION_CREATED: NO.
PERMISSION_SEEDS_CHANGED: NO.
FRONTEND_CHANGED: NO.
BRANCH_CREATED: NO.
WORKTREE_CREATED: NO.
COMMIT: NONE.
PUSH: NONE.
PRODUCT_DOCUMENTATION_CHANGED: NO.
CHECKPOINT_CREATED: YES; this file is the only TASK-03.02.01 artifact.

PRESERVED_PREEXISTING_PATHS: the eight files listed below matched the task attachment before this checkpoint; preserve them byte-for-byte and do not stage/reset/clean/stash them.
.agent/tasks/AUTH-SCOPE-01/asset-type-scope-state.md C119A8546C1800A6AC9D63A952AAC24A021364C93AD406A1869F8D484A98AAEF
.agent/tasks/AUTH-SCOPE-01/state.md 10B60AA9BACAF1E8FBE9B9199C87887B3F6F61D678D440894C2E0971FFC4CFD4
.agent/tasks/AUTH-SCOPE-01/agents/asset-scope-01-security-review.md 9B9A9B8D2F9A738BE459207C4708981B92CDAD6942511D421BB65D49BF456655
.agent/tasks/TASK-02.02.02/state.md DA6BB5A0AE4BFBAC90EB9F624252004A6E55529EFF8503D37CA7329BB3389D5C
.agent/tasks/TASK-03.01.01/asset-type-f1-state.md 33FE0C8C32410A9CB1EA7BCADE880157693984DE7008A2363B54672A3CF4F21B
.agent/tasks/TASK-03.01.01/asset-type-review.md 35C63890027EA5D0F63D0A03D7F9B734B3C53E0D90CE59EDF83192B0E7B20CAD
.agent/tasks/TASK-03.01.01/asset-type-review-r2.md B63ACBA147F073BE0FED73577D81FE0C7E0C93F62DD41A9EE0693842A3E636CE
.agent/tasks/TASK-03.01.01/state.md E0EC6B1F4BB3CA575A13B15BACDE52BF4461F58328C357596D075C77ADF57BBA

WORKTREE: existing eight operational/review paths remain dirty/untracked as before; this new checkpoint is untracked. Index remains empty. No source or product docs were modified.
NEXT_ACTION: Request owner acceptance or correction of OD-MANUFACTURER-01..06 with exact chosen options. After all are accepted, resume TASK-03.02.01 for a separately authorized implementation phase and rerun the repository-state guard.
DO_NOT_REPEAT: do not re-run broad foundation scans unless accepted decisions or source facts change; do not implement Manufacturer/AssetModel/proposal/UI; do not create migrations or permission seeds; do not stage/modify the eight preserved paths; no branch/worktree/commit/push; do not treat database sketches or recommendations as accepted business rules.
STOP.

## MANUFACTURER-01 implementation phase authorized — 2026-10-10

TASK: TASK-03.02.01
STATUS: OWNER_DECISIONS_RESOLVED
PHASE: MANUFACTURER-01 — BACKEND IMPLEMENTATION
OWNER_DECISIONS: OD-MANUFACTURER-01..07 ACCEPTED exactly as stated in the current owner task request. This supersedes the MANUFACTURER-00 decision gate above; it does not rewrite the historical analysis.
BASELINE_SHA / LAST_SAFE_COMMIT: 4dd9aea7c8ba940d3d8715a5d54fb7a5e3c16724
CURRENT_BRANCH: main
ORIGIN_MAIN_SHA: 4dd9aea7c8ba940d3d8715a5d54fb7a5e3c16724
REPOSITORY_STATE_GUARD: SAFE_WITH_CHECKPOINT / DIRTY_EXPECTED. Fetch, branch, HEAD, remote SHA, empty staging, and one primary worktree verified. Existing eight operational/review metadata paths were hashed and all match the preservation inventory above. No production code or product documentation is dirty.
TASK_RESUME: RESUME_SAFE=YES for the newly authorized implementation phase. State drift was limited to the prior phase's OWNER_DECISIONS_REQUIRED gate; current owner request accepts OD-01..07 and authorizes MANUFACTURER-01.
COMPLETED: MANUFACTURER-00 read/analyze/document-only contract analysis and independent read-only review; exact implementation task request loaded; baseline and preserved dirty-path ownership reconciled.
VERIFIED: `git fetch origin`; branch/HEAD/origin SHA; `git status --short`; staged path list; worktree list; SHA-256 of eight preserved operational/review files.
UNCOMMITTED: this TASK-03.02.01 checkpoint; eight previously dirty/untracked operational/review metadata paths listed above. No application code, migration, tests, or product docs changed yet; index is empty.
DECISIONS: Implement only the supplied MANUFACTURER-01 contract. Assets owns Manufacturer. No AssetModel, proposal workflow, Asset, frontend, production seeds, roles, access assignments, GLOBAL grants, or other adjacent feature. Remain on existing main; no worktree; one task commit only after every required gate passes; no push.
BLOCKERS: None established yet. Pinned full Unicode normalization implementation/dependency suitability is an early hard gate; if not satisfiable, stop with MANUFACTURER_UNICODE_NORMALIZATION_CONTRACT_GAP.
CHECKPOINT_STATUS: SAFE before implementation; current source tree matches the known baseline.
NEXT_ACTION: Inspect the Assets/Identity/Audit implementation and repository dependency set, then establish whether exact NFC + Unicode White_Space collapse + locale-independent full case fold can be implemented deterministically with a pinned data version.
DO_NOT_REPEAT: Do not repeat the broad MANUFACTURER-00 contract analysis; do not alter the eight preserved files; do not use destructive Git recovery; do not implement excluded Model/proposal/Asset/UI/seed/grant work.

## Unicode normalization gate — 2026-10-10

COMPLETED: Downloaded official Unicode Character Database 17.0.0 source files into the task-owned temporary `ucd-17/` folder and prototyped canonical NFC from pinned data (canonical decomposition, combining classes, composition exclusions/pairs, and algorithmic Hangul) plus the task's Unicode White_Space and full default C/F case-fold rules.
VERIFIED: Prototype passed all 20,034 non-comment NFC vectors in official `NormalizationTest.txt`. UCD-derived inventory: 2,081 canonical decomposition mappings, 968 non-zero combining classes, 961 canonical composition pairs, 1,585 full default case-fold mappings, 25 White_Space scalars; maximum full-fold mapping length is 3 scalars. Official source SHA-256 values were recorded during this turn; generator will pin them.
DECISION: No new runtime package or host ICU/BCL globalization dependency. Ship generated Unicode 17.0.0 data tables with a standard-library generator and execute the UCD conformance corpora in the Assets domain harness. This is deterministic and satisfies the accepted normalization contract; do not stop for `MANUFACTURER_UNICODE_NORMALIZATION_CONTRACT_GAP` unless the C# implementation fails conformance.
UNCOMMITTED: Existing checkpoint plus task-owned downloaded UCD source files; no application source/docs/migrations/tests modified. Eight pre-existing unrelated operational/review metadata paths remain untouched and unstaged.
NEXT_ACTION: Add the pinned-data generator and test corpus resources, then implement and run the C# normalizer against the complete Unicode 17.0.0 normalization and case-fold vectors before proceeding to Manufacturer domain behavior.
DO_NOT_REPEAT: Do not repeat the initial web/package survey or Python NFC prototype; consume the already downloaded official UCD 17.0.0 files and recorded hashes. Keep UCD working files out of the product commit.

## Pinned Unicode normalization implementation — 2026-10-10

COMPLETED: Added the Unicode 17.0.0 table generator, 54,126-byte embedded runtime table, pure Assets Domain normalizer, full UCD normalization/case-fold/White_Space conformance resources, and boundary/locale/visual-lookalike/punctuation/storage-bound checks.
VERIFIED: Release build of `Exploitation.Modules.Assets.Domain` passed with 0 warnings/errors. `dotnet run --project tests/unit/Exploitation.AssetsDomainChecks/Exploitation.AssetsDomainChecks.csproj --configuration Release` passed, including 20,034 NFC conformance vectors, all 1,585 C/F default full case-fold mappings, and all 25 Unicode White_Space scalars. Generated runtime table SHA-256: `d416472fd51d6a0ac065deb3dcfc90b97ff839971888d2c442f54e54ff8d8079`. Exhaustive per-scalar UCD calculation bounds the full pipeline for a 200-scalar display name at <=600 normalized scalars and <=2,400 UTF-8 bytes; test exercises the bound.
UNCOMMITTED: Task-owned files now include `tools/unicode17/GenerateUnicode17Tables.py`, Assets Domain `Manufacturers/Unicode17NameNormalizer.cs` and `Unicode17NormalizationData.bin`, Domain project resource declaration, and Assets domain harness changes plus compressed official UCD conformance files/license. Temporary original UCD source files remain in `.agent/tasks/TASK-03.02.01/ucd-17/` and are not product inputs for commit. Existing eight preserved operational/review metadata files remain untouched; index remains empty.
LAST_SAFE_COMMIT: `4dd9aea7c8ba940d3d8715a5d54fb7a5e3c16724`.
BLOCKERS: None for pinned Unicode behavior. Manufacturer entity, commands, authorization, API, persistence, audit, migration, documentation, and integration verification remain.
NEXT_ACTION: Implement Manufacturer Domain entity and scalar reference/read contracts, preserving independent verification/lifecycle semantics and using this single normalizer for create, rename, and search.
DO_NOT_REPEAT: Do not re-run the Unicode dependency survey, Python algorithm prototype, table generation, or domain conformance harness until normalizer code/data changes. Do not stage original UCD working downloads.

## MANUFACTURER-01 backend and local verification checkpoint — 2026-10-10

TASK: TASK-03.02.01
STATUS: OWNER_DECISIONS_RESOLVED
PHASE: MANUFACTURER-01 — BACKEND IMPLEMENTATION
BASELINE_SHA: 4dd9aea7c8ba940d3d8715a5d54fb7a5e3c16724
CURRENT_BRANCH: main
ORIGIN_MAIN_SHA: 4dd9aea7c8ba940d3d8715a5d54fb7a5e3c16724
LAST_SAFE_COMMIT: 4dd9aea7c8ba940d3d8715a5d54fb7a5e3c16724
REPOSITORY_STATE_GUARD: PASS earlier in this phase; current index remains empty. Eight preserved operational/review paths remain outside task ownership and must stay unstaged.

COMPLETED:
- Pinned Unicode 17.0.0 normalization, table generator, embedded data integrity check, conformance corpus and Assets Domain Manufacturer entity.
- Assets Application contracts, identity authorization, command/read stores, API routes, Assets audit extension and one Assets migration.
- Canonical Identity `assets.manage_manufacturers` permission plus one data-only migration.
- PostgreSQL harness now covers migration/model parity, uniqueness and Unicode collisions, duplicate race, status transitions, verification/revoke/update races, stale writes, prefix escaping/index plan, selectability, rollback-on-audit-failure, canonical Audit delivery and no-delete guard.
- API harness now covers all Manufacturer routes, exact GLOBAL management, concrete/global read cases, statuses, search/paging, spoofing, stale/duplicate conflicts, wrong/expired/future context/grants and OpenAPI.
- Domain and authorization executable harnesses cover the pinned Unicode tables and fixed trusted authorization semantics.
- Documentation changed for Assets, Identity, Audit, lifecycle, business rules, reference data, permissions, database, security, backlog and traceability. AssetType is documented as published at this baseline with hosted CI run 38028823398; Manufacturer remains local/unpublished.

VERIFIED:
- Assets Domain Release build and `Exploitation.AssetsDomainChecks`: PASS; 20,034 official Unicode NFC vectors, all 1,585 C/F fold mappings and all 25 White_Space code points.
- `Exploitation.AssetsAuthorizationChecks`: PASS.
- `Exploitation.AssetsPersistenceChecks`: PASS against PostgreSQL 18 Testcontainers, including existing AssetType regression and Manufacturer cases.
- `Exploitation.AssetsApiChecks`: PASS against PostgreSQL 18 Testcontainers.
- `Exploitation.IdentityPersistenceChecks`: PASS, including Manufacturer permission data-only migration/no-grant/safe-rollback checks and published Identity regressions.
- API, persistence and Identity test projects built in Release with zero build warnings/errors in final successful runs.

DOCS_IMPACT: YES — business rules, lifecycle, Assets schema/API/security, Identity permission materialization and Audit contract changed.
DOCUMENTATION_SYNC: IN_PROGRESS — source and context docs updated; finish docs consistency/traceability review and rerun `git diff --check`.

UNCOMMITTED: all task implementation, migration, test, documentation, and checkpoint changes remain unstaged. The original UCD working downloads are temporary and must not be committed. The Unicode license notice is copied beside runtime tables and test corpora.
DECISIONS: OD-MANUFACTURER-01..07 accepted; exactly one Assets migration and one Identity data-only permission migration; no roles/grants/assignments/seeds; no AssetModel, model proposal workflow, Asset, frontend, alias/merge/import/external registry; no new ADR; exact AssetType baseline/published status is authoritative.
BLOCKERS: None currently known.
CHECKPOINT_STATUS: SAFE for the completed domain, application, persistence, HTTP, permission-seed and documentation implementation phase; broader repository gates remain pending.
NEXT_ACTION: Finish traceability/security and documentation consistency review, then execute the remaining repository-wide validation gates and final preservation/Git review before the single local commit.
DO_NOT_REPEAT: Do not redo the Unicode package/algorithm survey or UCD prototype; do not rerun green domain, Assets PostgreSQL, Assets API, authorization or Identity permission harnesses unless their inputs change; do not modify or stage the eight preserved operational/review paths; do not stage downloaded original UCD sources; no branch/worktree/push.

## MANUFACTURER-01 final local gates — 2026-10-10

TASK: TASK-03.02.01
STATUS: LOCAL_IMPLEMENTED_UNPUBLISHED; READY_FOR_SINGLE_LOCAL_COMMIT
PHASE: MANUFACTURER-01 — BACKEND IMPLEMENTATION
BASELINE_SHA: 4dd9aea7c8ba940d3d8715a5d54fb7a5e3c16724
CURRENT_BRANCH: main
ORIGIN_MAIN_SHA: 4dd9aea7c8ba940d3d8715a5d54fb7a5e3c16724
LAST_SAFE_COMMIT: 4dd9aea7c8ba940d3d8715a5d54fb7a5e3c16724
REPOSITORY_STATE_GUARD: SAFE_WITH_CHECKPOINT / DIRTY_EXPECTED; fetched origin, baseline and single main worktree match; the staged candidate contains only task-owned paths. Eight preserved operational/review path hashes all match the original inventory.

COMPLETED:
- Manufacturer Domain/Application/Infrastructure/API vertical slice; exact Unicode 17.0.0 normalization, two independent statuses, explicit verify/revoke, row-version concurrency, selectable/resolvable reference contract, global read and exact-GLOBAL management, and atomic durable Audit.
- One Assets migration `20261010074714_AddManufacturers` and one data-only Identity permission migration `20261010074801_AddManufacturerManagementPermission`; no role grants, assignments, GLOBAL grants, Manufacturer value seeds, AssetModel, proposal workflow, Asset or frontend code.
- Product and context documentation synchronized across Assets, Identity, Audit, database, security, permissions, business rules, lifecycle, reference data, backlog and traceability. AssetType is PUBLISHED at this baseline; accepted ADR bodies were not changed.
- Temporary original UCD source downloads removed after the standard-library generator reproduced the embedded table byte-for-byte (`54,126` bytes; SHA-256 `d416472fd51d6a0ac065deb3dcfc90b97ff839971888d2c442f54e54ff8d8079`). Licensed compressed conformance corpora and runtime license notice remain.

VERIFIED:
- Release `dotnet build Exploitation.sln --no-restore`: PASS, 0 warnings/errors; `dotnet test Exploitation.sln --no-build`: PASS.
- Identity, Sites and Assets domain harnesses; Assets authorization harness; architecture checks: PASS. Unicode: all 20,034 NFC vectors, 1,585 full C/F case-fold mappings and all 25 Unicode White_Space scalars.
- All executable backend harnesses: Authentication, Identity/PostgreSQL, Audit/PostgreSQL, Sites/PostgreSQL, Sites API, Audit delivery, Organization/PostgreSQL and API, Assets/PostgreSQL and API: PASS. AssetType taxonomy lifecycle races and Audit regressions pass; Manufacturer API denies an inactive local user with 403.
- PostgreSQL migration/model/uniqueness/search/concurrency/Audit suites: PASS, including verify/deactivate race, which leaves one valid orthogonal-status outcome, one version increment and one Audit transition. Disposable DatabaseMigrator smoke applied 22 migrations on first run and 0 on second; Assets applied two migrations. No persistent target database was configured or modified.
- Infrastructure scripts, CI workflow contract, DatabaseMigrator registration/configuration, API bootstrap contract and runtime smoke: PASS.
- Frontend baseline `npm run lint`, `npm run build`, `npm test`: PASS (71 tests); no frontend production files changed.
- Scoped changed-C# `dotnet format whitespace --verify-no-changes`: PASS (35 files); `git diff --check`: PASS; task-owned text-file secret heuristic: PASS.
- Manual security review covered all 23 requested attacks (normalization/duplicate races, caller spoofing, status/context/scope escalation, stale writes, search wildcard, target concealment, error sanitization, Audit atomicity/delivery, delete guard, permission seed grants and AssetType Audit regression): OPEN_CRITICAL 0; OPEN_HIGH 0; OPEN_MEDIUM 0; OPEN_LOW 0.
- Traceability AC-01..AC-08 reconciled to passing evidence; documentation sync: PASS.

UNCOMMITTED: The Manufacturer implementation/migrations/tests/docs and this checkpoint are staged as one candidate. Original UCD working downloads and generator cache are removed. The eight earlier operational/review metadata paths remain unrelated, byte-for-byte preserved and unstaged/untracked.
DECISIONS: OD-MANUFACTURER-01..07 accepted; exact AssetType published baseline retained; no new ADR; commit directly on main, exactly one local commit after reviewed staging, no push; stop for independent review before publication.
BLOCKERS: None known for MANUFACTURER-01 local gates.
CHECKPOINT_STATUS: SAFE.
DOCS_IMPACT: YES.
DOCUMENTATION_SYNC: PASS.
TRACEABILITY: PASS.
NEXT_ACTION: Inspect the complete staged diff and staged checks; create one local commit on main, verify parent/origin/preserved paths, then stop for independent review.
DO_NOT_REPEAT: Do not rerun green broad gates unless their inputs change; do not modify or stage the eight preserved operational/review files; do not restore original UCD downloads; no branch/worktree/push; do not implement Model/proposal/Asset/frontend or add grants/seeds.
