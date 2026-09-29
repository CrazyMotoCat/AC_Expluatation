# SITE-REF-AUTH-01 independent security review

Reviewer: independent read-only agent `catalog_security_review` (gpt-6-sol, high).
Baseline: e099be23554c34b9d668b5297437a5f54af9d8d5.
MULTI_AGENT_REVIEW: PASS. OPEN_CRITICAL: 0. OPEN_HIGH: 0. OPEN_MEDIUM: 0. OPEN_LOW: 0.
No actionable findings; no blocking test gaps. Reviewer performed no edits or commits.

## Evidence and attacks

- Public catalog interface accepts only Guid localUserId, Guid workingContextId and CancellationToken.
  Service fixes sites.read/create/change/change_criticality internally, validates supported non-empty
  scope and performs bounded sequential calls; provider exception immediately denies without fallback.
  See Application/Authorization/ISiteReferenceCatalogAuthorizationService.cs and
  SiteReferenceCatalogAuthorizationService.cs. No caller permission, raw scopes or geographic evidence.
- Unchanged Identity EffectiveAuthorizationQueries enforces persisted ACTIVE INTERNAL user,
  valid owned INTERNAL context, role/permission and assignment validity. No role/UserType/JWT-only bypass.
- Only the two catalog GETs switch authorization; checks precede unchanged handlers/DTO projection.
  Catalog authorization has no Site/Zone/Region call sites. IdentityModuleRegistration still uses
  the unchanged deny-by-default legacy production grant source. No Site permission implication.
- Real-provider ReferenceCatalogChecks matrix covers all allowed permissions, exact scope levels,
  context/validity/contractor/claims negatives, query authority injection, global inactive values and
  unchanged Site permission/scope isolation. Test fixture data changes do not change production catalogs.
- Reviewed HTTP fault delta in SitesApiChecks/Program.cs returns canonical 403 ACCESS_DENIED for both
  catalogs despite configured valid scopes; no provider-failure-to-all fallback.
- No cross-module DB dependency, schema/migration, existing geographic/Site semantic change,
  new grant engine, capability, contractor-positive behavior or reference CRUD route.

ADR_REQUIRED: NO. ADR-013 reserves catalogs until a separate scope contract; current owner decisions
SITE-REF-OD-01/02/03 supply that contract. ADR-016 permits reusable Identity scope composition.
This bounded Sites policy changes no Identity model/contract, module ownership or hierarchy semantics.
Documentation and reference registry reconciliation match the policy.

Independent architecture harness and git diff --check: PASS. Full runtime gates are primary-owned;
primary confirmed final SitesApiChecks after HTTP fault injection PASS, all 11 explicit harnesses PASS,
Release build 0 warnings/errors, model drift NONE and documentation sync PASS.

NEXT_ACTION: independent publication review; do not push/merge or resume frontend in this phase.
