# AUTH-SCOPE-01 — Phase A contract freeze

STATUS: PHASE_A_COMPLETE; IMPLEMENTATION_NOT_STARTED
SOURCE_OF_TRUTH: owner decisions OD-01…OD-06 on 2026-09-26, ADR-007,
ADR-013, canonical Identity/security docs, verified repository code.

## Verified baseline

- ASP.NET Core JWT Bearer validates signed token, issuer, audience, expiry and
  `iss`/`sub`; `/api/v1/me` provisions/synchronizes an ACTIVE local profile.
- Identity persists roles, `role_permissions`, `access_assignments` and
  `user_contexts`. `X-Work-Context-Id` validates owned/available context for
  the request and writes durable Audit before the endpoint.
- Sites geography routes require `sites.read`, `sites.create` or
  `sites.change`. Production registers
  `NoAccessAssignmentPermissionGrantSource`; its
  `HasGrantAsync(userId, permissionId)` always denies and has no context/target.
- `access_assignments.context_id` has no FK to `user_contexts`. Assignment
  scope matching is exact by supplied target dimensions; matching alone is
  not a permission grant. The code currently does not scope-filter geography
  queries. No capabilities route or Development authorization fixture exists.
- `AUTH-SCOPE-01` was not present in `docs/backlog.md` before this Phase A;
  the owner's task text is its exact task contract. No attached preflight file
  was found in the repository.

## Owner decisions and impacts

### OD-01 — list authorization / scope filtering: APPROVED B

Contract: backend returns only Zones/Regions covered by effective
`sites.read` assignments in the selected context. A role or permission code
alone does not return a full list. Use authoritative Sites dimensions and
filter within the query; never return an unfiltered collection to the client.
Region/Site assignment does not implicitly grant ancestor Zone visibility.

Rationale: ADR-007 forbids broad access and ID-based access. A scoped list
prevents cross-region disclosure, including count/order and response DTOs.

Affected: Identity (effective grants), Sites (target attributes/query), API,
frontend. Migration: none required by the frozen model; query indexes may be
evaluated with evidence later. API: existing list payloads remain arrays,
their results become scope-filtered. Security: negative scope/context/validity
tests and pagination/filter checks are required.

### OD-02 — create under target parent: APPROVED

Contract: Region creation requires effective `sites.create`, a validated
INTERNAL context, and an assignment covering the requested existing parent
Zone. Sites still checks parent existence/ACTIVE state. Root Zone creation
remains closed until an explicit authority model is approved.

Rationale: a new root Zone has no existing parent to match to the current
nonempty-scope assignment schema. Region has an authoritative parent.

Affected: Identity, Sites, API, frontend. Migration: none for Region; any
future root-zone authority may need a new schema/contract decision. API:
`POST /api/v1/regions` gains a target check; existing Zone POST stays 403.
Security: request `territorialZoneId` is a locator, not proof of scope.

### OD-03 — target-aware authorization contract: APPROVED separate contract

Contract: an application-level evaluator accepts user, validated context,
canonical permission and authoritative target scope. Identity resolves active
role-permission and eligible assignment; Sites constructs target scope and
filters its data. The old target-blind `HasGrantAsync` cannot authorize
business routes. No Sites-to-Identity.Infrastructure or
Identity-to-Sites.Infrastructure dependency is allowed.

Rationale: the generic API policy cannot derive authoritative entity
ancestry and Identity must not own Sites hierarchy logic.

Affected: Identity.Application/Infrastructure, Sites.Application/
Infrastructure, API. Migration: no schema change required. API: no new
public route from this decision alone. Security: all geography reads/writes
must invoke target-aware checks; enabling a generic grant must not open
Organization or scope-less Sites routes.

### OD-04 — frontend capabilities: APPROVED target-specific endpoint

Contract: backend calculates capabilities for explicit, visible Zone/Region
targets in the validated current context. Freeze
`POST /api/v1/capabilities/evaluate` and DTO/error semantics in ADR-013.
No global flat permission list or `/me` extension. Capabilities guide UI
only; business endpoints re-evaluate authorization.

Rationale: a global boolean such as `sites.change` falsely implies access to
all entities. Target-specific answers track context and scope.

Affected: API, Identity, Sites, frontend. Migration: none. API: one new
read-only evaluation route with bounded target batch. Security: omitted
invisible IDs, no assignment disclosure, no cross-context cache, tests for
forged target IDs and stale capability response.

### OD-05 — Development bootstrap: APPROVED

Contract: explicit, repeatable Development fixture creates local OIDC user
with trusted `user_type=INTERNAL`, local ACTIVE profile, ACTIVE role,
`role_permissions`, owned available INTERNAL context and time-valid limited
assignment for an existing Zone. It uses production authorization rules and
is never a production startup seed or frontend admin flag.

Rationale: real browser integration needs a legitimate grant chain while
keeping deny-by-default for all other users/targets.

Affected: local Keycloak/Development tooling, Identity data, Sites fixture,
frontend test setup. Migration: none; fixture data uses existing schema.
API: existing OIDC and `/me` flows, no bypass route. Security: fixture
must be idempotent, bounded to Development and least privilege; no secrets
or bearer tokens committed/logged.

### OD-06 — contractor chain: APPROVED internal first

Contract: production evaluator initially grants only INTERNAL users in
INTERNAL contexts. CONTRACTOR users and CONTRACT/PROJECT/DELEGATION/TEAM
contexts remain denied for this slice. Contractor grants require the
ADR-007 organization → contract → user assignment → contract scope →
validity chain in later contractor-model tasks.

Rationale: the existing context and assignment rows do not prove contractor
membership or contract validity.

Affected: Identity, future Contractors, API/Sites, frontend. Migration:
none in this task. API: contractor attempts stay 403/filtered empty as
appropriate. Security: fail-closed negative coverage for forged context,
expired contract surrogate, and cross-contractor scope.

## Required production semantics

- Every Sites geography mutation (`sites.change` included) checks the
  persisted target's authoritative scope within the use case before change.
  Audit acting context is metadata, not authorization evidence.
- `sites.create` for Region uses the parent's current scope; no scope is
  inferred from the caller-supplied UUID without looking up that parent.
- No matching assignment/role-permission/context means deny. Assignments
  do not combine their dimensions into synthetic coverage. Missing target
  dimensions cannot satisfy constrained assignment dimensions.
- Existing `organization.*` routes and targetless `sites.read` reference
  routes stay deny-by-default pending their own scope contracts.
- This phase does not change runtime behavior. Current production denial
  remains until implementation and negative verification complete.

## Recommended phase split

- B1: Identity internal effective-grant evaluator, application-level
  contract and focused unit/PostgreSQL checks.
- B2: Sites authoritative Zone/Region target projection and query-level
  scope filtering, with direct-ID/parent coverage tests.
- C1: Integrate target checks into all geography read/create/change routes;
  keep unsupported modules/routes closed.
- C2: Implement bounded target-specific capabilities API and frontend
  contract checks.
- C3: Add explicit Development Keycloak/Identity/Sites bootstrap fixture
  and a real browser smoke path.
- C4: Run full negative authorization, concurrency, migration-compatibility,
  architecture, docs-impact/documentation-sync and independent security
  review; then consider a task commit. Hosted CI requires separate evidence.

## Phase A boundaries

No code, DB migration, fixture, API route, test or production grant was
implemented in Phase A. Phase B requires a new explicit request. Root Zone
creation, Organization/Company scope and contractor grant evaluation need
their own later decisions; this contract does not silently enable them.
