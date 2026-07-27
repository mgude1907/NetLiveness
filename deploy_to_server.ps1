# NetLiveness — geliştirme bilgisayarından sunucuya doğrudan yayın (GitHub gerekmez)
#Requires -Version 5.1
param(
    [string]$ConfigPath = (Join-Path $PSScriptRoot 'deploy.config.json'),
    [switch]$SkipBuild,
    [switch]$RegisterServicesOnServer
)

$ErrorActionPreference = 'Stop'
$RepoRoot = $PSScriptRoot

function Convert-ToAdminSharePath {
    param(
        [Parameter(Mandatory)][string]$ServerHost,
        [Parameter(Mandatory)][string]$LocalPath
    )
    if ($LocalPath -match '^([A-Za-z]):\\(.*)$') {
        $drive = $matches[1]
        $rest = $matches[2]
        return "\\$ServerHost\${drive}`$\$rest"
    }
    throw "RemoteInstallPath geçersiz (örnek: C:\Program Files\NetLiveness): $LocalPath"
}

if (-not (Test-Path $ConfigPath)) {
    throw "Yapılandırma yok: $ConfigPath`nÖrnek: Copy-Item deploy.config.example.json deploy.config.json"
}

$cfg = Get-Content $ConfigPath -Raw | ConvertFrom-Json
$staging = Join-Path $RepoRoot 'dist\NetLiveness_Setup'

if (-not $SkipBuild) {
    & (Join-Path $RepoRoot 'create_package.ps1')
}

if (-not (Test-Path $staging)) {
    throw "Paket bulunamadı: $staging (önce create_package.ps1 çalıştırın)"
}

$remotePath = $cfg.RemoteInstallPath
if ($cfg.UseAdminShare) {
    $dest = Convert-ToAdminSharePath -ServerHost $cfg.ServerHost -LocalPath $remotePath
} else {
    $dest = $remotePath
}

Write-Host "Hedef: $dest" -ForegroundColor Cyan

$server = "\\$($cfg.ServerHost)"
if ($cfg.StopServices) {
    foreach ($name in @($cfg.ServiceNames.Api, $cfg.ServiceNames.Worker)) {
        if ([string]::IsNullOrWhiteSpace($name)) { continue }
        Write-Host "Servis durduruluyor: $name"
        sc.exe $server stop $name 2>$null | Out-Null
    }
    Start-Sleep -Seconds 3
}

$xf = @()
foreach ($f in $cfg.PreserveOnServer.ExcludeFiles) { $xf += '/XF'; $xf += $f }
$xd = @()
foreach ($d in $cfg.PreserveOnServer.ExcludeDirectories) { $xd += '/XD'; $xd += $d }

$robocopyArgs = @(
    $staging,
    $dest,
    '/E', '/Z', '/NFL', '/NDL', '/NP'
) + $xf + $xd + @($cfg.RobocopyExtraArgs)

Write-Host "Robocopy başlıyor..."
& robocopy @robocopyArgs
$rc = $LASTEXITCODE
if ($rc -ge 8) {
    throw "Robocopy hata kodu: $rc"
}

if ($RegisterServicesOnServer) {
    Write-Host 'Sunucuda servis kaydı (register_services.ps1)...'
    $regScript = Join-Path $dest 'register_services.ps1'
    if (-not (Test-Path $regScript)) {
        throw "register_services.ps1 hedefte yok: $regScript"
    }
    Invoke-Command -ComputerName $cfg.ServerHost -ScriptBlock {
        param($InstallRoot)
        Set-Location $InstallRoot
        & (Join-Path $InstallRoot 'register_services.ps1') -InstallRoot $InstallRoot
    } -ArgumentList $remotePath
}

if ($cfg.StartServicesAfterDeploy) {
    foreach ($name in @($cfg.ServiceNames.Api, $cfg.ServiceNames.Worker)) {
        if ([string]::IsNullOrWhiteSpace($name)) { continue }
        Write-Host "Servis başlatılıyor: $name"
        sc.exe $server start $name 2>$null | Out-Null
    }
}

Write-Host '--- Sunucuya yayın tamamlandı ---' -ForegroundColor Green
Write-Host 'Veritabanı ve uploads sunucuda korundu (robocopy hariç tutma listesi).'
