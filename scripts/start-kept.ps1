<#
    Starts Kept as an everyday app rather than a development server.

    Builds once on first run, then serves the production build on
    http://localhost:3000 and opens it in your browser. Leave the window
    running (minimised is fine) for as long as you want the app available;
    closing it stops the server.
#>

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# pnpm installs into the npm global folder, which a bare double-clicked shell
# does not always have on PATH.
$npmGlobal = Join-Path $env:APPDATA "npm"
if ((Test-Path $npmGlobal) -and ($env:Path -notlike "*$npmGlobal*")) {
    $env:Path = "$npmGlobal;$env:Path"
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "pnpm is not installed. Run this once, then try again:" -ForegroundColor Yellow
    Write-Host "    npm install -g pnpm"
    Read-Host "Press Enter to close"
    exit 1
}

# Already running? Just bring it up rather than fighting over the port.
if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) {
    Write-Host "Kept is already running." -ForegroundColor Green
    Start-Process "http://localhost:3000"
    exit 0
}

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies, one time only..." -ForegroundColor Cyan
    pnpm install
}

if (-not (Test-Path ".next\BUILD_ID")) {
    Write-Host "Building Kept, one time only. This takes about a minute..." -ForegroundColor Cyan
    pnpm build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "The build failed. Nothing was started." -ForegroundColor Red
        Read-Host "Press Enter to close"
        exit 1
    }
}

# Open the browser once the server actually answers, not before.
$opener = @'
for ($i = 0; $i -lt 90; $i++) {
    try {
        Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3 | Out-Null
        Start-Process "http://localhost:3000"
        break
    } catch { Start-Sleep -Milliseconds 500 }
}
'@
Start-Process powershell -WindowStyle Hidden -ArgumentList "-NoProfile", "-Command", $opener

Write-Host ""
Write-Host "Kept is running at http://localhost:3000" -ForegroundColor Green
Write-Host "On your phone, use the Network address printed below."
Write-Host "Closing this window stops the app."
Write-Host ""

pnpm start
