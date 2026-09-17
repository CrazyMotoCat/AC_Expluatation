# Delegation Policy

Use this file only when the task needs delegation decisions.

## Concurrency matrix

| Mode | Coding writers | Scouts / test helpers | Independent reviewer | Default intent |
|---|---:|---:|---:|---|
| ECONOMY | 0–1 | 0–2, narrowly scoped | 0 | Minimize usage |
| BALANCED | 0–2 | 0–2 | 0–1 when risk justifies | Best overall tradeoff |
| FAST | 0–3 | 0–3 | 0–1 | Reduce wall-clock time |
| QUALITY | 0–2 | 0–2 | 1 for T2/T3 or critical changes | Maximize confidence |

These are ceilings, not targets. Use fewer agents whenever possible.

## Delegation decision

Delegate only when at least one benefit is material:
- true parallelism;
- lower-cost execution for a well-bounded task;
- context isolation;
- independent verification;
- specialized investigation.

Keep work on the primary agent when:
- the task is T0 or simple T1;
- the change is tightly coupled;
- delegation requires explaining more context than the task itself;
- the likely merge cost exceeds the parallelism benefit.

## Role templates

### Scout
Goal: reduce uncertainty cheaply.

Good assignments:
- locate relevant modules and symbols;
- trace one data flow;
- find tests for a component;
- inspect logs and summarize evidence;
- identify all call sites of a symbol;
- check current repository conventions.

Expected return:
1. Findings.
2. Exact file paths and symbols.
3. Constraints.
4. No speculative redesign unless explicitly asked.

Default: read-only.

### Implementation worker
Goal: implement one bounded work package.

Assignment must include:
- exact scope;
- frozen contracts;
- files or subsystem ownership;
- acceptance criteria;
- tests to run;
- what must not be changed.

Expected return:
1. Files changed.
2. Behavior implemented.
3. Tests/checks run and results.
4. Any deviation or unresolved issue.

### Reviewer
Goal: independently inspect an integrated change.

Use mainly in QUALITY mode or high-risk T3 work.

Review for:
- correctness;
- contract mismatches;
- migration hazards;
- security or permission mistakes;
- missing tests;
- regression risk.

Reviewer should not rewrite the feature unless asked. Return prioritized findings.

## Dependency patterns

### Safe parallel example
- worker A: backend endpoint using already-frozen API schema;
- worker B: frontend component against that frozen schema;
- scout: find existing tests and fixtures.

### Unsafe parallel example
- worker A: redesign database schema;
- worker B: write migration against unknown final schema;
- worker C: change API objects derived from that schema.

Sequence the unsafe example:
1. primary agent finalizes schema;
2. migration and API implementation can then run in parallel if scopes are independent;
3. integrate;
4. test.

## Budget-aware defaults for Plus-like quotas

Use relative tiers rather than hardcoded message counts:
- strongest tier: scarce; reserve for reasoning and integration;
- implementation tier: default for bounded coding;
- cheapest capable tier: default for search, routine checks, and mechanical work.

Do not create a subagent for a task likely to take less effort than briefing, monitoring, and integrating it.

## Stop conditions

Stop adding parallel workers when:
- two writers already touch shared contracts;
- merge conflicts become likely;
- the primary agent is waiting on dependency resolution rather than independent work;
- additional workstreams would duplicate repository exploration;
- verification capacity is becoming the bottleneck.
