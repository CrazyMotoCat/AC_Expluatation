# Verification Policy

Use this policy for T2/T3 tasks, QUALITY mode, or whenever multiple writers contributed.

## Verification ladder

Run the cheapest focused checks first, then expand as justified.

1. Static sanity
   - inspect changed files;
   - check imports, types, generated artifacts, and obvious contract mismatches.

2. Focused checks
   - tests for changed modules;
   - targeted type-check/lint;
   - migration dry-run or schema validation when applicable.

3. Integration checks
   - affected service/API/UI path;
   - relevant cross-module tests;
   - build or compile step.

4. Broader regression checks
   - wider test suite when risk, scope, or project policy justifies it.

Do not run expensive broad suites repeatedly when a cheap focused check would expose the same failure first.

## Multi-agent integration checklist

The primary agent must confirm:
- frozen contracts were respected;
- parallel writers did not independently redefine the same concept;
- naming and data types align across boundaries;
- migration ordering is valid;
- generated files are consistent;
- tests reflect final integrated behavior, not a stale intermediate contract.

## Reviewer routing

Use an independent reviewer when:
- QUALITY mode is selected for T2/T3;
- authentication, authorization, security, money, data loss, or irreversible migration risk is involved;
- the integrated diff is too cross-cutting for reliable self-review.

A reviewer may use a strong tier when the risk justifies it. Otherwise use a cheaper capable tier.

## Failure handling

When verification fails:
1. identify whether the failure is local, integration-related, or architectural;
2. send local failures back to the responsible worker if the contract is still valid;
3. return integration or architectural failures to the primary agent;
4. do not let multiple agents independently patch the same failing contract;
5. re-run the narrow failing check before broader suites.

## Completion threshold

Do not call the task complete until:
- requested behavior is implemented;
- required checks pass or failures are explicitly explained;
- integrated changes are reviewed by the primary agent;
- known risks are reported.
