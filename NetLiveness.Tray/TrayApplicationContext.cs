using System;
using System.Diagnostics;
using System.Drawing;
using System.Net.Http;
using System.Windows.Forms;
using System.Threading.Tasks;
using System.Text.Json;
using System.IO;
using Microsoft.Win32;

namespace NetLiveness.Tray
{
    public class TrayApplicationContext : ApplicationContext
    {
        private NotifyIcon _notifyIcon;
        private ContextMenuStrip _contextMenu;
        private System.Windows.Forms.Timer _monitorTimer;
        private HttpClient _httpClient;
        
        private string _serverUrl = "http://localhost:5006";
        private bool _watchdogEnabled = false;
        private int _apiFailCount = 0;
        private int _workerFailCount = 0;
        private bool _apiHealthy = false;
        private bool _workerRunning = false;
        private bool _phishingRunning = false;

        public TrayApplicationContext()
        {
            LoadConfig();
            _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
            
            _contextMenu = new ContextMenuStrip();
            _contextMenu.Items.Add("NetLiveness Paneli Aç", null, (s, e) => OpenDashboard());
            _contextMenu.Items.Add("Sunucu Ayarları", null, (s, e) => ShowConfigDialog());
            _contextMenu.Items.Add(new ToolStripSeparator());
            
            var watchdogItem = new ToolStripMenuItem("Otomatik Kurtarma (Watchdog)");
            watchdogItem.CheckOnClick = true;
            watchdogItem.Checked = _watchdogEnabled;
            watchdogItem.Click += (s, e) => { _watchdogEnabled = watchdogItem.Checked; SaveConfig(); };
            _contextMenu.Items.Add(watchdogItem);

            var startupItem = new ToolStripMenuItem("Bilgisayar Açılışında Başlat");
            startupItem.CheckOnClick = true;
            startupItem.Checked = IsRunOnStartup();
            startupItem.Click += (s, e) => SetRunOnStartup(startupItem.Checked);
            _contextMenu.Items.Add(startupItem);

            _contextMenu.Items.Add(new ToolStripSeparator());
            _contextMenu.Items.Add("Servisleri Yeniden Başlat", null, (s, e) => RestartServices());
            _contextMenu.Items.Add("Servisleri Durdur", null, (s, e) => StopServices());
            _contextMenu.Items.Add(new ToolStripSeparator());
            _contextMenu.Items.Add("Çıkış", null, (s, e) => Exit());

            _notifyIcon = new NotifyIcon()
            {
                Icon = CreateStatusIcon(Color.Gray),
                ContextMenuStrip = _contextMenu,
                Visible = true,
                Text = "NetLiveness Servis İzleyici - Başlatılıyor..."
            };
            
            _notifyIcon.DoubleClick += (s, e) => OpenDashboard();

            _monitorTimer = new System.Windows.Forms.Timer { Interval = 10000 }; // 10 seconds
            _monitorTimer.Tick += async (s, e) => await MonitorServices();
            _monitorTimer.Start();

            // İlk kontrolü hemen yap
            Task.Run(MonitorServices);
        }

        private async Task MonitorServices()
        {
            try
            {
                // 1. API Check
                try
                {
                    string healthUrl = _serverUrl.Contains("localhost") ? _serverUrl : "http://localhost:5006";
                    var response = await _httpClient.GetAsync($"{healthUrl}/health");
                    _apiHealthy = response.IsSuccessStatusCode;
                    if (_apiHealthy) _apiFailCount = 0; else _apiFailCount++;
                }
                catch { _apiHealthy = false; _apiFailCount++; }

                // 2. Worker Check
                _workerRunning = Process.GetProcessesByName("NetLiveness.MonitorWorker").Length > 0;
                if (_workerRunning) _workerFailCount = 0; else _workerFailCount++;

                if (_watchdogEnabled)
                {
                    await PerformAutoHealing();
                }

                UpdateTrayIcon();
            }
            catch { }
        }

        private bool CheckPortActive(int port)
        {
            // Basit port kontrolü
            try {
                using (var tcpClient = new System.Net.Sockets.TcpClient()) {
                    tcpClient.Connect("127.0.0.1", port);
                    return true;
                }
            } catch { return false; }
        }

        private void UpdateTrayIcon()
        {
            Color statusColor;
            string statusText;

            if (_apiHealthy && _workerRunning)
            {
                statusColor = Color.LimeGreen;
                statusText = "NetLiveness: Aktif";
            }
            else if (_apiHealthy || _workerRunning)
            {
                statusColor = Color.Orange;
                statusText = "NetLiveness: Bazı servisler durdu";
            }
            else
            {
                statusColor = Color.Red;
                statusText = "NetLiveness: Servisler Kapalı";
            }

            _notifyIcon.Icon = CreateStatusIcon(statusColor);
            _notifyIcon.Text = statusText;
        }

        private Icon CreateStatusIcon(Color color)
        {
            // Dinamik olarak küçük bir ikon üret
            Bitmap bmp = new Bitmap(32, 32);
            using (Graphics g = Graphics.FromImage(bmp))
            {
                g.Clear(Color.Transparent);
                g.FillEllipse(new SolidBrush(color), 2, 2, 28, 28);
                g.DrawEllipse(new Pen(Color.White, 2), 2, 2, 28, 28);
            }
            return Icon.FromHandle(bmp.GetHicon());
        }

        private void OpenDashboard()
        {
            Process.Start(new ProcessStartInfo(_serverUrl) { UseShellExecute = true });
        }

        private void RestartServices()
        {
            try {
                Process.Start(new ProcessStartInfo("powershell.exe", "-ExecutionPolicy Bypass -File \"..\\run_all.ps1\"") { 
                    WindowStyle = ProcessWindowStyle.Hidden,
                    CreateNoWindow = true
                });
                _notifyIcon.ShowBalloonTip(3000, "NetLiveness", "Servisler yeniden başlatılıyor...", ToolTipIcon.Info);
            } catch (Exception ex) {
                MessageBox.Show("Yeniden başlatma hatası: " + ex.Message);
            }
        }

        private void StopServices()
        {
            try {
                Process.Start(new ProcessStartInfo("powershell.exe", "-ExecutionPolicy Bypass -File \"..\\cleanup.ps1\"") { 
                    WindowStyle = ProcessWindowStyle.Hidden,
                    CreateNoWindow = true
                });
                _notifyIcon.ShowBalloonTip(3000, "NetLiveness", "Servisler durduruluyor...", ToolTipIcon.Warning);
            } catch (Exception ex) {
                MessageBox.Show("Durdurma hatası: " + ex.Message);
            }
        }

        private void Exit()
        {
            _notifyIcon.Visible = false;
            Application.Exit();
        }

        private async Task PerformAutoHealing()
        {
            // API düştüyse ve 3 periyottur (30 sn) gelmiyorsa
            if (!_apiHealthy && _apiFailCount >= 3)
            {
                _apiFailCount = 0;
                RestartServices();
                _notifyIcon.ShowBalloonTip(3000, "Watchdog", "API yanıt vermiyor, otomatik yeniden başlatılıyor...", ToolTipIcon.Warning);
            }
            
            // Worker çalışmıyorsa
            if (!_workerRunning && _workerFailCount >= 2)
            {
                _workerFailCount = 0;
                RestartServices(); // Şu an hepsi bir arada başlıyor
            }
        }

        private bool IsRunOnStartup()
        {
            using (RegistryKey key = Registry.CurrentUser.OpenSubKey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", false))
            {
                return key.GetValue("NetLivenessTray") != null;
            }
        }

        private void SetRunOnStartup(bool run)
        {
            using (RegistryKey key = Registry.CurrentUser.OpenSubKey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", true))
            {
                if (run)
                {
                    key.SetValue("NetLivenessTray", Application.ExecutablePath);
                }
                else
                {
                    key.DeleteValue("NetLivenessTray", false);
                }
            }
        }

        private void LoadConfig()
        {
            string configPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "config.json");
            if (File.Exists(configPath))
            {
                try
                {
                    var json = File.ReadAllText(configPath);
                    var config = JsonSerializer.Deserialize<AppConfig>(json);
                    if (config != null)
                    {
                        if (!string.IsNullOrEmpty(config.ServerUrl)) _serverUrl = config.ServerUrl;
                        _watchdogEnabled = config.WatchdogEnabled;
                    }
                }
                catch { }
            }
        }

        private void SaveConfig()
        {
            string configPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "config.json");
            var config = new AppConfig { ServerUrl = _serverUrl, WatchdogEnabled = _watchdogEnabled };
            var json = JsonSerializer.Serialize(config);
            File.WriteAllText(configPath, json);
        }

        private void ShowConfigDialog()
        {
            string newUrl = Microsoft.VisualBasic.Interaction.InputBox(
                "Lütfen NetLiveness sunucu adresini giriniz (Örn: https://panel.firma.com veya http://192.168.1.100:5006):", 
                "Sunucu Ayarları", 
                _serverUrl);
                
            if (!string.IsNullOrEmpty(newUrl))
            {
                _serverUrl = newUrl;
                SaveConfig();
                _notifyIcon.ShowBalloonTip(3000, "NetLiveness", "Sunucu adresi güncellendi.", ToolTipIcon.Info);
                Task.Run(MonitorServices);
            }
        }

        private class AppConfig
        {
            public string ServerUrl { get; set; } = "";
            public bool WatchdogEnabled { get; set; } = false;
        }
    }
}
