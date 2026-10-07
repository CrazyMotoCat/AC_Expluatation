# ADR-018 — Explicit GLOBAL access-assignment scope

- **Status:** Accepted
- **Date:** 2026-10-07
- **Task:** AUTH-SCOPE-01 / AUTH-GLOBAL-01
- **Refines:** ADR-007; preserves ADR-013/015/016/017 geographic authorization.

## Context

The published Identity assignment model supports five nullable concrete scope
dimensions and conjunctive composite scopes. A global catalog operation needs
an explicit permission-specific GLOBAL grant. Missing scope cannot express it
safely. Owner decisions OD-AUTH-GLOBAL-01..09 authorize the explicit extension;
OD-09 preserves existing concrete and composite semantics.

## Decision

1. Identity owns `AccessScope.IsGlobal`, its explicit `Global` factory and
   `AccessAssignment.IsGlobal`. Persistence adds `is_global boolean NOT NULL
   DEFAULT false` to `identity.access_assignments`. GLOBAL requires all five
   concrete scope fields to be NULL. Non-global assignments retain the existing
   at-least-one constraint and conjunctive composite matching. There is no new
   exactly-one-dimension rule.
2. The presence check becomes `is_global OR existing_scope_present`; a separate
   check enforces `NOT is_global OR all_concrete_fields_are_null`. Existing IDs,
   permissions, contexts and validity remain unchanged and all legacy rows get
   `is_global=false`. Migration never splits, normalizes or widens composites.
   NULL, empty, malformed and unknown scope never become GLOBAL.
3. `IGlobalGrantProvider.HasGlobalGrantAsync(GlobalGrantRequest)` is a separate
   Identity Application contract returning only a decision. Its request carries
   local user, working context and `CanonicalPermission` from trusted server
   composition. Only a current explicit GLOBAL assignment for that exact
   permission qualifies. Concrete assignments and grants for another permission
   cannot satisfy it, even when several assignments coexist.
4. Evaluation reuses canonical Identity eligibility: ACTIVE INTERNAL user,
   owned current INTERNAL context, active/current assignment and role, exact
   role-permission membership, revocation and `[valid_from, valid_to)`. The
   representation adds no GLOBAL-specific INTERNAL restriction; the current
   shared evaluator policy remains unchanged. Invalid requests and provider or
   storage errors return false; cancellation propagates. HTTP input cannot
   supply permission, scope, GLOBAL or context ownership as grant evidence.
5. GLOBAL never enters Zone/Region/Site effective-scope results and never
   expands geographic coverage. Existing Sites, reference catalog, Location
   and general permission-source behavior remains unchanged. Future Organization
   composition must require its own INTERNAL eligibility and a GLOBAL grant for
   fixed `organization.manage_functional_directions`; its seed and consumer
   implementation belong to TASK-02.02.02.
6. The canonical domain `Assign` path supports explicit bootstrap creation;
   no application/admin mutation path or HTTP endpoint is introduced. Future
   administration must use canonical Audit for creation/change/revocation and
   retain actor, context, correlation and explicit scope facts. No authorization
   cache exists; PostgreSQL remains the source of truth.

## Migration and rollback

The upgrade is additive and preserves valid published concrete data, including
composites. Before upgrading an existing database, obtain aggregate read-only
target inventory; record unavailable target data separately from compatibility
proved by the published constraints.

Rollback refuses any GLOBAL row, including revoked rows, before schema removal.
The previous schema cannot represent GLOBAL. The owner must explicitly decide
revocation/reissue into concrete grants and archive the disposition before
rollback; revoked history is not silently deleted or reinterpreted by migration.

## Verification

Domain and real PostgreSQL checks cover GLOBAL exclusivity, legacy/default-false
preservation, composites, exact permission, context ownership, validity,
revocation, provider failure and caller injection. Existing Identity/Sites/
Location authorization and architecture regressions remain required.
