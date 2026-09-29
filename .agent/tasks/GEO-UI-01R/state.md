# FRONTEND-GEOGRAPHY RECONCILIATION — GEO-UI-01R

TASK: FRONTEND-GEOGRAPHY RECONCILIATION
PHASE: INDEPENDENT REVIEW / PUBLICATION / LEGACY RETIREMENT
STATUS: FINAL_DOC_CHECKPOINT_TRANSITION
CHECKPOINT_STATUS: SAFE
LAST_SAFE_COMMIT: 94831f6ec5b6afc8ab118d0ed42fd2cadd2e08d1
BASELINE_SHA: 70d78d7615fd4abbae5a38f65315e27e5831aa81
SOURCE_GEO_UI_COMMIT: 4adae34dfef99f3bc0b6fe53bbbfdcbd8d74fc6b
REMEDIATION_COMMITS: NONE
GEO_RECON_00: COMPLETE
GEO_UI_01: PUBLISHED
REVIEW_DOC_COMMIT: 94831f6ec5b6afc8ab118d0ed42fd2cadd2e08d1
PUBLICATION_SHA: 94831f6ec5b6afc8ab118d0ed42fd2cadd2e08d1
HOSTED_CI_RUN: 36577605158
HOSTED_CI_URL: https://github.com/CrazyMotoCat/AC_Expluatation/actions/runs/36577605158
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
- Narrow reviewed docs commit 94831f6 created; repeated fetch confirmed baseline
  unchanged, then normal push PASS. main equals origin/main at PUBLICATION_SHA.
- Authenticated GitHub run commit link matches the full PUBLICATION_SHA.
  Run 36577605158 status Success: backend 3m10s, frontend 29s, Verify required
  checks 3s, all completed successfully.
- After that exact-SHA CI PASS, rechecked both historical SHAs and clean
  secondary checkout. Removed C:/Users/mvideo/Documents/ChatGPT/АС Эксплуатация-FE
  with normal git worktree remove. No force removal.
- Local -d refused solely because history was not fully merged; verified
  non-ancestor history, recorded transfer/SHAs and green CI again, then used
  explicitly authorized -D. Remote exact a48fa4b ref rechecked, deleted normally.
- Fetch/prune confirms local main only, remote origin/main plus origin/HEAD,
  main worktree and unchanged clean detached primary at 173bbfc only.
- Final publication/retirement documentation synchronized. No source remediation.

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
- docs/modules/sites.md; docs/context/sites.context.md
- src/frontend/GEOGRAPHY.md
- Only final publication/retirement documentation. Backlog and independent
  review record were already committed at 94831f6. Source unchanged; ignored
  QA/log/completion files remain local and are never staged.
- This checkpoint enters its own atomic final docs commit. Once committed,
  expected main is clean; resolve FINAL_MAIN_SHA/DOC_STATUS_COMMIT with
  git log -1 --format=%H -- this file. That commit must follow 94831f6 and change
  only these documents. LAST_SAFE_COMMIT is the preceding CI-verified SHA.

## FINAL COMPLETION GATE

- Normally commit/push this final docs checkpoint, guarding origin/main remains
  PUBLICATION_SHA. Then verify hosted backend/frontend/required checks at its
  own full FINAL_MAIN_SHA, and final Git clean/equal/ref/worktree state.
- Save actual final SHA/run evidence in
  [the local completion report](../../../artifacts/geo-ui-01r/final-report.md)
  (ignored evidence artifact). It resolves this atomic transition to COMPLETE
  without another self-referential docs commit/CI cycle.
- On resume derive the final checkpoint SHA from Git, inspect that report if
  present, and verify its exact SHA/run against main/origin. If it is absent or
  mismatched, verify the final checkpoint's GitHub run before declaring COMPLETE.
- Retirement itself is already complete and must not be repeated.

BLOCKERS: NONE
OPEN_CRITICAL: 0
OPEN_HIGH: 0
OPEN_MEDIUM: 0
OPEN_LOW: 0
PUSH: PASS
HOSTED_CI: PASS_AT_PUBLICATION_SHA
HOSTED_BACKEND: PASS
HOSTED_FRONTEND: PASS
HOSTED_REQUIRED_CHECKS: PASS
LEGACY_GEO_WORKTREE_REMOVED: YES
LEGACY_GEO_LOCAL_BRANCH_REMOVED: YES
LEGACY_GEO_REMOTE_BRANCH_REMOVED: YES
BRANCHES_FINAL: main; origin/main; origin/HEAD -> origin/main
WORKTREES_FINAL: existing main; intentional detached primary at 173bbfc
FINAL_CHECKPOINT_CI: VERIFY_OWN_FINAL_SHA_AFTER_ATOMIC_COMMIT
NEXT_ACTION: Normally publish this final docs checkpoint, verify its own exact-SHA CI, record completion and STOP.

## DO_NOT_REPEAT

- Do not recreate/cherry-pick/merge Geography, create branches/worktrees, amend
  candidate, reset/clean/stash unknown work, broaden backend formatting or start
  the next product phase. Completed local gates need rerun only if invalidated.
- Legacy retirement already completed after CI PASS; do not recreate its refs.
  Detached primary remains intentionally untouched. Do not start next product.
