Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# --- Yaplandrma ---
$AppName = "NetLiveness"
$InstallDir = "C:\Program Files\NetLiveness"
$SourceDir = $PSScriptRoot # Paket Klasr
$LogoPath = "$SourceDir\TrayApp\repkon-logo.png"

# --- Admin Kontrol ---
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Ynetici yetkisi gerekiyor! Ltfen Ynetici olarak altrn." -ForegroundColor Red
    pause
    exit
}

# --- Arayz Tasarm ---
$form = New-Object System.Windows.Forms.Form
$form.Text = "$AppName Kurulum Sihirbaz"
$form.Size = New-Object System.Drawing.Size(600, 450)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false

# Arkaplan
$form.BackColor = [System.Drawing.Color]::White

# Logo
if (Test-Path $LogoPath) {
    $pictureBox = New-Object System.Windows.Forms.PictureBox
    $pictureBox.Image = [System.Drawing.Image]::FromFile($LogoPath)
    $pictureBox.SizeMode = "Zoom"
    $pictureBox.Size = New-Object System.Drawing.Size(150, 60)
    $pictureBox.Location = New-Object System.Drawing.Point(20, 20)
    $form.Controls.Add($pictureBox)
}

# Balk
$lblTitle = New-Object System.Windows.Forms.Label
$lblTitle.Text = "$AppName Kurulumuna Ho Geldiniz"
$lblTitle.Font = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)
$lblTitle.Size = New-Object System.Drawing.Size(500, 40)
$lblTitle.Location = New-Object System.Drawing.Point(20, 100)
$form.Controls.Add($lblTitle)

# Bilgi Metni
$lblInfo = New-Object System.Windows.Forms.Label
$lblInfo.Text = "Bu sihirbaz, NetLiveness Dijital Sistemlerini bu bilgisayara kuracaktr. `n`n1. Dosyalar kopyalanacak `n2. Servisler kaydedilecek `n3. Gvenlik duvar ayarlanacak"
$lblInfo.Font = New-Object System.Drawing.Font("Segoe UI", 10)
$lblInfo.Size = New-Object System.Drawing.Size(550, 100)
$lblInfo.Location = New-Object System.Drawing.Point(20, 150)
$form.Controls.Add($lblInfo)

# Durum Bar
$progressBar = New-Object System.Windows.Forms.ProgressBar
$progressBar.Size = New-Object System.Drawing.Size(540, 30)
$progressBar.Location = New-Object System.Drawing.Point(20, 300)
$progressBar.Visible = $false
$form.Controls.Add($progressBar)

$lblStatus = New-Object System.Windows.Forms.Label
$lblStatus.Size = New-Object System.Drawing.Size(500, 20)
$lblStatus.Location = New-Object System.Drawing.Point(20, 340)
$lblStatus.Text = "Hazr."
$lblStatus.Visible = $false
$form.Controls.Add($lblStatus)

# Butonlar
$btnNext = New-Object System.Windows.Forms.Button
$btnNext.Text = "Kurulumu BaYlat"
$btnNext.Size = New-Object System.Drawing.Size(150, 40)
$btnNext.Location = New-Object System.Drawing.Point(420, 360)
$btnNext.BackColor = [System.Drawing.Color]::DodgerBlue
$btnNext.ForeColor = [System.Drawing.Color]::White
$btnNext.FlatStyle = "Flat"
$btnNext.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($btnNext)

# --- Kurulum Mant ---
$btnNext.Add_Click({
    $btnNext.Enabled = $false
    $progressBar.Visible = $true
    $lblStatus.Visible = $true
    
    # 1. Dosyalar Kopyala
    $lblStatus.Text = "Dosyalar kopyalanyor..."
    $progressBar.Value = 20
    if (-not (Test-Path $InstallDir)) { New-Item -Path $InstallDir -ItemType Directory -Force }
    Copy-Item -Path "$SourceDir\*" -Destination $InstallDir -Recurse -Force -Exclude "NetLiveness_Setup.ps1"
    
    # 2. Servisleri Kaydet
    $lblStatus.Text = "Servisler yaplandrlyor..."
    $progressBar.Value = 50
    $apiPath = "$InstallDir\Backend\NetLiveness.Api.exe"
    $workerPath = "$InstallDir\Worker\NetLiveness.MonitorWorker.exe"
    
    # Eskileri sil (varsa)
    sc.exe stop NetLiveness_API | Out-Null
    sc.exe delete NetLiveness_API | Out-Null
    sc.exe stop NetLiveness_Worker | Out-Null
    sc.exe delete NetLiveness_Worker | Out-Null
    
    sc.exe create NetLiveness_API binPath= "$apiPath" start= auto displayname= "NetLiveness API Service"
    sc.exe create NetLiveness_Worker binPath= "$workerPath" start= auto displayname= "NetLiveness Worker Service"
    
    # 3. Firewall
    $lblStatus.Text = "Gvenlik duvar ayarlanyor..."
    $progressBar.Value = 70
    New-NetFirewallRule -DisplayName "NetLiveness API" -Direction Inbound -LocalPort 5006 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "NetLiveness Phishing" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
    
    # 4. Ksayollar
    $lblStatus.Text = "Ksayollar oluYturuluyor..."
    $progressBar.Value = 90
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("$([Environment]::GetFolderPath('Desktop'))\NetLiveness Panel.lnk")
    $Shortcut.TargetPath = "$InstallDir\TrayApp\NetLiveness.Tray.exe"
    $Shortcut.Save()
    
    # 5. Tamamland
    $progressBar.Value = 100
    $lblStatus.Text = "Kurulum BaYaryla Tamamland!"
    $btnNext.Text = "Kapat ve BaYlat"
    $btnNext.Enabled = $true
    $btnNext.Add_Click({
        Start-Process "$InstallDir\TrayApp\NetLiveness.Tray.exe"
        $form.Close()
    })
})

[void]$form.ShowDialog()
