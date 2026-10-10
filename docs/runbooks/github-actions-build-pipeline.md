# GitHub Actions build pipeline

`Build pipeline` is the repository's only CI workflow at this stage. It runs on a clean GitHub-hosted Linux runner for pushes to `main` and for pull requests.

The workflow uses the toolchain contracts already committed to the repository:

- .NET SDK from `global.json`;
- Node.js and npm contract from `src/frontend/package.json`;
- reproducible frontend dependency installation through `npm ci`.

It restores and builds the backend, runs `dotnet test` plus explicit console
domain, architecture, OIDC, Identity, Audit, Sites/Location, Organization/FunctionalDirection
and Assets persistence/API harnesses. The Assets harnesses include real PostgreSQL
hierarchy/authorization/concurrency and Audit atomicity/delivery tests; `dotnet test`
alone does not execute these console projects. Infrastructure and API bootstrap
checks run explicitly. The backend job starts ephemeral PostgreSQL18.6, passes
`ConnectionStrings__Database`, and executes the module migrator twice for clean
apply and idempotency. It discovers five contexts: Assets, Audit, Identity,
Organization and Sites, each owning its schema/EF history. ASSET-TYPE-01 adds one
Assets migration and no Identity/Audit migration. Frontend install/lint/build/tests
continue unchanged. Both jobs retain logs even on failure; local validation is not
proof of hosted CI for an unpushed candidate.

## Required merge check

After the private GitHub remote is created, configure the `main` branch ruleset (or branch protection rule) to require the `Build pipeline / Verify required checks` status check before merging pull requests. The aggregate check succeeds only when both backend and frontend jobs succeed; a failed test therefore prevents the required check from passing.

This repository configuration does not create deployments, publish containers, or use self-hosted runners.
