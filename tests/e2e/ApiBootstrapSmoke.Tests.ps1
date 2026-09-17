$ErrorActionPreference = 'Stop'

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$apiProject = Join-Path $repositoryRoot 'src/backend/Exploitation.Api/Exploitation.Api.csproj'
$baseUrl = 'http://127.0.0.1:5187'
$previousEnvironment = [Environment]::GetEnvironmentVariable('ASPNETCORE_ENVIRONMENT', 'Process')
$apiProcess = $null

try {
    [Environment]::SetEnvironmentVariable('ASPNETCORE_ENVIRONMENT', 'Development', 'Process')
    $apiProcess = Start-Process -FilePath dotnet `
        -ArgumentList @('run', '--project', "`"$apiProject`"", '--configuration', 'Release', '--no-build', '--no-launch-profile', '--', '--urls', $baseUrl, '--environment', 'Development') `
        -PassThru `
        -WindowStyle Hidden

    $liveResponse = $null
    for ($attempt = 1; $attempt -le 80; $attempt++) {
        try {
            $liveResponse = Invoke-WebRequest -Uri "$baseUrl/health/live" -UseBasicParsing
            break
        }
        catch {
            if ($apiProcess.HasExited) {
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
    $readyResponse = Invoke-WebRequest -Uri "$baseUrl/health/ready" -Headers @{ 'X-Correlation-Id' = $correlationId } -UseBasicParsing
    if ($readyResponse.StatusCode -ne 200) {
        throw 'GET /health/ready did not return HTTP 200.'
    }

    if ($readyResponse.Headers['X-Correlation-Id'] -ne $correlationId) {
        throw 'Correlation ID was not returned unchanged in the response header.'
    }

    $openApiResponse = Invoke-WebRequest -Uri "$baseUrl/openapi/v1.json" -UseBasicParsing
    if ($openApiResponse.StatusCode -ne 200 -or [string]::IsNullOrWhiteSpace($openApiResponse.Content)) {
        throw 'Development OpenAPI document is unavailable.'
    }

}
finally {
    if ($null -ne $apiProcess -and -not $apiProcess.HasExited) {
        Stop-Process -Id $apiProcess.Id
        $apiProcess.WaitForExit()
    }

    [Environment]::SetEnvironmentVariable('ASPNETCORE_ENVIRONMENT', $previousEnvironment, 'Process')
}

Write-Host 'API bootstrap smoke checks passed.'
