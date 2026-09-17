# GitHub Actions build pipeline

`Build pipeline` is the repository's only CI workflow at this stage. It runs on a clean GitHub-hosted Linux runner for pushes to `main` and for pull requests.

The workflow uses the toolchain contracts already committed to the repository:

- .NET SDK from `global.json`;
- Node.js and npm contract from `src/frontend/package.json`;
- reproducible frontend dependency installation through `npm ci`.

It restores and builds the backend, runs backend unit tests, architecture checks, infrastructure script checks, and the API bootstrap integration smoke test. It also installs, lints, builds, and unit-tests the frontend. Backend and frontend logs are retained as GitHub Actions artifacts even when a job fails.

## Required merge check

After the private GitHub remote is created, configure the `main` branch ruleset (or branch protection rule) to require the `Build pipeline / Verify required checks` status check before merging pull requests. The aggregate check succeeds only when both backend and frontend jobs succeed; a failed test therefore prevents the required check from passing.

This repository configuration does not create deployments, publish containers, or use self-hosted runners.
