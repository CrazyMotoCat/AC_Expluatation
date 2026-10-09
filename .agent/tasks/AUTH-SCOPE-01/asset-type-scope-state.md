# AUTH-SCOPE-01 — ASSET-TYPE-SCOPE-00

DATE: 2026-10-09 (Asia/Vladivostok)
STATUS: CONTRACT_FROZEN_IMPLEMENTATION_PENDING
MODE: READ / ANALYZE / DOCUMENT ONLY
SOURCE_OF_TRUTH: current owner request, OD-ASSET-TYPE-08 and accepted clarifications 08A..08E; ADR-013/015/016/017/018.
BASELINE_SHA: 658521128cc812a7e0e2d4a59a6a01603eb48db4
LAST_SAFE_COMMIT: 658521128cc812a7e0e2d4a59a6a01603eb48db4
CURRENT_BRANCH: main
REPOSITORY_STATE_GUARD: SAFE_WITH_CHECKPOINT
GIT_STATE: DIRTY_EXPECTED
RESUME_SAFE: YES

## Baseline and reconciliation

`git fetch` succeeded; main, HEAD and origin/main equal BASELINE_SHA; one primary worktree. Initial dirty paths are only TASK-02.02.02/state.md (modified publication checkpoint) and TASK-03.01.01/state.md (untracked). No staged changes. Neither downstream checkpoint is edited or staged by this phase.

Preserved SHA256:
- TASK-02.02.02/state.md: DA6BB5A0AE4BFBAC90EB9F624252004A6E55529EFF8503D37CA7329BB3389D5C.
- TASK-03.01.01/state.md: 9AB72D3C68678954ECB5B57F20565E8482E2C02B1ADA70D21685A2EB7A96F218.

The downstream AssetType checkpoint records an older d07f486 baseline and missing FunctionalDirection provider. That is historical dependency metadata, superseded by the published code at this baseline and TASK-02.02.02 final publication checkpoint. It is not a reason to alter unknown changes or restart the prerequisite. No fresh hosted-CI verification is claimed in this analysis; existing publication provenance is retained.

## Repository evidence

Paths are relative to the repository root.

| Evidence | Authoritative source |
|---|---|
| Stored assignment fields/composites | src/backend/Modules/Identity/Exploitation.Modules.Identity.Domain/Authorization/AccessAssignment.cs; AccessScope.cs |
| PostgreSQL shape/constraints | src/backend/Modules/Identity/Exploitation.Modules.Identity.Infrastructure/Persistence/Configurations/AccessAssignmentConfiguration.cs; docs/database.md §5.5 |
| Current effective-scope interface/result | src/backend/Modules/Identity/Exploitation.Modules.Identity.Application/Authorization/IEffectiveScopeProvider.cs; EffectiveScopeRequest.cs; EffectiveAuthorizationScope.cs |
| Eligibility and supported shape | src/backend/Modules/Identity/Exploitation.Modules.Identity.Infrastructure/Authorization/EffectiveAuthorizationQueries.cs; EffectiveScopeProvider.cs |
| Explicit GLOBAL | Application/Authorization/IGlobalGrantProvider.cs and Infrastructure/Authorization/GlobalGrantProvider.cs under Identity; ADR-018 |
| Exact target evaluator | Identity Infrastructure/Authorization/EffectiveGrantEvaluator.cs; Application/Authorization/AuthorizationScopeCoverage.cs |
| Trusted request composition | src/backend/Exploitation.Api/Sites/GeographyRequestAuthorization.cs; Organization/FunctionalDirectionRequestAuthorization.cs; WorkingContexts middleware |
| Sites catalog comparison | src/backend/Modules/Sites/Exploitation.Modules.Sites.Application/Authorization/SiteReferenceCatalogAuthorizationService.cs |
| FunctionalDirection | src/backend/Modules/Organization/Exploitation.Modules.Organization.Application/FunctionalDirections/FunctionalDirectionContracts.cs; FunctionalDirectionReferenceProvider.cs |
| Task acceptance | docs/backlog.md TASK-03.01.01; preserved downstream checkpoint accepted OD-01..08 |

ASSIGNMENT_SCOPE_FIELDS: is_global; territorial_zone_id; region_id; site_id; functional_direction_id; asset_type_id.
Other persisted fields: id, user_id, role_id, context_type, context_id, valid_from, valid_to, is_active, created_at, created_by, revoked_at, revoked_by, row_version.
COMPOSITE_SCOPES_SUPPORTED: YES; five nullable concrete dimensions retained together, restrictions conjunctive. No exactly-one constraint for storage.
GLOBAL_MODEL: explicit is_global=true, all five concrete IDs NULL; non-global requires at least one dimension. Null/unknown/empty never implies GLOBAL.
VALIDITY_MODEL: ACTIVE assignment and role, [valid_from, valid_to); revoked/future/expired excluded; DELEGATION persistence requires finite valid_to.
CONTEXT_MODEL: persisted context_type/context_id; operational query requires exact current owned ACTIVE INTERNAL context with its own [valid_from, valid_to), same user and matching assignment context. No default context grant.

## Current trusted providers: capability and failure boundaries

| Provider | Returned facts / dimensions | Permission, user, context sources | Failure |
|---|---|---|---|
| IEffectiveScopeProvider.GetEffectiveScopesAsync(EffectiveScopeRequest) | Immutable distinct kind/ID; exact Zone OR Region OR Site only; no GLOBAL, direction, type or composites | Server CanonicalPermission checked against catalog; current canonical local user and validated selected context passed by server composition; Identity rechecks persistence | Invalid request -> empty. Storage exceptions propagate; consumer must deny. Cancellation propagates. |
| IGlobalGrantProvider.HasGlobalGrantAsync(GlobalGrantRequest) | Boolean; explicit GLOBAL only, all concrete fields NULL | Same trusted request fields and ForCurrentPermissionAssignments eligibility | Invalid -> false; provider/storage exception -> false with sanitized warning; requested cancellation propagates. |
| IEffectiveGrantEvaluator | Boolean exact Zone/Region/Site target ID; no hierarchy, taxonomy, GLOBAL or composites | Same trusted subject/context and exact permission | Invalid -> false; storage exception propagates, so consumer denies. |
| IPermissionGrantSource | Target-blind production deny-all | Canonical permission ID/local user | No operational positive grant. Cannot establish catalog eligibility. |

ForCurrentPermissionAssignments is INTERNAL Infrastructure IQueryable, not an Application contract. It correctly selects eligible current assignments through user/context/role/role_permissions/permissions joins before scope-shape filtering. Reuse this internally; never export IQueryable. ForEligibleAssignments then deliberately restricts to non-global single geographic scope with no direction/type. AccessAssignment.IsApplicableTo is a Domain primitive, not a complete cross-module grant.

FUNCTIONAL_DIRECTION_SCOPE_AVAILABLE: NO through current Application providers; YES persisted.
ASSET_TYPE_SCOPE_AVAILABLE: NO through current Application providers; YES persisted.
PER_ASSIGNMENT_CORRELATION_PRESERVED: YES in persistence; NOT REPRESENTABLE in current effective result. Current provider safely excludes composites rather than flattening them; do not change its old geographic method.
EXISTING_CONTRACT_ALREADY_SUFFICIENT: NO.
READ_PROVIDER_GAP: no exported current-any-recognized-assignment eligibility method. Sites catalog service accepts only supported geographic descriptors, so cannot be reused for this taxonomy catalog. Organization catalog requires GLOBAL and cannot be reused either.

## Accepted owner clarifications (frozen)

- OD-ASSET-TYPE-08A: GLOBAL management requires explicit current is_global=true for exact assets.manage_types. A concrete assignment, null or unknown scope is never global.
- OD-ASSET-TYPE-08B: any non-global assignment with Zone, Region or Site is ineligible for taxonomy management, even with direction/type. Its other operational meaning is preserved.
- OD-ASSET-TYPE-08C: without geography, direction covers exact authoritative direction; type covers authoritative root plus descendants; both mean intersection within that assignment.
- OD-ASSET-TYPE-08D: Identity owns assignment, permission, validity, ownership/context and trusted scope IDs; Assets owns type persistence, direction fact, hierarchy, coverage and mutation composition. No cross-module DbContext access.
- OD-ASSET-TYPE-08E: ACTIVE INTERNAL subject plus valid owned INTERNAL context and current exact assets.read OR assets.manage_types assignment establishes global catalog eligibility. Recognized concrete/composite and explicit GLOBAL can qualify. No catalog row filtering; read never implies mutation.

## Proposed minimal trusted handoff (conceptual; no runtime declarations)

Extend the EXISTING Identity Application IEffectiveScopeProvider with:

`GetCurrentAssignmentScopesAsync(EffectiveScopeRequest, CancellationToken) -> ImmutableArray<EffectiveAssignmentScopeFacts>`.

One immutable result item represents one complete eligible NON-GLOBAL assignment:

`EffectiveAssignmentScopeFacts(TerritorialZoneId?, RegionId?, SiteId?, FunctionalDirectionId?, AssetTypeId?)`.

GLOBAL remains separately represented by IGlobalGrantProvider; do not copy its decision logic or put GLOBAL into geographic results. This is the permitted separate-GLOBAL representation, rather than requiring an IsGlobal flag in each concrete DTO. Keep all five concrete fields, including geography, so the consumer can reject geographic composites atomically. No role/entity, arbitrary-user listing, IQueryable, raw tables, caller ancestry or target evidence is exposed. A persistence assignment ID is unnecessary for coverage; never flatten fields across rows. Deduplicating identical complete tuples does not widen authority, but per-field independent sets are forbidden.

Use ForCurrentPermissionAssignments with canonical catalog validation, explicit non-global shape validation (one or more recognized nonempty IDs), common clock instant, no target evaluator and no hierarchy expansion. Unsupported/malformed assignments do not authorize. INTERNAL runtime eligibility is already centralized by that shared query; preserve it, without embedding Assets permission/coverage policy in Identity. Assets independently requires INTERNAL eligibility and fixes its permissions.

PERMISSION_SOURCE: Assets server-side composition constants: management assets.manage_types; catalog assets.read or assets.manage_types. Generic CanonicalPermission from trusted server code is consistent with ADR-015/016/018.
CALLER_PERMISSION_INPUT: NONE.
USER_SOURCE: validated authenticated issuer/subject -> canonical local profile via existing ICurrentUser/profile resolution; never body/query userId.
CONTEXT_SOURCE: existing request context middleware verifies header-selected owned context; Identity rechecks same context/user/type/validity. An HTTP-selected context ID is business selection, never proof of ownership.
VALIDITY_FILTERING: active user/role/context/assignment, ownership, exact role-permission, revocation and [valid_from, valid_to) before returning any facts.
FAIL_CLOSED: empty invalid results or dependency exception deny; consumer does not continue fallback after an exception. Requested cancellation propagates. No cache or implicit global fallback.

Catalog composition reuses these same two primitives; no separate generic boolean API is needed. Query concrete facts for both fixed read permissions first, validate recognized tuples and taxonomy references, and allow if one complete assignment qualifies. A provider exception is terminal denial, not a reason to try GLOBAL. Only when concrete evaluation succeeds with no eligible assignment, use IGlobalGrantProvider as terminal GLOBAL decisions. Geographic scopes/composites do not require a geographic target evaluator and do not filter rows. Direction/type IDs are scope identifiers, not hierarchy proof; Assets resolves those taxonomy scope references before accepting them, and a stale/missing taxonomy reference makes that assignment unusable. Stored shape recognition alone does not prove taxonomy existence. INTERNAL and current eligibility remain mandatory even for GLOBAL.

For management, first obtain concrete facts for fixed assets.manage_types and evaluate whole qualifying assignments. Geographic tuples are ignored. Each direction/type restriction is validated against owner facts; a missing scope-root or direction denies that assignment. Other independent valid assignments may still authorize. A provider/reference exception is terminal denial. Only after successful concrete evaluation with no covering assignment, call IGlobalGrantProvider for assets.manage_types as the terminal decision: false always denies, with no subsequent concrete fallback. This ordering is essential because that published boolean deliberately does not distinguish provider failure from absence.

For catalog GLOBAL OR across assets.read and assets.manage_types, evaluate the two independent fixed-permission GLOBAL decisions after successful concrete evaluation; authorize only from an actual true result. Both false denies. Evaluate these independently specified OR branches sequentially on the existing scoped provider; never run concurrent EF queries on the same IdentityDbContext. This is evaluation of independent accepted grants, not a retry or a different concrete fallback after a false that might hide an error. A thrown consumer-visible exception/cancellation aborts evaluation; no further authorization path is attempted. Do not promise detection of a storage failure swallowed by the existing boolean provider: each false is a denied grant, and an independently proven true for the other permitted read action may qualify. No GLOBAL provider semantics are changed.

ASSIGNMENT_CORRELATION: mandatory; constraints within one tuple AND, qualifying complete assignments OR.
CROSS_ASSIGNMENT_DIMENSION_COMBINATION: FORBIDDEN.

## Consumer authorization matrix

All ALLOW entries still require INTERNAL eligibility, exact management permission, current assignments, authoritative references and separate business rules.

| Operation | Explicit GLOBAL | Direction-only D | Type-only X | Direction D + Type X |
|---|---|---|---|---|
| Create root | Allow | Requested resolved direction equals D | Deny | Deny |
| Create child | Allow | Existing parent direction equals D | Existing parent in X subtree | Both conditions on same parent |
| Update/activate/deactivate target | Allow | Existing target direction equals D | Target is X or descendant | Both on same target |
| Reparent | Source/destination allowed | Source and destination (if any) direction D; root allowed in D | Source and destination parent within same X subtree; root denied | Same type restriction AND direction restriction |

Every geographic-containing non-global tuple denies MANAGEMENT for every operation, including all three composites geography+direction, geography+type, geography+direction+type. A different independent direction or GLOBAL assignment can still authorize.

Catalog READ: assets.read YES; assets.manage_types YES; GLOBAL/geographic/direction/type/valid composite YES after eligibility; CATALOG_FILTERING NONE. Concrete no-direction/no-type geographic grant reads but never manages. Empty/unknown scope is not a recognized grant.

FunctionalDirectionReferenceProvider.GetReferenceAsync returns null if missing, otherwise immutable Id/Code/Name/Status/IsSelectableForNewReference. ACTIVE is selectable for new references; INACTIVE is resolvable, non-selectable. Stable ID alone is used for authorization comparisons; code/name never authority. Inactivity is not absence and does not erase existing-target coverage. New roots/direction references require published selectability; child/lifecycle additionally follow accepted Assets business rules. Consumer must never fabricate reference facts on provider failure.

TYPE_SCOPE_ROOT_ESCAPE: DENIED. Type X's own parent cannot be changed to root, an external ancestor or external branch under X-only authority. A destination within X when source=X is a self/descendant cycle and fails business rules; direction-level or GLOBAL grant is needed to move X's boundary. Descendants may move inside X. Reparent must be covered by ONE complete assignment for BOTH source and destination; do not authorize source via X and destination via unrelated Y. Separate complete direction/GLOBAL authority may independently cover the entire operation.

STALE_DIRECTION_SCOPE: FAIL_CLOSED for that assignment; INACTIVE but existing is not stale.
STALE_ASSET_TYPE_SCOPE: FAIL_CLOSED for that assignment; INACTIVE but existing is not stale.
Assignment administration must eventually validate that referenced AssetType exists through an Assets-owned contract. No cross-schema FK, admin API/UI, seed grant or temporary bootstrap permission is needed here or in TASK-03.01.01.

## Concurrent hierarchy authorization contract

Accepted OD-01 freezes cross-process transactional serialization, but the current checkpoint/code contains NO implemented AssetType lock or numeric advisory key. Do not claim such a key is published. Proposed concrete integration: one dedicated Assets taxonomy transaction-scoped PostgreSQL advisory lock shared by ALL type mutations (create, reparent, update, activate, deactivate). Freeze its collision-free key in ASSET-TYPE-01 implementation; it is not the Sites per-Site or Organization per-Company key.

Use READ COMMITTED with fresh authoritative queries AFTER acquiring the lock, then retain lock until atomic mutation/audit commit or rollback. Discard pre-lock target/parent/ancestry/scope-root observations, obtain current Identity grant facts, resolve directions, reread source/destination/scope-root and authoritative recursive ancestry, evaluate authorization and business rules, check expectedRowVersion, mutate/audit. All hierarchy-dependent mutations participate, including ordinary update and lifecycle; serializing reparent alone is insufficient. No stale ORM-tracked projection may replace fresh reads. If stronger isolation is chosen later, it must guarantee fresh post-lock facts or retry the whole transaction; a stale repeatable snapshot is insufficient.

Thus if reparent wins first, the waiting mutation rechecks ancestry and denies a moved-out target; if mutation wins first, it commits while coverage is valid before reparent proceeds. Tests must exercise both orders on real PostgreSQL with independent connections and processes-compatible locks. This contract handles structural coverage races; it introduces no new guarantee of atomic cross-module Identity revocation versus an already authorized in-flight transaction beyond existing current evaluation semantics.

## Security attack analysis and future regression requirements

| # | Attack | Required negative case / defense |
|---|---|---|
| 1 | Site -> global taxonomy | Read eligible, management denied |
| 2 | Site + direction escalation | Whole tuple ignored for management |
| 3 | Region + type escalation | Whole tuple ignored for management |
| 4 | Concrete no direction/type -> global | Management denied; no inference |
| 5 | Null -> global | Empty scope rejected |
| 6 | Unknown -> global | Unsupported/malformed fail closed |
| 7 | Permission injection | Transport cannot bind permission; exact server constant |
| 8 | Scope injection | Consumer acquires facts internally, never accepts DTO evidence |
| 9 | Forged type ancestry | Assets persisted recursive hierarchy only |
| 10 | Forged direction authority | Assets direction fact and Organization reference ID only |
| 11 | Synthetic cross-assignment grant | Preserve complete tuples; AND within, OR between |
| 12 | Stale direction | Missing ref denies affected assignment |
| 13 | Stale type | Missing root denies affected assignment |
| 14 | Scoped root escape | No external/root destination under type-only grant |
| 15 | Concurrent moved-out target | Shared lock for every hierarchy-dependent mutation; post-lock reread |
| 16 | Wrong context/user | Canonical current subject, owned current context, Identity joins |
| 17 | Future/expired/revoked | Shared clock and half-open validity, active checks |
| 18 | Provider failure | Deny, sanitized errors, no fallback; cancellation propagates |
| 19 | Permission P satisfies Q | Exact permission filter; no implication/cross-action reuse |
| 20 | Duplicated GLOBAL logic | Reuse IGlobalGrantProvider unchanged |

Additional tests: empty/inconsistent D+X intersection; no geography+direction+type management; wrong INTERNAL eligibility/external user; scope-root reparent/create-root denials; denied mutation has no entity/version/audit effect; multiple independent valid assignments; source/destination covered only by different roots denied. Structural tests must prove no public Assets contract accepts caller scopes/ancestry or arbitrary permission. Provider tests must prove current composite correlation and all dimensions survive handoff while old geographic/global behavior remains unchanged.

## ADR and implementation split

ADR_REQUIRED: YES for future cross-module handoff implementation.
ADR_STRATEGY: new additive ADR in AUTH-ASSET-SCOPE-01 refining ADR-015/016 for correlated assignment facts and applying ADR-018 unchanged; retain all Accepted files. Do not number/create an ADR in this analysis. No schema/global semantics change and no replacement of existing geography contracts.
RATIONALE: new cross-module public authorization representation and Assets-owned hierarchy composition require a durable architecture decision, not a silent broadening of geographic descriptors. Current owner decisions already freeze policy; ADR records implementation boundary.
ADDITIONAL_OWNER_DECISIONS_REQUIRED: NO.
ADDITIONAL_OWNER_DECISIONS: NONE; historical provider/dependency statuses are reconciled, not business contradictions.
IDENTITY_SCHEMA_CHANGE_REQUIRED: NO; required fields already mapped/migrated.
ASSETS_SCHEMA_CHANGE_REQUIRED: NO for this foundation; TASK-03.01.01 later needs its own approved first Assets migration.
PROPOSED_NEXT_PHASE: AUTH-ASSET-SCOPE-01 (phase of AUTH-SCOPE-01, NOT a new backlog Task ID).
TASK_03_01_01_IMPLEMENTATION_STATUS: BLOCKED_ON_SCOPE_TRUST_CONTRACT.

AUTH-ASSET-SCOPE-01 scope: implement trusted correlated Identity handoff, security/real PostgreSQL provider tests, Identity/Sites/Organization regressions, additive ADR and docs. No AssetType entity, Assets schema/migration, consumer runtime, grants or assignment-admin work. Independently review/publish exact final SHA before separately resuming TASK-03.01.01 / ASSET-TYPE-01.

## Verification, resumability and stop

COMPLETED: baseline guard, task resume reconciliation, current model/provider/call-site/ADR analysis, accepted policy freeze, attack matrix, implementation split and documentation impact/sync.
DOCS_IMPACT: YES (contract/security documentation only).
DOCUMENTATION_SYNC: PASS; affected Identity/Assets module+context, security, permissions registry and backlog link to this frozen contract; no DB/OpenAPI changes.
CHECKED_NO_CHANGE: concept, architecture (existing module/application pattern), coding-standards, project-structure, database (no schema), api-guidelines/OpenAPI (no routes), testing (no standard change), Organization module/context and ADR-013/015/016/017/018/index (new ADR deferred).
TESTS_BUILDS: NOT_RUN; no runtime changes; verification is source/document review, preserved hashes and git diff --check. Future test requirements above are not claimed executed.
INDEPENDENT_READ_ONLY_REVIEW: PASS after correcting GLOBAL false-on-error fallback; review record agents/asset-type-scope-review.md. Final minor wording clarifies sequential EF calls, with no shared-DbContext concurrency.
IDENTITY_CODE_CHANGED: NO
IDENTITY_SCHEMA_CHANGED: NO
ASSETS_CODE_CHANGED: NO
ASSETS_SCHEMA_CHANGED: NO
ASSET_TYPE_ENTITY_CREATED: NO
MIGRATION_CREATED: NO
ORGANIZATION_CODE_CHANGED: NO
BRANCH_CREATED: NO
WORKTREE_CREATED: NO
COMMIT: NONE
PUSH: NONE
UNCOMMITTED: this new checkpoint; AUTH-SCOPE-01/state.md phase pointer; agents/asset-type-scope-review.md; docs/modules/{identity,assets}.md; docs/context/{identity,assets}.context.md; docs/security.md; docs/permissions-registry.md; docs/backlog.md; plus two preserved downstream checkpoint paths above. No staged paths.
FINAL_CHECKS: git diff --check PASS; new untracked document whitespace/conflict-marker checks PASS; all new checkpoint links resolve; source diff empty; staging empty; HEAD/origin unchanged; both preserved downstream hashes match initial values. No runtime checks or new hosted CI claimed.
CHECKPOINT_STATUS: SAFE; recovery is baseline plus explicit task-owned documentation diff and preserved downstream hashes.
NEXT_ACTION: In a separately authorized phase implement/review/publish AUTH-SCOPE-01 / AUTH-ASSET-SCOPE-01 trusted Identity handoff without AssetType or schema work, then STOP before separately authorized ASSET-TYPE-01.
DO_NOT_REPEAT: do not reopen 08A..08E, rerun published FunctionalDirection implementation, modify/stage downstream checkpoints, flatten composites, broaden geography/global contracts, add runtime/schema/grants/admin APIs, create branch/worktree/commit/push, or start next phase in this session.

## AUTH-ASSET-SCOPE-01 implementation evidence — 2026-10-09

This section supersedes the historical analysis-only status above; frozen owner decisions and contract history remain unchanged.
TASK: AUTH-SCOPE-01
PHASE: AUTH-ASSET-SCOPE-01
STATUS: LOCAL_IMPLEMENTED_PENDING_REVIEW
CHECKPOINT_STATUS: SAFE
BASELINE_SHA / LAST_SAFE_COMMIT: 658521128cc812a7e0e2d4a59a6a01603eb48db4
CURRENT_BRANCH: main
REPOSITORY_STATE_GUARD: SAFE_WITH_CHECKPOINT / DIRTY_EXPECTED
MODE: BALANCED; primary owns implementation, contracts, integration and validation; independent read-only security review follows the local commit.

COMPLETED: additive Identity Application contract and production provider; architecture and real PostgreSQL tests; four geographic test doubles explicitly reject the unused new method; additive Accepted ADR-019; Identity module/context, security, architecture contract documentation and ADR index synchronized; Assets module/context/backlog dependency metadata only refreshed, no consumer runtime.
EXTENDED_INTERFACE: IEffectiveScopeProvider
METHOD: GetCurrentAssignmentScopesAsync(EffectiveScopeRequest, CancellationToken)
REQUEST_TYPE: EffectiveScopeRequest (existing trusted LocalUserId, WorkingContextId, CanonicalPermission)
RESULT_TYPE: ImmutableArray<EffectiveAssignmentScopeFacts>
DTO: sealed immutable record; nullable TerritorialZoneId, RegionId, SiteId, FunctionalDirectionId, AssetTypeId.
CORRELATION: one tuple per persisted current qualifying assignment, all five dimensions retained; duplicates preserved; internal deterministic assignment-ID ordering, no exported ID; no flatten/group/Cartesian product.
GLOBAL: excluded by is_global; exclusively IGlobalGrantProvider; all-null or any empty UUID concrete tuple excluded; null/empty never GLOBAL.
ELIGIBILITY: reuse ForCurrentPermissionAssignments, exact canonical permission; current ACTIVE INTERNAL user, owned current INTERNAL context, active role/assignment, revocation and [valid_from, valid_to); one IClock instant. Existing centralized INTERNAL policy unchanged.
TRUST: current validated local profile and owned selected context from server composition; CALLER_PERMISSION_INPUT: NONE_THROUGH_HTTP; no arbitrary-user endpoint, transport DTO or provider HTTP binding.
FAIL_CLOSED: invalid request yields empty immutable array; storage/query exceptions and requested cancellation propagate, no fallback; malformed dimension rejects whole assignment. Consumers must abort on exceptions; no Assets-specific policy/reference resolution in Identity.
DEPENDENCIES: no Identity to Assets/Organization/Sites persistence; no EF entity/DbContext/IQueryable escapes Application contract.
SCHEMA / MIGRATIONS / PERMISSION_SEEDS / ROLE_DATA / ASSIGNMENT_DATA: NO changes. Test fixture data belongs only to disposable PostgreSQL containers.
ASSETS_PRODUCTION / ASSETS_SCHEMA / ASSETTYPE_ENTITY / ASSETTYPE_AUTHORIZATION: NO changes.
ADR: ADR-019-correlated-assignment-scope-facts.md, Accepted, records frozen 08A..08E and refines ADR-015/016 while preserving ADR-018.

VERIFIED:
- Release solution build PASS, zero warnings/errors.
- All 11 normal executable backend harnesses PASS: IdentityDomainChecks, SitesDomainChecks, ArchitectureChecks, AuthenticationChecks, IdentityPersistenceChecks, AuditPersistenceChecks, SitesPersistenceChecks, SitesApiChecks, AuditDeliveryChecks, OrganizationPersistenceChecks, OrganizationApiChecks.
- New production-provider PostgreSQL matrix PASS: exact P/Q permissions/no membership, GLOBAL-only exclusion plus separate true GLOBAL, five single dimensions, four required composites plus all-five composite, separate direction/type non-merge, duplicate preservation, geography retention, missing taxonomy domain rows, current/future/expired/from/to boundaries, wrong/foreign/missing contexts, other-user/other-context assignments, inactive/revoked role/context/user, Contractor/System users, malformed UUID in every column, disposed storage exception and cancellation.
- Existing effective-scope, GLOBAL, working-context, Sites/Location/reference catalog and FunctionalDirection/Organization regressions PASS through the above harnesses.
- dotnet test solution Release --no-build PASS (console checks above are the actual executable evidence).
- Model drift NONE: EF has-pending-model-changes for Identity, Sites, Organization, Audit.
- Disposable PostgreSQL central migration smoke PASS: 19 existing migrations then 0 on repeat; container removed after check, no target data mutation.
- Four infrastructure/contract PowerShell scripts PASS; API bootstrap smoke PASS.
- Frontend lint/build PASS; 8 files / 71 tests PASS.
- Scoped changed-C# whitespace format PASS; final build PASS; git diff --check PASS.
- SECRET_HYGIENE: PASS by scoped source/diff inspection; only repository test credentials, no runtime secret/token logged or added.
- DOCS_IMPACT: YES; DOCUMENTATION_SYNC: PASS. Identity module/context, application-contract architecture note, security, ADR index and task/dependency records updated. Database/OpenAPI/testing/Organization product contract checked, no change needed.
- Logs: ignored artifacts/auth-asset-*.log; not staged. No hosted CI claimed; PUSH NONE.

UNCOMMITTED: task-owned source/tests/docs, AUTH-SCOPE state/phase checkpoint and original contract-review record before atomic staging. Preserve TASK-02.02.02/state.md modified and TASK-03.01.01/state.md untracked; never stage those downstream paths.
PRESERVED_DOWNSTREAM_SHA256: TASK-02.02.02 DA6BB5A0AE4BFBAC90EB9F624252004A6E55529EFF8503D37CA7329BB3389D5C; TASK-03.01.01 9AB72D3C68678954ECB5B57F20565E8482E2C02B1ADA70D21685A2EB7A96F218.
LOCAL_COMMIT: pending one atomic commit after exact staged diff review; record containing commit via Git, then append its exact SHA as local review metadata without a second commit.
PENDING: atomic local commit, independent read-only security/contract review. Publication separately gated.
BLOCKERS: NONE for local implementation.
TASK_03_01_01_STATUS: BLOCKED_UNTIL_AUTH_ASSET_SCOPE_PUBLISHED
NEXT_ACTION: Review exact staged diff, create one local main commit, then independently review that immutable commit before any push.
DO_NOT_REPEAT: no reinterpretation of 08A..08E; no schema/migration/seeds/grants/admin/API/Assets runtime; do not alter published geographic/GLOBAL semantics; no branch/worktree, downstream edits/staging, push, amend, destructive recovery or next phase.
