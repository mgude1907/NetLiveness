# NetLiveness Production Package Creator
# Bu betik tüm sistemi derler ve 'NetLiveness_Setup' klasöründe toplar.

$targetDir = "C:\Users\mgude\.gemini\antigravity\scratch\NetLiveness_Setup"
$baseDir = "C:\Users\mgude\.gemini\antigravity\scratch"

if (Test-Path $targetDir) { Remove-Item -Recurse -Force $targetDir }
New-Item -ItemType Directory -Path $targetDir | Out-Null

echo "--- Paketleme BaYlatlyor ---"

# 0. Frontend Yeniden Derleniyor
echo "0/4 Frontend Yeniden Derleniyor..."
Set-Location "$baseDir\netliveness-frontend"
npm run build
Get-ChildItem -Path "$baseDir\NetLiveness.Api\wwwroot" -Exclude "uploads" | Remove-Item -Recurse -Force
Copy-Item -Path "$baseDir\netliveness-frontend\dist\*" -Destination "$baseDir\NetLiveness.Api\wwwroot" -Recurse -Force

# 1. API ve Frontend Paketleme
echo "1/4 Backend ve Frontend Derleniyor..."
Set-Location "$baseDir\NetLiveness.Api"
dotnet publish -c Release -o "$targetDir\Backend" --self-contained -r win-x64
# Frontend zaten wwwroot'a taYnmYYt (mevcut publish ile pakete dahil olur)

# 2. Monitor Worker Paketleme
echo "2/4 Monitor Worker Derleniyor..."
Set-Location "$baseDir\NetLiveness.MonitorWorker"
dotnet publish -c Release -o "$targetDir\Worker" --self-contained -r win-x64

# 3. Tray Application Paketleme
echo "3/4 Tray App Derleniyor..."
Set-Location "$baseDir\NetLiveness.Tray"
dotnet publish -c Release -o "$targetDir\TrayApp" --self-contained -r win-x64

# 4. Phishing Server Kopyalama
echo "4/4 Phishing Server Dosyalar Kopyalanyor..."
$phishingTarget = New-Item -ItemType Directory -Path "$targetDir\Phishing"
Copy-Item -Path "$baseDir\netliveness-phishing-server\*" -Destination $phishingTarget -Recurse -Force

# 5. Yardmc Scriptler ve Kurulum Sihirbaz
echo "5/5 Kurulum Sihirbaz ve Scriptler Hazrlanyor..."
Copy-Item -Path "$baseDir\NetLiveness_Setup.ps1" -Destination $targetDir -Force
Copy-Item -Path "$baseDir\Uninstall.ps1" -Destination $targetDir -Force

$launcherContent = @"
@echo off
:: Ynetici olarak alYtr (PowerShell ile)
powershell -ExecutionPolicy Bypass -File NetLiveness_Setup.ps1
exit
"@
$launcherContent | Out-File -FilePath "$targetDir\Kurulum_Baslat.bat" -Encoding ascii

# 6. Varsaylan Ayarlar
echo "Default Tray Config oluYturuluyor..."
$defaultConfig = '{"ServerUrl": "http://localhost:5006", "WatchdogEnabled": true}'
$defaultConfig | Out-File -FilePath "$targetDir\TrayApp\config.json" -Encoding utf8

echo "--- Paketleme Tamamland! ---"
echo "Dosyalar burada: $targetDir"
echo "Kullanm: 'Kurulum_Baslat.bat' dosyasn YNETC olarak YalYYtrn."
