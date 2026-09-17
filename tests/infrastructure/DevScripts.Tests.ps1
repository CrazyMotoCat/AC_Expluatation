$ErrorActionPreference = 'Stop'

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$scripts = @(
    (Join-Path $repositoryRoot 'scripts/dev/dev-up.ps1'),
    (Join-Path $repositoryRoot 'scripts/dev/dev-down.ps1'),
    (Join-Path $repositoryRoot 'scripts/dev/dev-reset.ps1')
)

foreach ($script in $scripts) {
    $tokens = $null
    $parseErrors = $null
    [void][System.Management.Automation.Language.Parser]::ParseFile($script, [ref]$tokens, [ref]$parseErrors)

    if ($parseErrors.Count -gt 0) {
        throw "PowerShell parser errors in ${script}: $($parseErrors.Message -join '; ')"
    }
}

$resetScript = Join-Path $repositoryRoot 'scripts/dev/dev-reset.ps1'

$nonDevelopmentEnvironmentRejected = $false
try {
    & $resetScript -Environment Production -ConfirmReset 2>$null
}
catch {
    $nonDevelopmentEnvironmentRejected = $true
}

if (-not $nonDevelopmentEnvironmentRejected) {
    throw 'dev-reset.ps1 accepted a non-Development environment.'
}

$missingConfirmationRejected = $false
try {
    & $resetScript -Environment Development 2>$null
}
catch {
    $missingConfirmationRejected = $true
}

if (-not $missingConfirmationRejected) {
    throw 'dev-reset.ps1 ran without explicit -ConfirmReset.'
}

$originalDotnetEnvironment = [Environment]::GetEnvironmentVariable('DOTNET_ENVIRONMENT', 'Process')
try {
    [Environment]::SetEnvironmentVariable('DOTNET_ENVIRONMENT', 'Production', 'Process')
    $productionProcessRejected = $false
    try {
        & $resetScript -Environment Development -ConfirmReset 2>$null
    }
    catch {
        $productionProcessRejected = $true
    }

    if (-not $productionProcessRejected) {
        throw 'dev-reset.ps1 ran while DOTNET_ENVIRONMENT was Production.'
    }
}
finally {
    [Environment]::SetEnvironmentVariable('DOTNET_ENVIRONMENT', $originalDotnetEnvironment, 'Process')
}

Write-Host 'DEV PowerShell script safety checks passed.'
