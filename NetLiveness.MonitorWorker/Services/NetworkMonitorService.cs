using System.Net.NetworkInformation;
using System.Management;
using Microsoft.EntityFrameworkCore;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;
using Renci.SshNet;

namespace NetLiveness.Api.Services
{
    public class NetworkMonitorService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<NetworkMonitorService> _logger;

        // Maksimum eş zamanlı WMI/SSH bağlantı sayısını sınırlar (thread pool tükenmesini önler)
        private readonly SemaphoreSlim _healthCheckSemaphore = new SemaphoreSlim(5, 5);

        public NetworkMonitorService(IServiceScopeFactory scopeFactory, ILogger<NetworkMonitorService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Network Monitor Service started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                int delayMs = 5000;
                try
                {
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                        var settings = await context.Settings.FirstOrDefaultAsync(stoppingToken);
                        if (settings != null && settings.PingIntervalMs > 0)
                        {
                            delayMs = settings.PingIntervalMs;
                        }

                        var terminals = await context.Terminals.Where(t => t.Maintenance != true).ToListAsync(stoppingToken);
                        var pingTasks = terminals.Select(t => PingTerminalAsync(t, context, settings, stoppingToken)).ToArray();

                        await Task.WhenAll(pingTasks);
                        await context.SaveChangesAsync(stoppingToken);
                    }
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurring while pinging terminals.");
                }

                try
                {
                    await Task.Delay(delayMs, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }

        private async Task PingTerminalAsync(Terminal t, AppDbContext context, AppSettings settings, CancellationToken stoppingToken)
        {
            try
            {
                using var p = new Ping();
                var reply = await p.SendPingAsync(t.Host, 2000);

                t.LastCheck = DateTime.Now;
                string oldStatus = t.Status;

                if (reply.Status == IPStatus.Success)
                {
                    if (t.Status != "Error") t.Status = "UP";
                    t.RttMs = reply.RoundtripTime;

                    // Sunucu ise WMI ile sağlık kontrolü
                    if (t.DeviceType == "Sunucu")
                    {
                        await _healthCheckSemaphore.WaitAsync(stoppingToken);
                        try
                        {
                            if (t.SkipWmi == true)
                            {
                                t.LastError = "Sadece Ping Atılıyor";
                                ResetHealthFields(t);
                            }
                            else
                            {
                                await UpdateServerHealthAsync(t, settings, stoppingToken);
                            }
                        }
                        finally
                        {
                            _healthCheckSemaphore.Release();
                        }
                    }
                    // ESXI ise SSH ile sağlık kontrolü
                    else if (t.DeviceType == "ESXI")
                    {
                        await _healthCheckSemaphore.WaitAsync(stoppingToken);
                        try
                        {
                            if (t.SkipWmi == true)
                            {
                                t.LastError = "Sağlık Taraması Kapalı";
                                ResetHealthFields(t);
                            }
                            else
                            {
                                await UpdateEsxiHealthAsync(t, settings, stoppingToken);
                            }
                        }
                        finally
                        {
                            _healthCheckSemaphore.Release();
                        }
                    }
                }
                else
                {
                    t.Status = "DOWN";
                    t.RttMs = 0;
                }

                if (oldStatus != t.Status && oldStatus != "UNK")
                {
                    context.Logs.Add(new AuditLogEntry
                    {
                        Action = "STATE_CHANGE",
                        Details = $"Terminal '{t.Name}' ({t.Host}) state changed to {t.Status}",
                        Operator = "System"
                    });
                }
            }
            catch (OperationCanceledException)
            {
                // Servis durduruluyor, normal
            }
            catch
            {
                t.Status = "DOWN";
                t.RttMs = 0;
                t.LastCheck = DateTime.Now;
            }
        }

        private async Task UpdateServerHealthAsync(Terminal t, AppSettings settings, CancellationToken ct)
        {
            try
            {
                var options = new ConnectionOptions();

                string user = !string.IsNullOrEmpty(t.Username) ? t.Username : settings.WmiUser;
                string pass = !string.IsNullOrEmpty(t.Password) ? t.Password : settings.WmiPass;

                bool isLocal = string.Equals(t.Host, "localhost", StringComparison.OrdinalIgnoreCase) ||
                               string.Equals(t.Host, "127.0.0.1") ||
                               string.Equals(t.Host, ".") ||
                               string.Equals(t.Host, Environment.MachineName, StringComparison.OrdinalIgnoreCase);

                if (!string.IsNullOrEmpty(user) && !isLocal)
                {
                    options.Username = user;
                    options.Password = pass;
                    if (!string.IsNullOrEmpty(settings.WmiDomain))
                        options.Authority = "ntlmdomain:" + settings.WmiDomain;
                }

                options.Timeout = TimeSpan.FromSeconds(45);

                var scope = new ManagementScope($@"\\{(isLocal ? "." : t.Host)}\root\cimv2", options);

                // WMI Connect: Wait synchronously for scope.Connect (handled by native options.Timeout)
                await Task.Run(() => scope.Connect(), ct);

                if (!scope.IsConnected)
                    throw new Exception("WMI Scope bağlanamadı.");

                // WMI sorguları (blocking IO) — Task.Run içinde çalıştır
                await Task.Run(() =>
                {
                    // 1. Disk
                    var diskQuery = new ObjectQuery("SELECT Size, FreeSpace FROM Win32_LogicalDisk WHERE DeviceID = 'C:'");
                    using (var searcher = new ManagementObjectSearcher(scope, diskQuery))
                    {
                        searcher.Options.Timeout = TimeSpan.FromSeconds(15);
                        foreach (ManagementObject disk in searcher.Get())
                        {
                            t.DiskSizeGb = Math.Round(Convert.ToDouble(disk["Size"]) / (1024 * 1024 * 1024), 1);
                            t.DiskFreeGb = Math.Round(Convert.ToDouble(disk["FreeSpace"]) / (1024 * 1024 * 1024), 1);
                        }
                    }

                    // 2. CPU
                    var cpuQuery = new ObjectQuery("SELECT LoadPercentage FROM Win32_Processor");
                    using (var searcher = new ManagementObjectSearcher(scope, cpuQuery))
                    {
                        searcher.Options.Timeout = TimeSpan.FromSeconds(15);
                        foreach (ManagementObject cpu in searcher.Get())
                        {
                            t.CpuUsage = Convert.ToInt32(cpu["LoadPercentage"]);
                        }
                    }

                    // 3. RAM
                    var osQuery = new ObjectQuery("SELECT FreePhysicalMemory, TotalVisibleMemorySize FROM Win32_OperatingSystem");
                    using (var searcher = new ManagementObjectSearcher(scope, osQuery))
                    {
                        searcher.Options.Timeout = TimeSpan.FromSeconds(15);
                        foreach (ManagementObject os in searcher.Get())
                        {
                            double totalRam = Convert.ToDouble(os["TotalVisibleMemorySize"]);
                            double freeRam  = Convert.ToDouble(os["FreePhysicalMemory"]);
                            t.RamUsage = (int)((totalRam - freeRam) / totalRam * 100);
                        }
                    }
                }, ct);

                t.LastError = null;
            }
            catch (TimeoutException)
            {
                _logger.LogWarning($"WMI timed out for {t.Host}");
                t.LastError = "WMI: Zaman aşımı";
                ResetHealthFields(t);
            }
            catch (OperationCanceledException)
            {
                // Servis durduruluyor
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"WMI Connection failed for {t.Host}: {ex.Message}");
                t.LastError = "WMI Error: " + ex.Message;
                ResetHealthFields(t);
            }
        }

        private async Task UpdateEsxiHealthAsync(Terminal t, AppSettings settings, CancellationToken ct)
        {
            string user = !string.IsNullOrEmpty(t.Username) ? t.Username : settings.WmiUser;
            string pass = !string.IsNullOrEmpty(t.Password) ? t.Password : settings.WmiPass;

            if (string.IsNullOrEmpty(user) || string.IsNullOrEmpty(pass))
            {
                _logger.LogWarning($"Skipping ESXi health check for {t.Host}: No credentials provided.");
                return;
            }

            try
            {
                await Task.Run(async () =>
                {
                    var authMethods = new List<AuthenticationMethod>();
                    authMethods.Add(new PasswordAuthenticationMethod(user, pass));

                    var keyboardInteractive = new KeyboardInteractiveAuthenticationMethod(user);
                    keyboardInteractive.AuthenticationPrompt += (sender, e) =>
                    {
                        foreach (var prompt in e.Prompts)
                        {
                            if (prompt.Request.IndexOf("password", StringComparison.InvariantCultureIgnoreCase) != -1)
                                prompt.Response = pass;
                        }
                    };
                    authMethods.Add(keyboardInteractive);

                    var connInfo = new Renci.SshNet.ConnectionInfo(t.Host, 22, user, authMethods.ToArray())
                    {
                        Timeout = TimeSpan.FromSeconds(45) // SSH bağlantı timeout
                    };

                    using var client = new SshClient(connInfo);
                    client.Connect(); // connInfo.Timeout sayesinde artık 10 sn'de kesilir

                    // 1. CPU & RAM
                    var summaryCmd = client.CreateCommand("vim-cmd hostsvc/hostsummary | grep -E 'cpuUsage|memoryUsage|totalMemory|hz'");
                    summaryCmd.CommandTimeout = TimeSpan.FromSeconds(45);
                    var summaryOutput = summaryCmd.Execute();

                    _logger.LogDebug($"ESXi Summary Output for {t.Host}: {summaryOutput}");

                    long cpuUsageMhz  = ParseVimValue(summaryOutput, "cpuUsage");
                    long totalCpuHz   = ParseVimValue(summaryOutput, "hz");
                    long memUsageBytes = ParseVimValue(summaryOutput, "memoryUsage");
                    long totalMemBytes = ParseVimValue(summaryOutput, "totalMemory");

                    if (totalCpuHz  > 0) t.CpuUsage = (int)((cpuUsageMhz  * 1000000.0) / totalCpuHz  * 100);
                    if (totalMemBytes > 0) t.RamUsage = (int)((double)memUsageBytes / totalMemBytes * 100);

                    // 2. Disk
                    var diskCmd = client.CreateCommand("df -m | grep /vmfs/volumes/");
                    diskCmd.CommandTimeout = TimeSpan.FromSeconds(45);
                    var diskOutput = diskCmd.Execute();

                    _logger.LogDebug($"ESXi Disk Output for {t.Host}: {diskOutput}");

                    var diskLines = diskOutput.Split('\n', StringSplitOptions.RemoveEmptyEntries);
                    foreach (var line in diskLines)
                    {
                        var parts = line.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                        if (parts.Length >= 4 && parts[parts.Length - 1].StartsWith("/vmfs/volumes/"))
                        {
                            if (double.TryParse(parts[1], out double totalMb) && double.TryParse(parts[3], out double freeMb))
                            {
                                if (totalMb > 5000)
                                {
                                    t.DiskSizeGb = Math.Round(totalMb / 1024, 1);
                                    t.DiskFreeGb = Math.Round(freeMb  / 1024, 1);
                                    break;
                                }
                            }
                        }
                    }

                    t.LastError = null;
                    client.Disconnect();
                }, ct);
            }
            catch (TimeoutException)
            {
                _logger.LogWarning($"SSH timed out for ESXi {t.Host}");
                t.LastError = "SSH: Zaman aşımı";
                ResetHealthFields(t);
            }
            catch (OperationCanceledException)
            {
                // Servis durduruluyor
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"SSH Connection failed for ESXi {t.Host}: {ex.Message}");
                t.LastError = "SSH Error: " + ex.Message;
                ResetHealthFields(t);
            }
        }

        private void ResetHealthFields(Terminal t)
        {
            t.DiskSizeGb = 0;
            t.DiskFreeGb = 0;
            t.CpuUsage   = 0;
            t.RamUsage   = 0;
        }

        private long ParseVimValue(string output, string key)
        {
            var match = System.Text.RegularExpressions.Regex.Match(output, key + @"\s*=\s*(\d+)");
            if (!match.Success)
                match = System.Text.RegularExpressions.Regex.Match(output, key + @"\)\s*(\d+)");

            if (match.Success && long.TryParse(match.Groups[1].Value, out long val))
                return val;

            return 0;
        }
    }
}

