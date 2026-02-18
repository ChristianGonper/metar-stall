param(
    [ValidateSet("Foreground", "Background")]
    [string]$Mode = "Foreground",
    [string]$BindHost = "127.0.0.1",
    [int]$Port = 8000
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RepoRoot

if (-not $env:UV_CACHE_DIR) {
    $env:UV_CACHE_DIR = Join-Path $RepoRoot ".uv-cache"
}

$uvArgsBase = @(
    "run",
    "--no-project",
    "--with", "fastapi",
    "--with", "uvicorn",
    "--with", "pydantic"
)

Write-Host "Validando import de backend.main con uv..."
uv @uvArgsBase python -c "import backend.main; print('import ok')" | Out-Host

if ($Mode -eq "Foreground") {
    Write-Host "Iniciando backend en primer plano en http://$BindHost`:$Port ..."
    uv @uvArgsBase python -m backend.main --host $BindHost --port $Port
    exit $LASTEXITCODE
}

$outLog = Join-Path $RepoRoot "backend.out.log"
$errLog = Join-Path $RepoRoot "backend.err.log"
$pidFile = Join-Path $RepoRoot "backend.pid"

Write-Host "Iniciando backend en segundo plano en http://$BindHost`:$Port ..."
$command = "$env:UV_CACHE_DIR = '$env:UV_CACHE_DIR'; " +
    "Set-Location '$RepoRoot'; " +
    "uv run --no-project --with fastapi --with uvicorn --with pydantic " +
    "python -m backend.main --host $BindHost --port $Port"

$proc = Start-Process powershell `
    -WorkingDirectory $RepoRoot `
    -ArgumentList @("-NoLogo", "-NoProfile", "-Command", $command) `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog `
    -PassThru

$proc.Id | Set-Content -Path $pidFile -Encoding ascii
Write-Host "PID: $($proc.Id)"
Write-Host "Logs: $outLog"
Write-Host "Errores: $errLog"
Write-Host "PID file: $pidFile"
