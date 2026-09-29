# FRONTEND-GEOGRAPHY RECONCILIATION — GEO-UI-01

STATUS: VERIFIED_READY_FOR_LOCAL_COMMIT
CHECKPOINT_STATUS: SAFE
PHASE: final gates PASS; authorized single local commit transition
LAST_SAFE_COMMIT: 70d78d7615fd4abbae5a38f65315e27e5831aa81

## COMPLETED

- Fetch and repository guard: CLEAN_BASELINE / SAFE in existing main checkout.
- main and origin/main match the requested baseline. No new branch/worktree.
- Historical local df1559d3d89d8d8cfa3bda673c82003ce684ed07 and remote
  a48fa4b9a6f4804875daf0fee6e9e03e22818725 are read-only reference material.
- Inspected published endpoint definitions, current session/query/Site patterns.
- API/query consolidation, pages/navigation and all security regressions.
- Frontend reconciliation docs and current Sites module/context sync.

## VERIFIED

- Main worktree was clean before this checkpoint; no unknown dirty files.
- Published lists: GET /api/v1/territorial-zones and GET /api/v1/regions.
- Baseline defect: Site API repeated /api/v1 in resource paths. Corrected
  narrowly in that module; shared client concatenation semantics unchanged.
- Typecheck PASS. API + existing Site API/page tests: 15 PASS.
- GEO_UI_01_STEP_1: DONE; ZONE_API / REGION_API / REGION_FINAL_URL /
  NO_DOUBLE_API_PREFIX / CANCELLATION: PASS; QUERY_KEYS: CURRENT_STANDARD.
- One canonical complete Region DTO, shared unfiltered Site/Geography key;
  filtered Region keys remain distinct. Site resource paths corrected.
- GEO_UI_01_STEP_2: DONE; ZONE_LIST_UI / REGION_LIST_UI / REGION_URL_FILTER /
  ZONE_FALLBACK / NAVIGATION: PASS, including real browser interactions.
- GEO_UI_01_STEP_3: DONE; CONTEXT_ISOLATION / LATE_RESPONSE / LOGOUT_ISOLATION /
  SITE_UI_REGRESSION / SESSION_REGRESSION: PASS.
- Typecheck and lint PASS; all 68 frontend tests PASS (original 39 retained).
- Real current SessionService + transport AbortSignal security regressions for
  both resources; static page snapshots read the real service state.
- Browser QA PASS: filter select/clear/reload/Back/Forward, unrelated search
  param preservation, exact backend filter, context B headers/current data,
  refresh/retry, hidden/failed/pending Zone labels, safe errors, Site list/create
  Region selector, 320 px viewport (no page overflow), zero browser exceptions.
- Production frontend build PASS; npm audit PASS (0 vulnerabilities).
- Release backend build PASS (0 warnings/errors), named Architecture,
  Identity/Sites domain and Authentication/OIDC checks PASS.
- PostgreSQL Identity/Audit/Sites/Organization persistence, Sites/Organization
  API and AuditDelivery harnesses PASS. dotnet test exited 0, no discovery.
- DevScripts, CI workflow, DatabaseMigrator registration/configuration and
  API bootstrap smoke contract script checks PASS.
- Architecture/source boundary, task-owned formatting, Markdown/reference
  consistency, secret scan and git diff --check PASS.
- DOCS_IMPACT: YES; DOCUMENTATION_SYNC: PASS. Updated frontend Geography doc,
  Sites module doc and capsule. DB/OpenAPI/ADR/global standards checked: no
  contract/schema/architecture changes, no update required.

## SECURITY REVIEW

- Independent read-only geo_security_review: code/security/API/scope PASS;
  29 focused and 68 full frontend tests independently PASS. No security findings.
- One LOW stale checkpoint metadata note corrected before local commit.
- Pre-commit review and later independent commit/range review are separate.
- GEO_UI_01_STEP_4: DONE; SECURITY_REVIEW: PASS.
- OPEN_CRITICAL: 0; OPEN_HIGH: 0; OPEN_MEDIUM: 0; OPEN_LOW: 0.
- Final independent documentation/scope/architecture/API/tests review PASS;
  read-only report is in agents/geo_security_review.md.
- Repeated fetch confirmed baseline and both historical refs unchanged.

## NOTES

- Optional repository-wide dotnet format verification exits 1 on unchanged
  backend baseline WHITESPACE/IMPORTS issues. Backend diff is empty; no unrelated
  formatting fixes were made. Task-owned formatting and all functional gates PASS.
- Browser QA harness/screenshots and backend logs are ignored local artifacts,
  never production source or staged files. No new dependency/test framework.

## DECISIONS

- Reimplement only Geography list UX; whole historical branch is not merged.
- Reject historical auth/session infrastructure; preserve current SessionService.
- One complete Region DTO/loader in entities/geography, reused by Site selectors.
- Narrow Site API resource-path correction; no shared base URL semantic change.
- Region filter is backend business input; no frontend authorization logic.
- Parent labels use authorized Zone list only; absent/failed lookup is non-fatal.
- No backend/schema/migration/capability/Geography mutation changes.
- One atomic local main commit after gates; no push. Independent commit review
  before publication is the next owner workflow, not permission to publish now.

## FILES_CHANGED

- Checkpoint; entities/geography/api.ts; entities/sites/api.ts;
  geographyApi.test.ts; sites.test.ts; sitePages.test.tsx (complete DTO fixture).
- Geography feedback/pages/CSS/tests; existing App routes and layout/nav CSS.
- Current frontend reconciliation docs; Sites module doc/context capsule.
- Independent review record under agents/geo_security_review.md.

## UNCOMMITTED

- Above task-owned files are ready for deliberate staging and one main commit.
- Once this checkpoint is in the GEO-UI-01 commit, expected worktree is clean;
  resolve the atomic candidate SHA using git log -1 --format=%H -- this file.
  Parent must be LAST_SAFE_COMMIT; main must be exactly one ahead of origin/main.

## PENDING

- Deliberate staging, staged diff review and single local commit on main.
- After that: independent commit/range review before ordinary push + exact-SHA CI.

BLOCKERS: NONE
NEXT_ACTION: Review the atomic local GEO-UI-01 main commit after the authorized commit transition.

## DO_NOT_REPEAT

- Do not create branches/worktrees, merge/cherry-pick historical Geography,
  replace session infrastructure, push, or retire the historical worktree.
- Original chat cwd is a different detached checkout; use the existing main
  checkout at C:/Users/mvideo/.codex/worktrees/site-ref-auth/АС Эксплуатация.
