# ASSET-TYPE-01 — Assets Domain slice

STATUS: IMPLEMENTED_LOCAL, INTEGRATION_PENDING
OWNER: domain agent
LAST_SAFE_COMMIT: `faa09a7b77d8d9bfb5f416a1d00ce6070bbd61f6`

## Completed

- Added Assets-owned `AssetType` and `AssetTypeStatus` under `src/backend/Modules/Assets/Exploitation.Modules.Assets.Domain/AssetTypes/`.
- Implemented the frozen fields and signatures. Runtime identities and references require UUIDv7; code, name and reparent reason follow accepted normalization and length rules. Code and direction have no mutation API. All flag combinations are valid; create starts ACTIVE at row version 1.
- Existing-row mutations advance row version and UTC timestamp at PostgreSQL microsecond precision. Equivalent update, unchanged parent and repeated lifecycle transitions throw without changing state.
- Added `tests/unit/Exploitation.AssetsDomainChecks/` with a narrow executable domain harness. Did not edit the solution or production project references.

## Verified

- `dotnet run --project tests/unit/Exploitation.AssetsDomainChecks/Exploitation.AssetsDomainChecks.csproj -c Release`: PASS.
- `git diff --check`: PASS (only pre-existing line-ending warnings on unrelated operational notes).

## Integration boundary

The domain entity can reject self-parent. Authoritative checks for parent existence/ACTIVE, same FunctionalDirection, descendant cycle, ACTIVE descendants at deactivation, and parent ACTIVE at activation must use fresh PostgreSQL facts after the taxonomy lock. `NormalizeReason` is available for the reparent use case and audit facts. No audit is emitted by the domain entity.

UNCOMMITTED_TASK_OWNED_PATHS:

- `src/backend/Modules/Assets/Exploitation.Modules.Assets.Domain/AssetTypes/AssetType.cs`
- `src/backend/Modules/Assets/Exploitation.Modules.Assets.Domain/AssetTypes/AssetTypeStatus.cs`
- `tests/unit/Exploitation.AssetsDomainChecks/Exploitation.AssetsDomainChecks.csproj`
- `tests/unit/Exploitation.AssetsDomainChecks/Program.cs`
- `.agent/tasks/TASK-03.01.01/agents/domain.md`

NEXT_ACTION: Primary agent integrates this entity with Assets persistence/application and runs the broader ASSET-TYPE-01 verification gates.
DO_NOT_REPEAT: Do not add a second AssetType domain model, widen this slice to Identity/Organization/API, edit the solution from this slice, or commit/push it separately.
