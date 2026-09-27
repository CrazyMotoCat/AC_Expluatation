# AUTH-SCOPE-01 — Phase B2-A: effective scope contract freeze

STATUS: CONTRACT_FROZEN
PHASE: B2-A
SOURCE_OF_TRUTH: Owner contract supplied for this phase, ADR-007, ADR-013,
refining ADR-015, and the current Identity/Sites module contracts.
BASELINE_SHA: `a3167e85115875c48737f7af10007366e2beaa69`

## Purpose and boundary

Freeze the Identity-owned list-scope contract needed for efficient
backend-filtered Territorial Zone and Region lists. This phase changes
documentation only. B2 provider/query implementation and C1 route integration
remain not started. The production permission grant source remains
deny-by-default.

## Two authorization primitives

### Direct target authorization

Keep the published B1 application contract:

```text
IEffectiveGrantEvaluator.HasGrantAsync(EffectiveGrantRequest) -> bool
```

It answers ALLOW/DENY for one trusted target and canonical permission. Future
direct GETs, updates, lifecycle commands, and parent-coverage checks continue
to use this evaluator. Sites constructs target descriptors only from
Sites-owned persisted facts. A scope list previously returned for a list query
does not authorize a later direct operation.

### List authorization

Add the Identity Application contract `IEffectiveScopeProvider`. Its request
contains only:

```text
localUserId
workingContextId
canonicalPermission
```

The provider may reuse validated request/authentication abstractions where
appropriate. It accepts no business target, parent Zone, browser-supplied
hierarchy fact, role name, UserType grant, or JWT claim grant.

The result is an immutable, bounded collection of distinct descriptors:

```text
EffectiveAuthorizationScope { kind, scopeId }
```

Initially supported kinds are `TerritorialZone` and `Region`; `scopeId` is a
valid non-empty identifier. Do not add `Site`, `Global`, `All`, or wildcard
scopes. No implicit global scope exists in this contract. The result contains
only the exact scope descriptors; it exposes no role, assignment, or other
Identity persistence objects. It is bounded to eligible assignments for the
requested local user, working context, and permission, and never enumerates
business targets. If an implementation applies a result cap, it must not
return a truncated set as complete; overflow fails closed.

An assignment may produce a descriptor only when the complete effective scope
can be represented without dropping a constraint. For example, a
Territorial-Zone-only assignment produces `TerritorialZone / ZoneA`; a
Region-only assignment produces `Region / RegionR`. Identity does not expand a
Zone into child Region IDs or add a Region's parent Zone. A composite or
unsupported assignment scope must not be flattened into a broader descriptor.
It may be omitted from the list-scope result when the `(kind, scopeId)` shape
cannot preserve its full restriction; direct target evaluation remains
available through B1.

## Eligibility and permission semantics

The provider uses the same authoritative Identity eligibility rules as B1; it
must share Identity-owned predicates/query logic rather than create a second
authorization policy. Positive output requires all of:

- ACTIVE eligible local user with `UserType=INTERNAL`;
- owned, ACTIVE, currently valid INTERNAL working context;
- ACTIVE assignment for that user and exact context, currently valid on the
  existing `[valid_from, valid_to)` interval;
- ACTIVE role and persisted membership in `role_permissions` for the exact
  canonical permission;
- supported and valid scope kind and identifier whose complete restriction is
  representable by the output descriptor.

The permission is mandatory and scopes are permission-specific. Scopes for
`sites.read` cannot be reused for `sites.change`, `sites.create`, or
`sites.change_criticality`; no permission wildcard inference is allowed.

Role name, UserType by itself, JWT claims, and working-context existence or
selection alone never create scopes. Contractor/external users and unsupported
contexts produce no scopes. Invalid, expired, revoked, wrong-permission,
unsupported, or malformed assignments do not widen access. No eligible scope
produces an empty collection. Infrastructure errors follow existing Identity
failure handling and must never be translated to all scopes.

Output is logically distinct by `(kind, scopeId)`. Prefer deterministic order
by kind and then scopeId where consistent with repository conventions; order
has no authorization meaning.

## Sites query ownership and semantics

Sites Application may call the Identity Application contract. Sites owns the
authoritative hierarchy and applies the returned scopes in PostgreSQL query
predicates:

- Territorial Zone list: include a row only when its ID is in effective
  `TerritorialZone` scopes. A Region scope never grants its parent Zone.
- Region list: include a row when its ID is in effective `Region` scopes, OR
  its authoritative `territorial_zone_id` is in effective
  `TerritorialZone` scopes. Coverage flows down Zone → Region only.
- An optional Zone filter on the Region list may narrow this result and never
  broaden it.
- An empty scope collection means no authorized targets and produces an empty
  list (`200 []` for these list operations); it never means all rows or a
  fallback grant.

Expected query shape is one bounded Identity authorization query followed by
one or a small bounded number of Sites queries. Loading every row and calling
`HasGrantAsync` per row is forbidden. There are no cross-module database
joins or direct Identity/Sites schema reads. Infrastructure failure must not
be converted to an unfiltered query.

## Security invariants

```text
EMPTY_SCOPE_IS_ALL: FALSE
REGION_SCOPE_COVERS_PARENT_ZONE: FALSE
ZONE_SCOPE_COVERS_CHILD_REGION: TRUE, through Sites-owned SQL hierarchy
ROLE_NAME_GRANT: NONE
USERTYPE_GRANT: NONE
JWT_CLAIM_GRANT: NONE
CONTEXT_ALONE_GRANT: NONE
CONTRACTOR_POSITIVE: NONE
CROSS_MODULE_DB_QUERY: NONE
N_PLUS_ONE_AUTHORIZATION: FORBIDDEN
SITE_TARGET: NOT_IMPLEMENTED
```

## Data, cache, and later phases

```text
SCHEMA_CHANGED: NO
MIGRATION_REQUIRED: NO
CACHE_REQUIRED: NO
```

PostgreSQL Identity data remains the source of truth. Do not add Redis/cache
or shadow scope tables. Do not add Site scope behavior in B2-A/B2-B; a later
Site extension may add `Site` after the Site aggregate is published while
preserving Identity scope ownership and Sites hierarchy ownership.

Recommended follow-up, not started automatically:

1. B2-B1 — implement the Identity effective-scope provider, reuse B1
   eligibility semantics, and add focused PostgreSQL/security coverage.
2. B2-B2 — add Sites trusted Zone/Region query filtering and PostgreSQL checks.
3. B2-B3 — composition checks, architecture/security review, and one local
   standalone B2 commit.

C1 and later phases remain not started.
