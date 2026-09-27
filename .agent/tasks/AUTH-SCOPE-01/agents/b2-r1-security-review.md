# AUTH-SCOPE-01 B2-R1 independent security review handoff

AGENT: b2_r1_security_review
ROLE: Independent read-only reviewer
STATUS: COMPLETE — F1/F2 remediation review passed on the uncommitted B2-R1 worktree
WRITE_SCOPE: NONE
SOURCE_B2_COMMIT: 2f5ca8b8b4f5ff2827eaef0f807bfa7812863a88

## Verdict

- F1 CLOSED: public Identity target accepts only exact kind + ID; evaluator does not expand Zone to Region. Sites direct checks obtain the persisted Region parent and effective scopes for the exact permission.
- F2 CLOSED: public authorized list operations take business inputs, request fixed `sites.read` scopes internally and filter in Sites SQL. The scope-bearing public store/request were removed; concrete list implementation is internal.
- The optional Region Zone filter narrows authorized rows and was verified in PostgreSQL checks.
- OPEN_CRITICAL: 0; OPEN_HIGH: 0; OPEN_MEDIUM: 0; OPEN_LOW: 0.
- NOTE: Sites PostgreSQL list checks inject a fake scope provider; the real Identity provider, validity and contractor fail-closed behavior are tested in the separate Identity PostgreSQL harness. No single combined provider/list integration test was added.
- NOTE: Historic B2-B2 descriptions remain as history and are followed by ADR-016/B2-R1 supersession. No active documentation contradiction remains.
- Production Geography routes, schema, migrations, Site checkpoint and cross-module database dependencies were unchanged.

NEXT_ACTION: Commit the verified remediation on top of the original B2 source commit, then perform independent B2 remediation integration review before publication.
