# TASK-02.04.02 — Location domain, persistence and audit checkpoint

STATUS: IMPLEMENTED; awaiting integrated verification and independent review.
BASELINE: `6b986f95fb431a31f7543696278f0910ac666be6` on `main` (owner guard).
LAST_SAFE_COMMIT: `6b986f95fb431a31f7543696278f0910ac666be6`.

## Completed task-owned work

- Added Sites-owned Location domain model, Active/Inactive lifecycle, immutable Site/code identity, canonical code/name/description and row version.
- Added application command port and stable exceptions.
- Added `sites.locations` EF mapping and additive `20261002095936_AddLocations` migration: same-Site composite parent FK, restrictive references, unique `(site_id, code)`, child-read index, canonical checks, identity/no-delete trigger, audit obligation `location_id` binding and payload immutability. Down refuses rollback when Location business rows or audit obligations exist.
- Added transaction-scoped deterministic Site advisory lock to every Location mutation. Target is re-read after lock; recursive CTEs use `UNION` and have no fixed depth. New/changed LocationType uses `FOR SHARE` to serialize with type status update. Business state and durable audit obligation save atomically.
- Registered five canonical Audit actions, Location entity, full allowlisted snapshots, Move reason, and before/after rules in Audit append.
- Added domain, Sites PostgreSQL persistence, Audit PostgreSQL persistence, and Audit delivery tests.

## Verified checks

- `SitesPersistenceChecks` PASS on PostgreSQL Testcontainers: migration, 33-level recursion, deterministic advisory lock contention for opposing moves, create/deactivate and duplicate-code races, audit atomic rollback, FK/immutability/no-delete checks.
- `AuditPersistenceChecks` PASS on PostgreSQL Testcontainers: all five actions and negative payload/action/reason cases.
- `AuditDeliveryChecks` PASS on PostgreSQL Testcontainers: six Location obligations delivered and snapshots/actor/context/Move reason preserved.
- `SitesDomainChecks` PASS.
- Focused Sites Infrastructure Release build PASS before final `FOR SHARE` line; primary owns final integrated Release build and model-drift check.
- `git diff --check` PASS (line-ending advisory only).

## Decisions and ownership

- Owner decisions OD-LOCATION-01..08 are ACCEPTED in the task request. Optional description is trimmed max500, matching reference metadata convention.
- Primary owns documentation, registration integration review, full build/regressions, final task state, commit and user report. API worker owns handlers/read/API. No branch, worktree, commit or push was created here.
- No Location business history stream or LocationMoved integration event emission is introduced in this phase; durable technical Audit is separate.

## Uncommitted changes

Task-owned paths: `Sites.Domain/Locations`, `Sites.Application/Locations/ILocationCommandStore.cs`, `LocationCommandErrors.cs`, Sites Infrastructure `LocationCommandStore.cs`, `LocationAuditSnapshot.cs`, `LocationConfiguration.cs`, `SitesDbContext.cs`, `AuditObligation.cs`, `AuditObligationConfiguration.cs`, generated AddLocations migration/designer/snapshot; Audit Contracts action/entity/payload validator; Audit Infrastructure `AuditEvent.cs`; SitesDomainChecks, SitesPersistenceChecks, AuditPersistenceChecks, AuditDeliveryChecks. Shared worktree also contains independent primary/API/docs task paths. Do not stage unrelated paths blindly.

BLOCKERS: None known.
NEXT_ACTION: Primary runs final integrated Release build, EF model-drift and affected PostgreSQL harnesses after the last `FOR SHARE` change, then independent review and deliberate local commit if all gates pass.
DO_NOT_REPEAT: Do not regenerate migration or rerun completed contract research; do not create branch/worktree or push; do not introduce Location-specific business history/outbox without approved contract.
