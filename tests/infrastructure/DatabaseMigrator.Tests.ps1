$ErrorActionPreference = 'Stop'

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$migratorProject = Join-Path $repositoryRoot 'src/backend/Exploitation.DatabaseMigrator/Exploitation.DatabaseMigrator.csproj'
$connectionVariable = 'ConnectionStrings__Database'
$previousConnection = [Environment]::GetEnvironmentVariable($connectionVariable, 'Process')

try {
    [Environment]::SetEnvironmentVariable($connectionVariable, $null, 'Process')
    $missingConfigurationOutput = & dotnet run `
        --project $migratorProject `
        --configuration Release `
        --no-build 2>&1
    $missingConfigurationExitCode = $LASTEXITCODE

    if ($missingConfigurationExitCode -eq 0) {
        throw 'DatabaseMigrator accepted missing ConnectionStrings:Database configuration.'
    }

    if (($missingConfigurationOutput -join "`n") -notmatch 'ConnectionStrings:Database is required') {
        throw 'DatabaseMigrator did not report the canonical missing connection configuration.'
    }

    [Environment]::SetEnvironmentVariable(
        $connectionVariable,
        'Host=unused-for-registration-check',
        'Process')

    $registrationOutput = & dotnet run `
        --project $migratorProject `
        --configuration Release `
        --no-build 2>&1
    $registrationExitCode = $LASTEXITCODE
    $registrationText = $registrationOutput -join "`n"

    if ($registrationExitCode -eq 0) {
        throw 'DatabaseMigrator unexpectedly connected with the registration-check connection string.'
    }

    if ($registrationText -notmatch 'REGISTERED_MODULE_CONTEXTS: 5') {
        throw 'DatabaseMigrator did not discover the Assets, Audit, Identity, Organization, and Sites module contexts.'
    }

    if ($registrationText -notmatch 'DATABASE_MIGRATION_FAILED: .*AssetsDbContext') {
        throw 'DatabaseMigrator did not attribute the expected first connection failure to AssetsDbContext.'
    }
}
finally {
    [Environment]::SetEnvironmentVariable($connectionVariable, $previousConnection, 'Process')
}

Write-Host 'DatabaseMigrator configuration and module registration checks passed.'
