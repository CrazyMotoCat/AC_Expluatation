[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$composeFile = Join-Path $repositoryRoot 'docker-compose.yml'
$envFile = Join-Path $repositoryRoot '.env'

function Invoke-DevCompose {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$ComposeArguments
    )

    & docker compose --project-directory $repositoryRoot --env-file $envFile --file $composeFile @ComposeArguments
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Compose command failed with exit code $LASTEXITCODE."
    }
}

function Assert-LocalDockerContext {
    $dockerHost = (& docker context inspect --format '{{.Endpoints.docker.Host}}').Trim()
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to inspect the active Docker context (exit code $LASTEXITCODE)."
    }

    $isLocalHost = $dockerHost -like 'npipe://*' -or
        $dockerHost -like 'unix://*' -or
        $dockerHost -like 'tcp://localhost:*' -or
        $dockerHost -like 'tcp://127.0.0.1:*' -or
        $dockerHost -match '^tcp://\[::1\]:'

    if (-not $isLocalHost) {
        throw "Refusing to operate on non-local Docker endpoint '$dockerHost'. Select a local Docker context first."
    }
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker CLI is required. Install and start Docker Desktop (or another Docker runtime) first.'
}

if (-not (Test-Path -LiteralPath $envFile -PathType Leaf)) {
    throw "Missing local configuration: $envFile. Create it from .env.example before stopping the DEV stack."
}

Assert-LocalDockerContext
Invoke-DevCompose config --quiet
Invoke-DevCompose down
