$ErrorActionPreference = 'Stop'

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$apiAssembly = Join-Path $repositoryRoot 'src/backend/Exploitation.Api/bin/Release/net10.0/Exploitation.Api.dll'
$apiWorkingDirectory = Split-Path -Parent $apiAssembly
$baseUrl = 'http://127.0.0.1:5187'
$readinessTimeoutSeconds = 20
$requestTimeoutSeconds = 2
$shutdownTimeoutMilliseconds = 5000
$previousEnvironment = [Environment]::GetEnvironmentVariable('ASPNETCORE_ENVIRONMENT', 'Process')
$connectionVariable = 'ConnectionStrings__Database'
$previousConnection = [Environment]::GetEnvironmentVariable($connectionVariable, 'Process')
$apiProcess = $null

function Test-ProcessExited {
    param([System.Diagnostics.Process]$Process)

    try {
        $Process.Refresh()
        return $Process.HasExited
    }
    catch [System.InvalidOperationException] {
        return $true
    }
}

function Stop-ApiProcess {
    param([System.Diagnostics.Process]$Process)

    if ($null -eq $Process -or (Test-ProcessExited -Process $Process)) {
        return
    }

    try {
        Stop-Process -Id $Process.Id -ErrorAction Stop
    }
    catch {
        if (-not (Test-ProcessExited -Process $Process)) {
            throw
        }
    }

    if ($Process.WaitForExit($shutdownTimeoutMilliseconds)) {
        return
    }

    try {
        $Process.Kill($true)
    }
    catch {
        if (-not (Test-ProcessExited -Process $Process)) {
            throw "API process $($Process.Id) did not stop gracefully and could not be terminated: $($_.Exception.Message)"
        }
    }

    if (-not $Process.WaitForExit($shutdownTimeoutMilliseconds)) {
        throw "API process $($Process.Id) did not exit within $shutdownTimeoutMilliseconds ms after forced process-tree termination."
    }
}

try {
    if (-not (Test-Path -LiteralPath $apiAssembly -PathType Leaf)) {
        throw "Built API assembly was not found: $apiAssembly"
    }

    [Environment]::SetEnvironmentVariable('ASPNETCORE_ENVIRONMENT', 'Development', 'Process')
    if ([string]::IsNullOrWhiteSpace($previousConnection)) {
        [Environment]::SetEnvironmentVariable(
            $connectionVariable,
            'Host=unused-for-api-bootstrap',
            'Process')
    }
    $startProcessArguments = @{
        FilePath = 'dotnet'
        ArgumentList = @("`"$apiAssembly`"", '--urls', $baseUrl, '--environment', 'Development')
        WorkingDirectory = $apiWorkingDirectory
        PassThru = $true
    }

    if ($IsWindows) {
        $startProcessArguments.WindowStyle = 'Hidden'
    }

    $apiProcess = Start-Process @startProcessArguments

    $liveResponse = $null
    $readinessStopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    while ($readinessStopwatch.Elapsed.TotalSeconds -lt $readinessTimeoutSeconds) {
        try {
            $liveResponse = Invoke-WebRequest -Uri "$baseUrl/health/live" -UseBasicParsing -TimeoutSec $requestTimeoutSeconds
            break
        }
        catch {
            if (Test-ProcessExited -Process $apiProcess) {
                throw "API process exited before becoming available (exit code $($apiProcess.ExitCode))."
            }

            Start-Sleep -Milliseconds 250
        }
    }

    if ($null -eq $liveResponse -or $liveResponse.StatusCode -ne 200) {
        throw 'GET /health/live did not return HTTP 200.'
    }

    $serverCorrelationId = [Guid]::Empty
    if (-not [Guid]::TryParse($liveResponse.Headers['X-Correlation-Id'], [ref]$serverCorrelationId)) {
        throw 'GET /health/live did not return a server-generated correlation ID.'
    }

    $correlationId = [Guid]::NewGuid().ToString()
    $readyResponse = Invoke-WebRequest -Uri "$baseUrl/health/ready" -Headers @{ 'X-Correlation-Id' = $correlationId } -UseBasicParsing -TimeoutSec $requestTimeoutSeconds
    if ($readyResponse.StatusCode -ne 200) {
        throw 'GET /health/ready did not return HTTP 200.'
    }

    if ($readyResponse.Headers['X-Correlation-Id'] -ne $correlationId) {
        throw 'Correlation ID was not returned unchanged in the response header.'
    }

    $openApiResponse = Invoke-WebRequest -Uri "$baseUrl/openapi/v1.json" -UseBasicParsing -TimeoutSec $requestTimeoutSeconds
    if ($openApiResponse.StatusCode -ne 200 -or [string]::IsNullOrWhiteSpace($openApiResponse.Content)) {
        throw 'Development OpenAPI document is unavailable.'
    }

    if (-not $openApiResponse.Content.Contains('/api/v1/me')) {
        throw 'Development OpenAPI document does not include GET /api/v1/me.'
    }

    $openApiPaths = ($openApiResponse.Content | ConvertFrom-Json).paths.PSObject.Properties.Name
    foreach ($path in @(
        '/api/v1/me/contexts',
        '/api/v1/me/context',
        '/api/v1/territorial-zones',
        '/api/v1/territorial-zones/{id}',
        '/api/v1/territorial-zones/{id}/activate',
        '/api/v1/territorial-zones/{id}/deactivate')) {
        if ($openApiPaths -notcontains $path) {
            throw "Development OpenAPI document does not include $path."
        }
    }

}
finally {
    $cleanupException = $null
    try {
        Stop-ApiProcess -Process $apiProcess
    }
    catch {
        $cleanupException = $_
    }

    [Environment]::SetEnvironmentVariable('ASPNETCORE_ENVIRONMENT', $previousEnvironment, 'Process')
    [Environment]::SetEnvironmentVariable($connectionVariable, $previousConnection, 'Process')

    if ($null -ne $cleanupException) {
        throw "API bootstrap smoke cleanup failed: $($cleanupException.Exception.Message)"
    }
}

Write-Host 'API bootstrap smoke checks passed.'
