$ErrorActionPreference = 'Stop'

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$smokeScriptPath = Join-Path $PSScriptRoot 'ApiBootstrapSmoke.Tests.ps1'

$tokens = $null
$parseErrors = $null
[void][System.Management.Automation.Language.Parser]::ParseFile($smokeScriptPath, [ref]$tokens, [ref]$parseErrors)
if ($parseErrors.Count -gt 0) {
    throw "PowerShell parser errors in API bootstrap smoke script: $($parseErrors.Message -join '; ')"
}

$smokeScript = Get-Content -LiteralPath $smokeScriptPath -Raw
$requiredFragments = @(
    '$apiAssembly =',
    'ArgumentList = @("`"$apiAssembly`""',
    'WorkingDirectory = $apiWorkingDirectory',
    '$readinessTimeoutSeconds = 20',
    '-TimeoutSec $requestTimeoutSeconds',
    'function Stop-ApiProcess',
    'Stop-Process -Id $Process.Id -ErrorAction Stop',
    '$Process.Kill($true)',
    '$Process.WaitForExit($shutdownTimeoutMilliseconds)',
    'finally {',
    'Stop-ApiProcess -Process $apiProcess'
)

foreach ($fragment in $requiredFragments) {
    if (-not $smokeScript.Contains($fragment, [StringComparison]::Ordinal)) {
        throw "API bootstrap smoke script is missing lifecycle contract fragment: $fragment"
    }
}

if ($smokeScript.Contains('WaitForExit()', [StringComparison]::Ordinal)) {
    throw 'API bootstrap smoke script contains an unbounded WaitForExit call.'
}

if ($smokeScript.Contains("'run'", [StringComparison]::Ordinal)) {
    throw 'API bootstrap smoke script must start the built API assembly directly, not through dotnet run.'
}

Write-Host 'API bootstrap smoke lifecycle contract checks passed.'
