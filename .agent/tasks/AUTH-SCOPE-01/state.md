TASK: AUTH-SCOPE-01
STATUS: DONE — Phase A contract only
CONTRACT_FROZEN: YES
OD-01: RESOLVED
OD-02: RESOLVED
OD-03: RESOLVED
OD-04: RESOLVED
OD-05: RESOLVED
OD-06: RESOLVED
ADR_013: ACCEPTED
PRODUCTION_IMPLEMENTATION_STARTED: NO
MIGRATION_REQUIRED_PHASE_A: NO
BUILD_RUNTIME_TESTS: NOT_REQUIRED — documentation/contract phase only
CHECKPOINT_STATUS: SAFE
PHASE: A
LAST_SAFE_COMMIT: 693f54b980d66a51246b714fadecce4c12741134

COMPLETED:
- Verified repository implementation for JWT, `/api/v1/me`, Identity
  assignments/role permissions/contexts, production deny grant source,
  target-blind `HasGrantAsync`, and Sites geography permissions.
- Received owner approval for OD-01 through OD-06, one question at a time.
- Recorded exact Phase A contract in `phase-a-contract.md` and Accepted
  ADR-013, which clarifies ADR-007 without replacing it.
- Synchronized ADR index, backlog, Identity/Sites context and module docs,
  security and API guidance with the future contract and current runtime state.

VERIFIED:
- Initial Git guard: main at LAST_SAFE_COMMIT, clean against origin/main.
- Exact `AUTH-SCOPE-01` task absent from pre-existing backlog; owner-provided
  task text is the task contract. No attached preflight file found in repo.
- ADR-007 and current code inspected; no runtime implementation was changed.
- Documentation impact: YES; documentation sync covers ADR index, backlog,
  Identity/Sites capsules, security and API guidance.
- `git diff --check`, untracked Markdown whitespace check and final
  changed-file review: PASS; only task documentation/checkpoint files changed.
- Task documentation/reference consistency: PASS; no claim that the planned
  evaluator, capabilities route or Development fixture is implemented.
- Secret hygiene on task-owned changed files: PASS.
- No canonical repository Markdown lint or ADR link-check script was found.
- Build/runtime tests and migrations: NOT_APPLICABLE for documentation-only
  Phase A. Hosted CI is checked separately after publishing.

UNCOMMITTED: None expected after the Phase A documentation commit. The
preceding `LAST_SAFE_COMMIT` is the parent baseline; the task commit is the
commit containing this checkpoint and ADR-013.

DECISIONS:
- OD-01: scope-filtered Zone/Region lists.
- OD-02: Region create by effective `sites.create` and parent Zone scope;
  root Zone creation closed.
- OD-03: separate context/target-aware application authorization contract;
  Sites owns authoritative geographic target.
- OD-04: separate target-specific backend capabilities endpoint for UX only.
- OD-05: explicit, repeatable, limited Development OIDC/Identity bootstrap.
- OD-06: INTERNAL user/context evaluator first; contractor chain fail-closed.

BLOCKERS: None for Phase A. Phase B is not authorized in this request.
PENDING: B1/B2/C1/C2/C3/C4 implementation and verification, only after an
explicit next-phase request.
FILES_CHANGED: `.agent/tasks/AUTH-SCOPE-01/phase-a-contract.md`,
`.agent/tasks/AUTH-SCOPE-01/state.md`, `docs/adr/ADR-013-target-aware-production-authorization.md`,
`docs/adr/README.md`, `docs/backlog.md`, `docs/modules/identity.md`,
`docs/context/identity.context.md`, `docs/context/sites.context.md`,
`docs/security.md`, `docs/api-guidelines.md`.
NEXT_ACTION: PHASE B1 — Identity evaluator (NOT STARTED). On an explicit B1
request, run task-resume/repository-state-guard, reconcile this checkpoint
with Git, then implement only B1 from the frozen contract.
DO_NOT_REPEAT: Do not re-ask OD-01…OD-06; do not treat the Approved ADR as
implemented; do not open root Zone, Organization or contractor grants; do not
start B1 under the Phase A finalization request.
