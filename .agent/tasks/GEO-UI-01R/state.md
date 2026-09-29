# FRONTEND-GEOGRAPHY RECONCILIATION — GEO-UI-01R

TASK: FRONTEND-GEOGRAPHY RECONCILIATION
PHASE: INDEPENDENT REVIEW / PUBLICATION / LEGACY RETIREMENT
STATUS: REVIEW_PASS_READY_FOR_PUBLICATION
CHECKPOINT_STATUS: SAFE
LAST_SAFE_COMMIT: 4adae34dfef99f3bc0b6fe53bbbfdcbd8d74fc6b
BASELINE_SHA: 70d78d7615fd4abbae5a38f65315e27e5831aa81
SOURCE_GEO_UI_COMMIT: 4adae34dfef99f3bc0b6fe53bbbfdcbd8d74fc6b
REMEDIATION_COMMITS: NONE
GEO_RECON_00: COMPLETE
GEO_UI_01: LOCAL_COMMIT_REVIEWED
HISTORICAL_GEO_LOCAL_SHA: df1559d3d89d8d8cfa3bda673c82003ce684ed07
HISTORICAL_GEO_REMOTE_SHA: a48fa4b9a6f4804875daf0fee6e9e03e22818725
WHOLE_BRANCH_MERGED: NO
TRANSFER_METHOD: REIMPLEMENTED_ON_CURRENT_MAIN
HISTORICAL_AUTH_SESSION_CODE: REJECTED

## COMPLETED

- Repository-state-guard SAFE / CLEAN_BASELINE; task-resume reconciled atomic
  candidate transition from original checkpoint. Exact requested SHAs, parent,
  one-ahead main and clean main/legacy/detached checkouts verified after fetch.
- Working directly in existing main at
  C:/Users/mvideo/.codex/worktrees/site-ref-auth/АС Эксплуатация. No new branch
  or worktree. Primary detached checkout remains unchanged at
  173bbfc036eec7a8fb5bdf6e7691836aeb0001e7.
- Exact diff ownership and both historical refs inspected read-only. Useful
  lists/filter/navigation/safe fallback transferred; historical auth/session,
  keys, auth-gap claims, capability placeholder and 404 semantics rejected.
- Independent read-only candidate review PASS, zero findings; see agent record.
- Publication status documentation synchronized; corrected pre-existing Site UI
  backlog status to already published baseline 70d78d7.

## VERIFIED

- Routes /geography/territorial-zones and /geography/regions are unique;
  Site routes/navigation/session controls retained. Both lists render backend
  fields and loading/empty/error/refresh/retry states.
- Runtime Region URL exactly /api/v1/regions; DOUBLE_API_PREFIX NONE.
  One complete Region DTO/loader; Site selectors share only unfiltered key.
- Authorized Zone labels only; hidden/pending/failed parent lookup uses
  Зона недоступна. Regions survive enrichment failure; no detail probing.
- URL filter select/clear/reload/Back/Forward and unrelated param preservation
  PASS. Filter is backend business input only, never authorization evidence.
- Current shared client, user/context/resource/filter keys and AbortSignal
  PASS. No manual credentials, local scopes, role/UserType/JWT authorization.
- Real SessionService/query/transport races for Zone and Region PASS:
  A→B, late A after abort, logout then same-user/context new session, new user.
  The shared Zone query also protects Region enrichment. Session foundation
  and Site mutation generation guards unchanged in exact candidate diff.
- Fixed safe error text; neutral 403, no legacy 404 disclosure or raw errors.
- Primary typecheck/lint/full frontend suite 68/68/build/npm audit PASS;
  audit zero vulnerabilities. Independent full 68/68 and focused 62/62 PASS.
- Browser fixture QA rerun PASS: production App/session/client, 39 requests,
  navigation, URL filter/history, A→B data/headers, refresh/retry, hidden/failed/
  pending enrichment, safe errors, Site list/create selector, 320px viewport.
  Screenshot inspected: wrapping nav and internal table scroll, no page overflow.
- Backend Release build PASS (0 warnings/errors). Eleven named Architecture,
  Identity/Sites domain, OIDC, Identity/Audit/Sites/Organization PostgreSQL,
  Sites/Organization API and AuditDelivery harnesses PASS. dotnet test exits 0
  with no discovery; actual verification comes from named harnesses.
- Four DevScripts/CiWorkflow/DatabaseMigrator/API smoke-contract scripts PASS.
- Exact candidate diff --check, source/architecture boundaries, secret hygiene
  PASS. No backend/schema/migration/dependency/current-session changes.
- DOCS_IMPACT YES; DOCUMENTATION_SYNC PASS: Geography/module/capsule/backlog/
  checkpoints checked. DB/OpenAPI/ADR/global standards need no changes.

## NOTES

- React page tests use static snapshots with an adapted subscription hook;
  race assertions execute real session/query/transport. Browser gate covers
  mounted events separately. Live backend/OIDC browser QA is not claimed.
- Initial local lint scanned a Git-ignored QA harness left from GEO-UI-01.
  Exported its Gate component in that ignored fixture only; full lint then PASS.
  No tracked production remediation was needed.
- Candidate has no C# changes. Whole-repository dotnet format baseline issues
  are out of scope; frontend lint and task-owned diff hygiene PASS.
- Hosted CI is accessible through the authenticated in-app GitHub browser;
  unauthenticated REST returns 404 and gh CLI is unavailable.

## DECISIONS

- User explicitly authorizes normal push main after review PASS, separate
  bounded remediation commits if needed, docs/checkpoint commits and legacy
  retirement ONLY after exact-SHA CI PASS. Never amend original candidate.
- If origin/main differs from BASELINE_SHA before first push, stop with
  GEO_UI_REVIEW_BASELINE_CHANGED; never automatically rebase/reset.
- If backend/architecture contract changes are needed, stop with
  GEO_UI_REVIEW_BLOCKED_CONTRACT_CHANGE.
- After push verify final SHA equals origin/main and GitHub run commit link
  matches full SHA; backend/frontend/Verify required checks must all succeed.
- If CI fails or is inaccessible, preserve both historical refs/worktree.
- Only after CI PASS verify clean legacy checkout at recorded local SHA;
  normal git worktree remove its exact secondary path. The explicit owner
  cleanup command supersedes default managed-worktree archival for this phase.
- Delete local feat/frontend-geography with -d; -D allowed solely for expected
  non-ancestor history after transfer/SHA/CI recheck. Verify remote unchanged
  then git push origin --delete feat/frontend-geography. Never remove main
  or detached checkout. Report other intentional worktrees without deleting.
- Final retirement/evidence checkpoint may require a narrow docs commit and
  ordinary push; verify hosted CI for that final SHA too before completion.

## FILES_CHANGED / UNCOMMITTED

- .agent/tasks/GEO-UI-01/state.md
- .agent/tasks/GEO-UI-01R/state.md
- .agent/tasks/GEO-UI-01R/agents/geo_independent_review.md
- docs/backlog.md; docs/modules/sites.md; docs/context/sites.context.md
- src/frontend/GEOGRAPHY.md
- Only review/publication documentation. Source unchanged; ignored QA/log files
  remain local and are never staged. Reviewer WRITE_SCOPE NONE.
- This checkpoint enters its own atomic docs commit. Once committed, expected
  main is clean; resolve the transition SHA with git log -1 --format=%H -- this
  file. Only candidate plus reviewed documentation may follow BASELINE_SHA.

## PENDING

- Review/stage/commit narrow documentation, fetch/recheck baseline and push.
- Verify exact pushed SHA hosted backend/frontend/required-check CI and record
  run URL, then retire only named legacy worktree/local/remote branch.
- Final clean Git verification and evidence checkpoint; stop product work.

BLOCKERS: NONE
OPEN_CRITICAL: 0
OPEN_HIGH: 0
OPEN_MEDIUM: 0
OPEN_LOW: 0
PUSH: NOT_YET_RUN
HOSTED_CI: NOT_YET_VERIFIED
LEGACY_GEO_WORKTREE_REMOVED: NO
LEGACY_GEO_LOCAL_BRANCH_REMOVED: NO
LEGACY_GEO_REMOTE_BRANCH_REMOVED: NO
NEXT_ACTION: After the atomic docs commit, fetch/recheck BASELINE_SHA and normally push main.

## DO_NOT_REPEAT

- Do not recreate/cherry-pick/merge Geography, create branches/worktrees, amend
  candidate, reset/clean/stash unknown work, broaden backend formatting or start
  the next product phase. Completed local gates need rerun only if invalidated.
- Do not touch legacy or detached checkout before exact-SHA CI PASS.
