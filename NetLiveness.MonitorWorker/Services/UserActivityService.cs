using System.Management;
using System.Runtime.InteropServices;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;

namespace NetLiveness.Api.Services
{
    public class UserActivityService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<UserActivityService> _logger;
        private const int PollingIntervalMs = 10000; // 10 seconds for higher efficiency

        // P/Invoke for foreground window tracking (Local)
        [DllImport("user32.dll")]
        private static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

        // Track last CPU times: Dictionary<PcName, Dictionary<AppName, LastCpuTime>>
        private readonly Dictionary<string, Dictionary<string, ulong>> _lastCpuTimes = new();

        public UserActivityService(IServiceScopeFactory scopeFactory, ILogger<UserActivityService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("User Activity Service started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                        var settings = await context.Settings.FirstOrDefaultAsync(stoppingToken);

                        var targets = await context.Terminals
                            .Where(t => t.EnableUserActivity)
                            .Select(t => new UserActivityTarget
                            {
                                Id = t.Id,
                                PcName = t.Name,
                                Group = t.UserActivityGroup,
                                IsEnabled = true,
                                LastCheck = t.LastCheck ?? DateTime.MinValue
                            })
                            .ToListAsync(stoppingToken);

                        // SEQUENTIAL POLLING: To prevent WMI resource exhaustion and overlapping tasks
                        foreach (var target in targets)
                        {
                            if (stoppingToken.IsCancellationRequested) break;

                            using (var serviceScope = _scopeFactory.CreateScope())
                            {
                                var taskContext = serviceScope.ServiceProvider.GetRequiredService<AppDbContext>();
                                try
                                {
                                    _logger.LogInformation($"Polling activity for {target.PcName}...");
                                    
                                    // Update Terminal's LastCheck individually as an 'Attempt'
                                    var terminal = await taskContext.Terminals.FindAsync(target.Id);
                                    if (terminal != null)
                                    {
                                        terminal.LastCheck = DateTime.UtcNow;
                                        await taskContext.SaveChangesAsync(stoppingToken);
                                    }

                                    await PollPcActivityAsync(target, taskContext, settings, stoppingToken);
                                    _logger.LogInformation($"Successfully polled {target.PcName}.");
                                }
                                catch (Exception ex)
                                {
                                    _logger.LogWarning($"Failed to poll activity for {target.PcName}: {ex.Message}");
                                    
                                    // Ensure target error is marked in DB if the poll fails completely
                                    try {
                                        var terminal = await taskContext.Terminals.FindAsync(target.Id);
                                        if (terminal != null) {
                                            terminal.Status = "Error";
                                            terminal.LastError = "Poll Error: " + ex.Message;
                                            await taskContext.SaveChangesAsync(stoppingToken);
                                        }
                                    } catch { /* Suppress secondary errors */ }
                                }
                            }
                        }
                    }
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in User Activity Service loop");
                }

                try
                {
                    await Task.Delay(PollingIntervalMs, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }

        private async Task PollPcActivityAsync(UserActivityTarget target, AppDbContext context, AppSettings settings, CancellationToken stoppingToken)
        {
            bool isLocal = string.Equals(target.PcName, "localhost", StringComparison.OrdinalIgnoreCase) ||
                           string.Equals(target.PcName, "127.0.0.1") ||
                           string.Equals(target.PcName, ".") ||
                           string.Equals(target.PcName, Environment.MachineName, StringComparison.OrdinalIgnoreCase);

            if (isLocal)
            {
                await PollLocalActivityAsync(target, context, stoppingToken);
                return;
            }

            // Uzak WMI: tüm işlemi Task.Run içine al ve maksimum 25 sn bekle
            await Task.Run(async () =>
            {
                var options = new ConnectionOptions();
                options.Timeout = TimeSpan.FromSeconds(30);

                bool isLocal = string.Equals(target.PcName, "localhost", StringComparison.OrdinalIgnoreCase) ||
                               string.Equals(target.PcName, "127.0.0.1") ||
                               string.Equals(target.PcName, ".") ||
                               string.Equals(target.PcName, Environment.MachineName, StringComparison.OrdinalIgnoreCase);

                if (!string.IsNullOrEmpty(settings?.WmiUser) && !isLocal)
                {
                    options.Username = settings.WmiUser;
                    options.Password = settings.WmiPass;
                    if (!string.IsNullOrEmpty(settings.WmiDomain))
                        options.Authority = "ntlmdomain:" + settings.WmiDomain;
                }

                var scope = new ManagementScope($@"\\{(isLocal ? "." : target.PcName)}\root\cimv2", options);
                string errorDetail = null;

                try 
                {
                    // Bağlantı dene
                    scope.Connect();
                }
                catch (Exception ex)
                {
                    errorDetail = ex.Message;
                    _logger.LogWarning($"WMI Connection failed for {target.PcName}: {ex.Message}");
                    
                    // Veritabanını hata bilgisiyle güncelle
                    lock (context)
                    {
                        var t = context.Terminals.Find(target.Id);
                        if (t != null)
                        {
                            t.LastCheck = DateTime.UtcNow;
                            if (ex.Message.Contains("RPC server is unavailable") || ex.Message.Contains("0x800706BA"))
                                t.LastError = "RPC Erişilemiyor (PC Kapalı veya DNS Hatalı)";
                            else if (ex.Message.Contains("Access is denied") || ex.Message.Contains("0x80070005"))
                                t.LastError = "Erişim Reddedildi (WMI Yetki Yok)";
                            else
                                t.LastError = "WMI Hatası: " + ex.Message;
                                
                            t.Status = "Error";
                        }
                    }
                    await context.SaveChangesAsync(stoppingToken);
                    return; // Bağlantı yoksa devam etme
                }

                if (!scope.IsConnected)
                {
                    _logger.LogWarning($"WMI Scope connected but is reported as NOT connected for {target.PcName}");
                    return;
                }

                string activeUser = "";
                try {
                    // Yöntem 1: explorer.exe üzerinden process sahibini bulma
                    var explorerQuery = new ObjectQuery("SELECT * FROM Win32_Process WHERE Name = 'explorer.exe'");
                    using var explorerSearcher = new ManagementObjectSearcher(scope, explorerQuery);
                    explorerSearcher.Options.Timeout = TimeSpan.FromSeconds(10);
                    var explorerProcess = explorerSearcher.Get().Cast<ManagementObject>().FirstOrDefault();
                    if (explorerProcess != null)
                    {
                        var outParams = explorerProcess.InvokeMethod("GetOwner", null, null);
                        if (outParams != null && outParams["User"] != null)
                        {
                            activeUser = outParams["User"].ToString();
                        }
                    }
                } catch { }

                if (string.IsNullOrEmpty(activeUser))
                {
                    try {
                        // Yöntem 2: Konsoldaki ana kullanıcı
                        var csQuery = new ObjectQuery("SELECT UserName FROM Win32_ComputerSystem");
                        using var csSearcher = new ManagementObjectSearcher(scope, csQuery);
                        csSearcher.Options.Timeout = TimeSpan.FromSeconds(10);
                        var csData = csSearcher.Get().Cast<ManagementObject>().FirstOrDefault();
                        activeUser = csData?["UserName"]?.ToString() ?? "";
                        if (!string.IsNullOrEmpty(activeUser) && activeUser.Contains("\\"))
                            activeUser = activeUser.Split('\\').Last();
                    } catch { }
                }

                var query = new ObjectQuery("SELECT Name, UserModeTime, KernelModeTime FROM Win32_Process WHERE SessionId > 0");
                using var searcher = new ManagementObjectSearcher(scope, query);
                searcher.Options.Timeout = TimeSpan.FromSeconds(20);

                var seenApps = new HashSet<string>();

                if (!_lastCpuTimes.ContainsKey(target.PcName))
                    _lastCpuTimes[target.PcName] = new Dictionary<string, ulong>();

                var pcCpuCache = _lastCpuTimes[target.PcName];
                var toAdd = new List<UserAppActivity>();

                foreach (ManagementObject obj in searcher.Get())
                {
                    string name = obj["Name"]?.ToString() ?? "";
                    if (string.IsNullOrEmpty(name) || IsSystemProcess(name)) continue;

                    if (!seenApps.Contains(name))
                    {
                        ulong userTime   = (ulong)(obj["UserModeTime"]   ?? 0UL);
                        ulong kernelTime = (ulong)(obj["KernelModeTime"] ?? 0UL);
                        ulong totalTime  = userTime + kernelTime;

                        bool isActive = false;
                        if (pcCpuCache.TryGetValue(name, out ulong lastTotalTime))
                        {
                            if (totalTime > lastTotalTime + 20) isActive = true;
                        }
                        pcCpuCache[name] = totalTime;

                        toAdd.Add(new UserAppActivity
                        {
                            PcName          = target.PcName,
                            UserName        = activeUser,
                            AppName         = name,
                            WindowTitle     = "",
                            Timestamp       = DateTime.UtcNow,
                            DurationSeconds = PollingIntervalMs / 1000,
                            IsActive        = isActive
                        });
                        seenApps.Add(name);
                    }
                }

                lock (context)
                {
                    foreach (var act in toAdd)
                        context.UserAppActivities.Add(act);

                    var term = context.Terminals.Find(target.Id);
                    if (term != null)
                    {
                        if (!string.IsNullOrEmpty(activeUser)) term.LastUserName = activeUser;
                        term.LastActivityTime = DateTime.UtcNow;
                        term.LastError = null;
                        term.Status = "UP"; // Successfully connected via WMI
                    }
                }
                
                await context.SaveChangesAsync(stoppingToken);
            }, stoppingToken).WaitAsync(TimeSpan.FromSeconds(45), stoppingToken);

        }

        private async Task PollLocalActivityAsync(UserActivityTarget target, AppDbContext context, CancellationToken stoppingToken)
        {
            var processes = System.Diagnostics.Process.GetProcesses();
            var seenApps  = new HashSet<string>();
            var activeUser = Environment.UserName;

            // Get the REAL foreground window info
            IntPtr fgWindow = GetForegroundWindow();
            uint fgProcessId = 0;
            string fgTitle = "";
            if (fgWindow != IntPtr.Zero)
            {
                GetWindowThreadProcessId(fgWindow, out fgProcessId);
                var sb = new System.Text.StringBuilder(256);
                if (GetWindowText(fgWindow, sb, 256) > 0)
                {
                    fgTitle = sb.ToString();
                }
            }

            if (!_lastCpuTimes.ContainsKey(target.PcName))
                _lastCpuTimes[target.PcName] = new Dictionary<string, ulong>();

            var pcCpuCache = _lastCpuTimes[target.PcName];
            var toAdd = new List<UserAppActivity>();

            foreach (var p in processes)
            {
                try
                {
                    if (p.SessionId == 0) continue;
                    string name = p.ProcessName + ".exe";
                    if (IsSystemProcess(name)) continue;

                    if (!seenApps.Contains(name))
                    {
                        string title = (p.Id == (int)fgProcessId) ? fgTitle : p.MainWindowTitle;
                        
                        // Optimize: Only log if it has a title OR it's the foreground process
                        if (string.IsNullOrWhiteSpace(title) && p.Id != (int)fgProcessId && name.ToLower() != "lockapp.exe" && name.ToLower() != "logonui.exe") continue;

                        ulong totalTime = (ulong)p.TotalProcessorTime.TotalMilliseconds;
                        bool isActive = false;
                        
                        // Foreground process is ALWAYS active
                        if (p.Id == (int)fgProcessId) 
                        {
                            isActive = true;
                        }
                        else if (pcCpuCache.TryGetValue(name, out ulong lastTotalTime))
                        {
                            if (totalTime > lastTotalTime + 20) isActive = true; // Even lower threshold for better sensitivity
                        }
                        pcCpuCache[name] = totalTime;

                        toAdd.Add(new UserAppActivity
                        {
                            PcName          = target.PcName,
                            UserName        = activeUser,
                            AppName         = name,
                            WindowTitle     = title,
                            Timestamp       = DateTime.UtcNow,
                            DurationSeconds = PollingIntervalMs / 1000,
                            IsActive        = isActive
                        });
                        seenApps.Add(name);
                    }
                }
                catch
                {
                    // Skip inaccessible processes
                }
            }

            lock (context)
            {
                context.UserAppActivities.AddRange(toAdd);

                // --- CANLI DURUM GÜNCELLEMESİ (TERMINALS) --- //
                var term = context.Terminals.Find(target.Id);
                if (term != null)
                {
                    term.LastUserName = activeUser;
                    if (toAdd.Any(a => a.IsActive))
                    {
                        term.LastActivityTime = DateTime.UtcNow;
                    }
                }
            }
            await context.SaveChangesAsync(stoppingToken);
        }

        private bool IsSystemProcess(string name)
        {
            if (string.IsNullOrEmpty(name)) return true;
            string n = name.Trim().ToLowerInvariant();
            return n.StartsWith("explorer") || n.StartsWith("svchost") || n == "conhost.exe" ||
                   n == "runtimebroker.exe" || n == "taskhostw.exe" || n == "ctfmon.exe" ||
                   n == "searchhost.exe" || n == "searchindexer.exe" || n == "dwm.exe" ||
                   n == "lsass.exe" || n == "services.exe" || n == "winlogon.exe" || n.Contains("logonui") ||
                   n == "fontdrvhost.exe" || n == "sihost.exe" || n == "smartscreen.exe" ||
                   n == "iscsiagent.exe" || n == "tvnserver.exe" || n == "igfxemn.exe" ||
                   n == "searchapp.exe" || n == "textinputhost.exe" || n == "rtkauduservice64.exe" ||
                   n == "securityhealthsystray.exe" || n == "spoolsv.exe" || n == "csrss.exe" ||
                   n == "smss.exe" || n == "system.exe" || n == "idle.exe" || n == "wlanext.exe" ||
                   n == "igfxhk.exe" || n == "applicationframehost.exe" || n == "audiodg.exe" ||
                   n == "wmiapsrv.exe" || n.Contains("whatsapp.root.exe") || n.Contains("eset") ||
                   n.StartsWith("vbox") || n.StartsWith("vmware") || 
                   n == "systemsettings.exe" || n == "backgroundtaskhost.exe" ||
                   n == "filecoauth.exe" || n.Contains("lockapp") || n == "video.ui.exe" ||
                   n == "datamnsrv.exe" || n == "dllhost.exe" || n == "wmiprvse.exe" ||
                   n == "taskmgr.exe" || n == "startmenuexperiencehost.exe" ||
                   n == "shellexperiencehost.exe" || n.Contains("logi") || n.Contains("onedrive") ||
                   n.Contains("dropbox") || n.Contains("googlecrash") || n.Contains("update") ||
                   n == "wininit.exe" || n == "taskeng.exe" || n == "wscntfy.exe" || n == "searchui.exe" ||
                   n.Contains("uninst") || n.Contains("aw-watcher") || n.Contains("aw-server") ||
                   n.Contains("language_server") || n.Contains("sldprocmon") || n.Contains("localservicecontrol") ||
                   n.Contains("lenovo") || n.Contains("adobe") || n.Contains("intel") || n.Contains("nvidia") ||
                   n.Contains("cui") || n.Contains("graphics") || n.Contains("audio") ||
                   n.Contains("esrv") || n.Contains("conisio") || n.Contains("aceventsync") ||
                   n.Contains("daemon") || n.Contains("service") || n.Contains("host.exe");
        }
    }
}

