# AUTH-GLOBAL-01R independent publication review — 2026-10-07

Source `0e2ea20f01d29841faaf3eb275d21103571e857b`; published parent
`d07f48699410a1da8b938655b4d63605dc44d19f`. Reviewed on `main`, with
`origin/main` still at the parent and no additional worktree. Only untracked
paths are `.agent/tasks/TASK-02.02.02/state.md` and
`.agent/tasks/TASK-03.01.01/state.md`; neither belongs to this review.

## Ownership and contract

DIFF_OWNERSHIP: PASS. The 26 source-commit paths are Identity domain,
application, infrastructure, one Identity migration/snapshot, Identity and
Sites HTTP regression harnesses, ADR-018 and related Identity/security/database
documentation and AUTH-SCOPE task records. No Organization or Assets runtime,
Sites or Location production behavior, frontend production, or unrelated
migration path changed.

The published `ck_access_assignments_scope_present` predicate was
`Z OR R OR S OR F OR A`, where each symbol means its corresponding concrete
UUID field is non-null. Its domain equivalent required `HasConstraint` and
rejected empty UUIDs. All combinations with at least one present field,
including composites, were accepted by the DB. All-null was invalid.

The new predicates are `(G OR Z OR R OR S OR F OR A)` and
`(NOT G OR (NOT Z AND NOT R AND NOT S AND NOT F AND NOT A))`, with
`G = is_global BOOLEAN NOT NULL DEFAULT FALSE`. Substituting `G = FALSE`
reduces the first predicate exactly to the published predicate and makes the
second true. Therefore every published valid row remains valid without a
data rewrite; composite conjunction semantics are unchanged. Existing rows
default false. All-null non-global remains invalid. With `G = TRUE`, all five
concrete fields must be NULL. This proves schema compatibility without target
data access; the local target database lacks `identity.access_assignments`.
TARGET_DATA_PREFLIGHT: UNAVAILABLE_NOT_REQUIRED_FOR_COMPATIBILITY. No target
data result is claimed.

## Security attack matrix

1. Null/empty/unknown scope: domain, DB and provider never infer GLOBAL.
2. Composite scope: persisted and evaluated under the published conjunction;
   migration PostgreSQL test compares every legacy field before/after.
3. Zone, Region, Site, FunctionalDirection and AssetType with GLOBAL: each is
   rejected by the DB and domain; multiple fields are rejected by the same
   predicate. Concrete-only rows never pass the GLOBAL provider.
4. Permission P/Q: shared query joins canonical role-permission membership and
   matches the requested exact code. P concrete plus Q GLOBAL denies P; a
   separate P GLOBAL allows P. Unknown/noncanonical codes deny.
5. Caller inputs: no production HTTP consumer or assignment-admin route was
   added. The application request has local user/context and a canonical
   permission, but no scope/global evidence; future consumers must supply
   authenticated user, validated context and a fixed server-side permission.
   Forged HTTP query/body authorization hints in Sites/Location tests deny.
6. Eligibility: shared Identity query requires active INTERNAL profile,
   owned active INTERNAL context, active role/assignment, exact permission and
   inclusive `valid_from` / exclusive `valid_to` for context and assignment.
   Wrong/foreign/missing context, future/expired/revoked paths deny.
7. Provider failure/malformed row: storage exception returns false; cancellation
   propagates. Provider additionally requires `is_global=true` and all five
   concrete fields null, so malformed mixes fail closed.
8. Concrete effective scopes: explicit `!IsGlobal` retains the prior valid
   geographic shape; GLOBAL cannot enumerate Zones, Regions or Sites.
9. Rollback: Down locks the table and rejects any `is_global=true` row before
   dropping the column, independent of active/revoked/expired status. With no
   GLOBAL rows, the prior CHECK and exact legacy data are restored. The real
   PostgreSQL harness exercises active-row refusal and no-row rollback; the
   revoked-history outcome follows from the unqualified SQL predicate.
10. Existing module regressions: all normal PostgreSQL and HTTP harnesses pass,
    including Sites/Location authorization and reference-catalog behavior.

The provider signature is
`Task<bool> HasGlobalGrantAsync(GlobalGrantRequest request, CancellationToken)`;
request fields are `LocalUserId`, `WorkingContextId`, `CanonicalPermission`.
The current implementation has no HTTP consumer. Existing
`ix_access_assignments_user_context_validity` supports the user/context/
validity lookup; no authorization cache or new index was introduced.

## Independent execution

- Release solution build: PASS, 0 warnings/errors.
- All 11 named executable harnesses: PASS, including real Testcontainers
  PostgreSQL Identity migration/provider, Sites/Location, Audit and Organization.
- Central migrator on disposable PostgreSQL: 17 applied, then 0; container
  removed. Identity EF pending-model check: no drift.
- `dotnet test -c Release --no-build`: exit 0 (console harnesses run separately).
- Four infrastructure contract scripts and live API bootstrap smoke: PASS.
- Changed C# whitespace verifier, `git diff --check`, changed-diff secret
  pattern scan: PASS.
- ADR-018/index and Identity module/context/database/security docs inspected:
  DOCUMENTATION_SYNC PASS. ADR-013/015/016/017 geographic trust boundaries
  remain intact. No new seed, HTTP consumer, Audit store or cache is claimed.

SECURITY_FINDINGS: NONE. OPEN_CRITICAL: 0; OPEN_HIGH: 0; OPEN_MEDIUM: 0;
OPEN_LOW: 0. REVIEW_STATUS: PASS. AUTH-GLOBAL-01:
REVIEWED_LOCAL_PENDING_PUBLICATION. Hosted CI and publication require a
normal push and exact-final-SHA verification.
