# AUTH-SCOPE-01 B2 final adversarial security review — 2026-09-27

STATUS: PASS on cumulative `a3167e85115875c48737f7af10007366e2beaa69..23eb97bfb6642061f8f2a95a8f585fd27380d542` plus the focused provider-to-list test in this review commit.

## Adversarial result

- F1 CLOSED. The public Identity Region target accepts one Region ID and the evaluator tests exact Region scope only. The Sites direct service resolves the Region parent from Sites persistence and requests effective scopes for the operation's permission. PostgreSQL checks deny a forged wrong-Zone grant and sibling/upward escalation; persisted parent-Zone and exact Region grants allow.
- F2 CLOSED. Public Sites list methods accept user/context and an optional narrowing Zone filter, with no scope collection or permission argument. Their internal implementation requests `sites.read` from `IEffectiveScopeProvider` and applies Zone/Region predicates in Sites SQL. The former public scope-bearing request/store and DI registration are absent.
- The new real-provider PostgreSQL check composes production Identity and Sites DI, persists an INTERNAL user/context, `sites.read` Zone A and `sites.change` Zone B assignments, and calls the public list service. Only Zone A and its Region are returned; a Zone B filter yields no rows. After revoking the read assignment, both lists are empty despite the remaining change assignment. No scopes are injected into the list service.
- The Identity eligibility query requires active INTERNAL user/context, ownership, active role, exact permission, active valid assignment, and supported exact scope. Contractor, wrong context, wrong permission, empty/unsupported scope and failed dependency paths do not yield positive authorization. Identity accesses no Sites persistence; Sites accesses no Identity persistence.
- Production Geography routes, Site target, schema and migrations are unchanged. C1 has not started.

OPEN_CRITICAL: 0
OPEN_HIGH: 0
OPEN_MEDIUM: 0
OPEN_LOW: 0
HIGHEST_SEVERITY: NONE

NOTE: The focused cross-module test closes the earlier provider-to-list integration evidence gap. The new test adds Identity project references only to the Sites integration harness, not to Sites production projects.

NEXT_ACTION: Commit the focused review test and this evidence on the B2 branch, then fast-forward main only after the remaining pre-integration gates pass.
