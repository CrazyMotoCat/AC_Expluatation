# FRONTEND-AUTH-01 — standalone auth split

TASK: FRONTEND-AUTH-01
STATUS: AUTH_SPLIT_COMPLETE; independent integration review pending
CHECKPOINT_STATUS: SAFE
PHASE: AUTH_SPLIT
BRANCH: feat/frontend-auth-standalone
LAST_SAFE_COMMIT: 30241ec0006164edaf5b41b97721fb7c4f93778e (standalone auth commit before review remediation)
SOURCE_AUTH_COMMIT: df1559d3d89d8d8cfa3bda673c82003ce684ed07
SOURCE_PARENT: a48fa4b9a6f4804875daf0fee6e9e03e22818725

COMPLETED:
- Recreated OIDC Authorization Code + PKCE session, shared Bearer client, backend-owned working contexts, and scoped Query cache reset on the current main frontend shell.
- Kept Geography read views, navigation, tests, documentation and FRONTEND-PAR-01 checkpoint outside this branch.
- Hardened session loss handling when OIDC storage disappears or renewal fails.
- Independent review found and fixed out-of-order context selection responses: only the latest request can update the selected header/context and cache.
- Synchronized frontend setup, Identity module documentation and context capsule.

VERIFIED:
- `npm ci`: PASS; npm audit reported 0 vulnerabilities.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm test`: PASS (25 tests in 4 files, including reversed context response ordering).
- `npm run build`: PASS.
- Backend endpoint source matches `/api/v1/me`, `/api/v1/me/contexts`, and `/api/v1/me/context` DTOs and methods.
- No backend, Geography, or FRONTEND-PAR-01 files changed.
- OIDC userStore uses sessionStorage; only backend-owned contexts are selectable. No frontend permission derivation or capabilities implementation.

UNCOMMITTED: NONE after this standalone feature commit.
PENDING:
- Independent security/integration review of this commit; main integration is a separate phase.
- Live Keycloak smoke requires an actually registered public SPA client ID. The repo has no configured client ID.
DECISIONS:
- Owner required a standalone auth commit based on b4973e0 and expressly excluded a48fa4b / FRONTEND-PAR-01.
- The frontend context header is request-scoped and does not grant permission; AUTH-SCOPE-01 Phase A remains unchanged.
REVIEW_FINDING: F-01 MEDIUM — stale `POST /me/context` response could overwrite a newer choice; remediated in a separate review commit.
BLOCKERS: None for this local split; live Keycloak smoke is BLOCKED_CONFIGURATION.
FILES_CHANGED: Auth/session/client/provider/config/tests, related Identity and dev setup docs, and this checkpoint only.
NEXT_ACTION: Independently review and integrate the standalone auth commit into main after a fresh repository guard.
DO_NOT_REPEAT: Do not cherry-pick df1559d or merge feat/frontend-geography. Do not start AUTH-SCOPE-01 B1 or TASK-02.03.02 in this phase.
