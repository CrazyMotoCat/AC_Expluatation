# ASSET-TYPE-01 — PostgreSQL test helper checkpoint

STATUS: IMPLEMENTED_LOCAL; PRIMARY_INTEGRATION_PENDING
OWNER: persistence test helper
LAST_SAFE_COMMIT: `faa09a7b77d8d9bfb5f416a1d00ce6070bbd61f6`

## Owned changes

- New `tests/integration/Exploitation.AssetsPersistenceChecks/Exploitation.AssetsPersistenceChecks.csproj` and `Program.cs` only.
- No production, solution, workflow, or product documentation files edited by this helper.

## Real-provider and real-PostgreSQL coverage

- Testcontainers PostgreSQL 18.6; DI composition of published Identity, Organization, Assets and Audit modules. Migrates each relevant context, replays Assets migration idempotently, and checks `HasPendingModelChanges()`.
- Verifies frozen D1/D2 FunctionalDirection seed IDs through Organization's published provider. Creates and deactivates a separate test direction through Organization's published command store; missing and inactive directions reject new AssetType references, while existing type and inactive direction remain resolvable with no lifecycle cascade.
- Exercises global management, global read, geographic read, no permission, zone/region/site management denial, site+direction and region+type geographic denial, exact direction coverage, type subtree coverage, same-tuple direction/type intersection, no cross-assignment type subtree merge on reparent, scope-root escape denial, stale direction/type IDs, wrong working context, expired/future assignments, Contractor, and provider failure. Denied writes leave no successful Assets audit obligation.
- Exercises real command store hierarchy at three levels, arbitrary-depth subtree read, active non-leaf reference selectability, inactive historical lookup, lifecycle parent/descendant constraints, classification flags, global duplicate code race, stale row version, concurrent opposite reparents, and Audit insert failure rollback.
- Uses two independent DI scopes and an `IEffectiveScopeProvider` decorator that pauses *inside post-lock authorization*. A `pg_locks` waiter check proves a second mutation is waiting on the transaction-scoped taxonomy lock. Both orderings are verified: scoped update commits first and the stale waiting reparent conflicts; reparent commits first and the waiting scoped update denies after fresh ancestry evaluation.
- Executes the actual `AssetsAuditObligationDispatcher` with the canonical Audit writer and Audit database. Checks sanitized failed-append metadata, retry/restart, stable EventId, one canonical event per processed obligation, idempotent duplicate append from a separate scope/connection, claim-token fencing, and recovery after append-before-ack crash.
- Verifies PostgreSQL guards against raw hard delete, immutable code/direction changes, skipped row version, self-parent update; migration `Down` refuses nonempty type/Audit data and leaves schema/history intact.

## Verification

- `dotnet run --project tests/integration/Exploitation.AssetsPersistenceChecks/Exploitation.AssetsPersistenceChecks.csproj -c Release`: PASS (`ASSET_TYPE_POSTGRESQL_CHECKS: PASS`, Docker Desktop/PostgreSQL Testcontainers).
- `git diff --check`: PASS; output contains only unrelated line-ending warnings.
- Owned new test files have no trailing whitespace.

LIMITATION: The Identity domain exposes `UserType.Internal`, `Contractor`, and `System`; there is no separate `UserType.External`. Contractor is the tested non-internal principal. HTTP caller-payload injection is covered by the separate Assets API harness owned by primary.

NEXT_ACTION: Primary agent incorporates the test-only harness in the ASSET-TYPE-01 validation and deliberately stages these paths with other task-owned changes for the one authorized local commit.
DO_NOT_REPEAT: Do not recreate this harness under another project; do not change production from this helper; do not claim hosted CI or publication from this local result.
