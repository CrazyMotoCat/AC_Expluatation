# AUTH-SCOPE-01 B2 independent security review handoff

AGENT: b2_security_review
ROLE: Independent read-only reviewer
STATUS: COMPLETE — review failed pending trust-boundary remediation
WRITE_SCOPE: NONE
SOURCE_B2_COMMIT: 2f5ca8b8b4f5ff2827eaef0f807bfa7812863a88
SOURCE_PARENT: a3167e85115875c48737f7af10007366e2beaa69

## Output

- F1 / HIGH: public `TrustedAuthorizationScope` construction and
  `ForRegion(zoneId, regionId)` let callers pass a forged Region parent to the
  registered Identity evaluator without Sites validation. The Sites resolver
  path itself uses the persisted parent. No HTTP route exposure was proven.
- F2 / MEDIUM: public `ScopedGeographyReadRequest` and registered
  `IScopedGeographyReadStore` trust fabricated scopes and a caller-provided
  `sites.read` label without requiring the Identity provider. No HTTP route
  exposure was proven.
- Both findings fail the explicit B2 application-boundary acceptance checks;
  integration requires zero open HIGH/MEDIUM findings.

## Invariant summary

- Commit parent, B2-only file scope, shared B1/B2 query semantics, exact
  permission scopes, `[valid_from, valid_to)` boundaries, Sites-owned SQL
  filtering, empty-scope behavior, cross-module DB boundary, N+1 behavior,
  contractor fail-closed, and ADR numbering: PASS by source review.
- Trusted target projection and scoped-list composition: safe through the
  intended Sites composition, but not enforced against direct public contract
  use (F1/F2).
- Production Geography routes, Site scope, capabilities, DEV bootstrap,
  contractor-positive logic, migrations, and frontend changes: absent.
- `git diff --check`: PASS. Tests were not run by this reviewer.

NEXT_ACTION: Owner resolves whether an ADR-level change may revise the public
target/scope evidence handoff. Do not integrate or push until F1/F2 are fixed
and independently reviewed.
