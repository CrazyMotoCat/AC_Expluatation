# AUTH-SCOPE-01 — B2-R0 trust-boundary remediation contract

STATUS: CONTRACT_FROZEN; IMPLEMENTATION_PENDING
SOURCE_OF_TRUTH: owner B2-R0 decision R0-OD-01…R0-OD-20 and ADR-016
BASELINE_MAIN: `a3167e85115875c48737f7af10007366e2beaa69`
SOURCE_B2_COMMIT: `2f5ca8b8b4f5ff2827eaef0f807bfa7812863a88`

## Boundary

The independent B2 review found F1 HIGH and F2 MEDIUM at public application contracts. This contract resolves their architecture only. Both findings remain open until code and structural tests are independently verified. B2 must not be merged or pushed. C1 and the Site checkpoint are untouched.

## Frozen ownership and public flow

- Identity derives exact effective scopes from eligible local user, validated working context, canonical permission, valid assignment, active role/permission membership and Identity-owned scope. `IEffectiveScopeProvider` is the shared primitive. Identity has no Sites hierarchy or Sites database access.
- Sites owns target existence, Region → Zone parent resolution, coverage against effective scopes and SQL filtering. Sites Application calls the Identity provider internally; Sites has no Identity database access.
- Public direct Sites methods accept user/context, canonical permission and only a Zone or Region business ID. Region parent is read from Sites persistence. No public hierarchical Identity request may accept a caller-claimed Region parent.
- Zone direct coverage is exact `TerritorialZone/zoneId`. Region direct coverage is exact `Region/regionId` or `TerritorialZone/persistedParentZoneId`; Region never covers the parent Zone.
- Create Region treats `parentZoneId` as business input, loads that Zone in Sites, requests `sites.create` scopes and requires exact Zone coverage. Unknown parent denies; state validation is separate.
- Public list methods accept user/context and ordinary filters/pagination only. Sites internally requests `sites.read` scopes, then passes normalized IDs to its internal SQL store. The raw store is not a public service; no permission string supplied to it can attest to scope origin.
- B1 evaluator may remain for exact Zone/Region checks, with B1 eligibility unchanged. Sites does not use it for Zone → Region coverage from a caller-built descriptor. `EffectiveAuthorizationScope` remains an ordinary data DTO, not a capability token.
- Empty scopes, invalid context/user, contractor, unsupported scope, unknown target and dependency failure fail closed. The list returns empty for zero effective scopes, with no all-rows fallback or N+1 checks.

## Required B2-R1 sequence

1. B2-R1A: remove public caller-supplied Region parent trust from Identity evaluator/direct contract; preserve exact-scope B1 semantics.
2. B2-R1B: add Sites-owned direct authorization composition with persisted Region parent and `IEffectiveScopeProvider`.
3. B2-R1C: put list SQL behind Sites authorized list service and remove the public scope-bearing read request/store entry point.
4. B2-R1D: structural security tests, PostgreSQL negative cases and independent review. Integrate B2 only after zero open HIGH/MEDIUM findings.

Prefer one bounded implementation session if the diff remains small. Do not start B2-R1 automatically. No runtime, schema, migration or API route edit is authorized in B2-R0.
