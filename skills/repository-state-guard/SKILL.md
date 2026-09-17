---
name: repository-state-guard
description: Protect Codex development work from unsafe Git/repository states. Use before substantial T2/T3 tasks, before multi-agent writing, after interrupted sessions, before risky migrations or infrastructure changes, and whenever the repository has no commits, a large untracked tree, unknown dirty changes, or an unclear recovery point. Classify repository safety, require a recoverable baseline/checkpoint, prevent destructive recovery, and provide a safe handoff/resume state. Do not trigger for tiny read-only tasks unless repository safety is itself the issue.
---

# Repository State Guard

Ensure the repository is recoverable before expensive or parallel work begins.

## Core principle

> Repository state must be sufficient to recover work without relying on chat history.

The guard does not replace `efficient-orchestrator` or `as-exploitation-orchestrator`.
It runs as a safety gate around them.

## When to run

Run this skill before:
- T2/T3 implementation;
- multi-agent writing;
- schema/migration changes;
- infrastructure changes with persistent state;
- destructive/refactoring work across many files;
- resuming after a session/usage interruption;
- handing work to another agent.

Also run it whenever:
- Git has no commits;
- the repository is largely untracked;
- there are unknown dirty changes;
- the last safe checkpoint is unclear;
- a prior agent report says `LAST_SAFE_COMMIT: NONE`.

## First-pass checks

Inspect, without modifying anything:

```text
git rev-parse --is-inside-work-tree
git status --short --branch
git log -1 --oneline
git diff --stat
git diff
```

When relevant also inspect:

```text
git ls-files --others --exclude-standard
```

Do not assume a clean state merely because build/tests pass.

## Repository state classification

Classify exactly one primary state:

### NOT_GIT
The working directory is not a Git repository.

### UNBORN
Git is initialized but there is no commit yet.

### CLEAN_BASELINE
At least one commit exists and the worktree is clean.

### DIRTY_EXPECTED
Changes exist, ownership is understood, and they match the active task/checkpoint.

### DIRTY_UNKNOWN
Changes exist whose ownership or purpose is not understood.

### PARTIAL_OR_CORRUPT
There are signs of interrupted generation, conflict markers, truncated structured files, half-created migrations, or otherwise inconsistent state.

## Safety levels

Return one of:

```text
SAFE
SAFE_WITH_CHECKPOINT
BASELINE_REQUIRED
RECONCILIATION_REQUIRED
BLOCKED
```

### SAFE
A known Git baseline exists and the worktree is clean or intentionally controlled.

### SAFE_WITH_CHECKPOINT
Work is in progress, but a known safe commit/checkpoint plus understood diff makes continuation recoverable.

### BASELINE_REQUIRED
Substantial work exists but there is no Git commit/recovery baseline.

Typical case:

```text
repository initialized
+ many project files present
+ LAST_SAFE_COMMIT: NONE
```

Do not begin another large/multi-agent phase until a baseline is created or the user explicitly accepts the risk.

### RECONCILIATION_REQUIRED
Dirty changes exist but ownership/purpose is unclear.

### BLOCKED
The repository has unresolved corruption/conflicts or a destructive action would be unsafe.

## Baseline policy

For a project that has meaningful files but zero commits:

1. Do not pretend checkpoints are fully safe.
2. Report `BASELINE_REQUIRED`.
3. Verify that secrets/build artifacts are ignored.
4. Verify `.env` is not tracked.
5. Verify generated/runtime artifacts are excluded.
6. Recommend a baseline commit before the next substantial task.

Do not automatically create the commit unless project/user policy explicitly permits commits.

Suggested commit intent:

```text
chore(repo): establish initial project baseline
```

The baseline should include only files that belong in source control.

## Checkpoint policy

After each safe atomic phase of T2/T3 work:
- run the narrow relevant checks;
- record what changed;
- record verification performed;
- record the current commit SHA if one exists;
- preserve one concrete next action.

If the project has `.agent/tasks/<TASK-ID>/state.md`, reconcile it with Git.

A checkpoint file is metadata, not a substitute for a real Git baseline.

## Multi-agent gate

Before concurrent writers start, require:
- known base commit;
- understood worktree state;
- no unknown dirty files;
- non-overlapping write ownership;
- a recovery plan for each workstream.

If no base commit exists, default to:

```text
MULTI_AGENT_WRITES: BLOCKED_PENDING_BASELINE
```

Read-only scouts/reviewers may still run.

## Resume after interruption

After an interruption:

1. Inspect Git first.
2. Read the active task state if present.
3. Compare recorded `LAST_SAFE_COMMIT` to actual Git.
4. Compare expected uncommitted files to actual diff.
5. Run the minimum targeted check for the interrupted phase.
6. Continue only when the state is understood.

Never restart the whole task blindly.

## Destructive command guard

Never use automatically:

```text
git reset --hard
git clean -fd
git checkout -- .
git restore .
docker compose down -v
```

Do not delete unknown files or changes.

If destructive recovery is genuinely required, explain:
- what will be lost;
- why recovery cannot proceed safely otherwise;
- which backup/checkpoint exists.

Then require explicit authorization according to project policy.

## Secret hygiene before first commit

Before recommending/creating a first baseline, check at minimum:
- `.env` ignored;
- secrets/tokens/passwords not present in tracked candidates;
- local DB/container data not included;
- IDE/user-specific files excluded where appropriate;
- build output excluded;
- temporary agent/runtime artifacts classified intentionally.

Do not print secret values in reports.

## Interaction with orchestrators

Recommended sequence for non-trivial work:

```text
repository-state-guard
→ efficient-orchestrator
→ as-exploitation-orchestrator
→ implementation/delegation
→ integrated verification
→ repository-state-guard checkpoint check
```

For an interrupted task:

```text
repository-state-guard
→ reconcile task/Git state
→ orchestrator resumes only unfinished work
```

## Completion gate

A task may be functionally `DONE` while repository safety remains weak.
Report both dimensions independently.

Example:

```text
TASK_STATUS: DONE
REPOSITORY_SAFETY: BASELINE_REQUIRED
```

Do not hide the repository risk merely because tests pass.

## Output format

```text
REPOSITORY_STATE_GUARD:
SAFE | SAFE_WITH_CHECKPOINT | BASELINE_REQUIRED | RECONCILIATION_REQUIRED | BLOCKED

GIT_STATE:
NOT_GIT | UNBORN | CLEAN_BASELINE | DIRTY_EXPECTED | DIRTY_UNKNOWN | PARTIAL_OR_CORRUPT

BASE_COMMIT:
<sha | NONE>

DIRTY_SUMMARY:
- ...

SECRET_HYGIENE:
PASS | FAIL | NOT_CHECKED

MULTI_AGENT_WRITES:
ALLOWED | BLOCKED_PENDING_BASELINE | BLOCKED_PENDING_RECONCILIATION

RECOVERY_POINT:
<commit/checkpoint description>

REQUIRED_ACTION:
<one concrete next action>
```

Keep the report compact. Do not dump full diffs unless requested.
