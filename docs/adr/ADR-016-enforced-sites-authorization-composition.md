# ADR-016 — Enforced authorization composition at Sites boundaries

- **Status:** Accepted
- **Date:** 2026-09-27
- **Refines:** ADR-013 direct target handoff and ADR-015 geographic list composition; ADR-007 eligibility and the ADR-015 empty-list rule remain in force.
- **Task:** AUTH-SCOPE-01 B2-R0 (contract freeze; implementation pending)

## Context

Independent review of the unpublished B2 commit found two application-contract trust-boundary defects. F1 (HIGH): a public Identity target descriptor lets any application caller provide a Region ID with a claimed parent Territorial Zone ID and obtain a hierarchical grant decision without Sites verification. F2 (MEDIUM): a public Sites scoped read-store contract accepts caller-constructed effective scopes plus a permission string; the store cannot prove those scopes came from `IEffectiveScopeProvider` for that permission. The intended composition works when called as designed, but public contracts do not enforce it. Neither finding is cleared by this ADR; code remediation and independent review are required before B2 integration.

## Decision

**Callers provide business intent and target IDs, never authorization evidence.** Identity derives effective grants; Sites decides coverage of Sites business targets using its authoritative data. Application boundaries must enforce this composition rather than depend on a comment telling callers to use a particular sequence.

1. Identity owns local-user eligibility, working-context validity, canonical permission membership, assignment validity and Identity-owned scope assignments. `IEffectiveScopeProvider` is the reusable Identity Application primitive returning exact, permission-specific effective scopes. It does not read Sites hierarchy or expand a Zone into Regions. Its existing fail-closed B1/B2 eligibility semantics remain unchanged.
2. Sites owns Zone/Region existence and authoritative Region → Zone hierarchy, target coverage, and server-side PostgreSQL filtering. Sites Application obtains Identity scopes internally for the requested operation and evaluates coverage using Sites-owned facts. It does not reimplement Identity assignment eligibility.
3. The public Sites direct-target application service accepts an authenticated local user, validated working context, canonical permission and a business target ID. Use dedicated Zone and Region operations in line with repository conventions; callers cannot supply a Region parent, effective scopes, or a pre-authorized target descriptor. For a Region, Sites loads its persisted parent Zone before deciding coverage. Lookup failure cannot authorize.
4. A Zone target `Z` is covered only by an effective `TerritorialZone/Z` scope. A Region target `R` with persisted parent `Z` is covered by `Region/R` or `TerritorialZone/Z`. A Region scope never covers its parent Zone. An unsupported scope cannot widen coverage. Missing target, invalid user/context, contractor, no scopes, provider failure or hierarchy lookup failure cannot become ALLOW. Target absence follows canonical not-found handling without exposing an unauthorized target.
5. Region creation accepts `parentZoneId` as business input. Sites loads the Zone by that ID, checks its business eligibility separately, obtains scopes for canonical `sites.create`, and requires exact `TerritorialZone/parentZoneId` coverage. An unknown Zone or a Region-only scope cannot authorize creation. Root Zone creation remains closed under ADR-013.
6. Public Sites list operations accept ordinary filters/pagination and authenticated user/context, not `EffectiveAuthorizationScope` collections. The Sites application service requests scopes from `IEffectiveScopeProvider` for fixed `sites.read`, then calls an internal Sites query component. For Zone rows the SQL predicate is `zone.id IN effectiveZoneIds`; for Region rows it is `region.id IN effectiveRegionIds OR region.territorial_zone_id IN effectiveZoneIds`. Optional business filters only narrow results. Empty scopes yield an empty result, never an unfiltered query. Filtering remains server-side without per-row authorization calls.
7. The raw scoped geography store is an internal persistence/query detail, not a public application authorization entry point. It may receive normalized authorized scope IDs only from the Sites composition service. A caller-supplied permission string is not proof that scopes were derived for that permission; the raw store must not use it as such. Internal access modifiers are useful defense in depth, while the public composition boundary is the security requirement. `EffectiveAuthorizationScope` DTOs are data, not unforgeable capability tokens; no secret constructor, signature or authorization cryptography is introduced.
8. The published B1 `IEffectiveGrantEvaluator` may remain an Identity exact-scope primitive: exact Zone scope for exact Zone target and exact Region scope for exact Region target. It must no longer provide hierarchical Zone → Region authorization based on a caller-constructed `(regionId, claimedParentZoneId)` pair. Sites-owned authorization performs hierarchical coverage through `IEffectiveScopeProvider` and persisted Sites facts. A repository-compatible removal of the evaluator from Sites flows is also valid. The old caller-supplied-parent positive test is not a canonical hierarchy proof after remediation.

## Boundary and future flow

```text
list: HTTP user/context + filters → Sites authorized list service
    → Identity effective scopes for sites.read → internal Sites scoped SQL
direct read/change: HTTP target ID → Sites authorization service
    → Sites authoritative target lookup → Identity effective scopes for
      sites.read/sites.change → Sites coverage → operation
create Region: HTTP parent Zone ID → Sites Zone lookup
    → Identity effective scopes for sites.create → exact Zone coverage → create
```

Controllers never manufacture authorization evidence. Sites Application depends only on Identity Application contracts; Sites persistence accesses only Sites data. Identity neither depends on `SitesDbContext` nor reads `sites.*`; Sites neither depends on `IdentityDbContext` nor reads `identity.*`.

## Required remediation verification

- Structural architecture/reflection/source checks prove no public Sites list authorization contract accepts caller-supplied effective-scope collections and no raw scoped store is a public application service entry point.
- Structural checks prove no public Identity hierarchical grant request accepts a caller-provided Region parent Zone.
- Tests prove Sites direct Region authorization loads the parent from Sites persistence and that Sites direct/list services obtain scopes through `IEffectiveScopeProvider` for the exact permission.
- Negative cases cover forged IDs, wrong permission/context, empty/unsupported scopes, contractor, missing target and provider/hierarchy failure. PostgreSQL checks retain the downward Zone → Region and exact Region SQL semantics.

## Consequences and phase boundary

ADR-013 remains authoritative for target-aware eligibility and create-parent rules; its caller-supplied trusted parent projection is superseded by Sites-owned coverage. ADR-015 remains authoritative for exact Identity scope derivation, list SQL coverage and `200 []` for empty list scopes; its direct-use evaluator expectation is refined so Sites evaluates hierarchy. The B2 public scope-bearing store handoff is rejected. Accepted ADR files are not rewritten. No schema, migration, new authorization-evidence table, cache or capability-token persistence is needed.

B2 remains blocked with F1 HIGH and F2 MEDIUM open until B2-R1 code remediation and independent verification. B2-R0 changes documentation only. C1 route integration, Site-target scope, contractor-positive access, capabilities, Development bootstrap, merge and push remain outside this phase.
