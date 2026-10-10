# ASSET-TYPE-01F1 — SEC-01 PostgreSQL test workstream

STATUS: TEST_WRITER_COMPLETE
OWNER: tests/integration/Exploitation.AssetsPersistenceChecks/Program.cs only, plus this agent record.
BASELINE: main at c618c1af837326aada23ed7a64b762089223ca5e; origin/main at faa09a7b77d8d9bfb5f416a1d00ce6070bbd61f6 before edits. Existing task and prior operational notes were preserved.

COMPLETED:
- Updated the provider-failure regression to call the ID-based `CanManageExistingAsync` contract.
- Added public-method reflection guard: authorization entry points accept only request context, IDs, operation, and cancellation; no DTO, assignment fact, ancestry, or scope-evidence collection parameter.
- Added real Identity/Assets PostgreSQL SEC-01 regression: persisted D2 target is denied to a D1 assignment even with caller-created D1 direction, parent, ancestry, and root claims. The genuine D1 target is allowed, while an unauthorized command leaves target and Audit unchanged.
- Exercised root and child create intent, source/destination reparent, GLOBAL permission isolation, type-subtree positive and escape, crossed assignments, stale scope root, missing target, provider failure, and disposed Assets DbContext failure through the public service.
- Inserted isolated malformed rows only in the disposable PostgreSQL fixture, without changing production guards, to verify missing authoritative direction and inconsistent parent direction fail closed. Denial decisions leave row and Audit counts unchanged.
- Persisted six lifecycle race orderings from `artifacts/asset-type-01r-probe-extra.txt`: ancestor deactivate versus create, activate, and reparent, each in both winning orders. Every ordering observes a PostgreSQL advisory-lock waiter, first-wins/second-conflicts, and no ACTIVE child under INACTIVE parent.

VERIFIED: `dotnet run --project tests/integration/Exploitation.AssetsPersistenceChecks/Exploitation.AssetsPersistenceChecks.csproj --configuration Release` PASS against PostgreSQL 18.6 Testcontainers after the final test edit; `git diff --check` on owned test file PASS before final small edit. No test assertion was weakened. No staging, commit, push, branch, worktree, schema, or production edit by this workstream.

LIMITS: This is a focused harness result. Primary agent owns full validation, documentation sync, exact final diff, commit, and independent SEC-01 re-review. Malformed rows remain only until the disposable test container is removed.

NEXT_ACTION: Primary agent integrates this test diff, reruns required final gates, and records the remediation checkpoint. Do not repeat these focused tests unless source changes or a gate fails.
