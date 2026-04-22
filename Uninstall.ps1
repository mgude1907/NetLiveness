# NetLiveness Kaldrma Betii
$AppName = "NetLiveness"
$InstallDir = "C:\Program Files\NetLiveness"

Write-Host "--- $AppName Kaldrlyor ---" -ForegroundColor Cyan

# 1. Servisleri Durdur ve Sil
Write-Host "Servisler temizleniyor..."
sc.exe stop NetLiveness_API
sc.exe delete NetLiveness_API
sc.exe stop NetLiveness_Worker
sc.exe delete NetLiveness_Worker

# 2. Tray App'i Kapat
Write-Host "Uygulamalar kapatlyor..."
Get-Process NetLiveness.Tray -ErrorAction SilentlyContinue | Stop-Process -Force

# 3. Firewall Kurallarn Sil
Write-Host "Firewall kurallar siliniyor..."
Remove-NetFirewallRule -DisplayName "NetLiveness API" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "NetLiveness Phishing" -ErrorAction SilentlyContinue

# 4. Ksayollar Sil
Write-Host "Ksayollar siliniyor..."
$desktopPath = [Environment]::GetFolderPath('Desktop')
if (Test-Path "$desktopPath\NetLiveness Panel.lnk") { Remove-Item "$desktopPath\NetLiveness Panel.lnk" }

# 5. Dosyalar Sil
Write-Host "Dosyalar siliniyor..."
# Not: lk admda InstallDir'i silemeyebiliriz nk uygulama alyor olabilir. 
# Ama steki Stop-Process'ten sonra silinmesi gerekir.
if (Test-Path $InstallDir) {
    Remove-Item -Path $InstallDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "--- $AppName BaYaryla Kaldrld ---" -ForegroundColor Green
pause
