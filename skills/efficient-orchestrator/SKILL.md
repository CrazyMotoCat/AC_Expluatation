---
name: efficient-orchestrator
description: Optimize Codex coding work for limited usage budgets by deciding when the primary agent should work directly, when to delegate to subagents, how many parallel writers to use, and which capability/cost tier should handle architecture, implementation, research, testing, and review. Use for non-trivial software-development tasks, especially on ChatGPT Plus or other quota-constrained Codex usage, when a task can span multiple files, subsystems, frontend/backend/database work, debugging, refactoring, or parallel implementation. Also use when the user asks for economy, balanced, fast, or quality execution modes. Do not trigger for tiny edits where delegation would add overhead.
---

# Efficient Orchestrator

Optimize for useful completed work per usage budget without sacrificing correctness.

## Core ownership

Keep the primary agent as the single owner of:
- task interpretation;
- architecture and contract decisions;
- decomposition;
- dependency ordering;
- integration;
- final verification;
- user-facing completion report.

Do not create a hierarchy of autonomous orchestrators. Subagents should normally report back to the primary agent and must not recursively spawn additional subagents unless the user explicitly asks for nested orchestration.

## Default mode

Use **BALANCED** unless the user explicitly requests another mode.

Supported modes:
- **ECONOMY** — minimize usage.
- **BALANCED** — best default ratio of usage, speed, and quality.
- **FAST** — prioritize wall-clock speed when tasks are genuinely independent.
- **QUALITY** — spend more on verification and independent review for high-risk changes.

If the user specifies a mode, preserve it for the current task.

## First pass: classify before acting

Before editing, classify the task:

### T0 — trivial/local
Examples:
- typo or copy edit;
- obvious one-file fix;
- narrow configuration change;
- mechanical change with no architectural ambiguity.

Action: work directly. Do not delegate.

### T1 — focused
Characteristics:
- one subsystem;
- a few related files;
- no major public contract or schema change;
- implementation path is already clear.

Action: primary agent normally implements directly. Delegate only a narrow discovery or verification task if it will reduce context or avoid redundant exploration.

### T2 — multi-part
Characteristics:
- several components;
- meaningful investigation;
- frontend/backend split;
- implementation and tests can be separated;
- multiple independent code areas.

Action: primary agent plans first, then delegate only independent work units.

### T3 — architectural/high-risk
Characteristics:
- database schema or migrations;
- public API contracts;
- auth/security;
- cross-cutting refactor;
- concurrency or distributed behavior;
- difficult production bug;
- several tightly coupled subsystems.

Action: primary agent makes the architecture and sequencing decisions first. Parallelize only after contracts are stabilized.

## Independence test

Treat two work items as safe to run in parallel only when all are true:
1. They can be described with stable inputs and expected outputs.
2. Neither depends on unfinished code from the other.
3. They do not need to modify the same contract, schema, migration sequence, shared generated file, or central configuration.
4. They can be integrated with low conflict risk.
5. Each can be verified independently.

If any item fails, sequence the work instead of parallelizing it.

Read `references/delegation-policy.md` when choosing agent count, role, or execution mode.

## Capability and cost routing

Route work by capability need, not prestige.

### Primary / strongest tier
Use for:
- architecture;
- ambiguous requirements;
- difficult debugging;
- database and public API design;
- cross-subsystem reasoning;
- resolving conflicting implementations;
- final integration and high-level review.

### Implementation / mid-cost tier
Use for:
- ordinary feature implementation;
- backend endpoints and services;
- frontend components and forms;
- migrations after the design is settled;
- routine refactors;
- standard tests.

### Scout / lowest-cost capable tier
Use for:
- repository search;
- finding usages and affected files;
- reading logs;
- locating tests;
- summarizing a small set of relevant files;
- lint/type-check cleanup;
- mechanical edits;
- running focused verification;
- documentation lookup.

When model-specific delegation is supported, prefer the user's currently available equivalents. On a setup exposing **Sol / Terra / Luna**, use:
- Sol-like tier for primary reasoning and integration;
- Terra-like tier for implementation;
- Luna-like tier for bounded discovery, routine verification, and mechanical work.

Do not assume those exact model names exist. Fall back to the nearest available capability/cost tier.

Do not spend a strongest-tier agent on broad repository exploration unless the exploration itself requires architectural judgment.

## Context economy

Before expensive reasoning, obtain only the context required to decide.

Subagents must return concise results:
- relevant files and symbols;
- constraints or dependencies found;
- changes made, if any;
- verification performed;
- unresolved risks;
- recommended next action.

Do not return large raw file dumps when a concise summary plus file paths is enough.

Do not ask multiple agents to perform the same discovery unless independent review is intentionally required by QUALITY mode.

## Write isolation

When multiple subagents write code concurrently:
- prefer separate worktrees or isolated branches if the runtime supports them;
- give each writer a non-overlapping file or subsystem scope;
- state which contracts are frozen and must not be changed;
- keep integration authority with the primary agent.

If isolation is unavailable and write scopes overlap, reduce concurrency or sequence the changes.

## Escalation

A lower-cost subagent must stop and return to the primary agent when:
- requirements are ambiguous;
- architecture needs to change;
- public contracts or database design must change unexpectedly;
- another workstream must be coordinated;
- the requested scope expands materially;
- two reasonable attempts fail;
- verification exposes a systemic issue.

Do not repeatedly retry a failing problem with the same low-capability profile.

## Verification

Read `references/verification-policy.md` before final integration on T2/T3 tasks or in QUALITY mode.

The primary agent must verify the integrated state, not merely trust subagent summaries.

## Usage guardrails

Optimize by avoiding waste, not by pretending to know the user's exact remaining quota.

Do not:
- claim an exact remaining Plus budget unless the runtime exposes it;
- spawn agents merely because concurrency is available;
- create duplicate writers for the same code path;
- use independent review by default on trivial work;
- keep idle agents alive after their work is complete.

Prefer:
- one strong decision followed by cheaper execution;
- narrow scout tasks before expensive repository-wide reading;
- two good parallel writers over many coupled writers;
- early contract stabilization;
- focused tests before broad tests, then broader verification when warranted.

## Completion report

At the end, report briefly:
- execution mode used;
- what the primary agent handled;
- what was delegated and why;
- verification completed;
- any remaining risk or follow-up.

Do not expose hidden chain-of-thought. Report decisions and outcomes only.
