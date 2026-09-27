# ADR-015 — Identity scope provider for geographic list filtering

- **Status:** Accepted
- **Date:** 2026-09-27
- **Refines:** ADR-013, specifically geographic list filtering and empty-scope
  response semantics; does not replace ADR-007 or ADR-013.

## Context

ADR-013 assigns effective grant evaluation to Identity and authoritative
geographic filtering to Sites. The B1 `IEffectiveGrantEvaluator` authorizes one
trusted target and cannot efficiently filter a set without one authorization
call per row. Its accepted list rule therefore requires an Identity-owned,
permission-specific scope result consumed by Sites queries.

ADR-013 also says a missing `sites.read` grant returns 403. The AUTH-SCOPE-01
B2-A owner contract defines zero effective scopes as no authorized targets and
requires list operations to return an empty result. This ADR resolves that
response-semantic conflict for the future scope-filtered Zone/Region list
path. It does not enable the currently deny-by-default production routes.

## Decision

Keep two separate Identity Application primitives:

- `IEffectiveGrantEvaluator` remains the direct ALLOW/DENY check for one
  trusted target.
- `IEffectiveScopeProvider` returns an immutable, bounded set of exact
  permission-specific `(kind, scopeId)` descriptors for one eligible local
  user and validated working context.

The provider uses the same Identity-owned eligibility rules as B1. It returns
only `TerritorialZone` and `Region` scopes in this phase and does not expand
geography. Sites applies the set using its own persisted hierarchy: Zone
scopes cover child Regions in the Region query; Region scopes never cover
parent Zones. Unsupported or unrepresentable assignment scopes fail closed.

For the future filtered Zone/Region list operations, an empty effective-scope
set returns `200 []`. It never means unrestricted access. Direct target
operations continue to call `IEffectiveGrantEvaluator` and re-evaluate the
target. Sites and Identity never query one another's database schemas.

Identity, context, assignment, role-permission, permission, and scope
eligibility semantics are shared with B1. No cache, schema change, migration,
Site scope, contractor-positive grant, or route integration is introduced by
this decision.

## Consequences

- List filtering uses a bounded Identity query and Sites-owned SQL predicates;
  per-row authorization calls are prohibited.
- A list result cannot be used as authorization evidence for a later direct
  mutation or GET.
- The prior ADR-013 `403` statement is refined only for the future list case
  where effective scopes are empty. Existing production behavior remains
  deny-by-default until later implementation and integration phases.
- The detailed phase contract is
  `.agent/tasks/AUTH-SCOPE-01/phase-b2a-effective-scope-contract.md`.
