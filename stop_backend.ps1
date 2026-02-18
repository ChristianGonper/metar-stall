$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $RepoRoot "backend.pid"

if (-not (Test-Path $pidFile)) {
    Write-Host "No se encontro backend.pid. El backend podria no estar iniciado en segundo plano."
    exit 0
}

$backendPid = (Get-Content $pidFile -Raw).Trim()
if (-not $backendPid) {
    Write-Host "backend.pid esta vacio."
    exit 1
}

try {
    Stop-Process -Id ([int]$backendPid) -Force
    Write-Host "Backend detenido. PID: $backendPid"
} catch {
    Write-Host "No se pudo detener el proceso PID $backendPid. Puede que ya no exista."
}

Remove-Item $pidFile -ErrorAction SilentlyContinue
