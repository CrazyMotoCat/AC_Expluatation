# ADR-019 — Trusted correlated assignment scope facts

- **Status:** Accepted
- **Date:** 2026-10-09
- **Task:** AUTH-SCOPE-01 / AUTH-ASSET-SCOPE-01
- **Refines:** ADR-015/016 by adding a concrete assignment handoff; preserves ADR-018.
- **Authority:** frozen owner decisions OD-ASSET-TYPE-08A..08E.

## Context

The existing geographic descriptors deliberately exclude composite, direction
and type assignments. Flattening their dimensions into independent sets would
lose the intersection inside each assignment and could create synthetic grants.
All five dimensions already exist in Identity persistence; no schema change is
needed. AssetType implementation and authorization composition remain deferred.

## Decision

1. Extend Identity Application `IEffectiveScopeProvider` with
   `GetCurrentAssignmentScopesAsync(EffectiveScopeRequest, CancellationToken)`.
   Return `ImmutableArray<EffectiveAssignmentScopeFacts>`, a sealed immutable
   record of nullable TerritorialZoneId, RegionId, SiteId, FunctionalDirectionId
   and AssetTypeId. Each item represents one persisted current non-global
   assignment. Preserve identical tuples from distinct assignments; order by
   persisted assignment ID internally, without exporting IDs or role entities.
2. Identity owns exact canonical permission membership, current ACTIVE INTERNAL
   user eligibility, owned current INTERNAL context, active role/assignment and
   `[valid_from, valid_to)` validity. Reuse the common Identity eligibility query
   and one clock instant. Revocation removes eligibility. Trusted server
   composition supplies the current canonical LocalUserId, validated selected
   WorkingContextId and operation's canonical permission. HTTP cannot select
   another user or supply permission, scope tuples or authorization evidence.
   This is an Application primitive, not an arbitrary-user HTTP query.
3. Retain all five dimensions, including nulls and geographic restrictions.
   Never strip geography, split a composite, group by dimension or combine
   restrictions from different assignments. A consumer may evaluate AND inside
   one complete assignment and OR between independently qualifying assignments.
   Facts are data, not unforgeable capability tokens: operational composition
   must acquire them internally rather than accept caller-created evidence.
4. Exclude every `is_global=true` row. Reject non-global all-null tuples and
   tuples containing any empty UUID. Missing/unknown scope never means GLOBAL.
   `IGlobalGrantProvider` alone evaluates explicit GLOBAL under ADR-018. Neither
   its behavior nor the existing geographic method/evaluator is changed.
5. Identity returns stored scope IDs without resolving domain existence,
   direction ownership or AssetType ancestry. Consumers own authoritative
   domain reference resolution and target coverage; stale references make the
   affected assignment unusable. Lookup/provider errors deny. There is no
   Identity dependency on Assets or Organization domain/persistence, no
   cross-schema query, and no EF entity, IQueryable or DbContext in the result.
6. Invalid requests return an empty immutable collection. Storage/query failures
   and requested cancellation propagate as in the existing geographic provider;
   they never produce synthetic facts or a permissive fallback. Consumers must
   stop authorization on exceptions. Concrete evaluation precedes terminal
   GLOBAL evaluation, whose false result can also denote failure under ADR-018.
   Calls on the same scoped DbContext remain sequential.

## Consequences and verification

Future domain compositions can check an exact trusted permission's concrete
facts plus the separate explicit GLOBAL decision. This ADR does not implement
Assets catalog eligibility, taxonomy management, subtree coverage or HTTP routes.
It adds no migration, permission seed, role or assignment administration/data.

Production-provider PostgreSQL checks cover every dimension, composites,
geography retention, cross-assignment non-merge, duplicate preservation, exact
permission, GLOBAL exclusion, validity boundaries, eligibility, context isolation,
malformed stored UUIDs and dependency failure/cancellation. Existing geographic,
GLOBAL, Sites/Location and Organization regressions remain required. Architecture
checks protect immutable contracts, HTTP isolation and module dependencies.

Local implementation/review is distinct from publication. TASK-03.01.01 remains
blocked until this foundation is published and separately authorized to resume.
