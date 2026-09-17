# Git Safety Policy

Use this reference when the repository has no baseline, a large dirty tree, or an interrupted task.

## Safe ordering before first baseline

1. Confirm repository root.
2. Inspect `.gitignore`.
3. Confirm `.env` and local secrets are ignored.
4. Inspect untracked files.
5. Exclude build/container/runtime artifacts.
6. Run relevant build/config validation.
7. Create a baseline commit only if commit creation is authorized.

## Never infer ownership

An unknown modified/untracked file may belong to the user or another agent.
Do not delete, reset, overwrite, or normalize it merely to obtain a clean tree.

## Commit granularity

Prefer recoverable atomic commits after coherent verified phases.
Do not commit knowingly broken intermediate state as a safe checkpoint.

Temporary implementation commits may later be squashed according to project workflow, but recoverability takes priority while work is active.

## Agent state files

`.agent/tasks/**` may be tracked if project policy uses them for resumability.
They must never contain secrets or copied `.env` values.

## Docker state

Persistent Docker volumes are not Git recovery points.
Before destructive volume operations, understand what data will be removed.
Never run `docker compose down -v` as generic cleanup during resume/recovery.
