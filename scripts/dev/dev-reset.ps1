[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory)]
    [ValidateSet('Development')]
    [string]$Environment,

    [switch]$ConfirmReset,

    [switch]$SkipRestart
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

foreach ($environmentVariable in 'ASPNETCORE_ENVIRONMENT', 'DOTNET_ENVIRONMENT') {
    $configuredEnvironment = [Environment]::GetEnvironmentVariable($environmentVariable)
    if ($configuredEnvironment -and $configuredEnvironment -ne 'Development') {
        throw "Refusing destructive reset because $environmentVariable is '$configuredEnvironment', not 'Development'."
    }
}

if (-not $ConfirmReset) {
    throw 'Refusing destructive reset without -ConfirmReset. This operation deletes the local DEV named volumes.'
}

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
    throw "Missing local configuration: $envFile. Create it from .env.example before resetting the DEV stack."
}

Assert-LocalDockerContext

if ($PSCmdlet.ShouldProcess($repositoryRoot, 'Delete local DEV Docker Compose volumes')) {
    Invoke-DevCompose config --quiet
    Invoke-DevCompose down --volumes --remove-orphans

    if (-not $SkipRestart) {
        & (Join-Path $PSScriptRoot 'dev-up.ps1')
        if ($LASTEXITCODE -ne 0) {
            throw "DEV stack restart failed with exit code $LASTEXITCODE."
        }
    }
}
