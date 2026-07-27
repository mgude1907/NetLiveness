# NetLiveness Production Package Creator
# Derlenmiş kurulum paketini depo içinde dist\NetLiveness_Setup altına yazar.

$ErrorActionPreference = 'Stop'
$RepoRoot = $PSScriptRoot
$targetDir = Join-Path $RepoRoot 'dist\NetLiveness_Setup'

if (Test-Path $targetDir) { Remove-Item -Recurse -Force $targetDir }
New-Item -ItemType Directory -Path $targetDir -Force | Out-Null

Write-Host '--- Paketleme başlatılıyor ---' -ForegroundColor Cyan

# 0. Frontend
Write-Host '0/5 Frontend derleniyor...'
$frontDir = Join-Path $RepoRoot 'netliveness-frontend'
Set-Location $frontDir
if (-not (Test-Path (Join-Path $frontDir 'node_modules'))) {
    npm install
}
npm run build

$wwwroot = Join-Path $RepoRoot 'NetLiveness.Api\wwwroot'
$uploadsDir = Join-Path $wwwroot 'uploads'
if (Test-Path $wwwroot) {
    Get-ChildItem -Path $wwwroot -Exclude 'uploads' | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
} else {
    New-Item -ItemType Directory -Path $wwwroot -Force | Out-Null
}
if (-not (Test-Path $uploadsDir)) {
    New-Item -ItemType Directory -Path $uploadsDir -Force | Out-Null
}
Copy-Item -Path (Join-Path $frontDir 'dist\*') -Destination $wwwroot -Recurse -Force

# 1. API
Write-Host '1/5 Backend derleniyor...'
Set-Location (Join-Path $RepoRoot 'NetLiveness.Api')
dotnet publish -c Release -o (Join-Path $targetDir 'Backend') --self-contained -r win-x64

# 2. Worker
Write-Host '2/5 Monitor Worker derleniyor...'
Set-Location (Join-Path $RepoRoot 'NetLiveness.MonitorWorker')
dotnet publish -c Release -o (Join-Path $targetDir 'Worker') --self-contained -r win-x64

# 3. Tray
Write-Host '3/5 Tray uygulaması derleniyor...'
$trayOut = Join-Path $targetDir 'TrayApp'
Set-Location (Join-Path $RepoRoot 'NetLiveness.Tray')
dotnet publish -c Release -o $trayOut --self-contained -r win-x64

$logoSrc = Join-Path $RepoRoot 'netliveness-frontend\public\repkon-logo.png'
if (Test-Path $logoSrc) {
    Copy-Item -Path $logoSrc -Destination (Join-Path $trayOut 'repkon-logo.png') -Force
}

# 4. Phishing sunucusu (kaynak kod)
Write-Host '4/5 Phishing sunucusu kopyalanıyor...'
$phishingTarget = Join-Path $targetDir 'Phishing'
New-Item -ItemType Directory -Path $phishingTarget -Force | Out-Null
Copy-Item -Path (Join-Path $RepoRoot 'netliveness-phishing-server\*') -Destination $phishingTarget -Recurse -Force

# 5. Kurulum betikleri
Write-Host '5/5 Kurulum betikleri hazırlanıyor...'
Copy-Item -Path (Join-Path $RepoRoot 'NetLiveness_Setup.ps1') -Destination $targetDir -Force
Copy-Item -Path (Join-Path $RepoRoot 'Uninstall.ps1') -Destination $targetDir -Force
Copy-Item -Path (Join-Path $RepoRoot 'register_services.ps1') -Destination $targetDir -Force

@"
@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0NetLiveness_Setup.ps1"
exit
"@ | Out-File -FilePath (Join-Path $targetDir 'Kurulum_Baslat.bat') -Encoding ascii

$exampleConfig = Join-Path $RepoRoot 'NetLiveness_Setup\TrayApp\config.example.json'
$trayConfig = Join-Path $trayOut 'config.json'
if (Test-Path $exampleConfig) {
    Copy-Item -Path $exampleConfig -Destination $trayConfig -Force
} else {
    '{"ServerUrl": "http://localhost:5006", "WatchdogEnabled": true}' | Out-File -FilePath $trayConfig -Encoding utf8
}

Set-Location $RepoRoot
Write-Host '--- Paketleme tamamlandı ---' -ForegroundColor Green
Write-Host "Çıktı: $targetDir"
