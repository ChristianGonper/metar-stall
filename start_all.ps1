param(
    [string]$BackendHost = "127.0.0.1",
    [int]$BackendPort = 8000,
    [int]$FrontendPort = 5173
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RepoRoot

if (-not $env:UV_CACHE_DIR) {
    $env:UV_CACHE_DIR = Join-Path $RepoRoot ".uv-cache"
}

# ── Helpers ─────────────────────────────────────────────────────────────────

function Write-Step($msg) { Write-Host "`n  ▶ $msg" -ForegroundColor Cyan }
function Write-OK($msg) { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  ! $msg" -ForegroundColor Yellow }

function Wait-Port($port, $timeout = 20) {
    # Try both IPv4 and IPv6 loopback — Vite on Windows often binds to ::1
    $addresses = @("127.0.0.1", "::1")
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    Write-Host -NoNewline "  "
    while ($sw.Elapsed.TotalSeconds -lt $timeout) {
        foreach ($addr in $addresses) {
            try {
                $tcp = New-Object System.Net.Sockets.TcpClient
                $tcp.Connect($addr, $port)
                $tcp.Close()
                Write-Host ""   # end the dots line
                return $true
            }
            catch {}
        }
        Write-Host -NoNewline "."
        Start-Sleep -Milliseconds 500
    }
    Write-Host ""   # end the dots line
    return $false
}

function Invoke-FreePort($port) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
        try { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue } catch {}
    }
}

# ── Check tools ──────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "  ╔══════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "  ║       METAR Stall  ·  Launcher       ║" -ForegroundColor Blue
Write-Host "  ╚══════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

Write-Step "Verificando dependencias..."
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    Write-Error "  ✗ 'uv' no está instalado. Instálalo desde https://github.com/astral-sh/uv"
    exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "  ✗ 'npm' no está instalado. Instala Node.js desde https://nodejs.org"
    exit 1
}
Write-OK "uv y npm encontrados"

# ── Frontend dependencies ────────────────────────────────────────────────────

Write-Step "Instalando dependencias del frontend (si es necesario)..."
Push-Location (Join-Path $RepoRoot "frontend")
npm install --prefer-offline --silent 2>&1 | Out-Null
Pop-Location
Write-OK "node_modules listo"

# ── Backend ──────────────────────────────────────────────────────────────────

Write-Step "Liberando puerto $BackendPort si está en uso..."
Invoke-FreePort $BackendPort
Start-Sleep -Milliseconds 300

Write-Step "Iniciando backend en http://$BackendHost`:$BackendPort ..."

$backendOut = Join-Path $RepoRoot "backend.out.log"
$backendErr = Join-Path $RepoRoot "backend.err.log"
$backendPid = Join-Path $RepoRoot "backend.pid"

$uvCmd = "$env:UV_CACHE_DIR = '$env:UV_CACHE_DIR'; " +
"Set-Location '$RepoRoot'; " +
"uv run --no-project --with fastapi --with uvicorn --with pydantic " +
"python -m backend.main --host $BackendHost --port $BackendPort --reload"

$backendProc = Start-Process powershell `
    -WorkingDirectory $RepoRoot `
    -ArgumentList @("-NoLogo", "-NoProfile", "-Command", $uvCmd) `
    -WindowStyle Hidden `
    -RedirectStandardOutput $backendOut `
    -RedirectStandardError  $backendErr `
    -PassThru

$backendProc.Id | Set-Content -Path $backendPid -Encoding ascii

Write-Step "Esperando que el backend responda..."
$ready = Wait-Port $BackendPort 25
if (-not $ready) {
    Write-Warn "El backend tardó demasiado. Revisa backend.err.log"
}
else {
    Write-OK "Backend online (PID $($backendProc.Id))"
}

# ── Frontend ─────────────────────────────────────────────────────────────────

Write-Step "Liberando puerto $FrontendPort si está en uso..."
Invoke-FreePort $FrontendPort
Start-Sleep -Milliseconds 300

Write-Step "Iniciando frontend en http://localhost:$FrontendPort ..."

$frontendPidFile = Join-Path $RepoRoot "frontend.pid"
$frontendDir = Join-Path $RepoRoot "frontend"
$frontendOut = Join-Path $RepoRoot "frontend.out.log"
$frontendErr = Join-Path $RepoRoot "frontend.err.log"

# Pass --port and --strictPort so Vite never silently jumps to another port
$frontCmd = "Set-Location '$frontendDir'; npm run dev -- --port $FrontendPort --strictPort"

$frontendProc = Start-Process powershell `
    -WorkingDirectory $frontendDir `
    -ArgumentList @("-NoLogo", "-NoProfile", "-Command", $frontCmd) `
    -WindowStyle Hidden `
    -RedirectStandardOutput $frontendOut `
    -RedirectStandardError  $frontendErr `
    -PassThru

$frontendProc.Id | Set-Content -Path $frontendPidFile -Encoding ascii

Write-Step "Esperando que el frontend responda..."
$frontReady = Wait-Port $FrontendPort 45
if ($frontReady) {
    Write-OK "Frontend online (PID $($frontendProc.Id))"
    Start-Process "http://localhost:$FrontendPort"
}
else {
    Write-Warn "El frontend tardó demasiado. Verifica que npm esté correctamente instalado."
}

# ── Wait ─────────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "  ═══════════════════════════════════════════" -ForegroundColor Blue
Write-Host "  Aplicación en marcha. Pulsa Ctrl+C para salir." -ForegroundColor Cyan
Write-Host "  Backend  → http://$BackendHost`:$BackendPort" -ForegroundColor White
Write-Host "  Frontend → http://localhost:$FrontendPort" -ForegroundColor White
Write-Host "  ═══════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

try {
    while ($true) { Start-Sleep -Seconds 5 }
}
finally {
    Write-Host "`n  Cerrando procesos..." -ForegroundColor Yellow
    try { Stop-Process -Id $backendProc.Id  -Force -ErrorAction SilentlyContinue } catch {}
    try { Stop-Process -Id $frontendProc.Id -Force -ErrorAction SilentlyContinue } catch {}
    Remove-Item $backendPid -ErrorAction SilentlyContinue
    Remove-Item $frontendPidFile -ErrorAction SilentlyContinue
    Write-OK "Procesos detenidos. ¡Hasta luego!"
}
