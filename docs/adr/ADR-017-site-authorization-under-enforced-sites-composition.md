# ADR-017 — Site authorization under enforced Sites composition

- **Status:** Accepted
- **Date:** 2026-09-27
- **Task:** TASK-02.03.03 / SITE-AUTH-00 (contract only)
- **Refines:** ADR-014 under ADR-015 and ADR-016; does not rewrite those accepted decisions.

## Context and historical refinement

ADR-014 froze Site as an authorization target, downward Zone/Region/Site
coverage, independent Site permissions and parent Region coverage for create.
It preceded the published AUTH-SCOPE B1/B2/C1 composition. The following
ADR-014 statements are **REFINED BY ADR-017**:

- Its context says AUTH-SCOPE Phase A and the production evaluator are not
  implemented. That was true when written; exact Zone/Region scope provision,
  Sites composition and C1 Geography routes are now published. Site scope,
  Site authorization and Site HTTP routes remain unimplemented.
- Decision 1 describes a target with Zone, Region and Site dimensions and
  assignment matching. Those dimensions must be resolved from Sites
  persistence. They are not a caller-provided trusted target descriptor and
  Identity does not match a composite Site → Region → Zone target.
- Decisions 2 and 6 refer to Site coverage, hierarchy projection and an
  application-level Identity contract. Under ADR-016, Identity returns exact
  permission-specific effective scopes; Sites alone loads its business
  hierarchy and decides downward coverage. Identity never expands Site,
  Region or Zone scope through Sites hierarchy.
- The implementation section's B1 evaluator/Site projection prerequisite is
  historical sequencing. Future Site integration extends the existing exact
  scope provider and Sites-owned composition; it does not restore a
  caller-constructible parent projection or a second grant engine.

ADR-014's owner decisions on coverage, independent permissions, immutable
parent and separate criticality permission remain in force. ADR-015's exact
scope and empty-list semantics and ADR-016's enforced composition govern the
implementation boundary. C1-OD-01 governs target-existence concealment.

## Decision: exact Identity scope and Sites coverage

Site is a supported future authorization target. For one eligible INTERNAL
user in a valid INTERNAL working context, Identity may return exact
`Site/siteId` scopes for the requested canonical permission when backed by a
current assignment and role-permission membership. Identity must extend the
existing `AuthorizationScopeKind`/effective kind, scope shape validation,
`IEffectiveScopeProvider` and exact `IEffectiveGrantEvaluator` matching using
the shared eligibility query. It must neither resolve Site → Region,
Site → Zone or Region → Zone nor expand any scope upward or downward.
Unsupported, composite or malformed assignments fail closed; distinct
assignments cannot be combined to manufacture hierarchy coverage.

Sites obtains effective scopes internally for the exact permission and loads
authoritative hierarchy from its PostgreSQL tables. For existing Site `S`
with parent Region `R` and ancestor Territorial Zone `Z`, direct Site
coverage is **exact Site/S OR Region/R OR TerritorialZone/Z**. This is
downward coverage only: Site scope grants neither Region nor Zone; Region
scope grants no parent Zone. Existing C1 Zone/Region semantics remain as
published. SiteType and SiteCriticalityClass do not contribute to geographic
coverage.

The public Sites direct-target service accepts authenticated local user,
validated context, canonical permission and `siteId` only. Its Site target
resolver derives Site ID, Region ID and Zone ID from Sites persistence. The
create operation accepts `regionId` solely as business input, resolves its
authoritative parent Zone, and checks `Region/R OR TerritorialZone/Z` for
`sites.create`. Site-only scope cannot authorize a new sibling. Parent Region
must be ACTIVE after authorization; that is a separate business rule. No
caller supplies a parent/ancestor as authorization evidence or an effective
scope collection. The existing Sites authorization composition is extended;
there is no new ACL table, Site grant engine or cross-module DB access.

## Operation and response contract

| Future route | Permission | Coverage |
|---|---|---|
| `GET /api/v1/sites` | `sites.read` | Authorized Site SQL list |
| `GET /api/v1/sites/{siteId}` | `sites.read` | Direct Site |
| `POST /api/v1/sites` | `sites.create` | Parent Region or its Zone |
| `PUT /api/v1/sites/{siteId}` | `sites.change` | Direct Site |
| `POST /api/v1/sites/{siteId}/activate` | `sites.change` | Direct Site |
| `POST /api/v1/sites/{siteId}/deactivate` | `sites.change` | Direct Site |
| `PUT /api/v1/sites/{siteId}/criticality` | `sites.change_criticality` | Direct Site |

No permission implies another. In particular, `sites.change_criticality`
does not additionally require `sites.change`. Ordinary update changes only
name, SiteType, address and timezone; code and Region are immutable. There is
no DELETE or reparent operation. Lifecycle and criticality commands retain
`expectedRowVersion`; a new criticality class must be ACTIVE. Any future move
needs a separate contract.

The public authorized Site list obtains scopes internally through
`IEffectiveScopeProvider` for fixed `sites.read`; no public authorization
contract accepts caller-supplied `EffectiveAuthorizationScope` collections.
Sites SQL applies `site.id IN effectiveSiteIds OR site.region_id IN
effectiveRegionIds OR parentRegion.territorial_zone_id IN effectiveZoneIds`,
using an authoritative Region join. The authorization predicate precedes
business filters, count, ordering and pagination/page extraction. A bounded
Identity scope query plus Sites SQL count/page queries is the intended shape:
no per-row `HasGrantAsync`, N+1, full-table in-memory filtering or Redis
correctness dependency. Empty effective scopes for `sites.read` yield a
`200` empty page with zero count, never all Sites. Contractors/external
contexts have no positive Site authorization and receive empty lists.

For direct GET, update, lifecycle and criticality, missing Site and existing
but out-of-scope Site return the same `403 GEOGRAPHY_ACCESS_DENIED` envelope.
For create, missing parent Region and existing but out-of-scope parent Region
return that same `403`. This reuses C1's canonical geography/Sites access
denial code; "geography" includes the Site level, so no second code is
introduced. `401` remains authentication failure. After authorization,
business/domain errors use their existing canonical responses. The historical
Site API draft's `ACCESS_DENIED`/`SITE_NOT_FOUND` and parent
`REGION_NOT_FOUND` rows are refined for these pre-authorization cases.

All authorization completes before Site business mutation. A denied command
changes no Site state or row version and creates no audit obligation. A
successful mutation preserves the published atomic Site/audit obligation
contract. Site type/criticality reference eligibility is independent of
geographic authorization.

## Persistence and security invariants

`identity.access_assignments` already contains nullable UUID `site_id` in
the domain model, EF mapping and published migration. Its scope-present
constraint and unique assignment index include `site_id`. Thus Site ID can
be represented without a schema change or migration; provider/query support
is **not implemented**. The current effective provider and geographic scope
shape deliberately exclude Site, so this ADR does not enable it.

| Invariant | Contract |
|---|---|
| Caller-supplied Site parent/ancestor | Forbidden |
| Caller-supplied effective scopes as authorization evidence | Forbidden |
| Identity hierarchy expansion | None |
| Exact Site scope | Supported in future implementation |
| Region → Site / Zone → Site | Yes, via Sites authoritative hierarchy |
| Site → Region / Site → Zone | No |
| Empty scope means all | False |
| Contractor-positive authorization | None |
| Per-row authorization / cross-module DB access | Forbidden |
| Schema change / migration required | No / No |

## Implementation sequence and status

SITE-AUTH-01A extends Identity exact Site scope support. SITE-AUTH-01B
extends Sites authoritative Site target coverage and the authorized Site SQL
list. SITE-AUTH-01C runs PostgreSQL, negative security and architecture
review, followed by independent publication review. Production Site CRUD
routes may be wired only after that foundation is implemented, verified and
published. Capabilities, Development bootstrap, contractor-positive grants,
frontend and Site HTTP routes are outside SITE-AUTH-00.

Site B1 persistence is **published**. Site authorization is **contract
frozen, not implemented**. Site HTTP API is **not implemented**.

## Implementation status (2026-09-28; non-normative)

SITE-AUTH-01 implements exact Identity Site scopes, Sites-owned direct/create
coverage and the authorized Site SQL list locally. PostgreSQL, security and
architecture checks pass. Independent publication review remains pending;
Site HTTP API is still not implemented. The decision above is unchanged.
