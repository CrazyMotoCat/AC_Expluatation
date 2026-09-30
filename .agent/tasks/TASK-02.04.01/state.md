# TASK-02.04.01 checkpoint — Location types contract check

TASK: TASK-02.04.01
PHASE: LOCATION-TYPE-01 — foundation implementation
STATUS: LOCAL_IMPLEMENTATION_READY
CHECKPOINT_STATUS: SAFE
LAST_SAFE_COMMIT: f50c646d81d0a088c94cc9bd354536448f4ff4f9
BASELINE_SHA: f50c646d81d0a088c94cc9bd354536448f4ff4f9
BRANCH: main
ORIGIN_MAIN_SHA: f50c646d81d0a088c94cc9bd354536448f4ff4f9 (after fetch)

## COMPLETED
- Reconciled clean `main`, HEAD, `origin/main` and the single worktree with the requested baseline before edits.
- Read the exact backlog task, parent Locations feature, Sites module/context, database, reference and permission registries, relevant API/security contract, ADR search, current SiteType/SiteCriticality implementation and TASK-02.03.04 checkpoint.
- Classified LocationType as a Sites-owned configurable classification; the actual Site-owned Location tree belongs to TASK-02.04.02. No Location, Asset or implementation files were changed.
- Found material gaps in seed, persistence/lifecycle, management and catalog authorization contracts. Stopped before implementation.

## VERIFIED
- `git fetch` succeeded; `main == origin/main == f50c646d81d0a088c94cc9bd354536448f4ff4f9` before this checkpoint.
- `git status --short --branch` was clean before this checkpoint; one worktree on `main`.
- No LocationType implementation or dedicated accepted ADR found in repository search.
- Build/tests/model drift were not run because no implementation or migration was started.

## UNCOMMITTED
- Task-owned LocationType implementation, migration, tests, documentation and this checkpoint are pending one local commit. No push.

## DECISIONS
- Backlog acceptance criteria: `configurable`; BUILDING/FLOOR/ROOM/RACK/AREA supported. No further task-specific rules are stated.
- Sites owns `LocationType` and planned `sites.location_types`; no type hierarchy is specified. Location instance hierarchy belongs to TASK-02.04.02.
- `docs/database.md` lists only `id`, `code`, `name` for LocationType; the reference registry describes configurable values with deactivation in general. Do not add status, timestamps, description or row version until the owner resolves the schema/lifecycle contract.
- Existing SITE-REF-AUTH-01 grants catalog read for SiteType and SiteCriticalityClass only. Do not extend its fixed permission set or expose a LocationType GET by analogy without an explicit decision.

## CONTRACT COMPLETENESS
| Topic | Classification | Repository result |
|---|---|---|
| Identity | DEFINED | Core business IDs use UUIDv7; LocationType has `id`. |
| Code/name | DEFINED in part | Both fields exist; exact constraints are unresolved. |
| Status/lifecycle | OWNER_DECISION_REQUIRED | General reference deactivation conflicts with the three-column LocationType sketch. |
| Type hierarchy | NOT_APPLICABLE | No parent type specified; Location instance tree is TASK-02.04.02. |
| Uniqueness/code normalization | OWNER_DECISION_REQUIRED | No LocationType-specific rule. |
| Mutability | OWNER_DECISION_REQUIRED | Configurable, but mutation boundary and immutable fields are unspecified. |
| Hard delete | DEFINED | Registry forbids deleting referenced values/history. |
| Ordering | OWNER_DECISION_REQUIRED | No LocationType read ordering contract. |
| Seeds/configuration | OWNER_DECISION_REQUIRED | Five required codes versus PLATFORM example; exact seeds/names unresolved. |
| Read authorization | OWNER_DECISION_REQUIRED | Existing fixed catalog authorization names only two other references. |
| Management permission | OWNER_DECISION_REQUIRED | `sites.manage_locations` describes the Location tree, not reference management. |
| Audit/concurrency | OWNER_DECISION_REQUIRED | Depend on whether runtime mutations are in scope. |
| Future Location reference | DEFINED in part | `sites.locations.location_type_id` planned; inactive assignment rule unresolved. |

## HISTORICAL BLOCKERS (RESOLVED BY OD-01..04)
- OD-LOCATION-TYPE-01: Decide whether TASK-02.04.01 publishes seed/persistence plus read-only catalog, runtime management API, or persistence only. This determines API, mutation authorization, audit and concurrency scope.
- OD-LOCATION-TYPE-02: Freeze LocationType schema/lifecycle and code contract: whether ACTIVE/INACTIVE, timestamps, description and row version are persisted; global code uniqueness, normalization and mutability. `database.md` has only three columns while configurable-reference deactivation implies more state.
- OD-LOCATION-TYPE-03: Freeze initial values. Backlog/registry require support for BUILDING/FLOOR/ROOM/RACK/AREA, while database/context also list PLATFORM as an example. Decide required seed set, display names and whether PLATFORM is included now.
- OD-LOCATION-TYPE-04: If a read API is in scope, define its authorization contract. SITE-REF-AUTH-01 is explicitly limited to two catalogs; decide whether to extend that fixed composition to LocationType or use another explicit permission/context rule. Management permission must also be defined if runtime mutation is in scope.

## FILES_CHANGED
- Sites Domain/Application/Infrastructure LocationType files and EF migration/snapshot.
- API LocationType GET/auth/OpenAPI wiring.
- Sites domain, persistence/API and Organization migrator-count harnesses.
- `docs/backlog.md`, `docs/modules/sites.md`, `docs/context/sites.context.md`, `docs/database.md`, `docs/reference-data-registry.md`, `docs/api-guidelines.md`, `docs/security.md`, `docs/permissions-registry.md`.
- `.agent/tasks/TASK-02.04.01/state.md`.

## RESUME AFTER OWNER DECISIONS (2026-09-30)
- OD-LOCATION-TYPE-01 ACCEPTED: Sites persistence, five fixed seeds, production read-only GET and authorization; no runtime mutations or Location/Assets work.
- OD-LOCATION-TYPE-02 ACCEPTED: global Sites-owned `id`, `code`, `name`, nullable `description`, `ACTIVE`/`INACTIVE` status and `row_version`; UUIDv7; code trim/uppercase, immutable, globally unique, max 50, `^[A-Z][A-Z0-9_]{0,49}$`; name trim/max 200; description trim/max 500; hard delete forbidden; no generic timestamps or type hierarchy.
- OD-LOCATION-TYPE-03 ACCEPTED: exactly BUILDING/Здание, FLOOR/Этаж, ROOM/Помещение, RACK/Стойка and AREA/Зона, fixed UUIDv7 IDs, all ACTIVE; PLATFORM excluded.
- OD-LOCATION-TYPE-04 ACCEPTED: global catalog, fixed read permission set `sites.read` or `sites.manage_locations` with supported non-empty exact Zone/Region/Site scope, ACTIVE INTERNAL user and valid owned INTERNAL context. No caller-supplied authority; contractor and provider failure deny.
- Previous OWNER_DECISION_REQUIRED blocker RESOLVED by explicit owner decisions. Earlier BLOCKERS/CONTRACT COMPLETENESS sections above are historical contract-check findings, not current blockers.
- Resume guard: `git fetch` succeeded; HEAD and `origin/main` still equal LAST_SAFE_COMMIT; only this expected checkpoint is dirty. Docker Engine was unavailable at pre-implementation probe; retry before PostgreSQL verification.

## IMPLEMENTATION CHECKPOINT
- Added Sites LocationType domain, EF configuration with fixed seeds, a single additive Sites migration, read application/store, dedicated fixed-permission catalog authorization, and GET endpoint/OpenAPI wiring.
- Added focused domain, PostgreSQL persistence and real Identity/PostgreSQL/HTTP catalog matrix checks. No Location entity/tree, Assets code or mutation route was added.
- Release solution build: PASS, 0 warnings/errors. EF `has-pending-model-changes`: no drift. Docker Desktop was started; SitesPersistenceChecks: PASS and SitesApiChecks: PASS against PostgreSQL Testcontainers.
- Current task-owned work is uncommitted. Documentation sync, remaining named harnesses, source security review and final diff checks remain.

## FINAL LOCAL VERIFICATION BEFORE COMMIT
- Release solution build: PASS, 0 warnings/errors. `dotnet test`: exit 0 with no discovered cases; executable harnesses were run explicitly.
- SitesDomainChecks, SitesPersistenceChecks and SitesApiChecks: PASS, including PostgreSQL seeds/constraints, inactive read, six positive catalog grants, denied contexts/assignments/contractor, caller query injection, permission isolation and OpenAPI.
- IdentityDomainChecks, AuthenticationChecks, IdentityPersistenceChecks, AuditPersistenceChecks, AuditDeliveryChecks, OrganizationPersistenceChecks and OrganizationApiChecks: PASS.
- ArchitectureChecks, DevScripts, CiWorkflow, DatabaseMigrator configuration, API bootstrap contract and runtime smoke scripts: PASS. OrganizationPersistenceChecks exercised DatabaseMigrator application/idempotency with six Sites migrations.
- EF `has-pending-model-changes`: no drift. Changed-file `dotnet format whitespace --verify-no-changes`: PASS. `git diff --check`: PASS. Changed-file secret scan: PASS.
- Source security review: no caller-selected permission/scope, Identity/Assets DB access, mutation route, type hierarchy or Location instance. Open CRITICAL/HIGH/MEDIUM/LOW: 0/0/0/0. Catalog read does not imply Site or Location mutation rights.
- DOCS_IMPACT: YES. DOCUMENTATION_SYNC: PASS for Sites module/context, backlog, database, reference/permission registries, API and security docs. No new ADR or architecture/deployment/testing-standard change.
- Hosted CI for the future local commit: UNVERIFIED; no push authorized.

NEXT_ACTION: Independently review the single local TASK-02.04.01 commit before any push.
DO_NOT_REPEAT: Do not reopen accepted OD-01..04, implement TASK-02.04.02 Location instances/tree, touch Assets, create a branch/worktree, add runtime LocationType mutation routes, or push.
