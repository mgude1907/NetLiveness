# NetLiveness Windows servis kaydı (sunucuda veya paket klasöründen)
param(
    [string]$InstallRoot = 'C:\Program Files\NetLiveness'
)

$ErrorActionPreference = 'Stop'

$apiPath = Join-Path $InstallRoot 'Backend\NetLiveness.Api.exe'
$workerPath = Join-Path $InstallRoot 'Worker\NetLiveness.MonitorWorker.exe'

if (-not (Test-Path $apiPath)) {
    throw "API bulunamadı: $apiPath"
}
if (-not (Test-Path $workerPath)) {
    throw "Worker bulunamadı: $workerPath"
}

Write-Host 'API servisi kaydediliyor...'
sc.exe create NetLiveness_API binPath= "`"$apiPath`"" start= auto displayname= "NetLiveness API Service" 2>$null
sc.exe description NetLiveness_API "NetLiveness ana API servisi"
sc.exe failure NetLiveness_API reset= 86400 actions= restart/60000/restart/60000/restart/60000

Write-Host 'Worker servisi kaydediliyor...'
sc.exe create NetLiveness_Worker binPath= "`"$workerPath`"" start= auto displayname= "NetLiveness Worker Service" 2>$null
sc.exe description NetLiveness_Worker "NetLiveness ağ izleme servisi"
sc.exe failure NetLiveness_Worker reset= 86400 actions= restart/60000/restart/60000/restart/60000

Write-Host '--- Servis kaydı tamamlandı ---'
Write-Host "Başlatmak için: sc.exe start NetLiveness_API && sc.exe start NetLiveness_Worker"
