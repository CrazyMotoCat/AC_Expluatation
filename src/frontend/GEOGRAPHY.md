# GEO-UI-01 — Geography read/list UI

The candidate `4adae34dfef99f3bc0b6fe53bbbfdcbd8d74fc6b` is implemented
directly on `main`, based on published baseline
`70d78d7615fd4abbae5a38f65315e27e5831aa81`. GEO-UI-01R independent review
of that exact commit/range is PASS. Ordinary publication and exact-SHA hosted
CI are PASS at `94831f6ec5b6afc8ab118d0ed42fd2cadd2e08d1`; the historical
branch/worktree were retired only after that gate.

## Routes and published contracts

- `/geography/territorial-zones`: code, name, ACTIVE/INACTIVE status.
- `/geography/regions`: code, name, parent label, timezone, ACTIVE/INACTIVE.
- API: `GET /api/v1/territorial-zones` and `GET /api/v1/regions`.
- Region `territorialZoneId` lives in URL search params and is sent unchanged
  as a backend business filter. Change/clear preserve other search params;
  browser Back/Forward and reload restore the URL filter.
- Empty authorized lists are normal `200 []` states. Each resource has its own
  loading/error/retry behavior. Manual refresh reloads current requests.
- Parent labels use only the authorized Zone list. Exact Region access does
  not imply access to its parent Zone. Missing, pending or failed Zone lookup
  displays `Зона недоступна`; successful Region rows remain usable. No Zone
  detail probing or raw parent UUID label is added. Unknown URL filters remain
  visible as a safe fallback option and can always be cleared.

## Shared foundation

The current SessionProvider/SessionService, generation/selectionVersion,
OIDC loss handling, context ordering and query cleanup are preserved. All
requests use the shared authenticated client; query functions forward their
AbortSignal. No local token/context header code or permission inference exists.
User/context/resource/filter keys follow current protected-query conventions.
The unfiltered Region key/complete DTO/loader are shared with Site selectors;
filtered queries cannot replace selector results. Logout cancels and clears
queries; old responses cannot populate the next session.

The current Site API passed full `/api/v1/...` paths to a client whose default
base was already `/api/v1`. Resource paths in that module now omit the repeated
prefix, including Region, Site/reference reads and existing Site commands.
Shared base URL semantics and Site command payloads are unchanged. Transport
regressions verify exact final URLs, headers, filter encoding and cancellation.

Only safe fixed frontend error text is rendered. `GEOGRAPHY_ACCESS_DENIED`
has neutral unavailable wording; legacy not-found codes do not disclose
existence. Backend authorization is authoritative. No Zone/Region detail,
create/edit/lifecycle actions, pagination, capabilities, dialogs/forms, local
roles/UserType/JWT permission evaluation or geographic scope calculation is
implemented. Backend/schema/migrations and package dependencies are unchanged.

## Reconciliation history

Historical `feat/frontend-geography` was inspected read-only and remained
unchanged until ordinary main publication and exact-SHA hosted CI PASS. Its
secondary worktree and local/remote refs have now been removed. Recorded SHAs:

- Remote: `a48fa4b9a6f4804875daf0fee6e9e03e22818725`.
- Local: `df1559d3d89d8d8cfa3bda673c82003ce684ed07`.

The whole branch was **not merged**, rebased or cherry-picked. Useful
Geography read UX and acceptance intent were reimplemented on current main.
Historical auth/session/query infrastructure and obsolete auth-gap state were
intentionally rejected. The current AppLayout, Site links and session controls
are retained; navigation uses minimal flex-wrap for narrow viewports.

## Local verification

From `src/frontend`: `npx tsc --noEmit`, `npm run lint`, `npm test`,
`npm run build`, `npm audit` all PASS; audit reports zero vulnerabilities.
**68 tests PASS**, including the original 39 and 29 new Geography API/page/
security regressions. Focused tests are `src/__tests__/geographyPages.test.tsx`
and `../../tests/frontend/Unit/geographyApi.test.ts`. SSR tests read snapshots
from the real SessionService with only the subscription hook adapted for
static rendering. Transport tests deliberately allow an aborted request to
finish late and verify cancellation/clear prevent cache restoration.

Browser QA used bundled Playwright and installed Edge, with production App,
SessionService, shared client and API fixtures in an ignored local harness
(no new repository framework/dependency). It verified real filter select/
clear, reload, Back/Forward, unrelated-param preservation, backend filter
requests, A→B headers/data isolation, refresh/retry, hidden/failed/pending
Zone fallback, neutral errors, Site list/create Region selector and 320 px
viewport. No page-wide horizontal overflow or browser exceptions occurred.

Release backend build, architecture checks, Identity/Sites domain checks,
Authentication/OIDC, Identity/Audit/Sites/Organization PostgreSQL persistence,
Sites/Organization API and AuditDelivery harnesses PASS. `dotnet test` exits
zero but discovers no tests; named harnesses provide actual verification.
Infrastructure script/configuration and API bootstrap smoke contract checks
PASS. No backend code changes or migration smoke against persistent data were
needed. Final ownership, diff, formatting/reference and secret hygiene gates
are recorded in [the checkpoint](../../.agent/tasks/GEO-UI-01/state.md).

## Review and publication boundary

Independent read-only pre-commit security/documentation review PASS with zero
open Critical/High/Medium/Low findings; 29 focused and all 68 frontend tests
were independently rerun. See [the review record](../../.agent/tasks/GEO-UI-01/agents/geo_security_review.md).
GEO-UI-01R separately reviewed the atomic candidate/range and independently
reran all 68 tests and typecheck: PASS, zero open findings. The primary reran
frontend gates, browser QA, Release backend build, all eleven named backend
harnesses and four infrastructure/contract scripts: PASS. Static React tests
exercise real session/query/transport races; browser QA separately covers
mounted interactions. Live backend/OIDC browser QA is not claimed.

The original GEO-UI-01 no-push boundary is superseded only for this explicit
GEO-UI-01R publication/retirement phase. Normal push PASS, main matched origin
at `94831f6`; [Build pipeline #33](https://github.com/CrazyMotoCat/AC_Expluatation/actions/runs/36577605158)
verified that full SHA with successful backend, frontend and required checks.
Only then was the clean historical worktree removed normally. Local `-d`
refused solely because reimplemented history was not an ancestor; after the
authorized SHA/transfer/CI recheck, local `-D` and normal remote deletion
completed. Main and the unchanged clean detached primary checkout remain.

This final documentation checkpoint is a separate narrow main commit. Its
exact SHA is resolved from Git and must pass hosted CI too; final run evidence
is recorded by the GEO-UI-01R completion gate. See
[the current phase checkpoint](../../.agent/tasks/GEO-UI-01R/state.md).
