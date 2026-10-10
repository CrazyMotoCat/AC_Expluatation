# ASSET-TYPE-01F1 independent local remediation-diff check

DATE: 2026-10-10
MODE: READ_ONLY; gpt-6-sol/high, fresh independent reviewer; no source/file/stage/commit/push changes.
REVIEW_BASE: c618c1af837326aada23ed7a64b762089223ca5e
SCOPE: F1 authorization/command call sites, structural guard, focused PG tests, docs and actual new runtime logs. This is the local implementation gate, not ASSET-TYPE-01R2 publication review.
RESULT: PASS local remediation diff.
OPEN_CRITICAL/HIGH/MEDIUM/LOW: 0/0/0/0 within this remediation.

CONFIRMED: public DTO-based CanManageAsync removed; CanManageExistingAsync receives context/business IDs/operation and resolves source/destination/parent chain from Assets. Facts evaluator/resolver private. Shared scoped read store/AssetsDbContext carries the command's transaction; all commands lock before authoritative reads/evaluation; immutable explicit GLOBAL/correlated tuple semantics and atomic Audit retained. Missing target cannot become existing-target ALLOW; independent GLOBAL permission eligibility only preserves canonical missing-target404.
CREATE_NOTE: authorization derives child's authority from persisted parent and root's desired direction from published Organization facts. Selectability/ACTIVE-parent/homogeneity remain command business validation. Invalid creation may have permission eligibility but command cannot commit it; this separation is documented and no forged existing facts are accepted.

EVIDENCE_INSPECTED: final source/test diff; artifacts/asset-type-f1-Exploitation.AssetsPersistenceChecks.log (SEC_01_PUBLIC_AUTH_POSTGRESQL PASS and six pg_locks lifecycle orderings); Assets HTTP log; all14 backend logs; Release build0warnings/errors; EF no pending changes; frontend71tests; diff hygiene. Primary independently executed the whole suite, not merely helper summaries.
ORIGINAL_REPRODUCTION: artifacts/asset-type-f1-before-fix.log actual production Identity/PostgreSQL reproduced honest=false/forged=true; replacement public contract denies the persisted D2 target for actual D1 grant.
LIMIT: original immutable c618c1af review evidence remains untouched and historical. SEC-01 closure for publication must be independently established in ASSET-TYPE-01R2 over the exact two-commit range. No publication recommendation for an unreviewed immutable remediation commit.
NEXT_ACTION: create authorized one separate remediation commit after staged review, then STOP for independent R2.
