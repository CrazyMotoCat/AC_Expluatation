$ErrorActionPreference = 'Stop'

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$workflowPath = Join-Path $repositoryRoot '.github/workflows/build.yml'

if (-not (Test-Path -LiteralPath $workflowPath -PathType Leaf)) {
    throw 'GitHub Actions build workflow is missing.'
}

$workflow = Get-Content -LiteralPath $workflowPath -Raw

$requiredFragments = @(
    'pull_request:',
    'runs-on: ubuntu-latest',
    'actions/setup-dotnet@',
    'global-json-file: global.json',
    'dotnet restore Exploitation.sln',
    'dotnet build Exploitation.sln --configuration Release --no-restore',
    'dotnet test Exploitation.sln --configuration Release --no-build',
    'image: postgres:18.6-bookworm',
    'ConnectionStrings__Database=',
    'Exploitation.DatabaseMigrator.csproj',
    'DatabaseMigrator.Tests.ps1',
    'Exploitation.ArchitectureChecks.csproj',
    'Exploitation.AuthenticationChecks.csproj',
    'Exploitation.IdentityDomainChecks.csproj',
    'Exploitation.SitesDomainChecks.csproj',
    'Exploitation.IdentityPersistenceChecks.csproj',
    'Exploitation.AuditPersistenceChecks.csproj',
    'Exploitation.SitesPersistenceChecks.csproj',
    'Exploitation.SitesApiChecks.csproj',
    'Exploitation.AuditDeliveryChecks.csproj',
    'Exploitation.OrganizationPersistenceChecks.csproj',
    'Exploitation.OrganizationApiChecks.csproj',
    'ApiBootstrapSmoke.Tests.ps1',
    'ApiBootstrapSmoke.Contract.Tests.ps1',
    'actions/setup-node@',
    'node-version-file: src/frontend/package.json',
    'npm ci',
    'npm run lint',
    'npm run build',
    'npm test',
    'actions/upload-artifact@',
    'if: always()',
    'name: Verify required checks'
)

foreach ($fragment in $requiredFragments) {
    if (-not $workflow.Contains($fragment)) {
        throw "Build workflow is missing required fragment: $fragment"
    }
}

if ($workflow -notmatch '(?ms)needs:\s*\r?\n\s*- backend\s*\r?\n\s*- frontend') {
    throw 'The required check does not depend on both backend and frontend jobs.'
}

$migrationStep = $workflow.IndexOf('name: Apply module migrations', [StringComparison]::Ordinal)
$apiStep = $workflow.IndexOf('name: Run API integration smoke tests', [StringComparison]::Ordinal)
if ($migrationStep -lt 0 -or $apiStep -lt 0 -or $migrationStep -ge $apiStep) {
    throw 'The API smoke test must run after the module migration step.'
}

if ($workflow -notmatch '(?ms)- name: Run API integration smoke tests\s*\r?\n\s*timeout-minutes: 5') {
    throw 'The API smoke test must have a bounded five-minute GitHub Actions step timeout.'
}

$migrationStepText = $workflow.Substring($migrationStep, $apiStep - $migrationStep)
if ([regex]::Matches($migrationStepText, 'Exploitation\.DatabaseMigrator\.csproj').Count -lt 2) {
    throw 'The module migration smoke must verify both clean apply and idempotent second execution.'
}

$forbiddenFragments = @(
    '.gitlab-ci.yml',
    'gitlab-ci',
    'jenkins',
    'azure devops',
    'self-hosted',
    'docker push',
    'docker build',
    'deploy',
    'production'
)

foreach ($fragment in $forbiddenFragments) {
    if ($workflow.Contains($fragment)) {
        throw "Build workflow contains out-of-scope CI/CD behavior: $fragment"
    }
}

Write-Host 'GitHub Actions build workflow checks passed.'
