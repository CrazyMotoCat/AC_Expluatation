# TASK-02.04.02 — LOCATION-TREE-01 checkpoint

STATUS: VERIFIED_FOR_ATOMIC_LOCAL_COMMIT
PHASE: LOCATION-TREE-01 — BACKEND IMPLEMENTATION AFTER OWNER DECISIONS
MODE: IMPLEMENT DIRECTLY ON MAIN; BACKEND ONLY; ONE LOCAL COMMIT AFTER ALL GATES; NO PUSH

## Baseline and repository guard

- Expected baseline: `6b986f95fb431a31f7543696278f0910ac666be6`.
- `git fetch` completed successfully.
- Branch: `main`.
- At phase start, `HEAD == origin/main == 6b986f95fb431a31f7543696278f0910ac666be6` and the worktree was clean.
- One worktree exists, at the primary checkout, on `main`; no other branch/worktree was created.
- `LAST_SAFE_COMMIT`: `6b986f95fb431a31f7543696278f0910ac666be6`.

## Exact backlog contract

`docs/backlog.md`, FEATURE-02.04, TASK-02.04.02 “Location tree”. Acceptance criteria:

- arbitrary depth;
- one Site;
- prevent cycles;
- support moving a Location with validation.

No explicit dependencies, API list/read shape, frontend deliverable, or more detailed business rules are recorded beside the task. TASK-02.04.01 LocationType is published and is the required classification prerequisite. TASK-02.03.04 Site card deliberately remains a Locations availability placeholder until this task provides a read contract.

## Repository findings and inherited contract

- Owner/module: Sites. `LocationType` is classification; `Location` is a future Site-owned instance/tree node (`docs/modules/sites.md`, `docs/context/sites.context.md`, reference registry).
- Each Location belongs to exactly one Site. Its parent, if any, belongs to that same Site. Site ancestry is authoritative and must be resolved by Sites; caller-supplied ancestry is not authorization evidence.
- Tree is acyclic and must support arbitrary business depth. No accepted business maximum depth exists. Any bounded traversal/resource protection is a technical safeguard, not a business depth rule.
- Existing sketches use an adjacency-list model (`site_id` plus nullable parent) and arbitrary-depth hierarchy. Nested sets/materialized path/closure table are not justified by current requirements.
- Core IDs use UUIDv7 (ADR-003). New/changed LocationType assignments require an ACTIVE LocationType; existing Locations must remain readable with an INACTIVE historical type (published TASK-02.04.01 contract).
- Context says an INACTIVE Location cannot be used for new placements and moving a Location must not destroy Asset placement history. This does not define Location parent/child deactivation or cross-Site move behavior.
- No hard DELETE should be exposed; preserve history and use lifecycle. Existing DB sketch has `is_active`, while neighboring Site/reference contracts use `ACTIVE`/`INACTIVE`.
- `sites.manage_locations` already exists as an INTERNAL, Site-scoped Sites permission for managing the Location tree. No exact Location scope dimension is present in the permission registry/current assignment model. Do not add an exact Location scope automatically.
- Existing Site authorization establishes Zone→descendant-Site, Region→Site and exact Site coverage. A Location can be authorized through its authoritative Site. Site target denial conceals missing/out-of-scope targets as `403 GEOGRAPHY_ACCESS_DENIED`; Location route behavior has not been frozen.
- Site mutations use optimistic `row_version`; stale authorized writes return `409 OPTIMISTIC_CONCURRENCY_CONFLICT`. Sites mutations create one durable audit obligation atomically and use canonical Audit through ADR-011. Reuse this path; do not add another audit mechanism.
- ADR-008 requires business history and technical Audit to remain distinct. `LocationMoved` exists in the event registry as an optional Sites event for Assets/Inventory read models (reliable outbox if asynchronous publication is required). The current docs do not define a separate Location business-history table/stream.
- No dedicated accepted Location-tree ADR was found. Relevant generic decisions are ADR-003, ADR-007/013–017, ADR-008 and ADR-011; they do not resolve the business choices below.

## Candidate entity and field classification

The planned `sites.locations` schema in `docs/database.md` lists `id`, `site_id`, nullable `parent_id`, `location_type_id`, `code`, `name`, `description`, `is_active`, `created_at`, `updated_at`, `row_version`.

| Field | Classification from current source | Contract gap |
|---|---|---|
| `id` | REQUIRED_NOW | UUIDv7 by ADR-003. |
| `site_id` | REQUIRED_NOW | Required, immutable, exactly one Site; cross-Site move unresolved. |
| nullable parent reference | REQUIRED_NOW | Adjacency-list root representation is supported; column naming conflicts (`parent_id` vs `parent_location_id`). |
| LocationType reference | REQUIRED_NOW | `location_type_id` in DB; architecture sketch says generic `type`. Restrictive FK recommended. |
| `code` | Listed in DB/architecture sketch | Requiredness, canonical format, mutability and uniqueness scope unresolved. |
| `name` | Listed in DB/architecture sketch | Requiredness/length/duplicate-name policy unresolved. |
| `description` | Listed in DB sketch | Optionality/length are not specified. |
| lifecycle | Listed as `is_active`; context refers to INACTIVE | Representation and parent/child transitions unresolved. |
| `created_at`, `updated_at` | Listed in DB sketch | No explicit semantics/precision contract found. |
| `row_version` | Listed in DB sketch; aligned with mutation concurrency precedent | Freeze expected-version request/error contract with API. |
| max depth | DEFERRED as business field/rule | No hard business limit; protect traversal technically. |

## Provisional technical proposals (not accepted decisions)

- Keep adjacency list. Enforce same-Site parent relation at persistence boundary (composite FK or equivalent invariant); Site, parent and LocationType FKs should be RESTRICT; no cascade delete.
- Serialize structural mutations per Site in one PostgreSQL transaction, re-read nodes after serialization, and use a recursive traversal with explicit cycle detection for parent/descendant validation. A pre-check without serialization is insufficient for concurrent moves. Select concrete locking mechanism in implementation review.
- Index `(site_id, parent_id)` (or accepted renamed parent column); add indexes/unique constraints for other fields only after code/search/query contracts are decided.
- Prefer separate move command from ordinary field update because reparenting changes structure, requires cycle/scope validation and is represented as `LocationMoved` in existing module/event contracts. Require expected row version. Cross-Site move should default to forbidden absent an explicit rule.
- Read list queries should apply effective Site scope in Sites before filtering/count/order/pagination. Direct target operations should use the persisted Site and established concealment behavior. Create under a parent derives Site from that parent; root create targets a Site. Reject mismatching claimed Site/parent.
- Business event publication, if needed, is separate from technical audit. Use the registered `LocationMoved` contract and ADR-011 durable obligation; exact actions/payloads depend on the frozen operation set.

## Owner decisions required (contract remains unaccepted)

### OD-LOCATION-01 — roots and type compatibility

QUESTION: May a Site have multiple roots, and which LocationTypes may be roots/children of each other?
OPTIONS: (A) multiple roots and unrestricted parent/child type combinations; (B) one root with an explicit type rule; (C) multiple roots with a type compatibility matrix.
RECOMMENDED_DEFAULT: Multiple roots; no type matrix in the first slice. LocationType is an extensible reference without a parent-type field, and backlog requires arbitrary depth, not a fixed building/floor/room sequence.
WHY / IMPACT: Root/type rules affect constraints, creation/move validation, imports and the tree UI. Examples are not accepted business rules.

### OD-LOCATION-02 — code/name contract

QUESTION: What are Location `code` and `name` requiredness, code normalization/mutability, uniqueness scope, and name uniqueness/length rules?
OPTIONS: (A) required canonical immutable code, unique within Site; required non-unique name; (B) code optional, unique among siblings if present; required non-unique name; (C) owner-defined alternative.
RECOMMENDED_DEFAULT: Required immutable trimmed code unique within Site; required trimmed name, duplicates allowed. Do not copy LocationType's uppercase rule without a Location-specific requirement.
WHY / IMPACT: Affects nullability, indexes, update contract, import behavior and future Asset labels. Current docs list fields only.

### OD-LOCATION-03 — lifecycle and parent/child behavior

QUESTION: Freeze lifecycle representation/transitions and behavior when deactivating a parent with active descendants, including child creation and reactivation.
OPTIONS: (A) reject deactivation while active descendants exist; (B) cascade descendants inactive; (C) allow active descendants but forbid new active children under inactive parents; (D) owner-defined alternative.
RECOMMENDED_DEFAULT: ACTIVE/INACTIVE; preserve descendants and their history; reject deactivation while any active descendant remains; prohibit creating/reactivating active children under an inactive parent. Reactivate top-down. No cascade.
WHY / IMPACT: Current schema uses `is_active`, context says “inactive”, and no descendant transition rule is accepted. Impacts constraints, locking and lifecycle API.

### OD-LOCATION-04 — Site identity and cross-Site subtree move

QUESTION: Is `site_id` immutable, or can a whole Location subtree move to another Site?
OPTIONS: (A) immutable Site ownership; all moves remain within the same Site; (B) allow atomic subtree transfer with every descendant reassigned and destination rules checked; (C) allow only leaf transfer.
RECOMMENDED_DEFAULT: (A), no cross-Site moves. This preserves Site authorization and future Asset references/history without a cross-module transfer protocol.
WHY / IMPACT: Acceptance says “one Site” and parent must share Site; it does not say whether a complete subtree may change ownership. Affects key/FK design, audit/history, scope checks and Asset compatibility.

### OD-LOCATION-05 — type mutability and update/move command split

QUESTION: Can a Location change type after creation, and is parent change a dedicated Move command?
OPTIONS: (A) type mutable by ordinary update; parent only via Move; (B) type immutable; parent only via Move; (C) type change is its own validated command; parent only via Move.
RECOMMENDED_DEFAULT: (A), with ACTIVE destination type and full parent/child compatibility validation; keep reparenting as a separate Move command.
WHY / IMPACT: Type is not identified as immutable and Move is separately named in existing module/event sketches, but no accepted update contract exists. Affects API, history and concurrency.

### OD-LOCATION-06 — read/mutation authorization matrix

QUESTION: Which permission permits Location list/get, and does `sites.manage_locations` imply read for the management UI?
OPTIONS: (A) `sites.read` for list/get; `sites.manage_locations` only for mutations; (B) either permission for list/get, manage permission for mutations; (C) owner-defined split.
RECOMMENDED_DEFAULT: (A), matching Site precedent that change permission does not imply read; both permissions are INTERNAL and scoped through Zone/Region/Site ancestry, with Site target resolution by Sites.
WHY / IMPACT: LocationType catalog's two-permission union is catalog-specific and explicitly grants no Location operation. The Location endpoint matrix is not documented.

### OD-LOCATION-07 — Location read shape, ordering and paging

QUESTION: What read contract will serve tree navigation and later replace the Site card placeholder?
OPTIONS: (A) paged flat Site-scoped list with `parentLocationId`; (B) paged/lazy child query by Site and nullable parent; (C) whole-Site tree response; (D) separate tree and operational list.
RECOMMENDED_DEFAULT: (B), stable sibling order `code ASC, id ASC` once code is frozen, with bounded pagination; do not return an unbounded whole Site tree. Add a separate search/list only if Assets requires it.
WHY / IMPACT: There is a legacy `GET /sites/{id}/locations` example but no frozen DTO, query semantics, ordering or paging. Site UI depends on an authorized Site-scoped read.

### OD-LOCATION-08 — task frontend boundary

QUESTION: Does TASK-02.04.02 include Location UI/Site card replacement, or is UI a later task?
OPTIONS: (A) backend/domain/persistence/API only; separate UI task; (B) include Location management UI and Site card read replacement.
RECOMMENDED_DEFAULT: (A). Current task acceptance is backend-domain behavior only; TASK-02.03.04 explicitly left a placeholder pending this read contract.
WHY / IMPACT: Affects acceptance criteria and scope after the read contract is frozen. No frontend implementation is included in LOCATION-TREE-00.

OWNER_DECISIONS_REQUIRED: 8

## Implementation outline after decisions

1. `LOCATION-B1`: Location domain invariants, Sites-owned persistence/migration, tree-safe serialization, optimistic concurrency and durable audit foundation; same Site subtree and FK behavior included.
2. `LOCATION-AUTH-API-01`: Site-derived authorization, concealed direct targets, validated create/update/move/lifecycle commands and bounded authorized tree reads. Combine with B1 only if the frozen contract and focused verification fit one reviewable vertical slice.
3. `LOCATION-UI-01` only if OD-LOCATION-08 assigns UI here; otherwise create/execute it as a later authorized task. These are checkpoints, not Git branches.

## Documentation and phase boundary

- Product docs are not changed: the contract is not accepted and recommendations must not be promoted to product rules.
- DOCS_IMPACT: NO for the checkpoint-only change. DOCUMENTATION_SYNC: NOT_APPLICABLE; no product implementation/documentation change occurred.
- No implementation, schema, migration, Location entity, branch, worktree or push was created. No tests/build/runtime checks were run in this analysis-only phase.
- `FILES_CHANGED`: this checkpoint only.

## Git state after checkpoint

- Baseline `HEAD` and `origin/main` remain `6b986f95fb431a31f7543696278f0910ac666be6` on `main`.
- Expected uncommitted change: `.agent/tasks/TASK-02.04.02/state.md` only.
- No commit or push authorized or performed.

NEXT_ACTION: Obtain owner answers for OD-LOCATION-01..08; record accepted contract decisions in this checkpoint, then implement TASK-02.04.02 directly on `main` within the agreed scope.
DO_NOT_REPEAT: Do not rerun the completed baseline/document scan unless a relevant source changes; do not treat recommendations as accepted; do not create Location code/schema/API/UI, branch/worktree, commit or push before the owner gate.


## LOCATION-TREE-01 resume — 2026-10-02

REPOSITORY_STATE_GUARD: SAFE_WITH_CHECKPOINT
RESUME_SAFE: YES
STATE_DRIFT: NONE
OWNER_DECISIONS_REQUIRED: RESOLVED

The LOCATION-TREE-00 findings/questions above are retained as historical research. The following explicit owner decisions supersede their provisional proposals and previous stop rules:

- OD-LOCATION-01 ACCEPTED: multiple roots; null parent; any ACTIVE LocationType at any depth; no type compatibility matrix.
- OD-LOCATION-02 ACCEPTED: required trimmed uppercase code <=50, unique per exact Site, immutable; required trimmed name <=200, duplicates allowed; no regex/sibling-name uniqueness.
- OD-LOCATION-03 ACCEPTED: ACTIVE/INACTIVE, create ACTIVE, no delete/cascade; deactivate rejects any ACTIVE descendant; activate only root or ACTIVE direct parent.
- OD-LOCATION-04 ACCEPTED: Site immutable, cross-Site node/subtree moves forbidden.
- OD-LOCATION-05 ACCEPTED: ordinary update name/type/existing metadata; parent only Move with nullable parent, required trimmed reason <=500 and expectedRowVersion; new/changed type ACTIVE, historical inactive reference allowed unchanged.
- OD-LOCATION-06 ACCEPTED: fixed sites.read for reads, fixed sites.manage_locations for mutations, independent; authoritative stored Site ancestry; exact Zone/Region/Site scopes only, no Location scope.
- OD-LOCATION-07 ACCEPTED: lazy roots/direct children; GET /api/v1/sites/{siteId}/locations?parentLocationId&page&pageSize; page1/size50/max200; code,id ASC; GET /api/v1/locations/{locationId}.
- OD-LOCATION-08 ACCEPTED: backend only, no frontend/tree/Site-card placeholder changes.

Frozen implementation plan: Sites-owned adjacency list; description and timestamps from existing database sketch only; PostgreSQL Site-scoped transaction advisory serialization plus recursive descendant checks; unique Site/code and restrictive same-Site parent FK; optimistic row version; existing durable audit obligations, no separate history subsystem and no provisional integration-event emission.

Execution BALANCED/T3: primary owns contracts/integration/docs/final checks; location_persistence owns Domain/persistence/audit plus domain/DB tests; location_api owns Application/authorized reads/API/DI plus HTTP tests. No overlapping DB/schema/audit writers.

COMPLETED: repository fetch/guard/resume, exact request loaded, owner decisions frozen.
VERIFIED: main HEAD == origin/main == 6b986f95fb431a31f7543696278f0910ac666be6; only state.md initially untracked; git diff empty; one primary worktree.
LAST_SAFE_COMMIT: 6b986f95fb431a31f7543696278f0910ac666be6
PENDING: implementation, migration, tests, independent security review, documentation sync, one local atomic commit.
BLOCKERS: NONE at resume; Docker Desktop daemon restored (29.8.0), real PostgreSQL validation enabled.
CHECKPOINT_STATUS: SAFE (pre-implementation resume checkpoint; workstreams must record own current checks).
NEXT_ACTION: Integrate frozen Domain/persistence and Application/API workstreams, then execute real PostgreSQL and full repository gates.
DO_NOT_REPEAT: No completed contract research; no branch/worktree/push; no frontend; no history subsystem, scope kind or type matrix; no destructive recovery; no commit before all required gates PASS.

## Intermediate validation

- Infrastructure static scripts PASS: DevScripts.Tests.ps1, CiWorkflow.Tests.ps1, DatabaseMigrator.Tests.ps1, ApiBootstrapSmoke.Contract.Tests.ps1.
- DOCS_IMPACT: YES (Location business rules/lifecycle/DB/API/authorization/audit catalogs).
- Documentation in progress: Sites module/capsule, backlog, database, permission/security contracts, Audit module/capsule/events registry; architecture edit is canonical Location field-name correction only.
- Current writers are active; integrated build/runtime tests and independent review are still PENDING. Do not infer completion from this checkpoint.


## Final implementation checkpoint — 2026-10-02

This section supersedes all historical PENDING, NEXT_ACTION, DOCS_IMPACT and stop rules above. The original LOCATION-TREE-00 research remains historical evidence only.

COMPLETED: accepted OD-LOCATION-01..08 implemented; Domain/Application/Infrastructure/API integrated; one Sites migration; real PostgreSQL/HTTP/audit regressions; independent read-only security review; documentation sync.
DECISIONS: adjacency list, immutable Site/code, multiple roots, no depth/type matrix, independent permissions, lazy bounded children, Site advisory transaction serialization, optimistic row version, existing durable audit delivery. Existing optional description is trimmed/max500 by the reference pattern; timestamps UTC. No Location scope, frontend, delete, cascade, cross-Site transfer, history subsystem or provisional LocationMoved integration event.

VERIFIED CHECKS:
- Full Release solution build: PASS, zero warnings/errors.
- IdentityDomainChecks, SitesDomainChecks, ArchitectureChecks, AuthenticationChecks: PASS.
- PostgreSQL IdentityPersistenceChecks, SitesPersistenceChecks, SitesApiChecks, AuditPersistenceChecks, AuditDeliveryChecks, OrganizationPersistenceChecks, OrganizationApiChecks: PASS.
- Tree races: deterministic observed advisory-lock waiters for opposing moves, create versus ancestor deactivation, duplicate code; final graph/lifecycle/count assertions PASS. Recursive depth >32 PASS.
- HTTP: exact seven Location operations/no DELETE; fixed independent read/manage across Zone/Region/Site; forbidden, missing/cross-Site target concealment, contractor/wrong context/future/expired grants, forged ancestry/scope, paging, errors, OpenAPI, audit and unchanged state on failure PASS.
- Migration smoke: central migrator applies 16 total / Sites seven migrations; second run applies zero. Sites EF pending model changes: NONE.
- Audit atomic rollback and canonical five actions, allowlisted before/after, Move reason, actor/context and existing dispatcher delivery: PASS.
- dotnet test solution Release --no-build: exit 0, no discovered test cases; functional evidence comes from the explicit executable harnesses above.
- DevScripts, CiWorkflow, DatabaseMigrator, ApiBootstrapSmoke.Contract and runtime ApiBootstrapSmoke scripts: PASS.
- Changed C# whitespace verification, git diff --check and changed-file secret-pattern scan: PASS.
- Frontend and Site-card placeholder changes: NONE. Hosted CI: NOT_RUN (local-only phase, no push).

DOCS_IMPACT: YES
DOCUMENTATION_SYNC: PASS
Reviewed/updated Sites module/context, Audit module/context, database, backlog, security, permissions registry and events registry. Architecture change only aligns the documented Location field names. Generated OpenAPI verified by HTTP harness. Accepted ADRs remain compatible; no ADR or ADR-index change needed. Audit history is technical evidence; future Asset movement still requires its own business history contract.

SECURITY_REVIEW: PASS; independent read-only location_review closure.
OPEN_CRITICAL: 0
OPEN_HIGH: 0
OPEN_MEDIUM: 0
OPEN_LOW: 0
HIGHEST_SEVERITY: NONE
BLOCKERS: NONE

TASK_OWNED_CHANGES: the complete atomic commit contains only Location Domain/Application/Infrastructure/API, Sites migration/model/audit binding, canonical Audit contracts/validation, targeted tests (including migration-count regression), the documentation listed above and this task's checkpoint/review/validation/agent records. No unrelated refactor/dependency/Identity-schema/frontend change.

LAST_SAFE_COMMIT: 6b986f95fb431a31f7543696278f0910ac666be6 (verified precommit baseline).
FINAL_LOCAL_COMMIT: the atomic commit containing this checkpoint; resolve from Git rather than a self-referential SHA in this file. Its parent must equal LAST_SAFE_COMMIT. If HEAD is still the baseline, the final local commit has not yet happened: reconcile staged diff and guard before committing once.
EXPECTED_POST_COMMIT: main ahead origin/main by one; origin/main remains baseline; worktree clean; no push.
UNCOMMITTED_CHANGES: before the atomic commit, exactly the task-owned staged paths; after it, NONE. Git is the factual source of truth.
CHECKPOINT_STATUS: SAFE; implementation and required precommit gates complete.
NEXT_ACTION: Independent review of TASK-02.04.02 local commit before push.
DO_NOT_REPEAT: Do not rerun accepted contract research or passing gates without a new change/failure; do not create a second task commit, branch/worktree, push, frontend or adjacent phase. Do not use destructive recovery. Stop after verifying the authorized local commit.

## Final commit resume — 2026-10-06

REPOSITORY_STATE_GUARD: PASS
RESUME_SAFE: YES
STATE_DRIFT: NONE
After interruption, git fetch confirms main HEAD == origin/main == baseline above; one primary worktree. All 53 staged task-owned paths are identical to the saved full staged review diff from the completed verification phase; no unstaged or unknown untracked paths. No code changed since passing runtime/build/security gates, so no redundant rerun is required. Only this resume checkpoint is appended before the already authorized atomic local commit.
NEXT_ACTION: Independent review of TASK-02.04.02 local commit before push; STOP after commit-state verification.

## LOCATION-TREE-01R review checkpoint — 2026-10-06

This section supersedes implementation-only NO_PUSH/STOP rules under the owner's explicit publication request.
STATUS: REVIEW_PASS_PUBLICATION_PENDING
PHASE: LOCATION-TREE-01R — INDEPENDENT REVIEW + PUBLICATION
REPOSITORY_STATE_GUARD: SAFE_WITH_CHECKPOINT
RESUME_SAFE: YES
STATE_DRIFT: NONE
BASELINE_SHA: 6b986f95fb431a31f7543696278f0910ac666be6
SOURCE_COMMIT: 02f2429644a8097148dd46b8ec86ed2d56961d0b
LAST_SAFE_COMMIT: 8cbf2cbe899c97fa11998de5d2f657076a458202
REMEDIATION_COMMITS: 8cbf2cb (tests only; no candidate amend or production defect)
COMPLETED: exact 53-path ownership review, independent read-only security/API review, field-source gate, DB/transaction/recursive/concurrency/audit review; test evidence gaps closed and independently reviewed.
VERIFIED: Release zero warnings/errors; all 11 named harnesses; real PostgreSQL tree/three lifecycle races/unique/audit tests; API real Identity negatives and permission independence; migrator16/Sites7 then0; model drift NONE; infrastructure/bootstrap scripts; dotnet test exit0/no discovery; formatting/diff/secret hygiene PASS.
DOCS_IMPACT: YES
DOCUMENTATION_SYNC: PASS
OPEN_CRITICAL: 0
OPEN_HIGH: 0
OPEN_MEDIUM: 0
OPEN_LOW: 0
FRONTEND_CODE_CHANGED: NO
LOCATION_UI: NOT_IMPLEMENTED
SITE_CARD_LOCATION_PLACEHOLDER: STILL_PRESENT
BUSINESS_HISTORY: NOT_IMPLEMENTED; technical Audit only
HOSTED_CI: NOT_YET_VERIFIED
PUSHED: NO
BLOCKERS: NONE
UNCOMMITTED_CHANGES: this checkpoint and location-tree-01r-review.md, narrow review documentation only.
NEXT_ACTION: fetch/verify unchanged origin baseline, commit reviewed documentation, normal push main, verify exact final SHA hosted backend/frontend/required checks; finalize PUBLISHED checkpoint then STOP.
DO_NOT_REPEAT: no contract research, candidate amendment, branch/worktree, frontend/Site-card/Assets, destructive recovery or force push; no redundant runtime suite without new changes/failure.
