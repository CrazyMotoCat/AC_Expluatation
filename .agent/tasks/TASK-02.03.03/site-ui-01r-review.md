# TASK-02.03.03 — SITE-UI-01R Independent Frontend Security Review

## Decision

**INDEPENDENT_SITE_UI_REVIEW: PASS** after one bounded remediation commit.

The candidate `6ea1abee0a05df27b119717c6738db4c393e826b` is limited to Site UI,
frontend tests, narrow navigation, and documentation/checkpoint updates. The
reviewed remediation is `571c330ead3cf979a7bde7c64de0aca75ef27d1f`. No backend
code, authorization contract, database schema, migration, dependency, capability,
or DEV bootstrap changes are present.

## Findings

### SITE-UI-RACE-01 — MEDIUM — Fixed

- **Location:** `src/frontend/src/pages/SitesPage/SiteDetailPage.tsx` mutation
  callbacks; shared `SessionService`.
- **Issue:** A mutation started before logout could finish after the same user
  signed in again with the same context. Checking only user and context allowed
  the old response to be written to the new session's detail cache.
- **Impact:** Protected Site data from a previous login could reappear in a new
  authenticated session.
- **Evidence:** Independent source review traced lifecycle and criticality
  callbacks through `refresh(saved)` to `queryClient.setQueryData`. Logout clears
  query data, while the old callback remained live.
- **Remediation:** SessionService exposes a monotonic generation and a predicate
  that also checks current authenticated user/context. Site form/detail mutations
  capture generation in `onMutate`; callback UI/cache effects stop when the
  session generation or user/context changes. A delayed response test logs out,
  reauthenticates as the same user/context, and verifies the exact predicate
  prevents cache insertion.

### SITE-UI-RACE-02 — LOW — Fixed

- **Location:** `src/frontend/src/pages/SitesPage/SiteForm.tsx` create submit.
- **Issue:** A locally retained Region ID could survive a context change after
  Region query options were cleared, then be sent with the new context.
- **Impact:** Backend authorization would reject an out-of-context parent, but
  stale form state could submit an invalid selection and confuse the user.
- **Remediation:** Create now requires the selected Region to be active in the
  current-context Region query result; invalid selections are cleared and
  submission is rejected. Focused coverage checks active, inactive, and absent
  old-context IDs.

**Open Critical: 0. Open High: 0. Open Medium: 0.**

## Reviewed behavior

- Routes are `/sites`, `/sites/new`, and `/sites/{siteId}` in the existing
  authenticated application shell; no duplicate Site route or dependency on
  `feat/frontend-geography`.
- Every Site/reference request uses the shared authenticated API client.
  Queries forward `AbortSignal`; protected keys distinguish user, context,
  filters, pagination, and Site ID.
- List filters and pagination use backend values. Filter changes reset page to
  1. Region, SiteType, and Criticality labels come from published backend APIs.
- Create and ordinary update use separate payloads. Criticality remains a
  separate endpoint/action. Lifecycle, ordinary update, and criticality carry
  current `rowVersion`.
- Current inactive references remain displayed/retained; inactive values cannot
  be selected as new assignments.
- No frontend role, UserType, JWT permission, context-type, or hierarchy-based
  authorization inference. Backend remains authoritative.
- Missing and unauthorized Site targets use the same neutral 403 unavailable
  UX. 401 stays centralized; raw API/error content is not rendered.
- Mutation defaults disable retries. Optimistic conflicts prompt review and
  refetch current detail. Submit locks prevent duplicate actions.

## Verification

- Frontend: typecheck PASS; lint PASS; **39 tests PASS**; production build PASS;
  `npm audit` PASS (0 vulnerabilities).
- Backend Release solution build PASS (0 warnings/errors); `dotnet test` exits 0
  with no test discovery output.
- Identity/Sites domain checks, Architecture checks, Authentication/OIDC checks,
  DevScripts, CI workflow, DatabaseMigrator configuration/registration, and API
  bootstrap smoke contract checks PASS.
- `git diff --check` PASS; credential assignment scan on changed files had no
  matches. No package or lockfile changed.
- PostgreSQL/Testcontainers and Docker-dependent integration/API/migration
  harnesses are blocked because Docker CLI cannot connect to
  `npipe:////./pipe/dockerDesktopLinuxEngine` (pipe not found).
- Live OIDC/browser smoke is blocked because root `.env` and
  `src/frontend/.env.local` are absent. Authentication was not bypassed.

## Test seam note

The delayed mutation regression is a SessionService predicate/cache-effect test,
not a mounted React component test. The reviewer independently inspected the
actual TanStack `onMutate` snapshot and success/error callback guards in the Site
form and detail components. No remaining source-level blocker was found.

## Publication state

`origin/main` remained at `173bbfc036eec7a8fb5bdf6e7691836aeb0001e7` at the last
fetch. Push has not happened. Re-fetch immediately before the normal push and
stop if the remote baseline changed. Hosted CI must pass for the exact final
published SHA, including backend, frontend, and required checks.
