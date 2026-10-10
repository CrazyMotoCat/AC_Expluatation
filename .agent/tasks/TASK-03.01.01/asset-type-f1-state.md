# ASSET-TYPE-01F1 checkpoint

TASK: TASK-03.01.01
PHASE: ASSET-TYPE-01F1
STATUS: IN_PROGRESS
LAST_SAFE_COMMIT / SOURCE_COMMIT: c618c1af837326aada23ed7a64b762089223ca5e
EXPECTED_ORIGIN_MAIN / PUBLISHED_BASELINE: faa09a7b77d8d9bfb5f416a1d00ce6070bbd61f6
BRANCH: main; original worktree only; no new branch/worktree.
REPOSITORY_GUARD: SAFE_WITH_CHECKPOINT / DIRTY_EXPECTED.
ORIGINAL_REVIEW: asset-type-review.md remains untouched/unstaged; SEC-01 OPEN MEDIUM until follow-up independent review. Prior root state/AUTH-SCOPE/FunctionalDirection operational metadata must be preserved and not staged.
ROOT_CAUSE: public CanManageAsync(context, operation, AssetTypeReadModel target/destination, requestedDirectionId) trusts supplied target.FunctionalDirectionId (and mutable fact DTO framing). Caller changed real D2 target facts to D1, obtaining ALLOW with actual direction-only D1 assignment. Current command/API path independently loaded fresh target and denied mutation.
PRODUCTION_CALL_SITES: AssetTypeCommandStore.CreateAsync and private MutateAsync only; API calls fixed command/eligibility ports. One old test invocation; no public interface wrapper. Replacement existing-target contract accepts IDs; facts evaluator/resolver private.
BEFORE_FIX_REPRODUCTION: PASS reproduced with real production Identity/Organization/Assets providers in PostgreSQL18.6, artifacts/asset-type-f1-before-fix.log (honest=false, forged=true, command=DENIED). Review-only probe source retained under ignored artifacts.
PLAN/OWNERSHIP: primary owns authorization/command call sites/architecture guard/docs/checkpoint/integration; narrow writer owns only AssetsPersistenceChecks/Program.cs and its new F1 handoff; independent read-only local remediation check. No schema/migration/Identity/provider/permissions/frontend/Audit mechanism changes.
NEW_PUBLIC_CONTRACT: CanManageExistingAsync(context, assetTypeId, operation, destinationParentAssetTypeId?, ct), CanCreateAsync(context,parentAssetTypeId?,requestedFunctionalDirectionId,ct), HasGlobalManagementAsync(context,ct) exact permission eligibility only for missing-target concealment. No target DTO or scope/ancestry evidence overload.
AUTHORITATIVE_FACTS: same scoped IAssetTypeReadStore / AssetsDbContext; target and destination resolved by ID, authoritative direction provider and complete parent-chain integrity checked. Internal facts never accepted through public arguments. Missing or inconsistent facts/provider/persistence failure denies.
LOCK_PROTOCOL: unchanged pg_advisory_xact_lock(1095980121,1); begin READ COMMITTED -> lock -> fresh persisted reads/ID-based composition -> current Identity facts -> business/version -> entity+obligation -> commit. No alternate connection/transaction for Assets facts.
CREATE_CONTRACT: root desired direction resolved as business intent, exact trusted scope/explicit GLOBAL; command still validates reference selectability. Child persisted parent establishes coverage; ACTIVE/homogeneity separate business checks. Existing missing target authorization false even GLOBAL; command independent global eligibility yields canonical404 else403.
COMPLETED: public boundary/call sites/architecture structural guard drafted; initial Assets infrastructure Release build PASS0warnings/errors; relevant module/capsule/security/backlog docs updated.
PENDING: focused real PostgreSQL public-contract/lifecycle tests, all14harnesses/HTTP/Audit/regressions, build/model/migration/frontend/format/docs/secret gates, read-only remediation review, explicit staged diff and exactly one separate local commit.
UNCOMMITTED: remediation source/docs/new F1 checkpoint/contract/handoff; preserved prior operational metadata separate.
NEXT_ACTION: integrate focused PostgreSQL helper, run full required local validation, inspect remediation diff independently, then exactly one fix commit on main and STOP for R2.
DO_NOT_REPEAT: no original commit amend, push, schema/migrations/seeds/provider redesign, original review staging or overwrite, prior checkpoint staging, unrelated work or destructive recovery.

## Final local validation — 2026-10-10

STATUS: LOCAL_VALIDATED_READY_FOR_ONE_REMEDIATION_COMMIT
CHECKPOINT_STATUS: SAFE
LAST_SAFE_COMMIT / EXPECTED_PARENT: c618c1af837326aada23ed7a64b762089223ca5e
COMPLETED: ID-based public existing-target/create contracts; private authoritative resolver and same-tuple policy; two production call sites migrated; independent exact GLOBAL eligibility for missing404; structural public signature guard; real Identity/Assets PostgreSQL regression and six retained lifecycle race orderings; task-owned docs/records.
ORIGINAL_EXPLOIT: REPRODUCED before fix; DENIED after fix via replacement public Application contract (actual D2 target/D1 assignment, false caller direction/parent/ancestry/root unavailable as inputs). Genuine matching D1 and real intersection/subtree grants ALLOW; public calls never mutate entities/obligations.
VERIFIED: all14 explicit backend harnesses PASS, including full Assets real PostgreSQL hierarchy/authorization/concurrency/migration/atomic Audit/delivery and real-host HTTP; Identity GLOBAL/correlated facts, FunctionalDirection/Organization, Sites/Location and canonical Audit regressions PASS. Separate connections/pg_locks prove both scoped-update/reparent orderings, competing cycle prevention and six lifecycle ordering outcomes. Missing target (even GLOBAL), stale scope root, missing direction/cross-direction hierarchy, Identity failure and disposed Assets storage fail closed. Scope-root escape/geography/GLOBAL read/unrelated permission isolation and positive same-tuple intersection PASS.
RELEASE_BUILD: PASS0warnings/0errors.
DOTNET_TEST: PASS (explicit console harnesses also run).
FRONTEND: lint/build/tests PASS,8files/71tests; production unchanged.
INFRASTRUCTURE: DevScripts/CiWorkflow/DatabaseMigrator/API bootstrap contract+runtime5checks PASS.
MIGRATION_SMOKE: PASS clean five-context migrator and idempotent repeat in OrganizationPersistence; Assets migration/repeat/guarded rollback PASS. No migration/schema/config/model changes in F1.
MODEL_DRIFT: NONE; independent Release EF pending-model check PASS.
FORMAT: scoped4C#files formatted and verify-no-changes PASS; diff check PASS.
SECRET_HYGIENE: PASS final12owned paths/signature scan and fixed test credential review; no real secret/token introduced.
DOCS_IMPACT: YES (public security/application contract).
DOCUMENTATION_SYNC: PASS; Assets module/capsule, security and local backlog status describe ID-only composition/transaction and pending R2. Database/HTTP/OpenAPI/permissions/Accepted ADR contents checked, unchanged.
LOCAL_REMEDIATION_REVIEW: PASS; agents/asset-type-f1-local-review.md; local OPEN_CRITICAL/HIGH/MEDIUM/LOW0/0/0/0. Follow-up immutable two-commit R2 not performed by F1; original review remains untouched/unstaged.
PRESERVATION: original four checkpoint diffs plus prior review-note hashes compare equal to task start; no unrelated runtime changes.
LOGS: ignored artifacts/asset-type-f1-*.log; focused helper also PASS before final primary validation.
BLOCKERS: NONE for authorized local remediation commit.
NEXT_ACTION: fetch/recheck exact main/origin, explicitly stage only F1-owned files, inspect cached diff/check/stat, create one fix(assets) commit with parentc618c1af, verify main ahead2, then STOP for independent R2.
DO_NOT_REPEAT: no broad test rerun without new relevant change; no schema/migration/Identity/frontend/provider/permission/Audit redesign; no original review or prior checkpoint staging; no original amend/push/second remediation commit/publication/R2 claim.
