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
        'Host=unused-for-zero-context',
        'Process')

    $zeroContextOutput = & dotnet run `
        --project $migratorProject `
        --configuration Release `
        --no-build 2>&1
    $zeroContextExitCode = $LASTEXITCODE
    $zeroContextText = $zeroContextOutput -join "`n"

    if ($zeroContextExitCode -ne 0) {
        throw "DatabaseMigrator failed the zero-context case: $zeroContextText"
    }

    if ($zeroContextText -notmatch 'REGISTERED_MODULE_CONTEXTS: 0') {
        throw 'DatabaseMigrator did not report zero registered module contexts.'
    }

    if ($zeroContextText -notmatch 'MIGRATIONS_APPLIED: 0') {
        throw 'DatabaseMigrator did not report zero applied migrations.'
    }
}
finally {
    [Environment]::SetEnvironmentVariable($connectionVariable, $previousConnection, 'Process')
}

Write-Host 'DatabaseMigrator zero-context checks passed.'
