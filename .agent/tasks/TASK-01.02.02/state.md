# TASK-01.02.02 — Authorization policies

STATUS: DONE
CHECKPOINT_STATUS: SAFE
PHASE: Final integration and documentation gates complete
LAST_SAFE_COMMIT: c9d2bb57fc514ea1c0f2e0174532c8c1e9006383

TASK_CONTRACT:
- An endpoint can require a specific permission.
- Backend returns 403 when the required permission is absent.
- Authorization tests exist.

RISK: HIGH
PARALLELIZABLE: NO
MODEL_ESCALATION_RECOMMENDED: NO (current model Sol, effort High)

COMPLETED:
- Added canonical permission policies and a `RequirePermission` endpoint convention.
- Added a handler that requires an authenticated external identity, active local user, and an explicit permission grant by canonical permission ID.
- Production grant source denies all until access assignments are implemented by a later task.
- Added HTTP authorization tests for 401, missing profile/grant, inactive profile, forged claims, wrong permission, explicit test grant, and revocation.
- Updated Identity module documentation, context capsule, and traceability matrix.
- Independent read-only security review and final documentation review returned PASS.

VERIFIED:
- Release solution build: PASS, zero warnings/errors.
- OIDC and permission authorization checks: PASS.
- Identity domain, architecture, and PostgreSQL persistence checks: PASS.
- API bootstrap smoke and CI workflow checks: PASS.
- Frontend lint, build, and 8 tests: PASS.
- `dotnet test`, format verification, and `git diff --check`: PASS.
- Traceability checker: PASS, AC-01 through AC-03 covered.
- Documentation sync: PASS; no ADR change required.

UNCOMMITTED:
- Scoped implementation, tests, documentation, and review evidence are awaiting the separate task commit.

DECISIONS:
- `GET /api/v1/me` remains an authenticated self-profile bootstrap endpoint; no new production business endpoint is introduced solely for this policy task.
- No user-role assignment, scope, context, validity, contractor grant, or schema change in this task.
- Permission policies are registered only for the migration-seeded canonical catalog; arbitrary token role/permission claims are not entitlements.
- Protected endpoint behavior is exercised using a test-host route and explicit test grant source.

BLOCKERS: NONE

FILES_CHANGED:
- `src/backend/Modules/Identity/Exploitation.Modules.Identity.Application/Authorization/IPermissionGrantSource.cs`
- `src/backend/Modules/Identity/Exploitation.Modules.Identity.Infrastructure/Authorization/NoAccessAssignmentPermissionGrantSource.cs`
- `src/backend/Modules/Identity/Exploitation.Modules.Identity.Infrastructure/IdentityModuleRegistration.cs`
- `src/backend/Exploitation.Api/Authorization/*`
- `src/backend/Exploitation.Api/Authentication/OidcAuthenticationRegistration.cs`
- `tests/integration/Exploitation.AuthenticationChecks/*`
- `docs/modules/identity.md`
- `docs/context/identity.context.md`
- `docs/traceability-matrix.md`
- `.agent/tasks/TASK-01.02.02/agents/authorization-security-review.md`
- `.agent/tasks/TASK-01.02.02/state.md`

PENDING:
- Final diff/secret hygiene, separate task commit, final repository guard.

NEXT_ACTION: Check staged diff and secret hygiene, create the dedicated TASK-01.02.02 commit, then run repository-state-guard.
DO_NOT_REPEAT:
- Do not implement `TASK-01.03.01` assignments or `TASK-01.03.02` contexts here.
- Do not grant permissions from `UserType`, role name, or token claims.
- Do not introduce an artificial production endpoint just to exercise the policy.
